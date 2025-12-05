import type React from 'react'
import { useState } from 'react'

import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { type GridColDef } from '@mui/x-data-grid'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'

import styles from '../../styles/DataGrid.module.scss'
import { LogicOperator, type LogicOperatorType } from '../../utils/gridUtil'

// Operator definitions for different column types
const OPERATORS = {
  string: [
    {
      value: 'contains',
      label: 'contains',
    },
    {
      value: 'equals',
      label: '=',
    },
    {
      value: 'startsWith',
      label: 'starts with',
    },
    {
      value: 'endsWith',
      label: 'ends with',
    },
    {
      value: 'isEmpty',
      label: 'is empty',
    },
    {
      value: 'isNotEmpty',
      label: 'is not empty',
    },
    {
      value: 'isOneOf',
      label: 'is one of',
    },
    {
      value: 'isNotOneOf',
      label: 'is not one of',
    },
    {
      value: 'containsOneOf',
      label: 'contains one of',
    },
  ],
  number: [
    {
      value: '=',
      label: '=',
    },
    {
      value: '!=',
      label: '!=',
    },
    {
      value: '>',
      label: '>',
    },
    {
      value: '>=',
      label: '>=',
    },
    {
      value: '<',
      label: '<',
    },
    {
      value: '<=',
      label: '<=',
    },
    {
      value: 'isEmpty',
      label: 'is empty',
    },
    {
      value: 'isNotEmpty',
      label: 'is not empty',
    },
  ],
  date: [
    {
      value: 'is',
      label: 'is',
    },
    {
      value: 'isNot',
      label: 'is not',
    },
    {
      value: 'isAfter',
      label: 'is after',
    },
    {
      value: 'isOnOrAfter',
      label: 'is on or after',
    },
    {
      value: 'isBefore',
      label: 'is before',
    },
    {
      value: 'isOnOrBefore',
      label: 'is on or before',
    },
    {
      value: 'isEmpty',
      label: 'is empty',
    },
    {
      value: 'isNotEmpty',
      label: 'is not empty',
    },
  ],
  boolean: [
    {
      value: 'is',
      label: 'is',
    },
  ],
}

export interface FilterCondition {
  id: string
  column: string
  operator: string
  value: unknown
}

export interface FilterGroup {
  logicOperator: LogicOperatorType
  filters: FilterCondition[]
}

