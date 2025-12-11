import { useState } from 'react'

import type { UseFormReset, UseFormSetValue } from 'react-hook-form'
import { toast } from 'react-toastify'

import { Science as ScienceIcon } from '@mui/icons-material'
import { CircularProgress, Fab, Tooltip } from '@mui/material'

import styles from '../../../styles/Packages.module.scss'
import { generatePackageFormTest } from '../../../utils/generateTestData'
import type { PackageFormData } from '../../../utils/validationSchemas'

interface FillTestDataButtonProps {
  reset: UseFormReset<PackageFormData>
  setValue: UseFormSetValue<PackageFormData>
  isEdit: boolean
}

/**
 * FillTestDataButton Component for Package Form
 * Generates random test data and fills the package form
 */
const FillTestDataButton = ({ reset, setValue, isEdit }: FillTestDataButtonProps): JSX.Element => {
  const [filling, setFilling] = useState(false)

  const handleFillTestData = async (): Promise<void> => {
    setFilling(true)

    try {
      // Generate test data (async - fetches real pickup locations from database)
      const testData = await generatePackageFormTest()

      if (isEdit) {
        // In edit mode, preserve the package name and set other fields individually
        setValue('length', testData.length, { shouldValidate: true })
        setValue('breadth', testData.breadth, { shouldValidate: true })
        setValue('height', testData.height, { shouldValidate: true })
        setValue('maxWeight', testData.maxWeight, { shouldValidate: true })
        setValue('standardCapacity', testData.standardCapacity, { shouldValidate: true })
        setValue('pricePerUnit', testData.pricePerUnit, { shouldValidate: true })
        setValue('packageType', testData.packageType, { shouldValidate: true })
        setValue('pickupLocationQuantities', testData.pickupLocationQuantities ?? {}, { shouldValidate: true })
        setValue('notes', testData.notes ?? '', { shouldValidate: true })
      } else {
        // In add mode, reset the entire form with test data
        reset({
          packageName: testData.packageName,
          length: testData.length,
          breadth: testData.breadth,
          height: testData.height,
          maxWeight: testData.maxWeight,
          standardCapacity: testData.standardCapacity,
          pricePerUnit: testData.pricePerUnit,
          packageType: testData.packageType,
          pickupLocationQuantities: testData.pickupLocationQuantities ?? {},
          notes: testData.notes ?? '',
        })
      }

      const locationCount = Object.keys(testData.pickupLocationQuantities ?? {}).length
      toast.success(`Test data filled successfully! ${locationCount} pickup locations added.`)
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
        {filling ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          <ScienceIcon />
        )}
      </Fab>
    </Tooltip>
  )
}

export default FillTestDataButton

