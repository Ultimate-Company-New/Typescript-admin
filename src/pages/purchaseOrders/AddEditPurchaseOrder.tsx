import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { z } from 'zod'

import { Cancel as CancelIcon, Save as SaveIcon } from '@mui/icons-material'
import { Box, Container, Divider, Grid, Paper } from '@mui/material'

import { purchaseOrderApi } from '../../api/purchaseOrderApi'
import { BlueButton, RedButton } from '../../components/buttons'
import { Subheader } from '../../components/fonts'
import { AddressFormController, FieldType, FormFieldRenderer, type SectionConfig } from '../../components/form'
import { PERMISSIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import { usePermissions } from '../../hooks/usePermissions'
import styles from '../../styles/PurchaseOrders.module.scss'
import { getAllStates, getCitiesByState } from '../../utils/stateCityMapper'

import { FillTestDataButton } from './components'

// ============================================================================
// Constants
// ============================================================================

const PURCHASE_ORDER_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'SENT_TO_VENDOR', label: 'Sent to Vendor' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { value: 'IN_PRODUCTION', label: 'In Production' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'PARTIALLY_RECEIVED', label: 'Partially Received' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'ON_HOLD', label: 'On Hold' },
]

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
]

// ============================================================================
// Validation Schema
// ============================================================================

const purchaseOrderFormSchema = z.object({
  vendorNumber: z.string().min(1, 'Vendor number is required').max(100, 'Vendor number must be 100 characters or less'),
  expectedDeliveryDate: z.string().optional(),
  purchaseOrderStatus: z.string().min(1, 'Status is required'),
  priority: z.string().min(1, 'Priority is required'),
  assignedLeadId: z.number().min(1, 'Assigned lead is required'),
  termsConditionsHtml: z.string().optional(),
  purchaseOrderReceipt: z.string().optional(),
  address: z.object({
    streetAddress: z.string().min(1, 'Street address is required'),
    streetAddress2: z.string().optional(),
    streetAddress3: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
    addressType: z.string().min(1, 'Address type is required'),
    nameOnAddress: z.string().optional(),
    emailOnAddress: z.string().email('Invalid email').optional().or(z.literal('')),
    phoneOnAddress: z.string().optional(),
  }),
  // Payment/Fee fields
  deliveryFee: z.number().min(0, 'Delivery fee must be 0 or greater').optional(),
  serviceFee: z.number().min(0, 'Service fee must be 0 or greater').optional(),
  packagingFee: z.number().min(0, 'Packaging fee must be 0 or greater').optional(),
  discount: z.number().min(0, 'Discount must be 0 or greater').optional(),
  notes: z.string().optional(),
})

type PurchaseOrderFormData = z.infer<typeof purchaseOrderFormSchema>

// ============================================================================
// API Request/Response Models
// ============================================================================

interface PurchaseOrderRequestModel {
  purchaseOrderId?: number
  vendorNumber: string
  expectedDeliveryDate?: string
  purchaseOrderStatus: string
  priority: string
  assignedLeadId: number
  termsConditionsHtml?: string
  purchaseOrderReceipt?: string
  purchaseOrderAddressId?: number
  address?: {
    streetAddress: string
    streetAddress2?: string
    streetAddress3?: string
    city: string
    state: string
    postalCode: string
    country: string
    addressType: string
    nameOnAddress?: string
    emailOnAddress?: string
    phoneOnAddress?: string
  }
  deliveryFee?: number
  serviceFee?: number
  packagingFee?: number
  discount?: number
  notes?: string
}

