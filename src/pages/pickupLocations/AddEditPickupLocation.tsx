import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Cancel as CancelIcon, Save as SaveIcon } from '@mui/icons-material'
import { Box, Container, Divider, Grid, Paper } from '@mui/material'

import { pickupLocationApi } from '../../api/pickupLocationApi'
import { BlueButton, RedButton } from '../../components/buttons'
import { Subheader } from '../../components/fonts'
import { AddressFormController, FieldType, FormFieldRenderer, type SectionConfig } from '../../components/form'
import { PERMISSIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import { usePermissions } from '../../hooks/usePermissions'
import styles from '../../styles/PickupLocations.module.scss'
import { getCitiesByState, getAllStates } from '../../utils/stateCityMapper'
import {
  pickupLocationFormSchema,
  type PickupLocationFormData,
} from '../../utils/validationSchemas'

import { FillTestDataButton, PickupLocationDetailsView } from './components'

/**
 * Pickup Location Request Model for API
 */
interface PickupLocationRequestModel {
  pickupLocationId?: number
  addressNickName: string
  shipRocketPickupLocationId?: string
  address: {
    streetAddress: string
    streetAddress2?: string
    streetAddress3?: string
    city: string
    state: string
    postalCode: string
    country: string
    addressType: string
    nameOnAddress?: string
    emailOnAddress?: string
    phoneOnAddress?: string
  }
  notes?: string
}

/**
 * Pickup Location Response Model from API
 */
interface PickupLocationResponseModel {
  pickupLocationId: number
  addressNickName: string
  shipRocketPickupLocationId?: string
  address: {
    streetAddress: string
    streetAddress2?: string
    streetAddress3?: string
    city: string
    state: string
    postalCode: string
    country: string
    addressType: string
    nameOnAddress?: string
    emailOnAddress?: string
    phoneOnAddress?: string
  }
  notes?: string
  isDeleted?: boolean
  createdAt?: string
  updatedAt?: string
}

/**
 * Add/Edit/View Pickup Location Page
 * Features:
 * - Create new pickup location
 * - Edit existing pickup location
 * - View pickup location details (read-only)
 * - Address management using AddressFormController
 */
const AddEditPickupLocation = (): React.JSX.Element => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const pickupLocationId = searchParams.get('pickupLocationId')
  const isView = searchParams.has('isView')
  const isEdit = !!pickupLocationId && !isView

  const [loading, setLoading] = useState(false)
  const [selectedState, setSelectedState] = useState<string>('')

  // Get user permissions for authorization
  const { hasPermission } = usePermissions()

  // Use ref to track if permission check has been performed
  const hasCheckedPermissions = useRef(false)
  const hasFetchedDetails = useRef(false)

  // Check permissions on mount and redirect if unauthorized
  useEffect(() => {
    if (hasCheckedPermissions.current) {
      return
    }

    let requiredPermission: string | null = null

    if (isView) {
      requiredPermission = PERMISSIONS.VIEW_PICKUP_LOCATIONS
    } else if (isEdit) {
      requiredPermission = PERMISSIONS.UPDATE_PICKUP_LOCATIONS
    } else {
      requiredPermission = PERMISSIONS.INSERT_PICKUP_LOCATIONS
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      hasCheckedPermissions.current = true
      toast.error('You do not have permission to access this page')
      navigate(APP_ROUTES.DASHBOARD.PICKUP_LOCATIONS, { replace: true })
    } else if (requiredPermission) {
      hasCheckedPermissions.current = true
    }
  }, [hasPermission, isView, isEdit, navigate])

  // Form setup with react-hook-form and Zod validation
  const formMethods = useForm<PickupLocationFormData>({
    resolver: zodResolver(pickupLocationFormSchema),
    defaultValues: {
      addressNickName: '',
      shipRocketPickupLocationId: '',
      address: {
        streetAddress: '',
        streetAddress2: '',
        streetAddress3: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        addressType: 'OFFICE',
        nameOnAddress: '',
        emailOnAddress: '',
        phoneOnAddress: '',
      },
      notes: '',
    },
  })
  const { control, handleSubmit: handleFormSubmit, formState, reset, setValue } = formMethods
  const errors = formState.errors as Record<string, { message?: string } | undefined>

  // Watch all form values for view mode
  const watchedValues: PickupLocationFormData = formMethods.watch()

  // Get states and cities for dropdowns
  const states = useMemo(() => getAllStates(), [])
  const cities = useMemo(() => getCitiesByState(selectedState), [selectedState])

  // Handle state change to update cities
  const handleStateChange = useCallback((state: string) => {
    setSelectedState(state)
  }, [])

  // Fetch pickup location details for edit/view mode
  const fetchPickupLocationDetails = useCallback(async (): Promise<void> => {
    if (!pickupLocationId || hasFetchedDetails.current) {
      return
    }

    setLoading(true)
    hasFetchedDetails.current = true

    try {
      const response = (await pickupLocationApi.getPickupLocationById(
        parseInt(pickupLocationId, 10),
      )) as PickupLocationResponseModel

      // Set selected state for cities dropdown
      if (response.address?.state) {
        setSelectedState(response.address.state)
      }

      // Populate form with existing data
      reset({
        addressNickName: response.addressNickName,
        shipRocketPickupLocationId: response.shipRocketPickupLocationId ?? '',
        address: {
          streetAddress: response.address?.streetAddress ?? '',
          streetAddress2: response.address?.streetAddress2 ?? '',
          streetAddress3: response.address?.streetAddress3 ?? '',
          city: response.address?.city ?? '',
          state: response.address?.state ?? '',
          postalCode: response.address?.postalCode ?? '',
          country: response.address?.country ?? 'India',
          addressType: response.address?.addressType ?? 'OFFICE',
          nameOnAddress: response.address?.nameOnAddress ?? '',
          emailOnAddress: response.address?.emailOnAddress ?? '',
          phoneOnAddress: response.address?.phoneOnAddress ?? '',
        },
        notes: response.notes ?? '',
      })
    } catch {
      toast.error('Failed to fetch pickup location details')
      navigate(APP_ROUTES.DASHBOARD.PICKUP_LOCATIONS, { replace: true })
    } finally {
      setLoading(false)
    }
  }, [pickupLocationId, reset, navigate])

  // Fetch pickup location details on mount (edit/view mode)
  useEffect(() => {
    if (pickupLocationId && !hasFetchedDetails.current) {
      void fetchPickupLocationDetails()
    }
  }, [pickupLocationId, fetchPickupLocationDetails])

  // Form submit handler
  const onSubmit = useCallback(
    async (data: PickupLocationFormData): Promise<void> => {
      setLoading(true)

      try {
        const requestModel: PickupLocationRequestModel = {
          pickupLocationId: isEdit && pickupLocationId ? parseInt(pickupLocationId, 10) : undefined,
          addressNickName: data.addressNickName.trim(),
          shipRocketPickupLocationId: data.shipRocketPickupLocationId?.trim() || undefined,
          address: {
            streetAddress: data.address.streetAddress.trim(),
            streetAddress2: data.address.streetAddress2?.trim() || undefined,
            streetAddress3: data.address.streetAddress3?.trim() || undefined,
            city: data.address.city.trim(),
            state: data.address.state.trim(),
            postalCode: data.address.postalCode.trim(),
            country: data.address.country.trim(),
            addressType: data.address.addressType.trim(),
            nameOnAddress: data.address.nameOnAddress?.trim() || undefined,
            emailOnAddress: data.address.emailOnAddress?.trim() || undefined,
            phoneOnAddress: data.address.phoneOnAddress?.trim() || undefined,
          },
          notes: data.notes?.trim() || undefined,
        }

        if (isEdit && pickupLocationId) {
          await pickupLocationApi.updatePickupLocation(parseInt(pickupLocationId, 10), requestModel)
          toast.success('Pickup location updated successfully')
        } else {
          await pickupLocationApi.createPickupLocation(requestModel)
          toast.success('Pickup location created successfully')
        }

        navigate(APP_ROUTES.DASHBOARD.PICKUP_LOCATIONS)
      } catch {
        toast.error(`Failed to ${isEdit ? 'update' : 'create'} pickup location`)
      } finally {
        setLoading(false)
      }
    },
    [isEdit, pickupLocationId, navigate],
  )

  // Cancel handler
  const handleCancel = (): void => {
    navigate(APP_ROUTES.DASHBOARD.PICKUP_LOCATIONS)
  }

  // Button text based on mode
  const buttonText = useMemo(() => {
    if (loading) return 'Saving...'
    if (isEdit) return 'Update Location'
    return 'Create Location'
  }, [loading, isEdit])

  // Location information section configuration
  const locationInfoSections = useMemo<Array<SectionConfig<PickupLocationFormData>>>(
    () => [
      {
        title: 'Location Information',
        fields: [
          {
            name: 'addressNickName',
            label: 'Location Name',
            type: FieldType.Text,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            placeholder: 'e.g., Main Warehouse, Downtown Store',
          },
          {
            name: 'shipRocketPickupLocationId',
            label: 'ShipRocket Pickup Location ID',
            type: FieldType.Text,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            placeholder: 'External integration ID (optional)',
          },
        ],
      },
    ],
    [],
  )

  // Notes section configuration
  const notesSections = useMemo<Array<SectionConfig<PickupLocationFormData>>>(
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
            rows: 3,
            placeholder: 'Any additional notes about this pickup location (optional)',
          },
        ],
      },
    ],
    [],
  )

  return (
    <Container
      maxWidth={false}
      disableGutters
      className={styles['pickup-locations-page']}
    >
      <form onSubmit={handleFormSubmit(onSubmit)}>
        <Box className={styles['add-pickup-location-page__container']}>
          {isView ? (
            // View mode - display pickup location details
            <PickupLocationDetailsView
              addressNickName={watchedValues.addressNickName}
              shipRocketPickupLocationId={watchedValues.shipRocketPickupLocationId}
              address={watchedValues.address}
              notes={watchedValues.notes}
            />
          ) : (
            // Edit/Add mode - display form
            <>
              {/* Location Information Section */}
              <FormFieldRenderer
                sections={locationInfoSections}
                control={control}
                errors={errors}
                disabled={loading}
                isView={false}
                sectionClassName={styles['add-pickup-location-page__section']}
                sectionTitleClassName={styles['add-pickup-location-page__section-title']}
                dividerClassName={styles['add-pickup-location-page__divider']}
              />

              {/* Address Section */}
              <Paper className={styles['add-pickup-location-page__section']}>
                <Subheader
                  label="Address Details"
                  className={styles['add-pickup-location-page__section-title']}
                />
                <Divider className={styles['add-pickup-location-page__divider']} />
                <Grid container spacing={2}>
                  <AddressFormController
                    control={control}
                    errors={errors}
                    disabled={loading}
                    states={states}
                    cities={cities}
                    onStateChange={handleStateChange}
                    setValue={setValue}
                  />
                </Grid>
              </Paper>

              {/* Notes Section */}
              <FormFieldRenderer
                sections={notesSections}
                control={control}
                errors={errors}
                disabled={loading}
                isView={false}
                sectionClassName={styles['add-pickup-location-page__section']}
                sectionTitleClassName={styles['add-pickup-location-page__section-title']}
                dividerClassName={styles['add-pickup-location-page__divider']}
              />
            </>
          )}

          {/* Action Buttons */}
          {!isView && (
            <Paper className={styles['add-pickup-location-page__section']}>
              <Box className={styles['add-pickup-location-page__actions']}>
                <RedButton
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={loading}
                  className={styles['add-pickup-location-page__action-button']}
                  type="button"
                  label="Cancel"
                />
                <BlueButton
                  variant="contained"
                  startIcon={<SaveIcon />}
                  type="submit"
                  disabled={loading}
                  className={styles['add-pickup-location-page__action-button']}
                  label={buttonText}
                />
              </Box>
            </Paper>
          )}

          {/* View mode - Back button */}
          {isView && (
            <Paper className={styles['add-pickup-location-page__section']}>
              <Box className={styles['add-pickup-location-page__actions']}>
                <BlueButton
                  variant="contained"
                  onClick={handleCancel}
                  className={styles['add-pickup-location-page__action-button']}
                  label="Back to Pickup Locations"
                />
              </Box>
            </Paper>
          )}
        </Box>
      </form>

      {/* Fill Test Data Button - Only show in add/edit mode */}
      {!isView && (
        <FillTestDataButton
          setValue={setValue}
          reset={reset}
          isEdit={isEdit}
          currentName={watchedValues.addressNickName}
        />
      )}
    </Container>
  )
}

export default AddEditPickupLocation

