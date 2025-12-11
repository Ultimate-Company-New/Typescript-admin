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
  CircularProgress,
  Container,
  Divider,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import type { GridColDef, GridColumnVisibilityModel, GridSlotsComponent, GridToolbarProps } from '@mui/x-data-grid'

import { pickupLocationApi } from '../../api/pickupLocationApi'
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
import { ADDRESS_TYPES_ARRAY, DEFAULT_MAX_RECORDS, MAX_RECORDS_OPTIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import {
  getPickupLocationImportPreviewColumns,
  pickupLocationImportHeaderNames,
  pickupLocationImportTemplateStructure,
  type ImportPickupLocationData,
} from '../../models/bulk-import-models'
import { getAddressTypeGridColumns, type AddressTypeData } from '../../models/grid-models'
import styles from '../../styles/PickupLocations.module.scss'
import { applyLocalFilters, downloadImportTemplate, parseImportFile } from '../../utils/gridUtil'
import { FillImportTestDataButton } from './components'

/**
 * API Payload interface for pickup location bulk create
 */
interface PickupLocationApiPayload {
  addressNickName: string
  notes?: string
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
}

/**
 * Convert ImportPickupLocationData to API payload
 */
const mapToApiPayload = (data: ImportPickupLocationData): PickupLocationApiPayload => ({
  addressNickName: data.addressNickName,
  notes: data.notes,
  address: {
    streetAddress: data.streetAddress,
    streetAddress2: data.streetAddress2,
    streetAddress3: data.streetAddress3,
    city: data.city,
    state: data.state,
    postalCode: data.postalCode,
    country: data.country,
    addressType: data.addressType,
    nameOnAddress: data.nameOnAddress,
    emailOnAddress: data.emailOnAddress,
    phoneOnAddress: data.phoneOnAddress,
  },
})

/**
 * Import Pickup Locations Page
 * Features:
 * - Download Excel template
 * - Upload Excel/CSV files
 * - Preview data in grid or JSON format
 * - Address Types reference grid
 * - Set max records limit
 * - Validate and submit bulk import
 */
const ImportPickupLocations = (): React.JSX.Element => {
  const navigate = useNavigate()

  // ============================================================================
  // Address Types Grid State (Local Filtering)
  // ============================================================================
  const [addressTypesRaw] = useState<AddressTypeData[]>(() =>
    ADDRESS_TYPES_ARRAY.map((type, index) => ({
      id: index + 1,
      value: type,
    })),
  )
  const [addressTypes, setAddressTypes] = useState<AddressTypeData[]>(addressTypesRaw)
  const [addressTypesDensity, setAddressTypesDensity] = useState<GridDensityType>(GridDensity.STANDARD)
  const [addressTypesColumnVisibility, setAddressTypesColumnVisibility] = useState<GridColumnVisibilityModel>({})
  const [addressTypesActiveFilterGroup, setAddressTypesActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })

  // ============================================================================
  // Import State
  // ============================================================================
  const [file, setFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<ImportPickupLocationData[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'json'>('grid')
  const [maxRecords, setMaxRecords] = useState<number>(DEFAULT_MAX_RECORDS as number)
  const [isLoading, setIsLoading] = useState(false)
  const [jsonPreview, setJsonPreview] = useState<string>('')

  // Error modal state
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [selectedRowErrors, setSelectedRowErrors] = useState<string[]>([])
  const [selectedRowNumber, setSelectedRowNumber] = useState<number | null>(null)

  // ============================================================================
  // Apply local filters for Address Types
  // ============================================================================
  useEffect(() => {
    if (addressTypesRaw.length > 0) {
      const filteredData = applyLocalFilters(addressTypesRaw, addressTypesActiveFilterGroup)
      setAddressTypes(filteredData)
    }
  }, [addressTypesRaw, addressTypesActiveFilterGroup])

  // ============================================================================
  // Error Click Handler for Preview Grid
  // ============================================================================
  const handlePreviewErrorClick = useCallback((errors: string[], rowNumber: number): void => {
    setSelectedRowErrors(errors)
    setSelectedRowNumber(rowNumber)
    setErrorModalOpen(true)
  }, [])

  // ============================================================================
  // Grid Column Definitions
  // ============================================================================
  const addressTypesColumns = useMemo<GridColDef[]>(() => getAddressTypeGridColumns(), [])

  // Import preview columns
  const previewColumns = useMemo<GridColDef[]>(
    () => getPickupLocationImportPreviewColumns(handlePreviewErrorClick),
    [handlePreviewErrorClick],
  )

  // Column grouping for preview grid (parent headers)
  const columnGroupingModel = useMemo<ColumnGroup[]>(
    () =>
      pickupLocationImportTemplateStructure.map(section => ({
        groupId: section.category.toLowerCase().replace(/\s+/g, '-'),
        headerName: section.category,
        children: section.fields,
      })),
    [],
  )

  // ============================================================================
  // Generate JSON for Preview
  // ============================================================================
  const generateImportJSON = useCallback((): PickupLocationApiPayload[] => {
    return importData.map(mapToApiPayload)
  }, [importData])

  // Update JSON preview when switching to JSON view
  useEffect(() => {
    if (viewMode === 'json' && importData.length > 0) {
      const json = generateImportJSON()
      setJsonPreview(JSON.stringify(json, null, 2))
    }
  }, [viewMode, importData, generateImportJSON])

  const jsonPreviewData = useMemo<unknown>(() => {
    if (!jsonPreview) return []
    try {
      return JSON.parse(jsonPreview) as PickupLocationApiPayload[]
    } catch {
      return []
    }
  }, [jsonPreview])

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

  // ============================================================================
  // Import Handlers
  // ============================================================================

  /**
   * Download Excel template
   */
  const handleDownloadTemplate = (): void => {
    try {
      downloadImportTemplate({
        templateStructure: pickupLocationImportTemplateStructure,
        fileName: 'pickup_location_import_template.xlsx',
        sheetName: 'Pickup Locations',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to download template'
      toast.error(message)
    }
  }

  /**
   * Parse Excel/CSV file
   * Uses parseImportFile for dynamic column mapping
   */
  const parseFile = useCallback(
    (file: File): void => {
      setIsLoading(true)

      void parseImportFile<ImportPickupLocationData, ImportPickupLocationData>({
        file,
        templateStructure: pickupLocationImportTemplateStructure,
        headerNames: pickupLocationImportHeaderNames,
        maxRecords,
        createRowData: ({ rowNumber, getOptionalValue, getRequiredValue }) => {
          // Location Information
          const addressNickName = getRequiredValue('addressNickName')

          // Address Details
          const streetAddress = getRequiredValue('streetAddress')
          const streetAddress2 = getOptionalValue('streetAddress2')
          const streetAddress3 = getOptionalValue('streetAddress3')
          const city = getRequiredValue('city')
          const state = getRequiredValue('state')
          const postalCode = getRequiredValue('postalCode')
          const country = getRequiredValue('country')
          const addressType = getRequiredValue('addressType')
          const nameOnAddress = getOptionalValue('nameOnAddress')
          const emailOnAddress = getOptionalValue('emailOnAddress')
          const phoneOnAddress = getOptionalValue('phoneOnAddress')

          // Additional Fields
          const notes = getOptionalValue('notes')

          const parsedRow: ImportPickupLocationData = {
            rowNumber,
            addressNickName: String(addressNickName || ''),
            streetAddress: String(streetAddress || ''),
            streetAddress2: streetAddress2 ? String(streetAddress2) : undefined,
            streetAddress3: streetAddress3 ? String(streetAddress3) : undefined,
            city: String(city || ''),
            state: String(state || ''),
            postalCode: String(postalCode || ''),
            country: String(country || ''),
            addressType: String(addressType || '').toUpperCase(),
            nameOnAddress: nameOnAddress ? String(nameOnAddress) : undefined,
            emailOnAddress: emailOnAddress ? String(emailOnAddress) : undefined,
            phoneOnAddress: phoneOnAddress ? String(phoneOnAddress) : undefined,
            notes: notes ? String(notes) : undefined,
          }

          // No validation schema for now - just return the parsed row
          return {
            parsedRow,
            validationPayload: parsedRow,
          }
        },
      })
        .then(results => {
          setImportData(
            results.map(
              (result): ImportPickupLocationData => ({
                ...result.data,
                errors: result.errors && result.errors.length > 0 ? result.errors : undefined,
              }),
            ),
          )
          toast.success(`Parsed ${results.length} pickup locations successfully!`)
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
   * Submit bulk import to API
   */
  const handleSubmit = async (): Promise<void> => {
    if (importData.length === 0) {
      toast.error('No data to import')
      return
    }

    // Check for rows with errors
    if (hasValidationErrors) {
      toast.error(`Cannot import: ${errorCount} row(s) have validation errors. Please fix them first.`)
      return
    }

    setIsLoading(true)
    try {
      // Map to API payload format
      const apiPayload = importData.map(mapToApiPayload)

      // Call bulk create API
      await pickupLocationApi.bulkCreatePickupLocations(apiPayload)

      toast.success(
        `Bulk import started for ${importData.length} pickup locations! You will receive a message with the results when processing completes.`
      )

      navigate(APP_ROUTES.DASHBOARD.PICKUP_LOCATIONS)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import pickup locations'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Container maxWidth={false} disableGutters className={styles['import-pickup-locations-page__page-wrapper']}>
        <Box className={styles['import-pickup-locations-page__container']}>
          {/* Instructions */}
          <ImportInstructions
            title="Import Instructions"
            instructions={[
              'Download the template file to see the required format',
              'Fill in your pickup location data following the template structure',
              'Address Type must be one of the valid types shown in the reference grid below',
              'Location Name (Address Nickname) must be 36 characters or less (Shiprocket API limit)',
              'Required fields: Location Name, Street Address, City, State, Postal Code, Country, Address Type',
              'Optional fields: Street Address 2, Street Address 3, Name on Address, Phone on Address, Email on Address, Notes',
              'Upload the file and preview the data',
              'Review and submit the import',
            ]}
          />

          {/* Address Types Reference Grid */}
          <Paper className={styles['import-pickup-locations-page__reference-card']}>
            <Subheader label="Valid Address Types" className={styles['import-pickup-locations-page__section-title']} />
            <Divider className={styles['import-pickup-locations-page__divider']} />

            <Box className={styles['import-pickup-locations-page__reference-content']}>
              <Box className={styles['import-pickup-locations-page__grid-wrapper']}>
                <StyledDataGrid
                  dataTestId="address-types-reference-grid"
                  rows={addressTypes}
                  columns={addressTypesColumns}
                  getRowId={row => (row as AddressTypeData).id}
                  loading={false}
                  paginationMode="client"
                  filterMode="client"
                  sortingMode="client"
                  pageSizeOptions={[5, 10]}
                  initialState={{
                    pagination: {
                      paginationModel: {
                        pageSize: 10,
                      },
                    },
                  }}
                  disableRowSelectionOnClick
                  autoHeight
                  density={addressTypesDensity}
                  columnVisibilityModel={addressTypesColumnVisibility}
                  onColumnVisibilityModelChange={setAddressTypesColumnVisibility}
                  slots={{
                    toolbar: SimpleToolbar as GridSlotsComponent['toolbar'],
                  }}
                  slotProps={{
                    toolbar: {
                      density: addressTypesDensity,
                      onDensityChange: setAddressTypesDensity,
                      columns: addressTypesColumns,
                      rows: addressTypes,
                      hideIncludeDeleted: true,
                      hideExport: false,
                      hideFilter: false,
                      hideColumns: true,
                      columnVisibilityModel: addressTypesColumnVisibility,
                      onColumnVisibilityChange: setAddressTypesColumnVisibility,
                      activeFilterGroup: addressTypesActiveFilterGroup,
                      onFiltersChange: setAddressTypesActiveFilterGroup,
                    } as GridToolbarProps,
                  }}
                  showToolbar
                  disableColumnMenu={false}
                />
              </Box>
            </Box>
          </Paper>

          {/* Import Settings Card with File Upload */}
          <Paper className={styles['import-pickup-locations-page__settings-card']}>
            <Subheader label="Import Settings" className={styles['import-pickup-locations-page__section-title']} />
            <Divider className={styles['import-pickup-locations-page__divider--large']} />

            {/* Top Right - Actions */}
            <Box className={styles['import-pickup-locations-page__settings-actions']}>
              {/* Download Template */}
              <LinkButton
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}
                className={styles['import-pickup-locations-page__template-button']}
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
                className={styles['import-pickup-locations-page__max-records-select']}
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
            <Paper className={styles['import-pickup-locations-page__loading-paper']}>
              <Box className={styles['import-pickup-locations-page__loading-container']}>
                <CircularProgress size={48} />
                <Subheader label="Processing file..." variant="h6" className={styles['import-pickup-locations-page__loading-text']} />
                <SecondaryFont>Parsing and validating data</SecondaryFont>
              </Box>
            </Paper>
          )}

          {/* Data Preview */}
          {importData.length > 0 && (
            <Paper className={styles['import-pickup-locations-page__preview-paper']}>
              {/* Header with Title */}
              <Subheader
                label={`Data Preview (${importData.length} records)`}
                className={styles['import-pickup-locations-page__section-title']}
              />
              <Divider className={styles['import-pickup-locations-page__divider']} />

              {/* View Toggle */}
              <Box className={styles['import-pickup-locations-page__view-toggle-container']}>
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
                    <BodyText text="Grid" variant="body2" className={styles['import-pickup-locations-page__toggle-button-text']} />
                  </ToggleButton>
                  <ToggleButton value="json">
                    <JsonIcon fontSize="small" />
                    <BodyText text="JSON" variant="body2" className={styles['import-pickup-locations-page__toggle-button-text']} />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Content Area */}
              {viewMode === 'grid' ? (
                <Box className={styles['import-pickup-locations-page__grid-container']}>
                  <StyledDataGrid
                    dataTestId="import-pickup-locations-preview-grid"
                    rows={importData}
                    columns={previewColumns}
                    columnGroupingModel={columnGroupingModel}
                    getRowId={row => (row as unknown as ImportPickupLocationData).rowNumber}
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
                      const row = params.row as unknown as ImportPickupLocationData
                      return row.errors && row.errors.length > 0 ? styles['import-pickup-locations-page__error-row'] : ''
                    }}
                    showToolbar={false}
                    disableColumnMenu={false}
                  />
                </Box>
              ) : (
                <Box className={styles['import-pickup-locations-page__json-container']}>
                  <TableAsJson data={jsonPreviewData} showCopyButton />
                </Box>
              )}
            </Paper>
          )}

          {/* Action Buttons */}
          {importData.length > 0 && (
            <Paper className={styles['import-pickup-locations-page__actions-card']}>
              {/* Validation Error Warning */}
              {hasValidationErrors && (
                <Box className={styles['import-pickup-locations-page__error-warning']}>
                  <ErrorIcon className={styles['import-pickup-locations-page__error-warning-icon']} />
                  <Box>
                    <BodyText variant="body2" className={styles['import-pickup-locations-page__error-warning-text']}>
                      <strong>Cannot import data:</strong> {errorCount} {errorCount === 1 ? 'row has' : 'rows have'}{' '}
                      validation errors.
                    </BodyText>
                    <SecondaryFont variant="caption">
                      Please fix all errors before importing. Click on the red error chips to view details.
                    </SecondaryFont>
                  </Box>
                </Box>
              )}

              <Box className={styles['import-pickup-locations-page__actions']}>
                <RedButton
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    navigate(APP_ROUTES.DASHBOARD.PICKUP_LOCATIONS)
                  }}
                  disabled={isLoading}
                  label="Cancel"
                  className={styles['import-pickup-locations-page__action-button']}
                />
                <BlueButton
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleSubmit}
                  disabled={isLoading || hasValidationErrors}
                  label={isLoading ? 'Importing...' : `Import ${importData.length} Pickup Locations`}
                  className={styles['import-pickup-locations-page__action-button']}
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

      {/* Development Test Data Button */}
      {import.meta.env.DEV && <FillImportTestDataButton />}
    </>
  )
}

export default ImportPickupLocations
