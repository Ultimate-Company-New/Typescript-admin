import { useState } from 'react'

import { type UseFormReset } from 'react-hook-form'

import { Science as ScienceIcon } from '@mui/icons-material'
import { Fab, Tooltip } from '@mui/material'

import styles from '../../../styles/common.module.scss'
import { type ClientSettingsFormData } from '../../../utils/validationSchemas'

interface FillSettingsTestDataButtonProps {
  reset: UseFormReset<ClientSettingsFormData>
}

/**
 * FillSettingsTestDataButton Component
 *
 * A floating action button that fills the Settings form with test data for quick testing.
 * This button appears next to the DevLogger button and auto-populates all settings fields
 * with valid test data.
 */
const FillSettingsTestDataButton = ({ reset }: FillSettingsTestDataButtonProps): JSX.Element => {
  const [filling, setFilling] = useState(false)

  const handleFillTestData = (): void => {
    setFilling(true)

    try {
      // Fill form with test data
      const testData: ClientSettingsFormData = {
        name: 'Ultimate Company',
        description: 'A comprehensive business management platform for modern enterprises',
        supportEmail: 'support@ultimatecompany.com',
        website: 'https://www.ultimatecompany.com',
        logoBase64: '',
        // SendGrid Configuration (constants provided by user)
        sendGridApiKey: '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',
        sendGridEmailAddress: 'nahushrai@hotmail.com',
        sendgridSenderName: 'Ultimate Company Support',
        // Razorpay Configuration
        razorpayApiKey: 'rzp_test_1234567890abcd',
        razorpayApiSecret: 'test_secret_key_1234567890',
        // ImgBB Configuration (constant provided by user)
        imgbbApiKey: 'c74302d045f8590c391a2579491f72e0',
        // ShipRocket Configuration
        shipRocketEmail: 'shipping@ultimatecompany.com',
        shipRocketPassword: 'ShipRocket@2024',
        // JIRA Configuration
        jiraUserName: 'admin@ultimatecompany.com',
        jiraPassword: 'JiraPass@2024',
        jiraProjectUrl: 'https://ultimatecompany.atlassian.net',
        jiraProjectKey: 'UC',
        issueTypes: 'Bug,Feature,Task,Story,Epic',
        // Notes
        notes: 'This is test client configuration data for development and testing purposes.',
      }

      // Reset form with test data
      reset(testData)

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
        className={styles['fab']}
      >
        <ScienceIcon />
      </Fab>
    </Tooltip>
  )
}

export default FillSettingsTestDataButton

