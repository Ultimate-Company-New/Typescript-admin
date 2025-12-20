import { Box, Card, CardContent, Chip, Grid, Tooltip } from '@mui/material'

import {
    Close as CloseIcon,
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
    LocationOn as LocationIcon,
    Inventory as PackageIcon,
} from '@mui/icons-material'

import { IconButton } from '../../../components/buttons'
import { BodyText, SecondaryFont, Subheader } from '../../../components/fonts'
import { type PurchaseOrderProductItemForm } from '../../../models'
import styles from '../../../styles/PurchaseOrders.module.scss'

import MiniImageCarousel from './MiniImageCarousel'

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
 */
interface ProductItemCardProps {
  item: PurchaseOrderProductItemForm
  isExpanded: boolean
  isView: boolean
  disabled: boolean
  onToggleExpand: () => void
  onRemove: () => void
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
}: ProductItemCardProps): JSX.Element => {
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
  const totalPackages: number = item.pickupAllocations
    ? item.pickupAllocations.reduce(
        (sum: number, alloc) => {
          // Sum up quantityUsed for all packages at this location
          const packageCount = alloc.packagingEstimate?.reduce((pSum: number, p) => pSum + p.quantityUsed, 0) || 0
          return sum + packageCount
        },
        0
      )
    : 0

  return (
    <Card
      variant="outlined"
      className={`${styles['product-items-section__product-card']} ${isExpanded ? styles['product-items-section__product-card--expanded'] : ''}`}
    >
      <CardContent className={styles['product-items-section__product-card-content']}>
        {/* Main Row - Product Info & Summary */}
        <Grid container spacing={2} alignItems="center">
          {/* Product Info with Image Carousel */}
          <Grid item xs={12} md={4}>
            <Box className={styles['product-items-section__product-info']}>
              <MiniImageCarousel images={item.images} size={100} />
              <Box className={styles['product-items-section__product-details']}>
                <Subheader variant="subtitle1" label={item.productTitle} className={styles['product-items-section__product-title']} />
                <SecondaryFont variant="caption" className={styles['product-items-section__product-id']}>
                  ID: {item.productId}
                </SecondaryFont>
              </Box>
            </Box>
          </Grid>

          {/* Quick Stats */}
          <Grid item xs={6} md={2}>
            <Box className={styles['product-items-section__stat-box']}>
              <SecondaryFont variant="caption" className={styles['product-items-section__stat-label']}>
                Quantity
              </SecondaryFont>
              <Subheader variant="h6" label={String(item.quantity)} className={styles['product-items-section__stat-value']} />
            </Box>
          </Grid>

          <Grid item xs={6} md={2}>
            <Box className={styles['product-items-section__stat-box']}>
              <SecondaryFont variant="caption" className={styles['product-items-section__stat-label']}>
                Unit Price
              </SecondaryFont>
              <BodyText className={styles['product-items-section__stat-value-medium']}>
                ₹{item.pricePerUnit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={6} md={2}>
            <Box className={styles['product-items-section__stat-box']}>
              <SecondaryFont variant="caption" className={styles['product-items-section__stat-label']}>
                Product Total
              </SecondaryFont>
              <Subheader variant="h6" label={`₹${(item.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} className={styles['product-items-section__stat-value-large']} />
            </Box>
          </Grid>

          {/* Actions */}
          <Grid item xs={6} md={2} className={styles['product-items-section__product-actions']}>
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
                <IconButton
                  size="small"
                  color="error"
                  onClick={onRemove}
                  disabled={disabled}
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            )}
          </Grid>
        </Grid>

        {/* Quick Info Chips */}
        <Box className={styles['product-items-section__chips-container']}>
          {item.pickupAllocations && item.pickupAllocations.length > 0 && (
            <Chip
              icon={<LocationIcon />}
              label={`${item.pickupAllocations.length} location${item.pickupAllocations.length > 1 ? 's' : ''}`}
              size="small"
              color="info"
              variant="outlined"
            />
          )}
          {totalPackages > 0 && (
            <Chip
              icon={<PackageIcon />}
              label={`${totalPackages} package${totalPackages > 1 ? 's' : ''}`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          )}
          {item.totalDiscount != null && item.totalDiscount > 0 && (
            <Chip
              label={`Discount: ₹${item.totalDiscount.toLocaleString('en-IN')}`}
              size="small"
              color="success"
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

export default ProductItemCard
