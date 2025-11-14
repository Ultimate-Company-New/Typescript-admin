import { RouterProvider } from 'react-router-dom'
import router from './routes'
import { DevLogger } from './components/DevLogger'

/**
 * Main App Component
 * Simple and minimal - routing configuration is in routes.tsx
 */
function App() {
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

