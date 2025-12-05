import { Close as CloseIcon } from '@mui/icons-material'
import { Box, Chip, Dialog, DialogContent, DialogTitle, Divider, IconButton, Paper, Typography } from '@mui/material'

import { type UserPermissionInfo } from '../../../models/api-models'
import styles from '../../../styles/DataGrid.module.scss'

interface PermissionsModalProps {
  open: boolean
  onClose: () => void
  permissions: UserPermissionInfo[]
  userName: string
}

/**
 * Modal to display user permissions grouped by category
 * Shows permission codes, names, and descriptions in an organized layout
 */
const normalizeTestId = (value?: string): string => (value ?? 'uncategorized').toLowerCase().replace(/[^a-z0-9]+/g, '-')

const PermissionsModal = ({ open, onClose, permissions, userName }: PermissionsModalProps): JSX.Element => {
  // Group permissions by category
  const groupedPermissions = permissions.reduce<Record<string, UserPermissionInfo[]>>((acc, permission) => {
    const category = permission.category ?? 'Uncategorized'
    if (!(category in acc)) {
      acc[category] = []
    }
    acc[category].push(permission)
    return acc
  }, {})

  // Sort categories alphabetically
  const sortedCategories = Object.keys(groupedPermissions).sort()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: styles['permissions-modal__dialog-paper'],
        'data-test-id': 'permissions-modal',
      }}
    >
      <DialogTitle className={styles['permissions-modal__header']}>
        <Typography variant="h6" component="div">
          Permissions for {userName}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          className={styles['permissions-modal__close-button']}
          data-test-id="permissions-modal-close-button"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={styles['permissions-modal__content']}>
        {permissions.length === 0 ? (
          <Box className={styles['permissions-modal__empty-state']}>
            <Typography variant="body1" color="text.secondary">
              No permissions assigned to this user.
            </Typography>
          </Box>
        ) : (
          <Box className={styles['permissions-modal__content-box']}>
            {sortedCategories.map(category => (
              <Paper
                key={category}
                elevation={1}
                className={styles['permissions-modal__category-paper']}
                data-test-id={`permissions-modal-category-${normalizeTestId(category)}`}
              >
                <Typography
                  variant="h6"
                  className={styles['permissions-modal__category-title']}
                  sx={{ color: 'primary.main' }}
                >
                  {category}
                </Typography>

                <Divider className={styles['permissions-modal__divider']} />

                <Box className={styles['permissions-modal__permissions-list']}>
                  {groupedPermissions[category].map((permission, permIndex) => (
                    <Box
                      key={permission.permissionId}
                      className={styles['permissions-modal__permission-item']}
                      data-test-id="permissions-modal-permission-item"
                      data-permission-code={permission.permissionCode}
                      data-permission-name={permission.permissionName}
                      data-permission-description={permission.description ?? ''}
                    >
                      <Box className={styles['permissions-modal__permission-header']}>
                        <Chip
                          label={permission.permissionCode}
                          size="small"
                          className={styles['permissions-modal__permission-code-chip']}
                          sx={{
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            fontWeight: 600,
                            fontFamily: 'monospace',
                          }}
                        />
                        <Typography variant="subtitle1" className={styles['permissions-modal__permission-name']}>
                          {permission.permissionName}
                        </Typography>
                      </Box>

                      {permission.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          className={styles['permissions-modal__permission-description']}
                        >
                          {permission.description}
                        </Typography>
                      )}

                      {permIndex < groupedPermissions[category].length - 1 && (
                        <Divider className={styles['permissions-modal__permission-divider']} />
                      )}
                    </Box>
                  ))}
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default PermissionsModal
