import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import type { ZodType } from "zod";

import {
  Cancel as CancelIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  GridOn as GridIcon,
  Code as JsonIcon,
  Send as SendIcon,
} from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  Container,
  Divider,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import type {
  GridColDef,
  GridColumnVisibilityModel,
  GridSlotsComponent,
  GridToolbarProps,
} from "@mui/x-data-grid";

import { leadApi } from "../../api/leadApi";
import { productApi } from "../../api/productApi";
import { purchaseOrderApi } from "../../api/purchaseOrderApi";
import { convertImageUrlToBase64 } from "../../utils/imageUtils";
import shippingApi, {
  type CourierOption,
  type OptimizationShipment,
  type OrderOptimizationRequest,
  type OrderOptimizationResponse,
} from "../../api/shippingApi";
import { ImportInstructions } from "../../components";
import { BlueButton, LinkButton, RedButton } from "../../components/buttons";
import {
  ErrorDetailsModal,
  GridDensity,
  LogicOperator,
  SimpleToolbar,
  StyledDataGrid,
  TableAsJson,
  type ColumnGroup,
  type FilterGroup,
  type GridDensityType,
} from "../../components/datagrid";
import { BodyText, SecondaryFont, Subheader } from "../../components/fonts";
import { FileDropZone, SelectInput } from "../../components/form-input";
import {
  DEFAULT_MAX_RECORDS,
  MAX_RECORDS_OPTIONS,
} from "../../constants/appConstants";
import { APP_ROUTES } from "../../constants/routes";
import { getLeadGridColumns, type LeadResponseModel } from "../../models";
import {
  type OrderSummaryResponseData,
  type PurchaseOrderRequestModel,
  type ShipmentResponseData,
} from "../../models/api-models";
import {
  getPurchaseOrderImportPreviewColumns,
  parseProductsString,
  purchaseOrderImportHeaderNames,
  purchaseOrderImportTemplateStructure,
  type ImportPurchaseOrderData,
  type ImportRowShippingResult,
} from "../../models/bulk-import-models/ImportPurchaseOrderGridModel";
import {
  getProductGridColumns,
  type ProductData,
} from "../../models/grid-models/ProductGridColumns";
import {
  type ProductItemForAllocation,
  type SelectedShippingResult,
} from "../../models/purchase-order-components/PurchaseOrderComponentModels";
import styles from "../../styles/PurchaseOrders.module.scss";
import { type PaginatedGridInterface } from "../../types/grid.types";
import { downloadImportTemplate, parseImportFile } from "../../utils/gridUtil";
import {
  bulkPurchaseOrderImportSchema as rawBulkPurchaseOrderImportSchema,
  type BulkPurchaseOrderImportData,
} from "../../utils/validationSchemas";
import ProductModal from "../pickupLocations/components/ProductModal";
import {
  CalculateAllShippingButton,
  FillImportTestDataButton,
} from "./components";
import FinancialsModal from "./components/FinancialsModal";
import ShipmentsModal from "./components/ShipmentsModal";
import ShippingOptimizationModal from "./components/ShippingOptimizationModal";

// Validator for purchase order import rows
const bulkPurchaseOrderImportValidator =
  rawBulkPurchaseOrderImportSchema as unknown as ZodType<BulkPurchaseOrderImportData>;

/**
 * Convert ImportPurchaseOrderData to PurchaseOrderRequestModel for API
 */
const mapToApiPayload = (
  data: ImportPurchaseOrderData
): PurchaseOrderRequestModel => {
  const products = parseProductsString(data.products);
  const shippingResult = data.shippingResult;

  // Calculate financial values
  const productsSubtotal =
    shippingResult?.productsSubtotal ??
    products.reduce((sum, p) => sum + p.pricePerUnit * p.quantity, 0);
  const packagingFee = shippingResult?.totalPackagingCost ?? 0;
  const totalShipping = shippingResult?.totalShippingCost ?? 0;
  const serviceFee = shippingResult?.serviceFee ?? 0;
  const grandTotal =
    shippingResult?.grandTotal ??
    productsSubtotal + packagingFee + totalShipping + serviceFee;

  // Build a map of productId -> pricePerUnit from Excel import for consistent pricing
  const productPriceMap = new Map<number, number>();
  products.forEach((p) => {
    productPriceMap.set(p.productId, p.pricePerUnit);
  });

  // Build shipments from rawShipments (has detailed product and package data)
  const shipments: PurchaseOrderRequestModel["shipments"] =
    shippingResult?.rawShipments?.map((shipment, index) => {
      const selectedCourier = shippingResult.courierSelections?.get(index);

      // Calculate expectedDeliveryDate (required)
      const expectedDeliveryDate = (() => {
        // Try edd from courier
        if (selectedCourier?.edd) {
          return new Date(selectedCourier.edd).toISOString();
        }
        // Try estimatedDeliveryDays
        if (selectedCourier?.estimatedDeliveryDays) {
          const days = parseInt(String(selectedCourier.estimatedDeliveryDays), 10);
          if (!isNaN(days)) {
            const date = new Date();
            date.setDate(date.getDate() + days);
            return date.toISOString();
          }
        }
        // Fallback: 7 days from now
        const fallbackDate = new Date();
        fallbackDate.setDate(fallbackDate.getDate() + 7);
        return fallbackDate.toISOString();
      })();

      // Extract minWeight (required)
      const courierMinWeight = selectedCourier?.minWeight ?? 0;

      return {
        pickupLocationId: shipment.pickupLocation?.pickupLocationId ?? 0,
        totalWeightKgs: shipment.totalWeightKgs ?? 0,
        totalQuantity: shipment.totalQuantity ?? 0,
        expectedDeliveryDate, // Required
        packagingCost: shipment.packagingCost ?? 0,
        shippingCost: selectedCourier?.rate ?? 0,
        totalCost: (shipment.packagingCost ?? 0) + (selectedCourier?.rate ?? 0),
        selectedCourier: selectedCourier
          ? {
              courierCompanyId: selectedCourier.courierCompanyId,
              courierName: selectedCourier.courierName,
              courierRate: selectedCourier.rate,
              courierMinWeight, // Required: courier minimum weight
              // Store full courier option as JSON string for API (required)
              courierMetadata: JSON.stringify(selectedCourier),
            }
          : {
              courierCompanyId: 0,
              courierName: 'Pending',
              courierRate: 0,
              courierMinWeight: 0,
              courierMetadata: '{}',
            },
        products:
          shipment.products?.map((p) => ({
            productId: p.product.productId,
            allocatedQuantity: p.allocatedQuantity,
            // Always use custom price from Excel import (pricePerUnit)
            // No fallback to Product default pricing
            allocatedPrice: productPriceMap.get(p.product.productId) ?? 0,
          })) ?? [],
        packages:
          shipment.packagesUsed?.map((pkg) => ({
            packageId: pkg.packageInfo?.packageId ?? 0,
            quantityUsed: pkg.quantityUsed,
            totalCost: pkg.totalCost ?? 0,
            products:
              pkg.productDetails?.map((pd) => ({
                productId: pd.productId,
                quantity: pd.quantity,
              })) ?? [],
          })) ?? [],
      };
    }) ?? [];

  // Validate and cast priority to allowed values
  const priorityUpper = data.priority.toUpperCase();
  const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
  const priority = validPriorities.includes(
    priorityUpper as (typeof validPriorities)[number]
  )
    ? (priorityUpper as "LOW" | "MEDIUM" | "HIGH" | "URGENT")
    : "MEDIUM";

  return {
    vendorNumber: data.vendorNumber,
    purchaseOrderStatus: data.purchaseOrderStatus.toUpperCase(),
    assignedLeadId: data.assignedLeadId,
    products,
    orderSummary: {
      productsSubtotal,
      totalDiscount: 0,
      packagingFee,
      totalShipping,
      serviceFee,
      gstPercentage: 0,
      gstAmount: 0,
      grandTotal,
      pendingAmount: grandTotal,
      expectedDeliveryDate: data.expectedDeliveryDate,
      priority,
      notes: data.notes,
      termsConditionsHtml: data.termsConditionsHtml,
      address: {
        streetAddress: data.streetAddress,
        streetAddress2: data.streetAddress2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        addressType: data.addressType,
        nameOnAddress: data.nameOnAddress,
        phoneOnAddress: data.phoneOnAddress,
        emailOnAddress: data.emailOnAddress,
      },
    },
    shipments,
  };
};

