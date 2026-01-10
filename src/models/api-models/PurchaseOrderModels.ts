/**
 * Purchase Order API Models
 * Type definitions for purchase order-related API requests and responses
 * Matches: PurchaseOrderRequestModel.java and PurchaseOrderResponseModel.java
 */

import type {
  AddressRequestModel,
  AddressResponseModel,
} from "./AddressModels";
import type { LeadResponseModel } from "./LeadModels";
import type { PackageResponseModel } from "./PackageModels";
import type { ProductResponseModel } from "./ProductModels";
import type { PromoResponseModel } from "./PromoModels";
import type { UserResponseModel } from "./UserModels";
import type { PackageProductResponseData } from "./ShipmentModels";

/**
 * Pickup Location Response Model
 * Matches: PickupLocationResponseModel.java
 */
export interface PickupLocationResponseModel {
  pickupLocationId: number;
  addressNickName: string;
  isDeleted: boolean;
  clientId: number;
  pickupLocationAddressId: number;
  shipRocketPickupLocationId?: number;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  modifiedBy?: string;
  notes?: string;
  address?: AddressResponseModel;
  client?: {
    clientId: number;
    name: string;
  };
  isActive?: boolean;
  productCount?: number;
  packageCount?: number;
}

/**
 * Resource Response Model (Attachments)
 * Matches: ResourceResponseModel.java
 */
export interface ResourceResponseModel {
  resourceId: number;
  entityId: number;
  entityType: string;
  key: string; // fileName
  value: string; // URL or base64 data
  deleteHashValue?: string;
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
}

/**
 * Purchase Order Product Item (Request)
 * Matches: RequestModels/PurchaseOrderProductItem.java
 * Used for creating/updating purchase orders
 */
export interface PurchaseOrderProductItemRequest {
  productId: number;
  pricePerUnit: number;
  quantity: number;
}

/**
 * Purchase Order Product Item (Response)
 * Matches: ResponseModels/PurchaseOrderProductItem.java
 * Used in response for backward compatibility - products extracted from shipments
 */
export interface PurchaseOrderProductItem {
  product: ProductResponseModel;
  pricePerUnit: number;
  quantity: number;
}

/**
 * Order Summary Data (Request)
 * Matches: PurchaseOrderRequestModel.OrderSummaryData.java
 */
export interface OrderSummaryData {
  // Financial Breakdown
  productsSubtotal: number; // Required
  totalDiscount?: number; // Default: 0
  packagingFee?: number; // Default: 0
  totalShipping?: number; // Default: 0
  serviceFee?: number; // Default: 0
  gstPercentage?: number; // Default: 18.00
  gstAmount: number; // Required (calculated from subtotal * gstPercentage)
  grandTotal: number; // Required (calculated: subtotal + gstAmount)
  pendingAmount?: number; // Default: grandTotal (nothing paid yet)

  // Fulfillment Details
  expectedDeliveryDate?: string; // Optional (ISO date string)
  address: AddressRequestModel; // Required: delivery/shipping address data
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"; // Required

  // Promotion & Terms (Optional)
  promoId?: number; // Optional: applied promotion/discount code
  termsConditionsHtml?: string; // Optional
  notes?: string; // Optional
}

/**
 * Courier Selection Data (Request)
 * Matches: PurchaseOrderRequestModel.CourierSelectionData.java
 * All fields are required for shipment creation.
 */
export interface CourierSelectionData {
  courierCompanyId: number; // Required: selected courier company ID
  courierName: string; // Required: selected courier name
  courierRate: number; // Required: selected courier rate
  courierMinWeight: number; // Required: courier minimum weight in kg
  courierMetadata: string; // Required: Full CourierOption JSON as string
}

/**
 * Shipment Product Data (Request)
 * Matches: PurchaseOrderRequestModel.ShipmentProductData.java
 */
export interface ShipmentProductData {
  productId: number; // Required
  allocatedQuantity: number; // Required: quantity allocated from this location
  allocatedPrice: number; // Required: custom price per unit for this product in this shipment
}

/**
 * Package Product Data (Request)
 * Matches: PurchaseOrderRequestModel.PackageProductData.java
 */
export interface PackageProductData {
  productId: number; // Required
  quantity: number; // Required: quantity of this product in this package
}

