import { Avatar, Box, Chip, Paper } from '@mui/material'

import { Inventory2 as ProductIcon } from '@mui/icons-material'

import { BodyText, SecondaryFont, Subheader } from '../../../components/fonts'
import { type ProductInLocation } from '../../../models/purchase-order-components/PurchaseOrderComponentModels'
import styles from '../../../styles/PurchaseOrders.module.scss'

/**
 * Props for LocationProductsList component
 *
 * @property {ProductInLocation[]} products - Array of products allocated to this pickup location.
 *   Each product contains basic info (ID, title, quantity, price) and optional details
 *   (brand, UPC, model, image) for display.
 */
interface LocationProductsListProps {
  products: ProductInLocation[]
}

/**
 * Location Products List Component
 *
 * Displays a list of products allocated to a specific pickup location within the
 * shipping estimate modal. Shows product information in a compact card format.
 *
 * Features:
 * - Product image (or placeholder icon if no image)
 * - Product title and ID
 * - Quantity allocated to this location
 * - Optional product details (UPC, brand, model) as chips
 * - Clean, scannable layout
 *
 * Display Information:
 * - Main image (if available) or product icon placeholder
 * - Product title (full name)
 * - Product ID for reference
 * - Allocated quantity (how many units from this location)
 * - Additional details as chips (UPC, brand, model) if available
 *
 * Use Cases:
 * - Shipping estimate modal (showing which products come from which location)
 * - Shipping optimization modal (showing product allocations)
 *
 * Visual Design:
 * - Compact cards for quick scanning
 * - Image on left, info on right
 * - Chips below for additional details
 * - Consistent spacing and typography
 *
 * @param {LocationProductsListProps} props - Component props
 * @returns {JSX.Element} Rendered products list
 */
const LocationProductsList = ({ products }: LocationProductsListProps): JSX.Element => {
  return (
    <>
      <Box className={styles['shipping-estimate-modal__section-header']}>
        <ProductIcon fontSize="small" color="info" />
        <Subheader variant="subtitle2" label="Products" />
      </Box>
      <Box className={styles['shipping-estimate-modal__products-list']}>
        {products.map((product) => (
          <Paper
            key={product.productId}
            variant="outlined"
            className={styles['shipping-estimate-modal__product-paper']}
          >
            {/* Product Content: Image and basic info */}
            <Box className={styles['shipping-estimate-modal__product-content']}>
              {/* Product Image: Show main image if available, otherwise show placeholder icon */}
              {product.mainImageUrl ? (
                <Avatar
                  src={product.mainImageUrl}
                  variant="rounded"
                  className={styles['shipping-estimate-modal__product-avatar']}
                />
              ) : (
                <Avatar variant="rounded" className={styles['shipping-estimate-modal__product-avatar-empty']}>
                  <ProductIcon />
                </Avatar>
              )}
              {/* Product Info: Title, ID, and quantity */}
              <Box className={styles['shipping-estimate-modal__product-info']}>
                <BodyText variant="body2" className={styles['shipping-estimate-modal__product-title']}>
                  {product.productTitle}
                </BodyText>
                <Box className={styles['shipping-estimate-modal__product-details-row']}>
                  <SecondaryFont variant="caption">
                    ID: {product.productId}
                  </SecondaryFont>
                  <SecondaryFont variant="caption" className={styles['shipping-estimate-modal__product-quantity']}>
                    × {product.quantity}
                  </SecondaryFont>
                </Box>
              </Box>
            </Box>
            {/* Additional Product Details: Show UPC, brand, and model as chips if available */}
            {(product.upc || product.brand || product.model) && (
              <Box className={styles['shipping-estimate-modal__product-chips']}>
                {product.upc && (
                  <Chip label={`UPC: ${product.upc}`} size="small" className={styles['shipping-estimate-modal__product-chip']} />
                )}
                {product.brand && (
                  <Chip label={product.brand} size="small" className={styles['shipping-estimate-modal__product-chip']} />
                )}
                {product.model && (
                  <Chip label={product.model} size="small" className={styles['shipping-estimate-modal__product-chip']} />
                )}
              </Box>
            )}
          </Paper>
        ))}
      </Box>
    </>
  )
}

export default LocationProductsList
