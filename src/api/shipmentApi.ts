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
};

export default shipmentApi;
