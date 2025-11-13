import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Container, Box, Stack } from '@mui/material'
import { toast } from 'react-toastify'

import {
  Header,
  Subheader,
  BodyText,
  TextFieldInput,
  BlueButton,
  LinkButton,
  Logo,
} from '../../components'
import { loginApi } from '../../api/loginApi'
import { passwordResetSchema, PasswordResetFormData } from '../../utils/validationSchemas'
import { APP_ROUTES } from '../../constants/routes'

/**
 * Forgot Password Page Component
 * Allows users to request a password reset email
 */
const ForgotPassword = () => {
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

  const onSubmit = async (data: PasswordResetFormData) => {
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
      console.error('Password reset failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      {/* Password Reset Card */}
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
          {/* Company Logo */}
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
            <Header label="Reset Password" variant="h3" gutterBottom />
            <Subheader label="Enter your email to receive reset instructions" />
          </Box>

          {/* Description */}
          <BodyText 
            text="Please enter your email address. You will receive an email with a temporary password. Use the temporary password to login, then you can reset your password in your account settings." 
          />

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
                onClick={() => navigate(APP_ROUTES.LOGIN)}
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

