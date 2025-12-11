/**
 * Generic Import Template Structure
 * Reusable for any entity type (Users, Groups, Leads, Sales Orders, etc.)
 */

import { format } from 'date-fns'

/**
 * Enum for column data types
 */
export enum ColumnType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  PHONE = 'phone',
  EMAIL = 'email',
  URL = 'url',
  CURRENCY = 'currency',
}

/**
 * Interface for a section in the import template
 * Each section has a category name and an array of field names
 */
export interface TemplateSection {
  category: string
  fields: string[]
}

/**
 * Type for the complete template structure
 */
export type TemplateStructure = TemplateSection[]

/**
 * Configuration for field display in the preview grid
 */
export interface FieldDisplayConfig {
  field: string
  headerName: string
  width?: number
  minWidth?: number
  flex?: number
  hidden?: boolean
  type?: ColumnType
}

/**
 * Helper function to get all field names from the template structure
 */
export const getAllFieldNames = (structure: TemplateStructure): string[] => structure.flatMap(section => section.fields)

/**
 * Helper function to get the total number of columns in the template
 */
export const getTotalColumns = (structure: TemplateStructure): number =>
  structure.reduce((total, section) => total + section.fields.length, 0)

/**
 * Helper function to get field index by field name
 */
export const getFieldIndex = (structure: TemplateStructure, fieldName: string): number => {
  const allFields = getAllFieldNames(structure)
  return allFields.indexOf(fieldName)
}

/**
 * Helper function to get section by field name
 */
export const getSectionByField = (structure: TemplateStructure, fieldName: string): TemplateSection | undefined =>
  structure.find(section => section.fields.includes(fieldName))

/**
 * Get visible fields for preview grid (fields that are not hidden by default)
 */
export const getVisiblePreviewFields = (fieldDisplayConfig: Record<string, FieldDisplayConfig>): string[] =>
  Object.values(fieldDisplayConfig)
    .filter(config => !config.hidden)
    .map(config => config.field)

/**
 * Calculate dynamic column width based on header text length
 * @param headerName - The header text
 * @param minWidth - Minimum width (default: 80)
 * @param maxWidth - Maximum width (default: 300)
 * @param charWidth - Approximate pixels per character (default: 8)
 * @returns Calculated width in pixels
 */
export const calculateColumnWidth = (
  headerName: string,
  minWidth: number = 80,
  maxWidth: number = 300,
  charWidth: number = 8,
): number => {
  // Calculate width based on header length + padding
  const calculatedWidth = headerName.length * charWidth + 40 // 40px for padding and icons
  return Math.min(Math.max(calculatedWidth, minWidth), maxWidth)
}

/**
 * Format phone number to (XXX) XXX-XXXX format
 * @param phone - Raw phone number string
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string | number | null | undefined): string => {
  if (!phone) return ''

  // Remove all non-digit characters
  const cleaned = String(phone).replace(/\D/g, '')

  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }

  // Return as-is if format is unexpected
  return String(phone)
}

/**
 * Format date to "14th Jan 1990" format (matches Users grid)
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return ''

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return String(date)

    return format(dateObj, 'do MMM yyyy')
  } catch {
    return String(date)
  }
}

/**
 * Format datetime to "14th Jan 1990, 2:30 PM" format
 * @param datetime - Datetime string or Date object
 * @returns Formatted datetime string
 */
export const formatDateTime = (datetime: string | Date | null | undefined): string => {
  if (!datetime) return ''

  try {
    const dateObj = typeof datetime === 'string' ? new Date(datetime) : datetime
    if (isNaN(dateObj.getTime())) return String(datetime)

    return format(dateObj, 'do MMM yyyy, h:mm a')
  } catch {
    return String(datetime)
  }
}

/**
 * Format value based on column type
 * @param value - Raw value
 * @param type - Column type
 * @returns Formatted value
 */
export const formatValueByType = (value: unknown, type?: ColumnType): string => {
  if (value === null || value === undefined) return ''

  switch (type) {
    case ColumnType.PHONE:
      return formatPhoneNumber(value as string)
    case ColumnType.DATE:
      return formatDate(value as string)
    case ColumnType.DATETIME:
      return formatDateTime(value as string)
    case ColumnType.BOOLEAN:
      return String(value).toLowerCase() === 'true' ? 'Yes' : 'No'
    case ColumnType.CURRENCY:
      return `₹${Number(value).toFixed(2)}`
    case ColumnType.NUMBER:
      return String(Number(value))
    default:
      return String(value)
  }
}

/**
 * Generate field display config with dynamic widths
 * @param fields - Array of field names
 * @param headerNameMap - Optional map of field names to custom header names
 * @param hiddenFields - Optional array of fields to hide by default
 * @returns Record of field display configurations
 */
