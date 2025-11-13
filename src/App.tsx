import { RouterProvider } from 'react-router-dom'
import router from './routes'

/**
 * Main App Component
 * Simple and minimal - routing configuration is in routes.tsx
 */
function App() {
  return <RouterProvider router={router} />
}

export default App

