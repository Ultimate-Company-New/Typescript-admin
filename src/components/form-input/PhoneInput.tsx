import { forwardRef } from 'react'

import InputMask from 'react-input-mask'

import { TextField, type TextFieldProps } from '@mui/material'

import styles from '../../styles/FormInput.module.scss'

export interface PhoneInputProps extends Omit<TextFieldProps, 'variant' | 'margin' | 'inputComponent'> {
  mask?: string
  variant?: 'outlined' | 'filled' | 'standard'
  margin?: 'none' | 'dense' | 'normal'
}

/**
 * Phone Input component with masking
 * Default mask: (999) 999-9999 for US phone numbers
 */
const PhoneInput = forwardRef<HTMLDivElement, PhoneInputProps>(
  (
    {
      mask = '(999) 999-9999',
      variant = 'filled',
      margin = 'normal',
      fullWidth = true,
      InputLabelProps,
      inputProps: textFieldInputProps,
      value,
      onChange,
      onBlur,
      onFocus,
      disabled,
      ...props
    },
    ref,
  ) => (
    <InputMask
      mask={mask}
      maskChar={null}
      value={value as string}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      disabled={disabled}
    >
      {(maskInputProps: React.InputHTMLAttributes<HTMLInputElement>) => (
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
            ...textFieldInputProps,
          }}
          InputProps={{
            disableUnderline: true,
          }}
          sx={props.sx}
          value={maskInputProps.value}
          onChange={maskInputProps.onChange}
          onBlur={maskInputProps.onBlur}
          onFocus={maskInputProps.onFocus}
          disabled={maskInputProps.disabled}
          {...props}
        />
      )}
    </InputMask>
  ),
)

PhoneInput.displayName = 'PhoneInput'

export default PhoneInput
