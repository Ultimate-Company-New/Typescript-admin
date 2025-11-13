import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Container, Box, Stack, Divider } from '@mui/material'
import { toast } from 'react-toastify'

import {
  Header,
  Subheader,
  BodyText,
  TextFieldInput,
  PasswordInput,
  BlueButton,
  LinkButton,
} from '../components'
import { registrationSchema, RegistrationFormData } from '../utils/validationSchemas'
import { APP_ROUTES } from '../constants/routes'

/**
 * Registration Page Component
 * Features:
 * - Email/Password registration with validation
 * - Password confirmation
 * - Form validation with Zod
 * - Toast notifications
 */
const Register = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true)
    try {
      // TODO: Implement registration API call
      console.log('Registration data:', data)
      
      toast.success('Registration successful! Please check your email to confirm.')
      
      // Navigate to login or confirmation page
      setTimeout(() => {
        navigate(APP_ROUTES.LOGIN)
      }, 2000)
    } catch (error) {
      console.error('Registration failed:', error)
      toast.error('Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
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
          {/* Header */}
          <Box textAlign="center">
            <Header label="Create Account" variant="h3" gutterBottom />
            <Subheader label="Sign up to get started" />
          </Box>

          <Divider />

          {/* Registration Form */}
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
                    placeholder="Create a strong password"
                    required
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    disabled={isLoading}
                  />
                )}
              />

              {/* Confirm Password Field */}
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <PasswordInput
                    {...field}
                    label="Confirm Password"
                    placeholder="Re-enter your password"
                    required
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    disabled={isLoading}
                  />
                )}
              />

              <Box>
                <BodyText
                  text="Password must contain at least 8 characters, including uppercase, lowercase, number, and special character."
                  variant="body2"
                  color="textSecondary"
                />
              </Box>

              {/* Submit Button */}
              <BlueButton
                label={isLoading ? 'Creating Account...' : 'Create Account'}
                type="submit"
                fullWidth
                disabled={isLoading}
              />
            </Stack>
          </form>

          <Divider>
            <BodyText text="or" />
          </Divider>

          {/* Sign In Link */}
          <Box textAlign="center">
            <LinkButton
              label="Already have an account? Sign In"
              onClick={() => navigate(APP_ROUTES.LOGIN)}
              fullWidth
            />
          </Box>
        </Stack>
      </Box>
    </Container>
  )
}

export default Register

