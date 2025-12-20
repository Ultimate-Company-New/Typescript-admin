// ============================================================================
// Purchase Order Component-Specific Types
// ============================================================================

import type { UseFormReset, UseFormSetValue } from 'react-hook-form'
import type { ProductImageInfo, PurchaseOrderFormData, PurchaseOrderProductItem } from '../api-models'

// ============================================================================
// FillTestDataButton Types
// ============================================================================

export interface ProductBatchItem {
  productId: number
  title: string
  price: number
  discount?: number
  isDiscountPercent?: boolean
  mainImageUrl?: string
  topImageUrl?: string
  bottomImageUrl?: string
  frontImageUrl?: string
  backImageUrl?: string
  rightImageUrl?: string
  leftImageUrl?: string
  detailsImageUrl?: string
  defectImageUrl?: string
  additionalImage1Url?: string
  additionalImage2Url?: string
  additionalImage3Url?: string
}

export interface FillTestDataButtonProps {
  setValue: UseFormSetValue<PurchaseOrderFormData>
  reset: UseFormReset<PurchaseOrderFormData>
  isEditMode: boolean
  currentVendorNumber?: string
  onStateChange?: (state: string) => void
  onProductItemsChange?: (items: PurchaseOrderProductItem[]) => void
}

// ============================================================================
// ProductItemsSection Types
// ============================================================================

export interface PurchaseOrderProductItemForm {
  productId: number
  productTitle: string
  quantity: number
  pricePerUnit: number
  images?: ProductImageInfo[]
  pickupAllocations?: Array<{
    pickupLocationId: number
    locationName: string
    allocatedQuantity: number
    availableStock?: number
    addressType?: string
    streetAddress?: string
    streetAddress2?: string
    streetAddress3?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
    nameOnAddress?: string
    emailOnAddress?: string
    phoneOnAddress?: string
    packagingEstimate?: Array<{
      packageId: number
      packageName: string
      packageType: string
      quantityUsed: number
      pricePerUnit: number
      totalCost: number
    }>
    totalPackagingCost?: number
  }>
  discount?: number
  isDiscountPercent?: boolean
  totalDiscount?: number
  subtotal?: number
  totalPackagingFee?: number
  totalShippingFee?: number
  grandTotal?: number
}

export interface DeliveryAddress {
  city?: string
  state?: string
  postalCode?: string
}

export interface ProductItemsSectionProps {
  productItems: PurchaseOrderProductItem[]
  onProductItemsChange: (items: PurchaseOrderProductItem[]) => void
  isView?: boolean
  disabled?: boolean
  deliveryAddress?: DeliveryAddress
  shippingAllocations: Array<{
    pickupLocationId: number
    locationName: string
    postalCode: string
    totalWeightKgs: number
    totalQuantity: number
    productIds: number[]
    selectedCourier?: {
      courierCompanyId: number
      courierName: string
      courierType: string
      rate: number
      estimatedDeliveryDays: string
      etd?: string
    }
  }>
  onShippingChange: (allocations: ProductItemsSectionProps['shippingAllocations'], totalShipping: number) => void
}

export interface MiniImageCarouselProps {
  images?: ProductImageInfo[]
  size?: number
}

// ============================================================================
// ProductPickerModal Types
// ============================================================================

export interface ProductImageInfoLocal {
  url: string
  label: string
}

export interface ProductDetails {
  productId: number
  title: string
  upc?: string
  brand?: string
  price?: number
  discount?: number
  isDiscountPercent?: boolean
  model?: string
  condition?: string
  countryOfManufacture?: string
  weightKgs?: number
  length?: number
  breadth?: number
  height?: number
  category?: string
  images: ProductImageInfoLocal[]
}

export interface ProductPickerModalProps {
  open: boolean
  onClose: () => void
  onProductSelect: (product: PurchaseOrderProductItem) => void
  excludeProductIds?: number[]
}

export interface ImageCarouselProps {
  images: ProductImageInfoLocal[]
}

export interface ProductPickerCardProps {
  product: ProductDetails
  onSelect: (product: ProductDetails) => void
  disabled?: boolean
}

export interface SimpleQuantityPriceDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (quantity: number, pricePerUnit: number) => void
  product: ProductDetails | null
}

export interface ProductResponseItem {
  productId?: number
  product?: { productId?: number }
  title?: string
  upc?: string
  brand?: string
  price?: number
  discount?: number
  isDiscountPercent?: boolean
  discountPercent?: boolean
  model?: string
  condition?: string
  countryOfManufacture?: string
  weightKgs?: number
  length?: number
  breadth?: number
  height?: number
  category?: { categoryName?: string }
  categoryName?: string
  mainImageUrl?: string
  topImageUrl?: string
  bottomImageUrl?: string
  frontImageUrl?: string
  backImageUrl?: string
  rightImageUrl?: string
  leftImageUrl?: string
  detailsImageUrl?: string
  defectImageUrl?: string
  additionalImage1Url?: string
  additionalImage2Url?: string
  additionalImage3Url?: string
}

// ============================================================================
// ShippingEstimateModal Types
// ============================================================================

export interface ProductInLocation {
  productId: number
  productTitle: string
  quantity: number
  pricePerUnit: number
  brand?: string
  upc?: string
  model?: string
  mainImageUrl?: string
  weightKgs?: number
  dimensions?: {
    length?: number
    breadth?: number
    height?: number
  }
}

