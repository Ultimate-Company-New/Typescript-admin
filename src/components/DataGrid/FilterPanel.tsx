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

// Operator definitions for different column types
const OPERATORS = {
  string: [
    { value: 'contains', label: 'contains' },
    { value: 'equals', label: '=' },
    { value: 'startsWith', label: 'starts with' },
    { value: 'endsWith', label: 'ends with' },
    { value: 'isEmpty', label: 'is empty' },
    { value: 'isNotEmpty', label: 'is not empty' },
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

  // Filter out non-filterable columns and actions column
  const filterableColumns = columns.filter(
    (col) =>
      col.filterable !== false &&
      col.field !== 'actions' &&
      col.field !== 'isDeleted' &&
      col.field !== 'userId'
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
    return (
      <TextField
        label="Value"
        size="small"
        fullWidth
        value={filter.value}
        onChange={(e) => handleFilterChange(filter.id, 'value', e.target.value)}
        variant="outlined"
        placeholder="Filter value"
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
        sx: {
          borderRadius: 2,
          boxShadow: 24,
        },
      }}
    >
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
        }}
      >
        <Typography variant="h6" component="div" fontWeight="bold">
          Filter Data
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'grey.500',
            '&:hover': { color: 'grey.700' },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* Dialog Content */}
      <DialogContent sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Global Logic Operator - Show only if there are multiple filters */}
          {filters.length > 1 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 1,
                p: 2,
                bgcolor: 'primary.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'primary.200',
              }}
            >
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
                sx={{
                  '& .MuiToggleButton-root': {
                    px: 3,
                    textTransform: 'none',
                    fontWeight: 'medium',
                  },
                }}
              >
                <ToggleButton value="AND">All (AND)</ToggleButton>
                <ToggleButton value="OR">Any (OR)</ToggleButton>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Divider sx={{ flex: 1 }} />
                  <Chip
                    label={logicOperator}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}
                  />
                  <Divider sx={{ flex: 1 }} />
                </Box>
              )}

              {/* Filter Row */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr auto',
                  gap: 2,
                  alignItems: 'start',
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200',
                }}
              >
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
                <Box sx={{ minWidth: 0 }}>
                  {filter.operator && renderValueInput(filter)}
                </Box>

                {/* Delete Button */}
                <IconButton
                  onClick={() => handleRemoveFilter(filter.id)}
                  disabled={filters.length === 1}
                  color="error"
                  size="small"
                  sx={{
                    mt: 0.5,
                    '&:disabled': {
                      color: 'grey.300',
                    },
                  }}
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
            sx={{
              textTransform: 'none',
              alignSelf: 'flex-start',
              mt: 1,
            }}
          >
            Add Filter
          </Button>
        </Box>
      </DialogContent>

      <Divider />

      {/* Dialog Actions */}
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={handleReset}
          variant="outlined"
          color="secondary"
          sx={{ textTransform: 'none' }}
        >
          Remove All
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          variant="contained"
          sx={{ textTransform: 'none' }}
        >
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default FilterPanel

