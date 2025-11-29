import { LocationOn as LocationIcon } from '@mui/icons-material'
import { Box, Tooltip } from '@mui/material'

import { type AddressResponseModel } from '../../models/AddressModels'

import { getStateAbbreviation } from './gridHelpers'

/**
 * Props for AddressCell component
 */
export interface AddressCellProps {
  /** Array of addresses (will use primary or first) */
  addresses: AddressResponseModel[] | null | undefined
  /** Custom className for the container */
  containerClassName?: string
  /** Custom className for the icon */
  iconClassName?: string
  /** Custom className for the tooltip */
  tooltipClassName?: string
  /** Custom className for empty state */
  emptyClassName?: string
  /** Text to display when no address (defaults to '—') */
  emptyText?: string
  /** Test ID for the address cell */
  testId?: string
}

/**
 * Reusable grid cell component for displaying addresses
 * Shows abbreviated address with full details on hover
 *
 * Features:
 * - Displays city and state abbreviation as short form
 * - Shows full address (all street lines, city, state, postal code, country) in tooltip
 * - Handles primary address detection
 * - Gracefully handles missing data
 *
 * @example
 * // In a grid column definition:
 * {
 *   field: 'addresses',
 *   headerName: 'Address',
 *   renderCell: (params) => (
 *     <AddressCell addresses={params.row.addresses} />
 *   ),
 * }
 *
 * @example
 * // With custom styling:
 * {
 *   field: 'shippingAddress',
 *   headerName: 'Shipping Address',
 *   renderCell: (params) => (
 *     <AddressCell
 *       addresses={params.row.shippingAddresses}
 *       containerClassName={styles['custom-address']}
 *       emptyText="No address"
 *     />
 *   ),
 * }
 */
export const AddressCell = ({
  addresses,
  containerClassName,
  iconClassName,
  tooltipClassName,
  emptyClassName,
  emptyText = '—',
  testId = 'address-cell',
}: AddressCellProps): JSX.Element => {
  // Handle null, undefined, or empty array
  if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
    return (
      <span className={emptyClassName} data-test-id={testId}>
        {emptyText}
      </span>
    )
  }

  // Get primary address or first address
  const primaryAddress = addresses.find(addr => addr.isPrimary) ?? addresses[0]

  // Short display with state abbreviation
  const stateAbbr: string = getStateAbbreviation(primaryAddress.state)
  const shortDisplayParts = [primaryAddress.city, stateAbbr].filter(Boolean)
  const shortDisplay = shortDisplayParts.length > 0 ? shortDisplayParts.join(', ') : primaryAddress.country || emptyText

  // Build full address for tooltip
  const addressLines: string[] = []

  // Street Address 1
  if (primaryAddress.streetAddress) {
    addressLines.push(String(primaryAddress.streetAddress))
  }

  // Street Address 2
  if (primaryAddress.streetAddress2) {
    addressLines.push(String(primaryAddress.streetAddress2))
  }

  // Street Address 3
  if (primaryAddress.streetAddress3) {
    addressLines.push(String(primaryAddress.streetAddress3))
  }

  // City, State, Postal Code line
  const cityStateZip = [primaryAddress.city, primaryAddress.state, primaryAddress.postalCode].filter(Boolean).join(', ')
  if (cityStateZip) {
    addressLines.push(cityStateZip)
  }

  // Country
  if (primaryAddress.country) {
    addressLines.push(primaryAddress.country)
  }

  const fullAddress = addressLines.join('\n')

  return (
    <Tooltip
      title={<Box className={tooltipClassName}>{fullAddress || 'Address not available'}</Box>}
      arrow
      slotProps={{
        tooltip: {
          'data-test-id': `${testId}-tooltip`,
        } as React.HTMLAttributes<HTMLDivElement>,
      }}
    >
      <Box className={containerClassName} data-test-id={testId}>
        <LocationIcon fontSize="small" className={iconClassName} />
        <span>{shortDisplay}</span>
      </Box>
    </Tooltip>
  )
}
