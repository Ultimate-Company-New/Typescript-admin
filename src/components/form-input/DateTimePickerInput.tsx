import { forwardRef, useCallback, useMemo } from 'react'

import { Autocomplete, Box, TextField, type TextFieldProps } from '@mui/material'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'

import styles from '../../styles/FormInput.module.scss'

/**
 * Common timezone options with their display names
 */
export const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Asia/Kolkata', label: 'IST (India Standard Time)' },
  { value: 'America/New_York', label: 'EST/EDT (Eastern Time - US)' },
  { value: 'America/Chicago', label: 'CST/CDT (Central Time - US)' },
  { value: 'America/Denver', label: 'MST/MDT (Mountain Time - US)' },
  { value: 'America/Los_Angeles', label: 'PST/PDT (Pacific Time - US)' },
  { value: 'Europe/London', label: 'GMT/BST (London)' },
  { value: 'Europe/Paris', label: 'CET/CEST (Central European Time)' },
  { value: 'Europe/Berlin', label: 'CET/CEST (Berlin)' },
  { value: 'Asia/Tokyo', label: 'JST (Japan Standard Time)' },
  { value: 'Asia/Shanghai', label: 'CST (China Standard Time)' },
  { value: 'Asia/Singapore', label: 'SGT (Singapore Time)' },
  { value: 'Asia/Dubai', label: 'GST (Gulf Standard Time)' },
  { value: 'Australia/Sydney', label: 'AEST/AEDT (Sydney)' },
  { value: 'Pacific/Auckland', label: 'NZST/NZDT (New Zealand)' },
] as const

export type TimezoneValue = (typeof TIMEZONE_OPTIONS)[number]['value'] | string

export interface DateTimeValue {
  dateTime: Date | null
  timezone: string
}

export interface DateTimePickerInputProps
  extends Omit<TextFieldProps, 'value' | 'onChange' | 'variant' | 'margin'> {
  value: DateTimeValue | null
  onChange: (value: DateTimeValue) => void
  dateTimeLabel?: string
  timezoneLabel?: string
  minDateTime?: Date
  maxDateTime?: Date
  variant?: 'outlined' | 'filled' | 'standard'
  margin?: 'none' | 'dense' | 'normal'
}

/**
 * DateTimePickerInput - A combined date-time picker with timezone selection
 * Uses MUI X Date Pickers for the datetime picker and Autocomplete for timezone
 */
const DateTimePickerInput = forwardRef<HTMLDivElement, DateTimePickerInputProps>(
  (
    {
      value,
      onChange,
      dateTimeLabel = 'Date & Time',
      timezoneLabel = 'Timezone',
      minDateTime,
      maxDateTime,
      variant = 'filled',
      margin = 'normal',
      disabled = false,
      error = false,
      helperText,
      required = false,
      ...props
    },
    ref,
  ) => {
    // Get current values or defaults
    const currentDateTime = value?.dateTime ?? null
    const currentTimezone = value?.timezone ?? 'UTC'

    // Find the timezone option for the autocomplete
    const selectedTimezoneOption = useMemo(() => {
      const found = TIMEZONE_OPTIONS.find(opt => opt.value === currentTimezone)
      return found ?? { value: currentTimezone, label: currentTimezone }
    }, [currentTimezone])

    // Handle date-time change
    const handleDateTimeChange = useCallback(
      (newDateTime: Date | null) => {
        onChange({
          dateTime: newDateTime,
          timezone: currentTimezone,
        })
      },
      [onChange, currentTimezone],
    )

    // Handle timezone change
    const handleTimezoneChange = useCallback(
      (_event: React.SyntheticEvent, newValue: { value: string; label: string } | null) => {
        onChange({
          dateTime: currentDateTime,
          timezone: newValue?.value ?? 'UTC',
        })
      },
      [onChange, currentDateTime],
    )

    return (
      <Box ref={ref} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* DateTime Picker */}
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateTimePicker
            label={dateTimeLabel}
            value={currentDateTime}
            onChange={handleDateTimeChange}
            disabled={disabled}
            minDateTime={minDateTime}
            maxDateTime={maxDateTime}
            slotProps={{
              textField: {
                variant,
                margin,
                fullWidth: true,
                required,
                error,
                helperText,
                className: styles['filled-input'],
                InputLabelProps: {
                  shrink: true,
                },
                InputProps: {
                  disableUnderline: variant === 'filled',
                },
                ...props,
              },
            }}
          />
        </LocalizationProvider>

        {/* Timezone Selector */}
        <Autocomplete
          value={selectedTimezoneOption}
          onChange={handleTimezoneChange}
          options={[...TIMEZONE_OPTIONS]}
          getOptionLabel={option => option.label}
          isOptionEqualToValue={(option, val) => option.value === val.value}
          disabled={disabled}
          disableClearable
          renderInput={params => (
            <TextField
              {...params}
              label={timezoneLabel}
              variant={variant}
              margin={margin}
              required={required}
              className={styles['filled-input']}
              InputLabelProps={{
                ...params.InputLabelProps,
                shrink: true,
              }}
              InputProps={{
                ...params.InputProps,
                disableUnderline: variant === 'filled',
              }}
            />
          )}
        />
      </Box>
    )
  },
)

DateTimePickerInput.displayName = 'DateTimePickerInput'

export default DateTimePickerInput

