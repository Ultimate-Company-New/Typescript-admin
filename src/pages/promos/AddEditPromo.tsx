import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Cancel as CancelIcon, Save as SaveIcon } from '@mui/icons-material'
import { Box, Container, Paper } from '@mui/material'

import { promoApi } from '../../api/promoApi'
import { BlueButton, RedButton } from '../../components/buttons'
import { FieldType, FormFieldRenderer, type SectionConfig } from '../../components/form'
import { PERMISSIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import { usePermissions } from '../../hooks/usePermissions'
import type { PromoRequestModel, PromoResponseModel } from '../../models/api-models'
import styles from '../../styles/Promos.module.scss'
import { promoFormSchema, type PromoFormData } from '../../utils/validationSchemas'

import { FillTestDataButton, PromoDetailsView } from './components'

/**
 * Add/View Promo Page
 * Features:
 * - Create new promo
 * - View promo details (read-only)
 * - Promo code, discount value, type selection, expiry date
 * Note: Promos cannot be edited after creation - only view or deactivate
 */
const AddEditPromo = (): React.JSX.Element => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const promoId = searchParams.get('promoId')
  const isView = searchParams.has('isView')

  const [loading, setLoading] = useState(false)

  // Get user permissions for authorization
  const { hasPermission } = usePermissions()

  // Use ref to track if permission check has been performed
  const hasCheckedPermissions = useRef(false)
  const hasFetchedPromoDetails = useRef(false)

  // Check permissions on mount and redirect if unauthorized
  useEffect(() => {
    if (hasCheckedPermissions.current) {
      return
    }

    // If promoId exists without isView, redirect to view mode (promos cannot be edited)
    if (promoId && !isView) {
      hasCheckedPermissions.current = true
      toast.info('Promos cannot be edited after creation. Redirecting to view mode.')
      navigate(`${APP_ROUTES.DASHBOARD.ADD_PROMO}?promoId=${promoId}&isView`, { replace: true })
      return
    }

    let requiredPermission: string | null = null

    if (isView) {
      requiredPermission = PERMISSIONS.VIEW_PROMOS
    } else {
      requiredPermission = PERMISSIONS.INSERT_PROMOS
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      hasCheckedPermissions.current = true
      toast.error('You do not have permission to access this page')
      navigate(APP_ROUTES.DASHBOARD.PROMOS, { replace: true })
    } else if (requiredPermission) {
      hasCheckedPermissions.current = true
    }
  }, [hasPermission, isView, promoId, navigate])

  // Form setup with react-hook-form and Zod validation
  const formMethods = useForm<PromoFormData>({
    resolver: zodResolver(promoFormSchema),
    defaultValues: {
      promoCode: '',
      description: '',
      discountValue: 0,
      isPercent: false,
      notes: '',
      startDate: '',
      expiryDate: '',
    },
  })
  const { control, handleSubmit: handleFormSubmit, formState, reset, setValue } = formMethods
  const errors = formState.errors as Record<string, { message?: string } | undefined>

  // Watch all form values for view mode
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const watchedValues: PromoFormData = formMethods.watch()

  // Fetch promo details for edit/view mode
  const fetchPromoDetails = useCallback(async (): Promise<void> => {
    if (!promoId || hasFetchedPromoDetails.current) {
      return
    }

    setLoading(true)
    hasFetchedPromoDetails.current = true

    try {
      const response: PromoResponseModel = await promoApi.getPromoById(parseInt(promoId, 10))

      /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
      // Populate form with existing data - values are typed correctly via PromoResponseModel
      reset({
        promoCode: response.promoCode,
        description: response.description,
        discountValue: response.discountValue,
        isPercent: response.isPercent,
        notes: response.notes ?? '',
        startDate: response.startDate ?? '',
        expiryDate: response.expiryDate ?? '',
      })
      /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
    } catch {
      toast.error('Failed to fetch promo details')
      navigate(APP_ROUTES.DASHBOARD.PROMOS, { replace: true })
    } finally {
      setLoading(false)
    }
  }, [promoId, reset, navigate])

  // Fetch promo details on mount (edit/view mode)
  useEffect(() => {
    if (promoId && !hasFetchedPromoDetails.current) {
      void fetchPromoDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promoId])

  // Form submit handler
  const onSubmit = useCallback(
    async (data: PromoFormData): Promise<void> => {
      setLoading(true)

      try {
        /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
        const requestModel: PromoRequestModel = {
          promoCode: data.promoCode.toUpperCase(),
          description: data.description,
          discountValue: data.discountValue,
          isPercent: data.isPercent,
          notes: data.notes ?? '',
          startDate: data.startDate,
          expiryDate: data.expiryDate || undefined,
        }
        /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

        // Create new promo (promos cannot be edited after creation)
        await promoApi.createPromo(requestModel)
        toast.success('Promo created successfully')

        navigate(APP_ROUTES.DASHBOARD.PROMOS)
      } catch {
        toast.error('Failed to create promo')
      } finally {
        setLoading(false)
      }
    },
    [navigate],
  )

  // Cancel handler
  const handleCancel = (): void => {
    navigate(APP_ROUTES.DASHBOARD.PROMOS)
  }

  // Button text based on mode
  const buttonText = useMemo(() => {
    if (loading) return 'Saving...'
    return 'Create Promo'
  }, [loading])

  // Form sections configuration
  const formSections = useMemo<Array<SectionConfig<PromoFormData>>>(
    () => [
      {
        title: 'Promo Details',
        fields: [
          {
            name: 'promoCode',
            label: 'Promo Code',
            type: FieldType.Text,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            placeholder: 'e.g., SUMMER2024, WELCOME10',
          },
          {
            name: 'discountValue',
            label: 'Discount Value',
            type: FieldType.Number,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            placeholder: 'e.g., 10 (for 10% or $10)',
          },
          {
            name: 'startDate',
            label: 'Start Date',
            type: FieldType.Date,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            placeholder: 'When promo becomes active',
          },
          {
            name: 'expiryDate',
            label: 'Expiry Date',
            type: FieldType.Date,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            placeholder: 'When promo expires (optional)',
          },
          {
            name: 'isPercent',
            label: 'Is Percent',
            type: FieldType.Switch as FieldType,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            switchLabel: 'Percentage Discount',
            switchLabelPlacement: 'end',
          },
          {
            name: 'description',
            label: 'Description',
            type: FieldType.Textarea,
            required: true,
            gridSize: {
              xs: 12,
              sm: 12,
            },
            rows: 3,
            placeholder: 'Describe the promo offer and terms',
          },
        ],
      },
    ],
    [],
  )

  // Notes section configuration
  const notesSections = useMemo<Array<SectionConfig<PromoFormData>>>(
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
            placeholder: 'Any additional notes or internal comments about this promo (optional)',
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
      sx={{
        px: {
          xs: 2,
          sm: 3,
          md: 4,
        },
      }}
    >
      {/* Fill Test Data Button - Only show in development/non-view mode */}
      {!isView && (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        <FillTestDataButton setValue={setValue} isEditMode={false} currentPromoCode={undefined} />
      )}

      <form onSubmit={handleFormSubmit(onSubmit)}>
        <Box className={styles['add-promos-page__container']}>
          {isView ? (
            // View mode - display promo details
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            <PromoDetailsView watchedValues={watchedValues} />
          ) : (
            // Edit/Add mode - display form using FormFieldRenderer
            <>
              {/* Promo Details Section */}
              <FormFieldRenderer
                sections={formSections}
                control={control}
                errors={errors}
                disabled={loading}
                isView={false}
                sectionClassName={styles['add-promos-page__section']}
                sectionTitleClassName={styles['add-promos-page__section-title']}
                dividerClassName={styles['add-promos-page__divider']}
              />

              {/* Notes Section */}
              <FormFieldRenderer
                sections={notesSections}
                control={control}
                errors={errors}
                disabled={loading}
                isView={false}
                sectionClassName={styles['add-promos-page__section']}
                sectionTitleClassName={styles['add-promos-page__section-title']}
                dividerClassName={styles['add-promos-page__divider']}
              />
            </>
          )}

          {/* Action Buttons */}
          {!isView && (
            <Paper className={styles['add-promos-page__section']}>
              <Box className={styles['add-promos-page__actions']}>
                <RedButton
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={loading}
                  className={styles['add-promos-page__action-button']}
                  type="button"
                  label="Cancel"
                />
                <BlueButton
                  variant="contained"
                  startIcon={<SaveIcon />}
                  type="submit"
                  disabled={loading}
                  className={styles['add-promos-page__action-button']}
                  label={buttonText}
                />
              </Box>
            </Paper>
          )}

          {/* View mode - Back button */}
          {isView && (
            <Paper className={styles['add-promos-page__section']}>
              <Box className={styles['add-promos-page__actions']}>
                <BlueButton
                  variant="contained"
                  onClick={handleCancel}
                  className={styles['add-promos-page__action-button']}
                  label="Back to Promos"
                />
              </Box>
            </Paper>
          )}
        </Box>
      </form>
    </Container>
  )
}

export default AddEditPromo
