import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { toast } from "react-toastify";

import {
  FlightTakeoff as AirIcon,
  AutoFixHigh as AutoFixHighIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Inventory2 as ProductIcon,
  LocalShipping as ShippingIcon,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Tab,
  Tabs,
  Tooltip,
} from "@mui/material";

import productApi, {
  type ProductStockByLocation,
} from "../../../api/productApi";
import { ProductImageCarousel, buildProductImages } from "../../../components/carousel";
import {
  type CourierOption,
  type OrderOptimizationResponse,
} from "../../../api/shippingApi";
import { BlueButton, IconButton, RedButton } from "../../../components/buttons";
import { BodyText, SecondaryFont, Subheader } from "../../../components/fonts";
import { RadioInput, TextFieldInput } from "../../../components/form-input";
import {
  type CourierListProps,
  type CustomAllocationTabProps,
  type ProductStockState,
  type SelectedShippingResult,
  type ShipmentDetailsProps,
  type ShippingOptimizationModalProps,
} from "../../../models";
import styles from "../../../styles/PurchaseOrders.module.scss";

import ShipmentHeader from "./ShipmentHeader";
import ShipmentPackagesList from "./ShipmentPackagesList";

// ============================================================================
// JSON Syntax Highlighter Helper - Simple HTML-based approach
// ============================================================================

/**
 * Simple JSON syntax highlighter that wraps JSON elements in HTML spans
 * Uses dangerouslySetInnerHTML for rendering (safe since we control the content)
 */
const highlightJSON = (jsonString: string): string => {
  let highlighted = jsonString;

  // Highlight keys (quoted strings followed by colon)
  highlighted = highlighted.replace(
    /"([^"]+)":/g,
    '<span class="json-key">"$1":</span>'
  );

  // Highlight string values (quoted strings after colon and whitespace)
  highlighted = highlighted.replace(
    /:\s*"([^"]*)"/g,
    ': <span class="json-string">"$1"</span>'
  );

  // Highlight numbers (after colon and whitespace)
  highlighted = highlighted.replace(
    /:\s*(\d+\.?\d*)/g,
    ': <span class="json-number">$1</span>'
  );

  // Highlight booleans
  highlighted = highlighted.replace(
    /:\s*(true|false)/g,
    ': <span class="json-boolean">$1</span>'
  );

  // Highlight null
  highlighted = highlighted.replace(
    /:\s*(null)/g,
    ': <span class="json-null">null</span>'
  );

  // Highlight brackets and commas
  highlighted = highlighted.replace(
    /([{}[\],])/g,
    '<span class="json-bracket">$1</span>'
  );

  return highlighted;
};

// ============================================================================
// Courier List Component - Simplified with expandable metadata
// ============================================================================

/**
 * Courier List Component
 *
 * Displays a list of available couriers for a shipment with expandable metadata.
 * Shows courier information in a simplified format with option to view full
 * Shiprocket API response as JSON.
 *
 * Features:
 * - Radio button selection for each courier
 * - Courier name, mode (Surface/Air), price, delivery time
 * - "Cheapest" badge on first courier (assumed sorted by price)
 * - Expandable JSON metadata (full Shiprocket response)
 * - Visual selection state (highlighted when selected)
 *
 * Display Format:
 * - Radio button + courier details
 * - Mode chip (Surface/Air with icon)
 * - Price and delivery time
 * - "View Shiprocket Response" link to expand JSON
 *
 * Use Cases:
 * - Shipping optimization modal (courier selection)
 * - Shipping estimate modal (courier options)
 *
 * @param {CourierListProps} props - Component props
 * @returns {JSX.Element} Rendered courier list
 */