export interface PackageInLocation {
  packageId: number
  packageName: string
  packageType: string
  quantityUsed: number
  pricePerUnit: number
  totalCost: number
  dimensions?: {
    length?: number
    breadth?: number
    height?: number
  }
  maxWeight?: number
  productsInPackage?: {
    productId: number
    productTitle: string
    quantity: number
  }[]
}

export interface EnhancedLocationData {
  pickupLocationId: number
  locationName: string
  streetAddress?: string
  streetAddress2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  nameOnAddress?: string
  emailOnAddress?: string
  phoneOnAddress?: string
  totalWeightKgs: number
  totalQuantity: number
  products: ProductInLocation[]
  packages: PackageInLocation[]
  availableCouriers: Array<{
    courierCompanyId: number
    courierName: string
    courierType: string
    rate: number
    estimatedDeliveryDays: string
    etd?: string
    rating?: number
    deliveryPerformance?: number
    realtimeTracking?: string
    isSurface?: boolean
  }>
  selectedCourier?: EnhancedLocationData['availableCouriers'][0]
}

export interface ShippingEstimateModalProps {
  open: boolean
  onClose: () => void
  productItems: PurchaseOrderProductItem[]
  locationOptions: Array<{
    pickupLocationId: number
    locationName: string
    pickupPostcode?: string
    totalWeightKgs: number
    totalQuantity: number
    availableCouriers: EnhancedLocationData['availableCouriers']
    selectedCourier?: EnhancedLocationData['selectedCourier']
  }>
  shippingAllocations: ProductItemsSectionProps['shippingAllocations']
  onConfirm: (allocations: ProductItemsSectionProps['shippingAllocations'], totalShipping: number) => void
  isLoading?: boolean
}

// ============================================================================
// ShippingOptimizationModal Types
// ============================================================================

export interface SelectedShippingResult {
  optimizationResult: {
    success: boolean
    shipments?: Array<{
      pickupLocation?: {
        pickupLocationId: number
        addressNickName?: string
        address?: {
          addressType?: string
          streetAddress?: string
          streetAddress2?: string
          streetAddress3?: string
          city?: string
          state?: string
          postalCode?: string
          country?: string
          nameOnAddress?: string
          emailOnAddress?: string
          phoneOnAddress?: string
        }
      }
      totalWeightKgs: number
      totalQuantity: number
      products: Array<{
        product: {
          productId: number
          title: string
          mainImageUrl?: string
        }
        allocatedQuantity: number
      }>
      packagesUsed: Array<{
        packageInfo: {
          packageId: number
          packageName: string
          packageType: string
          pricePerUnit?: number
          length?: number
          breadth?: number
          height?: number
          maxWeight?: number
        }
        quantityUsed: number
        totalCost: number
        productDetails?: Array<{
          productId: number
          quantity: number
        }>
      }>
      packagingCost: number
      availableCouriers: EnhancedLocationData['availableCouriers']
    }>
    totalPackagingCost: number
    errorMessage?: string
  }
  courierSelections: Map<number, EnhancedLocationData['availableCouriers'][0]>
  totalShippingCost: number
  totalPackagingCost: number
}

export interface ProductItemForAllocation {
  productId: number
  title: string
  quantity: number
  mainImageUrl?: string
  weightKgs?: number
}

export interface ShippingOptimizationModalProps {
  open: boolean
  onClose: () => void
  optimizationResult: SelectedShippingResult['optimizationResult'] | null
  onConfirm: (result: SelectedShippingResult) => void
  isLoading?: boolean
  productItems?: ProductItemForAllocation[]
  deliveryPostcode?: string
  isCod?: boolean
  onCalculateCustom?: (customAllocations: Record<number, Record<number, number>>) => void
}

export interface CourierListProps {
  couriers: EnhancedLocationData['availableCouriers']
  selectedCourier: EnhancedLocationData['availableCouriers'][0] | null | undefined
  onCourierSelect: (courier: EnhancedLocationData['availableCouriers'][0]) => void
}

export interface ShipmentDetailsProps {
  shipment: import('../../api/shippingApi').OptimizationShipment
  selectedCourier?: EnhancedLocationData['availableCouriers'][0]
  onCourierSelect: (courier: EnhancedLocationData['availableCouriers'][0]) => void
  isExpanded: boolean
  onToggleExpand: () => void
  shipmentIndex: number
  totalShipmentsFromLocation: number
}

export interface CustomAllocationTabProps {
  productItems: ProductItemForAllocation[]
  deliveryPostcode: string
  isCod: boolean
  customResult?: SelectedShippingResult['optimizationResult'] | null
  isCalculating?: boolean
  courierSelections: Map<number, EnhancedLocationData['availableCouriers'][0]>
  onCourierSelect: (locationId: number, courier: EnhancedLocationData['availableCouriers'][0]) => void
  expandedLocationId: number | string | null
  onToggleExpand: (key: number | string) => void
  onAllocationsChange: (allocations: Record<number, Record<number, number>>, isFullyAllocated: boolean) => void
}

export interface ProductStockState {
  loading: boolean
  error: string | null
  data: Array<{
    pickupLocationId: number
    locationName: string
    city?: string
    state?: string
    postalCode?: string
    availableStock?: number
  }>
}

