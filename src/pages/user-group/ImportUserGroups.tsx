import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

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
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import type { GridColDef, GridColumnVisibilityModel, GridSlotsComponent, GridToolbarProps } from '@mui/x-data-grid'

import { userApi } from '../../api/userApi'
import { bulkCreateUserGroups, type UserGroupBulkCreateItem } from '../../api/userGroupApi'
import { ImportInstructions } from '../../components'
import { BlueButton, LinkButton, RedButton } from '../../components/buttons'
import {
  ErrorDetailsModal,
  GridDensity,
  LogicOperator,
  SimpleToolbar,
  StyledDataGrid,
  TableAsJson,
  type FilterGroup,
  type GridDensityType,
} from '../../components/datagrid'
import { BodyText, Subheader } from '../../components/fonts'
import { FileDropZone, SelectInput } from '../../components/form-input'
import { APP_ROUTES } from '../../constants/routes'
import { getUserGridColumns, type UserResponseModel } from '../../models'
import styles from '../../styles/Users.module.scss'
import { type PaginatedGridInterface } from '../../types/grid.types'
import { downloadImportTemplate, parseImportFile } from '../../utils/gridUtil'

/**
 * Interface for parsed user group data from Excel/CSV
 */
interface ImportUserGroupData {
  rowNumber: number
  name: string
  description: string
  notes?: string
  userIds: number[]
  errors?: string[]
}

/**
 * Template structure for Excel generation
 */
const templateStructure = [
  {
    category: 'Group Information',
    fields: ['name', 'description', 'notes'],
  },
  {
    category: 'Members',
    fields: ['userIds'],
  },
]

/**
 * Custom header names for display
 */
const headerNames: Record<string, string> = {
  name: 'Group Name',
  description: 'Description',
  notes: 'Notes',
  userIds: 'User IDs (comma-separated)',
}

/**
 * JSON structure for bulk user group import API
 */
interface BulkUserGroupImportRequest {
  maxRecords: number
  userGroups: Array<{
    groupName: string
    description: string
    notes?: string
    userIds: number[]
  }>
}

/**
 * Import User Groups Page
 * Features:
 * - Download Excel template
 * - Upload Excel/CSV files
 * - Preview data in grid or JSON format
 * - Set max records limit
 * - Validate and submit bulk import
 */
