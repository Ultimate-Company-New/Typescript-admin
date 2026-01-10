import { forwardRef } from 'react'

import { IMaskInput } from 'react-imask'

import { TextField, type TextFieldProps } from '@mui/material'

import styles from '../../styles/FormInput.module.scss'

export interface PhoneInputProps extends Omit<TextFieldProps, 'variant' | 'margin' | 'inputComponent'> {
  mask?: string
  variant?: 'outlined' | 'filled' | 'standard'
  margin?: 'none' | 'dense' | 'normal'
}

/**
 * Phone Input component with masking using react-imask
 * Default mask: (000) 000-0000 for US phone numbers
 * react-imask is StrictMode-compatible and doesn't use deprecated findDOMNode
 */
const PhoneInput = forwardRef<HTMLDivElement, PhoneInputProps>(
  (
    {
      mask = '(000) 000-0000',
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
  ) => {
    // Convert react-input-mask style mask to react-imask format
    // (999) 999-9999 -> (000) 000-0000 (0 = digit, 9 = optional digit)
    // react-imask uses 0 for required digits
    const imaskMask = mask.replace(/9/g, '0')

    // Custom input component that uses IMaskInput
    const MaskedInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
      (inputProps, inputRef) => {
        return (
          <IMaskInput
            {...inputProps}
            mask={imaskMask}
            unmask={false} // Keep the mask characters in the value
            inputRef={inputRef as any}
            value={value as string}
            onAccept={(val: string) => {
              // Create a synthetic event for onChange
              if (onChange) {
                const event = {
                  target: { value: val },
                  currentTarget: { value: val },
                } as React.ChangeEvent<HTMLInputElement>
                onChange(event)
              }
            }}
            onBlur={onBlur}
            onFocus={onFocus}
            disabled={disabled}
          />
        )
      },
    )

    MaskedInput.displayName = 'MaskedInput'

    return (
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
        InputProps={{
          disableUnderline: variant === 'filled',
          inputComponent: MaskedInput as any,
          inputProps: {
            ...textFieldInputProps,
          },
        }}
        sx={props.sx}
        value={value || ''}
        disabled={disabled}
        {...props}
      />
    )
  },
)

PhoneInput.displayName = 'PhoneInput'

export default PhoneInput
