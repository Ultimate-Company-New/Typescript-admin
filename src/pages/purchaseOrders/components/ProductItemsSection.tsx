import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { toast } from "react-toastify";

import { Box, Divider, Paper } from "@mui/material";

import { Inventory2 as ProductIcon } from "@mui/icons-material";

import shippingApi, {
  type OrderOptimizationRequest,
  type OrderOptimizationResponse,
} from "../../../api/shippingApi";
import { BodyText, SecondaryFont, Subheader } from "../../../components/fonts";
import {
  type ProductItemForAllocation,
  type ProductItemsSectionProps,
  type PurchaseOrderProductItemForm,
} from "../../../models";
import {
  type ProductImageInfo,
  type PurchaseOrderProductItem,
} from "../../../models/api-models";
import styles from "../../../styles/PurchaseOrders.module.scss";

import GrandTotalSummary from "./GrandTotalSummary";
import ProductActionsSection from "./ProductActionsSection";
import ProductItemCard from "./ProductItemCard";
import ProductPickerModal from "./ProductPickerModal";
import ShippingOptimizationModal, {
  type SelectedShippingResult,
} from "./ShippingOptimizationModal";

/**
 * Product Items Section Component for Purchase Orders
 *
 * This is the main component responsible for managing products in a purchase order.
 * It handles:
 * - Displaying product items with expandable details
 * - Adding products via product picker modal
 * - Calculating optimal shipping via optimization API
 * - Managing pickup location allocations
 * - Calculating grand totals (products, discounts, packaging, shipping, GST)
 * - Coordinating between product selection, shipping calculation, and order summary
 *
 * Key Features:
 * 1. Product Management: Add/remove products, view details, expand/collapse
 * 2. Shipping Optimization: Calls API to calculate optimal packaging and shipping
 * 3. Allocation Management: Tracks which products come from which pickup locations
 * 4. Financial Calculations: Aggregates costs across all products and fees
 *
 * State Management:
 * - Local state for UI (modals, expanded items, loading states)
 * - Product items come from parent via props (controlled component)
 * - Shipping allocations managed via callback to parent
 *
 * @param {ProductItemsSectionProps} props - Component props
 * @returns {JSX.Element} Rendered product items section
 */
