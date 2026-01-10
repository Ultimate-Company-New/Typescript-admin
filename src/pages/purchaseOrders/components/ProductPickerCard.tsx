import {
    Add as AddIcon,
    Category as CategoryIcon,
    LocalOffer as LocalOfferIcon,
    Public as PublicIcon,
    Scale as ScaleIcon,
    ShoppingCart as ShoppingCartIcon,
    Straighten as StraightenIcon,
} from '@mui/icons-material'
import {
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    Tooltip,
    Typography,
} from '@mui/material'

import { BlueButton } from '../../../components/buttons'
import { ProductImageCarousel } from '../../../components/carousel'
import { BodyText, SecondaryFont, Subheader } from '../../../components/fonts'
import { getConditionColor, getConditionLabel } from '../../../constants/appConstants'
import { type ProductPickerCardProps } from '../../../models/purchase-order-components/PurchaseOrderComponentModels'
import styles from '../../../styles/PurchaseOrders.module.scss'

/**
 * Product Picker Card Component
 *
 * Displays a product in a card format within the product picker modal.
 * Shows comprehensive product information and allows selection via a button.
 *
 * Features:
 * - Image carousel (reusing ProductImageCarousel component with size 200px)
 * - Product title with tooltip (for long titles)
 * - Product ID and UPC chips
 * - Detailed product information grid:
 *   - Category, Brand, Model
 *   - Condition (with color coding)
 *   - Country of manufacture
 *   - Weight and dimensions
 * - Price display with discount handling:
 *   - Shows original and final price if discounted
 *   - Discount badge (percentage or fixed amount)
 *   - Strikethrough original price when discounted
 * - Select button (disabled if product already added)
 *
 * Price Calculation:
 * - Handles both percentage and fixed discounts
 * - Calculates final price after discount
 * - Ensures final price doesn't go below 0
 *
 * Dimensions Formatting:
 * - Formats dimensions as "length × breadth × height cm"
 * - Only displays if all three dimensions are available
 *
 * Visual States:
 * - Normal: Full card with all features
 * - Disabled: Grayed out, button shows "Already Added"
 * - With Discount: Shows strikethrough original price and discount badge
 *
 * Use Cases:
 * - Product picker modal (product selection)
 * - Product search results
 *
 * @param {ProductPickerCardProps} props - Component props
 * @returns {JSX.Element} Rendered product picker card
 */
