/**
 * API Models
 * Type definitions for API request and response models
 * Organized by domain/entity
 */

// Address Models
export type {
  AddressRequestModel,
  AddressResponseModel,
} from "./AddressModels";

// Lead Models
export type {
  BulkLeadInsertResponseModel,
  BulkLeadResult,
  LeadDetailsResponseModel,
  LeadRequestModel,
  LeadResponseModel,
  LeadUserInfo,
} from "./LeadModels";

// Login Models
export type {
  ClientResponseModel,
  ErrorResponseModel,
  LoginRequestModel,
  TokenResponseModel,
} from "./LoginModels";

// Message Models
export type {
  MessageReadStatus,
  MessageRequestModel,
  MessageResponseModel,
} from "./MessageModels";

// Package Models
export type {
  PackageData,
  PackagePickupLocationMappingRequestModel,
  PackagePickupLocationMappingResponseModel,
  PackageRequestModel,
  PackageResponseModel,
  PackageType,
} from "./PackageModels";

// Product Models
export type {
  BulkProductInsertResponseModel,
  BulkProductResult,
  ProductCategoryResponseModel,
  ProductDetailsResponseModel,
  ProductRequestModel,
  ProductResponseModel,
} from "./ProductModels";

// Promo Models
export type {
  BulkPromoInsertResponseModel,
  BulkPromoResult,
  PromoDetailsResponseModel,
  PromoRequestModel,
  PromoResponseModel,
} from "./PromoModels";

// Purchase Order Models
export type {
  CourierSelectionData,
  CourierSelectionResponseData,
  OrderSummaryData,
  OrderSummaryResponseData,
  PackageProductData,
  PaymentResponseModel,
  PickupLocationResponseModel,
  ProductImageInfo,
  PurchaseOrderProductItem,
  PurchaseOrderProductItemRequest,
  PurchaseOrderRequestModel,
  PurchaseOrderResponseModel,
  ResourceResponseModel,
  ShipmentPackageData,
  ShipmentProductData,
  ShipmentResponseData,
} from "./PurchaseOrderModels";

// Re-export PurchaseOrderFormData from validationSchemas (inferred from Zod schema)
export type { PurchaseOrderFormData } from "../../utils/validationSchemas";

// Todo Models
export type { TodoRequestModel, TodoResponseModel } from "./TodoModels";

// Shipment Models
export type {
  PackageProductResponseData,
  ShipRocketStatus,
  ShipmentData,
  ShipmentUserInfo,
  ReturnShipmentData,
  ReturnProductData,
  ReturnReasonType,
} from "./ShipmentModels";

// User Models
export type {
  FilterCondition,
  PaginationBaseResponseModel,
  UserGroupResponseModel,
  UserPermissionInfo,
  UserRequestModel,
  UserResponseModel,
} from "./UserModels";
