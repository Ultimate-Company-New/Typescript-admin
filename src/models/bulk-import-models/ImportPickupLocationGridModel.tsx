/**
 * Pickup Location Import Grid Model
 * Configuration for bulk pickup location import template structure and field display
 */

import InventoryIcon from '@mui/icons-material/Inventory'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import { Box, Chip, Tooltip } from '@mui/material'
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
  {
    category: 'Mappings',
    fields: ['productMappings', 'packageMappings'],
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
  productMappings: 'Product Mappings (ID:Quantity,...)',
  packageMappings: 'Package Mappings (ID:Qty:Reorder:MaxStock,...)',
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
  productMappings: {
    field: 'productMappings',
    headerName: 'Product Mappings',
    width: 200,
  },
  packageMappings: {
    field: 'packageMappings',
    headerName: 'Package Mappings',
    width: 250,
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
/**
 * Product mapping for import
 */
export interface ImportProductMapping {
  productId: number
  quantity: number
}

/**
 * Package mapping for import
 */
export interface ImportPackageMapping {
  packageId: number
  quantity: number
  reorderLevel: number
  maxStockLevel: number
}

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
  /** Product mappings as string for display (ID:Quantity,...) or parsed array */
  productMappings?: string
  /** Package mappings as string for display (ID:Qty:Reorder:MaxStock,...) or parsed array */
  packageMappings?: string
  /** Parsed product mappings */
  parsedProductMappings?: ImportProductMapping[]
  /** Parsed package mappings */
  parsedPackageMappings?: ImportPackageMapping[]
  errors?: string[]
}

/**
 * Options for mapping column click handlers
 */
export interface MappingClickHandlers {
  onProductMappingsClick?: (mappingsString: string, locationName: string) => void
  onPackageMappingsClick?: (mappingsString: string, locationName: string) => void
}

/**
 * Generate grid columns for pickup location import preview
 * Dynamically creates columns with flex layout and formatting
 * Shows ALL fields for complete data preview
 *
 * @param onErrorClick - Callback when error chip is clicked, receives errors array and row number
 * @param mappingHandlers - Optional handlers for product/package mapping clicks
 * @returns Array of GridColDef for the data grid
 */
export const getPickupLocationImportPreviewColumns = (
  onErrorClick: (errors: string[], rowNumber: number) => void,
  mappingHandlers?: MappingClickHandlers,
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
    // Mappings
    'productMappings',
    'packageMappings',
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
    } else if (fieldName === 'productMappings') {
      flex = 1.3
      minWidth = 200
    } else if (fieldName === 'packageMappings') {
      flex = 1.5
      minWidth = 250
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

    // Special rendering for product mappings
    if (fieldName === 'productMappings') {
      return {
        ...baseColumn,
        align: 'center' as const,
        headerAlign: 'center' as const,
        renderCell: (params: GridRenderCellParams<ImportPickupLocationData>) => {
          const { row } = params
          const mappingsStr = row.productMappings

          if (!mappingsStr || mappingsStr.trim() === '') {
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                <Chip label="None" size="small" variant="outlined" />
              </Box>
            )
          }

          // Count the mappings
          const count = mappingsStr.split(',').filter(s => s.trim()).length

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
              <Tooltip title="Click to view product mappings">
                <Chip
                  icon={<ShoppingCartIcon />}
                  label={`${count} Product${count !== 1 ? 's' : ''}`}
                  color="primary"
                  size="small"
                  onClick={e => {
                    e.stopPropagation()
                    mappingHandlers?.onProductMappingsClick?.(mappingsStr, row.addressNickName)
                  }}
                  sx={{ cursor: 'pointer' }}
                />
              </Tooltip>
            </Box>
          )
        },
      }
    }

    // Special rendering for package mappings
    if (fieldName === 'packageMappings') {
      return {
        ...baseColumn,
        align: 'center' as const,
        headerAlign: 'center' as const,
        renderCell: (params: GridRenderCellParams<ImportPickupLocationData>) => {
          const { row } = params
          const mappingsStr = row.packageMappings

          if (!mappingsStr || mappingsStr.trim() === '') {
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                <Chip label="None" size="small" variant="outlined" />
              </Box>
            )
          }

          // Count the mappings
          const count = mappingsStr.split(',').filter(s => s.trim()).length

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
              <Tooltip title="Click to view package mappings">
                <Chip
                  icon={<InventoryIcon />}
                  label={`${count} Package${count !== 1 ? 's' : ''}`}
                  color="secondary"
                  size="small"
                  onClick={e => {
                    e.stopPropagation()
                    mappingHandlers?.onPackageMappingsClick?.(mappingsStr, row.addressNickName)
                  }}
                  sx={{ cursor: 'pointer' }}
                />
              </Tooltip>
            </Box>
          )
        },
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
