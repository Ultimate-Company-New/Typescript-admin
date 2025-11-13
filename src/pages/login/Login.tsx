import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Container,
  Box,
  Stack,
  Link,
  Divider,
} from '@mui/material'
import { toast } from 'react-toastify'

import {
  Header,
  Subheader,
  TextFieldInput,
  PasswordInput,
  BlueButton,
  Logo,
} from '../../components'
import { loginApi } from '../../api/loginApi'
import { loginSchema, LoginFormData } from '../../utils/validationSchemas'
import { APP_ROUTES } from '../../constants/routes'

/**
 * Login Page Component
 * Features:
 * - Email/Password authentication
 * - Form validation with Zod
 * - Password reset dialog
 * - Toast notifications
 * - React Hook Form for form management
 */
const Login = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  // Login form
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'nahushrai+testuser01@gmail.com',
      password: '$2a$15$.ImzrW1GgRqVPgCO.zokCO',
    },
  })

  // Handle login submission
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const clients = await loginApi.signIn({
        loginName: data.email,
        password: data.password,
      })

      toast.success('Login successful!')
      
      // Store client data and login name for token retrieval
      if (clients && clients.length > 0) {
        localStorage.setItem('clients', JSON.stringify(clients))
        localStorage.setItem('loginName', data.email)
        
        // Navigate to carrier landing page to select a carrier
        navigate(APP_ROUTES.CLIENT_LANDING)
      }
    } catch (error) {
      // Error is handled by axios interceptor with toast
      console.error('Login failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      {/* Sign In Card */}
      <Box
        sx={{
          mt: 8,
          mb: 4,
          p: 4,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          boxShadow: 2,
        }}
      >
        <Stack spacing={3}>
          {/* Company Logo - Inside card at top */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Logo size={100} />
          </Box>

          {/* Header */}
          <Box textAlign="center">
            <Header label="Sign In" variant="h3" gutterBottom />
            <Subheader label="Sign in to the internal platform" />
          </Box>

          <Divider />

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              {/* Email Field */}
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextFieldInput
                    {...field}
                    label="Email Address"
                    placeholder="Enter your email"
                    type="email"
                    required
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={isLoading}
                    inputProps={{
                      'data-test-id': 'login-email-input',
                    }}
                  />
                )}
              />

              {/* Password Field */}
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <PasswordInput
                    {...field}
                    label="Password"
                    placeholder="Enter your password"
                    required
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    disabled={isLoading}
                    inputProps={{
                      'data-test-id': 'login-password-input',
                    }}
                  />
                )}
              />

              {/* Submit Button */}
              <BlueButton
                label={isLoading ? 'Signing In...' : 'Sign In'}
                type="submit"
                fullWidth
                disabled={isLoading}
                data-test-id="login-submit-button"
              />
            </Stack>
          </form>

          {/* Forgot Password Link */}
          <Box textAlign="center" sx={{ mt: 2 }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate(APP_ROUTES.FORGOT_PASSWORD)}
              sx={{ cursor: 'pointer' }}
              data-test-id="login-forgot-password-link"
            >
              Forgot Password?
            </Link>
          </Box>
        </Stack>
      </Box>
    </Container>
  )
}

export default Login

