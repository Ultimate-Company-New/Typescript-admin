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
} from '@mui/material'
import type { GridColDef, GridColumnVisibilityModel, GridSlotsComponent, GridToolbarProps } from '@mui/x-data-grid'

import { userApi } from '../../api/userApi'
import {
  bulkCreateUserGroups,
  type BulkUserGroupImportRequest,
  type UserGroupBulkCreateItem,
} from '../../api/userGroupApi'
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
} from '../../components/datagrid'
import { BodyText, SecondaryFont, Subheader } from '../../components/fonts'
import { FileDropZone, SelectInput } from '../../components/form-input'
import { DEFAULT_MAX_RECORDS, MAX_RECORDS_OPTIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import { getUserGridColumns, type UserResponseModel } from '../../models'
import {
  getUserGroupImportPreviewColumns,
  userGroupImportHeaderNames,
  userGroupImportTemplateStructure,
  type ImportUserGroupData,
} from '../../models/bulk-import-models/ImportUserGroupGridModel'
import styles from '../../styles/Users.module.scss'
import { type PaginatedGridInterface } from '../../types/grid.types'
import { downloadImportTemplate, parseImportFile } from '../../utils/gridUtil'
import {
  bulkUserGroupImportSchema as rawBulkUserGroupImportSchema,
  type BulkUserGroupImportData,
} from '../../utils/validationSchemas'

import { FillImportTestDataButton } from './components'

// Validator for user group import rows
const bulkUserGroupImportValidator = rawBulkUserGroupImportSchema as unknown as ZodType<BulkUserGroupImportData>

/**
 * Convert ImportUserGroupData to UserGroupBulkCreateItem for API
 */
const mapToApiPayload = (group: ImportUserGroupData): UserGroupBulkCreateItem => ({
  groupName: group.name,
  description: group.description,
  notes: group.notes,
  userIds: group.userIds,
})

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
  const [maxRecords, setMaxRecords] = useState<number>(DEFAULT_MAX_RECORDS as number)
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
    userId: true, // Show userId column for import reference
  })

  /**
   * Download Excel template with merged category headers
   * Template structure matches UserGroupRequestModel columns
   */
  const handleDownloadTemplate = (): void => {
    try {
      downloadImportTemplate({
        templateStructure: userGroupImportTemplateStructure,
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
   * Validates using Zod schema (same rules as AddEditUserGroup form)
   */
  const parseFile = useCallback(
    (file: File): void => {
      setIsLoading(true)

      void parseImportFile<ImportUserGroupData, BulkUserGroupImportData>({
        file,
        templateStructure: userGroupImportTemplateStructure,
        headerNames: userGroupImportHeaderNames,
        maxRecords,
        validator: bulkUserGroupImportValidator,
        createRowData: ({ rowNumber, rowParser: _rowParser, getOptionalValue, getRequiredValue }) => {
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

          // Create validation payload for Zod schema
          const validationPayload: BulkUserGroupImportData = {
            name: nameValue,
            description: descriptionValue,
            notes: notesValue ?? '',
            userIds: userIdsRaw,
          }

          const parsedRow: ImportUserGroupData = {
            rowNumber,
            name: String(nameValue || ''),
            description: String(descriptionValue || ''),
            notes: notesValue ? String(notesValue) : undefined,
            userIds,
          }

          /* eslint-disable @typescript-eslint/no-unsafe-assignment */
          // Return typed result - validationPayload is explicitly typed as BulkUserGroupImportData
          const result: { parsedRow: ImportUserGroupData; validationPayload: BulkUserGroupImportData } = {
            parsedRow,
            validationPayload,
          }
          /* eslint-enable @typescript-eslint/no-unsafe-assignment */
          return result
        },
      })
        .then(results => {
          setImportData(
            results.map(
              (result): ImportUserGroupData => ({
                ...result.data,
                errors: result.errors && result.errors.length > 0 ? result.errors : undefined,
              }),
            ),
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
    const userGroups: UserGroupBulkCreateItem[] = importData.map(mapToApiPayload)
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
    const hasErrors = importData.some((group: ImportUserGroupData) => group.errors && group.errors.length > 0)
    if (hasErrors) {
      toast.error('Please fix validation errors before submitting')
      return
    }

    setIsLoading(true)
    try {
      // Generate import payload
      const payload: UserGroupBulkCreateItem[] = importData.map(mapToApiPayload)

      // Call bulk create API - triggers async processing
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await bulkCreateUserGroups(payload)

      // Show success message - results will be sent via notification
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

    // Filter out actions column
    const filteredColumns = allColumns.filter(col => col.field !== 'userActions')

    // Find and override userId column configuration to make it visible and filterable
    return filteredColumns.map(col => {
      if (col.field === 'userId') {
        return {
          ...col,
          width: 80,
          minWidth: 80,
          hideable: true,
          filterable: true,
          headerName: 'User ID',
          align: 'center' as const,
          headerAlign: 'center' as const,
          type: 'number' as const,
        }
      }
      return col
    })
  }, [])

  const previewColumns = useMemo<GridColDef[]>(
    () => getUserGroupImportPreviewColumns(handlePreviewErrorClick),
    [handlePreviewErrorClick],
  )

  // Column grouping for preview grid (parent headers)
  const columnGroupingModel = useMemo<ColumnGroup[]>(
    () =>
      userGroupImportTemplateStructure.map(section => ({
        groupId: section.category.toLowerCase().replace(/\s+/g, '-'),
        headerName: section.category,
        children: section.fields,
      })),
    [],
  )

  // Validation summary
  const { hasValidationErrors, errorCount } = useMemo((): { hasValidationErrors: boolean; errorCount: number } => {
    let count = 0
    for (const row of importData) {
      const typedRow = row as unknown as ImportUserGroupData
      if (typedRow.errors && typedRow.errors.length > 0) {
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
      {import.meta.env.DEV && <FillImportTestDataButton />}

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
                options={(MAX_RECORDS_OPTIONS as readonly number[]).map((value: number) => ({
                  value,
                  label: String(value),
                }))}
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
                <Subheader label="Processing file..." className={styles['import-users-page__loading-text']} />
                <SecondaryFont className={styles['import-users-page__loading-subtext']}>
                  Parsing and validating data
                </SecondaryFont>
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
                    columnGroupingModel={columnGroupingModel}
                    getRowId={row => (row as unknown as ImportUserGroupData).rowNumber}
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
                      const row = params.row as unknown as ImportUserGroupData
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
                    <BodyText variant="body2" className={styles['import-users-page__error-warning-text']}>
                      <strong>Cannot import data:</strong> {errorCount} {errorCount === 1 ? 'row has' : 'rows have'}{' '}
                      validation errors.
                    </BodyText>
                    <SecondaryFont className={styles['import-users-page__error-warning-caption']}>
                      Please fix all errors before importing. Click on the red error chips to view details.
                    </SecondaryFont>
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
