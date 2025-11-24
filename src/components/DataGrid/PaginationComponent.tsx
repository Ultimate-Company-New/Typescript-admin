import { forwardRef } from 'react'

import { Box, Grid, Typography, Pagination, type PaginationProps } from '@mui/material'

export interface PaginationComponentProps extends Omit<PaginationProps, 'count' | 'page' | 'onChange'> {
  /**
   * Total number of items across all pages
   */
  totalItems: number
  /**
   * Current active page (1-indexed)
   */
  currentPage: number
  /**
   * Number of items per page
   */
  pageSize: number
  /**
   * Callback when page changes
   */
  onPageChange: (event: React.ChangeEvent<unknown>, page: number) => void
  /**
   * Label for items (e.g., "clients", "users", "products")
   * @default "items"
   */
  itemLabel?: string
  /**
   * Data test id for automation testing
   */
  'data-test-id'?: string
  /**
   * Hide the pagination info text
   * @default false
   */
  hideInfo?: boolean
}

/**
 * Reusable Pagination Component
 * Features:
 * - Displays "Showing X - Y of Z items" info
 * - Material UI Pagination controls
 * - Responsive layout
 * - Customizable item label
 * - Fully typed with TypeScript
 */
export const PaginationComponent = forwardRef<HTMLDivElement, PaginationComponentProps>(
  (
    {
      totalItems,
      currentPage,
      pageSize,
      onPageChange,
      itemLabel = 'items',
      'data-test-id': dataTestId,
      hideInfo = false,
      color = 'primary',
      size = 'large',
      variant = 'outlined',
      shape = 'rounded',
      ...rest
    },
    ref,
  ) => {
    // Calculate pagination values
    const totalPages = Math.ceil(totalItems / pageSize)

    const infoTestId = dataTestId ? `${dataTestId}-info` : undefined
    const startRecord = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
    const endRecord = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems)
    const showPaginationControls = totalPages > 1

    return (
      <Box ref={ref}>
        <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
          {/* Pagination Info */}
          {!hideInfo && (
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary" data-test-id={infoTestId}>
                Showing {startRecord} - {endRecord} of {totalItems} {itemLabel}
              </Typography>
            </Grid>
          )}

          {/* Pagination Controls */}
          <Grid
            item
            xs={12}
            sm={hideInfo ? 12 : 6}
            sx={{
              display: 'flex',
              justifyContent: hideInfo
                ? {
                  xs: 'center',
                  sm: 'center',
                }
                : {
                  xs: 'center',
                  sm: 'flex-end',
                },
            }}
          >
            {showPaginationControls && (
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={onPageChange}
                color={color}
                size={size}
                variant={variant}
                shape={shape}
                data-test-id={dataTestId}
                {...rest}
              />
            )}
          </Grid>
        </Grid>
      </Box>
    )
  },
)

PaginationComponent.displayName = 'PaginationComponent'
