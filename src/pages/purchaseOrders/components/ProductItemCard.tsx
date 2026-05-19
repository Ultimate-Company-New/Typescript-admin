import { useState, useEffect, useRef } from 'react'

import { Box, Card, CardContent, Chip, Collapse, Grid, InputAdornment, Tooltip } from '@mui/material'

import {
    Close as CloseIcon,
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
    LocationOn as LocationIcon
} from '@mui/icons-material'

import { IconButton } from '../../../components/buttons'
import { ProductImageCarousel } from '../../../components/carousel'
import { TextFieldInput } from '../../../components/form-input'
import { BodyText, SecondaryFont, Subheader } from '../../../components/fonts'
import { type ProductItemsSectionProps, type PurchaseOrderProductItemForm } from '../../../models'
import styles from '../../../styles/PurchaseOrders.module.scss'

import ProductDetailsExpanded from './ProductDetailsExpanded'

/**
 * Props for ProductItemCard component
 *
 * @property {PurchaseOrderProductItemForm} item - The product item to display.
 *   Contains all product information, allocations, and financial data.
 * @property {boolean} isExpanded - Whether the card is currently expanded to show details.
 *   Affects visual styling and icon display.
 * @property {boolean} isView - Whether the component is in view-only mode.
 *   Hides the remove button when true.
 * @property {boolean} disabled - Whether actions should be disabled.
 *   Prevents removal when true.
 * @property {onToggleExpand} onToggleExpand - Callback invoked when expand/collapse button is clicked.
 * @property {onRemove} onRemove - Callback invoked when remove button is clicked.
 *   Removes the product from the order.
 * @property {onUpdateProduct} onUpdateProduct - Callback invoked when quantity or price is updated.
 *   Updates the product item with new quantity and/or price.
 * @property {ProductItemsSectionProps['shippingAllocations']} shippingAllocations - Shipping allocations
 *   with courier information for each pickup location.
 */
interface ProductItemCardProps {
  item: PurchaseOrderProductItemForm
  isExpanded: boolean
  isView: boolean
  disabled: boolean
  onToggleExpand: () => void
  onRemove: () => void
  onUpdateProduct?: (productId: number, quantity: number, pricePerUnit: number) => void
  shippingAllocations?: ProductItemsSectionProps['shippingAllocations']
}

/**
 * Product Item Card Component
 *
 * Displays a product item in the purchase order product list. Shows product information,
 * quick stats, and action buttons in a compact card format.
 *
 * Features:
 * - Product image carousel (mini version)
 * - Product title and ID
 * - Quick stats (quantity, unit price, product total)
 * - Expand/collapse button to show details
 * - Remove button (hidden in view mode)
 * - Quick info chips (locations, packages, discount)
 *
 * Layout:
 * - Left: Image carousel + product title/ID
 * - Center: Quick stats (quantity, price, total)
 * - Right: Action buttons (expand, remove)
 * - Bottom: Info chips (locations, packages, discount)
 *
 * Calculations:
 * - Total Packages: Sums up all packages across all pickup locations
 *   Calculated by iterating through allocations and their packaging estimates
 *
 * Visual States:
 * - Expanded: Card has expanded styling, shows collapse icon
 * - Collapsed: Normal styling, shows expand icon
 * - View Mode: Remove button hidden
 * - Disabled: Remove button disabled
 *
 * Use Cases:
 * - Product items section (main product list)
 * - Purchase order form (product display)
 *
 * @param {ProductItemCardProps} props - Component props
 * @returns {JSX.Element} Rendered product item card
 */
