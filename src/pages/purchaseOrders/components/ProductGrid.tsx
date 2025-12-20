import { Grid } from '@mui/material'

import { type ProductDetails } from '../../../models'
import { type ProductPickerCardProps } from '../../../models/purchase-order-components/PurchaseOrderComponentModels'

import ProductPickerCard from './ProductPickerCard'

/**
 * Props for ProductGrid component
 *
 * @property {ProductDetails[]} products - Array of product details to display in the grid.
 *   Each product contains information like title, price, images, dimensions, etc.
 * @property {number[]} excludeProductIds - Array of product IDs to exclude from the grid.
 *   Used to hide products that are already added to the purchase order.
 * @property {onProductSelect} onProductSelect - Callback function invoked when a product is selected.
 *   Receives the selected ProductDetails object as parameter.
 */
interface ProductGridProps {
  products: ProductDetails[]
  excludeProductIds: number[]
  onProductSelect: (product: ProductPickerCardProps['product']) => void
}

/**
 * Product Grid Component
 *
 * Displays a responsive grid of product cards, filtering out products that are already
 * in the purchase order. Uses Material-UI Grid system for responsive layout:
 * - xs={12}: Full width on extra small screens
 * - sm={6}: Half width on small screens
 * - md={4}: One-third width on medium+ screens
 *
 * The component filters products by:
 * 1. Checking if productId is not null/undefined (type safety)
 * 2. Checking if productId is not in the excludeProductIds list
 *
 * This ensures users don't accidentally add the same product twice and provides
 * a clean, filtered view of available products.
 *
 * @param {ProductGridProps} props - Component props
 * @returns {JSX.Element} Rendered product grid
 */
const ProductGrid = ({
  products,
  excludeProductIds,
  onProductSelect,
}: ProductGridProps): JSX.Element => {
  /**
   * Convert excludeProductIds array to Set for efficient lookup.
   *
   * Why use Set instead of array?
   * - O(1) lookup time vs O(n) for array.includes()
   * - More efficient when filtering many products
   * - Better performance for large exclude lists
   *
   * Performance Impact:
   * - Array.includes(): O(n × m) where n = products, m = excludeProductIds
   * - Set.has(): O(n) where n = products
   * - Significant improvement when excludeProductIds is large
   */
  const excludeSet = new Set(excludeProductIds)

  /**
   * Filter products to exclude already-added products.
   *
   * Filters out products that:
   * 1. Have null/undefined productId (incomplete data)
   * 2. Are in the excludeProductIds list (already added to order)
   *
   * Why filter null productIds?
   * - Type safety: ensures all products have valid IDs
   * - Prevents errors when rendering ProductPickerCard
   * - Handles edge cases where API might return incomplete data
   */
  const filteredProducts = products.filter((p) => p.productId != null && !excludeSet.has(p.productId))

  return (
    <Grid container spacing={2}>
      {/**
       * Map filtered products to ProductPickerCard components.
       *
       * Each product is rendered in a responsive Grid item:
       * - xs={12}: Full width on mobile (1 column)
       * - sm={6}: Half width on tablets (2 columns)
       * - md={4}: One-third width on desktop (3 columns)
       *
       * Why responsive grid?
       * - Better UX on different screen sizes
       * - More products visible on larger screens
       * - Single column on mobile for easier scrolling
       */}
      {filteredProducts.map((product) => {
        /**
         * Double-check for null productId (defensive programming).
         *
         * Even though we filtered above, this ensures type safety in the map.
         * Returns null to skip rendering if productId is somehow null.
         *
         * Why check again?
         * - TypeScript can't guarantee filter removed all nulls
         * - Runtime safety (handles edge cases)
         * - Prevents potential errors in ProductPickerCard
         */
        if (product.productId == null) return null

        return (
          <Grid item xs={12} sm={6} md={4} key={product.productId}>
            <ProductPickerCard
              product={product}
              onSelect={onProductSelect}
              /**
               * Disable card if product is in exclude list.
               *
               * This shouldn't happen after filtering, but provides extra safety.
               * Disabled state prevents selection even if product somehow appears.
               *
               * Why disable even though filtered?
               * - Extra safety layer
               * - Handles race conditions (if excludeProductIds updates)
               * - Defensive programming
               */
              disabled={excludeSet.has(product.productId)}
            />
          </Grid>
        )
      })}
    </Grid>
  )
}

export default ProductGrid
