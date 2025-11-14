import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Typography, 
  Box, 
  Chip,
  Paper,
  Grid
} from '@mui/material'
import { 
  Close as CloseIcon,
  Group as GroupIcon 
} from '@mui/icons-material'
import { format } from 'date-fns'
import { UserGroupResponseModel } from '../../models/UserModels'
import '../../styles/DataGridStyles.scss'

interface UserGroupsModalProps {
  open: boolean
  onClose: () => void
  userGroups: UserGroupResponseModel[]
  userName: string
}

/**
 * Modal to display user groups
 * Shows group names, descriptions, and metadata in card format
 */
const UserGroupsModal = ({ open, onClose, userGroups, userName }: UserGroupsModalProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: 'user-groups-modal__dialog-paper'
      }}
    >
      <DialogTitle className="user-groups-modal__header">
        <Typography variant="h6" component="div">
          Groups for {userName}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          className="user-groups-modal__close-button"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className="user-groups-modal__content">
        {userGroups.length === 0 ? (
          <Box className="user-groups-modal__empty-state">
            <Typography variant="body1" color="text.secondary">
              This user is not a member of any groups.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {userGroups.map((group) => (
              <Grid item xs={12} sm={6} key={group.groupId}>
                <Paper 
                  elevation={2}
                  className="user-groups-modal__group-card"
                >
                  <Box className="user-groups-modal__group-card-header">
                    <GroupIcon 
                      className="user-groups-modal__group-icon"
                      sx={{ color: 'primary.main' }}
                    />
                    <Typography 
                      variant="h6" 
                      className="user-groups-modal__group-name"
                    >
                      {group.groupName}
                    </Typography>
                  </Box>
                  
                  {group.description && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      className="user-groups-modal__group-description"
                    >
                      {group.description}
                    </Typography>
                  )}
                  
                  <Box className="user-groups-modal__group-metadata">
                    {group.createdAt && (
                      <Chip
                        label={`Created: ${format(new Date(group.createdAt), 'MMM dd, yyyy')}`}
                        size="small"
                        variant="outlined"
                        className="user-groups-modal__metadata-chip"
                      />
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default UserGroupsModal