const ProductPickerCard = ({ product, onSelect, disabled }: ProductPickerCardProps): JSX.Element => {
  /**
   * Calculates the final price after applying discount.
   *
   * Handles both percentage and fixed discounts:
   * - Percentage: discountAmount = original × discountPercent / 100
   * - Fixed: discountAmount = discount (direct value)
   *
   * Ensures final price never goes below 0 (Math.max protection).
   *
   * @returns {Object | null} Price information object or null if price not available
   *   @property {number} original - Original price before discount
   *   @property {number} final - Final price after discount
   *   @property {boolean} hasDiscount - Whether a discount is applied
   */
  const getFinalPrice = (): { original: number; final: number; hasDiscount: boolean } | null => {
    if (product.price == null) return null
    const original = product.price
    // No discount: return original price
    if (!product.discount || product.discount <= 0) {
      return { original, final: original, hasDiscount: false }
    }
    // Calculate discount amount based on type
    const discountAmount = product.isDiscountPercent
      ? (original * product.discount) / 100 // Percentage discount
      : product.discount // Fixed discount
    // Ensure final price doesn't go below 0
    return { original, final: Math.max(0, original - discountAmount), hasDiscount: true }
  }

  const priceInfo = getFinalPrice()

  /**
   * Formats product dimensions as a readable string.
   *
   * Only formats if all three dimensions (length, breadth, height) are available.
   * Format: "length × breadth × height cm"
   *
   * @returns {string | null} Formatted dimensions string or null if incomplete
   */
  const getDimensions = (): string | null => {
    if (product.length && product.breadth && product.height) {
      return `${product.length} × ${product.breadth} × ${product.height} cm`
    }
    return null
  }

  const dimensions = getDimensions()

  return (
    <Card
      variant="outlined"
      className={`${styles['product-picker__card']} ${disabled ? styles['product-picker__card--disabled'] : ''}`}
    >
      {/* Image Carousel - Using grid variant with 3D flip transition */}
      <Box className={styles['product-picker__image-carousel-wrapper']} sx={{ display: 'flex', justifyContent: 'center' }}>
        <ProductImageCarousel images={product.images} variant="grid" size={200} fallbackLetter={product.title?.[0] ?? 'P'} />
      </Box>

      <CardContent className={styles['product-picker__card-content']}>
        {/* Title */}
        <Tooltip title={product.title} placement="top">
          <Box className={styles['product-picker__card-header']}>
            <ShoppingCartIcon color="primary" fontSize="small" />
            <Subheader
              variant="subtitle2"
              label={product.title}
              className={styles['product-picker__card-title']}
            />
          </Box>
        </Tooltip>

        {/* ID and UPC */}
        <Box className={styles['product-picker__card-chips']}>
          <Chip label={`ID: ${product.productId}`} size="small" variant="outlined" />
          {product.upc && <Chip label={`UPC: ${product.upc}`} size="small" variant="outlined" />}
        </Box>

        <Divider className={`${styles['product-picker__divider']} ${styles['product-picker__divider--spacing']}`} />

        {/* Details Grid */}
        <Box className={styles['product-picker__details-grid']}>
          {/* Category */}
          {product.category && (
            <Box className={styles['product-picker__detail-row']}>
              <CategoryIcon fontSize="small" color="action" />
              <SecondaryFont>Category:</SecondaryFont>
              <BodyText>{product.category}</BodyText>
            </Box>
          )}

          {/* Brand */}
          {product.brand && (
            <Box className={styles['product-picker__detail-row']}>
              <LocalOfferIcon fontSize="small" color="action" />
              <SecondaryFont>Brand:</SecondaryFont>
              <BodyText>{product.brand}</BodyText>
            </Box>
          )}

          {/* Model */}
          {product.model && (
            <Box className={styles['product-picker__detail-row']}>
              <ShoppingCartIcon fontSize="small" color="action" />
              <SecondaryFont>Model:</SecondaryFont>
              <BodyText>{product.model}</BodyText>
            </Box>
          )}

          {/* Condition */}
          {product.condition && (
            <Box className={styles['product-picker__detail-row']}>
              <SecondaryFont>Condition:</SecondaryFont>
              <Chip
                label={getConditionLabel(product.condition)}
                size="small"
                color={getConditionColor(product.condition)}
                className={styles['product-picker__condition-chip']}
              />
            </Box>
          )}

          {/* Country */}
          {product.countryOfManufacture && (
            <Box className={styles['product-picker__detail-row']}>
              <PublicIcon fontSize="small" color="action" />
              <SecondaryFont>Country:</SecondaryFont>
              <BodyText>{product.countryOfManufacture}</BodyText>
            </Box>
          )}

          {/* Weight */}
          {product.weightKgs != null && (
            <Box className={styles['product-picker__detail-row']}>
              <ScaleIcon fontSize="small" color="action" />
              <SecondaryFont>Weight:</SecondaryFont>
              <BodyText>{product.weightKgs} kg</BodyText>
            </Box>
          )}

          {/* Dimensions */}
          {dimensions && (
            <Box className={styles['product-picker__detail-row']}>
              <StraightenIcon fontSize="small" color="action" />
              <SecondaryFont>Dimensions:</SecondaryFont>
              <BodyText>{dimensions}</BodyText>
            </Box>
          )}
        </Box>

        {/* Price Section */}
        {priceInfo && (
          <>
            <Divider className={styles['product-picker__divider']} />
            <Box className={styles['product-picker__price-section']}>
              <LocalOfferIcon color="success" fontSize="small" />
              <Box className={styles['product-picker__price-info']}>
                {priceInfo.hasDiscount ? (
                  <>
                    <Typography
                      variant="body1"
                      className={`${styles['product-picker__price-final']} ${styles['product-picker__price-final--green']}`}
                    >
                      ₹{priceInfo.final.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                    <BodyText variant="body2" className={styles['product-picker__price-original']}>
                      ₹{priceInfo.original.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </BodyText>
                    <Chip
                      label={product.isDiscountPercent ? `${product.discount}% OFF` : `₹${product.discount.toLocaleString('en-IN')} OFF`}
                      size="small"
                      color="error"
                      variant="outlined"
                      className={styles['product-picker__discount-chip']}
                    />
                  </>
                ) : (
                  <Typography
                    variant="body1"
                    className={`${styles['product-picker__price-final']} ${styles['product-picker__price-final--green']}`}
                  >
                    ₹{priceInfo.original.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                )}
              </Box>
            </Box>
          </>
        )}

        {/* Add Button */}
        <Box className={styles['product-picker__add-button-container']}>
          <BlueButton
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<AddIcon />}
            onClick={() => onSelect(product)}
            disabled={disabled}
            size="small"
          >
            {disabled ? 'Already Added' : 'Select Product'}
          </BlueButton>
        </Box>
      </CardContent>
    </Card>
  )
}

export default ProductPickerCard
