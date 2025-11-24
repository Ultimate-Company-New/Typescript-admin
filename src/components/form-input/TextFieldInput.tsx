import { forwardRef } from 'react'

import { TextField, type TextFieldProps } from '@mui/material'

export interface TextFieldInputProps extends Omit<TextFieldProps, 'variant' | 'margin'> {
  maxLength?: number
  variant?: 'outlined' | 'filled' | 'standard'
  margin?: 'none' | 'dense' | 'normal'
}

/**
 * Custom TextField component built on top of Material UI TextField
 * Provides sensible defaults and additional customization options
 */
const TextFieldInput = forwardRef<HTMLDivElement, TextFieldInputProps>(
  (
    { maxLength, variant = 'outlined', margin = 'dense', fullWidth = true, InputLabelProps, inputProps, ...props },
    ref,
  ) => (
    <TextField
      ref={ref}
      variant={variant}
      margin={margin}
      fullWidth={fullWidth}
      InputLabelProps={{
        shrink: true,
        ...InputLabelProps,
      }}
      inputProps={{
        maxLength,
        ...inputProps,
      }}
      {...props}
    />
  ),
)

TextFieldInput.displayName = 'TextFieldInput'

export default TextFieldInput
