import { useState } from "react";

import {
  Close as CloseIcon,
  LocalShipping as ShippingIcon,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
} from "@mui/material";

import { type OptimizationShipment } from "../../../api/shippingApi";
import { IconButton as CustomIconButton } from "../../../components/buttons";
import { Subheader } from "../../../components/fonts";
import {
  type PackageProductResponseData,
  type ShipmentResponseData,
} from "../../../models/api-models";
import styles from "../../../styles/PurchaseOrders.module.scss";

import ShipmentHeader from "./ShipmentHeader";
import ShipmentPackagesList from "./ShipmentPackagesList";

/**
 * Props for ShipmentsModal component
 */
interface ShipmentsModalProps {
  open: boolean;
  onClose: () => void;
  shipments: ShipmentResponseData[];
}

/**
 * Convert ShipmentResponseData to OptimizationShipment format
 * This allows us to reuse existing shipment display components
 */
const convertShipmentToOptimizationFormat = (
  shipment: ShipmentResponseData
): OptimizationShipment => {
  // Extract pickup location address - backend ensures it's loaded
  const pickupLocationAddress = shipment.pickupLocation?.address;

  // Build address object - backend ensures address is always loaded
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
          shipment.totalWeightKgs *
          ((sp?.allocatedQuantity || 0) / shipment.totalQuantity),
      };
    }),
    totalWeightKgs: shipment.totalWeightKgs,
    totalQuantity: shipment.totalQuantity,
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
            packageId: 0,
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
    packagingCost: shipment.packagingCost,
    shippingCost: shipment.shippingCost,
    totalCost: shipment.totalCost,
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
            chargeWeight: shipment.totalWeightKgs,
            isSurface: true,
            realtimeTracking: "N/A",
          },
        ]
      : [],
  };
};

/**
 * Shipments Modal Component
 *
 * Displays a list of shipments for a purchase order in a modal dialog.
 * Reuses existing ShipmentHeader and ShipmentPackagesList components.
 */
