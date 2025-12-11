import type { FC } from 'react'

import { Close as CloseIcon, Error as ErrorIcon } from '@mui/icons-material'
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material'

import { BodyText, Subheader } from '../fonts'
import styles from '../../styles/DataGrid.module.scss'

/**
 * Props for ErrorDetailsModal
 */
export interface ErrorDetailsModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean
  /**
   * Callback to close the modal
   */
  onClose: () => void
  /**
   * Title of the modal
   */
  title?: string
  /**
   * Array of error messages to display
   */
  errors: string[]
  /**
   * Optional row identifier (e.g., "Row 5")
   */
  rowIdentifier?: string
}

/**
 * Generic Error Details Modal Component
 *
 * Displays a list of validation errors in a modal dialog.
 * Reusable across different pages and contexts.
 *
 * @example
 * ```tsx
 * <ErrorDetailsModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Validation Errors"
 *   errors={['Email is required', 'Phone must be 10-15 digits']}
 *   rowIdentifier="Row 5"
 * />
 * ```
 */
const ErrorDetailsModal: FC<ErrorDetailsModalProps> = ({
  open,
  onClose,
  title = 'Validation Errors',
  errors,
  rowIdentifier,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
    className={styles['error-modal']}
    PaperProps={{
      className: styles['error-modal__paper'],
    }}
  >
    <DialogTitle className={styles['error-modal__title']}>
      <Box className={styles['error-modal__title-content']}>
        <Box className={styles['error-modal__title-icon-wrapper']}>
          <ErrorIcon className={styles['error-modal__title-icon']} />
          <Subheader label={title} />
        </Box>
        <IconButton aria-label="close" onClick={onClose} className={styles['error-modal__close-button']}>
          <CloseIcon />
        </IconButton>
      </Box>
      {rowIdentifier && (
        <BodyText variant="body2" className={styles['error-modal__subtitle']}>
          {rowIdentifier}
        </BodyText>
      )}
    </DialogTitle>
    <DialogContent className={styles['error-modal__content']}>
      <List className={styles['error-modal__list']}>
        {errors.map(error => (
          <ListItem key={error} className={styles['error-modal__list-item']} disableGutters>
            <ListItemText
              primary={error}
              primaryTypographyProps={{
                variant: 'body2',
                className: styles['error-modal__error-text'],
              }}
            />
          </ListItem>
        ))}
      </List>
    </DialogContent>
  </Dialog>
)
export default ErrorDetailsModal
