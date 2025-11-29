import { useState } from 'react'

import { type UseFormGetValues, type UseFormReset, type UseFormSetValue } from 'react-hook-form'

import { Science as ScienceIcon } from '@mui/icons-material'
import { Fab, Tooltip } from '@mui/material'

import { USER_ROLES } from '../../../constants/appConstants'
import styles from '../../../styles/Users.module.scss'
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
      // Generate timestamp for unique email
      const timestamp = Date.now()

      // Randomly select between HOME or WORK
      const randomAddressType: string = Math.random() < 0.5 ? 'HOME' : 'WORK'

      // Get current loginName if in edit mode
      const currentLoginName = isEdit ? getValues('loginName') : ''

      // Fill form with test data - FIRST set the state, THEN the city
      const testData: UserFormData = {
        firstName: 'UI Test',
        lastName: `User ${timestamp}`,
        // Preserve loginName in edit mode, generate new one in add mode
        loginName: isEdit ? currentLoginName : `nahushrai+ui_testuser${timestamp}@gmail.com`,
        phone: '9876543210',
        role: USER_ROLES.SUPER_ADMIN,
        dob: new Date('1990-01-15'),
        profilePictureBase64: '',
        address: {
          streetAddress: '123 Test Street',
          streetAddress2: 'Suite 100',
          streetAddress3: 'Building A, Floor 5',
          city: '', // Set empty initially
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
          addressType: randomAddressType,
          nameOnAddress: 'Test User',
          emailOnAddress: `test${timestamp}@example.com`,
          phoneOnAddress: '9123456789',
        },
        notes: 'This is a test user created for automated testing purposes.',
      }

      // Reset form with test data (state first, city empty)
      reset(testData)

      // Defer setting the city to allow state change to populate cities
      setTimeout(() => {
        reset({
          ...testData,
          address: {
            ...testData.address,
            city: 'Mumbai', // Now set the city after state has been processed
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
