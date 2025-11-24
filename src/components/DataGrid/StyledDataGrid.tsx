import React from 'react'

import { styled, alpha, Box } from '@mui/material'
import { DataGrid, gridClasses, type DataGridProps, type GridValidRowModel } from '@mui/x-data-grid'

import { type PaginatedGridInterface } from '../../types/grid.types'

import { handleCustomPaginationChange } from './gridHelpers'
import { PaginationComponent } from './PaginationComponent'
import styles from './DataGrid.module.scss'

const ODD_OPACITY = 0.2

/**
 * Styled Material UI DataGrid with custom theming
 * Features:
 * - Alternating row colors (odd/even)
 * - Custom hover effects
 * - Styled headers with green theme
 * - Border styling
 * - Custom pagination
 *
 * Note: This component still uses MUI's styled() API for dynamic theming.
 * Static styles have been moved to DataGridStyles.scss
 */
const MyDataGrid = styled(DataGrid)(({ theme }) => ({
  [`& .${gridClasses.row}.odd`]: {
    '&:hover': {
      backgroundColor: alpha(theme.palette.secondary.main, ODD_OPACITY),
      '@media (hover: none)': {
        backgroundColor: 'transparent',
      },
    },
    '&.Mui-selected': {
      backgroundColor: alpha(theme.palette.primary.main, ODD_OPACITY + theme.palette.action.selectedOpacity),
      '&:hover': {
        backgroundColor: alpha(
          theme.palette.secondary.main,
          ODD_OPACITY + theme.palette.action.selectedOpacity + theme.palette.action.hoverOpacity,
        ),
        '@media (hover: none)': {
          backgroundColor: alpha(theme.palette.primary.main, ODD_OPACITY + theme.palette.action.selectedOpacity),
        },
      },
    },
  },
  [`& .${gridClasses.row}.even`]: {
    backgroundColor: theme.palette.grey[200],
    '&:hover': {
      backgroundColor: alpha(theme.palette.secondary.main, ODD_OPACITY),
      '@media (hover: none)': {
        backgroundColor: 'transparent',
      },
    },
    '&.Mui-selected': {
      backgroundColor: alpha(theme.palette.primary.main, ODD_OPACITY + theme.palette.action.selectedOpacity),
      '&:hover': {
        backgroundColor: alpha(
          theme.palette.secondary.main,
          ODD_OPACITY + theme.palette.action.selectedOpacity + theme.palette.action.hoverOpacity,
        ),
        '@media (hover: none)': {
          backgroundColor: alpha(theme.palette.primary.main, ODD_OPACITY + theme.palette.action.selectedOpacity),
        },
      },
    },
  },
  border: 0,
  transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
  borderRadius: '4px',
  padding: 20,
  minHeight: '700px',
  width: '100%',
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
  ].join(','),
  WebkitFontSmoothing: 'auto',
  letterSpacing: 'normal',
  '& .MuiDataGrid-columnsContainer': {
    backgroundColor: theme.palette.mode === 'light' ? '#fafafa' : '#1d1d1d',
  },
  '& .MuiDataGrid-columnHeader': {
    backgroundColor: '#2E7D32', // Matches our avatar color palette
    color: 'white',
    fontWeight: 'bold',
  },
  '& .MuiDataGrid-sortIcon': {
    color: theme.palette.common.white,
  },
  '& .MuiDataGrid-menuIcon': {
    color: theme.palette.common.white,
  },
  '& .MuiDataGrid-iconSeparator': {
    display: 'none',
  },
  '& .MuiDataGrid-columnHeader, .MuiDataGrid-cell': {
    borderRight: `1px solid ${theme.palette.mode === 'light' ? '#f0f0f0' : '#303030'}`,
  },
  '& .MuiDataGrid-columnsContainer, .MuiDataGrid-cell': {
    borderBottom: `1px solid ${theme.palette.mode === 'light' ? '#f0f0f0' : '#303030'}`,
  },
  '& .MuiDataGrid-cell': {
    color: theme.palette.mode === 'light' ? 'rgba(0,0,0,.85)' : 'rgba(255,255,255,0.65)',
  },
  '& .MuiPaginationItem-root': {
    borderRadius: 0,
  },
  '& .deleted': {
    backgroundColor:
      theme.palette.mode === 'light' ? alpha(theme.palette.grey[800], 0.15) : alpha(theme.palette.grey[700], 0.3),
    opacity: 0.7,
    '&:hover': {
      backgroundColor:
        theme.palette.mode === 'light' ? alpha(theme.palette.grey[800], 0.25) : alpha(theme.palette.grey[600], 0.4),
      opacity: 0.8,
    },
    '& .MuiDataGrid-cell': {
      color: theme.palette.mode === 'light' ? theme.palette.grey[600] : theme.palette.grey[400],
    },
  },
  '& .MuiDataGrid-toolbarContainer': {
    padding: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}))

