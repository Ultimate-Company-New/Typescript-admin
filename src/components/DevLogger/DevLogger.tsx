import React, { useState, useEffect, useMemo } from 'react'

import { toast } from 'react-toastify'

import {
  BugReport as BugReportIcon,
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
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
  TextField,
  InputAdornment,
  Chip,
} from '@mui/material'
import styles from './DevLogger.module.scss'

export interface ApiLog {
  id: string
  method: string
  url: string
  headers: Record<string, string>
  body?: unknown
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
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!enabled) return

    // Listen for API log events
    const handleApiLog = (event: CustomEvent<ApiLog>): void => {
      const newLog = event.detail

      // Check if bearer token changed
      const bearerToken = newLog.headers['Authorization'] ?? newLog.headers['authorization']
      if (bearerToken && bearerToken !== currentToken) {
        // Token changed, clear logs
        setCurrentToken(bearerToken)
        setLogs([newLog])
        return
      }

      // Add new log at the beginning (keep all logs, no deduplication)
      setLogs(prevLogs => [newLog, ...prevLogs])

      if (!currentToken && bearerToken) {
        setCurrentToken(bearerToken)
      }
    }

    window.addEventListener('api-log', handleApiLog as EventListener)

    return () => {
      window.removeEventListener('api-log', handleApiLog as EventListener)
    }
  }, [enabled, currentToken])

  const handleToggle = (): void => {
    setOpen(!open)
  }

  const handleClose = (): void => {
    if (!isPinned) {
      setOpen(false)
    }
  }

  const handleTogglePin = (): void => {
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

  const handleCopy = (curlCommand: string): void => {
    void navigator.clipboard.writeText(curlCommand)
    toast.success('cURL command copied to clipboard!')
  }

  const handleClearAll = (): void => {
    setLogs([])
    toast.info('All logs cleared')
  }

  const handleDeleteLog = (id: string): void => {
    setLogs(prevLogs => prevLogs.filter(log => log.id !== id))
  }

  // Filter logs based on search query
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs

    const query = searchQuery.toLowerCase()
    return logs.filter(
      log =>
        log.url.toLowerCase().includes(query) ||
        log.method.toLowerCase().includes(query) ||
        log.endpoint.toLowerCase().includes(query),
    )
  }, [logs, searchQuery])

  if (!enabled) return null

  return (
    <>
      {/* Floating Action Button */}
      <Tooltip title="Developer Logger" placement="left">
        <Fab color="secondary" aria-label="developer logger" className={styles['dev-logger__fab']} onClick={handleToggle}>
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
        className={styles['dev-logger__drawer']}
        PaperProps={{
          className: styles['dev-logger__drawer-paper'],
          sx: {
            height: '50vh',
            maxHeight: '50vh',
          },
        }}
        ModalProps={{
          keepMounted: true,
          disablePortal: isPinned,
          hideBackdrop: isPinned,
        }}
        variant={isPinned ? 'persistent' : 'temporary'}
      >
        <Box className={styles['dev-logger__header']}>
          <Box className={styles['dev-logger__header-content']}>
            <BugReportIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Developer Logger</Typography>
            <Badge badgeContent={logs.length} color="error" sx={{ ml: 2 }} />
          </Box>
          <Box>
            <Tooltip title={isPinned ? 'Unpin drawer' : 'Pin drawer (keep open)'}>
              <IconButton
                onClick={handleTogglePin}
                size="small"
                sx={{ mr: 1 }}
                color={isPinned ? 'primary' : 'default'}
              >
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
            <IconButton
              onClick={() => {
                setOpen(false)
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <Divider />

        {/* Search Bar */}
        <Box className={styles['dev-logger__search']}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by URL or method..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearchQuery('')
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Divider />

        <Box className={styles['dev-logger__content']}>
          {logs.length === 0 ? (
            <Box className={styles['dev-logger__empty']}>
              <BugReportIcon
                sx={{
                  fontSize: 64,
                  color: 'text.disabled',
                  mb: 2,
                }}
              />
              <Typography variant="body1" color="text.secondary">
                No API requests logged yet
              </Typography>
              <Typography
                variant="body2"
                color="text.disabled"
                sx={{
                  mt: 1,
                }}
              >
                Make an API call to see it here
              </Typography>
            </Box>
          ) : filteredLogs.length === 0 ? (
            <Box className={styles['dev-logger__empty']}>
              <SearchIcon
                sx={{
                  fontSize: 64,
                  color: 'text.disabled',
                  mb: 2,
                }}
              />
              <Typography variant="body1" color="text.secondary">
                No results found
              </Typography>
              <Typography
                variant="body2"
                color="text.disabled"
                sx={{
                  mt: 1,
                }}
              >
                Try a different search term
              </Typography>
            </Box>
          ) : (
            <List className={styles['dev-logger__list']}>
              {filteredLogs.map((log, index) => (
                <React.Fragment key={log.id}>
                  <ListItem className={styles['dev-logger__list-item']}>
                    <Box className={styles['dev-logger__log-row']}>
                      {/* Method Badge */}
                      <Chip
                        label={log.method}
                        size="small"
                        className={styles['dev-logger__method-chip']}
                        data-method={log.method}
                      />

                      {/* URL */}
                      <Typography variant="body2" className={styles['dev-logger__url']} sx={{ flex: 1, mx: 2 }}>
                        {log.url}
                      </Typography>

                      {/* Timestamp */}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          minWidth: '80px',
                          textAlign: 'right',
                          mr: 1,
                        }}
                      >
                        {log.timestamp.toLocaleTimeString()}
                      </Typography>

                      {/* Actions */}
                      <Box className={styles['dev-logger__actions']}>
                        <Tooltip title="Copy cURL command">
                          <IconButton
                            size="small"
                            onClick={() => {
                              handleCopy(log.curlCommand)
                            }}
                            color="primary"
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => {
                              handleDeleteLog(log.id)
                            }}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < filteredLogs.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Drawer>
    </>
  )
}

export default DevLogger
