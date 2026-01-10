/**
 * Purchase Order Import Grid Model
 * Configuration for bulk purchase order import template structure and field display
 */

import {
  AccountBalance,
  Calculate as CalculateIcon,
  LocalShipping,
  ShoppingCart,
} from "@mui/icons-material";
import { Badge, Box, Button, Chip, Tooltip } from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import {
  getPriorityColor,
  getPriorityLabel,
  getPurchaseOrderStatusColor,
  getPurchaseOrderStatusLabel,
} from "../../constants/appConstants";
import {
  ColumnType,
  formatValueByType,
  type FieldDisplayConfig,
  type TemplateStructure,
} from "../ImportTemplateStructure";

/**
 * Shipping result stored per row after calculate shipping is confirmed
 */
export interface ImportRowShippingResult {
  shipments: Array<{
    pickupLocationId: number;
    pickupLocationName?: string;
    totalWeightKgs: number;
    totalQuantity: number;
    productsCount: number;
    packagesCount: number;
    packagingCost: number;
    shippingCost: number;
    courierName?: string;
    estimatedDeliveryDays?: number;
  }>;
  /** Raw shipment data from optimization API - used for ShipmentsModal */
  rawShipments?: import('../../api/shippingApi').OptimizationShipment[];
  /** Courier selections from optimization - used for ShipmentsModal */
  courierSelections?: Map<number, import('../../api/shippingApi').CourierOption>;
  productsSubtotal: number; // Sum of (quantity × pricePerUnit) for all products
  totalShippingCost: number;
  totalPackagingCost: number;
  serviceFee: number; // User-entered service fee
  grandTotal: number;
}

/**
 * Purchase Order Import Data Interface
 * Represents a single row in the import spreadsheet
 */
export interface ImportPurchaseOrderData {
  // Internal fields
  id: number;
  rowNumber: number;
  validationErrors: string[];

  // Order Information
  vendorNumber: string;
  purchaseOrderStatus: string;
  priority: string;
  assignedLeadId?: number;

  // Delivery Address
  addressType: string;
  streetAddress: string;
  streetAddress2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  nameOnAddress?: string;
  phoneOnAddress?: string;
  emailOnAddress?: string;

  // Order Details
  expectedDeliveryDate?: string;
  termsConditionsHtml?: string;

  // Products (format: "productId:quantity:pricePerUnit, productId:quantity:pricePerUnit")
  products: string;

  // Additional Fields
  notes?: string;
  attachments?: string; // Comma-separated URLs

  // Shipping (populated after Calculate Shipping is confirmed)
  shippingCalculated?: boolean;
  shippingResult?: ImportRowShippingResult;
}

/**
 * Purchase Order Import Template Structure
 * Defines the column layout for the purchase order import Excel template
 * - First row: Category headers (merged cells)
 * - Second row: Field names
 */
export const purchaseOrderImportTemplateStructure: TemplateStructure = [
  {
    category: "Order Information",
    fields: [
      "vendorNumber",
      "purchaseOrderStatus",
      "priority",
      "assignedLeadId",
      "expectedDeliveryDate",
      "termsConditionsHtml",
    ],
  },
  {
    category: "Delivery Address",
    fields: [
      "addressType",
      "streetAddress",
      "streetAddress2",
      "city",
      "state",
      "postalCode",
      "country",
      "nameOnAddress",
      "phoneOnAddress",
      "emailOnAddress",
    ],
  },
  {
    category: "Product, Quantity, Price Mapping",
    fields: ["products"],
  },
  {
    category: "Additional Fields",
    fields: ["notes", "attachments"],
  },
];

/**
 * Custom header names for purchase order import fields
 */
export const purchaseOrderImportHeaderNames: Record<string, string> = {
  vendorNumber: "Vendor Number",
  purchaseOrderStatus: "Status",
  priority: "Priority",
  assignedLeadId: "Assigned Lead",
  addressType: "Address Type",
  streetAddress: "Street Address",
  streetAddress2: "Street Address 2",
  city: "City",
  state: "State",
  postalCode: "Postal Code",
  country: "Country",
  nameOnAddress: "Name on Address",
  phoneOnAddress: "Phone",
  emailOnAddress: "Email",
  expectedDeliveryDate: "Expected Delivery",
  termsConditionsHtml: "Terms & Conditions",
  products: "Products (productId:quantity:price)",
  notes: "Notes",
  attachments: "Attachments (comma-separated URLs)",
};

/**
 * Fields to hide by default in the preview grid
 */
export const purchaseOrderImportHiddenFields: string[] = [
  "streetAddress2",
  "termsConditionsHtml",
];

/**
 * Field display configurations for purchase order import preview grid
 */
