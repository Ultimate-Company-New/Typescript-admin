import { useRef, useState } from 'react'

import CheckIcon from '@mui/icons-material/Check'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import DensityMediumIcon from '@mui/icons-material/DensityMedium'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FilterListIcon from '@mui/icons-material/FilterList'
import ViewColumnIcon from '@mui/icons-material/ViewColumn'
import {
  Badge,
  Button,
  Checkbox,
  FormControlLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material'
import {
  GridToolbarContainer as Toolbar,
  type GridColDef,
  type GridColumnVisibilityModel,
  type GridRowModel,
} from '@mui/x-data-grid'

import styles from '../../styles/DataGrid.module.scss'
import { DENSITY_STORAGE_KEY, GridDensity, type GridDensityType } from '../../utils/gridUtil'

import FilterPanel, { type FilterGroup } from './FilterPanel'

const DENSITY_OPTIONS = [
  {
    label: 'Compact',
    value: GridDensity.COMPACT,
  },
  {
    label: 'Standard',
    value: GridDensity.STANDARD,
  },
  {
    label: 'Comfortable',
    value: GridDensity.COMFORTABLE,
  },
]

interface SimpleToolbarProps {
  density?: GridDensityType
  onDensityChange?: (density: GridDensityType) => void
  columns?: GridColDef[]
  onFiltersChange?: (filterGroup: FilterGroup) => void
  activeFilterGroup?: FilterGroup
  rows?: GridRowModel[]
  onExport?: () => void
  includeDeleted?: boolean
  onIncludeDeletedChange?: (includeDeleted: boolean) => void
  columnVisibilityModel?: GridColumnVisibilityModel
  onColumnVisibilityChange?: (model: GridColumnVisibilityModel) => void
  visibleColumnFields?: string[]
  hideIncludeDeleted?: boolean
  hideExport?: boolean
  hideFilter?: boolean
  hideColumns?: boolean
  onClearSelection?: () => void
  selectionCount?: number
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
  density = GridDensity.STANDARD,
  onDensityChange,
  columns = [],
  onFiltersChange,
  activeFilterGroup,
  rows = [],
  onExport,
  includeDeleted = false,
  onIncludeDeletedChange,
  columnVisibilityModel,
  onColumnVisibilityChange,
  visibleColumnFields: externalVisibleColumns,
  hideIncludeDeleted = false,
  hideExport = false,
  hideFilter = false,
  hideColumns = false,
  onClearSelection,
  selectionCount = 0,
}: SimpleToolbarProps): JSX.Element => {
  const [densityMenuOpen, setDensityMenuOpen] = useState(false)
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const densityMenuTriggerRef = useRef<HTMLButtonElement>(null)
  const [columnsMenuAnchorEl, setColumnsMenuAnchorEl] = useState<null | HTMLElement>(null)
  const visibleColumnFields =
    externalVisibleColumns != null && externalVisibleColumns.length > 0
      ? externalVisibleColumns
      : columns
          .filter(col => {
            if (columnVisibilityModel != null && col.field in columnVisibilityModel) {
              return columnVisibilityModel[col.field]
            }
            return true
          })
          .map(col => col.field)
  const columnsMenuOpen = Boolean(columnsMenuAnchorEl)
  const toggleableColumns = columns.filter(
    col => col.field !== 'userActions' && col.field !== 'isDeleted' && col.field !== 'userId' && col.field !== 'avatar',
  )

  const handleColumnVisibilityToggle = (field: string, checked: boolean): void => {
    if (onColumnVisibilityChange == null) return
    const nextModel = { ...(columnVisibilityModel ?? {}) }
    if (checked) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- Required for dynamic column visibility
      delete nextModel[field]
    } else {
      nextModel[field] = false
    }
    onColumnVisibilityChange(nextModel)
  }

  const activeFilterCount = activeFilterGroup?.filters.length ?? 0

  const handleDensityChange = (newDensity: GridDensityType): void => {
    if (onDensityChange) {
      onDensityChange(newDensity)
    }
    // Store in localStorage for persistence
    localStorage.setItem(DENSITY_STORAGE_KEY, newDensity)
    setDensityMenuOpen(false)
  }

  const handleApplyFilters = (filterGroup: FilterGroup): void => {
    if (onFiltersChange != null) {
      onFiltersChange(filterGroup)
    }
  }

  /**
   * Export current grid data to CSV
   * Uses the visible columns and current row data
   */
  const handleExport = (): void => {
    if (onExport != null) {
      // If custom export handler is provided, use it
      onExport()
      return
    }

    // Default export: export currently visible rows
    if (rows.length === 0) {
      return
    }

    // Get visible columns (exclude hidden ones)
    const visibleColumns = columns.filter(
      col =>
        col.field !== 'actions' && col.field !== 'userActions' && col.field !== 'isDeleted' && col.field !== 'userId',
    )

    // Create CSV header
    const headers = visibleColumns.map(col => col.headerName ?? col.field).join(',')

    // Create CSV rows
    const csvRows = rows.map(row =>
      visibleColumns
        .map(col => {
          const value: unknown = row[col.field]

          // Handle special formatting - skip valueGetter for CSV export as it requires GridApiCommunity
          // Use the raw value from the row instead

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
        .join(','),
    )

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
      <Toolbar
        className={styles['simple-toolbar']}
        sx={{
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {/* Clear Selection Button */}
          {onClearSelection && selectionCount > 0 && (
            <Tooltip title={`Clear ${selectionCount} selected item${selectionCount > 1 ? 's' : ''}`}>
              <Badge badgeContent={selectionCount} color="secondary">
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<ClearAllIcon />}
                  onClick={onClearSelection}
                  className={styles['simple-toolbar__button']}
                  data-test-id="users-toolbar-clear-selection-button"
                >
                  Clear Selection
                </Button>
              </Badge>
            </Tooltip>
          )}

          {/* Filter Button */}
          {!hideFilter && (
            <Tooltip title="Filter data">
              <Badge badgeContent={activeFilterCount} color="primary">
                <Button
                  size="small"
                  variant={activeFilterCount > 0 ? 'contained' : 'outlined'}
                  startIcon={<FilterListIcon />}
                  onClick={() => {
                    setFilterPanelOpen(true)
                  }}
                  className={styles['simple-toolbar__button']}
                  data-test-id="users-toolbar-filter-button"
                >
                  Filter
                </Button>
              </Badge>
            </Tooltip>
          )}

          {/* Columns Visibility Menu */}
          {!hideColumns && toggleableColumns.length > 0 && (
            <Tooltip title="Show or hide columns">
              <Button
                size="small"
                variant="outlined"
                startIcon={<ViewColumnIcon />}
                className="simple-toolbar__button"
                data-test-id="users-toolbar-columns-button"
                onClick={event => {
                  setColumnsMenuAnchorEl(event.currentTarget)
                }}
                aria-haspopup="true"
                aria-expanded={columnsMenuOpen ? 'true' : undefined}
              >
                Columns
              </Button>
            </Tooltip>
          )}
          <Menu
            anchorEl={columnsMenuAnchorEl}
            open={columnsMenuOpen}
            onClose={() => {
              setColumnsMenuAnchorEl(null)
            }}
            data-test-id="users-columns-menu"
          >
            {toggleableColumns.map(col => {
              const isVisible =
                columnVisibilityModel != null && col.field in columnVisibilityModel
                  ? Boolean(columnVisibilityModel[col.field])
                  : true
              return (
                <MenuItem key={col.field} data-test-id={`users-columns-menu-item-${col.field}`}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={isVisible}
                        onChange={e => {
                          handleColumnVisibilityToggle(col.field, e.target.checked)
                        }}
                        inputProps={
                          {
                            'data-testid': `users-columns-menu-checkbox-${col.field}`,
                          } as React.InputHTMLAttributes<HTMLInputElement>
                        }
                      />
                    }
                    label={col.headerName ?? col.field}
                  />
                </MenuItem>
              )
            })}
          </Menu>

          {/* Density Menu Button */}
          <Tooltip title="Adjust row density">
            <Button
              ref={densityMenuTriggerRef}
              size="small"
              variant="outlined"
              startIcon={<DensityMediumIcon />}
              onClick={() => {
                setDensityMenuOpen(true)
              }}
              aria-controls="density-menu"
              aria-haspopup="true"
              aria-expanded={densityMenuOpen ? 'true' : undefined}
              className="simple-toolbar__button"
              data-test-id="users-toolbar-density-button"
            >
              Density
            </Button>
          </Tooltip>

          {/* Density Menu */}
          <Menu
            id="density-menu"
            anchorEl={densityMenuTriggerRef.current}
            open={densityMenuOpen}
            onClose={() => {
              setDensityMenuOpen(false)
            }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            MenuListProps={{
              'aria-labelledby': 'density-menu-trigger',
            }}
          >
            {DENSITY_OPTIONS.map(option => (
              <MenuItem
                key={option.value}
                onClick={() => {
                  handleDensityChange(option.value as GridDensityType)
                }}
                data-test-id={`users-density-option-${option.value}`}
              >
                <ListItemIcon>{density === option.value ? <CheckIcon fontSize="small" /> : null}</ListItemIcon>
                <ListItemText>{option.label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>

          {/* Export Button */}
          {!hideExport && (
            <Tooltip title="Export to CSV">
              <Button
                size="small"
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExport}
                className="simple-toolbar__button"
                data-test-id="users-toolbar-export-button"
              >
                Export
              </Button>
            </Tooltip>
          )}
        </div>

        {/* Include Deleted Checkbox */}
        {onIncludeDeletedChange && !hideIncludeDeleted && (
          <FormControlLabel
            control={
              <Checkbox
                checked={includeDeleted}
                onChange={e => {
                  onIncludeDeletedChange(e.target.checked)
                }}
                size="small"
                inputProps={
                  {
                    'data-testid': 'users-toolbar-include-deleted-checkbox',
                  } as React.InputHTMLAttributes<HTMLInputElement>
                }
              />
            }
            label="Include Deleted"
            className={styles['simple-toolbar__checkbox-label']}
            sx={{ whiteSpace: 'nowrap' }}
          />
        )}
      </Toolbar>

      {/* Filter Panel Modal */}
      {!hideFilter && (
        <FilterPanel
          open={filterPanelOpen}
          onClose={() => {
            setFilterPanelOpen(false)
          }}
          columns={columns}
          onApplyFilters={handleApplyFilters}
          initialFilterGroup={activeFilterGroup}
          visibleColumnFields={visibleColumnFields}
        />
      )}
    </>
  )
}

export default SimpleToolbar
