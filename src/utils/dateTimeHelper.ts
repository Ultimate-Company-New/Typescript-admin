import { format, isValid, parseISO } from 'date-fns'

const JACKSON_DATE_ARRAY_PATTERN = /^\d{4},\d{1,2},\d{1,2}/

const parseJacksonDateArray = (parts: number[]): Date | null => {
  if (parts.length < 3) {
    return null
  }
  const [year, month, day, hour = 0, minute = 0, second = 0] = parts
  if ([year, month, day].some(part => typeof part !== 'number' || Number.isNaN(part))) {
    return null
  }
  const date = new Date(year, month - 1, day, hour, minute, second)
  return isValid(date) ? date : null
}

/**
 * Parses date/time values from the Spring API (ISO-8601 strings, epoch numbers,
 * comma-separated Jackson arrays, or {@code LocalDateTime} number arrays).
 */
export const parseApiDateTime = (value: unknown): Date | null => {
  if (value == null || value === '') {
    return null
  }

  if (Array.isArray(value)) {
    return parseJacksonDateArray(value as number[])
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (JACKSON_DATE_ARRAY_PATTERN.test(trimmed)) {
      const parts = trimmed.split(',').map(part => Number(part.trim()))
      const fromArray = parseJacksonDateArray(parts)
      if (fromArray) {
        return fromArray
      }
    }

    const isoParsed = parseISO(trimmed)
    if (isValid(isoParsed)) {
      return isoParsed
    }

    const fallback = new Date(trimmed)
    return isValid(fallback) ? fallback : null
  }

  if (typeof value === 'number') {
    const date = new Date(value)
    return isValid(date) ? date : null
  }

  if (value instanceof Date) {
    return isValid(value) ? value : null
  }

  return null
}

/**
 * Formats an API date/time for display. Returns {@code undefined} when missing or invalid.
 */
export const formatApiDateTime = (
  value: unknown,
  formatString: string = 'MMM dd, yyyy',
): string | undefined => {
  const date = parseApiDateTime(value)
  if (!date) {
    return undefined
  }
  return format(date, formatString)
}

/**
 * Formats an API timestamp for grids/details (optional {@code UTC} suffix).
 */
export const formatApiUtcTimestamp = (
  value: unknown,
  formatString: string = 'MMM dd, yyyy HH:mm',
  emptyText: string = 'Never',
  showUtcSuffix: boolean = true,
): string => {
  const formatted = formatApiDateTime(value, formatString)
  if (!formatted) {
    return emptyText
  }
  return showUtcSuffix ? `${formatted} UTC` : formatted
}

/**
 * Formats an API date without time (grid date-only columns).
 */
export const formatApiDisplayDate = (
  value: unknown,
  formatString: string = 'do MMM yyyy',
  emptyText: string = '—',
): string => {
  return formatApiDateTime(value, formatString) ?? emptyText
}
