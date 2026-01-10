import type { AddressResponseModel } from "./AddressModels";
import type { PackageResponseModel } from "./PackageModels";
import type { ProductResponseModel } from "./ProductModels";
import type { PickupLocationResponseModel } from "./PurchaseOrderModels";

/**
 * Shipment API Models
 * Type definitions for shipment-related API requests and responses
 */

/**
 * Shipment data structure matching API response
 * Maps to ShipmentResponseModel from Spring API backend
 */
export interface ShipmentData {
  shipmentId?: number;
  orderSummaryId?: number;
  pickupLocationId?: number;
  totalWeightKgs?: number;
  totalQuantity?: number;
  expectedDeliveryDate?: string;
  deliveredDate?: string;  // Actual delivery date

  // Cost Breakdown
  packagingCost?: number;
  shippingCost?: number;
  totalCost?: number;

  // Courier Selection
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
  shipRocketStatus?: ShipRocketStatus;
  shipRocketManifestUrl?: string;
  shipRocketInvoiceUrl?: string;
  shipRocketLabelUrl?: string;
  shipRocketFullResponse?: string;  // Complete ShipRocket order details as JSON
  shipRocketAwbMetadata?: string;
  shipRocketPickupMetadata?: string;
  shipRocketGeneratedManifestUrl?: string;
  shipRocketGeneratedLabelUrl?: string;
  shipRocketGeneratedInvoiceUrl?: string;
  shipRocketTrackingMetadata?: string;   // AWB assignment response as JSON

  // Audit Fields
  clientId?: number;
  createdUser?: string;
  modifiedUser?: string;
  createdAt?: string;
  updatedAt?: string;

  // Related Entities
  pickupLocation?: PickupLocationResponseModel;
  deliveryAddress?: AddressResponseModel;  // Delivery address from OrderSummary

  purchaseOrderId?: number;

  createdByUser?: ShipmentUserInfo;

  modifiedByUser?: ShipmentUserInfo;

  // Products (with allocatedQuantity and allocatedPrice when part of shipment)
  products?: ProductResponseModel[];

  // Packages (with quantityUsed and totalCost when part of shipment)
  packages?: PackageResponseModel[];

  // Return shipments for this shipment
  returnShipments?: ReturnShipmentData[];
}

/**
 * User info nested in shipment response
 */
export interface ShipmentUserInfo {
  userId?: number;
  firstName?: string;
  lastName?: string;
  loginName?: string;
  email?: string;
}

/**
 * Package Product Response Data
 * Matches: ShipmentResponseModel.PackageProductResponseData.java
 */
export interface PackageProductResponseData {
  shipmentPackageProductId?: number;
  productId?: number;
  product?: ProductResponseModel;
  quantity?: number;
}

/**
 * ShipRocket status values matching database constraint
 * CHECK (shipRocketStatus IN ('NEW', 'READY_TO_SHIP', 'PICKUP_SCHEDULED', 'PICKED_UP',
 *   'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RTO_INITIATED',
 *   'RTO_DELIVERED', 'CANCELLED', 'PENDING', 'FAILED'))
 */
export type ShipRocketStatus =
  | "NEW"
  | "READY_TO_SHIP"
  | "PICKUP_SCHEDULED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "RTO_INITIATED"
  | "RTO_DELIVERED"
  | "CANCELLED"
  | "PENDING"
  | "FAILED"
  | "FULL_RETURN_INITIATED"
  | "PARTIAL_RETURN_INITIATED";

/**
 * Return shipment data
 */
export interface ReturnShipmentData {
  returnShipmentId?: number;
  shipmentId?: number;
  returnType?: "FULL_RETURN" | "PARTIAL_RETURN";
  shipRocketReturnOrderId?: string;
  shipRocketReturnShipmentId?: number;
  shipRocketReturnStatus?: string;
  shipRocketReturnStatusCode?: number;
  shipRocketReturnAwbCode?: string;
  shipRocketReturnAwbMetadata?: string;
  shipRocketReturnOrderMetadata?: string;
  returnWeightKgs?: number;
  returnLength?: number;
  returnBreadth?: number;
  returnHeight?: number;
  products?: ReturnProductData[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Return product data
 */
export interface ReturnProductData {
  returnShipmentProductId?: number;
  productId?: number;
  returnQuantity?: number;
  returnReason?: string;  // Return reason string - can be any value from RETURN_REASON_OPTIONS
  returnComments?: string;
  productName?: string;
  productSku?: string;
  productSellingPrice?: number;
}
