import { format } from "date-fns";
import JSZip from "jszip";
import { toast } from "react-toastify";

import {
  AccountBalance,
  Cancel,
  CheckCircle,
  LocalShipping,
  LocationOn,
  Payment,
  ShoppingCart,
} from "@mui/icons-material";
import {
  Badge,
  Box,
  Button,
  Chip,
  Link,
  Tooltip,
  Typography,
} from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";

import { purchaseOrderApi } from "../../api/purchaseOrderApi";
import { RenderLongCellItem } from "../../components/datagrid";
import {
  PERMISSIONS,
  getPriorityColor,
  getPriorityLabel,
  getPurchaseOrderStatusColor,
  getPurchaseOrderStatusLabel,
} from "../../constants/appConstants";
import { APP_ROUTES } from "../../constants/routes";
import { usePermissions } from "../../hooks/usePermissions";
import { type ResourceResponseModel } from "../api-models/PurchaseOrderModels";

/**
 * Purchase Order data structure matching API response
 * Matches: PurchaseOrderResponseModel.java
 */
export interface PurchaseOrderData {
  purchaseOrderId?: number;
  vendorNumber?: string;
  isDeleted?: boolean;
  purchaseOrderReceipt?: string;
  purchaseOrderStatus?: string;
  approvedDate?: string;
  rejectedDate?: string;
  assignedLeadId?: number;
  createdAt?: string;
  updatedAt?: string;

