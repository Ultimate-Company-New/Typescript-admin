import { useEffect, useMemo } from 'react'

import {
    Controller,
    useWatch,
    type Control,
    type FieldErrors,
    type Path,
    type PathValue,
    type UseFormSetValue,
    type UseFormTrigger,
} from 'react-hook-form'

import { Grid } from '@mui/material'

import { ADDRESS_TYPES_ARRAY } from '../../constants/appConstants'
import { AutocompleteInput, EmailInput, PhoneInput, SelectInput, TextFieldInput } from '../form-input'

import { FieldType, type FieldConfig, type FieldOption } from './FormFieldRenderer'

export interface AddressFormData {
  streetAddress: string
  streetAddress2?: string
  streetAddress3?: string
  city: string
  state: string
  postalCode: string
  country: string
  addressType: string
  nameOnAddress?: string
  emailOnAddress?: string
  phoneOnAddress?: string
}

const ADDRESS_TYPE_OPTIONS: FieldOption[] = (ADDRESS_TYPES_ARRAY as readonly string[]).map(type => ({
  value: type,
  label: type,
}))

export interface AddressableFormValues {
  address: AddressFormData
}

type AddressFieldConfig = FieldConfig<AddressableFormValues>

export interface AddressFormControllerProps<TFieldValues extends AddressableFormValues = AddressableFormValues> {
  control: Control<TFieldValues>
  errors?: FieldErrors<TFieldValues>
  disabled?: boolean
  states?: string[]
  cities?: string[]
  onStateChange?: (state: string) => void
  setValue: UseFormSetValue<TFieldValues>
  trigger?: UseFormTrigger<TFieldValues>
}

