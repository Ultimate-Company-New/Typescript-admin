import { useState } from 'react'

import type { UseFormSetValue } from 'react-hook-form'
import { toast } from 'react-toastify'

import { Science as ScienceIcon } from '@mui/icons-material'
import { CircularProgress, Fab, Tooltip } from '@mui/material'

import styles from '../../../styles/Promos.module.scss'
import { generatePromoFormTest } from '../../../utils/generateTestData'
import type { PromoFormData } from '../../../utils/validationSchemas'

interface FillTestDataButtonProps {
  setValue: UseFormSetValue<PromoFormData>
  isEditMode: boolean
  currentPromoCode?: string
}

/**
 * Fill Test Data Button for Promo Forms
 * Generates and fills realistic test data for development/testing
 */
const FillTestDataButton = ({ setValue, isEditMode, currentPromoCode }: FillTestDataButtonProps): JSX.Element => {
  const [filling, setFilling] = useState(false)

  const handleFillTestData = async (): Promise<void> => {
    setFilling(true)

    try {
      // Generate test data
      const testData = generatePromoFormTest(isEditMode ? currentPromoCode : undefined)

      // Fill form fields
      setValue('promoCode', testData.promoCode ?? '', { shouldValidate: true })
      setValue('description', testData.description ?? '', { shouldValidate: true })
      setValue('discountValue', testData.discountValue ?? 0, { shouldValidate: true })
      setValue('isPercent', testData.isPercent ?? false, { shouldValidate: true })
      setValue('notes', testData.notes ?? '', { shouldValidate: true })
      setValue('startDate', testData.startDate ?? '', { shouldValidate: true })
      setValue('expiryDate', testData.expiryDate ?? '', { shouldValidate: true })

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
