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
import type { GridColDef } from '@mui/x-data-grid'

import { promoApi } from '../../api/promoApi'
import { ImportInstructions } from '../../components'
import { BlueButton, LinkButton, RedButton } from '../../components/buttons'
import { ErrorDetailsModal, StyledDataGrid, TableAsJson, type ColumnGroup } from '../../components/datagrid'
import { BodyText, Subheader } from '../../components/fonts'
import { FileDropZone, SelectInput } from '../../components/form-input'
import { DEFAULT_MAX_RECORDS, MAX_RECORDS_OPTIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import type { PromoRequestModel } from '../../models/api-models'
import {
  getPromoImportPreviewColumns,
  promoImportHeaderNames,
  promoImportTemplateStructure,
  type ImportPromoData,
} from '../../models/bulk-import-models/ImportPromoGridModel'
import styles from '../../styles/Promos.module.scss'
import { downloadImportTemplate, parseImportFile } from '../../utils/gridUtil'
import { bulkPromoImportSchema, type BulkPromoImportData } from '../../utils/validationSchemas'

import { FillImportTestDataButton } from './components'

// Validator for promo import rows
const bulkPromoImportValidator = bulkPromoImportSchema as unknown as ZodType<BulkPromoImportData>

/**
 * Convert ImportPromoData to PromoRequestModel for API
 */
const mapToApiPayload = (promo: ImportPromoData): PromoRequestModel => ({
  promoCode: promo.promoCode,
  description: promo.description,
  discountValue: promo.discountValue,
  isPercent: promo.isPercent,
  startDate: promo.startDate,
  expiryDate: promo.expiryDate,
  notes: promo.notes ?? '',
})

/**
 * Import Promos Page
 * Features:
 * - Download Excel template
 * - Upload Excel/CSV files
 * - Preview data in grid or JSON format
 * - Set max records limit
 * - Validate and submit bulk import
 */
const ImportPromos = (): React.JSX.Element => {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<ImportPromoData[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'json'>('grid')
  const [maxRecords, setMaxRecords] = useState<number>(DEFAULT_MAX_RECORDS as number)
  const [isLoading, setIsLoading] = useState(false)
  const [jsonPreview, setJsonPreview] = useState<string>('')

  // Error modal state
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [selectedRowErrors, setSelectedRowErrors] = useState<string[]>([])
  const [selectedRowNumber, setSelectedRowNumber] = useState<number | null>(null)

  /**
   * Download Excel template with merged category headers
   * Template structure matches PromoRequestModel columns
   */
  const handleDownloadTemplate = (): void => {
    try {
      downloadImportTemplate({
        templateStructure: promoImportTemplateStructure,
        fileName: 'promo_import_template.xlsx',
        sheetName: 'Promos',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to download template'
      toast.error(message)
    }
  }

  /**
   * Parse Excel/CSV file
   * Validates using Zod schema (same rules as AddEditPromo form)
   */
  const parseFile = useCallback(
    (file: File): void => {
      setIsLoading(true)

      void parseImportFile<ImportPromoData, BulkPromoImportData>({
        file,
        templateStructure: promoImportTemplateStructure,
        headerNames: promoImportHeaderNames,
        maxRecords,
        validator: bulkPromoImportValidator,
        createRowData: ({ rowNumber, getOptionalValue, getRequiredValue }) => {
          const promoCodeValue = getRequiredValue('promoCode')
          const descriptionValue = getRequiredValue('description')
          const discountValueRaw = getRequiredValue('discountValue')
          const isPercentRaw = getRequiredValue('isPercent')
          const startDateValue = getRequiredValue('startDate')
          const expiryDateValue = getOptionalValue('expiryDate')
          const notesValue = getOptionalValue('notes')

          // Parse discount value as number
          const discountValue =
            typeof discountValueRaw === 'number' ? discountValueRaw : parseFloat(String(discountValueRaw)) || 0

          // Parse isPercent as boolean
          const isPercentStr = String(isPercentRaw).toLowerCase()
          const isPercent = isPercentStr === 'true' || isPercentStr === 'yes' || isPercentStr === '1'

          // Convert values to strings safely
          const promoCodeStr = String(promoCodeValue || '')
          const descriptionStr = String(descriptionValue || '')
          const startDateStr = String(startDateValue || '')
          const expiryDateStr = expiryDateValue ? String(expiryDateValue) : ''
          const notesStr = notesValue ? String(notesValue) : ''

          // Create validation payload for Zod schema
          const validationPayload: BulkPromoImportData = {
            promoCode: promoCodeStr,
            description: descriptionStr,
            discountValue,
            isPercent,
            startDate: startDateStr,
            expiryDate: expiryDateStr,
            notes: notesStr,
          }

          const parsedRow: ImportPromoData = {
            rowNumber,
            promoCode: promoCodeStr,
            description: descriptionStr,
            discountValue,
            isPercent,
            startDate: startDateStr,
            expiryDate: expiryDateStr || undefined,
            notes: notesStr || undefined,
          }

          /* eslint-disable @typescript-eslint/no-unsafe-assignment */
          const result: { parsedRow: ImportPromoData; validationPayload: BulkPromoImportData } = {
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
              (result): ImportPromoData => ({
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
  const generateImportJSON = useCallback((): { maxRecords: number; promos: PromoRequestModel[] } => {
    const promos: PromoRequestModel[] = importData.map(mapToApiPayload)
    return {
      maxRecords,
      promos,
    }
  }, [importData, maxRecords])

  // Generate JSON preview when switching to JSON view
  useEffect(() => {
    if (viewMode === 'json' && importData.length > 0) {
      const json = generateImportJSON()
      setJsonPreview(JSON.stringify(json, null, 2))
    }
  }, [viewMode, importData, generateImportJSON])

  const jsonPreviewData = useMemo<PromoRequestModel[]>(() => {
    if (!jsonPreview) {
      return []
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parsed: { promos: PromoRequestModel[] } = JSON.parse(jsonPreview)
      // Only show the promos array, not the wrapper object with maxRecords
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return parsed.promos
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
    const hasErrors = importData.some((promo: ImportPromoData) => promo.errors && promo.errors.length > 0)
    if (hasErrors) {
      toast.error('Please fix validation errors before submitting')
      return
    }

    setIsLoading(true)
    try {
      // Generate import payload
      const payload: PromoRequestModel[] = importData.map(mapToApiPayload)

      // Call bulk create API - triggers async processing
      await promoApi.bulkCreatePromos(payload) // eslint-disable-line @typescript-eslint/no-unsafe-call

      // Show success message - results will be sent via notification
      toast.success(
        `Bulk import started for ${importData.length} promos! You will receive a message with the results when processing completes.`,
      )

      // Navigate to promos page immediately
      navigate(APP_ROUTES.DASHBOARD.PROMOS)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import promos'
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
    () => getPromoImportPreviewColumns(handlePreviewErrorClick),
    [handlePreviewErrorClick],
  )

  // Column grouping for preview grid (parent headers)
  const columnGroupingModel = useMemo<ColumnGroup[]>(
    () =>
      promoImportTemplateStructure.map(section => ({
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
      const typedRow = row as unknown as ImportPromoData
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

      <Container maxWidth={false} disableGutters className={styles['import-promos-page__page-wrapper']}>
        <Box className={styles['import-promos-page__container']}>
          {/* Instructions */}
          <ImportInstructions
            instructions={[
              'Download the template file to see the required format',
              'Fill in your promo data following the template structure',
              'Promo codes should contain only letters, numbers, underscores, and hyphens',
              'Set isPercent to TRUE for percentage discounts, FALSE for fixed amounts',
              'Start date is required and must be today or in the future (format: YYYY-MM-DD)',
              'Expiry date is optional but if provided must be after or equal to start date (format: YYYY-MM-DD)',
              'Upload the file and preview the data',
              'Review and submit the import',
            ]}
          />

          {/* Import Settings Card with File Upload */}
          <Paper className={styles['import-promos-page__settings-card']}>
            <Subheader label="Import Settings" className={styles['import-promos-page__section-title']} />
            <Divider className={styles['import-promos-page__divider--large']} />

            {/* Top Right - Actions */}
            <Box className={styles['import-promos-page__settings-actions']}>
              {/* Download Template */}
              <LinkButton
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}
                className={styles['import-promos-page__template-button']}
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
                className={styles['import-promos-page__max-records-select']}
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
            <Paper className={styles['import-promos-page__loading-paper']}>
              <Box className={styles['import-promos-page__loading-container']}>
                <CircularProgress size={48} />
                <Typography variant="h6" className={styles['import-promos-page__loading-text']}>
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
            <Paper className={styles['import-promos-page__preview-paper']}>
              {/* Header with Title */}
              <Subheader
                label={`Data Preview (${importData.length} records)`}
                className={styles['import-promos-page__section-title']}
              />
              <Divider className={styles['import-promos-page__divider']} />

              {/* View Toggle - Above the table on top right */}
              <Box className={styles['import-promos-page__view-toggle-container']}>
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
                    <BodyText
                      text="Grid"
                      variant="body2"
                      className={styles['import-promos-page__toggle-button-text']}
                    />
                  </ToggleButton>
                  <ToggleButton value="json">
                    <JsonIcon fontSize="small" />
                    <BodyText
                      text="JSON"
                      variant="body2"
                      className={styles['import-promos-page__toggle-button-text']}
                    />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Content Area */}
              {viewMode === 'grid' ? (
                <Box className={styles['import-promos-page__grid-container']}>
                  <StyledDataGrid
                    dataTestId="import-promos-preview-grid"
                    rows={importData}
                    columns={previewColumns}
                    columnGroupingModel={columnGroupingModel}
                    getRowId={row => (row as unknown as ImportPromoData).rowNumber}
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
                      const row = params.row as unknown as ImportPromoData
                      return row.errors && row.errors.length > 0 ? styles['import-promos-page__error-row'] : ''
                    }}
                    showToolbar={false}
                    disableColumnMenu={false}
                  />
                </Box>
              ) : (
                <Box className={styles['import-promos-page__json-container']}>
                  <TableAsJson data={jsonPreviewData} showCopyButton />
                </Box>
              )}
            </Paper>
          )}

          {/* Action Buttons */}
          {importData.length > 0 && (
            <Paper className={styles['import-promos-page__actions-card']}>
              {/* Validation Error Warning */}
              {hasValidationErrors && (
                <Box className={styles['import-promos-page__error-warning']}>
                  <ErrorIcon className={styles['import-promos-page__error-warning-icon']} />
                  <Box>
                    <Typography variant="body2" className={styles['import-promos-page__error-warning-text']}>
                      <strong>Cannot import data:</strong> {errorCount} {errorCount === 1 ? 'row has' : 'rows have'}{' '}
                      validation errors.
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Please fix all errors before importing. Click on the red error chips to view details.
                    </Typography>
                  </Box>
                </Box>
              )}

              <Box className={styles['import-promos-page__actions']}>
                <RedButton
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    navigate(APP_ROUTES.DASHBOARD.PROMOS)
                  }}
                  disabled={isLoading}
                  label="Cancel"
                  className={styles['import-promos-page__action-button']}
                />
                <BlueButton
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleSubmit}
                  disabled={isLoading || hasValidationErrors}
                  label={isLoading ? 'Importing...' : `Import ${importData.length} Promos`}
                  className={styles['import-promos-page__action-button']}
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

export default ImportPromos
