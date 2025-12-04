import type React from 'react'
import { useState, useEffect } from 'react'

import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
} from '@mui/icons-material'
import { Box, Card, CardContent, Typography, Chip, Divider, Button, CircularProgress } from '@mui/material'

import messageApi from '../../api/messageApi'
import { APP_ROUTES } from '../../constants/routes'
import { type MessageResponseModel } from '../../models/api-models'

const ViewMessage: React.FC = () => {
  const { messageId } = useParams<{ messageId: string }>()
  const navigate = useNavigate()
  const [message, setMessage] = useState<MessageResponseModel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMessage = async (): Promise<void> => {
      if (!messageId) {
        toast.error('Message ID not provided')
        navigate(APP_ROUTES.DASHBOARD.MESSAGES_INBOX)
        return
      }

      try {
        setLoading(true)
        const data = await messageApi.getMessageDetailsById(parseInt(messageId))
        setMessage(data)
      } catch {
        toast.error('Failed to load message')
        navigate(APP_ROUTES.DASHBOARD.MESSAGES_INBOX)
      } finally {
        setLoading(false)
      }
    }

    void fetchMessage()
  }, [messageId, navigate])

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.toLocaleString('default', { month: 'long' })
    const year = date.getFullYear()
    const time = date.toLocaleString('default', { hour: 'numeric',
minute: '2-digit',
hour12: true })

    const suffix = (day: number): string => {
      if (day > 3 && day < 21) return 'th'
      switch (day % 10) {
        case 1:
          return 'st'
        case 2:
          return 'nd'
        case 3:
          return 'rd'
        default:
          return 'th'
      }
    }

    return `${day}${suffix(day)} ${month} ${year} ${time}`
  }

  if (loading) {
    return (
      <Box className="view-message__loading">
        <CircularProgress size={60} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading message...
        </Typography>
      </Box>
    )
  }

  if (!message) {
    return null
  }

  return (
    <Box className="view-message">
      <Box className="view-message__container">
        {/* Header with back button */}
        <Box className="view-message__header">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => {
              navigate(APP_ROUTES.DASHBOARD.MESSAGES_INBOX)
            }}
            variant="outlined"
          >
            Back to Messages
          </Button>
        </Box>

        {/* Message Card */}
        <Card className="view-message__card">
          <CardContent>
            {/* Title */}
            <Typography variant="h4" className="view-message__title" gutterBottom>
              {message.title}
            </Typography>

            {/* Meta Information */}
            <Box className="view-message__meta">
              <Box className="view-message__meta-item">
                <PersonIcon fontSize="small" />
                <Typography variant="body2">
                  <strong>From:</strong>{' '}
                  {message.createdByUser
                    ? `${message.createdByUser.firstName} ${message.createdByUser.lastName}`
                    : 'System'}
                </Typography>
              </Box>

              <Box className="view-message__meta-item">
                <CalendarIcon fontSize="small" />
                <Typography variant="body2">
                  <strong>Date:</strong> {formatDate(message.createdAt)}
                </Typography>
              </Box>

              {message.sendAsEmail && (
                <Box className="view-message__meta-item">
                  <EmailIcon fontSize="small" />
                  <Chip label="Sent as Email" size="small" color="primary" />
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Message Content */}
            <Box className="view-message__content" dangerouslySetInnerHTML={{ __html: message.descriptionHtml }} />
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default ViewMessage
