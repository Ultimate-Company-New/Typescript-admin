import { formatPhone } from './gridHelpers'

/**
 * Props for PhoneCell component
 */
export interface PhoneCellProps {
  /** The phone number value (can be string or number) */
  value: string | number | null | undefined
  /** Custom format function */
  customFormatter?: (phone: string) => string
  /** Text to display when value is null/undefined (defaults to '—') */
  emptyText?: string
}

/**
 * Reusable grid cell component for displaying phone numbers
 * Automatically formats phone numbers for better readability
 *
 * Features:
 * - Formats 10-digit numbers as (123) - 456 - 7890
 * - Formats 11-digit numbers as (+12) - 345 - 67890
 * - Allows custom formatting function
 * - Handles null/undefined gracefully
 *
 * @example
 * // In a grid column definition:
 * {
 *   field: 'phone',
 *   headerName: 'Phone',
 *   renderCell: (params) => (
 *     <PhoneCell value={params.value as string} />
 *   ),
 * }
 *
 * @example
 * // With custom formatter:
 * {
 *   field: 'mobile',
 *   headerName: 'Mobile',
 *   renderCell: (params) => (
 *     <PhoneCell
 *       value={params.value as string}
 *       customFormatter={(phone) => phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
 *     />
 *   ),
 * }
 *
 * @example
 * // Using valueFormatter instead of renderCell:
 * {
 *   field: 'phone',
 *   headerName: 'Phone',
 *   valueFormatter: (value) => formatPhone(value),
 * }
 */
export const PhoneCell = ({ value, customFormatter, emptyText = '—' }: PhoneCellProps): JSX.Element => {
  if (!value) {
    return <span>{emptyText}</span>
  }

  const phoneStr = typeof value === 'number' ? String(value) : value

  if (typeof phoneStr !== 'string') {
    return <span>{emptyText}</span>
  }

  // Use custom formatter if provided, otherwise use default
  const formattedPhone = customFormatter ? customFormatter(phoneStr) : formatPhone(phoneStr, emptyText)

  return <span>{formattedPhone}</span>
}
