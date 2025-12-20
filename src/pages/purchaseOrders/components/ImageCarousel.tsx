import { useState } from 'react'

import { Box } from '@mui/material'

import {
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    ImageNotSupported as ImageNotSupportedIcon,
} from '@mui/icons-material'

import { IconButton } from '../../../components/buttons'
import { SecondaryFont } from '../../../components/fonts'
import { type ImageCarouselProps } from '../../../models'
import styles from '../../../styles/PurchaseOrders.module.scss'

/**
 * Image Carousel Component
 *
 * Displays a product image carousel with:
 * - Main image display area with navigation arrows
 * - Thumbnail strip below for quick navigation
 * - Image counter badge showing current position
 * - Circular navigation (wraps around at ends)
 * - Error handling for broken image URLs
 *
 * Features:
 * - Left/Right arrow buttons for navigation (always visible, disabled when single image)
 * - Clickable thumbnails for direct image selection
 * - Visual indicator of current image (active thumbnail styling)
 * - Fallback placeholder when images fail to load
 * - Prevents event bubbling (stopPropagation) to avoid triggering parent click handlers
 *
 * Use Cases:
 * - Product picker modal (full-size carousel)
 * - Product detail views
 * - Any component needing image browsing functionality
 *
 * @param {ImageCarouselProps} props - Component props
 * @returns {JSX.Element} Rendered image carousel
 */
const ImageCarousel = ({ images }: ImageCarouselProps): JSX.Element => {
  // State: Track which image is currently displayed (0-indexed)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Early return: Show empty state if no images provided
  if (!images || images.length === 0) {
    return (
      <Box className={styles['product-picker__image-empty']}>
        <ImageNotSupportedIcon color="disabled" className={styles['product-picker__image-empty-icon']} />
        <SecondaryFont>No images</SecondaryFont>
      </Box>
    )
  }

  // Determine if we have multiple images (affects navigation visibility)
  const hasMultipleImages = images.length > 1

  /**
   * Handles previous image navigation.
   *
   * Implements circular navigation: when at first image (index 0),
   * wraps around to last image (images.length - 1).
   *
   * @param {React.MouseEvent} e - Click event
   */
  const handlePrev = (e: React.MouseEvent): void => {
    // Prevent event bubbling to avoid triggering parent click handlers
    // (e.g., if carousel is inside a clickable card)
    e.stopPropagation()
    if (hasMultipleImages) {
      // Circular navigation: if at start, go to end
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    }
  }

  /**
   * Handles next image navigation.
   *
   * Implements circular navigation: when at last image,
   * wraps around to first image (index 0).
   *
   * @param {React.MouseEvent} e - Click event
   */
  const handleNext = (e: React.MouseEvent): void => {
    // Prevent event bubbling to avoid triggering parent click handlers
    e.stopPropagation()
    if (hasMultipleImages) {
      // Circular navigation: if at end, go to start
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }
  }

  return (
    <Box className={styles['product-picker__image-carousel-container']}>
      {/* Main Image with Navigation */}
      <Box className={styles['product-picker__image-carousel-main']}>
        {/* Left Arrow - Always visible */}
        <IconButton
          onClick={handlePrev}
          size="small"
          disabled={!hasMultipleImages}
          className={`${styles['product-picker__image-carousel-nav']} ${styles['product-picker__image-carousel-nav--left']} ${!hasMultipleImages ? styles['product-picker__image-carousel-nav--disabled'] : ''}`}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>

        {/* Image */}
        <Box className={styles['product-picker__image-carousel-image-wrapper']}>
          <Box
            component="img"
            src={images[currentIndex].url}
            alt={images[currentIndex].label || `Product image ${currentIndex + 1}`}
            className={styles['product-picker__image-carousel-image']}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="12">No Image</text></svg>'
            }}
          />
        </Box>

        {/* Right Arrow - Always visible */}
        <IconButton
          onClick={handleNext}
          size="small"
          disabled={!hasMultipleImages}
          className={`${styles['product-picker__image-carousel-nav']} ${styles['product-picker__image-carousel-nav--right']} ${!hasMultipleImages ? styles['product-picker__image-carousel-nav--disabled'] : ''}`}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>

        {/* Image Counter Badge */}
        <Box className={styles['product-picker__image-carousel-counter']}>
          {currentIndex + 1} / {images.length}
        </Box>
      </Box>

      {/* Thumbnail Strip */}
      <Box className={styles['product-picker__image-carousel-thumbnails']}>
        {images.map((img, idx) => (
          <Box
            key={idx}
            onClick={(e) => {
              e.stopPropagation()
              setCurrentIndex(idx)
            }}
            className={`${styles['product-picker__image-carousel-thumbnail']} ${idx === currentIndex ? styles['product-picker__image-carousel-thumbnail--active'] : ''}`}
          >
            <Box
              component="img"
              src={img.url}
              alt={img.label || `Thumbnail ${idx + 1}`}
              className={styles['product-picker__image-carousel-thumbnail-image']}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect fill="%23f0f0f0" width="36" height="36"/></svg>'
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default ImageCarousel
