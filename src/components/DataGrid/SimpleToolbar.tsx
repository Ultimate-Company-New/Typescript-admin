import { useState, useRef } from 'react'
import {
  Toolbar,
  ToolbarButton,
  ColumnsPanelTrigger,
  GridColDef,
  GridRowModel,
} from '@mui/x-data-grid'
import { 
  Button, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Tooltip,
  Badge,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import ViewColumnIcon from '@mui/icons-material/ViewColumn'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import DensityMediumIcon from '@mui/icons-material/DensityMedium'
import FilterListIcon from '@mui/icons-material/FilterList'
import CheckIcon from '@mui/icons-material/Check'
import FilterPanel, { FilterGroup } from './FilterPanel'
import '../../styles/DataGridStyles.scss'

const DENSITY_OPTIONS = [
  { label: 'Compact', value: 'compact' },
  { label: 'Standard', value: 'standard' },
  { label: 'Comfortable', value: 'comfortable' },
]

const DENSITY_STORAGE_KEY = 'mui-data-grid-density'

interface SimpleToolbarProps {
  density?: 'compact' | 'standard' | 'comfortable'
  onDensityChange?: (density: 'compact' | 'standard' | 'comfortable') => void
  columns?: GridColDef[]
  onFiltersChange?: (filterGroup: FilterGroup) => void
  activeFilterGroup?: FilterGroup
  rows?: GridRowModel[]
  onExport?: () => void
  includeDeleted?: boolean
  onIncludeDeletedChange?: (includeDeleted: boolean) => void
}

/**
 * Custom toolbar for DataGrid using MUI X v8 Toolbar API
 * Displays:
 * - Filter button (custom multi-column filtering)
 * - Columns button (hide/show columns)
 * - Density button (adjust row spacing)
 * - Export button (download data as CSV)
 */
const SimpleToolbar = ({ 
  density = 'standard', 
  onDensityChange,
  columns = [],
  onFiltersChange,
  activeFilterGroup,
  rows = [],
  onExport,
  includeDeleted = false,
  onIncludeDeletedChange,
}: SimpleToolbarProps) => {
  const [densityMenuOpen, setDensityMenuOpen] = useState(false)
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const densityMenuTriggerRef = useRef<HTMLButtonElement>(null)
  
  const activeFilterCount = activeFilterGroup?.filters?.length || 0

  const handleDensityChange = (newDensity: 'compact' | 'standard' | 'comfortable') => {
    if (onDensityChange) {
      onDensityChange(newDensity)
    }
    // Store in localStorage for persistence
    localStorage.setItem(DENSITY_STORAGE_KEY, newDensity)
    setDensityMenuOpen(false)
  }

  const handleApplyFilters = (filterGroup: FilterGroup) => {
    if (onFiltersChange) {
      onFiltersChange(filterGroup)
    }
  }

  /**
   * Export current grid data to CSV
   * Uses the visible columns and current row data
   */
  const handleExport = () => {
    if (onExport) {
      // If custom export handler is provided, use it
      onExport()
      return
    }

    // Default export: export currently visible rows
    if (rows.length === 0) {
      console.warn('No data to export')
      return
    }

    // Get visible columns (exclude hidden ones)
    const visibleColumns = columns.filter(
      (col) => col.field !== 'actions' && col.field !== 'isDeleted' && col.field !== 'userId'
    )

    // Create CSV header
    const headers = visibleColumns.map((col) => col.headerName || col.field).join(',')

    // Create CSV rows
    const csvRows = rows.map((row) => {
      return visibleColumns
        .map((col) => {
          let value = row[col.field]
          
          // Handle special formatting
          if (col.valueGetter) {
            value = col.valueGetter(value, row)
          }
          
          // Escape commas and quotes in values
          if (value === null || value === undefined) {
            return ''
          }
          
          const stringValue = String(value)
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          
          return stringValue
        })
        .join(',')
    })

    // Combine header and rows
    const csv = [headers, ...csvRows].join('\n')

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Toolbar className="simple-toolbar" sx={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Filter Button */}
          <Tooltip title="Filter data">
            <Badge badgeContent={activeFilterCount} color="primary">
              <Button
                size="small"
                variant={activeFilterCount > 0 ? 'contained' : 'outlined'}
                startIcon={<FilterListIcon />}
                onClick={() => setFilterPanelOpen(true)}
                className="simple-toolbar__button"
              >
                Filter
              </Button>
            </Badge>
          </Tooltip>

        {/* Columns Panel Trigger */}
        <ColumnsPanelTrigger
          render={
            <ToolbarButton
              render={
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ViewColumnIcon />}
                  className="simple-toolbar__button"
                >
                  Columns
                </Button>
              }
            />
          }
        />

        {/* Density Menu Button */}
        <Tooltip title="Adjust row density">
          <Button
            ref={densityMenuTriggerRef}
            size="small"
            variant="outlined"
            startIcon={<DensityMediumIcon />}
            onClick={() => setDensityMenuOpen(true)}
            aria-controls="density-menu"
            aria-haspopup="true"
            aria-expanded={densityMenuOpen ? 'true' : undefined}
            className="simple-toolbar__button"
          >
            Density
          </Button>
        </Tooltip>

        {/* Density Menu */}
        <Menu
          id="density-menu"
          anchorEl={densityMenuTriggerRef.current}
          open={densityMenuOpen}
          onClose={() => setDensityMenuOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          MenuListProps={{
            'aria-labelledby': 'density-menu-trigger',
          }}
        >
          {DENSITY_OPTIONS.map((option) => (
            <MenuItem
              key={option.value}
              onClick={() => handleDensityChange(option.value as 'compact' | 'standard' | 'comfortable')}
            >
              <ListItemIcon>
                {density === option.value && <CheckIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText>{option.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>

          {/* Export Button */}
          <Tooltip title="Export to CSV">
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExport}
              className="simple-toolbar__button"
            >
              Export
            </Button>
          </Tooltip>
        </div>

        {/* Include Deleted Checkbox */}
        {onIncludeDeletedChange && (
          <FormControlLabel
            control={
              <Checkbox
                checked={includeDeleted}
                onChange={(e) => onIncludeDeletedChange(e.target.checked)}
                size="small"
              />
            }
            label="Include Deleted"
            className="simple-toolbar__checkbox-label"
            sx={{ whiteSpace: 'nowrap' }}
          />
        )}
      </Toolbar>

      {/* Filter Panel Modal */}
      <FilterPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        columns={columns}
        onApplyFilters={handleApplyFilters}
        initialFilterGroup={activeFilterGroup}
      />
    </>
  )
}

export default SimpleToolbar