const CourierList = ({
  couriers,
  selectedCourier,
  onCourierSelect,
}: CourierListProps): JSX.Element => {
  /**
   * Track which courier's metadata is expanded (for JSON view).
   *
   * Only one courier's metadata can be expanded at a time.
   * Stores the courierCompanyId of the expanded courier, or null if none.
   */
  const [expandedMetadata, setExpandedMetadata] = useState<number | null>(null);

  return (
    <Box
      className={styles["shipping-optimization-modal__courier-list-container"]}
    >
      {/**
       * Map couriers to courier cards.
       *
       * Each courier is displayed as a selectable card with:
       * - Radio button for selection
       * - Courier name and "Cheapest" badge (for first courier)
       * - Shipping mode (Surface/Air)
       * - Price and delivery estimate
       * - Expandable metadata view (JSON response from Shiprocket API)
       */}
      {couriers.map((courier, index) => {
        /**
         * Determine if this courier is currently selected.
         *
         * Compares courierCompanyId to check if this is the selected courier.
         */
        const isSelected =
          selectedCourier?.courierCompanyId === courier.courierCompanyId;

        /**
         * Determine if this courier's metadata is expanded.
         *
         * Checks if expandedMetadata matches this courier's ID.
         */
        const isMetadataExpanded =
          expandedMetadata === courier.courierCompanyId;

        return (
          <Paper
            key={courier.courierCompanyId}
            variant="outlined"
            className={`${
              styles["shipping-optimization-modal__courier-paper"]
            } ${
              isSelected
                ? styles["shipping-optimization-modal__courier-paper--selected"]
                : ""
            }`}
          >
            {/**
             * Main courier info section (clickable to select).
             *
             * Entire section is clickable for better UX (larger click target).
             * Radio button also triggers selection for accessibility.
             */}
            <Box
              className={
                styles["shipping-optimization-modal__courier-main-info"]
              }
              onClick={() => onCourierSelect(courier)}
            >
              <Box
                className={
                  styles["shipping-optimization-modal__courier-content"]
                }
              >
                {/**
                 * Radio button for courier selection.
                 *
                 * Checked when this courier is selected.
                 * Both onChange and parent onClick trigger selection (redundant for better UX).
                 */}
                <RadioInput
                  checked={isSelected}
                  size="small"
                  color="success"
                  className={
                    styles["shipping-optimization-modal__courier-radio"]
                  }
                  onChange={() => onCourierSelect(courier)}
                />
                <Box
                  className={
                    styles["shipping-optimization-modal__courier-details"]
                  }
                >
                  {/**
                   * Row 1: Courier name and "Cheapest" badge.
                   *
                   * First courier (index 0) gets "Cheapest" badge.
                   * Assumes API returns couriers sorted by price (cheapest first).
                   */}
                  <Box
                    className={
                      styles["shipping-optimization-modal__courier-header-row"]
                    }
                  >
                    <BodyText
                      variant="body2"
                      className={
                        styles["shipping-optimization-modal__courier-name"]
                      }
                    >
                      {courier.courierName}
                    </BodyText>
                    {index === 0 && (
                      <Chip
                        label="Cheapest"
                        size="small"
                        color="success"
                        className={
                          styles[
                            "shipping-optimization-modal__courier-cheapest-chip"
                          ]
                        }
                      />
                    )}
                  </Box>

                  {/**
                   * Row 2: Shipping mode chip (Surface or Air).
                   *
                   * Shows icon and label based on isSurface flag.
                   * Different colors for visual distinction (warning for Surface, info for Air).
                   */}
                  <Box
                    className={
                      styles["shipping-optimization-modal__courier-mode-row"]
                    }
                  >
                    <Chip
                      icon={
                        courier.isSurface ? (
                          <ShippingIcon
                            className={
                              styles[
                                "shipping-optimization-modal__courier-mode-icon"
                              ]
                            }
                          />
                        ) : (
                          <AirIcon
                            className={
                              styles[
                                "shipping-optimization-modal__courier-mode-icon"
                              ]
                            }
                          />
                        )
                      }
                      label={courier.isSurface ? "Surface" : "Air"}
                      size="small"
                      variant="outlined"
                      color={courier.isSurface ? "warning" : "info"}
                      className={
                        styles["shipping-optimization-modal__courier-mode-chip"]
                      }
                    />
                  </Box>

                  {/**
                   * Row 3: Price and delivery estimate.
                   *
                   * Price: Formatted with Indian locale (₹ symbol, comma separators).
                   * Delivery: Uses etd (estimated time of delivery) if available, falls back to estimatedDeliveryDays.
                   */}
                  <Box
                    className={
                      styles["shipping-optimization-modal__courier-price-row"]
                    }
                  >
                    <Subheader
                      variant="h6"
                      label={`₹${courier.rate.toLocaleString("en-IN")}`}
                      className={
                        styles["shipping-optimization-modal__courier-price"]
                      }
                    />
                    <SecondaryFont
                      variant="body2"
                      className={
                        styles["shipping-optimization-modal__courier-delivery"]
                      }
                    >
                      📅 {courier.etd || courier.estimatedDeliveryDays}
                    </SecondaryFont>
                  </Box>

                  {/**
                   * Row 4: Metadata toggle link.
                   *
                   * Allows viewing raw JSON response from Shiprocket API.
                   * Useful for debugging or seeing full API response.
                   * stopPropagation prevents triggering courier selection when clicking.
                   */}
                  <Box
                    className={
                      styles[
                        "shipping-optimization-modal__courier-metadata-toggle"
                      ]
                    }
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent courier selection when clicking metadata toggle
                      setExpandedMetadata(
                        isMetadataExpanded ? null : courier.courierCompanyId
                      );
                    }}
                  >
                    <SecondaryFont
                      variant="caption"
                      className={
                        styles[
                          "shipping-optimization-modal__courier-metadata-link"
                        ]
                      }
                    >
                      {isMetadataExpanded
                        ? "▲ Hide Metadata"
                        : "▼ View Metadata"}
                    </SecondaryFont>
                  </Box>
                </Box>
              </Box>

              {/**
               * Expandable JSON metadata section.
               *
               * Shows raw courier object as formatted JSON.
               * Useful for debugging or seeing full API response structure.
               * Only visible when isMetadataExpanded is true.
               * Now part of the card content.
               */}
              <Collapse in={isMetadataExpanded}>
                <Box
                  className={
                    styles[
                      "shipping-optimization-modal__courier-metadata-content"
                    ]
                  }
                >
                  <pre
                    className={
                      styles[
                        "shipping-optimization-modal__courier-metadata-pre"
                      ]
                    }
                    dangerouslySetInnerHTML={{
                      __html: highlightJSON(JSON.stringify(courier, null, 2)),
                    }}
                  />
                </Box>
              </Collapse>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
};

// ============================================================================
// Shipment Details Component
// ============================================================================

/**
 * Shipment Details Component
 *
 * Displays detailed information about a single shipment from the optimization result.
 * Shows location, packages, products, and courier selection in an expandable card.
 *
 * Features:
 * - Collapsible card with header and expanded details
 * - Shipment header (location, stats, selected courier)
 * - Package details (grouped by package type with product breakdown)
 * - Courier selection (list of available couriers)
 * - Status indicators (warnings for missing packages/couriers)
 * - Global shipment numbering (shows "Shipment X of Y" label for all shipments)
 * - Weight-split detection (shows "Part X of Y" label when a location has multiple shipments)
 *
 * Layout:
 * - Header: Location info, stats, selected courier summary, expand button
 * - Expanded: Packages list (left) + Courier selection (right)
 *
 * Validation:
 * - Valid: Has packages AND has couriers available
 * - Invalid: Missing packages OR missing couriers (shows error styling)
 *
 * Weight Splits:
 * - When total weight exceeds courier limits, API splits into multiple shipments
 * - Each shipment gets a global label: "Shipment X of Y" (e.g., "Shipment 1 of 52")
 * - Weight-split shipments also show "Part X of Y" (e.g., "Part 1 of 3")
 * - Uses unique keys to track expansion state per shipment
 *
 * @param {ShipmentDetailsProps} props - Component props
 * @returns {JSX.Element} Rendered shipment details card
 */
const ShipmentDetails = ({
  shipment,
  selectedCourier,
  onCourierSelect,
  isExpanded,
  onToggleExpand,
  shipmentIndex,
  totalShipmentsFromLocation,
  globalShipmentIndex,
  totalShipments,
}: ShipmentDetailsProps): JSX.Element => {
  /**
   * Detect if this is a weight-split shipment.
   *
   * When total weight exceeds courier limits, the API splits the shipment
   * into multiple shipments from the same location. We detect this by
   * checking if totalShipmentsFromLocation > 1.
   *
   * For weight splits, we show "Part X of Y" to indicate this is one of multiple
   * shipments from the same location (due to weight limits).
   */
  const isWeightSplit = totalShipmentsFromLocation > 1;
  // Global shipment label: "Shipment 1 of 52"
  const globalShipmentLabel = `Shipment ${globalShipmentIndex} of ${totalShipments}`;
  // Weight split label: "Part 1 of 3" (only shown for weight splits)
  const weightSplitLabel = isWeightSplit
    ? `Part ${shipmentIndex} of ${totalShipmentsFromLocation}`
    : null;

  // Check if couriers are available for this shipment
  const hasCouriersAvailable = shipment.availableCouriers.length > 0;

  /**
   * Ensure couriers are sorted by rate (cheapest first).
   * This ensures we always select the cheapest courier as default.
   * Memoized to avoid unnecessary re-sorting on every render.
   */
  const sortedCouriers = useMemo(() => {
    if (!hasCouriersAvailable) return [];
    return [...shipment.availableCouriers].sort((a, b) => a.rate - b.rate);
  }, [hasCouriersAvailable, shipment.availableCouriers]);

  /**
   * Validate that selected courier is still in available couriers list.
   *
   * IMPORTANT: If selected courier is not in availableCouriers, it means:
   * - The courier is no longer available for this route
   * - The selection is stale/invalid
   * - We should not display it as selected
   *
   * This prevents showing a selected courier (like Ekart) that's not in the available list.
   */
  const isValidSelectedCourier =
    selectedCourier &&
    sortedCouriers.some(
      (c) => c.courierCompanyId === selectedCourier.courierCompanyId
    );

  /**
   * Determine the courier to use for display and selection.
   *
   * Priority:
   * 1. Use selectedCourier if it's valid and in the available list
   * 2. Otherwise, automatically select the first (cheapest) courier if available
   * 3. Otherwise, undefined (no couriers available)
   *
   * This ensures that every shipment always has the cheapest courier selected by default.
   */
  const validatedSelectedCourier = isValidSelectedCourier
    ? selectedCourier
    : sortedCouriers.length > 0
    ? sortedCouriers[0]
    : undefined;

  /**
   * Auto-select the cheapest courier if no selection exists.
   *
   * This effect ensures that whenever a shipment is rendered without a selection,
   * we automatically select the cheapest courier. This handles edge cases where
   * initializeSelections might not have run yet, or if selections were cleared.
   */
  useEffect(() => {
    if (!selectedCourier && sortedCouriers.length > 0 && onCourierSelect) {
      // Auto-select the cheapest courier (first after sorting)
      onCourierSelect(sortedCouriers[0]);
    }
  }, [selectedCourier, sortedCouriers.length, onCourierSelect]);

  /**
   * Calculate total number of boxes across all packages.
   * Sums quantityUsed from all packagesUsed in the shipment.
   */
  const totalBoxes = shipment.packagesUsed.reduce(
    (sum, p) => sum + p.quantityUsed,
    0
  );

  // Determine if packages are available (packaging solution exists)
  const hasPackages = totalBoxes > 0;

  /**
   * Determine if shipment is valid.
   *
   * A shipment is valid if:
   * - Packages are available (packaging solution found)
   * - Couriers are available (shipping route exists)
   *
   * Invalid shipments show error styling and warnings.
   */
  const isValid = hasCouriersAvailable && hasPackages;

  return (
    <Card
      variant="outlined"
      className={`${styles["shipping-optimization-modal__shipment-card"]} ${
        isExpanded
          ? styles["shipping-optimization-modal__shipment-card--expanded"]
          : ""
      } ${
        !isValid
          ? styles["shipping-optimization-modal__shipment-card--invalid"]
          : ""
      }`}
      style={{
        borderColor: !isValid ? "#d32f2f" : isExpanded ? "#1976d2" : undefined,
        borderWidth: isExpanded ? 2 : 1,
        transition: "all 0.2s",
        opacity: isValid ? 1 : 0.5,
      }}
    >
      <CardContent
        className={`${
          styles["shipping-optimization-modal__shipment-card-content"]
        } ${
          isExpanded
            ? styles[
                "shipping-optimization-modal__shipment-card-content--expanded"
              ]
            : ""
        }`}
      >
        {/* Shipment Header */}
        <ShipmentHeader
          shipment={shipment}
          selectedCourier={
            validatedSelectedCourier as CourierOption | undefined
          }
          isExpanded={isExpanded}
          isValid={isValid}
          shipmentLabel={globalShipmentLabel}
          weightSplitLabel={weightSplitLabel}
          onToggleExpand={onToggleExpand}
        />

        {/* Expanded Details */}
        <Collapse in={isExpanded}>
          <Box
            className={
              styles["shipping-optimization-modal__shipment-expanded-details"]
            }
          >
            <Grid container spacing={3}>
              {/* Packages Column - Shows what goes in each package */}
              <Grid item xs={12} md={7}>
                <ShipmentPackagesList shipment={shipment} />
              </Grid>

              {/* Courier Selection Column */}
              <Grid item xs={12} md={5}>
                <Subheader
                  variant="subtitle2"
                  label="Select Courier"
                  className={
                    styles[
                      "shipping-optimization-modal__shipment-couriers-header"
                    ]
                  }
                >
                  <ShippingIcon fontSize="small" color="success" />
                </Subheader>
                {sortedCouriers.length === 0 ? (
                  <Paper
                    variant="outlined"
                    className={
                      styles[
                        "shipping-optimization-modal__shipment-no-couriers-paper"
                      ]
                    }
                  >
                    <ShippingIcon
                      color="warning"
                      className={
                        styles[
                          "shipping-optimization-modal__shipment-no-couriers-icon"
                        ]
                      }
                    />
                    <BodyText
                      variant="body2"
                      className={
                        styles[
                          "shipping-optimization-modal__shipment-no-couriers-text"
                        ]
                      }
                    >
                      No couriers available for this route
                    </BodyText>
                  </Paper>
                ) : (
                  <CourierList
                    couriers={sortedCouriers}
                    selectedCourier={validatedSelectedCourier}
                    onCourierSelect={onCourierSelect}
                  />
                )}
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Custom Allocation Tab Component
// ============================================================================

/**
 * Custom Allocation Tab Component
 *
 * Allows users to manually allocate products to pickup locations instead of
 * using the system's automatic optimization. Provides full control over
 * which products come from which locations.
 *
 * Features:
 * - Product accordions (expandable per product)
 * - Stock display for each location
 * - Search to find and add locations
 * - Quantity input per location
 * - Allocation validation (cannot exceed stock)
 * - Status indicators (complete, over-allocated, incomplete)
 * - Test fill button (auto-fills with 2 locations per product)
 * - Shipping calculation with custom allocations
 *
 * Data Structure:
 * - allocations: productId -> (locationId -> quantity)
 * - addedLocationIds: productId -> [locationId, ...] (maintains order)
 * - stockByProduct: productId -> { loading, error, data }
 *
 * Workflow:
 * 1. User expands product accordion
 * 2. Searches for pickup locations
 * 3. Adds locations to the product
 * 4. Sets quantity for each location
 * 5. Clicks "Calculate Shipping" with custom allocations
 * 6. System calculates shipping based on manual allocations
 *
 * Validation:
 * - Quantity cannot exceed available stock
 * - Total allocated should equal product quantity (complete)
 * - Shows warnings for over-allocation or incomplete allocation
 *
 * Use Cases:
 * - Manual product allocation (user preference)
 * - Testing different allocation scenarios
 * - Handling edge cases not covered by automatic optimization
 *
 * @param {CustomAllocationTabProps} props - Component props
 * @returns {JSX.Element} Rendered custom allocation tab
 */
const CustomAllocationTab = ({
  productItems,
  customResult,
  isCalculating,
  courierSelections,
  onCourierSelect,
  expandedLocationId,
  onToggleExpand,
  onAllocationsChange,
}: CustomAllocationTabProps): JSX.Element => {
  /**
   * Enriched product items with full details (images, proper titles).
   *
   * For import flows, productItems may only have productId and quantity.
   * This state holds the enriched data after fetching from the API.
   */
  const [enrichedProductItems, setEnrichedProductItems] = useState<
    CustomAllocationTabProps["productItems"]
  >(productItems);

  /**
   * Loading state for fetching product details.
   */
  const [loadingProductDetails, setLoadingProductDetails] = useState(false);

  /**
   * Stock data state: productId -> stock state object.
   *
   * Each product has its own loading/error/data state for stock information.
   * This allows independent loading states per product.
   */
  const [stockByProduct, setStockByProduct] = useState<
    Record<number, ProductStockState>
  >({});

  /**
   * Expanded product accordion state.
   *
   * Tracks which product accordion is currently expanded.
   * Only one product can be expanded at a time for cleaner UI.
   */
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);

  /**
   * Custom allocations state: productId -> (locationId -> quantity).
   *
   * This is the core data structure for manual allocations.
   * Example: { 123: { 1: 5, 2: 5 } } means product 123 has 5 units from location 1 and 5 from location 2.
   */
  const [allocations, setAllocations] = useState<
    Record<number, Record<number, number>>
  >({});

  /**
   * Loading state for fetching stock data.
   *
   * Set to true when fetching stock for all products on mount.
   */
  const [loadingStock, setLoadingStock] = useState(false);

  /**
   * Location search state: productId -> search term.
   *
   * Each product has its own search input for finding locations.
   * This allows independent searching per product.
   */
  const [locationSearch, setLocationSearch] = useState<Record<number, string>>(
    {}
  );

  /**
   * Added location IDs state: productId -> [locationId, ...].
   *
   * Tracks which locations have been added for each product.
   * Uses array to maintain insertion order (important for UI display).
   * Different from allocations - this is just the list of locations, not quantities.
   */
  const [addedLocationIds, setAddedLocationIds] = useState<
    Record<number, number[]>
  >({});

  /**
   * Fetch full product details if items are missing data (import flow).
   *
   * Detects if products need enrichment by checking if any product:
   * - Has no mainImageUrl
   * - Has a generic title like "Product 123"
   *
   * Uses a single batch API call to fetch all products efficiently.
   */
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (productItems.length === 0) return;

      // Check if products need enrichment (missing image or has generic title)
      const needsEnrichment = productItems.some(
        (p) => !p.mainImageUrl || p.title.startsWith("Product ")
      );

      if (!needsEnrichment) {
        setEnrichedProductItems(productItems);
        return;
      }

      setLoadingProductDetails(true);

      try {
        // Fetch all product details in a single batch request
        const productIds = productItems.map((p) => p.productId);
        const fetchedProducts = await productApi.getProductsByIds(productIds);

        // Create a map for quick lookup
        const productDetailsMap = new Map<number, {
          title?: string;
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
          weightKgs?: number;
          brand?: string;
          category?: { name?: string; fullPath?: string };
        }>();

        for (const prod of fetchedProducts) {
          const p = prod as { productId?: number; title?: string; mainImageUrl?: string; [key: string]: unknown };
          if (p.productId) {
            productDetailsMap.set(p.productId, p as typeof productDetailsMap extends Map<number, infer V> ? V : never);
          }
        }

        // Enrich product items with fetched details
        const enriched = productItems.map((item) => {
          const details = productDetailsMap.get(item.productId);
          if (details) {
            // Build display title with brand and category
            let displayTitle = details.title ?? item.title;
            if (details.brand && details.category?.name) {
              displayTitle = `${details.brand} ${details.category.name} › ${details.title}`;
            } else if (details.category?.fullPath) {
              displayTitle = `${details.category.fullPath}`;
            }

            return {
              ...item,
              title: displayTitle,
              mainImageUrl: details.mainImageUrl ?? item.mainImageUrl,
              topImageUrl: details.topImageUrl,
              bottomImageUrl: details.bottomImageUrl,
              frontImageUrl: details.frontImageUrl,
              backImageUrl: details.backImageUrl,
              rightImageUrl: details.rightImageUrl,
              leftImageUrl: details.leftImageUrl,
              detailsImageUrl: details.detailsImageUrl,
              defectImageUrl: details.defectImageUrl,
              additionalImage1Url: details.additionalImage1Url,
              additionalImage2Url: details.additionalImage2Url,
              additionalImage3Url: details.additionalImage3Url,
              weightKgs: details.weightKgs ?? item.weightKgs,
            };
          }
          return item;
        });

        setEnrichedProductItems(enriched);
      } catch (error) {
        // On error, use original product items
        console.error("Failed to fetch product details:", error);
        setEnrichedProductItems(productItems);
      } finally {
        setLoadingProductDetails(false);
      }
    };

    fetchProductDetails();
  }, [productItems]);

  /**
   * Fetch stock data for all products when component mounts.
   *
   * This effect runs when productItems change. It:
   * 1. Fetches stock at all locations for each product
   * 2. Stores stock data in stockByProduct state
   * 3. Handles errors gracefully (shows error message, empty data)
   *
   * Why fetch all stock upfront?
   * - User needs to see stock availability before allocating
   * - Prevents repeated API calls when user expands accordions
   * - Provides better UX (data ready when needed)
   *
   * Error Handling:
   * - On error, sets error message and empty data array
   * - Component will display error message to user
   * - Doesn't break the entire component if one product fails
   */
  useEffect(() => {
    const fetchAllStock = async () => {
      if (productItems.length === 0) return;

      setLoadingStock(true);
      const newStockByProduct: Record<number, ProductStockState> = {};

      /**
       * Fetch stock for all products in parallel.
       *
       * Uses Promise.all for better performance - all requests happen
       * simultaneously instead of sequentially.
       */
      await Promise.all(
        productItems.map(async (product) => {
          try {
            const stockData =
              await productApi.getProductStockAtLocationsByProductId(
                product.productId
              );
            newStockByProduct[product.productId] = {
              loading: false,
              error: null,
              data: stockData,
            };
          } catch (error) {
            // On error, store error state (component will display error message)
            newStockByProduct[product.productId] = {
              loading: false,
              error: "Failed to fetch stock",
              data: [],
            };
          }
        })
      );

      setStockByProduct(newStockByProduct);
      setLoadingStock(false);
    };

    fetchAllStock();
  }, [productItems]);

  /**
   * Handle allocation quantity change for a product at a location.
   *
   * Updates the allocations state when user changes quantity input.
   * If quantity is 0, removes the allocation entry (cleanup).
   *
   * @param {number} productId - ID of the product
   * @param {number} locationId - ID of the pickup location
   * @param {number} quantity - New quantity to allocate
   */
  const handleAllocationChange = (
    productId: number,
    locationId: number,
    quantity: number
  ) => {
    setAllocations((prev) => {
      /**
       * Create new object for this product's allocations.
       *
       * Spreads previous allocations to preserve other locations' allocations.
       * If product doesn't exist in prev, starts with empty object.
       */
      const productAllocs = { ...(prev[productId] || {}) };

      if (quantity > 0) {
        /**
         * Set or update allocation for this location.
         *
         * Updates the quantity for this location in the allocations object.
         */
        productAllocs[locationId] = quantity;
      } else {
        /**
         * Remove allocation if quantity is 0.
         *
         * Deleting the key removes it from the object, which is cleaner than
         * setting it to 0 (zero allocation = no allocation).
         */
        delete productAllocs[locationId];
      }

      /**
       * Return new state object with updated product allocations.
       *
       * Spreads previous state to preserve other products' allocations.
       * Updates only this product's allocations.
       */
      return { ...prev, [productId]: productAllocs };
    });
  };

  /**
   * Add a location to the selected list for a product.
   *
   * Adds the location to the addedLocationIds array (maintains insertion order).
   * This makes the location appear in the "Selected Locations" section.
   *
   * Why maintain order?
   * - Shows locations in the order user added them
   * - Better UX (user can see their selection order)
   * - Makes it easier to understand allocation flow
   *
   * Duplicate Prevention:
   * - Checks if location already in list before adding
   * - Returns previous state if duplicate (no-op)
   * - Prevents duplicate entries in UI
   *
   * Search Field Clearing:
   * - Clears search field after adding location
   * - Provides clean UX (search box ready for next search)
   * - Prevents confusion (search term doesn't persist)
   *
   * @param {number} productId - ID of the product
   * @param {number} locationId - ID of the location to add
   */
  const handleAddLocation = (productId: number, locationId: number) => {
    setAddedLocationIds((prev) => {
      /**
       * Get existing locations for this product (or empty array).
       *
       * Preserves existing locations to maintain order.
       */
      const productLocations = prev[productId] || [];

      /**
       * Only add if not already in the list (prevent duplicates).
       *
       * Returns previous state unchanged if location already added.
       * This prevents duplicate entries and unnecessary re-renders.
       */
      if (productLocations.includes(locationId)) return prev;

      /**
       * Add location to the end of the array (maintains insertion order).
       *
       * Spreads existing locations and appends new one.
       * Creates new array to ensure React detects state change.
       */
      return { ...prev, [productId]: [...productLocations, locationId] };
    });

    /**
     * Clear search field after adding location.
     *
     * Provides clean UX - search box is ready for next search.
     * Prevents confusion from persisting search term.
     */
    setLocationSearch((prev) => ({ ...prev, [productId]: "" }));
  };

  /**
   * Remove a location from the selected list for a product.
   *
   * Removes the location from addedLocationIds and also removes its allocation.
   *
   * @param {number} productId - ID of the product
   * @param {number} locationId - ID of the location to remove
   */
  const handleRemoveLocation = (productId: number, locationId: number) => {
    setAddedLocationIds((prev) => {
      const productLocations = prev[productId] || [];
      return {
        ...prev,
        [productId]: productLocations.filter((id) => id !== locationId),
      };
    });
    // Also remove allocation (set quantity to 0)
    handleAllocationChange(productId, locationId, 0);
  };

  /**
   * Calculate total allocated quantity for a product across all locations.
   *
   * Sums up all allocation quantities for the given product.
   *
   * @param {number} productId - ID of the product
   * @returns {number} Total allocated quantity
   */
  const getTotalAllocated = (productId: number): number => {
    const productAllocs = allocations[productId] || {};
    return Object.values(productAllocs).reduce((sum, qty) => sum + qty, 0);
  };

  /**
   * Check if all products are fully allocated.
   *
   * A product is fully allocated when totalAllocated === product.quantity.
   * All products must be fully allocated for shipping calculation to be enabled.
   *
   * @returns {boolean} True if all products are fully allocated
   */
  const isFullyAllocated = useCallback((): boolean => {
    return productItems.every((product) => {
      const allocated = getTotalAllocated(product.productId);
      return allocated === product.quantity;
    });
  }, [productItems, allocations]);

  // Notify parent whenever allocations change
  useEffect(() => {
    onAllocationsChange(allocations, isFullyAllocated());
  }, [allocations, isFullyAllocated, onAllocationsChange]);

  // Only show stock loading if we're not calculating shipping
  // This prevents the "Loading pickup locations" message from appearing when clicking "Calculate Shipping"
  if (loadingStock && !isCalculating) {
    return (
      <Box
        className={
          styles["shipping-optimization-modal__custom-allocation-loading"]
        }
      >
        <CircularProgress size={48} />
        <Box
          className={
            styles[
              "shipping-optimization-modal__custom-allocation-loading-text"
            ]
          }
        >
          <Subheader variant="h6" label="Loading pickup locations..." />
          <SecondaryFont variant="body2">
            Fetching stock information for all products
          </SecondaryFont>
        </Box>
      </Box>
    );
  }

  if (productItems.length === 0) {
    return (
      <Box
        className={
          styles["shipping-optimization-modal__custom-allocation-empty"]
        }
      >
        <ProductIcon
          className={
            styles["shipping-optimization-modal__custom-allocation-empty-icon"]
          }
        />
        <SecondaryFont>No products to allocate</SecondaryFont>
      </Box>
    );
  }

  /**
   * Fill test allocations automatically.
   *
   * This function automatically allocates products to pickup locations for testing.
   * For each product, it:
   * 1. Finds 2 locations with sufficient stock (prefers locations with more stock)
   * 2. Splits quantity evenly between the 2 locations
   * 3. Falls back to 1 location if only one has enough stock
   * 4. Shows warnings if no suitable locations found
   *
   * Algorithm:
   * - Sort locations by available stock (descending)
   * - Try to find 2 locations that can handle split quantity
   * - Split: qty1 = floor(requiredQty / 2), qty2 = remainder
   * - If 2 locations found: use both
   * - If only 1 location found: use it for full quantity (if stock sufficient)
   * - If no locations found: show warning, skip product
   *
   * Why this approach?
   * - Provides realistic test data (multiple locations)
   * - Tests the allocation UI with actual data
   * - Helps QA test various scenarios quickly
   * - Validates stock checking logic
   *
   * @returns {void}
   */
  const handleFillTestAllocations = () => {
    const newAllocations: Record<number, Record<number, number>> = {};
    const newAddedLocationIds: Record<number, number[]> = {};

    for (const product of productItems) {
      const stockState = stockByProduct[product.productId];
      const locations = stockState?.data || [];
      const requiredQty = product.quantity;

      // Skip products with no locations or invalid quantity
      if (locations.length === 0 || requiredQty <= 0) continue;

      /**
       * Find 2 locations with enough stock.
       *
       * Sort by available stock descending to prioritize locations with more stock.
       * This ensures we pick the best locations first.
       */
      const sortedLocations = [...locations].sort(
        (a, b) => (b.availableStock || 0) - (a.availableStock || 0)
      );

      /**
       * Calculate split quantities.
       *
       * Split quantity evenly: first location gets floor(half), second gets remainder.
       * Example: 10 units -> 5 and 5, 11 units -> 5 and 6
       */
      const qty1 = Math.floor(requiredQty / 2);
      const qty2 = requiredQty - qty1; // remainder goes to second location

      // Find first location that can handle qty1
      const loc1 = sortedLocations.find(
        (loc) => (loc.availableStock || 0) >= qty1
      );
      if (!loc1) {
        toast.warning(
          `Could not find location with enough stock for ${product.title}`
        );
        continue;
      }

      /**
       * Find second location (different from first) that can handle qty2.
       *
       * We want 2 different locations to test multi-location allocation.
       */
      const loc2 = sortedLocations.find(
        (loc) =>
          loc.pickupLocationId !== loc1.pickupLocationId &&
          (loc.availableStock || 0) >= qty2
      );

      if (loc2) {
        /**
         * We have 2 locations - split the quantity.
         *
         * This is the ideal case: 2 locations with sufficient stock.
         */
        newAddedLocationIds[product.productId] = [
          loc1.pickupLocationId,
          loc2.pickupLocationId,
        ];
        newAllocations[product.productId] = {
          [loc1.pickupLocationId]: qty1,
          [loc2.pickupLocationId]: qty2,
        };
      } else {
        /**
         * Only 1 location available with enough stock - use it for full quantity.
         *
         * Fallback case: if we can't find 2 locations, use 1 location if it has
         * enough stock for the full quantity.
         */
        if ((loc1.availableStock || 0) >= requiredQty) {
          newAddedLocationIds[product.productId] = [loc1.pickupLocationId];
          newAllocations[product.productId] = {
            [loc1.pickupLocationId]: requiredQty,
          };
        } else {
          toast.warning(
            `Not enough stock in any single location for ${product.title}`
          );
        }
      }
    }

    // Update state with new allocations
    setAddedLocationIds(newAddedLocationIds);
    setAllocations(newAllocations);
    toast.success("Test allocations filled!");
  };

  return (
    <Box>
      {/**
       * Shipping Results Section - Show at top if available.
       *
       * Displays shipments from custom allocation calculation.
       * Only shown when customResult has shipments (calculation completed).
       * Uses same weight-split detection logic as System Recommended tab.
       */}
      {customResult?.shipments?.length ? (
        <Box
          className={
            styles[
              "shipping-optimization-modal__custom-allocation-results-container"
            ]
          }
        >
          <Box
            className={
              styles[
                "shipping-optimization-modal__custom-allocation-results-list"
              ]
            }
          >
            {/**
             * Process custom result shipments with weight-split detection.
             *
             * Same logic as System Recommended tab but with "custom-" prefix in keys
             * to distinguish from System Recommended shipments in expansion state.
             *
             * Why "custom-" prefix?
             * - Prevents key collisions with System Recommended shipments
             * - Allows independent expansion state tracking
             * - Makes debugging easier (can identify which tab a shipment belongs to)
             */}
            {(() => {
              /**
               * Calculate shipment counts per location for weight-split detection.
               *
               * Same logic as System Recommended tab - counts how many shipments
               * come from each location to detect weight splits.
               */
              const shipmentCountByLocation = customResult.shipments.reduce(
                (acc, s) => {
                  const locId = s.pickupLocation?.pickupLocationId || 0;
                  acc[locId] = (acc[locId] || 0) + 1;
                  return acc;
                },
                {} as Record<number, number>
              );

              /**
               * Track current shipment index per location for weight splits.
               *
               * Used to generate labels like "Shipment 1 of 3" for weight-split shipments.
               */
              const locationIndexTracker: Record<number, number> = {};

              /**
               * Map shipments to ShipmentDetails components.
               *
               * For each shipment:
               * - Determine if it's part of a weight split
               * - Calculate its index within that location's shipments
               * - Generate unique key with "custom-" prefix
               * - Render ShipmentDetails with appropriate props
               */
              return customResult.shipments.map((shipment, index) => {
                const locationId =
                  shipment.pickupLocation?.pickupLocationId || 0;
                const totalFromLocation =
                  shipmentCountByLocation[locationId] || 1;

                /**
                 * Calculate current shipment index for this location.
                 *
                 * Increments the tracker for this location, giving us the shipment number
                 * within that location's shipments (for weight-split labeling).
                 */
                locationIndexTracker[locationId] =
                  (locationIndexTracker[locationId] || 0) + 1;
                const shipmentIndexForLocation =
                  locationIndexTracker[locationId];

                /**
                 * Generate unique keys for React rendering and expansion state.
                 *
                 * - shipmentKey: Unique key for React (includes "custom-" prefix and index)
                 * - expandKey: Key for expansion state (locationId with "custom-" prefix for normal, unique string for weight splits)
                 *
                 * Why "custom-" prefix?
                 * - Distinguishes from System Recommended shipments
                 * - Prevents expansion state conflicts between tabs
                 * - Makes debugging easier
                 */
                const shipmentKey = `custom-${locationId}-${index}`;
                const expandKey =
                  totalFromLocation > 1 ? shipmentKey : `custom-${locationId}`;

                return (
                  <ShipmentDetails
                    key={shipmentKey}
                    shipment={shipment as any}
                    selectedCourier={courierSelections.get(index)}
                    onCourierSelect={(courier) =>
                      onCourierSelect(index, courier)
                    }
                    isExpanded={expandedLocationId === expandKey}
                    onToggleExpand={() => onToggleExpand(expandKey)}
                    shipmentIndex={shipmentIndexForLocation}
                    totalShipmentsFromLocation={totalFromLocation}
                    globalShipmentIndex={index + 1}
                    totalShipments={customResult.shipments.length}
                  />
                );
              });
            })()}
          </Box>
        </Box>
      ) : null}

      {/**
       * Test Fill Button.
       *
       * Allows quick testing by automatically filling allocations.
       * Disabled when stock data hasn't loaded yet (no products have stock data).
       *
       * Why disable when no stock data?
       * - Can't make allocations without knowing available stock
       * - Prevents errors from trying to allocate to non-existent locations
       * - Better UX (button only enabled when it can actually work)
       */}
      <Box
        className={
          styles[
            "shipping-optimization-modal__custom-allocation-fill-button-container"
          ]
        }
      >
        <Tooltip title="Automatically fill allocations with 2 pickup locations per product, splitting quantity evenly">
          <BlueButton
            variant="outlined"
            size="small"
            onClick={handleFillTestAllocations}
            startIcon={<AutoFixHighIcon />}
            disabled={Object.keys(stockByProduct).length === 0}
          >
            Fill Test Allocations
          </BlueButton>
        </Tooltip>
      </Box>

      {/**
       * Loading state for product details.
       * Shown when fetching full product information (images, titles) for import flows.
       */}
      {loadingProductDetails && (
        <Box
          className={
            styles["shipping-optimization-modal__custom-allocation-loading-stock"]
          }
        >
          <CircularProgress size={24} />
          <BodyText text="Loading product details..." variant="body2" />
        </Box>
      )}

      {/**
       * Product Allocation Accordions.
       *
       * One accordion per product, allowing user to allocate each product to locations.
       * Each accordion shows:
       * - Product info (image, title, required quantity)
       * - Allocation status (complete/incomplete/over-allocated)
       * - Location search and selection
       * - Quantity inputs per location
       *
       * Accordion State:
       * - Only one product accordion expanded at a time (cleaner UI)
       * - Expanded state tracked per product
       *
       * Uses enrichedProductItems which includes full product details (images, proper titles)
       * fetched from the API for import flows.
       */}
      {!loadingProductDetails && enrichedProductItems.map((product) => {
        /**
         * Get stock state for this product.
         *
         * Contains loading, error, and data (locations with stock).
         */
        const stockState = stockByProduct[product.productId];
        const locations = stockState?.data || [];

        /**
         * Calculate total allocated quantity for this product.
         *
         * Sums up all allocations across all locations for this product.
         */
        const totalAllocated = getTotalAllocated(product.productId);

        /**
         * Determine allocation status for this product.
         *
         * - Complete: totalAllocated === product.quantity (exactly allocated)
         * - Over-allocated: totalAllocated > product.quantity (too much allocated)
         * - Incomplete: totalAllocated < product.quantity (not enough allocated)
         *
         * Used for status chip display and validation.
         */
        const isComplete = totalAllocated === product.quantity;
        const isOverAllocated = totalAllocated > product.quantity;

        return (
          <Accordion
            key={product.productId}
            expanded={expandedProduct === product.productId}
            onChange={(_, isExpanded) =>
              setExpandedProduct(isExpanded ? product.productId : null)
            }
            className={
              styles["shipping-optimization-modal__custom-allocation-accordion"]
            }
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              className={
                styles[
                  "shipping-optimization-modal__custom-allocation-accordion-summary"
                ]
              }
            >
              <Box
                className={
                  styles[
                    "shipping-optimization-modal__custom-allocation-product-header"
                  ]
                }
              >
                {/* Product Image Carousel */}
                <ProductImageCarousel
                  images={buildProductImages(product)}
                  variant="grid"
                  size={130}
                  fallbackLetter={product.title?.charAt(0) ?? "P"}
                />

                {/* Product Title */}
                <Box
                  className={
                    styles[
                      "shipping-optimization-modal__custom-allocation-product-info"
                    ]
                  }
                >
                  <Subheader
                    variant="subtitle1"
                    label={product.title}
                    component="div"
                    className={
                      styles[
                        "shipping-optimization-modal__custom-allocation-product-title"
                      ]
                    }
                  />
                  <SecondaryFont
                    variant="body2"
                    component="div"
                    className={
                      styles[
                        "shipping-optimization-modal__custom-allocation-product-quantity"
                      ]
                    }
                  >
                    Required: {product.quantity} units
                  </SecondaryFont>
                </Box>

                {/* Allocation Status */}
                <Chip
                  label={`${totalAllocated} / ${product.quantity}`}
                  color={
                    isComplete
                      ? "success"
                      : isOverAllocated
                      ? "error"
                      : "warning"
                  }
                  size="small"
                  icon={isComplete ? <CheckIcon /> : undefined}
                  className={
                    styles[
                      "shipping-optimization-modal__custom-allocation-status-chip"
                    ]
                  }
                />
              </Box>
            </AccordionSummary>

            <AccordionDetails>
              {stockState?.loading ? (
                <Box
                  className={
                    styles[
                      "shipping-optimization-modal__custom-allocation-loading-stock"
                    ]
                  }
                >
                  <CircularProgress size={24} />
                </Box>
              ) : stockState?.error ? (
                <BodyText
                  className={
                    styles[
                      "shipping-optimization-modal__custom-allocation-error-text"
                    ]
                  }
                >
                  {stockState.error}
                </BodyText>
              ) : locations.length === 0 ? (
                <SecondaryFont
                  className={
                    styles[
                      "shipping-optimization-modal__custom-allocation-no-locations-text"
                    ]
                  }
                >
                  No pickup locations available for this product
                </SecondaryFont>
              ) : (
                <Box
                  className={
                    styles[
                      "shipping-optimization-modal__custom-allocation-locations-list"
                    ]
                  }
                >
                  {/* Added locations section: Display selected locations with quantity inputs.
                   *
                   * This IIFE processes the addedLocationIds array to:
                   * 1. Get location IDs that have been added for this product
                   * 2. Map IDs to location objects (for display)
                   * 3. Maintain insertion order (order user added them)
                   * 4. Filter out any invalid IDs (defensive programming)
                   *
                   * Why use Map for lookup?
                   * - O(1) lookup performance
                   * - Maintains insertion order when iterating
                   * - Efficient for mapping IDs to objects
                   */}
                  {(() => {
                    const productLocationIds =
                      addedLocationIds[product.productId] || [];
                    /**
                     * Create a Map of locationId -> location object for quick lookup.
                     *
                     * This allows us to efficiently find location objects by ID
                     * while maintaining the order from addedLocationIds array.
                     */
                    const locationMap = new Map(
                      locations.map((loc) => [loc.pickupLocationId, loc])
                    );
                    /**
                     * Map location IDs to location objects, maintaining insertion order.
                     *
                     * Filters out any IDs that don't exist in the locations array
                     * (defensive programming - handles edge cases).
                     */
                    const addedLocationsList = productLocationIds
                      .map((id) => locationMap.get(id))
                      .filter(
                        (loc): loc is ProductStockByLocation =>
                          loc !== undefined
                      );

                    return addedLocationsList.length > 0 ? (
                      <>
                        <SecondaryFont
                          variant="caption"
                          className={
                            styles[
                              "shipping-optimization-modal__custom-allocation-selected-locations-label"
                            ]
                          }
                        >
                          Selected Locations ({addedLocationsList.length})
                        </SecondaryFont>
                        {addedLocationsList.map((location) => {
                          const currentAllocation =
                            allocations[product.productId]?.[
                              location.pickupLocationId
                            ] || 0;
                          const maxAllowable = location.availableStock ?? 0;

                          return (
                            <Paper
                              key={location.pickupLocationId}
                              variant="outlined"
                              className={
                                styles[
                                  "shipping-optimization-modal__custom-allocation-location-paper"
                                ]
                              }
                            >
                              {/* Location Info - Left side */}
                              <Box
                                className={
                                  styles[
                                    "shipping-optimization-modal__custom-allocation-location-info"
                                  ]
                                }
                              >
                                {/* Location Name with Icon */}
                                <Box
                                  className={
                                    styles[
                                      "shipping-optimization-modal__custom-allocation-location-header"
                                    ]
                                  }
                                >
                                  <LocationIcon
                                    fontSize="small"
                                    color="primary"
                                    className={
                                      styles[
                                        "shipping-optimization-modal__custom-allocation-location-icon"
                                      ]
                                    }
                                  />
                                  <BodyText
                                    variant="body1"
                                    className={
                                      styles[
                                        "shipping-optimization-modal__custom-allocation-location-name"
                                      ]
                                    }
                                  >
                                    {location.locationName}
                                  </BodyText>
                                  <Chip
                                    label={`Stock: ${maxAllowable}`}
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                    sx={{ ml: 1 }}
                                  />
                                </Box>

                                {/* Full Address */}
                                <SecondaryFont
                                  variant="caption"
                                  className={
                                    styles[
                                      "shipping-optimization-modal__custom-allocation-location-address"
                                    ]
                                  }
                                >
                                  {[
                                    location.streetAddress,
                                    location.streetAddress2,
                                    location.city,
                                    location.state,
                                    location.postalCode,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </SecondaryFont>

                                {/* Contact Details Row */}
                                <Box
                                  className={
                                    styles[
                                      "shipping-optimization-modal__custom-allocation-location-contact"
                                    ]
                                  }
                                >
                                  {location.nameOnAddress && (
                                    <Box
                                      className={
                                        styles[
                                          "shipping-optimization-modal__custom-allocation-location-contact-item"
                                        ]
                                      }
                                    >
                                      <PersonIcon
                                        sx={{
                                          fontSize: 14,
                                          color: "rgba(0,0,0,0.5)",
                                        }}
                                      />
                                      <SecondaryFont variant="caption">
                                        {location.nameOnAddress}
                                      </SecondaryFont>
                                    </Box>
                                  )}
                                  {location.phoneOnAddress && (
                                    <Box
                                      className={
                                        styles[
                                          "shipping-optimization-modal__custom-allocation-location-contact-item"
                                        ]
                                      }
                                    >
                                      <PhoneIcon
                                        sx={{
                                          fontSize: 14,
                                          color: "rgba(0,0,0,0.5)",
                                        }}
                                      />
                                      <SecondaryFont variant="caption">
                                        {location.phoneOnAddress}
                                      </SecondaryFont>
                                    </Box>
                                  )}
                                  {location.emailOnAddress && (
                                    <Box
                                      className={
                                        styles[
                                          "shipping-optimization-modal__custom-allocation-location-contact-item"
                                        ]
                                      }
                                    >
                                      <EmailIcon
                                        sx={{
                                          fontSize: 14,
                                          color: "rgba(0,0,0,0.5)",
                                        }}
                                      />
                                      <SecondaryFont variant="caption">
                                        {location.emailOnAddress}
                                      </SecondaryFont>
                                    </Box>
                                  )}
                                </Box>
                              </Box>

                              {/* Right side - Quantity Input and Remove */}
                              <Box
                                className={
                                  styles[
                                    "shipping-optimization-modal__custom-allocation-location-actions"
                                  ]
                                }
                              >
                                <TextFieldInput
                                  type="number"
                                  size="small"
                                  label="Qty"
                                  value={currentAllocation || ""}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    handleAllocationChange(
                                      product.productId,
                                      location.pickupLocationId,
                                      value
                                    );
                                  }}
                                  inputProps={{ min: 0 }}
                                  error={
                                    maxAllowable > 0 &&
                                    currentAllocation > maxAllowable
                                  }
                                  className={
                                    styles[
                                      "shipping-optimization-modal__custom-allocation-location-quantity-field"
                                    ]
                                  }
                                />
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    handleRemoveLocation(
                                      product.productId,
                                      location.pickupLocationId
                                    )
                                  }
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Paper>
                          );
                        })}
                        <Divider
                          className={
                            styles[
                              "shipping-optimization-modal__custom-allocation-divider"
                            ]
                          }
                        />
                      </>
                    ) : null;
                  })()}

                  {/* Search to add new location */}
                  <Box>
                    <TextFieldInput
                      size="small"
                      fullWidth
                      placeholder="Search and add pickup location..."
                      value={locationSearch[product.productId] || ""}
                      onChange={(e) =>
                        setLocationSearch((prev) => ({
                          ...prev,
                          [product.productId]: e.target.value,
                        }))
                      }
                      InputProps={{
                        startAdornment: (
                          <LocationIcon
                            fontSize="small"
                            className={
                              styles[
                                "shipping-optimization-modal__custom-allocation-search-icon"
                              ]
                            }
                          />
                        ),
                      }}
                      className={
                        styles[
                          "shipping-optimization-modal__custom-allocation-search-field"
                        ]
                      }
                    />

                    {/* Search results dropdown: Filter and display matching locations.
                     * This IIFE gets search term, filters locations that match and haven't been added,
                     * limits to 10 results, and shows empty state if no matches.
                     * Search fields: location name, city, state, postal code.
                     * Filters out added locations to prevent duplicates and limit to 10 for performance.
                     */}
                    {(() => {
                      // Get search term for this product (lowercase for case-insensitive matching)
                      const searchTerm = (
                        locationSearch[product.productId] || ""
                      ).toLowerCase();

                      // Require at least 2 characters to show results (prevents too-broad searches)
                      if (!searchTerm || searchTerm.length < 2) return null;

                      /**
                       * Get list of already-added location IDs for this product.
                       *
                       * Convert to Set for O(1) lookup when filtering.
                       */
                      const productLocationIds =
                        addedLocationIds[product.productId] || [];
                      const addedSet = new Set(productLocationIds);

                      /**
                       * Filter locations that match search and haven't been added.
                       *
                       * Checks multiple fields for flexible searching:
                       * - Location name
                       * - City
                       * - State
                       * - Postal code
                       *
                       * Limits to 10 results for performance and UX.
                       */
                      const searchResults = locations
                        .filter(
                          (loc) =>
                            // Exclude already-added locations
                            !addedSet.has(loc.pickupLocationId) &&
                            // Match if any field contains search term
                            (loc.locationName
                              ?.toLowerCase()
                              .includes(searchTerm) ||
                              loc.city?.toLowerCase().includes(searchTerm) ||
                              loc.state?.toLowerCase().includes(searchTerm) ||
                              loc.postalCode
                                ?.toLowerCase()
                                .includes(searchTerm))
                        )
                        .slice(0, 10); // Limit to 10 results

                      if (searchResults.length === 0) {
                        return (
                          <Paper
                            variant="outlined"
                            className={
                              styles[
                                "shipping-optimization-modal__custom-allocation-no-available-locations-paper"
                              ]
                            }
                          >
                            <SecondaryFont
                              variant="body2"
                              className={
                                styles[
                                  "shipping-optimization-modal__custom-allocation-no-available-locations-text"
                                ]
                              }
                            >
                              No matching locations found
                            </SecondaryFont>
                          </Paper>
                        );
                      }

                      return (
                        <Paper
                          variant="outlined"
                          style={{
                            marginTop: 4,
                            maxHeight: 250,
                            overflow: "auto",
                          }}
                        >
                          {searchResults.map((location) => (
                            <Box
                              key={location.pickupLocationId}
                              style={{
                                padding: 12,
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                cursor: "pointer",
                                borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
                                minWidth: 0,
                                overflow: "hidden",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "rgba(0, 0, 0, 0.04)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }}
                              onClick={() =>
                                handleAddLocation(
                                  product.productId,
                                  location.pickupLocationId
                                )
                              }
                            >
                              <LocationIcon
                                fontSize="small"
                                color="primary"
                                style={{ flexShrink: 0 }}
                              />
                              <Box
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                  overflow: "hidden",
                                }}
                              >
                                <BodyText
                                  variant="body2"
                                  className={
                                    styles[
                                      "shipping-optimization-modal__custom-allocation-location-name"
                                    ]
                                  }
                                >
                                  {location.locationName}
                                </BodyText>
                                <SecondaryFont
                                  variant="caption"
                                  className={
                                    styles[
                                      "shipping-optimization-modal__custom-allocation-location-address"
                                    ]
                                  }
                                >
                                  {[
                                    location.city,
                                    location.state,
                                    location.postalCode,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </SecondaryFont>
                              </Box>
                              <Chip
                                label={`Stock: ${location.availableStock ?? 0}`}
                                size="small"
                                color={
                                  (location.availableStock ?? 0) > 0
                                    ? "success"
                                    : "default"
                                }
                                variant="outlined"
                              />
                              <BlueButton
                                size="small"
                                variant="outlined"
                                color="primary"
                              >
                                Add
                              </BlueButton>
                            </Box>
                          ))}
                        </Paper>
                      );
                    })()}
                  </Box>

                  {/* Hint when no locations added */}
                  {!(addedLocationIds[product.productId]?.length > 0) && (
                    <SecondaryFont
                      variant="caption"
                      style={{
                        textAlign: "center",
                        paddingTop: 16,
                        paddingBottom: 16,
                      }}
                    >
                      Search above to find and add pickup locations
                    </SecondaryFont>
                  )}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

// ============================================================================
// Main Modal Component
// ============================================================================

/**
 * Shipping Optimization Modal Component
 *
 * The main modal for displaying and managing shipping optimization results.
 * Provides two tabs:
 * 1. System Recommended: Shows automatic optimization results
 * 2. Custom: Allows manual product allocation to locations
 *
 * Features:
 * - Tab-based interface (System Recommended vs Custom)
 * - Shipment display with package and courier details
 * - Courier selection per shipment
 * - Custom allocation interface
 * - Confirmation with selected couriers
 * - Loading states and error handling
 *
 * System Recommended Tab:
 * - Displays optimization result from API
 * - Shows shipments grouped by pickup location
 * - Allows courier selection per shipment
 * - Handles weight-split shipments (multiple shipments from same location)
 *
 * Custom Tab:
 * - Allows manual product allocation
 * - Shows stock availability per location
 * - Validates allocations against stock
 * - Calculates shipping with custom allocations
 *
 * State Management:
 * - Separate courier selections for each tab (persists when switching)
 * - Separate expansion states for each tab
 * - Custom result persists when switching tabs
 *
 * @param {ShippingOptimizationModalProps} props - Component props
 * @returns {JSX.Element} Rendered modal
 */
const ShippingOptimizationModal = ({
  open,
  onClose,
  optimizationResult,
  onConfirm,
  isLoading = false,
  productItems = [],
  deliveryPostcode = "",
  isCod = false,
  onCalculateCustom,
  showServiceFeeInput = false,
  serviceFee = 0,
  onServiceFeeChange,
}: ShippingOptimizationModalProps): JSX.Element => {
  /**
   * Active tab state: 0 = System Recommended, 1 = Custom.
   *
   * Controls which tab content is displayed.
   */
  const [activeTab, setActiveTab] = useState(0);

  /**
   * Courier selections for System Recommended tab.
   *
   * Map of pickupLocationId -> selected CourierOption.
   * Each location can have one selected courier.
   */
  const [courierSelections, setCourierSelections] = useState<
    Map<number, CourierOption>
  >(new Map());

  /**
   * Courier selections for Custom tab.
   *
   * Separate from System Recommended selections to allow independent
   * selection when switching tabs.
   */
  const [customCourierSelections, setCustomCourierSelections] = useState<
    Map<number, CourierOption>
  >(new Map());

  /**
   * Custom optimization result state.
   *
   * Stores the result from custom allocation calculation.
   * Persists when switching tabs so user doesn't lose their custom result.
   */
  const [customResult, setCustomResult] =
    useState<OrderOptimizationResponse | null>(null);

  /**
   * Custom calculation loading state.
   *
   * True when shipping calculation is in progress for custom allocations.
   */
  const [customLoading, setCustomLoading] = useState(false);

  /**
   * Expanded shipment state for System Recommended tab.
   *
   * Can be:
   * - number: Single shipment ID (normal case)
   * - string: Weight-split shipment key (e.g., "locationId-shipmentIndex")
   * - null: No shipment expanded
   */
  const [expandedLocationId, setExpandedLocationId] = useState<
    number | string | null
  >(null);

  /**
   * Expanded shipment state for Custom tab.
   *
   * Separate from System Recommended to maintain expansion state per tab.
   */
  const [customExpandedLocationId, setCustomExpandedLocationId] = useState<
    number | string | null
  >(null);

  /**
   * Custom allocations state from CustomAllocationTab.
   *
   * Tracks manual allocations: productId -> (locationId -> quantity).
   * Used to enable/disable "Calculate Shipping" button in footer.
   */
  const [customAllocations, setCustomAllocations] = useState<
    Record<number, Record<number, number>>
  >({});

  /**
   * Custom allocation completion state.
   *
   * True when all products are fully allocated (totalAllocated === product.quantity).
   * Used to enable "Calculate Shipping" button.
   */
  const [isCustomFullyAllocated, setIsCustomFullyAllocated] = useState(false);

  /**
   * Key to force remount of CustomAllocationTab.
   *
   * Incremented when modal opens to reset CustomAllocationTab state.
   * Ensures clean state on each modal open.
   */
  const [customTabKey, setCustomTabKey] = useState(0);

  /**
   * Ref to DialogContent for smooth scrolling.
   *
   * Used to scroll to top when results load, providing better UX.
   */
  const dialogContentRef = useRef<HTMLDivElement>(null);

  /**
   * Initialize courier selections from optimization result.
   *
   * Sets default courier selection for each shipment:
   * - Always selects the cheapest courier (lowest rate) for each shipment
   * - Sorts couriers by rate (ascending) to ensure cheapest is first
   * - Only selects if couriers are available
   * - Updates appropriate state based on isCustom flag
   *
   * IMPORTANT: This function always selects the cheapest courier by default,
   * regardless of previous selections. Users can still manually change the selection if desired.
   *
   * CRITICAL: Uses shipment index as key (not locationId) to handle weight splits.
   * When multiple shipments come from the same location, each needs its own courier selection.
   *
   * Why always select cheapest?
   * - Provides cost-optimized default for users
   * - Ensures consistent behavior across all shipments
   * - Users can still override if they prefer a different courier
   *
   * Why sort by rate?
   * - Ensures we always get the cheapest option even if API doesn't guarantee sorting
   * - Defensive programming: handles edge cases where API order might vary
   *
   * Why use shipment index as key?
   * - Multiple shipments can come from the same location (weight splits)
   * - Using locationId as key causes later shipments to overwrite earlier ones
   * - Shipment index is unique and stable within the shipments array
   *
   * @param {OrderOptimizationResponse} result - Optimization result from API
   * @param {boolean} [isCustom=false] - Whether this is for Custom tab
   * @param {Map<number, CourierOption>} [previousSelections] - Optional previous selections (deprecated, kept for compatibility but not used)
   */
  const initializeSelections = useCallback(
    (
      result: OrderOptimizationResponse,
      isCustom: boolean = false,
      previousSelections?: Map<number, CourierOption>
    ) => {
      if (result.shipments) {
        // Use shipment index as key to handle weight splits (multiple shipments from same location)
        const initialSelections = new Map<number, CourierOption>();

        result.shipments.forEach((shipment, shipmentIndex) => {
          if (shipment.availableCouriers.length > 0) {
            // Sort couriers by rate (ascending) to ensure cheapest is first
            // Create a copy to avoid mutating the original array
            const sortedCouriers = [...shipment.availableCouriers].sort(
              (a, b) => a.rate - b.rate
            );

            // Always select the cheapest courier (first after sorting)
            // Use shipmentIndex as key (not locationId) to handle weight splits
            initialSelections.set(shipmentIndex, sortedCouriers[0]);
          }
          // If no couriers available, don't add to map (will be undefined when looked up)
        });
        // Update appropriate state based on tab
        if (isCustom) {
          setCustomCourierSelections(initialSelections);
        } else {
          setCourierSelections(initialSelections);
        }
      }
    },
    [courierSelections, customCourierSelections]
  );

  /**
   * Track previous optimization result to detect when it changes.
   *
   * Used to detect when a NEW optimization result comes in (after recalculating shipping).
   * When this happens, we need to revalidate and clear invalid courier selections.
   */
  const prevSystemOptimizationResult = useRef<OrderOptimizationResponse | null>(
    null
  );

  /**
   * Initialize courier selections when System Recommended result changes.
   *
   * This effect runs when:
   * - Modal opens
   * - Optimization result changes (NEW result after recalculating)
   * - Active tab is System Recommended (Tab 0)
   *
   * IMPORTANT: Always selects the cheapest courier for each shipment by default.
   * When a NEW optimization result comes in, it reinitializes selections to ensure
   * the cheapest courier is selected for all shipments.
   *
   * It initializes default courier selections for the System Recommended tab.
   */
  useEffect(() => {
    if (optimizationResult && open && activeTab === 0) {
      // Detect if this is a NEW optimization result (different from previous)
      const isNewResult =
        prevSystemOptimizationResult.current !== optimizationResult;

      if (isNewResult) {
        // New optimization result - reinitialize selections with cheapest courier for each shipment
        initializeSelections(optimizationResult as any, false);
        // Update ref to track this result
        prevSystemOptimizationResult.current = optimizationResult as any;
      } else if (!prevSystemOptimizationResult.current) {
        // First time loading - initialize selections with cheapest courier
        initializeSelections(optimizationResult as any, false);
        prevSystemOptimizationResult.current = optimizationResult as any;
      }
    }
  }, [optimizationResult, open, activeTab, initializeSelections]);

  /**
   * Reset optimization result tracking when modal closes.
   *
   * Ensures clean state on next open.
   */
  useEffect(() => {
    if (!open) {
      prevSystemOptimizationResult.current = null;
    }
  }, [open]);

  /**
   * Handle custom calculation wrapper.
   *
   * This function wraps the parent's onCalculateCustom callback to:
   * 1. Set loading state (customLoading)
   * 2. Call parent's calculation function
   *
   * Why keep previous results visible?
   * - Better UX - user can still see previous results while new calculation runs
   * - Prevents flickering/blank state
   * - Results will be replaced when new calculation completes
   *
   * @param {Record<number, Record<number, number>>} allocations - Custom allocations to use for calculation
   */
  const handleCalculateCustomWrapper = useCallback(
    async (allocations: Record<number, Record<number, number>>) => {
      if (!onCalculateCustom) return;

      setCustomLoading(true);
      // Don't clear customResult - keep previous results visible while loading (better UX)

      // Call the parent's calculate function (triggers API call)
      onCalculateCustom(allocations);
    },
    [onCalculateCustom]
  );

  /**
   * Watch for custom calculation completion.
   *
   * This effect detects when a custom calculation completes by watching for
   * changes to optimizationResult while on Custom tab and loading.
   *
   * When custom calculation completes:
   * 1. Store the result in customResult state
   * 2. Stop loading state
   * 3. Initialize courier selections for custom tab
   * 4. Store allocations used for this calculation (for change detection)
   * 5. Scroll to top smoothly (better UX)
   *
   * Why use ref to track previous result?
   * - Need to detect when result changes (not just when it exists)
   * - Ref persists across renders without causing re-renders
   * - Allows comparison between previous and current values
   */
  const prevOptimizationResult = useRef(optimizationResult);
  useEffect(() => {
    if (
      activeTab === 1 &&
      customLoading &&
      optimizationResult !== prevOptimizationResult.current &&
      optimizationResult
    ) {
      // Custom calculation completed - process the result
      setCustomResult(optimizationResult as any);
      setCustomLoading(false);
      initializeSelections(optimizationResult as any, true);

      /**
       * Store a deep copy of allocations used for this calculation.
       *
       * We use JSON.parse(JSON.stringify()) for deep cloning to ensure
       * we have an independent copy for comparison later.
       *
       * Why store this?
       * - Need to detect if user changes allocations after calculation
       * - If allocations change, we should clear results (they're invalid)
       * - Deep copy ensures we're comparing values, not references
       */
      allocationsUsedForCalculationRef.current = JSON.parse(
        JSON.stringify(customAllocations)
      );

      /**
       * Smoothly scroll to top when results load.
       *
       * Provides better UX by showing the new results immediately.
       * Small delay ensures DOM is updated before scrolling.
       */
      setTimeout(() => {
        if (dialogContentRef.current) {
          dialogContentRef.current.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }
      }, 100); // Small delay to ensure DOM is updated
    }
    prevOptimizationResult.current = optimizationResult;
  }, [
    optimizationResult,
    activeTab,
    customLoading,
    initializeSelections,
    customAllocations,
  ]);

  /**
   * Note: isLoading and customLoading are independent.
   *
   * - isLoading: Only for System Recommended tab (Tab 0)
   * - customLoading: Only for Custom Allocation tab (Tab 1)
   *
   * This separation prevents modal flicker/shrink when calculating custom shipping
   * while on Custom tab (isLoading might be false, but customLoading is true).
   */

  /**
   * Track allocations that were used for the last calculation.
   *
   * This ref stores a snapshot of allocations at the time of calculation.
   * Used to detect if user modifies allocations after calculation (results become invalid).
   *
   * Why use ref instead of state?
   * - Don't need to trigger re-renders when this changes
   * - Only used for comparison in effect
   * - More efficient than state for this use case
   */
  const allocationsUsedForCalculationRef = useRef<Record<
    number,
    Record<number, number>
  > | null>(null);

  /**
   * Clear shipping results when allocations change.
   *
   * This effect detects when user modifies allocations after a calculation:
   * - User calculates shipping with allocations A
   * - User changes allocations to B
   * - Results from allocations A are now invalid
   * - Clear results and courier selections
   *
   * Why clear results?
   * - Results are based on old allocations
   * - Showing old results with new allocations is misleading
   * - User needs to recalculate with new allocations
   *
   * Detection Method:
   * - Compare current allocations with stored snapshot (deep comparison via JSON.stringify)
   * - If different, allocations changed - clear results
   */
  useEffect(() => {
    // Only clear results if we're on Custom tab, have results, and allocations changed from what was used for calculation
    if (
      activeTab === 1 &&
      customResult?.shipments?.length &&
      allocationsUsedForCalculationRef.current !== null
    ) {
      /**
       * Deep comparison of allocations.
       *
       * Uses JSON.stringify for deep comparison (handles nested objects).
       * If allocations changed, the results are no longer valid.
       */
      const allocationsChanged =
        JSON.stringify(allocationsUsedForCalculationRef.current) !==
        JSON.stringify(customAllocations);

      if (allocationsChanged) {
        // Allocations changed - clear shipping results and courier selections
        setCustomResult(null);
        setCustomCourierSelections(new Map());
        setCustomExpandedLocationId(null);
        allocationsUsedForCalculationRef.current = null; // Reset tracking
      }
    }
  }, [customAllocations, activeTab, customResult]);

  /**
   * Reset custom allocation state when modal closes.
   *
   * This effect ensures clean state when modal is closed:
   * - Clears all custom allocation data
   * - Resets to System Recommended tab
   * - Increments key to force remount of CustomAllocationTab
   * - Resets tracking refs
   *
   * Why reset everything?
   * - Ensures clean state on next open
   * - Prevents stale data from previous session
   * - Better UX (fresh start each time)
   *
   * Why increment customTabKey?
   * - Forces React to remount CustomAllocationTab component
   * - Ensures all internal state is reset
   * - Prevents state leakage between modal opens
   */
  useEffect(() => {
    if (!open) {
      // Reset all custom allocation state
      setCustomResult(null);
      setCustomCourierSelections(new Map());
      setCustomExpandedLocationId(null);
      setCustomAllocations({});
      setIsCustomFullyAllocated(false);
      setCustomLoading(false);
      setActiveTab(0); // Reset to System Recommended tab
      // Increment key to force remount of CustomAllocationTab when modal closes
      setCustomTabKey((prev) => prev + 1);
      // Reset allocations tracking ref
      allocationsUsedForCalculationRef.current = null;
    }
  }, [open]);

  /**
   * Calculate total shipping cost for System Recommended tab.
   *
   * Sums up the rates of all selected couriers across all shipments.
   * Iterates over all shipments and sums their selected courier rates.
   * This ensures weight splits (multiple shipments from same location) are all included.
   *
   * @returns {number} Total shipping cost in rupees
   */
  const calculateTotalShipping = useCallback(() => {
    if (!optimizationResult?.shipments) return 0;

    let total = 0;
    optimizationResult.shipments.forEach((shipment, shipmentIndex) => {
      const selectedCourier = courierSelections.get(shipmentIndex);
      if (selectedCourier) {
        total += selectedCourier.rate;
      }
    });
    return total;
  }, [courierSelections, optimizationResult]);

  /**
   * Calculate total shipping cost for Custom tab.
   *
   * Same as calculateTotalShipping but uses customCourierSelections and customResult instead.
   * Separate function to maintain independence between tabs.
   * Iterates over all shipments to ensure weight splits are included.
   *
   * @returns {number} Total shipping cost in rupees
   */
  const calculateCustomTotalShipping = useCallback(() => {
    if (!customResult?.shipments) return 0;

    let total = 0;
    customResult.shipments.forEach((shipment, shipmentIndex) => {
      const selectedCourier = customCourierSelections.get(shipmentIndex);
      if (selectedCourier) {
        total += selectedCourier.rate;
      }
    });
    return total;
  }, [customCourierSelections, customResult]);

  /**
   * Determine if System Recommended loader should be shown.
   *
   * This memoized value controls when to show the loading spinner:
   * - Only on System Recommended tab (Tab 0)
   * - Only when isLoading is true
   * - Not when custom calculation is in progress
   *
   * Why separate from isLoading?
   * - isLoading might be true while on Custom tab (from parent)
   * - We don't want to show loader on Custom tab
   * - Prevents modal flicker/shrink when switching tabs
   *
   * Why memoize?
   * - Prevents unnecessary recalculations
   * - Only recalculates when dependencies change
   * - Better performance
   *
   * @returns {boolean} True if loader should be shown
   */
  const shouldShowSystemRecommendedLoader = useMemo(() => {
    // Only show loader if we're on Tab 0 AND isLoading is true AND we're not doing custom calculation
    return activeTab === 0 && isLoading && !customLoading;
  }, [activeTab, isLoading, customLoading]);

  /**
   * Calculate undeliverable locations for System Recommended tab.
   *
   * A shipment is undeliverable if it has no available couriers.
   * Returns unique location names that have at least one undeliverable shipment.
   *
   * @returns {string[]} Array of unique location names that cannot deliver
   */
  const undeliverableSystemLocations = useMemo(() => {
    if (!optimizationResult?.shipments?.length) return [];

    const undeliverableLocations = new Set<string>();
    optimizationResult.shipments.forEach((shipment) => {
      if (
        !shipment.availableCouriers ||
        shipment.availableCouriers.length === 0
      ) {
        const locationName =
          shipment.pickupLocation?.addressNickName || "Unknown Location";
        undeliverableLocations.add(locationName);
      }
    });
    return Array.from(undeliverableLocations);
  }, [optimizationResult?.shipments]);

  /**
   * Calculate undeliverable locations for Custom Allocation tab.
   *
   * A shipment is undeliverable if it has no available couriers.
   * Returns unique location names that have at least one undeliverable shipment.
   *
   * @returns {string[]} Array of unique location names that cannot deliver
   */
  const undeliverableCustomLocations = useMemo(() => {
    if (!customResult?.shipments?.length) return [];

    const undeliverableLocations = new Set<string>();
    customResult.shipments.forEach((shipment) => {
      if (
        !shipment.availableCouriers ||
        shipment.availableCouriers.length === 0
      ) {
        const locationName =
          shipment.pickupLocation?.addressNickName || "Unknown Location";
        undeliverableLocations.add(locationName);
      }
    });
    return Array.from(undeliverableLocations);
  }, [customResult?.shipments]);

  /**
   * Check if shipping can be confirmed for System Recommended tab.
   * Returns true if ALL shipments have at least one courier available.
   */
  const canConfirmSystemRecommended = useMemo(() => {
    return undeliverableSystemLocations.length === 0;
  }, [undeliverableSystemLocations]);

  /**
   * Check if shipping can be confirmed for Custom Allocation tab.
   * Returns true if ALL shipments have at least one courier available.
   */
  const canConfirmCustom = useMemo(() => {
    return undeliverableCustomLocations.length === 0;
  }, [undeliverableCustomLocations]);

  /**
   * Handle courier selection for a shipment (System Recommended tab).
   *
   * Updates the courier selections map with the new selection for the given shipment.
   * Uses shipment index as key to handle weight splits (multiple shipments from same location).
   * Uses Map for O(1) lookup and update performance.
   *
   * @param {number} shipmentIndex - Index of the shipment in the shipments array
   * @param {CourierOption} courier - The courier option that was selected
   */
  const handleCourierSelect = useCallback(
    (shipmentIndex: number, courier: CourierOption) => {
      setCourierSelections((prev) => {
        // Create new Map to ensure React detects state change
        const next = new Map(prev);
        next.set(shipmentIndex, courier);
        return next;
      });
    },
    []
  );

  /**
   * Handle confirmation of shipping selections (System Recommended tab).
   *
   * This function is called when user clicks "Confirm Shipping" button.
   * It:
   * 1. Validates that optimization result exists and has shipments
   * 2. Creates SelectedShippingResult object with:
   *    - Optimization result (shipments, packages, etc.)
   *    - Courier selections (which courier for each location)
   *    - Total shipping cost (sum of courier rates)
   *    - Total packaging cost (from optimization result)
   * 3. Calls parent's onConfirm callback
   * 4. Shows success toast with total cost
   * 5. Closes the modal
   *
   * @returns {void}
   */
  const handleConfirm = useCallback(() => {
    // Validate: Ensure we have valid optimization result
    if (!optimizationResult || !optimizationResult.shipments?.length) {
      toast.error("No shipping options available");
      return;
    }

    /**
     * Create result object for parent callback.
     *
     * Contains all information needed by parent to update the order:
     * - Optimization result (for allocations, packages)
     * - Courier selections (for shipping costs)
     * - Total costs (for display and calculations)
     */
    const result: SelectedShippingResult = {
      optimizationResult,
      courierSelections,
      totalShippingCost: calculateTotalShipping(),
      totalPackagingCost: optimizationResult.totalPackagingCost,
    };

    try {
      // Call parent callback (updates order with shipping info)
      onConfirm(result);

      // Show success message with total cost (shipping + packaging)
      toast.success(
        `Shipping confirmed: ₹${(
          result.totalShippingCost + result.totalPackagingCost
        ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      );
    } finally {
      // Always close modal after confirmation
      onClose();
    }
  }, [
    optimizationResult,
    courierSelections,
    calculateTotalShipping,
    onConfirm,
    onClose,
  ]);

  // Error state
  if (optimizationResult && !optimizationResult.success) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle
          className={styles["shipping-optimization-modal__error-title"]}
        >
          <ShippingIcon color="error" />
          <Subheader variant="h6" label="Optimization Failed" />
        </DialogTitle>
        <DialogContent>
          <Box className={styles["shipping-optimization-modal__error-content"]}>
            <BodyText
              className={styles["shipping-optimization-modal__error-text"]}
              variant="body1"
            >
              {optimizationResult.errorMessage ||
                "Failed to optimize order fulfillment"}
            </BodyText>
          </Box>
        </DialogContent>
        <DialogActions>
          <BlueButton onClick={onClose}>Close</BlueButton>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{ sx: { maxHeight: "95vh" } }}
    >
      <DialogTitle className={styles["shipping-optimization-modal__title"]}>
        <Box className={styles["shipping-optimization-modal__title-left"]}>
          <ShippingIcon color="primary" />
          <Subheader variant="h6" label="Shipping Optimization" />
          {/**
           * Display shipment count badge.
           *
           * Shows total number of shipments from optimization result.
           * Helps user understand how many shipments will be created.
           */}
          {optimizationResult?.shipments?.length && (
            <Chip
              label={`${optimizationResult.shipments.length} Shipment${
                optimizationResult.shipments.length !== 1 ? "s" : ""
              }`}
              size="small"
              color="primary"
            />
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/**
       * Tab navigation: System Recommended vs Custom Allocation.
       *
       * Two tabs provide different workflows:
       * - System Recommended: Uses automatic optimization (API decides allocations)
       * - Custom Allocation: Allows manual product allocation to locations
       *
       * Custom Allocation tab is disabled if no products are available.
       * This prevents users from trying to allocate when there's nothing to allocate.
       */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        className={styles["shipping-optimization-modal__tabs"]}
      >
        <Tab label="System Recommended" />
        <Tab label="Custom Allocation" disabled={productItems.length === 0} />
      </Tabs>

      <DialogContent
        ref={dialogContentRef}
        className={styles["shipping-optimization-modal__dialog-content"]}
      >
        {/* Tab 0: System Recommended */}
        {/* Only show isLoading loader for System Recommended tab, completely ignore it for Custom tab */}
        {activeTab === 0 &&
          (shouldShowSystemRecommendedLoader ? (
            <Box
              className={
                styles["shipping-optimization-modal__custom-allocation-loading"]
              }
            >
              <CircularProgress size={48} />
              <Box
                className={
                  styles[
                    "shipping-optimization-modal__custom-allocation-loading-text"
                  ]
                }
              >
                <Subheader
                  variant="h6"
                  label="Calculating optimal shipping..."
                />
                <SecondaryFont variant="body2">
                  This may take up to 30 seconds
                </SecondaryFont>
              </Box>
            </Box>
          ) : !optimizationResult || !optimizationResult.shipments?.length ? (
            <Box
              className={
                styles["shipping-optimization-modal__custom-allocation-empty"]
              }
            >
              <ShippingIcon
                className={
                  styles[
                    "shipping-optimization-modal__custom-allocation-empty-icon"
                  ]
                }
              />
              <SecondaryFont>No shipping options available</SecondaryFont>
            </Box>
          ) : (
            <Box
              className={
                styles[
                  "shipping-optimization-modal__custom-allocation-results-list"
                ]
              }
            >
              {/**
               * Process shipments and handle weight-split detection.
               *
               * This IIFE (Immediately Invoked Function Expression) processes the shipments
               * array to:
               * 1. Count shipments per location (for weight-split detection)
               * 2. Track shipment indices per location (for labeling "Shipment 1 of 3")
               * 3. Generate unique keys for expansion state tracking
               * 4. Render ShipmentDetails components with proper props
               *
               * Weight-Split Detection:
               * - When total weight exceeds courier limits, API splits into multiple shipments
               * - Multiple shipments from same location = weight split
               * - Example: Location A has 3 shipments = weight split into 3 shipments
               *
               * Expansion Key Strategy:
               * - Normal case (1 shipment per location): Use locationId as expandKey
               * - Weight split (multiple shipments): Use unique string key "locationId-index"
               * - This ensures each shipment can be expanded independently
               *
               * Why use IIFE?
               * - Allows complex logic before rendering
               * - Keeps render function clean
               * - Encapsulates weight-split detection logic
               */}
              {(() => {
                /**
                 * Calculate shipment counts per location.
                 *
                 * This map tells us how many shipments come from each location.
                 * Used to detect weight splits (when count > 1).
                 *
                 * Example: { 1: 3, 2: 1 } means location 1 has 3 shipments (weight split),
                 * location 2 has 1 shipment (normal).
                 */
                const shipmentCountByLocation =
                  optimizationResult.shipments.reduce((acc, s) => {
                    const locId = s.pickupLocation?.pickupLocationId || 0;
                    acc[locId] = (acc[locId] || 0) + 1;
                    return acc;
                  }, {} as Record<number, number>);

                /**
                 * Track current shipment index per location.
                 *
                 * Used to generate labels like "Shipment 1 of 3", "Shipment 2 of 3", etc.
                 * Increments as we process shipments from each location.
                 */
                const locationIndexTracker: Record<number, number> = {};

                /**
                 * Map shipments to ShipmentDetails components.
                 *
                 * For each shipment:
                 * - Determine if it's part of a weight split
                 * - Calculate its index within that location's shipments
                 * - Generate unique key for expansion state
                 * - Render ShipmentDetails with appropriate props
                 */
                return optimizationResult.shipments.map((shipment, index) => {
                  const locationId =
                    shipment.pickupLocation?.pickupLocationId || 0;
                  const totalFromLocation =
                    shipmentCountByLocation[locationId] || 1;

                  /**
                   * Calculate current shipment index for this location.
                   *
                   * Increments the tracker for this location, giving us:
                   * - First shipment from location: 1
                   * - Second shipment from location: 2
                   * - etc.
                   */
                  locationIndexTracker[locationId] =
                    (locationIndexTracker[locationId] || 0) + 1;
                  const shipmentIndexForLocation =
                    locationIndexTracker[locationId];

                  /**
                   * Generate unique keys for React rendering and expansion state.
                   *
                   * - shipmentKey: Unique key for React (always unique, includes array index)
                   * - expandKey: Key for expansion state (locationId for normal, unique string for weight splits)
                   *
                   * Why different keys?
                   * - shipmentKey: Must be unique for React reconciliation
                   * - expandKey: Must distinguish between shipments in weight splits, but can reuse locationId for normal cases
                   */
                  const shipmentKey = `${locationId}-${index}`;
                  const expandKey =
                    totalFromLocation > 1 ? shipmentKey : locationId;

                  return (
                    <ShipmentDetails
                      key={shipmentKey}
                      shipment={shipment as any}
                      selectedCourier={courierSelections.get(index)}
                      onCourierSelect={(courier) =>
                        handleCourierSelect(index, courier as any)
                      }
                      isExpanded={expandedLocationId === expandKey}
                      onToggleExpand={() =>
                        setExpandedLocationId((prev) =>
                          prev === expandKey ? null : expandKey
                        )
                      }
                      shipmentIndex={shipmentIndexForLocation}
                      totalShipmentsFromLocation={totalFromLocation}
                      globalShipmentIndex={index + 1}
                      totalShipments={optimizationResult.shipments.length}
                    />
                  );
                });
              })()}
            </Box>
          ))}

        {/**
         * Custom Allocation Tab Container.
         *
         * Always mounted but hidden when not active to prevent remounts.
         * This preserves state when switching tabs (better UX).
         *
         * Why always mount instead of conditional rendering?
         * - Preserves component state when switching tabs
         * - Prevents loss of allocations when user switches tabs
         * - Better performance (no remount overhead)
         * - Uses display: none instead of conditional rendering
         *
         * customTabKey:
         * - Incremented when modal closes to force remount on next open
         * - Ensures clean state on each modal open
         * - Prevents state leakage between sessions
         */}
        <Box
          className={
            styles["shipping-optimization-modal__custom-tab-container"]
          }
          style={{ display: activeTab === 1 ? "block" : "none" }}
        >
          <CustomAllocationTab
            key={customTabKey}
            productItems={productItems}
            deliveryPostcode={deliveryPostcode}
            isCod={isCod}
            customResult={customResult}
            isCalculating={customLoading}
            courierSelections={customCourierSelections}
            /**
             * Handle courier selection for Custom tab.
             *
             * Updates customCourierSelections map (separate from System Recommended).
             * Uses shipment index as key to handle weight splits (multiple shipments from same location).
             * Creates new Map to ensure React detects state change.
             */
            onCourierSelect={(shipmentIndex, courier) => {
              setCustomCourierSelections((prev) => {
                const next = new Map(prev);
                next.set(shipmentIndex, courier as any);
                return next;
              });
            }}
            expandedLocationId={customExpandedLocationId}
            /**
             * Handle expansion toggle for Custom tab.
             *
             * Toggles expansion state: if already expanded, collapse; otherwise expand.
             * Uses separate state from System Recommended tab.
             */
            onToggleExpand={(key) =>
              setCustomExpandedLocationId((prev) => (prev === key ? null : key))
            }
            /**
             * Handle allocation changes from CustomAllocationTab.
             *
             * Called whenever user modifies allocations (adds/removes locations, changes quantities).
             * Updates both allocations state and completion status.
             *
             * Why track completion status?
             * - Enables/disables "Calculate Shipping" button
             * - Shows user when all products are fully allocated
             * - Provides feedback on allocation progress
             */
            onAllocationsChange={(allocs, isFullyAllocated) => {
              setCustomAllocations(allocs);
              setIsCustomFullyAllocated(isFullyAllocated);
            }}
          />
        </Box>
      </DialogContent>

      <Divider />

      {/* Footer with Total and Actions */}
      <DialogActions
        className={styles["shipping-optimization-modal__dialog-actions"]}
        sx={{
          "& > :first-of-type": {
            marginLeft: 0,
            paddingLeft: 0,
          },
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box className={styles["shipping-optimization-modal__totals-wrapper"]}>
          {/* System Recommended tab - show totals */}
          {activeTab === 0 && optimizationResult?.shipments?.length && (
            <Box
              className={
                styles["shipping-optimization-modal__totals-container"]
              }
            >
              <Box
                className={styles["shipping-optimization-modal__totals-row"]}
              >
                <SecondaryFont
                  variant="body2"
                  className={
                    styles["shipping-optimization-modal__totals-label"]
                  }
                >
                  📦 Packaging:
                </SecondaryFont>
                <BodyText
                  variant="body2"
                  className={`${styles["shipping-optimization-modal__totals-value"]} ${styles["shipping-optimization-modal__totals-value--blue"]}`}
                >
                  ₹
                  {optimizationResult.totalPackagingCost.toLocaleString(
                    "en-IN",
                    { minimumFractionDigits: 2 }
                  )}
                </BodyText>
              </Box>
              <Box
                className={styles["shipping-optimization-modal__totals-row"]}
              >
                <SecondaryFont
                  variant="body2"
                  className={
                    styles["shipping-optimization-modal__totals-label"]
                  }
                >
                  🚚 Shipping:
                </SecondaryFont>
                <BodyText
                  variant="body2"
                  className={`${styles["shipping-optimization-modal__totals-value"]} ${styles["shipping-optimization-modal__totals-value--orange"]}`}
                >
                  ₹
                  {calculateTotalShipping().toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </BodyText>
              </Box>
              {showServiceFeeInput && (
                <Box
                  className={styles["shipping-optimization-modal__totals-row"]}
                  sx={{ alignItems: "center" }}
                >
                  <SecondaryFont
                    variant="body2"
                    className={
                      styles["shipping-optimization-modal__totals-label"]
                    }
                  >
                    💼 Service Fee:
                  </SecondaryFont>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <span style={{ color: "#666" }}>₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={serviceFee}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        onServiceFeeChange?.(value >= 0 ? value : 0);
                      }}
                      style={{
                        width: "100px",
                        padding: "4px 8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "14px",
                        textAlign: "right",
                      }}
                    />
                  </Box>
                </Box>
              )}
              <Box
                className={
                  styles["shipping-optimization-modal__totals-total-row"]
                }
              >
                <BodyText
                  variant="body1"
                  className={
                    styles["shipping-optimization-modal__totals-total-label"]
                  }
                >
                  Total:
                </BodyText>
                <Subheader
                  variant="h5"
                  label={`₹${(
                    optimizationResult.totalPackagingCost +
                    calculateTotalShipping() +
                    (showServiceFeeInput ? serviceFee : 0)
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                  className={`${styles["shipping-optimization-modal__totals-total-value"]} ${styles["shipping-optimization-modal__totals-total-value--green"]}`}
                />
              </Box>
            </Box>
          )}
          {/* Custom tab with results - show totals */}
          {activeTab === 1 && customResult?.shipments?.length && (
            <Box
              className={
                styles["shipping-optimization-modal__totals-container"]
              }
            >
              <Box
                className={styles["shipping-optimization-modal__totals-row"]}
              >
                <SecondaryFont
                  variant="body2"
                  className={
                    styles["shipping-optimization-modal__totals-label"]
                  }
                >
                  📦 Packaging:
                </SecondaryFont>
                <BodyText
                  variant="body2"
                  className={`${styles["shipping-optimization-modal__totals-value"]} ${styles["shipping-optimization-modal__totals-value--blue"]}`}
                >
                  ₹
                  {customResult.totalPackagingCost.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </BodyText>
              </Box>
              <Box
                className={styles["shipping-optimization-modal__totals-row"]}
              >
                <SecondaryFont
                  variant="body2"
                  className={
                    styles["shipping-optimization-modal__totals-label"]
                  }
                >
                  🚚 Shipping:
                </SecondaryFont>
                <BodyText
                  variant="body2"
                  className={`${styles["shipping-optimization-modal__totals-value"]} ${styles["shipping-optimization-modal__totals-value--orange"]}`}
                >
                  ₹
                  {calculateCustomTotalShipping().toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </BodyText>
              </Box>
              {showServiceFeeInput && (
                <Box
                  className={styles["shipping-optimization-modal__totals-row"]}
                  sx={{ alignItems: "center" }}
                >
                  <SecondaryFont
                    variant="body2"
                    className={
                      styles["shipping-optimization-modal__totals-label"]
                    }
                  >
                    💼 Service Fee:
                  </SecondaryFont>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <span style={{ color: "#666" }}>₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={serviceFee}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        onServiceFeeChange?.(value >= 0 ? value : 0);
                      }}
                      style={{
                        width: "100px",
                        padding: "4px 8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        fontSize: "14px",
                        textAlign: "right",
                      }}
                    />
                  </Box>
                </Box>
              )}
              <Box
                className={
                  styles["shipping-optimization-modal__totals-total-row"]
                }
              >
                <BodyText
                  variant="body1"
                  className={
                    styles["shipping-optimization-modal__totals-total-label"]
                  }
                >
                  Total:
                </BodyText>
                <Subheader
                  variant="h5"
                  label={`₹${(
                    customResult.totalPackagingCost +
                    calculateCustomTotalShipping() +
                    (showServiceFeeInput ? serviceFee : 0)
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                  className={`${styles["shipping-optimization-modal__totals-total-value"]} ${styles["shipping-optimization-modal__totals-total-value--green"]}`}
                />
              </Box>
            </Box>
          )}
          {/* Custom tab without results - show hint */}
          {activeTab === 1 &&
            !customResult?.shipments?.length &&
            !customLoading && (
              <SecondaryFont
                variant="body2"
                className={styles["shipping-optimization-modal__totals-hint"]}
              >
                {isCustomFullyAllocated
                  ? 'Click "Calculate Shipping" to see costs'
                  : "Complete allocations for all products first"}
              </SecondaryFont>
            )}
          {/* Custom tab loading */}
          {activeTab === 1 && customLoading && (
            <Box
              className={styles["shipping-optimization-modal__totals-loading"]}
            >
              <CircularProgress size={20} />
              <SecondaryFont
                variant="body2"
                className={
                  styles["shipping-optimization-modal__totals-loading-text"]
                }
              >
                Calculating...
              </SecondaryFont>
            </Box>
          )}
        </Box>

        {/* Undeliverable locations error message - System Recommended */}
        {activeTab === 0 && undeliverableSystemLocations.length > 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              backgroundColor: "rgba(211, 47, 47, 0.08)",
              border: "1px solid rgba(211, 47, 47, 0.4)",
              borderRadius: 1.5,
              padding: "12px 16px",
              flex: 1,
              maxWidth: "100%",
            }}
          >
            <Box sx={{ fontSize: "1.25rem", lineHeight: 1 }}>🚫</Box>
            <Box sx={{ flex: 1 }}>
              <BodyText
                variant="body2"
                sx={{
                  color: "error.dark",
                  fontWeight: 600,
                  marginBottom: 0.5,
                }}
              >
                Cannot fulfill shipment
              </BodyText>
              <BodyText
                variant="body2"
                sx={{
                  color: "error.main",
                }}
              >
                The following pickup locations have no couriers available for
                the delivery address:{" "}
                <strong>{undeliverableSystemLocations.join(", ")}</strong>
              </BodyText>
            </Box>
          </Box>
        )}

        {/* Undeliverable locations error message - Custom Allocation */}
        {activeTab === 1 &&
          customResult?.shipments?.length &&
          undeliverableCustomLocations.length > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                backgroundColor: "rgba(211, 47, 47, 0.08)",
                border: "1px solid rgba(211, 47, 47, 0.4)",
                borderRadius: 1.5,
                padding: "12px 16px",
                flex: 1,
                maxWidth: "100%",
              }}
            >
              <Box sx={{ fontSize: "1.25rem", lineHeight: 1 }}>🚫</Box>
              <Box sx={{ flex: 1 }}>
                <BodyText
                  variant="body2"
                  sx={{
                    color: "error.dark",
                    fontWeight: 600,
                    marginBottom: 0.5,
                  }}
                >
                  Cannot fulfill shipment
                </BodyText>
                <BodyText
                  variant="body2"
                  sx={{
                    color: "error.main",
                  }}
                >
                  The following pickup locations have no couriers available for
                  the delivery address:{" "}
                  <strong>{undeliverableCustomLocations.join(", ")}</strong>
                </BodyText>
              </Box>
            </Box>
          )}

        <Box
          className={
            styles["shipping-optimization-modal__dialog-actions-buttons"]
          }
        >
          <RedButton onClick={onClose} variant="outlined">
            Cancel
          </RedButton>
          {/* System Recommended tab - Confirm button */}
          {activeTab === 0 && (
            <BlueButton
              variant="contained"
              color="success"
              startIcon={<CheckIcon />}
              onClick={handleConfirm}
              disabled={
                !optimizationResult?.shipments?.length ||
                shouldShowSystemRecommendedLoader ||
                !canConfirmSystemRecommended
              }
            >
              Confirm Shipping
            </BlueButton>
          )}
          {/* Custom tab without results - Calculate Shipping button */}
          {activeTab === 1 && !customResult?.shipments?.length && (
            <BlueButton
              variant="contained"
              color="primary"
              startIcon={
                customLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <ShippingIcon />
                )
              }
              onClick={() => handleCalculateCustomWrapper(customAllocations)}
              disabled={!isCustomFullyAllocated || customLoading}
            >
              {customLoading ? "Calculating..." : "Calculate Shipping"}
            </BlueButton>
          )}
          {/**
           * Custom tab with results - Confirm Shipping button.
           *
           * Shown when custom calculation has completed and results are available.
           * Creates SelectedShippingResult from custom result and courier selections,
           * then calls parent's onConfirm callback.
           *
           * Why inline handler instead of separate function?
           * - Simple one-time action
           * - Keeps code localized
           * - No need for separate function for this specific case
           */}
          {activeTab === 1 && customResult?.shipments?.length && (
            <BlueButton
              variant="contained"
              color="success"
              startIcon={<CheckIcon />}
              disabled={!canConfirmCustom}
              onClick={() => {
                /**
                 * Create result object for parent callback.
                 *
                 * Uses customResult (from custom allocation calculation) instead of
                 * optimizationResult (from system recommended).
                 */
                const result: SelectedShippingResult = {
                  optimizationResult: customResult,
                  courierSelections: customCourierSelections,
                  totalShippingCost: calculateCustomTotalShipping(),
                  totalPackagingCost: customResult.totalPackagingCost,
                };
                try {
                  // Call parent callback (updates order with shipping info)
                  onConfirm(result);
                  // Show success message with total cost
                  toast.success(
                    `Shipping confirmed: ₹${(
                      result.totalShippingCost + result.totalPackagingCost
                    ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                  );
                } finally {
                  // Always close modal after confirmation
                  onClose();
                }
              }}
            >
              Confirm Shipping
            </BlueButton>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ShippingOptimizationModal;

// Re-export types for backward compatibility
export type {
  ProductItemForAllocation,
  SelectedShippingResult,
} from "../../../models";