const ImportUserGroups = (): React.JSX.Element => {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<ImportUserGroupData[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'json'>('grid')
  const [maxRecords, setMaxRecords] = useState<number>(25)
  const [isLoading, setIsLoading] = useState(false)
  const [jsonPreview, setJsonPreview] = useState<string>('')

  // Error modal state
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [selectedRowErrors, setSelectedRowErrors] = useState<string[]>([])
  const [selectedRowNumber, setSelectedRowNumber] = useState<number | null>(null)

  // Users state (server-side pagination)
  const [users, setUsers] = useState<UserResponseModel[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersTotalCount, setUsersTotalCount] = useState(0)
  const [usersPaginationModel, setUsersPaginationModel] = useState<PaginatedGridInterface>({
    start: 0,
    end: 10,
    pageSize: 10,
    includeDeleted: false,
    actualDataCount: 0,
    totalPaginationBlockCount: 0,
  })
  const [usersActiveFilterGroup, setUsersActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })
  const [usersDensity, setUsersDensity] = useState<GridDensityType>(GridDensity.STANDARD)
  const [usersColumnVisibility, setUsersColumnVisibility] = useState<GridColumnVisibilityModel>({
    isDeleted: false,
  })

  /**
   * Download Excel template with merged category headers
   * Template structure matches UserGroupRequestModel columns
   */
  const handleDownloadTemplate = (): void => {
    try {
      downloadImportTemplate({
        templateStructure,
        fileName: 'user_group_import_template.xlsx',
        sheetName: 'UserGroups',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to download template'
      toast.error(message)
    }
  }

  /**
   * Parse Excel/CSV file
   * Uses ExcelRowParser for dynamic column mapping
   */
  const parseFile = useCallback(
    (file: File): void => {
      setIsLoading(true)

      void parseImportFile<ImportUserGroupData, unknown>({
        file,
        templateStructure,
        headerNames,
        maxRecords,
        validator: undefined, // Simple validation in createRowData
        createRowData: ({ rowNumber, getOptionalValue, getRequiredValue }) => {
          const nameValue = getRequiredValue('name')
          const descriptionValue = getRequiredValue('description')
          const notesValue = getOptionalValue('notes')
          const userIdsRaw = getRequiredValue('userIds')

          // Parse user IDs (comma-separated)
          const userIds: number[] = []
          if (userIdsRaw) {
            userIds.push(
              ...String(userIdsRaw)
                .split(',')
                .map(id => parseInt(id.trim(), 10))
                .filter(id => !isNaN(id)),
            )
          }

          // Validation errors
          const errors: string[] = []
          if (!nameValue || String(nameValue).trim() === '') {
            errors.push('Group name is required')
          }
          if (!descriptionValue || String(descriptionValue).trim() === '') {
            errors.push('Description is required')
          }
          if (userIds.length === 0) {
            errors.push('At least one user ID is required')
          }

          const parsedRow: ImportUserGroupData = {
            rowNumber,
            name: String(nameValue || ''),
            description: String(descriptionValue || ''),
            notes: notesValue ? String(notesValue) : undefined,
            userIds,
            errors: errors.length > 0 ? errors : undefined,
          }

          return {
            parsedRow,
            validationPayload: {},
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
   * Fetch users (server-side pagination)
   */
  const fetchUsers = useCallback(async (): Promise<void> => {
    setUsersLoading(true)
    try {
      const response = await userApi.fetchUsersInCarrierInBatches({
        start: usersPaginationModel.start,
        end: usersPaginationModel.end,
        pageSize: usersPaginationModel.pageSize,
        includeDeleted: false,
        logicOperator: usersActiveFilterGroup.logicOperator,
        filters: usersActiveFilterGroup.filters as never,
      })

      // API response already matches grid structure
      setUsers(response.data)
      setUsersTotalCount(response.totalDataCount)
    } catch {
      toast.error('Failed to fetch users')
      setUsers([])
      setUsersTotalCount(0)
    } finally {
      setUsersLoading(false)
    }
  }, [usersPaginationModel, usersActiveFilterGroup])

  /**
   * Generate JSON structure for API
   */
  const generateImportJSON = useCallback((): BulkUserGroupImportRequest => {
    const userGroups = importData.map(group => ({
      groupName: group.name,
      description: group.description,
      notes: group.notes,
      userIds: group.userIds,
    }))

    return {
      maxRecords,
      userGroups,
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
      const parsed = JSON.parse(jsonPreview) as BulkUserGroupImportRequest
      // Only show the userGroups array, not the wrapper object with maxRecords
      return parsed.userGroups
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
    const hasErrors = importData.some(group => group.errors && group.errors.length > 0)
    if (hasErrors) {
      toast.error('Please fix validation errors before submitting')
      return
    }

    setIsLoading(true)
    try {
      // Generate import payload
      const payload: UserGroupBulkCreateItem[] = importData.map(group => ({
        groupName: group.name,
        description: group.description,
        notes: group.notes,
        userIds: group.userIds,
      }))

      // Call bulk create API
      await bulkCreateUserGroups(payload)

      // Show success message
      toast.success(
        `Bulk import started for ${importData.length} user groups! You will receive a message with the results when processing completes.`,
      )

      // Navigate to groups page immediately
      navigate(APP_ROUTES.DASHBOARD.GROUPS)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import user groups'
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

  // Fetch users on mount and when pagination changes
  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  // Grid column configurations for Users grid
  const usersColumns = useMemo<GridColDef[]>(() => {
    const noOpToggle = (): void => {
      // Read-only grid, no toggle support required
    }
    const allColumns = getUserGridColumns(noOpToggle)

    // Filter out actions column and add userId column if not present
    const filteredColumns = allColumns.filter(col => col.field !== 'userActions')

    // Check if userId column exists and is visible
    const userIdColumnIndex = filteredColumns.findIndex(col => col.field === 'userId')
    if (userIdColumnIndex !== -1) {
      // Make userId column visible
      filteredColumns[userIdColumnIndex] = {
        ...filteredColumns[userIdColumnIndex],
        width: 80,
        minWidth: 80,
        hideable: true,
        filterable: true,
      }
    }

    return filteredColumns
  }, [])

  const previewColumns = useMemo<GridColDef[]>(
    () => [
      {
        field: 'rowNumber',
        headerName: 'Row',
        width: 70,
        align: 'center',
        headerAlign: 'center',
      },
      {
        field: 'name',
        headerName: 'Group Name',
        flex: 1.5,
        minWidth: 200,
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 2,
        minWidth: 300,
      },
      {
        field: 'notes',
        headerName: 'Notes',
        flex: 1,
        minWidth: 150,
      },
      {
        field: 'userIds',
        headerName: 'User Count',
        width: 120,
        align: 'center',
        headerAlign: 'center',
        valueGetter: (value: unknown): number => (Array.isArray(value) ? value.length : 0),
      },
      {
        field: 'errors',
        headerName: 'Status',
        width: 120,
        renderCell: params => {
          const rowData = params.row as ImportUserGroupData
          if (rowData.errors && rowData.errors.length > 0) {
            return (
              <Tooltip title="Click to view errors">
                <Chip
                  label="Error"
                  color="error"
                  size="small"
                  onClick={e => {
                    e.stopPropagation()
                    handlePreviewErrorClick(rowData.errors ?? [], rowData.rowNumber)
                  }}
                  sx={{ cursor: 'pointer' }}
                />
              </Tooltip>
            )
          }
          return <Chip label="Valid" color="success" size="small" />
        },
      },
    ],
    [handlePreviewErrorClick],
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
      <Container maxWidth={false} disableGutters className={styles['import-users-page__page-wrapper']}>
        <Box className={styles['import-users-page__container']}>
          {/* Instructions */}
          <ImportInstructions
            instructions={[
              'Download the template file to see the required format',
              'Fill in your user group data following the template structure',
              'User IDs should be comma-separated (e.g., 1,2,3,4)',
              'Upload the file and preview the data',
              'Review and submit the import',
            ]}
          />

          {/* Users Reference Grid (Server-Side Pagination) */}
          <Paper className={styles['import-users-page__reference-card']}>
            <Subheader label="Available Users" className={styles['import-users-page__section-title']} />
            <Divider className={styles['import-users-page__divider']} />
            <Box className={styles['import-users-page__grid-wrapper']}>
              <StyledDataGrid
                dataTestId="users-reference-grid"
                rows={users}
                columns={usersColumns}
                getRowId={row => (row as UserResponseModel).userId}
                loading={usersLoading}
                rowCount={usersTotalCount}
                totalCount={usersTotalCount}
                paginationModelState={usersPaginationModel}
                setPaginationModel={setUsersPaginationModel}
                paginationMode="server"
                filterMode="server"
                sortingMode="server"
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                autoHeight
                density={usersDensity}
                columnVisibilityModel={usersColumnVisibility}
                onColumnVisibilityModelChange={setUsersColumnVisibility}
                slots={{
                  toolbar: SimpleToolbar as GridSlotsComponent['toolbar'],
                }}
                slotProps={{
                  toolbar: {
                    density: usersDensity,
                    onDensityChange: setUsersDensity,
                    columns: usersColumns,
                    rows: users,
                    hideIncludeDeleted: true,
                    hideExport: false,
                    columnVisibilityModel: usersColumnVisibility,
                    onColumnVisibilityChange: setUsersColumnVisibility,
                    onFiltersChange: setUsersActiveFilterGroup,
                    activeFilterGroup: usersActiveFilterGroup,
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
                    dataTestId="import-user-groups-preview-grid"
                    rows={importData}
                    columns={previewColumns}
                    getRowId={row => (row as ImportUserGroupData).rowNumber}
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
                      const row = params.row as ImportUserGroupData
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
                    navigate(APP_ROUTES.DASHBOARD.GROUPS)
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
                  label={isLoading ? 'Importing...' : `Import ${importData.length} Groups`}
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

export default ImportUserGroups
