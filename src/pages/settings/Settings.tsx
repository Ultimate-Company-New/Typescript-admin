import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'

import { Save as SaveIcon } from '@mui/icons-material'
import { Box, Container, Paper } from '@mui/material'

import { clientApi, type ClientResponseModel } from '../../api/clientApi'
import { FormFieldRenderer, type SectionConfig } from '../../components'
import { BlueButton } from '../../components/buttons'
import { FieldType } from '../../components/form/FormFieldRenderer'
import { PERMISSIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import { usePermissions } from '../../hooks/usePermissions'
import styles from '../../styles/Settings.module.scss'
import { clientSettingsSchema, type ClientSettingsFormData } from '../../utils/validationSchemas'

import { FillSettingsTestDataButton } from './components'

/**
 * Settings Page
 * Manages client configuration and settings
 * Requires UPDATE_CLIENT permission
 */
const Settings = (): JSX.Element => {
  const [loading, setLoading] = useState(false)
  const [currentClient, setCurrentClient] = useState<ClientResponseModel | null>(null)

  // Get user permissions for authorization
  const { hasPermission } = usePermissions()

  // Use ref to track if permission check has been performed
  const hasCheckedPermissions = useRef(false)

  // Form setup with react-hook-form and Zod validation
  const formMethods = useForm<ClientSettingsFormData>({
    resolver: zodResolver(clientSettingsSchema),
    defaultValues: {
      name: '',
      description: '',
      supportEmail: '',
      website: '',
      sendGridApiKey: '',
      sendGridEmailAddress: '',
      sendgridSenderName: '',
      razorpayApiKey: '',
      razorpayApiSecret: '',
      imgbbApiKey: '',
      logoBase64: '',
      shipRocketEmail: '',
      shipRocketPassword: '',
      jiraUserName: '',
      jiraPassword: '',
      jiraProjectUrl: '',
      jiraProjectKey: '',
      issueTypes: '',
      notes: '',
    },
  })
  const { control, handleSubmit: handleFormSubmit, formState, reset } = formMethods
  const errors = formState.errors as Record<string, { message?: string } | undefined>

  // Check permissions on mount
  useEffect(() => {
    if (hasCheckedPermissions.current) {
      return
    }

    if (!hasPermission(PERMISSIONS.UPDATE_CLIENT)) {
      hasCheckedPermissions.current = true
      toast.error('You do not have permission to access this page')
      window.location.href = APP_ROUTES.DASHBOARD.USERS
    } else {
      hasCheckedPermissions.current = true
    }
  }, [hasPermission])

  /**
   * Fetch current client settings
   */
  const fetchClientSettings = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      // Get client ID from localStorage (set during client selection)
      const clientIdStr = localStorage.getItem('selectedClientId') ?? localStorage.getItem('clientId')
      if (!clientIdStr) {
        toast.error('No client selected. Please select a client first.')
        return
      }

      const clientId = parseInt(clientIdStr)
      const response: ClientResponseModel = await clientApi.getClientById(clientId)

      setCurrentClient(response)

      // Reset form with client data
      reset({
        name: response.name,
        description: response.description,
        supportEmail: response.supportEmail,
        website: response.website,
        logoBase64: response.logoUrl ?? '',
        sendGridApiKey: response.sendGridApiKey ?? '',
        sendGridEmailAddress: response.sendGridEmailAddress ?? '',
        sendgridSenderName: response.sendgridSenderName ?? '',
        razorpayApiKey: response.razorpayApiKey ?? '',
        razorpayApiSecret: response.razorpayApiSecret ?? '',
        imgbbApiKey: response.imgbbApiKey ?? '',
        shipRocketEmail: response.shipRocketEmail ?? '',
        shipRocketPassword: response.shipRocketPassword ?? '',
        jiraUserName: response.jiraUserName ?? '',
        jiraPassword: response.jiraPassword ?? '',
        jiraProjectUrl: response.jiraProjectUrl ?? '',
        jiraProjectKey: response.jiraProjectKey ?? '',
        issueTypes: response.issueTypes ?? '',
        googleCredId: response.googleCredId,
        notes: response.notes ?? '',
      })

      toast.success('Client settings loaded successfully')
    } catch (error) {
      toast.error('Failed to fetch client settings')
    } finally {
      setLoading(false)
    }
  }, [reset])

  // Fetch client settings on mount
  useEffect(() => {
    void fetchClientSettings()
  }, [fetchClientSettings])

  /**
   * Handle form submission
   */
  const onSubmit = useCallback(
    async (formData: ClientSettingsFormData): Promise<void> => {
      if (!currentClient) {
        toast.error('No client loaded')
        return
      }

      setLoading(true)
      try {
        const typedData = formData as {
          name: string
          description: string
          supportEmail: string
          website: string
          logoBase64?: string
          sendGridApiKey?: string
          sendGridEmailAddress?: string
          sendgridSenderName?: string
          razorpayApiKey?: string
          razorpayApiSecret?: string
          imgbbApiKey?: string
          shipRocketEmail?: string
          shipRocketPassword?: string
          jiraUserName?: string
          jiraPassword?: string
          jiraProjectUrl?: string
          jiraProjectKey?: string
          issueTypes?: string
          googleCredId?: number
          notes?: string
        }

        const logoToSend = typedData.logoBase64?.startsWith('http') ? undefined : typedData.logoBase64

        await clientApi.updateClient(currentClient.clientId, {
          clientId: currentClient.clientId,
          name: typedData.name,
          description: typedData.description,
          supportEmail: typedData.supportEmail,
          website: typedData.website,
          sendGridApiKey: typedData.sendGridApiKey,
          sendGridEmailAddress: typedData.sendGridEmailAddress,
          sendgridSenderName: typedData.sendgridSenderName,
          razorpayApiKey: typedData.razorpayApiKey,
          razorpayApiSecret: typedData.razorpayApiSecret,
          imgbbApiKey: typedData.imgbbApiKey,
          logoBase64: logoToSend,
          shipRocketEmail: typedData.shipRocketEmail,
          shipRocketPassword: typedData.shipRocketPassword,
          jiraUserName: typedData.jiraUserName,
          jiraPassword: typedData.jiraPassword,
          jiraProjectUrl: typedData.jiraProjectUrl,
          jiraProjectKey: typedData.jiraProjectKey,
          issueTypes: typedData.issueTypes,
          googleCredId: typedData.googleCredId,
          notes: typedData.notes,
        })

        toast.success('Client settings updated successfully')

        // Reload settings
        await fetchClientSettings()
      } catch (error) {
        toast.error('Failed to update client settings')
      } finally {
        setLoading(false)
      }
    },
    [currentClient, fetchClientSettings],
  )

  // All form sections configuration
  const formSections = useMemo<Array<SectionConfig<ClientSettingsFormData>>>(
    () => [
      {
        title: 'Basic Information',
        fields: [
          {
            name: 'logoBase64' as const,
            label: 'Upload Logo',
            type: FieldType.Image as FieldType,
            required: false,
            gridSize: {
              xs: 12,
              sm: 12,
            },
            imageSize: 150,
            maxSizeMB: 5,
          },
          {
            name: 'name' as const,
            label: 'Client Name',
            type: FieldType.Text as FieldType,
            required: true,
            disabled: true, // Client name cannot be changed
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'supportEmail' as const,
            label: 'Support Email',
            type: FieldType.Email as FieldType,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'website' as const,
            label: 'Website URL',
            type: FieldType.Text as FieldType,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'description' as const,
            label: 'Description',
            type: FieldType.Textarea as FieldType,
            required: true,
            gridSize: {
              xs: 12,
              sm: 12,
            },
            rows: 4,
            placeholder: 'Enter client description...',
          },
        ],
      },
      {
        title: 'SendGrid Configuration',
        fields: [
          {
            name: 'sendGridApiKey' as const,
            label: 'SendGrid API Key',
            type: FieldType.Password as FieldType,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'sendGridEmailAddress' as const,
            label: 'SendGrid Email Address',
            type: FieldType.Email as FieldType,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'sendgridSenderName' as const,
            label: 'SendGrid Sender Name',
            type: FieldType.Text as FieldType,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
        ],
      },
      {
        title: 'Payment Gateway (Razorpay)',
        fields: [
          {
            name: 'razorpayApiKey' as const,
            label: 'Razorpay API Key',
            type: FieldType.Password as FieldType,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'razorpayApiSecret' as const,
            label: 'Razorpay API Secret',
            type: FieldType.Password as FieldType,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
        ],
      },
      {
        title: 'Image Storage (ImgBB)',
        fields: [
          {
            name: 'imgbbApiKey' as const,
            label: 'ImgBB API Key',
            type: FieldType.Password as FieldType,
            required: false,
            gridSize: {
              xs: 12,
              sm: 12,
            },
          },
        ],
      },
      {
        title: 'Shipping (ShipRocket)',
        fields: [
          {
            name: 'shipRocketEmail' as const,
            label: 'ShipRocket Email',
            type: FieldType.Email as FieldType,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'shipRocketPassword' as const,
            label: 'ShipRocket Password',
            type: FieldType.Password as FieldType,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
        ],
      },
      {
        title: 'JIRA Integration',
        fields: [
          {
            name: 'jiraUserName' as const,
            label: 'JIRA Username',
            type: FieldType.Text as FieldType,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'jiraPassword' as const,
            label: 'JIRA Password',
            type: FieldType.Password as FieldType,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'jiraProjectUrl' as const,
            label: 'JIRA Project URL',
            type: FieldType.Text as FieldType,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'jiraProjectKey' as const,
            label: 'JIRA Project Key',
            type: FieldType.Text as FieldType,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'issueTypes' as const,
            label: 'Issue Types (comma-separated)',
            type: FieldType.Text as FieldType,
            required: false,
            gridSize: {
              xs: 12,
              sm: 12,
            },
          },
        ],
      },
      {
        title: 'Notes',
        fields: [
          {
            name: 'notes' as const,
            label: 'Notes',
            type: FieldType.Textarea as FieldType,
            required: false,
            gridSize: {
              xs: 12,
              sm: 12,
            },
            rows: 6,
            placeholder: 'Enter any additional notes or comments...',
          },
        ],
      },
    ],
    [],
  )

  return (
    <Container maxWidth="xl">
      {/* Fill Test Data Button */}
      <FillSettingsTestDataButton reset={reset} />

      <form onSubmit={handleFormSubmit(onSubmit)}>
        <Box className={styles['settings-page__container']}>
          {/* All Form Sections */}
          <FormFieldRenderer
            sections={formSections}
            control={control}
            errors={errors}
            disabled={loading}
            isView={false}
            sectionClassName={styles['settings-page__section']}
            sectionTitleClassName={styles['settings-page__section-title']}
            dividerClassName={styles['settings-page__divider']}
            dividerSpacerClassName={styles['settings-page__divider-spacer']}
          />

          {/* Action Buttons */}
          <Paper className={styles['settings-page__section']}>
            <Box className={styles['settings-page__actions']}>
              <BlueButton
                variant="contained"
                startIcon={<SaveIcon />}
                type="submit"
                disabled={loading}
                className={styles['settings-page__action-button']}
                label={loading ? 'Saving...' : 'Save Settings'}
              />
            </Box>
          </Paper>
        </Box>
      </form>
    </Container>
  )
}

export default Settings
