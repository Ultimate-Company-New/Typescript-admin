import { type ReactNode } from 'react'

import {
    Controller,
    type Control,
    type ControllerRenderProps,
    type FieldErrors,
    type FieldValues,
    type Path,
    type UseFormSetValue,
    type UseFormTrigger,
} from 'react-hook-form'

import { Box, Divider, FormControlLabel, Grid, Paper, Switch } from '@mui/material'

import { FieldType } from '../../constants/appConstants'
import { Subheader } from '../fonts'
import {
    AutocompleteInput,
    DateTimePickerInput,
    EmailInput,
    ImageUploadInput,
    LazyAutocompleteInput,
    PasswordInput,
    PhoneInput,
    SelectInput,
    TextFieldInput,
    type DateTimeValue,
    type LazyFetchFunction,
    type LazyOption,
} from '../form-input'
import RichTextEditor from './RichTextEditor'

import AddressFormController, { type AddressableFormValues } from './AddressFormController'

// Re-export for backwards compatibility
export { FieldType }
export type { LazyFetchFunction, LazyOption }

/**
 * Option type for dropdowns/autocomplete
 */
export interface FieldOption {
  value: string | number
  label: string
}

/**
 * Configuration for a form field
 */
export interface FieldConfig<TFieldValues extends FieldValues = FieldValues> {
  name: Path<TFieldValues>
  label?: string
  type?: FieldType
  required?: boolean
  disabled?: boolean
  gridSize?: {
    xs: number
    sm: number
  }
  // For autocomplete/dropdown fields
  options?: FieldOption[]
  sortOptions?: boolean
  maxHeight?: number
  // For lazy autocomplete fields
  fetchOptions?: LazyFetchFunction
  lazyPageSize?: number
  lazyDebounceMs?: number
  initialOption?: LazyOption
  // For textarea fields
  rows?: number
  placeholder?: string
  // For image upload fields
  imageSize?: number
  maxSizeMB?: number
  onImageChange?: (value: string) => void
  // For address fields
  states?: string[]
  cities?: string[]
  onStateChange?: (state: string) => void
  setValue?: UseFormSetValue<TFieldValues>
  trigger?: UseFormTrigger<TFieldValues>
  // For switch fields
  switchLabel?: string
  switchLabelPlacement?: 'start' | 'end' | 'top' | 'bottom'
  // For datetime fields
  dateTimeLabel?: string
  timezoneLabel?: string
  minDateTime?: Date
  maxDateTime?: Date
  hideTimezone?: boolean
  // For password fields
  autocomplete?: 'current-password' | 'new-password' | 'off'
  modifyFieldProps?: (
    field: ControllerRenderProps<TFieldValues, Path<TFieldValues>>,
  ) => ControllerRenderProps<TFieldValues, Path<TFieldValues>>
  // For custom content (renders instead of standard field)
  customContent?: () => ReactNode
}

/**
 * Configuration for a form section
 */
export interface SectionConfig<TFieldValues extends FieldValues = FieldValues> {
  title: string
  fields: Array<FieldConfig<TFieldValues>>
  customContent?: ReactNode
}

/**
 * Props for FormFieldRenderer
 */
export interface FormFieldRendererProps<TFieldValues extends FieldValues = FieldValues> {
  fields?: Array<FieldConfig<TFieldValues>>
  sections?: Array<SectionConfig<TFieldValues>>
  control: Control<TFieldValues>
  errors: FieldErrors<TFieldValues>
  disabled?: boolean
  isView?: boolean
  sectionClassName?: string
  sectionTitleClassName?: string
  dividerClassName?: string
  dividerSpacerClassName?: string
}

/**
 * FormFieldRenderer - Renders form fields based on configuration
 * Supports: text, email, phone, password (with toggle), number, date, autocomplete, textarea, image
 */
