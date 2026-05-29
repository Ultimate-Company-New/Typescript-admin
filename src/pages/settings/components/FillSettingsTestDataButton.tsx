import { useState } from 'react'

import { type UseFormSetValue } from 'react-hook-form'

import { Science as ScienceIcon } from '@mui/icons-material'
import { Fab, Tooltip } from '@mui/material'

import styles from '../../../styles/common.module.scss'
import { type ClientSettingsFormData } from '../../../utils/validationSchemas'

interface FillSettingsTestDataButtonProps {
  setValue: UseFormSetValue<ClientSettingsFormData>
}

/**
 * FillSettingsTestDataButton Component
 *
 * A floating action button that fills the Settings form with test data for quick testing.
 * This button appears next to the DevLogger button and auto-populates all settings fields
 * with valid test data.
 */
const FillSettingsTestDataButton = ({ setValue }: FillSettingsTestDataButtonProps): JSX.Element => {
  const [filling, setFilling] = useState(false)

  const handleFillTestData = (): void => {
    setFilling(true)

    try {
      // Fill form fields with test data (excluding logo and name)
      // Note: Client name is disabled and cannot be changed
      setValue('description', 'A comprehensive business management platform for modern enterprises')
      setValue('supportEmail', 'support@ultimatecompany.com')
      setValue('website', 'https://www.ultimatecompany.com')

      // Brevo Configuration (constants provided by user)
      setValue('brevoApiKey', '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')
      setValue('brevoEmailAddress', 'nahushrai@hotmail.com')
      setValue('brevoSenderName', 'Ultimate Company Support')

      // Razorpay Configuration
      setValue('razorpayApiKey', 'rzp_test_1234567890abcd')
      setValue('razorpayApiSecret', 'test_secret_key_1234567890')

      // ImgBB Configuration (constant provided by user)
      setValue('imgbbApiKey', 'c74302d045f8590c391a2579491f72e0')

      // ShipRocket Configuration
      setValue('shipRocketEmail', 'shipping@ultimatecompany.com')
      setValue('shipRocketPassword', 'ShipRocket@2024')

      // JIRA Configuration
      setValue('jiraUserName', 'admin@ultimatecompany.com')
      setValue('jiraPassword', 'JiraPass@2024')
      setValue('jiraProjectUrl', 'https://ultimatecompany.atlassian.net')
      setValue('jiraProjectKey', 'UC')
      setValue('issueTypes', 'Bug,Feature,Task,Story,Epic')

      // Notes
      setValue('notes', 'This is test client configuration data for development and testing purposes.')

      // Note: logoBase64 and name are intentionally NOT set
      // - logoBase64: to preserve the existing logo
      // - name: client name is disabled and cannot be changed

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
        aria-label="fill test settings data"
        onClick={handleFillTestData}
        disabled={filling}
        className={`${styles['fab']} ${styles['fab--offset-left']} ${styles['fab--secondary']}`}
      >
        <ScienceIcon />
      </Fab>
    </Tooltip>
  )
}

export default FillSettingsTestDataButton
