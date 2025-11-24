/**
 * Form field types and configurations
 */

export enum FormFieldType {
  TEXT = 'text',
  EMAIL = 'email',
  PHONE = 'phone',
  DATE = 'date',
  SELECT = 'select',
  IMAGE = 'image',
}

export interface FormFieldConfig {
  name: string
  label: string
  type: FormFieldType
  required?: boolean
  disabled?: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  gridSize?: { xs?: number; sm?: number; md?: number; lg?: number }
  helperText?: string
}

export interface FormSection {
  title: string
  subtitle: string
  fields: FormFieldConfig[]
}
