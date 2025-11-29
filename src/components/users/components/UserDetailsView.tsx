import { Avatar, Box, Divider, Grid, Paper } from '@mui/material'

import styles from '../../../styles/Users.module.scss'
import { BodyText, Subheader } from '../../fonts'

interface UserDetailsViewProps {
  profilePictureBase64: string
  firstName: string
  lastName: string
  loginName: string
  phone: string
  role: string
  dob: Date | undefined
  notes?: string
}

/**
 * Read-only view component for displaying user details
 * Used in view mode to show user information in a clean, non-editable format
 */
const UserDetailsView = ({
  profilePictureBase64,
  firstName,
  lastName,
  loginName,
  phone,
  role,
  dob,
  notes,
}: UserDetailsViewProps): JSX.Element => {
  const formatDate = (date: Date | undefined): string => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatPhone = (phoneNumber: string): string => {
    if (!phoneNumber) return '—'
    // Format as (XXX) XXX-XXXX
    const cleaned = phoneNumber.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phoneNumber
  }

  return (
    <>
      {/* Personal Information Section */}
      <Paper className={styles['add-users-page__section']}>
        <Subheader label="Personal Information" className={styles['add-users-page__section-title']} />
        <Divider className={styles['add-users-page__divider']} />
        <Box className={styles['add-users-page__divider-spacer']} />

        <Grid container spacing={3}>
          {/* Profile Picture */}
          <Grid item xs={12} className={styles['add-users-page__profile-picture-wrapper']}>
            <Box className={styles['add-users-page__profile-picture-grid']}>
              <Avatar
                src={(() => {
                  if (!profilePictureBase64) return undefined
                  if (profilePictureBase64.startsWith('http')) return profilePictureBase64
                  return `data:image/png;base64,${profilePictureBase64}`
                })()}
                sx={{
                  width: 150,
                  height: 150,
                  fontSize: '60px',
                }}
                className={styles['add-users-page__avatar']}
              />
            </Box>
          </Grid>

          {/* User Details */}
          <Grid item xs={12} sm={6}>
            <Box className={styles['user-details-view__field']}>
              <BodyText className={styles['user-details-view__label']}>First Name</BodyText>
              <BodyText className={styles['user-details-view__value']}>{firstName || '—'}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['user-details-view__field']}>
              <BodyText className={styles['user-details-view__label']}>Last Name</BodyText>
              <BodyText className={styles['user-details-view__value']}>{lastName || '—'}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['user-details-view__field']}>
              <BodyText className={styles['user-details-view__label']}>Login Name (Email)</BodyText>
              <BodyText className={styles['user-details-view__value']}>{loginName || '—'}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['user-details-view__field']}>
              <BodyText className={styles['user-details-view__label']}>Phone</BodyText>
              <BodyText className={styles['user-details-view__value']}>{formatPhone(phone)}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['user-details-view__field']}>
              <BodyText className={styles['user-details-view__label']}>Role</BodyText>
              <BodyText className={styles['user-details-view__value']}>{role || '—'}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['user-details-view__field']}>
              <BodyText className={styles['user-details-view__label']}>Date of Birth</BodyText>
              <BodyText className={styles['user-details-view__value']}>{formatDate(dob)}</BodyText>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Notes Section */}
      {notes && (
        <Paper className={styles['add-users-page__section']}>
          <Subheader label="Notes" className={styles['add-users-page__section-title']} />
          <Divider className={styles['add-users-page__divider']} />
          <Box className={styles['add-users-page__divider-spacer']} />
          <BodyText className={styles['user-details-view__notes']}>{notes}</BodyText>
        </Paper>
      )}
    </>
  )
}

export default UserDetailsView
