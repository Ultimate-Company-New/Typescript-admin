import { format } from "date-fns";

import {
  Code as CodeIcon,
  Inventory2 as PackagesIcon,
  LocalShipping as LocalShippingIcon,
  LocationOn as LocationIcon,
  ShoppingCart as ProductsIcon,
} from "@mui/icons-material";
import { Badge, Box, Chip, Link, Tooltip, Typography } from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";

import { RenderLongCellItem } from "../../components/datagrid";
import { APP_ROUTES } from "../../constants/routes";
import { type ShipmentData } from "../api-models/ShipmentModels";

/**
 * Format date string
 */
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return "—";
  try {
    return format(new Date(dateString), "dd MMM yyyy");
  } catch {
    return dateString;
  }
};

/**
 * Format date with time
 */
const formatDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) return "—";
  try {
    return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
  } catch {
    return dateString;
  }
};

/**
 * Get status color based on ShipRocket status
 */
const getStatusColor = (
  status: string | undefined | null
): { bg: string; text: string } => {
  const statusColorMap: Record<string, { bg: string; text: string }> = {
    NEW: { bg: "#2196F3", text: "#FFFFFF" },
    READY_TO_SHIP: { bg: "#FF9800", text: "#FFFFFF" },
    PICKUP_SCHEDULED: { bg: "#9C27B0", text: "#FFFFFF" },
    PICKED_UP: { bg: "#4CAF50", text: "#FFFFFF" },
    IN_TRANSIT: { bg: "#00BCD4", text: "#FFFFFF" },
    OUT_FOR_DELIVERY: { bg: "#8BC34A", text: "#FFFFFF" },
    DELIVERED: { bg: "#4CAF50", text: "#FFFFFF" },
    RTO_INITIATED: { bg: "#F44336", text: "#FFFFFF" },
    RTO_DELIVERED: { bg: "#795548", text: "#FFFFFF" },
    CANCELLED: { bg: "#9E9E9E", text: "#FFFFFF" },
    PENDING: { bg: "#FFC107", text: "#000000" },
    FAILED: { bg: "#F44336", text: "#FFFFFF" },
  };

  if (!status) return { bg: "#757575", text: "#FFFFFF" };

  // Normalize status to uppercase
  const normalizedStatus = status.toUpperCase().replace(/\s+/g, "_");
  return statusColorMap[normalizedStatus] ?? { bg: "#757575", text: "#FFFFFF" };
};

/**
 * Shipment Actions Component - handles action visibility
 */
