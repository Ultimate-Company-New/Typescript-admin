import React, { useState, useEffect } from 'react'
import {
  Box,
  Fab,
  Drawer,
  IconButton,
  Typography,
  List,
  ListItem,
  Divider,
  Tooltip,
  Badge,
  Paper,
  Button,
} from '@mui/material'
import {
  BugReport as BugReportIcon,
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import './DevLogger.scss'

export interface ApiLog {
  id: string
  method: string
  url: string
  headers: Record<string, string>
  body?: any
  timestamp: Date
  curlCommand: string
  endpoint: string // Unique identifier for deduplication
}

interface DevLoggerProps {
  enabled?: boolean
}

/**
 * Developer Logger Component
 * 
 * A floating bubble in the bottom-right corner that logs all API requests
 * and provides cURL commands that can be copied and used in Postman.
 * 
 * Features:
 * - Shows all API requests made with current bearer token
 * - Deduplicates requests to the same endpoint (keeps only latest)
 * - Clears logs when bearer token changes
 * - Provides copy-to-clipboard functionality for cURL commands
 * - Badge shows number of logged requests
 */
const DevLogger: React.FC<DevLoggerProps> = ({ enabled = true }) => {
  const [open, setOpen] = useState(false)
  const [logs, setLogs] = useState<ApiLog[]>([])
  const [currentToken, setCurrentToken] = useState<string | null>(null)
  const [isPinned, setIsPinned] = useState(false)

  useEffect(() => {
    if (!enabled) return

    // Listen for API log events
    const handleApiLog = (event: CustomEvent<ApiLog>) => {
      const newLog = event.detail

      // Check if bearer token changed
      const bearerToken = newLog.headers['Authorization'] || newLog.headers['authorization']
      if (bearerToken && bearerToken !== currentToken) {
        // Token changed, clear logs
        setCurrentToken(bearerToken)
        setLogs([newLog])
        return
      }

      // Update logs, removing duplicates for the same endpoint
      setLogs((prevLogs) => {
        // Remove any existing log for this endpoint
        const filteredLogs = prevLogs.filter((log) => log.endpoint !== newLog.endpoint)
        // Add new log at the beginning
        return [newLog, ...filteredLogs]
      })

      if (!currentToken && bearerToken) {
        setCurrentToken(bearerToken)
      }
    }

    window.addEventListener('api-log' as any, handleApiLog)

    return () => {
      window.removeEventListener('api-log' as any, handleApiLog)
    }
  }, [enabled, currentToken])

  const handleToggle = () => {
    setOpen(!open)
  }

  const handleClose = () => {
    if (!isPinned) {
      setOpen(false)
    }
  }

  const handleTogglePin = () => {
    const newPinnedState = !isPinned
    setIsPinned(newPinnedState)
    if (newPinnedState) {
      toast.info('Drawer pinned - it will stay open')
    } else {
      toast.info('Drawer unpinned')
      // Close the drawer when unpinning
      setOpen(false)
    }
  }

  const handleCopy = (curlCommand: string) => {
    navigator.clipboard.writeText(curlCommand)
    toast.success('cURL command copied to clipboard!')
  }

  const handleClearAll = () => {
    setLogs([])
    toast.info('All logs cleared')
  }

  const handleDeleteLog = (id: string) => {
    setLogs((prevLogs) => prevLogs.filter((log) => log.id !== id))
  }

  if (!enabled) return null

  return (
    <>
      {/* Floating Action Button */}
      <Tooltip title="Developer Logger" placement="left">
        <Fab
          color="secondary"
          aria-label="developer logger"
          className="dev-logger__fab"
          onClick={handleToggle}
        >
          <Badge badgeContent={logs.length} color="error" max={99}>
            <BugReportIcon />
          </Badge>
        </Fab>
      </Tooltip>

      {/* Drawer */}
      <Drawer
        anchor="bottom"
        open={open}
        onClose={handleClose}
        className="dev-logger__drawer"
        PaperProps={{
          className: 'dev-logger__drawer-paper',
        }}
        ModalProps={{
          keepMounted: true,
          disablePortal: isPinned,
          hideBackdrop: isPinned,
        }}
        variant={isPinned ? 'persistent' : 'temporary'}
      >
        <Box className="dev-logger__header">
          <Box className="dev-logger__header-content">
            <BugReportIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Developer Logger</Typography>
            <Badge badgeContent={logs.length} color="error" sx={{ ml: 2 }} />
          </Box>
          <Box>
            <Tooltip title={isPinned ? 'Unpin drawer' : 'Pin drawer (keep open)'}>
              <IconButton onClick={handleTogglePin} size="small" sx={{ mr: 1 }} color={isPinned ? 'primary' : 'default'}>
                {isPinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
              </IconButton>
            </Tooltip>
            {logs.length > 0 && (
              <Tooltip title="Clear all logs">
                <IconButton onClick={handleClearAll} size="small" sx={{ mr: 1 }}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        <Box className="dev-logger__content">
          {logs.length === 0 ? (
            <Box className="dev-logger__empty">
              <BugReportIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No API requests logged yet
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                Make an API call to see it here
              </Typography>
            </Box>
          ) : (
            <List className="dev-logger__list">
              {logs.map((log) => (
                <ListItem key={log.id} className="dev-logger__list-item">
                  <Paper className="dev-logger__log-card" elevation={2}>
                      {/* Header */}
                      <Box className="dev-logger__log-header">
                        <Box className="dev-logger__log-method" data-method={log.method}>
                          {log.method}
                        </Box>
                        <Typography variant="body2" className="dev-logger__log-url">
                          {log.url}
                        </Typography>
                        <Tooltip title="Delete this log">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteLog(log.id)}
                            className="dev-logger__delete-btn"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      {/* Timestamp */}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {log.timestamp.toLocaleTimeString()}
                      </Typography>

                      {/* cURL Command */}
                      <Box className="dev-logger__curl-container">
                        <Typography variant="caption" className="dev-logger__curl-label">
                          cURL Command:
                        </Typography>
                        <Paper className="dev-logger__curl-box" variant="outlined">
                          <code className="dev-logger__curl-code">{log.curlCommand}</code>
                        </Paper>
                        <Button
                          size="small"
                          startIcon={<ContentCopyIcon />}
                          onClick={() => handleCopy(log.curlCommand)}
                          className="dev-logger__copy-btn"
                          fullWidth
                        >
                          Copy cURL
                        </Button>
                      </Box>
                    </Paper>
                  </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Drawer>
    </>
  )
}

export default DevLogger

