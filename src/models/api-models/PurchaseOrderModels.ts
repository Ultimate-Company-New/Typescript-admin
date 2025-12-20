/**
 * Purchase Order API Models
 * Type definitions for purchase order-related API requests and responses
 * Matches: PurchaseOrderRequestModel.java and PurchaseOrderResponseModel.java
 */

import type { AddressRequestModel, AddressResponseModel } from './AddressModels'
import type { LeadResponseModel } from './LeadModels'
import type { PackageResponseModel } from './PackageModels'
import type { ProductResponseModel } from './ProductModels'
import type { PromoResponseModel } from './PromoModels'
import type { UserResponseModel } from './UserModels'

/**
 * Pickup Location Response Model
 * Matches: PickupLocationResponseModel.java
 */
export interface PickupLocationResponseModel {
  pickupLocationId: number
  addressNickName: string
  isDeleted: boolean
  clientId: number
  pickupLocationAddressId: number
  shipRocketPickupLocationId?: number
  createdAt?: string
  createdBy?: string
  updatedAt?: string
  modifiedBy?: string
  notes?: string
  address?: AddressResponseModel
  client?: {
    clientId: number
    name: string
  }
  isActive?: boolean
  productCount?: number
  packageCount?: number
}

/**
 * Resource Response Model (Attachments)
 * Matches: ResourceResponseModel.java
 */
export interface ResourceResponseModel {
  resourceId: number
  entityId: number
  entityType: string
  key: string // fileName
  value: string // URL or base64 data
  deleteHashValue?: string
  createdAt?: string
  updatedAt?: string
  notes?: string
}

/**
 * Purchase Order Product Item
 * Matches: PurchaseOrderProductItem.java (Response Model)
 * Used in response for backward compatibility - products extracted from shipments
 */
export interface PurchaseOrderProductItem {
  product: ProductResponseModel
  pricePerUnit: number
  quantity: number
}

/**
 * Order Summary Data (Request)
 * Matches: PurchaseOrderRequestModel.OrderSummaryData.java
 */
export interface OrderSummaryData {
  // Financial Breakdown
  productsSubtotal: number // Required
  totalDiscount?: number // Default: 0
  packagingFee?: number // Default: 0
  totalShipping?: number // Default: 0
  gstPercentage?: number // Default: 18.00
  gstAmount: number // Required (calculated from subtotal * gstPercentage)
  grandTotal: number // Required (calculated: subtotal + gstAmount)
  pendingAmount?: number // Default: grandTotal (nothing paid yet)

  // Fulfillment Details
  expectedDeliveryDate?: string // Optional (ISO date string)
  address: AddressRequestModel // Required: delivery/shipping address data
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' // Required

  // Promotion & Terms (Optional)
  promoId?: number // Optional: applied promotion/discount code
  termsConditionsHtml?: string // Optional
  notes?: string // Optional
}

/**
 * Courier Selection Data (Request)
 * Matches: PurchaseOrderRequestModel.CourierSelectionData.java
 */
export interface CourierSelectionData {
  courierCompanyId: number // Required: selected courier company ID
  courierName: string // Required: selected courier name
  courierRate: number // Required: selected courier rate
  courierMetadata?: string // Optional: Full CourierOption JSON as string
}

/**
 * Shipment Product Data (Request)
 * Matches: PurchaseOrderRequestModel.ShipmentProductData.java
 */
export interface ShipmentProductData {
  productId: number // Required
  allocatedQuantity: number // Required: quantity allocated from this location
  allocatedPrice: number // Required: custom price per unit for this product in this shipment
}

/**
 * Package Product Data (Request)
 * Matches: PurchaseOrderRequestModel.PackageProductData.java
 */
export interface PackageProductData {
  productId: number // Required
  quantity: number // Required: quantity of this product in this package
}

/**
 * Shipment Package Data (Request)
 * Matches: PurchaseOrderRequestModel.ShipmentPackageData.java
 */
export interface ShipmentPackageData {
  packageId: number // Required
  quantityUsed: number // Required: number of boxes/units used
  totalCost: number // Required: total cost for this package type

  // Products in this package
  products: PackageProductData[] // Required: list of products in this package
}

/**
 * Shipment Data (Request)
 * Matches: PurchaseOrderRequestModel.ShipmentData.java
 */
export interface ShipmentData {
  // Shipment Basic Info
  pickupLocationId: number // Required
  totalWeightKgs: number // Required
  totalQuantity: number // Required
  expectedDeliveryDate?: string // Optional: expected delivery date for this shipment (ISO date string)

  // Costs
  packagingCost: number // Required
  shippingCost: number // Required
  totalCost: number // Required (packagingCost + shippingCost)

  // Courier Selection
  selectedCourier?: CourierSelectionData // Optional: selected courier details

  // Products in Shipment
  products: ShipmentProductData[] // Required: list of products in shipment

  // Packages Used in Shipment
  packages: ShipmentPackageData[] // Required: list of packages used in shipment
}

/**
 * Purchase Order Request Model
 * Matches: PurchaseOrderRequestModel.java
 */