const AddressFormController = <TFieldValues extends AddressableFormValues>({
  control,
  errors,
  disabled = false,
  states = [],
  cities = [],
  onStateChange,
  setValue,
  trigger,
}: AddressFormControllerProps<TFieldValues>): JSX.Element => {
  const formErrors = errors ?? ({} as FieldErrors<TFieldValues>)

  const baseStateFieldPath = 'address.state' as Path<AddressableFormValues>
  const baseCityFieldPath = 'address.city' as Path<AddressableFormValues>
  const stateFieldPath = baseStateFieldPath as Path<TFieldValues>
  const cityFieldPath = baseCityFieldPath as Path<TFieldValues>

  const stateValue = (useWatch({
    control,
    name: stateFieldPath,
  }) ?? '') as string

  const cityValue = (useWatch({
    control,
    name: cityFieldPath,
  }) ?? '') as string

  const isCityDisabled = disabled || !stateValue || stateValue.trim() === '' || cities.length === 0

  const stateOptions = useMemo(
    () =>
      states.map(s => ({
        value: s,
        label: s,
      })),
    [states],
  )

  const cityOptions = useMemo(
    () =>
      cities.map(city => ({
        value: city,
        label: city,
      })),
    [cities],
  )

  useEffect(() => {
    if (!cityValue) {
      return
    }

    const cityExists = cityOptions.some(option => option.value === cityValue)

    if (!cityExists) {
      // Don't validate when clearing - let user select first
      // Validation will happen on form submit or when user selects a city
      setValue(cityFieldPath, '' as PathValue<TFieldValues, typeof cityFieldPath>, {
        shouldDirty: true,
        shouldValidate: false,
      })
    }
  }, [cityOptions, cityValue, cityFieldPath, setValue])

  useEffect(() => {
    if (onStateChange) {
      onStateChange(stateValue)
    }
  }, [onStateChange, stateValue])

  // Trigger validation when city value changes to clear any stale errors
  useEffect(() => {
    if (trigger && cityValue && cityValue.trim() !== '') {
      // Re-validate the city field to clear the error when a valid city is selected
      void trigger(cityFieldPath)
    }
  }, [trigger, cityValue, cityFieldPath])

  const addressFields = useMemo<Array<FieldConfig<TFieldValues>>>(() => {
    const fields: AddressFieldConfig[] = [
      {
        name: 'address.streetAddress' as Path<AddressableFormValues>,
        label: 'Street Address 1',
        type: FieldType.Text,
        required: true,
        disabled,
        gridSize: {
          xs: 12,
          sm: 12,
        },
        placeholder: 'e.g., 123 Main Street',
      },
      {
        name: 'address.streetAddress2' as Path<AddressableFormValues>,
        label: 'Street Address 2',
        type: FieldType.Text,
        disabled,
        gridSize: {
          xs: 12,
          sm: 6,
        },
        placeholder: 'Apt, Suite, Floor (optional)',
      },
      {
        name: 'address.streetAddress3' as Path<AddressableFormValues>,
        label: 'Street Address 3',
        type: FieldType.Text,
        disabled,
        gridSize: {
          xs: 12,
          sm: 6,
        },
        placeholder: 'Additional address info (optional)',
      },
      {
        name: 'address.postalCode' as Path<AddressableFormValues>,
        label: 'Postal Code',
        type: FieldType.Text,
        required: true,
        disabled,
        gridSize: {
          xs: 12,
          sm: 6,
        },
        placeholder: 'Enter 6-digit postal code',
      },
      {
        name: 'address.country' as Path<AddressableFormValues>,
        label: 'Country',
        type: FieldType.Text,
        required: true,
        disabled: true,
        gridSize: {
          xs: 12,
          sm: 6,
        },
        placeholder: 'Country',
      },
      {
        name: 'address.addressType' as Path<AddressableFormValues>,
        label: 'Address Type',
        type: FieldType.Select as FieldType,
        required: true,
        disabled,
        gridSize: {
          xs: 12,
          sm: 6,
        },
        options: ADDRESS_TYPE_OPTIONS,
        placeholder: 'Select address type',
      },
      {
        name: baseStateFieldPath,
        label: 'State',
        type: FieldType.Select as FieldType,
        required: true,
        disabled,
        gridSize: {
          xs: 12,
          sm: 6,
        },
        options: stateOptions,
        placeholder: 'Select state',
      },
      {
        name: baseCityFieldPath,
        label: 'City',
        type: FieldType.Autocomplete as FieldType,
        required: true,
        disabled: isCityDisabled,
        gridSize: {
          xs: 12,
          sm: 6,
        },
        options: cityOptions,
        sortOptions: true,
        placeholder: 'Select city',
      },
      {
        name: 'address.nameOnAddress' as Path<AddressableFormValues>,
        label: 'Name on Address',
        type: FieldType.Text as FieldType,
        disabled,
        gridSize: {
          xs: 12,
          sm: 6,
        },
        placeholder: 'Full name (optional)',
      },
      {
        name: 'address.emailOnAddress' as Path<AddressableFormValues>,
        label: 'Email on Address',
        type: FieldType.Email as FieldType,
        disabled,
        gridSize: {
          xs: 12,
          sm: 6,
        },
        placeholder: 'email@example.com (optional)',
      },
      {
        name: 'address.phoneOnAddress' as Path<AddressableFormValues>,
        label: 'Phone on Address',
        type: FieldType.Phone as FieldType,
        disabled,
        gridSize: {
          xs: 12,
          sm: 6,
        },
        placeholder: '(555) 123-4567 (optional)',
      },
    ]

    return fields as unknown as Array<FieldConfig<TFieldValues>>
  }, [baseCityFieldPath, baseStateFieldPath, cityOptions, disabled, isCityDisabled, stateOptions])

  // Helper to get field error
  const getFieldError = (path: Path<TFieldValues>): { message?: string } | undefined => {
    const segments = (path as string).split('.')
    let current: unknown = formErrors
    for (const segment of segments) {
      if (current && typeof current === 'object' && segment in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[segment]
      } else {
        return undefined
      }
    }
    if (current && typeof current === 'object' && 'message' in (current as Record<string, unknown>)) {
      return current as { message?: string }
    }
    return undefined
  }

  // Render each address field as a Grid item to match the spacing of other sections
  return (
    <>
      {addressFields.map(fieldConfig => {
        const { name, label, type = FieldType.Text, required = false, gridSize, options = [], placeholder } = fieldConfig
        const { sortOptions = false } = fieldConfig
        const fieldError = getFieldError(name)
        const isFieldDisabled = disabled || fieldConfig.disabled

        return (
          <Grid item xs={gridSize?.xs ?? 12} sm={gridSize?.sm ?? 6} key={name as string}>
            <Controller
              name={name}
              control={control}
              render={({ field }) => {
                // Email field
                if (type === FieldType.Email) {
                  return (
                    <EmailInput
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      {...(field as any)}
                      label={label}
                      required={required}
                      disabled={isFieldDisabled}
                      error={!!fieldError}
                      helperText={fieldError?.message}
                      placeholder={placeholder}
                    />
                  )
                }

                // Phone field
                if (type === FieldType.Phone) {
                  return (
                    <PhoneInput
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      {...(field as any)}
                      label={label}
                      required={required}
                      disabled={isFieldDisabled}
                      error={!!fieldError}
                      helperText={fieldError?.message}
                      placeholder={placeholder}
                    />
                  )
                }

                // Select field
                if (type === FieldType.Select) {
                  return (
                    <SelectInput
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      {...(field as any)}
                      label={label}
                      required={required}
                      disabled={isFieldDisabled}
                      error={!!fieldError}
                      helperText={fieldError?.message}
                      options={options}
                      placeholder={placeholder}
                    />
                  )
                }

                // Autocomplete/Dropdown field
                if (type === FieldType.Autocomplete) {
                  return (
                    <AutocompleteInput
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      {...(field as any)}
                      label={label}
                      required={required}
                      disabled={isFieldDisabled}
                      error={!!fieldError}
                      helperText={fieldError?.message}
                      options={options}
                      sortOptions={sortOptions}
                      placeholder={placeholder}
                    />
                  )
                }

                // Default: Text field
                return (
                  <TextFieldInput
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    {...(field as any)}
                    type={type}
                    label={label}
                    required={required}
                    disabled={isFieldDisabled}
                    error={!!fieldError}
                    helperText={fieldError?.message}
                    placeholder={placeholder}
                  />
                )
              }}
            />
          </Grid>
        )
      })}
    </>
  )
}

export default AddressFormController
