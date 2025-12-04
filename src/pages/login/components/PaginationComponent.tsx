import { Box, Pagination, Typography } from '@mui/material'

import styles from '../../../styles/Login.module.scss'

interface PaginationComponentProps {
  totalItems: number
  currentPage: number
  pageSize: number
  onPageChange: (event: React.ChangeEvent<unknown>, page: number) => void
  itemLabel?: string
  'data-test-id'?: string
}

/**
 * PaginationComponent for Client Landing Page
 * Displays pagination controls and item count information
 * Shows: "Showing 1-9 of 50 clients" format
 */
const PaginationComponent = ({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  itemLabel = 'items',
  'data-test-id': dataTestId,
}: PaginationComponentProps): JSX.Element | null => {
  // Don't render if there are no items or only one page
  if (totalItems === 0) {
    return null
  }

  const totalPages = Math.ceil(totalItems / pageSize)

  // Don't render pagination if there's only one page
  if (totalPages <= 1) {
    return null
  }

  // Calculate the range of items being displayed
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <Box className={styles['pagination-component']} data-test-id={dataTestId}>
      {/* Item count display */}
      <Typography variant="body2" color="text.secondary" className={styles['pagination-component__count']}>
        Showing {startItem}-{endItem} of {totalItems} {itemLabel}
      </Typography>

      {/* Pagination controls */}
      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={onPageChange}
        color="primary"
        shape="rounded"
        showFirstButton
        showLastButton
        className={styles['pagination-component__controls']}
        data-test-id={`${dataTestId}-controls`}
      />
    </Box>
  )
}

export default PaginationComponent