const ProductItemCard = ({
  item,
  isExpanded,
  isView,
  disabled,
  onToggleExpand,
  onRemove,
  onUpdateProduct,
  shippingAllocations = [],
}: ProductItemCardProps): JSX.Element => {
  // Quantity state: Numeric value and string input (for controlled input)
  const [quantity, setQuantity] = useState(item.quantity)
  const [, setQuantityInput] = useState(item.quantity.toString())

  // Price state: Numeric value
  const [pricePerUnit, setPricePerUnit] = useState(item.pricePerUnit)

  // Track if we're updating from user input to prevent useEffect from resetting
  const isUserInputRef = useRef(false)

  // Sync state when item changes from external source (not user input)
  useEffect(() => {
    // Skip sync if the change came from user input
    if (isUserInputRef.current) {
      isUserInputRef.current = false
      return
    }

    // Only update if values actually changed
    if (item.quantity !== quantity) {
      setQuantity(item.quantity)
      setQuantityInput(item.quantity.toString())
    }
    if (item.pricePerUnit !== pricePerUnit) {
      setPricePerUnit(item.pricePerUnit)
    }
  }, [item.quantity, item.pricePerUnit])

  /**
   * Calculate minimum price based on discount type.
   *
   * For fixed discounts, the minimum price is the discount amount itself.
   * This ensures the final price (after discount) doesn't go below 0.
   *
   * Example: If discount is ₹50 fixed, minimum price must be ₹50.
   * Final price = ₹50 - ₹50 = ₹0 (minimum allowed).
   *
   * For percentage discounts, there's no minimum (can be any price).
   */
  const minPrice = item.discount && !item.isDiscountPercent ? item.discount : 0

  /**
   * Get total available stock for this product.
   * Stock information might be available from the product data or allocations.
   * Check multiple possible locations where stock data might be stored.
   */
  const totalAvailableStock =
    (item as any).totalAvailableStock ??
    (item as any).product?.totalAvailableStock ??
    null


  /**
   * Validation states for form fields.
   *
   * These are used to show error states and helper text.
   */
  // Quantity validation: Check if exceeds available stock (only if stock data available)
  const isQuantityInvalid = totalAvailableStock !== null && totalAvailableStock !== undefined && quantity > (totalAvailableStock ?? 0)

  // Price validation: Check if below minimum required price
  const isPriceTooLow = pricePerUnit < minPrice

  /**
   * Handle quantity input change (while typing).
   *
   * Updates both the string input (for controlled input) and numeric quantity.
   * Only updates quantity if parsed value is > 0 (prevents invalid states).
   * Also updates the product immediately to reflect changes in order summary.
   *
   * @param {string} value - The new input value from the text field
   */
  const handleQuantityInputChange = (value: string): void => {
    // TextFieldInput with formatNumber provides numeric value (without commas) in e.target.value
    // Remove any commas just in case and parse as integer
    const parsed = parseInt(value.replace(/,/g, '')) || 0
    // Only update quantity if valid (> 0)
    if (parsed > 0) {
      setQuantity(parsed)
      setQuantityInput(parsed.toString())
      // Update product immediately to reflect changes in order summary in real-time
      if (parsed !== item.quantity && onUpdateProduct) {
        isUserInputRef.current = true // Mark as user input to prevent useEffect reset
        onUpdateProduct(item.productId, parsed, pricePerUnit)
      }
    }
  }

  /**
   * Handle quantity input blur (when user leaves the field).
   *
   * Validates and clamps the quantity value:
   * - Minimum: 1 (cannot order 0 or negative)
   *
   * Why clamp on blur?
   * - Allows user to type freely while editing
   * - Validates when they're done (better UX)
   */
  const handleQuantityBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
    // TextFieldInput with formatNumber provides numeric value (without commas) in e.target.value
    // Remove any commas just in case and parse as integer
    const parsed = parseInt(e.target.value.replace(/,/g, '')) || 0
    // Clamp to minimum 1
    const validQty = Math.max(1, parsed)
    setQuantity(validQty)
    setQuantityInput(validQty.toString())

    // Update product if quantity changed
    if (validQty !== item.quantity && onUpdateProduct) {
      isUserInputRef.current = true // Mark as user input to prevent useEffect reset
      onUpdateProduct(item.productId, validQty, pricePerUnit)
    }
  }

  /**
   * Handle price input change (while typing).
   *
   * TextFieldInput handles formatting automatically, so we just need to update the numeric value.
   * Also updates the product immediately to reflect changes in order summary in real-time.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event
   */
  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    // TextFieldInput with formatNumber provides numeric value (without commas) in e.target.value
    const parsed = parseFloat(e.target.value.replace(/,/g, '')) || 0
    // Only update if non-negative
    if (parsed >= 0) {
      setPricePerUnit(parsed)
      // Update product immediately on change to reflect changes in order summary in real-time
      if (parsed !== item.pricePerUnit && onUpdateProduct) {
        isUserInputRef.current = true // Mark as user input to prevent useEffect reset
        onUpdateProduct(item.productId, quantity, parsed)
      }
    }
  }

  /**
   * Handle price input blur (when user leaves the field).
   *
   * Validates and clamps the price to minimum allowed price.
   * Ensures price meets minimum requirement (for fixed discounts).
   *
   * Why clamp on blur?
   * - Allows user to type freely while editing
   * - Validates when they're done (better UX)
   */
  const handlePriceBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
    // TextFieldInput with formatNumber provides numeric value (without commas) in e.target.value
    const parsed = parseFloat(e.target.value.replace(/,/g, '')) || 0
    // Clamp to minimum price (for fixed discounts)
    const validPrice = Math.max(minPrice, parsed)
    setPricePerUnit(validPrice)

    // Update product if price changed
    if (validPrice !== item.pricePerUnit && onUpdateProduct) {
      isUserInputRef.current = true // Mark as user input to prevent useEffect reset
      onUpdateProduct(item.productId, quantity, validPrice)
    }
  }

  /**
   * Calculate total number of packages across all pickup locations.
   *
   * Iterates through all pickup allocations and sums up the quantityUsed
   * from each package in the packagingEstimate array.
   *
   * Why calculate this?
   * - Shows user how many packages are needed for this product
   * - Displayed as a quick info chip
   * - Helps understand packaging complexity
   *
   * @returns {number} Total number of packages needed for this product
   */
  // Calculate product total (quantity * pricePerUnit)
  const productTotal = quantity * pricePerUnit

  return (
    <Card
      variant="outlined"
      className={`${styles['product-items-section__product-card']} ${isExpanded ? styles['product-items-section__product-card--expanded'] : ''}`}
    >
      <CardContent className={styles['product-items-section__product-card-content']}>
        {/* Product Title and ID Header */}
        <Box className={styles['product-items-section__product-header']}>
          {/* Product Title - Top Left */}
          <Subheader variant="subtitle1" label={item.productTitle} className={styles['product-items-section__product-title']} />

          {/* Product ID and Location Chips - Top Right */}
          <Box className={styles['product-items-section__header-chips']}>
            {item.pickupAllocations && item.pickupAllocations.length > 0 && (
              <Chip
                icon={<LocationIcon />}
                label={`${item.pickupAllocations.length} location${item.pickupAllocations.length > 1 ? 's' : ''}`}
                size="small"
                color="info"
                variant="outlined"
                className={styles['product-items-section__header-chip']}
              />
            )}
            <SecondaryFont variant="caption" className={styles['product-items-section__product-id']}>
              ID: {item.productId}
            </SecondaryFont>
          </Box>
        </Box>

        {/* Desktop Layout */}
        <Box className={styles['product-items-section__desktop-layout']}>
          <Grid container spacing={2} alignItems="center" className={styles['product-items-section__product-grid']}>
            {/* Product Info with Image Carousel */}
            <Grid item xs={12} md={3}>
              <Box className={styles['product-items-section__product-info']}>
                <ProductImageCarousel images={item.images} variant="grid" size={140} fallbackLetter={item.title?.[0] ?? 'P'} />
                <Box className={styles['product-items-section__product-details']}>
                  {/* Product Info - Brand, UPC, Model */}
                  <Box className={styles['product-items-section__product-meta']}>
                    {(item as any).brand && (
                      <SecondaryFont variant="caption" className={styles['product-items-section__meta-item']}>
                        <strong>Brand:</strong> {(item as any).brand}
                      </SecondaryFont>
                    )}
                    {(item as any).upc && (
                      <SecondaryFont variant="caption" className={styles['product-items-section__meta-item']}>
                        <strong>UPC:</strong> {(item as any).upc}
                      </SecondaryFont>
                    )}
                    {(item as any).model && (
                      <SecondaryFont variant="caption" className={styles['product-items-section__meta-item']}>
                        <strong>Model:</strong> {(item as any).model}
                      </SecondaryFont>
                    )}
                    {(item as any).weightKgs && (
                      <SecondaryFont variant="caption" className={styles['product-items-section__meta-item']}>
                        <strong>Weight:</strong> {(item as any).weightKgs} kg
                      </SecondaryFont>
                    )}
                  </Box>

                  {/* Discount Chip - Inline with product details */}
                  <Box className={styles['product-items-section__chips-container']}>
                    {item.totalDiscount != null && item.totalDiscount > 0 && (
                      <Chip
                        label={`Discount: ₹${item.totalDiscount.toLocaleString('en-IN')}`}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Quick Stats */}
            <Grid item xs={6} md={2} className={styles['product-items-section__quantity-grid']}>
              <Box className={styles['product-items-section__stat-box']}>
                <SecondaryFont variant="caption" className={styles['product-items-section__stat-label']}>
                  Quantity
                </SecondaryFont>
                {isView || !onUpdateProduct ? (
                  <Subheader
                    variant="h6"
                    label={String(item.quantity)}
                    className={`${styles['product-items-section__stat-value']} ${styles['product-items-section__stat-value--blue']}`}
                    color={undefined}
                  />
                ) : (
                  <Box className={styles['product-items-section__input-wrapper']}>
                    <TextFieldInput
                      type="number"
                      formatNumber={true}
                      value={quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuantityInputChange(e.target.value)}
                      onBlur={handleQuantityBlur}
                      disabled={false}
                      size="small"
                      margin="dense"
                      inputProps={{ min: 1, max: totalAvailableStock ?? undefined }}
                      helperText={
                        totalAvailableStock !== null && totalAvailableStock !== undefined
                          ? totalAvailableStock === 0
                            ? 'Stock data unavailable'
                            : `Max available: ${totalAvailableStock.toLocaleString()}`
                          : ' ' // Empty space to maintain alignment when no helper text
                      }
                      error={isQuantityInvalid}
                      className={styles['product-items-section__quantity-input']}
                      FormHelperTextProps={{
                        className: styles['product-items-section__helper-text'],
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={6} md={2} className={styles['product-items-section__unit-price-grid']}>
              <Box className={styles['product-items-section__stat-box']}>
                <SecondaryFont variant="caption" className={styles['product-items-section__stat-label']}>
                  Unit Price
                </SecondaryFont>
                {isView || !onUpdateProduct ? (
                  <BodyText
                    className={`${styles['product-items-section__stat-value-medium']} ${styles['product-items-section__stat-value-medium--orange']}`}
                  >
                    ₹{item.pricePerUnit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </BodyText>
                ) : (
                  <Box className={styles['product-items-section__input-wrapper']}>
                    <TextFieldInput
                      type="number"
                      formatNumber={true}
                      value={pricePerUnit}
                      onChange={handlePriceInputChange}
                      onBlur={handlePriceBlur}
                      disabled={false}
                      size="small"
                      margin="dense"
                      inputProps={{ min: minPrice, step: 0.01 }}
                      error={isPriceTooLow}
                      helperText={
                        minPrice > 0
                          ? `Min: ₹${minPrice.toLocaleString('en-IN')} (fixed discount)`
                          : ' ' // Empty space to maintain alignment when no helper text
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            ₹
                          </InputAdornment>
                        ),
                      }}
                      className={styles['product-items-section__price-input']}
                      FormHelperTextProps={{
                        className: styles['product-items-section__helper-text'],
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Grid>

            <Grid item xs={6} md="auto" className={styles['product-items-section__product-total-grid']}>
              <Box className={`${styles['product-items-section__stat-box']} ${styles['product-items-section__stat-box--right']}`}>
                <SecondaryFont variant="caption" className={styles['product-items-section__stat-label']}>
                  Product Total
                </SecondaryFont>
                <Subheader
                  variant="h6"
                  label={`₹${productTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  className={`${styles['product-items-section__stat-value-large']} ${styles['product-items-section__stat-value-large--green']}`}
                  color={undefined}
                />
              </Box>
            </Grid>

            {/* Actions */}
            <Grid item xs={6} md="auto" className={`${styles['product-items-section__product-actions']} ${styles['product-items-section__product-actions-grid']}`}>
              <Tooltip title={isExpanded ? 'Hide details' : 'Show details'}>
                <IconButton
                  size="small"
                  onClick={onToggleExpand}
                  color="primary"
                >
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Tooltip>
              {!isView && (
                <Tooltip title="Remove product">
                  <span>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={onRemove}
                      disabled={disabled}
                    >
                      <CloseIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </Grid>
          </Grid>
        </Box>

        {/* Mobile Layout */}
        <Box className={styles['product-items-section__mobile-layout']}>
          {/* Top Header: ID and Location Chip - Right Aligned */}
          <Box className={styles['product-items-section__mobile-header']}>
            <Box className={styles['product-items-section__header-chips']}>
              {item.pickupAllocations && item.pickupAllocations.length > 0 && (
                <Chip
                  icon={<LocationIcon />}
                  label={`${item.pickupAllocations.length} location${item.pickupAllocations.length > 1 ? 's' : ''}`}
                  size="small"
                  color="info"
                  variant="outlined"
                  className={styles['product-items-section__header-chip']}
                />
              )}
              <SecondaryFont variant="caption" className={styles['product-items-section__product-id']}>
                ID: {item.productId}
              </SecondaryFont>
            </Box>
          </Box>

          {/* Product Title - Centered above Image */}
          <Box className={styles['product-items-section__mobile-title']}>
            <Subheader variant="subtitle1" label={item.productTitle} className={styles['product-items-section__product-title']} />
          </Box>

          {/* Image Carousel with Product Details */}
          <Box className={styles['product-items-section__mobile-image']} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ProductImageCarousel images={item.images} variant="grid" size={140} fallbackLetter={item.title?.[0] ?? 'P'} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {(item as any).brand && (
                <SecondaryFont variant="caption">
                  <strong>Brand:</strong> {(item as any).brand}
                </SecondaryFont>
              )}
              {(item as any).upc && (
                <SecondaryFont variant="caption">
                  <strong>UPC:</strong> {(item as any).upc}
                </SecondaryFont>
              )}
              {(item as any).model && (
                <SecondaryFont variant="caption">
                  <strong>Model:</strong> {(item as any).model}
                </SecondaryFont>
              )}
              {(item as any).weightKgs && (
                <SecondaryFont variant="caption">
                  <strong>Weight:</strong> {(item as any).weightKgs} kg
                </SecondaryFont>
              )}
            </Box>
          </Box>

          {/* Divider */}
          <Box className={styles['product-items-section__mobile-divider']} />

          {/* Quantity and Unit Price - Side by Side */}
          <Box className={styles['product-items-section__mobile-price-row']}>
            <Box className={styles['product-items-section__mobile-quantity']}>
              {isView || !onUpdateProduct ? (
                <Box className={styles['product-items-section__mobile-label-input']}>
                  <SecondaryFont variant="caption" className={styles['product-items-section__stat-label']}>
                    Quantity:
                  </SecondaryFont>
                  <Subheader
                    variant="h6"
                    label={String(item.quantity)}
                    className={`${styles['product-items-section__stat-value']} ${styles['product-items-section__stat-value--blue']}`}
                    color={undefined}
                  />
                </Box>
              ) : (
                <Box className={styles['product-items-section__mobile-label-input']}>
                  <SecondaryFont variant="caption" className={styles['product-items-section__stat-label']}>
                    Quantity:
                  </SecondaryFont>
                  <Box className={styles['product-items-section__input-wrapper']}>
                    <TextFieldInput
                      type="number"
                      formatNumber={true}
                      value={quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuantityInputChange(e.target.value)}
                      onBlur={handleQuantityBlur}
                      disabled={false}
                      size="small"
                      margin="dense"
                      inputProps={{ min: 1, max: totalAvailableStock ?? undefined }}
                      helperText={
                        totalAvailableStock !== null && totalAvailableStock !== undefined
                          ? totalAvailableStock === 0
                            ? 'Stock data unavailable'
                            : `Max available: ${totalAvailableStock.toLocaleString()}`
                          : ' ' // Empty space to maintain alignment when no helper text
                      }
                      error={isQuantityInvalid}
                      className={styles['product-items-section__quantity-input']}
                      FormHelperTextProps={{
                        className: styles['product-items-section__helper-text'],
                      }}
                    />
                  </Box>
                </Box>
              )}
            </Box>

            <Box className={styles['product-items-section__mobile-price']}>
              {isView || !onUpdateProduct ? (
                <Box className={styles['product-items-section__mobile-label-input']}>
                  <SecondaryFont variant="caption" className={styles['product-items-section__stat-label']}>
                    Unit Price:
                  </SecondaryFont>
                  <BodyText
                    className={`${styles['product-items-section__stat-value-medium']} ${styles['product-items-section__stat-value-medium--orange']}`}
                  >
                    ₹{item.pricePerUnit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </BodyText>
                </Box>
              ) : (
                <Box className={styles['product-items-section__mobile-label-input']}>
                  <SecondaryFont variant="caption" className={styles['product-items-section__stat-label']}>
                    Unit Price:
                  </SecondaryFont>
                  <Box className={styles['product-items-section__input-wrapper']}>
                    <TextFieldInput
                      type="number"
                      formatNumber={true}
                      value={pricePerUnit}
                      onChange={handlePriceInputChange}
                      onBlur={handlePriceBlur}
                      disabled={false}
                      size="small"
                      margin="dense"
                      inputProps={{ min: minPrice, step: 0.01 }}
                      error={isPriceTooLow}
                      helperText={
                        minPrice > 0
                          ? `Min: ₹${minPrice.toLocaleString('en-IN')} (fixed discount)`
                          : ' ' // Empty space to maintain alignment when no helper text
                      }
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            ₹
                          </InputAdornment>
                        ),
                      }}
                      className={styles['product-items-section__price-input']}
                      FormHelperTextProps={{
                        className: styles['product-items-section__helper-text'],
                      }}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          {/* Product Total */}
          <Box className={styles['product-items-section__mobile-total']}>
            <SecondaryFont variant="caption" className={styles['product-items-section__stat-label']}>
              Product Total
            </SecondaryFont>
            <Subheader
              variant="h6"
              label={`₹${productTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              className={`${styles['product-items-section__stat-value-large']} ${styles['product-items-section__stat-value-large--green']}`}
              color={undefined}
            />
          </Box>

          {/* Actions */}
          <Box className={styles['product-items-section__mobile-actions']}>
            <Tooltip title={isExpanded ? 'Hide details' : 'Show details'}>
              <IconButton
                size="small"
                onClick={onToggleExpand}
                color="primary"
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
            {!isView && (
              <Tooltip title="Remove product">
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={onRemove}
                    disabled={disabled}
                  >
                    <CloseIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Expanded Details - Inside the card, below the main content */}
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box className={styles['product-items-section__expanded-details-wrapper']}>
            <ProductDetailsExpanded item={item} shippingAllocations={shippingAllocations} isView={isView} />
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  )
}

export default ProductItemCard
