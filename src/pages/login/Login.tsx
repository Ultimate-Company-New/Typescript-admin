import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Box, Container, Divider, Link, Stack } from '@mui/material'

import { loginApi } from '../../api/loginApi'
import { BlueButton, Header, Logo, PasswordInput, Subheader, TextFieldInput } from '../../components'
import { APP_ROUTES } from '../../constants/routes'
import styles from '../../styles/Login.module.scss'
import { loginSchema, type LoginFormData } from '../../utils/validationSchemas'

/**
 * Login Page Component
 * Features:
 * - Email/Password authentication
 * - Form validation with Zod
 * - Password reset dialog
 * - Toast notifications
 * - React Hook Form for form management
 */
const Login = (): JSX.Element => {
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
      password: '$2a$15$fuFuezuR5bzPmbtT5Lwjme',
    },
  })

  // Handle login submission
  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setIsLoading(true)
    try {
      const clients = await loginApi.signIn({
        loginName: data.email,
        password: data.password,
      })

      toast.success('Login successful!')

      // Store client data and login name for token retrieval
      if (clients.length > 0) {
        localStorage.setItem('clients', JSON.stringify(clients))
        localStorage.setItem('loginName', data.email)

        // Navigate to carrier landing page to select a carrier
        navigate(APP_ROUTES.CLIENT_LANDING)
      } else {
        toast.error('No clients found for this user.')
      }
    } catch {
      // Error is handled by axios interceptor with toast
      // The interceptor will display the specific error message from the API:
      // - "Email and password cannot be null or empty." (400)
      // - "Invalid User Email" (404)
      // - "Please Confirm Your Account first" (401)
      // - "Your account has been locked please reset your password to login" (401)
      // - "Invalid Credentials" (401)
      // - "Due to multiple failed attempts your account has been locked..." (401)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      {/* Sign In Card */}
      <Box className={styles['login-page__card']} sx={{ borderColor: 'divider' }}>
        <Stack spacing={3}>
          {/* Company Logo - Inside card at top */}
          <Box className={styles['login-page__logo-container']}>
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
                      autoComplete: 'username',
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
                    autocomplete="current-password"
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
          <Box textAlign="center" className={styles['login-page__forgot-password-link']}>
            <Link
              component="button"
              variant="body2"
              onClick={() => {
                navigate(APP_ROUTES.FORGOT_PASSWORD)
              }}
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
