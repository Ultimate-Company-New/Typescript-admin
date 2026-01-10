import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { Cancel as CancelIcon, Save as SaveIcon } from "@mui/icons-material";
import { Box, Container, Divider, Grid, Paper } from "@mui/material";

import { leadApi } from "../../api/leadApi";
import { purchaseOrderApi } from "../../api/purchaseOrderApi";
import { BlueButton, RedButton } from "../../components/buttons";
import { SecondaryFont, Subheader } from "../../components/fonts";
import {
  AddressFormController,
  FieldType,
  FormFieldRenderer,
  type LazyFetchFunction,
  type LazyOption,
  type SectionConfig,
} from "../../components/form";
import { type DateTimeValue } from "../../components/form-input";
import {
  PERMISSIONS,
  PRIORITY_OPTIONS,
  PURCHASE_ORDER_STATUS_OPTIONS,
} from "../../constants/appConstants";
import { APP_ROUTES } from "../../constants/routes";
import { usePermissions } from "../../hooks/usePermissions";
import { type ProductItemsSectionProps } from "../../models";
import {
  type LeadResponseModel,
  type ProductImageInfo,
  type PurchaseOrderFormData,
  type PurchaseOrderProductItem,
  type PurchaseOrderRequestModel,
  type PurchaseOrderResponseModel,
  type ShipmentPackageData,
} from "../../models/api-models";
import styles from "../../styles/PurchaseOrders.module.scss";
import { getAllStates, getCitiesByState } from "../../utils/stateCityMapper";
import { purchaseOrderFormSchema } from "../../utils/validationSchemas";

import { MultipleImageUploadInput } from "../../components/form-input";
import { convertImageUrlToBase64 } from "../../utils/imageUtils";
import { FillTestDataButton, ProductItemsSection, PaymentsTable } from "./components";

// ============================================================================
// Component
// ============================================================================

/**
 * Add/Edit/View Purchase Order Page
 * Features:
 * - Create new purchase order
 * - Edit existing purchase order
 * - View purchase order details (read-only)
 * - Address management using AddressFormController
 */
