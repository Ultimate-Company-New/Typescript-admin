import React from 'react'

import { Box } from '@mui/material'
import { DataGrid, type DataGridProps, type GridColumnGroupingModel, type GridValidRowModel } from '@mui/x-data-grid'

import styles from '../../styles/DataGrid.module.scss'
import { type PaginatedGridInterface } from '../../types/grid.types'

/**
 * Interface for grouped/parent column headers (simplified)
 */
export interface ColumnGroup {
  /**
   * Group identifier (must be unique)
   */
  groupId: string
  /**
   * Display name for the group header
   */
  headerName: string
  /**
   * Array of field names that belong to this group
   */
  children: string[]
  /**
   * Optional description shown as tooltip
   */
  description?: string
}

/**
 * Extended props for StyledDataGrid with pagination and column grouping
 */
export interface StyledDataGridProps extends Omit<DataGridProps<GridValidRowModel>, 'columnGroupingModel'> {
  /**
   * Total count of items for pagination (used for server-side pagination)
   */
  totalCount?: number
  /**
   * Pagination model from PaginatedGridInterface (for backward compatibility)
   */
  paginationModelState?: PaginatedGridInterface
  /**
   * State setter for pagination model (for backward compatibility)
   */
  setPaginationModel?: React.Dispatch<React.SetStateAction<PaginatedGridInterface>>
  /**
   * Optional data-test-id applied to the grid container wrapper
   */
  dataTestId?: string
  /**
   * Optional data-test-id applied to the pagination component
   */
  paginationTestId?: string
  /**
   * Optional column groups for parent headers (simplified format)
   */
  columnGroupingModel?: ColumnGroup[]
}

/**
 * Default page size options for DataGrid
 */
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

/**
 * Styled DataGrid component with integrated MUI pagination footer and column grouping support
 * Uses MUI's built-in pagination instead of custom component
 * Supports optional parent/grouped column headers
 */
export const StyledDataGrid = React.forwardRef<HTMLDivElement, StyledDataGridProps>(
  (
    {
      totalCount = 0,
      paginationModelState,
      setPaginationModel,
      pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
      paginationMode = 'server',
      filterMode = 'server',
      sortingMode = 'server',
      dataTestId,
      columnGroupingModel,
      ...dataGridProps
    },
    ref,
  ) => {
    // Handle pagination model change from MUI DataGrid
    const handlePaginationModelChange = React.useCallback(
      (model: { page: number; pageSize: number }) => {
        if (setPaginationModel && paginationModelState) {
          setPaginationModel(prev => ({
            ...prev,
            pageSize: model.pageSize,
            start: model.page * model.pageSize,
            end: (model.page + 1) * model.pageSize,
          }))
        }
      },
      [setPaginationModel, paginationModelState],
    )

    // Convert PaginatedGridInterface to MUI pagination model
    const muiPaginationModel = React.useMemo(() => {
      if (!paginationModelState) return undefined
      return {
        page: Math.floor(paginationModelState.start / paginationModelState.pageSize),
        pageSize: paginationModelState.pageSize,
      }
    }, [paginationModelState])

    const { slotProps, paginationModel, slots, ...restDataGridProps } = dataGridProps

    // Build merged slot props with data-test-id if provided
    const mergedSlotProps = React.useMemo(() => {
      if (dataTestId != null && slotProps !== undefined) {
        return {
          ...slotProps,
          root: {
            ...slotProps.root,
            'data-test-id': dataTestId,
          },
        }
      }
      if (dataTestId != null) {
        return {
          root: {
            'data-test-id': dataTestId,
          },
        }
      }
      return slotProps
    }, [dataTestId, slotProps])

    // Convert column grouping model to MUI's columnGroupingModel format
    const muiColumnGroupingModel: GridColumnGroupingModel | undefined = React.useMemo(() => {
      if (!columnGroupingModel || columnGroupingModel.length === 0) return undefined

      return columnGroupingModel.map(group => ({
        groupId: group.groupId,
        headerName: group.headerName,
        description: group.description,
        children: group.children.map(field => ({ field })),
      }))
    }, [columnGroupingModel])

    // Only pass rowCount for server-side pagination
    // For client-side, MUI calculates it from rows array
    const rowCountProps = paginationMode === 'server' ? { rowCount: totalCount } : {}

    // Only pass columnGroupingModel if it exists
    const columnGroupingProps = muiColumnGroupingModel ? { columnGroupingModel: muiColumnGroupingModel } : {}

    return (
      <Box ref={ref}>
        <DataGrid
          {...restDataGridProps}
          className={styles['data-grid']}
          slots={slots}
          slotProps={mergedSlotProps}
          pageSizeOptions={pageSizeOptions}
          paginationMode={paginationMode}
          filterMode={filterMode}
          sortingMode={sortingMode}
          {...rowCountProps}
          {...columnGroupingProps}
          paginationModel={muiPaginationModel ?? paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
        />
      </Box>
    )
  },
)

StyledDataGrid.displayName = 'StyledDataGrid'
