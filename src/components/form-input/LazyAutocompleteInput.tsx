import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'

import {
  Autocomplete,
  Box,
  CircularProgress,
  TextField,
  type AutocompleteProps,
  type AutocompleteRenderInputParams,
} from '@mui/material'

import { BodyText, SecondaryFont } from '../fonts'
import styles from '../../styles/FormInput.module.scss'

/**
 * Option type for lazy autocomplete
 */
export interface LazyOption {
  value: string | number
  label: string
}

/**
 * Fetch result from the API
 */
export interface LazyFetchResult {
  options: LazyOption[]
  hasMore: boolean
  totalCount?: number
}

/**
 * Fetch function type for lazy loading
 * @param searchText - The search text to filter options
 * @param start - The start index for pagination
 * @param pageSize - Number of items to fetch
 * @returns Promise with options, hasMore flag, and optional total count
 */
export type LazyFetchFunction = (searchText: string, start: number, pageSize: number) => Promise<LazyFetchResult>

export interface LazyAutocompleteInputProps
  extends Omit<
    AutocompleteProps<LazyOption, false, false, false>,
    'renderInput' | 'options' | 'variant' | 'margin' | 'onInputChange' | 'loading' | 'value'
  > {
  /**
   * Function to fetch options from server
   */
  fetchOptions: LazyFetchFunction
  /**
   * Label for the input field
   */
  label?: string
  /**
   * Input variant
   */
  variant?: 'outlined' | 'filled' | 'standard'
  /**
   * Input margin
   */
  margin?: 'none' | 'dense' | 'normal'
  /**
   * Show error state
   */
  error?: boolean
  /**
   * Helper text to display below input
   */
  helperText?: string
  /**
   * Is field required
   */
  required?: boolean
  /**
   * Is field disabled
   */
  disabled?: boolean
  /**
   * Page size for lazy loading (default: 10)
   */
  pageSize?: number
  /**
   * Debounce delay in ms (default: 300)
   */
  debounceMs?: number
  /**
   * Maximum height of dropdown (default: 300)
   */
  maxHeight?: number
  /**
   * Initial value to display (for edit mode)
   * Use this when you have the full option object (value + label)
   */
  initialOption?: LazyOption
  /**
   * Raw value (just the value, not the full option)
   * Use this when you only have the value and need to display it
   */
  value?: string | number | null
}

/**
 * Lazy Autocomplete Input component with server-side search and pagination
 *
 * Features:
 * - Server-side search with debouncing
 * - Lazy loading with infinite scroll
 * - Fetches batches of 10 items at a time
 * - Loading indicator when fetching more results
 * - Supports filtering by search text (firstName, lastName, loginName)
 */