export const generateFieldDisplayConfig = (
  fields: string[],
  headerNameMap?: Record<string, string>,
  hiddenFields?: string[],
): Record<string, FieldDisplayConfig> => {
  const config: Record<string, FieldDisplayConfig> = {}

  fields.forEach(field => {
    // Convert camelCase to Title Case for header name
    const defaultHeaderName = field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()

    const headerName = headerNameMap?.[field] ?? defaultHeaderName
    const width = calculateColumnWidth(headerName)

    config[field] = {
      field,
      headerName,
      width,
      hidden: hiddenFields?.includes(field) ?? false,
    }
  })

  return config
}

// ============================================================================
// Excel Row Parser - Dynamic Column Mapping (like Python DataFrame)
// ============================================================================

/**
 * Column index map type - maps field names to their column indices
 */
export type ColumnIndexMap = Map<string, number>

/**
 * Create a column index map from the template structure
 * This builds a mapping like: { 'loginName': 0, 'firstName': 1, ... }
 *
 * @param structure - The template structure defining column order
 * @returns Map of field names to column indices
 */
export const createColumnIndexMap = (structure: TemplateStructure): ColumnIndexMap => {
  const map = new Map<string, number>()
  let index = 0

  structure.forEach(section => {
    section.fields.forEach(field => {
      map.set(field, index)
      index++
    })
  })

  return map
}

/**
 * Create a column index map from the actual Excel header row
 * This allows dynamic mapping based on what's actually in the file
 *
 * @param headerRow - Array of header names from Excel (row 1 - field names)
 * @returns Map of field names to column indices
 */
export const createColumnIndexMapFromHeader = (headerRow: string[]): ColumnIndexMap => {
  const map = new Map<string, number>()

  headerRow.forEach((header, index) => {
    if (header) {
      const trimmedHeader = header.trim()
      if (trimmedHeader) {
        map.set(trimmedHeader, index)
      }
    }
  })

  return map
}

/**
 * Excel Row Parser class - provides DataFrame-like access to Excel row data
 * Access columns by name instead of hardcoded indices
 */
export class ExcelRowParser {
  private columnMap: ColumnIndexMap
  private values: string[]

  constructor(columnMap: ColumnIndexMap, rowValues: Array<string | number | boolean | undefined | null>) {
    this.columnMap = columnMap
    // Convert all values to strings
    this.values = rowValues.map(v => (v != null ? String(v) : ''))
  }

  /**
   * Get string value by field name
   * @param fieldName - The field/column name
   * @param defaultValue - Default value if field is empty or not found
   */
  getString(fieldName: string, defaultValue: string = ''): string {
    const index = this.columnMap.get(fieldName)
    if (index === undefined) return defaultValue
    return this.values[index] || defaultValue
  }

  /**
   * Get number value by field name
   * @param fieldName - The field/column name
   * @param defaultValue - Default value if field is empty or not found
   */
  getNumber(fieldName: string, defaultValue: number = 0): number {
    const strValue = this.getString(fieldName)
    if (!strValue) return defaultValue
    const num = Number(strValue)
    return isNaN(num) ? defaultValue : num
  }

  /**
   * Get boolean value by field name
   * @param fieldName - The field/column name
   * @param defaultValue - Default value if field is empty or not found
   */
  getBoolean(fieldName: string, defaultValue: boolean = false): boolean {
    const strValue = this.getString(fieldName).toLowerCase()
    if (!strValue) return defaultValue
    return strValue === 'true' || strValue === '1' || strValue === 'yes'
  }

  /**
   * Get array of IDs from semicolon-separated string
   * @param fieldName - The field/column name
   */
  getIdArray(fieldName: string): number[] {
    const strValue = this.getString(fieldName)
    if (!strValue) return []
    return strValue
      .split(';')
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id))
  }

  /**
   * Get optional string value (returns undefined if empty)
   * @param fieldName - The field/column name
   */
  getOptionalString(fieldName: string): string | undefined {
    const value = this.getString(fieldName)
    return value || undefined
  }

  /**
   * Check if a field exists in the column map
   * @param fieldName - The field/column name
   */
  hasField(fieldName: string): boolean {
    return this.columnMap.has(fieldName)
  }

  /**
   * Get all available field names
   */
  getFieldNames(): string[] {
    return Array.from(this.columnMap.keys())
  }

  /**
   * Get the raw value at a specific index (fallback for edge cases)
   * @param index - The column index
   */
  getValueAtIndex(index: number): string {
    return this.values[index] || ''
  }
}
