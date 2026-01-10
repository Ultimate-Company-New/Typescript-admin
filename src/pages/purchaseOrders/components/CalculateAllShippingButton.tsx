import { createContext, useCallback, useContext, useRef, useState } from "react";

import {
  Calculate as CalculateIcon,
  CheckCircle,
  Close as CloseIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Collapse,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";

import shippingApi, {
  type OrderOptimizationRequest,
} from "../../../api/shippingApi";
import { IconButton } from "../../../components/buttons";
import { BodyText, Subheader } from "../../../components/fonts";
import {
  parseProductsString,
  type ImportPurchaseOrderData,
  type ImportRowShippingResult,
} from "../../../models/bulk-import-models/ImportPurchaseOrderGridModel";
import type { ProductData } from "../../../models/grid-models/ProductGridColumns";
import styles from "../../../styles/PurchaseOrders.module.scss";

interface CalculateAllShippingButtonProps {
  importData: ImportPurchaseOrderData[];
  products: ProductData[];
  onRowUpdate: (
    rowNumber: number,
    shippingResult: ImportRowShippingResult
  ) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

interface RowProcessingResult {
  rowNumber: number;
  success: boolean;
  error?: string;
}

interface CalculateShippingContextType {
  showProgressDialog: boolean;
  isComplete: boolean;
  isCancelled: boolean;
  currentRowIndex: number;
  totalRows: number;
  currentRowNumber: number | null;
  progress: number;
  successCount: number;
  errorCount: number;
  processingResults: RowProcessingResult[];
  isProcessing: boolean;
  rowsNeedingProcessing: number;
  disabled: boolean;
  handleStartProcessing: () => void;
  handleCancel: () => void;
  handleCloseDialog: () => void;
}

const CalculateShippingContext = createContext<CalculateShippingContextType | null>(null);

/**
 * CalculateAllShippingButtonProvider Component
 *
 * Provides context for shipping calculation state.
 * Wraps both the button and progress components.
 */
const CalculateAllShippingButtonProvider = ({
  importData,
  products,
  onRowUpdate,
  disabled = false,
  children,
}: CalculateAllShippingButtonProps & { children: React.ReactNode }): JSX.Element => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [currentRowNumber, setCurrentRowNumber] = useState<number | null>(null);
  const [processingResults, setProcessingResults] = useState<
    RowProcessingResult[]
  >([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  // Use ref for cancellation flag so it can be checked in real-time during the async loop
  const cancelledRef = useRef(false);

  // Build product data map for image enrichment
  const buildProductDataMap = useCallback((): Map<number, ProductData> => {
    const productDataMap = new Map<number, ProductData>();
    products.forEach((p) => {
      const id = p.productId ?? p.product?.productId;
      if (id) {
        productDataMap.set(id, p);
      }
    });
    return productDataMap;
  }, [products]);

  // Calculate products subtotal
  const calculateProductsSubtotal = useCallback(
    (productsString: string): number => {
      const parsedProducts = parseProductsString(productsString);
      return parsedProducts.reduce(
        (sum, p) => sum + p.quantity * (p.pricePerUnit ?? 0),
        0
      );
    },
    []
  );

  // Process a single row
  const processRow = useCallback(
    async (
      row: ImportPurchaseOrderData,
      productDataMap: Map<number, ProductData>
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const parsedProducts = parseProductsString(row.products);

        if (parsedProducts.length === 0) {
          return { success: false, error: "No products found" };
        }

        if (!row.streetAddress || !row.city || !row.state || !row.postalCode) {
          return { success: false, error: "Missing delivery address" };
        }

        // Build product quantities for the API request
        const productQuantities: Record<number, number> = {};
        parsedProducts.forEach((item) => {
          productQuantities[item.productId] = item.quantity;
        });

        const request: OrderOptimizationRequest = {
          productQuantities,
          deliveryPostcode: row.postalCode,
          isCod: false,
        };

        const response = await shippingApi.optimizeOrder(request);

        if (
          !response.success ||
          !response.shipments ||
          response.shipments.length === 0
        ) {
          return {
            success: false,
            error: response.errorMessage || "No shipping options available",
          };
        }

        // Build shipping result using system recommended (cheapest) couriers
        const courierSelections = new Map<
          number,
          (typeof response.shipments)[0]["availableCouriers"][0]
        >();

        // Select cheapest courier for each shipment
        response.shipments.forEach((shipment, index) => {
          if (
            shipment.availableCouriers &&
            shipment.availableCouriers.length > 0
          ) {
            // API returns couriers sorted by rate (cheapest first)
            courierSelections.set(index, shipment.availableCouriers[0]);
          }
        });

        // Build shipment summaries
        const shipments = response.shipments.map((shipment, index) => {
          const selectedCourier = courierSelections.get(index);
          return {
            pickupLocationId: shipment.pickupLocation?.pickupLocationId ?? 0,
            pickupLocationName: shipment.pickupLocation?.addressNickName,
            totalWeightKgs: shipment.totalWeightKgs,
            totalQuantity: shipment.totalQuantity,
            productsCount: shipment.products?.length ?? 0,
            packagesCount: shipment.packagesUsed?.length ?? 0,
            packagingCost: shipment.packagingCost,
            shippingCost: selectedCourier?.rate ?? 0,
            courierName: selectedCourier?.courierName,
            estimatedDeliveryDays: selectedCourier?.estimatedDeliveryDays
              ? parseInt(selectedCourier.estimatedDeliveryDays, 10) || undefined
              : undefined,
          };
        });

        // Enrich raw shipments with full product image data
        const enrichedRawShipments = response.shipments.map((shipment) => ({
          ...shipment,
          products: shipment.products.map((prodAlloc) => {
            const fullProduct = productDataMap.get(prodAlloc.product.productId);
            return {
              ...prodAlloc,
              product: {
                ...prodAlloc.product,
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
        }));

        // Calculate totals
        const productsSubtotal = calculateProductsSubtotal(row.products);
        const totalShippingCost = Array.from(courierSelections.values()).reduce(
          (sum, c) => sum + (c?.rate ?? 0),
          0
        );
        const totalPackagingCost = response.shipments.reduce(
          (sum, s) => sum + s.packagingCost,
          0
        );
        const serviceFee = 0; // Default service fee for bulk processing

        const shippingResult: ImportRowShippingResult = {
          shipments,
          rawShipments: enrichedRawShipments,
          courierSelections,
          productsSubtotal,
          totalShippingCost,
          totalPackagingCost,
          serviceFee,
          grandTotal:
            productsSubtotal +
            totalShippingCost +
            totalPackagingCost +
            serviceFee,
        };

        // Update the row
        onRowUpdate(row.rowNumber, shippingResult);

        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: errorMessage };
      }
    },
    [calculateProductsSubtotal, onRowUpdate]
  );

  // Start processing all rows
  const handleStartProcessing = useCallback(async () => {
    // Filter rows that need shipping calculation
    const rowsToProcess = importData.filter(
      (row) => !row.shippingCalculated && row.validationErrors.length === 0
    );

    if (rowsToProcess.length === 0) {
      return;
    }

    setIsProcessing(true);
    setShowProgressDialog(true);
    setCurrentRowIndex(0);
    setTotalRows(rowsToProcess.length);
    setProcessingResults([]);
    setIsComplete(false);
    setIsCancelled(false);
    cancelledRef.current = false;

    const productDataMap = buildProductDataMap();
    const results: RowProcessingResult[] = [];

    for (let i = 0; i < rowsToProcess.length; i++) {
      // Check if cancelled using ref for real-time value
      if (cancelledRef.current) {
        break;
      }

      const row = rowsToProcess[i];
      setCurrentRowIndex(i + 1);
      setCurrentRowNumber(row.rowNumber);

      const result = await processRow(row, productDataMap);
      results.push({
        rowNumber: row.rowNumber,
        success: result.success,
        error: result.error,
      });
      setProcessingResults([...results]);
    }

    setIsComplete(true);
    setIsProcessing(false);
  }, [importData, buildProductDataMap, processRow]);

  // Cancel processing
  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    setIsCancelled(true);
  }, []);

  // Close dialog
  const handleCloseDialog = useCallback(() => {
    setShowProgressDialog(false);
    setCurrentRowIndex(0);
    setTotalRows(0);
    setCurrentRowNumber(null);
    setProcessingResults([]);
    setIsComplete(false);
    setIsCancelled(false);
    cancelledRef.current = false;
  }, []);

  // Count rows that need processing
  const rowsNeedingProcessing = importData.filter(
    (row) => !row.shippingCalculated && row.validationErrors.length === 0
  ).length;

  const successCount = processingResults.filter((r) => r.success).length;
  const errorCount = processingResults.filter((r) => !r.success).length;
  const progress = totalRows > 0 ? (currentRowIndex / totalRows) * 100 : 0;

  const contextValue: CalculateShippingContextType = {
    showProgressDialog,
    isComplete,
    isCancelled,
    currentRowIndex,
    totalRows,
    currentRowNumber,
    progress,
    successCount,
    errorCount,
    processingResults,
    isProcessing,
    rowsNeedingProcessing,
    disabled,
    handleStartProcessing,
    handleCancel,
    handleCloseDialog,
  };

  return (
    <CalculateShippingContext.Provider value={contextValue}>
      {children}
    </CalculateShippingContext.Provider>
  );
};

/**
 * CalculateAllShippingButton Component
 *
 * Calculates system-recommended shipping for all rows in the import data.
 * Shows real-time progress with a progress bar and status updates.
 */
const CalculateAllShippingButton = ({
  importData,
  products,
  onRowUpdate,
  disabled = false,
  children,
}: CalculateAllShippingButtonProps): JSX.Element => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [currentRowNumber, setCurrentRowNumber] = useState<number | null>(null);
  const [processingResults, setProcessingResults] = useState<
    RowProcessingResult[]
  >([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  // Use ref for cancellation flag so it can be checked in real-time during the async loop
  const cancelledRef = useRef(false);

  // Build product data map for image enrichment
  const buildProductDataMap = useCallback((): Map<number, ProductData> => {
    const productDataMap = new Map<number, ProductData>();
    products.forEach((p) => {
      const id = p.productId ?? p.product?.productId;
      if (id) {
        productDataMap.set(id, p);
      }
    });
    return productDataMap;
  }, [products]);

  // Calculate products subtotal
  const calculateProductsSubtotal = useCallback(
    (productsString: string): number => {
      const parsedProducts = parseProductsString(productsString);
      return parsedProducts.reduce(
        (sum, p) => sum + p.quantity * (p.pricePerUnit ?? 0),
        0
      );
    },
    []
  );

  // Process a single row
  const processRow = useCallback(
    async (
      row: ImportPurchaseOrderData,
      productDataMap: Map<number, ProductData>
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const parsedProducts = parseProductsString(row.products);

        if (parsedProducts.length === 0) {
          return { success: false, error: "No products found" };
        }

        if (!row.streetAddress || !row.city || !row.state || !row.postalCode) {
          return { success: false, error: "Missing delivery address" };
        }

        // Build product quantities for the API request
        const productQuantities: Record<number, number> = {};
        parsedProducts.forEach((item) => {
          productQuantities[item.productId] = item.quantity;
        });

        const request: OrderOptimizationRequest = {
          productQuantities,
          deliveryPostcode: row.postalCode,
          isCod: false,
        };

        const response = await shippingApi.optimizeOrder(request);

        if (
          !response.success ||
          !response.shipments ||
          response.shipments.length === 0
        ) {
          return {
            success: false,
            error: response.errorMessage || "No shipping options available",
          };
        }

        // Build shipping result using system recommended (cheapest) couriers
        const courierSelections = new Map<
          number,
          (typeof response.shipments)[0]["availableCouriers"][0]
        >();

        // Select cheapest courier for each shipment
        response.shipments.forEach((shipment, index) => {
          if (
            shipment.availableCouriers &&
            shipment.availableCouriers.length > 0
          ) {
            // API returns couriers sorted by rate (cheapest first)
            courierSelections.set(index, shipment.availableCouriers[0]);
          }
        });

        // Build shipment summaries
        const shipments = response.shipments.map((shipment, index) => {
          const selectedCourier = courierSelections.get(index);
          return {
            pickupLocationId: shipment.pickupLocation?.pickupLocationId ?? 0,
            pickupLocationName: shipment.pickupLocation?.addressNickName,
            totalWeightKgs: shipment.totalWeightKgs,
            totalQuantity: shipment.totalQuantity,
            productsCount: shipment.products?.length ?? 0,
            packagesCount: shipment.packagesUsed?.length ?? 0,
            packagingCost: shipment.packagingCost,
            shippingCost: selectedCourier?.rate ?? 0,
            courierName: selectedCourier?.courierName,
            estimatedDeliveryDays: selectedCourier?.estimatedDeliveryDays
              ? parseInt(selectedCourier.estimatedDeliveryDays, 10) || undefined
              : undefined,
          };
        });

        // Enrich raw shipments with full product image data
        const enrichedRawShipments = response.shipments.map((shipment) => ({
          ...shipment,
          products: shipment.products.map((prodAlloc) => {
            const fullProduct = productDataMap.get(prodAlloc.product.productId);
            return {
              ...prodAlloc,
              product: {
                ...prodAlloc.product,
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
        }));

        // Calculate totals
        const productsSubtotal = calculateProductsSubtotal(row.products);
        const totalShippingCost = Array.from(courierSelections.values()).reduce(
          (sum, c) => sum + (c?.rate ?? 0),
          0
        );
        const totalPackagingCost = response.shipments.reduce(
          (sum, s) => sum + s.packagingCost,
          0
        );
        const serviceFee = 0; // Default service fee for bulk processing

        const shippingResult: ImportRowShippingResult = {
          shipments,
          rawShipments: enrichedRawShipments,
          courierSelections,
          productsSubtotal,
          totalShippingCost,
          totalPackagingCost,
          serviceFee,
          grandTotal:
            productsSubtotal +
            totalShippingCost +
            totalPackagingCost +
            serviceFee,
        };

        // Update the row
        onRowUpdate(row.rowNumber, shippingResult);

        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: errorMessage };
      }
    },
    [calculateProductsSubtotal, onRowUpdate]
  );

  // Start processing all rows
  const handleStartProcessing = useCallback(async () => {
    // Filter rows that need shipping calculation
    const rowsToProcess = importData.filter(
      (row) => !row.shippingCalculated && row.validationErrors.length === 0
    );

    if (rowsToProcess.length === 0) {
      return;
    }

    setIsProcessing(true);
    setShowProgressDialog(true);
    setCurrentRowIndex(0);
    setTotalRows(rowsToProcess.length);
    setProcessingResults([]);
    setIsComplete(false);
    setIsCancelled(false);
    cancelledRef.current = false;

    const productDataMap = buildProductDataMap();
    const results: RowProcessingResult[] = [];

    for (let i = 0; i < rowsToProcess.length; i++) {
      // Check if cancelled using ref for real-time value
      if (cancelledRef.current) {
        break;
      }

      const row = rowsToProcess[i];
      setCurrentRowIndex(i + 1);
      setCurrentRowNumber(row.rowNumber);

      const result = await processRow(row, productDataMap);
      results.push({
        rowNumber: row.rowNumber,
        success: result.success,
        error: result.error,
      });
      setProcessingResults([...results]);
    }

    setIsComplete(true);
    setIsProcessing(false);
  }, [importData, buildProductDataMap, processRow]);

  // Cancel processing
  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    setIsCancelled(true);
  }, []);

  // Close dialog
  const handleCloseDialog = useCallback(() => {
    setShowProgressDialog(false);
    setCurrentRowIndex(0);
    setTotalRows(0);
    setCurrentRowNumber(null);
    setProcessingResults([]);
    setIsComplete(false);
    setIsCancelled(false);
    cancelledRef.current = false;
  }, []);

  // Count rows that need processing
  const rowsNeedingProcessing = importData.filter(
    (row) => !row.shippingCalculated && row.validationErrors.length === 0
  ).length;

  const successCount = processingResults.filter((r) => r.success).length;
  const errorCount = processingResults.filter((r) => !r.success).length;
  const progress = totalRows > 0 ? (currentRowIndex / totalRows) * 100 : 0;

  const contextValue: CalculateShippingContextType = {
    showProgressDialog,
    isComplete,
    isCancelled,
    currentRowIndex,
    totalRows,
    currentRowNumber,
    progress,
    successCount,
    errorCount,
    processingResults,
    handleCancel,
    handleCloseDialog,
  };

  return (
    <CalculateAllShippingButtonProvider
      importData={importData}
      products={products}
      onRowUpdate={onRowUpdate}
      disabled={disabled}
    >
      <Box className={styles["import-purchase-orders-page__calculate-all-row"]}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<CalculateIcon />}
          onClick={handleStartProcessing}
          disabled={disabled || rowsNeedingProcessing === 0 || isProcessing}
          className={styles["import-purchase-orders-page__calculate-all-button"]}
        >
          Calculate Shipping for All Rows
          {rowsNeedingProcessing > 0 && ` (${rowsNeedingProcessing})`}
        </Button>
        {children}
      </Box>
    </CalculateAllShippingButtonProvider>
  );
};

/**
 * Progress Section Component - Renders inline progress for shipping calculation
 * Must be used as a child of CalculateAllShippingButton
 */
const CalculateAllShippingProgress = (): JSX.Element | null => {
  const context = useContext(CalculateShippingContext);

  if (!context) {
    return null;
  }

  const {
    showProgressDialog,
    isComplete,
    isCancelled,
    currentRowIndex,
    totalRows,
    currentRowNumber,
    progress,
    successCount,
    errorCount,
    processingResults,
    handleCancel,
    handleCloseDialog,
  } = context;

  return (
    <Collapse in={showProgressDialog} unmountOnExit>
      <Paper
        elevation={0}
        className={styles["import-purchase-orders-page__inline-progress"]}
      >
        {/* Header Row */}
        <Box className={styles["import-purchase-orders-page__inline-progress-header"]}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isComplete ? (
              isCancelled ? (
                <ErrorIcon color="warning" />
              ) : errorCount > 0 ? (
                <ErrorIcon color="error" />
              ) : (
                <CheckCircle color="success" />
              )
            ) : (
              <CircularProgress size={20} />
            )}
            <Subheader
              variant="subtitle1"
              label={
                isComplete
                  ? isCancelled
                    ? "Processing Cancelled"
                    : "Processing Complete"
                  : `Calculating Shipping... Row ${currentRowNumber ?? "..."}`
              }
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {!isComplete ? (
              <Button
                onClick={handleCancel}
                color="error"
                variant="text"
                size="small"
                disabled={isCancelled}
                startIcon={<CloseIcon fontSize="small" />}
              >
                {isCancelled ? "Cancelling..." : "Cancel"}
              </Button>
            ) : (
              <IconButton onClick={handleCloseDialog} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box className={styles["import-purchase-orders-page__inline-progress-bar"]}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: "rgba(0, 0, 0, 0.08)",
              "& .MuiLinearProgress-bar": {
                borderRadius: 4,
                backgroundColor: isComplete
                  ? isCancelled
                    ? "warning.main"
                    : errorCount > 0
                      ? "warning.main"
                      : "success.main"
                  : "primary.main",
              },
            }}
          />
          <Box className={styles["import-purchase-orders-page__inline-progress-stats"]}>
            <Typography variant="body2" color="text.secondary">
              {currentRowIndex} of {totalRows} rows
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progress)}%
            </Typography>
          </Box>
        </Box>

        {/* Results Summary (shown during and after processing) */}
        {processingResults.length > 0 && (
          <Box className={styles["import-purchase-orders-page__inline-progress-results"]}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <CheckCircle color="success" sx={{ fontSize: 16 }} />
              <BodyText
                text={`${successCount} successful`}
                variant="body2"
              />
            </Box>
            {errorCount > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <ErrorIcon color="error" sx={{ fontSize: 16 }} />
                <BodyText
                  text={`${errorCount} failed`}
                  variant="body2"
                />
              </Box>
            )}
          </Box>
        )}

        {/* Error Details (shown in real-time as errors occur) */}
        {errorCount > 0 && (
          <Box className={styles["import-purchase-orders-page__inline-progress-errors"]}>
            <Box className={styles["import-purchase-orders-page__inline-progress-errors-list"]}>
              {processingResults
                .filter((r) => !r.success)
                .map((r) => (
                  <Typography key={r.rowNumber} variant="caption" color="error">
                    Row {r.rowNumber}: {r.error}
                  </Typography>
                ))}
            </Box>
          </Box>
        )}
      </Paper>
    </Collapse>
  );
};