const LazyAutocompleteInput = forwardRef<HTMLDivElement, LazyAutocompleteInputProps>(
  (
    {
      fetchOptions,
      label,
      variant = 'filled',
      margin = 'normal',
      fullWidth = true,
      error,
      helperText,
      required,
      disabled,
      pageSize = 10,
      debounceMs = 300,
      maxHeight = 300,
      initialOption,
      value,
      onChange,
      ...props
    },
    ref,
  ) => {
    // State
    const [open, setOpen] = useState(false)
    const [options, setOptions] = useState<LazyOption[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false) // Separate state for loading more
    const [inputValue, setInputValue] = useState('')
    const [hasMore, setHasMore] = useState(true)
    const [currentStart, setCurrentStart] = useState(0)

    // Refs for debouncing and tracking
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const listboxRef = useRef<HTMLUListElement | null>(null)
    const isFetchingRef = useRef(false)
    const lastSearchRef = useRef('')

    // Selected option state - use initialOption if provided
    const [selectedOption, setSelectedOption] = useState<LazyOption | null>(initialOption ?? null)

    // Set initial option when it changes (for edit mode)
    useEffect(() => {
      if (initialOption && !selectedOption) {
        setSelectedOption(initialOption)
      }
    }, [initialOption, selectedOption])

    /**
     * Fetch options from server
     */
    const fetchData = useCallback(
      async (searchText: string, start: number, append: boolean = false): Promise<void> => {
        if (isFetchingRef.current) return

        isFetchingRef.current = true

        // Use different loading states for initial load vs loading more
        if (append) {
          setLoadingMore(true)
        } else {
          setLoading(true)
        }

        try {
          const result = await fetchOptions(searchText, start, pageSize)

          if (append) {
            setOptions(prev => {
              // Filter out duplicates
              const existingIds = new Set(prev.map(opt => opt.value))
              const newOptions = result.options.filter(opt => !existingIds.has(opt.value))
              return [...prev, ...newOptions]
            })
          } else {
            setOptions(result.options)
          }

          setHasMore(result.hasMore)
          setCurrentStart(start + result.options.length)
          lastSearchRef.current = searchText
        } catch (fetchError) {
          // eslint-disable-next-line no-console
          console.error('Failed to fetch options:', fetchError)
          if (!append) {
            setOptions([])
          }
          setHasMore(false)
        } finally {
          setLoading(false)
          setLoadingMore(false)
          isFetchingRef.current = false
        }
      },
      [fetchOptions, pageSize],
    )

    /**
     * Handle input change with debouncing
     */
    const handleInputChange = useCallback(
      (_event: React.SyntheticEvent, newInputValue: string, reason: string): void => {
        setInputValue(newInputValue)

        // Don't search on select or clear
        if (reason !== 'input') return

        // Clear previous debounce
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }

        // Debounce the search
        debounceRef.current = setTimeout(() => {
          // Reset pagination and fetch new results
          setCurrentStart(0)
          setHasMore(true)
          void fetchData(newInputValue, 0, false)
        }, debounceMs)
      },
      [debounceMs, fetchData],
    )

    /**
     * Handle scroll to load more
     */
    const handleScroll = useCallback(
      (event: React.UIEvent<HTMLUListElement>): void => {
        const listbox = event.currentTarget
        const { scrollTop, scrollHeight, clientHeight } = listbox

        // Check if scrolled near bottom (within 50px)
        if (scrollHeight - scrollTop - clientHeight < 50 && hasMore && !loading && !loadingMore) {
          void fetchData(lastSearchRef.current, currentStart, true)
        }
      },
      [hasMore, loading, loadingMore, currentStart, fetchData],
    )

    /**
     * Handle dropdown open
     */
    const handleOpen = useCallback((): void => {
      setOpen(true)
      // Fetch initial data when opening
      if (options.length === 0) {
        setCurrentStart(0)
        setHasMore(true)
        void fetchData('', 0, false)
      }
    }, [options.length, fetchData])

    /**
     * Handle dropdown close
     */
    const handleClose = useCallback((): void => {
      setOpen(false)
    }, [])

    /**
     * Handle option selection
     */
    const handleChange = useCallback(
      (
        event: React.SyntheticEvent,
        newValue: LazyOption | null,
        reason: 'selectOption' | 'createOption' | 'removeOption' | 'blur' | 'clear',
        details?: { option: LazyOption } | undefined,
      ): void => {
        setSelectedOption(newValue)

        if (onChange) {
          // Create a synthetic event to match the expected onChange signature
          const syntheticEvent = {
            target: { value: newValue?.value ?? '' },
          } as React.ChangeEvent<HTMLInputElement>

          // Call the original onChange with the value
          onChange(syntheticEvent as unknown as React.SyntheticEvent, newValue, reason, details)
        }
      },
      [onChange],
    )

    // Cleanup debounce on unmount
    useEffect(
      () => () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }
      },
      [],
    )

    // Find selected option from value prop
    useEffect(() => {
      if (value !== undefined && value !== null && value !== '') {
        // If we have a value but no selectedOption, try to find it in options
        const found = options.find(opt => opt.value === value)
        if (found && (!selectedOption || selectedOption.value !== value)) {
          setSelectedOption(found)
        }
      } else if (value === '' || value === null) {
        setSelectedOption(null)
      }
    }, [value, options, selectedOption])

    /**
     * Custom ListboxComponent that includes loading indicator at bottom
     */
    const ListboxComponent = useCallback(
      forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(function ListboxWithLoading(
        listboxProps,
        listboxRefProp,
      ) {
        return (
          <Box component="div" sx={{ position: 'relative' }}>
            <ul
              {...listboxProps}
              ref={node => {
                // Handle both refs
                if (typeof listboxRefProp === 'function') {
                  listboxRefProp(node)
                } else if (listboxRefProp) {
                  listboxRefProp.current = node
                }
                listboxRef.current = node
              }}
              style={{
                ...listboxProps.style,
                maxHeight: `${maxHeight}px`,
                overflow: 'auto',
                padding: 0,
                margin: 0,
              }}
              onScroll={handleScroll}
            />
            {/* Loading more indicator at bottom */}
            {loadingMore && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  py: 1.5,
                  px: 2,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  position: 'sticky',
                  bottom: 0,
                }}
              >
                <CircularProgress size={16} color="primary" />
                <BodyText variant="body2" className={styles['lazy-autocomplete__loading-text']}>
                  Loading more...
                </BodyText>
              </Box>
            )}
            {/* Show "Scroll for more" hint when there are more results */}
            {!loadingMore && hasMore && options.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 0.75,
                  px: 2,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'action.hover',
                }}
              >
                <SecondaryFont className={styles['lazy-autocomplete__hint-text']}>
                  Scroll for more results...
                </SecondaryFont>
              </Box>
            )}
          </Box>
        )
      }),
      [maxHeight, handleScroll, loadingMore, hasMore, options.length],
    )

    return (
      <Autocomplete
        ref={ref}
        open={open}
        onOpen={handleOpen}
        onClose={handleClose}
        options={options}
        value={selectedOption}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onChange={handleChange}
        loading={loading}
        disabled={disabled}
        fullWidth={fullWidth}
        getOptionLabel={(option: LazyOption) => option.label}
        isOptionEqualToValue={(option: LazyOption, val: LazyOption) => option.value === val.value}
        filterOptions={x => x} // Disable client-side filtering (server handles it)
        ListboxComponent={ListboxComponent}
        renderInput={(params: AutocompleteRenderInputParams) => (
          <TextField
            {...params}
            label={label}
            variant={variant}
            margin={margin}
            required={required}
            error={error}
            helperText={helperText}
            className={styles['filled-input']}
            placeholder="Type to search..."
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              ...params.InputProps,
              disableUnderline: true,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        {...props}
      />
    )
  },
)

LazyAutocompleteInput.displayName = 'LazyAutocompleteInput'

export default LazyAutocompleteInput
