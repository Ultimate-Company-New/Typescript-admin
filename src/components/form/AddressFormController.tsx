import { useEffect, useMemo } from 'react'

import {
  useWatch,
  type Control,
  type FieldErrors,
  type Path,
  type PathValue,
  type UseFormSetValue,
} from 'react-hook-form'

import { Grid } from '@mui/material'

import { ADDRESS_TYPES_ARRAY } from '../../constants/appConstants'

import { FieldType, FormFieldRenderer, type FieldConfig, type FieldOption } from './FormFieldRenderer'

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

interface AddressableFormValues {
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
}

const AddressFormController = <TFieldValues extends AddressableFormValues>({
  control,
  errors,
  disabled = false,
  states = [],
  cities = [],
  onStateChange,
  setValue,
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
      setValue(cityFieldPath, '' as PathValue<TFieldValues, typeof cityFieldPath>, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [cityOptions, cityValue, cityFieldPath, setValue])

  useEffect(() => {
    if (onStateChange) {
      onStateChange(stateValue)
    }
  }, [onStateChange, stateValue])

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
      },
    ]

    return fields as unknown as Array<FieldConfig<TFieldValues>>
  }, [baseCityFieldPath, baseStateFieldPath, cityOptions, disabled, isCityDisabled, stateOptions])

  return (
    <Grid container spacing={2}>
      <FormFieldRenderer fields={addressFields} control={control} errors={formErrors} disabled={disabled} />
    </Grid>
  )
}

export default AddressFormController
