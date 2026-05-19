import { useEffect, useState } from "react";

import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ImageNotSupported as ImageNotSupportedIcon,
} from "@mui/icons-material";
import { Avatar, Box } from "@mui/material";

import { IconButton } from "../buttons";
import { SecondaryFont } from "../fonts";
import styles from "./ProductImageCarousel.module.scss";

/**
 * Image data structure for the carousel
 */
export interface CarouselImage {
  url: string;
  label?: string;
}

/**
 * Image field to label mapping for products
 * Used to convert product image URLs to CarouselImage format
 */
export const PRODUCT_IMAGE_FIELDS: Array<{ field: string; label: string }> = [
  { field: "mainImageUrl", label: "Main" },
  { field: "topImageUrl", label: "Top" },
  { field: "bottomImageUrl", label: "Bottom" },
  { field: "frontImageUrl", label: "Front" },
  { field: "backImageUrl", label: "Back" },
  { field: "rightImageUrl", label: "Right" },
  { field: "leftImageUrl", label: "Left" },
  { field: "detailsImageUrl", label: "Details" },
  { field: "defectImageUrl", label: "Defect" },
  { field: "additionalImage1Url", label: "Additional 1" },
  { field: "additionalImage2Url", label: "Additional 2" },
  { field: "additionalImage3Url", label: "Additional 3" },
];

/**
 * Utility function to build CarouselImage array from a product object
 * Extracts all image URLs and adds appropriate labels
 *
 * @param product - Product object with image URL fields
 * @returns Array of CarouselImage objects for use with ProductImageCarousel
 *
 * @example
 * const images = buildProductImages(product);
 * <ProductImageCarousel images={images} variant="grid" size={150} />
 */
export const buildProductImages = (product: unknown): CarouselImage[] => {
  const productImages: CarouselImage[] = [];
  const productAny = product as Record<string, unknown>;
  const seenUrls = new Set<string>();

  PRODUCT_IMAGE_FIELDS.forEach(({ field, label }) => {
    const url = productAny[field];
    if (
      url &&
      typeof url === "string" &&
      url.trim() !== "" &&
      !seenUrls.has(url)
    ) {
      seenUrls.add(url);
      productImages.push({ url, label });
    }
  });

  // Handle legacy images array format
  if (productAny.images && Array.isArray(productAny.images)) {
    productAny.images.forEach((img: unknown, imgIdx: number) => {
      if (typeof img === "string" && !seenUrls.has(img)) {
        seenUrls.add(img);
        productImages.push({ url: img, label: `Image ${imgIdx + 1}` });
      } else if (
        typeof img === "object" &&
        img !== null &&
        "url" in img &&
        typeof img.url === "string" &&
        !seenUrls.has(img.url)
      ) {
        seenUrls.add(img.url);
        productImages.push({
          url: img.url,
          label:
            "label" in img && typeof img.label === "string"
              ? img.label
              : `Image ${imgIdx + 1}`,
        });
      }
    });
  }

  return productImages;
};

/**
 * Carousel variant determines the layout and behavior
 * - mini: Compact carousel for list items (fixed size, counter below, nav buttons)
 * - full: Full-size carousel with thumbnail strip for modals
 * - grid: Carousel for data grids (shows arrows on hover, dots for navigation)
 */
export type CarouselVariant = "mini" | "full" | "grid";

/**
 * Props for the unified ProductImageCarousel component
 */
export interface ProductImageCarouselProps {
  /** Array of images to display */
  images?: CarouselImage[];
  /** Carousel variant - determines layout and behavior */
  variant?: CarouselVariant;
  /** Size in pixels (for mini and grid variants) */
  size?: number;
  /** Fallback letter to show when no images (for grid variant) */
  fallbackLetter?: string;
  /** Custom class name for the container */
  className?: string;
}

/**
 * Unified Product Image Carousel Component
 *
 * A flexible image carousel that adapts to different use cases through the variant prop.
 *
 * Variants:
 * - **mini**: Compact carousel for list items
 *   - Fixed size (default 72px)
 *   - Navigation arrows always visible (outside image)
 *   - Image counter below ("1/5")
 *   - Slide transition animations
 *   - Image preloading
 *
 * - **full**: Full-size carousel for modals and detail views
 *   - Responsive size
 *   - Thumbnail strip below main image
 *   - Navigation arrows on sides
 *   - Image counter overlay
 *
 * - **grid**: Carousel for data grid cells
 *   - Fixed size (default 150px)
 *   - Navigation arrows show on hover only
 *   - Dot indicators for navigation
 *   - Avatar fallback when no images
 *
 * Common Features:
 * - Circular navigation (wraps at ends)
 * - Error handling with fallback placeholder
 * - Event bubbling prevention (stopPropagation)
 * - Accessible with keyboard navigation
 *
 * @example
 * // Mini variant for list items
 * <ProductImageCarousel images={product.images} variant="mini" size={72} />
 *
 * @example
 * // Full variant for modals
 * <ProductImageCarousel images={product.images} variant="full" />
 *
 * @example
 * // Grid variant for data grids
 * <ProductImageCarousel images={product.images} variant="grid" size={150} fallbackLetter="P" />
 */
