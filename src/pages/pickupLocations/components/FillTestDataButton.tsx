import { useState } from 'react'

import type { UseFormReset, UseFormSetValue } from 'react-hook-form'
import { toast } from 'react-toastify'

import { Science as ScienceIcon } from '@mui/icons-material'
import { CircularProgress, Fab, Tooltip } from '@mui/material'

import styles from '../../../styles/PickupLocations.module.scss'
import { generatePickupLocationFormTest } from '../../../utils/generateTestData'
import type { PickupLocationFormData } from '../../../utils/validationSchemas'

interface FillTestDataButtonProps {
  setValue: UseFormSetValue<PickupLocationFormData>
  reset: UseFormReset<PickupLocationFormData>
  isEdit: boolean
  currentName?: string
}

/**
 * Fill Test Data Button for Pickup Location Forms
 * Generates and fills realistic test data for development/testing
 */
const FillTestDataButton = ({
  setValue,
  reset,
  isEdit,
  currentName,
}: FillTestDataButtonProps): JSX.Element => {
  const [filling, setFilling] = useState(false)

  const handleFillTestData = async (): Promise<void> => {
    setFilling(true)

    try {
      // Generate test data (preserve name in edit mode)
      const testData = generatePickupLocationFormTest(isEdit ? currentName : undefined)

      // Reset form with new values for clean state
      reset(testData as PickupLocationFormData, {
        keepDirty: false,
        keepErrors: false,
      })

      // Also set individual values to trigger validation
      setValue('addressNickName', testData.addressNickName, { shouldValidate: true })
      setValue('shipRocketPickupLocationId', testData.shipRocketPickupLocationId ?? '', { shouldValidate: true })
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
      setValue('notes', testData.notes ?? '', { shouldValidate: true })

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

