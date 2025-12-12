import { useState } from 'react'

import type { UseFormReset, UseFormSetValue } from 'react-hook-form'
import { toast } from 'react-toastify'

import { Science as ScienceIcon } from '@mui/icons-material'
import { CircularProgress, Fab, Tooltip } from '@mui/material'

import styles from '../../../styles/PurchaseOrders.module.scss'
import { generatePurchaseOrderFormTest } from '../../../utils/generateTestData'

/**
 * Purchase Order Form Data type
 * Matches the form schema in AddEditPurchaseOrder.tsx
 */
interface PurchaseOrderFormData {
  vendorNumber: string
  expectedDeliveryDate?: string
  purchaseOrderStatus: string
  priority: string
  assignedLeadId: number
  termsConditionsHtml?: string
  purchaseOrderReceipt?: string
  address: {
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

interface FillTestDataButtonProps {
  setValue: UseFormSetValue<PurchaseOrderFormData>
  reset: UseFormReset<PurchaseOrderFormData>
  isEditMode: boolean
  currentVendorNumber?: string
  onStateChange?: (state: string) => void
}

/**
 * Fill Test Data Button for Purchase Order Forms
 * Generates and fills realistic test data for development/testing
 */
const FillTestDataButton = ({
  setValue,
  isEditMode,
  currentVendorNumber,
  onStateChange,
}: FillTestDataButtonProps): JSX.Element => {
  const [filling, setFilling] = useState(false)

  const handleFillTestData = async (): Promise<void> => {
    setFilling(true)

    try {
      // Generate test data (async because it fetches lead ID from database)
      const testData = await generatePurchaseOrderFormTest(isEditMode ? currentVendorNumber : undefined)

      // Fill form fields
      setValue('vendorNumber', testData.vendorNumber, { shouldValidate: true })
      setValue('expectedDeliveryDate', testData.expectedDeliveryDate, { shouldValidate: true })
      setValue('purchaseOrderStatus', testData.purchaseOrderStatus, { shouldValidate: true })
      setValue('priority', testData.priority, { shouldValidate: true })
      setValue('assignedLeadId', testData.assignedLeadId, { shouldValidate: true })
      setValue('termsConditionsHtml', testData.termsConditionsHtml, { shouldValidate: true })

      // Address fields
      setValue('address.streetAddress', testData.address.streetAddress, { shouldValidate: true })
      setValue('address.streetAddress2', testData.address.streetAddress2 ?? '', { shouldValidate: true })
      setValue('address.streetAddress3', testData.address.streetAddress3 ?? '', { shouldValidate: true })
      setValue('address.city', testData.address.city, { shouldValidate: true })
      setValue('address.state', testData.address.state, { shouldValidate: true })
      setValue('address.postalCode', testData.address.postalCode, { shouldValidate: true })
      setValue('address.country', testData.address.country, { shouldValidate: true })
      setValue('address.addressType', testData.address.addressType, { shouldValidate: true })
      setValue('address.nameOnAddress', testData.address.nameOnAddress ?? '', { shouldValidate: true })
      setValue('address.emailOnAddress', testData.address.emailOnAddress ?? '', { shouldValidate: true })
      setValue('address.phoneOnAddress', testData.address.phoneOnAddress ?? '', { shouldValidate: true })

      // Trigger state change callback for city dropdown update
      if (onStateChange && testData.address.state) {
        onStateChange(testData.address.state)
      }

      // Fee fields
      setValue('deliveryFee', testData.deliveryFee, { shouldValidate: true })
      setValue('serviceFee', testData.serviceFee, { shouldValidate: true })
      setValue('packagingFee', testData.packagingFee, { shouldValidate: true })
      setValue('discount', testData.discount, { shouldValidate: true })

      // Notes
      setValue('notes', testData.notes, { shouldValidate: true })

      toast.success('Test data filled successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate test data'
      toast.error(message)
    } finally {
      setFilling(false)
    }
  }

  return (
    <Tooltip title="Fill Test Data" placement="left">
      <Fab
        aria-label="fill test data"
        onClick={() => void handleFillTestData()}
        disabled={filling}
        className={styles['fill-test-data-button__fab']}
      >
        {filling ? <CircularProgress size={24} color="inherit" /> : <ScienceIcon />}
      </Fab>
    </Tooltip>
  )
}

export default FillTestDataButton
