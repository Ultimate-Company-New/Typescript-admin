import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Cancel as CancelIcon, Save as SaveIcon } from '@mui/icons-material'
import { Box, Container, Divider, Grid, Paper } from '@mui/material'

import { leadApi } from '../../api/leadApi'
import { purchaseOrderApi } from '../../api/purchaseOrderApi'
import { BlueButton, RedButton } from '../../components/buttons'
import { SecondaryFont, Subheader } from '../../components/fonts'
import {
  AddressFormController,
  FieldType,
  FormFieldRenderer,
  type LazyFetchFunction,
  type LazyOption,
  type SectionConfig,
} from '../../components/form'
import {
  PERMISSIONS,
  PRIORITY_OPTIONS,
  PURCHASE_ORDER_STATUS_OPTIONS,
} from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import { usePermissions } from '../../hooks/usePermissions'
import { type ProductItemsSectionProps } from '../../models'
import {
  type LeadResponseModel,
  type PurchaseOrderFormData,
  type PurchaseOrderProductItem,
  type PurchaseOrderRequestModel,
  type PurchaseOrderResponseModel,
} from '../../models/api-models'
import styles from '../../styles/PurchaseOrders.module.scss'
import { getAllStates, getCitiesByState } from '../../utils/stateCityMapper'
import { purchaseOrderFormSchema } from '../../utils/validationSchemas'