/**
 * Import Purchase Orders Page
 * Features:
 * - Download Excel template
 * - Upload Excel/CSV files
 * - Preview data in grid or JSON format
 * - Set max records limit
 * - Validate and submit bulk import
 */
const ImportPurchaseOrders = (): React.JSX.Element => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportPurchaseOrderData[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "json">("grid");
  const [maxRecords, setMaxRecords] = useState<number>(
    DEFAULT_MAX_RECORDS as number
  );
  const [isLoading, setIsLoading] = useState(false);
  const [jsonPreview, setJsonPreview] = useState<string>("");

  // Error modal state
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [selectedRowErrors, setSelectedRowErrors] = useState<string[]>([]);
  const [selectedRowNumber, setSelectedRowNumber] = useState<number | null>(
    null
  );

  // Products modal state
  const [productsModalOpen, setProductsModalOpen] = useState(false);
  const [selectedProductsForModal, setSelectedProductsForModal] = useState<
    Array<{ productId: number; quantity: number; pricePerUnit: number }>
  >([]);

  // Shipping optimization modal state
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [currentShippingRowNumber, setCurrentShippingRowNumber] = useState<
    number | null
  >(null);
  const [currentShippingRow, setCurrentShippingRow] =
    useState<ImportPurchaseOrderData | null>(null);
  const [optimizationResult, setOptimizationResult] =
    useState<OrderOptimizationResponse | null>(null);
  const [productItemsForShipping, setProductItemsForShipping] = useState<
    ProductItemForAllocation[]
  >([]);
  const [currentProductsSubtotal, setCurrentProductsSubtotal] =
    useState<number>(0);

  // Service fee dialog state (shown after shipping confirmation)
  // Service fee state for import flow (managed separately from shipping modal)
  const [serviceFeeValue, setServiceFeeValue] = useState<number>(0);

  // Shipments modal state (for import preview) - uses same format as PurchaseOrders page
  const [shipmentsModalOpen, setShipmentsModalOpen] = useState(false);
  const [selectedShipments, setSelectedShipments] = useState<
    ShipmentResponseData[]
  >([]);

  // Financials modal state
  const [financialsModalOpen, setFinancialsModalOpen] = useState(false);
  const [selectedOrderSummary, setSelectedOrderSummary] =
    useState<OrderSummaryResponseData | null>(null);
  const [selectedShipmentsCount, setSelectedShipmentsCount] = useState(0);

  // Leads state (server-side pagination) - for reference
  const [leads, setLeads] = useState<LeadResponseModel[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsTotalCount, setLeadsTotalCount] = useState(0);
  const [leadsPaginationModel, setLeadsPaginationModel] =
    useState<PaginatedGridInterface>({
      start: 0,
      end: 10,
      pageSize: 10,
      includeDeleted: false,
      actualDataCount: 0,
      totalPaginationBlockCount: 0,
    });
  const [leadsActiveFilterGroup, setLeadsActiveFilterGroup] =
    useState<FilterGroup>({
      logicOperator: LogicOperator.AND,
      filters: [],
    });
  const [leadsDensity, setLeadsDensity] = useState<GridDensityType>(
    GridDensity.STANDARD
  );
  const [leadsColumnVisibility, setLeadsColumnVisibility] =
    useState<GridColumnVisibilityModel>({
      isDeleted: false,
      leadId: true, // Show leadId column for import reference
    });

  // Products state (server-side pagination) - for reference
  const [productRows, setProductRows] = useState<ProductData[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productTotalCount, setProductTotalCount] = useState(0);
  const [productDensity, setProductDensity] = useState<GridDensityType>(
    GridDensity.STANDARD
  );
  const [productColumnVisibility, setProductColumnVisibility] =
    useState<GridColumnVisibilityModel>({
      // All columns visible by default (actions column is removed entirely from columns array)
    });
  const [productActiveFilterGroup, setProductActiveFilterGroup] =
    useState<FilterGroup>({
      logicOperator: LogicOperator.AND,
      filters: [],
    });
  const [productPaginationModel, setProductPaginationModel] =
    useState<PaginatedGridInterface>({
      start: 0,
      end: 10,
      pageSize: 10,
      includeDeleted: false,
      actualDataCount: 0,
      totalPaginationBlockCount: 0,
    });

  /**
   * Download Excel template with merged category headers
   */
  const handleDownloadTemplate = (): void => {
    try {
      downloadImportTemplate({
        templateStructure: purchaseOrderImportTemplateStructure,
        fileName: "purchase_order_import_template.xlsx",
        sheetName: "PurchaseOrders",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to download template";
      toast.error(message);
    }
  };

  /**
   * Parse Excel/CSV file
   * Uses ExcelRowParser for dynamic column mapping
   * Validates using Zod schema
   */
  const parseFile = useCallback(
    (file: File): void => {
      setIsLoading(true);

      void parseImportFile<
        ImportPurchaseOrderData,
        BulkPurchaseOrderImportData
      >({
        file,
        templateStructure: purchaseOrderImportTemplateStructure,
        headerNames: purchaseOrderImportHeaderNames,
        maxRecords,
        validator: bulkPurchaseOrderImportValidator,
        createRowData: ({ rowNumber, getOptionalValue, getRequiredValue }) => {
          // Order Information
          const vendorNumber = getRequiredValue("vendorNumber");
          const purchaseOrderStatus = getRequiredValue("purchaseOrderStatus");
          const priority = getRequiredValue("priority");
          const assignedLeadIdRaw = getOptionalValue("assignedLeadId");

          // Delivery Address
          const addressType = getOptionalValue("addressType");
          const streetAddress = getRequiredValue("streetAddress");
          const streetAddress2 = getOptionalValue("streetAddress2");
          const city = getRequiredValue("city");
          const state = getRequiredValue("state");
          const postalCode = getRequiredValue("postalCode");
          const country = getRequiredValue("country");
          const nameOnAddress = getOptionalValue("nameOnAddress");
          const phoneOnAddress = getOptionalValue("phoneOnAddress");
          const emailOnAddress = getOptionalValue("emailOnAddress");

          // Order Details
          const expectedDeliveryDate = getOptionalValue("expectedDeliveryDate");
          const notes = getOptionalValue("notes");
          const termsConditionsHtml = getOptionalValue("termsConditionsHtml");

          // Products
          const products = getRequiredValue("products");

          // Attachments (comma-separated URLs)
          const attachments = getOptionalValue("attachments");

          // Parse assigned lead ID
          const assignedLeadId = assignedLeadIdRaw
            ? parseInt(String(assignedLeadIdRaw), 10)
            : undefined;

          // Create validation payload for Zod schema
          const validationPayload: BulkPurchaseOrderImportData = {
            vendorNumber: String(vendorNumber || ""),
            purchaseOrderStatus: String(purchaseOrderStatus || ""),
            priority: String(priority || ""),
            assignedLeadId: assignedLeadIdRaw
              ? Number(assignedLeadIdRaw)
              : null,
            streetAddress: String(streetAddress || ""),
            streetAddress2: streetAddress2 ? String(streetAddress2) : "",
            city: String(city || ""),
            state: String(state || ""),
            postalCode: String(postalCode || ""),
            country: String(country || ""),
            nameOnAddress: nameOnAddress ? String(nameOnAddress) : "",
            phoneOnAddress: phoneOnAddress ? String(phoneOnAddress) : "",
            emailOnAddress: emailOnAddress ? String(emailOnAddress) : "",
            expectedDeliveryDate: expectedDeliveryDate
              ? String(expectedDeliveryDate)
              : "",
            notes: notes ? String(notes) : "",
            termsConditionsHtml: termsConditionsHtml
              ? String(termsConditionsHtml)
              : "",
            products: String(products || ""),
          };

          const parsedRow: ImportPurchaseOrderData = {
            id: rowNumber,
            rowNumber,
            validationErrors: [],
            vendorNumber: String(vendorNumber || ""),
            purchaseOrderStatus: String(purchaseOrderStatus || ""),
            priority: String(priority || ""),
            assignedLeadId: !isNaN(assignedLeadId ?? NaN)
              ? assignedLeadId
              : undefined,
            addressType: addressType ? String(addressType) : "SHIPPING", // Default to SHIPPING if not provided
            streetAddress: String(streetAddress || ""),
            streetAddress2: streetAddress2 ? String(streetAddress2) : undefined,
            city: String(city || ""),
            state: String(state || ""),
            postalCode: String(postalCode || ""),
            country: String(country || ""),
            nameOnAddress: nameOnAddress ? String(nameOnAddress) : undefined,
            phoneOnAddress: phoneOnAddress ? String(phoneOnAddress) : undefined,
            emailOnAddress: emailOnAddress ? String(emailOnAddress) : undefined,
            expectedDeliveryDate: expectedDeliveryDate
              ? String(expectedDeliveryDate)
              : undefined,
            notes: notes ? String(notes) : undefined,
            termsConditionsHtml: termsConditionsHtml
              ? String(termsConditionsHtml)
              : undefined,
            products: String(products || ""),
            attachments: attachments ? String(attachments) : undefined,
          };

          /* eslint-disable @typescript-eslint/no-unsafe-assignment */
          const result: {
            parsedRow: ImportPurchaseOrderData;
            validationPayload: BulkPurchaseOrderImportData;
          } = {
            parsedRow,
            validationPayload,
          };
          /* eslint-enable @typescript-eslint/no-unsafe-assignment */
          return result;
        },
      })
        .then((results) => {
          setImportData(
            results.map(
              (result): ImportPurchaseOrderData => ({
                ...result.data,
                validationErrors:
                  result.errors && result.errors.length > 0
                    ? result.errors
                    : [],
              })
            )
          );
          toast.success(`Parsed ${results.length} records successfully!`);
        })
        .catch((error) => {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to parse file. Please check the format.";
          toast.error(message);
          if (message.includes("maximum allowed")) {
            setFile(null);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [maxRecords]
  );

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(
    (selectedFile: File): void => {
      setFile(selectedFile);
      parseFile(selectedFile);
    },
    [parseFile]
  );

  /**
   * Clear uploaded file and data
   */
  const handleFileClear = useCallback((): void => {
    setFile(null);
    setImportData([]);
  }, []);

  /**
   * Fetch leads (server-side pagination) - for Lead ID reference
   */
  const fetchLeads = useCallback(async (): Promise<void> => {
    setLeadsLoading(true);
    try {
      const response = await leadApi.getLeadsInBatches({
        start: leadsPaginationModel.start,
        end: leadsPaginationModel.end,
        pageSize: leadsPaginationModel.pageSize,
        includeDeleted: false,
        logicOperator: leadsActiveFilterGroup.logicOperator,
        filters: leadsActiveFilterGroup.filters as never,
      });

      setLeads(response.data as LeadResponseModel[]);
      setLeadsTotalCount(response.totalDataCount);
    } catch {
      toast.error("Failed to fetch leads");
      setLeads([]);
      setLeadsTotalCount(0);
    } finally {
      setLeadsLoading(false);
    }
  }, [leadsPaginationModel, leadsActiveFilterGroup]);

  /**
   * Fetch products (server-side pagination) - for Product ID reference
   */
  const fetchProducts = useCallback(async (): Promise<void> => {
    setProductLoading(true);
    try {
      const response = await productApi.getProductsInBatches({
        start: productPaginationModel.start,
        end: productPaginationModel.end,
        pageSize: productPaginationModel.pageSize,
        filters: productActiveFilterGroup.filters,
        logicOperator: productActiveFilterGroup.logicOperator,
        includeDeleted: false,
      });
      setProductRows(response.data as ProductData[]);
      setProductTotalCount(response.totalDataCount ?? 0);
    } catch {
      toast.error("Failed to fetch products");
    } finally {
      setProductLoading(false);
    }
  }, [productPaginationModel, productActiveFilterGroup]);

  /**
   * Generate JSON structure for API
   */
  const generateImportJSON = useCallback((): PurchaseOrderRequestModel[] => {
    return importData.map(mapToApiPayload);
  }, [importData]);

  // Generate JSON preview when switching to JSON view
  useEffect(() => {
    if (viewMode === "json" && importData.length > 0) {
      const json = generateImportJSON();
      setJsonPreview(JSON.stringify(json, null, 2));
    }
  }, [viewMode, importData, generateImportJSON]);

  const jsonPreviewData = useMemo<unknown>(() => {
    if (!jsonPreview) {
      return [];
    }

    try {
      return JSON.parse(jsonPreview) as PurchaseOrderRequestModel[];
    } catch {
      return [];
    }
  }, [jsonPreview]);

  /**
   * Submit bulk import to API
   */
  const handleSubmit = async (): Promise<void> => {
    if (importData.length === 0) {
      toast.error("No data to import");
      return;
    }

    // Check for errors and pending shipping
    if (!canSubmit) {
      if (hasValidationErrors) {
        toast.error("Please fix validation errors before submitting");
      } else if (pendingShippingCount > 0) {
        toast.error("Please calculate shipping for all rows before submitting");
      }
      return;
    }

    setIsLoading(true);
    try {
      // Generate import payload with attachment URL to base64 conversion
      const payload: PurchaseOrderRequestModel[] = await Promise.all(
        importData.map(async (data) => {
          // Get base payload from mapToApiPayload
          const basePayload = mapToApiPayload(data);

          // Convert attachment URLs to base64 if provided
          let attachments: Record<string, string> | undefined;
          if (data.attachments) {
            // Parse comma-separated URLs
            const urls = data.attachments
              .split(",")
              .map((url) => url.trim())
              .filter(Boolean);

            if (urls.length > 0) {
              attachments = {};
              // Convert each URL to base64 in parallel
              const conversions = await Promise.all(
                urls.map(async (url, index) => {
                  const base64 = await convertImageUrlToBase64(url);
                  if (base64) {
                    // Generate unique filename for each attachment
                    // For picsum URLs like https://picsum.photos/seed/xxx/800/600, extract the seed
                    // Otherwise use the last meaningful part of the URL
                    let fileName = `attachment_${index + 1}.jpg`;
                    try {
                      const urlObj = new URL(url);
                      const pathParts = urlObj.pathname.split("/").filter(Boolean);

                      // Check if it's a picsum URL with seed
                      if (url.includes("picsum.photos") && pathParts.includes("seed")) {
                        const seedIndex = pathParts.indexOf("seed");
                        if (seedIndex >= 0 && pathParts[seedIndex + 1]) {
                          fileName = `${pathParts[seedIndex + 1]}.jpg`;
                        }
                      } else {
                        // For other URLs, try to get a meaningful filename
                        const lastPart = pathParts[pathParts.length - 1];
                        if (lastPart && lastPart.includes(".")) {
                          fileName = lastPart;
                        } else if (lastPart && isNaN(Number(lastPart))) {
                          fileName = `${lastPart}.jpg`;
                        }
                      }
                    } catch {
                      // Keep default filename if URL parsing fails
                    }
                    return { fileName, base64 };
                  }
                  return null;
                })
              );

              // Build attachments map from successful conversions
              for (const conversion of conversions) {
                if (conversion) {
                  attachments[conversion.fileName] = conversion.base64;
                }
              }

              // Only include if we have at least one attachment
              if (Object.keys(attachments).length === 0) {
                attachments = undefined;
              }
            }
          }

          return {
            ...basePayload,
            attachments,
          };
        })
      );

      // Call bulk create API
      await purchaseOrderApi.bulkCreatePurchaseOrders(payload);

      // Show success message
      toast.success(
        `Bulk import started for ${importData.length} purchase orders! You will receive a message with the results when processing completes.`
      );

      // Navigate to purchase orders page
      navigate(APP_ROUTES.DASHBOARD.PURCHASE_ORDERS);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to import purchase orders";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewErrorClick = useCallback(
    (errors: string[], rowNumber: number): void => {
      setSelectedRowErrors(errors);
      setSelectedRowNumber(rowNumber);
      setErrorModalOpen(true);
    },
    []
  );

  const handlePreviewProductsClick = useCallback(
    (
      _rowNumber: number,
      products: Array<{
        productId: number;
        quantity: number;
        pricePerUnit: number;
      }>
    ): void => {
      setSelectedProductsForModal(products);
      setProductsModalOpen(true);
    },
    []
  );

  /**
   * Handle Calculate Shipping button click
   * Opens the shipping optimization modal and calculates shipping for the row
   */
  const handleCalculateShippingClick = useCallback(
    async (rowNumber: number, row: ImportPurchaseOrderData): Promise<void> => {
      const products = parseProductsString(row.products);
      if (products.length === 0) {
        toast.error("No products in this row");
        return;
      }

      if (!row.postalCode || row.postalCode.trim() === "") {
        toast.error("Postal code is required for shipping calculation");
        return;
      }

      // Calculate products subtotal from Excel data (quantity × pricePerUnit)
      const productsSubtotal = products.reduce(
        (sum, p) => sum + p.quantity * p.pricePerUnit,
        0
      );
      setCurrentProductsSubtotal(productsSubtotal);

      setCurrentShippingRowNumber(rowNumber);
      setCurrentShippingRow(row);
      setShippingLoading(true);
      setShippingModalOpen(true);

      try {
        // Build product quantities map
        const productQuantities: Record<number, number> = {};
        for (const product of products) {
          productQuantities[product.productId] = product.quantity;
        }

        // Build request
        const request: OrderOptimizationRequest = {
          productQuantities,
          deliveryPostcode: row.postalCode,
          isCod: false,
        };

        // Call optimization API
        const response = await shippingApi.optimizeOrder(request);
        setOptimizationResult(response);

        // Build product items for modal (need to fetch product details)
        const productItems: ProductItemForAllocation[] = products.map((p) => ({
          productId: p.productId,
          title: `Product ${p.productId}`,
          quantity: p.quantity,
        }));
        setProductItemsForShipping(productItems);
      } catch (error) {
        setShippingModalOpen(false);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to calculate shipping";
        toast.error(errorMessage);
      } finally {
        setShippingLoading(false);
      }
    },
    []
  );

  /**
   * Handle shipping confirmation from the optimization modal
   * Shows service fee dialog before finalizing
   */
  const handleShippingConfirm = useCallback(
    (result: SelectedShippingResult): void => {
      if (currentShippingRowNumber === null) return;

      // Build shipping result for the row - use serviceFeeValue from state (entered in the modal)
      const shipments =
        result.optimizationResult.shipments?.map((shipment, index) => {
          const courier = result.courierSelections.get(index);
          // Parse estimatedDeliveryDays from string to number if needed
          const estimatedDays = courier?.estimatedDeliveryDays;
          const estimatedDeliveryDays =
            typeof estimatedDays === "string"
              ? parseInt(estimatedDays, 10) || undefined
              : estimatedDays;

          return {
            pickupLocationId: shipment.pickupLocation?.pickupLocationId ?? 0,
            pickupLocationName: shipment.pickupLocation?.addressNickName,
            totalWeightKgs: shipment.totalWeightKgs,
            totalQuantity: shipment.totalQuantity,
            productsCount: shipment.products?.length ?? 0,
            packagesCount: shipment.packagesUsed?.length ?? 0,
            packagingCost: shipment.packagingCost,
            shippingCost: courier?.rate ?? 0,
            courierName: courier?.courierName,
            estimatedDeliveryDays,
          };
        }) ?? [];

      // Build a map of productId to full product data for image enrichment
      const productDataMap = new Map<number, ProductData>();
      productRows.forEach((p) => {
        const id = p.productId ?? p.product?.productId;
        if (id) {
          productDataMap.set(id, p);
        }
      });

      // Enrich raw shipments with full product image data from products state
      const enrichedRawShipments = result.optimizationResult.shipments?.map(
        (shipment) => ({
          ...shipment,
          products: shipment.products.map((prodAlloc) => {
            const fullProduct = productDataMap.get(prodAlloc.product.productId);
            return {
              ...prodAlloc,
              product: {
                ...prodAlloc.product,
                // Merge full image URLs from products state if available
                topImageUrl:
                  fullProduct?.topImageUrl ?? fullProduct?.product?.topImageUrl,
                bottomImageUrl:
                  fullProduct?.bottomImageUrl ??
                  fullProduct?.product?.bottomImageUrl,
                frontImageUrl:
                  fullProduct?.frontImageUrl ??
                  fullProduct?.product?.frontImageUrl,
                backImageUrl:
                  fullProduct?.backImageUrl ??
                  fullProduct?.product?.backImageUrl,
                rightImageUrl:
                  fullProduct?.rightImageUrl ??
                  fullProduct?.product?.rightImageUrl,
                leftImageUrl:
                  fullProduct?.leftImageUrl ??
                  fullProduct?.product?.leftImageUrl,
                detailsImageUrl:
                  fullProduct?.detailsImageUrl ??
                  fullProduct?.product?.detailsImageUrl,
                defectImageUrl:
                  fullProduct?.defectImageUrl ??
                  fullProduct?.product?.defectImageUrl,
                additionalImage1Url:
                  fullProduct?.additionalImage1Url ??
                  fullProduct?.product?.additionalImage1Url,
                additionalImage2Url:
                  fullProduct?.additionalImage2Url ??
                  fullProduct?.product?.additionalImage2Url,
                additionalImage3Url:
                  fullProduct?.additionalImage3Url ??
                  fullProduct?.product?.additionalImage3Url,
              },
            };
          }),
        })
      );

      const shippingResult: ImportRowShippingResult = {
        shipments,
        // Store enriched raw shipments with full product images for ShipmentsModal display
        // Cast to OptimizationShipment[] as we're adding extra image fields that don't affect functionality
        rawShipments: enrichedRawShipments as unknown as OptimizationShipment[],
        courierSelections: result.courierSelections as Map<
          number,
          CourierOption
        >,
        productsSubtotal: currentProductsSubtotal,
        totalShippingCost: result.totalShippingCost,
        totalPackagingCost: result.totalPackagingCost,
        serviceFee: serviceFeeValue,
        grandTotal:
          currentProductsSubtotal +
          result.totalShippingCost +
          result.totalPackagingCost +
          serviceFeeValue,
      };

      // Update the row in importData
      setImportData((prev) =>
        prev.map((row) => {
          if (row.rowNumber === currentShippingRowNumber) {
            return {
              ...row,
              shippingCalculated: true,
              shippingResult,
            };
          }
          return row;
        })
      );

      // Close modal and reset state
      setShippingModalOpen(false);
      setCurrentShippingRowNumber(null);
      setCurrentShippingRow(null);
      setOptimizationResult(null);
      setProductItemsForShipping([]);
      setCurrentProductsSubtotal(0);
      setServiceFeeValue(0); // Reset service fee for next calculation

      toast.success("Shipping calculated successfully!");
    },
    [
      currentShippingRowNumber,
      currentProductsSubtotal,
      serviceFeeValue,
      productRows,
    ]
  );

  /**
   * Handle custom allocation calculation
   */
  const handleCalculateCustom = useCallback(
    async (
      customAllocations: Record<number, Record<number, number>>
    ): Promise<void> => {
      if (!currentShippingRow) return;

      setShippingLoading(true);
      try {
        const request: OrderOptimizationRequest = {
          productQuantities: {},
          deliveryPostcode: currentShippingRow.postalCode,
          isCod: false,
          customAllocations,
        };

        // Build product quantities from allocations
        for (const productId of Object.keys(customAllocations)) {
          let totalQty = 0;
          for (const qty of Object.values(
            customAllocations[Number(productId)]
          )) {
            totalQty += qty;
          }
          request.productQuantities[Number(productId)] = totalQty;
        }

        const response = await shippingApi.optimizeOrder(request);
        setOptimizationResult(response);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to calculate custom shipping";
        toast.error(errorMessage);
      } finally {
        setShippingLoading(false);
      }
    },
    [currentShippingRow]
  );

  /**
   * Handle Shipments badge click - convert to ShipmentResponseData[] and show modal
   */
  const handleShipmentsClick = useCallback(
    (_rowNumber: number, shippingResult: ImportRowShippingResult): void => {
      // Convert raw shipments to ShipmentResponseData format for ShipmentsModal
      // Cast to ShipmentResponseData[] as we're constructing a compatible structure
      const convertedShipments = (shippingResult.rawShipments?.map(
        (shipment, index) => {
          const selectedCourier = shippingResult.courierSelections?.get(index);

          return {
            shipmentId: index + 1, // Use index as shipment ID for import preview
            pickupLocationId: shipment.pickupLocation?.pickupLocationId ?? 0,
            pickupLocation: shipment.pickupLocation
              ? {
                  pickupLocationId: shipment.pickupLocation.pickupLocationId,
                  addressNickName:
                    shipment.pickupLocation.addressNickName ?? "",
                  address: shipment.pickupLocation.address,
                }
              : undefined,
            totalWeightKgs: shipment.totalWeightKgs,
            totalQuantity: shipment.totalQuantity,
            packagingCost: shipment.packagingCost,
            shippingCost: selectedCourier?.rate ?? 0,
            totalCost: shipment.packagingCost + (selectedCourier?.rate ?? 0),
            selectedCourier: selectedCourier
              ? {
                  courierCompanyId: selectedCourier.courierCompanyId,
                  courierName: selectedCourier.courierName,
                  courierRate: selectedCourier.rate,
                  // Include full courier data as metadata for display in ShipmentsModal
                  courierMetadata: JSON.stringify(selectedCourier),
                }
              : undefined,
            products: shipment.products.map((p) => {
              // Cast to access all image URL fields that were enriched
              const productAny = p.product as unknown as Record<
                string,
                unknown
              >;
              return {
                productId: p.product.productId,
                allocatedQuantity: p.allocatedQuantity,
                allocatedPrice: 0,
                product: {
                  productId: p.product.productId,
                  title: p.product.title ?? "Unknown Product",
                  mainImageUrl: p.product.mainImageUrl,
                  weightKgs: p.product.weightKgs,
                  // Include all image URLs for carousel display
                  topImageUrl: productAny.topImageUrl as string | undefined,
                  bottomImageUrl: productAny.bottomImageUrl as
                    | string
                    | undefined,
                  frontImageUrl: productAny.frontImageUrl as string | undefined,
                  backImageUrl: productAny.backImageUrl as string | undefined,
                  rightImageUrl: productAny.rightImageUrl as string | undefined,
                  leftImageUrl: productAny.leftImageUrl as string | undefined,
                  detailsImageUrl: productAny.detailsImageUrl as
                    | string
                    | undefined,
                  defectImageUrl: productAny.defectImageUrl as
                    | string
                    | undefined,
                  additionalImage1Url: productAny.additionalImage1Url as
                    | string
                    | undefined,
                  additionalImage2Url: productAny.additionalImage2Url as
                    | string
                    | undefined,
                  additionalImage3Url: productAny.additionalImage3Url as
                    | string
                    | undefined,
                },
              };
            }),
            packages: shipment.packagesUsed.map((pkg) => ({
              packageId: pkg.packageInfo.packageId,
              quantityUsed: pkg.quantityUsed,
              totalCost: pkg.totalCost,
              packageInfo: {
                packageId: pkg.packageInfo.packageId,
                packageName: pkg.packageInfo.packageName,
                packageType: pkg.packageInfo.packageType ?? "Standard",
                pricePerUnit: pkg.packageInfo.pricePerUnit,
              },
              products:
                pkg.productDetails?.map((pd) => ({
                  productId: pd.productId,
                  quantity: pd.quantity,
                })) ?? [],
            })),
          };
        }
      ) ?? []) as unknown as ShipmentResponseData[];

      setSelectedShipments(convertedShipments);
      setShipmentsModalOpen(true);
    },
    []
  );

  /**
   * Handle Financials chip click - show financial details using FinancialsModal
   * Converts ImportRowShippingResult to OrderSummaryResponseData format
   */
  const handleFinancialsClick = useCallback(
    (_rowNumber: number, shippingResult: ImportRowShippingResult): void => {
      // Convert ImportRowShippingResult to OrderSummaryResponseData format
      const orderSummary: OrderSummaryResponseData = {
        orderSummaryId: 0,
        productsSubtotal: shippingResult.productsSubtotal,
        totalDiscount: 0,
        packagingFee: shippingResult.totalPackagingCost,
        totalShipping: shippingResult.totalShippingCost,
        serviceFee: shippingResult.serviceFee,
        subtotal:
          shippingResult.productsSubtotal +
          shippingResult.totalPackagingCost +
          shippingResult.totalShippingCost,
        gstPercentage: 0,
        gstAmount: 0,
        grandTotal: shippingResult.grandTotal,
        pendingAmount: shippingResult.grandTotal,
        priority: "MEDIUM",
      };

      setSelectedOrderSummary(orderSummary);
      setSelectedShipmentsCount(shippingResult.shipments.length);
      setFinancialsModalOpen(true);
    },
    []
  );

  /**
   * Handle row update from bulk shipping calculation
   * Updates a single row with shipping result
   */
  const handleBulkShippingRowUpdate = useCallback(
    (rowNumber: number, shippingResult: ImportRowShippingResult): void => {
      setImportData((prev) =>
        prev.map((row) => {
          if (row.rowNumber === rowNumber) {
            return {
              ...row,
              shippingCalculated: true,
              shippingResult,
            };
          }
          return row;
        })
      );
    },
    []
  );

  // Fetch leads on mount and when pagination changes
  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  // Fetch products on mount and when pagination changes
  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  // Grid column configurations for Leads grid (for Lead ID reference)
  const leadsColumns = useMemo<GridColDef[]>(() => {
    const noOpToggle = (): void => {
      // Read-only grid, no toggle support required
    };
    const allColumns = getLeadGridColumns(noOpToggle);

    // Filter out actions column (field name is 'actions')
    const filteredColumns = allColumns.filter((col) => col.field !== "actions");

    // Override leadId column configuration
    return filteredColumns.map((col) => {
      if (col.field === "leadId") {
        return {
          ...col,
          width: 80,
          minWidth: 80,
          hideable: true,
          filterable: true,
          headerName: "Lead ID",
          align: "center" as const,
          headerAlign: "center" as const,
          type: "number" as const,
        };
      }
      return col;
    });
  }, []);

  // Product reference columns with productId as first column, actions and returnsAllowed columns removed entirely
  const productColumns = useMemo<GridColDef[]>(() => {
    const baseColumns = getProductGridColumns(
      () => {} // No toggle needed for reference grid
    );
    // Remove actions and returnsAllowed columns entirely (not just hide)
    const filteredColumns = baseColumns.filter(
      (col) => col.field !== "actions" && col.field !== "returnsAllowed"
    );

    // Find existing productId column and move it to first position
    const productIdIndex = filteredColumns.findIndex(
      (col) => col.field === "productId"
    );
    if (productIdIndex > 0) {
      const [productIdCol] = filteredColumns.splice(productIdIndex, 1);
      // Update width and enable filtering for reference grid
      productIdCol.minWidth = 120;
      productIdCol.width = 120;
      productIdCol.filterable = true;
      filteredColumns.unshift(productIdCol);
    } else if (productIdIndex === -1) {
      // Add productId column if not present
      filteredColumns.unshift({
        field: "productId",
        headerName: "Product ID",
        minWidth: 120,
        width: 120,
        headerAlign: "center",
        align: "center",
        filterable: true,
      });
    } else if (productIdIndex === 0) {
      // Column already at first position, just update width and enable filtering
      filteredColumns[0].minWidth = 120;
      filteredColumns[0].width = 120;
      filteredColumns[0].filterable = true;
    }
    return filteredColumns;
  }, []);

  const previewColumns = useMemo<GridColDef[]>(
    () =>
      getPurchaseOrderImportPreviewColumns(
        handlePreviewErrorClick,
        handlePreviewProductsClick,
        (rowNumber, row) => {
          void handleCalculateShippingClick(rowNumber, row);
        },
        handleShipmentsClick,
        handleFinancialsClick
      ),
    [
      handlePreviewErrorClick,
      handlePreviewProductsClick,
      handleCalculateShippingClick,
      handleShipmentsClick,
      handleFinancialsClick,
    ]
  );

  // Column grouping for preview grid (parent headers)
  const columnGroupingModel = useMemo<ColumnGroup[]>(
    () =>
      purchaseOrderImportTemplateStructure.map((section) => ({
        groupId: section.category.toLowerCase().replace(/\s+/g, "-"),
        headerName: section.category,
        children: section.fields,
      })),
    []
  );

  // Validation summary - includes shipping calculation check
  const { hasValidationErrors, errorCount, pendingShippingCount, canSubmit } =
    useMemo((): {
      hasValidationErrors: boolean;
      errorCount: number;
      pendingShippingCount: number;
      canSubmit: boolean;
    } => {
      let errors = 0;
      let pendingShipping = 0;

      for (const row of importData) {
        if (row.validationErrors && row.validationErrors.length > 0) {
          errors += 1;
        } else if (!row.shippingCalculated) {
          pendingShipping += 1;
        }
      }

      return {
        hasValidationErrors: errors > 0,
        errorCount: errors,
        pendingShippingCount: pendingShipping,
        canSubmit:
          errors === 0 && pendingShipping === 0 && importData.length > 0,
      };
    }, [importData]);

  return (
    <>
      {/* Test Data Button - Only show in development */}
      {import.meta.env.DEV && <FillImportTestDataButton />}

      <Container
        maxWidth={false}
        disableGutters
        className={styles["import-purchase-orders-page__page-wrapper"]}
      >
        <Box className={styles["import-purchase-orders-page__container"]}>
          {/* Instructions */}
          <ImportInstructions
            instructions={[
              "Download the template file to see the required format",
              "Fill in your purchase order data following the template structure",
              "Valid statuses: DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, SENT_TO_VENDOR, SHIPPED, COMPLETED, CANCELLED",
              "Valid priorities: LOW, MEDIUM, HIGH, URGENT",
              'Products format: productId:quantity:pricePerUnit (e.g., "123:10:99.99, 456:5:149.50")',
              "Use the reference grids below to find Lead IDs and Product IDs",
              "Upload the file and preview the data",
              "Review and submit the import",
            ]}
          />

          {/* Leads Reference Grid (for Lead IDs) */}
          <Paper
            className={styles["import-purchase-orders-page__reference-card"]}
          >
            <Subheader
              label="Available Leads"
              className={styles["import-purchase-orders-page__section-title"]}
            />
            <Divider
              className={styles["import-purchase-orders-page__divider"]}
            />
            <Box
              className={styles["import-purchase-orders-page__grid-wrapper"]}
            >
              <StyledDataGrid
                dataTestId="leads-reference-grid"
                rows={leads}
                columns={leadsColumns}
                getRowId={(row) => (row as LeadResponseModel).leadId}
                loading={leadsLoading}
                rowCount={leadsTotalCount}
                totalCount={leadsTotalCount}
                paginationModelState={leadsPaginationModel}
                setPaginationModel={setLeadsPaginationModel}
                paginationMode="server"
                filterMode="server"
                sortingMode="server"
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                autoHeight
                density={leadsDensity}
                columnVisibilityModel={leadsColumnVisibility}
                onColumnVisibilityModelChange={setLeadsColumnVisibility}
                slots={{
                  toolbar: SimpleToolbar as GridSlotsComponent["toolbar"],
                }}
                slotProps={{
                  toolbar: {
                    density: leadsDensity,
                    onDensityChange: setLeadsDensity,
                    columns: leadsColumns,
                    rows: leads,
                    hideIncludeDeleted: true,
                    hideExport: false,
                    columnVisibilityModel: leadsColumnVisibility,
                    onColumnVisibilityChange: setLeadsColumnVisibility,
                    onFiltersChange: setLeadsActiveFilterGroup,
                    activeFilterGroup: leadsActiveFilterGroup,
                  } as GridToolbarProps,
                }}
                showToolbar
                disableColumnMenu={false}
              />
            </Box>
          </Paper>

          {/* Products Reference Grid */}
          <Paper
            className={styles["import-purchase-orders-page__reference-card"]}
          >
            <Subheader
              label="Products Reference"
              className={styles["import-purchase-orders-page__section-title"]}
            />
            <Divider
              className={styles["import-purchase-orders-page__divider"]}
            />

            <Box
              className={styles["import-purchase-orders-page__grid-wrapper"]}
            >
              <Box sx={{ width: "100%" }}>
                <StyledDataGrid
                  dataTestId="products-reference-grid"
                  rows={productRows}
                  columns={productColumns}
                  getRowId={(row) => (row as ProductData).productId ?? 0}
                  loading={productLoading}
                  paginationMode="server"
                  filterMode="server"
                  sortingMode="server"
                  totalCount={productTotalCount}
                  paginationModelState={productPaginationModel}
                  setPaginationModel={setProductPaginationModel}
                  pageSizeOptions={[10, 25, 50]}
                  disableRowSelectionOnClick
                  density={productDensity}
                  columnVisibilityModel={productColumnVisibility}
                  onColumnVisibilityModelChange={setProductColumnVisibility}
                  rowHeight={180}
                  autoHeight
                  slots={{
                    toolbar: SimpleToolbar as GridSlotsComponent["toolbar"],
                  }}
                  slotProps={{
                    toolbar: {
                      density: productDensity,
                      onDensityChange: setProductDensity,
                      columns: productColumns,
                      rows: productRows,
                      hideIncludeDeleted: true,
                      hideExport: false,
                      hideFilter: false,
                      hideColumns: false,
                      columnVisibilityModel: productColumnVisibility,
                      onColumnVisibilityChange: setProductColumnVisibility,
                      activeFilterGroup: productActiveFilterGroup,
                      onFiltersChange: setProductActiveFilterGroup,
                    } as GridToolbarProps,
                  }}
                  showToolbar
                  disableColumnMenu={false}
                />
              </Box>
            </Box>
          </Paper>

          {/* Import Settings Card with File Upload */}
          <Paper
            className={styles["import-purchase-orders-page__settings-card"]}
          >
            <Subheader
              label="Import Settings"
              className={styles["import-purchase-orders-page__section-title"]}
            />
            <Divider
              className={styles["import-purchase-orders-page__divider--large"]}
            />

            {/* Top Right - Actions */}
            <Box
              className={
                styles["import-purchase-orders-page__settings-actions"]
              }
            >
              {/* Download Template */}
              <LinkButton
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}
                className={
                  styles["import-purchase-orders-page__template-button"]
                }
                size="small"
                label="Download Template"
              />

              {/* Max Records Dropdown */}
              <SelectInput
                label="Max Records"
                value={maxRecords}
                onChange={(e) => {
                  setMaxRecords(Number(e.target.value));
                }}
                disabled={isLoading}
                options={(MAX_RECORDS_OPTIONS as readonly number[]).map(
                  (value: number) => ({
                    value,
                    label: String(value),
                  })
                )}
                size="small"
                margin="none"
                fullWidth={false}
                className={
                  styles["import-purchase-orders-page__max-records-select"]
                }
              />
            </Box>

            {/* File Upload Area */}
            <FileDropZone
              onFileSelect={handleFileSelect}
              onFileClear={handleFileClear}
              currentFile={file}
              accept=".csv,.xlsx,.xls"
              maxSizeMB={10}
              disabled={isLoading}
              isLoading={isLoading}
            />
          </Paper>

          {/* Loading State - Processing File */}
          {isLoading && importData.length === 0 && (
            <Paper
              className={styles["import-purchase-orders-page__loading-paper"]}
            >
              <Box
                className={
                  styles["import-purchase-orders-page__loading-container"]
                }
              >
                <CircularProgress size={48} />
                <Subheader
                  label="Processing file..."
                  className={
                    styles["import-purchase-orders-page__loading-text"]
                  }
                />
                <SecondaryFont
                  className={
                    styles["import-purchase-orders-page__loading-subtext"]
                  }
                >
                  Parsing and validating data
                </SecondaryFont>
              </Box>
            </Paper>
          )}

          {/* Data Preview */}
          {importData.length > 0 && (
            <Paper
              className={styles["import-purchase-orders-page__preview-paper"]}
            >
              {/* Header with Title */}
              <Subheader
                label={`Data Preview (${importData.length} records)`}
                className={styles["import-purchase-orders-page__section-title"]}
              />
              <Divider
                className={styles["import-purchase-orders-page__divider"]}
              />

              {/* View Toggle and Calculate All Button */}
              <CalculateAllShippingButton.Provider
                importData={importData}
                products={productRows}
                onRowUpdate={handleBulkShippingRowUpdate}
                disabled={isLoading}
              >
                <Box
                  className={
                    styles["import-purchase-orders-page__view-toggle-container"]
                  }
                >
                  <Box
                    className={
                      styles["import-purchase-orders-page__view-toggle-row"]
                    }
                  >
                    <CalculateAllShippingButton.Button />
                    <ToggleButtonGroup
                      value={viewMode}
                      exclusive
                      onChange={(_, newMode: "grid" | "json" | null) => {
                        if (newMode) {
                          setViewMode(newMode);
                        }
                      }}
                      size="small"
                    >
                      <ToggleButton value="grid">
                        <GridIcon fontSize="small" />
                        <BodyText
                          text="Grid"
                          variant="body2"
                          className={
                            styles[
                              "import-purchase-orders-page__toggle-button-text"
                            ]
                          }
                        />
                      </ToggleButton>
                      <ToggleButton value="json">
                        <JsonIcon fontSize="small" />
                        <BodyText
                          text="JSON"
                          variant="body2"
                          className={
                            styles[
                              "import-purchase-orders-page__toggle-button-text"
                            ]
                          }
                        />
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                  <CalculateAllShippingButton.ProgressWrapper />
                </Box>
              </CalculateAllShippingButton.Provider>

              {/* Content Area */}
              {viewMode === "grid" ? (
                <Box
                  className={
                    styles["import-purchase-orders-page__grid-container"]
                  }
                >
                  <StyledDataGrid
                    dataTestId="import-purchase-orders-preview-grid"
                    rows={importData}
                    columns={previewColumns}
                    columnGroupingModel={columnGroupingModel}
                    getRowId={(row) =>
                      (row as unknown as ImportPurchaseOrderData).rowNumber
                    }
                    loading={false}
                    paginationMode="client"
                    filterMode="client"
                    sortingMode="client"
                    pageSizeOptions={[10, 25, 50, 100]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 25 } },
                    }}
                    disableRowSelectionOnClick
                    autoHeight
                    getRowClassName={(params) => {
                      const row =
                        params.row as unknown as ImportPurchaseOrderData;
                      return row.validationErrors &&
                        row.validationErrors.length > 0
                        ? styles["import-purchase-orders-page__error-row"]
                        : "";
                    }}
                    showToolbar={false}
                    disableColumnMenu={false}
                  />
                </Box>
              ) : (
                <Box
                  className={
                    styles["import-purchase-orders-page__json-container"]
                  }
                >
                  <TableAsJson data={jsonPreviewData} showCopyButton />
                </Box>
              )}
            </Paper>
          )}

          {/* Action Buttons */}
          {importData.length > 0 && (
            <Paper
              className={styles["import-purchase-orders-page__actions-card"]}
            >
              {/* Validation Error Warning */}
              {hasValidationErrors && (
                <Box
                  className={
                    styles["import-purchase-orders-page__error-warning"]
                  }
                >
                  <ErrorIcon
                    className={
                      styles["import-purchase-orders-page__error-warning-icon"]
                    }
                  />
                  <Box>
                    <BodyText
                      variant="body2"
                      className={
                        styles[
                          "import-purchase-orders-page__error-warning-text"
                        ]
                      }
                    >
                      <strong>Cannot import data:</strong> {errorCount}{" "}
                      {errorCount === 1 ? "row has" : "rows have"} validation
                      errors.
                    </BodyText>
                    <SecondaryFont
                      className={
                        styles[
                          "import-purchase-orders-page__error-warning-caption"
                        ]
                      }
                    >
                      Please fix all errors before importing. Click on the red
                      error chips to view details.
                    </SecondaryFont>
                  </Box>
                </Box>
              )}

              {/* Pending Shipping Warning */}
              {!hasValidationErrors && pendingShippingCount > 0 && (
                <Box
                  className={
                    styles["import-purchase-orders-page__error-warning"]
                  }
                  sx={{ borderColor: "warning.main" }}
                >
                  <ErrorIcon
                    className={
                      styles["import-purchase-orders-page__error-warning-icon"]
                    }
                    sx={{ color: "warning.main" }}
                  />
                  <Box>
                    <BodyText
                      variant="body2"
                      className={
                        styles[
                          "import-purchase-orders-page__error-warning-text"
                        ]
                      }
                    >
                      <strong>Shipping required:</strong> {pendingShippingCount}{" "}
                      {pendingShippingCount === 1 ? "row needs" : "rows need"}{" "}
                      shipping calculation.
                    </BodyText>
                    <SecondaryFont
                      className={
                        styles[
                          "import-purchase-orders-page__error-warning-caption"
                        ]
                      }
                    >
                      Click the &quot;Calculate&quot; button for each row to
                      calculate shipping before importing.
                    </SecondaryFont>
                  </Box>
                </Box>
              )}

              <Box className={styles["import-purchase-orders-page__actions"]}>
                <RedButton
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    navigate(APP_ROUTES.DASHBOARD.PURCHASE_ORDERS);
                  }}
                  disabled={isLoading}
                  label="Cancel"
                  className={
                    styles["import-purchase-orders-page__action-button"]
                  }
                />
                <BlueButton
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleSubmit}
                  disabled={isLoading || !canSubmit}
                  label={
                    isLoading
                      ? "Importing..."
                      : `Import ${importData.length} Purchase Orders`
                  }
                  className={
                    styles["import-purchase-orders-page__action-button"]
                  }
                />
              </Box>
            </Paper>
          )}
        </Box>
      </Container>

      {/* Error Details Modal */}
      <ErrorDetailsModal
        open={errorModalOpen}
        onClose={() => {
          setErrorModalOpen(false);
        }}
        title="Validation Errors"
        errors={selectedRowErrors}
        rowIdentifier={
          selectedRowNumber !== null ? `Row ${selectedRowNumber}` : undefined
        }
      />

      {/* Products Modal */}
      <ProductModal
        open={productsModalOpen}
        onClose={() => {
          setProductsModalOpen(false);
          setSelectedProductsForModal([]);
        }}
        purchaseOrderProducts={selectedProductsForModal}
      />

      {/* Shipping Optimization Modal */}
      <ShippingOptimizationModal
        open={shippingModalOpen}
        onClose={() => {
          setShippingModalOpen(false);
          setCurrentShippingRowNumber(null);
          setCurrentShippingRow(null);
          setOptimizationResult(null);
          setProductItemsForShipping([]);
          setServiceFeeValue(0); // Reset service fee on close
        }}
        optimizationResult={optimizationResult}
        onConfirm={handleShippingConfirm}
        isLoading={shippingLoading}
        productItems={productItemsForShipping}
        deliveryPostcode={currentShippingRow?.postalCode ?? ""}
        isCod={false}
        onCalculateCustom={handleCalculateCustom}
        showServiceFeeInput={true}
        serviceFee={serviceFeeValue}
        onServiceFeeChange={setServiceFeeValue}
      />

      {/* Shipments Modal - Same as PurchaseOrders page */}
      <ShipmentsModal
        open={shipmentsModalOpen}
        onClose={() => {
          setShipmentsModalOpen(false);
          setSelectedShipments([]);
        }}
        shipments={selectedShipments}
      />

      {/* Financials Modal - Same as PurchaseOrders page */}
      {selectedOrderSummary && (
        <FinancialsModal
          open={financialsModalOpen}
          onClose={() => {
            setFinancialsModalOpen(false);
            setSelectedOrderSummary(null);
            setSelectedShipmentsCount(0);
          }}
          orderSummary={selectedOrderSummary}
          shipmentsCount={selectedShipmentsCount}
        />
      )}
    </>
  );
};

export default ImportPurchaseOrders;