const ProductItemsSection = ({
  productItems,
  onProductItemsChange,
  isView = false,
  disabled = false,
  deliveryAddress,
  shippingAllocations,
  onShippingChange,
  packagingFee = 0,
  totalShippingCost: propTotalShippingCost,
  serviceFee = 0,
  onServiceFeeChange,
}: ProductItemsSectionProps): JSX.Element => {
  /**
   * Normalize address values coming from react-hook-form.
   *
   * In edit mode, form default values often start as empty strings ("") and then
   * get populated from the API. We must treat empty strings as "unset" so our
   * address-change reset logic doesn't wipe shipping allocations during the
   * initial data load.
   */
  const normalizeAddressValue = useCallback((value?: string) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }, []);

  // UI State: Product picker modal visibility
  const [pickerOpen, setPickerOpen] = useState(false);

  // UI State: Which product card is currently expanded to show details
  const [expandedProductId, setExpandedProductId] = useState<number | null>(
    null
  );

  // Loading State: Whether shipping calculation is in progress
  const [shippingLoading, setShippingLoading] = useState(false);

  // State: Whether shipping has been calculated (affects UI display)
  // Initialize based on whether products already have allocations (e.g., when editing existing order)
  const [shippingCalculated, setShippingCalculated] = useState(() => {
    return productItems.some(
      (item: any) => item.pickupAllocations && item.pickupAllocations.length > 0
    );
  });

  // Modal State: Shipping optimization modal visibility
  const [shippingModalOpen, setShippingModalOpen] = useState(false);

  // Data State: Stores the optimization API response (contains shipments, packages, couriers)
  const [optimizationResult, setOptimizationResult] =
    useState<OrderOptimizationResponse | null>(null);

  // Cost State: Total packaging cost from optimization result (sum of all package costs)
  // Use packagingFee prop if available (set by FillTestDataButton), otherwise use local state
  const [totalPackagingCost, setTotalPackagingCost] = useState(0);

  // Use packagingFee from form if available, otherwise use local state
  // This ensures FillTestDataButton's automatic calculation is reflected in the UI
  const effectivePackagingCost =
    packagingFee > 0 ? packagingFee : totalPackagingCost;

  // Track previous values to detect changes (prevents reset on initial mount)
  const prevPostalCodeRef = useRef<string | undefined>(
    normalizeAddressValue(deliveryAddress?.postalCode)
  );
  const prevCityRef = useRef<string | undefined>(
    normalizeAddressValue(deliveryAddress?.city)
  );
  const prevStateRef = useRef<string | undefined>(
    normalizeAddressValue(deliveryAddress?.state)
  );
  const prevProductCountRef = useRef<number>(productItems.length);
  const prevProductIdsRef = useRef<string>(""); // Track product IDs to detect actual additions/removals

  /**
   * Validates that delivery address has required fields for shipping calculation.
   *
   * Shipping API requires postal code, city, and state to calculate shipping options.
   * Without these, we cannot determine shipping routes or costs.
   *
   * @returns {boolean} True if address has postal code, city, and state
   */
  const hasValidDeliveryAddress = Boolean(
    deliveryAddress?.postalCode &&
      deliveryAddress?.city &&
      deliveryAddress?.state
  );

  /**
   * Convert API product items to form product items.
   *
   * The API uses PurchaseOrderProductItem (nested product structure),
   * but the form uses PurchaseOrderProductItemForm (flat structure with images, brand, etc.).
   * This conversion extracts flat fields from nested structure so ProductItemCard can access them.
   */
  const formProductItems: PurchaseOrderProductItemForm[] = useMemo(() => {
    /**
     * Helper to extract images from nested product structure.
     */
    const extractImages = (product: any): ProductImageInfo[] | undefined => {
      if (!product) return undefined;
      // If images already in flat format, use them
      if (Array.isArray(product.images)) return product.images;
      // Otherwise extract from nested image URLs
      const images: ProductImageInfo[] = [];
      if (product.mainImageUrl)
        images.push({ url: product.mainImageUrl, label: "Main" });
      if (product.topImageUrl)
        images.push({ url: product.topImageUrl, label: "Top" });
      if (product.bottomImageUrl)
        images.push({ url: product.bottomImageUrl, label: "Bottom" });
      if (product.frontImageUrl)
        images.push({ url: product.frontImageUrl, label: "Front" });
      if (product.backImageUrl)
        images.push({ url: product.backImageUrl, label: "Back" });
      if (product.rightImageUrl)
        images.push({ url: product.rightImageUrl, label: "Right" });
      if (product.leftImageUrl)
        images.push({ url: product.leftImageUrl, label: "Left" });
      if (product.detailsImageUrl)
        images.push({ url: product.detailsImageUrl, label: "Details" });
      if (product.defectImageUrl)
        images.push({ url: product.defectImageUrl, label: "Defect" });
      if (product.additionalImage1Url)
        images.push({
          url: product.additionalImage1Url,
          label: "Additional 1",
        });
      if (product.additionalImage2Url)
        images.push({
          url: product.additionalImage2Url,
          label: "Additional 2",
        });
      if (product.additionalImage3Url)
        images.push({
          url: product.additionalImage3Url,
          label: "Additional 3",
        });
      return images.length > 0 ? images : undefined;
    };

    return productItems.map((item: PurchaseOrderProductItem) => {
      // If item already has flat structure (from shipping confirmation), use it
      if ((item as any).productId && (item as any).productTitle) {
        return {
          productId: (item as any).productId,
          productTitle: (item as any).productTitle,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          images: (item as any).images,
          brand: (item as any).brand,
          upc: (item as any).upc,
          model: (item as any).model,
          weightKgs: (item as any).weightKgs,
          pickupAllocations: (item as any).pickupAllocations || [],
          discount: (item as any).discount ?? item.product?.discount ?? 0,
          isDiscountPercent:
            (item as any).isDiscountPercent ??
            item.product?.isDiscountPercent ??
            false,
          totalDiscount: (item as any).totalDiscount ?? 0,
          subtotal: (item as any).subtotal ?? item.quantity * item.pricePerUnit,
          grandTotal:
            (item as any).grandTotal ?? item.quantity * item.pricePerUnit,
          totalPackagingFee: (item as any).totalPackagingFee ?? 0,
          totalShippingFee: (item as any).totalShippingFee ?? 0,
          totalAvailableStock: (item as any).totalAvailableStock ?? null,
        } as PurchaseOrderProductItemForm;
      }

      // Otherwise, convert from nested structure
      if (!item.product) {
        // Fallback for items without product (shouldn't happen, but handle gracefully)
        return {
          productId: (item as any).productId || 0,
          productTitle: (item as any).productTitle || "",
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          pickupAllocations: (item as any).pickupAllocations || [],
        } as PurchaseOrderProductItemForm;
      }

      // Extract flat fields from nested product structure
      return {
        productId: item.product.productId,
        productTitle: item.product.title || "",
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        images: extractImages(item.product),
        brand: item.product.brand,
        upc: item.product.upc,
        model: item.product.model,
        weightKgs: item.product.weightKgs,
        pickupAllocations: (item as any).pickupAllocations || [],
        discount: item.product.discount || 0,
        isDiscountPercent: item.product.isDiscountPercent || false,
        totalDiscount: (item as any).totalDiscount ?? 0,
        subtotal: (item as any).subtotal ?? item.quantity * item.pricePerUnit,
        grandTotal:
          (item as any).grandTotal ?? item.quantity * item.pricePerUnit,
        totalPackagingFee: (item as any).totalPackagingFee ?? 0,
        totalShippingFee: (item as any).totalShippingFee ?? 0,
        totalAvailableStock: (item as any).totalAvailableStock ?? null,
      } as PurchaseOrderProductItemForm;
    });
  }, [productItems]);

  /**
   * Determines if shipping calculation is enabled.
   *
   * Shipping can only be calculated when:
   * 1. There are products in the order (hasProducts)
   * 2. Delivery address is valid (hasValidDeliveryAddress)
   *
   * @returns {boolean} True if shipping calculation button should be enabled
   */
  const hasProducts = formProductItems.length > 0;
  const canCalculateShipping = hasProducts && hasValidDeliveryAddress;

  /**
   * Opens the product picker modal after validating delivery address.
   *
   * Why validate address first?
   * - Product selection requires knowing where products will be shipped
   * - Stock availability depends on delivery location
   * - Shipping calculation needs address to work properly
   *
   * Shows warning toast if address is incomplete.
   */
  const handleOpenPicker = useCallback(() => {
    if (!hasValidDeliveryAddress) {
      toast.warning(
        "Please fill in the delivery address (City, State, and Postal Code) before adding products"
      );
      return;
    }
    setPickerOpen(true);
  }, [hasValidDeliveryAddress]);

  /**
   * Handles adding a new product to the order.
   *
   * Appends the selected product to the existing product items array.
   * The product comes from ProductPickerModal with basic info (no allocations yet).
   * Allocations will be calculated later via shipping optimization.
   *
   * @param {PurchaseOrderProductItemForm} product - The product to add (from picker)
   */
  const handleProductSelect = useCallback(
    (product: PurchaseOrderProductItemForm) => {
      // Preserve totalAvailableStock when converting to PurchaseOrderProductItem format
      // Extract stock data before type conversion to ensure it's not lost
      const stockData = (product as any).totalAvailableStock;
      const productWithStock = {
        ...product,
        totalAvailableStock: stockData !== undefined ? stockData : null,
      };
      onProductItemsChange([
        ...formProductItems,
        productWithStock,
      ] as unknown as PurchaseOrderProductItem[]);
    },
    [formProductItems, onProductItemsChange]
  );

  /**
   * Reset shipping details when address changes.
   *
   * This ensures that shipping calculations are invalidated when:
   * - Delivery address changes (postcode, city, or state)
   *
   * Why reset?
   * - Shipping costs depend on delivery location
   * - Previous calculations become invalid when address changes
   */
  useEffect(() => {
    // Only reset if address actually changed (not on initial mount)
    const addressChanged =
      prevPostalCodeRef.current !== deliveryAddress?.postalCode ||
      prevCityRef.current !== deliveryAddress?.city ||
      prevStateRef.current !== deliveryAddress?.state;

    // Treat empty strings as "not set" to avoid clearing shipping during edit-mode initial load
    const hadPreviousAddress = Boolean(
      prevPostalCodeRef.current || prevCityRef.current || prevStateRef.current
    );

    if (
      addressChanged &&
      hadPreviousAddress
    ) {
      // Reset shipping state when address changes
      setShippingCalculated(false);
      setOptimizationResult(null);
      setTotalPackagingCost(0);
      // Notify parent to reset shipping allocations
      onShippingChange([], 0);
    }

    // Update refs for next comparison
    prevPostalCodeRef.current = normalizeAddressValue(deliveryAddress?.postalCode);
    prevCityRef.current = normalizeAddressValue(deliveryAddress?.city);
    prevStateRef.current = normalizeAddressValue(deliveryAddress?.state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    deliveryAddress?.postalCode,
    deliveryAddress?.city,
    deliveryAddress?.state,
  ]);

  /**
   * Sync shippingCalculated state with actual allocations.
   *
   * If products have allocations, shipping has been calculated.
   * This ensures the state stays in sync even if component re-renders.
   */
  useEffect(() => {
    const hasAllocations = formProductItems.some(
      (item) => item.pickupAllocations && item.pickupAllocations.length > 0
    );

    // Only update if state doesn't match reality
    if (hasAllocations !== shippingCalculated) {
      setShippingCalculated(hasAllocations);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formProductItems
      .map((item) => item.pickupAllocations?.length || 0)
      .join(","),
  ]);

  /**
   * Reset shipping details when products are added or removed.
   *
   * When products are added or removed, previous shipping calculations
   * are no longer valid and need to be recalculated.
   *
   * Note: We track product IDs to detect actual additions/removals, not just
   * property updates (like allocations) which shouldn't reset shipping.
   */
  useEffect(() => {
    // Get current product IDs as sorted string for comparison
    // Handle both PurchaseOrderProductItem (has product.productId) and PurchaseOrderProductItemForm (has productId)
    const currentProductIds = productItems
      .map((p) => (p as any).productId || (p as any).product?.productId)
      .filter(Boolean)
      .sort()
      .join(",");

    // Only reset if product IDs actually changed (added/removed), not just updated properties
    const productIdsChanged = prevProductIdsRef.current !== currentProductIds;

    if (productIdsChanged && prevProductIdsRef.current !== "") {
      // Reset shipping state when products are added/removed
      setShippingCalculated(false);
      setOptimizationResult(null);
      setTotalPackagingCost(0);
      // Notify parent to reset shipping allocations
      onShippingChange([], 0);
    }

    // Update refs for next comparison
    prevProductCountRef.current = productItems.length;
    prevProductIdsRef.current = currentProductIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    productItems
      .map((p) => (p as any).productId || (p as any).product?.productId)
      .filter(Boolean)
      .join(","),
  ]);

  /**
   * Handles removing a product from the order.
   *
   * Filters out the product by ID and updates the parent's product items.
   * Shipping will be reset automatically via useEffect when productItems.length changes.
   *
   * @param {number} productId - ID of the product to remove
   */
  const handleRemoveProduct = useCallback(
    (productId: number) => {
      onProductItemsChange(
        formProductItems.filter(
          (item) => item.productId !== productId
        ) as unknown as PurchaseOrderProductItem[]
      );
    },
    [formProductItems, onProductItemsChange]
  );

  /**
   * Handles updating a product's quantity and/or price.
   *
   * Updates the product item with new quantity and price, recalculates product totals,
   * and resets shipping since quantity/price changes affect shipping calculations.
   *
   * @param {number} productId - ID of the product to update
   * @param {number} quantity - New quantity for the product
   * @param {number} pricePerUnit - New price per unit for the product
   */
  const handleUpdateProduct = useCallback(
    (productId: number, quantity: number, pricePerUnit: number) => {
      // Find the product item to update
      // IMPORTANT: When ANY product's quantity/price changes, clear ALL shipping data
      // This is because shipping calculations depend on all products' quantities and weights
      const updatedItems = formProductItems.map((item) => {
        if (item.productId === productId) {
          // Calculate new subtotal and grandTotal
          const subtotal = quantity * pricePerUnit;
          // Return updated item with new quantity, price, and totals
          // Clear pickupAllocations and shipping-related fees since quantity/price changed
          // IMPORTANT: When user manually sets price, clear discount fields to prevent reverse-calculation issues
          // The pricePerUnit is the final price the user wants, not a discounted price
          return {
            ...item,
            quantity,
            pricePerUnit,
            subtotal,
            grandTotal: subtotal, // Product total is just subtotal (fees calculated at order level)
            discount: 0, // Clear discount when price is manually set - pricePerUnit is the final price
            totalDiscount: 0, // Clear totalDiscount as well
            pickupAllocations: [], // Clear allocations - shipping needs to be recalculated
            totalPackagingFee: 0, // Reset packaging fee
            totalShippingFee: 0, // Reset shipping fee
          };
        }
        // Clear shipping data for ALL products, not just the updated one
        // This ensures the page is in the same state as if products were just added
        return {
          ...item,
          pickupAllocations: [], // Clear allocations for all products
          totalPackagingFee: 0, // Reset packaging fee for all products
          totalShippingFee: 0, // Reset shipping fee for all products
        };
      });

      // Update parent's product items
      onProductItemsChange(
        updatedItems as unknown as PurchaseOrderProductItem[]
      );

      // Reset shipping since quantity/price changes affect shipping calculations
      setShippingCalculated(false);
      setOptimizationResult(null);
      setTotalPackagingCost(0);
      onShippingChange([], 0);
    },
    [formProductItems, onProductItemsChange, onShippingChange]
  );

  /**
   * Calculates optimal shipping using the shipping optimization API.
   *
   * This is the core shipping calculation function that:
   * 1. Validates prerequisites (products + address)
   * 2. Builds request with product quantities and delivery postcode
   * 3. Calls optimization API to get packaging and shipping solutions
   * 4. Opens modal to display results and allow courier selection
   *
   * The optimization API returns:
   * - Optimal packaging solutions for each pickup location
   * - Available couriers for each route
   * - Shipping costs and delivery estimates
   * - Product allocations across pickup locations
   *
   * Why open modal immediately?
   * - Shows loading state to user immediately
   * - Better UX than waiting for API response
   * - Modal can display loading spinner while API call is in progress
   *
   * Error Handling:
   * - Closes modal on error to prevent stuck state
   * - Extracts detailed error message from API response if available
   * - Falls back to generic error message if extraction fails
   */
  const handleCalculateShipping = useCallback(async () => {
    if (!canCalculateShipping || !deliveryAddress?.postalCode) {
      toast.warning(
        "Please add products and set delivery address before calculating shipping"
      );
      return;
    }

    setShippingLoading(true);
    // Open modal immediately to show loading state (better UX)
    setShippingModalOpen(true);

    try {
      // Build product quantities map: productId -> quantity
      // This format is required by the optimization API
      const productQuantities: Record<number, number> = {};
      for (const item of formProductItems) {
        productQuantities[item.productId] = item.quantity;
      }

      // Build optimization request
      const request: OrderOptimizationRequest = {
        productQuantities,
        deliveryPostcode: deliveryAddress.postalCode,
        isCod: false, // Cash on Delivery - set to false for now
      };

      // Call optimization API
      const response = await shippingApi.optimizeOrder(request);

      // Store result - modal will display it and allow courier selection
      setOptimizationResult(response);
    } catch (error: unknown) {
      // Close modal on error to prevent stuck state
      setShippingModalOpen(false);
      // Extract detailed error message from API response if available
      const errorMessage =
        error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Unknown error occurred";
      toast.error(`Failed to calculate shipping: ${errorMessage}`);
    } finally {
      setShippingLoading(false);
    }
  }, [canCalculateShipping, deliveryAddress?.postalCode, formProductItems]);

  /**
   * Handles confirmation of shipping selection from the optimization modal.
   *
   * This function is called when the user confirms their courier selections in the
   * ShippingOptimizationModal. It performs several critical operations:
   *
   * 1. Converts optimization result to shipping allocations format
   * 2. Builds per-product pickup allocations from shipment data
   * 3. Updates product items with packaging and allocation information
   * 4. Updates parent component with shipping allocations and costs
   * 5. Stores packaging cost for grand total calculation
   *
   * Data Flow:
   * - Optimization API returns shipments (grouped by pickup location)
   * - Each shipment contains products, packages, and available couriers
   * - User selects courier for each shipment
   * - This function converts selections back to product-level allocations
   *
   * Why convert to product-level allocations?
   * - Products need to know which pickup locations they're allocated to
   * - UI displays allocations per product (not per shipment)
   * - Form data structure requires product-level allocation info
   *
   * @param {SelectedShippingResult} result - Contains optimization result and courier selections
   */
  const handleShippingConfirm = useCallback(
    (result: SelectedShippingResult) => {
      // Validate: Ensure optimization result has shipments
      if (!result.optimizationResult.shipments) {
        toast.error("No shipments found in optimization result");
        return;
      }

      // Convert shipments to shipping allocations format (for parent component)
      // Each allocation represents one pickup location with its selected courier
      // IMPORTANT: courierSelections uses shipment array INDEX as key (not pickupLocationId)
      // This is because weight-split shipments have multiple shipments from the same location
      const allocations: ProductItemsSectionProps["shippingAllocations"] =
        result.optimizationResult.shipments.map((shipment, shipmentIndex) => {
          // Use shipment index as key to lookup courier (matches ShippingOptimizationModal)
          const selectedCourier = result.courierSelections.get(shipmentIndex);
          const locationId = shipment.pickupLocation?.pickupLocationId || 0;
          const locationName = shipment.pickupLocation?.addressNickName || "";

          // Validate that packagesUsed exists and has items
          if (!shipment.packagesUsed || shipment.packagesUsed.length === 0) {
            throw new Error(
              `Shipment for ${locationName} has no packages. Please recalculate shipping.`
            );
          }

          return {
            pickupLocationId: locationId,
            locationName,
            postalCode: shipment.pickupLocation?.address?.postalCode || "",
            totalWeightKgs: shipment.totalWeightKgs,
            totalQuantity: shipment.totalQuantity,
            productIds: shipment.products.map((p) => p.product.productId),
            packagingCost: shipment.packagingCost, // Include packaging cost
            packagesUsed: shipment.packagesUsed.map((pkg) => {
              // Validate package data
              if (
                !pkg.packageInfo?.packageId ||
                pkg.packageInfo.packageId <= 0
              ) {
                throw new Error(
                  `Invalid packageId in package for ${locationName}`
                );
              }

              return {
                packageInfo: {
                  packageId: pkg.packageInfo.packageId,
                  packageName: pkg.packageInfo?.packageName || "",
                  packageType: pkg.packageInfo?.packageType || "",
                  pricePerUnit: pkg.packageInfo?.pricePerUnit || 0,
                },
                quantityUsed: pkg.quantityUsed,
                totalCost: pkg.totalCost,
                productDetails: pkg.productDetails,
              };
            }),
            selectedCourier: selectedCourier
              ? {
                  courierCompanyId: selectedCourier.courierCompanyId,
                  courierName: selectedCourier.courierName,
                  courierType: selectedCourier.courierType,
                  rate: selectedCourier.rate,
                  estimatedDeliveryDays:
                    selectedCourier.estimatedDeliveryDays || "",
                  etd: selectedCourier.etd,
                  courierOption: selectedCourier, // Store full CourierOption for metadata
                }
              : undefined,
          };
        });

      /**
       * Build per-product pickup allocations from shipment data.
       *
       * The optimization API returns shipments (grouped by pickup location),
       * but we need product-level allocations for the form structure.
       *
       * Process:
       * 1. Iterate through each shipment
       * 2. For each product in the shipment, create a pickup allocation
       * 3. Include packaging information from the shipment
       * 4. Include address details from the pickup location
       * 5. Group allocations by productId
       *
       * Why product-level allocations?
       * - Form structure expects each product to have its own allocations array
       * - UI displays allocations per product (not per shipment)
       * - Makes it easier to show which products come from which locations
       */
      const productAllocationsMap: Record<
        number,
        NonNullable<PurchaseOrderProductItemForm["pickupAllocations"]>
      > = {};

      result.optimizationResult.shipments.forEach((shipment) => {
        const pickupLocation = shipment.pickupLocation;

        // Process each product allocation in this shipment
        shipment.products.forEach((productAlloc) => {
          const productId = productAlloc.product.productId;

          // Initialize array for this product if it doesn't exist
          if (!productAllocationsMap[productId]) {
            productAllocationsMap[productId] = [];
          }

          /**
           * Convert shipment-level packages to product-level packaging estimate.
           *
           * The shipment contains packagesUsed array with package info and quantities.
           * We convert this to the format expected by the form (packagingEstimate).
           *
           * Note: Packaging is shared across all products in a shipment, so we include
           * the full package list for each product allocation. The UI will display
           * this appropriately.
           */
          const packagingEstimate = shipment.packagesUsed?.map((pkg) => ({
            packageId: pkg.packageInfo?.packageId || 0,
            packageName: pkg.packageInfo?.packageName || "",
            packageType: pkg.packageInfo?.packageType || "",
            quantityUsed: pkg.quantityUsed,
            pricePerUnit: pkg.packageInfo?.pricePerUnit || 0,
            totalCost: pkg.totalCost,
          }));

          /**
           * Create pickup location allocation for this product.
           *
           * This allocation represents:
           * - Which pickup location this product comes from
           * - How many units are allocated to this location
           * - What packages are used (shared across products in shipment)
           * - Address details for the pickup location
           *
           * Note: Courier selection is stored at order level (in shippingAllocations),
           * not per-product, because one courier handles all products from a location.
           */
          const allocation: NonNullable<
            PurchaseOrderProductItemForm["pickupAllocations"]
          >[number] = {
            pickupLocationId: pickupLocation?.pickupLocationId || 0,
            locationName: pickupLocation?.addressNickName || "",
            allocatedQuantity: productAlloc.allocatedQuantity,
            availableStock: 0, // Not tracked here (comes from stock API separately)

            // Address fields from pickup location
            addressType: pickupLocation?.address?.addressType,
            streetAddress: pickupLocation?.address?.streetAddress,
            streetAddress2: pickupLocation?.address?.streetAddress2,
            streetAddress3: pickupLocation?.address?.streetAddress3,
            city: pickupLocation?.address?.city,
            state: pickupLocation?.address?.state,
            postalCode: pickupLocation?.address?.postalCode,
            country: pickupLocation?.address?.country,
            nameOnAddress: pickupLocation?.address?.nameOnAddress,
            emailOnAddress: pickupLocation?.address?.emailOnAddress,
            phoneOnAddress: pickupLocation?.address?.phoneOnAddress,

            // Package info - shipment-level packaging (shared across products in shipment)
            packagingEstimate,
            totalPackagingCost: shipment.packagingCost,

            // Note: Courier info is at order level (shippingAllocations), not per-product
            // This is because one courier handles all products from a pickup location
          };

          // Add allocation to this product's list
          productAllocationsMap[productId].push(allocation);
        });
      });

      /**
       * Update product items with their pickup allocations.
       *
       * Merge the allocations we just built into each product item.
       * Products that weren't in any shipments will have an empty allocations array.
       *
       * IMPORTANT: This matches the exact pattern used in FillTestDataButton.tsx
       * to ensure consistent behavior between automatic fill and manual confirmation.
       */
      const updatedFormItems = formProductItems.map((item) => ({
        ...item,
        pickupAllocations: productAllocationsMap[item.productId] || [],
      }));

      // Update form with allocations first (same as FillTestDataButton)
      // This ensures form state is updated before parent state
      // Note: We can't directly call setValue here, so we'll let handleProductItemsChange handle it

      /**
       * Helper function to extract images from product object to form format.
       * Converts nested product image URLs to flat array format expected by form.
       */
      const extractImagesForForm = (
        product: any
      ): ProductImageInfo[] | undefined => {
        if (!product) return undefined;
        const images: ProductImageInfo[] = [];
        if (product.mainImageUrl)
          images.push({ url: product.mainImageUrl, label: "Main" });
        if (product.topImageUrl)
          images.push({ url: product.topImageUrl, label: "Top" });
        if (product.bottomImageUrl)
          images.push({ url: product.bottomImageUrl, label: "Bottom" });
        if (product.frontImageUrl)
          images.push({ url: product.frontImageUrl, label: "Front" });
        if (product.backImageUrl)
          images.push({ url: product.backImageUrl, label: "Back" });
        if (product.rightImageUrl)
          images.push({ url: product.rightImageUrl, label: "Right" });
        if (product.leftImageUrl)
          images.push({ url: product.leftImageUrl, label: "Left" });
        if (product.detailsImageUrl)
          images.push({ url: product.detailsImageUrl, label: "Details" });
        if (product.defectImageUrl)
          images.push({ url: product.defectImageUrl, label: "Defect" });
        if (product.additionalImage1Url)
          images.push({
            url: product.additionalImage1Url,
            label: "Additional 1",
          });
        if (product.additionalImage2Url)
          images.push({
            url: product.additionalImage2Url,
            label: "Additional 2",
          });
        if (product.additionalImage3Url)
          images.push({
            url: product.additionalImage3Url,
            label: "Additional 3",
          });
        return images.length > 0 ? images : undefined;
      };

      // Convert back to PurchaseOrderProductItem format, but preserve as flat structure for form
      // CRITICAL: Use flat data from formProductItems (which has brand, upc, model, weightKgs, images)
      // Don't rely on productItems prop lookup - it may have lost nested product data from previous updates
      const convertedItems: PurchaseOrderProductItem[] = updatedFormItems.map(
        (item) => {
          // Try to find the original item from productItems prop (which might have nested product object)
          const originalItem = productItems.find(
            (pi: PurchaseOrderProductItem) =>
              pi.product?.productId === item.productId ||
              (pi as any).productId === item.productId
          );

          // Build product object - prioritize flat data from formProductItems (item) which is always current
          // Only use originalItem.product as fallback for fields not in flat structure
          const product = {
            productId: item.productId,
            title: item.productTitle,
            // Use flat fields from formProductItems first (always has current data)
            brand: item.brand ?? originalItem?.product?.brand,
            upc: item.upc ?? originalItem?.product?.upc,
            model: item.model ?? originalItem?.product?.model,
            weightKgs: item.weightKgs ?? originalItem?.product?.weightKgs,
            discount: item.discount ?? originalItem?.product?.discount ?? 0,
            isDiscountPercent:
              item.isDiscountPercent ??
              originalItem?.product?.isDiscountPercent ??
              false,
            // Include image URLs if available from original product
            mainImageUrl: originalItem?.product?.mainImageUrl,
            topImageUrl: originalItem?.product?.topImageUrl,
            bottomImageUrl: originalItem?.product?.bottomImageUrl,
            frontImageUrl: originalItem?.product?.frontImageUrl,
            backImageUrl: originalItem?.product?.backImageUrl,
            rightImageUrl: originalItem?.product?.rightImageUrl,
            leftImageUrl: originalItem?.product?.leftImageUrl,
            detailsImageUrl: originalItem?.product?.detailsImageUrl,
            defectImageUrl: originalItem?.product?.defectImageUrl,
            additionalImage1Url: originalItem?.product?.additionalImage1Url,
            additionalImage2Url: originalItem?.product?.additionalImage2Url,
            additionalImage3Url: originalItem?.product?.additionalImage3Url,
          };

          // CRITICAL: Use flat data from formProductItems - this preserves all product metadata
          // formProductItems always has the current flat data (brand, upc, model, weightKgs, images)
          const productItem: any = {
            // Flat structure fields (what ProductItemCard reads) - USE FROM item (formProductItems)
            productId: item.productId,
            productTitle: item.productTitle,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            // Use images from formProductItems (already in flat format) or extract from product
            images: item.images || extractImagesForForm(product),
            // Use metadata from formProductItems (already extracted) - these are current values
            brand: item.brand,
            upc: item.upc,
            model: item.model,
            weightKgs: item.weightKgs,
            discount: item.discount ?? 0,
            isDiscountPercent: item.isDiscountPercent ?? false,
            // Preserve calculated totals
            subtotal: item.subtotal,
            grandTotal: item.grandTotal,
            totalDiscount: item.totalDiscount,
            // Preserve allocations
            pickupAllocations: item.pickupAllocations || [],
            // Preserve totalAvailableStock
            totalAvailableStock: (item as any).totalAvailableStock,
            // Preserve fees
            totalPackagingFee: item.totalPackagingFee,
            totalShippingFee: item.totalShippingFee,
            // Also preserve nested product structure for API compatibility
            product: product as any,
          };

          return productItem as PurchaseOrderProductItem;
        }
      );

      // Update parent's product items state (this triggers ProductItemsSection to update)
      // IMPORTANT: This must be called BEFORE onShippingChange to ensure state is in sync
      onProductItemsChange(convertedItems);

      // Update shipping allocations and fees (same as FillTestDataButton)
      // This matches FillTestDataButton.tsx lines 571-574
      onShippingChange(
        allocations as ProductItemsSectionProps["shippingAllocations"],
        result.totalShippingCost
      );

      // Update packaging cost state (for display in GrandTotalSummary)
      setTotalPackagingCost(result.totalPackagingCost);

      // Mark shipping as calculated
      setShippingCalculated(true);

      // Close modal and clear optimization result
      setShippingModalOpen(false);
      setOptimizationResult(null);
    },
    [onShippingChange, formProductItems, onProductItemsChange]
  );

  /**
   * Handle custom allocation calculation from Custom Allocation tab.
   *
   * This function is called when user manually allocates products to pickup locations
   * in the Custom Allocation tab and clicks "Calculate Shipping".
   *
   * It performs:
   * 1. Validates delivery address is present
   * 2. Builds product quantities map from current product items
   * 3. Calls optimization API with custom allocations
   * 4. Stores result for display in modal
   *
   * Custom Allocations Format:
   * - Record<productId, Record<locationId, quantity>>
   * - Example: { 123: { 1: 5, 2: 3 } } means product 123 has 5 units at location 1, 3 units at location 2
   *
   * Why separate from handleCalculateShipping?
   * - handleCalculateShipping: Uses automatic optimization (API decides allocations)
   * - handleCalculateCustom: Uses manual allocations (user decides allocations)
   * - Different request payloads (customAllocations field)
   * - Same API endpoint, different use case
   *
   * Error Handling:
   * - Extracts detailed error message from API response if available
   * - Falls back to generic error message if extraction fails
   * - Shows error toast to user
   * - Loading state is cleared in finally block (always executes)
   *
   * @param {Record<number, Record<number, number>>} customAllocations - Manual allocations from Custom Allocation tab
   */
  const handleCalculateCustom = useCallback(
    async (customAllocations: Record<number, Record<number, number>>) => {
      // Validate: Delivery address is required for shipping calculation
      if (!deliveryAddress?.postalCode) {
        toast.warning("Delivery address is required");
        return;
      }

      setShippingLoading(true);

      try {
        /**
         * Build product quantities map from current product items.
         *
         * Format: { productId: quantity }
         * This is required by the optimization API to know how many units of each product.
         */
        const productQuantities: Record<number, number> = {};
        for (const item of formProductItems) {
          productQuantities[item.productId] = item.quantity;
        }

        /**
         * Build optimization request with custom allocations.
         *
         * The customAllocations parameter tells the API:
         * - Which products go to which pickup locations
         * - How many units of each product at each location
         *
         * The API will then:
         * - Calculate packaging for each location
         * - Find available couriers for each route
         * - Calculate shipping costs
         */
        const request: OrderOptimizationRequest = {
          productQuantities,
          deliveryPostcode: deliveryAddress.postalCode,
          isCod: false, // Cash on Delivery - set to false for now
          customAllocations, // Manual allocations from user
        };

        // Call optimization API with custom allocations
        const response = await shippingApi.optimizeOrder(request);

        // Store the optimization result (will be displayed in modal)
        setOptimizationResult(response);
      } catch (error: unknown) {
        /**
         * Extract detailed error message from API response.
         *
         * Error structure can vary:
         * - Error instance: error.message
         * - Axios error: error.response.data.message
         * - Unknown: fallback message
         */
        const errorMessage =
          error instanceof Error
            ? error.message
            : (error as { response?: { data?: { message?: string } } })
                ?.response?.data?.message || "Unknown error occurred";
        toast.error(`Failed to calculate shipping: ${errorMessage}`);
      } finally {
        // Always clear loading state (even on error)
        setShippingLoading(false);
      }
    },
    [deliveryAddress?.postalCode, formProductItems]
  );

  /**
   * Calculate total shipping cost from selected couriers.
   *
   * Sums up the rates of all selected couriers across all pickup locations.
   * Each shipping allocation has a selectedCourier with a rate.
   * In view mode, if propTotalShippingCost is provided, use that instead.
   *
   * @returns {number} Total shipping cost in rupees
   */
  const calculatedShippingCost = shippingAllocations.reduce(
    (sum, alloc) => sum + (alloc.selectedCourier?.rate || 0),
    0
  );

  // Use prop value if provided (for view/edit mode when we have values from API),
  // otherwise calculate from allocations
  // IMPORTANT: Check for both undefined and null, and also check if prop is explicitly 0 vs calculated 0
  // If prop is provided (even if 0), use it - it represents the saved value from orderSummary
  const totalShippingCost =
    propTotalShippingCost !== undefined && propTotalShippingCost !== null
      ? propTotalShippingCost
      : calculatedShippingCost;

  /**
   * Calculate grand totals across all products.
   *
   * This reducer aggregates financial data from all product items:
   * - Gross Subtotal: Sum before any discounts
   * - Subtotal: Sum after discounts
   * - Discount: Total discount amount
   * - Packaging: Total packaging fees (deprecated, use totalPackagingCost instead)
   * - Shipping: Total shipping fees (deprecated, use totalShippingCost instead)
   * - Total: Grand total (deprecated, calculated in GrandTotalSummary)
   *
   * Discount Calculation Logic:
   * - Percentage Discount: pricePerUnit is already discounted, so we reverse-calculate
   *   the original price, then calculate discount amount
   * - Fixed Discount: Simply multiply discount per unit by quantity
   *
   * Why reverse-calculate for percentage discounts?
   * - The form stores pricePerUnit as the discounted price
   * - To show gross subtotal, we need the original price
   * - Formula: originalPrice = discountedPrice / (1 - discountPercent/100)
   *
   * Note: Tax (GST) is calculated at order level in GrandTotalSummary component,
   * after packaging and shipping are added.
   */
  // Calculate grand totals directly from productItems prop
  // This ensures we always use the latest values when quantities/prices change
  // We use a JSON string of quantities and prices as the dependency key to detect changes
  const quantitiesAndPricesKey = JSON.stringify(
    productItems.map((item) => {
      const productId = item.product?.productId || (item as any).productId;
      return {
        productId,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
      };
    })
  );

  const grandTotals = useMemo(() => {
    // Always recalculate from current formProductItems (which is derived from productItems prop)
    return formProductItems.reduce(
      (acc, item) => {
        // Calculate gross amount (before discount): quantity × pricePerUnit
        const grossAmount = item.quantity * item.pricePerUnit;

        // Calculate discount amount based on discount type
        let discountAmount = 0;
        if (item.discount && item.discount > 0) {
          if (item.isDiscountPercent) {
            // For percentage discount, pricePerUnit is already discounted
            // Reverse-calculate original price: originalPrice = pricePerUnit / (1 - discount/100)
            const originalPrice = item.pricePerUnit / (1 - item.discount / 100);
            // Calculate discount amount: quantity × originalPrice × discountPercent/100
            discountAmount =
              (item.quantity * originalPrice * item.discount) / 100;
          } else {
            // Flat discount per unit: simply multiply by quantity
            discountAmount = item.quantity * item.discount;
          }
        }

        // Use totalDiscount if explicitly set and > 0, otherwise use calculated discountAmount
        // This allows override from external calculations if needed
        const itemDiscount =
          item.totalDiscount && item.totalDiscount > 0
            ? item.totalDiscount
            : discountAmount;

        // Calculate current subtotal from quantity and price (always use current values)
        const currentSubtotal = item.quantity * item.pricePerUnit;

        return {
          // Gross subtotal = sum of (quantity × originalPrice) before discount
          // We add discountAmount to grossAmount to get the original total
          grossSubtotal: acc.grossSubtotal + grossAmount + discountAmount,

          // Subtotal = sum of current item subtotals (quantity × pricePerUnit)
          // Always calculate from current quantity and price, not from stored subtotal
          subtotal: acc.subtotal + currentSubtotal,

          // Discount = sum of all item discounts
          discount: acc.discount + itemDiscount,

          // Packaging = sum of item packaging fees (deprecated, use totalPackagingCost)
          packaging: acc.packaging + (item.totalPackagingFee || 0),

          // Shipping = sum of item shipping fees (deprecated, use totalShippingCost)
          shipping: acc.shipping + (item.totalShippingFee || 0),

          // Total = sum of item grand totals (deprecated, calculated in GrandTotalSummary)
          total: acc.total + (item.grandTotal || currentSubtotal),
        };
      },
      {
        grossSubtotal: 0,
        subtotal: 0,
        discount: 0,
        packaging: 0,
        shipping: 0,
        total: 0,
      }
    );
  }, [formProductItems, quantitiesAndPricesKey]);

  return (
    <Paper className={styles["add-purchase-order-page__section"]}>
      <Subheader
        label="Products"
        className={styles["add-purchase-order-page__section-title"]}
      />
      <Divider className={styles["add-purchase-order-page__divider"]} />

      {/* Add Product & Calculate Shipping Buttons */}
      {!isView && (
        <ProductActionsSection
          hasValidDeliveryAddress={hasValidDeliveryAddress}
          disabled={disabled}
          shippingCalculated={shippingCalculated}
          shippingLoading={shippingLoading}
          canCalculateShipping={canCalculateShipping}
          onAddProduct={handleOpenPicker}
          onCalculateShipping={handleCalculateShipping}
        />
      )}

      {/* Product Picker Modal */}
      <ProductPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onProductSelect={
          handleProductSelect as unknown as (
            product: PurchaseOrderProductItem
          ) => void
        }
        excludeProductIds={formProductItems.map((item) => item.productId)}
      />

      {/* Shipping Optimization Modal */}
      <ShippingOptimizationModal
        open={shippingModalOpen}
        onClose={() => {
          setShippingModalOpen(false);
          setOptimizationResult(null);
        }}
        optimizationResult={optimizationResult}
        onConfirm={handleShippingConfirm}
        isLoading={shippingLoading}
        productItems={formProductItems.map(
          (item: PurchaseOrderProductItemForm): ProductItemForAllocation => ({
            productId: item.productId,
            title: item.productTitle,
            quantity: item.quantity,
            mainImageUrl: item.images?.[0]?.url || undefined,
          })
        )}
        deliveryPostcode={deliveryAddress?.postalCode || ""}
        isCod={false}
        onCalculateCustom={handleCalculateCustom}
      />

      {/* Product Items List */}
      <Box className={styles["product-items-section__product-list-container"]}>
        {productItems.length === 0 ? (
          <Box className={styles["product-items-section__empty-state"]}>
            <ProductIcon
              className={styles["product-items-section__empty-icon"]}
            />
            <BodyText variant="body2">No products added yet</BodyText>
            {!isView && (
              <SecondaryFont variant="caption">
                Search and add products using the button above
              </SecondaryFont>
            )}
          </Box>
        ) : (
          <Box
            className={styles["product-items-section__product-list"]}
            sx={{ mt: 2 }}
          >
            {formProductItems.map((item) => {
              const isExpanded = expandedProductId === item.productId;

              return (
                <ProductItemCard
                  key={item.productId}
                  item={item}
                  isExpanded={isExpanded}
                  isView={isView}
                  disabled={disabled}
                  onToggleExpand={() =>
                    setExpandedProductId(isExpanded ? null : item.productId)
                  }
                  onRemove={() => handleRemoveProduct(item.productId)}
                  onUpdateProduct={handleUpdateProduct}
                  shippingAllocations={shippingAllocations}
                />
              );
            })}

            {/* Grand Total Summary */}
            <GrandTotalSummary
              grandTotals={grandTotals}
              totalPackagingCost={effectivePackagingCost}
              totalShippingCost={totalShippingCost}
              // Only consider shipping calculated if:
              // 1. shippingCalculated is true (user clicked "Calculate Shipping"), OR
              // 2. We have fees from API (view OR edit mode with orderSummary values), OR
              // 3. We have actual shipping allocations (not just form field values)
              shippingCalculated={
                shippingCalculated ||
                // View or Edit mode: if we have fees from API, consider shipping calculated
                (packagingFee > 0 ||
                  (propTotalShippingCost !== undefined &&
                    propTotalShippingCost > 0)) ||
                (shippingAllocations && shippingAllocations.length > 0)
              }
              hasShippingData={
                (shippingAllocations && shippingAllocations.length > 0) ||
                // View or Edit mode: if we have fees from API, consider shipping data available
                packagingFee > 0 ||
                (propTotalShippingCost !== undefined &&
                  propTotalShippingCost > 0)
              }
              serviceFee={serviceFee}
              onServiceFeeChange={onServiceFeeChange}
              isView={isView}
              disabled={disabled}
            />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default ProductItemsSection;
