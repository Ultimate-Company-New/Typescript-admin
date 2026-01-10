import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Close as CloseIcon,
  Code as CodeIcon,
  LocalShipping as ShippingIcon,
} from "@mui/icons-material";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
} from "@mui/material";
import {
  type GridColumnVisibilityModel,
  type GridFilterModel,
  type GridPaginationModel,
  type GridSlotsComponent,
  type GridSortModel,
  type GridToolbarProps,
} from "@mui/x-data-grid";

import shipmentApi from "../../api/shipmentApi";
import { type OptimizationShipment } from "../../api/shippingApi";
import { IconButton as CustomIconButton } from "../../components/buttons";
import {
  CustomNoRowsOverlay,
  GridDensity,
  LogicOperator,
  SimpleToolbar,
  StyledDataGrid,
  createFetchFunction,
  handleFilterModelChange,
  handleIncludeDeletedChange,
  handlePaginationModelChange,
  handleSortModelChange,
  type FilterGroup,
  type GridDensityType,
} from "../../components/datagrid";
import { Subheader } from "../../components/fonts";
import {
  type PackageProductResponseData,
  type ShipmentData,
} from "../../models/api-models/ShipmentModels";
import {
  getShipmentGridColumns,
  type ShipmentGridCallbacks,
} from "../../models/grid-models/ShipmentGridColumns";
import { type PaginatedGridInterface } from "../../types/grid.types";
import ProductModal from "../pickupLocations/components/ProductModal";
import ShipmentPackagesList from "../purchaseOrders/components/ShipmentPackagesList";

import styles from "../../styles/PurchaseOrders.module.scss";

/**
 * Convert ShipmentData to OptimizationShipment format
 * This allows us to reuse existing shipment display components
 */
const convertShipmentToOptimizationFormat = (
  shipment: ShipmentData
): OptimizationShipment => {
  // Extract pickup location address
  const pickupLocationAddress = shipment.pickupLocation?.address;

  // Build address object
  const addressObj:
    | OptimizationShipment["pickupLocation"]["address"]
    | undefined = pickupLocationAddress
    ? {
        addressId: pickupLocationAddress.addressId,
        addressType: pickupLocationAddress.addressType || "",
        streetAddress: pickupLocationAddress.streetAddress || "",
        streetAddress2: pickupLocationAddress.streetAddress2 || "",
        streetAddress3: pickupLocationAddress.streetAddress3 || "",
        city: pickupLocationAddress.city || "",
        state: pickupLocationAddress.state || "",
        postalCode: pickupLocationAddress.postalCode || "",
        country: pickupLocationAddress.country || "",
        nameOnAddress: pickupLocationAddress.nameOnAddress || "",
        emailOnAddress: pickupLocationAddress.emailOnAddress || "",
        phoneOnAddress: pickupLocationAddress.phoneOnAddress || "",
      }
    : undefined;

  return {
    pickupLocation: {
      pickupLocationId: shipment.pickupLocationId,
      addressNickName:
        shipment.pickupLocation?.addressNickName || "Unknown Location",
      address: addressObj,
    },
    products: (shipment.products || []).map((sp) => {
      const productAny = sp as unknown as
        | Record<string, unknown>
        | null
        | undefined;
      return {
        product: sp
          ? {
              productId: sp.productId,
              title: sp.title || "Unknown Product",
              weightKgs: sp.weightKgs,
              length: sp.length,
              breadth: sp.breadth,
              height: sp.height,
              mainImageUrl: sp.mainImageUrl,
              topImageUrl: productAny?.topImageUrl as string | undefined,
              bottomImageUrl: productAny?.bottomImageUrl as string | undefined,
              frontImageUrl: productAny?.frontImageUrl as string | undefined,
              backImageUrl: productAny?.backImageUrl as string | undefined,
              rightImageUrl: productAny?.rightImageUrl as string | undefined,
              leftImageUrl: productAny?.leftImageUrl as string | undefined,
              detailsImageUrl: productAny?.detailsImageUrl as
                | string
                | undefined,
              defectImageUrl: productAny?.defectImageUrl as string | undefined,
              additionalImage1Url: productAny?.additionalImage1Url as
                | string
                | undefined,
              additionalImage2Url: productAny?.additionalImage2Url as
                | string
                | undefined,
              additionalImage3Url: productAny?.additionalImage3Url as
                | string
                | undefined,
              price: sp.allocatedPrice,
              discount: undefined,
              isDiscountPercent: false,
            }
          : {
              productId: 0,
              title: "Unknown Product",
            },
        allocatedQuantity: sp?.allocatedQuantity || 0,
        totalWeight:
          (shipment.totalWeightKgs ?? 0) *
          ((sp?.allocatedQuantity || 0) / (shipment.totalQuantity || 1)),
      };
    }),
    totalWeightKgs: shipment.totalWeightKgs ?? 0,
    totalQuantity: shipment.totalQuantity ?? 0,
    packagesUsed: (shipment.packages || []).map((pkg) => ({
      packageInfo: pkg
        ? {
            packageId: pkg.packageId,
            packageName: pkg.packageName || "Unknown Package",
            packageType: pkg.packageType || "Standard",
            length: pkg.length,
            breadth: pkg.breadth,
            height: pkg.height,
            maxWeight: pkg.maxWeight,
            pricePerUnit: pkg.pricePerUnit,
          }
        : {
            packageId: pkg?.packageId || 0,
            packageName: "Unknown Package",
            packageType: "Standard",
          },
      quantityUsed: pkg?.quantityUsed || 0,
      totalCost: pkg?.totalCost || 0,
      productIds:
        pkg.products?.map(
          (prod: PackageProductResponseData) => prod.productId ?? 0
        ) || [],
      productDetails:
        pkg.products?.map((prod: PackageProductResponseData) => ({
          productId: prod.productId ?? 0,
          quantity: prod.quantity ?? 0,
        })) || [],
    })),
    packagingCost: shipment.packagingCost ?? 0,
    shippingCost: shipment.shippingCost ?? 0,
    totalCost: shipment.totalCost ?? 0,
    availableCouriers: shipment.selectedCourierCompanyId
      ? [
          {
            courierCompanyId: shipment.selectedCourierCompanyId,
            courierName: shipment.selectedCourierName || "Unknown Courier",
            courierType: "Standard",
            rate: shipment.selectedCourierRate || 0,
            codCharges: 0,
            freightCharge: 0,
            estimatedDeliveryDays: "N/A",
            etd: "N/A",
            rating: 0,
            deliveryPerformance: 0,
            pickupPerformance: 0,
            city: "",
            state: "",
            chargeWeight: shipment.totalWeightKgs ?? 0,
            isSurface: true,
            realtimeTracking: "N/A",
          },
        ]
      : [],
  };
};

