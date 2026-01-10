import { useCallback, useEffect, useState } from 'react'

import {
  Close as CloseIcon,
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material'
import {
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  Typography
} from '@mui/material'


import { productApi } from '../../../api/productApi'
import { BlueButton, IconButton } from '../../../components/buttons'
import { BodyText, SecondaryFont, Subheader } from '../../../components/fonts'
import { TextFieldInput } from '../../../components/form-input'
import {
  type ProductDetails,
  type ProductImageInfoLocal,
  type ProductPickerModalProps,
  type ProductResponseItem,
  type SimpleQuantityPriceDialogProps,
} from '../../../models'
import { type PurchaseOrderProductItem } from '../../../models/api-models'
import styles from '../../../styles/PurchaseOrders.module.scss'

import ProductGrid from './ProductGrid'
import ProductSearchBar from './ProductSearchBar'

// ============================================================================
// Simple Quantity/Price Dialog Component
// ============================================================================

/**
 * Simple Quantity/Price Dialog Component
 *
 * A dialog that appears when a product is selected from the picker, allowing
 * the user to specify quantity and price per unit before adding to the order.
 *
 * Features:
 * - Quantity input with stock validation
 * - Price per unit input with minimum price validation
 * - Stock availability display
 * - Product information summary
 * - Validation warnings (exceeds stock, price too low)
 * - Subtotal calculation display
 *
 * Validation:
 * - Quantity: Must be > 0, cannot exceed available stock
 * - Price: Must be >= minimum price (fixed discount requires minimum)
 * - Stock: Fetched from API and displayed
 *
 * Note: Pickup allocations are calculated at order level via shipping optimization,
 * not at product selection time. This dialog only collects quantity and price.
 *
 * @param {SimpleQuantityPriceDialogProps} props - Component props
 * @returns {JSX.Element} Rendered dialog
 */
const SimpleQuantityPriceDialog = ({
  open,
  onClose,
  onConfirm,
  product,
}: SimpleQuantityPriceDialogProps): JSX.Element => {
  // Quantity state: Numeric value and string input (for controlled input)
  const [quantity, setQuantity] = useState(1)
  const [quantityInput, setQuantityInput] = useState('1')

  // Price state: Numeric value (TextFieldInput handles formatting automatically)
  const [pricePerUnit, setPricePerUnit] = useState(0)

  /**
   * Initialize dialog state when it opens with a product.
   *
   * This effect runs when:
   * - Dialog opens (open becomes true)
   * - Product changes
   *
   * It performs:
   * 1. Resets quantity to 1
   * 2. Calculates default price (with discount applied)
   * 3. Uses pre-fetched stock availability (no additional API call)
   *
   * Price Calculation:
   * - Percentage discount: finalPrice = originalPrice - (originalPrice × discountPercent / 100)
   * - Fixed discount: finalPrice = originalPrice - discountAmount (min 0)
   * - No discount: finalPrice = originalPrice
   */
  useEffect(() => {
    if (open && product) {
      // Reset quantity to default
      setQuantity(1)
      setQuantityInput('1')

      /**
       * Calculate default price with discount applied.
       *
       * The product may have a discount (percentage or fixed).
       * We apply it here to show the user the discounted price as default.
       */
      const defaultPrice = product.price ?? 0
      let finalPrice = defaultPrice
      if (product.discount && product.isDiscountPercent) {
        // Percentage discount: subtract percentage from original
        finalPrice = defaultPrice - (defaultPrice * product.discount) / 100
      } else if (product.discount) {
        // Fixed discount: subtract fixed amount (ensure >= 0)
        finalPrice = Math.max(0, defaultPrice - product.discount)
      }
      setPricePerUnit(finalPrice)

      /**
       * Use pre-fetched stock availability from product data.
       * Stock was fetched during search, so no additional API call needed.
       */
      // Stock is already available in product.totalAvailableStock
    }
  }, [product, open])

  /**
   * Handle quantity input change (while typing).
   *
   * Updates both the string input (for controlled input) and numeric quantity.
   * Only updates quantity if parsed value is > 0 (prevents invalid states).
   *
   * Why separate string and number state?
   * - String state allows user to type freely (including empty, "0", etc.)
   * - Number state stores the actual value for calculations
   * - Provides better UX (user can clear field, type new number)
   *
   * @param {string} value - The new input value from the text field
   */
  const handleQuantityInputChange = (value: string): void => {
    setQuantityInput(value)
    const parsed = parseInt(value) || 0
    // Only update quantity if valid (> 0)
    if (parsed > 0) {
      setQuantity(parsed)
    }
  }

  /**
   * Handle quantity input blur (when user leaves the field).
   *
   * Validates and clamps the quantity value:
   * - Minimum: 1 (cannot order 0 or negative)
   * - Maximum: product.totalAvailableStock (if stock data available) or current value
   *
   * Why clamp on blur instead of onChange?
   * - Allows user to type freely while editing
   * - Validates when they're done (better UX)
   * - Prevents frustrating input restrictions while typing
   */
  const handleQuantityBlur = (): void => {
    const parsed = parseInt(quantityInput) || 0
    // Clamp between 1 and max available (or parsed if stock not loaded)
    const maxQty = product?.totalAvailableStock ?? parsed
    const validQty = Math.max(1, Math.min(parsed, maxQty))
    setQuantity(validQty)
    setQuantityInput(validQty.toString())
  }

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
  const minPrice = product?.discount && !product.isDiscountPercent ? product.discount : 0

  /**
   * Handle price input change (while typing).
   *
   * TextFieldInput handles formatting automatically, so we just need to update the numeric value.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The change event
   */
  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const parsed = parseFloat(e.target.value) || 0
    // Only update if non-negative
    if (parsed >= 0) {
      setPricePerUnit(parsed)
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
    const parsed = parseFloat(e.target.value) || 0
    // Clamp to minimum price (for fixed discounts)
    const validPrice = Math.max(minPrice, parsed)
    setPricePerUnit(validPrice)
  }

  /**
   * Validation states for form fields.
   *
   * These are used to show error states and disable confirm button.
   */
  // Quantity validation: Check if exceeds available stock (only if stock data available)
  const isQuantityInvalid = product?.totalAvailableStock !== null && product?.totalAvailableStock !== undefined && quantity > (product.totalAvailableStock ?? 0)

  // Price validation: Check if below minimum required price
  const isPriceTooLow = pricePerUnit < minPrice

  /**
   * Handle confirmation of quantity and price.
   *
   * Called when user clicks "Add to Order" button.
   * Validates quantity > 0 before calling parent callback.
   *
   * Closes this quantity/price dialog first, then calls parent callback
   * which will add the product and close the main modal.
   */
  const handleConfirm = (): void => {
    if (quantity > 0) {
      // Close this dialog first
      onClose()
      // Then call parent callback to add product and close main modal
      onConfirm(quantity, pricePerUnit)
    }
  }

  /**
   * Calculate subtotal for display.
   *
   * Shows user the total cost before adding to order.
   * Formula: quantity × pricePerUnit
   */
  const subtotal = quantity * pricePerUnit

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: styles['product-picker__dialog-paper']
      }}
    >
      <DialogTitle className={styles['product-picker__dialog-title-container']}>
        <Box className={styles['product-picker__dialog-title']}>
          <Box className={styles['product-picker__dialog-title-left']}>
            <ShoppingCartIcon color="primary" />
            <Subheader variant="h6" label="Add to Purchase Order" />
          </Box>
          <IconButton onClick={onClose} size="small" className={styles['product-picker__dialog-close-button']}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent className={styles['product-picker__dialog-content-container']}>
        {product && (
          <Box className={styles['product-picker__dialog-content']}>
            <Subheader variant="subtitle1" label={product.title} className={styles['product-picker__dialog-product-title']} />

            {/* Product Info Summary */}
            <Box className={styles['product-picker__dialog-info-summary']}>
              <Grid container spacing={1}>
                {product.brand && (
                  <Grid item xs={6}>
                    <SecondaryFont variant="caption">Brand</SecondaryFont>
                    <BodyText variant="body2">{product.brand}</BodyText>
                  </Grid>
                )}
                {product.model && (
                  <Grid item xs={6}>
                    <SecondaryFont variant="caption">Model</SecondaryFont>
                    <BodyText variant="body2">{product.model}</BodyText>
                  </Grid>
                )}
                {product.weightKgs != null && (
                  <Grid item xs={6}>
                    <SecondaryFont variant="caption">Weight</SecondaryFont>
                    <BodyText variant="body2">{product.weightKgs} kg</BodyText>
                  </Grid>
                )}
                {product.length && product.breadth && product.height && (
                  <Grid item xs={6}>
                    <SecondaryFont variant="caption">Dimensions</SecondaryFont>
                    <BodyText variant="body2">{product.length} × {product.breadth} × {product.height} cm</BodyText>
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* Quantity and Price Inputs */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextFieldInput
                  label="Quantity"
                  type="number"
                  fullWidth
                  value={quantityInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuantityInputChange(e.target.value)}
                  onBlur={handleQuantityBlur}
                  inputProps={{ min: 1, max: product?.totalAvailableStock ?? undefined }}
                  helperText={
                    product?.totalAvailableStock !== null && product?.totalAvailableStock !== undefined
                      ? product.totalAvailableStock === 0
                        ? 'Stock data unavailable (ProductPickupLocationMapping table not found)'
                        : `Max available: ${product.totalAvailableStock.toLocaleString()}`
                      : undefined
                  }
                  error={product?.totalAvailableStock !== null && product?.totalAvailableStock !== undefined && quantity > (product.totalAvailableStock ?? 0)}

                />
              </Grid>
              <Grid item xs={6}>
                <TextFieldInput
                  label="Price per Unit"
                  type="number"
                  fullWidth
                  value={pricePerUnit}
                  onChange={handlePriceInputChange}
                  onBlur={handlePriceBlur}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        ₹
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ min: minPrice, step: 0.01 }}
                  helperText={
                    minPrice > 0
                      ? `Min: ₹${minPrice.toLocaleString('en-IN')} (fixed discount)`
                      : undefined
                  }
                  error={isPriceTooLow}
                />
              </Grid>
            </Grid>

            {/* Subtotal Display */}
            <Box className={styles['product-picker__dialog-subtotal']}>
              <Typography variant="subtitle1" className={styles['product-picker__dialog-subtotal-label']}>
                Subtotal:
              </Typography>
              <Typography variant="body1" className={styles['product-picker__dialog-subtotal-value']}>
                ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>

            {/* Stock Warning */}
            {isQuantityInvalid && (
              <Box className={styles['product-picker__dialog-warning']}>
                <SecondaryFont variant="caption" className={styles['product-picker__dialog-warning-text']}>
                  ⚠️ Requested quantity ({quantity}) exceeds available stock ({product?.totalAvailableStock ?? 0}). The order may not be fulfillable.
                </SecondaryFont>
              </Box>
            )}

            {/* Price Warning */}
            {isPriceTooLow && (
              <Box className={styles['product-picker__dialog-warning']}>
                <SecondaryFont variant="caption" className={styles['product-picker__dialog-warning-text']}>
                  ⚠️ Price (₹{pricePerUnit.toLocaleString('en-IN')}) is below the minimum (₹{minPrice.toLocaleString('en-IN')}). Fixed discount requires minimum price of ₹{minPrice.toLocaleString('en-IN')}/unit.
                </SecondaryFont>
              </Box>
            )}

            {/* Info Note */}
            <Box className={styles['product-picker__dialog-info']}>
              <SecondaryFont variant="caption" className={styles['product-picker__dialog-info-text']}>
                📦 Packaging, 🚚 Shipping, and 📋 Tax will be calculated after all products are added using the "Calculate Optimal Shipping" button.
              </SecondaryFont>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions className={styles['product-picker__dialog-actions-container']}>
        <BlueButton
          variant="contained"
          onClick={handleConfirm}
          disabled={quantity <= 0 || isQuantityInvalid || isPriceTooLow}
        >
          Add to Order
        </BlueButton>
      </DialogActions>
    </Dialog>
  )
}

