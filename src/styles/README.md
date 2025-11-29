# Common Styles Module

This directory contains centralized, reusable SCSS styles for consistent UI patterns across the application.

## Purpose

The `common.module.scss` file provides standardized classes for frequently used UI patterns, reducing code duplication and ensuring consistency.

## Usage

### Import in Your Component SCSS

```scss
@import '../../styles/common.module.scss';

// Use common classes with @extend
.my-custom-page {
  @extend .page;

  &__container {
    @extend .page__container;
  }
}

// Or use classes directly in JSX
```

### Use Classes Directly in JSX

```tsx
import commonStyles from '../../styles/common.module.scss'

function MyComponent() {
  return (
    <Container className={commonStyles.page}>
      <Box className={commonStyles['page__container']}>
        <Paper className={commonStyles.card}>{/* Content */}</Paper>
      </Box>
    </Container>
  )
}
```

## Available Style Categories

### 1. **Page Layout Patterns**

- `.page` - Base page wrapper
- `.page__container` - Standard page content container
- `.page__container--reduced-top` - Container with less top padding
- `.page__container--form` - Container optimized for forms

### 2. **Card / Paper Components**

- `.card` - Standard card with shadow
- `.card--elevated` - Card with enhanced shadow
- `.card--rounded` - Card with rounded corners
- `.section` - Content section with title support
- `.section__title` - Section title styling
- `.section__divider` - Section divider
- `.section__divider-spacer` - Additional spacing after dividers

### 3. **DataGrid Container**

- `.grid-container__card` - Card wrapper for DataGrid
- `.grid-container__wrapper` - Grid wrapper with min-height
- `.grid-container__pagination` - Pagination area styling

### 4. **Action Buttons Layout**

- `.actions` - Flex container for action buttons
- `.actions--start` - Left-aligned actions
- `.actions--end` - Right-aligned actions
- `.actions--between` - Space-between actions
- `.actions--padded` - Actions with padding
- `.actions--bordered-top` - Actions with top border
- `.action-button` - Button with standardized styling

### 5. **Form Elements**

- `.form__field` - Full-width form field
- `.form__field-wrapper` - Field wrapper with spacing
- `.form__container` - Form container with gap

### 6. **Info / Alert Boxes**

- `.info-box` - Standard info box
- `.info-box--primary` - Primary-styled info box with left border
- `.info-box--padded` - Info box with extra padding

### 7. **Instructions / Help Sections**

- `.instructions__paper` - Styled instructions container
- `.instructions__header` - Instructions header with icon
- `.instructions__title` - Instructions title

### 8. **Empty States**

- `.empty-state` - Centered empty state container
- `.empty-state__icon` - Large icon for empty state
- `.empty-state--compact` - Smaller empty state

### 9. **Preview / Code Display**

- `.preview__paper` - Preview container
- `.preview__header` - Preview header with divider
- `.code-display__container` - Code block container
- `.code-display__pre` - Preformatted code styling

### 10. **Modal / Dialog Components**

- `.dialog__paper` - Dialog paper with shadow
- `.dialog__paper--simple` - Simpler dialog styling
- `.dialog__header` - Dialog header layout
- `.dialog__close-button` - Close button styling
- `.dialog__content` - Dialog content area
- `.dialog__actions` - Dialog actions footer

### 11. **Floating Action Button (FAB)**

- `.fab` - Base FAB styling
- `.fab--offset-left` - FAB positioned left of another FAB
- `.fab--primary` - Primary colored FAB
- `.fab--secondary` - Secondary colored FAB

### 12. **Utility Classes**

- `.spacer` - Flex spacer
- `.divider` - Standard divider spacing
- `.divider--thin` - Thin divider spacing
- `.divider--thick` - Thick divider spacing
- `.text--center` - Centered text
- `.text--ellipsis` - Text with ellipsis overflow
- `.text--bold` - Bold text
- `.text--uppercase` - Uppercase text with letter spacing
- `.flex` - Flex container
- `.flex--column` - Flex column
- `.flex--row` - Flex row
- `.flex--center` - Centered flex items
- `.flex--gap-small` - 8px gap
- `.flex--gap-medium` - 16px gap
- `.flex--gap-large` - 24px gap
- `.flex--wrap` - Wrapped flex items

### 13. **Row States**

- `.error-row` - Error state for table rows
- `.deleted-row` - Deleted state for table rows

## Dark Mode Support

All common styles include dark mode variants that activate automatically via the `@media (prefers-color-scheme: dark)` query.

## Benefits

✅ **Consistency** - Uniform styling across all pages
✅ **Maintainability** - Update in one place, apply everywhere
✅ **Reduced Code** - No need to rewrite common patterns
✅ **Dark Mode** - Built-in dark mode support
✅ **Responsive** - Mobile-friendly defaults

## Examples

### Example 1: Simple Page Layout

```tsx
import commonStyles from '../../styles/common.module.scss'

function MyPage() {
  return (
    <Container className={commonStyles.page}>
      <Box className={commonStyles['page__container']}>
        <Paper className={commonStyles.card}>
          <Typography>Content</Typography>
        </Paper>
      </Box>
    </Container>
  )
}
```

### Example 2: Form with Actions

```tsx
import commonStyles from '../../styles/common.module.scss'

function MyForm() {
  return (
    <Box className={commonStyles['page__container--form']}>
      <Paper className={commonStyles.section}>
        <Typography className={commonStyles['section__title']}>Form Title</Typography>
        {/* Form fields */}
      </Paper>

      <Paper className={commonStyles.section}>
        <Box className={`${commonStyles.actions} ${commonStyles['actions--end']}`}>
          <Button className={commonStyles['action-button']}>Cancel</Button>
          <Button className={commonStyles['action-button']}>Save</Button>
        </Box>
      </Paper>
    </Box>
  )
}
```

### Example 3: DataGrid with FAB

```tsx
import commonStyles from '../../styles/common.module.scss'

function MyGrid() {
  return (
    <>
      <Container className={commonStyles.page}>
        <Box className={commonStyles['page__container']}>
          <Paper className={commonStyles['grid-container__card']}>
            <DataGrid {...props} />
          </Paper>
        </Box>
      </Container>

      <Fab className={`${commonStyles.fab} ${commonStyles['fab--primary']}`}>
        <AddIcon />
      </Fab>
    </>
  )
}
```

## Migration Guide

When refactoring existing pages to use common styles:

1. **Identify Repetitive Patterns** - Look for similar CSS across files
2. **Check Common Styles** - See if a class already exists
3. **Import and Apply** - Use the common class
4. **Remove Duplicates** - Delete redundant CSS from component files
5. **Test Dark Mode** - Verify dark mode still works

## Contributing

When adding new common styles:

1. **Ensure Reusability** - Only add patterns used in 3+ places
2. **Follow Naming Convention** - Use BEM methodology
3. **Add Dark Mode** - Include dark mode variants
4. **Document Here** - Update this README
5. **Test Thoroughly** - Verify across different components
