import { useEffect, useState } from 'react'

import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Box, CircularProgress, Container, Paper } from '@mui/material'

import axiosInstance from '../../api/axiosConfig'
import { BodyText, Subheader } from '../../components/fonts'
import { APP_ROUTES } from '../../constants/routes'
import styles from '../../styles/Login.module.scss'

/**
 * Email Confirmation Page
 *
 * This page is accessed when users click the confirmation link in their email.
 * It automatically calls the API to confirm the email and redirects to login.
 */
const ConfirmEmail = (): JSX.Element => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('Confirming your email...')

  useEffect(() => {
    const confirmEmail = async (): Promise<void> => {
      try {
        const userId = searchParams.get('userId')
        const token = searchParams.get('token')

        if (!userId || !token) {
          setStatus('error')
          setMessage('Invalid confirmation link. Please check your email and try again.')
          return
        }

        // Call the API to confirm email
        await axiosInstance.post('/Login/confirmEmail', {
          userId: parseInt(userId),
          token: decodeURIComponent(token),
        })

        setStatus('success')
        setMessage('Email confirmed successfully! Redirecting to login...')

        // Show success toast and redirect to login after 2 seconds
        toast.success('Email confirmed successfully! Please log in with your credentials.')
        setTimeout(() => {
          navigate(APP_ROUTES.LOGIN)
        }, 2000)
      } catch (error: unknown) {
        setStatus('error')
        const errorMessage =
          error && typeof error === 'object' && 'response' in error
            ? String((error.response as { data?: { message?: string } }).data?.message ?? 'Failed to confirm email')
            : 'Failed to confirm email'
        setMessage(errorMessage)
        toast.error(errorMessage)
      }
    }

    void confirmEmail()
  }, [searchParams, navigate])

  return (
    <Container maxWidth="sm">
      <Box className={styles['confirm-email__container']}>
        <Paper elevation={3} className={styles['confirm-email__paper']}>
          <Subheader label="Email Confirmation" />

          <Box className={styles['confirm-email__status-container']}>
            {status === 'loading' && <CircularProgress />}
            {status === 'success' && (
              <Box
                className={`${styles['confirm-email__status-icon']} ${styles['confirm-email__status-icon--success']}`}
              >
                ✓
              </Box>
            )}
            {status === 'error' && (
              <Box className={`${styles['confirm-email__status-icon']} ${styles['confirm-email__status-icon--error']}`}>
                ✗
              </Box>
            )}
          </Box>

          <BodyText variant="body1" className={styles['confirm-email__message']}>
            {message}
          </BodyText>

          {status === 'error' && (
            <BodyText
              variant="body2"
              className={styles['confirm-email__login-link']}
              onClick={() => {
                navigate(APP_ROUTES.LOGIN)
              }}
            >
              Go to Login
            </BodyText>
          )}
        </Paper>
      </Box>
    </Container>
  )
}

export default ConfirmEmail
