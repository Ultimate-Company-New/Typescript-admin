/**
 * Product Import Grid Model
 * Configuration for bulk product import template structure and field display
 */

import { Box, Chip, Tooltip } from '@mui/material'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

import { getConditionColor, getConditionLabel } from '../../constants/appConstants'
import {
  ColumnType,
  formatValueByType,
  type FieldDisplayConfig,
  type TemplateStructure,
} from '../ImportTemplateStructure'

/**
 * Product Import Template Structure
 * Defines the column layout for the product import Excel template
 * - First row: Category headers (merged cells)
 * - Second row: Field names
 */
export const productImportTemplateStructure: TemplateStructure = [
  {
    category: 'Product Information',
    fields: [
      'title',
      'brand',
      'model',
      'condition',
      'color',
      'colorLabel',
      'countryOfManufacture',
      'categoryId',
      'upc',
      'descriptionHtml',
      'itemModified',
      'modificationHtml',
    ],
  },
  {
    category: 'Pricing',
    fields: ['price', 'discount', 'isDiscountPercent', 'returnsAllowed'],
  },
  {
    category: 'Dimensions',
    fields: ['length', 'breadth', 'height', 'weightKgs'],
  },
  {
    category: 'Availability',
    fields: ['itemAvailableFrom', 'itemAvailableFromTimezone'],
  },
  {
    category: 'Stock (locationId:quantity)',
    fields: ['pickupLocationQuantities'],
  },
  {
    category: 'Required Images (URLs)',
    fields: ['mainImage', 'topImage', 'bottomImage', 'frontImage', 'backImage', 'rightImage', 'leftImage', 'detailsImage'],
  },
  {
    category: 'Optional Images (URLs)',
    fields: ['defectImage', 'additionalImage1', 'additionalImage2', 'additionalImage3'],
  },
  {
    category: 'Additional Fields',
    fields: ['notes'],
  },
]

/**
 * Custom header names for product import fields
 */
export const productImportHeaderNames: Record<string, string> = {
  title: 'Title',
  brand: 'Brand',
  model: 'Model',
  condition: 'Condition',
  color: 'Color (Hex)',
  colorLabel: 'Color Label',
  countryOfManufacture: 'Country',
  categoryId: 'Category ID',
  upc: 'UPC',
  price: 'Price',
  discount: 'Discount',
  isDiscountPercent: 'Is Percent',
  returnsAllowed: 'Returns Allowed',
  length: 'Length (cm)',
  breadth: 'Breadth (cm)',
  height: 'Height (cm)',
  weightKgs: 'Weight (kg)',
  itemAvailableFrom: 'Available From',
  itemAvailableFromTimezone: 'Timezone',
  pickupLocationQuantities: 'Locations (id:qty,id:qty)',
  mainImage: 'Main Image URL',
  topImage: 'Top Image URL',
  bottomImage: 'Bottom Image URL',
  frontImage: 'Front Image URL',
  backImage: 'Back Image URL',
  rightImage: 'Right Image URL',
  leftImage: 'Left Image URL',
  detailsImage: 'Details Image URL',
  defectImage: 'Defect Image URL',
  additionalImage1: 'Additional Image 1 URL',
  additionalImage2: 'Additional Image 2 URL',
  additionalImage3: 'Additional Image 3 URL',
  descriptionHtml: 'Description (HTML)',
  itemModified: 'Item Modified',
  modificationHtml: 'Modification Details (HTML)',
  notes: 'Notes',
}

/**
 * Fields to hide by default in the preview grid
 */
export const productImportHiddenFields: string[] = [
  'modificationHtml',
  'additionalImage1',
  'additionalImage2',
  'additionalImage3',
]

/**
 * Field display configurations for product import preview grid
 */
