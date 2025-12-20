import { Box, Chip, Paper } from '@mui/material'

import { Inventory as PackageIcon } from '@mui/icons-material'

import { BodyText, SecondaryFont, Subheader } from '../../../components/fonts'
import { type PackageInLocation } from '../../../models/purchase-order-components/PurchaseOrderComponentModels'
import styles from '../../../styles/PurchaseOrders.module.scss'

/**
 * Props for LocationPackagesList component
 *
 * @property {PackageInLocation[]} packages - Array of packages used at this pickup location.
 *   Each package contains information about package type, dimensions, quantity used,
 *   cost, and which products are contained within.
 */
interface LocationPackagesListProps {
  packages: PackageInLocation[]
}

/**
 * Location Packages List Component
 *
 * Displays a list of packages used at a specific pickup location within the shipping
 * estimate. Shows detailed information about each package including:
 * - Package name and type
 * - Quantity used (how many boxes of this package type)
 * - Dimensions (if available)
 * - Total cost for this package type
 * - Products contained in the package
 *
 * Features:
 * - Empty state when no packages are available
 * - Package cards with organized information
 * - Product listing within each package
 * - Cost breakdown per package
 *
 * Use Cases:
 * - Shipping estimate modal (showing packaging solution for a location)
 * - Shipping optimization modal (showing optimized packaging)
 *
 * Data Structure:
 * - Packages are grouped by packageId (same package type may appear multiple times)
 * - Each package can contain multiple products
 * - Products are listed with their quantities within the package
 *
 * @param {LocationPackagesListProps} props - Component props
 * @returns {JSX.Element} Rendered packages list
 */
const LocationPackagesList = ({ packages }: LocationPackagesListProps): JSX.Element => {
  return (
    <>
      <Box className={styles['shipping-estimate-modal__section-header']}>
        <PackageIcon fontSize="small" color="secondary" />
        <Subheader variant="subtitle2" label="Packages" />
      </Box>
      <Box className={styles['shipping-estimate-modal__packages-list']}>
        {packages.length === 0 ? (
          <BodyText variant="body2" className={styles['shipping-estimate-modal__empty-packages-text']}>
            No package information available
          </BodyText>
        ) : (
          packages.map((pkg) => (
            <Paper
              key={pkg.packageId}
              variant="outlined"
              className={styles['shipping-estimate-modal__package-paper']}
            >
              <Box className={styles['shipping-estimate-modal__package-header']}>
                <Box>
                  <BodyText variant="body2" className={styles['shipping-estimate-modal__package-name']}>
                    {pkg.packageName}
                  </BodyText>
                  <Chip
                    label={pkg.packageType}
                    size="small"
                    className={styles['shipping-estimate-modal__package-type-chip']}
                  />
                </Box>
                <Chip
                  label={`× ${pkg.quantityUsed}`}
                  size="small"
                  color="secondary"
                />
              </Box>
              {/* Package dimensions: Display if available (length × breadth × height) */}
              {pkg.dimensions && (
                <SecondaryFont variant="caption" className={styles['shipping-estimate-modal__package-dimensions']}>
                  📏 {pkg.dimensions.length}×{pkg.dimensions.breadth}×{pkg.dimensions.height} cm
                </SecondaryFont>
              )}
              {/* Package cost: Total cost for this package type (quantityUsed × pricePerUnit) */}
              <SecondaryFont variant="caption" className={styles['shipping-estimate-modal__package-cost']}>
                Cost: ₹{pkg.totalCost.toLocaleString('en-IN')}
              </SecondaryFont>
              {/* Products in this package: List all products contained in this package type */}
              {pkg.productsInPackage && pkg.productsInPackage.length > 0 && (
                <Box className={styles['shipping-estimate-modal__package-products']}>
                  <SecondaryFont variant="caption">
                    Contains:
                  </SecondaryFont>
                  {pkg.productsInPackage.map((p) => (
                    <SecondaryFont key={p.productId} variant="caption" className={styles['shipping-estimate-modal__package-product-item']}>
                      • {p.productTitle} (×{p.quantity})
                    </SecondaryFont>
                  ))}
                </Box>
              )}
            </Paper>
          ))
        )}
      </Box>
    </>
  )
}

export default LocationPackagesList
