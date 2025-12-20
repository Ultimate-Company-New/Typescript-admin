import { Box, Chip, Paper } from '@mui/material'

import { Inventory as PackageIcon } from '@mui/icons-material'

import { type OptimizationShipment } from '../../../api/shippingApi'
import { BodyText, SecondaryFont, Subheader } from '../../../components/fonts'
import styles from '../../../styles/PurchaseOrders.module.scss'

/**
 * Props for ShipmentPackagesList component
 *
 * @property {OptimizationShipment} shipment - The shipment data containing packages
 *   and products. Packages are grouped and aggregated for display.
 */
interface ShipmentPackagesListProps {
  shipment: OptimizationShipment
}

/**
 * Shipment Packages List Component
 *
 * Displays detailed packing information for a shipment, showing how products are
 * organized into packages. Groups packages by packageId and aggregates quantities
 * and costs.
 *
 * Features:
 * - Package grouping: Groups multiple instances of same package type
 * - Product listing: Shows which products go in each package type
 * - Quantity per box: Calculates how many units of each product per box
 * - Total quantities: Shows total quantity of each product across all boxes
 * - Package details: Dimensions, max weight, price per box
 * - Total cost: Aggregated cost for each package type
 * - Empty state: Shows message when no packages available
 *
 * Data Processing:
 * 1. Build product map: Creates quick lookup of products by productId
 * 2. Group packages: Groups packagesUsed by packageId
 * 3. Aggregate data: Sums boxes, costs, and product quantities
 * 4. Calculate per-box quantities: Divides total quantity by number of boxes
 *
 * Display Format:
 * - Package header: Name, type, dimensions, max weight, price
 * - Product table: Product image/title, quantity per box, total quantity
 * - Total boxes and cost for each package type
 *
 * Use Cases:
 * - Shipping optimization modal (detailed packing view)
 * - Shipping estimate modal (package breakdown)
 *
 * @param {ShipmentPackagesListProps} props - Component props
 * @returns {JSX.Element} Rendered packages list
 */
