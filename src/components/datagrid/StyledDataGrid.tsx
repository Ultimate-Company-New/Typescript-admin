import React from 'react'

import { Box } from '@mui/material'
import { DataGrid, type DataGridProps, type GridValidRowModel } from '@mui/x-data-grid'

import { type PaginatedGridInterface } from '../../types/grid.types'

import styles from '../../styles/DataGrid.module.scss'

/**
 * Extended props for StyledDataGrid with pagination
 */
export interface StyledDataGridProps extends DataGridProps<GridValidRowModel> {
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
}

/**
 * Default page size options for DataGrid
 */
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

/**
 * Styled DataGrid component with integrated MUI pagination footer
 * Uses MUI's built-in pagination instead of custom component
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

    const { slotProps, paginationModel, ...restDataGridProps } = dataGridProps

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

    return (
      <Box ref={ref}>
        <DataGrid
          {...restDataGridProps}
          className={styles['data-grid']}
          slotProps={mergedSlotProps}
          pageSizeOptions={pageSizeOptions}
          paginationMode={paginationMode}
          filterMode={filterMode}
          sortingMode={sortingMode}
          rowCount={totalCount}
          paginationModel={muiPaginationModel ?? paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
        />
      </Box>
    )
  },
)

StyledDataGrid.displayName = 'StyledDataGrid'