const ShipmentActionsCell = ({
  purchaseOrderId,
}: {
  purchaseOrderId?: number;
}): JSX.Element => {
  const actions: JSX.Element[] = [];

  // View PO link if available
  if (purchaseOrderId) {
    actions.push(
      <Link
        key="view-po"
        href={`${APP_ROUTES.DASHBOARD.VIEW_PURCHASE_ORDER}/${purchaseOrderId}`}
        sx={{ cursor: "pointer" }}
      >
        View PO
      </Link>
    );
  }

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
 * Callback handler types for grid columns
 */
export interface ShipmentGridCallbacks {
  onProductsClick?: (shipment: ShipmentData) => void;
  onPackagesClick?: (shipment: ShipmentData) => void;
  onCourierMetadataClick?: (shipment: ShipmentData) => void;
  onShipRocketMetadataClick?: (shipment: ShipmentData) => void;
}

/**
 * Get shipment grid columns
 */
export const getShipmentGridColumns = (
  callbacks?: ShipmentGridCallbacks
): GridColDef[] => [
  {
    field: "shipmentId",
    headerName: "Shipment ID",
    hideable: false,
    filterable: false,
    width: 0,
    minWidth: 0,
    valueGetter: (_value, row: ShipmentData) => row.shipmentId,
  },
  {
    field: "purchaseOrderId",
    headerName: "PO ID",
    flex: 0.6,
    minWidth: 80,
    headerAlign: "center",
    align: "center",
    valueGetter: (_value, row: ShipmentData) => row.purchaseOrderId ?? 0,
    renderCell: (params: GridRenderCellParams<ShipmentData>) => {
      const poId = params.row.purchaseOrderId;

      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          {poId ? (
            <Link
              href={`${APP_ROUTES.DASHBOARD.VIEW_PURCHASE_ORDER}/${poId}`}
              sx={{ cursor: "pointer", textDecoration: "none" }}
            >
              # {poId}
            </Link>
          ) : (
            "—"
          )}
        </Box>
      );
    },
  },
  {
    field: "shipRocketStatus",
    headerName: "Status",
    flex: 1,
    minWidth: 140,
    align: "center",
    headerAlign: "center",
    valueGetter: (_value, row: ShipmentData) =>
      row.shipRocketStatus ?? "PENDING",
    renderCell: (params: GridRenderCellParams<ShipmentData>) => {
      const status = params.value as string;
      const colors = getStatusColor(status);

      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            width: "100%",
          }}
        >
          <Chip
            label={status?.replace(/_/g, " ") ?? "PENDING"}
            size="small"
            sx={{
              backgroundColor: colors.bg,
              color: colors.text,
              fontWeight: 500,
              textTransform: "capitalize",
            }}
          />
        </Box>
      );
    },
  },
  {
    field: "selectedCourierName",
    headerName: "Courier",
    flex: 1.2,
    minWidth: 150,
    headerAlign: "left",
    valueGetter: (_value, row: ShipmentData) => row.selectedCourierName ?? "—",
    renderCell: (params: GridRenderCellParams<ShipmentData>) => (
      <Box
        sx={{ display: "flex", alignItems: "center", height: "100%", gap: 1 }}
      >
        <LocalShippingIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        <RenderLongCellItem value={params.value as string} />
      </Box>
    ),
  },
  {
    field: "shipRocketAwbCode",
    headerName: "AWB Code",
    flex: 1,
    minWidth: 130,
    headerAlign: "left",
    valueGetter: (_value, row: ShipmentData) => row.shipRocketAwbCode ?? "—",
    renderCell: (params: GridRenderCellParams<ShipmentData>) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
          {params.value as string}
        </Typography>
      </Box>
    ),
  },
  {
    field: "pickupLocation",
    headerName: "Pickup Location",
    flex: 1.5,
    minWidth: 200,
    headerAlign: "left",
    valueGetter: (_value, row: ShipmentData) => {
      const pl = row.pickupLocation;
      if (!pl) return "—";
      // Use addressNickName if available and not empty, otherwise fallback to city/state
      const displayName = pl.addressNickName?.trim();
      if (displayName) {
        return displayName;
      }
      const cityState = `${pl.address?.city ?? ""}, ${pl.address?.state ?? ""}`.trim();
      return cityState || "—";
    },
    renderCell: (params: GridRenderCellParams<ShipmentData>) => {
      const rowData = params.row;
      const pl = rowData.pickupLocation;

      if (!pl) {
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            —
          </Box>
        );
      }

      // Build full address string
      const addressParts = [
        pl.address?.streetAddress,
        pl.address?.streetAddress2,
        pl.address?.streetAddress3,
        pl.address?.city,
        pl.address?.state,
        pl.address?.postalCode,
        pl.address?.country,
      ]
        .filter(Boolean)
        .join(", ");

      // Build tooltip content with all available information
      const tooltipParts: string[] = [];

      // Add address nickname if available
      if (pl.addressNickName?.trim()) {
        tooltipParts.push(`Location: ${pl.addressNickName.trim()}`);
      }

      // Add full address
      if (addressParts) {
        tooltipParts.push(`Address: ${addressParts}`);
      }

      // Add name on address if available
      if (pl.address?.nameOnAddress?.trim()) {
        tooltipParts.push(`Name: ${pl.address.nameOnAddress.trim()}`);
      }

      // Add phone if available
      if (pl.address?.phoneOnAddress?.trim()) {
        tooltipParts.push(`Phone: ${pl.address.phoneOnAddress.trim()}`);
      }

      // Add email if available
      if (pl.address?.emailOnAddress?.trim()) {
        tooltipParts.push(`Email: ${pl.address.emailOnAddress.trim()}`);
      }

      const tooltipContent = tooltipParts.length > 0
        ? tooltipParts.join("\n")
        : addressParts || "No address information available";

      // Get display value (addressNickName or city/state)
      const displayValue = params.value as string;

      return (
        <Tooltip
          title={
            <Box component="div" sx={{ whiteSpace: "pre-line" }}>
              {tooltipContent}
            </Box>
          }
          placement="top"
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              gap: 1,
            }}
          >
            <LocationIcon
              sx={{ fontSize: 18, color: "text.secondary", flexShrink: 0 }}
            />
            <RenderLongCellItem value={displayValue} />
          </Box>
        </Tooltip>
      );
    },
  },
  {
    field: "deliveryAddress",
    headerName: "Delivery Location",
    flex: 1.5,
    minWidth: 200,
    headerAlign: "left",
    valueGetter: (_value, row: ShipmentData) => {
      const addr = row.deliveryAddress;
      if (!addr) return "—";
      // Display City, State, Zipcode
      const parts = [addr.city, addr.state, addr.postalCode].filter(Boolean);
      return parts.length > 0 ? parts.join(", ") : "—";
    },
    renderCell: (params: GridRenderCellParams<ShipmentData>) => {
      const rowData = params.row;
      const addr = rowData.deliveryAddress;

      if (!addr) {
        return (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            —
          </Box>
        );
      }

      // Build full address string
      const addressParts = [
        addr.streetAddress,
        addr.streetAddress2,
        addr.streetAddress3,
        addr.city,
        addr.state,
        addr.postalCode,
        addr.country,
      ]
        .filter(Boolean)
        .join(", ");

      // Build tooltip content with all available information
      const tooltipParts: string[] = [];

      // Add full address
      if (addressParts) {
        tooltipParts.push(`Address: ${addressParts}`);
      }

      // Add name on address if available
      if (addr.nameOnAddress?.trim()) {
        tooltipParts.push(`Name: ${addr.nameOnAddress.trim()}`);
      }

      // Add phone if available
      if (addr.phoneOnAddress?.trim()) {
        tooltipParts.push(`Phone: ${addr.phoneOnAddress.trim()}`);
      }

      // Add email if available
      if (addr.emailOnAddress?.trim()) {
        tooltipParts.push(`Email: ${addr.emailOnAddress.trim()}`);
      }

      const tooltipContent = tooltipParts.length > 0
        ? tooltipParts.join("\n")
        : addressParts || "No address information available";

      // Get display value (City, State, Zipcode)
      const displayValue = params.value as string;

      return (
        <Tooltip
          title={
            <Box component="div" sx={{ whiteSpace: "pre-line" }}>
              {tooltipContent}
            </Box>
          }
          placement="top"
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              gap: 1,
            }}
          >
            <LocationIcon
              sx={{ fontSize: 18, color: "primary.main", flexShrink: 0 }}
            />
            <RenderLongCellItem value={displayValue} />
          </Box>
        </Tooltip>
      );
    },
  },
  {
    field: "products",
    headerName: "Products",
    flex: 1,
    minWidth: 130,
    sortable: false,
    filterable: false,
    align: "center",
    headerAlign: "center",
    renderCell: (params: GridRenderCellParams<ShipmentData>) => {
      const rowData = params.row;
      const products = rowData.products ?? [];
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
              icon={<ProductsIcon />}
              label={`${productCount} Product${productCount !== 1 ? "s" : ""}`}
              color="primary"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                callbacks?.onProductsClick?.(rowData);
              }}
              sx={{ cursor: "pointer" }}
            />
          </Tooltip>
        </Box>
      );
    },
  },
  {
    field: "packages",
    headerName: "Packages",
    flex: 1,
    minWidth: 130,
    sortable: false,
    filterable: false,
    align: "center",
    headerAlign: "center",
    renderCell: (params: GridRenderCellParams<ShipmentData>) => {
      const rowData = params.row;
      const packages = rowData.packages ?? [];
      const packageCount = packages.length;

      if (packageCount === 0) {
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

      // Calculate total boxes
      const totalBoxes = packages.reduce(
        (sum, pkg) => sum + (pkg.quantityUsed ?? 0),
        0
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
          <Tooltip title="Click to view packages">
            <Badge
              badgeContent={totalBoxes}
              color="secondary"
              onClick={(e) => {
                e.stopPropagation();
                callbacks?.onPackagesClick?.(rowData);
              }}
              sx={{ cursor: "pointer" }}
            >
              <PackagesIcon
                sx={{
                  color: "secondary.main",
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
    field: "courierMetadata",
    headerName: "Courier Info",
    flex: 0.8,
    minWidth: 100,
    sortable: false,
    filterable: false,
    align: "center",
    headerAlign: "center",
    renderCell: (params: GridRenderCellParams<ShipmentData>) => {
      const rowData = params.row;
      const metadata = rowData.selectedCourierMetadata;

      if (!metadata) {
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
          <Tooltip title="Click to view courier metadata">
            <Chip
              icon={<CodeIcon />}
              label="View"
              color="info"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                callbacks?.onCourierMetadataClick?.(rowData);
              }}
              sx={{ cursor: "pointer" }}
            />
          </Tooltip>
        </Box>
      );
    },
  },
  {
    field: "shipRocketOrderId",
    headerName: "ShipRocket Order",
    flex: 1.2,
    minWidth: 150,
    sortable: false,
    filterable: false,
    align: "center",
    headerAlign: "center",
    valueGetter: (_value, row: ShipmentData) => row.shipRocketOrderId ?? "",
    renderCell: (params: GridRenderCellParams<ShipmentData>) => {
      const rowData = params.row;
      const orderId = rowData.shipRocketOrderId;
      const metadata = rowData.shipRocketFullResponse;

      if (!orderId) {
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

      // If no metadata, just display the order ID as text
      if (!metadata) {
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
              {orderId}
            </Typography>
          </Box>
        );
      }

      // Display as clickable chip showing order ID
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <Tooltip title="Click to view ShipRocket order details">
            <Chip
              icon={<CodeIcon />}
              label={orderId}
              color="warning"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                callbacks?.onShipRocketMetadataClick?.(rowData);
              }}
              sx={{ cursor: "pointer", fontFamily: "monospace" }}
            />
          </Tooltip>
        </Box>
      );
    },
  },
  {
    field: "expectedDeliveryDate",
    headerName: "Expected Delivery",
    flex: 1,
    minWidth: 130,
    headerAlign: "left",
    valueGetter: (_value, row: ShipmentData) => row.expectedDeliveryDate ?? "",
    renderCell: (params: GridRenderCellParams<ShipmentData>) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        {formatDate(params.value as string)}
      </Box>
    ),
  },
  {
    field: "createdAt",
    headerName: "Created",
    flex: 1.1,
    minWidth: 150,
    headerAlign: "left",
    valueGetter: (_value, row: ShipmentData) => row.createdAt ?? "",
    renderCell: (params: GridRenderCellParams<ShipmentData>) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        {formatDateTime(params.value as string)}
      </Box>
    ),
  },
  {
    field: "actions",
    headerName: "Actions",
    minWidth: 150,
    flex: 0.8,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams<ShipmentData>) => {
      const rowData = params.row;
      return <ShipmentActionsCell purchaseOrderId={rowData.purchaseOrderId} />;
    },
  },
];

/**
 * Export the ShipmentActionsCell for potential reuse
 */
export { ShipmentActionsCell };
