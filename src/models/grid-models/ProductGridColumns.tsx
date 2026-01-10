import { memo, useEffect, useState } from "react";

import { format } from "date-fns";

import { Box, Chip, Switch, Tooltip } from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";

import { ProductImageCarousel } from "../../components/carousel";
import { RenderLongCellItem } from "../../components/datagrid";
import { TextFieldInput } from "../../components/form-input";
import { getConditionColor, getConditionLabel } from "../../constants/appConstants";
import { ProductActionsCell } from "../../pages/products/components";

/**
 * Memoized Quantity Input Component
 * Manages its own local state to prevent grid re-renders on every keystroke
 */
interface QuantityInputProps {
  initialValue: number | undefined
  onValueChange: (value: number) => void
}

const QuantityInput = memo(({ initialValue, onValueChange }: QuantityInputProps) => {
  const [localValue, setLocalValue] = useState<string>(initialValue?.toString() ?? '')

  // Sync local state when initialValue changes from outside
  useEffect(() => {
    setLocalValue(initialValue?.toString() ?? '')
  }, [initialValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value)
  }

  const handleBlur = () => {
    const value = parseInt(localValue, 10)
    if (isNaN(value) || value < 1) {
      setLocalValue('1')
      onValueChange(1)
    } else {
      onValueChange(value)
    }
  }

  return (
    <TextFieldInput
      type="number"
      size="small"
      variant="outlined"
      margin="none"
      value={localValue}
      placeholder="1"
      onChange={handleChange}
      onBlur={handleBlur}
      inputProps={{ min: 1, style: { textAlign: 'center' } }}
      sx={{ width: 100, backgroundColor: '#fff' }}
      fullWidth={false}
    />
  )
})

QuantityInput.displayName = 'QuantityInput'

import PickupLocationsButton from "./PickupLocationsButton";

/**
 * Pickup location data structure
 */
interface PickupLocation {
  pickupLocationId: number;
  addressNickName?: string;
  [key: string]: unknown;
}

/**
 * Created by user info structure
 */
interface CreatedByUserInfo {
  userId?: number;
  firstName?: string;
  lastName?: string;
  loginName?: string;
  fullName?: string;
}

/**
 * Product image URLs structure
 */
interface ProductImageUrls {
  mainImageUrl?: string;
  topImageUrl?: string;
  bottomImageUrl?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  rightImageUrl?: string;
  leftImageUrl?: string;
  detailsImageUrl?: string;
  defectImageUrl?: string;
  additionalImage1Url?: string;
  additionalImage2Url?: string;
  additionalImage3Url?: string;
}

/**
 * Product data structure matching API response
 */
export interface ProductData extends ProductImageUrls {
  productId?: number;
  product?: {
    productId: number;
    title?: string;
    upc?: string;
    length?: number;
    breadth?: number;
    width?: number;
    height?: number;
    price?: number;
    discount?: number;
    discountPercent?: boolean;
    isDiscountPercent?: boolean;
    availableStock?: number;
    itemAvailableFrom?: string;
    itemAvailableFromTimezone?: string;
    brand?: string;
    condition?: string;
    countryOfManufacture?: string;
    model?: string;
    itemModified?: boolean;
    weightKgs?: number;
    returnsAllowed?: boolean;
    deleted?: boolean;
    createdByUserInfo?: CreatedByUserInfo;
    category?:
      | {
          name?: string;
          fullPath?: string;
        }
      | string;
    pickupLocations?: PickupLocation[];
  } & ProductImageUrls;
  title?: string;
  upc?: string;
  length?: number;
  breadth?: number;
  width?: number;
  height?: number;
  price?: number;
  discount?: number;
  discountPercent?: boolean;
  isDiscountPercent?: boolean;
  availableStock?: number;
  itemAvailableFrom?: string;
  itemAvailableFromTimezone?: string;
  brand?: string;
  condition?: string;
  countryOfManufacture?: string;
  model?: string;
  itemModified?: boolean;
  weightKgs?: number;
  returnsAllowed?: boolean;
  isDeleted?: boolean;
  deleted?: boolean;
  createdByUserInfo?: CreatedByUserInfo;
  category?:
    | {
        name?: string;
        fullPath?: string;
      }
    | string;
  pickupLocations?: PickupLocation[];
}

/**
 * Options for configuring product grid columns
 */
