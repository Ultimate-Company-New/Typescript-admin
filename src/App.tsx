import { RouterProvider } from 'react-router-dom'

import { DevLogger } from './components/devlogger'
import router from './routes'

/**
 * Main App Component
 * Simple and minimal - routing configuration is in routes.tsx
 */
function App(): JSX.Element {
  // Enable DevLogger only in development mode
  const isDevelopment = import.meta.env.DEV

  return (
    <>
      <RouterProvider router={router} />
      <DevLogger enabled={isDevelopment} />
    </>
  )
}

export default App
