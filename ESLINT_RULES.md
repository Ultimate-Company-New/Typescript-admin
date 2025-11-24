# ESLint Configuration Guide

This project uses a comprehensive ESLint configuration following industry best practices for React-TypeScript development.

## Installation

After updating `package.json`, install dependencies:

```bash
npm install
```

## Key Rules Overview

### TypeScript Rules (Strict Mode)
- **`@typescript-eslint/no-explicit-any`**: Error - Prevents use of `any` type
- **`@typescript-eslint/no-unused-vars`**: Error - Catches unused variables (allows `_` prefix)
- **`@typescript-eslint/no-floating-promises`**: Error - Ensures promises are handled
- **`@typescript-eslint/no-unsafe-*`**: Error - Prevents unsafe type operations
- **`@typescript-eslint/consistent-type-imports`**: Error - Enforces type-only imports
- **`@typescript-eslint/prefer-nullish-coalescing`**: Error - Prefers `??` over `||`
- **`@typescript-eslint/prefer-optional-chain`**: Error - Prefers `?.` over `&&`

### React Rules
- **`react/jsx-key`**: Error - Requires keys in lists
- **`react/jsx-boolean-value`**: Error - Enforces `{prop}` over `{prop={true}}`
- **`react/jsx-curly-brace-presence`**: Error - Prevents unnecessary braces
- **`react/jsx-fragments`**: Error - Prefers `<>` over `<React.Fragment>`
- **`react/no-array-index-key`**: Warn - Discourages index as key
- **`react-hooks/exhaustive-deps`**: Error - Ensures all dependencies in hooks

### Code Quality Rules
- **`no-console`**: Warn - Allows only `console.warn` and `console.error`
- **`no-debugger`**: Error - Prevents debugger statements
- **`prefer-const`**: Error - Requires `const` when possible
- **`prefer-arrow-callback`**: Error - Prefers arrow functions
- **`prefer-template`**: Error - Prefers template literals
- **`no-param-reassign`**: Error - Prevents parameter mutation

### Import/Export Rules
- **`import/order`**: Error - Enforces import order (React first, then external, then internal)
- **`import/no-duplicates`**: Error - Prevents duplicate imports
- **`import/no-cycle`**: Error - Prevents circular dependencies (max depth: 3)

### Code Style Rules
- **`semi`**: Error - No semicolons (matches Prettier)
- **`quotes`**: Error - Single quotes preferred
- **`indent`**: Error - 2 spaces
- **`comma-dangle`**: Error - Trailing commas in multiline
- **`max-len`**: Warn - 120 character line limit

## Usage

### Run Linter
```bash
npm run lint
```

### Auto-fix Issues
```bash
npm run lint:fix
```

### Format Code
```bash
npm run format
```

### Check Formatting
```bash
npm run format:check
```

### Type Check
```bash
npm run type-check
```

## IDE Integration

### VS Code
Install these extensions:
- ESLint
- Prettier - Code formatter
- EditorConfig for VS Code

Add to `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

## Common Patterns

### Ignoring Unused Variables
```typescript
// Use underscore prefix
const [_unused, used] = someArray
```

### Type-only Imports
```typescript
// ✅ Correct
import type { User } from './types'
import { fetchUser } from './api'

// ❌ Incorrect
import { User, fetchUser } from './types'
```

### Handling Promises
```typescript
// ✅ Correct
await someAsyncFunction()
void someAsyncFunction() // If you don't need to await

// ❌ Incorrect
someAsyncFunction() // Floating promise
```

## Overrides

Test files have relaxed rules:
- `@typescript-eslint/no-explicit-any`: Off
- `@typescript-eslint/no-unsafe-*`: Off

## Continuous Integration

The lint script uses `--max-warnings 0` to ensure zero warnings in CI/CD pipelines.

