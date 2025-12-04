import React, { useState, useEffect, useCallback } from 'react'

import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Drafts as EmailOpenIcon, Delete as DeleteIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import {
  Box,
  Card,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Typography,
  Divider,
  IconButton,
  Badge,
  Tooltip,
  CircularProgress,
  Button,
} from '@mui/material'

import messageApi from '../../api/messageApi'
import { type MessageResponseModel } from '../../models/api-models'
import { getCurrentUserId } from '../../utils/auth'

const MESSAGES_PER_PAGE = 25

const MessagesList: React.FC = () => {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<MessageResponseModel[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalMessages, setTotalMessages] = useState(0)
  const [currentEnd, setCurrentEnd] = useState(MESSAGES_PER_PAGE)

  const fetchMessages = useCallback(
    async (isLoadMore = false) => {
      try {
        if (isLoadMore) {
          setLoadingMore(true)
        } else {
          setLoading(true)
        }

        const userId = getCurrentUserId()

        if (!userId) {
          toast.error('User not authenticated')
          setLoading(false)
          return
        }

        const start = isLoadMore ? messages.length : 0
        const end = isLoadMore ? currentEnd + MESSAGES_PER_PAGE : MESSAGES_PER_PAGE

        const response = await messageApi.getMessagesByUserId(userId, start, end)

        if (isLoadMore) {
          // Append new messages to existing ones
          setMessages(prev => [...prev, ...response.data])
          setCurrentEnd(end)
        } else {
          // Initial load
          setMessages(response.data)
          setCurrentEnd(MESSAGES_PER_PAGE)
        }

        setTotalMessages(response.totalItems)
      } catch (error: unknown) {
        const axiosError = error as { response?: { status?: number } }
        if (axiosError.response?.status === 403) {
          toast.error('You do not have permission to view messages. Please contact your administrator.')
        } else {
          toast.error('Failed to fetch messages')
        }
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [messages.length, currentEnd],
  )

  useEffect(() => {
    void fetchMessages(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLoadMore = (): void => {
    void fetchMessages(true)
  }

  const handleMessageClick = async (messageId: number, isRead: boolean): Promise<void> => {
    try {
      const userId = getCurrentUserId()
      if (!userId) {
        toast.error('User not authenticated')
        return
      }

      // Mark as read if unread
      if (!isRead) {
        await messageApi.setMessageReadByUserIdAndMessageId(userId, messageId)

        // Dispatch event to update navbar badge count
        window.dispatchEvent(new CustomEvent('messageRead'))
      }

      // Navigate to view message page
      navigate(`/dashboard/messages/view/${messageId}`)
    } catch {
      // Still navigate even if marking as read fails
      navigate(`/dashboard/messages/view/${messageId}`)
    }
  }

  const handleDeleteMessage = async (messageId: number, event: React.MouseEvent): Promise<void> => {
    event.stopPropagation()
    try {
      await messageApi.deleteMessage(messageId)
      toast.success('Message deleted successfully')
      void fetchMessages()
    } catch {
      toast.error('Failed to delete message')
    }
  }

  const getInitials = (firstName?: string, lastName?: string): string => {
    const first = firstName?.charAt(0) ?? ''
    const last = lastName?.charAt(0) ?? ''
    return `${first}${last}`.toUpperCase()
  }

  const getAvatarColor = (name: string): string => {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a']
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.toLocaleString('default', { month: 'long' })
    const year = date.getFullYear()
    const time = date.toLocaleString('default', { hour: 'numeric',
minute: '2-digit',
hour12: true })

    // Add ordinal suffix
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

  const stripHtml = (html: string): string => {
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const hasMoreMessages = messages.length < totalMessages

  if (loading && messages.length === 0) {
    return (
      <Box className="messages-list__loading">
        <CircularProgress size={60} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading messages...
        </Typography>
      </Box>
    )
  }

  return (
    <Box className="messages-list">
      <Box className="messages-list__container">
        {messages.length === 0 ? (
          <Card className="messages-list__empty">
            <EmailOpenIcon sx={{ fontSize: 80,
color: 'text.disabled',
mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No messages
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
              You don&apos;t have any messages yet
            </Typography>
          </Card>
        ) : (
          <>
            <Card className="messages-list__card">
              <List className="messages-list__list">
                {messages.map((message, index) => (
                  <React.Fragment key={message.messageId}>
                    <ListItem
                      className={`messages-list__item ${!message.isRead ? 'messages-list__item--unread' : ''}`}
                      onClick={() => void handleMessageClick(message.messageId, message.isRead ?? false)}
                      secondaryAction={
                        <Tooltip title="Delete message">
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={e => void handleDeleteMessage(message.messageId, e)}
                            size="small"
                            className="messages-list__delete-btn"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemAvatar>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'top',
horizontal: 'right' }}
                          variant="dot"
                          color="error"
                          invisible={message.isRead}
                        >
                          <Avatar
                            sx={{
                              bgcolor: getAvatarColor(message.createdByUser?.firstName ?? 'U'),
                              width: 48,
                              height: 48,
                            }}
                          >
                            {getInitials(message.createdByUser?.firstName, message.createdByUser?.lastName)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box className="messages-list__item-header">
                            <Typography
                              variant="subtitle1"
                              className="messages-list__item-from"
                              sx={{ fontWeight: message.isRead ? 400 : 600 }}
                            >
                              {message.createdByUser
                                ? `${message.createdByUser.firstName} ${message.createdByUser.lastName}`
                                : 'System'}
                            </Typography>
                            <Box className="messages-list__item-badges">
                              {!message.isRead && <Chip label="New" color="success" size="small" sx={{ mr: 0.5 }} />}
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(message.createdAt)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                        secondary={
                          <Box className="messages-list__item-content">
                            <Typography
                              variant="body2"
                              className="messages-list__item-title"
                              sx={{ fontWeight: message.isRead ? 400 : 600 }}
                            >
                              {message.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" className="messages-list__item-preview">
                              {stripHtml(message.descriptionHtml).substring(0, 100)}
                              {stripHtml(message.descriptionHtml).length > 100 ? '...' : ''}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < messages.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Card>

            {/* Load More Button and Message Counter */}
            <Box className="messages-list__footer">
              <Box className="messages-list__counter">
                <Typography variant="body2" color="text.secondary">
                  Showing <strong>{messages.length}</strong> of <strong>{totalMessages}</strong> messages
                </Typography>
              </Box>

              {hasMoreMessages && (
                <Box className="messages-list__load-more">
                  <Button
                    variant="contained"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    startIcon={loadingMore ? <CircularProgress size={20} /> : <ExpandMoreIcon />}
                    fullWidth
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 500,
                    }}
                  >
                    {loadingMore ? 'Loading...' : 'Load More Messages'}
                  </Button>
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}

export default MessagesList
