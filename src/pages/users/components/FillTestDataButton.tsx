import { useState } from 'react'

import { type UseFormGetValues, type UseFormReset, type UseFormSetValue } from 'react-hook-form'

import { Science as ScienceIcon } from '@mui/icons-material'
import { Fab, Tooltip } from '@mui/material'

import styles from '../../../styles/Users.module.scss'
import { generateUserTest } from '../../../utils/generateTestData'
import { type UserFormData } from '../../../utils/validationSchemas'

interface FillTestDataButtonProps {
  reset: UseFormReset<UserFormData>
  getValues: UseFormGetValues<UserFormData>
  setSelectedGroupIds: (ids: number[]) => void
  setValue: UseFormSetValue<UserFormData>
  isEdit?: boolean
}

/**
 * FillTestDataButton Component
 *
 * A floating action button that fills the form with test data for quick testing.
 * This button appears next to the DevLogger button and auto-populates all form fields
 * with valid test data.
 *
 * In edit mode, preserves the existing loginName (email) to prevent accidental changes.
 */
const FillTestDataButton = ({
  reset,
  getValues,
  setSelectedGroupIds,
  setValue,
  isEdit = false,
}: FillTestDataButtonProps): JSX.Element => {
  const [filling, setFilling] = useState(false)

  const handleFillTestData = (): void => {
    setFilling(true)

    try {
      // Generate test data using utility function
      const [testUser] = generateUserTest(1)

      // Get current loginName if in edit mode
      const currentLoginName = isEdit ? getValues('loginName') : ''

      // Map test data to UserFormData format
      const testData: UserFormData = {
        firstName: testUser.firstName ?? '',
        lastName: testUser.lastName ?? '',
        // Preserve loginName in edit mode, use generated one in add mode
        loginName: isEdit ? currentLoginName : testUser.loginName ?? '',
        phone: testUser.phone ?? '',
        role: testUser.role ?? '',
        dob: new Date(testUser.dob ?? '1990-01-15'),
        profilePictureBase64: '',
        address: {
          streetAddress: testUser.address?.streetAddress ?? '',
          streetAddress2: testUser.address?.streetAddress2 ?? '',
          streetAddress3: testUser.address?.streetAddress3 ?? '',
          city: '', // Set empty initially
          state: testUser.address?.state ?? '',
          postalCode: testUser.address?.postalCode ?? testUser.address?.zipCode ?? '',
          country: testUser.address?.country ?? '',
          addressType: testUser.address?.addressType ?? '',
          nameOnAddress: testUser.address?.nameOnAddress ?? '',
          emailOnAddress: testUser.address?.emailOnAddress ?? '',
          phoneOnAddress: testUser.address?.phoneOnAddress ?? '',
        },
        notes: testUser.notes ?? '',
      }

      // Reset form with test data (state first, city empty)
      reset(testData)

      // Defer setting the city to allow state change to populate cities
      setTimeout(() => {
        reset({
          ...testData,
          address: {
            ...testData.address,
            city: testUser.address?.city ?? 'Mumbai', // Now set the city after state has been processed
          },
        })
      }, 100)

      // Clear profile picture
      setValue('profilePictureBase64', '')

      // Select first group (group ID 1)
      setSelectedGroupIds([1])

      // Brief visual feedback
      setTimeout(() => {
        setFilling(false)
      }, 500)
    } catch {
      // Error handling: reset filling state on any error
      setFilling(false)
    }
  }

  return (
    <Tooltip title="Fill Test Data" placement="left">
      <Fab
        aria-label="fill test data"
        onClick={handleFillTestData}
        disabled={filling}
        className={styles['fill-test-data-button__fab']}
      >
        <ScienceIcon />
      </Fab>
    </Tooltip>
  )
}

export default FillTestDataButton
