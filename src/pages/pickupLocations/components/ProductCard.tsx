import { useState } from 'react'

import CategoryIcon from '@mui/icons-material/Category'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import ScaleIcon from '@mui/icons-material/Scale'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import StraightenIcon from '@mui/icons-material/Straighten'
import {
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    IconButton,
    Tooltip
} from '@mui/material'

import { BodyText, SecondaryFont } from '../../../components/fonts'
import { getConditionColor, getConditionLabel } from '../../../constants/appConstants'
import styles from '../../../styles/PickupLocations.module.scss'

// ============================================================================
// Types
// ============================================================================

export interface ProductImageInfo {
  url: string
  label: string
}

export interface ProductMappingItem {
  productId: number
  quantity: number
  productDetails?: {
    title?: string
    upc?: string
    brand?: string
    price?: number
    discount?: number
    /** True if discount is a percentage, false if it's a flat amount */
    isDiscountPercent?: boolean
    model?: string
    condition?: string
    countryOfManufacture?: string
    weightKgs?: number
    length?: number
    breadth?: number
    height?: number
    category?: string
    images: ProductImageInfo[]
  }
}

// ============================================================================
// Image Carousel Component
// ============================================================================

interface ImageCarouselProps {
  images: ProductImageInfo[]
}

const ImageCarousel = ({ images }: ImageCarouselProps): JSX.Element => {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <Box className={styles['image-carousel__empty']}>
        <ImageNotSupportedIcon color="disabled" />
        <SecondaryFont>No images</SecondaryFont>
      </Box>
    )
  }

  const handlePrev = (e: React.MouseEvent): void => {
    e.stopPropagation()
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = (e: React.MouseEvent): void => {
    e.stopPropagation()
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const currentImage = images[currentIndex]

  return (
    <Box className={styles['image-carousel']}>
      <Box className={styles['image-carousel__container']}>
        <img
          src={currentImage.url}
          alt={currentImage.label || `Image ${currentIndex + 1}`}
          className={styles['image-carousel__image']}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="12">No Image</text></svg>'
          }}
        />
        {images.length > 1 && (
          <>
            <IconButton
              size="small"
              onClick={handlePrev}
              className={styles['image-carousel__nav-btn']}
              sx={{ left: 4 }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleNext}
              className={styles['image-carousel__nav-btn']}
              sx={{ right: 4 }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Box>
      {images.length > 1 && (
        <Box className={styles['image-carousel__dots']}>
          {images.map((_, idx) => (
            <Box
              key={idx}
              className={`${styles['image-carousel__dot']} ${idx === currentIndex ? styles['image-carousel__dot--active'] : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setCurrentIndex(idx)
              }}
            />
          ))}
        </Box>
      )}
      {currentImage.label && (
        <SecondaryFont className={styles['image-carousel__label']}>
          {currentImage.label}
        </SecondaryFont>
      )}
    </Box>
  )
}

// ============================================================================
// Product Card Component
// ============================================================================

interface ProductCardProps {
  mapping: ProductMappingItem
}

export const ProductCard = ({ mapping }: ProductCardProps): JSX.Element => {
  const { productId, quantity, productDetails } = mapping

  // Calculate final price with discount
  const getFinalPrice = (): { original: number; final: number; hasDiscount: boolean } | null => {
    if (productDetails?.price == null) return null
    const original = productDetails.price
    if (!productDetails.discount || productDetails.discount <= 0) {
      return { original, final: original, hasDiscount: false }
    }
    const discountAmount = productDetails.isDiscountPercent
      ? (original * productDetails.discount) / 100
      : productDetails.discount
    return { original, final: Math.max(0, original - discountAmount), hasDiscount: true }
  }

  const priceInfo = getFinalPrice()

  return (
    <Card variant="outlined" className={styles['product-mapping-card']}>
      {/* Image Carousel */}
      <ImageCarousel images={productDetails?.images ?? []} />

      <CardContent className={styles['product-mapping-card__content']}>
        {/* Title */}
        <Tooltip title={productDetails?.title ?? `Product #${productId}`} placement="top">
          <Box className={styles['product-mapping-card__header']}>
            <ShoppingCartIcon color="primary" fontSize="small" />
            <BodyText className={styles['product-mapping-card__title']}>
              {productDetails?.title ?? `Product #${productId}`}
            </BodyText>
          </Box>
        </Tooltip>

        {/* ID and Quantity Chips */}
        <Box className={styles['product-mapping-card__chips']}>
          <Chip
            label={`ID: ${productId}`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`Qty: ${quantity}`}
            size="small"
            color="primary"
          />
        </Box>

        {productDetails && (
          <>
            <Divider sx={{ my: 1 }} />

            {/* Price Section */}
            {priceInfo && (
              <Box className={styles['product-mapping-card__price-section']}>
                <LocalOfferIcon color="success" fontSize="small" />
                <Box className={styles['product-mapping-card__price-info']}>
                  {priceInfo.hasDiscount ? (
                    <>
                      <BodyText className={styles['product-mapping-card__final-price']}>
                        ₹{priceInfo.final.toLocaleString()}
                      </BodyText>
                      <SecondaryFont className={styles['product-mapping-card__original-price']}>
                        ₹{priceInfo.original.toLocaleString()}
                      </SecondaryFont>
                      <Chip
                        label={productDetails.isDiscountPercent ? `${productDetails.discount}% OFF` : `₹${productDetails.discount} OFF`}
                        size="small"
                        color="error"
                        variant="outlined"
                        sx={{ fontSize: '10px', height: '20px' }}
                      />
                    </>
                  ) : (
                    <BodyText className={styles['product-mapping-card__final-price']}>
                      ₹{priceInfo.original.toLocaleString()}
                    </BodyText>
                  )}
                </Box>
              </Box>
            )}

            {/* Product Details Grid */}
            <Box className={styles['product-mapping-card__details-grid']}>
              {productDetails.brand && (
                <Box className={styles['product-mapping-card__detail-item']}>
                  <SecondaryFont className={styles['product-mapping-card__detail-label']}>Brand</SecondaryFont>
                  <BodyText className={styles['product-mapping-card__detail-value']}>{productDetails.brand}</BodyText>
                </Box>
              )}
              {productDetails.model && (
                <Box className={styles['product-mapping-card__detail-item']}>
                  <SecondaryFont className={styles['product-mapping-card__detail-label']}>Model</SecondaryFont>
                  <BodyText className={styles['product-mapping-card__detail-value']}>{productDetails.model}</BodyText>
                </Box>
              )}
              {productDetails.upc && (
                <Box className={styles['product-mapping-card__detail-item']}>
                  <SecondaryFont className={styles['product-mapping-card__detail-label']}>UPC</SecondaryFont>
                  <BodyText className={styles['product-mapping-card__detail-value']}>{productDetails.upc}</BodyText>
                </Box>
              )}
              {productDetails.condition && (
                <Box className={styles['product-mapping-card__detail-item']}>
                  <SecondaryFont className={styles['product-mapping-card__detail-label']}>Condition</SecondaryFont>
                  <Chip
                    label={getConditionLabel(productDetails.condition)}
                    size="small"
                    color={getConditionColor(productDetails.condition)}
                    sx={{ height: '20px', fontSize: '11px' }}
                  />
                </Box>
              )}
            </Box>

            {/* Category */}
            {productDetails.category && (
              <Box className={styles['product-mapping-card__category']}>
                <CategoryIcon fontSize="small" color="action" />
                <SecondaryFont>{productDetails.category}</SecondaryFont>
              </Box>
            )}

            {/* Dimensions & Weight */}
            {(productDetails.weightKgs != null || (productDetails.length != null && productDetails.breadth != null && productDetails.height != null)) && (
              <Box className={styles['product-mapping-card__specs']}>
                {productDetails.weightKgs != null && (
                  <Tooltip title="Weight">
                    <Chip
                      icon={<ScaleIcon />}
                      label={`${productDetails.weightKgs} kg`}
                      size="small"
                      variant="outlined"
                      sx={{
                        height: '28px',
                        px: 1,
                        '& .MuiChip-icon': { ml: 0.5 },
                        '& .MuiChip-label': { px: 1 },
                      }}
                    />
                  </Tooltip>
                )}
                {productDetails.length != null && productDetails.breadth != null && productDetails.height != null && (
                  <Tooltip title="Dimensions (L×B×H)">
                    <Chip
                      icon={<StraightenIcon />}
                      label={`${productDetails.length}×${productDetails.breadth}×${productDetails.height} cm`}
                      size="small"
                      variant="outlined"
                      sx={{
                        height: '28px',
                        px: 1,
                        '& .MuiChip-icon': { ml: 0.5 },
                        '& .MuiChip-label': { px: 1 },
                      }}
                    />
                  </Tooltip>
                )}
              </Box>
            )}

            {/* Country of Manufacture */}
            {productDetails.countryOfManufacture && (
              <SecondaryFont className={styles['product-mapping-card__country']}>
                Made in {productDetails.countryOfManufacture}
              </SecondaryFont>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default ProductCard
