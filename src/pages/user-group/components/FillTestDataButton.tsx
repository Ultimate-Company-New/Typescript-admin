import { useState } from 'react'

import { type UseFormGetValues, type UseFormReset } from 'react-hook-form'

import { Science as ScienceIcon } from '@mui/icons-material'
import { Fab, Tooltip } from '@mui/material'

import styles from '../../../styles/UserGroups.module.scss'

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
 * In edit mode, preserves the existing group name to prevent accidental changes.
 */
const FillTestDataButton = ({
  reset,
  getValues,
  setSelectedUserIds,
  isEdit = false,
}: FillTestDataButtonProps): JSX.Element => {
  const [filling, setFilling] = useState(false)

  const handleFillTestData = (): void => {
    setFilling(true)

    try {
      // Generate test data for user groups
      const testGroups = [
        {
          name: 'Test Group - Developers',
          description: 'Development team with full access to code repositories and deployment tools',
          notes: 'This is a test group for development purposes',
        },
        {
          name: 'Test Group - QA Team',
          description: 'Quality Assurance team responsible for testing and bug tracking',
          notes: 'QA team with testing permissions',
        },
        {
          name: 'Test Group - Support',
          description: 'Customer support team with access to ticketing and communication tools',
          notes: 'Support staff group',
        },
      ]

      // Randomly select one of the test groups
      const testGroup = testGroups[Math.floor(Math.random() * testGroups.length)]

      // Get current name if in edit mode
      const currentName = isEdit ? getValues('name') : ''

      // Map test data to UserGroupFormData format
      const testData: UserGroupFormData = {
        // Preserve name in edit mode, use generated one in add mode
        name: isEdit ? currentName : `${testGroup.name} ${Date.now()}`,
        description: testGroup.description,
        notes: testGroup.notes,
      }

      // Reset form with test data
      reset(testData)

      // Select first 3 users (user IDs 1, 2, 3)
      setSelectedUserIds([1, 2, 3])

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

