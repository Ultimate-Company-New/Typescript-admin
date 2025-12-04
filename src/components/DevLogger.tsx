import React, { useEffect, useMemo, useState } from 'react'

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
  Badge,
  Box,
  Chip,
  Divider,
  Drawer,
  Fab,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  TextField,
  Tooltip,
} from '@mui/material'

import styles from '../styles/DevLogger.module.scss'

import { BodyText, Header, PrimaryFont } from './fonts'

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
        <Fab
          color="secondary"
          aria-label="developer logger"
          className={styles['dev-logger__fab']}
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
        className={styles['dev-logger__drawer']}
        PaperProps={{
          className: styles['dev-logger__drawer-paper'],
          sx: {
            maxHeight: '50vh',
            height: 'auto',
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
            <BugReportIcon className={styles['dev-logger__header-icon']} />
            <Header label="Developer Logger" variant="h6" className={styles['dev-logger__header-title']} />
            <Badge badgeContent={logs.length} color="error" className={styles['dev-logger__header-badge']} />
          </Box>
          <Box className={styles['dev-logger__header-actions']}>
            <Tooltip title={isPinned ? 'Unpin drawer' : 'Pin drawer (keep open)'}>
              <IconButton
                onClick={handleTogglePin}
                size="small"
                className={styles['dev-logger__header-action-button']}
                color={isPinned ? 'primary' : 'default'}
              >
                {isPinned ? <PushPinIcon /> : <PushPinOutlinedIcon />}
              </IconButton>
            </Tooltip>
            {logs.length > 0 && (
              <Tooltip title="Clear all logs">
                <IconButton
                  onClick={handleClearAll}
                  size="small"
                  className={styles['dev-logger__header-action-button']}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
            <IconButton
              onClick={() => {
                setOpen(false)
              }}
              className={styles['dev-logger__header-close-button']}
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
          {(() => {
            if (logs.length === 0) {
              return (
                <Box className={styles['dev-logger__empty']}>
                  <BugReportIcon className={styles['dev-logger__empty-icon']} />
                  <PrimaryFont text="No API requests logged yet" className={styles['dev-logger__empty-title']} />
                  <BodyText text="Make an API call to see it here" className={styles['dev-logger__empty-subtitle']} />
                </Box>
              )
            }
            if (filteredLogs.length === 0) {
              return (
                <Box className={styles['dev-logger__empty']}>
                  <SearchIcon className={styles['dev-logger__empty-icon']} />
                  <PrimaryFont text="No results found" className={styles['dev-logger__empty-title']} />
                  <BodyText text="Try a different search term" className={styles['dev-logger__empty-subtitle']} />
                </Box>
              )
            }
            return (
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
                        <BodyText text={log.url} className={styles['dev-logger__url']} />

                        {/* Timestamp */}
                        <BodyText
                          text={log.timestamp.toLocaleTimeString()}
                          variant="body2"
                          className={styles['dev-logger__timestamp']}
                        />

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
            )
          })()}
        </Box>
      </Drawer>
    </>
  )
}

export default DevLogger
