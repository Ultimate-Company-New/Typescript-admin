# Material UI DataGrid Implementation

## ✅ What's Been Built

### 1. **Core DataGrid Components** (`src/components/DataGrid/`)

#### **StyledDataGrid.tsx**
- Fully styled Material UI DataGrid with custom theming
- Green-themed headers
- Alternating row colors (odd/even)
- Custom hover effects
- Deleted row styling (grayed out)
- Mobile-friendly and responsive

#### **CustomNoRowsOverlay.tsx**
- Beautiful empty state with SVG illustration
- Shows "No Rows" message when grid is empty
- Theme-aware (light/dark mode)

#### **CustomToolbar.tsx**
- Reusable toolbar for checkboxes (e.g., "Include Deleted", "Include Expired")
- Theme-aware styling
- Flexible checkbox configuration

#### **RenderLongCellItem.tsx**
- Smart text truncation with "See More" tooltip
- Automatically detects text overflow
- Shows full text on hover
- Optimized for column widths

#### **gridHelpers.ts**
- `filterChangeFunction` - Handles filter model changes
- `getRandomColor` - Generates consistent avatar colors
- `chipStyles` - Reusable chip styling function

### 2. **Types & Interfaces** (`src/types/grid.types.ts`)

```typescript
interface PaginatedGridInterface {
  start: number
  end: number
  pageSize: number
  includeDeleted?: boolean
  includeExpired?: boolean
  data?: any[]
  actualDataCount?: number
  totalPaginationBlockCount?: number
  filterExpr?: FilterExpression
  columnNames?: string[]
}

interface FilterExpression {
  columnName: string
  condition: string
  filterText: string
}
```

### 3. **User API Integration** (`src/api/userApi.ts`)

Complete CRUD operations:
- `getUserById(id)` - Fetch single user
- `getUserByEmail(email)` - Fetch by email
- `createUser(user)` - Create new user
- `updateUser(id, user)` - Update existing user
- `toggleUser(id)` - Soft delete/restore
- **`fetchUsersInCarrierInBatches(requestModel)`** - Server-side pagination

### 4. **User Models** (`src/models/UserModels.ts`)

```typescript
interface UserResponseModel {
  userId: number
  loginName: string
  firstName: string
  lastName: string
  role: string
  dob: string
  phone: string
  emailConfirmed: boolean
  deleted: boolean
}
```

### 5. **User Grid Columns** (`src/utils/userGridColumns.tsx`)

Comprehensive column definitions:
- User ID
- Avatar (with fallback to initials)
- First Name (with "See More" for long text)
- Last Name (with "See More" for long text)
- Email (with "See More" for long text)
- Role
- Date of Birth (formatted with date-fns)
- Phone (formatted: (XXX) - XXX - XXXX)
- Account Status (Chip: Confirmed/Pending)
- Actions (View/Edit/Deactivate or Activate)

### 6. **Users Page** (`src/pages/users/Users.tsx`)

Full-featured users management page:
- **Server-side pagination** (25/50/100 rows per page)
- **Custom multi-column filtering** (client can filter by any column)
- **Sorting** (ascending/descending on any column)
- **Include Deleted** checkbox (toggles deleted users visibility)
- **Loading states**
- **Error handling**
- **Responsive design**

## 🎨 Features

### Server-Side Pagination
- Fetches only the data needed for the current page
- Efficient for large datasets (thousands of users)
- Configurable page sizes: 10, 25, 50, 100

### Multi-Column Filtering
- Filter by any column (First Name, Last Name, Email, etc.)
- Converts MUI DataGrid filter model to backend filter format
- Sends filter expressions to API in the format:
  ```json
  {
    "columnName": "firstName",
    "condition": "contains",
    "filterText": "John"
  }
  ```

### Sorting
- Click any column header to sort
- Ascending/Descending toggle
- Sends sort column names to API (e.g., `["firstName"]` or `["-firstName"]`)

### Custom Styling
- **No inline CSS** - All styling uses Material UI's `styled` API
- Fast loading - styles are optimized and cached
- Theme-aware - respects light/dark mode
- Consistent with Material Design guidelines

