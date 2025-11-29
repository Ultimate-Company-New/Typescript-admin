import { forwardRef } from 'react'

import { MenuItem, TextField, type TextFieldProps } from '@mui/material'

import styles from '../../styles/FormInput.module.scss'

export interface SelectInputProps extends Omit<TextFieldProps, 'variant' | 'margin' | 'select'> {
  options: Array<{ value: string | number; label: string }>
  variant?: 'outlined' | 'filled' | 'standard'
  margin?: 'none' | 'dense' | 'normal'
}

/**
 * Custom Select/Dropdown component built on top of Material UI TextField
 * Provides sensible defaults and consistent styling with other form inputs
 */
const SelectInput = forwardRef<HTMLDivElement, SelectInputProps>(
  ({ options, variant = 'filled', margin = 'normal', fullWidth = true, InputLabelProps, ...props }, ref) => (
    <TextField
      ref={ref}
      select
      variant={variant}
      margin={margin}
      fullWidth={fullWidth}
      className={styles['filled-input']}
      InputLabelProps={{
        shrink: true,
        ...InputLabelProps,
      }}
      InputProps={{
        disableUnderline: true,
      }}
      sx={props.sx}
      {...props}
    >
      {options.map(option => (
        <MenuItem key={option.value} value={option.value} className={styles['select-menu-item']}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  ),
)

SelectInput.displayName = 'SelectInput'

export default SelectInput