export const productImportFieldDisplayConfig: Record<string, FieldDisplayConfig> = {
  rowNumber: { field: 'rowNumber', headerName: 'Row', width: 70 },
  title: { field: 'title', headerName: 'Title', width: 200 },
  brand: { field: 'brand', headerName: 'Brand', width: 120 },
  model: { field: 'model', headerName: 'Model', width: 120 },
  condition: { field: 'condition', headerName: 'Condition', width: 140 },
  color: { field: 'color', headerName: 'Color', width: 100 },
  colorLabel: { field: 'colorLabel', headerName: 'Color Label', width: 110 },
  countryOfManufacture: { field: 'countryOfManufacture', headerName: 'Country', width: 120 },
  categoryId: { field: 'categoryId', headerName: 'Category ID', width: 100 },
  categoryPath: { field: 'categoryPath', headerName: 'Category', width: 280 },
  upc: { field: 'upc', headerName: 'UPC', width: 120 },
  price: { field: 'price', headerName: 'Price', width: 100 },
  discount: { field: 'discount', headerName: 'Discount', width: 100 },
  isDiscountPercent: { field: 'isDiscountPercent', headerName: 'Is %', width: 80 },
  returnsAllowed: { field: 'returnsAllowed', headerName: 'Returns', width: 90 },
  length: { field: 'length', headerName: 'Length', width: 80 },
  breadth: { field: 'breadth', headerName: 'Breadth', width: 80 },
  height: { field: 'height', headerName: 'Height', width: 80 },
  weightKgs: { field: 'weightKgs', headerName: 'Weight', width: 80 },
  itemAvailableFrom: { field: 'itemAvailableFrom', headerName: 'Available From', width: 160, type: ColumnType.DATE },
  itemAvailableFromTimezone: { field: 'itemAvailableFromTimezone', headerName: 'Timezone', width: 130 },
  pickupLocationQuantities: { field: 'pickupLocationQuantities', headerName: 'Stock', width: 150 },
  mainImage: { field: 'mainImage', headerName: 'Main Image', width: 120, type: ColumnType.URL },
  topImage: { field: 'topImage', headerName: 'Top Image', width: 120, type: ColumnType.URL },
  bottomImage: { field: 'bottomImage', headerName: 'Bottom Image', width: 120, type: ColumnType.URL },
  frontImage: { field: 'frontImage', headerName: 'Front Image', width: 120, type: ColumnType.URL },
  backImage: { field: 'backImage', headerName: 'Back Image', width: 120, type: ColumnType.URL },
  rightImage: { field: 'rightImage', headerName: 'Right Image', width: 120, type: ColumnType.URL },
  leftImage: { field: 'leftImage', headerName: 'Left Image', width: 120, type: ColumnType.URL },
  detailsImage: { field: 'detailsImage', headerName: 'Details Image', width: 120, type: ColumnType.URL },
  defectImage: { field: 'defectImage', headerName: 'Defect Image', width: 120, type: ColumnType.URL },
  additionalImage1: { field: 'additionalImage1', headerName: 'Add. Image 1', width: 120, type: ColumnType.URL },
  additionalImage2: { field: 'additionalImage2', headerName: 'Add. Image 2', width: 120, type: ColumnType.URL },
  additionalImage3: { field: 'additionalImage3', headerName: 'Add. Image 3', width: 120, type: ColumnType.URL },
  descriptionHtml: { field: 'descriptionHtml', headerName: 'Description', width: 200 },
  itemModified: { field: 'itemModified', headerName: 'Modified', width: 90 },
  modificationHtml: { field: 'modificationHtml', headerName: 'Mod. Details', width: 150 },
  notes: { field: 'notes', headerName: 'Notes', width: 150 },
  errors: { field: 'errors', headerName: 'Status', width: 100 },
}

/**
 * Interface for parsed product data from Excel/CSV
 */
export interface ImportProductData {
  rowNumber: number
  title: string
  brand: string
  model?: string
  condition: string
  color: string
  colorLabel: string
  countryOfManufacture: string
  categoryId: number
  categoryPath?: string // Full path fetched from API (e.g., "Electronics > Computers > Laptops")
  upc?: string
  price: number
  discount: number
  isDiscountPercent: boolean
  returnsAllowed: boolean
  returnWindowDays?: number
  length?: number
  breadth?: number
  height?: number
  weightKgs?: number
  itemAvailableFrom: string
  itemAvailableFromTimezone: string
  pickupLocationQuantities: string // Format: "1:50,2:30"
  mainImage: string
  topImage: string
  bottomImage: string
  frontImage: string
  backImage: string
  rightImage: string
  leftImage: string
  detailsImage: string
  defectImage?: string
  additionalImage1?: string
  additionalImage2?: string
  additionalImage3?: string
  descriptionHtml: string
  itemModified: boolean
  modificationHtml?: string
  notes?: string
  errors?: string[]
}