import { MultipleImageUploadInput } from '../../components/form-input'
import { FillTestDataButton, ProductItemsSection } from './components'

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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const purchaseOrderId = searchParams.get('purchaseOrderId')
  const isView = searchParams.has('isView')
  const isEdit = !!purchaseOrderId && !isView

  const [loading, setLoading] = useState(false)
  const [selectedState, setSelectedState] = useState<string>('')
  const [initialLeadOption, setInitialLeadOption] = useState<LazyOption | undefined>(undefined)
  const [productItems, setProductItems] = useState<PurchaseOrderProductItem[]>([])
  const [shippingAllocations, setShippingAllocations] = useState<ProductItemsSectionProps['shippingAllocations']>([])
  // Track if initial address has been set (to avoid clearing products on initial load)
  const initialAddressSet = useRef(false)

  // Get user permissions for authorization
  const { hasPermission } = usePermissions()

  // Use ref to track if permission check has been performed
  const hasCheckedPermissions = useRef(false)
  const hasFetchedDetails = useRef(false)

  // Check permissions on mount and redirect if unauthorized
  useEffect(() => {
    if (hasCheckedPermissions.current) {
      return
    }

    let requiredPermission: string | null = null

    if (isView) {
      requiredPermission = PERMISSIONS.VIEW_PURCHASE_ORDERS
    } else if (isEdit) {
      requiredPermission = PERMISSIONS.UPDATE_PURCHASE_ORDERS
    } else {
      requiredPermission = PERMISSIONS.INSERT_PURCHASE_ORDERS
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      hasCheckedPermissions.current = true
      toast.error('You do not have permission to access this page')
      navigate(APP_ROUTES.DASHBOARD.PURCHASE_ORDERS, { replace: true })
    } else if (requiredPermission) {
      hasCheckedPermissions.current = true
    }
  }, [hasPermission, isView, isEdit, navigate])

  // Form setup with react-hook-form and Zod validation
  const formMethods = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderFormSchema),
    defaultValues: {
      vendorNumber: '',
      expectedDeliveryDate: '',
      purchaseOrderStatus: 'DRAFT',
      priority: 'MEDIUM',
      assignedLeadId: 0,
      termsConditionsHtml: '',
      purchaseOrderReceipt: '',
      address: {
        streetAddress: '',
        streetAddress2: '',
        streetAddress3: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        addressType: 'OFFICE',
        nameOnAddress: '',
        emailOnAddress: '',
        phoneOnAddress: '',
      },
      productItems: [],
      deliveryFee: 0,
      serviceFee: 0,
      packagingFee: 0,
      discount: 0,
      notes: '',
      attachments: {},
    },
  })
  const { control, handleSubmit: handleFormSubmit, formState, reset, setValue, watch, trigger } = formMethods

  // Watch delivery address fields for product picker
  const watchedCity = watch('address.city')
  const watchedState = watch('address.state')
  const watchedPostalCode = watch('address.postalCode')

  const deliveryAddress = useMemo(() => ({
    city: watchedCity,
    state: watchedState,
    postalCode: watchedPostalCode,
  }), [watchedCity, watchedState, watchedPostalCode])
  const { errors } = formState

  // Clear products and shipping when delivery address (state, city, or postal code) changes
  useEffect(() => {
    // Skip on initial load - only clear when user changes the address
    if (!initialAddressSet.current) {
      // Mark as set once we have a valid address
      if (watchedState || watchedCity || watchedPostalCode) {
        initialAddressSet.current = true
      }
      return
    }

    // Clear products and shipping when address changes
    if (productItems.length > 0 || shippingAllocations.length > 0) {
      setProductItems([])
      setValue('productItems', [])
      setShippingAllocations([])
      setValue('deliveryFee', 0)
      toast.info('Products and shipping cleared due to address change')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedState, watchedCity, watchedPostalCode])

  // Get states and cities for dropdowns
  const states = useMemo(() => getAllStates(), [])
  const cities = useMemo(() => getCitiesByState(selectedState), [selectedState])

  // Handle state change to update cities
  const handleStateChange = useCallback((state: string) => {
    setSelectedState(state)
  }, [])

  // Handle product items change
  const handleProductItemsChange = useCallback(
    (items: PurchaseOrderProductItem[]) => {
      setProductItems(items)
      // Convert to form format
      setValue('productItems', items.map(item => ({
        productId: item.product.productId,
        productTitle: item.product.title,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        pickupAllocations: [],
      })) as any)
      // Reset shipping when products change (need to recalculate)
      setShippingAllocations([])
    },
    [setValue]
  )

  // Handle shipping allocation changes
  const handleShippingChange = useCallback(
    (allocations: ProductItemsSectionProps['shippingAllocations'], totalShipping: number) => {
      setShippingAllocations(allocations)
      // Update delivery fee in form to include shipping cost
      setValue('deliveryFee', totalShipping)
    },
    [setValue]
  )

  // Lazy fetch function for lead autocomplete
  const fetchLeadOptions: LazyFetchFunction = useCallback(
    async (searchText: string, start: number, pageSize: number) => {
      try {
        // Build filter if search text is provided
        const filters = searchText
          ? [
              {
                column: 'firstName',
                operator: 'contains',
                value: searchText,
              },
              {
                column: 'lastName',
                operator: 'contains',
                value: searchText,
              },
              {
                column: 'email',
                operator: 'contains',
                value: searchText,
              },
            ]
          : undefined

        const response = await leadApi.getLeadsInBatches({
          start,
          end: start + pageSize,
          pageSize,
          includeDeleted: false,
          logicOperator: searchText ? 'OR' : undefined,
          filters,
        })

        const leads = response.data as LeadResponseModel[]
        const totalCount = response.totalDataCount

        // Map leads to LazyOption format: "firstName lastName (email)"
        const options: LazyOption[] = leads.map(lead => ({
          value: lead.leadId,
          label: `${lead.firstName} ${lead.lastName} (${lead.email})`,
        }))

        return {
          options,
          hasMore: start + options.length < totalCount,
          totalCount,
        }
      } catch {
        return {
          options: [],
          hasMore: false,
          totalCount: 0,
        }
      }
    },
    [],
  )

  // Fetch purchase order details for edit/view mode
  const fetchPurchaseOrderDetails = useCallback(async (): Promise<void> => {
    if (!purchaseOrderId || hasFetchedDetails.current) {
      return
    }

    setLoading(true)
    hasFetchedDetails.current = true

    try {
      const response = (await purchaseOrderApi.getPurchaseOrderById(
        parseInt(purchaseOrderId, 10),
      )) as PurchaseOrderResponseModel

      // Set selected state for cities dropdown
      if (response.orderSummary?.address?.state) {
        setSelectedState(response.orderSummary.address.state)
      }

      // Fetch assigned lead details if assignedLeadId exists
      if (response.assignedLeadId) {
        try {
          const leadResponse = await leadApi.getLeadById(response.assignedLeadId)
          if (leadResponse) {
            setInitialLeadOption({
              value: leadResponse.leadId,
              label: `${leadResponse.firstName} ${leadResponse.lastName} (${leadResponse.email})`,
            })
          }
        } catch {
          // If lead fetch fails, just set the ID
          // Lead details fetch failed, continue without them
        }
      }

      // Populate form with existing data
      reset({
        vendorNumber: response.vendorNumber ?? '',
        expectedDeliveryDate: response.orderSummary?.expectedDeliveryDate ?? '',
        purchaseOrderStatus: response.purchaseOrderStatus ?? 'DRAFT',
        priority: response.orderSummary?.priority ?? 'MEDIUM',
        assignedLeadId: response.assignedLeadId ?? 0,
        termsConditionsHtml: response.orderSummary?.termsConditionsHtml ?? '',
        purchaseOrderReceipt: response.purchaseOrderReceipt ?? '',
        address: {
          streetAddress: response.orderSummary?.address?.streetAddress ?? '',
          streetAddress2: response.orderSummary?.address?.streetAddress2 ?? '',
          streetAddress3: response.orderSummary?.address?.streetAddress3 ?? '',
          city: response.orderSummary?.address?.city ?? '',
          state: response.orderSummary?.address?.state ?? '',
          postalCode: response.orderSummary?.address?.postalCode ?? '',
          country: response.orderSummary?.address?.country ?? 'India',
          addressType: response.orderSummary?.address?.addressType ?? 'OFFICE',
          nameOnAddress: response.orderSummary?.address?.nameOnAddress ?? '',
          emailOnAddress: response.orderSummary?.address?.emailOnAddress ?? '',
          phoneOnAddress: response.orderSummary?.address?.phoneOnAddress ?? '',
        },
        productItems: (response.products ?? []).map(item => ({
          productId: item.product.productId,
          productTitle: item.product.title,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          pickupAllocations: [],
        })),
        deliveryFee: response.orderSummary?.totalShipping ?? 0,
        serviceFee: 0, // Service fee not in response model
        packagingFee: response.orderSummary?.packagingFee ?? 0,
        discount: response.orderSummary?.totalDiscount ?? 0,
        notes: response.orderSummary?.notes ?? '',
      })

      // Set product items state - convert from response format
      setProductItems((response.products ?? []).map(item => ({
        product: item.product,
        pricePerUnit: item.pricePerUnit,
        quantity: item.quantity,
      })))
    } catch {
      toast.error('Failed to fetch purchase order details')
      navigate(APP_ROUTES.DASHBOARD.PURCHASE_ORDERS, { replace: true })
    } finally {
      setLoading(false)
    }
  }, [purchaseOrderId, reset, navigate])

  // Fetch purchase order details on mount (edit/view mode)
  useEffect(() => {
    if (purchaseOrderId && !hasFetchedDetails.current) {
      void fetchPurchaseOrderDetails()
    }
  }, [purchaseOrderId, fetchPurchaseOrderDetails])

  // Form submit handler
  const onSubmit = useCallback(
    async (data: PurchaseOrderFormData): Promise<void> => {
      setLoading(true)

      try {
        const requestModel = {
          purchaseOrderId: isEdit && purchaseOrderId ? parseInt(purchaseOrderId, 10) : undefined,
          vendorNumber: data.vendorNumber.trim(),
          expectedDeliveryDate: data.expectedDeliveryDate || undefined,
          purchaseOrderStatus: data.purchaseOrderStatus,
          priority: data.priority,
          assignedLeadId: data.assignedLeadId,
          termsConditionsHtml: data.termsConditionsHtml?.trim() || undefined,
          purchaseOrderReceipt: data.purchaseOrderReceipt?.trim() || undefined,
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
          productItems: data.productItems.length > 0 ? data.productItems : undefined,
          deliveryFee: data.deliveryFee || undefined,
          serviceFee: data.serviceFee || undefined,
          packagingFee: data.packagingFee || undefined,
          discount: data.discount || undefined,
          notes: data.notes?.trim() || undefined,
          // Only send new base64 images (filter out URLs which are already uploaded)
          attachments: data.attachments && Object.keys(data.attachments).length > 0
            ? Object.fromEntries(
                Object.entries(data.attachments).filter(([_, value]) =>
                  value && !value.startsWith('http') // Only include base64, not URLs
                )
              )
            : undefined,
        } as any as PurchaseOrderRequestModel

        if (isEdit && purchaseOrderId) {
          await purchaseOrderApi.updatePurchaseOrder(requestModel)
          toast.success('Purchase order updated successfully')
        } else {
          await purchaseOrderApi.createPurchaseOrder(requestModel)
          toast.success('Purchase order created successfully')
        }

        navigate(APP_ROUTES.DASHBOARD.PURCHASE_ORDERS)
      } catch {
        toast.error(`Failed to ${isEdit ? 'update' : 'create'} purchase order`)
      } finally {
        setLoading(false)
      }
    },
    [isEdit, purchaseOrderId, navigate],
  )

  // Cancel handler
  const handleCancel = (): void => {
    navigate(APP_ROUTES.DASHBOARD.PURCHASE_ORDERS)
  }

  // Button text based on mode
  const buttonText = useMemo(() => {
    if (loading) return 'Saving...'
    if (isEdit) return 'Update Purchase Order'
    return 'Create Purchase Order'
  }, [loading, isEdit])

  // ============================================================================
  // Section Configurations
  // ============================================================================

  // Purchase Order Information section
  const basicInfoSections = useMemo<Array<SectionConfig<PurchaseOrderFormData>>>(
    () => [
      {
        title: 'Purchase Order Information',
        fields: [
          {
            name: 'vendorNumber',
            label: 'Vendor Number',
            type: FieldType.Text,
            required: true,
            gridSize: { xs: 12, sm: 6 },
            placeholder: 'Enter vendor number',
          },
          {
            name: 'expectedDeliveryDate',
            label: 'Expected Delivery Date',
            type: FieldType.DateTime,
            required: false,
            gridSize: { xs: 12, sm: 6 },
            hideTimezone: true,
          },
          {
            name: 'purchaseOrderStatus',
            label: 'Status',
            type: FieldType.Select,
            required: true,
            gridSize: { xs: 12, sm: 6 },
            options: [...PURCHASE_ORDER_STATUS_OPTIONS],
          },
          {
            name: 'priority',
            label: 'Priority',
            type: FieldType.Select,
            required: true,
            gridSize: { xs: 12, sm: 6 },
            options: [...PRIORITY_OPTIONS],
          },
          {
            name: 'assignedLeadId',
            label: 'Assigned Lead',
            type: FieldType.LazyAutocomplete,
            required: true,
            gridSize: { xs: 12, sm: 6 },
            placeholder: 'Search for a lead...',
            fetchOptions: fetchLeadOptions,
            initialOption: initialLeadOption,
          },
          {
            name: 'termsConditionsHtml',
            label: 'Terms & Conditions',
            type: FieldType.RichText,
            required: false,
            gridSize: { xs: 12, sm: 12 },
            placeholder: 'Enter terms and conditions...',
          },
        ],
      },
    ],
    [fetchLeadOptions, initialLeadOption],
  )

  // Notes section
  const notesSections = useMemo<Array<SectionConfig<PurchaseOrderFormData>>>(
    () => [
      {
        title: 'Notes',
        fields: [
          {
            name: 'notes',
            label: 'Notes',
            type: FieldType.Textarea,
            required: false,
            gridSize: { xs: 12, sm: 12 },
            rows: 3,
            placeholder: 'Any additional notes about this purchase order (optional)',
          },
        ],
      },
    ],
    [],
  )

  return (
    <Container
      maxWidth={false}
      disableGutters
      className={styles['purchase-orders-page']}
    >
      <form onSubmit={handleFormSubmit(onSubmit)}>
        <Box className={styles['add-purchase-order-page__container']}>
          {/* Basic Information Section */}
          <FormFieldRenderer
            sections={basicInfoSections}
            control={control}
            errors={errors}
            disabled={loading || isView}
            isView={isView}
            sectionClassName={styles['add-purchase-order-page__section']}
            sectionTitleClassName={styles['add-purchase-order-page__section-title']}
            dividerClassName={styles['add-purchase-order-page__divider']}
          />

          {/* Delivery Address Section */}
          <Paper className={styles['add-purchase-order-page__section']}>
            <Subheader
              label="Delivery Address"
              className={styles['add-purchase-order-page__section-title']}
            />
            <Divider className={styles['add-purchase-order-page__divider']} />
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
          <ProductItemsSection
            productItems={productItems}
            onProductItemsChange={handleProductItemsChange}
            isView={isView}
            disabled={loading}
            deliveryAddress={deliveryAddress}
            shippingAllocations={shippingAllocations as any}
            onShippingChange={handleShippingChange}
          />

          {/* Notes Section */}
          <FormFieldRenderer
            sections={notesSections}
            control={control}
            errors={errors}
            disabled={loading || isView}
            isView={isView}
            sectionClassName={styles['add-purchase-order-page__section']}
            sectionTitleClassName={styles['add-purchase-order-page__section-title']}
            dividerClassName={styles['add-purchase-order-page__divider']}
          />

          {/* Attachments Section */}
          <Paper className={styles['add-purchase-order-page__section']}>
            <Subheader
              label="Attachments"
              className={styles['add-purchase-order-page__section-title']}
            />
            <Divider className={styles['add-purchase-order-page__divider']} />
            <Box className={styles['add-purchase-order-page__attachments-container']}>
              <MultipleImageUploadInput
                value={watch('attachments') || {}}
                onChange={(attachments) => setValue('attachments', attachments)}
                disabled={loading || isView}
                maxFiles={30}
                maxSizeMB={5}
                accept="image/*"
                label="Upload Images"
              />
              {errors.attachments && (
                <SecondaryFont variant="caption" className={styles['add-purchase-order-page__attachments-error']}>
                  {typeof errors.attachments.message === 'string' ? errors.attachments.message : 'Invalid attachments'}
                </SecondaryFont>
              )}
            </Box>
          </Paper>

          {/* Action Buttons */}
          {!isView && (
            <Paper className={styles['add-purchase-order-page__section']}>
              <Box className={styles['add-purchase-order-page__actions']}>
                <RedButton
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={loading}
                  className={styles['add-purchase-order-page__action-button']}
                  type="button"
                  label="Cancel"
                />
                <BlueButton
                  variant="contained"
                  startIcon={<SaveIcon />}
                  type="submit"
                  disabled={loading}
                  className={styles['add-purchase-order-page__action-button']}
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
          currentVendorNumber={formMethods.watch('vendorNumber')}
          onStateChange={handleStateChange}
          onProductItemsChange={setProductItems}
        />
      )}
    </Container>
  )
}

export default AddEditPurchaseOrder
