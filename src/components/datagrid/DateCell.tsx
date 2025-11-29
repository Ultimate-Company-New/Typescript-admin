import { formatDate } from './gridHelpers'

/**
 * Props for DateCell component
 */
export interface DateCellProps {
  /** The date value (ISO string or Date object) */
  value: string | Date | null | undefined
  /** Optional custom format string (defaults to 'do MMM yyyy') */
  formatString?: string
  /** Text to display when value is null/undefined (defaults to '—') */
  emptyText?: string
}

/**
 * Reusable grid cell component for displaying dates (without time)
 * Formats ISO date strings into human-readable format
 *
 * Features:
 * - Formats dates using date-fns
 * - Default format: '1st Jan 2024' (do MMM yyyy)
 * - Customizable format string
 * - Handles null/undefined gracefully
 *
 * @example
 * // In a grid column definition:
 * {
 *   field: 'dob',
 *   headerName: 'Date of Birth',
 *   renderCell: (params) => (
 *     <DateCell value={params.value as string} />
 *   ),
 * }
 *
 * @example
 * // With custom format:
 * {
 *   field: 'startDate',
 *   headerName: 'Start Date',
 *   renderCell: (params) => (
 *     <DateCell
 *       value={params.value as string}
 *       formatString="dd/MM/yyyy"
 *     />
 *   ),
 * }
 *
 * @example
 * // Using valueFormatter instead of renderCell:
 * {
 *   field: 'dob',
 *   headerName: 'Date of Birth',
 *   valueFormatter: (value) => formatDate(value),
 * }
 */
export const DateCell = ({ value, formatString = 'do MMM yyyy', emptyText = '—' }: DateCellProps): JSX.Element => {
  const formattedValue = formatDate(value, formatString, emptyText)
  return <span>{formattedValue}</span>
}