/**
 * Shipment Package Data (Request)
 * Matches: PurchaseOrderRequestModel.ShipmentPackageData.java
 */
export interface ShipmentPackageData {
  packageId: number; // Required
  quantityUsed: number; // Required: number of boxes/units used
  totalCost: number; // Required: total cost for this package type

  // Products in this package
  products: PackageProductData[]; // Required: list of products in this package
}

/**
 * Shipment Data (Request)
 * Matches: PurchaseOrderRequestModel.ShipmentData.java
 * All shipment fields including courier selection are required.
 */
export interface ShipmentData {
  // Shipment Basic Info
  pickupLocationId: number; // Required
  totalWeightKgs: number; // Required
  totalQuantity: number; // Required
  expectedDeliveryDate: string; // Required: expected delivery date for this shipment (ISO date string)

  // Costs
  packagingCost: number; // Required
  shippingCost: number; // Required
  totalCost: number; // Required (packagingCost + shippingCost)

  // Courier Selection
  selectedCourier: CourierSelectionData; // Required: selected courier details

  // Products in Shipment
  products: ShipmentProductData[]; // Required: list of products in shipment

  // Packages Used in Shipment
  packages: ShipmentPackageData[]; // Required: list of packages used in shipment
}

/**
 * Purchase Order Request Model
 * Matches: PurchaseOrderRequestModel.java
 */
export interface PurchaseOrderRequestModel {
  // Purchase Order Basic Fields
  purchaseOrderId?: number; // Required for updates
  vendorNumber?: string;
  isDeleted?: boolean;
  purchaseOrderReceipt?: string;
  purchaseOrderStatus?: string;
  approvedByUserId?: number;
  approvedDate?: string; // ISO date string
  rejectedByUserId?: number;
  rejectedDate?: string; // ISO date string
  assignedLeadId?: number;
  products?: PurchaseOrderProductItemRequest[]; // Legacy: list of products with price and quantity (for backward compatibility)
  attachments?: Record<string, string>; // Optional: max 30 attachments (key: fileName, value: base64 data)

  // OrderSummary Data (Financial Breakdown and Fulfillment Details)
  orderSummary: OrderSummaryData;

  // Shipment Data (List of shipments with products, packages, and courier selections)
  shipments: ShipmentData[];
}

/**
 * Order Summary Response Model
 * Matches: OrderSummaryResponseModel.java
 */
export interface OrderSummaryResponseData {
  orderSummaryId: number;

  // Financial Breakdown
  productsSubtotal: number;
  totalDiscount: number;
  packagingFee: number;
  totalShipping: number;
  serviceFee?: number; // Service fee (optional, may not be in all responses)
  subtotal: number;
  gstPercentage: number;
  gstAmount: number;
  grandTotal: number;
  pendingAmount: number;

  // Fulfillment Details
  expectedDeliveryDate?: string; // ISO date string
  address?: AddressResponseModel; // Delivery/shipping address
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";

  // Promotion & Terms (Optional)
  promoId?: number;
  promo?: PromoResponseModel;
  termsConditionsHtml?: string;
  notes?: string;
}

/**
 * Courier Selection Response Data
 * Matches: PurchaseOrderResponseModel.CourierSelectionResponseData.java
 */
export interface CourierSelectionResponseData {
  courierCompanyId: number;
  courierName: string;
  courierRate: number;
  courierMinWeight?: number; // Courier minimum weight in kg
  courierMetadata?: string; // Full CourierOption JSON as string
}




/**
 * Shipment Response Data
 * Matches: ShipmentResponseModel.java
 * Note: This is now the same as ShipmentData from ShipmentModels.ts
 * Kept here for backward compatibility with PurchaseOrderResponseModel
 */
export interface ShipmentResponseData {
  shipmentId: number;
  orderSummaryId?: number;

  // Shipment Basic Info
  pickupLocationId: number;
  pickupLocation?: PickupLocationResponseModel;
  totalWeightKgs: number;
  totalQuantity: number;
  expectedDeliveryDate?: string; // ISO date string

  // Costs
  packagingCost: number;
  shippingCost: number;
  totalCost: number;

