import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Cancel as CancelIcon, Save as SaveIcon } from '@mui/icons-material'
import { Box, Container, Divider, Paper } from '@mui/material'

import { leadApi } from '../../api/leadApi'
import { userApi } from '../../api/userApi'
import { BlueButton, RedButton } from '../../components/buttons'
import { BodyText, Subheader } from '../../components/fonts'
import {
  AddressDetailsView,
  FormFieldRenderer,
  type FieldOption,
  type LazyFetchFunction,
  type LazyOption,
  type SectionConfig,
} from '../../components/form'
import { FieldType } from '../../components/form/FormFieldRenderer'
import { LEAD_STATUS_OPTIONS, PERMISSIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import { usePermissions } from '../../hooks/usePermissions'
import {
  type LeadDetailsResponseModel,
  type LeadRequestModel,
  type UserResponseModel,
} from '../../models/api-models'
import styles from '../../styles/Leads.module.scss'
import { getAllStates, getCitiesByState } from '../../utils/stateCityMapper'
import { leadFormSchema, type LeadFormData } from '../../utils/validationSchemas'

import { FillTestDataButton, LeadDetailsView } from './components'

/**
 * Add/Edit Lead Page
 * Features:
 * - Create new lead
 * - Edit existing lead
 * - View lead details (read-only)
 * - Lead information section
 * - Address details section
 * - Assigned agent selection with lazy loading
 */
const AddEditLead = (): React.JSX.Element => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const leadId = searchParams.get('leadId')
  const isView = searchParams.has('isView')
  const isEdit = !!leadId && !isView

  const [loading, setLoading] = useState(false)
  const [selectedState, setSelectedState] = useState<string>('')
  // Initial option for assigned agent dropdown (for edit mode)
  const [initialAgentOption, setInitialAgentOption] = useState<LazyOption | undefined>(undefined)

  // Get user permissions for authorization
  const { hasPermission } = usePermissions()

  // Use ref to track if permission check has been performed
  const hasCheckedPermissions = useRef(false)
  const hasFetchedLeadDetails = useRef(false)

  // Check permissions on mount and redirect if unauthorized
  useEffect(() => {
    if (hasCheckedPermissions.current) {
      return
    }

    let requiredPermission: string | null = null

    if (isView) {
      requiredPermission = PERMISSIONS.VIEW_LEADS
    } else if (isEdit) {
      requiredPermission = PERMISSIONS.UPDATE_LEADS
    } else {
      requiredPermission = PERMISSIONS.INSERT_LEADS
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      hasCheckedPermissions.current = true
      toast.error('You do not have permission to access this page')
      navigate(APP_ROUTES.DASHBOARD.LEADS, { replace: true })
    } else if (requiredPermission) {
      hasCheckedPermissions.current = true
    }
  }, [hasPermission, isView, isEdit, navigate])

  // Form setup with react-hook-form and Zod validation
  const formMethods = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      leadStatus: 'Not Contacted',
      company: '',
      companySize: '',
      annualRevenue: '',
      title: '',
      website: '',
      fax: '',
      assignedAgentId: '',
      address: {
        streetAddress: '',
        streetAddress2: '',
        streetAddress3: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        addressType: 'OFFICE',
      },
      notes: '',
    },
  })
  const { control, handleSubmit: handleFormSubmit, formState, reset, setValue, getValues, watch } = formMethods
  const errors = formState.errors as Record<string, { message?: string } | undefined>

  // Watch all form values for view mode
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const watchedValues = watch()

  // Get all states from stateCityMapper
  const allStates = useMemo(() => getAllStates(), [])

  // Get cities for selected state - sorted A-Z
  const citiesForState = useMemo(() => {
    if (!selectedState || typeof selectedState !== 'string') return []
    const cities = getCitiesByState(selectedState)
    return [...cities].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
  }, [selectedState])

  // Convert readonly LEAD_STATUS_OPTIONS to mutable FieldOption[]
  const leadStatusOptions = useMemo<FieldOption[]>(() => {
    const options: FieldOption[] = []
    for (const opt of LEAD_STATUS_OPTIONS) {
      /* eslint-disable @typescript-eslint/no-unsafe-member-access */
      options.push({
        value: opt.value as string,
        label: opt.label as string,
      })
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
    }
    return options
  }, [])

  /**
   * Fetch function for lazy loading users (assigned agents)
   * Fetches users in batches of 10, supports server-side search by firstName, lastName, or loginName
   */
  const fetchAgentOptions: LazyFetchFunction = useCallback(
    async (searchText: string, start: number, pageSize: number) => {
      try {
        // Build filter if search text is provided
        const filters = searchText
          ? [
              { column: 'firstName', operator: 'contains', value: searchText },
              { column: 'lastName', operator: 'contains', value: searchText },
              { column: 'loginName', operator: 'contains', value: searchText },
            ]
          : undefined

        const response = await userApi.fetchUsersInCarrierInBatches({
          start,
          end: start + pageSize,
          pageSize,
          includeDeleted: false,
          logicOperator: searchText ? 'OR' : undefined,
          filters,
        })

        const users = response.data as UserResponseModel[]
        const totalCount = response.totalDataCount

        // Map users to LazyOption format
        const options: LazyOption[] = users.map(user => ({
          value: user.userId,
          label: `${user.firstName} ${user.lastName} (${user.loginName})`,
        }))

        return {
          options,
          hasMore: start + options.length < totalCount,
          totalCount,
        }
      } catch {
        return {
          options: [],
          hasMore: false,
          totalCount: 0,
        }
      }
    },
    [],
  )

  /**
   * Fetch lead details if editing or viewing
   */
  const fetchLeadDetails = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true)
      try {
        const response: LeadDetailsResponseModel = await leadApi.getLeadById(parseInt(id))

        // Set the selected state FIRST so cities can be loaded
        // Backend returns flat structure - address is nested under response.address
        const leadState = response.address?.state ?? ''
        if (leadState) {
          setSelectedState(leadState)
        }

        const leadCity = response.address?.city ?? ''

        // Set initial agent option if assigned agent exists
        if (response.assignedAgent) {
          const agent = response.assignedAgent
          setInitialAgentOption({
            value: agent.userId,
            label: `${agent.firstName} ${agent.lastName} (${agent.loginName})`,
          })
        }

        // Backend returns flat LeadResponseModel structure
        const formValues: LeadFormData = {
          firstName: response.firstName,
          lastName: response.lastName,
          email: response.email,
          phone: response.phone,
          leadStatus: response.leadStatus || 'Not Contacted',
          company: response.company ?? '',
          companySize: response.companySize ?? '',
          annualRevenue: response.annualRevenue ?? '',
          title: response.title ?? '',
          website: response.website ?? '',
          fax: response.fax ?? '',
          assignedAgentId: response.assignedAgent?.userId ?? '',
          address: {
            streetAddress: response.address?.streetAddress ?? '',
            streetAddress2: response.address?.streetAddress2 ?? '',
            streetAddress3: response.address?.streetAddress3 ?? '',
            city: '', // Set to empty initially, will be set after cities load
            state: leadState,
            postalCode: response.address?.postalCode ?? '',
            country: response.address?.country ?? 'India',
            addressType: response.address?.addressType ?? 'OFFICE',
          },
          notes: response.notes ?? '',
        }
        reset(formValues)

        // Set the city after a small delay to ensure the cities dropdown is populated
        if (leadCity) {
          setTimeout(() => {
            setValue('address.city', leadCity)
          }, 100)
        }

        toast.success('Lead details loaded successfully')
      } catch {
        toast.error('Failed to fetch lead details')
      } finally {
        setLoading(false)
      }
    },
    [reset, setValue],
  )

  /**
   * Handle form submission
   * Maps form data to LeadRequestModel and calls create/update API
   */
  const onSubmit = useCallback(
    async (formData: LeadFormData): Promise<void> => {
      setLoading(true)
      try {
        /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
        const requestData: LeadRequestModel = {
          leadId: isEdit && leadId ? parseInt(leadId) : undefined,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          leadStatus: formData.leadStatus,
          company: formData.company || undefined,
          companySize: typeof formData.companySize === 'number' ? formData.companySize : undefined,
          annualRevenue: formData.annualRevenue || undefined,
          title: formData.title || undefined,
          website: formData.website || undefined,
          fax: formData.fax || undefined,
          assignedAgentId: typeof formData.assignedAgentId === 'number' ? formData.assignedAgentId : undefined,
          address: {
            streetAddress: formData.address.streetAddress,
            streetAddress2: formData.address.streetAddress2 || undefined,
            streetAddress3: formData.address.streetAddress3 || undefined,
            city: formData.address.city,
            state: formData.address.state,
            postalCode: formData.address.postalCode,
            country: formData.address.country,
            addressType: formData.address.addressType,
          },
          notes: formData.notes || undefined,
        }
        /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

        if (isEdit && leadId) {
          await leadApi.updateLead(parseInt(leadId), requestData)
          toast.success('Lead updated successfully')
        } else {
          await leadApi.createLead(requestData)
          toast.success('Lead created successfully')
        }

        // Navigate back to leads grid
        setTimeout(() => {
          navigate(APP_ROUTES.DASHBOARD.LEADS)
        }, 1000)
      } catch {
        toast.error(`Failed to ${isEdit ? 'update' : 'create'} lead`)
      } finally {
        setLoading(false)
      }
    },
    [isEdit, leadId, navigate],
  )

  /**
   * Handle cancel
   */
  const handleCancel = useCallback((): void => {
    navigate(APP_ROUTES.DASHBOARD.LEADS)
  }, [navigate])

  // Fetch lead details on mount if editing or viewing
  useEffect(() => {
    if (leadId && !hasFetchedLeadDetails.current) {
      hasFetchedLeadDetails.current = true
      void fetchLeadDetails(leadId)
    }
  }, [fetchLeadDetails, leadId])

  // Compute button text
  const buttonText = useMemo((): string => {
    if (loading) return 'Saving...'
    if (isEdit) return 'Update Lead'
    return 'Create Lead'
  }, [loading, isEdit])

  // Form sections configuration
  const formSections = useMemo<Array<SectionConfig<LeadFormData>>>(
    () => [
      {
        title: 'Lead Details',
        fields: [
          {
            name: 'firstName',
            label: 'First Name',
            type: FieldType.Text,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'lastName',
            label: 'Last Name',
            type: FieldType.Text,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'email',
            label: 'Email',
            type: FieldType.Email,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'phone',
            label: 'Phone',
            type: FieldType.Phone,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'leadStatus',
            label: 'Lead Status',
            type: FieldType.Autocomplete,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            options: leadStatusOptions,
          },
          {
            name: 'title',
            label: 'Title',
            type: FieldType.Text,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'assignedAgentId',
            label: 'Assigned Agent',
            type: FieldType.LazyAutocomplete,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            fetchOptions: fetchAgentOptions,
            lazyPageSize: 10,
            lazyDebounceMs: 300,
            initialOption: initialAgentOption,
          },
        ],
      },
      {
        title: 'Company Details',
        fields: [
          {
            name: 'company',
            label: 'Company',
            type: FieldType.Text,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'companySize',
            label: 'Company Size',
            type: FieldType.Number,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'annualRevenue',
            label: 'Annual Revenue',
            type: FieldType.Text,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'website',
            label: 'Website',
            type: FieldType.Text,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            placeholder: 'https://example.com',
          },
          {
            name: 'fax',
            label: 'Fax',
            type: FieldType.Phone,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
        ],
      },
      {
        title: 'Address Details',
        fields: [
          {
            name: 'address',
            label: 'Address Details',
            type: FieldType.Address,
            required: true,
            gridSize: {
              xs: 12,
              sm: 12,
            },
            states: allStates,
            cities: citiesForState,
            onStateChange: setSelectedState,
            setValue: setValue,
          },
        ],
      },
    ],
    [leadStatusOptions, allStates, citiesForState, setValue, fetchAgentOptions, initialAgentOption],
  )

  // Notes section configuration
  const notesSections = useMemo<Array<SectionConfig<LeadFormData>>>(
    () => [
      {
        title: 'Notes',
        fields: [
          {
            name: 'notes',
            label: 'Notes',
            type: FieldType.Textarea,
            required: false,
            gridSize: {
              xs: 12,
              sm: 12,
            },
            rows: 4,
            placeholder: 'Enter any additional notes or comments...',
          },
        ],
      },
    ],
    [],
  )

  // Get assigned agent name for view mode
  const assignedAgentName = useMemo(() => {
    // Use initialAgentOption if available (for edit mode)
    if (initialAgentOption) {
      return initialAgentOption.label
    }
    return undefined
  }, [initialAgentOption])

  // Get view mode values from watched values
  const viewCompanySize = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const size = watchedValues.companySize
    return typeof size === 'number' ? size : undefined
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  }, [watchedValues.companySize])

  return (
    <>
      {/* Test Data Button - Only show in development and not in view mode */}
      {import.meta.env.DEV && !isView && (
        <FillTestDataButton
          reset={reset}
          getValues={getValues}
          setValue={setValue}
          setSelectedState={setSelectedState}
          setInitialAgentOption={setInitialAgentOption}
          isEdit={isEdit}
        />
      )}

      <Container
        maxWidth={false}
        disableGutters
        sx={{
          px: {
            xs: 2,
            sm: 3,
            md: 4,
          },
        }}
      >
        <form onSubmit={handleFormSubmit(onSubmit)}>
          <Box className={styles['add-leads-page__container']}>
            {/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */}
            {isView ? (
              <>
                {/* View Mode - Lead Information */}
                <LeadDetailsView
                  firstName={watchedValues.firstName}
                  lastName={watchedValues.lastName}
                  email={watchedValues.email}
                  phone={watchedValues.phone}
                  leadStatus={watchedValues.leadStatus}
                  company={watchedValues.company}
                  companySize={viewCompanySize}
                  annualRevenue={watchedValues.annualRevenue}
                  title={watchedValues.title}
                  website={watchedValues.website}
                  fax={watchedValues.fax}
                  assignedAgent={assignedAgentName}
                />

                {/* View Mode - Address Details */}
                <AddressDetailsView
                  streetAddress={watchedValues.address?.streetAddress ?? ''}
                  streetAddress2={watchedValues.address?.streetAddress2}
                  streetAddress3={watchedValues.address?.streetAddress3}
                  city={watchedValues.address?.city ?? ''}
                  state={watchedValues.address?.state ?? ''}
                  postalCode={watchedValues.address?.postalCode ?? ''}
                  country={watchedValues.address?.country ?? ''}
                  addressType={watchedValues.address?.addressType ?? ''}
                />

                {/* View Mode - Notes Section (after Address) */}
                {watchedValues.notes && (
                  <Paper className={styles['add-leads-page__section']}>
                    <Subheader label="Notes" className={styles['add-leads-page__section-title']} />
                    <Divider className={styles['add-leads-page__divider']} />
                    <Box className={styles['add-leads-page__divider-spacer']} />
                    <BodyText className={styles['lead-details-view__notes']}>{watchedValues.notes}</BodyText>
                  </Paper>
                )}
              </>
            ) : (
              /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
              <>
                {/* Edit/Add Mode - Lead Information and Address Sections */}
                <FormFieldRenderer
                  sections={formSections}
                  control={control}
                  errors={errors}
                  disabled={loading}
                  isView={false}
                  sectionClassName={styles['add-leads-page__section']}
                  sectionTitleClassName={styles['add-leads-page__section-title']}
                  dividerClassName={styles['add-leads-page__divider']}
                />

                {/* Notes Section */}
                <FormFieldRenderer
                  sections={notesSections}
                  control={control}
                  errors={errors}
                  disabled={loading}
                  isView={false}
                  sectionClassName={styles['add-leads-page__section']}
                  sectionTitleClassName={styles['add-leads-page__section-title']}
                  dividerClassName={styles['add-leads-page__divider']}
                />
              </>
            )}

            {/* Action Buttons */}
            {!isView && (
              <Paper className={styles['add-leads-page__section']}>
                <Box className={styles['add-leads-page__actions']}>
                  <RedButton
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={loading}
                    className={styles['add-leads-page__action-button']}
                    type="button"
                    label="Cancel"
                  />
                  <BlueButton
                    variant="contained"
                    startIcon={<SaveIcon />}
                    type="submit"
                    disabled={loading}
                    className={styles['add-leads-page__action-button']}
                    label={buttonText}
                  />
                </Box>
              </Paper>
            )}
          </Box>
        </form>
      </Container>
    </>
  )
}

export default AddEditLead
