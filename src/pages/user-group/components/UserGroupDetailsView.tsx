import { Box, Divider, Grid, Paper } from '@mui/material'

import { BodyText, Subheader } from '../../../components/fonts'
import styles from '../../../styles/UserGroups.module.scss'

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
              <BodyText className={styles['user-group-details-view__label']}>Group Name</BodyText>
              <BodyText className={styles['user-group-details-view__value']}>{name || '—'}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box className={styles['user-group-details-view__field']}>
              <BodyText className={styles['user-group-details-view__label']}>Description</BodyText>
              <BodyText className={styles['user-group-details-view__value']}>{description || '—'}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box className={styles['user-group-details-view__field']}>
              <BodyText className={styles['user-group-details-view__label']}>Notes</BodyText>
              <BodyText className={styles['user-group-details-view__value']}>{notes || '—'}</BodyText>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </>
  )
}

export default UserGroupDetailsView

