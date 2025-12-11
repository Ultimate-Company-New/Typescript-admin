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

import { packageApi } from '../../api/packageApi'
import { ImportInstructions } from '../../components'
import { BlueButton, LinkButton, RedButton } from '../../components/buttons'
import {
  ErrorDetailsModal,
  GridDensity,
  SimpleToolbar,
  StyledDataGrid,
  TableAsJson,
  type ColumnGroup,
  type GridDensityType,
} from '../../components/datagrid'
import { BodyText, SecondaryFont, Subheader } from '../../components/fonts'
import { FileDropZone, SelectInput } from '../../components/form-input'
import { DEFAULT_MAX_RECORDS, MAX_RECORDS_OPTIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import type { PackageRequestModel } from '../../models/api-models'
import styles from '../../styles/Packages.module.scss'
import { downloadImportTemplate, parseImportFile } from '../../utils/gridUtil'
import {
  PACKAGE_TYPE_OPTIONS,
  packageFormSchema,
  type PackageFormData,
} from '../../utils/validationSchemas'

/**
 * Template structure for Package import Excel file
 * Defines the columns and their groupings
 */
const packageImportTemplateStructure = [
  {
    category: 'Package Information',
    fields: ['packageName', 'packageType', 'length', 'breadth', 'height', 'maxWeight', 'standardCapacity', 'pricePerUnit'],
  },
  {
    category: 'Additional',
    fields: ['notes'],
  },
]

/**
 * Header name mappings for Excel columns
 */
const packageImportHeaderNames: Record<string, string> = {
  packageName: 'Package Name',
  packageType: 'Package Type',
  length: 'Length (cm)',
  breadth: 'Breadth (cm)',
  height: 'Height (cm)',
  maxWeight: 'Max Weight (kg)',
  standardCapacity: 'Standard Capacity',
  pricePerUnit: 'Price Per Unit',
  notes: 'Notes',
}

/**
 * Interface for parsed package data from Excel/CSV
 */
interface ImportPackageData {
  rowNumber: number
  packageName: string
  packageType: string
  length: number
  breadth: number
  height: number
  maxWeight: number
  standardCapacity: number
  pricePerUnit: number
  notes?: string
  errors?: string[]
}

// Cast the schema for use with parseImportFile
const bulkPackageImportValidator = packageFormSchema as unknown as ZodType<PackageFormData>

/**
 * Get preview columns for the import grid
 */
const getPackageImportPreviewColumns = (
  onErrorClick: (errors: string[], rowNumber: number) => void,
): GridColDef[] => [
  {
    field: 'rowNumber',
    headerName: 'Row',
    width: 70,
    align: 'center',
    headerAlign: 'center',
  },
  {
    field: 'errors',
    headerName: 'Status',
    width: 100,
    align: 'center',
    headerAlign: 'center',
    renderCell: params => {
      const errors = params.value as string[] | undefined
      if (errors && errors.length > 0) {
        return (
          <Box
            onClick={() => onErrorClick(errors, params.row.rowNumber as number)}
            className={styles['import-packages-page__error-chip']}
          >
            <ErrorIcon fontSize="small" />
            <span>{errors.length}</span>
          </Box>
        )
      }
      return <span className={styles['import-packages-page__success-text']}>✓</span>
    },
  },
  {
    field: 'packageName',
    headerName: 'Package Name',
    flex: 1.5,
    minWidth: 180,
  },
  {
    field: 'packageType',
    headerName: 'Package Type',
    width: 130,
    align: 'center',
    headerAlign: 'center',
  },
  {
    field: 'length',
    headerName: 'Length (cm)',
    width: 110,
    align: 'right',
    headerAlign: 'right',
    type: 'number',
  },
  {
    field: 'breadth',
    headerName: 'Breadth (cm)',
    width: 120,
    align: 'right',
    headerAlign: 'right',
    type: 'number',
  },
  {
    field: 'height',
    headerName: 'Height (cm)',
    width: 110,
    align: 'right',
    headerAlign: 'right',
    type: 'number',
  },
  {
    field: 'maxWeight',
    headerName: 'Max Weight (kg)',
    width: 130,
    align: 'right',
    headerAlign: 'right',
    type: 'number',
  },
  {
    field: 'standardCapacity',
    headerName: 'Capacity',
    width: 100,
    align: 'right',
    headerAlign: 'right',
    type: 'number',
  },
  {
    field: 'pricePerUnit',
    headerName: 'Price/Unit',
    width: 110,
    align: 'right',
    headerAlign: 'right',
    type: 'number',
    valueFormatter: (value: number) => `₹${value?.toFixed(2) ?? '0.00'}`,
  },
  {
    field: 'notes',
    headerName: 'Notes',
    flex: 1,
    minWidth: 150,
  },
]

/**
 * Convert ImportPackageData to PackageRequestModel for API
 */
const mapToApiPayload = (pkg: ImportPackageData): PackageRequestModel => ({
  packageName: pkg.packageName,
  packageType: pkg.packageType,
  length: pkg.length,
  breadth: pkg.breadth,
  height: pkg.height,
  maxWeight: pkg.maxWeight,
  standardCapacity: pkg.standardCapacity,
  pricePerUnit: pkg.pricePerUnit,
  notes: pkg.notes,
})

/**
 * Import Packages Page
 * Features:
 * - Download Excel template
 * - Upload Excel/CSV files
 * - Preview data in grid or JSON format
 * - Set max records limit
 * - Validate and submit bulk import
 */
const ImportPackages = (): React.JSX.Element => {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<ImportPackageData[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'json'>('grid')
  const [maxRecords, setMaxRecords] = useState<number>(DEFAULT_MAX_RECORDS as number)
  const [isLoading, setIsLoading] = useState(false)
  const [jsonPreview, setJsonPreview] = useState<string>('')

  // Error modal state
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [selectedRowErrors, setSelectedRowErrors] = useState<string[]>([])
  const [selectedRowNumber, setSelectedRowNumber] = useState<number | null>(null)

  // Preview grid state
  const [previewDensity, setPreviewDensity] = useState<GridDensityType>(GridDensity.STANDARD)
  const [previewColumnVisibility, setPreviewColumnVisibility] = useState<GridColumnVisibilityModel>({})

  /**
   * Download Excel template with merged category headers
   */
  const handleDownloadTemplate = (): void => {
    try {
      downloadImportTemplate({
        templateStructure: packageImportTemplateStructure,
        fileName: 'package_import_template.xlsx',
        sheetName: 'Packages',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to download template'
      toast.error(message)
    }
  }

  /**
   * Parse Excel/CSV file
   */
  const parseFile = useCallback(
    (file: File): void => {
      setIsLoading(true)

      void parseImportFile<ImportPackageData, PackageFormData>({
        file,
        templateStructure: packageImportTemplateStructure,
        headerNames: packageImportHeaderNames,
        maxRecords,
        validator: bulkPackageImportValidator,
        createRowData: ({ rowNumber, getOptionalValue, getRequiredValue }) => {
          const packageName = getRequiredValue('packageName')
          const packageType = getRequiredValue('packageType')
          const lengthRaw = getRequiredValue('length')
          const breadthRaw = getRequiredValue('breadth')
          const heightRaw = getRequiredValue('height')
          const maxWeightRaw = getRequiredValue('maxWeight')
          const standardCapacityRaw = getRequiredValue('standardCapacity')
          const pricePerUnitRaw = getRequiredValue('pricePerUnit')
          const notes = getOptionalValue('notes')

          // Parse numeric values
          const length = parseFloat(String(lengthRaw)) || 0
          const breadth = parseFloat(String(breadthRaw)) || 0
          const height = parseFloat(String(heightRaw)) || 0
          const maxWeight = parseFloat(String(maxWeightRaw)) || 0
          const standardCapacity = parseInt(String(standardCapacityRaw), 10) || 0
          const pricePerUnit = parseFloat(String(pricePerUnitRaw)) || 0

          // Create validation payload
          const validationPayload: PackageFormData = {
            packageName: String(packageName || ''),
            packageType: String(packageType || 'STANDARD') as PackageFormData['packageType'],
            length,
            breadth,
            height,
            maxWeight,
            standardCapacity,
            pricePerUnit,
            notes: notes ? String(notes) : '',
          }

          const parsedRow: ImportPackageData = {
            rowNumber,
            packageName: String(packageName || ''),
            packageType: String(packageType || 'STANDARD'),
            length,
            breadth,
            height,
            maxWeight,
            standardCapacity,
            pricePerUnit,
            notes: notes ? String(notes) : undefined,
          }

          return {
            parsedRow,
            validationPayload,
          }
        },
      })
        .then(results => {
          setImportData(
            results.map(
              (result): ImportPackageData => ({
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
   * Generate JSON structure for API
   */
  const generateImportJSON = useCallback((): PackageRequestModel[] => {
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
      return JSON.parse(jsonPreview) as PackageRequestModel[]
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
    const hasErrors = importData.some((pkg: ImportPackageData) => pkg.errors && pkg.errors.length > 0)
    if (hasErrors) {
      toast.error('Please fix validation errors before submitting')
      return
    }

    setIsLoading(true)
    try {
      // Generate import payload
      const payload: PackageRequestModel[] = importData.map(mapToApiPayload)

      // Call bulk create API
      await packageApi.bulkCreatePackages(payload)

      // Show success message
      toast.success(
        `Bulk import started for ${importData.length} packages! You will receive a message with the results when processing completes.`,
      )

      // Navigate to packages page
      navigate(APP_ROUTES.DASHBOARD.PACKAGES)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import packages'
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

  const previewColumns = useMemo<GridColDef[]>(
    () => getPackageImportPreviewColumns(handlePreviewErrorClick),
    [handlePreviewErrorClick],
  )

  // Column grouping for preview grid
  const columnGroupingModel = useMemo<ColumnGroup[]>(
    () =>
      packageImportTemplateStructure.map(section => ({
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

  // Package type options for reference
  const packageTypeLabels = PACKAGE_TYPE_OPTIONS.map(opt => opt.label).join(', ')

  return (
    <>
      <Container maxWidth={false} disableGutters className={styles['import-packages-page__page-wrapper']}>
        <Box className={styles['import-packages-page__container']}>
          {/* Instructions */}
          <ImportInstructions
            instructions={[
              'Download the template file to see the required format',
              'Fill in your package data following the template structure',
              `Valid package types: ${packageTypeLabels}`,
              'All dimensions should be in centimeters (cm)',
              'Weight should be in kilograms (kg)',
              'Upload the file and preview the data',
              'Review and submit the import',
            ]}
          />

          {/* Import Settings Card with File Upload */}
          <Paper className={styles['import-packages-page__settings-card']}>
            <Subheader label="Import Settings" className={styles['import-packages-page__section-title']} />
            <Divider className={styles['import-packages-page__divider--large']} />

            {/* Top Right - Actions */}
            <Box className={styles['import-packages-page__settings-actions']}>
              {/* Download Template */}
              <LinkButton
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}
                className={styles['import-packages-page__template-button']}
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
                className={styles['import-packages-page__max-records-select']}
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
            <Paper className={styles['import-packages-page__loading-paper']}>
              <Box className={styles['import-packages-page__loading-container']}>
                <CircularProgress size={48} />
                <Subheader label="Processing file..." variant="h6" className={styles['import-packages-page__loading-text']} />
                <SecondaryFont>Parsing and validating data</SecondaryFont>
              </Box>
            </Paper>
          )}

          {/* Data Preview */}
          {importData.length > 0 && (
            <Paper className={styles['import-packages-page__preview-paper']}>
              {/* Header with Title */}
              <Subheader
                label={`Data Preview (${importData.length} records)`}
                className={styles['import-packages-page__section-title']}
              />
              <Divider className={styles['import-packages-page__divider']} />

              {/* View Toggle */}
              <Box className={styles['import-packages-page__view-toggle-container']}>
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
                    <BodyText text="Grid" variant="body2" className={styles['import-packages-page__toggle-button-text']} />
                  </ToggleButton>
                  <ToggleButton value="json">
                    <JsonIcon fontSize="small" />
                    <BodyText text="JSON" variant="body2" className={styles['import-packages-page__toggle-button-text']} />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Content Area */}
              {viewMode === 'grid' ? (
                <Box className={styles['import-packages-page__grid-container']}>
                  <StyledDataGrid
                    dataTestId="import-packages-preview-grid"
                    rows={importData}
                    columns={previewColumns}
                    columnGroupingModel={columnGroupingModel}
                    getRowId={row => (row as unknown as ImportPackageData).rowNumber}
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
                    density={previewDensity}
                    columnVisibilityModel={previewColumnVisibility}
                    onColumnVisibilityModelChange={setPreviewColumnVisibility}
                    getRowClassName={params => {
                      const row = params.row as unknown as ImportPackageData
                      return row.errors && row.errors.length > 0 ? styles['import-packages-page__error-row'] : ''
                    }}
                    slots={{
                      toolbar: SimpleToolbar as GridSlotsComponent['toolbar'],
                    }}
                    slotProps={{
                      toolbar: {
                        density: previewDensity,
                        onDensityChange: setPreviewDensity,
                        columns: previewColumns,
                        rows: importData,
                        hideIncludeDeleted: true,
                        hideFilter: true,
                        columnVisibilityModel: previewColumnVisibility,
                        onColumnVisibilityChange: setPreviewColumnVisibility,
                      } as GridToolbarProps,
                    }}
                    showToolbar
                    disableColumnMenu={false}
                  />
                </Box>
              ) : (
                <Box className={styles['import-packages-page__json-container']}>
                  <TableAsJson data={jsonPreviewData} showCopyButton />
                </Box>
              )}
            </Paper>
          )}

          {/* Action Buttons */}
          {importData.length > 0 && (
            <Paper className={styles['import-packages-page__actions-card']}>
              {/* Validation Error Warning */}
              {hasValidationErrors && (
                <Box className={styles['import-packages-page__error-warning']}>
                  <ErrorIcon className={styles['import-packages-page__error-warning-icon']} />
                  <Box>
                    <BodyText variant="body2" className={styles['import-packages-page__error-warning-text']}>
                      <strong>Cannot import data:</strong> {errorCount} {errorCount === 1 ? 'row has' : 'rows have'}{' '}
                      validation errors.
                    </BodyText>
                    <SecondaryFont variant="caption">
                      Please fix all errors before importing. Click on the red error chips to view details.
                    </SecondaryFont>
                  </Box>
                </Box>
              )}

              <Box className={styles['import-packages-page__actions']}>
                <RedButton
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    navigate(APP_ROUTES.DASHBOARD.PACKAGES)
                  }}
                  disabled={isLoading}
                  label="Cancel"
                  className={styles['import-packages-page__action-button']}
                />
                <BlueButton
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleSubmit}
                  disabled={isLoading || hasValidationErrors}
                  label={isLoading ? 'Importing...' : `Import ${importData.length} Packages`}
                  className={styles['import-packages-page__action-button']}
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

export default ImportPackages
