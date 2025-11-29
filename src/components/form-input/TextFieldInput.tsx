import { forwardRef } from 'react'

import { TextField, type TextFieldProps } from '@mui/material'

import styles from '../../styles/FormInput.module.scss'

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
    { maxLength, variant = 'filled', margin = 'normal', fullWidth = true, InputLabelProps, inputProps, ...props },
    ref,
  ) => (
    <TextField
      ref={ref}
      variant={variant}
      margin={margin}
      fullWidth={fullWidth}
      className={styles['filled-input']}
      InputLabelProps={{
        shrink: true,
        ...InputLabelProps,
      }}
      inputProps={{
        maxLength,
        ...inputProps,
      }}
      InputProps={{
        disableUnderline: true,
      }}
      sx={props.sx}
      {...props}
    />
  ),
)

TextFieldInput.displayName = 'TextFieldInput'

export default TextFieldInput
