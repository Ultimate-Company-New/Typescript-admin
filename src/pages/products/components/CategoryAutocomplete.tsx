import React, { forwardRef, useCallback, useEffect, useState } from 'react';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  Autocomplete,
  Box,
  Breadcrumbs,
  Chip,
  CircularProgress,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
} from '@mui/material';

import { SecondaryFont } from '../../../components/fonts';

import { productCategoryApi, type ProductCategoryWithPath } from '../../../api/productCategoryApi';
import formStyles from '../../../styles/FormInput.module.scss';
import productStyles from '../../../styles/Products.module.scss';

interface CategoryAutocompleteProps {
  value: number;
  onChange: (value: number) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  /** Optional initial selected category name (full path) - used when filling test data */
  initialSelectedCategoryName?: string;
  /** Optional parent ID of the selected category - used to navigate to correct level when opening */
  initialParentId?: number | null;
}

interface NavigationLevel {
  parentId: number | null;
  parentName: string;
  parentPath: string;
}

/**
 * Hierarchical Category Autocomplete Component
 * Drill-down navigation for selecting product categories with breadcrumb trail
 * Features:
 * - Hierarchical drill-down navigation (click to navigate deeper)
 * - Breadcrumb trail showing current path
 * - Arrow indicators (→) for non-leaf categories
 * - "Go Back" option to navigate up one level
 * - Only leaf categories (isEnd=true) can be selected
 * - Loading states for async category fetching
 */
