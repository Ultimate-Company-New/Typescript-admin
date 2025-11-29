import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch, type DefaultValues } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Cancel as CancelIcon, Save as SaveIcon } from '@mui/icons-material'
import { Box, Container, Divider, Paper } from '@mui/material'
import {
  type GridColumnVisibilityModel,
  type GridFilterModel,
  type GridPaginationModel,
  type GridRowClassNameParams,
  type GridSlotsComponent,
  type GridSortModel,
  type GridToolbarProps,
  type GridValidRowModel,
} from '@mui/x-data-grid'

import { createUser, getAllPermissions, getUserById, updateUser } from '../../api/userApi'
import { getUserLogsInBatches, type UserLogResponseModel } from '../../api/userLogApi'
import {
  AddressDetailsView,
  AddressFormController,
  FillTestDataButton,
  FormFieldRenderer,
  UserDetailsView,
  UserGroupSelectionGrid,
  UserPermissions,
  type Permission,
  type SectionConfig,
} from '../../components'
import { BlueButton, RedButton } from '../../components/buttons'
import {
  LogicOperator,
  SimpleToolbar,
  StyledDataGrid,
  getInitialDensity,
  getRowClassName,
  handleFilterModelChange,
  handlePaginationModelChange,
  handleSortModelChange,
  type FilterGroup,
  type GridDensityType,
} from '../../components/datagrid'
import { Subheader } from '../../components/fonts'
import { FieldType } from '../../components/form/FormFieldRenderer'
import { PERMISSIONS, ROLE_PERMISSIONS, USER_ROLES, USER_ROLES_ARRAY } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import { usePermissions } from '../../hooks/usePermissions'
import { type AddressResponseModel } from '../../models/AddressModels'
import { getUserGroupGridColumns } from '../../models/gridModels/userGroupGridColumns'
import { getUserLogGridColumns } from '../../models/gridModels/userLogGridColumns'
import { type UserRequestModel, type UserResponseModel } from '../../models/UserModels'
import { type PaginatedGridInterface } from '../../types/grid.types'
import { getAllStates, getCitiesByState } from '../../utils/stateCityMapper'
import { userFormSchema, type UserFormData } from '../../utils/validationSchemas'

import styles from '../../styles/Users.module.scss'

/**
 * Normalize permission codes so comparisons are consistent regardless of casing or delimiters
 * Examples:
 *  - 'VIEW_USER' => 'viewuser'
 *  - 'ViewUser' => 'viewuser'
 *  - 'view-user' => 'viewuser'
 */
const normalizePermissionCode = (code: string): string => code.replace(/[^a-z0-9]/gi, '').toLowerCase()

/**
 * Utility to avoid unnecessary state updates when selected permissions already match
 */
