import { forwardRef } from 'react'

import { MenuItem, TextField, type TextFieldProps } from '@mui/material'

import styles from '../../styles/FormInput.module.scss'

export interface SelectInputProps extends Omit<TextFieldProps, 'variant' | 'margin' | 'select'> {
  options: Array<{ value: string | number; label: string }>
  variant?: 'outlined' | 'filled' | 'standard'
  margin?: 'none' | 'dense' | 'normal'
  placeholder?: string
}

/**
 * Custom Select/Dropdown component built on top of Material UI TextField
 * Provides sensible defaults and consistent styling with other form inputs
 */
const SelectInput = forwardRef<HTMLDivElement, SelectInputProps>(
  ({ options, variant = 'filled', margin = 'normal', fullWidth = true, InputLabelProps, className, placeholder, ...props }, ref) => {
    const hasValue = props.value !== undefined && props.value !== null && props.value !== ''

    return (
      <TextField
        ref={ref}
        select
        variant={variant}
        margin={margin}
        fullWidth={fullWidth}
        className={`${styles['filled-input']} ${className ?? ''}`}
        InputLabelProps={{
          shrink: true,
          ...InputLabelProps,
        }}
        InputProps={{
          disableUnderline: true,
        }}
        SelectProps={{
          displayEmpty: true,
          renderValue: (value) => {
            // If no value and placeholder exists, show placeholder
            if ((value === '' || value === null || value === undefined) && placeholder) {
              return <span className={styles['select-placeholder']}>{placeholder}</span>
            }
            // Otherwise show the selected option label
            const selectedOption = options.find(opt => opt.value === value)
            return selectedOption?.label ?? value
          },
        }}
        sx={props.sx}
        {...props}
      >
        {placeholder && (
          <MenuItem
            value=""
            disabled
            className={`${styles['select-menu-item']} ${styles['select-placeholder-item']}`}
          >
            {placeholder}
          </MenuItem>
        )}
        {options.map(option => (
          <MenuItem key={option.value} value={option.value} className={styles['select-menu-item']}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    )
  },
)

SelectInput.displayName = 'SelectInput'

export default SelectInput
