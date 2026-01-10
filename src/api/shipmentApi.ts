import { type ShipmentData } from "../models/api-models/ShipmentModels";
import {
  type PaginationBaseRequestModel,
  type PaginationBaseResponseModel,
} from "../types/grid.types";

import axiosInstance from "./axiosConfig";

const API_BASE_URL = "/Shipment";

/**
 * Shipment API Service
 * Handles all shipment-related API calls
 */
export const shipmentApi = {
  /**
   * Get paginated shipments with filtering and sorting
   */
  getShipmentsInBatches: async (
    request: PaginationBaseRequestModel
  ): Promise<PaginationBaseResponseModel<ShipmentData>> => {
    const response = await axiosInstance.post<
      PaginationBaseResponseModel<ShipmentData>
    >(`${API_BASE_URL}/getShipmentsInBatches`, request);
    return response.data;
  },

  /**
   * Get shipment details by ID
   */
  getShipmentById: async (shipmentId: number): Promise<ShipmentData> => {
    const response = await axiosInstance.get<ShipmentData>(
      `${API_BASE_URL}/getShipmentById/${shipmentId}`
    );
    return response.data;
  },

  /**
   * Cancel a shipment
   * Cancels the shipment in ShipRocket and updates local status to CANCELLED
   */
  cancelShipment: async (shipmentId: number): Promise<void> => {
    await axiosInstance.post(`/Shipping/cancelShipment/${shipmentId}`);
  },

  /**
   * Create a return order for a shipment
   * Creates a return shipment in ShipRocket and stores locally
   */
  createReturn: async (request: CreateReturnRequest): Promise<ReturnShipmentResponse> => {
    const response = await axiosInstance.post<ReturnShipmentResponse>(
      `/Shipping/createReturn`,
      request
    );
    return response.data;
  },

  /**
   * Cancel a return shipment
   * Cancels the return order in ShipRocket and updates local status to RETURN_CANCELLED
   */
  cancelReturn: async (returnShipmentId: number): Promise<void> => {
    await axiosInstance.post(`/Shipping/cancelReturn/${returnShipmentId}`);
  },
};

/**
 * Request model for creating a return
 */
export interface CreateReturnRequest {
  shipmentId: number;
  products: ReturnProductItem[];
  length?: number;
  breadth?: number;
  height?: number;
  weight?: number;
}

export interface ReturnProductItem {
  productId: number;
  quantity: number;
  reason: string;  // Return reason string - can be any value from RETURN_REASON_OPTIONS
  comments?: string;
}

export interface ReturnShipmentResponse {
  returnShipmentId: number;
  shipmentId: number;
  returnType: string;
  shipRocketReturnOrderId?: string;
  shipRocketReturnShipmentId?: number;
  shipRocketReturnStatus?: string;
  shipRocketReturnAwbCode?: string;
  products: ReturnProductResponse[];
  createdAt: string;
}

export interface ReturnProductResponse {
  returnShipmentProductId: number;
  productId: number;
  returnQuantity: number;
  returnReason: string;
  returnComments?: string;
  productName: string;
  productSku: string;
  productSellingPrice: number;
}

export default shipmentApi;