const AddEditPurchaseOrder = (): React.JSX.Element => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const purchaseOrderId = searchParams.get("purchaseOrderId");
  const isView = searchParams.has("isView");
  const isEdit = !!purchaseOrderId && !isView;

  const [loading, setLoading] = useState(false);
  const [selectedState, setSelectedState] = useState<string>("");
  const [initialLeadOption, setInitialLeadOption] = useState<
    LazyOption | undefined
  >(undefined);
  const [productItems, setProductItems] = useState<PurchaseOrderProductItem[]>(
    []
  );
  const [shippingAllocations, setShippingAllocations] = useState<
    ProductItemsSectionProps["shippingAllocations"]
  >([]);

  // Store purchase order response for accessing payments and other data
  const [purchaseOrderResponse, setPurchaseOrderResponse] = useState<
    PurchaseOrderResponseModel | null
  >(null);

  // Store purchase order fields that aren't in the form but need to be sent to backend
  const [purchaseOrderMetaData, setPurchaseOrderMetaData] = useState<{
    isDeleted?: boolean;
    approvedByUserId?: number;
    approvedDate?: string;
    rejectedByUserId?: number;
    rejectedDate?: string;
    promoId?: number;
  }>({});
  // Track if initial address has been set (to avoid clearing products on initial load)
  const initialAddressSet = useRef(false);

  // Get user permissions for authorization
  const { hasPermission } = usePermissions();

  // Use ref to track if permission check has been performed
  const hasCheckedPermissions = useRef(false);
  const hasFetchedDetails = useRef(false);

  // Check permissions on mount and redirect if unauthorized
  useEffect(() => {
    if (hasCheckedPermissions.current) {
      return;
    }

    let requiredPermission: string | null = null;

    if (isView) {
      requiredPermission = PERMISSIONS.VIEW_PURCHASE_ORDERS;
    } else if (isEdit) {
      requiredPermission = PERMISSIONS.UPDATE_PURCHASE_ORDERS;
    } else {
      requiredPermission = PERMISSIONS.INSERT_PURCHASE_ORDERS;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      hasCheckedPermissions.current = true;
      toast.error("You do not have permission to access this page");
      navigate(APP_ROUTES.DASHBOARD.PURCHASE_ORDERS, { replace: true });
    } else if (requiredPermission) {
      hasCheckedPermissions.current = true;
    }
  }, [hasPermission, isView, isEdit, navigate]);

  // Form setup with react-hook-form and Zod validation
  const formMethods = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderFormSchema),
    defaultValues: {
      vendorNumber: "",
      expectedDeliveryDate: "",
      purchaseOrderStatus: "DRAFT",
      priority: "MEDIUM",
      assignedLeadId: 0,
      termsConditionsHtml: "",
      purchaseOrderReceipt: "",
      address: {
        streetAddress: "",
        streetAddress2: "",
        streetAddress3: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        addressType: "OFFICE",
        nameOnAddress: "",
        emailOnAddress: "",
        phoneOnAddress: "",
      },
      productItems: [],
      deliveryFee: 0,
      serviceFee: 0,
      packagingFee: 0,
      discount: 0,
      notes: "",
      attachments: {},
    },
  });
  const {
    control,
    handleSubmit: handleFormSubmit,
    formState,
    reset,
    setValue,
    watch,
    trigger,
    getValues,
  } = formMethods;

  // Watch delivery address fields for product picker
  const watchedCity = watch("address.city");
  const watchedState = watch("address.state");
  const watchedPostalCode = watch("address.postalCode");
  const watchedPackagingFee = watch("packagingFee") || 0;
  const watchedDeliveryFee = watch("deliveryFee") || 0;

  // Watch product items from form to ensure we have full data (images, totals, etc.)
  const watchedProductItems = watch("productItems") || [];

  const deliveryAddress = useMemo(
    () => ({
      city: watchedCity,
      state: watchedState,
      postalCode: watchedPostalCode,
    }),
    [watchedCity, watchedState, watchedPostalCode]
  );
  const { errors } = formState;

  // Track previous address values to detect actual changes
  const prevAddressRef = useRef<{
    state?: string;
    city?: string;
    postalCode?: string;
  }>({});

  // Flag to skip shipping reset during initial API load (edit mode)
  // When loading from API, we set products and shipping allocations together
  // We don't want handleProductItemsChange to clear the allocations
  const isLoadingFromApiRef = useRef(false);

  // Clear products and shipping when delivery address (state, city, or postal code) changes
  useEffect(() => {
    // Skip if we're loading from API (edit mode) - don't clear during initial data load
    if (isLoadingFromApiRef.current) {
      // Still update the refs so we have correct baseline for future comparisons
      if (watchedState || watchedCity || watchedPostalCode) {
        prevAddressRef.current = {
          state: watchedState,
          city: watchedCity,
          postalCode: watchedPostalCode,
        };
        initialAddressSet.current = true;
      }
      return;
    }

    // Skip on initial load - only clear when user changes the address
    if (!initialAddressSet.current) {
      // Mark as set once we have a valid address
      if (watchedState || watchedCity || watchedPostalCode) {
        initialAddressSet.current = true;
        // Store initial address values
        prevAddressRef.current = {
          state: watchedState,
          city: watchedCity,
          postalCode: watchedPostalCode,
        };
      }
      return;
    }

    // Check if address actually changed (not just a re-render)
    const addressChanged =
      prevAddressRef.current.state !== watchedState ||
      prevAddressRef.current.city !== watchedCity ||
      prevAddressRef.current.postalCode !== watchedPostalCode;

    // Only clear if address actually changed and we have products/shipping
    // IMPORTANT: Don't clear deliveryFee/packagingFee here - they come from orderSummary and should persist
    if (
      addressChanged &&
      (productItems.length > 0 || shippingAllocations.length > 0)
    ) {
      setProductItems([]);
      setValue("productItems", []);
      setShippingAllocations([]);
      // Don't clear deliveryFee here - it's set from orderSummary.totalShipping and should persist
      // setValue('deliveryFee', 0) // REMOVED - preserve deliveryFee from orderSummary
      toast.info(
        "Products and shipping allocations cleared due to address change"
      );
    }

    // Update refs for next comparison
    prevAddressRef.current = {
      state: watchedState,
      city: watchedCity,
      postalCode: watchedPostalCode,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedState, watchedCity, watchedPostalCode]);

  // Get states and cities for dropdowns
  const states = useMemo(() => getAllStates(), []);
  const cities = useMemo(
    () => getCitiesByState(selectedState),
    [selectedState]
  );

  // Handle state change to update cities
  const handleStateChange = useCallback((state: string) => {
    setSelectedState(state);
  }, []);

  // Handle product items change
  const handleProductItemsChange = useCallback(
    (items: PurchaseOrderProductItem[], preserveDeliveryFee = false) => {
      setProductItems(items);
      // Read current form items to check for shipping reset
      const currentFormItemsBeforeUpdate = getValues("productItems") || [];
      const currentProductIds = currentFormItemsBeforeUpdate
        .map((fi: any) => fi?.productId)
        .filter(Boolean)
        .sort()
        .join(",");
      // Handle both flat structure (productId) and nested structure (product.productId)
      const newProductIds = items
        .map((item) => (item as any).productId || item.product?.productId)
        .filter(Boolean)
        .sort()
        .join(",");

      // Check if quantity or price has changed (requires shipping recalculation)
      const hasQuantityOrPriceChange = currentFormItemsBeforeUpdate.some(
        (fi: any) => {
          // Handle both flat structure (productId) and nested structure (product.productId)
          const matchingItem = items.find(
            (item) =>
              ((item as any).productId || item.product?.productId) ===
              fi?.productId
          );
          if (!matchingItem) return false;
          const quantityChanged = matchingItem.quantity !== fi.quantity;
          const priceChanged = matchingItem.pricePerUnit !== fi.pricePerUnit;
          return quantityChanged || priceChanged;
        }
      );

      // Only reset shipping if products were actually added/removed (not just allocations updated)
      // Don't clear if we're just updating allocations (which happens when shipping is confirmed)
      const isJustAllocationUpdate =
        currentProductIds === newProductIds &&
        currentFormItemsBeforeUpdate.some(
          (fi: any) => fi?.pickupAllocations?.length > 0
        ) &&
        !hasQuantityOrPriceChange;

      // Reset shipping if products added/removed OR if quantity/price changed
      // BUT skip reset if we're loading from API (edit mode initial load)
      const shouldResetShipping =
        (currentProductIds !== newProductIds && !isJustAllocationUpdate) ||
        hasQuantityOrPriceChange;
      if (shouldResetShipping && !isLoadingFromApiRef.current) {
        // Clear ALL shipping-related state
        setShippingAllocations([]);
        // Clear pickupAllocations from ALL items since they depend on shipping calculations
        // Handle both flat structure and nested structure
        items.forEach((item) => {
          (item as any).pickupAllocations = [];
        });
        // IMPORTANT: When products are edited (quantity/price changed), clear shipping fees
        // The old shipping calculations are no longer valid because products changed
        // Only preserve fees when loading from API (preserveDeliveryFee=true)
        if (!preserveDeliveryFee) {
          // Clear deliveryFee (shipping cost) - old calculations are invalid
          setValue("deliveryFee", 0);
          // Clear packagingFee - old calculations are invalid
          setValue("packagingFee", 0);
        }
        // If preserveDeliveryFee is true, do nothing - keep the fees from orderSummary (when loading from API)
      }

      // Read current form items - this should include data set by FillTestDataButton or shipping confirmation
      const currentFormItems = getValues("productItems") || [];

      // Check if this is an allocation update (shipping confirmation) - incoming items might not have allocations
      // but form items should have them if shipping was just confirmed
      const isAllocationUpdate =
        currentProductIds === newProductIds &&
        !hasQuantityOrPriceChange &&
        currentFormItems.some((fi: any) => fi?.pickupAllocations?.length > 0);

      /**
       * Extract images from nested product structure
       * This handles both cases: when images are already extracted (flat structure)
       * and when they're in the nested product object (API response format)
       */
      const extractImages = (
        item: PurchaseOrderProductItem
      ): ProductImageInfo[] | undefined => {
        // If images already extracted (flat structure), use them
        if ((item as any).images) {
          return (item as any).images;
        }
        // Otherwise, extract from nested product structure
        if (item.product) {
          const images: ProductImageInfo[] = [];
          if (item.product.mainImageUrl)
            images.push({ url: item.product.mainImageUrl, label: "Main" });
          if (item.product.topImageUrl)
            images.push({ url: item.product.topImageUrl, label: "Top" });
          if (item.product.bottomImageUrl)
            images.push({ url: item.product.bottomImageUrl, label: "Bottom" });
          if (item.product.frontImageUrl)
            images.push({ url: item.product.frontImageUrl, label: "Front" });
          if (item.product.backImageUrl)
            images.push({ url: item.product.backImageUrl, label: "Back" });
          if (item.product.rightImageUrl)
            images.push({ url: item.product.rightImageUrl, label: "Right" });
          if (item.product.leftImageUrl)
            images.push({ url: item.product.leftImageUrl, label: "Left" });
          if (item.product.detailsImageUrl)
            images.push({
              url: item.product.detailsImageUrl,
              label: "Details",
            });
          if (item.product.defectImageUrl)
            images.push({ url: item.product.defectImageUrl, label: "Defect" });
          if (item.product.additionalImage1Url)
            images.push({
              url: item.product.additionalImage1Url,
              label: "Additional 1",
            });
          if (item.product.additionalImage2Url)
            images.push({
              url: item.product.additionalImage2Url,
              label: "Additional 2",
            });
          if (item.product.additionalImage3Url)
            images.push({
              url: item.product.additionalImage3Url,
              label: "Additional 3",
            });
          return images.length > 0 ? images : undefined;
        }
        return undefined;
      };

      // Always preserve existing form data when it exists
      // Handle both flat structure (productId at top level) and nested structure (product.productId)
      const updatedFormItems = items
        .map((item) => {
          // Get productId from flat structure or nested structure
          const productId = (item as any).productId || item.product?.productId;
          if (!productId) {
            // Safety check: if productId is missing from both, skip this item
            return null;
          }

          // Find existing form item by productId to preserve all form data
          const existingItem = currentFormItems.find(
            (fi: any) => fi?.productId === productId
          ) as any;

          // Extract totalAvailableStock from incoming item (it might be on the item itself, not nested)
          const stockFromItem = (item as any).totalAvailableStock;

          // If existing item found, preserve ALL its data (images, totals, allocations, etc.) and only update quantity/price
          if (existingItem) {
            // Always recalculate totals based on current quantity and price
            const calculatedSubtotal = item.quantity * item.pricePerUnit;
            // Try to preserve totalAvailableStock from incoming item or keep existing
            const stockFromExisting = (existingItem as any)
              ?.totalAvailableStock;
            // CRITICAL: Prefer incoming item's flat structure fields (from shipping confirmation)
            // These are set when handleShippingConfirm converts nested product to flat structure
            // Only fallback to existing or extract from nested if incoming doesn't have them
            const images =
              (item as any).images &&
              Array.isArray((item as any).images) &&
              (item as any).images.length > 0
                ? (item as any).images
                : (existingItem as any)?.images &&
                  Array.isArray((existingItem as any).images) &&
                  (existingItem as any).images.length > 0
                ? (existingItem as any).images
                : extractImages(item);
            // Extract metadata - prefer incoming item's flat fields (set by handleShippingConfirm)
            const brand =
              (item as any).brand ??
              item.product?.brand ??
              (existingItem as any)?.brand;
            const upc =
              (item as any).upc ??
              item.product?.upc ??
              (existingItem as any)?.upc;
            const model =
              (item as any).model ??
              item.product?.model ??
              (existingItem as any)?.model;
            const weightKgs =
              (item as any).weightKgs ??
              item.product?.weightKgs ??
              (existingItem as any)?.weightKgs;
            // Preserve discount fields
            const discount =
              (item as any).discount ??
              item.product?.discount ??
              (existingItem as any)?.discount ??
              0;
            const isDiscountPercent =
              (item as any).isDiscountPercent ??
              item.product?.isDiscountPercent ??
              (existingItem as any)?.isDiscountPercent ??
              false;

            // Preserve pickupAllocations from existing form item OR incoming item
            // IMPORTANT: When shipping is confirmed, allocations come from incoming items (converted from form items)
            // When shipping is reset, clear allocations
            const pickupAllocations = shouldResetShipping
              ? []
              : (item as any).pickupAllocations ||
                existingItem?.pickupAllocations ||
                [];

            return {
              ...existingItem,
              productId, // Ensure productId is always set
              productTitle:
                (item as any).productTitle ||
                item.product?.title ||
                existingItem?.productTitle ||
                "",
              quantity: item.quantity,
              pricePerUnit: item.pricePerUnit,
              // Always recalculate subtotal and grandTotal from current quantity and price
              subtotal: calculatedSubtotal,
              grandTotal: calculatedSubtotal,
              // Preserve allocations from existing form item (important for shipping confirmation)
              pickupAllocations,
              // Reset shipping-related fees when allocations are cleared (applies to ALL products)
              totalPackagingFee: shouldResetShipping
                ? 0
                : existingItem.totalPackagingFee || 0,
              totalShippingFee: shouldResetShipping
                ? 0
                : existingItem.totalShippingFee || 0,
              // Preserve totalAvailableStock (prefer incoming, fallback to existing)
              totalAvailableStock:
                stockFromItem !== undefined && stockFromItem !== null
                  ? stockFromItem
                  : stockFromExisting !== undefined &&
                    stockFromExisting !== null
                  ? stockFromExisting
                  : null,
              // Preserve product metadata (prefer incoming flat fields, then existing)
              images,
              brand,
              upc,
              model,
              weightKgs,
              discount,
              isDiscountPercent,
            };
          }
          // New item - create with calculated totals and ensure productId is set
          const calculatedGrandTotal = item.quantity * item.pricePerUnit;
          // Extract stock data from incoming item
          const stockData = (item as any).totalAvailableStock;

          // CRITICAL: Prefer incoming item's flat structure fields if they exist
          // These are set when handleShippingConfirm converts nested product to flat structure
          // Only fallback to extracting from nested structure if flat fields don't exist
          const images =
            (item as any).images &&
            Array.isArray((item as any).images) &&
            (item as any).images.length > 0
              ? (item as any).images
              : extractImages(item);
          // Extract metadata - prefer incoming item's flat fields
          const brand = (item as any).brand ?? item.product?.brand;
          const upc = (item as any).upc ?? item.product?.upc;
          const model = (item as any).model ?? item.product?.model;
          const weightKgs = (item as any).weightKgs ?? item.product?.weightKgs;
          const discount =
            (item as any).discount ?? item.product?.discount ?? 0;
          const isDiscountPercent =
            (item as any).isDiscountPercent ??
            item.product?.isDiscountPercent ??
            false;
          const productTitle =
            (item as any).productTitle || item.product?.title || "";
          // Preserve pickupAllocations from incoming item (might come from shipping confirmation)
          const pickupAllocations = shouldResetShipping
            ? []
            : (item as any).pickupAllocations || [];

          return {
            productId,
            productTitle,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            pickupAllocations,
            // Include product metadata from flat structure or nested product
            images,
            brand,
            upc,
            model,
            weightKgs,
            // Calculate initial totals
            subtotal: calculatedGrandTotal,
            grandTotal: calculatedGrandTotal,
            discount,
            isDiscountPercent,
            totalDiscount: (item as any).totalDiscount ?? 0,
            totalPackagingFee: shouldResetShipping
              ? 0
              : (item as any).totalPackagingFee || 0,
            totalShippingFee: shouldResetShipping
              ? 0
              : (item as any).totalShippingFee || 0,
            // Preserve totalAvailableStock from incoming item (from product picker)
            totalAvailableStock:
              stockData !== undefined && stockData !== null ? stockData : null,
          };
        })
        .filter(Boolean) as any;

      // Always update form to ensure parent state and form are in sync
      // The spread operator above ensures we preserve all existing data
      if (updatedFormItems.length > 0) {
        setValue("productItems", updatedFormItems, {
          shouldValidate: true,
          shouldDirty: true,
        });
      } else {
        setValue("productItems", [], {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    },
    [setValue, getValues]
  );

  // Handle shipping allocation changes
  // IMPORTANT: This matches the pattern used in FillTestDataButton.tsx
  // When shipping is confirmed, both deliveryFee and packagingFee should be set
  const handleShippingChange = useCallback(
    (
      allocations: ProductItemsSectionProps["shippingAllocations"],
      totalShipping: number
    ) => {
      setShippingAllocations(allocations);

      // Calculate total packaging cost from allocations (sum of all allocation packagingCost)
      // This matches FillTestDataButton which uses optimizationResponse.totalPackagingCost
      const totalPackagingCost = allocations.reduce((sum, alloc) => {
        return sum + (alloc.packagingCost || 0);
      }, 0);

      // Update delivery fee in form to include shipping cost
      // IMPORTANT: In edit mode, preserve existing deliveryFee from orderSummary if it's not 0
      // Only update if we're in add mode OR if totalShipping is non-zero (user is calculating shipping)
      const currentDeliveryFee = getValues("deliveryFee");
      const isEditModeWithExistingFee =
        purchaseOrderId && currentDeliveryFee > 0;

      if (!isEditModeWithExistingFee || totalShipping > 0) {
        // Update delivery fee: either we're in add mode, or fee is 0, or user is calculating shipping
        setValue("deliveryFee", totalShipping);
      }
      // Otherwise, preserve the existing deliveryFee from orderSummary (edit mode with saved fee)

      // Update packaging fee in form (same as FillTestDataButton does)
      // This ensures the form field is updated when shipping is confirmed
      if (totalPackagingCost > 0 || !purchaseOrderId) {
        // Set packaging fee: either we have a calculated cost, or we're in add mode (clear it)
        setValue("packagingFee", totalPackagingCost);
      }
    },
    [setValue, getValues, purchaseOrderId]
  );

  // Lazy fetch function for lead autocomplete
  const fetchLeadOptions: LazyFetchFunction = useCallback(
    async (searchText: string, start: number, pageSize: number) => {
      try {
        // Build filter if search text is provided
        const filters = searchText
          ? [
              {
                column: "firstName",
                operator: "contains",
                value: searchText,
              },
              {
                column: "lastName",
                operator: "contains",
                value: searchText,
              },
              {
                column: "email",
                operator: "contains",
                value: searchText,
              },
            ]
          : undefined;

        const response = await leadApi.getLeadsInBatches({
          start,
          end: start + pageSize,
          pageSize,
          includeDeleted: false,
          logicOperator: searchText ? "OR" : undefined,
          filters,
        });

        const leads = response.data as LeadResponseModel[];
        const totalCount = response.totalDataCount;

        // Map leads to LazyOption format: "firstName lastName (email)"
        const options: LazyOption[] = leads.map((lead) => ({
          value: lead.leadId,
          label: `${lead.firstName} ${lead.lastName} (${lead.email})`,
        }));

        return {
          options,
          hasMore: start + options.length < totalCount,
          totalCount,
        };
      } catch {
        return {
          options: [],
          hasMore: false,
          totalCount: 0,
        };
      }
    },
    []
  );

  // Fetch purchase order details for edit/view mode
  const fetchPurchaseOrderDetails = useCallback(async (): Promise<void> => {
    if (!purchaseOrderId || hasFetchedDetails.current) {
      return;
    }

    // Set flag to prevent handleProductItemsChange from clearing shipping allocations
    isLoadingFromApiRef.current = true;
    setLoading(true);
    hasFetchedDetails.current = true;

    try {
      const response = (await purchaseOrderApi.getPurchaseOrderById(
        parseInt(purchaseOrderId, 10)
      )) as PurchaseOrderResponseModel;

      // Store the full response for accessing payments and other data
      setPurchaseOrderResponse(response);

      // Set selected state for cities dropdown
      if (response.orderSummary?.address?.state) {
        setSelectedState(response.orderSummary.address.state);
      }

      // Fetch assigned lead details if assignedLeadId exists
      if (response.assignedLeadId) {
        try {
          const leadResponse = await leadApi.getLeadById(
            response.assignedLeadId
          );
          if (leadResponse) {
            setInitialLeadOption({
              value: leadResponse.leadId,
              label: `${leadResponse.firstName} ${leadResponse.lastName} (${leadResponse.email})`,
            });
          }
        } catch {
          // If lead fetch fails, just set the ID
          // Lead details fetch failed, continue without them
        }
      }

      // Populate form with existing data
      // Convert ISO string to DateTimeValue for expectedDeliveryDate
      const expectedDeliveryDateValue: DateTimeValue | string = response
        .orderSummary?.expectedDeliveryDate
        ? {
            dateTime: new Date(response.orderSummary.expectedDeliveryDate),
            timezone: "UTC",
          }
        : "";

      // Process attachments: convert list format to Record format for form component
      // attachments is now a list of ResourceResponseModel with key (fileName) and value (URL/base64)
      let processedAttachments: Record<string, string> = {};
      if (
        response.attachments &&
        Array.isArray(response.attachments) &&
        response.attachments.length > 0
      ) {
        // Convert attachments list to Record format (fileName -> URL or base64)
        // MultipleImageUploadInput can handle both URLs and base64
        processedAttachments = Object.fromEntries(
          response.attachments.map((att) => [att.key, att.value])
        );
      }

      /**
       * Extract images from nested product structure for form initialization
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

      // Helper function to extract products from shipments (aggregates products across all shipments)
      const extractProductsFromShipments = (
        shipments: typeof response.shipments
      ): PurchaseOrderProductItem[] => {
        if (!shipments || !Array.isArray(shipments) || shipments.length === 0) {
          return [];
        }

        const productMap = new Map<number, PurchaseOrderProductItem>();

        shipments.forEach((shipment) => {
          shipment.products?.forEach((productData) => {
            const productId = productData.productId;
            if (!productId || !productData.product) return;

            /**
             * IMPORTANT:
             * In edit mode we must use the saved per-order unit price from DB
             * (ShipmentProduct.allocatedPrice), NOT the current Product.price.
             *
             * Backend sends allocatedPrice as BigDecimal; depending on serialization it may
             * arrive as number or string, so normalize defensively.
             */
            const allocatedPriceRaw: unknown =
              (productData as any).allocatedPrice ??
              (productData as any).allocated_price;
            const allocatedPriceParsed =
              allocatedPriceRaw !== null && allocatedPriceRaw !== undefined
                ? parseFloat(String(allocatedPriceRaw))
                : NaN;
            const allocatedPrice = !Number.isNaN(allocatedPriceParsed)
              ? allocatedPriceParsed
              : undefined;

            if (productMap.has(productId)) {
              // Aggregate quantity and use latest price
              const existing = productMap.get(productId)!;
              existing.quantity =
                (existing.quantity || 0) + (productData.allocatedQuantity || 0);
              // Only overwrite if the API provided a valid allocatedPrice
              if (allocatedPrice !== undefined) {
                existing.pricePerUnit = allocatedPrice;
              }
            } else {
              // Create new product item
              productMap.set(productId, {
                product: productData.product,
                pricePerUnit: allocatedPrice ?? 0,
                quantity: productData.allocatedQuantity || 0,
              });
            }
          });
        });

        return Array.from(productMap.values());
      };

      // Extract products from shipments (replaces deprecated response.products field)
      const productsFromShipments = extractProductsFromShipments(
        response.shipments
      );

      // Calculate total packaging fee and shipping cost from shipments (for reference)
      // NOTE: orderSummary contains the authoritative totals, so we prefer those when available
      let totalPackagingFeeFromShipments = 0;
      let totalShippingCostFromShipments = 0;
      const hasShipments =
        response.shipments &&
        Array.isArray(response.shipments) &&
        response.shipments.length > 0;
      if (hasShipments) {
        totalPackagingFeeFromShipments = response.shipments.reduce(
          (sum, shipment) => {
            return sum + (shipment.packagingCost || 0);
          },
          0
        );
        totalShippingCostFromShipments = response.shipments.reduce(
          (sum, shipment) => {
            return sum + (shipment.shippingCost || 0);
          },
          0
        );
      }

      // IMPORTANT: Always prefer orderSummary values when available, as they are the authoritative source
      // Only fall back to shipment calculations if orderSummary values are missing/null/undefined
      // This ensures we use the actual saved totals, not calculated values that might be 0 or incorrect
      const orderSummaryPackagingFee = response.orderSummary?.packagingFee;
      const orderSummaryTotalShipping = response.orderSummary?.totalShipping;

      // Convert to numbers, handling both number and string types (BigDecimal from backend may be serialized as string)
      // Note: 0 is a valid value, so we only check for null/undefined, not falsy
      const finalPackagingFee =
        orderSummaryPackagingFee !== null &&
        orderSummaryPackagingFee !== undefined
          ? typeof orderSummaryPackagingFee === "number"
            ? orderSummaryPackagingFee
            : parseFloat(String(orderSummaryPackagingFee)) || 0
          : hasShipments && totalPackagingFeeFromShipments > 0
          ? totalPackagingFeeFromShipments
          : 0;

      const finalShippingCost =
        orderSummaryTotalShipping !== null &&
        orderSummaryTotalShipping !== undefined
          ? typeof orderSummaryTotalShipping === "number"
            ? orderSummaryTotalShipping
            : parseFloat(String(orderSummaryTotalShipping)) || 0
          : hasShipments && totalShippingCostFromShipments > 0
          ? totalShippingCostFromShipments
          : 0;

      // Prepare form data for reset
      const formDataToReset = {
        vendorNumber: response.vendorNumber ?? "",
        expectedDeliveryDate: expectedDeliveryDateValue,
        purchaseOrderStatus: response.purchaseOrderStatus ?? "DRAFT",
        priority: response.orderSummary?.priority ?? "MEDIUM",
        assignedLeadId: response.assignedLeadId ?? 0,
        termsConditionsHtml: response.orderSummary?.termsConditionsHtml ?? "",
        purchaseOrderReceipt: response.purchaseOrderReceipt ?? "",
        address: {
          streetAddress: response.orderSummary?.address?.streetAddress ?? "",
          streetAddress2: response.orderSummary?.address?.streetAddress2 ?? "",
          streetAddress3: response.orderSummary?.address?.streetAddress3 ?? "",
          city: response.orderSummary?.address?.city ?? "",
          state: response.orderSummary?.address?.state ?? "",
          postalCode: response.orderSummary?.address?.postalCode ?? "",
          country: response.orderSummary?.address?.country ?? "India",
          addressType: response.orderSummary?.address?.addressType ?? "OFFICE",
          nameOnAddress: response.orderSummary?.address?.nameOnAddress ?? "",
          emailOnAddress: response.orderSummary?.address?.emailOnAddress ?? "",
          phoneOnAddress: response.orderSummary?.address?.phoneOnAddress ?? "",
        },
        productItems: [], // Will be set after building allocations from shipments
        deliveryFee: finalShippingCost,
        serviceFee: response.orderSummary?.serviceFee ?? 0,
        packagingFee: finalPackagingFee,
        discount: response.orderSummary?.totalDiscount ?? 0,
        notes: response.orderSummary?.notes ?? "",
        attachments: processedAttachments,
      };

      // Call reset with prepared data
      reset(formDataToReset);

      // Convert shipments to shippingAllocations format (only if shipments exist)
      // IMPORTANT: This structure MUST match exactly what ProductItemsSection.handleShippingConfirm creates
      // Otherwise onSubmit will fail because it expects the create-mode structure
      let convertedShippingAllocations: ProductItemsSectionProps["shippingAllocations"] =
        [];
      try {
        convertedShippingAllocations = (response.shipments ?? []).map(
          (shipment) => {
            const pickupLocation = shipment.pickupLocation;

            // Parse courierMetadata JSON if available (contains the full CourierOption from when it was created)
            // This is the same structure as what comes from the shipping optimization API
            let courierOption: any = undefined;
            if (shipment.selectedCourierMetadata) {
              try {
                courierOption = JSON.parse(shipment.selectedCourierMetadata);
              } catch {
                // Continue without parsed metadata if JSON parsing fails
              }
            }

            // Build the selectedCourier in the EXACT same format as create mode
            // In create mode, selectedCourier comes directly from the optimization API (CourierOption)
            // We reconstruct it from the stored metadata to match that structure
            const reconstructedCourier = courierOption
              ? {
                  // Basic identification - match CourierOption interface
                  courierCompanyId:
                    courierOption.courierCompanyId ||
                    courierOption.courier_company_id ||
                    shipment.selectedCourierCompanyId,
                  id: courierOption.id,
                  courierName:
                    courierOption.courierName ||
                    courierOption.courier_name ||
                    shipment.selectedCourierName,
                  courierType:
                    courierOption.courierType ||
                    courierOption.courier_type ||
                    "0",
                  description: courierOption.description,

                  // Pricing
                  rate:
                    courierOption.rate ??
                    shipment.selectedCourierRate ??
                    0,
                  codCharges:
                    courierOption.codCharges ?? courierOption.cod_charges ?? 0,
                  freightCharge:
                    courierOption.freightCharge ??
                    courierOption.freight_charge ??
                    0,
                  rtoCharges:
                    courierOption.rtoCharges ?? courierOption.rto_charges,
                  coverageCharges:
                    courierOption.coverageCharges ??
                    courierOption.coverage_charges,
                  otherCharges:
                    courierOption.otherCharges ?? courierOption.other_charges,
                  cost: courierOption.cost,

                  // Delivery information
                  estimatedDeliveryDays: String(
                    courierOption.estimatedDeliveryDays ??
                      courierOption.estimated_delivery_days ??
                      ""
                  ),
                  etd: courierOption.etd ?? "",
                  etdHours: courierOption.etdHours ?? courierOption.etd_hours,
                  edd: courierOption.edd,

                  // Performance metrics
                  rating: courierOption.rating,
                  deliveryPerformance:
                    courierOption.deliveryPerformance ??
                    courierOption.delivery_performance,
                  pickupPerformance:
                    courierOption.pickupPerformance ??
                    courierOption.pickup_performance,
                  rtoPerformance:
                    courierOption.rtoPerformance ??
                    courierOption.rto_performance,
                  trackingPerformance:
                    courierOption.trackingPerformance ??
                    courierOption.tracking_performance,
                  rank: courierOption.rank,

                  // Location info
                  city: courierOption.city,
                  state: courierOption.state,
                  postcode: courierOption.postcode,
                  zone: courierOption.zone,

                  // Weight and dimensions
                  chargeWeight:
                    courierOption.chargeWeight ?? courierOption.charge_weight,
                  minWeight:
                    courierOption.minWeight ?? courierOption.min_weight,
                  baseWeight:
                    courierOption.baseWeight ?? courierOption.base_weight,
                  airMaxWeight:
                    courierOption.airMaxWeight ?? courierOption.air_max_weight,
                  surfaceMaxWeight:
                    courierOption.surfaceMaxWeight ??
                    courierOption.surface_max_weight,

                  // Service features
                  isSurface:
                    courierOption.isSurface ?? courierOption.is_surface,
                  isHyperlocal:
                    courierOption.isHyperlocal ?? courierOption.is_hyperlocal,
                  realtimeTracking:
                    courierOption.realtimeTracking ??
                    courierOption.realtime_tracking,
                  callBeforeDelivery:
                    courierOption.callBeforeDelivery ??
                    courierOption.call_before_delivery,
                  podAvailable:
                    courierOption.podAvailable ?? courierOption.pod_available,
                  isRtoAddressAvailable:
                    courierOption.isRtoAddressAvailable ??
                    courierOption.is_rto_address_available,
                  pickupAvailability:
                    courierOption.pickupAvailability ??
                    courierOption.pickup_availability,
                  cutoffTime:
                    courierOption.cutoffTime ?? courierOption.cutoff_time,
                  blocked: courierOption.blocked,
                  cod: courierOption.cod,
                }
              : {
                  // Fallback if no metadata - use what we have from the API response
                  courierCompanyId:
                    shipment.selectedCourierCompanyId || 0,
                  courierName: shipment.selectedCourierName || "Unknown",
                  courierType: "0",
                  rate: shipment.selectedCourierRate || 0,
                  estimatedDeliveryDays: "",
                  etd: "",
                };

            return {
              pickupLocationId: shipment.pickupLocationId,
              locationName:
                pickupLocation?.addressNickName || "Unknown Location",
              postalCode: pickupLocation?.address?.postalCode || "",
              totalWeightKgs: shipment.totalWeightKgs || 0,
              totalQuantity: shipment.totalQuantity || 0,
              productIds: (shipment.products ?? [])
                .map((sp) => sp.productId)
                .filter(Boolean) as number[],
              packagingCost: shipment.packagingCost || 0,
              packagesUsed: (shipment.packages ?? []).map((pkg) => ({
                packageInfo: pkg.packageInfo
                  ? {
                      packageId: pkg.packageInfo.packageId,
                      packageName:
                        pkg.packageInfo.packageName || "Unknown Package",
                      packageType: pkg.packageInfo.packageType || "Standard",
                      pricePerUnit: pkg.packageInfo.pricePerUnit,
                    }
                  : {
                      packageId: pkg.packageId,
                      packageName: "Unknown Package",
                      packageType: "Standard",
                    },
                quantityUsed: pkg.quantityUsed || 0,
                totalCost: pkg.totalCost || 0,
                productDetails: (pkg.products ?? []).map((prod) => ({
                  productId: prod.productId,
                  quantity: prod.quantity || 0,
                })),
              })),
              // Structure EXACTLY like ProductItemsSection.handleShippingConfirm
              selectedCourier: shipment.selectedCourierCompanyId
                ? {
                    courierCompanyId: reconstructedCourier.courierCompanyId,
                    courierName: reconstructedCourier.courierName,
                    courierType: reconstructedCourier.courierType,
                    rate: reconstructedCourier.rate,
                    estimatedDeliveryDays:
                      reconstructedCourier.estimatedDeliveryDays,
                    etd: reconstructedCourier.etd,
                    courierOption: reconstructedCourier, // Store full CourierOption for metadata (same as create mode)
                  }
                : undefined,
            };
          }
        );
      } catch {
        // Continue without shipments if conversion fails
        convertedShippingAllocations = [];
      }

      // NOTE: shippingAllocations will be set AFTER product items to avoid race conditions
      // The setShippingAllocations call is at the end of this function

      // Build pickupAllocations for each product from shipments
      const productAllocationsMap: Record<
        number,
        Array<{
          pickupLocationId: number;
          locationName: string;
          allocatedQuantity: number;
          availableStock?: number;
          addressType?: string;
          streetAddress?: string;
          streetAddress2?: string;
          streetAddress3?: string;
          city?: string;
          state?: string;
          postalCode?: string;
          country?: string;
          nameOnAddress?: string;
          emailOnAddress?: string;
          phoneOnAddress?: string;
          packagingEstimate?: Array<{
            packageId: number;
            packageName: string;
            packageType: string;
            quantityUsed: number;
            pricePerUnit: number;
            totalCost: number;
          }>;
          totalPackagingCost?: number;
        }>
      > = {};

      // Initialize map for all products (extracted from shipments)
      // Use productsFromShipments instead of deprecated response.products
      try {
        productsFromShipments.forEach((item) => {
          if (item && item.product?.productId) {
            productAllocationsMap[item.product.productId] = [];
          }
        });
      } catch {
        // Continue with empty map
      }

      // Populate allocations from shipments (only if shipments exist)
      try {
        (response.shipments ?? []).forEach((shipment) => {
          try {
            const pickupLocation = shipment.pickupLocation;

            // Safely access address - pickupLocation.address should be an AddressResponseModel object
            let pickupLocationAddress: any = undefined;
            if (pickupLocation) {
              if (
                pickupLocation.address &&
                typeof pickupLocation.address === "object"
              ) {
                pickupLocationAddress = pickupLocation.address;
              } else if (
                typeof pickupLocation === "object" &&
                "streetAddress" in pickupLocation
              ) {
                // If pickupLocation itself is the address object
                pickupLocationAddress = pickupLocation;
              }
            }

            // Parse courierMetadata JSON if available for product allocations
            let courierOptionForProduct: any = undefined;
            if (shipment.selectedCourierMetadata) {
              try {
                courierOptionForProduct = JSON.parse(
                  shipment.selectedCourierMetadata
                );
              } catch {
                // Continue without parsed metadata
              }
            }

            // Build courier info for this shipment (to be added to each product allocation)
            const courierInfo = shipment.selectedCourierCompanyId
              ? {
                  courierCompanyId: shipment.selectedCourierCompanyId,
                  courierName: shipment.selectedCourierName || "Unknown",
                  courierType: courierOptionForProduct?.mode || "Standard",
                  rate: shipment.selectedCourierRate || 0,
                  estimatedDeliveryDays:
                    courierOptionForProduct?.estimated_delivery_days
                      ? String(courierOptionForProduct.estimated_delivery_days)
                      : courierOptionForProduct?.etd
                      ? String(courierOptionForProduct.etd)
                      : undefined,
                  etd: shipment.expectedDeliveryDate
                    ? new Date(
                        shipment.expectedDeliveryDate
                      ).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : undefined,
                  courierOption: courierOptionForProduct
                    ? {
                        minWeight: courierOptionForProduct.min_weight,
                        codCharges: courierOptionForProduct.cod_charges,
                        mode: courierOptionForProduct.mode,
                        ...courierOptionForProduct,
                      }
                    : undefined,
                }
              : undefined;

            (shipment.products ?? []).forEach((sp) => {
              const productId = sp.productId;
              if (!productId) {
                return; // Skip if no productId
              }

              if (!productAllocationsMap[productId]) {
                productAllocationsMap[productId] = [];
              }

              // Build packaging estimate from packages
              const packagingEstimate = (shipment.packages ?? []).map(
                (pkg) => ({
                  packageId: pkg.packageInfo?.packageId || pkg.packageId,
                  packageName:
                    pkg.packageInfo?.packageName || "Unknown Package",
                  packageType: pkg.packageInfo?.packageType || "Standard",
                  quantityUsed: pkg.quantityUsed || 0,
                  pricePerUnit: pkg.packageInfo?.pricePerUnit || 0,
                  totalCost: pkg.totalCost || 0,
                })
              );

              const allocationData = {
                pickupLocationId: shipment.pickupLocationId,
                locationName:
                  pickupLocation?.addressNickName || "Unknown Location",
                allocatedQuantity: sp.allocatedQuantity || 0,
                addressType: pickupLocationAddress?.addressType,
                streetAddress: pickupLocationAddress?.streetAddress,
                streetAddress2: pickupLocationAddress?.streetAddress2,
                streetAddress3: pickupLocationAddress?.streetAddress3,
                city: pickupLocationAddress?.city,
                state: pickupLocationAddress?.state,
                postalCode: pickupLocationAddress?.postalCode,
                country: pickupLocationAddress?.country,
                nameOnAddress: pickupLocationAddress?.nameOnAddress,
                emailOnAddress: pickupLocationAddress?.emailOnAddress,
                phoneOnAddress: pickupLocationAddress?.phoneOnAddress,
                packagingEstimate,
                totalPackagingCost: shipment.packagingCost || 0,
                // Include courier info directly in the allocation
                selectedCourier: courierInfo,
                shippingCost: shipment.shippingCost || 0,
              };
              productAllocationsMap[productId].push(allocationData);
            });
          } catch {
            // Continue with next shipment if error
          }
        });
      } catch {
        // Continue without allocations if error
      }

      // Build productItems with allocations for form (extracted from shipments)
      // Use productsFromShipments instead of deprecated response.products
      const productItemsWithAllocations = productsFromShipments
        .filter((item) => item.product?.productId) // Filter out items without product
        .map((item) => {
          const calculatedTotal =
            (item.quantity || 0) * (item.pricePerUnit || 0);
          const productId = item.product!.productId;
          return {
            productId,
            productTitle: item.product!.title || "",
            quantity: item.quantity || 0,
            pricePerUnit: item.pricePerUnit || 0,
            pickupAllocations: productAllocationsMap[productId] || [],
            // Extract images from nested product structure
            images: extractImagesForForm(item.product!),
            // Extract metadata from nested product structure
            brand: item.product!.brand,
            upc: item.product!.upc,
            model: item.product!.model,
            weightKgs: item.product!.weightKgs,
            discount: item.product!.discount || 0,
            isDiscountPercent: item.product!.isDiscountPercent || false,
            totalDiscount: 0,
            subtotal: calculatedTotal,
            grandTotal: calculatedTotal,
            totalPackagingFee: 0,
            totalShippingFee: 0,
          };
        });

      // Update form with product items that have allocations
      // IMPORTANT: Set product items AFTER we've set deliveryFee and packagingFee in form reset
      // This ensures the fees are preserved even if handleProductItemsChange is triggered
      setValue("productItems", productItemsWithAllocations, {
        shouldValidate: true,
        shouldDirty: false,
      });

      // CRITICAL: Ensure deliveryFee and packagingFee are preserved after setting product items
      // The handleProductItemsChange callback might be triggered and try to clear deliveryFee
      // So we restore these values immediately after setting product items
      setTimeout(() => {
        const currentDeliveryFee = getValues("deliveryFee");
        const currentPackagingFee = getValues("packagingFee");
        if (currentDeliveryFee !== finalShippingCost) {
          setValue("deliveryFee", finalShippingCost, {
            shouldValidate: false,
            shouldDirty: false,
          });
        }
        if (currentPackagingFee !== finalPackagingFee) {
          setValue("packagingFee", finalPackagingFee, {
            shouldValidate: false,
            shouldDirty: false,
          });
        }
      }, 100);

      // Set product items state - convert from shipments (for ProductItemsSection)
      // Convert to nested format expected by ProductItemsSection
      try {
        // Use productsFromShipments instead of deprecated response.products
        const productItemsForState: PurchaseOrderProductItem[] =
          productsFromShipments
            .filter((item) => item.product?.productId) // Filter out items without product
            .map(
              (item) =>
                ({
                  product: item.product!,
                  pricePerUnit: item.pricePerUnit || 0,
                  quantity: item.quantity || 0,
                  // Preserve pickupAllocations by adding them to the item
                  pickupAllocations:
                    productAllocationsMap[item.product!.productId] || [],
                } as any)
            );
        setProductItems(productItemsForState);
      } catch {
        // Continue even if this fails
      }

      // Set shipping allocations state AFTER product items to avoid race conditions
      // This ensures that handleProductItemsChange doesn't clear the allocations
      setShippingAllocations(convertedShippingAllocations);

      // Store metadata fields that aren't in the form
      setPurchaseOrderMetaData({
        isDeleted: response.isDeleted ?? false,
        approvedByUserId: response.approvedByUser?.userId,
        approvedDate: response.approvedDate,
        rejectedByUserId: response.rejectedByUser?.userId,
        rejectedDate: response.rejectedDate,
        promoId: response.orderSummary?.promoId,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error(`Failed to fetch purchase order details: ${errorMessage}`);
      navigate(APP_ROUTES.DASHBOARD.PURCHASE_ORDERS, { replace: true });
    } finally {
      setLoading(false);
      // Reset the flag after a short delay to ensure all state updates have completed
      // This allows handleProductItemsChange to function normally for user edits
      setTimeout(() => {
        isLoadingFromApiRef.current = false;
      }, 500);
    }
  }, [purchaseOrderId, reset, navigate, setValue]);

  // Fetch purchase order details on mount (edit/view mode)
  useEffect(() => {
    if (purchaseOrderId && !hasFetchedDetails.current) {
      void fetchPurchaseOrderDetails();
    }
  }, [purchaseOrderId, fetchPurchaseOrderDetails]);

  // Form submit handler - use a ref to access latest shippingAllocations to avoid stale closure
  const shippingAllocationsRef = useRef(shippingAllocations);
  useEffect(() => {
    shippingAllocationsRef.current = shippingAllocations;
  }, [shippingAllocations]);

  // Prevent duplicate submissions using a ref (faster than state, prevents race conditions)
  const isSubmittingRef = useRef(false);

  const onSubmit = useCallback(
    async (data: PurchaseOrderFormData): Promise<void> => {
      // Prevent duplicate submissions (handles React StrictMode double renders and double-clicks)
      if (isSubmittingRef.current || loading) {
        return;
      }

      isSubmittingRef.current = true;
      setLoading(true);

      try {
        // Get current shipping allocations from ref (always latest value, avoids stale closure)
        const currentShippingAllocations = shippingAllocationsRef.current;

        // Validate that shipping has been calculated (required for shipments)
        // Check both shippingAllocations state and product pickupAllocations as fallback
        const hasShippingAllocations =
          currentShippingAllocations && currentShippingAllocations.length > 0;
        const hasProductAllocations = data.productItems.some(
          (item) => item.pickupAllocations && item.pickupAllocations.length > 0
        );

        if (!hasShippingAllocations) {
          if (hasProductAllocations) {
            // Products have allocations but shippingAllocations state is empty
            // This can happen if state was cleared (e.g., by address change or re-render)
            toast.error(
              "Shipping allocations state is empty. Please recalculate shipping and select couriers before submitting."
            );
            setLoading(false);
            isSubmittingRef.current = false; // Reset on validation error
            return;
          } else {
            // No allocations at all
            toast.error(
              'Please calculate shipping before submitting. Click "Calculate Shipping" in the Products section.'
            );
            setLoading(false);
            isSubmittingRef.current = false; // Reset on validation error
            return;
          }
        }

        // Validate that all shipping allocations have selected couriers
        const allocationsWithoutCourier = currentShippingAllocations.filter(
          (alloc) => !alloc.selectedCourier
        );
        if (allocationsWithoutCourier.length > 0) {
          toast.error(
            "Please select a courier for all shipping allocations before submitting."
          );
          setLoading(false);
          isSubmittingRef.current = false; // Reset on validation error
          return;
        }

        // Convert DateTimeValue to ISO string for expectedDeliveryDate
        const expectedDeliveryDateString =
          data.expectedDeliveryDate &&
          typeof data.expectedDeliveryDate === "object" &&
          "dateTime" in data.expectedDeliveryDate
            ? data.expectedDeliveryDate.dateTime?.toISOString()
            : (data.expectedDeliveryDate as string) || undefined;

        // Calculate products subtotal from product items (before discount)
        const productsSubtotal = data.productItems.reduce((sum, item) => {
          // Use quantity * pricePerUnit (before discount)
          const itemTotal = (item.quantity || 0) * (item.pricePerUnit || 0);
          return sum + itemTotal;
        }, 0);

        // Get fees and discount from form
        const packagingFee = data.packagingFee || 0;

        // Calculate totalShipping from actual courier rates in shipments (not from form fields)
        // This ensures we use the actual courier costs, not potentially stale form values
        // IMPORTANT: Always use courier rates from shipments, never form fields
        const totalShippingFromCouriers = currentShippingAllocations.reduce(
          (sum, alloc) => {
            const courierRate = alloc.selectedCourier?.rate || 0;
            return sum + courierRate;
          },
          0
        );

        // Always use courier-based total (should always be > 0 if shipping was calculated)
        // IMPORTANT: Courier rates are the actual shipping cost
        const totalShippingFromCouriersOnly =
          totalShippingFromCouriers > 0
            ? totalShippingFromCouriers
            : data.deliveryFee || 0;

        // Get service fee from form (user input, defaults to 0)
        // Ensure it's a number and not null/undefined
        const serviceFee =
          typeof data.serviceFee === "number"
            ? data.serviceFee
            : parseFloat(String(data.serviceFee || 0)) || 0;

        // Send serviceFee separately to backend (not added to totalShipping)
        const totalShipping = totalShippingFromCouriersOnly;

        const totalDiscount = data.discount || 0;

        // Calculate subtotal (backend will recalculate, but we need to provide for validation)
        // Subtotal = Products (after discount) + Packaging + Shipping + Service Fee
        const subtotal =
          productsSubtotal -
          totalDiscount +
          packagingFee +
          totalShipping +
          serviceFee;

        // Calculate GST (18% of subtotal)
        const gstPercentage = 18.0;
        const gstAmount = subtotal * (gstPercentage / 100);

        // Calculate grand total: subtotal + GST
        const grandTotal = subtotal + gstAmount;

        // Build OrderSummary object (required by backend)
        // Note: Backend recalculates subtotal, gstAmount, and grandTotal, but they're marked as required in the model
        const orderSummary = {
          productsSubtotal,
          totalDiscount,
          packagingFee,
          totalShipping,
          serviceFee: serviceFee, // Always send serviceFee (even if 0) - backend expects this field
          gstPercentage,
          gstAmount, // Required field (backend will recalculate)
          grandTotal, // Required field (backend will recalculate)
          pendingAmount: grandTotal, // Initially, nothing is paid
          expectedDeliveryDate: expectedDeliveryDateString || undefined,
          address: {
            streetAddress: data.address.streetAddress.trim(),
            streetAddress2: data.address.streetAddress2?.trim() || undefined,
            streetAddress3: data.address.streetAddress3?.trim() || undefined,
            city: data.address.city.trim(),
            state: data.address.state.trim(),
            postalCode: data.address.postalCode.trim(),
            country: data.address.country.trim(),
            addressType: data.address.addressType.trim(),
            nameOnAddress: data.address.nameOnAddress?.trim() || undefined,
            emailOnAddress: data.address.emailOnAddress?.trim() || undefined,
            phoneOnAddress: data.address.phoneOnAddress?.trim() || undefined,
          },
          priority: data.priority,
          promoId: purchaseOrderMetaData.promoId, // Include promoId if available
          termsConditionsHtml: data.termsConditionsHtml?.trim() || undefined,
          notes: data.notes?.trim() || undefined,
        };

        // Convert product items to the format expected by backend
        const products = data.productItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
        }));

        // Process attachments: convert URLs to base64, extract base64 from data URLs
        const currentAttachments =
          getValues("attachments") || data.attachments || {};
        let processedAttachments: Record<string, string> | undefined =
          undefined;

        if (currentAttachments && Object.keys(currentAttachments).length > 0) {
          processedAttachments = {};

          // Process attachments in parallel
          await Promise.all(
            Object.entries(currentAttachments).map(
              async ([fileName, value]) => {
                // Only process if it's a string and not empty
                if (
                  value &&
                  typeof value === "string" &&
                  value.trim().length > 0
                ) {
                  if (value.startsWith("http")) {
                    // URL - convert to base64 using helper function
                    const base64 = await convertImageUrlToBase64(value);
                    if (base64) {
                      processedAttachments![fileName] = base64;
                    }
                  } else if (value.startsWith("data:")) {
                    // Data URL - extract base64 part
                    const base64Part = value.split(",")[1];
                    if (base64Part) {
                      processedAttachments![fileName] = base64Part;
                    }
                  } else {
                    // Pure base64 (already extracted) - send as-is
                    processedAttachments![fileName] = value;
                  }
                }
              }
            )
          );

          // Only include if we have valid attachments
          if (Object.keys(processedAttachments).length === 0) {
            processedAttachments = undefined;
          }
        }

        const requestModel = {
          purchaseOrderId:
            isEdit && purchaseOrderId
              ? parseInt(purchaseOrderId, 10)
              : undefined,
          vendorNumber: data.vendorNumber.trim(),
          isDeleted: purchaseOrderMetaData.isDeleted ?? false, // Include isDeleted field
          purchaseOrderReceipt: data.purchaseOrderReceipt?.trim() || undefined,
          purchaseOrderStatus: data.purchaseOrderStatus,
          approvedByUserId: purchaseOrderMetaData.approvedByUserId, // Include if available (for updates)
          approvedDate: purchaseOrderMetaData.approvedDate, // Include if available (for updates)
          rejectedByUserId: purchaseOrderMetaData.rejectedByUserId, // Include if available (for updates)
          rejectedDate: purchaseOrderMetaData.rejectedDate, // Include if available (for updates)
          assignedLeadId: data.assignedLeadId,
          products, // Backend expects 'products' field
          orderSummary,
          shipments: currentShippingAllocations.map((alloc) => {
            // Use packaging cost from optimization result
            const packagingCost = alloc.packagingCost || 0;
            const shippingCost = alloc.selectedCourier?.rate || 0;
            const totalCost = packagingCost + shippingCost;

            // Convert packagesUsed to ShipmentPackageData format
            // Backend requires: Each shipment must have at least one package
            // Each package must have at least one product
            // IMPORTANT: packageId must be a valid ID from the Package table (foreign key constraint)

            if (!alloc.packagesUsed || alloc.packagesUsed.length === 0) {
              throw new Error(
                `Shipment for location ${alloc.locationName} has no packages. Please recalculate shipping.`
              );
            }

            // Group packages by packageId to avoid duplicate entry constraint violation
            // Backend has unique constraint on (shipmentId, packageId), so we need one entry per packageId
            const packagesMap = new Map<
              number,
              {
                packageId: number;
                quantityUsed: number;
                totalCost: number;
                products: Array<{ productId: number; quantity: number }>;
              }
            >();

            for (const pkg of alloc.packagesUsed) {
              // Validate packageId exists and is valid (must be > 0 and exist in Package table)
              if (
                !pkg.packageInfo?.packageId ||
                pkg.packageInfo.packageId <= 0
              ) {
                throw new Error(
                  `Invalid packageId for package ${
                    pkg.packageInfo?.packageName || "unknown"
                  }. Package ID must be a valid ID from the Package table.`
                );
              }

              const packageId = pkg.packageInfo.packageId;

              // Ensure productDetails exists and has at least one product
              let packageProducts: Array<{
                productId: number;
                quantity: number;
              }> = [];

              if (pkg.productDetails && pkg.productDetails.length > 0) {
                // Use productDetails from package (preferred - comes from optimization API)
                packageProducts = pkg.productDetails.map((prod) => ({
                  productId: prod.productId,
                  quantity: prod.quantity,
                }));
              } else {
                // Fallback: if no productDetails, use products from this allocation
                // This can happen if the API doesn't provide productDetails
                packageProducts = data.productItems
                  .filter((item) => alloc.productIds.includes(item.productId))
                  .map((item) => {
                    // Find allocation for this product at this location
                    const productAlloc = item.pickupAllocations?.find(
                      (allocItem) =>
                        allocItem.pickupLocationId === alloc.pickupLocationId
                    );
                    return {
                      productId: item.productId,
                      quantity:
                        productAlloc?.allocatedQuantity || item.quantity,
                    };
                  });
              }

              // Backend requires at least one product per package
              if (packageProducts.length === 0) {
                throw new Error(
                  `Package ${
                    pkg.packageInfo?.packageName || packageId
                  } has no products`
                );
              }

              // Check if we already have this packageId in the map
              if (packagesMap.has(packageId)) {
                // Merge: add quantities and costs, combine products
                const existing = packagesMap.get(packageId)!;
                existing.quantityUsed += pkg.quantityUsed;
                existing.totalCost += pkg.totalCost;

                // Merge products: combine quantities for same productId
                const productMap = new Map<number, number>();
                // Add existing products
                existing.products.forEach((p) => {
                  productMap.set(
                    p.productId,
                    (productMap.get(p.productId) || 0) + p.quantity
                  );
                });
                // Add new products
                packageProducts.forEach((p) => {
                  productMap.set(
                    p.productId,
                    (productMap.get(p.productId) || 0) + p.quantity
                  );
                });
                // Convert back to array
                existing.products = Array.from(productMap.entries()).map(
                  ([productId, quantity]) => ({
                    productId,
                    quantity,
                  })
                );
              } else {
                // First occurrence of this packageId
                packagesMap.set(packageId, {
                  packageId,
                  quantityUsed: pkg.quantityUsed,
                  totalCost: pkg.totalCost,
                  products: packageProducts,
                });
              }
            }

            // Convert map to array
            const packages: ShipmentPackageData[] = Array.from(
              packagesMap.values()
            );

            // Backend requires at least one package per shipment
            if (packages.length === 0) {
              throw new Error(
                `Shipment for location ${alloc.locationName} has no packages. Please recalculate shipping.`
              );
            }

            // Validate each package has at least one product and valid packageId
            packages.forEach((pkg, index) => {
              if (!pkg.products || pkg.products.length === 0) {
                throw new Error(
                  `Package at index ${index} for location ${alloc.locationName} has no products`
                );
              }
              if (!pkg.packageId || pkg.packageId <= 0) {
                throw new Error(
                  `Package at index ${index} for location ${alloc.locationName} has invalid packageId: ${pkg.packageId}`
                );
              }
            });

            // Convert courier option to JSON string for metadata
            // First try courierOption, then fallback to stringifying the whole selectedCourier object
            // (excludes the nested courierOption to avoid circular reference)
            let courierMetadata: string | undefined = undefined;
            if (alloc.selectedCourier?.courierOption) {
              courierMetadata = JSON.stringify(
                alloc.selectedCourier.courierOption
              );
            } else if (alloc.selectedCourier) {
              // Fallback: Build a metadata object from available selectedCourier fields
              // This handles cases where courierOption wasn't stored (legacy data)
              const fallbackMetadata = {
                courier_company_id: alloc.selectedCourier.courierCompanyId,
                courier_name: alloc.selectedCourier.courierName,
                rate: alloc.selectedCourier.rate,
                courier_type: alloc.selectedCourier.courierType,
                estimated_delivery_days:
                  alloc.selectedCourier.estimatedDeliveryDays,
                etd: alloc.selectedCourier.etd,
              };
              courierMetadata = JSON.stringify(fallbackMetadata);
            }
            // Extract minWeight from courierOption or fallback to 0
            const courierMinWeight =
              alloc.selectedCourier?.courierOption?.minWeight ??
              alloc.selectedCourier?.courierOption?.min_weight ??
              0;

            // Calculate expectedDeliveryDate (required)
            const expectedDeliveryDate = (() => {
              // Try to use EDD (Expected Delivery Date) from courier option if available
              if (alloc.selectedCourier?.courierOption?.edd) {
                return new Date(
                  alloc.selectedCourier.courierOption.edd
                ).toISOString();
              }
              // Try etd (estimated delivery date string) if available
              if (alloc.selectedCourier?.etd) {
                try {
                  return new Date(alloc.selectedCourier.etd).toISOString();
                } catch {
                  // Ignore parse error
                }
              }
              // Try estimatedDeliveryDays to calculate date
              if (alloc.selectedCourier?.estimatedDeliveryDays) {
                const days = parseInt(
                  String(alloc.selectedCourier.estimatedDeliveryDays),
                  10
                );
                if (!isNaN(days)) {
                  const date = new Date();
                  date.setDate(date.getDate() + days);
                  return date.toISOString();
                }
              }
              // Fallback to orderSummary expectedDeliveryDate if available
              if (expectedDeliveryDateString) {
                return expectedDeliveryDateString;
              }
              // Final fallback: 7 days from now
              const fallbackDate = new Date();
              fallbackDate.setDate(fallbackDate.getDate() + 7);
              return fallbackDate.toISOString();
            })();

            // Ensure courierMetadata is never undefined (required field)
            const finalCourierMetadata =
              courierMetadata ||
              JSON.stringify({
                courier_company_id: alloc.selectedCourier?.courierCompanyId,
                courier_name: alloc.selectedCourier?.courierName,
                rate: alloc.selectedCourier?.rate,
              });

            return {
              pickupLocationId: alloc.pickupLocationId,
              totalWeightKgs: alloc.totalWeightKgs,
              totalQuantity: alloc.totalQuantity,
              packagingCost,
              shippingCost,
              totalCost, // Required: packagingCost + shippingCost
              expectedDeliveryDate, // Required
              selectedCourier: alloc.selectedCourier
                ? {
                    courierCompanyId: alloc.selectedCourier.courierCompanyId,
                    courierName: alloc.selectedCourier.courierName,
                    courierRate: alloc.selectedCourier.rate,
                    courierMinWeight, // Required: courier minimum weight
                    courierMetadata: finalCourierMetadata, // Required: Full CourierOption JSON as string
                  }
                : undefined,
              products: data.productItems
                .filter((item) => alloc.productIds.includes(item.productId))
                .map((item) => {
                  // Find the actual allocated quantity for this product from this pickup location
                  const allocation = item.pickupAllocations?.find(
                    (allocItem) =>
                      allocItem.pickupLocationId === alloc.pickupLocationId
                  );
                  const allocatedQuantity =
                    allocation?.allocatedQuantity || item.quantity;

                  return {
                    productId: item.productId,
                    allocatedQuantity, // Use actual allocation from pickupAllocations if available
                    allocatedPrice: item.pricePerUnit,
                  };
                }),
              packages, // Packages from optimization result
            };
          }),
          // Attachments: all converted to base64 format (URLs converted, data URLs extracted, pure base64 as-is)
          // Backend expects: Map<String, String> where key is fileName and value is base64 data
          attachments: processedAttachments,
        } as any as PurchaseOrderRequestModel;

        if (isEdit && purchaseOrderId) {
          await purchaseOrderApi.updatePurchaseOrder(requestModel);
          toast.success("Purchase order updated successfully");
        } else {
          await purchaseOrderApi.createPurchaseOrder(requestModel);
          toast.success("Purchase order created successfully");
        }

        navigate(APP_ROUTES.DASHBOARD.PURCHASE_ORDERS);
      } catch {
        toast.error(`Failed to ${isEdit ? "update" : "create"} purchase order`);
        isSubmittingRef.current = false; // Reset on error so user can retry
      } finally {
        setLoading(false);
        // Note: Don't reset isSubmittingRef on success since we're navigating away
        // Reset it on error so user can retry
      }
    },
    [
      isEdit,
      purchaseOrderId,
      navigate,
      shippingAllocations,
      purchaseOrderMetaData,
    ]
  );

  // Cancel handler
  const handleCancel = (): void => {
    navigate(APP_ROUTES.DASHBOARD.PURCHASE_ORDERS);
  };

  // Button text based on mode
  const buttonText = useMemo(() => {
    if (loading) return "Saving...";
    if (isEdit) return "Update Purchase Order";
    return "Create Purchase Order";
  }, [loading, isEdit]);

  // ============================================================================
  // Section Configurations
  // ============================================================================

  // Purchase Order Information section
  const basicInfoSections = useMemo<
    Array<SectionConfig<PurchaseOrderFormData>>
  >(
    () => [
      {
        title: "Purchase Order Information",
        fields: [
          {
            name: "vendorNumber",
            label: "Vendor Number",
            type: FieldType.Text,
            required: true,
            gridSize: { xs: 12, sm: 6 },
            placeholder: "Enter vendor number",
          },
          {
            name: "expectedDeliveryDate",
            label: "Expected Delivery Date",
            type: FieldType.DateTime,
            required: false,
            gridSize: { xs: 12, sm: 6 },
            hideTimezone: true,
            // Block past dates - only allow today or future dates
            minDateTime: (() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return today;
            })(),
          },
          {
            name: "purchaseOrderStatus",
            label: "Status",
            type: FieldType.Select,
            required: true,
            gridSize: { xs: 12, sm: 6 },
            options: [...PURCHASE_ORDER_STATUS_OPTIONS],
          },
          {
            name: "priority",
            label: "Priority",
            type: FieldType.Select,
            required: true,
            gridSize: { xs: 12, sm: 6 },
            options: [...PRIORITY_OPTIONS],
          },
          {
            name: "assignedLeadId",
            label: "Assigned Lead",
            type: FieldType.LazyAutocomplete,
            required: true,
            gridSize: { xs: 12, sm: 6 },
            placeholder: "Search for a lead...",
            fetchOptions: fetchLeadOptions,
            initialOption: initialLeadOption,
          },
          {
            name: "termsConditionsHtml",
            label: "Terms & Conditions",
            type: FieldType.RichText,
            required: false,
            gridSize: { xs: 12, sm: 12 },
            placeholder: "Enter terms and conditions...",
          },
        ],
      },
    ],
    [fetchLeadOptions, initialLeadOption]
  );

  // Notes section
  const notesSections = useMemo<Array<SectionConfig<PurchaseOrderFormData>>>(
    () => [
      {
        title: "Notes",
        fields: [
          {
            name: "notes",
            label: "Notes",
            type: FieldType.Textarea,
            required: false,
            gridSize: { xs: 12, sm: 12 },
            rows: 3,
            placeholder:
              "Any additional notes about this purchase order (optional)",
          },
        ],
      },
    ],
    []
  );

  return (
    <Container
      maxWidth={false}
      disableGutters
      className={styles["purchase-orders-page"]}
    >
      <form
        onSubmit={handleFormSubmit(onSubmit, (validationErrors) => {
          // Log validation errors when form submission fails
          console.error("Form validation errors:", validationErrors);
          const errorFields = Object.keys(validationErrors).join(", ");
          toast.error(`Please fix the following fields: ${errorFields}`);
        })}
      >
        <Box className={styles["add-purchase-order-page__container"]}>
          {/* Basic Information Section */}
          <FormFieldRenderer
            sections={basicInfoSections}
            control={control}
            errors={errors}
            disabled={loading || isView}
            isView={isView}
            sectionClassName={styles["add-purchase-order-page__section"]}
            sectionTitleClassName={
              styles["add-purchase-order-page__section-title"]
            }
            dividerClassName={styles["add-purchase-order-page__divider"]}
          />

          {/* Delivery Address Section */}
          <Paper className={styles["add-purchase-order-page__section"]}>
            <Subheader
              label="Delivery Address"
              className={styles["add-purchase-order-page__section-title"]}
            />
            <Divider className={styles["add-purchase-order-page__divider"]} />
            <Grid container spacing={2}>
              <AddressFormController
                control={control}
                errors={errors}
                disabled={loading || isView}
                states={states}
                cities={cities}
                onStateChange={handleStateChange}
                setValue={setValue}
                trigger={trigger}
              />
            </Grid>
          </Paper>

          {/* Product Items Section (includes Calculate Shipping button) */}
          {/* Pass form data (watchedProductItems) which has full data including images and totals */}
          {/* Fallback to productItems state if form data is not available yet */}
          <ProductItemsSection
            productItems={
              (watchedProductItems.length > 0
                ? watchedProductItems
                : productItems) as any
            }
            onProductItemsChange={handleProductItemsChange}
            isView={isView}
            disabled={loading}
            deliveryAddress={deliveryAddress}
            shippingAllocations={shippingAllocations as any}
            onShippingChange={handleShippingChange}
            packagingFee={watchedPackagingFee}
            totalShippingCost={
              watchedDeliveryFee !== undefined && watchedDeliveryFee !== null
                ? watchedDeliveryFee
                : undefined
            }
            serviceFee={watch("serviceFee") || 0}
            onServiceFeeChange={(fee) =>
              setValue("serviceFee", fee, { shouldValidate: true })
            }
          />

          {/* Notes Section */}
          <FormFieldRenderer
            sections={notesSections}
            control={control}
            errors={errors}
            disabled={loading || isView}
            isView={isView}
            sectionClassName={styles["add-purchase-order-page__section"]}
            sectionTitleClassName={
              styles["add-purchase-order-page__section-title"]
            }
            dividerClassName={styles["add-purchase-order-page__divider"]}
          />

          {/* Attachments Section */}
          <Paper className={styles["add-purchase-order-page__section"]}>
            <Subheader
              label="Attachments"
              className={styles["add-purchase-order-page__section-title"]}
            />
            <Divider className={styles["add-purchase-order-page__divider"]} />
            <Box
              className={
                styles["add-purchase-order-page__attachments-container"]
              }
            >
              <MultipleImageUploadInput
                value={watch("attachments") || {}}
                onChange={(attachments) => {
                  setValue("attachments", attachments, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                }}
                disabled={loading || isView}
                maxFiles={30}
                maxSizeMB={5}
                accept="image/*"
                label="Upload Images"
              />
              {errors.attachments && (
                <SecondaryFont
                  variant="caption"
                  className={
                    styles["add-purchase-order-page__attachments-error"]
                  }
                >
                  {typeof errors.attachments.message === "string"
                    ? errors.attachments.message
                    : "Invalid attachments"}
                </SecondaryFont>
              )}
            </Box>
          </Paper>

          {/* Payments Section - Only show in view mode */}
          {isView && purchaseOrderResponse && (
            <Paper className={styles["add-purchase-order-page__section"]}>
              <Subheader
                label="Payment History"
                className={styles["add-purchase-order-page__section-title"]}
              />
              <Divider className={styles["add-purchase-order-page__divider"]} />
              <Box sx={{ mt: 2, padding: '16px' }}>
                <PaymentsTable payments={purchaseOrderResponse.payments || []} />
              </Box>
            </Paper>
          )}

          {/* Action Buttons */}
          {!isView && (
            <Paper className={styles["add-purchase-order-page__section"]}>
              <Box className={styles["add-purchase-order-page__actions"]}>
                <RedButton
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={loading}
                  className={styles["add-purchase-order-page__action-button"]}
                  type="button"
                  label="Cancel"
                />
                <BlueButton
                  variant="contained"
                  startIcon={<SaveIcon />}
                  type="submit"
                  disabled={loading}
                  className={styles["add-purchase-order-page__action-button"]}
                  label={buttonText}
                />
              </Box>
            </Paper>
          )}
        </Box>
      </form>

      {/* Fill Test Data Button - Only show in add/edit mode */}
      {!isView && (
        <FillTestDataButton
          setValue={setValue}
          reset={reset}
          isEditMode={isEdit}
          currentVendorNumber={formMethods.watch("vendorNumber")}
          onStateChange={handleStateChange}
          onProductItemsChange={handleProductItemsChange}
          onInitialLeadOptionChange={setInitialLeadOption}
          getValues={formMethods.getValues}
          deliveryAddress={deliveryAddress}
          onShippingChange={handleShippingChange}
        />
      )}
    </Container>
  );
};

export default AddEditPurchaseOrder;
