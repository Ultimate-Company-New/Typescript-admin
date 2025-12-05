/**
 * Promo Import Grid Model
 * Configuration for bulk promo import template structure and field display
 */

import { Chip, Tooltip } from '@mui/material'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

import {
  ColumnType,
  formatValueByType,
  type FieldDisplayConfig,
  type TemplateStructure,
} from '../ImportTemplateStructure'

/**
 * Promo Import Template Structure
 * Defines the column layout for the promo import Excel template
 * - First row: Category headers (merged cells)
 * - Second row: Field names
 */
export const promoImportTemplateStructure: TemplateStructure = [
  {
    category: 'Promo Details',
    fields: ['promoCode', 'description', 'discountValue', 'isPercent', 'startDate', 'expiryDate'],
  },
  {
    category: 'Additional Fields',
    fields: ['notes'],
  },
]

/**
 * Custom header names for promo import fields
 */
export const promoImportHeaderNames: Record<string, string> = {
  promoCode: 'Promo Code',
  description: 'Description',
  discountValue: 'Discount Value',
  isPercent: 'Is Percentage',
  startDate: 'Start Date',
  expiryDate: 'Expiry Date',
  notes: 'Notes',
}

/**
 * Fields to hide by default in the preview grid
 * Empty array = all fields visible
 */
export const promoImportHiddenFields: string[] = []

/**
 * Field display configurations for promo import preview grid
 */
export const promoImportFieldDisplayConfig: Record<string, FieldDisplayConfig> = {
  rowNumber: {
    field: 'rowNumber',
    headerName: 'Row',
    width: 70,
  },
  promoCode: {
    field: 'promoCode',
    headerName: 'Promo Code',
    width: 140,
  },
  description: {
    field: 'description',
    headerName: 'Description',
    width: 250,
  },
  discountValue: {
    field: 'discountValue',
    headerName: 'Discount Value',
    width: 130,
  },
  isPercent: {
    field: 'isPercent',
    headerName: 'Is Percentage',
    width: 120,
  },
  startDate: {
    field: 'startDate',
    headerName: 'Start Date',
    width: 120,
    type: ColumnType.DATE,
  },
  expiryDate: {
    field: 'expiryDate',
    headerName: 'Expiry Date',
    width: 120,
    type: ColumnType.DATE,
  },
  notes: {
    field: 'notes',
    headerName: 'Notes',
    width: 200,
  },
  errors: {
    field: 'errors',
    headerName: 'Status',
    width: 100,
  },
}

/**
 * Interface for parsed promo data from Excel/CSV
 */
export interface ImportPromoData {
  rowNumber: number
  promoCode: string
  description: string
  discountValue: number
  isPercent: boolean
  startDate: string
  expiryDate?: string
  notes?: string
  errors?: string[]
}

/**
 * Generate grid columns for promo import preview
 * Dynamically creates columns with flex layout and formatting
 *
 * @param onErrorClick - Callback when error chip is clicked, receives errors array and row number
 * @returns Array of GridColDef for the data grid
 */
export const getPromoImportPreviewColumns = (
  onErrorClick: (errors: string[], rowNumber: number) => void,
): GridColDef[] => {
  // Define ALL columns to show in preview (matches template structure)
  const previewFields = [
    'rowNumber',
    'promoCode',
    'description',
    'discountValue',
    'isPercent',
    'startDate',
    'expiryDate',
    'notes',
    'errors',
  ]

  return previewFields.map(fieldName => {
    const config = promoImportFieldDisplayConfig[fieldName]

    // Calculate flex value and minWidth based on field type
    let flex = 1
    let minWidth = config.width ?? 100

    if (fieldName === 'rowNumber') {
      flex = 0.4
      minWidth = 70
    } else if (fieldName === 'promoCode') {
      flex = 0.9
      minWidth = 140
    } else if (fieldName === 'description') {
      flex = 1.6
      minWidth = 250
    } else if (fieldName === 'discountValue') {
      flex = 0.8
      minWidth = 130
    } else if (fieldName === 'isPercent') {
      flex = 0.7
      minWidth = 120
    } else if (fieldName === 'startDate') {
      flex = 0.8
      minWidth = 120
    } else if (fieldName === 'expiryDate') {
      flex = 0.8
      minWidth = 120
    } else if (fieldName === 'notes') {
      flex = 1.2
      minWidth = 200
    } else if (fieldName === 'errors') {
      flex = 0.6
      minWidth = 100
    }

    const baseColumn: GridColDef = {
      field: config.field,
      headerName: config.headerName,
      flex,
      minWidth,
    }

    // Apply formatting based on column type
    // MUI X DataGrid v6+ passes value directly, not as { value }
    if (config.type) {
      const columnType = config.type
      baseColumn.valueFormatter = (value: unknown): string => formatValueByType(value, columnType)
    }

    // Special rendering for rowNumber
    if (fieldName === 'rowNumber') {
      return {
        ...baseColumn,
        align: 'center' as const,
        headerAlign: 'center' as const,
      }
    }

    // Special rendering for discountValue (center align)
    if (fieldName === 'discountValue') {
      return {
        ...baseColumn,
        align: 'center' as const,
        headerAlign: 'center' as const,
      }
    }

    // Special rendering for isPercent (boolean display)
    if (fieldName === 'isPercent') {
      return {
        ...baseColumn,
        align: 'center' as const,
        headerAlign: 'center' as const,
        renderCell: (params: GridRenderCellParams<ImportPromoData>) => {
          const { row } = params
          return row.isPercent ? (
            <Chip label="Percentage" color="primary" size="small" variant="outlined" />
          ) : (
            <Chip label="Fixed" color="secondary" size="small" variant="outlined" />
          )
        },
      }
    }

    // Special rendering for errors/status field
    if (fieldName === 'errors') {
      return {
        ...baseColumn,
        renderCell: (params: GridRenderCellParams<ImportPromoData>) => {
          const { row } = params
          if (row.errors && row.errors.length > 0) {
            return (
              <Tooltip title="Click to view details">
                <Chip
                  label="Error"
                  color="error"
                  size="small"
                  onClick={e => {
                    e.stopPropagation()
                    onErrorClick(row.errors ?? [], row.rowNumber)
                  }}
                  sx={{ cursor: 'pointer' }}
                />
              </Tooltip>
            )
          }
          return <Chip label="Valid" color="success" size="small" />
        },
      }
    }

    return baseColumn
  })
}
