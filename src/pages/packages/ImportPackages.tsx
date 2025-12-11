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
import { DEFAULT_MAX_RECORDS, MAX_RECORDS_OPTIONS, PACKAGE_TYPE_OPTIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import type { PackageRequestModel } from '../../models/api-models'
import {
    getPackageImportPreviewColumns,
    packageImportHeaderNames,
    packageImportTemplateStructure,
    parsePickupLocationQuantities,
    type ImportPackageData,
} from '../../models/bulk-import-models/ImportPackageGridModel'
import { getPickupLocationGridColumns, type PickupLocationData } from '../../models/grid-models/PickupLocationGridColumns'
import styles from '../../styles/Packages.module.scss'
import { type PaginatedGridInterface } from '../../types/grid.types'
import { applyLocalFilters, downloadImportTemplate, parseImportFile } from '../../utils/gridUtil'
import {
    packageFormSchema,
    type PackageFormData,
} from '../../utils/validationSchemas'
import { PickupLocationsModal } from '../products/components'
import type { PickupLocationCardData } from '../products/components/PickupLocationCard'
import { FillImportTestDataButton } from './components'

/**
 * Package Type data for reference grid
 */
interface PackageTypeData {
  id: number
  value: string
  label: string
}

// Cast the schema for use with parseImportFile
const bulkPackageImportValidator = packageFormSchema as unknown as ZodType<PackageFormData>

/**
 * Get columns for package type reference grid
 */
const getPackageTypeGridColumns = (): GridColDef[] => [
  {
    field: 'value',
    headerName: 'Package Type',
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
  pickupLocationQuantities: pkg.pickupLocationQuantities,
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

  // ============================================================================
  // Package Types Grid State (Local Pagination)
  // ============================================================================
  const [packageTypesRaw] = useState<PackageTypeData[]>(() =>
    PACKAGE_TYPE_OPTIONS.map((option, index) => ({
      id: index + 1,
      value: option.value,
      label: option.label,
    })),
  )
  const [packageTypes, setPackageTypes] = useState<PackageTypeData[]>(packageTypesRaw)
  const [packageTypesDensity, setPackageTypesDensity] = useState<GridDensityType>(GridDensity.STANDARD)
  const [packageTypesColumnVisibility, setPackageTypesColumnVisibility] = useState<GridColumnVisibilityModel>({})
  const [packageTypesActiveFilterGroup, setPackageTypesActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })

  // ============================================================================
  // Pickup Locations Grid State (Server-Side Pagination)
  // ============================================================================
  const [pickupLocations, setPickupLocations] = useState<PickupLocationData[]>([])
  const [pickupLocationsLoading, setPickupLocationsLoading] = useState(false)
  const [pickupLocationsTotalCount, setPickupLocationsTotalCount] = useState(0)
  const [pickupLocationsPaginationModel, setPickupLocationsPaginationModel] = useState<PaginatedGridInterface>({
    start: 0,
    end: 10,
    pageSize: 10,
    includeDeleted: false,
    actualDataCount: 0,
    totalPaginationBlockCount: 0,
  })
  const [pickupLocationsActiveFilterGroup, setPickupLocationsActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })
  const [pickupLocationsDensity, setPickupLocationsDensity] = useState<GridDensityType>(GridDensity.STANDARD)
  const [pickupLocationsColumnVisibility, setPickupLocationsColumnVisibility] = useState<GridColumnVisibilityModel>({
    pickupLocationId: true, // Show ID for reference
  })

  // ============================================================================
  // Import State
  // ============================================================================
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

  // Stock modal state
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockModalLoading, setStockModalLoading] = useState(false)
  const [stockModalLocations, setStockModalLocations] = useState<PickupLocationCardData[]>([])
  const [stockModalPackageTitle, setStockModalPackageTitle] = useState<string>('')

  // Preview grid state
  const [previewDensity, setPreviewDensity] = useState<GridDensityType>(GridDensity.STANDARD)
  const [previewColumnVisibility, setPreviewColumnVisibility] = useState<GridColumnVisibilityModel>({})

  // ============================================================================
  // Apply local filters for Package Types
  // ============================================================================
  useEffect(() => {
    if (packageTypesRaw.length > 0) {
      const filteredData = applyLocalFilters(packageTypesRaw, packageTypesActiveFilterGroup)
      setPackageTypes(filteredData)
    }
  }, [packageTypesRaw, packageTypesActiveFilterGroup])

  // ============================================================================
  // Fetch Pickup Locations (Server-Side)
  // ============================================================================
  const fetchPickupLocations = useCallback(async (): Promise<void> => {
    setPickupLocationsLoading(true)
    try {
      const response = await pickupLocationApi.getPickupLocationsInBatches({
        start: pickupLocationsPaginationModel.start,
        end: pickupLocationsPaginationModel.end,
        pageSize: pickupLocationsPaginationModel.pageSize,
        includeDeleted: pickupLocationsPaginationModel.includeDeleted,
        logicOperator: pickupLocationsActiveFilterGroup.logicOperator,
        filters: pickupLocationsActiveFilterGroup.filters,
      })

      setPickupLocations(response.data as PickupLocationData[])
      setPickupLocationsTotalCount(response.totalDataCount)
    } catch {
      setPickupLocations([])
      setPickupLocationsTotalCount(0)
    } finally {
      setPickupLocationsLoading(false)
    }
  }, [pickupLocationsPaginationModel, pickupLocationsActiveFilterGroup])

  // Fetch pickup locations on mount and when pagination/filters change
  useEffect(() => {
    void fetchPickupLocations()
  }, [fetchPickupLocations])

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
          const pickupLocationQuantitiesStr = getOptionalValue('pickupLocationQuantities')
          const notes = getOptionalValue('notes')

          // Parse numeric values
          const length = parseFloat(String(lengthRaw)) || 0
          const breadth = parseFloat(String(breadthRaw)) || 0
          const height = parseFloat(String(heightRaw)) || 0
          const maxWeight = parseFloat(String(maxWeightRaw)) || 0
          const standardCapacity = parseInt(String(standardCapacityRaw), 10) || 0
          const pricePerUnit = parseFloat(String(pricePerUnitRaw)) || 0

          // Parse pickup location quantities from string format
          const pickupLocationQuantitiesRaw = pickupLocationQuantitiesStr ? String(pickupLocationQuantitiesStr) : undefined
          const pickupLocationQuantities = parsePickupLocationQuantities(pickupLocationQuantitiesRaw)

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
            pickupLocationQuantities,
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
            pickupLocationQuantities,
            pickupLocationQuantitiesStr: pickupLocationQuantitiesRaw,
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

  const handlePreviewStockClick = useCallback(async (_rowNumber: number, stockString: string, packageTitle: string): Promise<void> => {
    setStockModalPackageTitle(packageTitle)
    setStockModalOpen(true)
    setStockModalLoading(true)
    setStockModalLocations([])

    try {
      // Parse the stock string to get location IDs and quantities
      // Format: locationId|qty|reorderLevel|maxStock;...
      const stockMap = parsePickupLocationQuantities(stockString)
      const locationIds = Object.keys(stockMap).map(id => parseInt(id, 10))

      // Fetch details for each location
      const locationPromises = locationIds.map(async (locationId) => {
        try {
          const locationData = await pickupLocationApi.getPickupLocationById(locationId) as {
            pickupLocationId: number
            addressNickName?: string
            address?: {
              streetAddress?: string
              streetAddress2?: string
              city?: string
              state?: string
              postalCode?: string
              phoneOnAddress?: string
              emailOnAddress?: string
            }
          }
          const inventoryData = stockMap[locationId.toString()]
          return {
            pickupLocation: {
              pickupLocationId: locationData.pickupLocationId,
              addressNickName: locationData.addressNickName,
              address: locationData.address,
            },
            availableStock: inventoryData?.quantity ?? 0,
            reorderLevel: inventoryData?.reorderLevel,
            maxStockLevel: inventoryData?.maxStockLevel,
          }
        } catch {
          // Return minimal data if fetch fails
          const inventoryData = stockMap[locationId.toString()]
          return {
            pickupLocation: {
              pickupLocationId: locationId,
              addressNickName: `Location ID: ${locationId}`,
            },
            availableStock: inventoryData?.quantity ?? 0,
            reorderLevel: inventoryData?.reorderLevel,
            maxStockLevel: inventoryData?.maxStockLevel,
          }
        }
      })

      const locations = await Promise.all(locationPromises)
      setStockModalLocations(locations)
    } catch {
      setStockModalLocations([])
    } finally {
      setStockModalLoading(false)
    }
  }, [])

  // ============================================================================
  // Grid Column Definitions
  // ============================================================================
  const packageTypesColumns = useMemo<GridColDef[]>(() => getPackageTypeGridColumns(), [])

  const pickupLocationsColumns = useMemo<GridColDef[]>(() => {
    const noOpToggle = (): void => {
      // Read-only grid, no toggle support required
    }
    // Get all columns except actions
    return getPickupLocationGridColumns(noOpToggle).filter(col => col.field !== 'actions')
  }, [])

  const previewColumns = useMemo<GridColDef[]>(
    () => getPackageImportPreviewColumns(handlePreviewErrorClick, handlePreviewStockClick),
    [handlePreviewErrorClick, handlePreviewStockClick],
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
              'Pickup Locations format: locationId|quantity|reorderLevel|maxStock (use semicolon to separate multiple locations)',
              'Example: 1|50|10|200;2|30|5|100 (Location 1: qty=50, reorder at 10, max 200)',
              'Upload the file and preview the data',
              'Review and submit the import',
            ]}
          />

          {/* Reference Data - Package Types */}
          <Paper className={styles['import-packages-page__reference-card']}>
            <Subheader label="Reference Data" className={styles['import-packages-page__section-title']} />
            <Divider className={styles['import-packages-page__divider']} />

            <Box className={styles['import-packages-page__reference-content']}>
              <Subheader label="Package Types" className={styles['import-packages-page__subsection-title']} />
              <Box className={styles['import-packages-page__grid-wrapper']}>
                <StyledDataGrid
                  dataTestId="package-types-reference-grid"
                  rows={packageTypes}
                  columns={packageTypesColumns}
                  getRowId={row => (row as PackageTypeData).id}
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
                  density={packageTypesDensity}
                  columnVisibilityModel={packageTypesColumnVisibility}
                  onColumnVisibilityModelChange={setPackageTypesColumnVisibility}
                  slots={{
                    toolbar: SimpleToolbar as GridSlotsComponent['toolbar'],
                  }}
                  slotProps={{
                    toolbar: {
                      density: packageTypesDensity,
                      onDensityChange: setPackageTypesDensity,
                      columns: packageTypesColumns,
                      rows: packageTypes,
                      hideIncludeDeleted: true,
                      hideExport: false,
                      hideFilter: false,
                      hideColumns: false,
                      columnVisibilityModel: packageTypesColumnVisibility,
                      onColumnVisibilityChange: setPackageTypesColumnVisibility,
                      activeFilterGroup: packageTypesActiveFilterGroup,
                      onFiltersChange: setPackageTypesActiveFilterGroup,
                    } as GridToolbarProps,
                  }}
                  showToolbar
                  disableColumnMenu={false}
                />
              </Box>
            </Box>
          </Paper>

          {/* Pickup Locations Grid (Server-Side Pagination) */}
          <Paper className={styles['import-packages-page__reference-card']}>
            <Subheader label="Available Pickup Locations" className={styles['import-packages-page__section-title']} />
            <Divider className={styles['import-packages-page__divider']} />
            <Box className={`${styles['import-packages-page__reference-content']} ${styles['import-packages-page__grid-wrapper']}`}>
              <StyledDataGrid
                dataTestId="pickup-locations-reference-grid"
                rows={pickupLocations}
                columns={pickupLocationsColumns}
                getRowId={row => {
                  const data = row as PickupLocationData
                  return data.pickupLocationId ?? data.pickupLocation?.pickupLocationId ?? 0
                }}
                loading={pickupLocationsLoading}
                rowCount={pickupLocationsTotalCount}
                totalCount={pickupLocationsTotalCount}
                paginationModelState={pickupLocationsPaginationModel}
                setPaginationModel={setPickupLocationsPaginationModel}
                paginationMode="server"
                filterMode="server"
                sortingMode="server"
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
                autoHeight
                density={pickupLocationsDensity}
                columnVisibilityModel={pickupLocationsColumnVisibility}
                onColumnVisibilityModelChange={setPickupLocationsColumnVisibility}
                slots={{
                  toolbar: SimpleToolbar as GridSlotsComponent['toolbar'],
                }}
                slotProps={{
                  toolbar: {
                    density: pickupLocationsDensity,
                    onDensityChange: setPickupLocationsDensity,
                    columns: pickupLocationsColumns,
                    rows: pickupLocations,
                    hideIncludeDeleted: true,
                    hideExport: false,
                    hideFilter: false,
                    hideColumns: false,
                    columnVisibilityModel: pickupLocationsColumnVisibility,
                    onColumnVisibilityChange: setPickupLocationsColumnVisibility,
                    activeFilterGroup: pickupLocationsActiveFilterGroup,
                    onFiltersChange: setPickupLocationsActiveFilterGroup,
                  } as GridToolbarProps,
                }}
                showToolbar
                disableColumnMenu={false}
              />
            </Box>
          </Paper>

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

      {/* Stock/Pickup Locations Modal */}
      <PickupLocationsModal
        open={stockModalOpen}
        onClose={() => {
          setStockModalOpen(false)
          setStockModalLocations([])
          setStockModalPackageTitle('')
        }}
        locations={stockModalLocations}
        productTitle={stockModalPackageTitle}
        loading={stockModalLoading}
      />

      {/* Development Test Data Button */}
      {import.meta.env.DEV && <FillImportTestDataButton />}
    </>
  )
}

export default ImportPackages
