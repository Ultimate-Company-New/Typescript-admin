import { forwardRef } from 'react'

import { TextField, type TextFieldProps } from '@mui/material'

import styles from '../../styles/FormInput.module.scss'

export interface EmailInputProps extends Omit<TextFieldProps, 'variant' | 'margin' | 'type'> {
  variant?: 'outlined' | 'filled' | 'standard'
  margin?: 'none' | 'dense' | 'normal'
}

/**
 * Email Input component with email validation pattern
 * Provides email-specific formatting and validation hints
 */
const EmailInput = forwardRef<HTMLDivElement, EmailInputProps>(
  ({ variant = 'filled', margin = 'normal', fullWidth = true, InputLabelProps, inputProps, ...props }, ref) => (
    <TextField
      ref={ref}
      type="email"
      variant={variant}
      margin={margin}
      fullWidth={fullWidth}
      className={styles['filled-input']}
      InputLabelProps={{
        shrink: true,
        ...InputLabelProps,
      }}
      inputProps={{
        pattern: '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$',
        autoComplete: 'email',
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

EmailInput.displayName = 'EmailInput'

export default EmailInput