  // Courier Selection (individual fields matching ShipmentResponseModel)
  selectedCourierCompanyId?: number;
  selectedCourierName?: string;
  selectedCourierRate?: number;
  selectedCourierMinWeight?: number;
  selectedCourierMetadata?: string;

  // ShipRocket Details
  shipRocketOrderId?: string;
  shipRocketShipmentId?: number;
  shipRocketAwbCode?: string;
  shipRocketTrackingId?: string;
  shipRocketStatus?: string;
  shipRocketManifestUrl?: string;
  shipRocketInvoiceUrl?: string;
  shipRocketLabelUrl?: string;

  // Audit Fields
  clientId?: number;
  createdUser?: string;
  modifiedUser?: string;
  createdAt?: string;
  updatedAt?: string;

  purchaseOrderId?: number;

  // Products in Shipment
  products: ProductResponseModel[];

  // Packages Used in Shipment
  packages: ShipmentPackageResponseData[];
}

/**
 * Payment Response Model
 * Matches: PaymentResponseModel.java
 */
export interface PaymentResponseModel {
  paymentId: number;
  entityType: string;
  entityId: number;
  razorpayOrderId?: string;
  razorpayReceipt?: string;
  orderAmountPaise?: number;
  currency?: string;
  orderCreatedAt?: string; // ISO date string
  orderExpiresAt?: string; // ISO date string
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentGateway: string;
  paymentMethod?: string;
  paymentStatus: string;
  amountPaidPaise?: number;
  amountPaid?: number;
  razorpayFeePaise?: number;
  razorpayFee?: number;
  razorpayTaxPaise?: number;
  razorpayTax?: number;
  paymentDate?: string; // ISO date string
  capturedAt?: string; // ISO date string
  cardLast4?: string;
  cardNetwork?: string;
  cardType?: string;
  cardIssuer?: string;
  cardInternational?: boolean;
  emiTenure?: number;
  upiVpa?: string;
  upiTransactionId?: string;
  bankCode?: string;
  bankName?: string;
  walletName?: string;
  amountRefundedPaise?: number;
  amountRefunded?: number;
  refundCount?: number;
  lastRefundId?: string;
  lastRefundAt?: string; // ISO date string
  refundStatus?: string;
  settlementId?: string;
  settlementStatus?: string;
  settledAt?: string; // ISO date string
  errorCode?: string;
  errorDescription?: string;
  errorSource?: string;
  errorReason?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  razorpayCustomerId?: string;
  invoiceId?: string;
  description?: string;
  notes?: string;
  payerIpAddress?: string;
  payerUserAgent?: string;
  isTestPayment?: boolean;
  clientId: number;
  createdUser: string;
  modifiedUser: string;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

/**
 * Purchase Order Response Model
 * Matches: PurchaseOrderResponseModel.java
 */
export interface PurchaseOrderResponseModel {
  // Purchase Order Basic Fields
  purchaseOrderId: number;
  vendorNumber?: string;
  isDeleted?: boolean;
  purchaseOrderReceipt?: string;
  purchaseOrderStatus: string;
  approvedDate?: string; // ISO date string
  rejectedDate?: string; // ISO date string
  assignedLeadId: number;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string

  // Nested response models for related entities
  lead?: LeadResponseModel;
  createdByUser?: UserResponseModel;
  modifiedByUser?: UserResponseModel;
  approvedByUser?: UserResponseModel;
  rejectedByUser?: UserResponseModel;

  // OrderSummary Data (Financial Breakdown and Fulfillment Details)
  orderSummary?: OrderSummaryResponseData;

  // Address (top-level for grid display convenience - extracted from OrderSummary)
  address?: AddressResponseModel;

  // Shipment Data (List of shipments with products, packages, and courier selections)
  shipments?: ShipmentResponseData[];

  // Products (DEPRECATED - use shipments[].products[] instead)
  // @deprecated Products are available in shipments, extract from shipments instead
  products?: PurchaseOrderProductItem[];

  // Attachments (List of resource details - contains both fileName (key) and URL/base64 (value))
  attachments?: ResourceResponseModel[];

  // Payments (List of all payments made for this purchase order)
  payments?: PaymentResponseModel[];
}

/**
 * Product image info for carousel display
 */
export interface ProductImageInfo {
  url: string;
  label?: string;
}
