import { format } from 'date-fns'

import { Close as CloseIcon, Group as GroupIcon } from '@mui/icons-material'
import { Box, Chip, Dialog, DialogContent, DialogTitle, Grid, IconButton, Paper } from '@mui/material'

import { BodyText, Subheader } from '../../../components/fonts'
import { type UserGroupResponseModel } from '../../../models/api-models'
import styles from '../../../styles/DataGrid.module.scss'

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
const UserGroupsModal = ({ open, onClose, userGroups, userName }: UserGroupsModalProps): JSX.Element => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="md"
    fullWidth
    PaperProps={{
      className: styles['user-groups-modal__dialog-paper'],
      'data-test-id': 'user-groups-modal',
    }}
  >
    <DialogTitle className={styles['user-groups-modal__header']}>
      <Subheader label={`Groups for ${userName}`} />
      <IconButton
        aria-label="close"
        onClick={onClose}
        className={styles['user-groups-modal__close-button']}
        data-test-id="user-groups-modal-close-button"
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>

    <DialogContent className={styles['user-groups-modal__content']}>
      {userGroups.length === 0 ? (
        <Box className={styles['user-groups-modal__empty-state']}>
          <BodyText className={styles['user-groups-modal__empty-text']}>
            This user is not a member of any groups.
          </BodyText>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {userGroups.map(group => (
            <Grid item xs={12} sm={6} key={group.groupId}>
              <Paper
                elevation={2}
                className={styles['user-groups-modal__group-card']}
                data-test-id="user-groups-modal-card"
                data-group-id={group.groupId}
                data-group-name={group.groupName}
                data-created-at={group.createdAt ?? ''}
              >
                <Box className={styles['user-groups-modal__group-card-header']}>
                  <GroupIcon className={styles['user-groups-modal__group-icon']} sx={{ color: 'primary.main' }} />
                  <Subheader label={group.groupName} className={styles['user-groups-modal__group-name']} />
                </Box>

                {group.description && (
                  <BodyText
                    variant="body2"
                    className={styles['user-groups-modal__group-description']}
                  >
                    {group.description}
                  </BodyText>
                )}

                <Box className={styles['user-groups-modal__group-metadata']}>
                  {group.createdAt && (
                    <Chip
                      label={`Created: ${format(new Date(group.createdAt), 'MMM dd, yyyy')}`}
                      size="small"
                      variant="outlined"
                      className={styles['user-groups-modal__metadata-chip']}
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

export default UserGroupsModal