const ShipmentPackagesList = ({ shipment }: ShipmentPackagesListProps): JSX.Element => {
  /**
   * Build a map of productId -> product for quick lookup.
   *
   * This allows us to quickly find product details when processing package
   * productDetails arrays. More efficient than searching shipment.products
   * array repeatedly.
   *
   * @returns {Record<number, Product>} Map of productId to product object
   */
  const productMap = shipment.products.reduce((acc, prodAlloc) => {
    if (prodAlloc.product) {
      acc[prodAlloc.product.productId] = prodAlloc.product
    }
    return acc
  }, {} as Record<number, typeof shipment.products[0]['product']>)

  /**
   * Group packages by packageId and aggregate data.
   *
   * The API may return multiple entries for the same package type (different boxes).
   * We group them together and aggregate:
   * - Total boxes (sum of quantityUsed)
   * - Total cost (sum of totalCost)
   * - Product quantities (sum quantities for each product)
   *
   * Why group?
   * - Same package type may be used multiple times
   * - User wants to see total boxes and cost per package type
   * - Cleaner display (one card per package type instead of one per box)
   *
   * @returns {Record<number, GroupedPackage>} Map of packageId to grouped package data
   */
  const groupedPackages = shipment.packagesUsed.reduce((acc, pkg) => {
    const pkgId = pkg.packageInfo.packageId
    if (!acc[pkgId]) {
      acc[pkgId] = {
        packageInfo: pkg.packageInfo,
        totalBoxes: 0,
        totalCost: 0,
        productQuantities: {} as Record<number, { product: typeof shipment.products[0]['product'], quantity: number }>
      }
    }
    acc[pkgId].totalBoxes += pkg.quantityUsed
    acc[pkgId].totalCost += pkg.totalCost
    // Aggregate product quantities - look up product from productMap by productId
    pkg.productDetails?.forEach(detail => {
      const prodId = detail.productId
      const product = productMap[prodId]
      if (product && !acc[pkgId].productQuantities[prodId]) {
        acc[pkgId].productQuantities[prodId] = { product, quantity: 0 }
      }
      if (acc[pkgId].productQuantities[prodId]) {
        acc[pkgId].productQuantities[prodId].quantity += detail.quantity
      }
    })
    return acc
  }, {} as Record<number, { packageInfo: typeof shipment.packagesUsed[0]['packageInfo'], totalBoxes: number, totalCost: number, productQuantities: Record<number, { product: typeof shipment.products[0]['product'], quantity: number }> }>)

  const groupedList = Object.values(groupedPackages)
  const totalBoxes = groupedList.reduce((sum, p) => sum + p.totalBoxes, 0)

  return (
    <>
      <Subheader variant="subtitle2" label={`Packing Details (${totalBoxes} boxes total)`} className={styles['shipping-optimization-modal__shipment-packages-header']}>
        <PackageIcon fontSize="small" color="secondary" />
      </Subheader>
      <Box className={styles['shipping-optimization-modal__shipment-packages-list']}>
        {groupedList.length === 0 ? (
          <Paper variant="outlined" className={styles['shipping-optimization-modal__shipment-no-packages-paper']}>
            <PackageIcon color="error" className={styles['shipping-optimization-modal__shipment-no-packages-icon']} />
            <BodyText variant="body2" className={styles['shipping-optimization-modal__shipment-no-packages-text']}>
              ⚠️ No packages available to fit products at this location
            </BodyText>
          </Paper>
        ) : (
          groupedList.map((pkg) => {
            const productList = Object.values(pkg.productQuantities)
            return (
              <Paper key={pkg.packageInfo.packageId} variant="outlined" className={styles['shipping-optimization-modal__shipment-package-paper']}>
                {/* Package Header */}
                <Box className={styles['shipping-optimization-modal__shipment-package-header']}>
                  <Box>
                    <BodyText variant="body1" className={styles['shipping-optimization-modal__shipment-package-name']}>
                      📦 {pkg.packageInfo.packageName}
                    </BodyText>
                    <Box className={styles['shipping-optimization-modal__shipment-package-info-row']}>
                      <Chip label={pkg.packageInfo.packageType} size="small" className={styles['shipping-optimization-modal__shipment-package-type-chip']} />
                      {pkg.packageInfo.length && pkg.packageInfo.breadth && pkg.packageInfo.height && (
                        <SecondaryFont variant="caption" className={styles['shipping-optimization-modal__shipment-package-dimensions']}>
                          {pkg.packageInfo.length}×{pkg.packageInfo.breadth}×{pkg.packageInfo.height} cm
                        </SecondaryFont>
                      )}
                      {pkg.packageInfo.maxWeight && (
                        <SecondaryFont variant="caption" className={styles['shipping-optimization-modal__shipment-package-max-weight']}>
                          Max: {pkg.packageInfo.maxWeight} kg
                        </SecondaryFont>
                      )}
                      {pkg.packageInfo.pricePerUnit != null && (
                        <SecondaryFont variant="caption" className={styles['shipping-optimization-modal__shipment-package-price']}>
                          ₹{pkg.packageInfo.pricePerUnit.toLocaleString('en-IN')}/box
                        </SecondaryFont>
                      )}
                    </Box>
                  </Box>
                  <Box className={styles['shipping-optimization-modal__shipment-package-quantity-container']}>
                    <Chip
                      label={`${pkg.totalBoxes} ${pkg.totalBoxes === 1 ? 'box' : 'boxes'}`}
                      size="small"
                      color="secondary"
                      className={styles['shipping-optimization-modal__shipment-package-quantity-chip']}
                    />
                    <SecondaryFont variant="caption" className={styles['shipping-optimization-modal__shipment-package-total-cost']}>
                      ₹{pkg.totalCost.toLocaleString('en-IN')}
                    </SecondaryFont>
                  </Box>
                </Box>

                {/* Products in this Package Type */}
                {productList.length > 0 && (
                  <Box className={styles['shipping-optimization-modal__shipment-package-products-container']}>
                    {/* Table Header */}
                    <Box className={styles['shipping-optimization-modal__shipment-package-products-header']}>
                      <span>Product</span>
                      <span className={styles['shipping-optimization-modal__shipment-package-products-header-cell']}>#/Box</span>
                      <span className={styles['shipping-optimization-modal__shipment-package-products-header-cell']}>Qty</span>
                    </Box>

                    {/* Product rows: Show each product with quantities */}
                    {productList.map((item, idx) => {
                      /**
                       * Calculate quantity per box for this product.
                       *
                       * Divides total quantity by number of boxes, using Math.ceil
                       * to round up (ensures we show at least 1 per box if product exists).
                       *
                       * Example: 10 units in 3 boxes = 4 per box (rounded up)
                       */
                      const qtyPerBox = pkg.totalBoxes > 0 ? Math.ceil(item.quantity / pkg.totalBoxes) : item.quantity
                      return (
                        <Box
                          key={item.product.productId}
                          className={styles['shipping-optimization-modal__shipment-package-product-row']}
                          style={{ borderBottom: idx < productList.length - 1 ? '1px solid rgba(0, 0, 0, 0.12)' : 'none' }}
                        >
                          {/* Product with image and title */}
                          <Box className={styles['shipping-optimization-modal__shipment-package-product-info']}>
                            {item.product.mainImageUrl ? (
                              <Box
                                component="img"
                                src={item.product.mainImageUrl}
                                alt={item.product.title}
                                className={styles['shipping-optimization-modal__shipment-package-product-image']}
                              />
                            ) : (
                              <Box className={styles['shipping-optimization-modal__shipment-package-product-image-placeholder']}>
                                <PackageIcon className={styles['shipping-optimization-modal__shipment-package-product-image-placeholder-icon']} />
                              </Box>
                            )}
                            <BodyText variant="body2" className={styles['shipping-optimization-modal__shipment-package-product-title']}>
                              {item.product.title}
                            </BodyText>
                          </Box>
                          <BodyText variant="body1" className={styles['shipping-optimization-modal__shipment-package-product-qty-per-box']}>
                            {qtyPerBox}
                          </BodyText>
                          <BodyText variant="body1" className={styles['shipping-optimization-modal__shipment-package-product-qty']}>
                            {item.quantity}
                          </BodyText>
                        </Box>
                      )
                    })}
                  </Box>
                )}
              </Paper>
            )
          })
        )}
      </Box>
    </>
  )
}

export default ShipmentPackagesList
