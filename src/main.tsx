import React from 'react'

import ReactDOM from 'react-dom/client'
import { ToastContainer } from 'react-toastify'

import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

import 'react-toastify/dist/ReactToastify.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'

// Get theme mode from localStorage
const themeMode = localStorage.getItem('theme')
const theme = createTheme({
  palette: {
    mode: themeMode === 'dark' || themeMode === 'light' ? themeMode : 'light',
  },
})

const rootElement = document.getElementById('root')
if (rootElement == null) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <App />
      </AuthProvider>
      <ToastContainer
        position="top-right"
        autoClose={10000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        data-test-id="toast-container"
      />
    </ThemeProvider>
  </React.StrictMode>,
)