export const purchaseOrderImportFieldDisplayConfig: Record<
  string,
  FieldDisplayConfig
> = {
  rowNumber: { field: "rowNumber", headerName: "Row", width: 70 },
  vendorNumber: { field: "vendorNumber", headerName: "Vendor #", width: 120 },
  purchaseOrderStatus: {
    field: "purchaseOrderStatus",
    headerName: "Status",
    width: 120,
  },
  priority: { field: "priority", headerName: "Priority", width: 100 },
  assignedLeadId: {
    field: "assignedLeadId",
    headerName: "Assigned Lead",
    width: 120,
  },
  addressType: { field: "addressType", headerName: "Address Type", width: 110 },
  streetAddress: { field: "streetAddress", headerName: "Street", width: 180 },
  streetAddress2: {
    field: "streetAddress2",
    headerName: "Street 2",
    width: 120,
  },
  city: { field: "city", headerName: "City", width: 120 },
  state: { field: "state", headerName: "State", width: 100 },
  postalCode: { field: "postalCode", headerName: "Postal Code", width: 100 },
  country: { field: "country", headerName: "Country", width: 100 },
  nameOnAddress: { field: "nameOnAddress", headerName: "Name", width: 120 },
  phoneOnAddress: {
    field: "phoneOnAddress",
    headerName: "Phone",
    width: 120,
    type: ColumnType.PHONE,
  },
  emailOnAddress: {
    field: "emailOnAddress",
    headerName: "Email",
    width: 160,
    type: ColumnType.EMAIL,
  },
  expectedDeliveryDate: {
    field: "expectedDeliveryDate",
    headerName: "Expected Delivery",
    width: 180,
    type: ColumnType.DATETIME,
  },
  notes: { field: "notes", headerName: "Notes", width: 200 },
  termsConditionsHtml: {
    field: "termsConditionsHtml",
    headerName: "Terms",
    width: 150,
  },
  products: { field: "products", headerName: "Products", width: 250 },
  status: { field: "status", headerName: "Status", width: 100 },
  calculateShipping: {
    field: "calculateShipping",
    headerName: "Calculate Shipping",
    width: 160,
  },
  estimatedShipments: {
    field: "estimatedShipments",
    headerName: "Shipments",
    width: 120,
  },
  orderFinancials: {
    field: "orderFinancials",
    headerName: "Financials",
    width: 120,
  },
};

/**
 * Parse products string into structured array
 * Format: "productId:quantity:pricePerUnit, productId:quantity:pricePerUnit"
 * Example: "123:10:99.99, 456:5:149.50"
 *
 * @param productsString - Comma-separated product entries
 * @returns Array of product objects with productId, quantity, and pricePerUnit
 */
export const parseProductsString = (
  productsString: string | undefined
): Array<{ productId: number; quantity: number; pricePerUnit: number }> => {
  if (!productsString || typeof productsString !== "string") {
    return [];
  }

  const products: Array<{
    productId: number;
    quantity: number;
    pricePerUnit: number;
  }> = [];

  // Split by comma and process each entry
  const entries = productsString
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const entry of entries) {
    const parts = entry.split(":").map((s) => s.trim());
    if (parts.length >= 2) {
      const productId = parseInt(parts[0], 10);
      const quantity = parseInt(parts[1], 10);
      const rawPrice = parts.length >= 3 ? parts[2] : "";
      // Normalize price to support values like "18,101" or "₹18101"
      const normalizedPrice = rawPrice.replace(/,/g, "").replace(/[^\d.-]/g, "");
      const pricePerUnit =
        parts.length >= 3 ? parseFloat(normalizedPrice) : 0;

      if (
        !isNaN(productId) &&
        !isNaN(quantity) &&
        productId > 0 &&
        quantity > 0
      ) {
        products.push({
          productId,
          quantity,
          pricePerUnit: isNaN(pricePerUnit) ? 0 : pricePerUnit,
        });
      }
    }
  }

  return products;
};

/**
 * Get column definitions for purchase order import preview grid
 *
 * @param onErrorClick - Callback when error chip is clicked
 * @param onProductsClick - Callback when products chip is clicked (opens products modal)
 * @param onCalculateShippingClick - Callback when calculate shipping button is clicked
 * @param onShipmentsClick - Callback when shipments badge is clicked
 * @param onFinancialsClick - Callback when financials chip is clicked
 * @returns Array of GridColDef for the preview grid
 */