const ProductImageCarousel = ({
  images,
  variant = "mini",
  size = variant === "grid" ? 150 : 72,
  fallbackLetter = "P",
  className = "",
}: ProductImageCarouselProps): JSX.Element => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  // Filter out empty/invalid images
  const validImages = (images ?? []).filter((img) => img.url);
  const hasMultipleImages = validImages.length > 1;

  /**
   * Preload all images for instant transitions (mini and full variants)
   */
  useEffect(() => {
    if (variant !== "grid" && validImages.length > 0) {
      validImages.forEach((img) => {
        const imageElement = new Image();
        imageElement.src = img.url;
      });
    }
  }, [validImages, variant]);

  // Reset index if images change and current index is out of bounds
  useEffect(() => {
    if (currentIndex >= validImages.length) {
      setCurrentIndex(0);
    }
  }, [validImages.length, currentIndex]);

  /**
   * Navigate to previous image with circular wrapping
   */
  const handlePrev = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (hasMultipleImages && direction === null) {
      if (variant === "mini") {
        setDirection("left");
        setTimeout(() => setDirection(null), 300);
      } else if (variant === "grid") {
        setDirection("left");
        setTimeout(() => setDirection(null), 200);
      }
      setCurrentIndex((prev) =>
        prev === 0 ? validImages.length - 1 : prev - 1
      );
    }
  };

  /**
   * Navigate to next image with circular wrapping
   */
  const handleNext = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (hasMultipleImages && direction === null) {
      if (variant === "mini") {
        setDirection("right");
        setTimeout(() => setDirection(null), 300);
      } else if (variant === "grid") {
        setDirection("right");
        setTimeout(() => setDirection(null), 200);
      }
      setCurrentIndex((prev) =>
        prev === validImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  /**
   * Jump to specific image by index
   */
  const handleDotClick = (index: number, e: React.MouseEvent): void => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  // ============================================================================
  // EMPTY STATE
  // ============================================================================

  if (validImages.length === 0) {
    if (variant === "grid") {
      return (
        <Avatar
          variant="square"
          sx={{ width: size, height: size }}
          className={className}
        >
          {fallbackLetter}
        </Avatar>
      );
    }

    return (
      <Box
        className={`${styles["carousel__empty"]} ${
          styles[`carousel__empty--${variant}`]
        } ${className}`}
        style={{ width: size, height: size }}
      >
        <ImageNotSupportedIcon
          color="disabled"
          style={{ fontSize: variant === "mini" ? size * 0.5 : undefined }}
        />
        {variant === "full" && <SecondaryFont>No images</SecondaryFont>}
      </Box>
    );
  }

  const currentImage = validImages[currentIndex];

  // ============================================================================
  // MINI VARIANT
  // ============================================================================

  if (variant === "mini") {
    return (
      <Box
        className={`${styles["carousel--mini"]} ${className}`}
        style={
          {
            width: size,
            height: "auto",
            "--image-size": `${size}px`,
          } as React.CSSProperties
        }
      >
        <Box
          className={styles["carousel--mini__image-container"]}
          style={{ width: size, height: size }}
        >
          <Box className={styles["carousel--mini__image-wrapper"]}>
            <Box
              component="img"
              src={currentImage.url}
              alt={currentImage.label || `Product image ${currentIndex + 1}`}
              className={`${styles["carousel--mini__image"]} ${
                direction
                  ? styles[`carousel--mini__image--slide-${direction}`]
                  : ""
              }`}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="10">No Image</text></svg>';
              }}
            />
          </Box>
          {hasMultipleImages && (
            <>
              <IconButton
                onClick={handlePrev}
                size="small"
                disabled={direction !== null}
                className={`${styles["carousel--mini__nav-button"]} ${styles["carousel--mini__nav-button--prev"]}`}
              >
                <ChevronLeftIcon
                  className={styles["carousel--mini__nav-icon"]}
                />
              </IconButton>
              <IconButton
                onClick={handleNext}
                size="small"
                disabled={direction !== null}
                className={`${styles["carousel--mini__nav-button"]} ${styles["carousel--mini__nav-button--next"]}`}
              >
                <ChevronRightIcon
                  className={styles["carousel--mini__nav-icon"]}
                />
              </IconButton>
            </>
          )}
        </Box>

        {/* Counter and Label */}
        <Box className={styles["carousel--mini__info"]}>
          {hasMultipleImages && (
            <Box className={styles["carousel__counter"]}>
              {currentIndex + 1}/{validImages.length}
            </Box>
          )}
          {currentImage.label && (
            <Box className={styles["carousel__label"]}>
              {currentImage.label}
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  // ============================================================================
  // FULL VARIANT
  // ============================================================================

  if (variant === "full") {
    return (
      <Box className={`${styles["carousel--full"]} ${className}`}>
        {/* Main Image with Navigation */}
        <Box className={styles["carousel--full__main"]}>
          <IconButton
            onClick={handlePrev}
            size="small"
            disabled={!hasMultipleImages}
            className={`${styles["carousel--full__nav"]} ${
              styles["carousel--full__nav--left"]
            } ${
              !hasMultipleImages ? styles["carousel--full__nav--disabled"] : ""
            }`}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>

          <Box className={styles["carousel--full__image-wrapper"]}>
            <Box
              component="img"
              src={currentImage.url}
              alt={currentImage.label || `Product image ${currentIndex + 1}`}
              className={styles["carousel--full__image"]}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="12">No Image</text></svg>';
              }}
            />
          </Box>

          <IconButton
            onClick={handleNext}
            size="small"
            disabled={!hasMultipleImages}
            className={`${styles["carousel--full__nav"]} ${
              styles["carousel--full__nav--right"]
            } ${
              !hasMultipleImages ? styles["carousel--full__nav--disabled"] : ""
            }`}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Image Counter and Label */}
        <Box className={styles["carousel--full__info"]}>
          {hasMultipleImages && (
            <Box className={styles["carousel__counter"]}>
              {currentIndex + 1}/{validImages.length}
            </Box>
          )}
          {currentImage.label && (
            <Box className={styles["carousel__label"]}>
              {currentImage.label}
            </Box>
          )}
        </Box>

        {/* Thumbnail Strip */}
        <Box className={styles["carousel--full__thumbnails"]}>
          {validImages.map((img, idx) => (
            <Box
              key={idx}
              onClick={(e) => handleDotClick(idx, e)}
              className={`${styles["carousel--full__thumbnail"]} ${
                idx === currentIndex
                  ? styles["carousel--full__thumbnail--active"]
                  : ""
              }`}
            >
              <Box
                component="img"
                src={img.url}
                alt={img.label || `Thumbnail ${idx + 1}`}
                className={styles["carousel--full__thumbnail-image"]}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect fill="%23f0f0f0" width="36" height="36"/></svg>';
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  // ============================================================================
  // GRID VARIANT
  // ============================================================================

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: size,
        flexShrink: 0,
        p: 0,
        m: 0,
        gap: 0,
      }}
      className={className}
    >
      {/* Image Container with overlaid controls */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: size,
          aspectRatio: "1/1",
          borderRadius: 1,
          p: 0,
          m: 0,
          mb: 0,
          perspective: "1000px",
        }}
      >
        <Avatar
          variant="square"
          src={currentImage.url}
          sx={{
            width: "100%",
            height: "100%",
            transition:
              "transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.4s",
            transform:
              direction === "left"
                ? "rotateY(-90deg)"
                : direction === "right"
                ? "rotateY(90deg)"
                : "rotateY(0deg)",
            transformOrigin: "center",
            backfaceVisibility: "hidden",
            opacity: direction ? 0 : 1,
          }}
        >
          {fallbackLetter}
        </Avatar>

        {/* Left Arrow - overlaid on image */}
        {hasMultipleImages && (
          <IconButton
            data-test-id="product-grid-carousel-prev"
            onClick={handlePrev}
            size="small"
            sx={{
              position: "absolute",
              left: 4,
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: "rgba(0,0,0,0.6) !important",
              color: "white !important",
              width: 26,
              height: 26,
              minWidth: 26,
              p: 0,
              "&:hover": { backgroundColor: "rgba(0,0,0,0.8) !important" },
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}

        {/* Right Arrow - overlaid on image */}
        {hasMultipleImages && (
          <IconButton
            data-test-id="product-grid-carousel-next"
            onClick={handleNext}
            size="small"
            sx={{
              position: "absolute",
              right: 4,
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: "rgba(0,0,0,0.6) !important",
              color: "white !important",
              width: 26,
              height: 26,
              minWidth: 26,
              p: 0,
              "&:hover": { backgroundColor: "rgba(0,0,0,0.8) !important" },
            }}
          >
            <ChevronRightIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}

        {/* Dots at bottom inside image */}
        {hasMultipleImages && (
          <Box
            sx={{
              position: "absolute",
              bottom: 4,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "3px",
              backgroundColor: "rgba(0,0,0,0.5)",
              padding: "3px 6px",
              borderRadius: 1.5,
            }}
          >
            {validImages.map((_, idx) => (
              <Box
                key={idx}
                component="span"
                onClick={(e) => handleDotClick(idx, e)}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor:
                    idx === currentIndex ? "#1976d2" : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor:
                      idx === currentIndex
                        ? "#1976d2"
                        : "rgba(255,255,255,0.8)",
                  },
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Label below */}
      <Box
        data-test-id="product-grid-carousel-label"
        sx={{
          mt: 0,
          mb: 0,
          pt: 1,
          pb: 0,
          fontSize: "0.7rem",
          fontWeight: 500,
          color: "#333",
          textTransform: "capitalize",
          lineHeight: 1,
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: "100%",
        }}
      >
        {currentImage.label || "Image"}
      </Box>
    </Box>
  );
};

export default ProductImageCarousel;