export interface PurchaseOrderRequestModel {
  // Purchase Order Basic Fields
  purchaseOrderId?: number // Required for updates
  vendorNumber?: string
  isDeleted?: boolean
  purchaseOrderReceipt?: string
  purchaseOrderStatus?: string
  paymentId?: number
  approvedByUserId?: number
  approvedDate?: string // ISO date string
  rejectedByUserId?: number
  rejectedDate?: string // ISO date string
  assignedLeadId?: number
  products?: PurchaseOrderProductItem[] // Legacy: list of products with price and quantity (for backward compatibility)
  attachments?: Record<string, string> // Optional: max 30 attachments (key: fileName, value: base64 data)

  // OrderSummary Data (Financial Breakdown and Fulfillment Details)
  orderSummary: OrderSummaryData

  // Shipment Data (List of shipments with products, packages, and courier selections)
  shipments: ShipmentData[]
}

/**
 * Order Summary Response Data
 * Matches: PurchaseOrderResponseModel.OrderSummaryResponseData.java
 */
export interface OrderSummaryResponseData {
  orderSummaryId: number

  // Financial Breakdown
  productsSubtotal: number
  totalDiscount: number
  packagingFee: number
  totalShipping: number
  subtotal: number
  gstPercentage: number
  gstAmount: number
  grandTotal: number
  pendingAmount: number

  // Fulfillment Details
  expectedDeliveryDate?: string // ISO date string
  address?: AddressResponseModel // Delivery/shipping address
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

  // Promotion & Terms (Optional)
  promoId?: number
  promo?: PromoResponseModel
  termsConditionsHtml?: string
  notes?: string
}

/**
 * Courier Selection Response Data
 * Matches: PurchaseOrderResponseModel.CourierSelectionResponseData.java
 */
export interface CourierSelectionResponseData {
  courierCompanyId: number
  courierName: string
  courierRate: number
  courierMetadata?: string // Full CourierOption JSON as string
}

/**
 * Shipment Product Response Data
 * Matches: PurchaseOrderResponseModel.ShipmentProductResponseData.java
 */
export interface ShipmentProductResponseData {
  shipmentProductId: number
  productId: number
  product?: ProductResponseModel
  allocatedQuantity: number
  allocatedPrice: number
}

/**
 * Package Product Response Data
 * Matches: PurchaseOrderResponseModel.PackageProductResponseData.java
 */
export interface PackageProductResponseData {
  shipmentPackageProductId: number
  productId: number
  product?: ProductResponseModel
  quantity: number
}

/**
 * Shipment Package Response Data
 * Matches: PurchaseOrderResponseModel.ShipmentPackageResponseData.java
 */
export interface ShipmentPackageResponseData {
  shipmentPackageId: number
  packageId: number
  packageInfo?: PackageResponseModel
  quantityUsed: number
  totalCost: number

  // Products in this package
  products: PackageProductResponseData[]
}

/**
 * Shipment Response Data
 * Matches: PurchaseOrderResponseModel.ShipmentResponseData.java
 */
export interface ShipmentResponseData {
  shipmentId: number

  // Shipment Basic Info
  pickupLocationId: number
  pickupLocation?: PickupLocationResponseModel
  totalWeightKgs: number
  totalQuantity: number
  expectedDeliveryDate?: string // ISO date string

  // Costs
  packagingCost: number
  shippingCost: number
  totalCost: number

  // Courier Selection
  selectedCourier?: CourierSelectionResponseData

  // Products in Shipment
  products: ShipmentProductResponseData[]

  // Packages Used in Shipment
  packages: ShipmentPackageResponseData[]
}

/**
 * Purchase Order Response Model
 * Matches: PurchaseOrderResponseModel.java
 */
export interface PurchaseOrderResponseModel {
  // Purchase Order Basic Fields
  purchaseOrderId: number
  vendorNumber?: string
  isDeleted?: boolean
  purchaseOrderReceipt?: string
  purchaseOrderStatus: string
  paymentId?: number
  approvedDate?: string // ISO date string
  rejectedDate?: string // ISO date string
  assignedLeadId: number
  createdAt?: string // ISO date string
  updatedAt?: string // ISO date string

  // Nested response models for related entities
  lead?: LeadResponseModel
  createdByUser?: UserResponseModel
  modifiedByUser?: UserResponseModel
  approvedByUser?: UserResponseModel
  rejectedByUser?: UserResponseModel

  // OrderSummary Data (Financial Breakdown and Fulfillment Details)
  orderSummary?: OrderSummaryResponseData

  // Shipment Data (List of shipments with products, packages, and courier selections)
  shipments?: ShipmentResponseData[]

  // Products (for backward compatibility - extracted from shipments)
  products?: PurchaseOrderProductItem[]

  // Attachments (Map format: fileName -> base64 data for edit form, or List format for display)
  attachments?: Record<string, string> // fileName -> base64 data (for edit form)
  attachmentsList?: ResourceResponseModel[] // Full resource details (for display)
}

/**
 * Product image info for carousel display
 */
export interface ProductImageInfo {
  url: string
  label?: string
}
