import { forwardRef } from 'react'

import { FormControlLabel, Radio, RadioGroup, type RadioGroupProps, type RadioProps } from '@mui/material'

import styles from '../../styles/FormInput.module.scss'

export interface RadioInputProps extends RadioProps {
  label?: string
}

export interface RadioGroupInputProps extends Omit<RadioGroupProps, 'onChange'> {
  options: Array<{ value: string | number; label: string | React.ReactNode }>
  value?: string | number
  onChange?: (value: string | number) => void
  row?: boolean
}

/**
 * Custom Radio component built on top of Material UI Radio
 * Provides consistent styling with other form inputs
 */
const RadioInput = forwardRef<HTMLButtonElement, RadioInputProps>(
  ({ label, className, ...props }, ref) => {
    if (label) {
      return (
        <FormControlLabel
          control={<Radio ref={ref} className={className} {...props} />}
          label={label}
        />
      )
    }
    return <Radio ref={ref} className={className} {...props} />
  },
)

RadioInput.displayName = 'RadioInput'

/**
 * Custom RadioGroup component built on top of Material UI RadioGroup
 * Provides consistent styling and easier API
 */
const RadioGroupInput = forwardRef<HTMLDivElement, RadioGroupInputProps>(
  ({ options, value, onChange, row = false, className, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value
      // Try to convert to number if it's a numeric string
      const numericValue = !isNaN(Number(newValue)) && newValue !== '' ? Number(newValue) : newValue
      onChange?.(numericValue)
    }

    return (
      <RadioGroup
        ref={ref}
        value={value?.toString() || ''}
        onChange={handleChange}
        row={row}
        className={`${styles['radio-group']} ${className || ''}`}
        {...props}
      >
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value.toString()}
            control={<Radio size="small" />}
            label={option.label}
            className={styles['radio-option']}
          />
        ))}
      </RadioGroup>
    )
  },
)

RadioGroupInput.displayName = 'RadioGroupInput'

export default RadioInput
export { RadioGroupInput }
