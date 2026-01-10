/**
 * Product API Models
 * Type definitions for product-related API requests and responses
 */

/**
 * Product Request Model
 * Used for creating and updating products
 */
export interface ProductRequestModel {
  productId?: number;
  title: string;
  descriptionHtml: string;
  length?: number;
  brand: string;
  color: string;
  colorLabel: string;
  condition: string;
  countryOfManufacture: string;
  model?: string;
  itemModified: boolean;
  upc?: string;
  modificationHtml?: string;
  price: number;
  discount: number;
  isDiscountPercent: boolean;
  returnWindowDays: number;  // Number of days from delivery within which returns are allowed (0 = no returns)
  breadth?: number;
  height?: number;
  weightKgs?: number;
  categoryId: number;

  // Required Images (base64 or URL)
  mainImage: string;
  topImage: string;
  bottomImage: string;
  frontImage: string;
  backImage: string;
  rightImage: string;
  leftImage: string;
  detailsImage: string;

  // Optional Images (base64 or URL)
  defectImage?: string;
  additionalImage1?: string;
  additionalImage2?: string;
  additionalImage3?: string;

  // Pickup locations: Map of pickupLocationId to quantity
  pickupLocationQuantities: Record<number, number>;

  notes?: string;

  // Item availability
  itemAvailableFrom: string; // ISO date string
  itemAvailableFromTimezone: string;
}

/**
 * Product Response Model
 * Returned from API when fetching product details
 */
export interface ProductResponseModel {
  productId: number;
  title: string;
  descriptionHtml: string;
  length?: number;
  brand: string;
  color: string;
  colorLabel: string;
  condition: string;
  countryOfManufacture: string;
  model?: string;
  itemModified: boolean;
  upc?: string;
  modificationHtml?: string;
  price: number;
  discount: number;
  isDiscountPercent: boolean;
  returnWindowDays: number;  // Number of days from delivery within which returns are allowed (0 = no returns)
  breadth?: number;
  height?: number;
  weightKgs?: number;
  categoryId: number;
  isDeleted: boolean;

  // Image URLs
  mainImageUrl: string;
  topImageUrl: string;
  bottomImageUrl: string;
  frontImageUrl: string;
  backImageUrl: string;
  rightImageUrl: string;
  leftImageUrl: string;
  detailsImageUrl: string;
  defectImageUrl?: string;
  additionalImage1Url?: string;
  additionalImage2Url?: string;
  additionalImage3Url?: string;

  // Relationships
  category?: {
    categoryId: number;
    name: string;
    fullPath?: string;  // Full hierarchical path e.g., "Electronics > Computers > Laptops"
  };
  pickupLocations?: Array<{
    pickupLocation: {
    pickupLocationId: number;
      addressNickName?: string;
    };
    availableStock: number;
  }>;

  // Audit fields
  createdAt: string;
  createdUser: string;
  updatedAt: string;
  modifiedUser: string;
  notes?: string;

  // Item availability
  itemAvailableFrom: string; // ISO date string
  itemAvailableFromTimezone: string;

  // Created by user details
  createdByUserInfo?: {
    userId: number;
    firstName: string;
    lastName: string;
    loginName: string;
    fullName?: string;
  };

  // Shipment-specific fields (only populated when product is part of a shipment)
  allocatedQuantity?: number;
  allocatedPrice?: number;
}

/**
 * Product Details Response Model
 * Extended response with full details
 */
export interface ProductDetailsResponseModel extends ProductResponseModel {
  // Add any additional fields that come with detailed view
}

/**
 * Bulk Product Insert Response Model
 */
export interface BulkProductInsertResponseModel {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  successes: BulkProductResult[];
  failures: BulkProductResult[];
}

/**
 * Individual result in bulk product operation
 */
export interface BulkProductResult {
  identifier: string;
  productId?: number;
  message?: string;
}

/**
 * Product Category Response Model
 */
export interface ProductCategoryResponseModel {
  categoryId: number;
  name: string;
  description?: string;
  isDeleted: boolean;
}
