import CategoryIcon from '@mui/icons-material/Category'
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
    Tooltip
} from '@mui/material'

import { ProductImageCarousel } from '../../../components/carousel'
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
  pricePerUnit?: number
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
// Product Card Component
// ============================================================================

interface ProductCardProps {
  mapping: ProductMappingItem
}

export const ProductCard = ({ mapping }: ProductCardProps): JSX.Element => {
  const { productId, quantity, pricePerUnit, productDetails } = mapping

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
    <Card
      variant="outlined"
      className={styles['product-mapping-card']}
      data-test-id={`pickup-location-product-card-${productId}`}
    >
      {/* Image Carousel - Using grid variant with 3D flip transition */}
      <Box
        sx={{ p: 1.5, pb: 0, display: 'flex', justifyContent: 'center' }}
        data-test-id={`pickup-location-product-card-image-${productId}`}
      >
        <ProductImageCarousel
          images={productDetails?.images ?? []}
          variant="grid"
          size={180}
          fallbackLetter={productDetails?.title?.[0] ?? 'P'}
        />
      </Box>

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
          {/* Show pricePerUnit only if provided (for purchase orders) */}
          {pricePerUnit != null && (
            <Chip
              label={`Price: ₹${pricePerUnit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              size="small"
              color="success"
              variant="outlined"
            />
          )}
        </Box>

        {productDetails && (
          <>
            <Divider sx={{ my: 1 }} />

            {/* Price Section - Only show for pickup locations (not purchase orders) */}
            {priceInfo && pricePerUnit == null && (
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
