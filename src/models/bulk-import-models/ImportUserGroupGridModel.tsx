/**
 * User Group Import Grid Model
 * Configuration for bulk user group import template structure and field display
 */

import { Chip, Tooltip } from '@mui/material'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'

import { type FieldDisplayConfig, type TemplateStructure } from '../ImportTemplateStructure'

/**
 * User Group Import Template Structure
 * Defines the column layout for the user group import Excel template
 * - First row: Category headers (merged cells)
 * - Second row: Field names
 */
export const userGroupImportTemplateStructure: TemplateStructure = [
  {
    category: 'Group Information',
    fields: ['name', 'description', 'notes'],
  },
  {
    category: 'Members',
    fields: ['userIds'],
  },
]

/**
 * Custom header names for user group import fields
 */
export const userGroupImportHeaderNames: Record<string, string> = {
  name: 'Group Name',
  description: 'Description',
  notes: 'Notes',
  userIds: 'User IDs (comma-separated)',
}

/**
 * Fields to hide by default in the preview grid
 * Empty array means all fields from XLSX will be visible
 */
export const userGroupImportHiddenFields: string[] = []

/**
 * Field display configurations for user group import preview grid
 * Includes custom configurations that override the auto-generated ones
 */
export const userGroupImportFieldDisplayConfig: Record<string, FieldDisplayConfig> = {
  rowNumber: {
    field: 'rowNumber',
    headerName: 'Row',
    width: 70,
  },
  name: {
    field: 'name',
    headerName: 'Group Name',
    width: 200,
  },
  description: {
    field: 'description',
    headerName: 'Description',
    width: 300,
  },
  notes: {
    field: 'notes',
    headerName: 'Notes',
    width: 150,
  },
  userIds: {
    field: 'userIds',
    headerName: 'User Count',
    width: 120,
  },
  errors: {
    field: 'errors',
    headerName: 'Status',
    width: 120,
  },
}

/**
 * Interface for parsed user group data from Excel/CSV
 */
export interface ImportUserGroupData {
  rowNumber: number
  name: string
  description: string
  notes?: string
  userIds: number[]
  errors?: string[]
}

/**
 * Generate grid columns for user group import preview
 * Dynamically creates columns with flex layout and formatting
 *
 * @param onErrorClick - Callback when error chip is clicked, receives errors array and row number
 * @returns Array of GridColDef for the data grid
 */
export const getUserGroupImportPreviewColumns = (
  onErrorClick: (errors: string[], rowNumber: number) => void,
): GridColDef[] => {
  // Get all fields from the config
  const allFields = Object.values(userGroupImportFieldDisplayConfig) as Array<
    FieldDisplayConfig & {
      field: string
      headerName: string
    }
  >

  return allFields.map(config => {
    // Calculate flex value and minWidth based on field type
    let flex = 1
    let minWidth = 150 // Default minimum width

    if (config.field === 'rowNumber') {
      flex = 0.4
      minWidth = 70
    } else if (config.field === 'name') {
      flex = 1.5
      minWidth = 200
    } else if (config.field === 'description') {
      flex = 2
      minWidth = 300
    } else if (config.field === 'notes') {
      flex = 1
      minWidth = 150
    } else if (config.field === 'userIds' || config.field === 'errors') {
      flex = 0.8
      minWidth = 120
    }

    const baseColumn: GridColDef = {
      field: config.field,
      headerName: config.headerName,
      flex,
      minWidth,
    }

    // Special rendering for rowNumber
    if (config.field === 'rowNumber') {
      return {
        ...baseColumn,
        align: 'center' as const,
        headerAlign: 'center' as const,
      }
    }

    // Special rendering for userIds - show count
    if (config.field === 'userIds') {
      return {
        ...baseColumn,
        align: 'center' as const,
        headerAlign: 'center' as const,
        valueGetter: (value: unknown): number => (Array.isArray(value) ? value.length : 0),
      }
    }

    // Special rendering for errors/status field
    if (config.field === 'errors') {
      return {
        ...baseColumn,
        renderCell: (params: GridRenderCellParams<ImportUserGroupData>) => {
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

