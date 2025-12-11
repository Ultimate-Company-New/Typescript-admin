/**
 * Package Import Grid Model
 * Configuration for bulk package import template structure and field display
 */

import { Chip, Tooltip } from '@mui/material'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

import { getPackageTypeColor, getPackageTypeLabel } from '../../constants/appConstants'
import type { PackagePickupLocationMappingRequestModel } from '../api-models/PackageModels'

import {
    ColumnType,
    formatValueByType,
    type FieldDisplayConfig,
    type TemplateStructure,
} from '../ImportTemplateStructure'

/**
 * Package Import Template Structure
 * Defines the column layout for the package import Excel template
 * - First row: Category headers (merged cells)
 * - Second row: Field names
 */
export const packageImportTemplateStructure: TemplateStructure = [
  {
    category: 'Package Information',
    fields: ['packageName', 'packageType', 'length', 'breadth', 'height', 'maxWeight', 'standardCapacity', 'pricePerUnit'],
  },
  {
    category: 'Stock',
    fields: ['pickupLocationQuantities'],
  },
  {
    category: 'Additional',
    fields: ['notes'],
  },
]

/**
 * Header name mappings for Excel columns
 * pickupLocationQuantities format: locationId|qty|reorderLevel|maxStock;locationId|qty|reorderLevel|maxStock
 * Example: 1|50|10|200;2|30|5|100 means location 1 has 50 qty (reorder at 10, max 200), location 2 has 30 qty (reorder at 5, max 100)
 */
export const packageImportHeaderNames: Record<string, string> = {
  packageName: 'Package Name',
  packageType: 'Package Type',
  length: 'Length (cm)',
  breadth: 'Breadth (cm)',
  height: 'Height (cm)',
  maxWeight: 'Max Weight (kg)',
  standardCapacity: 'Standard Capacity',
  pricePerUnit: 'Price Per Unit',
  pickupLocationQuantities: 'Pickup Locations (id|qty|reorder|max)',
  notes: 'Notes',
}

/**
 * Fields to hide by default in the preview grid
 * Empty array = all fields visible
 */
export const packageImportHiddenFields: string[] = []

/**
 * Field display configurations for package import preview grid
 */
export const packageImportFieldDisplayConfig: Record<string, FieldDisplayConfig> = {
  rowNumber: {
    field: 'rowNumber',
    headerName: 'Row',
    width: 70,
  },
  packageName: {
    field: 'packageName',
    headerName: 'Package Name',
    width: 200,
  },
  packageType: {
    field: 'packageType',
    headerName: 'Package Type',
    width: 130,
  },
  length: {
    field: 'length',
    headerName: 'Length (cm)',
    width: 110,
    type: ColumnType.NUMBER,
  },
  breadth: {
    field: 'breadth',
    headerName: 'Breadth (cm)',
    width: 120,
    type: ColumnType.NUMBER,
  },
  height: {
    field: 'height',
    headerName: 'Height (cm)',
    width: 110,
    type: ColumnType.NUMBER,
  },
  maxWeight: {
    field: 'maxWeight',
    headerName: 'Max Weight (kg)',
    width: 130,
    type: ColumnType.NUMBER,
  },
  standardCapacity: {
    field: 'standardCapacity',
    headerName: 'Capacity',
    width: 100,
    type: ColumnType.NUMBER,
  },
  pricePerUnit: {
    field: 'pricePerUnit',
    headerName: 'Price/Unit',
    width: 110,
    type: ColumnType.CURRENCY,
  },
  pickupLocationQuantitiesStr: {
    field: 'pickupLocationQuantitiesStr',
    headerName: 'Pickup Locations',
    width: 180,
  },
  notes: {
    field: 'notes',
    headerName: 'Notes',
    width: 150,
  },
  errors: {
    field: 'errors',
    headerName: 'Status',
    width: 100,
  },
}

/**
 * Interface for parsed package data from Excel/CSV
 */
export interface ImportPackageData {
  rowNumber: number
  packageName: string
  packageType: string
  length: number
  breadth: number
  height: number
  maxWeight: number
  standardCapacity: number
  pricePerUnit: number
  pickupLocationQuantities?: Record<string, PackagePickupLocationMappingRequestModel>
  pickupLocationQuantitiesStr?: string // Raw string for display in grid
  notes?: string
  errors?: string[]
}

/**
 * Parse pickup location quantities string into Record format
 * Format: locationId|qty|reorderLevel|maxStock;locationId|qty|reorderLevel|maxStock
 * Example: 1|50|10|200;2|30|5|100
 */