interface FilterPanelProps {
  open: boolean
  onClose: () => void
  columns: GridColDef[]
  onApplyFilters: (filterGroup: FilterGroup) => void
  initialFilterGroup?: FilterGroup
  visibleColumnFields?: string[]
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
  visibleColumnFields,
}) => {
  const [logicOperator, setLogicOperator] = useState<LogicOperatorType>(
    initialFilterGroup?.logicOperator ?? LogicOperator.AND,
  )
  const [filters, setFilters] = useState<FilterCondition[]>(
    initialFilterGroup != null && initialFilterGroup.filters.length > 0
      ? initialFilterGroup.filters
      : [
          {
            id: Date.now().toString(),
            column: '',
            operator: '',
            value: '',
          },
        ],
  )

  // Filter out specific columns that should not be filterable
  // Respect the 'filterable' property - if explicitly set to true, include it even for typically hidden columns
  const filterableColumns = columns.filter(col => {
    // If filterable is explicitly set to true, always include it
    if (col.filterable === true) {
      return !visibleColumnFields || visibleColumnFields.includes(col.field)
    }
    // If filterable is explicitly set to false, always exclude it
    if (col.filterable === false) {
      return false
    }
    // Default behavior: exclude common non-filterable columns
    return (
      col.field !== 'actions' &&
      col.field !== 'userActions' &&
      col.field !== 'isDeleted' &&
      col.field !== 'avatar' && // Avatar/Icon column should not be filterable
      (!visibleColumnFields || visibleColumnFields.includes(col.field))
    )
  })

  // Get column type for operator selection
  const getColumnType = (columnField: string): string => {
    const column = columns.find(col => col.field === columnField)
    if (!column) return 'string'

    // Prefer explicit column type when provided
    if (column.type === 'number') {
      return 'number'
    }
    if (column.type === 'boolean') {
      return 'boolean'
    }
    if (column.type === 'date' || column.type === 'dateTime') {
      return 'date'
    }

    // Determine type based on field name or column configuration
    if (
      columnField.includes('date') ||
      columnField === 'dob' ||
      columnField === 'createdAt' ||
      columnField === 'lastLoginAt'
    ) {
      return 'date'
    }
    if (
      columnField === 'userId' ||
      columnField.includes('Id') ||
      columnField.toLowerCase().includes('count') ||
      columnField.toLowerCase().includes('total')
    ) {
      return 'number'
    }
    if (columnField === 'emailConfirmed' || columnField === 'locked') {
      return 'boolean'
    }
    return 'string'
  }

  // Get operators for a specific column
  const getOperatorsForColumn = (columnField: string): Array<{ value: string; label: string }> => {
    const columnType = getColumnType(columnField)
    return OPERATORS[columnType as keyof typeof OPERATORS]
  }

  // Check if operator needs a value input
  const operatorNeedsValue = (operator: string): boolean => operator !== 'isEmpty' && operator !== 'isNotEmpty'

  // Add new filter condition
  const handleAddFilter = (): void => {
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
  const handleRemoveFilter = (id: string): void => {
    if (filters.length === 1) return // Keep at least one filter
    setFilters(filters.filter(f => f.id !== id))
  }

  // Update filter field
  const handleFilterChange = (id: string, field: keyof FilterCondition, value: unknown): void => {
    setFilters(
      filters.map(filter => {
        if (filter.id === id) {
          const updatedFilter: FilterCondition = {
            ...filter,
            [field]: value,
          }

          // Reset operator and value when column changes
          if (field === 'column') {
            updatedFilter.operator = ''
            updatedFilter.value = ''
          }

          // Reset value when operator changes to isEmpty/isNotEmpty
          if (field === 'operator' && !operatorNeedsValue(value as string)) {
            updatedFilter.value = ''
          }

          return updatedFilter
        }
        return filter
      }),
    )
  }

  // Apply filters
  const handleApply = (): void => {
    // Filter out incomplete filters
    const validFilters = filters.filter(
      f =>
        f.column !== '' &&
        f.operator !== '' &&
        (operatorNeedsValue(f.operator) ? f.value !== '' && f.value != null : true),
    )

    const filterGroup: FilterGroup = {
      logicOperator,
      filters: validFilters,
    }

    onApplyFilters(filterGroup)
    onClose()
  }

  // Reset filters
  const handleReset = (): void => {
    setFilters([
      {
        id: Date.now().toString(),
        column: '',
        operator: '',
        value: '',
      },
    ])
    setLogicOperator(LogicOperator.AND)
    onApplyFilters({
      logicOperator: LogicOperator.AND,
      filters: [],
    })
  }

  // Render value input based on column type
  const renderValueInput = (filter: FilterCondition, index: number): JSX.Element | null => {
    if (!operatorNeedsValue(filter.operator)) {
      return null
    }

    const columnType = getColumnType(filter.column)

    if (columnType === 'date') {
      return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Value"
            value={(filter.value as Date | null) ?? null}
            onChange={newValue => {
              handleFilterChange(filter.id, 'value', newValue)
            }}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
                variant: 'outlined',
                inputProps: {
                  'data-test-id': `users-filter-value-date-${index}`,
                },
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
          value={(filter.value as string | number) || ''}
          onChange={e => {
            handleFilterChange(filter.id, 'value', e.target.value)
          }}
          variant="outlined"
          inputProps={{
            'data-test-id': `users-filter-value-number-${index}`,
          }}
        />
      )
    }

    if (columnType === 'boolean') {
      return (
        <FormControl fullWidth size="small">
          <InputLabel>Value</InputLabel>
          <Select
            value={(filter.value as string) || ''}
            label="Value"
            onChange={e => {
              handleFilterChange(filter.id, 'value', e.target.value)
            }}
            data-test-id={`users-filter-value-boolean-${index}`}
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
        value={(filter.value as string) || ''}
        onChange={e => {
          handleFilterChange(filter.id, 'value', e.target.value)
        }}
        variant="outlined"
        placeholder={isSemicolonOperator ? 'Value1;Value2;Value3' : 'Filter value'}
        helperText={isSemicolonOperator ? 'Use semicolon (;) to separate multiple values' : undefined}
        inputProps={{
          'data-test-id': `users-filter-value-text-${index}`,
        }}
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
        'data-test-id': 'users-filter-modal',
      }}
    >
      {/* Dialog Header */}
      <DialogTitle className={styles['filter-panel__header']}>
        <Typography variant="h6" component="div" fontWeight="bold">
          Filter Data
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          className={styles['filter-panel__close-button']}
          data-test-id="users-filter-close-button"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* Dialog Content */}
      <DialogContent className={styles['filter-panel__content']}>
        <Box className={styles['filter-panel__content-box']}>
          {/* Global Logic Operator - Show only if there are multiple filters */}
          {filters.length > 1 && (
            <Box className={styles['filter-panel__logic-operator-box']}>
              <Typography variant="body2" fontWeight="medium" color="text.secondary">
                Match:
              </Typography>
              <ToggleButtonGroup
                value={logicOperator}
                exclusive
                onChange={(_, newValue) => {
                  if (newValue != null) {
                    setLogicOperator(newValue as LogicOperatorType)
                  }
                }}
                size="small"
                data-test-id="users-filter-logic-toggle"
              >
                <ToggleButton value={LogicOperator.AND} className={styles['filter-panel__toggle-button']}>
                  All (AND)
                </ToggleButton>
                <ToggleButton value={LogicOperator.OR} className={styles['filter-panel__toggle-button']}>
                  Any (OR)
                </ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="body2" color="text.secondary">
                of the following conditions:
              </Typography>
            </Box>
          )}

          {filters.map((filter, index) => (
            <Box key={filter.id} data-test-id={`users-filter-row-${index}`}>
              {/* Show text separator for 2nd filter onwards */}
              {index > 0 && (
                <Box className={styles['filter-panel__divider-box']}>
                  <Divider className={styles['filter-panel__divider']} />
                  <Chip
                    label={logicOperator}
                    size="small"
                    color="primary"
                    variant="outlined"
                    className={styles['filter-panel__chip']}
                  />
                  <Divider className={styles['filter-panel__divider']} />
                </Box>
              )}

              {/* Filter Row */}
              <Box className={styles['filter-panel__filter-row']}>
                {/* Column Selection */}
                <FormControl fullWidth size="small">
                  <InputLabel>Column</InputLabel>
                  <Select
                    value={filter.column}
                    label="Column"
                    onChange={e => {
                      handleFilterChange(filter.id, 'column', e.target.value)
                    }}
                    data-test-id={`users-filter-column-select-${index}`}
                  >
                    {filterableColumns.map(col => (
                      <MenuItem key={col.field} value={col.field}>
                        {col.headerName ?? col.field}
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
                    onChange={e => {
                      handleFilterChange(filter.id, 'operator', e.target.value)
                    }}
                    data-test-id={`users-filter-operator-select-${index}`}
                  >
                    {filter.column &&
                      getOperatorsForColumn(filter.column).map(op => (
                        <MenuItem key={op.value} value={op.value}>
                          {op.label}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                {/* Value Input */}
                <Box
                  className={styles['filter-panel__value-input']}
                  data-test-id={`users-filter-value-container-${index}`}
                >
                  {filter.operator && renderValueInput(filter, index)}
                </Box>

                {/* Delete Button */}
                <IconButton
                  onClick={() => {
                    handleRemoveFilter(filter.id)
                  }}
                  disabled={filters.length === 1}
                  color="error"
                  size="small"
                  className={styles['filter-panel__delete-button']}
                  data-test-id={`users-filter-delete-${index}`}
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
            className={styles['filter-panel__add-button']}
            data-test-id="users-filter-add-button"
          >
            Add Filter
          </Button>
        </Box>
      </DialogContent>

      <Divider />

      {/* Dialog Actions */}
      <DialogActions className={styles['filter-panel__actions']}>
        <Button
          onClick={handleReset}
          variant="outlined"
          color="secondary"
          className={styles['filter-panel__action-button']}
          data-test-id="users-filter-remove-all-button"
        >
          Remove All
        </Button>
        <Box className={styles['filter-panel__actions-spacer']} />
        <Button
          onClick={onClose}
          variant="outlined"
          className={styles['filter-panel__action-button']}
          data-test-id="users-filter-cancel-button"
        >
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          variant="contained"
          className={styles['filter-panel__action-button']}
          data-test-id="users-filter-apply-button"
        >
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default FilterPanel