  // Nested response models for related entities
  lead?: {
    leadId: number;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  createdByUser?: {
    userId: number;
    firstName?: string;
    lastName?: string;
    loginName?: string;
    email?: string;
  };
  modifiedByUser?: {
    userId: number;
    firstName?: string;
    lastName?: string;
    loginName?: string;
    email?: string;
  };
  approvedByUser?: {
    userId: number;
    firstName?: string;
    lastName?: string;
    loginName?: string;
    email?: string;
  };
  rejectedByUser?: {
    userId: number;
    firstName?: string;
    lastName?: string;
    loginName?: string;
    email?: string;
  };

  // OrderSummary Data (Financial Breakdown and Fulfillment Details)
  orderSummary?: {
    orderSummaryId?: number;
    productsSubtotal?: number;
    totalDiscount?: number;
    packagingFee?: number;
    totalShipping?: number;
    serviceFee?: number;
    subtotal?: number;
    gstPercentage?: number;
    gstAmount?: number;
    grandTotal?: number;
    pendingAmount?: number;
    expectedDeliveryDate?: string; // ISO date string
    address?: {
      city?: string;
      state?: string;
      streetAddress?: string;
      streetAddress2?: string;
      streetAddress3?: string;
      postalCode?: string;
      country?: string;
    };
    priority?: string;
    promoId?: number;
    promo?: unknown;
    termsConditionsHtml?: string;
    notes?: string;
  };

  // Address (top-level for grid display convenience - extracted from OrderSummary)
  address?: {
    city?: string;
    state?: string;
    streetAddress?: string;
    streetAddress2?: string;
    streetAddress3?: string;
    postalCode?: string;
    country?: string;
  };

  // Shipment Data (List of shipments with products, packages, and courier selections)
  shipments?: unknown[];

  // Products (for backward compatibility - extracted from shipments)
  products?: unknown[];

  // Attachments (List of resource details - contains both fileName (key) and URL/base64 (value))
  attachments?: ResourceResponseModel[];

  // Payments (List of all payments made for this purchase order)
  payments?: unknown[];

  // Legacy fields for backward compatibility
  purchaseOrder?: {
    purchaseOrderId: number;
    deleted?: boolean;
    expectedDeliveryDate?: string;
    expectedShipmentDate?: string;
    vendorNumber?: string;
    purchaseOrderReceipt?: string;
    orderReceipt?: string;
    approvedDate?: string;
    rejectedDate?: string;
  };
  expectedDeliveryDate?: string;
  expectedShipmentDate?: string;
  orderReceipt?: string;
  deleted?: boolean;
}

/**
 * Purchase Order Actions Component - handles permission-based action visibility
 */
export const PurchaseOrderActionsCell = ({
  purchaseOrderId,
  isDeleted,
  onTogglePurchaseOrder,
  purchaseOrderStatus,
  approvedByUser,
  rejectedByUser,
}: {
  purchaseOrderId: number | null | undefined;
  isDeleted: boolean;
  onTogglePurchaseOrder?: (purchaseOrderId: number) => void;
  purchaseOrderStatus?: string;
  approvedByUser?: {
    userId: number;
    firstName?: string;
    lastName?: string;
    loginName?: string;
    email?: string;
  };
  rejectedByUser?: {
    userId: number;
    firstName?: string;
    lastName?: string;
    loginName?: string;
    email?: string;
  };
}): JSX.Element => {
  const { hasPermission } = usePermissions();

  // Check permissions using PERMISSIONS constants
  const canViewPurchaseOrder = hasPermission(PERMISSIONS.VIEW_PURCHASE_ORDERS);
  const canUpdatePurchaseOrder = hasPermission(
    PERMISSIONS.UPDATE_PURCHASE_ORDERS
  );
  const canTogglePurchaseOrder = hasPermission(
    PERMISSIONS.TOGGLE_PURCHASE_ORDERS
  );

  // Check if order is approved or rejected
  const isApproved =
    purchaseOrderStatus === "APPROVED" || approvedByUser != null;
  const isRejected =
    purchaseOrderStatus === "REJECTED" || rejectedByUser != null;
  const canEdit = !isApproved && !isRejected;

  if (purchaseOrderId == null) {
    return <span>—</span>;
  }

  if (isDeleted) {
    // Only show Activate if user has toggle permission
    if (!canTogglePurchaseOrder) {
      return <span>—</span>;
    }

    return (
      <div>
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (onTogglePurchaseOrder) {
              onTogglePurchaseOrder(purchaseOrderId);
            }
          }}
          sx={{
            cursor: "pointer",
            color: "success.main",
          }}
        >
          Activate
        </Link>
      </div>
    );
  }

  // Build actions based on permissions
  const actions: JSX.Element[] = [];

  if (canViewPurchaseOrder) {
    actions.push(
      <Link
        key="view"
        href={`${APP_ROUTES.DASHBOARD.VIEW_PURCHASE_ORDER}/${purchaseOrderId}`}
        sx={{ cursor: "pointer" }}
      >
        View
      </Link>
    );
  }

  if (canUpdatePurchaseOrder && canEdit) {
    actions.push(
      <Link
        key="edit"
        href={`${APP_ROUTES.DASHBOARD.ADD_PURCHASE_ORDER}?purchaseOrderId=${purchaseOrderId}`}
        sx={{ cursor: "pointer" }}
      >
        Edit
      </Link>
    );
  }

  if (canTogglePurchaseOrder) {
    actions.push(
      <Link
        key="deactivate"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          if (onTogglePurchaseOrder) {
            onTogglePurchaseOrder(purchaseOrderId);
          }
        }}
        sx={{
          cursor: "pointer",
          color: "error.main",
        }}
      >
        Deactivate
      </Link>
    );
  }

  // If no permissions, show empty cell
  if (actions.length === 0) {
    return <span>—</span>;
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
      }}
    >
      {actions}
    </div>
  );
};

/**
 * Data passed when approve button is clicked
 */
export interface ApprovePaymentData {
  purchaseOrderId: number;
  vendorNumber: string;
  grandTotal: number;
  pendingAmount: number;
}

/**
 * Get purchase order grid columns with action handlers
 */
