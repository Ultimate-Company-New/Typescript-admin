import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { GridColDef } from '@mui/x-data-grid'
import '../../styles/DataGridStyles.scss'

// Operator definitions for different column types
const OPERATORS = {
  string: [
    { value: 'contains', label: 'contains' },
    { value: 'equals', label: '=' },
    { value: 'startsWith', label: 'starts with' },
    { value: 'endsWith', label: 'ends with' },
    { value: 'isEmpty', label: 'is empty' },
    { value: 'isNotEmpty', label: 'is not empty' },
    { value: 'isOneOf', label: 'is one of' },
    { value: 'isNotOneOf', label: 'is not one of' },
    { value: 'containsOneOf', label: 'contains one of' },
  ],
  number: [
    { value: '=', label: '=' },
    { value: '!=', label: '!=' },
    { value: '>', label: '>' },
    { value: '>=', label: '>=' },
    { value: '<', label: '<' },
    { value: '<=', label: '<=' },
    { value: 'isEmpty', label: 'is empty' },
    { value: 'isNotEmpty', label: 'is not empty' },
  ],
  date: [
    { value: 'is', label: 'is' },
    { value: 'isNot', label: 'is not' },
    { value: 'isAfter', label: 'is after' },
    { value: 'isOnOrAfter', label: 'is on or after' },
    { value: 'isBefore', label: 'is before' },
    { value: 'isOnOrBefore', label: 'is on or before' },
    { value: 'isEmpty', label: 'is empty' },
    { value: 'isNotEmpty', label: 'is not empty' },
  ],
  boolean: [
    { value: 'is', label: 'is' },
  ],
}

export interface FilterCondition {
  id: string
  column: string
  operator: string
  value: any
}

export interface FilterGroup {
  logicOperator: 'AND' | 'OR'
  filters: FilterCondition[]
}

interface FilterPanelProps {
  open: boolean
  onClose: () => void
  columns: GridColDef[]
  onApplyFilters: (filterGroup: FilterGroup) => void
  initialFilterGroup?: FilterGroup
}

/**
 * Custom Filter Panel Component
 * 
 * Features:
 * - Multi-column filtering with AND/OR logic
 * - Dynamic operators based on column type
 * - Date pickers for date columns
 * - Number inputs for numeric columns
 * - Text inputs for string columns
 * - Only shows visible, filterable columns
 * - Excludes actions column
 */