const ShipmentsModal = ({
  open,
  onClose,
  shipments,
}: ShipmentsModalProps): JSX.Element => {
  const [expandedShipments, setExpandedShipments] = useState<Set<number>>(
    new Set()
  );

  const handleToggleShipment = (shipmentId: number): void => {
    const newExpanded = new Set(expandedShipments);
    if (newExpanded.has(shipmentId)) {
      newExpanded.delete(shipmentId);
    } else {
      newExpanded.add(shipmentId);
    }
    setExpandedShipments(newExpanded);
  };

  const convertedShipments = shipments.map((shipment) => ({
    original: shipment,
    converted: convertShipmentToOptimizationFormat(shipment),
  }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        className: styles["shipping-optimization-modal__paper"],
      }}
    >
      <DialogTitle className={styles["shipping-optimization-modal__title"]}>
        <Box className={styles["shipping-optimization-modal__title-left"]}>
          <ShippingIcon color="primary" />
          <Subheader variant="h6" label="Estimated Shipments" />
          <Chip label={shipments.length} size="small" color="primary" />
        </Box>
        <CustomIconButton onClick={onClose} size="small">
          <CloseIcon />
        </CustomIconButton>
      </DialogTitle>
      <DialogContent
        className={styles["shipping-optimization-modal__dialog-content"]}
      >
        <Box
          className={
            styles["shipping-optimization-modal__courier-list-container"]
          }
        >
          {convertedShipments.length === 0 ? (
            <Box sx={{ textAlign: "center", padding: 4 }}>
              <Subheader variant="subtitle1" label="No shipments available" />
            </Box>
          ) : (
            (() => {
              /**
               * Calculate shipment counts per location for weight-split detection.
               * If a location has more than 1 shipment, they are weight splits.
               */
              const shipmentCountByLocation = convertedShipments.reduce(
                (acc, { converted }) => {
                  const locId = converted.pickupLocation?.pickupLocationId || 0;
                  acc[locId] = (acc[locId] || 0) + 1;
                  return acc;
                },
                {} as Record<number, number>
              );

              // Track current index per location for "Part X of Y" labeling
              const locationIndexTracker: Record<number, number> = {};

              return convertedShipments.map(
                ({ original, converted }, index) => {
                  const isExpanded = expandedShipments.has(original.shipmentId);
                  const selectedCourier = converted.availableCouriers[0];
                  const hasPackages = converted.packagesUsed.length > 0;
                  const hasCouriers = converted.availableCouriers.length > 0;
                  const isValid = hasPackages && hasCouriers;

                  // Calculate weight-split labeling
                  const locationId =
                    converted.pickupLocation?.pickupLocationId || 0;
                  const totalFromLocation =
                    shipmentCountByLocation[locationId] || 1;
                  locationIndexTracker[locationId] =
                    (locationIndexTracker[locationId] || 0) + 1;
                  const shipmentIndexForLocation =
                    locationIndexTracker[locationId];
                  const isWeightSplit = totalFromLocation > 1;
                  const weightSplitLabel = isWeightSplit
                    ? `Part ${shipmentIndexForLocation} of ${totalFromLocation}`
                    : null;

                  return (
                    <Card
                      key={original.shipmentId}
                      variant="outlined"
                      className={`${
                        styles["shipping-optimization-modal__shipment-card"]
                      } ${
                        isExpanded
                          ? styles[
                              "shipping-optimization-modal__shipment-card--expanded"
                            ]
                          : ""
                      } ${
                        !isValid
                          ? styles[
                              "shipping-optimization-modal__shipment-card--invalid"
                            ]
                          : ""
                      }`}
                      style={{
                        borderColor: !isValid
                          ? "#d32f2f"
                          : isExpanded
                          ? "#1976d2"
                          : undefined,
                        borderWidth: isExpanded ? 2 : 1,
                        transition: "all 0.2s",
                        opacity: isValid ? 1 : 0.5,
                        marginBottom:
                          index < convertedShipments.length - 1 ? 2 : 0,
                      }}
                    >
                      <CardContent
                        className={`${
                          styles[
                            "shipping-optimization-modal__shipment-card-content"
                          ]
                        } ${
                          isExpanded
                            ? styles[
                                "shipping-optimization-modal__shipment-card-content--expanded"
                              ]
                            : ""
                        }`}
                      >
                        <ShipmentHeader
                          shipment={converted}
                          selectedCourier={selectedCourier}
                          isExpanded={isExpanded}
                          isValid={isValid}
                          shipmentLabel={
                            convertedShipments.length > 1
                              ? `Shipment ${index + 1} of ${
                                  convertedShipments.length
                                }`
                              : null
                          }
                          weightSplitLabel={weightSplitLabel}
                          expectedDeliveryDate={original.expectedDeliveryDate}
                          onToggleExpand={() =>
                            handleToggleShipment(original.shipmentId)
                          }
                        />

                        <Collapse in={isExpanded}>
                          <Box
                            className={
                              styles[
                                "shipping-optimization-modal__shipment-expanded-details"
                              ]
                            }
                          >
                            <ShipmentPackagesList shipment={converted} />

                            {/* Courier Metadata Section */}
                            {original.selectedCourierMetadata && (
                              <Box
                                sx={{
                                  marginTop: 3,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 2,
                                }}
                              >
                                <Divider />

                                {/* Courier Metadata */}
                                <Box>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      marginBottom: 1,
                                    }}
                                  >
                                    <ShippingIcon
                                      fontSize="small"
                                      color="primary"
                                    />
                                    <Subheader
                                      variant="subtitle2"
                                      label="Courier Metadata"
                                    />
                                  </Box>
                                  <Paper
                                    variant="outlined"
                                    sx={{
                                      padding: 2,
                                      backgroundColor: "#0d1117",
                                      borderColor: "#30363d",
                                      borderRadius: 1,
                                      overflow: "auto",
                                      maxHeight: 400,
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
                                          const metadata = JSON.parse(
                                            original.selectedCourierMetadata
                                          );
                                          return JSON.stringify(
                                            metadata,
                                            null,
                                            2
                                          );
                                        } catch {
                                          return original.selectedCourierMetadata;
                                        }
                                      })()}
                                    </Box>
                                  </Paper>
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </CardContent>
                    </Card>
                  );
                }
              );
            })()
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ShipmentsModal;