const getFieldError = <TFieldValues extends FieldValues>(
  errors: FieldErrors<TFieldValues> | undefined,
  path: Path<TFieldValues>,
): { message?: string } | undefined => {
  if (!errors) return undefined
  const segments = (path as string).split('.')
  let current: unknown = errors
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

export const FormFieldRenderer = <TFieldValues extends FieldValues = FieldValues>({
  fields,
  sections,
  control,
  errors,
  disabled = false,
  isView = false,
  sectionClassName,
  sectionTitleClassName,
  dividerClassName,
  dividerSpacerClassName,
}: FormFieldRendererProps<TFieldValues>): JSX.Element => {
  const renderField = (fieldConfig: FieldConfig<TFieldValues>): JSX.Element => {
    const {
      name,
      label = '',
      type = FieldType.Text,
      required = false,
      disabled: fieldDisabled = false,
      gridSize = {
        xs: 12,
        sm: 6,
      },
      options = [],
      sortOptions = false,
      maxHeight = undefined,
      fetchOptions,
      lazyPageSize = 10,
      lazyDebounceMs = 300,
      initialOption,
      rows = 4,
      placeholder,
      imageSize = 150,
      maxSizeMB = 5,
      onImageChange,
      states = [],
      cities = [],
      onStateChange,
      setValue,
      trigger,
      switchLabel,
      switchLabelPlacement = 'end',
      dateTimeLabel,
      timezoneLabel,
      minDateTime,
      maxDateTime,
      hideTimezone,
      autocomplete,
      modifyFieldProps,
      customContent,
    } = fieldConfig

    const isFieldDisabled = disabled || fieldDisabled || isView

    // If customContent is provided, render it directly
    if (customContent) {
      return (
        <Grid item xs={gridSize.xs} sm={gridSize.sm} key={name as string}>
          {customContent()}
        </Grid>
      )
    }

    // Address field - render full address form (returns multiple Grid items directly)
    if (type === FieldType.Address) {
      if (!setValue) {
        throw new Error('Address fields require setValue to be provided in the field configuration.')
      }

      const addressControl = control as unknown as Control<AddressableFormValues>
      const addressErrors = errors as FieldErrors<AddressableFormValues>
      const addressSetValue = setValue as unknown as UseFormSetValue<AddressableFormValues>
      const addressTrigger = trigger as unknown as UseFormTrigger<AddressableFormValues>

      return (
        <AddressFormController
          key={name as string}
          control={addressControl}
          errors={addressErrors}
          disabled={isFieldDisabled}
          states={states}
          cities={cities}
          onStateChange={onStateChange}
          setValue={addressSetValue}
          trigger={addressTrigger}
        />
      )
    }

    return (
      <Grid item xs={gridSize.xs} sm={gridSize.sm} key={name as string}>
        <Controller
          name={name}
          control={control}
          render={({ field }) => {
            const fieldError = getFieldError(errors, name)
            const fieldProps = modifyFieldProps ? modifyFieldProps(field) : field

            // Email field
            if (type === FieldType.Email) {
              return (
                <EmailInput
                  {...fieldProps}
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
                  {...fieldProps}
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
                  {...fieldProps}
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
                  {...fieldProps}
                  label={label}
                  required={required}
                  disabled={isFieldDisabled}
                  error={!!fieldError}
                  helperText={fieldError?.message}
                  options={options}
                  sortOptions={sortOptions}
                  maxHeight={maxHeight}
                  placeholder={placeholder}
                />
              )
            }

            // Lazy Autocomplete field (server-side search with pagination)
            if (type === FieldType.LazyAutocomplete) {
              if (!fetchOptions) {
                throw new Error(
                  'LazyAutocomplete fields require fetchOptions to be provided in the field configuration.',
                )
              }

              // Cast value to the expected type for LazyAutocomplete
              const rawValue = fieldProps.value as string | number | null | undefined

              return (
                <LazyAutocompleteInput
                  label={label}
                  required={required}
                  disabled={isFieldDisabled}
                  error={!!fieldError}
                  helperText={fieldError?.message}
                  fetchOptions={fetchOptions}
                  pageSize={lazyPageSize}
                  debounceMs={lazyDebounceMs}
                  maxHeight={maxHeight}
                  initialOption={initialOption}
                  value={rawValue ?? null}
                  onChange={(_event, newValue) => {
                    fieldProps.onChange(newValue?.value ?? '')
                  }}
                  placeholder={placeholder}
                />
              )
            }

            // Date field
            if (type === FieldType.Date) {
              return (
                <TextFieldInput
                  {...fieldProps}
                  type="date"
                  label={label}
                  required={required}
                  disabled={isFieldDisabled}
                  error={!!fieldError}
                  helperText={fieldError?.message}
                  value={fieldProps.value ? new Date(fieldProps.value as string).toISOString().split('T')[0] : ''}
                  onChange={e => {
                    const dateValue = e.target.value ? new Date(e.target.value) : null
                    fieldProps.onChange(dateValue)
                  }}
                />
              )
            }

            // DateTime field with optional timezone
            if (type === FieldType.DateTime) {
              const currentValue = fieldProps.value as DateTimeValue | null
              return (
                <DateTimePickerInput
                  value={currentValue}
                  onChange={(newValue: DateTimeValue) => {
                    fieldProps.onChange(newValue)
                  }}
                  dateTimeLabel={dateTimeLabel ?? label}
                  timezoneLabel={timezoneLabel ?? 'Timezone'}
                  minDateTime={minDateTime}
                  maxDateTime={maxDateTime}
                  hideTimezone={hideTimezone}
                  required={required}
                  disabled={isFieldDisabled}
                  error={!!fieldError}
                  helperText={fieldError?.message}
                />
              )
            }

            // Image Upload field
            if (type === FieldType.Image) {
              return (
                <ImageUploadInput
                  value={fieldProps.value as string}
                  onChange={(value: string) => {
                    fieldProps.onChange(value)
                    if (onImageChange) {
                      onImageChange(value)
                    }
                  }}
                  disabled={isFieldDisabled}
                  size={imageSize}
                  label={label}
                  maxSizeMB={maxSizeMB}
                />
              )
            }

            // Password field (with show/hide toggle)
            if (type === FieldType.Password) {
              return (
                <PasswordInput
                  {...fieldProps}
                  label={label}
                  required={required}
                  disabled={isFieldDisabled}
                  error={!!fieldError}
                  helperText={fieldError?.message}
                  placeholder={placeholder}
                  autocomplete={autocomplete}
                />
              )
            }

            // Switch field (boolean toggle)
            if (type === FieldType.Switch) {
              return (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    minHeight: '56px',
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(fieldProps.value)}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                          fieldProps.onChange(event.target.checked)
                        }}
                        disabled={isFieldDisabled}
                        color="primary"
                      />
                    }
                    label={switchLabel || label}
                    labelPlacement={switchLabelPlacement}
                  />
                </Box>
              )
            }

            // RichText field (rich text editor)
            if (type === FieldType.RichText) {
              return (
                <RichTextEditor
                  label={label}
                  value={(fieldProps.value as string) ?? ''}
                  onChange={fieldProps.onChange}
                  disabled={isFieldDisabled}
                  error={!!fieldError}
                  helperText={fieldError?.message}
                  placeholder={placeholder}
                />
              )
            }

            // Textarea field (multi-line)
            if (type === FieldType.Textarea) {
              return (
                <TextFieldInput
                  {...fieldProps}
                  label={label}
                  required={required}
                  disabled={isFieldDisabled}
                  error={!!fieldError}
                  helperText={fieldError?.message}
                  multiline
                  rows={rows}
                  placeholder={placeholder}
                />
              )
            }

            // Default: Text, Number fields
            // Ensure value is never undefined to prevent uncontrolled->controlled warning
            const isNumberField = type === FieldType.Number
            // For number fields, show empty string when value is 0, undefined, or null
            // This allows users to clear and replace the value instead of appending to 0
            const displayValue = isNumberField
              ? (fieldProps.value === 0 || fieldProps.value == null ? '' : fieldProps.value)
              : (fieldProps.value ?? '')
            return (
              <TextFieldInput
                {...fieldProps}
                value={displayValue}
                onChange={e => {
                  const val = e.target.value
                  if (isNumberField) {
                    // Convert to number for number fields, or 0 if empty
                    const numVal = val === '' ? 0 : Number(val)
                    fieldProps.onChange(isNaN(numVal) ? 0 : numVal)
                  } else {
                    fieldProps.onChange(val)
                  }
                }}
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
  }

  // If sections are provided, render with section structure
  if (sections && sections.length > 0) {
    return (
      <>
        {sections.map(section => (
          <Paper key={section.title} className={sectionClassName}>
            <Subheader label={section.title} className={sectionTitleClassName} />
            <Divider className={dividerClassName} />
            <Box className={dividerSpacerClassName} />

            {section.customContent}

            <Grid container spacing={2}>
              {section.fields.map(fieldConfig => renderField(fieldConfig))}
            </Grid>
          </Paper>
        ))}
      </>
    )
  }

  // Otherwise, render fields directly (backwards compatibility)
  return (
    <Grid container spacing={2}>
      {fields?.map(fieldConfig => renderField(fieldConfig))}
    </Grid>
  )
}

export default FormFieldRenderer