export interface ProductGridColumnOptions {
  /** Handler for toggling product active state */
  onToggleProduct: (productId: number) => void
  /** Handler for toggling returns allowed */
  onToggleReturns: (productId: number) => void
  /** When true, displays a Quantity column (used for pickup location inventory view) */
  displayQuantity?: boolean
  /** The pickup location ID to get quantity from (required when displayQuantity is true) */
  pickupLocationId?: number
  /** When true, makes quantity column editable with a text input */
  quantityEditable?: boolean
  /** Map of productId to quantity value (used when quantityEditable is true) */
  quantityValues?: Record<number, number>
  /** Callback when quantity is changed (used when quantityEditable is true) */
  onQuantityChange?: (productId: number, quantity: number) => void
  /** Set of selected product IDs (used when quantityEditable is true to show input only for selected rows) */
  selectedProductIds?: Set<number>
}

/**
 * Get product grid columns with action handlers
 */
export const getProductGridColumns = (
  onToggleProduct: (productId: number) => void,
  onToggleReturns: (productId: number) => void,
  options?: {
    displayQuantity?: boolean
    pickupLocationId?: number
    quantityEditable?: boolean
    quantityValues?: Record<number, number>
    onQuantityChange?: (productId: number, quantity: number) => void
    selectedProductIds?: Set<number>
  }
): GridColDef[] => {
  const {
    displayQuantity = false,
    pickupLocationId,
    quantityEditable = false,
    quantityValues = {},
    onQuantityChange,
    selectedProductIds,
  } = options ?? {}

  const baseColumns: GridColDef[] = [
  {
    field: "productId",
    headerName: "Product ID",
    hideable: false,
    filterable: false,
    width: 0,
    minWidth: 0,
  },
  {
    field: "mainImageUrl",
    headerName: "Images",
    minWidth: 180,
    flex: 1,
    sortable: false,
    filterable: false,
    align: "center",
    headerAlign: "center",
    cellClassName: "product-grid__images-cell",
    renderCell: (params: GridRenderCellParams<ProductData>) => {
      const rowData = params.row;
      const product = rowData.product;

      // Collect all available images with labels
      const images: Array<{ url: string; label: string }> = [
        { url: rowData.mainImageUrl ?? product?.mainImageUrl ?? "", label: "Main" },
        { url: rowData.topImageUrl ?? product?.topImageUrl ?? "", label: "Top" },
        { url: rowData.bottomImageUrl ?? product?.bottomImageUrl ?? "", label: "Bottom" },
        { url: rowData.frontImageUrl ?? product?.frontImageUrl ?? "", label: "Front" },
        { url: rowData.backImageUrl ?? product?.backImageUrl ?? "", label: "Back" },
        { url: rowData.rightImageUrl ?? product?.rightImageUrl ?? "", label: "Right" },
        { url: rowData.leftImageUrl ?? product?.leftImageUrl ?? "", label: "Left" },
        { url: rowData.detailsImageUrl ?? product?.detailsImageUrl ?? "", label: "Details" },
        { url: rowData.defectImageUrl ?? product?.defectImageUrl ?? "", label: "Defect" },
        { url: rowData.additionalImage1Url ?? product?.additionalImage1Url ?? "", label: "Additional 1" },
        { url: rowData.additionalImage2Url ?? product?.additionalImage2Url ?? "", label: "Additional 2" },
        { url: rowData.additionalImage3Url ?? product?.additionalImage3Url ?? "", label: "Additional 3" },
      ];

      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            width: "100%",
            p: 0,
            m: 0,
            gap: 0,
          }}
        >
          <ProductImageCarousel
            images={images}
            variant="grid"
            size={150}
            fallbackLetter={rowData.title?.[0] ?? "P"}
          />
        </Box>
      );
    },
  },
  {
    field: "title",
    headerName: "Title",
    flex: 2,
    minWidth: 250,
    headerAlign: "left",
    valueGetter: (_value, row: ProductData) => {
      const rowData = row;
      const title = rowData.title ?? rowData.product?.title;
      if (!title) return "—";
      return typeof title === "string" ? title : String(title);
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        <RenderLongCellItem value={String(params.value || "")} />
      </Box>
    ),
  },
  {
    field: "category",
    headerName: "Category",
    flex: 2,
    minWidth: 250,
    headerAlign: "left",
    valueGetter: (_value, row: ProductData) => {
      const rowData = row;
      // The API returns category as ProductCategoryResponseModel object with fullPath
      if (
        rowData.category &&
        typeof rowData.category === "object"
      ) {
        // Prefer fullPath over name for complete category hierarchy
        return rowData.category.fullPath ?? rowData.category.name ?? "—";
      }
      // Fallback for nested product object
      if (
        rowData.product?.category &&
        typeof rowData.product.category === "object"
      ) {
        return rowData.product.category.fullPath ?? rowData.product.category.name ?? "—";
      }
      // If it's already a string
      if (typeof rowData.category === "string") {
        return rowData.category;
      }
      return "—";
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        <RenderLongCellItem value={String(params.value || "—")} />
      </Box>
    ),
  },
  {
    field: "upc",
    headerName: "UPC",
    minWidth: 150,
    flex: 1,
    headerAlign: "left",
    valueGetter: (_value, row: ProductData) => {
      const rowData = row;
      const upc = rowData.upc ?? rowData.product?.upc;
      if (!upc) return "—";
      return typeof upc === "string" ? upc : String(upc);
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        <RenderLongCellItem value={String(params.value || "")} />
      </Box>
    ),
  },
  {
    field: "dimensions",
    headerName: "Dimensions (L x W x H)",
    minWidth: 180,
    flex: 1.2,
    headerAlign: "left",
    valueGetter: (_value, row: ProductData) => {
      const rowData = row;
      const length = rowData.length ?? rowData.product?.length;
      const breadth =
        rowData.breadth ?? rowData.width ?? rowData.product?.breadth;
      const height = rowData.height ?? rowData.product?.height;
      if (!length && !breadth && !height) return "—";
      return `${length ?? 0} x ${breadth ?? 0} x ${height ?? 0}`;
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        {params.value}
      </Box>
    ),
  },
  {
    field: "price",
    headerName: "Price",
    minWidth: 120,
    flex: 0.8,
    headerAlign: "left",
    valueGetter: (_value, row: ProductData) => {
      const rowData = row;
      const price = rowData.price ?? rowData.product?.price;
      if (price == null) return "—";
      return `₹ ${price}`;
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        {params.value}
      </Box>
    ),
  },
  {
    field: "discount",
    headerName: "Discount",
    minWidth: 120,
    flex: 0.8,
    headerAlign: "left",
    valueGetter: (_value, row: ProductData) => {
      const rowData = row;
      const discount = rowData.discount ?? rowData.product?.discount;
      if (discount == null) return "—";
      // Check both isDiscountPercent (API field name) and discountPercent (legacy)
      const isPercent =
        rowData.isDiscountPercent ?? rowData.product?.isDiscountPercent ??
        rowData.discountPercent ?? rowData.product?.discountPercent ?? false;
      return isPercent ? `${discount}%` : `₹ ${discount}`;
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        {params.value}
      </Box>
    ),
  },
  {
    field: "itemAvailableFrom",
    headerName: "Available From",
    minWidth: 220,
    flex: 1.2,
    headerAlign: "left",
    valueGetter: (_value, row: ProductData) => {
      const rowData = row;
      const date =
        rowData.itemAvailableFrom ?? rowData.product?.itemAvailableFrom;
      if (!date) return "—";
      try {
        return format(new Date(date), "do MMM yyyy, HH:mm");
      } catch {
        return "—";
      }
    },
    renderCell: (params: GridRenderCellParams<ProductData>) => {
      const rowData = params.row;
      const date =
        rowData.itemAvailableFrom ?? rowData.product?.itemAvailableFrom;
      const timezone =
        rowData.itemAvailableFromTimezone ??
        rowData.product?.itemAvailableFromTimezone;

      if (!date) {
        return <span>—</span>;
      }

      let formattedDate = "—";
      try {
        formattedDate = format(new Date(date), "do MMM yyyy, HH:mm");
      } catch {
        return <span>—</span>;
      }

      // Get short timezone name (e.g., "IST" from "Asia/Kolkata")
      const getShortTimezone = (tz: string): string => {
        const timezoneMap: Record<string, string> = {
          "Asia/Kolkata": "IST",
          UTC: "UTC",
          "America/New_York": "EST",
          "America/Chicago": "CST",
          "America/Denver": "MST",
          "America/Los_Angeles": "PST",
          "Europe/London": "GMT",
          "Europe/Paris": "CET",
          "Europe/Berlin": "CET",
          "Asia/Tokyo": "JST",
          "Asia/Shanghai": "CST",
          "Asia/Singapore": "SGT",
          "Asia/Dubai": "GST",
          "Australia/Sydney": "AEST",
          "Pacific/Auckland": "NZST",
        };
        return timezoneMap[tz] ?? tz;
      };

      const displayText = timezone
        ? `${formattedDate} (${getShortTimezone(timezone)})`
        : formattedDate;

      const tooltipText = timezone
        ? `${formattedDate} • ${timezone}`
        : formattedDate;

      return (
        <Tooltip title={tooltipText}>
          <span>{displayText}</span>
        </Tooltip>
      );
    },
  },
  {
    field: "brand",
    headerName: "Brand",
    minWidth: 150,
    flex: 1,
    headerAlign: "left",
    valueGetter: (_value, row: ProductData) => {
      const rowData = row;
      const brand = rowData.brand ?? rowData.product?.brand;
      if (!brand) return "—";
      return brand;
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        <RenderLongCellItem value={String(params.value || "—")} />
      </Box>
    ),
  },
  {
    field: "condition",
    headerName: "Condition",
    minWidth: 180,
    flex: 1,
    headerAlign: "left",
    valueGetter: (_value, row: ProductData) => {
      const rowData = row;
      const condition = rowData.condition ?? rowData.product?.condition;
      if (!condition) return "—";
      return condition;
    },
    renderCell: (params: GridRenderCellParams) => {
      const conditionValue = params.value as string;

      if (!conditionValue || conditionValue === "—") {
        return <span>—</span>;
      }

      // Get label and color from appConstants
      const label = getConditionLabel(conditionValue);
      const color = getConditionColor(conditionValue);

      return (
          <Chip
          label={label}
          color={color}
            size="small"
          />
      );
    },
  },
  {
    field: "countryOfManufacture",
    headerName: "Country of Manufacture",
    minWidth: 180,
    flex: 1.2,
    headerAlign: "left",
    valueGetter: (_value, row: ProductData) => {
      const rowData = row;
      const country =
        rowData.countryOfManufacture ?? rowData.product?.countryOfManufacture;
      if (!country) return "—";
      return country;
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        <RenderLongCellItem value={String(params.value || "—")} />
      </Box>
    ),
  },
  {
    field: "model",
    headerName: "Model",
    minWidth: 150,
    flex: 1,
    headerAlign: "left",
    valueGetter: (_value, row: ProductData) => {
      const rowData = row;
      const model = rowData.model ?? rowData.product?.model;
      if (!model) return "—";
      return model;
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        <RenderLongCellItem value={String(params.value || "—")} />
      </Box>
    ),
  },
  {
    field: "itemModified",
    headerName: "Item Modified",
    minWidth: 130,
    flex: 0.8,
    headerAlign: "left",
    valueGetter: (_value, row: ProductData) => {
      const rowData = row;
      const modified = rowData.itemModified ?? rowData.product?.itemModified;
      if (modified == null) return "—";
      return modified ? "Yes" : "No";
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        {params.value}
      </Box>
    ),
  },
  {
    field: "weightKgs",
    headerName: "Weight (kg)",
    minWidth: 120,
    flex: 0.8,
    headerAlign: "left",
    valueGetter: (_value, row: ProductData) => {
      const rowData = row;
      const weight = rowData.weightKgs ?? rowData.product?.weightKgs;
      if (weight == null) return "—";
      return `${weight} kg`;
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
        {params.value}
      </Box>
    ),
  },
  {
    field: "pickupLocations",
    headerName: "Pickup Locations",
    minWidth: 150,
    flex: 1,
    align: "center",
    headerAlign: "center",
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams<ProductData>) => {
      const rowData = params.row;
      const locations =
        rowData.pickupLocations ?? rowData.product?.pickupLocations ?? [];
      const productTitle = rowData.title ?? rowData.product?.title;

      if (locations.length === 0) {
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            —
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
          <PickupLocationsButton
            locations={locations as never}
            productTitle={productTitle}
          />
        </Box>
      );
    },
  },
  {
    field: "returnsAllowed",
    headerName: "Returns Allowed",
    minWidth: 150,
    flex: 1,
    align: "center",
    headerAlign: "center",
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams<ProductData>) => {
      const rowData = params.row;
      const productId = rowData.productId ?? rowData.product?.productId;
      const returnsAllowed =
        rowData.returnsAllowed ?? rowData.product?.returnsAllowed ?? false;

      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <Switch
            checked={returnsAllowed}
            onChange={() => {
              if (productId != null) {
                onToggleReturns(productId);
              }
            }}
            color="primary"
            size="small"
          />
        </Box>
      );
    },
  },
  {
    field: "createdByUserInfo",
    headerName: "Created By",
    minWidth: 220,
    flex: 1.2,
    valueGetter: (_value, row: ProductData) => {
      const rowData = row;
      const createdByUserInfo =
        rowData.createdByUserInfo ?? rowData.product?.createdByUserInfo;
      if (!createdByUserInfo) return "—";
      // Return full name for sorting/filtering
      const fullName =
        createdByUserInfo.fullName ??
        `${createdByUserInfo.firstName ?? ""} ${createdByUserInfo.lastName ?? ""}`.trim();
      return fullName || createdByUserInfo.loginName || "—";
    },
    renderCell: (params: GridRenderCellParams<ProductData>) => {
      const rowData = params.row;
      const createdByUserInfo =
        rowData.createdByUserInfo ?? rowData.product?.createdByUserInfo;

      if (!createdByUserInfo) {
        return <span>—</span>;
      }

      const firstName = createdByUserInfo.firstName ?? "";
      const lastName = createdByUserInfo.lastName ?? "";
      const loginName = createdByUserInfo.loginName ?? "";
      const fullName =
        createdByUserInfo.fullName ??
        (`${firstName} ${lastName}`.trim() || loginName || "Unknown");

      // Display: "First Last (loginName)"
      const displayText = loginName
        ? `${fullName} (${loginName})`
        : fullName;

      // Tooltip shows full details
      const tooltipText = `${fullName}${loginName ? ` • ${loginName}` : ""}`;

      return (
        <Tooltip title={tooltipText}>
          <span>{displayText}</span>
        </Tooltip>
      );
    },
  },
  {
    field: "actions",
    headerName: "Actions",
    minWidth: 200,
    flex: 1.2,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams<ProductData>) => {
      const rowData = params.row;
      const productId = rowData.productId ?? rowData.product?.productId ?? 0;
      const isDeleted =
        rowData.isDeleted ??
        rowData.deleted ??
        rowData.product?.deleted ??
        false;

      return (
        <ProductActionsCell
          productId={productId}
          isDeleted={isDeleted}
          onToggleProduct={onToggleProduct}
        />
      );
    },
  },
  ]

  // Add quantity column if displayQuantity is enabled (read-only, from API)
  if (displayQuantity && pickupLocationId !== undefined && !quantityEditable) {
    // Insert quantity column after title column
    const titleIndex = baseColumns.findIndex(col => col.field === 'title')
    const quantityColumn: GridColDef = {
      field: 'availableStock',
      headerName: 'Quantity',
      minWidth: 120,
      flex: 0.8,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      valueGetter: (_value, row: ProductData) => {
        const rowData = row
        const locations = rowData.pickupLocations ?? rowData.product?.pickupLocations ?? []
        // Find the pickup location item that matches the given pickupLocationId
        // The response format is: { pickupLocation: { pickupLocationId, ... }, availableStock: number }
        const locationItem = locations.find(
          (loc: PickupLocation) => {
            const locData = loc as unknown as { pickupLocation?: { pickupLocationId?: number }; pickupLocationId?: number }
            return (locData.pickupLocation?.pickupLocationId === pickupLocationId) ||
                   (locData.pickupLocationId === pickupLocationId)
          }
        )
        if (locationItem) {
          const itemData = locationItem as unknown as { availableStock?: number }
          return itemData.availableStock ?? 0
        }
        return 0
      },
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          {params.value}
        </Box>
      ),
    }
    baseColumns.splice(titleIndex + 1, 0, quantityColumn)
  }

  // Add editable quantity column if quantityEditable is enabled
  if (quantityEditable) {
    // Insert quantity column after title column
    const titleIndex = baseColumns.findIndex(col => col.field === 'title')
    const quantityColumn: GridColDef = {
      field: 'editableQuantity',
      headerName: 'Quantity',
      minWidth: 120,
      flex: 0.8,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<ProductData>) => {
        const productId = params.row.productId ?? params.row.product?.productId ?? 0
        const isSelected = selectedProductIds?.has(productId) ?? false
        const currentValue = quantityValues[productId]

        // Only show input for selected rows
        if (!isSelected) {
          return (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              —
            </Box>
          )
        }

        return (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", py: 1 }}>
            <QuantityInput
              initialValue={currentValue}
              onValueChange={(value) => onQuantityChange?.(productId, value)}
            />
          </Box>
        )
      },
    }
    baseColumns.splice(titleIndex + 1, 0, quantityColumn)
  }

  return baseColumns
}
