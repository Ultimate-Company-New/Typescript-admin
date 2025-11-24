import { forwardRef, useState } from 'react'

import { Visibility, VisibilityOff } from '@mui/icons-material'
import { TextField, type TextFieldProps, IconButton, InputAdornment } from '@mui/material'

export interface PasswordInputProps extends Omit<TextFieldProps, 'variant' | 'margin' | 'type'> {
  maxLength?: number
  variant?: 'outlined' | 'filled' | 'standard'
  margin?: 'none' | 'dense' | 'normal'
  showPasswordToggle?: boolean
}

/**
 * Custom Password Input component with show/hide toggle
 * Built on top of Material UI TextField with secure password input
 */
const PasswordInput = forwardRef<HTMLDivElement, PasswordInputProps>(
  (
    {
      maxLength,
      variant = 'outlined',
      margin = 'dense',
      fullWidth = true,
      showPasswordToggle = true,
      InputLabelProps,
      inputProps,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false)

    const handleTogglePassword = (): void => {
      setShowPassword(prev => !prev)
    }

    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.preventDefault()
    }

    return (
      <TextField
        ref={ref}
        type={showPassword ? 'text' : 'password'}
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
        InputProps={{
          endAdornment: showPasswordToggle ? (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleTogglePassword}
                onMouseDown={handleMouseDownPassword}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ) : undefined,
        }}
        {...props}
      />
    )
  },
)

PasswordInput.displayName = 'PasswordInput'

export default PasswordInput
