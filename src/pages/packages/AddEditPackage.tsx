import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Cancel as CancelIcon, Save as SaveIcon } from '@mui/icons-material'
import { Box, Container, Paper } from '@mui/material'

import { packageApi } from '../../api/packageApi'
import { BlueButton, RedButton } from '../../components/buttons'
import { FieldType, FormFieldRenderer, type SectionConfig } from '../../components/form'
import { PERMISSIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import { usePermissions } from '../../hooks/usePermissions'
import styles from '../../styles/Packages.module.scss'
import {
  PACKAGE_TYPE_OPTIONS,
  packageFormSchema,
  type PackageFormData,
} from '../../utils/validationSchemas'

import { FillTestDataButton, PackageDetailsView } from './components'

/**
 * Package response model from API
 */
interface PackageResponseModel {
  packageId: number
  packageName: string
  length: number
  breadth: number
  height: number
  maxWeight: number
  standardCapacity: number
  pricePerUnit: number
  packageType: string
  notes?: string
  isDeleted?: boolean
}

/**
 * Package request model for API
 */
interface PackageRequestModel {
  packageId?: number
  packageName: string
  length: number
  breadth: number
  height: number
  maxWeight: number
  standardCapacity: number
  pricePerUnit: number
  packageType: string
  notes?: string
}

/**
 * Add/Edit Package Page
 * Features:
 * - Create new package
 * - Edit existing package
 * - View package details (read-only)
 * - Package dimensions and pricing
 * - Package type selection
 */
const AddEditPackage = (): React.JSX.Element => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const packageId = searchParams.get('packageId')
  const isView = searchParams.has('isView')
  const isEdit = !!packageId && !isView

  const [loading, setLoading] = useState(false)

  // Get user permissions for authorization
  const { hasPermission } = usePermissions()

  // Use ref to track if permission check has been performed
  const hasCheckedPermissions = useRef(false)
  const hasFetchedPackageDetails = useRef(false)

  // Check permissions on mount and redirect if unauthorized
  useEffect(() => {
    if (hasCheckedPermissions.current) {
      return
    }

    let requiredPermission: string | null = null

    if (isView) {
      requiredPermission = PERMISSIONS.VIEW_PACKAGES
    } else if (isEdit) {
      requiredPermission = PERMISSIONS.UPDATE_PACKAGES
    } else {
      requiredPermission = PERMISSIONS.INSERT_PACKAGES
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      hasCheckedPermissions.current = true
      toast.error('You do not have permission to access this page')
      navigate(APP_ROUTES.DASHBOARD.PACKAGES, { replace: true })
    } else if (requiredPermission) {
      hasCheckedPermissions.current = true
    }
  }, [hasPermission, isView, isEdit, navigate])

  // Form setup with react-hook-form and Zod validation
  const formMethods = useForm<PackageFormData>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      packageName: '',
      length: 0,
      breadth: 0,
      height: 0,
      maxWeight: 0,
      standardCapacity: 5,
      pricePerUnit: 0,
      packageType: 'STANDARD',
      notes: '',
    },
  })
  const { control, handleSubmit: handleFormSubmit, formState, reset, setValue } = formMethods
  const errors = formState.errors as Record<string, { message?: string } | undefined>

  // Watch all form values for view mode
  const watchedValues: PackageFormData = formMethods.watch()

  // Fetch package details for edit/view mode
  const fetchPackageDetails = useCallback(async (): Promise<void> => {
    if (!packageId || hasFetchedPackageDetails.current) {
      return
    }

    setLoading(true)
    hasFetchedPackageDetails.current = true

    try {
      const response = (await packageApi.getPackageById(parseInt(packageId, 10))) as PackageResponseModel

      // Populate form with existing data
      reset({
        packageName: response.packageName,
        length: response.length,
        breadth: response.breadth,
        height: response.height,
        maxWeight: response.maxWeight,
        standardCapacity: response.standardCapacity,
        pricePerUnit: response.pricePerUnit,
        packageType: response.packageType as PackageFormData['packageType'],
        notes: response.notes ?? '',
      })
    } catch {
      toast.error('Failed to fetch package details')
      navigate(APP_ROUTES.DASHBOARD.PACKAGES, { replace: true })
    } finally {
      setLoading(false)
    }
  }, [packageId, reset, navigate])

  // Fetch package details on mount (edit/view mode)
  useEffect(() => {
    if (packageId && !hasFetchedPackageDetails.current) {
      void fetchPackageDetails()
    }
  }, [packageId, fetchPackageDetails])

  // Form submit handler
  const onSubmit = useCallback(
    async (data: PackageFormData): Promise<void> => {
      setLoading(true)

      try {
        const requestModel: PackageRequestModel = {
          packageId: isEdit && packageId ? parseInt(packageId, 10) : undefined,
          packageName: data.packageName.trim(),
          length: data.length,
          breadth: data.breadth,
          height: data.height,
          maxWeight: data.maxWeight,
          standardCapacity: data.standardCapacity,
          pricePerUnit: data.pricePerUnit,
          packageType: data.packageType,
          notes: data.notes?.trim() || undefined,
        }

        if (isEdit && packageId) {
          await packageApi.updatePackage(parseInt(packageId, 10), requestModel)
          toast.success('Package updated successfully')
        } else {
          await packageApi.createPackage(requestModel)
          toast.success('Package created successfully')
        }

        navigate(APP_ROUTES.DASHBOARD.PACKAGES)
      } catch {
        toast.error(`Failed to ${isEdit ? 'update' : 'create'} package`)
      } finally {
        setLoading(false)
      }
    },
    [isEdit, packageId, navigate],
  )

  // Cancel handler
  const handleCancel = (): void => {
    navigate(APP_ROUTES.DASHBOARD.PACKAGES)
  }

  // Button text based on mode
  const buttonText = useMemo(() => {
    if (loading) return 'Saving...'
    if (isEdit) return 'Update Package'
    return 'Create Package'
  }, [loading, isEdit])

  // Convert package type options to form field options
  const packageTypeOptions = useMemo(
    () =>
      PACKAGE_TYPE_OPTIONS.map(opt => ({
        value: opt.value,
        label: opt.label,
      })),
    [],
  )

  // Form sections configuration
  const formSections = useMemo<Array<SectionConfig<PackageFormData>>>(
    () => [
      {
        title: 'Package Details',
        fields: [
          {
            name: 'packageName',
            label: 'Package Name',
            type: FieldType.Text,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            placeholder: 'e.g., Small Box, Large Envelope',
          },
          {
            name: 'packageType',
            label: 'Package Type',
            type: FieldType.Autocomplete,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            options: packageTypeOptions,
            placeholder: 'Select package type',
          },
        ],
      },
      {
        title: 'Dimensions',
        fields: [
          {
            name: 'length',
            label: 'Length (cm)',
            type: FieldType.Number,
            required: true,
            gridSize: {
              xs: 12,
              sm: 4,
            },
            placeholder: 'Length in cm',
          },
          {
            name: 'breadth',
            label: 'Breadth (cm)',
            type: FieldType.Number,
            required: true,
            gridSize: {
              xs: 12,
              sm: 4,
            },
            placeholder: 'Breadth in cm',
          },
          {
            name: 'height',
            label: 'Height (cm)',
            type: FieldType.Number,
            required: true,
            gridSize: {
              xs: 12,
              sm: 4,
            },
            placeholder: 'Height in cm',
          },
          {
            name: 'maxWeight',
            label: 'Max Weight (kg)',
            type: FieldType.Number,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            placeholder: 'Maximum weight capacity',
          },
          {
            name: 'standardCapacity',
            label: 'Standard Capacity (items)',
            type: FieldType.Number,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            placeholder: 'Number of items this package holds',
          },
        ],
      },
      {
        title: 'Pricing',
        fields: [
          {
            name: 'pricePerUnit',
            label: 'Price Per Unit (₹)',
            type: FieldType.Number,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            placeholder: 'Cost per package unit',
          },
        ],
      },
    ],
    [packageTypeOptions],
  )

  // Notes section configuration
  const notesSections = useMemo<Array<SectionConfig<PackageFormData>>>(
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
            placeholder: 'Any additional notes about this package (optional)',
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
      className={styles['packages-page']}
    >
      {/* Fill Test Data Button - Only show in development/non-view mode */}
      {!isView && (
        <FillTestDataButton setValue={setValue} reset={reset} isEdit={isEdit} />
      )}

      <form onSubmit={handleFormSubmit(onSubmit)}>
        <Box className={styles['add-packages-page__container']}>
          {isView ? (
            // View mode - display package details
            <PackageDetailsView
              packageName={watchedValues.packageName}
              length={watchedValues.length}
              breadth={watchedValues.breadth}
              height={watchedValues.height}
              maxWeight={watchedValues.maxWeight}
              standardCapacity={watchedValues.standardCapacity}
              pricePerUnit={watchedValues.pricePerUnit}
              packageType={watchedValues.packageType}
              notes={watchedValues.notes}
            />
          ) : (
            // Edit/Add mode - display form using FormFieldRenderer
            <>
              {/* Package Details, Dimensions, and Pricing Sections */}
              <FormFieldRenderer
                sections={formSections}
                control={control}
                errors={errors}
                disabled={loading}
                isView={false}
                sectionClassName={styles['add-packages-page__section']}
                sectionTitleClassName={styles['add-packages-page__section-title']}
                dividerClassName={styles['add-packages-page__divider']}
              />

              {/* Notes Section */}
              <FormFieldRenderer
                sections={notesSections}
                control={control}
                errors={errors}
                disabled={loading}
                isView={false}
                sectionClassName={styles['add-packages-page__section']}
                sectionTitleClassName={styles['add-packages-page__section-title']}
                dividerClassName={styles['add-packages-page__divider']}
              />
            </>
          )}

          {/* Action Buttons */}
          {!isView && (
            <Paper className={styles['add-packages-page__section']}>
              <Box className={styles['add-packages-page__actions']}>
                <RedButton
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={loading}
                  className={styles['add-packages-page__action-button']}
                  type="button"
                  label="Cancel"
                />
                <BlueButton
                  variant="contained"
                  startIcon={<SaveIcon />}
                  type="submit"
                  disabled={loading}
                  className={styles['add-packages-page__action-button']}
                  label={buttonText}
                />
              </Box>
            </Paper>
          )}

          {/* View mode - Back button */}
          {isView && (
            <Paper className={styles['add-packages-page__section']}>
              <Box className={styles['add-packages-page__actions']}>
                <BlueButton
                  variant="contained"
                  onClick={handleCancel}
                  className={styles['add-packages-page__action-button']}
                  label="Back to Packages"
                />
              </Box>
            </Paper>
          )}
        </Box>
      </form>
    </Container>
  )
}

export default AddEditPackage

