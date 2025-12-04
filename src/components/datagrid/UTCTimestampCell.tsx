import { formatUTCTimestamp } from '../../utils/gridUtil'

// Explicitly define the function type for better type safety
type FormatUTCTimestampFn = (
  value: unknown,
  formatString?: string,
  emptyText?: string,
  showUTCSuffix?: boolean,
) => string

/**
 * Props for UTCTimestampCell component
 */
export interface UTCTimestampCellProps {
  /** The timestamp value (ISO string or Date object) */
  value: string | Date | null | undefined
  /** Optional custom format string (defaults to 'MMM dd, yyyy HH:mm') */
  formatString?: string
  /** Text to display when value is null/undefined (defaults to 'Never') */
  emptyText?: string
  /** Whether to append ' UTC' suffix (defaults to true) */
  showUTCSuffix?: boolean
}

/**
 * Reusable grid cell component for displaying UTC timestamps
 * Formats ISO date strings into human-readable format
 *
 * @example
 * // In a grid column definition:
 * {
 *   field: 'createdAt',
 *   headerName: 'Created (UTC)',
 *   renderCell: (params) => (
 *     <UTCTimestampCell value={params.value as string} />
 *   ),
 * }
 *
 * @example
 * // With custom format:
 * {
 *   field: 'lastLogin',
 *   headerName: 'Last Login',
 *   renderCell: (params) => (
 *     <UTCTimestampCell
 *       value={params.value as string}
 *       formatString="dd/MM/yyyy HH:mm:ss"
 *       emptyText="Not logged in"
 *     />
 *   ),
 * }
 */
export const UTCTimestampCell = ({
  value,
  formatString = 'MMM dd, yyyy HH:mm',
  emptyText = 'Never',
  showUTCSuffix = true,
}: UTCTimestampCellProps): JSX.Element => {
  const formatter = formatUTCTimestamp as FormatUTCTimestampFn
  const formattedValue: string = formatter(value, formatString, emptyText, showUTCSuffix)
  return <span>{formattedValue}</span>
}
