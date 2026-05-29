import { Box, Divider, Grid, Paper } from '@mui/material'

import { BodyText, FieldLabel, Subheader } from '../../../components/fonts'
import styles from '../../../styles/UserGroups.module.scss'
import commonStyles from '../../../styles/common.module.scss'

interface UserGroupDetailsViewProps {
  name: string
  description: string
  notes?: string
}

/**
 * Read-only view component for displaying user group details
 * Used in view mode to show group information in a clean, non-editable format
 */
const UserGroupDetailsView = ({ name, description, notes }: UserGroupDetailsViewProps): JSX.Element => {
  return (
    <>
      {/* Group Details Section */}
      <Paper className={styles['add-user-groups-page__section']}>
        <Subheader label="Group Details" className={styles['add-user-groups-page__section-title']} />
        <Divider className={styles['add-user-groups-page__divider']} />
        <Box className={styles['add-user-groups-page__divider-spacer']} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Box className={styles['user-group-details-view__field']}>
              <FieldLabel>Group Name</FieldLabel>
              <BodyText data-test-id="user-group-view-name" className={styles['user-group-details-view__value']}>
                {name || '—'}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box className={styles['user-group-details-view__field']}>
              <FieldLabel>Description</FieldLabel>
              <BodyText
                data-test-id="user-group-view-description"
                className={styles['user-group-details-view__value']}
              >
                {description || '—'}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box className={styles['user-group-details-view__field']}>
              <FieldLabel>Additional Notes</FieldLabel>
              <Box className={commonStyles['view-notes__container']}>
                <BodyText data-test-id="user-group-view-notes" className={commonStyles['view-notes__text']}>
                  {notes || '—'}
                </BodyText>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </>
  )
}

export default UserGroupDetailsView

