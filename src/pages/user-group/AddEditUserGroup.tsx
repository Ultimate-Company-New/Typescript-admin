import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Cancel as CancelIcon, Save as SaveIcon } from '@mui/icons-material'
import { Box, Container, Paper } from '@mui/material'

import { userGroupApi, type UserGroupRequestModel } from '../../api/userGroupApi'
import { BlueButton, RedButton } from '../../components/buttons'
import { UserSelectionGrid } from '../../components/datagrid'
import { FormFieldRenderer } from '../../components/form'
import { FieldType } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import { getUserGridColumns } from '../../models/grid-models/UserGridColumns'
import styles from '../../styles/UserGroups.module.scss'
import { userGroupFormSchema, type UserGroupFormData } from '../../utils/validationSchemas'

import { FillTestDataButton, UserGroupDetailsView } from './components'

/**
 * Form field configuration type
 */
interface FieldConfig {
  name: keyof UserGroupFormData
  label: string
  type: FieldType
  required?: boolean
  gridSize?: {
    xs: number
    sm: number
  }
  rows?: number
  placeholder?: string
}

/**
 * Section configuration type
 */
interface SectionConfig {
  title: string
  fields: FieldConfig[]
}

/**
 * Add/Edit User Group Page
 * Features:
 * - Create new user group
 * - Edit existing user group
 * - View user group details
 * - Select users to add to group
 * - Multi-select user grid
 */
const AddEditUserGroup = (): React.JSX.Element => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userGroupId = searchParams.get('userGroupId')
  const isView = searchParams.get('isView') === 'true'
  const isEdit = !!userGroupId && !isView

  const [loading, setLoading] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])

  // Form setup with react-hook-form and Zod validation
  const formMethods = useForm<UserGroupFormData>({
    resolver: zodResolver(userGroupFormSchema),
    defaultValues: {
      name: '',
      description: '',
      notes: '',
    },
  })
  const { control, handleSubmit: handleFormSubmit, formState, reset } = formMethods
  const errors = formState.errors as Record<string, { message?: string } | undefined>

  /**
   * Fetch user group details if editing
   */
  const fetchUserGroupDetails = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true)
      try {
        const response = await userGroupApi.getUserGroupById(parseInt(id))

        // Reset form with group data
        reset({
          name: String(response.groupName),
          description: String(response.description),
          notes: response.notes ? String(response.notes) : '',
        })
        setSelectedUserIds(response.userIds)

        toast.success('User group details loaded successfully')
      } catch (error) {
        toast.error('Failed to fetch user group details')
      } finally {
        setLoading(false)
      }
    },
    [reset],
  )

  /**
   * Handle form submission
   */
  const onSubmit = useCallback(
    async (formData: UserGroupFormData): Promise<void> => {
      // Validation - check if at least one user is selected
      if (selectedUserIds.length === 0) {
        toast.error('Please select at least one user')
        return
      }

      setLoading(true)
      try {
        // Prepare request data
        const requestData: UserGroupRequestModel = {
          groupId: isEdit && userGroupId ? parseInt(userGroupId, 10) : undefined,
          groupName: formData.name.trim(),
          description: formData.description.trim(),
          notes: formData.notes?.trim(),
          userIds: selectedUserIds,
        }

        if (isEdit && userGroupId) {
          // Call update API
          await userGroupApi.updateUserGroup(parseInt(userGroupId), requestData)
          toast.success('User group updated successfully')
        } else {
          // Call create API
          await userGroupApi.createUserGroup(requestData)
          toast.success('User group created successfully')
        }

        // Navigate back to groups page
        setTimeout(() => {
          navigate(APP_ROUTES.DASHBOARD.GROUPS)
        }, 1000)
      } catch (error) {
        toast.error(`Failed to ${isEdit ? 'update' : 'create'} user group`)
      } finally {
        setLoading(false)
      }
    },
    [isEdit, userGroupId, selectedUserIds, navigate],
  )

  /**
   * Handle cancel
   */
  const handleCancel = useCallback((): void => {
    navigate(APP_ROUTES.DASHBOARD.GROUPS)
  }, [navigate])

  /**
   * Get user grid columns - filter out actions column for selection grid
   */
  const userColumns = useMemo(() => {
    const allColumns = getUserGridColumns(() => {
      // No-op for selection grid - toggle not needed
    })
    // Filter out actions column for selection grid
    return allColumns.filter(col => col.field !== 'userActions')
  }, [])

  // Form sections configuration - memoized
  const formSections = useMemo<SectionConfig[]>(
    () => [
      {
        title: 'Group Details',
        fields: [
          {
            name: 'name',
            label: 'Group Name',
            type: FieldType.Text,
            required: true,
            gridSize: {
              xs: 12,
              sm: 12,
            },
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
            placeholder: 'Enter group description',
          },
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
            placeholder: 'Additional notes (optional)',
          },
        ],
      },
    ],
    [],
  )

  // Compute button text - memoized
  const buttonText = useMemo((): string => {
    if (loading) return 'Saving...'
    if (isEdit) return 'Update Group'
    return 'Create Group'
  }, [loading, isEdit])

  // Fetch data on mount
  useEffect(() => {
    if (userGroupId) {
      void fetchUserGroupDetails(userGroupId)
    }
  }, [userGroupId, fetchUserGroupDetails])

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
        <FillTestDataButton
          reset={reset}
          getValues={formMethods.getValues}
          setSelectedUserIds={setSelectedUserIds}
          isEdit={isEdit}
        />
      )}

      <form onSubmit={handleFormSubmit(onSubmit)}>
        <Box className={styles['add-user-groups-page__container']}>
          {/* Group Details Section */}
          {!isView && (
            <FormFieldRenderer
              sections={formSections}
              control={control}
              errors={errors}
              disabled={loading}
              isView={false}
              sectionClassName={styles['add-user-groups-page__section']}
              sectionTitleClassName={styles['add-user-groups-page__section-title']}
              dividerClassName={styles['add-user-groups-page__divider']}
              dividerSpacerClassName={styles['add-user-groups-page__divider-spacer']}
            />
          )}

          {/* View Mode - Group Details */}
          {isView && (
            <UserGroupDetailsView
              name={formMethods.getValues('name')}
              description={formMethods.getValues('description')}
              notes={formMethods.getValues('notes')}
            />
          )}

          {/* User Selection Section */}
          <UserSelectionGrid
            selectedUserIds={selectedUserIds}
            onSelectionChange={setSelectedUserIds}
            columns={userColumns}
            isView={isView}
            title={isView ? 'Assigned Users' : 'Group Members'}
            showSelectionInfo={!isView}
            defaultPageSize={10}
            hideToolbar={false}
            selectedUserIdsFilter={isView ? selectedUserIds : undefined}
          />

          {/* Action Buttons */}
          {!isView && (
            <Paper className={styles['add-user-groups-page__section']}>
              <Box className={styles['add-user-groups-page__actions']}>
                <RedButton
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={loading}
                  className={styles['add-user-groups-page__action-button']}
                  type="button"
                  label="Cancel"
                />
                <BlueButton
                  variant="contained"
                  startIcon={<SaveIcon />}
                  type="submit"
                  disabled={loading}
                  className={styles['add-user-groups-page__action-button']}
                  label={buttonText}
                />
              </Box>
            </Paper>
          )}
        </Box>
      </form>
    </Container>
  )
}

export default AddEditUserGroup