interface PurchaseOrderResponseModel {
  purchaseOrderId: number
  vendorNumber: string
  expectedDeliveryDate?: string
  purchaseOrderStatus: string
  priority: string
  assignedLeadId: number
  termsConditionsHtml?: string
  purchaseOrderReceipt?: string
  address?: {
    addressId?: number
    streetAddress: string
    streetAddress2?: string
    streetAddress3?: string
    city: string
    state: string
    postalCode: string
    country: string
    addressType: string
    nameOnAddress?: string
    emailOnAddress?: string
    phoneOnAddress?: string
  }
  deliveryFee?: number
  serviceFee?: number
  packagingFee?: number
  discount?: number
  notes?: string
  isDeleted?: boolean
  createdAt?: string
  updatedAt?: string
}

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
      deliveryFee: 0,
      serviceFee: 0,
      packagingFee: 0,
      discount: 0,
      notes: '',
    },
  })
  const { control, handleSubmit: handleFormSubmit, formState, reset, setValue } = formMethods
  const errors = formState.errors as Record<string, { message?: string } | undefined>

  // Get states and cities for dropdowns
  const states = useMemo(() => getAllStates(), [])
  const cities = useMemo(() => getCitiesByState(selectedState), [selectedState])

  // Handle state change to update cities
  const handleStateChange = useCallback((state: string) => {
    setSelectedState(state)
  }, [])

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
      if (response.address?.state) {
        setSelectedState(response.address.state)
      }

      // Populate form with existing data
      reset({
        vendorNumber: response.vendorNumber ?? '',
        expectedDeliveryDate: response.expectedDeliveryDate ?? '',
        purchaseOrderStatus: response.purchaseOrderStatus ?? 'DRAFT',
        priority: response.priority ?? 'MEDIUM',
        assignedLeadId: response.assignedLeadId ?? 0,
        termsConditionsHtml: response.termsConditionsHtml ?? '',
        purchaseOrderReceipt: response.purchaseOrderReceipt ?? '',
        address: {
          streetAddress: response.address?.streetAddress ?? '',
          streetAddress2: response.address?.streetAddress2 ?? '',
          streetAddress3: response.address?.streetAddress3 ?? '',
          city: response.address?.city ?? '',
          state: response.address?.state ?? '',
          postalCode: response.address?.postalCode ?? '',
          country: response.address?.country ?? 'India',
          addressType: response.address?.addressType ?? 'OFFICE',
          nameOnAddress: response.address?.nameOnAddress ?? '',
          emailOnAddress: response.address?.emailOnAddress ?? '',
          phoneOnAddress: response.address?.phoneOnAddress ?? '',
        },
        deliveryFee: response.deliveryFee ?? 0,
        serviceFee: response.serviceFee ?? 0,
        packagingFee: response.packagingFee ?? 0,
        discount: response.discount ?? 0,
        notes: response.notes ?? '',
      })
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
        const requestModel: PurchaseOrderRequestModel = {
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
          deliveryFee: data.deliveryFee || undefined,
          serviceFee: data.serviceFee || undefined,
          packagingFee: data.packagingFee || undefined,
          discount: data.discount || undefined,
          notes: data.notes?.trim() || undefined,
        }

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

  // Basic Information section
  const basicInfoSections = useMemo<Array<SectionConfig<PurchaseOrderFormData>>>(
    () => [
      {
        title: 'Basic Information',
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
          },
          {
            name: 'purchaseOrderStatus',
            label: 'Status',
            type: FieldType.Select,
            required: true,
            gridSize: { xs: 12, sm: 6 },
            options: PURCHASE_ORDER_STATUS_OPTIONS,
          },
          {
            name: 'priority',
            label: 'Priority',
            type: FieldType.Select,
            required: true,
            gridSize: { xs: 12, sm: 6 },
            options: PRIORITY_OPTIONS,
          },
          {
            name: 'assignedLeadId',
            label: 'Assigned Lead ID',
            type: FieldType.Number,
            required: true,
            gridSize: { xs: 12, sm: 6 },
            placeholder: 'Enter lead ID',
          },
        ],
      },
    ],
    [],
  )

  // Fees section
  const feesSections = useMemo<Array<SectionConfig<PurchaseOrderFormData>>>(
    () => [
      {
        title: 'Fees & Discounts',
        fields: [
          {
            name: 'deliveryFee',
            label: 'Delivery Fee',
            type: FieldType.Number,
            required: false,
            gridSize: { xs: 12, sm: 6, md: 3 },
            placeholder: '0.00',
          },
          {
            name: 'serviceFee',
            label: 'Service Fee',
            type: FieldType.Number,
            required: false,
            gridSize: { xs: 12, sm: 6, md: 3 },
            placeholder: '0.00',
          },
          {
            name: 'packagingFee',
            label: 'Packaging Fee',
            type: FieldType.Number,
            required: false,
            gridSize: { xs: 12, sm: 6, md: 3 },
            placeholder: '0.00',
          },
          {
            name: 'discount',
            label: 'Discount',
            type: FieldType.Number,
            required: false,
            gridSize: { xs: 12, sm: 6, md: 3 },
            placeholder: '0.00',
          },
        ],
      },
    ],
    [],
  )

  // Terms & Conditions section
  const termsSections = useMemo<Array<SectionConfig<PurchaseOrderFormData>>>(
    () => [
      {
        title: 'Terms & Conditions',
        fields: [
          {
            name: 'termsConditionsHtml',
            label: 'Terms & Conditions',
            type: FieldType.Textarea,
            required: false,
            gridSize: { xs: 12 },
            rows: 4,
            placeholder: 'Enter terms and conditions (HTML supported)',
          },
        ],
      },
    ],
    [],
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
            gridSize: { xs: 12 },
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
              />
            </Grid>
          </Paper>

          {/* Fees & Discounts Section */}
          <FormFieldRenderer
            sections={feesSections}
            control={control}
            errors={errors}
            disabled={loading || isView}
            isView={isView}
            sectionClassName={styles['add-purchase-order-page__section']}
            sectionTitleClassName={styles['add-purchase-order-page__section-title']}
            dividerClassName={styles['add-purchase-order-page__divider']}
          />

          {/* Terms & Conditions Section */}
          <FormFieldRenderer
            sections={termsSections}
            control={control}
            errors={errors}
            disabled={loading || isView}
            isView={isView}
            sectionClassName={styles['add-purchase-order-page__section']}
            sectionTitleClassName={styles['add-purchase-order-page__section-title']}
            dividerClassName={styles['add-purchase-order-page__divider']}
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
        />
      )}
    </Container>
  )
}

export default AddEditPurchaseOrder