export const getPurchaseOrderGridColumns = (
  onTogglePurchaseOrder: (purchaseOrderId: number) => void,
  onApprovePurchaseOrder: (data: ApprovePaymentData) => void,
  onRejectPurchaseOrder: (purchaseOrderId: number) => void,
  onProductsClick?: (
    purchaseOrderId: number,
    products: Array<{
      productId: number;
      quantity: number;
      pricePerUnit?: number;
    }>
  ) => void,
  onShipmentsClick?: (shipments: unknown[]) => void,
  onFinancialsClick?: (orderSummary: unknown, shipmentsCount: number) => void,
  onPaymentsClick?: (payments: unknown[], grandTotal: number, pendingAmount: number, purchaseOrderId?: number, vendorNumber?: string) => void
): GridColDef[] => {
  return [
    {
      field: "purchaseOrderId",
      headerName: "Purchase Order ID",
      hideable: false,
      filterable: false,
      flex: 1,
      minWidth: 150,
      width: 150,
      align: "left",
      headerAlign: "left",
      valueGetter: (_value, row: PurchaseOrderData) => {
        const rowData = row;
        return (
          rowData.purchaseOrderId ??
          rowData.purchaseOrder?.purchaseOrderId ??
          "—"
        );
      },
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          {params.value}
        </Box>
      ),
    },
    {
      field: "expectedShipmentDate",
      headerName: "Expected Shipment Delivery",
      flex: 1,
      minWidth: 200,
      width: 200,
      align: "left",
      headerAlign: "left",
      valueGetter: (_value, row: PurchaseOrderData) => {
        const rowData = row;
        // Priority: orderSummary.expectedDeliveryDate > top-level expectedDeliveryDate > legacy fields
        const date =
          rowData.orderSummary?.expectedDeliveryDate ??
          rowData.expectedDeliveryDate ??
          rowData.expectedShipmentDate ??
          rowData.purchaseOrder?.expectedDeliveryDate ??
          rowData.purchaseOrder?.expectedShipmentDate;
        if (!date) return "—";
        try {
          return format(new Date(date), "do MMM yyyy");
        } catch {
          return "—";
        }
      },
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          {params.value}
        </Box>
      ),
    },
    {
      field: "purchaseOrderStatus",
      headerName: "Status",
      flex: 1,
      minWidth: 150,
      align: "left",
      headerAlign: "left",
      valueGetter: (_value, row: PurchaseOrderData) => {
        const rowData = row;
        return rowData.purchaseOrderStatus ?? "—";
      },
      renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
        const rowData = params.row;
        const status = rowData.purchaseOrderStatus;

        if (!status || status === "—") {
          return (
            <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
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
    },
    {
      field: "priority",
      headerName: "Priority",
      flex: 1,
      minWidth: 120,
      align: "left",
      headerAlign: "left",
      valueGetter: (_value, row: PurchaseOrderData) => {
        const rowData = row;
        return rowData.orderSummary?.priority ?? "—";
      },
      renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
        const rowData = params.row;
        const priority = rowData.orderSummary?.priority;

        if (!priority || priority === "—") {
          return (
            <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
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
    },
    {
      field: "vendorNumber",
      headerName: "Vendor Number",
      flex: 1.5,
      minWidth: 200,
      align: "left",
      headerAlign: "left",
      valueGetter: (_value, row: PurchaseOrderData) => {
        const rowData = row;
        return (
          rowData.vendorNumber ?? rowData.purchaseOrder?.vendorNumber ?? "—"
        );
      },
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <RenderLongCellItem value={String(params.value || "—")} />
        </Box>
      ),
    },
    {
      field: "assignedLead",
      headerName: "Assigned Lead",
      flex: 1.5,
      minWidth: 220,
      align: "left",
      headerAlign: "left",
      valueGetter: (_value, row: PurchaseOrderData) => {
        const rowData = row;
        const { lead } = rowData;
        if (!lead) return "—";
        return `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim();
      },
      renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
        const rowData = params.row;
        const { lead } = rowData;
        const leadId = lead?.leadId;

        if (!lead || !leadId) {
          return (
            <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
              —
            </Box>
          );
        }

        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <Link
              href={`${APP_ROUTES.DASHBOARD.ADD_LEAD}?leadId=${leadId}&isView`}
              sx={{ cursor: "pointer", textDecoration: "none" }}
            >
              {params.value}
            </Link>
          </Box>
        );
      },
    },
    {
      field: "products",
      headerName: "Products",
      flex: 1.5,
      minWidth: 180,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
        const rowData = params.row;
        const purchaseOrderId =
          rowData.purchaseOrderId ?? rowData.purchaseOrder?.purchaseOrderId;

        // Extract products from products array OR from shipments
        // Products can be at top level (rowData.products) or nested in shipments
        let products =
          (rowData.products as Array<{
            product?: { productId?: number; title?: string };
            productId?: number;
            quantity?: number;
            pricePerUnit?: number;
            allocatedQuantity?: number;
          }>) ?? [];

        // If no top-level products, try to extract from shipments
        // IMPORTANT: Aggregate quantities across all shipments (weight splits)
        if (
          products.length === 0 &&
          rowData.shipments &&
          Array.isArray(rowData.shipments)
        ) {
          // Use a Map to aggregate quantities by productId
          const productMap = new Map<
            number,
            {
              product?: { productId?: number; title?: string };
              productId: number;
              quantity: number;
              pricePerUnit?: number;
            }
          >();

          for (const shipment of rowData.shipments as Array<{
            products?: Array<{
              product?: { productId?: number; title?: string; price?: number };
              productId?: number;
              allocatedQuantity?: number;
              quantity?: number;
              allocatedPrice?: number;
              pricePerUnit?: number;
            }>;
          }>) {
            if (shipment.products && Array.isArray(shipment.products)) {
              for (const sp of shipment.products) {
                const productId = sp.product?.productId ?? sp.productId ?? 0;
                if (productId > 0) {
                  const existing = productMap.get(productId);
                  const qty = sp.allocatedQuantity ?? sp.quantity ?? 0;
                  // Use allocatedPrice from ShipmentProduct (database), fallback to pricePerUnit, then product.price
                  const price = sp.allocatedPrice ?? sp.pricePerUnit ?? sp.product?.price ?? 0;
                  if (existing) {
                    // Aggregate quantity
                    existing.quantity += qty;
                  } else {
                    // First occurrence
                    productMap.set(productId, {
                      product: sp.product,
                      productId,
                      quantity: qty,
                      pricePerUnit: price,
                    });
                  }
                }
              }
            }
          }
          products = Array.from(productMap.values());
        }

        const productCount = products.length;

        if (purchaseOrderId == null) {
          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <span>—</span>
            </Box>
          );
        }

        // Show "None" chip if no products
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

        // Prepare products data for modal
        const productsData = products.map((p) => ({
          productId: p.product?.productId ?? p.productId ?? 0,
          quantity: p.quantity ?? 0,
          pricePerUnit: p.pricePerUnit,
        }));

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
                  onProductsClick?.(purchaseOrderId, productsData);
                }}
                sx={{ cursor: "pointer" }}
              />
            </Tooltip>
          </Box>
        );
      },
    },
    {
      field: "estimatedShipments",
      headerName: "Estimated Shipments",
      flex: 1,
      minWidth: 150,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
        const rowData = params.row;
        const shipments = (rowData.shipments as unknown[]) ?? [];
        const shipmentCount = shipments.length;

        if (shipmentCount === 0) {
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
            <Tooltip title="Click to view shipments">
              <Badge
                badgeContent={shipmentCount}
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onShipmentsClick?.(shipments);
                }}
              >
                <LocalShipping
                  sx={{
                    cursor: "pointer",
                    color: "primary.main",
                    fontSize: "1.5rem",
                  }}
                />
              </Badge>
            </Tooltip>
          </Box>
        );
      },
    },
    {
      field: "orderFinancials",
      headerName: "Order Financials",
      flex: 1,
      minWidth: 150,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
        const rowData = params.row;
        const orderSummary = rowData.orderSummary;
        const shipments = (rowData.shipments as unknown[]) ?? [];
        const shipmentsCount = shipments.length;

        if (!orderSummary) {
          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <span>—</span>
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
                  onFinancialsClick?.(orderSummary, shipmentsCount);
                }}
                sx={{ cursor: "pointer" }}
              />
            </Tooltip>
          </Box>
        );
      },
    },
    {
      field: "payments",
      headerName: "Payments",
      flex: 1,
      minWidth: 120,
      align: "center",
      headerAlign: "center",
      filterable: false,
      sortable: false,
      valueGetter: (_value, row: PurchaseOrderData) => {
        const rowData = row;
        const payments = rowData.payments ?? [];
        return payments.length;
      },
      renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
        const rowData = params.row;
        const payments = (rowData.payments ?? []) as unknown[];
        const paymentCount = payments.length;
        const grandTotal = rowData.orderSummary?.grandTotal ?? 0;
        const pendingAmount = rowData.orderSummary?.pendingAmount ?? grandTotal;
        const purchaseOrderId = rowData.purchaseOrderId ?? rowData.purchaseOrder?.purchaseOrderId;
        const vendorNumber = rowData.vendorNumber ?? rowData.purchaseOrder?.vendorNumber ?? '';

        if (paymentCount === 0) {
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
            <Tooltip title="Click to view payment history">
              <Badge
                badgeContent={paymentCount}
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onPaymentsClick?.(payments, grandTotal, pendingAmount, purchaseOrderId, vendorNumber);
                }}
              >
                <Payment
                  sx={{
                    cursor: "pointer",
                    color: "primary.main",
                    fontSize: "1.5rem",
                  }}
                />
              </Badge>
            </Tooltip>
          </Box>
        );
      },
    },
    {
      field: "address",
      headerName: "Shipping Address",
      flex: 1.5,
      minWidth: 180,
      align: "left",
      headerAlign: "left",
      valueGetter: (_value, row: PurchaseOrderData) => {
        const rowData = row;
        // Priority: top-level address > orderSummary.address
        const addr = rowData.address ?? rowData.orderSummary?.address ?? {};
        const city = addr.city ?? "";
        const state = addr.state ?? "";

        if (city === "" && state === "") return "—";
        return `${city}${
          city !== "" && state !== "" ? ", " : ""
        }${state}`.trim();
      },
      renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
        const rowData = params.row;
        // Priority: top-level address > orderSummary.address
        const addr = rowData.address ?? rowData.orderSummary?.address ?? {};
        const streetAddress = addr.streetAddress ?? "";
        const streetAddress2 = addr.streetAddress2 ?? "";
        const streetAddress3 = addr.streetAddress3 ?? "";
        const city = addr.city ?? "";
        const state = addr.state ?? "";
        const postalCode = addr.postalCode ?? "";
        const country = addr.country ?? "";

        const fullAddress = [
          streetAddress,
          streetAddress2,
          streetAddress3,
          city,
          state,
          postalCode,
          country,
        ]
          .filter(Boolean)
          .join("\n");

        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              gap: 1,
            }}
          >
            <Tooltip
              title={
                <div style={{ whiteSpace: "pre-line" }}>
                  {fullAddress || "No address"}
                </div>
              }
              arrow
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <LocationOn fontSize="small" />
                {params.value}
              </Box>
            </Tooltip>
          </Box>
        );
      },
    },
    {
      field: "approveReject",
      headerName: "Approve/Reject",
      flex: 1.2,
      minWidth: 220,
      sortable: false,
      filterable: false,
      cellClassName: "approve-reject-cell",
      renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
        const rowData = params.row;
        const isDeleted = Boolean(
          rowData.isDeleted ?? rowData.deleted ?? rowData.purchaseOrder?.deleted
        );
        const isApproved = rowData.approvedByUser != null;
        const isRejected = rowData.rejectedByUser != null;
        const purchaseOrderId =
          rowData.purchaseOrderId ?? rowData.purchaseOrder?.purchaseOrderId;

        // Show approval/rejection info if already approved or rejected
        if (isApproved) {
          const approvedBy = rowData.approvedByUser;
          const approvedDate =
            rowData.approvedDate ?? rowData.purchaseOrder?.approvedDate;

          let formattedDate = "—";
          if (approvedDate) {
            try {
              const date = new Date(approvedDate);
              if (!isNaN(date.getTime())) {
                formattedDate = format(date, "do MMM yyyy, h:mm a");
              } else {
                formattedDate = approvedDate.toString();
              }
            } catch (error) {
              formattedDate = approvedDate.toString();
            }
          }

          const tooltipContent = (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {approvedBy?.firstName && (
                <Typography variant="body2">{approvedBy.firstName}</Typography>
              )}
              {approvedBy?.lastName && (
                <Typography variant="body2">{approvedBy.lastName}</Typography>
              )}
              {approvedBy?.email && (
                <Typography variant="body2">{approvedBy.email}</Typography>
              )}
              <Typography variant="body2">{formattedDate}</Typography>
            </Box>
          );

          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Tooltip title={tooltipContent} arrow placement="top">
                <Chip
                  icon={<CheckCircle fontSize="small" />}
                  label="Approved"
                  color="success"
                  size="small"
                  sx={{
                    cursor: "help",
                  }}
                />
              </Tooltip>
            </Box>
          );
        }

        if (isRejected) {
          const rejectedBy = rowData.rejectedByUser;
          const rejectedDate =
            rowData.rejectedDate ?? rowData.purchaseOrder?.rejectedDate;

          let formattedDate = "—";
          if (rejectedDate) {
            try {
              const date = new Date(rejectedDate);
              if (!isNaN(date.getTime())) {
                formattedDate = format(date, "do MMM yyyy, h:mm a");
              } else {
                formattedDate = rejectedDate.toString();
              }
            } catch (error) {
              formattedDate = rejectedDate.toString();
            }
          }

          const tooltipContent = (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {rejectedBy?.firstName && (
                <Typography variant="body2">{rejectedBy.firstName}</Typography>
              )}
              {rejectedBy?.lastName && (
                <Typography variant="body2">{rejectedBy.lastName}</Typography>
              )}
              {rejectedBy?.email && (
                <Typography variant="body2">{rejectedBy.email}</Typography>
              )}
              <Typography variant="body2">{formattedDate}</Typography>
            </Box>
          );

          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Tooltip title={tooltipContent} arrow placement="top">
                <Chip
                  icon={<Cancel fontSize="small" />}
                  label="Rejected"
                  color="error"
                  size="small"
                  sx={{
                    cursor: "help",
                  }}
                />
              </Tooltip>
            </Box>
          );
        }

        // Don't show buttons if deleted
        if (isDeleted) {
          return null;
        }

        // Only show Approve/Reject buttons for PENDING_APPROVAL status
        const status = rowData.purchaseOrderStatus;
        if (status !== "PENDING_APPROVAL") {
          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                —
              </Typography>
            </Box>
          );
        }

        return (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              height: "100%",
              width: "100%",
              px: 1,
            }}
          >
            <Button
              variant="contained"
              size="small"
              color="success"
              onClick={() => {
                if (purchaseOrderId != null) {
                  const vendorNumber = rowData.vendorNumber ?? rowData.purchaseOrder?.vendorNumber ?? '';
                  const grandTotal = rowData.orderSummary?.grandTotal ?? 0;
                  const pendingAmount = rowData.orderSummary?.pendingAmount ?? grandTotal;
                  onApprovePurchaseOrder({
                    purchaseOrderId,
                    vendorNumber,
                    grandTotal,
                    pendingAmount,
                  });
                }
              }}
              sx={{
                minWidth: "80px",
                textTransform: "none",
                fontWeight: 500,
              }}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => {
                if (purchaseOrderId != null) {
                  onRejectPurchaseOrder(purchaseOrderId);
                }
              }}
              sx={{
                minWidth: "80px",
                textTransform: "none",
                fontWeight: 500,
              }}
            >
              Reject
            </Button>
          </Box>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      minWidth: 180,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
        const rowData = params.row;
        const purchaseOrderId =
          rowData.purchaseOrderId ?? rowData.purchaseOrder?.purchaseOrderId;
        const isDeleted =
          rowData.isDeleted ??
          rowData.deleted ??
          rowData.purchaseOrder?.deleted ??
          false;

        return (
          <PurchaseOrderActionsCell
            purchaseOrderId={purchaseOrderId}
            isDeleted={isDeleted}
            onTogglePurchaseOrder={onTogglePurchaseOrder}
            purchaseOrderStatus={rowData.purchaseOrderStatus}
            approvedByUser={rowData.approvedByUser}
            rejectedByUser={rowData.rejectedByUser}
          />
        );
      },
    },
    {
      field: "downloadPDF",
      headerName: "Download PDF",
      flex: 1,
      minWidth: 180,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
        const rowData = params.row;
        const isDeleted = Boolean(
          rowData.isDeleted ?? rowData.deleted ?? rowData.purchaseOrder?.deleted
        );
        const isApproved = rowData.approvedByUser != null;
        const purchaseOrderId =
          rowData.purchaseOrderId ?? rowData.purchaseOrder?.purchaseOrderId;

        const handleDownload = async (): Promise<void> => {
          if (purchaseOrderId == null) return;
          try {
            toast.info("Downloading PDF...");
            const blob = await purchaseOrderApi.downloadPurchaseOrderPdf(
              purchaseOrderId
            );
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = `PurchaseOrder_${purchaseOrderId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            toast.success("PDF downloaded successfully!");
          } catch (error: unknown) {
            const errorMessage =
              (
                error as {
                  response?: { data?: { message?: string } };
                  message?: string;
                }
              ).response?.data?.message ??
              (error as { message?: string }).message ??
              "Failed to download PDF. Please check your permissions.";
            toast.error(errorMessage);
          }
        };

        if (isDeleted || !isApproved) {
          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Button
                variant="outlined"
                size="small"
                disabled
                sx={{ whiteSpace: "nowrap" }}
              >
                Download PDF
              </Button>
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
            <Button
              variant="outlined"
              size="small"
              onClick={handleDownload}
              sx={{ whiteSpace: "nowrap" }}
            >
              Download PDF
            </Button>
          </Box>
        );
      },
    },
    {
      field: "downloadAttachments",
      headerName: "Download Attachments",
      flex: 1,
      minWidth: 250,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
        const rowData = params.row;
        const isDeleted = Boolean(
          rowData.isDeleted ?? rowData.deleted ?? rowData.purchaseOrder?.deleted
        );
        const purchaseOrderId =
          rowData.purchaseOrderId ?? rowData.purchaseOrder?.purchaseOrderId;
        const attachmentsList = (rowData.attachments ??
          []) as ResourceResponseModel[];

        const handleDownloadAttachments = async (): Promise<void> => {
          if (purchaseOrderId == null) return;

          // Check if there are any attachments
          if (attachmentsList.length === 0) {
            toast.info("No attachments available for this purchase order.");
            return;
          }

          try {
            toast.info("Downloading attachments...");
            const zip = new JSZip();

            // Download each attachment and add to zip
            await Promise.all(
              attachmentsList.map(async (attachment) => {
                try {
                  const fileName =
                    attachment.key || `attachment_${attachment.resourceId}`;
                  const url = attachment.value;

                  if (!url) {
                    return;
                  }

                  let blob: Blob;
                  let fileExtension = "";

                  // Check if it's a base64 data URL
                  if (url.startsWith("data:")) {
                    // Handle base64 data URL
                    const base64Data = url.split(",")[1];
                    const mimeType = url
                      .split(",")[0]
                      .split(":")[1]
                      .split(";")[0];

                    // Convert base64 to blob
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    blob = new Blob([byteArray], { type: mimeType });

                    // Determine extension from MIME type
                    if (
                      mimeType.includes("image/jpeg") ||
                      mimeType.includes("image/jpg")
                    ) {
                      fileExtension = ".jpg";
                    } else if (mimeType.includes("image/png")) {
                      fileExtension = ".png";
                    } else if (mimeType.includes("image/gif")) {
                      fileExtension = ".gif";
                    } else if (mimeType.includes("application/pdf")) {
                      fileExtension = ".pdf";
                    } else if (mimeType.includes("image/webp")) {
                      fileExtension = ".webp";
                    }
                  } else {
                    // Handle regular URL (fetch from server)
                    const response = await fetch(url);
                    if (!response.ok) {
                      throw new Error(
                        `Failed to fetch ${fileName}: ${response.statusText}`
                      );
                    }

                    blob = await response.blob();

                    // Determine file extension from URL or content type
                    const contentType = response.headers.get("content-type");
                    if (contentType) {
                      if (
                        contentType.includes("image/jpeg") ||
                        contentType.includes("image/jpg")
                      ) {
                        fileExtension = ".jpg";
                      } else if (contentType.includes("image/png")) {
                        fileExtension = ".png";
                      } else if (contentType.includes("image/gif")) {
                        fileExtension = ".gif";
                      } else if (contentType.includes("application/pdf")) {
                        fileExtension = ".pdf";
                      } else if (contentType.includes("image/webp")) {
                        fileExtension = ".webp";
                      }
                    }

                    // Try to get extension from URL if content type doesn't provide it
                    if (!fileExtension) {
                      const urlMatch = url.match(
                        /\.(jpg|jpeg|png|gif|pdf|webp|bmp|svg)(\?|$)/i
                      );
                      if (urlMatch) {
                        fileExtension = `.${urlMatch[1].toLowerCase()}`;
                      }
                    }
                  }

                  // Add extension if not already present in fileName
                  const finalFileName = fileName.includes(".")
                    ? fileName
                    : `${fileName}${fileExtension}`;

                  // Add to zip
                  zip.file(finalFileName, blob);
                } catch (error) {
                  // Continue with other attachments even if one fails
                }
              })
            );

            // Generate zip file
            const zipBlob = await zip.generateAsync({ type: "blob" });

            // Download the zip file
            const downloadUrl = window.URL.createObjectURL(zipBlob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = `PurchaseOrder_${purchaseOrderId}_Attachments.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            toast.success(
              `Successfully downloaded ${attachmentsList.length} attachment(s)!`
            );
          } catch (error: unknown) {
            const errorMessage =
              (
                error as {
                  response?: { data?: { message?: string } };
                  message?: string;
                }
              ).response?.data?.message ??
              (error as { message?: string }).message ??
              "Failed to download attachments. Please try again.";
            toast.error(errorMessage);
          }
        };

        if (isDeleted) {
          return (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <Button
                variant="outlined"
                size="small"
                disabled
                sx={{ whiteSpace: "nowrap" }}
              >
                Download Attachments
              </Button>
            </Box>
          );
        }

        // Show button even if no attachments - let the handler show a message
        const attachmentCount = attachmentsList.length;

        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Button
              variant="outlined"
              size="small"
              onClick={handleDownloadAttachments}
              sx={{ whiteSpace: "nowrap" }}
            >
              Download Attachments
              {attachmentCount > 0 ? ` (${attachmentCount})` : ""}
            </Button>
          </Box>
        );
      },
    },
  ];
};
