import type React from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  type ButtonProps,
} from '@mui/material'

// ============================================================================
// Confirm Dialog Component
// ============================================================================

export interface ConfirmDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog is closed (either confirmed or cancelled) */
  onClose: () => void
  /** Title of the dialog */
  title: string
  /** Main message/content of the dialog */
  message: string | React.ReactNode
  /** Label for the confirm button */
  confirmLabel?: string
  /** Label for the cancel button */
  cancelLabel?: string
  /** Color of the confirm button */
  confirmColor?: ButtonProps['color']
  /** Color of the cancel button */
  cancelColor?: ButtonProps['color']
  /** Variant of the confirm button */
  confirmVariant?: ButtonProps['variant']
  /** Variant of the cancel button */
  cancelVariant?: ButtonProps['variant']
  /** Whether to show the cancel button (default: true) */
  showCancel?: boolean
  /** Callback when user confirms the action */
  onConfirm: () => void | Promise<void>
  /** Whether the confirm action is in progress (for loading state) */
  loading?: boolean
  /** Whether to auto-focus the confirm button (default: true) */
  autoFocusConfirm?: boolean
  /** Additional props for the Dialog component */
  dialogProps?: Partial<React.ComponentProps<typeof Dialog>>
}

/**
 * Reusable confirmation dialog component
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={dialogOpen}
 *   onClose={() => setDialogOpen(false)}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item? This action cannot be undone."
 *   confirmLabel="Delete"
 *   confirmColor="error"
 *   onConfirm={handleDelete}
 * />
 * ```
 */
export const ConfirmDialog = ({
  open,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'primary',
  cancelColor = 'inherit',
  confirmVariant = 'contained',
  cancelVariant = 'text',
  showCancel = true,
  onConfirm,
  loading = false,
  autoFocusConfirm = true,
  dialogProps,
}: ConfirmDialogProps): JSX.Element => {
  const handleConfirm = async (): Promise<void> => {
    await onConfirm()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      {...dialogProps}
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {typeof message === 'string' ? message : message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        {showCancel && (
          <Button
            onClick={onClose}
            color={cancelColor}
            variant={cancelVariant}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
        )}
        <Button
          onClick={handleConfirm}
          color={confirmColor}
          variant={confirmVariant}
          disabled={loading}
          autoFocus={autoFocusConfirm}
        >
          {loading ? 'Processing...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmDialog







