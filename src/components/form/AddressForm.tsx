import { Grid, TextField, MenuItem } from '@mui/material'

export interface AddressFormData {
  street1: string
  street2: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface AddressFormProps {
  address: AddressFormData
  onChange: (field: keyof AddressFormData, value: string) => void
  disabled?: boolean
  states?: string[]
}

/**
 * Reusable Address Form Component
 *
 * Features:
 * - Street address fields (line 1 & 2)
 * - City, State, Zip Code, Country fields
 * - Configurable state dropdown
 * - Read-only mode support
 * - Responsive grid layout
 */
const AddressForm = ({ address, onChange, disabled = false, states = [] }: AddressFormProps): JSX.Element => {
  const defaultStates = ['CA', 'NY', 'TX', 'FL', 'IL', 'WA', 'PA', 'OH', 'GA', 'NC']
  const stateOptions = states.length > 0 ? states : defaultStates

  return (
    <Grid container spacing={2}>
      {/* Street Address 1 */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Street Address 1"
          value={address.street1}
          onChange={e => {
            onChange('street1', e.target.value)
          }}
          required
          disabled={disabled}
        />
      </Grid>

      {/* Street Address 2 */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Street Address 2"
          value={address.street2}
          onChange={e => {
            onChange('street2', e.target.value)
          }}
          disabled={disabled}
        />
      </Grid>

      {/* City */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="City"
          value={address.city}
          onChange={e => {
            onChange('city', e.target.value)
          }}
          required
          disabled={disabled}
        />
      </Grid>

      {/* Zip Code */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Zip Code"
          value={address.zipCode}
          onChange={e => {
            onChange('zipCode', e.target.value)
          }}
          required
          disabled={disabled}
        />
      </Grid>

      {/* Country */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Country"
          value={address.country}
          onChange={e => {
            onChange('country', e.target.value)
          }}
          required
          disabled={disabled}
        />
      </Grid>

      {/* State */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          select
          label="State"
          value={address.state}
          onChange={e => {
            onChange('state', e.target.value)
          }}
          required
          disabled={disabled}
        >
          {stateOptions.map(s => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
    </Grid>
  )
}

export default AddressForm
