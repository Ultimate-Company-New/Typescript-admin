import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Typography, 
  Box, 
  Chip,
  Divider,
  Paper
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { UserPermissionInfo } from '../../models/UserModels'
import '../../styles/DataGridStyles.scss'

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
const PermissionsModal = ({ open, onClose, permissions, userName }: PermissionsModalProps) => {
  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.category || 'Uncategorized'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(permission)
    return acc
  }, {} as Record<string, UserPermissionInfo[]>)

  // Sort categories alphabetically
  const sortedCategories = Object.keys(groupedPermissions).sort()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: 'permissions-modal__dialog-paper'
      }}
    >
      <DialogTitle className="permissions-modal__header">
        <Typography variant="h6" component="div">
          Permissions for {userName}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          className="permissions-modal__close-button"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className="permissions-modal__content">
        {permissions.length === 0 ? (
          <Box className="permissions-modal__empty-state">
            <Typography variant="body1" color="text.secondary">
              No permissions assigned to this user.
            </Typography>
          </Box>
        ) : (
          <Box className="permissions-modal__content-box">
            {sortedCategories.map((category, categoryIndex) => (
              <Paper 
                key={category} 
                elevation={1}
                className="permissions-modal__category-paper"
              >
                <Typography 
                  variant="h6" 
                  className="permissions-modal__category-title"
                  sx={{ color: 'primary.main' }}
                >
                  {category}
                </Typography>
                
                <Divider className="permissions-modal__divider" />
                
                <Box className="permissions-modal__permissions-list">
                  {groupedPermissions[category].map((permission, permIndex) => (
                    <Box 
                      key={permission.permissionId}
                      className="permissions-modal__permission-item"
                    >
                      <Box className="permissions-modal__permission-header">
                        <Chip
                          label={permission.permissionCode}
                          size="small"
                          className="permissions-modal__permission-code-chip"
                          sx={{ 
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                            fontWeight: 600,
                            fontFamily: 'monospace'
                          }}
                        />
                        <Typography 
                          variant="subtitle1" 
                          className="permissions-modal__permission-name"
                        >
                          {permission.permissionName}
                        </Typography>
                      </Box>
                      
                      {permission.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          className="permissions-modal__permission-description"
                        >
                          {permission.description}
                        </Typography>
                      )}
                      
                      {permIndex < groupedPermissions[category].length - 1 && (
                        <Divider className="permissions-modal__permission-divider" />
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

