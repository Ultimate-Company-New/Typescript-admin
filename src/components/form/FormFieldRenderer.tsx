import { type ReactNode } from 'react'

import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type FieldErrors,
  type FieldValues,
  type Path,
  type UseFormSetValue,
} from 'react-hook-form'

import { Box, Divider, Grid, Paper } from '@mui/material'

import { Subheader } from '../fonts'
import {
  AutocompleteInput,
  EmailInput,
  ImageUploadInput,
  PasswordInput,
  PhoneInput,
  SelectInput,
  TextFieldInput,
} from '../form-input'

import AddressFormController from './AddressFormController'
import { FieldType } from './fieldTypes'

// Re-export for backwards compatibility
export { FieldType }

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
  label: string
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
  modifyFieldProps?: (
    field: ControllerRenderProps<TFieldValues, Path<TFieldValues>>,
  ) => ControllerRenderProps<TFieldValues, Path<TFieldValues>>
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
      label,
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
      rows = 4,
      placeholder,
      imageSize = 150,
      maxSizeMB = 5,
      onImageChange,
      states = [],
      cities = [],
      onStateChange,
      setValue,
      modifyFieldProps,
    } = fieldConfig

    const isFieldDisabled = disabled || fieldDisabled || isView

    // Address field - render full address form (returns multiple Grid items directly)
    if (type === FieldType.Address) {
      return (
        <AddressFormController
          key={name as string}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          control={control as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          errors={errors as any}
          disabled={isFieldDisabled}
          states={states}
          cities={cities}
          onStateChange={onStateChange}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setValue={setValue! as any}
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
            return (
              <TextFieldInput
                {...fieldProps}
                type={type}
                label={label}
                required={required}
                disabled={isFieldDisabled}
                error={!!fieldError}
                helperText={fieldError?.message}
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
