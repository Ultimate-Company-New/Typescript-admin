# Test ID Reference for Automation

This document lists all `data-test-id` attributes available for automation testing.

## Login Page (`/login`)

### Form Elements
| Element | data-test-id | Type | Description |
|---------|-------------|------|-------------|
| Email Input | `login-email-input` | TextFieldInput | Email address input field |
| Password Input | `login-password-input` | PasswordInput | Password input field with show/hide toggle |
| Submit Button | `login-submit-button` | BlueButton | Sign in button |
| Forgot Password Link | `login-forgot-password-link` | Link | Navigates to forgot password page |

### Test Example (Playwright)
```typescript
// Navigate to login
await page.goto('http://localhost:3000/login')

// Fill in credentials
await page.getByTestId('login-email-input').fill('test@example.com')
await page.getByTestId('login-password-input').fill('Password123!')

// Submit form
await page.getByTestId('login-submit-button').click()

// Click forgot password
await page.getByTestId('login-forgot-password-link').click()
```

## Forgot Password Page (`/forgot-password`)

### Form Elements
| Element | data-test-id | Type | Description |
|---------|-------------|------|-------------|
| Email Input | `forgot-password-email-input` | TextFieldInput | Email address input field |
| Submit Button | `forgot-password-submit-button` | BlueButton | Send reset email button |
| Back Button | `forgot-password-back-button` | LinkButton | Returns to login page |

### Test Example (Playwright)
```typescript
// Navigate to forgot password
await page.goto('http://localhost:3000/forgot-password')

// Fill in email
await page.getByTestId('forgot-password-email-input').fill('test@example.com')

// Submit form
await page.getByTestId('forgot-password-submit-button').click()

// Go back to login
await page.getByTestId('forgot-password-back-button').click()
```

## Carrier Landing Page (`/carrier-landing`)

### Form Elements
| Element | data-test-id | Type | Description |
|---------|-------------|------|-------------|
| Search Input | `carrier-search-input` | TextFieldInput | Search carriers by name |
| Carrier Card | `carrier-card-{id}` | Card | Individual carrier card (replace {id} with carrier ID) |
| Pagination | `carrier-pagination` | Pagination | Page navigation |

### Test Example (Playwright)
```typescript
// Navigate to carrier landing (after login)
await page.goto('http://localhost:3000/carrier-landing')

// Search for a carrier
await page.getByTestId('carrier-search-input').fill('Carrier Name')

// Click on a specific carrier (replace 123 with actual ID)
await page.getByTestId('carrier-card-123').click()

// Navigate through pages
await page.getByTestId('carrier-pagination').locator('button:has-text("2")').click()
```

## API Endpoints Used

### Login
- **Endpoint**: `POST /api/login/sign-in`
- **Request Body**: 
  ```typescript
  {
    loginName: string,  // email address
    password: string
  }
  ```
- **Response**: `ClientResponseModel[]`

### Password Reset
- **Endpoint**: `POST /api/login/reset-password`
- **Request Body**: 
  ```typescript
  {
    loginName: string  // email address
  }
  ```
- **Response**: `boolean`

### Get Token
- **Endpoint**: `POST /api/login/get-token`
- **Request Body**: 
  ```typescript
  {
    loginName: string,  // email address
    apiKey: string      // carrier's API key
  }
  ```
- **Response**: 
  ```typescript
  {
    token: string,
    expiresIn: number,
    permissions?: string[]
  }
  ```

## Notes for Automation Testing

1. **Wait for API responses**: Both endpoints make async calls to the backend
2. **Toast notifications**: Success/error messages appear as toasts
3. **Button states**: Buttons are disabled during loading states
4. **Form validation**: Client-side validation with Zod before API calls
5. **API URL**: Automatically uses `http://localhost:4433/api` when running on localhost

## Adding More Test IDs

To add test IDs to other components, use the `data-test-id` prop:

```typescript
// For buttons
<BlueButton 
  label="Click Me" 
  data-test-id="my-button-id" 
/>

// For text inputs
<TextFieldInput
  label="Username"
  inputProps={{
    'data-test-id': 'username-input',
  }}
/>

// For password inputs
<PasswordInput
  label="Password"
  inputProps={{
    'data-test-id': 'password-input',
  }}
/>
```