// Button component (without provider)
const CalculateAllShippingButtonButton = (): JSX.Element => {
  const context = useContext(CalculateShippingContext);

  if (!context) {
    return <></>;
  }

  const { handleStartProcessing, rowsNeedingProcessing, isProcessing, disabled } = context;

  return (
    <Box className={styles["import-purchase-orders-page__calculate-all-row"]}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<CalculateIcon />}
        onClick={handleStartProcessing}
        disabled={disabled || rowsNeedingProcessing === 0 || isProcessing}
        className={styles["import-purchase-orders-page__calculate-all-button"]}
      >
        Calculate Shipping for All Rows
        {rowsNeedingProcessing > 0 && ` (${rowsNeedingProcessing})`}
      </Button>
    </Box>
  );
};

// Progress wrapper component that can be used separately
const ProgressWrapper = (): JSX.Element => {
  return (
    <Box className={styles["import-purchase-orders-page__progress-wrapper"]}>
      <CalculateAllShippingProgress />
    </Box>
  );
};

// Attach components as static properties for compound component pattern
CalculateAllShippingButton.Provider = CalculateAllShippingButtonProvider;
CalculateAllShippingButton.Button = CalculateAllShippingButtonButton;
CalculateAllShippingButton.Progress = CalculateAllShippingProgress;
CalculateAllShippingButton.ProgressWrapper = ProgressWrapper;

export default CalculateAllShippingButton;
