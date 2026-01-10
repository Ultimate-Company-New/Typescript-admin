import { useState } from 'react'

import { format } from 'date-fns'

import { Box, Card, CardContent, Chip, Collapse, Divider, Grid, Paper } from '@mui/material'
import {
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material'

import { type PurchaseOrderResponseModel, type PurchaseOrderProductItem, type ProductImageInfo, type ShipmentResponseData } from '../../../models/api-models'
import { type OptimizationShipment } from '../../../api/shippingApi'
import { getPurchaseOrderStatusColor, getPurchaseOrderStatusLabel } from '../../../constants/appConstants'
import { BodyText, Subheader } from '../../../components/fonts'
import AddressDetailsView from '../../../components/form/AddressDetailsView'
import { ProductItemsSection, PaymentsTable } from './'
import ShipmentHeader from './ShipmentHeader'
import ShipmentPackagesList from './ShipmentPackagesList'
import styles from '../../../styles/PurchaseOrders.module.scss'

interface PurchaseOrderDetailsViewProps {
  purchaseOrder: PurchaseOrderResponseModel
}

/**
 * Purchase Order Details View Component
 * Displays all purchase order details in read-only format
 * Reuses existing components: AddressDetailsView, ProductItemsSection, ShipmentsModal
 */
const PurchaseOrderDetailsView = ({ purchaseOrder }: PurchaseOrderDetailsViewProps): JSX.Element => {
  const [expandedShipments, setExpandedShipments] = useState<Set<number>>(new Set())

  const handleToggleShipment = (shipmentId: number): void => {
    const newExpanded = new Set(expandedShipments)
    if (newExpanded.has(shipmentId)) {
      newExpanded.delete(shipmentId)
    } else {
      newExpanded.add(shipmentId)
    }
    setExpandedShipments(newExpanded)
  }

  /**
   * Convert ShipmentResponseData to OptimizationShipment format
   * This allows us to reuse existing shipment display components
   */
  const convertShipmentToOptimizationFormat = (shipment: ShipmentResponseData): OptimizationShipment => {
    const pickupLocationAddress = shipment.pickupLocation?.address
    const addressObj: OptimizationShipment['pickupLocation']['address'] | undefined = pickupLocationAddress ? {
      addressId: pickupLocationAddress.addressId,
      addressType: pickupLocationAddress.addressType || '',
      streetAddress: pickupLocationAddress.streetAddress || '',
      streetAddress2: pickupLocationAddress.streetAddress2 || '',
      streetAddress3: pickupLocationAddress.streetAddress3 || '',
      city: pickupLocationAddress.city || '',
      state: pickupLocationAddress.state || '',
      postalCode: pickupLocationAddress.postalCode || '',
      country: pickupLocationAddress.country || '',
      nameOnAddress: pickupLocationAddress.nameOnAddress || '',
      emailOnAddress: pickupLocationAddress.emailOnAddress || '',
      phoneOnAddress: pickupLocationAddress.phoneOnAddress || '',
    } : undefined

    return {
      pickupLocation: {
        pickupLocationId: shipment.pickupLocationId,
        addressNickName: shipment.pickupLocation?.addressNickName || 'Unknown Location',
        address: addressObj,
      },
      products: shipment.products.map((sp) => {
        const productAny = sp as Record<string, unknown> | null | undefined
        return {
          product: sp ? {
            productId: sp.productId,
            title: sp.title || 'Unknown Product',
            weightKgs: sp.weightKgs,
            length: sp.length,
            breadth: sp.breadth,
            height: sp.height,
            mainImageUrl: sp.mainImageUrl,
            topImageUrl: productAny?.topImageUrl as string | undefined,
            bottomImageUrl: productAny?.bottomImageUrl as string | undefined,
            frontImageUrl: productAny?.frontImageUrl as string | undefined,
            backImageUrl: productAny?.backImageUrl as string | undefined,
            rightImageUrl: productAny?.rightImageUrl as string | undefined,
            leftImageUrl: productAny?.leftImageUrl as string | undefined,
            detailsImageUrl: productAny?.detailsImageUrl as string | undefined,
            defectImageUrl: productAny?.defectImageUrl as string | undefined,
            additionalImage1Url: productAny?.additionalImage1Url as string | undefined,
            additionalImage2Url: productAny?.additionalImage2Url as string | undefined,
            additionalImage3Url: productAny?.additionalImage3Url as string | undefined,
            price: sp.allocatedPrice,
            discount: undefined,
            isDiscountPercent: false,
          } : {
            productId: sp?.productId || 0,
            title: 'Unknown Product',
          },
          allocatedQuantity: sp?.allocatedQuantity || 0,
          totalWeight: shipment.totalWeightKgs * ((sp?.allocatedQuantity || 0) / shipment.totalQuantity),
        }
      }),
      totalWeightKgs: shipment.totalWeightKgs,
      totalQuantity: shipment.totalQuantity,
      packagesUsed: shipment.packages.map((pkg) => ({
        packageInfo: pkg ? {
          packageId: pkg.packageId,
          packageName: pkg.packageName || 'Unknown Package',
          packageType: pkg.packageType || 'Standard',
          length: pkg.length,
          breadth: pkg.breadth,
          height: pkg.height,
          maxWeight: pkg.maxWeight,
          pricePerUnit: pkg.pricePerUnit,
        } : {
          packageId: pkg?.packageId || 0,
          packageName: 'Unknown Package',
          packageType: 'Standard',
        },
        quantityUsed: pkg?.quantityUsed || 0,
        totalCost: pkg?.totalCost || 0,
        productIds: pkg.products?.map((prod) => prod.productId ?? 0) || [],
        productDetails: pkg.products?.map((prod) => ({
          productId: prod.productId ?? 0,
          quantity: prod.quantity ?? 0,
        })) || [],
      })),
      packagingCost: shipment.packagingCost,
      shippingCost: shipment.shippingCost,
      totalCost: shipment.totalCost,
      availableCouriers: shipment.selectedCourierCompanyId ? [{
        courierCompanyId: shipment.selectedCourierCompanyId,
        courierName: shipment.selectedCourierName || 'Unknown Courier',
        courierType: 'Standard',
        rate: shipment.selectedCourierRate || 0,
        codCharges: 0,
        freightCharge: 0,
        estimatedDeliveryDays: 'N/A',
        etd: 'N/A',
        rating: 0,
        deliveryPerformance: 0,
        pickupPerformance: 0,
        city: '',
        state: '',
        chargeWeight: shipment.totalWeightKgs,
        isSurface: true,
        realtimeTracking: 'N/A',
      }] : [],
    }
  }

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '—'
    try {
      return format(new Date(dateString), 'do MMM yyyy, h:mm a')
    } catch {
      return dateString
    }
  }

  const formatCurrency = (amount: number | undefined): string => {
    if (amount == null) return '₹0.00'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount)
  }


  const shipments = purchaseOrder.shipments ?? []
  const address = purchaseOrder.address
  const orderSummary = purchaseOrder.orderSummary

  /**
   * Transform API product items (nested structure) to form product items (flat structure).
   *
   * The API returns PurchaseOrderProductItem with nested product object:
   * { product: { productId, title, images, ... }, quantity, pricePerUnit }
   *
   * But ProductItemsSection expects flat structure:
   * { productId, productTitle, images, quantity, pricePerUnit, ... }
   */
  const transformProductItems = (items: PurchaseOrderProductItem[]): PurchaseOrderProductItem[] => {
    return items.map((item) => {
      if (!item.product) {
        // Safety check: skip items without product data
        return item
      }

      // Extract images from product object and convert to ProductImageInfo format
      const images: ProductImageInfo[] = []
      if (item.product.mainImageUrl) images.push({ url: item.product.mainImageUrl, label: 'Main' })
      if (item.product.topImageUrl) images.push({ url: item.product.topImageUrl, label: 'Top' })
      if (item.product.bottomImageUrl) images.push({ url: item.product.bottomImageUrl, label: 'Bottom' })
      if (item.product.frontImageUrl) images.push({ url: item.product.frontImageUrl, label: 'Front' })
      if (item.product.backImageUrl) images.push({ url: item.product.backImageUrl, label: 'Back' })
      if (item.product.rightImageUrl) images.push({ url: item.product.rightImageUrl, label: 'Right' })
      if (item.product.leftImageUrl) images.push({ url: item.product.leftImageUrl, label: 'Left' })
      if (item.product.detailsImageUrl) images.push({ url: item.product.detailsImageUrl, label: 'Details' })
      if (item.product.defectImageUrl) images.push({ url: item.product.defectImageUrl, label: 'Defect' })
      if (item.product.additionalImage1Url) images.push({ url: item.product.additionalImage1Url, label: 'Additional 1' })
      if (item.product.additionalImage2Url) images.push({ url: item.product.additionalImage2Url, label: 'Additional 2' })
      if (item.product.additionalImage3Url) images.push({ url: item.product.additionalImage3Url, label: 'Additional 3' })

      // Transform to flat structure expected by ProductItemsSection
      return {
        productId: item.product.productId,
        productTitle: item.product.title || '',
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        images: images.length > 0 ? images : undefined,
        brand: item.product.brand,
        upc: item.product.upc,
        model: item.product.model,
        weightKgs: item.product.weightKgs,
        pickupAllocations: [],
        discount: item.product.discount || 0,
        isDiscountPercent: item.product.isDiscountPercent || false,
        totalDiscount: 0,
        subtotal: item.quantity * item.pricePerUnit,
        grandTotal: item.quantity * item.pricePerUnit,
        totalPackagingFee: 0,
        totalShippingFee: 0,
      } as unknown as PurchaseOrderProductItem
    })
  }

  // Extract products from shipments (replaces deprecated purchaseOrder.products field)
  const extractProductsFromShipments = (shipments?: typeof purchaseOrder.shipments): PurchaseOrderProductItem[] => {
    if (!shipments || !Array.isArray(shipments) || shipments.length === 0) {
      return []
    }

    const productMap = new Map<number, PurchaseOrderProductItem>()

    shipments.forEach(shipment => {
      shipment.products?.forEach(productData => {
        const productId = productData.productId
        if (!productId || !productData.product) return

        if (productMap.has(productId)) {
          // Aggregate quantity and use latest price
          const existing = productMap.get(productId)!
          existing.quantity = (existing.quantity || 0) + (productData.allocatedQuantity || 0)
          existing.pricePerUnit = productData.allocatedPrice || existing.pricePerUnit
        } else {
          // Create new product item
          productMap.set(productId, {
            product: productData.product,
            pricePerUnit: productData.allocatedPrice || 0,
            quantity: productData.allocatedQuantity || 0,
          })
        }
      })
    })

    return Array.from(productMap.values())
  }

  const productsFromShipments = extractProductsFromShipments(purchaseOrder.shipments)
  const productItems = transformProductItems(productsFromShipments)

  return (
    <>
      {/* Basic Information Section */}
      <Paper className={styles['purchase-order-view__section']}>
        <Subheader label="Basic Information" className={styles['purchase-order-view__section-title']} />
        <Divider className={styles['purchase-order-view__divider']} />
        <Box className={styles['purchase-order-view__divider-spacer']} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Box className={styles['purchase-order-view__field']}>
              <BodyText className={styles['purchase-order-view__label']}>Purchase Order ID</BodyText>
              <BodyText className={styles['purchase-order-view__value']}>
                {purchaseOrder.purchaseOrderId || '—'}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['purchase-order-view__field']}>
              <BodyText className={styles['purchase-order-view__label']}>Vendor Number</BodyText>
              <BodyText className={styles['purchase-order-view__value']}>
                {purchaseOrder.vendorNumber || '—'}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['purchase-order-view__field']}>
              <BodyText className={styles['purchase-order-view__label']}>Status</BodyText>
              <Chip
                label={getPurchaseOrderStatusLabel(purchaseOrder.purchaseOrderStatus || '—')}
                color={getPurchaseOrderStatusColor(purchaseOrder.purchaseOrderStatus || '')}
                size="small"
                icon={
                  purchaseOrder.purchaseOrderStatus === 'APPROVED' ? (
                    <CheckCircleIcon />
                  ) : purchaseOrder.purchaseOrderStatus === 'REJECTED' ? (
                    <CancelIcon />
                  ) : undefined
                }
              />
            </Box>
          </Grid>

          {purchaseOrder.lead && (
            <Grid item xs={12} sm={6}>
              <Box className={styles['purchase-order-view__field']}>
                <BodyText className={styles['purchase-order-view__label']}>Assigned Lead</BodyText>
                <BodyText className={styles['purchase-order-view__value']}>
                  {purchaseOrder.lead.firstName} {purchaseOrder.lead.lastName}
                  {purchaseOrder.lead.email && ` (${purchaseOrder.lead.email})`}
                </BodyText>
              </Box>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <Box className={styles['purchase-order-view__field']}>
              <BodyText className={styles['purchase-order-view__label']}>Created At</BodyText>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon fontSize="small" color="action" />
                <BodyText className={styles['purchase-order-view__value']}>
                  {formatDate(purchaseOrder.createdAt)}
                </BodyText>
              </Box>
            </Box>
          </Grid>

          {purchaseOrder.createdByUser && (
            <Grid item xs={12} sm={6}>
              <Box className={styles['purchase-order-view__field']}>
                <BodyText className={styles['purchase-order-view__label']}>Created By</BodyText>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" color="action" />
                  <BodyText className={styles['purchase-order-view__value']}>
                    {purchaseOrder.createdByUser.firstName} {purchaseOrder.createdByUser.lastName}
                    {purchaseOrder.createdByUser.email && ` (${purchaseOrder.createdByUser.email})`}
                  </BodyText>
                </Box>
              </Box>
            </Grid>
          )}

          {purchaseOrder.approvedDate && (
            <Grid item xs={12} sm={6}>
              <Box className={styles['purchase-order-view__field']}>
                <BodyText className={styles['purchase-order-view__label']}>Approved Date</BodyText>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon fontSize="small" color="action" />
                  <BodyText className={styles['purchase-order-view__value']}>
                    {formatDate(purchaseOrder.approvedDate)}
                  </BodyText>
                </Box>
              </Box>
            </Grid>
          )}

          {purchaseOrder.approvedByUser && (
            <Grid item xs={12} sm={6}>
              <Box className={styles['purchase-order-view__field']}>
                <BodyText className={styles['purchase-order-view__label']}>Approved By</BodyText>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" color="action" />
                  <BodyText className={styles['purchase-order-view__value']}>
                    {purchaseOrder.approvedByUser.firstName} {purchaseOrder.approvedByUser.lastName}
                    {purchaseOrder.approvedByUser.email && ` (${purchaseOrder.approvedByUser.email})`}
                  </BodyText>
                </Box>
              </Box>
            </Grid>
          )}

          {purchaseOrder.rejectedDate && (
            <Grid item xs={12} sm={6}>
              <Box className={styles['purchase-order-view__field']}>
                <BodyText className={styles['purchase-order-view__label']}>Rejected Date</BodyText>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon fontSize="small" color="action" />
                  <BodyText className={styles['purchase-order-view__value']}>
                    {formatDate(purchaseOrder.rejectedDate)}
                  </BodyText>
                </Box>
              </Box>
            </Grid>
          )}

          {purchaseOrder.rejectedByUser && (
            <Grid item xs={12} sm={6}>
              <Box className={styles['purchase-order-view__field']}>
                <BodyText className={styles['purchase-order-view__label']}>Rejected By</BodyText>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" color="action" />
                  <BodyText className={styles['purchase-order-view__value']}>
                    {purchaseOrder.rejectedByUser.firstName} {purchaseOrder.rejectedByUser.lastName}
                    {purchaseOrder.rejectedByUser.email && ` (${purchaseOrder.rejectedByUser.email})`}
                  </BodyText>
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Address Details Section */}
      {address && (
        <AddressDetailsView
          streetAddress={address.streetAddress}
          streetAddress2={address.streetAddress2}
          streetAddress3={address.streetAddress3}
          city={address.city}
          state={address.state}
          postalCode={address.postalCode}
          country={address.country}
          addressType={address.addressType}
          nameOnAddress={address.nameOnAddress}
          emailOnAddress={address.emailOnAddress}
          phoneOnAddress={address.phoneOnAddress}
        />
      )}

      {/* Products Section */}
      {productItems.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <ProductItemsSection
            productItems={productItems}
            onProductItemsChange={() => {}}
            isView={true}
            disabled={true}
            deliveryAddress={address}
            shippingAllocations={[]}
            onShippingChange={() => {}}
            packagingFee={orderSummary?.packagingFee ?? 0}
            totalShippingCost={orderSummary?.totalShipping ?? 0}
            serviceFee={orderSummary?.serviceFee ?? 0}
            onServiceFeeChange={() => {}}
          />
        </Box>
      )}

      {/* Shipments Section */}
      {shipments.length > 0 && (
        <Paper
          className={styles['purchase-order-view__section']}
          sx={{ padding: 0 }}
        >
          <Box sx={{ padding: '16px', paddingBottom: 0 }}>
            <Subheader label="Estimated Shipments" className={styles['purchase-order-view__section-title']} />
            <Divider className={styles['purchase-order-view__divider']} />
            <Box className={styles['purchase-order-view__divider-spacer']} />
          </Box>
          <Box sx={{ padding: '16px', paddingTop: 2 }}>
            {shipments.map((shipment, index) => {
              const converted = convertShipmentToOptimizationFormat(shipment)
              const isExpanded = expandedShipments.has(shipment.shipmentId)
              const selectedCourier = converted.availableCouriers[0]
              const hasPackages = converted.packagesUsed.length > 0
              const hasCouriers = converted.availableCouriers.length > 0
              const isValid = hasPackages && hasCouriers

              return (
                <Card
                  key={shipment.shipmentId}
                  variant="outlined"
                  className={`${styles['shipping-optimization-modal__shipment-card']} ${isExpanded ? styles['shipping-optimization-modal__shipment-card--expanded'] : ''} ${!isValid ? styles['shipping-optimization-modal__shipment-card--invalid'] : ''}`}
                  style={{
                    borderColor: !isValid ? '#d32f2f' : isExpanded ? '#1976d2' : undefined,
                    borderWidth: isExpanded ? 2 : 1,
                    transition: 'all 0.2s',
                    opacity: isValid ? 1 : 0.5,
                    marginBottom: index < shipments.length - 1 ? 2 : 0,
                  }}
                >
                  <CardContent className={`${styles['shipping-optimization-modal__shipment-card-content']} ${isExpanded ? styles['shipping-optimization-modal__shipment-card-content--expanded'] : ''}`}>
                    <ShipmentHeader
                      shipment={converted}
                      selectedCourier={selectedCourier}
                      isExpanded={isExpanded}
                      isValid={isValid}
                      shipmentLabel={shipments.length > 1 ? `Shipment ${index + 1} of ${shipments.length}` : null}
                      expectedDeliveryDate={shipment.expectedDeliveryDate}
                      onToggleExpand={() => handleToggleShipment(shipment.shipmentId)}
                    />

                    <Collapse in={isExpanded}>
                      <Box className={styles['shipping-optimization-modal__shipment-expanded-details']}>
                        <ShipmentPackagesList shipment={converted} />

                        {/* Courier Metadata Section */}
                        {shipment.selectedCourierMetadata && (
                          <Box sx={{ marginTop: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Divider />

                            {/* Courier Metadata */}
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1 }}>
                                <ShippingIcon fontSize="small" color="primary" />
                                <Subheader variant="subtitle2" label="Courier Metadata" />
                              </Box>
                              <Paper
                                variant="outlined"
                                sx={{
                                  padding: 2,
                                  backgroundColor: '#0d1117',
                                  borderColor: '#30363d',
                                  borderRadius: 1,
                                  overflow: 'auto',
                                  maxHeight: 400,
                                }}
                              >
                                <Box
                                  component="pre"
                                  sx={{
                                    fontFamily: 'SF Mono, Monaco, Inconsolata, Roboto Mono, Consolas, Courier New, monospace',
                                    fontSize: '13px',
                                    lineHeight: 1.6,
                                    margin: 0,
                                    color: '#c9d1d9',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {(() => {
                                    try {
                                      const metadata = JSON.parse(shipment.selectedCourierMetadata)
                                      return JSON.stringify(metadata, null, 2)
                                    } catch {
                                      return shipment.selectedCourierMetadata
                                    }
                                  })()}
                                </Box>
                              </Paper>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        </Paper>
      )}

      {/* Payments Section */}
      <Paper className={styles['purchase-order-view__section']}>
        <Subheader label="Payment History" className={styles['purchase-order-view__section-title']} />
        <Divider className={styles['purchase-order-view__divider']} />
        <Box className={styles['purchase-order-view__divider-spacer']} />
        <Box sx={{ mt: 2, padding: '16px' }}>
          <PaymentsTable payments={purchaseOrder.payments || []} />
        </Box>
      </Paper>

    </>
  )
}

export default PurchaseOrderDetailsView

