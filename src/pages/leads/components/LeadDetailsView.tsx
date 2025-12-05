import { Box, Divider, Grid, Paper } from '@mui/material'

import { BodyText, Subheader } from '../../../components/fonts'
import styles from '../../../styles/Leads.module.scss'

interface LeadDetailsViewProps {
  firstName: string
  lastName: string
  email: string
  phone: string
  leadStatus: string
  company?: string
  companySize?: number
  annualRevenue?: string
  title?: string
  website?: string
  fax?: string
  assignedAgent?: string
}

/**
 * Read-only view component for displaying lead details
 * Used in view mode to show lead information in a clean, non-editable format
 */
const LeadDetailsView = ({
  firstName,
  lastName,
  email,
  phone,
  leadStatus,
  company,
  companySize,
  annualRevenue,
  title,
  website,
  fax,
  assignedAgent,
}: LeadDetailsViewProps): JSX.Element => {
  const formatPhone = (phoneNumber: string): string => {
    if (!phoneNumber) return '—'
    // Format as (XXX) XXX-XXXX for 10 digit numbers
    const cleaned = phoneNumber.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phoneNumber
  }

  const formatCurrency = (value: string | undefined): string => {
    if (!value) return '—'
    const num = parseFloat(value)
    if (isNaN(num)) return value
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num)
  }

  return (
    <>
      {/* Lead Information Section */}
      <Paper className={styles['add-leads-page__section']}>
        <Subheader label="Lead Information" className={styles['add-leads-page__section-title']} />
        <Divider className={styles['add-leads-page__divider']} />
        <Box className={styles['add-leads-page__divider-spacer']} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <BodyText className={styles['lead-details-view__label']}>First Name</BodyText>
              <BodyText className={styles['lead-details-view__value']}>{firstName || '—'}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <BodyText className={styles['lead-details-view__label']}>Last Name</BodyText>
              <BodyText className={styles['lead-details-view__value']}>{lastName || '—'}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <BodyText className={styles['lead-details-view__label']}>Email</BodyText>
              <BodyText className={styles['lead-details-view__value']}>{email || '—'}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <BodyText className={styles['lead-details-view__label']}>Phone</BodyText>
              <BodyText className={styles['lead-details-view__value']}>{formatPhone(phone)}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <BodyText className={styles['lead-details-view__label']}>Lead Status</BodyText>
              <BodyText className={styles['lead-details-view__value']}>{leadStatus || '—'}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <BodyText className={styles['lead-details-view__label']}>Company</BodyText>
              <BodyText className={styles['lead-details-view__value']}>{company ?? '—'}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <BodyText className={styles['lead-details-view__label']}>Title</BodyText>
              <BodyText className={styles['lead-details-view__value']}>{title ?? '—'}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <BodyText className={styles['lead-details-view__label']}>Company Size</BodyText>
              <BodyText className={styles['lead-details-view__value']}>{companySize?.toLocaleString() ?? '—'}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <BodyText className={styles['lead-details-view__label']}>Annual Revenue</BodyText>
              <BodyText className={styles['lead-details-view__value']}>{formatCurrency(annualRevenue)}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <BodyText className={styles['lead-details-view__label']}>Website</BodyText>
              <BodyText className={styles['lead-details-view__value']}>{website ?? '—'}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <BodyText className={styles['lead-details-view__label']}>Fax</BodyText>
              <BodyText className={styles['lead-details-view__value']}>{fax ?? '—'}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <BodyText className={styles['lead-details-view__label']}>Assigned Agent</BodyText>
              <BodyText className={styles['lead-details-view__value']}>{assignedAgent ?? '—'}</BodyText>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </>
  )
}

export default LeadDetailsView
