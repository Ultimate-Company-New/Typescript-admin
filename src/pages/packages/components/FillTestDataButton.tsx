import type React from 'react'
import { useCallback } from 'react'

import { toast } from 'react-toastify'
import type { UseFormReset, UseFormSetValue } from 'react-hook-form'

import { Science as ScienceIcon } from '@mui/icons-material'
import { Fab, Tooltip } from '@mui/material'

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
const FillTestDataButton = ({ reset, setValue, isEdit }: FillTestDataButtonProps): React.JSX.Element => {
  const handleFillTestData = useCallback((): void => {
    try {
      const testData = generatePackageFormTest()

      if (isEdit) {
        // In edit mode, preserve the package name and set other fields individually
        setValue('length', testData.length)
        setValue('breadth', testData.breadth)
        setValue('height', testData.height)
        setValue('maxWeight', testData.maxWeight)
        setValue('standardCapacity', testData.standardCapacity)
        setValue('pricePerUnit', testData.pricePerUnit)
        setValue('packageType', testData.packageType)
        setValue('notes', testData.notes ?? '')
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
          notes: testData.notes ?? '',
        })
      }

      toast.success('Test data filled successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate test data'
      toast.error(message)
    }
  }, [reset, setValue, isEdit])

  return (
    <Tooltip title="Fill with test data" placement="left">
      <Fab
        aria-label="fill test data"
        onClick={handleFillTestData}
        className={styles['fill-test-data-button__fab']}
      >
        <ScienceIcon />
      </Fab>
    </Tooltip>
  )
}

export default FillTestDataButton