const FilterPanel: React.FC<FilterPanelProps> = ({
  open,
  onClose,
  columns,
  onApplyFilters,
  initialFilterGroup,
}) => {
  const [logicOperator, setLogicOperator] = useState<'AND' | 'OR'>(
    initialFilterGroup?.logicOperator || 'AND'
  )
  const [filters, setFilters] = useState<FilterCondition[]>(
    initialFilterGroup && initialFilterGroup.filters.length > 0
      ? initialFilterGroup.filters
      : [
          {
            id: Date.now().toString(),
            column: '',
            operator: '',
            value: '',
          },
        ]
  )

  // Filter out specific columns that should not be filterable
  // Check both the 'filterable' property and specific field names
  const filterableColumns = columns.filter(
    (col) =>
      col.filterable !== false && // Respect the filterable property
      col.field !== 'actions' &&
      col.field !== 'isDeleted' &&
      col.field !== 'userId' &&
      col.field !== 'avatar' // Avatar/Icon column should not be filterable
  )

  // Get column type for operator selection
  const getColumnType = (columnField: string): string => {
    const column = columns.find((col) => col.field === columnField)
    if (!column) return 'string'

    // Determine type based on field name or column configuration
    if (columnField.includes('date') || columnField === 'dob' || columnField === 'createdAt' || columnField === 'lastLoginAt') {
      return 'date'
    }
    if (columnField === 'userId' || columnField.includes('Id')) {
      return 'number'
    }
    if (columnField === 'emailConfirmed' || columnField === 'locked') {
      return 'boolean'
    }
    return 'string'
  }

  // Get operators for a specific column
  const getOperatorsForColumn = (columnField: string) => {
    const columnType = getColumnType(columnField)
    return OPERATORS[columnType as keyof typeof OPERATORS] || OPERATORS.string
  }

  // Check if operator needs a value input
  const operatorNeedsValue = (operator: string) => {
    return operator !== 'isEmpty' && operator !== 'isNotEmpty'
  }

  // Add new filter condition
  const handleAddFilter = () => {
    setFilters([
      ...filters,
      {
        id: Date.now().toString(),
        column: '',
        operator: '',
        value: '',
      },
    ])
  }

  // Remove filter condition
  const handleRemoveFilter = (id: string) => {
    if (filters.length === 1) return // Keep at least one filter
    setFilters(filters.filter((f) => f.id !== id))
  }

  // Update filter field
  const handleFilterChange = (
    id: string,
    field: keyof FilterCondition,
    value: any
  ) => {
    setFilters(
      filters.map((filter) => {
        if (filter.id === id) {
          const updatedFilter = { ...filter, [field]: value }
          
          // Reset operator and value when column changes
          if (field === 'column') {
            updatedFilter.operator = ''
            updatedFilter.value = ''
          }
          
          // Reset value when operator changes to isEmpty/isNotEmpty
          if (field === 'operator' && !operatorNeedsValue(value)) {
            updatedFilter.value = ''
          }
          
          return updatedFilter
        }
        return filter
      })
    )
  }

  // Apply filters
  const handleApply = () => {
    // Filter out incomplete filters
    const validFilters = filters.filter(
      (f) =>
        f.column &&
        f.operator &&
        (operatorNeedsValue(f.operator) ? f.value !== '' && f.value !== null : true)
    )
    
    const filterGroup: FilterGroup = {
      logicOperator,
      filters: validFilters,
    }
    
    // Log the JSON structure for API integration
    console.log('Filter JSON for API:', JSON.stringify(filterGroup, null, 2))
    
    onApplyFilters(filterGroup)
    onClose()
  }

  // Reset filters
  const handleReset = () => {
    setFilters([
      {
        id: Date.now().toString(),
        column: '',
        operator: '',
        value: '',
      },
    ])
    setLogicOperator('AND')
    onApplyFilters({ logicOperator: 'AND', filters: [] })
  }

  // Render value input based on column type
  const renderValueInput = (filter: FilterCondition) => {
    if (!operatorNeedsValue(filter.operator)) {
      return null
    }

    const columnType = getColumnType(filter.column)

    if (columnType === 'date') {
      return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Value"
            value={filter.value || null}
            onChange={(newValue) =>
              handleFilterChange(filter.id, 'value', newValue)
            }
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
                variant: 'outlined',
              },
            }}
          />
        </LocalizationProvider>
      )
    }

    if (columnType === 'number') {
      return (
        <TextField
          label="Value"
          type="number"
          size="small"
          fullWidth
          value={filter.value}
          onChange={(e) =>
            handleFilterChange(filter.id, 'value', e.target.value)
          }
          variant="outlined"
        />
      )
    }

    if (columnType === 'boolean') {
      return (
        <FormControl fullWidth size="small">
          <InputLabel>Value</InputLabel>
          <Select
            value={filter.value}
            label="Value"
            onChange={(e) =>
              handleFilterChange(filter.id, 'value', e.target.value)
            }
          >
            <MenuItem value="true">True</MenuItem>
            <MenuItem value="false">False</MenuItem>
          </Select>
        </FormControl>
      )
    }

    // Default: string input
    const isSemicolonOperator = ['isOneOf', 'isNotOneOf', 'containsOneOf'].includes(filter.operator)
    
    return (
      <TextField
        label="Value"
        size="small"
        fullWidth
        value={filter.value}
        onChange={(e) => handleFilterChange(filter.id, 'value', e.target.value)}
        variant="outlined"
        placeholder={isSemicolonOperator ? "Value1;Value2;Value3" : "Filter value"}
        helperText={isSemicolonOperator ? "Use semicolon (;) to separate multiple values" : undefined}
      />
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: 'filter-panel__dialog-paper',
      }}
    >
      {/* Dialog Header */}
      <DialogTitle className="filter-panel__header">
        <Typography variant="h6" component="div" fontWeight="bold">
          Filter Data
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          className="filter-panel__close-button"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* Dialog Content */}
      <DialogContent className="filter-panel__content">
        <Box className="filter-panel__content-box">
          {/* Global Logic Operator - Show only if there are multiple filters */}
          {filters.length > 1 && (
            <Box className="filter-panel__logic-operator-box">
              <Typography variant="body2" fontWeight="medium" color="text.secondary">
                Match:
              </Typography>
              <ToggleButtonGroup
                value={logicOperator}
                exclusive
                onChange={(_, newValue) => {
                  if (newValue !== null) {
                    setLogicOperator(newValue)
                  }
                }}
                size="small"
              >
                <ToggleButton value="AND" className="filter-panel__toggle-button">All (AND)</ToggleButton>
                <ToggleButton value="OR" className="filter-panel__toggle-button">Any (OR)</ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="body2" color="text.secondary">
                of the following conditions:
              </Typography>
            </Box>
          )}

          {filters.map((filter, index) => (
            <Box key={filter.id}>
              {/* Show text separator for 2nd filter onwards */}
              {index > 0 && (
                <Box className="filter-panel__divider-box">
                  <Divider className="filter-panel__divider" />
                  <Chip
                    label={logicOperator}
                    size="small"
                    color="primary"
                    variant="outlined"
                    className="filter-panel__chip"
                  />
                  <Divider className="filter-panel__divider" />
                </Box>
              )}

              {/* Filter Row */}
              <Box className="filter-panel__filter-row">
                {/* Column Selection */}
                <FormControl fullWidth size="small">
                  <InputLabel>Column</InputLabel>
                  <Select
                    value={filter.column}
                    label="Column"
                    onChange={(e) =>
                      handleFilterChange(filter.id, 'column', e.target.value)
                    }
                  >
                    {filterableColumns.map((col) => (
                      <MenuItem key={col.field} value={col.field}>
                        {col.headerName || col.field}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Operator Selection */}
                <FormControl fullWidth size="small" disabled={!filter.column}>
                  <InputLabel>Operator</InputLabel>
                  <Select
                    value={filter.operator}
                    label="Operator"
                    onChange={(e) =>
                      handleFilterChange(filter.id, 'operator', e.target.value)
                    }
                  >
                    {filter.column &&
                      getOperatorsForColumn(filter.column).map((op) => (
                        <MenuItem key={op.value} value={op.value}>
                          {op.label}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                {/* Value Input */}
                <Box className="filter-panel__value-input">
                  {filter.operator && renderValueInput(filter)}
                </Box>

                {/* Delete Button */}
                <IconButton
                  onClick={() => handleRemoveFilter(filter.id)}
                  disabled={filters.length === 1}
                  color="error"
                  size="small"
                  className="filter-panel__delete-button"
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Box>
            </Box>
          ))}

          {/* Add Filter Button */}
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddFilter}
            variant="outlined"
            className="filter-panel__add-button"
          >
            Add Filter
          </Button>
        </Box>
      </DialogContent>

      <Divider />

      {/* Dialog Actions */}
      <DialogActions className="filter-panel__actions">
        <Button
          onClick={handleReset}
          variant="outlined"
          color="secondary"
          className="filter-panel__action-button"
        >
          Remove All
        </Button>
        <Box className="filter-panel__actions-spacer" />
        <Button
          onClick={onClose}
          variant="outlined"
          className="filter-panel__action-button"
        >
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          variant="contained"
          className="filter-panel__action-button"
        >
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default FilterPanel

