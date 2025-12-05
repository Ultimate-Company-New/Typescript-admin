/**
 * Lead Import Grid Model
 * Configuration for bulk lead import template structure and field display
 */

import { Chip, Tooltip } from '@mui/material'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

import { ColumnType, type FieldDisplayConfig, type TemplateStructure } from '../ImportTemplateStructure'

/**
 * Lead Import Template Structure
 * Defines the column layout for the lead import Excel template
 * - First row: Category headers (merged cells)
 * - Second row: Field names
 */
export const leadImportTemplateStructure: TemplateStructure = [
  {
    category: 'Lead Details',
    fields: ['firstName', 'lastName', 'email', 'phone', 'leadStatus', 'title', 'assignedAgentId'],
  },
  {
    category: 'Company Details',
    fields: ['company', 'companySize', 'annualRevenue', 'website', 'fax'],
  },
  {
    category: 'Address',
    fields: ['streetAddress', 'streetAddress2', 'streetAddress3', 'city', 'state', 'postalCode', 'country', 'addressType'],
  },
  {
    category: 'Notes',
    fields: ['notes'],
  },
]

/**
 * Custom header names for lead import fields
 */
export const leadImportHeaderNames: Record<string, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email',
  phone: 'Phone',
  leadStatus: 'Lead Status',
  company: 'Company',
  title: 'Title',
  companySize: 'Company Size',
  annualRevenue: 'Annual Revenue',
  website: 'Website',
  fax: 'Fax',
  assignedAgentId: 'Assigned Agent ID',
  streetAddress: 'Street Address',
  streetAddress2: 'Street Address 2',
  streetAddress3: 'Street Address 3',
  city: 'City',
  state: 'State',
  postalCode: 'Postal Code',
  country: 'Country',
  addressType: 'Address Type',
  notes: 'Notes',
}

/**
 * Fields to hide by default in the preview grid
 * Empty array = all fields visible
 */
export const leadImportHiddenFields: string[] = []

/**
 * Field display configurations for lead import preview grid
 */
export const leadImportFieldDisplayConfig: Record<string, FieldDisplayConfig> = {
  rowNumber: {
    field: 'rowNumber',
    headerName: 'Row',
    width: 70,
  },
  firstName: {
    field: 'firstName',
    headerName: 'First Name',
    width: 120,
  },
  lastName: {
    field: 'lastName',
    headerName: 'Last Name',
    width: 120,
  },
  email: {
    field: 'email',
    headerName: 'Email',
    width: 200,
    type: ColumnType.EMAIL,
  },
  phone: {
    field: 'phone',
    headerName: 'Phone',
    width: 130,
    type: ColumnType.PHONE,
  },
  leadStatus: {
    field: 'leadStatus',
    headerName: 'Status',
    width: 140,
  },
  company: {
    field: 'company',
    headerName: 'Company',
    width: 150,
  },
  title: {
    field: 'title',
    headerName: 'Title',
    width: 120,
  },
  companySize: {
    field: 'companySize',
    headerName: 'Size',
    width: 80,
    type: ColumnType.NUMBER,
  },
  annualRevenue: {
    field: 'annualRevenue',
    headerName: 'Revenue',
    width: 120,
  },
  website: {
    field: 'website',
    headerName: 'Website',
    width: 150,
    type: ColumnType.URL,
  },
  fax: {
    field: 'fax',
    headerName: 'Fax',
    width: 120,
    type: ColumnType.PHONE,
  },
  assignedAgentId: {
    field: 'assignedAgentId',
    headerName: 'Agent ID',
    width: 90,
    type: ColumnType.NUMBER,
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
 * Interface for parsed lead data from Excel/CSV
 */
export interface ImportLeadData {
  rowNumber: number
  firstName: string
  lastName: string
  email: string
  phone: string
  leadStatus: string
  company?: string
  title?: string
  companySize?: number
  annualRevenue?: string
  website?: string
  fax?: string
  assignedAgentId: number
  streetAddress: string
  streetAddress2?: string
  streetAddress3?: string
  city: string
  state: string
  postalCode: string
  country: string
  addressType: string
  notes?: string
  errors?: string[]
}

/**
 * Generate grid columns for lead import preview
 * Dynamically creates columns with flex layout and formatting
 * Shows ALL fields for complete data preview
 *
 * @param onErrorClick - Callback when error chip is clicked, receives errors array and row number
 * @returns Array of GridColDef for the data grid
 */
export const getLeadImportPreviewColumns = (
  onErrorClick: (errors: string[], rowNumber: number) => void,
): GridColDef[] => {
  // Define ALL columns to show in preview (matches template structure)
  const previewFields = [
    'rowNumber',
    // Lead Details
    'firstName',
    'lastName',
    'email',
    'phone',
    'leadStatus',
    'title',
    'assignedAgentId',
    // Company Details
    'company',
    'companySize',
    'annualRevenue',
    'website',
    'fax',
    // Address
    'streetAddress',
    'streetAddress2',
    'streetAddress3',
    'city',
    'state',
    'postalCode',
    'country',
    'addressType',
    // Notes
    'notes',
    // Status
    'errors',
  ]

  return previewFields.map(fieldName => {
    const config = leadImportFieldDisplayConfig[fieldName]
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
    } else if (fieldName === 'email') {
      flex = 1.4
      minWidth = 200
    } else if (fieldName === 'firstName' || fieldName === 'lastName') {
      flex = 0.9
      minWidth = 120
    } else if (fieldName === 'phone' || fieldName === 'fax') {
      flex = 0.9
      minWidth = 120
    } else if (fieldName === 'leadStatus') {
      flex = 1
      minWidth = 140
    } else if (fieldName === 'company') {
      flex = 1.1
      minWidth = 150
    } else if (fieldName === 'title') {
      flex = 0.9
      minWidth = 120
    } else if (fieldName === 'companySize') {
      flex = 0.5
      minWidth = 80
    } else if (fieldName === 'annualRevenue') {
      flex = 0.8
      minWidth = 120
    } else if (fieldName === 'website') {
      flex = 1.1
      minWidth = 150
    } else if (fieldName === 'assignedAgentId') {
      flex = 0.6
      minWidth = 90
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

    // Special rendering for numeric fields (center align)
    if (fieldName === 'assignedAgentId' || fieldName === 'companySize') {
      return {
        ...baseColumn,
        align: 'center' as const,
        headerAlign: 'center' as const,
      }
    }

    // Special rendering for errors/status field
    if (fieldName === 'errors') {
      return {
        ...baseColumn,
        renderCell: (params: GridRenderCellParams<ImportLeadData>) => {
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