export const getPurchaseOrderImportPreviewColumns = (
  onErrorClick: (errors: string[], rowNumber: number) => void,
  onProductsClick?: (
    rowNumber: number,
    products: Array<{
      productId: number;
      quantity: number;
      pricePerUnit: number;
    }>
  ) => void,
  onCalculateShippingClick?: (
    rowNumber: number,
    row: ImportPurchaseOrderData
  ) => void,
  onShipmentsClick?: (
    rowNumber: number,
    shippingResult: ImportRowShippingResult
  ) => void,
  onFinancialsClick?: (
    rowNumber: number,
    shippingResult: ImportRowShippingResult
  ) => void
): GridColDef[] => {
  // Fields to show in the preview grid (in order matching template structure)
  const previewFields = [
    "rowNumber",
    // Order Information
    "vendorNumber",
    "purchaseOrderStatus",
    "priority",
    "assignedLeadId",
    "expectedDeliveryDate",
    // Delivery Address (all columns from Excel template)
    "addressType",
    "streetAddress",
    "streetAddress2",
    "city",
    "state",
    "postalCode",
    "country",
    "nameOnAddress",
    "phoneOnAddress",
    "emailOnAddress",
    // Products
    "products",
    // Additional Fields
    "notes",
    // Validation Status
    "status",
    // Shipping (after status)
    "calculateShipping",
    "estimatedShipments",
    "orderFinancials",
  ];

  return previewFields.map((fieldName) => {
    const config = purchaseOrderImportFieldDisplayConfig[fieldName];
    if (!config) {
      return {
        field: fieldName,
        headerName: fieldName,
        flex: 1,
        minWidth: 100,
      };
    }

    const baseColumn: GridColDef = {
      field: config.field,
      headerName: config.headerName,
      width: config.width,
      flex: config.width ? undefined : 1,
      minWidth: config.width || 100,
    };

    // Special rendering for status column
    // Shows: Error (validation errors), Pending (no errors but shipping not calculated), Valid (all good)
    if (fieldName === "status") {
      return {
        ...baseColumn,
        renderCell: (params: GridRenderCellParams<ImportPurchaseOrderData>) => {
          const { row } = params;
          const hasErrors =
            row.validationErrors && row.validationErrors.length > 0;
          const shippingCalculated = row.shippingCalculated === true;

          if (hasErrors) {
            return (
              <Chip
                label="Error"
                color="error"
                size="small"
                variant="filled"
                onClick={(e) => {
                  e.stopPropagation();
                  onErrorClick(row.validationErrors, row.rowNumber);
                }}
                sx={{ cursor: "pointer" }}
              />
            );
          }

          if (!shippingCalculated) {
            return (
              <Tooltip title="Calculate shipping to complete this row">
                <Chip
                  label="Pending"
                  color="warning"
                  size="small"
                  variant="filled"
                />
              </Tooltip>
            );
          }

          return (
            <Chip label="Valid" color="success" size="small" variant="filled" />
          );
        },
      };
    }

    // Special rendering for priority column (matches PurchaseOrderGridColumns.tsx styling)
    if (fieldName === "priority") {
      return {
        ...baseColumn,
        renderCell: (params: GridRenderCellParams<ImportPurchaseOrderData>) => {
          const { row } = params;
          const priority = row.priority;

          if (!priority || priority === "—") {
            return (
              <Box
                sx={{ display: "flex", alignItems: "center", height: "100%" }}
              >
                <Chip label="—" size="small" />
              </Box>
            );
          }

          const label = getPriorityLabel(priority);
          const color = getPriorityColor(priority);

          return (
            <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
              <Chip label={label} size="small" color={color} />
            </Box>
          );
        },
      };
    }

    // Special rendering for status field (matches PurchaseOrderGridColumns.tsx styling)
    if (fieldName === "purchaseOrderStatus") {
      return {
        ...baseColumn,
        renderCell: (params: GridRenderCellParams<ImportPurchaseOrderData>) => {
          const { row } = params;
          const status = row.purchaseOrderStatus;

          if (!status || status === "—") {
            return (
              <Box
                sx={{ display: "flex", alignItems: "center", height: "100%" }}
              >
                <Chip label="—" size="small" />
              </Box>
            );
          }

          const label = getPurchaseOrderStatusLabel(status);
          const color = getPurchaseOrderStatusColor(status);

          return (
            <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
              <Chip label={label} size="small" color={color} />
            </Box>
          );
        },
      };
    }

    // Special rendering for products column (matches PurchaseOrderGridColumns.tsx styling)
    if (fieldName === "products") {
      return {
        ...baseColumn,
        renderCell: (params: GridRenderCellParams<ImportPurchaseOrderData>) => {
          const { row } = params;
          const products = parseProductsString(row.products);
          const productCount = products.length;

          if (productCount === 0) {
            return (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <Chip label="None" size="small" variant="outlined" />
              </Box>
            );
          }

          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Tooltip title="Click to view products">
                <Chip
                  icon={<ShoppingCart />}
                  label={`${productCount} Product${
                    productCount !== 1 ? "s" : ""
                  }`}
                  color="primary"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onProductsClick?.(row.rowNumber, products);
                  }}
                  sx={{ cursor: "pointer" }}
                />
              </Tooltip>
            </Box>
          );
        },
      };
    }

    // Calculate Shipping button column (matches ProductActionsSection.tsx styling)
    if (fieldName === "calculateShipping") {
      return {
        ...baseColumn,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<ImportPurchaseOrderData>) => {
          const { row } = params;
          const products = parseProductsString(row.products);
          const hasProducts = products.length > 0;
          const hasAddress = row.postalCode && row.postalCode.trim() !== "";
          const canCalculate = hasProducts && hasAddress;
          const isCalculated = row.shippingCalculated === true;

          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Tooltip
                title={
                  !canCalculate
                    ? "Add products and postal code first"
                    : isCalculated
                    ? "Click to recalculate shipping"
                    : "Calculate shipping for this order"
                }
              >
                <span>
                  <Button
                    variant="outlined"
                    size="small"
                    color="success"
                    disabled={!canCalculate}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCalculateShippingClick?.(row.rowNumber, row);
                    }}
                    startIcon={
                      isCalculated ? (
                        <LocalShipping fontSize="small" />
                      ) : (
                        <CalculateIcon fontSize="small" />
                      )
                    }
                    sx={{
                      textTransform: "none",
                      fontSize: "0.75rem",
                      minWidth: "auto",
                      px: 1.5,
                      borderColor: isCalculated ? "success.main" : undefined,
                      color: isCalculated ? "success.main" : undefined,
                      "&:hover": {
                        borderColor: "success.dark",
                        backgroundColor: "rgba(46, 125, 50, 0.04)",
                      },
                    }}
                  >
                    {isCalculated ? "Calculated" : "Calculate"}
                  </Button>
                </span>
              </Tooltip>
            </Box>
          );
        },
      };
    }

    // Estimated Shipments column (like PurchaseOrderGridColumns.tsx)
    if (fieldName === "estimatedShipments") {
      return {
        ...baseColumn,
        sortable: false,
        filterable: false,
        align: "center" as const,
        headerAlign: "center" as const,
        renderCell: (params: GridRenderCellParams<ImportPurchaseOrderData>) => {
          const { row } = params;
          const shippingResult = row.shippingResult;
          const shipmentCount = shippingResult?.shipments?.length ?? 0;

          if (!row.shippingCalculated || shipmentCount === 0) {
            return (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <Chip label="—" size="small" variant="outlined" />
              </Box>
            );
          }

          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Tooltip title="Click to view shipments">
                <Badge
                  badgeContent={shipmentCount}
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (shippingResult) {
                      onShipmentsClick?.(row.rowNumber, shippingResult);
                    }
                  }}
                  sx={{ cursor: "pointer" }}
                >
                  <LocalShipping
                    sx={{
                      color: "primary.main",
                      fontSize: "1.5rem",
                    }}
                  />
                </Badge>
              </Tooltip>
            </Box>
          );
        },
      };
    }

    // Order Financials column (like PurchaseOrderGridColumns.tsx)
    if (fieldName === "orderFinancials") {
      return {
        ...baseColumn,
        sortable: false,
        filterable: false,
        align: "center" as const,
        headerAlign: "center" as const,
        renderCell: (params: GridRenderCellParams<ImportPurchaseOrderData>) => {
          const { row } = params;
          const shippingResult = row.shippingResult;

          if (!row.shippingCalculated || !shippingResult) {
            return (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <Chip label="—" size="small" variant="outlined" />
              </Box>
            );
          }

          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Tooltip title="Click to view order financials">
                <Chip
                  icon={<AccountBalance />}
                  label="Financials"
                  color="success"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFinancialsClick?.(row.rowNumber, shippingResult);
                  }}
                  sx={{ cursor: "pointer" }}
                />
              </Tooltip>
            </Box>
          );
        },
      };
    }

    // Default rendering with type formatting
    if (config.type) {
      return {
        ...baseColumn,
        renderCell: (params: GridRenderCellParams<ImportPurchaseOrderData>) => {
          const value = params.value;
          if (value === null || value === undefined || value === "") {
            return "—";
          }
          return formatValueByType(value, config.type);
        },
      };
    }

    // Default text rendering
    return {
      ...baseColumn,
      renderCell: (params: GridRenderCellParams<ImportPurchaseOrderData>) => {
        const value = params.value;
        if (value === null || value === undefined || value === "") {
          return "—";
        }
        return (
          <Tooltip title={String(value)}>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {String(value)}
            </span>
          </Tooltip>
        );
      },
    };
  });
};
