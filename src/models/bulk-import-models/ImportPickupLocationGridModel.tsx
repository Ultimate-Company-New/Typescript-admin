/**
 * Pickup Location Import Grid Model
 * Configuration for bulk pickup location import template structure and field display
 */

import { Chip, Tooltip } from '@mui/material'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

import { ColumnType, formatValueByType, type FieldDisplayConfig, type TemplateStructure } from '../ImportTemplateStructure'

/**
 * Pickup Location Import Template Structure
 * Defines the column layout for the pickup location import Excel template
 * - First row: Category headers (merged cells)
 * - Second row: Field names
 */
export const pickupLocationImportTemplateStructure: TemplateStructure = [
  {
    category: 'Location Information',
    fields: ['addressNickName'],
  },
  {
    category: 'Address Details',
    fields: [
      'streetAddress',
      'streetAddress2',
      'streetAddress3',
      'city',
      'state',
      'postalCode',
      'country',
      'addressType',
      'nameOnAddress',
      'emailOnAddress',
      'phoneOnAddress',
    ],
  },
  {
    category: 'Additional Fields',
    fields: ['notes'],
  },
]

/**
 * Custom header names for pickup location import fields
 */
export const pickupLocationImportHeaderNames: Record<string, string> = {
  addressNickName: 'Location Name',
  streetAddress: 'Street Address',
  streetAddress2: 'Street Address 2',
  streetAddress3: 'Street Address 3',
  city: 'City',
  state: 'State',
  postalCode: 'Postal Code',
  country: 'Country',
  addressType: 'Address Type',
  nameOnAddress: 'Name on Address',
  emailOnAddress: 'Email on Address',
  phoneOnAddress: 'Phone on Address',
  notes: 'Notes',
}

/**
 * Fields to hide by default in the preview grid
 * Empty array = all fields visible
 */
export const pickupLocationImportHiddenFields: string[] = []

/**
 * Field display configurations for pickup location import preview grid
 */
export const pickupLocationImportFieldDisplayConfig: Record<string, FieldDisplayConfig> = {
  rowNumber: {
    field: 'rowNumber',
    headerName: 'Row',
    width: 70,
  },
  addressNickName: {
    field: 'addressNickName',
    headerName: 'Location Name',
    width: 150,
  },
  streetAddress: {
    field: 'streetAddress',
    headerName: 'Street Address',
    width: 180,
  },
  streetAddress2: {
    field: 'streetAddress2',
    headerName: 'Street Address 2',
    width: 140,
  },
  streetAddress3: {
    field: 'streetAddress3',
    headerName: 'Street Address 3',
    width: 140,
  },
  city: {
    field: 'city',
    headerName: 'City',
    width: 100,
  },
  state: {
    field: 'state',
    headerName: 'State',
    width: 100,
  },
  postalCode: {
    field: 'postalCode',
    headerName: 'Postal Code',
    width: 100,
  },
  country: {
    field: 'country',
    headerName: 'Country',
    width: 100,
  },
  addressType: {
    field: 'addressType',
    headerName: 'Address Type',
    width: 110,
  },
  nameOnAddress: {
    field: 'nameOnAddress',
    headerName: 'Name on Address',
    width: 150,
  },
  emailOnAddress: {
    field: 'emailOnAddress',
    headerName: 'Email on Address',
    width: 180,
    type: ColumnType.EMAIL,
  },
  phoneOnAddress: {
    field: 'phoneOnAddress',
    headerName: 'Phone on Address',
    width: 130,
    type: ColumnType.PHONE,
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
 * Interface for parsed pickup location data from Excel/CSV
 */
export interface ImportPickupLocationData {
  rowNumber: number
  addressNickName: string
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
  notes?: string
  errors?: string[]
}

/**
 * Generate grid columns for pickup location import preview
 * Dynamically creates columns with flex layout and formatting
 * Shows ALL fields for complete data preview
 *
 * @param onErrorClick - Callback when error chip is clicked, receives errors array and row number
 * @returns Array of GridColDef for the data grid
 */
export const getPickupLocationImportPreviewColumns = (
  onErrorClick: (errors: string[], rowNumber: number) => void,
): GridColDef[] => {
  // Define ALL columns to show in preview (matches template structure)
  const previewFields = [
    'rowNumber',
    // Location Information
    'addressNickName',
    // Address Details
    'streetAddress',
    'streetAddress2',
    'streetAddress3',
    'city',
    'state',
    'postalCode',
    'country',
    'addressType',
    'nameOnAddress',
    'emailOnAddress',
    'phoneOnAddress',
    // Additional Fields
    'notes',
    // Status
    'errors',
  ]

  return previewFields.map(fieldName => {
    const config = pickupLocationImportFieldDisplayConfig[fieldName]
    if (!config) {
      return {
        field: fieldName,
        headerName: fieldName,
        flex: 1,
        minWidth: 100,
      }
    }

    // Calculate flex value and minWidth based on field type
    let flex = 1
    let minWidth = config.width ?? 100

    if (fieldName === 'rowNumber') {
      flex = 0.4
      minWidth = 70
    } else if (fieldName === 'addressNickName') {
      flex = 1.1
      minWidth = 150
    } else if (fieldName === 'streetAddress') {
      flex = 1.2
      minWidth = 180
    } else if (fieldName === 'streetAddress2' || fieldName === 'streetAddress3') {
      flex = 0.9
      minWidth = 140
    } else if (fieldName === 'city' || fieldName === 'state') {
      flex = 0.7
      minWidth = 100
    } else if (fieldName === 'postalCode') {
      flex = 0.7
      minWidth = 100
    } else if (fieldName === 'country') {
      flex = 0.7
      minWidth = 100
    } else if (fieldName === 'addressType') {
      flex = 0.8
      minWidth = 110
    } else if (fieldName === 'nameOnAddress') {
      flex = 1
      minWidth = 150
    } else if (fieldName === 'emailOnAddress') {
      flex = 1.2
      minWidth = 180
    } else if (fieldName === 'phoneOnAddress') {
      flex = 0.9
      minWidth = 130
    } else if (fieldName === 'notes') {
      flex = 1.3
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

    // Special rendering for rowNumber
    if (fieldName === 'rowNumber') {
      return {
        ...baseColumn,
        align: 'center' as const,
        headerAlign: 'center' as const,
      }
    }

    // Special rendering for phone fields (format phone number)
    if (fieldName === 'phoneOnAddress') {
      return {
        ...baseColumn,
        valueFormatter: (value: string) => formatValueByType(value, ColumnType.PHONE),
      }
    }

    // Special rendering for errors/status field
    if (fieldName === 'errors') {
      return {
        ...baseColumn,
        renderCell: (params: GridRenderCellParams<ImportPickupLocationData>) => {
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
