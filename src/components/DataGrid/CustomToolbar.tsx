import { Box, Checkbox, FormControlLabel } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
} from '@mui/x-data-grid'
import { GridCheckbox } from '../../types/grid.types'

interface CustomToolbarProps {
  checkboxes: GridCheckbox[]
}

/**
 * Custom toolbar component for DataGrid
 * Displays column visibility, density selector, filter button, and custom checkboxes
 * Uses GridToolbarContainer to provide proper DataGrid context for toolbar buttons
 */
const CustomToolbar = ({ checkboxes }: CustomToolbarProps) => {
  const theme = useTheme()

  return (
    <GridToolbarContainer
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1,
        p: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Left side - DataGrid toolbar buttons */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
      </Box>

      {/* Right side - Custom checkboxes */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {checkboxes.map((checkbox, index) => (
          <Box
            key={index}
            sx={{
              background:
                theme.palette.mode === 'dark' ? '#424242' : '#f0f0f0',
              borderRadius: '4px',
              padding: '8px',
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={checkbox.checked}
                  onChange={checkbox.onCheckboxChange}
                  name={checkbox.label}
                />
              }
              label={checkbox.label}
            />
          </Box>
        ))}
      </Box>
    </GridToolbarContainer>
  )
}

export default CustomToolbar