/**
 * Base styled DataGrid component (without pagination)
 */
const BaseStyledDataGrid = MyDataGrid

BaseStyledDataGrid.displayName = 'BaseStyledDataGrid'

/**
 * Extended props for StyledDataGrid with pagination
 */
export interface StyledDataGridProps extends DataGridProps<GridValidRowModel> {
  /**
   * Total count of items for pagination
   */
  totalCount?: number
  /**
   * Pagination model from PaginatedGridInterface
   */
  paginationModelState?: PaginatedGridInterface
  /**
   * State setter for pagination model
   */
  setPaginationModel?: React.Dispatch<React.SetStateAction<PaginatedGridInterface>>
  /**
   * Label for pagination (e.g., "users", "products")
   * @default "items"
   */
  itemLabel?: string
  /**
   * Data test ID for pagination component
   */
  paginationTestId?: string
  /**
   * Whether to show pagination component
   * @default true
   */
  showPagination?: boolean
  /**
   * Optional data-test-id applied to the grid container wrapper
   */
  dataTestId?: string
}

/**
 * Default page size options for DataGrid
 */
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

/**
 * Styled DataGrid component with integrated pagination
 * Automatically includes PaginationComponent below the grid
 */
export const StyledDataGrid = React.forwardRef<HTMLDivElement, StyledDataGridProps>(
  (
    {
      totalCount = 0,
      paginationModelState,
      setPaginationModel,
      itemLabel = 'items',
      paginationTestId,
      showPagination = true,
      hideFooter = false,
      pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
      paginationMode = 'server',
      filterMode = 'server',
      sortingMode = 'server',
      dataTestId,
      ...dataGridProps
    },
    ref,
  ) => {
    // Calculate pagination values
    const currentPage = paginationModelState
      ? Math.floor(paginationModelState.start / paginationModelState.pageSize) + 1
      : 1
    const pageSize = paginationModelState?.pageSize ?? 25

    // Handle page change
    const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number): void => {
      if (setPaginationModel && paginationModelState) {
        handleCustomPaginationChange(page, pageSize, setPaginationModel)
      }
    }

    const { slotProps, ...restDataGridProps } = dataGridProps

    const mergedSlotProps =
      dataTestId != null && slotProps !== undefined
        ? {
          ...slotProps,
          root: {
            ...slotProps.root,
            'data-test-id': dataTestId,
          },
        }
        : dataTestId != null
          ? {
            root: {
              'data-test-id': dataTestId,
            },
          }
          : slotProps

    return (
      <Box ref={ref}>
        <BaseStyledDataGrid
          {...restDataGridProps}
          slotProps={mergedSlotProps}
          hideFooter={hideFooter}
          hideFooterSelectedRowCount
          pageSizeOptions={pageSizeOptions}
          paginationMode={paginationMode}
          filterMode={filterMode}
          sortingMode={sortingMode}
        />
        {showPagination && paginationModelState && setPaginationModel && (
          <Box sx={{ mt: 2 }}>
            <PaginationComponent
              totalItems={totalCount}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              itemLabel={itemLabel}
              data-test-id={paginationTestId}
            />
          </Box>
        )}
      </Box>
    )
  },
)

StyledDataGrid.displayName = 'StyledDataGrid'