const CategoryAutocomplete: React.FC<CategoryAutocompleteProps> = ({
  value,
  onChange,
  error = false,
  helperText,
  disabled = false,
  required = false,
  initialSelectedCategoryName,
  initialParentId,
}) => {
  const [categories, setCategories] = useState<ProductCategoryWithPath[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [navigationStack, setNavigationStack] = useState<NavigationLevel[]>([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>(initialSelectedCategoryName || '');
  const [open, setOpen] = useState(false);

  // Fetch categories for current level
  const fetchCategories = useCallback(async (parentId: number | null) => {
    setLoading(true);
    try {
      const data = await productCategoryApi.getCategoriesByParentId(parentId);
      setCategories(data);
    } catch {
      // Failed to fetch categories - set empty list
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize with root categories
  useEffect(() => {
    if (open && categories.length === 0 && navigationStack.length === 0) {
      void fetchCategories(null);
    }
  }, [open, fetchCategories, categories.length, navigationStack.length]);

  // Update selectedCategoryName when initialSelectedCategoryName prop changes
  useEffect(() => {
    if (initialSelectedCategoryName) {
      setSelectedCategoryName(initialSelectedCategoryName);
    }
  }, [initialSelectedCategoryName]);

  // Handle drilling down into a category
  const handleDrillDown = useCallback(
    (category: ProductCategoryWithPath) => {
      // Add current level to navigation stack
      setNavigationStack((prev) => [
        ...prev,
        {
          parentId: currentParentId,
          parentName: category.name,
          parentPath: category.fullPath,
        },
      ]);
      setCurrentParentId(category.categoryId);
      void fetchCategories(category.categoryId);
    },
    [currentParentId, fetchCategories],
  );

  // Handle going back one level
  const handleGoBack = useCallback(() => {
    if (navigationStack.length > 0) {
      const previousLevel = navigationStack[navigationStack.length - 1];
      setNavigationStack((prev) => prev.slice(0, -1));
      setCurrentParentId(previousLevel?.parentId ?? null);
      void fetchCategories(previousLevel?.parentId ?? null);
    }
  }, [navigationStack, fetchCategories]);

  // Handle going back to root (when no navigation history but not at root)
  const handleGoToRoot = useCallback(() => {
    setCurrentParentId(null);
    setNavigationStack([]);
    void fetchCategories(null);
  }, [fetchCategories]);

  // Handle leaf category selection
  const handleSelectLeaf = useCallback(
    (category: ProductCategoryWithPath) => {
      onChange(category.categoryId);
      setSelectedCategoryName(category.fullPath);
      setOpen(false);
    },
    [onChange],
  );

  // Reset navigation when opening
  const handleOpen = useCallback(() => {
    setOpen(true);
    // If we have an initial parent ID (from test data), navigate to that level
    if (initialParentId !== undefined && initialParentId !== null && categories.length === 0) {
      setCurrentParentId(initialParentId);
      void fetchCategories(initialParentId);
    } else if (categories.length === 0 && navigationStack.length === 0) {
      // Otherwise fetch root categories
      void fetchCategories(null);
    }
  }, [categories.length, navigationStack.length, fetchCategories, initialParentId]);

  // Build display value from selected category
  const displayValue = selectedCategoryName || (value ? `Category ID: ${value}` : '');

  // Build breadcrumb trail
  const breadcrumbs = navigationStack.map((level) => level.parentName);

  // Create a dummy option to force dropdown to show
  const dummyOptions = ['_placeholder_'];

  return (
    <Autocomplete
      open={open}
      onOpen={handleOpen}
      onClose={() => setOpen(false)}
      options={dummyOptions}
      value={displayValue || undefined}
      inputValue={displayValue}
      disabled={disabled}
      fullWidth
      disableClearable
      getOptionLabel={(option) => (typeof option === 'string' ? displayValue : displayValue)}
      isOptionEqualToValue={() => true}
      filterOptions={(x) => x}
      // Custom list rendering with forwardRef to satisfy MUI Autocomplete requirements
      ListboxComponent={forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLElement>>((props, ref) => (
        <Box {...props} ref={ref} className={productStyles['category-listbox']}>
          {/* Breadcrumb Trail */}
          {navigationStack.length > 0 && (
            <Box className={productStyles['category-breadcrumbs']}>
              <Breadcrumbs separator="›" maxItems={4}>
                {breadcrumbs.map((crumb, index) => (
                  <Chip
                    key={index}
                    label={crumb}
                    size="small"
                    className={productStyles['category-breadcrumb-chip-static']}
                  />
                ))}
              </Breadcrumbs>
            </Box>
          )}

          {/* Go Back Button */}
          {navigationStack.length > 0 && (
            <ListItemButton onClick={handleGoBack} className={productStyles['category-back-button']}>
              <ListItemIcon>
                <ArrowBackIcon />
              </ListItemIcon>
              <ListItemText
                primary="Go Back"
                secondary={`Return to ${navigationStack.length > 1 ? navigationStack[navigationStack.length - 2]?.parentName : 'Root'}`}
              />
            </ListItemButton>
          )}

          {/* Back to Root Button - shown when we're not at root but don't have navigation history */}
          {navigationStack.length === 0 && currentParentId !== null && (
            <ListItemButton onClick={handleGoToRoot} className={productStyles['category-back-button']}>
              <ListItemIcon>
                <ArrowBackIcon />
              </ListItemIcon>
              <ListItemText
                primary="Back to Root"
                secondary="Return to root categories"
              />
            </ListItemButton>
          )}

          {/* Loading State */}
          {loading && (
            <Box className={productStyles['category-loading']}>
              <CircularProgress size={24} />
              <SecondaryFont>Loading categories...</SecondaryFont>
            </Box>
          )}

          {/* Category List */}
          {!loading && categories.length === 0 && (
            <Box className={productStyles['category-empty']}>
              <SecondaryFont>No categories found</SecondaryFont>
            </Box>
          )}

          {!loading &&
            categories.map((category) => {
              // Use isEnd flag from backend to determine if category is leaf (selectable) or non-leaf (drillable)
              // isEnd=true means it's a leaf category (can be selected)
              // isEnd=false means it has children (can be drilled down into)
              const isLeaf = category.isEnd === true;
              const isSelected = category.categoryId === value;

              return (
                <ListItem key={category.categoryId} disablePadding>
                  <ListItemButton
                    onClick={() => {
                      if (isLeaf) {
                        handleSelectLeaf(category);
                      } else {
                        handleDrillDown(category);
                      }
                    }}
                    selected={isSelected}
                    className={productStyles['category-item']}
                  >
                    <ListItemText primary={category.name} />
                    <ListItemIcon className={productStyles['category-item-icon']}>
                      {isSelected ? (
                        <CheckCircleIcon color="primary" />
                      ) : isLeaf ? null : (
                        <ArrowForwardIcon color="action" />
                      )}
                    </ListItemIcon>
                  </ListItemButton>
                </ListItem>
              );
            })}
        </Box>
      ))}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Category"
          variant="filled"
          margin="normal"
          required={required}
          error={error}
          helperText={helperText || 'Navigate through categories to select a leaf category'}
          placeholder="Click to browse categories"
          className={formStyles['filled-input']}
          InputLabelProps={{
            shrink: true,
          }}
          InputProps={{
            ...params.InputProps,
            disableUnderline: true,
          }}
        />
      )}
    />
  );
};

export default CategoryAutocomplete;