// ============================================================================
// Main Product Picker Modal
// ============================================================================

const ProductPickerModal = ({
  open,
  onClose,
  onProductSelect,
  excludeProductIds = [],
}: ProductPickerModalProps): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<ProductDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // For quantity/price dialog
  const [selectedProduct, setSelectedProduct] = useState<ProductDetails | null>(null)
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false)

  /**
   * Search for products using the product API.
   *
   * Performs a multi-field search across:
   * - Title (product name)
   * - UPC (Universal Product Code)
   * - Brand
   * - Model
   *
   * Uses OR logic, meaning a product matches if ANY field contains the search query.
   * This provides flexible searching - users can search by any product attribute.
   *
   * Process:
   * 1. Validates search query (minimum 2 characters)
   * 2. Sets loading state
   * 3. Calls API with search filters
   * 4. Maps API response to ProductDetails format
   * 5. Collects all product images into images array
   * 6. Updates products state
   *
   * Image Collection:
   * - Collects all available image URLs from API response
   * - Labels each image appropriately (Main, Top, Bottom, etc.)
   * - Only includes non-empty URLs
   *
   * Error Handling:
   * - On error, sets products to empty array (shows "No products found")
   * - Always resets loading state
   *
   * @returns {Promise<void>} Promise that resolves when search completes
   */
  const handleSearch = useCallback(async () => {
    // Validate: Require at least 2 characters to prevent too-broad searches
    if (!searchQuery || searchQuery.length < 2) {
      return
    }

    setLoading(true)
    setHasSearched(true) // Mark that a search has been attempted (for empty state display)

    try {
      /**
       * Call product API with search filters.
       *
       * Uses OR logic operator so products match if ANY field contains the query.
       * Fetches up to 50 products per search.
       */
      const response = await productApi.getProductsInBatches({
        start: 0,
        end: 50,
        pageSize: 50,
        includeDeleted: false,
        logicOperator: 'OR', // Match if ANY filter matches
        filters: [
          { column: 'title', operator: 'contains', value: searchQuery },
          { column: 'upc', operator: 'contains', value: searchQuery },
          { column: 'brand', operator: 'contains', value: searchQuery },
          { column: 'model', operator: 'contains', value: searchQuery },
        ],
      })

      /**
       * Map API response to ProductDetails format.
       *
       * The API returns ProductResponseItem format, but we need ProductDetails
       * format for the picker. This mapping:
       * - Extracts product ID (handles nested product object)
       * - Collects all images into labeled array
       * - Maps all product fields
       * - Handles optional fields with fallbacks
       */
      const mappedProducts: ProductDetails[] = (response.data as ProductResponseItem[]).map((p) => {
        /**
         * Collect all available image URLs from the API response.
         *
         * The API provides multiple image fields. We collect all non-empty
         * URLs and label them appropriately for the ProductImageCarousel component.
         */
        const images: ProductImageInfoLocal[] = []
        if (p.mainImageUrl) images.push({ url: p.mainImageUrl, label: 'Main' })
        if (p.topImageUrl) images.push({ url: p.topImageUrl, label: 'Top' })
        if (p.bottomImageUrl) images.push({ url: p.bottomImageUrl, label: 'Bottom' })
        if (p.frontImageUrl) images.push({ url: p.frontImageUrl, label: 'Front' })
        if (p.backImageUrl) images.push({ url: p.backImageUrl, label: 'Back' })
        if (p.rightImageUrl) images.push({ url: p.rightImageUrl, label: 'Right' })
        if (p.leftImageUrl) images.push({ url: p.leftImageUrl, label: 'Left' })
        if (p.detailsImageUrl) images.push({ url: p.detailsImageUrl, label: 'Details' })
        if (p.defectImageUrl) images.push({ url: p.defectImageUrl, label: 'Defect' })
        if (p.additionalImage1Url) images.push({ url: p.additionalImage1Url, label: 'Additional 1' })
        if (p.additionalImage2Url) images.push({ url: p.additionalImage2Url, label: 'Additional 2' })
        if (p.additionalImage3Url) images.push({ url: p.additionalImage3Url, label: 'Additional 3' })

        // Map to ProductDetails format with fallbacks for optional fields
        return {
          productId: p.productId ?? p.product?.productId ?? 0, // Handle nested product object
          title: p.title ?? '',
          upc: p.upc,
          brand: p.brand,
          price: p.price,
          discount: p.discount,
          isDiscountPercent: p.isDiscountPercent ?? p.discountPercent, // Handle different field names
          model: p.model,
          condition: p.condition,
          countryOfManufacture: p.countryOfManufacture,
          weightKgs: p.weightKgs,
          length: p.length,
          breadth: p.breadth,
          height: p.height,
          category: p.category?.categoryName ?? p.categoryName, // Handle nested category object
          images,
          totalAvailableStock: null, // Will be populated below
        }
      })

      /**
       * Fetch stock for all products in parallel.
       * This avoids additional database calls when selecting a product.
       */
      const stockPromises = mappedProducts.map(async (product) => {
        try {
          const stockData = await productApi.getProductStockAtLocationsByProductId(product.productId)
          const total = stockData.reduce((sum, loc) => {
            const stock = loc.availableStock ?? 0
            return sum + stock
          }, 0)
          return { productId: product.productId, totalAvailableStock: total }
        } catch (error) {
          return { productId: product.productId, totalAvailableStock: null }
        }
      })

      // Wait for all stock requests to complete
      const stockResults = await Promise.all(stockPromises)

      // Map stock results back to products
      const stockMap = new Map(stockResults.map(r => [r.productId, r.totalAvailableStock]))
      const productsWithStock = mappedProducts.map(product => ({
        ...product,
        totalAvailableStock: stockMap.get(product.productId) ?? null,
      }))

      setProducts(productsWithStock)
    } catch {
      // On error, show empty state (no products found)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  /**
   * Handles product selection from the grid.
   *
   * When a product card is clicked, this function:
   * 1. Stores the selected product
   * 2. Opens the quantity/price dialog
   *
   * The dialog will allow user to specify quantity and price before adding to order.
   *
   * @param {ProductDetails} product - The product that was selected
   */
  const handleProductSelect = (product: ProductDetails): void => {
    setSelectedProduct(product)
    setQuantityDialogOpen(true)
  }

  /**
   * Handles confirmation of quantity and price from the dialog.
   *
   * This function is called when user confirms quantity/price in SimpleQuantityPriceDialog.
   * It creates a PurchaseOrderProductItemForm object and passes it to the parent component.
   *
   * Important Notes:
   * - Pickup allocations are empty at this stage (will be calculated via shipping optimization)
   * - Packaging and shipping fees are 0 (calculated later)
   * - Total discount is 0 (calculated at order level)
   * - Grand total is just subtotal for now (will be recalculated)
   *
   * Type Casting:
   * - Form uses PurchaseOrderProductItemForm internally (extended structure)
   * - Callback expects PurchaseOrderProductItem (API format)
   * - We cast to bridge the type difference
   *
   * After confirmation:
   * - Closes quantity dialog
   * - Clears selected product
   * - Closes picker modal
   *
   * @param {number} quantity - Quantity of product to add
   * @param {number} pricePerUnit - Price per unit for this product
   */
  const handleConfirmQuantityPrice = (
    quantity: number,
    pricePerUnit: number
  ): void => {
    if (selectedProduct) {
      // Calculate basic subtotal: quantity × price
      const subtotal = quantity * pricePerUnit

      /**
       * Create product item object for the order.
       *
       * This object will be added to the product items array in the parent component.
       * Most fields are populated, but allocations and fees will be calculated later
       * via shipping optimization.
       */
      // Cast to PurchaseOrderProductItem for API compatibility
      // The form uses PurchaseOrderProductItemForm internally but the callback expects PurchaseOrderProductItem
      onProductSelect({
        productId: selectedProduct.productId,
        productTitle: selectedProduct.title,
        quantity,
        pricePerUnit,
        images: selectedProduct.images,
        // No pickup allocations at this stage - will be calculated at order level via shipping optimization
        pickupAllocations: [],
        discount: selectedProduct.discount,
        isDiscountPercent: selectedProduct.isDiscountPercent,
        totalDiscount: 0, // Will be calculated at order level
        subtotal,
        totalPackagingFee: 0, // Will be calculated at order level via shipping optimization
        totalShippingFee: 0, // Will be calculated at order level via shipping optimization
        grandTotal: subtotal, // Just subtotal for now (will be recalculated with fees)
        // Preserve stock information for validation labels
        totalAvailableStock: selectedProduct.totalAvailableStock ?? null,
        // Include product metadata for display
        brand: selectedProduct.brand,
        upc: selectedProduct.upc,
        model: selectedProduct.model,
        weightKgs: selectedProduct.weightKgs,
      } as unknown as PurchaseOrderProductItem)

      // Clean up: Clear selected product state
      // Note: The quantity dialog is already closed by handleConfirm calling onClose()
      setSelectedProduct(null)

      // Close the main ProductPickerModal
      onClose()
    }
  }

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setProducts([])
      setHasSearched(false)
    }
  }, [open])

  // Handle Enter key to search
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      void handleSearch()
    }
  }


  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          className: styles['product-picker__modal-paper'],
        }}
      >
        <DialogTitle>
          <Box className={styles['product-picker__modal-title']}>
            <Box className={styles['product-picker__modal-title-left']}>
              <ShoppingCartIcon color="primary" />
              <Subheader label="Select Product" />
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {/* Search Bar */}
          <ProductSearchBar
            searchQuery={searchQuery}
            isLoading={loading}
            onSearchQueryChange={setSearchQuery}
            onSearch={() => void handleSearch()}
            onKeyPress={handleKeyDown}
          />
          {/* Search Hint - Only show when no search has been performed and no products loaded */}
          {!hasSearched && products.length === 0 && !loading && (
            <SecondaryFont variant="caption" className={styles['product-picker__search-hint']}>
              Enter at least 2 characters and press Enter or click Search
            </SecondaryFont>
          )}

          {/* Loading State */}
          {loading && (
            <Box className={styles['product-picker__loading']}>
              <CircularProgress />
            </Box>
          )}

          {/* No Results */}
          {!loading && hasSearched && products.length === 0 && (
            <Box className={styles['product-picker__empty-state']}>
              <ShoppingCartIcon className={styles['product-picker__empty-icon']} />
              <Subheader variant="h6" label="No products found" className={styles['product-picker__empty-title']} />
              <BodyText variant="body2" className={styles['product-picker__empty-text']}>
                Try a different search term
              </BodyText>
            </Box>
          )}

          {/* Initial State */}
          {!loading && !hasSearched && (
            <Box className={styles['product-picker__empty-state']}>
              <SearchIcon className={styles['product-picker__empty-icon']} />
              <Subheader variant="h6" label="Search for products" className={styles['product-picker__empty-title']} />
              <BodyText variant="body2" className={styles['product-picker__empty-text']}>
                Use the search bar above to find products by title, UPC, brand, or model
              </BodyText>
            </Box>
          )}

          {/* Product Grid */}
          {!loading && products.length > 0 && (
            <ProductGrid
              products={products}
              excludeProductIds={excludeProductIds}
              onProductSelect={handleProductSelect}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Simple Quantity/Price Dialog */}
      <SimpleQuantityPriceDialog
        open={quantityDialogOpen}
        onClose={() => {
          setQuantityDialogOpen(false)
          setSelectedProduct(null)
        }}
        onConfirm={handleConfirmQuantityPrice}
        product={selectedProduct}
      />
    </>
  )
}

export default ProductPickerModal