export const parsePickupLocationQuantities = (
  str: string | undefined,
): Record<string, PackagePickupLocationMappingRequestModel> => {
  if (!str) return {}

  const result: Record<string, PackagePickupLocationMappingRequestModel> = {}

  // Split by semicolon to get each location entry
  const entries = str.split(';').filter(Boolean)

  for (const entry of entries) {
    const parts = entry.split('|').map(p => p.trim())
    if (parts.length >= 4) {
      const [locationId, qty, reorderLevel, maxStock] = parts
      result[locationId] = {
        quantity: parseInt(qty, 10) || 0,
        reorderLevel: parseInt(reorderLevel, 10) || 10,
        maxStockLevel: parseInt(maxStock, 10) || 1000,
      }
    }
  }

  return result
}

/**
 * Generate grid columns for package import preview
 * Dynamically creates columns with flex layout and formatting
 *
 * @param onErrorClick - Callback when error chip is clicked, receives errors array and row number
 * @param onStockClick - Optional callback when stock chip is clicked, receives row number, stock string, and package name
 * @returns Array of GridColDef for the data grid
 */
export const getPackageImportPreviewColumns = (
  onErrorClick: (errors: string[], rowNumber: number) => void,
  onStockClick?: (rowNumber: number, stockString: string, packageName: string) => void,
): GridColDef[] => {
  // Define ALL columns to show in preview (matches template structure)
  // Status column at the end
  const previewFields = [
    'rowNumber',
    'packageName',
    'packageType',
    'length',
    'breadth',
    'height',
    'maxWeight',
    'standardCapacity',
    'pricePerUnit',
    'pickupLocationQuantitiesStr',
    'notes',
    'errors',
  ]

  return previewFields.map(fieldName => {
    const config = packageImportFieldDisplayConfig[fieldName]

    // Calculate flex value and minWidth based on field type
    let flex = 1
    let minWidth = config.width ?? 100

    if (fieldName === 'rowNumber') {
      flex = 0.4
      minWidth = 70
    } else if (fieldName === 'packageName') {
      flex = 1.5
      minWidth = 200
    } else if (fieldName === 'packageType') {
      flex = 0.9
      minWidth = 130
    } else if (fieldName === 'length' || fieldName === 'height') {
      flex = 0.7
      minWidth = 110
    } else if (fieldName === 'breadth') {
      flex = 0.7
      minWidth = 120
    } else if (fieldName === 'maxWeight') {
      flex = 0.8
      minWidth = 130
    } else if (fieldName === 'standardCapacity') {
      flex = 0.6
      minWidth = 100
    } else if (fieldName === 'pricePerUnit') {
      flex = 0.7
      minWidth = 110
    } else if (fieldName === 'pickupLocationQuantitiesStr') {
      flex = 1.2
      minWidth = 180
    } else if (fieldName === 'notes') {
      flex = 1
      minWidth = 150
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

    // Special rendering for numeric fields (center align)
    if (['length', 'breadth', 'height', 'maxWeight', 'standardCapacity'].includes(fieldName)) {
      return {
        ...baseColumn,
        align: 'right' as const,
        headerAlign: 'right' as const,
      }
    }

    // Special rendering for pricePerUnit (currency)
    if (fieldName === 'pricePerUnit') {
      return {
        ...baseColumn,
        align: 'right' as const,
        headerAlign: 'right' as const,
        valueFormatter: (value: number) => `₹${value?.toFixed(2) ?? '0.00'}`,
      }
    }

    // Special rendering for packageType (colored chip matching PackageGridColumns)
    if (fieldName === 'packageType') {
      return {
        ...baseColumn,
        align: 'center' as const,
        headerAlign: 'center' as const,
        renderCell: (params: GridRenderCellParams<ImportPackageData>) => {
          const { row } = params
          const packageType = row.packageType
          if (!packageType) return '—'
          return (
            <Chip
              label={getPackageTypeLabel(packageType)}
              color={getPackageTypeColor(packageType)}
              size="small"
            />
          )
        },
      }
    }

    // Special rendering for pickupLocationQuantities (clickable to show modal)
    if (fieldName === 'pickupLocationQuantitiesStr') {
      return {
        ...baseColumn,
        renderCell: (params: GridRenderCellParams<ImportPackageData>) => {
          const { row } = params
          const value = row.pickupLocationQuantitiesStr
          if (!value) return '—'
          // Count locations by splitting on semicolon
          const locations = value.split(';').filter(Boolean)
          return (
            <Tooltip title="Click to view details">
              <span>
                <Chip
                  label={`${locations.length} location${locations.length !== 1 ? 's' : ''}`}
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={e => {
                    e.stopPropagation()
                    onStockClick?.(row.rowNumber, value, row.packageName)
                  }}
                  sx={{ cursor: 'pointer' }}
                />
              </span>
            </Tooltip>
          )
        },
      }
    }

    // Special rendering for errors/status field
    if (fieldName === 'errors') {
      return {
        ...baseColumn,
        align: 'center' as const,
        headerAlign: 'center' as const,
        renderCell: (params: GridRenderCellParams<ImportPackageData>) => {
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