const haveSameIds = (a: number[], b: number[]): boolean => {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort((x, y) => x - y)
  const sortedB = [...b].sort((x, y) => x - y)
  return sortedA.every((value, index) => value === sortedB[index])
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ensureApiFunction = <T extends (...args: any[]) => any>(fn: unknown, name: string): fn is T => {
  if (typeof fn !== 'function') {
    toast.error(`${name} API is unavailable`)
    return false
  }
  return true
}

/**
 * Add/Edit User Page
 * Features:
 * - Create new user
 * - Edit existing user
 * - View user details (read-only)
 * - Personal information section
 * - Address details section
 * - User permissions section
 * - User groups section with selection grid
 * - User logs section (edit/view mode only)
 * - Profile picture upload
 */
const AddEditUsers = (): JSX.Element => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('userId')
  const isView = searchParams.has('isView')
  const isEdit = !!userId && !isView

  const [loading, setLoading] = useState(false)

  // Get user permissions for authorization
  const { hasPermission } = usePermissions()

  // Use ref to track if permission check has been performed to avoid duplicate toasts
  const hasCheckedPermissions = useRef(false)
  const hasFetchedUserDetails = useRef(false)

  // Check permissions on mount and redirect if unauthorized
  useEffect(() => {
    // Skip if already checked (prevents duplicate toasts in React Strict Mode)
    if (hasCheckedPermissions.current) {
      return
    }

    let requiredPermission: string | null = null

    // Determine required permission based on the mode
    if (isView) {
      // View mode requires VIEW_USER permission
      requiredPermission = PERMISSIONS.VIEW_USER
    } else if (isEdit) {
      // Edit mode requires UPDATE_USER permission
      requiredPermission = PERMISSIONS.UPDATE_USER
    } else {
      // Add mode requires INSERT_USER permission
      requiredPermission = PERMISSIONS.INSERT_USER
    }

    // Check if user has the required permission
    if (requiredPermission && !hasPermission(requiredPermission)) {
      hasCheckedPermissions.current = true
      toast.error('You do not have permission to access this page')
      navigate(APP_ROUTES.DASHBOARD.USERS, { replace: true })
    } else if (requiredPermission) {
      // Mark as checked even on success to prevent re-checking
      hasCheckedPermissions.current = true
    }
  }, [hasPermission, isView, isEdit, navigate])

  // Form setup with react-hook-form and Zod validation
  const formMethods = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      loginName: '',
      phone: '',
      dob: undefined,
      role: '',
      profilePictureBase64: '',
      address: {
        streetAddress: '',
        streetAddress2: '',
        streetAddress3: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        addressType: '',
        nameOnAddress: '',
        emailOnAddress: '',
        phoneOnAddress: '',
      },
      notes: '',
    },
  })
  const { control, handleSubmit: handleFormSubmit, formState, reset, setValue } = formMethods
  const errors = formState.errors as Record<string, { message?: string } | undefined>

  // Watch the state field to update cities dynamically
  // Type guard for address value - memoized
  const isAddressValue = useCallback(
    (value: unknown): value is UserFormData['address'] =>
      typeof value === 'object' &&
      value !== null &&
      'streetAddress' in value &&
      'city' in value &&
      'state' in value &&
      'postalCode' in value &&
      'country' in value,
    [],
  )

  // Watch address field - use getValues for type safety
  // We'll use a state variable that gets updated when address changes via useEffect
  const [selectedState, setSelectedState] = useState<string>('')

  // Watch address state for city updates - extract to variable for dependency array
  const watchedAddressStateRaw = useWatch({
    control,
    name: 'address',
    defaultValue: formMethods.getValues('address'),
  }) as unknown
  const watchedAddressState: unknown = watchedAddressStateRaw

  // Update selectedState when address changes - memoized callback
  const updateSelectedState = useCallback(() => {
    const currentAddressValue: unknown = formMethods.getValues('address')
    if (isAddressValue(currentAddressValue)) {
      const addressRecord = currentAddressValue as Record<string, unknown>
      const stateValue = addressRecord.state
      if (typeof stateValue === 'string') {
        setSelectedState(stateValue)
      } else {
        setSelectedState('')
      }
    } else {
      setSelectedState('')
    }
  }, [formMethods, isAddressValue])

  useEffect(() => {
    updateSelectedState()
  }, [updateSelectedState, watchedAddressState])

  // User groups state
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([])

  // User Logs state
  const [userLogsRows, setUserLogsRows] = useState<UserLogResponseModel[]>([])
  const [userLogsLoading, setUserLogsLoading] = useState(false)
  const [userLogsTotalCount, setUserLogsTotalCount] = useState(0)
  const [userLogsPaginationModel, setUserLogsPaginationModel] = useState<PaginatedGridInterface>({
    start: 0,
    end: 10,
    pageSize: 10,
    includeDeleted: false,
    actualDataCount: 0,
    totalPaginationBlockCount: 0,
  })
  const [userLogsDensity, setUserLogsDensity] = useState<GridDensityType>(getInitialDensity())
  const [userLogsActiveFilterGroup, setUserLogsActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })
  const [userLogsColumnVisibilityModel, setUserLogsColumnVisibilityModel] = useState<GridColumnVisibilityModel>({})
  const [userLogsVisibleColumnFields, setUserLogsVisibleColumnFields] = useState<string[]>([])

  // Get grid columns for user groups selection grid
  const columns = useMemo(() => {
    const allColumns = getUserGroupGridColumns(() => {
      // No-op for selection grid - toggle not needed
    })
    // Filter out actions column for selection grid
    return allColumns.filter(col => col.field !== 'actions')
  }, [])

  // Permissions
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([])
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([])

  // Watch the role field to auto-select permissions
  const selectedRole = useWatch({
    control,
    name: 'role',
    defaultValue: '',
  }) as string | undefined

  // Get all states from stateCityMapper - memoized once
  const allStates = useMemo(() => getAllStates(), [])

  // Get cities for selected state - memoized for performance and sorted A-Z
  const citiesForState = useMemo(() => {
    if (!selectedState || typeof selectedState !== 'string') return []
    const cities = getCitiesByState(selectedState)
    // Sort cities alphabetically
    return [...cities].sort((a, b) => {
      const cityA = a.toLowerCase()
      const cityB = b.toLowerCase()
      if (cityA < cityB) return -1
      if (cityA > cityB) return 1
      return 0
    })
  }, [selectedState])

  /**
   * Fetch user details if editing or viewing
   */
  const fetchUserDetails = useCallback(
    async (id: string) => {
      setLoading(true)
      try {
        if (!ensureApiFunction<(userId: number) => Promise<UserResponseModel>>(getUserById, 'getUserById')) {
          setLoading(false)
          return
        }
        const response: UserResponseModel = await getUserById(parseInt(id))

        // Reset form with user data
        const addresses: AddressResponseModel[] = response.addresses ?? []
        let primaryAddress: AddressResponseModel | undefined
        if (addresses.length > 0) {
          const foundPrimary = addresses.find((addr: AddressResponseModel) => addr.isPrimary)
          primaryAddress = foundPrimary ?? addresses[0]
        }

        // Set the selected state FIRST so cities can be loaded
        const userState = primaryAddress ? String(primaryAddress.state) : ''
        if (userState) {
          setSelectedState(userState)
        }

        const dobValue: Date = response.dob ? new Date(response.dob) : new Date()
        const userCity = primaryAddress ? String(primaryAddress.city) : ''

        const formValues: DefaultValues<UserFormData> = {
          firstName: String(response.firstName || ''),
          lastName: String(response.lastName || ''),
          loginName: String(response.loginName || response.email || ''),
          phone: String(response.phone || ''),
          dob: dobValue,
          role: String(response.role || ''),
          profilePictureBase64: typeof response.profilePicture === 'string' ? response.profilePicture : '',
          address: {
            streetAddress: primaryAddress ? String(primaryAddress.streetAddress) : '',
            streetAddress2: primaryAddress?.streetAddress2 ? String(primaryAddress.streetAddress2) : '',
            streetAddress3: primaryAddress?.streetAddress3 ? String(primaryAddress.streetAddress3) : '',
            city: '', // Set to empty initially
            state: userState,
            postalCode: (() => {
              if (primaryAddress?.postalCode) {
                return String(primaryAddress.postalCode)
              }
              if (primaryAddress?.zipCode) {
                return String(primaryAddress.zipCode)
              }
              return ''
            })(),
            country: primaryAddress ? String(primaryAddress.country) : 'India',
            addressType: primaryAddress ? String(primaryAddress.addressType) : '',
            nameOnAddress: primaryAddress?.nameOnAddress ? String(primaryAddress.nameOnAddress) : '',
            emailOnAddress: primaryAddress?.emailOnAddress ? String(primaryAddress.emailOnAddress) : '',
            phoneOnAddress: primaryAddress?.phoneOnAddress ? String(primaryAddress.phoneOnAddress) : '',
          },
          notes: String(response.notes ?? ''),
        }
        reset(formValues)

        // Set the city after a small delay to ensure the cities dropdown is populated
        if (userCity) {
          setTimeout(() => {
            setValue('address.city', userCity)
          }, 100)
        }

        // Set user groups
        if (response.userGroups && response.userGroups.length > 0) {
          const groupIds = response.userGroups
            .map(group => group.groupId)
            .filter((id): id is number => typeof id === 'number')
          setSelectedGroupIds(groupIds)
        } else {
          setSelectedGroupIds([])
        }

        // Set permissions
        if (response.permissions && response.permissions.length > 0) {
          setSelectedPermissionIds(response.permissions.map(perm => perm.permissionId))
        }

        toast.success('User details loaded successfully')
      } catch (error) {
        toast.error('Failed to fetch user details')
      } finally {
        setLoading(false)
      }
    },
    [reset, setValue],
  )

  /**
   * Fetch user logs for the current user (edit/view mode only)
   */
  const fetchUserLogs = useCallback(async (): Promise<void> => {
    if (!userId) return

    setUserLogsLoading(true)
    try {
      // Get the selected client ID from localStorage (set during client selection)
      const clientIdStr = localStorage.getItem('selectedClientId') ?? localStorage.getItem('clientId') ?? '1'
      const carrierId = parseInt(clientIdStr)

      const response = await getUserLogsInBatches({
        userId: parseInt(userId),
        carrierId,
        start: userLogsPaginationModel.start,
        end: userLogsPaginationModel.end,
        pageSize: userLogsPaginationModel.pageSize,
        includeDeleted: false,
        actualDataCount: 0,
        totalPaginationBlockCount: 0,
      })

      setUserLogsRows(response.data)
      setUserLogsTotalCount(response.totalDataCount)
    } catch (error) {
      setUserLogsRows([])
      setUserLogsTotalCount(0)
    } finally {
      setUserLogsLoading(false)
    }
  }, [userId, userLogsPaginationModel])

  /**
   * Fetch available permissions
   */
  const fetchPermissions = useCallback(async (): Promise<void> => {
    try {
      if (!ensureApiFunction<() => Promise<Permission[]>>(getAllPermissions, 'getAllPermissions')) {
        return
      }
      const permissionsResponse: unknown = await getAllPermissions()

      const isValidPermission = (perm: unknown): perm is Permission => {
        if (typeof perm !== 'object' || perm === null) {
          return false
        }
        const permission = perm as Record<string, unknown>
        return (
          'permissionId' in permission &&
          'permissionName' in permission &&
          'permissionCode' in permission &&
          typeof permission.permissionId === 'number' &&
          typeof permission.permissionName === 'string' &&
          typeof permission.permissionCode === 'string'
        )
      }

      if (!Array.isArray(permissionsResponse) || permissionsResponse.length === 0) {
        setAvailablePermissions([])
        return
      }

      const permissions: Permission[] = []
      for (const permission of permissionsResponse as unknown[]) {
        if (isValidPermission(permission)) {
          permissions.push(permission)
        }
      }
      setAvailablePermissions(permissions)
    } catch (error) {
      toast.error('Failed to load permissions')
      setAvailablePermissions([])
    }
  }, [])

  /**
   * Handle form submission - memoized
   */
  const onSubmit = useCallback(
    async (formData: UserFormData): Promise<void> => {
      setLoading(true)
      try {
        // Type-safe extraction of form data
        const typedFormData = formData as {
          firstName: string
          lastName: string
          loginName: string
          phone: string
          role: string
          dob: Date
          address: {
            streetAddress: string
            streetAddress2?: string | null
            streetAddress3?: string | null
            city: string
            state: string
            postalCode: string
            country: string
            addressType: string
            nameOnAddress?: string | null
            emailOnAddress?: string | null
            phoneOnAddress?: string | null
          }
          notes?: string | null
        }
        const dobDate: Date = typedFormData.dob
        const dobString: string = dobDate.toISOString().split('T')[0] ?? ''
        const addressData = typedFormData.address
        const requestData: UserRequestModel = {
          userId: isEdit && userId ? parseInt(userId) : undefined,
          loginName: typedFormData.loginName,
          email: typedFormData.loginName, // Set email same as loginName for backend compatibility
          firstName: typedFormData.firstName,
          lastName: typedFormData.lastName,
          phone: typedFormData.phone,
          role: typedFormData.role,
          dob: dobString,
          address: {
            streetAddress: addressData.streetAddress,
            streetAddress2: addressData.streetAddress2 ? addressData.streetAddress2 : undefined,
            streetAddress3: addressData.streetAddress3 ? addressData.streetAddress3 : undefined,
            city: addressData.city,
            state: addressData.state,
            postalCode: addressData.postalCode,
            country: addressData.country,
            addressType: addressData.addressType,
            nameOnAddress: addressData.nameOnAddress ? addressData.nameOnAddress : undefined,
            emailOnAddress: addressData.emailOnAddress ? addressData.emailOnAddress : undefined,
            phoneOnAddress: addressData.phoneOnAddress ? addressData.phoneOnAddress : undefined,
            isPrimary: true,
          },
          selectedGroupIds: selectedGroupIds,
          permissionIds: selectedPermissionIds,
          profilePictureBase64: formData.profilePictureBase64 ?? undefined,
          notes: typedFormData.notes ? typedFormData.notes : undefined,
        }

        if (isEdit && userId) {
          const userIdNum = parseInt(userId)
          if (
            !ensureApiFunction<(userId: number, payload: UserRequestModel) => Promise<void>>(updateUser, 'updateUser')
          ) {
            setLoading(false)
            return
          }
          await updateUser(userIdNum, requestData)
          toast.success('User updated successfully')
        } else {
          if (!ensureApiFunction<(payload: UserRequestModel) => Promise<void>>(createUser, 'createUser')) {
            setLoading(false)
            return
          }
          await createUser(requestData)
          toast.success('User created successfully')
        }

        // Navigate back to users grid
        setTimeout(() => {
          navigate(APP_ROUTES.DASHBOARD.USERS)
        }, 1000)
      } catch (error) {
        toast.error(`Failed to ${isEdit ? 'update' : 'create'} user`)
      } finally {
        setLoading(false)
      }
    },
    [isEdit, userId, selectedGroupIds, selectedPermissionIds, navigate],
  )

  /**
   * Handle cancel - memoized
   */
  const handleCancel = useCallback((): void => {
    navigate(APP_ROUTES.DASHBOARD.USERS)
  }, [navigate])

  // Fetch user logs when pagination changes (edit/view mode only)
  useEffect(() => {
    if (userId && (isEdit || isView)) {
      void fetchUserLogs()
    }
  }, [fetchUserLogs, userId, isEdit, isView])

  // Fetch data on mount
  useEffect(() => {
    fetchPermissions().catch(() => {
      // Error already handled in fetchPermissions
    })
    if (userId && !hasFetchedUserDetails.current) {
      hasFetchedUserDetails.current = true
      fetchUserDetails(userId).catch(() => {
        // Error already handled in fetchUserDetails
      })
    }
  }, [fetchPermissions, fetchUserDetails, userId])

  const handlePermissionChange = useCallback((newPermissionIds: number[]) => {
    setSelectedPermissionIds(newPermissionIds)
  }, [])

  // Auto-select permissions based on role
  useEffect(() => {
    // Don't auto-select if:
    // - No role selected
    // - Role is Custom (user should manually select)
    // - In view mode
    // - No permissions loaded yet
    if (!selectedRole || selectedRole === USER_ROLES.CUSTOM || isView || availablePermissions.length === 0) {
      return
    }

    // Get permission codes for the selected role
    const rolePermissionCodes = ROLE_PERMISSIONS[selectedRole] ?? []

    // If no permissions defined for this role, clear selection
    if (rolePermissionCodes.length === 0) {
      if (selectedPermissionIds.length !== 0) {
        setSelectedPermissionIds([])
      }
      return
    }

    const normalizedRoleCodes = rolePermissionCodes.map(normalizePermissionCode)

    // Map permission codes to permission IDs (case / delimiter insensitive)
    const permissionIds = availablePermissions
      .filter(permission => normalizedRoleCodes.includes(normalizePermissionCode(permission.permissionCode)))
      .map(permission => permission.permissionId)

    // Update selected permissions only if there's a difference
    if (!haveSameIds(selectedPermissionIds, permissionIds)) {
      setSelectedPermissionIds(permissionIds)
    }
  }, [selectedRole, availablePermissions, isView, selectedPermissionIds])

  // Compute button text - memoized
  const buttonText = useMemo((): string => {
    if (loading) return 'Saving...'
    if (isEdit) return 'Update User'
    return 'Create User'
  }, [loading, isEdit])

  // User logs grid columns - memoized
  const userLogsColumns = useMemo(() => getUserLogGridColumns(), [])

  // Update visible column fields for user logs when column visibility changes
  useEffect(() => {
    setUserLogsVisibleColumnFields(
      userLogsColumns
        .filter(col => {
          const visibility = userLogsColumnVisibilityModel[col.field]
          return visibility
        })
        .map(col => col.field),
    )
  }, [userLogsColumnVisibilityModel, userLogsColumns])

  // User logs pagination model for DataGrid - memoized
  const userLogsGridPaginationModel = useMemo(
    () => ({
      page: Math.floor(userLogsPaginationModel.start / userLogsPaginationModel.pageSize),
      pageSize: userLogsPaginationModel.pageSize,
    }),
    [userLogsPaginationModel.start, userLogsPaginationModel.pageSize],
  )

  // User logs toolbar props - memoized
  const userLogsToolbarProps = useMemo(
    () =>
      ({
        density: userLogsDensity,
        onDensityChange: setUserLogsDensity,
        columns: userLogsColumns,
        onFiltersChange: setUserLogsActiveFilterGroup,
        activeFilterGroup: userLogsActiveFilterGroup,
        rows: userLogsRows,
        includeDeleted: false,
        onIncludeDeletedChange: () => {
          // Not applicable for logs
        },
        visibleColumnFields: userLogsVisibleColumnFields,
        columnVisibilityModel: userLogsColumnVisibilityModel,
        onColumnVisibilityChange: setUserLogsColumnVisibilityModel,
        hideIncludeDeleted: true,
        hideExport: false,
      }) as GridToolbarProps,
    [
      userLogsDensity,
      userLogsColumns,
      userLogsActiveFilterGroup,
      userLogsRows,
      userLogsVisibleColumnFields,
      userLogsColumnVisibilityModel,
    ],
  )

  // Memoize role options to prevent recreation on every render
  const roleOptions = useMemo(
    () =>
      USER_ROLES_ARRAY.map(r => ({
        value: r,
        label: r,
      })),
    [],
  )

  // Form sections configuration - memoized
  const formSections = useMemo<Array<SectionConfig<UserFormData>>>(
    () => [
      {
        title: 'Personal Information',
        fields: [
          {
            name: 'profilePictureBase64' as const,
            label: 'Upload Photo',
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
            name: 'firstName' as const,
            label: 'First Name',
            type: FieldType.Text as FieldType,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'lastName' as const,
            label: 'Last Name',
            type: FieldType.Text as FieldType,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'loginName' as const,
            label: 'Login Name (Email)',
            type: FieldType.Email as FieldType,
            required: true,
            disabled: isEdit, // Disable login name in edit mode - cannot be changed
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'phone' as const,
            label: 'Phone',
            type: FieldType.Phone as FieldType,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
          },
          {
            name: 'role' as const,
            label: 'Role',
            type: FieldType.Autocomplete as FieldType,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            options: roleOptions,
            sortOptions: true,
            maxHeight: 300,
          },
          {
            name: 'dob' as const,
            label: 'Date of Birth',
            type: FieldType.Date as FieldType,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
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
            rows: 4,
            placeholder: 'Enter any additional notes or comments...',
          },
        ],
      },
    ],
    [roleOptions, isEdit],
  )

  // User Logs grid callbacks - memoized outside of conditional rendering
  const handleUserLogsColumnVisibilityChange = useCallback((model: GridColumnVisibilityModel) => {
    setUserLogsColumnVisibilityModel(model)
  }, [])

  const handleUserLogsPaginationChange = useCallback((model: GridPaginationModel) => {
    handlePaginationModelChange(model, setUserLogsPaginationModel)
  }, [])

  const handleUserLogsFilterChange = useCallback(
    (model: GridFilterModel) => {
      handleFilterModelChange(model, userLogsPaginationModel, setUserLogsPaginationModel)
    },
    [userLogsPaginationModel],
  )

  const handleUserLogsSortChange = useCallback((model: GridSortModel) => {
    handleSortModelChange(model, setUserLogsPaginationModel)
  }, [])

  const getUserLogsRowId = useCallback((row: GridValidRowModel): number => {
    const typedRow = row as { logId?: number }
    return typedRow.logId ?? 0
  }, [])

  const getUserLogsRowClassName = useCallback(
    (params: GridRowClassNameParams<GridValidRowModel>) => getRowClassName<UserLogResponseModel>(params),
    [],
  )

  return (
    <Container maxWidth="xl">
      {/* Fill Test Data Button - Only show in development/non-view mode */}
      {!isView && (
        <FillTestDataButton
          reset={reset}
          getValues={formMethods.getValues}
          setSelectedGroupIds={setSelectedGroupIds}
          setValue={setValue}
          isEdit={isEdit}
        />
      )}

      <form onSubmit={handleFormSubmit(onSubmit)}>
        <Box className={styles['add-users-page__container']}>
          {isView ? (
            <>
              {/* View Mode - Personal Information */}
              <UserDetailsView
                profilePictureBase64={formMethods.getValues('profilePictureBase64') ?? ''}
                firstName={formMethods.getValues('firstName')}
                lastName={formMethods.getValues('lastName')}
                loginName={formMethods.getValues('loginName')}
                phone={formMethods.getValues('phone')}
                role={formMethods.getValues('role')}
                dob={formMethods.getValues('dob')}
                notes={formMethods.getValues('notes')}
              />

              {/* View Mode - Address Details */}
              <AddressDetailsView
                streetAddress={formMethods.getValues('address.streetAddress')}
                streetAddress2={formMethods.getValues('address.streetAddress2')}
                streetAddress3={formMethods.getValues('address.streetAddress3')}
                city={formMethods.getValues('address.city')}
                state={formMethods.getValues('address.state')}
                postalCode={formMethods.getValues('address.postalCode')}
                country={formMethods.getValues('address.country')}
                addressType={formMethods.getValues('address.addressType')}
                nameOnAddress={formMethods.getValues('address.nameOnAddress')}
                emailOnAddress={formMethods.getValues('address.emailOnAddress')}
                phoneOnAddress={formMethods.getValues('address.phoneOnAddress')}
              />
            </>
          ) : (
            <>
              {/* Edit/Add Mode - Personal Information and Notes Sections */}
              <FormFieldRenderer
                sections={formSections}
                control={control}
                errors={errors}
                disabled={loading}
                isView={false}
                sectionClassName={styles['add-users-page__section']}
                sectionTitleClassName={styles['add-users-page__section-title']}
                dividerClassName={styles['add-users-page__divider']}
                dividerSpacerClassName={styles['add-users-page__divider-spacer']}
              />

              {/* Edit/Add Mode - Address Details Section - Keep as is for now due to complex logic */}
              <AddressFormController
                control={control}
                errors={errors}
                disabled={loading}
                states={allStates}
                cities={citiesForState}
                onStateChange={setSelectedState}
                setValue={setValue}
              />
            </>
          )}

          {/* User Permissions Section */}
          <Paper className={styles['add-users-page__section']}>
            <Subheader label="User Permissions" className={styles['add-users-page__section-title']} />
            <Divider className={styles['add-users-page__divider']} />
            <Box className={styles['add-users-page__divider-spacer']} />

            <UserPermissions
              availablePermissions={availablePermissions}
              selectedPermissionIds={selectedPermissionIds}
              onChange={handlePermissionChange}
              readOnly={isView}
              disabled={selectedRole !== USER_ROLES.CUSTOM}
            />
          </Paper>

          {/* User Groups Section */}
          <UserGroupSelectionGrid
            selectedGroupIds={selectedGroupIds}
            onSelectionChange={setSelectedGroupIds}
            columns={columns}
            isView={isView}
            title={isView ? 'Assigned User Groups' : 'User Groups'}
            showSelectionInfo={!isView}
            defaultPageSize={10}
            hideToolbar={false}
            selectedGroupIdsFilter={isView ? selectedGroupIds : undefined}
          />

          {/* User Logs Section - Only show in edit/view mode */}
          {userId && (isEdit || isView) && (
            <Paper className={styles['add-users-page__section']}>
              <Subheader label="User Logs" className={styles['add-users-page__section-title']} />
              <Divider className={styles['add-users-page__divider']} />
              <Box className={styles['add-users-page__divider-spacer']} />

              <Box className={styles['add-users-page__grid-container']}>
                <StyledDataGrid
                  dataTestId="user-logs-data-grid"
                  rows={userLogsRows}
                  columns={userLogsColumns}
                  loading={userLogsLoading}
                  rowCount={userLogsTotalCount}
                  totalCount={userLogsTotalCount}
                  paginationModelState={userLogsPaginationModel}
                  setPaginationModel={setUserLogsPaginationModel}
                  density={userLogsDensity}
                  columnVisibilityModel={userLogsColumnVisibilityModel}
                  onColumnVisibilityModelChange={handleUserLogsColumnVisibilityChange}
                  paginationModel={userLogsGridPaginationModel}
                  onPaginationModelChange={handleUserLogsPaginationChange}
                  onFilterModelChange={handleUserLogsFilterChange}
                  onSortModelChange={handleUserLogsSortChange}
                  getRowId={getUserLogsRowId}
                  getRowClassName={getUserLogsRowClassName}
                  disableRowSelectionOnClick
                  slots={{
                    toolbar: SimpleToolbar as GridSlotsComponent['toolbar'],
                  }}
                  slotProps={{
                    toolbar: userLogsToolbarProps,
                  }}
                  showToolbar
                  disableColumnMenu={false}
                  className={styles['add-users-page__data-grid']}
                />
              </Box>
            </Paper>
          )}

          {/* Action Buttons */}
          {!isView && (
            <Paper className={styles['add-users-page__section']}>
              <Box className={styles['add-users-page__actions']}>
                <RedButton
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={loading}
                  className={styles['add-users-page__action-button']}
                  type="button"
                  label="Cancel"
                />
                <BlueButton
                  variant="contained"
                  startIcon={<SaveIcon />}
                  type="submit"
                  disabled={loading}
                  className={styles['add-users-page__action-button']}
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

export default AddEditUsers