/**
 * Shipments Management Page with DataGrid
 * Features:
 * - Server-side pagination
 * - Custom multi-column filtering
 * - Sorting
 * - Include Deleted toggle
 * - Responsive design
 * - Product, Package, and Courier Metadata modals
 */
const Shipments = (): React.JSX.Element => {
  const [rows, setRows] = useState<ShipmentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [density, setDensity] = useState<GridDensityType>(GridDensity.STANDARD);
  const [activeFilterGroup, setActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  });
  const [columnVisibilityModel, setColumnVisibilityModel] =
    useState<GridColumnVisibilityModel>({
      shipmentId: false,
    });
  const [visibleColumnFields, setVisibleColumnFields] = useState<string[]>([]);

  // Product modal state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<
    Array<{ productId: number; quantity: number; pricePerUnit?: number }>
  >([]);

  // Packages modal state
  const [packagesModalOpen, setPackagesModalOpen] = useState(false);
  const [selectedShipmentForPackages, setSelectedShipmentForPackages] =
    useState<OptimizationShipment | null>(null);

  // Courier metadata modal state
  const [courierMetadataModalOpen, setCourierMetadataModalOpen] =
    useState(false);
  const [selectedCourierMetadata, setSelectedCourierMetadata] = useState<
    string | null
  >(null);
  const [selectedCourierName, setSelectedCourierName] = useState<string>("");

  // ShipRocket metadata modal state
  const [shipRocketMetadataModalOpen, setShipRocketMetadataModalOpen] =
    useState(false);
  const [selectedShipRocketMetadata, setSelectedShipRocketMetadata] = useState<
    string | null
  >(null);
  const [selectedShipRocketOrderId, setSelectedShipRocketOrderId] =
    useState<string>("");

  // Pagination model
  const [paginationModel, setPaginationModel] =
    useState<PaginatedGridInterface>({
      start: 0,
      end: 25,
      pageSize: 25,
      includeDeleted: false,
      actualDataCount: 0,
      totalPaginationBlockCount: 0,
    });

  // Handle products click
  const handleProductsClick = useCallback((shipment: ShipmentData): void => {
    const products = shipment.products ?? [];
    const productsData = products.map((p) => ({
      productId: p.productId ?? 0,
      quantity: p.allocatedQuantity ?? 0,
      pricePerUnit: p.allocatedPrice ?? undefined,
    }));
    setSelectedProducts(productsData);
    setProductModalOpen(true);
  }, []);

  // Handle packages click
  const handlePackagesClick = useCallback((shipment: ShipmentData): void => {
    const converted = convertShipmentToOptimizationFormat(shipment);
    setSelectedShipmentForPackages(converted);
    setPackagesModalOpen(true);
  }, []);

  // Handle courier metadata click
  const handleCourierMetadataClick = useCallback(
    (shipment: ShipmentData): void => {
      setSelectedCourierMetadata(shipment.selectedCourierMetadata ?? null);
      setSelectedCourierName(shipment.selectedCourierName ?? "Courier");
      setCourierMetadataModalOpen(true);
    },
    []
  );

  // Handle ShipRocket metadata click
  const handleShipRocketMetadataClick = useCallback(
    (shipment: ShipmentData): void => {
      setSelectedShipRocketMetadata(shipment.shipRocketFullResponse ?? null);
      setSelectedShipRocketOrderId(shipment.shipRocketOrderId ?? "");
      setShipRocketMetadataModalOpen(true);
    },
    []
  );

  // Grid callbacks
  const gridCallbacks: ShipmentGridCallbacks = useMemo(
    () => ({
      onProductsClick: handleProductsClick,
      onPackagesClick: handlePackagesClick,
      onCourierMetadataClick: handleCourierMetadataClick,
      onShipRocketMetadataClick: handleShipRocketMetadataClick,
    }),
    [handleProductsClick, handlePackagesClick, handleCourierMetadataClick, handleShipRocketMetadataClick]
  );

  // Get grid columns with callbacks
  const columns = useMemo(
    () => getShipmentGridColumns(gridCallbacks),
    [gridCallbacks]
  );

  useEffect(() => {
    setVisibleColumnFields(
      columns
        .filter(
          (col) =>
            columnVisibilityModel[col.field] !== false &&
            !["shipmentId"].includes(col.field)
        )
        .map((col) => col.field)
    );
  }, [columnVisibilityModel, columns]);

  // Fetch shipments on mount and when pagination model changes
  useEffect(() => {
    void createFetchFunction(
      shipmentApi.getShipmentsInBatches,
      setLoading,
      setRows,
      setTotalCount,
      paginationModel,
      includeDeleted,
      activeFilterGroup
    );
  }, [paginationModel, includeDeleted, activeFilterGroup]);

  return (
    <Box className={styles["purchase-orders-page"]}>
      <Box className={styles["purchase-orders-page__container"]}>
        <Box
          className={styles["purchase-orders-page__card"]}
          data-test-id="shipments-grid-card"
        >
          {/* DataGrid with custom toolbar and integrated pagination */}
          <StyledDataGrid
            dataTestId="shipments-data-grid"
            rows={rows}
            columns={columns}
            loading={loading}
            rowCount={totalCount}
            totalCount={totalCount}
            paginationModelState={paginationModel}
            setPaginationModel={setPaginationModel}
            density={density}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={(model) => {
              setColumnVisibilityModel(model);
            }}
            paginationModel={{
              page: Math.floor(
                paginationModel.start / paginationModel.pageSize
              ),
              pageSize: paginationModel.pageSize,
            }}
            onPaginationModelChange={(model: GridPaginationModel) => {
              handlePaginationModelChange(model, setPaginationModel);
            }}
            onFilterModelChange={(model: GridFilterModel) => {
              handleFilterModelChange(
                model,
                paginationModel,
                setPaginationModel
              );
            }}
            onSortModelChange={(model: GridSortModel) => {
              handleSortModelChange(model, setPaginationModel);
            }}
            getRowId={(row): number => {
              const shipmentData = row as ShipmentData;
              return shipmentData.shipmentId ?? 0;
            }}
            getRowClassName={(params) => {
              const classes = [
                (params as { indexRelativeToCurrentPage: number })
                  .indexRelativeToCurrentPage %
                  2 ===
                0
                  ? "even"
                  : "odd",
              ];
              return classes.join(" ");
            }}
            slots={{
              toolbar: SimpleToolbar as GridSlotsComponent["toolbar"],
              noRowsOverlay: CustomNoRowsOverlay,
            }}
            slotProps={{
              toolbar: {
                density,
                onDensityChange: setDensity,
                columns,
                onFiltersChange: setActiveFilterGroup,
                activeFilterGroup,
                rows,
                includeDeleted,
                onIncludeDeletedChange: (checked: boolean) => {
                  handleIncludeDeletedChange(
                    checked,
                    setIncludeDeleted,
                    setPaginationModel
                  );
                },
                visibleColumnFields,
                columnVisibilityModel,
                onColumnVisibilityChange: setColumnVisibilityModel,
              } as GridToolbarProps,
            }}
            showToolbar
            disableRowSelectionOnClick
            disableColumnMenu={false}
          />
        </Box>
      </Box>

      {/* Product Modal */}
      <ProductModal
        open={productModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setSelectedProducts([]);
        }}
        purchaseOrderProducts={selectedProducts}
      />

      {/* Packages Modal */}
      <Dialog
        open={packagesModalOpen}
        onClose={() => {
          setPackagesModalOpen(false);
          setSelectedShipmentForPackages(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: styles["shipping-optimization-modal__paper"],
        }}
      >
        <DialogTitle className={styles["shipping-optimization-modal__title"]}>
          <Box className={styles["shipping-optimization-modal__title-left"]}>
            <ShippingIcon color="primary" />
            <Subheader variant="h6" label="Package Details" />
          </Box>
          <CustomIconButton
            onClick={() => {
              setPackagesModalOpen(false);
              setSelectedShipmentForPackages(null);
            }}
            size="small"
          >
            <CloseIcon />
          </CustomIconButton>
        </DialogTitle>
        <DialogContent
          className={styles["shipping-optimization-modal__dialog-content"]}
        >
          {selectedShipmentForPackages && (
            <ShipmentPackagesList shipment={selectedShipmentForPackages} />
          )}
        </DialogContent>
      </Dialog>

      {/* Courier Metadata Modal */}
      <Dialog
        open={courierMetadataModalOpen}
        onClose={() => {
          setCourierMetadataModalOpen(false);
          setSelectedCourierMetadata(null);
          setSelectedCourierName("");
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className={styles["shipping-optimization-modal__title"]}>
          <Box className={styles["shipping-optimization-modal__title-left"]}>
            <CodeIcon color="primary" />
            <Subheader
              variant="h6"
              label={`Courier Metadata - ${selectedCourierName}`}
            />
          </Box>
          <CustomIconButton
            onClick={() => {
              setCourierMetadataModalOpen(false);
              setSelectedCourierMetadata(null);
              setSelectedCourierName("");
            }}
            size="small"
          >
            <CloseIcon />
          </CustomIconButton>
        </DialogTitle>
        <DialogContent>
          {selectedCourierMetadata && (
            <Paper
              variant="outlined"
              sx={{
                padding: 2,
                backgroundColor: "#0d1117",
                borderColor: "#30363d",
                borderRadius: 1,
                overflow: "auto",
                maxHeight: 500,
              }}
            >
              <Box
                component="pre"
                sx={{
                  fontFamily:
                    "SF Mono, Monaco, Inconsolata, Roboto Mono, Consolas, Courier New, monospace",
                  fontSize: "13px",
                  lineHeight: 1.6,
                  margin: 0,
                  color: "#c9d1d9",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {(() => {
                  try {
                    const metadata = JSON.parse(selectedCourierMetadata);
                    return JSON.stringify(metadata, null, 2);
                  } catch {
                    return selectedCourierMetadata;
                  }
                })()}
              </Box>
            </Paper>
          )}
        </DialogContent>
      </Dialog>

      {/* ShipRocket Metadata Modal */}
      <Dialog
        open={shipRocketMetadataModalOpen}
        onClose={() => {
          setShipRocketMetadataModalOpen(false);
          setSelectedShipRocketMetadata(null);
          setSelectedShipRocketOrderId("");
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle className={styles["shipping-optimization-modal__title"]}>
          <Box className={styles["shipping-optimization-modal__title-left"]}>
            <CodeIcon color="warning" />
            <Subheader
              variant="h6"
              label={`ShipRocket Order Details - ${selectedShipRocketOrderId}`}
            />
          </Box>
          <CustomIconButton
            onClick={() => {
              setShipRocketMetadataModalOpen(false);
              setSelectedShipRocketMetadata(null);
              setSelectedShipRocketOrderId("");
            }}
            size="small"
          >
            <CloseIcon />
          </CustomIconButton>
        </DialogTitle>
        <DialogContent>
          {selectedShipRocketMetadata && (
            <Paper
              variant="outlined"
              sx={{
                padding: 2,
                backgroundColor: "#0d1117",
                borderColor: "#30363d",
                borderRadius: 1,
                overflow: "auto",
                maxHeight: 600,
              }}
            >
              <Box
                component="pre"
                sx={{
                  fontFamily:
                    "SF Mono, Monaco, Inconsolata, Roboto Mono, Consolas, Courier New, monospace",
                  fontSize: "13px",
                  lineHeight: 1.6,
                  margin: 0,
                  color: "#c9d1d9",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {(() => {
                  try {
                    const metadata = JSON.parse(selectedShipRocketMetadata);
                    return JSON.stringify(metadata, null, 2);
                  } catch {
                    return selectedShipRocketMetadata;
                  }
                })()}
              </Box>
            </Paper>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Shipments;
