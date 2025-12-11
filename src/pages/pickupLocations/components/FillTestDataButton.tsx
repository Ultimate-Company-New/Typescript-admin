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
}

/**
 * Fill Test Data Button for Pickup Location Forms
 * Generates and fills realistic test data for development/testing
 */
const FillTestDataButton = ({
  setValue,
  reset,
}: FillTestDataButtonProps): JSX.Element => {
  const [filling, setFilling] = useState(false)

  const handleFillTestData = (): void => {
    setFilling(true)

    try {
      // Generate test data (always generate new name)
      const testData = generatePickupLocationFormTest()

      // Create initial data with empty city (to allow state to populate city dropdown)
      const initialData: PickupLocationFormData = {
        addressNickName: testData.addressNickName,
        address: {
          streetAddress: testData.address.streetAddress,
          streetAddress2: testData.address.streetAddress2 ?? '',
          streetAddress3: testData.address.streetAddress3 ?? '',
          city: '', // Set empty initially
          state: testData.address.state,
          postalCode: testData.address.postalCode,
          country: testData.address.country,
          addressType: testData.address.addressType,
          nameOnAddress: testData.address.nameOnAddress ?? '',
          emailOnAddress: testData.address.emailOnAddress ?? '',
          phoneOnAddress: testData.address.phoneOnAddress ?? '',
        },
        notes: testData.notes ?? '',
      }

      // Reset form with test data (state first, city empty)
      reset(initialData)

      // Defer setting the city to allow state change to populate cities
      setTimeout(() => {
        setValue('address.city', testData.address.city ?? 'Mumbai', { shouldValidate: true })
      }, 150)

      toast.success('Test data filled successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate test data'
      toast.error(message)
    } finally {
      // Brief visual feedback
      setTimeout(() => {
        setFilling(false)
      }, 500)
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

