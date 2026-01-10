import { Box, CircularProgress, InputAdornment } from '@mui/material'

import { Search as SearchIcon } from '@mui/icons-material'

import { BlueButton } from '../../../components/buttons'
import { TextFieldInput } from '../../../components/form-input'
import styles from '../../../styles/PurchaseOrders.module.scss'

/**
 * Props for ProductSearchBar component
 *
 * @property {string} searchQuery - Current search input value (controlled component)
 * @property {boolean} isLoading - Whether a search is currently in progress.
 *   Used to disable search button and show loading spinner.
 * @property {onSearchQueryChange} onSearchQueryChange - Callback invoked when search input changes.
 *   Receives the new search string value.
 * @property {onSearch} onSearch - Callback invoked when search button is clicked or Enter is pressed.
 *   Performs the actual product search.
 * @property {onKeyPress} [onKeyPress] - Optional callback for keyboard events.
 *   Typically used to trigger search on Enter key press.
 */
interface ProductSearchBarProps {
  searchQuery: string
  isLoading: boolean
  onSearchQueryChange: (value: string) => void
  onSearch: () => void
  onKeyPress?: (e: React.KeyboardEvent) => void
}

/**
 * Product Search Bar Component
 *
 * A search input field with integrated search button for the product picker modal.
 * Provides a clean, consistent search interface with:
 * - Search icon on the left
 * - Text input for search query
 * - Search button on the right (disabled when loading or query too short)
 * - Loading spinner in button when searching
 * - Keyboard support (Enter key triggers search)
 *
 * Features:
 * - Minimum 2 characters required to enable search (prevents empty searches)
 * - Visual feedback during loading (spinner replaces button text)
 * - Disabled state when loading or query too short
 * - Full-width responsive design
 *
 * Use Cases:
 * - Product picker modal search
 * - Any component needing product search functionality
 *
 * @param {ProductSearchBarProps} props - Component props
 * @returns {JSX.Element} Rendered search bar
 */
const ProductSearchBar = ({
  searchQuery,
  isLoading,
  onSearchQueryChange,
  onSearch,
  onKeyPress,
}: ProductSearchBarProps): JSX.Element => {
  /**
   * Determine if search button should be disabled.
   *
   * Search is disabled when:
   * - isLoading is true (search in progress)
   * - searchQuery length is less than 2 characters (minimum required)
   *
   * Why minimum 2 characters?
   * - Prevents empty or single-character searches (too broad)
   * - Reduces unnecessary API calls
   * - Improves search quality (more specific queries)
   */
  const isSearchDisabled = isLoading || searchQuery.length < 2

  return (
    <Box className={styles['product-picker__search-container']}>
      <TextFieldInput
        fullWidth
        placeholder="Search by title, UPC, brand, or model..."
        value={searchQuery}
        /**
         * Handle search input change.
         *
         * Updates the search query state in parent component.
         * This is a controlled component - value comes from props.
         */
        onChange={(e) => onSearchQueryChange(e.target.value)}
        /**
         * Handle keyboard events (Enter key).
         *
         * Allows triggering search via Enter key for better UX.
         * onKeyPress callback is optional - parent may handle it differently.
         */
        onKeyDown={onKeyPress}
        className={styles['product-picker__search-input']}
        InputProps={{
          /**
           * Start adornment: Search icon.
           *
           * Provides visual indication that this is a search field.
           * Uses primary blue color (#1976d2) to match application theme.
           */
          startAdornment: (
            <InputAdornment
              position="start"
              className={styles['product-picker__search-adornment']}
            >
              <SearchIcon className={styles['product-picker__search-icon']} />
            </InputAdornment>
          ),
          /**
           * End adornment: Search button with loading state.
           *
           * Shows loading spinner when searching, otherwise shows "Search" text.
           * Button is disabled when loading or query too short.
           */
          endAdornment: (
            <InputAdornment position="end">
              <BlueButton
                variant="contained"
                size="small"
                onClick={onSearch}
                disabled={isSearchDisabled}
              >
                {/**
                 * Show loading spinner or search text.
                 *
                 * When loading: Shows CircularProgress spinner (replaces text)
                 * When not loading: Shows "Search" text
                 *
                 * Why spinner instead of text?
                 * - Clear visual feedback that search is in progress
                 * - Prevents confusion (user knows action is happening)
                 * - Standard UX pattern for async operations
                 */}
                {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Search'}
              </BlueButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  )
}

export default ProductSearchBar
