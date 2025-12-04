import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import type { ZodType } from 'zod'

import {
  Cancel as CancelIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  GridOn as GridIcon,
  Code as JsonIcon,
  Send as SendIcon,
} from '@mui/icons-material'
import {
  Box,
  CircularProgress,
  Container,
  Divider,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import type { GridColDef, GridColumnVisibilityModel, GridSlotsComponent, GridToolbarProps } from '@mui/x-data-grid'

import { bulkCreateUsers, getAllPermissions, type BulkUserInsertResponseModel } from '../../api/userApi'
import { userGroupApi } from '../../api/userGroupApi'
import { ImportInstructions } from '../../components'
import { BlueButton, LinkButton, RedButton } from '../../components/buttons'
import {
  ErrorDetailsModal,
  GridDensity,
  LogicOperator,
  SimpleToolbar,
  StyledDataGrid,
  TableAsJson,
  type ColumnGroup,
  type FilterGroup,
  type GridDensityType,
} from '../../components/datagrid/index.ts'
import { BodyText, Subheader } from '../../components/fonts'
import { FileDropZone, SelectInput } from '../../components/form-input'
import { APP_ROUTES } from '../../constants/routes'
import {
  getPermissionGridColumns,
  getUserGroupGridColumns,
  type PermissionData,
  type UserGroupData,
  type UserRequestModel,
} from '../../models'
import {
  getUserImportPreviewColumns,
  userImportHeaderNames,
  userImportTemplateStructure,
} from '../../models/bulk-import-models/ImportUserGridModel'
import type { TemplateStructure } from '../../models/ImportTemplateStructure'
import styles from '../../styles/Users.module.scss'
import { type PaginatedGridInterface } from '../../types/grid.types'
import { applyLocalFilters, downloadImportTemplate, parseImportFile } from '../../utils/gridUtil'
import { convertImageUrlToBase64 } from '../../utils/imageUtils'
import { bulkUserImportSchema as rawBulkUserImportSchema, type BulkUserImportData } from '../../utils/validationSchemas'

import { FillImportTestDataButton } from './components'

const templateStructure: TemplateStructure = userImportTemplateStructure
const bulkUserImportValidator = rawBulkUserImportSchema as unknown as ZodType<BulkUserImportData>

/**
 * Interface for parsed user data from Excel/CSV
 * Matches UserRequestModel structure from Spring API
 */
interface ImportUserData {
  rowNumber: number
  // User Info
  loginName: string
  firstName: string
  lastName: string
  phone: string
  role: string
  dob: string
  apiKey?: string
  imageUrl?: string
  // Address Info
  streetAddress: string
  streetAddress2?: string
  streetAddress3?: string
  city: string
  state: string
  zipCode: string
  country?: string
  addressType: string
  nameOnAddress?: string
  emailOnAddress?: string
  phoneOnAddress?: string
  // Other
  permissionIds: number[]
  selectedGroupIds: number[]
  notes?: string
  errors?: string[]
}

/**
 * JSON structure for bulk user import API
 * Matches UserRequestModel from Spring API
 */
interface BulkUserImportRequest {
  maxRecords: number
  users: Array<{
    loginName: string
    firstName: string
    lastName: string
    phone: string
    role: string
    dob: string
    imageUrl?: string
    address: {
      streetAddress: string
      streetAddress2?: string
      streetAddress3?: string
      city: string
      state: string
      zipCode?: string
      postalCode?: string
      country?: string
      addressType: string
      nameOnAddress?: string
      emailOnAddress?: string
      phoneOnAddress?: string
    }
    permissionIds: number[]
    selectedGroupIds: number[]
    notes?: string
  }>
}

/**
 * Import Users Page
 * Features:
 * - Download Excel template
 * - Upload Excel/CSV files
 * - Preview data in grid or JSON format
 * - Set max records limit
 * - Validate and submit bulk import
 */
const ImportUsers = (): React.JSX.Element => {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<ImportUserData[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'json'>('grid')
  const [maxRecords, setMaxRecords] = useState<number>(25)
  const [isLoading, setIsLoading] = useState(false)
  const [jsonPreview, setJsonPreview] = useState<string>('')

  // Error modal state
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [selectedRowErrors, setSelectedRowErrors] = useState<string[]>([])
  const [selectedRowNumber, setSelectedRowNumber] = useState<number | null>(null)

  // Permissions state (local pagination)
  const [permissions, setPermissions] = useState<PermissionData[]>([])
  const [permissionsRaw, setPermissionsRaw] = useState<PermissionData[]>([]) // Store unfiltered data
  const [permissionsLoading, setPermissionsLoading] = useState(false)
  const [permissionsDensity, setPermissionsDensity] = useState<GridDensityType>(GridDensity.STANDARD)
  const [permissionsColumnVisibility, setPermissionsColumnVisibility] = useState<GridColumnVisibilityModel>({})
  const [permissionsActiveFilterGroup, setPermissionsActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })

  // User Groups state (server-side pagination)
  const [userGroups, setUserGroups] = useState<UserGroupData[]>([])
  const [userGroupsLoading, setUserGroupsLoading] = useState(false)
  const [userGroupsTotalCount, setUserGroupsTotalCount] = useState(0)
  const [userGroupsPaginationModel, setUserGroupsPaginationModel] = useState<PaginatedGridInterface>({
    start: 0,
    end: 10,
    pageSize: 10,
    includeDeleted: false,
    actualDataCount: 0,
    totalPaginationBlockCount: 0,
  })
  const [userGroupsActiveFilterGroup, setUserGroupsActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })
  const [userGroupsDensity, setUserGroupsDensity] = useState<GridDensityType>(GridDensity.STANDARD)
  const [userGroupsColumnVisibility, setUserGroupsColumnVisibility] = useState<GridColumnVisibilityModel>({})

  /**
   * Download Excel template with merged category headers
   * Template structure matches UserRequestModel columns
   */
  const handleDownloadTemplate = (): void => {
    try {
      downloadImportTemplate({
        templateStructure,
        fileName: 'user_import_template.xlsx',
        sheetName: 'Users',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to download template'
      toast.error(message)
    }
  }

  /**
   * Parse Excel/CSV file
   * Uses ExcelRowParser for dynamic column mapping (like Python DataFrame)
   * No hardcoded column indices - columns are accessed by field name
   */
  const parseFile = useCallback(
    (file: File): void => {
      setIsLoading(true)

      void parseImportFile<ImportUserData, BulkUserImportData>({
        file,
        templateStructure,
        headerNames: userImportHeaderNames,
        maxRecords,
        validator: bulkUserImportValidator,
        createRowData: ({ rowNumber, rowParser, getOptionalValue, getRequiredValue }) => {
          const loginNameValue = getRequiredValue('loginName')
          const firstNameValue = getRequiredValue('firstName')
          const lastNameValue = getRequiredValue('lastName')
          const phoneValue = getRequiredValue('phone')
          const roleValue = getRequiredValue('role')
          const dobValue = getRequiredValue('dob')
          const imageUrlValue = getOptionalValue('imageUrl')
          const streetAddressValue = getRequiredValue('streetAddress')
          const streetAddress2Value = getOptionalValue('streetAddress2')
          const streetAddress3Value = getOptionalValue('streetAddress3')
          const cityValue = getRequiredValue('city')
          const stateValue = getRequiredValue('state')
          const postalCodeValue = getRequiredValue('zipCode')
          const countryValue = getRequiredValue('country')
          const addressTypeValue = getRequiredValue('addressType')
          const nameOnAddressValue = getOptionalValue('nameOnAddress')
          const emailOnAddressValue = getOptionalValue('emailOnAddress')
          const phoneOnAddressValue = getOptionalValue('phoneOnAddress')
          const notesValue = getOptionalValue('notes')
          const permissionIdsRaw = rowParser.getString('permissionIds')
          const selectedGroupIdsRaw = rowParser.getString('selectedGroupIds')

          const validationPayload: BulkUserImportData = {
            loginName: loginNameValue,
            firstName: firstNameValue,
            lastName: lastNameValue,
            phone: phoneValue,
            role: roleValue,
            dob: dobValue,
            imageUrl: imageUrlValue ?? '',
            streetAddress: streetAddressValue,
            streetAddress2: streetAddress2Value ?? '',
            streetAddress3: streetAddress3Value ?? '',
            city: cityValue,
            state: stateValue,
            zipCode: postalCodeValue,
            country: countryValue,
            addressType: addressTypeValue,
            nameOnAddress: nameOnAddressValue ?? '',
            emailOnAddress: emailOnAddressValue ?? '',
            phoneOnAddress: phoneOnAddressValue ?? '',
            permissionIds: permissionIdsRaw,
            selectedGroupIds: selectedGroupIdsRaw,
            notes: notesValue ?? '',
          }

          const parsedRow: ImportUserData = {
            rowNumber,
            loginName: loginNameValue,
            firstName: firstNameValue,
            lastName: lastNameValue,
            phone: phoneValue,
            role: roleValue,
            dob: dobValue,
            imageUrl: imageUrlValue,
            streetAddress: streetAddressValue,
            streetAddress2: streetAddress2Value,
            streetAddress3: streetAddress3Value,
            city: cityValue,
            state: stateValue,
            zipCode: postalCodeValue,
            country: countryValue,
            addressType: addressTypeValue,
            nameOnAddress: nameOnAddressValue,
            emailOnAddress: emailOnAddressValue,
            phoneOnAddress: phoneOnAddressValue,
            permissionIds: rowParser.getIdArray('permissionIds'),
            selectedGroupIds: rowParser.getIdArray('selectedGroupIds'),
            notes: notesValue,
          }

          return {
            parsedRow,
            validationPayload,
          } satisfies {
            parsedRow: ImportUserData
            validationPayload: BulkUserImportData
          }
        },
      })
        .then(results => {
          setImportData(
            results.map(result => ({
              ...result.data,
              errors: result.errors && result.errors.length > 0 ? result.errors : undefined,
            })),
          )
          toast.success(`Parsed ${results.length} records successfully!`)
        })
        .catch(error => {
          const message = error instanceof Error ? error.message : 'Failed to parse file. Please check the format.'
          toast.error(message)
          if (message.includes('maximum allowed')) {
            setFile(null)
          }
        })
        .finally(() => {
          setIsLoading(false)
        })
    },
    [maxRecords],
  )
  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(
    (selectedFile: File): void => {
      setFile(selectedFile)
      parseFile(selectedFile)
    },
    [parseFile],
  )

  /**
   * Clear uploaded file and data
   */
  const handleFileClear = useCallback((): void => {
    setFile(null)
    setImportData([])
  }, [])

  /**
   * Fetch available permissions (local pagination)
   */
  const fetchPermissions = useCallback(async (): Promise<void> => {
    setPermissionsLoading(true)
    try {
      const permissionsResponse = (await getAllPermissions()) as PermissionData[]
      // Sort by permissionId in descending order
      const sortedPermissions = [...permissionsResponse].sort((a, b) => b.permissionId - a.permissionId)
      setPermissionsRaw(sortedPermissions) // Store raw unfiltered data
      setPermissions(sortedPermissions)
    } catch {
      toast.error('Failed to fetch permissions')
      setPermissionsRaw([])
      setPermissions([])
    } finally {
      setPermissionsLoading(false)
    }
  }, [])

  /**
   * Fetch user groups (server-side pagination)
   */
  const fetchUserGroups = useCallback(async (): Promise<void> => {
    setUserGroupsLoading(true)
    try {
      const response = await userGroupApi.getUserGroups({
        start: userGroupsPaginationModel.start,
        end: userGroupsPaginationModel.end,
        pageSize: userGroupsPaginationModel.pageSize,
        includeDeleted: false,
        logicOperator: userGroupsActiveFilterGroup.logicOperator,
        filters: userGroupsActiveFilterGroup.filters,
      })

      // API response already matches grid structure
      setUserGroups(response.data as UserGroupData[])
      setUserGroupsTotalCount(response.totalDataCount)
    } catch {
      toast.error('Failed to fetch user groups')
      setUserGroups([])
      setUserGroupsTotalCount(0)
    } finally {
      setUserGroupsLoading(false)
    }
  }, [userGroupsPaginationModel, userGroupsActiveFilterGroup])

  // Fetch permissions on mount
  useEffect(() => {
    void fetchPermissions()
  }, [fetchPermissions])

  // Apply local filters to permissions when filter changes
  useEffect(() => {
    if (permissionsRaw.length > 0) {
      const filteredData = applyLocalFilters(permissionsRaw, permissionsActiveFilterGroup)
      setPermissions(filteredData)
    }
  }, [permissionsRaw, permissionsActiveFilterGroup])

  // Fetch user groups on mount and when pagination changes
  useEffect(() => {
    void fetchUserGroups()
  }, [fetchUserGroups])

  /**
   * Generate JSON structure for API
   */
  const generateImportJSON = useCallback((): BulkUserImportRequest => {
    const users = importData.map(user => ({
      loginName: user.loginName,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      dob: user.dob,
      imageUrl: user.imageUrl,
      address: {
        streetAddress: user.streetAddress,
        streetAddress2: user.streetAddress2,
        streetAddress3: user.streetAddress3,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        postalCode: user.zipCode,
        country: user.country ?? 'USA',
        addressType: user.addressType,
        nameOnAddress: user.nameOnAddress,
        emailOnAddress: user.emailOnAddress,
        phoneOnAddress: user.phoneOnAddress,
      },
      permissionIds: user.permissionIds,
      selectedGroupIds: user.selectedGroupIds,
      notes: user.notes,
    }))

    return {
      maxRecords,
      users,
    }
  }, [importData, maxRecords])

  // Generate JSON preview when switching to JSON view
  useEffect(() => {
    if (viewMode === 'json' && importData.length > 0) {
      const json = generateImportJSON()
      setJsonPreview(JSON.stringify(json, null, 2))
    }
  }, [viewMode, importData, generateImportJSON])

  const jsonPreviewData = useMemo<unknown>(() => {
    if (!jsonPreview) {
      return []
    }

    try {
      const parsed = JSON.parse(jsonPreview) as BulkUserImportRequest
      // Only show the users array, not the wrapper object with maxRecords
      return parsed.users
    } catch {
      return []
    }
  }, [jsonPreview])

  /**
   * Submit bulk import to API
   */
  const handleSubmit = async (): Promise<void> => {
    if (importData.length === 0) {
      toast.error('No data to import')
      return
    }

    // Check for errors
    const hasErrors = importData.some(user => user.errors && user.errors.length > 0)
    if (hasErrors) {
      toast.error('Please fix validation errors before submitting')
      return
    }

    setIsLoading(true)
    try {
      // Generate import payload - convert to API format (uses same UserRequestModel as add/edit)
      // Convert image URLs to base64 in parallel
      const usersPayload: UserRequestModel[] = await Promise.all(
        importData.map(async user => {
          // Convert imageUrl to base64 if provided
          let profilePictureBase64: string | undefined
          if (user.imageUrl) {
            profilePictureBase64 = await convertImageUrlToBase64(user.imageUrl)
          }

          return {
            loginName: user.loginName,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role,
            dob: user.dob,
            profilePictureBase64,
            address: {
              streetAddress: user.streetAddress,
              streetAddress2: user.streetAddress2,
              streetAddress3: user.streetAddress3,
              city: user.city,
              state: user.state,
              zipCode: user.zipCode,
              postalCode: user.zipCode,
              country: user.country,
              addressType: user.addressType,
              nameOnAddress: user.nameOnAddress,
              emailOnAddress: user.emailOnAddress,
              phoneOnAddress: user.phoneOnAddress,
            },
            permissionIds: user.permissionIds,
            selectedGroupIds: user.selectedGroupIds,
            notes: user.notes,
          }
        }),
      )

      // Call bulk create API
      const response: BulkUserInsertResponseModel = await bulkCreateUsers(usersPayload)

      // Show results and navigate on success
      if (response.failureCount === 0) {
        toast.success(`Successfully imported ${response.successCount} users!`)
        // Navigate to users page on full success
        navigate(APP_ROUTES.DASHBOARD.USERS)
      } else if (response.successCount === 0) {
        toast.error(`Failed to import all ${response.failureCount} users. Check the results.`)
      } else {
        toast.warning(
          `Partial success: ${response.successCount} imported, ${response.failureCount} failed. Check your messages for details.`,
        )
        // Navigate to users page even on partial success
        navigate(APP_ROUTES.DASHBOARD.USERS)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import users'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreviewErrorClick = useCallback((errors: string[], rowNumber: number): void => {
    setSelectedRowErrors(errors)
    setSelectedRowNumber(rowNumber)
    setErrorModalOpen(true)
  }, [])

  // Grid column configurations
  const permissionsColumns = useMemo<GridColDef[]>(() => getPermissionGridColumns(), [])

  const userGroupsColumns = useMemo<GridColDef[]>(() => {
    const noOpToggle = (): void => {
      // Read-only grid, no toggle support required
    }
    return getUserGroupGridColumns(noOpToggle).filter(col => col.field !== 'actions')
  }, [])

  const previewColumns = useMemo<GridColDef[]>(
    () => getUserImportPreviewColumns(handlePreviewErrorClick),
    [handlePreviewErrorClick],
  )

  const columnGroupingModel = useMemo<ColumnGroup[]>(
    () =>
      templateStructure.map(section => ({
        groupId: section.category.toLowerCase().replace(/\s+/g, '-'),
        headerName: section.category,
        children: section.fields,
      })),
    [],
  )

  // Validation summary
  const { hasValidationErrors, errorCount } = useMemo(() => {
    let count = 0
    for (const row of importData) {
      if (row.errors && row.errors.length > 0) {
        count += 1
      }
    }
    return {
      hasValidationErrors: count > 0,
      errorCount: count,
    }
  }, [importData])

  return (
    <>
      {/* Test Data Button - Only show in development */}
      {import.meta.env.DEV && (
        <FillImportTestDataButton
          permissionIds={permissionsRaw.map(p => p.permissionId)}
          userGroupIds={userGroups
            .map(g => g.groupId ?? g.userGroupId ?? 0)
            .filter(id => id !== 0)
            .slice(0, 5)}
        />
      )}

      <Container maxWidth={false} disableGutters className={styles['import-users-page__page-wrapper']}>
        <Box className={styles['import-users-page__container']}>
          {/* Instructions */}
          <ImportInstructions
            instructions={[
              'Download the template file to see the required format',
              'Fill in your user data following the template structure',
              'Upload the file and preview the data',
              'Set the maximum number of records to import',
              'Review and submit the import',
            ]}
          />

          {/* Reference Grids - Permissions and User Groups (stacked vertically) */}
          {/* Permissions Grid (Client-Side Pagination) */}
          <Paper className={styles['import-users-page__reference-card']}>
            <Subheader label="Available Permissions" className={styles['import-users-page__section-title']} />
            <Divider className={styles['import-users-page__divider']} />
            <Box className={styles['import-users-page__grid-wrapper']}>
              <StyledDataGrid
                dataTestId="permissions-reference-grid"
                rows={permissions}
                columns={permissionsColumns}
                getRowId={row => (row as PermissionData).permissionId}
                loading={permissionsLoading}
                paginationMode="client"
                filterMode="client"
                sortingMode="client"
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 10,
                    },
                  },
                }}
                disableRowSelectionOnClick
                autoHeight
                density={permissionsDensity}
                columnVisibilityModel={permissionsColumnVisibility}
                onColumnVisibilityModelChange={setPermissionsColumnVisibility}
                slots={{
                  toolbar: SimpleToolbar as GridSlotsComponent['toolbar'],
                }}
                slotProps={{
                  toolbar: {
                    density: permissionsDensity,
                    onDensityChange: setPermissionsDensity,
                    columns: permissionsColumns,
                    rows: permissions,
                    hideIncludeDeleted: true,
                    hideExport: false,
                    hideFilter: false,
                    hideColumns: false,
                    columnVisibilityModel: permissionsColumnVisibility,
                    onColumnVisibilityChange: setPermissionsColumnVisibility,
                    activeFilterGroup: permissionsActiveFilterGroup,
                    onFiltersChange: setPermissionsActiveFilterGroup,
                  } as GridToolbarProps,
                }}
                showToolbar
                disableColumnMenu={false}
              />
            </Box>
          </Paper>

          {/* User Groups Grid (Server-Side Pagination) */}
          <Paper className={styles['import-users-page__reference-card']}>
            <Subheader label="Available User Groups" className={styles['import-users-page__section-title']} />
            <Divider className={styles['import-users-page__divider']} />
            <Box className={styles['import-users-page__grid-wrapper']}>
              <StyledDataGrid
                dataTestId="user-groups-reference-grid"
                rows={userGroups}
                columns={userGroupsColumns}
                getRowId={row => {
                  const data = row as UserGroupData
                  return data.groupId ?? data.userGroupId ?? 0
                }}
                loading={userGroupsLoading}
                rowCount={userGroupsTotalCount}
                totalCount={userGroupsTotalCount}
                paginationModelState={userGroupsPaginationModel}
                setPaginationModel={setUserGroupsPaginationModel}
                paginationMode="server"
                filterMode="server"
                sortingMode="server"
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                autoHeight
                density={userGroupsDensity}
                columnVisibilityModel={userGroupsColumnVisibility}
                onColumnVisibilityModelChange={setUserGroupsColumnVisibility}
                slots={{
                  toolbar: SimpleToolbar as GridSlotsComponent['toolbar'],
                }}
                slotProps={{
                  toolbar: {
                    density: userGroupsDensity,
                    onDensityChange: setUserGroupsDensity,
                    columns: userGroupsColumns,
                    rows: userGroups,
                    hideIncludeDeleted: true,
                    hideExport: false,
                    columnVisibilityModel: userGroupsColumnVisibility,
                    onColumnVisibilityChange: setUserGroupsColumnVisibility,
                    onFiltersChange: setUserGroupsActiveFilterGroup,
                    activeFilterGroup: userGroupsActiveFilterGroup,
                  } as GridToolbarProps,
                }}
                showToolbar
                disableColumnMenu={false}
              />
            </Box>
          </Paper>

          {/* Import Settings Card with File Upload */}
          <Paper className={styles['import-users-page__settings-card']}>
            <Subheader label="Import Settings" className={styles['import-users-page__section-title']} />
            <Divider className={styles['import-users-page__divider--large']} />

            {/* Top Right - Actions */}
            <Box className={styles['import-users-page__settings-actions']}>
              {/* Download Template */}
              <LinkButton
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}
                className={styles['import-users-page__template-button']}
                size="small"
                label="Download Template"
              />

              {/* Max Records Dropdown */}
              <SelectInput
                label="Max Records"
                value={maxRecords}
                onChange={e => {
                  setMaxRecords(Number(e.target.value))
                }}
                disabled={isLoading}
                options={[
                  {
                    value: 25,
                    label: '25',
                  },
                  {
                    value: 100,
                    label: '100',
                  },
                  {
                    value: 200,
                    label: '200',
                  },
                  {
                    value: 500,
                    label: '500',
                  },
                  {
                    value: 1000,
                    label: '1000',
                  },
                ]}
                size="small"
                margin="none"
                fullWidth={false}
                className={styles['import-users-page__max-records-select']}
              />
            </Box>

            {/* File Upload Area - Below actions */}
            <FileDropZone
              onFileSelect={handleFileSelect}
              onFileClear={handleFileClear}
              currentFile={file}
              accept=".csv,.xlsx,.xls"
              maxSizeMB={10}
              disabled={isLoading}
              isLoading={isLoading}
            />
          </Paper>

          {/* Loading State - Processing File */}
          {isLoading && importData.length === 0 && (
            <Paper className={styles['import-users-page__loading-paper']}>
              <Box className={styles['import-users-page__loading-container']}>
                <CircularProgress size={48} />
                <Typography variant="h6" className={styles['import-users-page__loading-text']}>
                  Processing file...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Parsing and validating data
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Data Preview */}
          {importData.length > 0 && (
            <Paper className={styles['import-users-page__preview-paper']}>
              {/* Header with Title */}
              <Subheader
                label={`Data Preview (${importData.length} records)`}
                className={styles['import-users-page__section-title']}
              />
              <Divider className={styles['import-users-page__divider']} />

              {/* View Toggle - Above the table on top right */}
              <Box className={styles['import-users-page__view-toggle-container']}>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, newMode: 'grid' | 'json' | null) => {
                    if (newMode) {
                      setViewMode(newMode)
                    }
                  }}
                  size="small"
                >
                  <ToggleButton value="grid">
                    <GridIcon fontSize="small" />
                    <BodyText text="Grid" variant="body2" className={styles['import-users-page__toggle-button-text']} />
                  </ToggleButton>
                  <ToggleButton value="json">
                    <JsonIcon fontSize="small" />
                    <BodyText text="JSON" variant="body2" className={styles['import-users-page__toggle-button-text']} />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Content Area */}
              {viewMode === 'grid' ? (
                <Box className={styles['import-users-page__grid-container']}>
                  <StyledDataGrid
                    dataTestId="import-users-preview-grid"
                    rows={importData}
                    columns={previewColumns}
                    columnGroupingModel={columnGroupingModel}
                    getRowId={row => (row as ImportUserData).rowNumber}
                    loading={false}
                    paginationMode="client"
                    filterMode="client"
                    sortingMode="client"
                    pageSizeOptions={[10, 25, 50, 100]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 25 } },
                    }}
                    disableRowSelectionOnClick
                    autoHeight
                    getRowClassName={params => {
                      const row = params.row as ImportUserData
                      return row.errors && row.errors.length > 0 ? styles['import-users-page__error-row'] : ''
                    }}
                    showToolbar={false}
                    disableColumnMenu={false}
                  />
                </Box>
              ) : (
                <Box className={styles['import-users-page__json-container']}>
                  <TableAsJson data={jsonPreviewData} showCopyButton />
                </Box>
              )}
            </Paper>
          )}

          {/* Action Buttons */}
          {importData.length > 0 && (
            <Paper className={styles['import-users-page__actions-card']}>
              {/* Validation Error Warning */}
              {hasValidationErrors && (
                <Box className={styles['import-users-page__error-warning']}>
                  <ErrorIcon className={styles['import-users-page__error-warning-icon']} />
                  <Box>
                    <Typography variant="body2" className={styles['import-users-page__error-warning-text']}>
                      <strong>Cannot import data:</strong> {errorCount} {errorCount === 1 ? 'row has' : 'rows have'}{' '}
                      validation errors.
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Please fix all errors before importing. Click on the red error chips to view details.
                    </Typography>
                  </Box>
                </Box>
              )}

              <Box className={styles['import-users-page__actions']}>
                <RedButton
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    navigate(APP_ROUTES.DASHBOARD.USERS)
                  }}
                  disabled={isLoading}
                  label="Cancel"
                  className={styles['import-users-page__action-button']}
                />
                <BlueButton
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleSubmit}
                  disabled={isLoading || hasValidationErrors}
                  label={isLoading ? 'Importing...' : `Import ${importData.length} Users`}
                  className={styles['import-users-page__action-button']}
                />
              </Box>
            </Paper>
          )}
        </Box>
      </Container>

      {/* Error Details Modal */}
      <ErrorDetailsModal
        open={errorModalOpen}
        onClose={() => {
          setErrorModalOpen(false)
        }}
        title="Validation Errors"
        errors={selectedRowErrors}
        rowIdentifier={selectedRowNumber !== null ? `Row ${selectedRowNumber}` : undefined}
      />
    </>
  )
}

export default ImportUsers
