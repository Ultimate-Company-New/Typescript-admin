import { Box } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import styles from '../../styles/PickupLocations.module.scss'

// ============================================================================
// Address Type Grid Types & Columns
// ============================================================================

/**
 * Address Type data structure for the reference grid
 */
export interface AddressTypeData {
  id: number
  value: string
}

/**
 * Get address type grid columns for the import reference grid
 */
export const getAddressTypeGridColumns = (): GridColDef[] => [
  {
    field: 'value',
    headerName: 'Address Type',
    flex: 1,
    minWidth: 150,
    filterable: true,
    sortable: true,
    renderCell: (params: GridRenderCellParams) => (
      <Box className={styles['import-reference-grid__cell--bold']}>
        {params.value}
      </Box>
    ),
  },
]