/**
 * Parse pickup location quantities string to Record<number, number>
 * Format: "1:50,2:30,3:100" -> { 1: 50, 2: 30, 3: 100 }
 */
export const parsePickupLocationQuantities = (value: string): Record<number, number> => {
  const result: Record<number, number> = {}
  if (!value || value.trim() === '') return result

  const pairs = value.split(',')
  for (const pair of pairs) {
    const [locationId, quantity] = pair.trim().split(':')
    const id = parseInt(locationId, 10)
    const qty = parseInt(quantity, 10)
    if (!isNaN(id) && !isNaN(qty) && id > 0 && qty >= 0) {
      result[id] = qty
    }
  }
  return result
}

/**
 * Generate grid columns for product import preview
 * Dynamically creates columns with flex layout and formatting
 * Shows ALL columns from the template structure
 *
 * @param onErrorClick - Callback when error chip is clicked
 * @returns Array of GridColDef for the data grid
 */
export const getProductImportPreviewColumns = (
  onErrorClick: (errors: string[], rowNumber: number) => void,
  onStockClick?: (rowNumber: number, stockString: string, productTitle: string) => void,
): GridColDef[] => {
  // Get all fields from template structure + rowNumber and errors
  // Replace categoryId with categoryPath for display
  const allFields = productImportTemplateStructure.flatMap(section => section.fields)
  const fieldsWithCategoryPath = allFields.map(f => f === 'categoryId' ? 'categoryPath' : f)
  const previewFields = ['rowNumber', ...fieldsWithCategoryPath, 'errors']

  return previewFields.map(fieldName => {
    const config = productImportFieldDisplayConfig[fieldName]

    // Calculate flex value and minWidth based on field type
    let flex = 1
    let minWidth = config?.width ?? 100

    // Sizing based on field type
    if (fieldName === 'rowNumber') {
      flex = 0.4
      minWidth = 70
    } else if (fieldName === 'title' || fieldName === 'descriptionHtml') {
      flex = 1.5
      minWidth = 200
    } else if (fieldName === 'brand' || fieldName === 'condition' || fieldName === 'countryOfManufacture') {
      flex = 0.9
      minWidth = 120
    } else if (fieldName === 'model' || fieldName === 'colorLabel') {
      flex = 0.8
      minWidth = 110
    } else if (fieldName === 'color') {
      flex = 0.6
      minWidth = 100
    } else if (fieldName === 'categoryPath') {
      flex = 2
      minWidth = 280
    } else if (fieldName === 'categoryId' || fieldName === 'price' || fieldName === 'discount') {
      flex = 0.6
      minWidth = 100
    } else if (fieldName === 'upc') {
      flex = 0.8
      minWidth = 120
    } else if (fieldName === 'isDiscountPercent' || fieldName === 'returnsAllowed' || fieldName === 'itemModified') {
      flex = 0.5
      minWidth = 80
    } else if (fieldName === 'length' || fieldName === 'breadth' || fieldName === 'height' || fieldName === 'weightKgs') {
      flex = 0.5
      minWidth = 80
    } else if (fieldName === 'pickupLocationQuantities') {
      flex = 1
      minWidth = 150
    } else if (fieldName.includes('Image')) {
      flex = 1
      minWidth = 180
    } else if (fieldName === 'itemAvailableFrom') {
      flex = 1
      minWidth = 160
    } else if (fieldName === 'itemAvailableFromTimezone') {
      flex = 0.8
      minWidth = 130
    } else if (fieldName === 'modificationHtml') {
      flex = 1.2
      minWidth = 150
    } else if (fieldName === 'notes') {
      flex = 1
      minWidth = 150
    } else if (fieldName === 'errors') {
      flex = 0.6
      minWidth = 100
    }

    const baseColumn: GridColDef = {
      field: config?.field ?? fieldName,
      headerName: config?.headerName ?? fieldName,
      flex,
      minWidth,
    }

    // Apply formatting based on column type
    if (config?.type) {
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

    // Special rendering for condition (colored chips)
    if (fieldName === 'condition') {
      return {
        ...baseColumn,
        renderCell: (params: GridRenderCellParams<ImportProductData>) => {
          const { row } = params
          const conditionValue = row.condition

          if (!conditionValue) {
            return <span>—</span>
          }

          // Get label and color from appConstants
          const label = getConditionLabel(conditionValue)
          const color = getConditionColor(conditionValue)

          return (
            <Chip
              label={label}
              color={color}
              size="small"
            />
          )
        },
      }
    }

    // Special rendering for categoryPath
    if (fieldName === 'categoryPath') {
      return {
        ...baseColumn,
        renderCell: (params: GridRenderCellParams<ImportProductData>) => {
          const { row } = params
          if (row.categoryPath) {
            // Show truncated path with full path in tooltip
            const pathParts = row.categoryPath.split(' › ')
            const displayText = pathParts.length > 2
              ? `${pathParts[0]} › ... › ${pathParts[pathParts.length - 1]}`
              : row.categoryPath
            return (
              <Tooltip title={row.categoryPath}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayText}
                </span>
              </Tooltip>
            )
          }
          return (
            <Tooltip title={`Category ID: ${row.categoryId}`}>
              <span>
                <Chip label={`ID: ${row.categoryId}`} size="small" color="warning" variant="outlined" />
              </span>
            </Tooltip>
          )
        },
      }
    }

    // Special rendering for categoryId (if still shown)
    if (fieldName === 'categoryId') {
      return {
        ...baseColumn,
        align: 'center' as const,
        headerAlign: 'center' as const,
      }
    }

    // Special rendering for price
    if (fieldName === 'price') {
      return {
        ...baseColumn,
        align: 'right' as const,
        headerAlign: 'right' as const,
        valueFormatter: (value: unknown): string => {
          if (typeof value === 'number') {
            return `₹${value.toFixed(2)}`
          }
          return String(value ?? '')
        },
      }
    }

    // Special rendering for discount (show % or ₹ based on isDiscountPercent)
    if (fieldName === 'discount') {
      return {
        ...baseColumn,
        align: 'right' as const,
        headerAlign: 'right' as const,
        renderCell: (params: GridRenderCellParams<ImportProductData>) => {
          const { row } = params
          const discount = row.discount
          if (discount === undefined || discount === null) return '—'
          if (row.isDiscountPercent) {
            return `${discount}%`
          }
          return `₹${discount.toFixed(2)}`
        },
      }
    }

    // Special rendering for isDiscountPercent
    if (fieldName === 'isDiscountPercent') {
      return {
        ...baseColumn,
        align: 'center' as const,
        headerAlign: 'center' as const,
        renderCell: (params: GridRenderCellParams<ImportProductData>) => {
          const { row } = params
          return row.isDiscountPercent ? (
            <Chip label="%" color="primary" size="small" variant="outlined" />
          ) : (
            <Chip label="₹" color="secondary" size="small" variant="outlined" />
          )
        },
      }
    }

    // Special rendering for pickupLocationQuantities (clickable to show modal)
    if (fieldName === 'pickupLocationQuantities') {
      return {
        ...baseColumn,
        renderCell: (params: GridRenderCellParams<ImportProductData>) => {
          const { row } = params
          const value = row.pickupLocationQuantities
          if (!value) return '—'
          const parsed = parsePickupLocationQuantities(value)
          const count = Object.keys(parsed).length
          return (
            <Tooltip title="Click to view details">
              <span>
                <Chip
                  label={`${count} location${count !== 1 ? 's' : ''}`}
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    onStockClick?.(row.rowNumber, value, row.title)
                  }}
                  sx={{ cursor: 'pointer' }}
                />
              </span>
            </Tooltip>
          )
        },
      }
    }

    // Special rendering for returnsAllowed
    if (fieldName === 'returnsAllowed') {
      return {
        ...baseColumn,
        align: 'center' as const,
        headerAlign: 'center' as const,
        renderCell: (params: GridRenderCellParams<ImportProductData>) => {
          const { row } = params
          return row.returnsAllowed ? (
            <Chip label="Yes" color="success" size="small" variant="outlined" />
          ) : (
            <Chip label="No" color="default" size="small" variant="outlined" />
          )
        },
      }
    }

    // Special rendering for itemModified
    if (fieldName === 'itemModified') {
      return {
        ...baseColumn,
        align: 'center' as const,
        headerAlign: 'center' as const,
        renderCell: (params: GridRenderCellParams<ImportProductData>) => {
          const { row } = params
          return row.itemModified ? (
            <Chip label="Yes" color="warning" size="small" variant="outlined" />
          ) : (
            <Chip label="No" color="default" size="small" variant="outlined" />
          )
        },
      }
    }

    // Special rendering for all image fields (show actual image thumbnail)
    if (fieldName.includes('Image')) {
      const isRequired = ['mainImage', 'topImage', 'bottomImage', 'frontImage', 'backImage', 'rightImage', 'leftImage', 'detailsImage'].includes(fieldName)
      return {
        ...baseColumn,
        renderCell: (params: GridRenderCellParams<ImportProductData>) => {
          const { row } = params
          const value = row[fieldName as keyof ImportProductData] as string | undefined
          if (value) {
            return (
              <Tooltip title={value}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    padding: '4px',
                  }}
                >
                  <Box
                    component="img"
                    src={value}
                    alt={fieldName}
                    loading="lazy"
                    sx={{
                      maxWidth: 160,
                      maxHeight: 120,
                      objectFit: 'contain',
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0',
                    }}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      // Show placeholder on error
                      e.currentTarget.style.display = 'none'
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        parent.innerHTML = '<span style="color: #f44336; font-size: 12px;">✗ Invalid</span>'
                      }
                    }}
                  />
                </Box>
              </Tooltip>
            )
          }
          return isRequired ? (
            <Chip label="✗ Missing" color="error" size="small" variant="outlined" />
          ) : (
            <Chip label="—" color="default" size="small" variant="outlined" />
          )
        },
      }
    }

    // Special rendering for color (show color swatch)
    if (fieldName === 'color') {
      return {
        ...baseColumn,
        renderCell: (params: GridRenderCellParams<ImportProductData>) => {
          const { row } = params
          if (row.color) {
            return (
              <Tooltip title={row.color}>
                <span>
                  <Chip
                    label={row.color}
                    size="small"
                    variant="outlined"
                    sx={{
                    borderColor: row.color,
                    '& .MuiChip-label': {
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                    },
                  }}
                  icon={
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: row.color,
                        display: 'inline-block',
                        marginLeft: 6,
                      }}
                    />
                  }
                  />
                </span>
              </Tooltip>
            )
          }
          return '—'
        },
      }
    }

    // Truncate long text fields
    if (fieldName === 'descriptionHtml' || fieldName === 'modificationHtml' || fieldName === 'notes') {
      return {
        ...baseColumn,
        renderCell: (params: GridRenderCellParams<ImportProductData>) => {
          const { row } = params
          const value = row[fieldName as keyof ImportProductData] as string | undefined
          if (value) {
            const plainText = value.replace(/<[^>]*>/g, '').substring(0, 50)
            return (
              <Tooltip title={value.replace(/<[^>]*>/g, '').substring(0, 200)}>
                <span>{plainText}{value.length > 50 ? '...' : ''}</span>
              </Tooltip>
            )
          }
          return '—'
        },
      }
    }

    // Special rendering for dimensions
    if (fieldName === 'length' || fieldName === 'breadth' || fieldName === 'height') {
      return {
        ...baseColumn,
        align: 'right' as const,
        headerAlign: 'right' as const,
        valueFormatter: (value: unknown): string => {
          if (typeof value === 'number') {
            return `${value} cm`
          }
          return value ? String(value) : '—'
        },
      }
    }

    // Special rendering for weight
    if (fieldName === 'weightKgs') {
      return {
        ...baseColumn,
        align: 'right' as const,
        headerAlign: 'right' as const,
        valueFormatter: (value: unknown): string => {
          if (typeof value === 'number') {
            return `${value} kg`
          }
          return value ? String(value) : '—'
        },
      }
    }

    // Special rendering for errors/status field
    if (fieldName === 'errors') {
      return {
        ...baseColumn,
        renderCell: (params: GridRenderCellParams<ImportProductData>) => {
          const { row } = params
          if (row.errors && row.errors.length > 0) {
            return (
              <Tooltip title="Click to view details">
                <span>
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
                </span>
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