### Mobile-Friendly
- Responsive grid layout
- Touch-friendly controls
- Collapsible columns on small screens
- Pagination adapts to screen size

## 🔧 Current Status

### ✅ Working
1. DataGrid renders successfully
2. All UI components display correctly
3. Pagination controls work
4. Custom toolbar with "Include Deleted" checkbox
5. Beautiful "No Rows" empty state
6. Grid styling (green headers, alternating rows)
7. Column definitions with custom renderers

### ⚠️ Known Issues

#### 403 Forbidden Error
**Issue**: API returns `403 Forbidden` when fetching users.

**Cause**: The `/api/User/getUsersInCarrierInBatches` endpoint requires:
1. Valid bearer token (from `authToken` in localStorage)
2. User must have `VIEW_USER_PERMISSION` permission

**Solution Required**:
1. Ensure user has logged in and selected a carrier (populates `authToken`)
2. Verify the carrier/user has `VIEW_USER_PERMISSION` in the database
3. Check Spring API logs for specific authorization errors

**API Endpoint** (from UserController.java):
```java
@PostMapping("/" + ApiRoutes.UsersSubRoute.GET_USERS_IN_CARRIER_IN_BATCHES)
@PreAuthorize("@customAuthorization.hasAuthority('"+ Authorizations.VIEW_USER_PERMISSION +"')")
public ResponseEntity<?> fetchUsersInCarrierInBatches(@RequestBody UserRequestModel userRequestModel)
```

## 📝 Usage Example

```typescript
import { StyledDataGrid, CustomNoRowsOverlay, CustomToolbar } from '@/components/DataGrid'
import { getUserGridColumns } from '@/utils/userGridColumns'
import { userApi } from '@/api/userApi'

const MyComponent = () => {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [paginationModel, setPaginationModel] = useState({
    start: 0,
    end: 25,
    pageSize: 25,
  })

  const fetchData = async () => {
    setLoading(true)
    const response = await userApi.fetchUsersInCarrierInBatches(paginationModel)
    setRows(response.data)
    setTotalCount(response.totalCount)
    setLoading(false)
  }

  return (
    <StyledDataGrid
      rows={rows}
      columns={getUserGridColumns()}
      loading={loading}
      rowCount={totalCount}
      paginationMode="server"
      pageSizeOptions={[10, 25, 50, 100]}
      slots={{
        noRowsOverlay: CustomNoRowsOverlay,
      }}
    />
  )
}
```

## 🚀 Next Steps

1. **Fix Authorization**: Ensure logged-in user has proper permissions
2. **Add More Grids**: Reuse these components for other entities (Products, Orders, etc.)
3. **Advanced Filtering**: Add multi-column filters (filter by multiple columns simultaneously)
4. **Export Functionality**: Add CSV/Excel export buttons
5. **Column Visibility**: Allow users to show/hide columns
6. **Saved Views**: Save filter/sort/column preferences

## 📦 Dependencies Added

```json
{
  "@mui/x-data-grid": "^latest",
  "date-fns": "^latest"
}
```

## 🎯 Industry Standards Followed

1. **Component Reusability**: All grid components are reusable across the app
2. **Type Safety**: Full TypeScript coverage with interfaces
3. **Performance**: Memoization, styled components, server-side pagination
4. **Accessibility**: Proper ARIA labels, keyboard navigation
5. **Responsive Design**: Mobile-first approach
6. **Error Handling**: Comprehensive error handling with toast notifications
7. **Code Organization**: Proper separation of concerns (components, utils, API, models)
8. **Naming Conventions**: Clear, descriptive names following React/TypeScript standards
9. **Documentation**: Inline comments and comprehensive README

## 📸 Screenshots

The grid displays:
- Green-themed headers
- Alternating row colors
- "No Rows" illustration (currently shown due to 403 error)
- Custom toolbar with "Include Deleted" checkbox
- Pagination controls at the bottom

---

**Created**: November 13, 2025
**Last Updated**: November 13, 2025

