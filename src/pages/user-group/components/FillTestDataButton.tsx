import { useState } from 'react'

import { toast } from 'react-toastify'
import { type UseFormGetValues, type UseFormReset } from 'react-hook-form'

import { Science as ScienceIcon } from '@mui/icons-material'
import { CircularProgress, Fab, Tooltip } from '@mui/material'

import { userApi } from '../../../api/userApi'
import styles from '../../../styles/UserGroups.module.scss'
import { generateUserGroupFormTest, getRandomUserIdsArray } from '../../../utils/generateTestData'

interface UserGroupFormData {
  name: string
  description: string
  notes?: string
}

interface FillTestDataButtonProps {
  reset: UseFormReset<UserGroupFormData>
  getValues: UseFormGetValues<UserGroupFormData>
  setSelectedUserIds: (ids: number[]) => void
  isEdit?: boolean
}

/**
 * FillTestDataButton Component for User Groups
 *
 * A floating action button that fills the form with test data for quick testing.
 * This button appears next to the DevLogger button and auto-populates all form fields
 * with valid test data.
 *
 * Fetches real user IDs from the API and randomly selects 3-8 users for the group.
 * In edit mode, preserves the existing group name to prevent accidental changes.
 */
const FillTestDataButton = ({
  reset,
  getValues,
  setSelectedUserIds,
  isEdit = false,
}: FillTestDataButtonProps): JSX.Element => {
  const [filling, setFilling] = useState(false)

  const handleFillTestData = async (): Promise<void> => {
    setFilling(true)

    try {
      // Fetch users from API (first 100)
      const response = await userApi.fetchUsersInCarrierInBatches({
        start: 0,
        end: 100,
        pageSize: 100,
        includeDeleted: false,
      })

      // Extract user IDs from response (filter out 0 which represents invalid/new users)
      const allUserIds = response.data.map(user => user.userId).filter(id => id !== 0)

      if (allUserIds.length === 0) {
        toast.error('No users found. Please create some users first.')
        setFilling(false)
        return
      }

      // Get current name if in edit mode
      const currentName = isEdit ? getValues('name') : undefined

      // Generate test data using centralized utility
      const testData = generateUserGroupFormTest(currentName)

      // Reset form with test data
      reset({
        name: testData.groupName,
        description: testData.description,
        notes: testData.notes,
      })

      // Randomly select 3-8 users from fetched users
      const randomUserIds = getRandomUserIdsArray(allUserIds, 3, 8)
      setSelectedUserIds(randomUserIds)

      // Brief visual feedback
      setTimeout(() => {
        setFilling(false)
      }, 500)
    } catch (error) {
      // Error handling: show toast and reset filling state
      const message = error instanceof Error ? error.message : 'Failed to generate test data'
      toast.error(message)
      setFilling(false)
    }
  }

  return (
    <Tooltip title="Fill Test Data (fetches real users)" placement="left">
      <Fab
        aria-label="fill test data"
        onClick={() => {
          void handleFillTestData()
        }}
        disabled={filling}
        className={styles['fill-test-data-button__fab']}
      >
        {filling ? <CircularProgress size={24} color="inherit" /> : <ScienceIcon />}
      </Fab>
    </Tooltip>
  )
}

export default FillTestDataButton

