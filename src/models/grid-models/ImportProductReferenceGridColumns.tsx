import { Box } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import styles from '../../styles/Products.module.scss'

// ============================================================================
// Condition Grid Types & Columns
// ============================================================================

/**
 * Condition data structure for the reference grid
 */
export interface ConditionData {
  id: number
  value: string
  label: string
}

/**
 * Get condition grid columns for the import reference grid
 */
export const getConditionGridColumns = (): GridColDef[] => [
  {
    field: 'value',
    headerName: 'Condition Value',
    flex: 1,
    minWidth: 200,
    align: 'left',
    headerAlign: 'left',
    renderCell: (params: GridRenderCellParams) => (
      <Box className={styles['import-reference-grid__cell']}>
        {params.value}
      </Box>
    ),
  },
]

// ============================================================================
// Color Grid Types & Columns
// ============================================================================

/**
 * Color data structure for the reference grid
 */
export interface ColorData {
  id: number
  hex: string
  label: string
}

/**
 * Get color grid columns for the import reference grid
 */
export const getColorGridColumns = (): GridColDef[] => [
  {
    field: 'colorBox',
    headerName: 'Color',
    width: 80,
    sortable: false,
    filterable: false,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams<ColorData>) => (
      <Box className={styles['import-reference-grid__cell--center']}>
        <Box
          className={styles['import-reference-grid__color-box']}
          style={{ backgroundColor: params.row.hex }}
        />
      </Box>
    ),
  },
  {
    field: 'label',
    headerName: 'Label',
    flex: 1,
    minWidth: 120,
    align: 'left',
    headerAlign: 'left',
    renderCell: (params: GridRenderCellParams) => (
      <Box className={styles['import-reference-grid__cell--bold']}>
        {params.value}
      </Box>
    ),
  },
  {
    field: 'hex',
    headerName: 'Hex Code',
    width: 120,
    align: 'left',
    headerAlign: 'left',
    renderCell: (params: GridRenderCellParams) => (
      <Box className={styles['import-reference-grid__cell']}>
        {params.value}
      </Box>
    ),
  },
]

