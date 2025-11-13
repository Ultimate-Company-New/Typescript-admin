# TypeScript Admin

A modern admin dashboard built with React, TypeScript, and Material UI.

## Tech Stack

- **React 18** - UI library
- **TypeScript 5** - Type safety
- **Material UI 5** - Component library
- **Vite** - Build tool and dev server
- **React Router 6** - Routing
- **ESLint** - Code linting

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will open at `http://localhost:3000`

### Build

Build for production:

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
typescript-admin/
├── src/
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   ├── theme.ts          # Material UI theme configuration
│   └── vite-env.d.ts     # Vite type definitions
├── index.html            # HTML entry point
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── .eslintrc.cjs         # ESLint configuration
```

## Features

- ✅ React 18 with TypeScript
- ✅ Material UI 5 with custom theming
- ✅ Vite for fast development and builds
- ✅ ESLint for code quality
- ✅ React Router 6 for navigation
- ✅ React Hook Form for form management
- ✅ Zod for schema validation
- ✅ Axios for API calls with interceptors
- ✅ React Toastify for notifications
- ✅ Hot Module Replacement (HMR)
- ✅ Path aliases for clean imports

## Project Structure

```
typescript-admin/
├── src/
│   ├── api/                  # API calls and axios configuration
│   │   ├── axiosConfig.ts    # Axios instance with interceptors
│   │   ├── loginApi.ts       # Login API endpoints
│   │   └── index.ts
│   ├── components/           # Reusable components
│   │   ├── buttons/          # Button components (Blue, Red, Link)
│   │   ├── fonts/            # Typography components
│   │   ├── form-input/       # Form input components (Text, Password)
│   │   └── index.ts
│   ├── constants/            # Application constants
│   │   └── routes.ts         # Route path constants
│   ├── layouts/              # Layout components
│   │   └── MainLayout/       # Public pages layout
│   │       ├── MainLayout.tsx
│   │       ├── MainNavbar.tsx
│   │       └── index.ts
│   ├── models/               # TypeScript interfaces
│   │   ├── LoginModels.ts    # Login-related types
│   │   └── index.ts
│   ├── pages/                # Page components
│   │   ├── login/            # Login-related pages
│   │   │   ├── Login.tsx         # Login page
│   │   │   ├── ForgotPassword.tsx # Password reset page
│   │   │   └── index.ts
│   │   ├── Register.tsx      # Registration page
│   │   ├── NotFound.tsx      # 404 page
│   │   └── index.ts
│   ├── utils/                # Utility functions
│   │   └── validationSchemas.ts  # Zod validation schemas
│   ├── App.tsx               # Main app component (minimal)
│   ├── main.tsx              # Entry point with theme
│   └── routes.tsx            # Route configuration
├── .env.example              # Environment variables template
└── ...
```

## Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the API URL in `.env`:
```
VITE_API_BASE_URL=http://localhost:8080/api
```

## Form Validation

The project uses industry-standard validation with Zod:

- **Email**: Valid email format, max 255 characters
- **Password**: 
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (@$!%*?&#)

## Routing

The application uses React Router v6 with a centralized routing configuration:

- **Route Configuration**: `src/routes.tsx` - All routes defined in one place
- **Route Constants**: `src/constants/routes.ts` - Centralized route paths
- **Layouts**: Nested routing with layout components (MainLayout for public pages)
- **Lazy Loading**: Ready for code-splitting when needed

### Current Routes

- `/` - Redirects to login
- `/login` - Login page (hooked to API)
- `/register` - Registration page  
- `/forgot-password` - Password reset page (hooked to API)
- `/carrier-landing` - Carrier selection page (hooked to API)
- `/404` - Not found page
- `*` - Catch-all redirects to 404

## Layouts

### MainLayout
Used for public/unauthenticated pages:
- Login
- Register
- 404

Includes:
- Fixed navigation bar
- Outlet for child routes
- Responsive container

## API Integration

API calls are organized in the `src/api` directory:

- **Axios Instance**: Pre-configured with interceptors for error handling
- **Request Interceptor**: Automatically adds auth tokens
- **Response Interceptor**: Handles errors globally with toast notifications
- **Type Safety**: Full TypeScript support for requests and responses

## Theme System

The app supports light/dark mode:
- Theme preference stored in `localStorage` 
- Accessible via `localStorage.getItem('theme')`
- Automatically applied on app load
- To switch: `localStorage.setItem('theme', 'dark')` or `'light'`

## Dynamic API Configuration

The API URL is automatically configured based on the environment:

- **Localhost**: Automatically uses `http://localhost:4433/api`
- **Production**: Uses `VITE_API_BASE_URL` from `.env`

The Spring API runs on port **4433** for localhost development.

## API Integration Status

### ✅ Hooked Up
- **Login** (`POST /api/login/sign-in`) - Fully integrated
- **Password Reset** (`POST /api/login/reset-password`) - Fully integrated
- **Get Token** (`POST /api/login/get-token`) - Fully integrated (carrier selection)

### Flow
1. User logs in → Receives list of carriers
2. User selects carrier → Gets bearer token (valid 24 hours)
3. Bearer token stored in localStorage → Used for all API calls
4. User redirected to dashboard

### 🔄 Ready for Implementation
- Email confirmation

## Automation Testing

All form elements have `data-test-id` attributes for automation testing.

See [TEST_IDS.md](./TEST_IDS.md) for complete reference of test IDs.

### Example Test IDs:
- Login: `login-email-input`, `login-password-input`, `login-submit-button`
- Forgot Password: `forgot-password-email-input`, `forgot-password-submit-button`
- Carrier Landing: `carrier-search-input`, `carrier-card-{id}`, `carrier-pagination`
