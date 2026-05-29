import { useState } from 'react'

import { type UseFormGetValues, type UseFormReset, type UseFormSetValue } from 'react-hook-form'
import { toast } from 'react-toastify'

import { Science as ScienceIcon } from '@mui/icons-material'
import { CircularProgress, Fab, Tooltip } from '@mui/material'

import { userApi } from '../../../api/userApi'
import type { LazyOption } from '../../../components/form-input'
import styles from '../../../styles/Leads.module.scss'
import { generateLeadFormTest } from '../../../utils/generateTestData'
import { type LeadFormData } from '../../../utils/validationSchemas'

/**
 * User response for agent selection
 */
interface UserResponseModel {
  userId: number
  firstName: string
  lastName: string
  loginName: string
}

interface FillTestDataButtonProps {
  reset: UseFormReset<LeadFormData>
  getValues: UseFormGetValues<LeadFormData>
  setValue: UseFormSetValue<LeadFormData>
  setSelectedState: (state: string) => void
  setInitialAgentOption: (option: LazyOption | undefined) => void
  isEdit?: boolean
}

/**
 * FillTestDataButton Component for Leads
 *
 * A floating action button that fills the form with test data for quick testing.
 * This button appears next to the DevLogger button and auto-populates all form fields
 * with valid test data.
 *
 * Features:
 * - Fetches first 10 users and randomly selects one as assigned agent
 * - Sets the initialAgentOption so the LazyAutocomplete displays correctly
 * - Generates proper fax number
 * - In edit mode, preserves the existing email to prevent accidental changes.
 */
const FillTestDataButton = ({
  reset,
  getValues,
  setValue,
  setSelectedState,
  setInitialAgentOption,
  isEdit = false,
}: FillTestDataButtonProps): JSX.Element => {
  const [filling, setFilling] = useState(false)

  /**
   * Fetch users and randomly select one for assigned agent
   */
  const fetchRandomAgent = async (): Promise<{ userId: number; option: LazyOption } | null> => {
    try {
      const response = await userApi.fetchUsersInCarrierInBatches({
        start: 0,
        end: 10,
        pageSize: 10,
        includeDeleted: false,
      })

      const users = response.data as UserResponseModel[]

      if (users.length === 0) {
        return null
      }

      // Randomly select one user
      const randomUser = users[Math.floor(Math.random() * users.length)]

      return {
        userId: randomUser.userId,
        option: {
          value: randomUser.userId,
          label: `${randomUser.firstName} ${randomUser.lastName} (${randomUser.loginName})`,
        },
      }
    } catch {
      // If fetching fails, return null - we'll just leave the agent unassigned
      return null
    }
  }

  const handleFillTestData = async (): Promise<void> => {
    setFilling(true)

    try {
      // Get current email if in edit mode
      const currentEmail = isEdit ? getValues('email') : undefined

      // Generate test data using centralized utility (includes fax)
      const testData = generateLeadFormTest(currentEmail)

      // Fetch a random agent
      const agentData = await fetchRandomAgent()

      const address = testData.address ?? {
        streetAddress: '',
        streetAddress2: '',
        streetAddress3: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        addressType: 'OFFICE',
      }

      // Set state first so cities dropdown populates
      setSelectedState(address.state ?? '')

      // Set initial agent option for the lazy autocomplete display
      if (agentData) {
        setInitialAgentOption(agentData.option)
      }

      // Reset form with test data (fax is now included in testData)
      reset({
        firstName: testData.firstName,
        lastName: testData.lastName,
        email: testData.email,
        phone: testData.phone,
        leadStatus: testData.leadStatus,
        company: testData.company,
        companySize: testData.companySize,
        annualRevenue: testData.annualRevenue,
        title: testData.title,
        website: testData.website,
        fax: testData.fax,
        assignedAgentId: agentData?.userId,
        address: {
          streetAddress: address.streetAddress,
          streetAddress2: address.streetAddress2,
          streetAddress3: address.streetAddress3,
          city: '', // Will be set after state change
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          addressType: address.addressType,
        },
        notes: testData.notes,
      })

      // Set the city after a small delay to ensure the cities dropdown is populated
      setTimeout(() => {
        setValue('address.city', address.city ?? '')
        setFilling(false)
        toast.success('Test data filled successfully!')
      }, 100)
    } catch (error) {
      // Error handling: show toast and reset filling state
      const message = error instanceof Error ? error.message : 'Failed to generate test data'
      toast.error(message)
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
