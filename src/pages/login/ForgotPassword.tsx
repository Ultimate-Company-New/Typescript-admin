import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Box, Container, Stack } from '@mui/material'

import { loginApi } from '../../api/loginApi'
import { BlueButton, BodyText, Header, LinkButton, Logo, Subheader, TextFieldInput } from '../../components'
import { APP_ROUTES } from '../../constants/routes'
import styles from '../../styles/Login.module.scss'
import { passwordResetSchema, type PasswordResetFormData } from '../../utils/validationSchemas'

/**
 * Forgot Password Page Component
 * Allows users to request a password reset email
 */
const ForgotPassword = (): JSX.Element => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: PasswordResetFormData): Promise<void> => {
    setIsLoading(true)
    try {
      const success = await loginApi.resetPassword({
        loginName: data.email,
      })

      if (success) {
        toast.success('Password reset email sent! Check your inbox.')
        reset()

        // Navigate back to login after 2 seconds
        setTimeout(() => {
          navigate(APP_ROUTES.LOGIN)
        }, 2000)
      }
    } catch (error) {
      // Error is handled by axios interceptor with toast
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      {/* Password Reset Card */}
      <Box className={styles['login-page__card']} sx={{ borderColor: 'divider' }}>
        <Stack spacing={3}>
          {/* Company Logo */}
          <Box className={styles['login-page__logo-container']}>
            <Logo size={100} />
          </Box>

          {/* Header */}
          <Box textAlign="center">
            <Header label="Reset Password" variant="h3" gutterBottom />
            <Subheader label="Enter your email to receive reset instructions" />
          </Box>

          {/* Description */}
          <BodyText text="Please enter your email address. You will receive an email with a temporary password. Use the temporary password to login, then you can reset your password in your account settings." />

          {/* Reset Form */}
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
                      'data-test-id': 'forgot-password-email-input',
                    }}
                  />
                )}
              />

              {/* Submit Button */}
              <BlueButton
                label={isLoading ? 'Sending...' : 'Send Reset Email'}
                type="submit"
                fullWidth
                disabled={isLoading}
                data-test-id="forgot-password-submit-button"
              />

              {/* Back to Login */}
              <LinkButton
                label="Back to Sign In"
                onClick={() => {
                  navigate(APP_ROUTES.LOGIN)
                }}
                fullWidth
                disabled={isLoading}
                data-test-id="forgot-password-back-button"
              />
            </Stack>
          </form>
        </Stack>
      </Box>
    </Container>
  )
}

export default ForgotPassword
