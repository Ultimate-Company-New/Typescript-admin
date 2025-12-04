/**
 * User Import Grid Model
 * Configuration for bulk user import template structure and field display
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
 * User Import Template Structure
 * Defines the column layout for the user import Excel template
 * - First row: Category headers (merged cells)
 * - Second row: Field names
 */
export const userImportTemplateStructure: TemplateStructure = [
  {
    category: 'Info',
    fields: ['loginName', 'firstName', 'lastName', 'phone', 'role', 'dob', 'imageUrl'],
  },
  {
    category: 'Address',
    fields: [
      'streetAddress',
      'streetAddress2',
      'streetAddress3',
      'city',
      'state',
      'zipCode',
      'country',
      'addressType',
      'nameOnAddress',
      'emailOnAddress',
      'phoneOnAddress',
    ],
  },
  {
    category: 'Other',
    fields: ['permissionIds', 'selectedGroupIds', 'notes'],
  },
]

/**
 * Custom header names for user import fields
 */
export const userImportHeaderNames: Record<string, string> = {
  loginName: 'Login Name (Email)',
  firstName: 'First Name',
  lastName: 'Last Name',
  phone: 'Phone',
  role: 'Role',
  dob: 'DOB',
  imageUrl: 'Image URL',
  streetAddress: 'Street Address',
  streetAddress2: 'Street Address 2',
  streetAddress3: 'Street Address 3',
  city: 'City',
  state: 'State',
  zipCode: 'Postal Code',
  country: 'Country',
  addressType: 'Address Type',
  nameOnAddress: 'Name on Address',
  emailOnAddress: 'Email on Address',
  phoneOnAddress: 'Phone on Address',
  permissionIds: 'Permission IDs',
  selectedGroupIds: 'Group IDs',
  notes: 'Notes',
}

/**
 * Fields to hide by default in the preview grid
 * Empty array means all fields from XLSX will be visible
 */
export const userImportHiddenFields: string[] = []

/**
 * Field display configurations for user import preview grid
 * Includes custom configurations that override the auto-generated ones
 */
export const userImportFieldDisplayConfig: Record<string, FieldDisplayConfig> = {
  rowNumber: {
    field: 'rowNumber',
    headerName: 'Row',
    width: 70,
  },
  loginName: {
    field: 'loginName',
    headerName: 'Login Name (Email)',
    width: 200,
  },
  firstName: {
    field: 'firstName',
    headerName: 'First Name',
    width: 130,
  },
  lastName: {
    field: 'lastName',
    headerName: 'Last Name',
    width: 130,
  },
  phone: {
    field: 'phone',
    headerName: 'Phone',
    width: 130,
    type: ColumnType.PHONE,
  },
  role: {
    field: 'role',
    headerName: 'Role',
    width: 120,
  },
  dob: {
    field: 'dob',
    headerName: 'DOB',
    width: 120,
    type: ColumnType.DATE,
  },
  imageUrl: {
    field: 'imageUrl',
    headerName: 'Image URL',
    width: 200,
    type: ColumnType.URL,
  },
  streetAddress: {
    field: 'streetAddress',
    headerName: 'Street Address',
    width: 200,
  },
  streetAddress2: {
    field: 'streetAddress2',
    headerName: 'Street Address 2',
    width: 150,
  },
  streetAddress3: {
    field: 'streetAddress3',
    headerName: 'Street Address 3',
    width: 150,
  },
  city: {
    field: 'city',
    headerName: 'City',
    width: 130,
  },
  state: {
    field: 'state',
    headerName: 'State',
    width: 80,
  },
  zipCode: {
    field: 'zipCode',
    headerName: 'Zip Code',
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
    width: 150,
  },
  nameOnAddress: {
    field: 'nameOnAddress',
    headerName: 'Name on Address',
    width: 200,
  },
  emailOnAddress: {
    field: 'emailOnAddress',
    headerName: 'Email on Address',
    width: 220,
    type: ColumnType.EMAIL,
  },
  phoneOnAddress: {
    field: 'phoneOnAddress',
    headerName: 'Phone on Address',
    width: 150,
    type: ColumnType.PHONE,
  },
  permissionIds: {
    field: 'permissionIds',
    headerName: 'Permission IDs',
    width: 150,
  },
  selectedGroupIds: {
    field: 'selectedGroupIds',
    headerName: 'Group IDs',
    width: 150,
  },
  notes: {
    field: 'notes',
    headerName: 'Notes',
    width: 200,
  },
  errors: {
    field: 'errors',
    headerName: 'Status',
    width: 120,
  },
}

/**
 * Generate grid columns for user import preview
 * Dynamically creates columns with flex layout and formatting
 *
 * @param onErrorClick - Callback when error chip is clicked, receives errors array and row number
 * @returns Array of GridColDef for the data grid
 */
export const getUserImportPreviewColumns = (
  onErrorClick: (errors: string[], rowNumber: number) => void,
): GridColDef[] => {
  // Get all fields from the config (no filtering by hidden)
  const allFields = Object.values(userImportFieldDisplayConfig) as Array<
    FieldDisplayConfig & {
      field: string
      headerName: string
      type?: ColumnType
    }
  >

  return allFields.map(config => {
    // Calculate flex value and minWidth based on field type
    let flex = 1
    let minWidth = 150 // Default larger minimum width

    if (config.field === 'rowNumber') {
      flex = 0.4
      minWidth = 80
    } else if (config.field === 'loginName') {
      flex = 2
      minWidth = 220
    } else if (
      config.field === 'imageUrl' ||
      config.field === 'streetAddress' ||
      config.field === 'streetAddress2' ||
      config.field === 'streetAddress3'
    ) {
      flex = 1.8
      minWidth = 200
    } else if (
      config.field === 'firstName' ||
      config.field === 'lastName' ||
      config.field === 'phone' ||
      config.field === 'city' ||
      config.field === 'country' ||
      config.field === 'addressType'
    ) {
      flex = 1.2
      minWidth = 150
    } else if (config.field === 'permissionIds' || config.field === 'selectedGroupIds') {
      flex = 1.5
      minWidth = 180
    } else if (
      config.field === 'role' ||
      config.field === 'dob' ||
      config.field === 'zipCode' ||
      config.field === 'errors' ||
      config.field === 'nameOnAddress'
    ) {
      flex = 1
      minWidth = 130
    } else if (config.field === 'emailOnAddress') {
      flex = 1.6
      minWidth = 220
    } else if (config.field === 'phoneOnAddress') {
      flex = 1
      minWidth = 150
    } else if (config.field === 'state') {
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
    if (config.field === 'rowNumber') {
      return {
        ...baseColumn,
        align: 'center' as const,
        headerAlign: 'center' as const,
      }
    }

    // Special rendering for errors/status field
    if (config.field === 'errors') {
      return {
        ...baseColumn,
        renderCell: (params: GridRenderCellParams<{ errors?: string[]; rowNumber: number }>) => {
          const { row } = params
          if (row.errors && row.errors.length > 0) {
            return (
              <Tooltip title="Click to view details">
                <Chip
                  label="Error"
                  color="error"
                  size="small"
                  onClick={() => {
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
