import { TextField } from '@mui/material'
import { Controller, type Control, type FieldErrors, type FieldValues } from 'react-hook-form'

interface NotesFieldProps<TFieldValues extends FieldValues = FieldValues> {
  name: string
  control: Control<TFieldValues>
  errors: FieldErrors<TFieldValues>
  label?: string
  rows?: number
  disabled?: boolean
  required?: boolean
  placeholder?: string
}

/**
 * Reusable Notes Field Component
 * Can be used with react-hook-form in any form
 *
 * Features:
 * - Multiline text input
 * - Configurable rows
 * - Error handling
 * - Read-only mode support
 * - Optional/Required field support
 */
const NotesField = <TFieldValues extends FieldValues = FieldValues>({
  name,
  control,
  errors,
  label = 'Notes',
  rows = 4,
  disabled = false,
  required = false,
  placeholder,
}: NotesFieldProps<TFieldValues>): JSX.Element => {
  const fieldErrors = errors as Record<string, { message?: string } | undefined>
  const fieldError = fieldErrors[name]

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          multiline
          rows={rows}
          label={label}
          placeholder={placeholder}
          value={field.value ?? ''}
          onChange={e => {
            field.onChange(e.target.value)
          }}
          disabled={disabled}
          required={required}
          error={!!fieldError}
          helperText={fieldError?.message}
        />
      )}
    />
  )
}

export default NotesField

