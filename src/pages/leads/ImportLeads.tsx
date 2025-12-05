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

import { leadApi } from '../../api/leadApi'
import { userApi } from '../../api/userApi'
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
import { BodyText, Subheader } from '../../components/fonts'
import { FileDropZone, SelectInput } from '../../components/form-input'
import { DEFAULT_MAX_RECORDS, MAX_RECORDS_OPTIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import { getUserGridColumns, type UserResponseModel } from '../../models'
import type { LeadRequestModel } from '../../models/api-models'
import {
  getLeadImportPreviewColumns,
  leadImportHeaderNames,
  leadImportTemplateStructure,
  type ImportLeadData,
} from '../../models/bulk-import-models/ImportLeadGridModel'
import styles from '../../styles/Leads.module.scss'
import { type PaginatedGridInterface } from '../../types/grid.types'
import { downloadImportTemplate, parseImportFile } from '../../utils/gridUtil'
import {
  bulkLeadImportSchema as rawBulkLeadImportSchema,
  type BulkLeadImportData,
} from '../../utils/validationSchemas'

import { FillImportTestDataButton } from './components'

// Validator for lead import rows
const bulkLeadImportValidator = rawBulkLeadImportSchema as unknown as ZodType<BulkLeadImportData>

/**
 * Convert ImportLeadData to LeadRequestModel for API
 */
const mapToApiPayload = (lead: ImportLeadData): LeadRequestModel => ({
  firstName: lead.firstName,
  lastName: lead.lastName,
  email: lead.email,
  phone: lead.phone,
  leadStatus: lead.leadStatus,
  company: lead.company,
  title: lead.title,
  companySize: lead.companySize,
  annualRevenue: lead.annualRevenue,
  website: lead.website,
  fax: lead.fax,
  assignedAgentId: lead.assignedAgentId,
  address: {
    streetAddress: lead.streetAddress,
    streetAddress2: lead.streetAddress2,
    streetAddress3: lead.streetAddress3,
    city: lead.city,
    state: lead.state,
    postalCode: lead.postalCode,
    country: lead.country,
    addressType: lead.addressType,
  },
  notes: lead.notes,
})

/**
 * Import Leads Page
 * Features:
 * - Download Excel template
 * - Upload Excel/CSV files
 * - Preview data in grid or JSON format
 * - Set max records limit
 * - Validate and submit bulk import
 */
const ImportLeads = (): React.JSX.Element => {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<ImportLeadData[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'json'>('grid')
  const [maxRecords, setMaxRecords] = useState<number>(DEFAULT_MAX_RECORDS as number)
  const [isLoading, setIsLoading] = useState(false)
  const [jsonPreview, setJsonPreview] = useState<string>('')

  // Error modal state
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [selectedRowErrors, setSelectedRowErrors] = useState<string[]>([])
  const [selectedRowNumber, setSelectedRowNumber] = useState<number | null>(null)

  // Users state (server-side pagination) - for reference
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
   */
  const handleDownloadTemplate = (): void => {
    try {
      downloadImportTemplate({
        templateStructure: leadImportTemplateStructure,
        fileName: 'lead_import_template.xlsx',
        sheetName: 'Leads',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to download template'
      toast.error(message)
    }
  }

  /**
   * Parse Excel/CSV file
   * Uses ExcelRowParser for dynamic column mapping
   * Validates using Zod schema
   */
  const parseFile = useCallback(
    (file: File): void => {
      setIsLoading(true)

      void parseImportFile<ImportLeadData, BulkLeadImportData>({
        file,
        templateStructure: leadImportTemplateStructure,
        headerNames: leadImportHeaderNames,
        maxRecords,
        validator: bulkLeadImportValidator,
        createRowData: ({ rowNumber, getOptionalValue, getRequiredValue }) => {
          // Lead Details
          const firstName = getRequiredValue('firstName')
          const lastName = getRequiredValue('lastName')
          const email = getRequiredValue('email')
          const phone = getRequiredValue('phone')
          const leadStatus = getRequiredValue('leadStatus')
          const title = getOptionalValue('title')
          const assignedAgentIdRaw = getRequiredValue('assignedAgentId')

          // Company Details
          const company = getOptionalValue('company')
          const companySizeRaw = getOptionalValue('companySize')
          const annualRevenue = getOptionalValue('annualRevenue')
          const website = getOptionalValue('website')
          const fax = getOptionalValue('fax')

          // Address
          const streetAddress = getRequiredValue('streetAddress')
          const streetAddress2 = getOptionalValue('streetAddress2')
          const streetAddress3 = getOptionalValue('streetAddress3')
          const city = getRequiredValue('city')
          const state = getRequiredValue('state')
          const postalCode = getRequiredValue('postalCode')
          const country = getRequiredValue('country')
          const addressType = getRequiredValue('addressType')

          // Notes
          const notes = getOptionalValue('notes')

          // Parse company size as number
          const companySize = companySizeRaw ? parseInt(String(companySizeRaw), 10) : undefined

          // Parse assigned agent ID
          const assignedAgentId = assignedAgentIdRaw ? parseInt(String(assignedAgentIdRaw), 10) : 0

          // Create validation payload for Zod schema
          const validationPayload: BulkLeadImportData = {
            firstName: String(firstName || ''),
            lastName: String(lastName || ''),
            email: String(email || ''),
            phone: String(phone || ''),
            leadStatus: String(leadStatus || ''),
            company: company ? String(company) : '',
            title: title ? String(title) : '',
            companySize: companySizeRaw ? String(companySizeRaw) : '',
            annualRevenue: annualRevenue ? String(annualRevenue) : '',
            website: website ? String(website) : '',
            fax: fax ? String(fax) : '',
            assignedAgentId: String(assignedAgentIdRaw || ''),
            streetAddress: String(streetAddress || ''),
            streetAddress2: streetAddress2 ? String(streetAddress2) : '',
            streetAddress3: streetAddress3 ? String(streetAddress3) : '',
            city: String(city || ''),
            state: String(state || ''),
            postalCode: String(postalCode || ''),
            country: String(country || ''),
            addressType: String(addressType || ''),
            notes: notes ? String(notes) : '',
          }

          const parsedRow: ImportLeadData = {
            rowNumber,
            firstName: String(firstName || ''),
            lastName: String(lastName || ''),
            email: String(email || ''),
            phone: String(phone || ''),
            leadStatus: String(leadStatus || ''),
            company: company ? String(company) : undefined,
            title: title ? String(title) : undefined,
            companySize: !isNaN(companySize ?? NaN) ? companySize : undefined,
            annualRevenue: annualRevenue ? String(annualRevenue) : undefined,
            website: website ? String(website) : undefined,
            fax: fax ? String(fax) : undefined,
            assignedAgentId,
            streetAddress: String(streetAddress || ''),
            streetAddress2: streetAddress2 ? String(streetAddress2) : undefined,
            streetAddress3: streetAddress3 ? String(streetAddress3) : undefined,
            city: String(city || ''),
            state: String(state || ''),
            postalCode: String(postalCode || ''),
            country: String(country || ''),
            addressType: String(addressType || ''),
            notes: notes ? String(notes) : undefined,
          }

          /* eslint-disable @typescript-eslint/no-unsafe-assignment */
          const result: { parsedRow: ImportLeadData; validationPayload: BulkLeadImportData } = {
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
              (result): ImportLeadData => ({
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
   * Fetch users (server-side pagination) - for agent reference
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
  const generateImportJSON = useCallback((): LeadRequestModel[] => {
    return importData.map(mapToApiPayload)
  }, [importData])

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
      return JSON.parse(jsonPreview) as LeadRequestModel[]
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
    const hasErrors = importData.some((lead: ImportLeadData) => lead.errors && lead.errors.length > 0)
    if (hasErrors) {
      toast.error('Please fix validation errors before submitting')
      return
    }

    setIsLoading(true)
    try {
      // Generate import payload
      const payload: LeadRequestModel[] = importData.map(mapToApiPayload)

      // Call bulk create API
      await leadApi.bulkCreateLeads(payload)

      // Show success message
      toast.success(
        `Bulk import started for ${importData.length} leads! You will receive a message with the results when processing completes.`,
      )

      // Navigate to leads page
      navigate(APP_ROUTES.DASHBOARD.LEADS)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import leads'
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

  // Grid column configurations for Users grid (for agent reference)
  const usersColumns = useMemo<GridColDef[]>(() => {
    const noOpToggle = (): void => {
      // Read-only grid, no toggle support required
    }
    const allColumns = getUserGridColumns(noOpToggle)

    // Filter out actions column
    const filteredColumns = allColumns.filter(col => col.field !== 'userActions')

    // Override userId column configuration
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
    () => getLeadImportPreviewColumns(handlePreviewErrorClick),
    [handlePreviewErrorClick],
  )

  // Column grouping for preview grid (parent headers)
  const columnGroupingModel = useMemo<ColumnGroup[]>(
    () =>
      leadImportTemplateStructure.map(section => ({
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
      {import.meta.env.DEV && <FillImportTestDataButton />}

      <Container maxWidth={false} disableGutters className={styles['import-leads-page__page-wrapper']}>
        <Box className={styles['import-leads-page__container']}>
          {/* Instructions */}
          <ImportInstructions
            instructions={[
              'Download the template file to see the required format',
              'Fill in your lead data following the template structure',
              'Assigned Agent ID is required - use the reference grid below',
              'Valid lead statuses: Not Contacted, Attempted To Contact, Contacted, Contact In Future, Re Qualified, Not Qualified, Lost Lead, Junk Lead',
              'Upload the file and preview the data',
              'Review and submit the import',
            ]}
          />

          {/* Users Reference Grid (for Agent IDs) */}
          <Paper className={styles['import-leads-page__reference-card']}>
            <Subheader label="Available Agents (Users)" className={styles['import-leads-page__section-title']} />
            <Divider className={styles['import-leads-page__divider']} />
            <Box className={styles['import-leads-page__grid-wrapper']}>
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
          <Paper className={styles['import-leads-page__settings-card']}>
            <Subheader label="Import Settings" className={styles['import-leads-page__section-title']} />
            <Divider className={styles['import-leads-page__divider--large']} />

            {/* Top Right - Actions */}
            <Box className={styles['import-leads-page__settings-actions']}>
              {/* Download Template */}
              <LinkButton
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}
                className={styles['import-leads-page__template-button']}
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
                className={styles['import-leads-page__max-records-select']}
              />
            </Box>

            {/* File Upload Area */}
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
            <Paper className={styles['import-leads-page__loading-paper']}>
              <Box className={styles['import-leads-page__loading-container']}>
                <CircularProgress size={48} />
                <Typography variant="h6" className={styles['import-leads-page__loading-text']}>
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
            <Paper className={styles['import-leads-page__preview-paper']}>
              {/* Header with Title */}
              <Subheader
                label={`Data Preview (${importData.length} records)`}
                className={styles['import-leads-page__section-title']}
              />
              <Divider className={styles['import-leads-page__divider']} />

              {/* View Toggle */}
              <Box className={styles['import-leads-page__view-toggle-container']}>
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
                    <BodyText text="Grid" variant="body2" className={styles['import-leads-page__toggle-button-text']} />
                  </ToggleButton>
                  <ToggleButton value="json">
                    <JsonIcon fontSize="small" />
                    <BodyText text="JSON" variant="body2" className={styles['import-leads-page__toggle-button-text']} />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Content Area */}
              {viewMode === 'grid' ? (
                <Box className={styles['import-leads-page__grid-container']}>
                  <StyledDataGrid
                    dataTestId="import-leads-preview-grid"
                    rows={importData}
                    columns={previewColumns}
                    columnGroupingModel={columnGroupingModel}
                    getRowId={row => (row as unknown as ImportLeadData).rowNumber}
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
                      const row = params.row as unknown as ImportLeadData
                      return row.errors && row.errors.length > 0 ? styles['import-leads-page__error-row'] : ''
                    }}
                    showToolbar={false}
                    disableColumnMenu={false}
                  />
                </Box>
              ) : (
                <Box className={styles['import-leads-page__json-container']}>
                  <TableAsJson data={jsonPreviewData} showCopyButton />
                </Box>
              )}
            </Paper>
          )}

          {/* Action Buttons */}
          {importData.length > 0 && (
            <Paper className={styles['import-leads-page__actions-card']}>
              {/* Validation Error Warning */}
              {hasValidationErrors && (
                <Box className={styles['import-leads-page__error-warning']}>
                  <ErrorIcon className={styles['import-leads-page__error-warning-icon']} />
                  <Box>
                    <Typography variant="body2" className={styles['import-leads-page__error-warning-text']}>
                      <strong>Cannot import data:</strong> {errorCount} {errorCount === 1 ? 'row has' : 'rows have'}{' '}
                      validation errors.
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Please fix all errors before importing. Click on the red error chips to view details.
                    </Typography>
                  </Box>
                </Box>
              )}

              <Box className={styles['import-leads-page__actions']}>
                <RedButton
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    navigate(APP_ROUTES.DASHBOARD.LEADS)
                  }}
                  disabled={isLoading}
                  label="Cancel"
                  className={styles['import-leads-page__action-button']}
                />
                <BlueButton
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleSubmit}
                  disabled={isLoading || hasValidationErrors}
                  label={isLoading ? 'Importing...' : `Import ${importData.length} Leads`}
                  className={styles['import-leads-page__action-button']}
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

export default ImportLeads
