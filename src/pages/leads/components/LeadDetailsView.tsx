import { Box, Divider, Grid, Paper } from '@mui/material'

import { BodyText, FieldLabel, Subheader } from '../../../components/fonts'
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
              <FieldLabel>First Name</FieldLabel>
              <BodyText data-test-id="lead-view-first-name" className={styles['lead-details-view__value']}>
                {firstName || '—'}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <FieldLabel>Last Name</FieldLabel>
              <BodyText data-test-id="lead-view-last-name" className={styles['lead-details-view__value']}>
                {lastName || '—'}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <FieldLabel>Email</FieldLabel>
              <BodyText data-test-id="lead-view-email" className={styles['lead-details-view__value']}>
                {email || '—'}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <FieldLabel>Phone</FieldLabel>
              <BodyText data-test-id="lead-view-phone" className={styles['lead-details-view__value']}>
                {formatPhone(phone)}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <FieldLabel>Lead Status</FieldLabel>
              <BodyText data-test-id="lead-view-lead-status" className={styles['lead-details-view__value']}>
                {leadStatus || '—'}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <FieldLabel>Company</FieldLabel>
              <BodyText data-test-id="lead-view-company" className={styles['lead-details-view__value']}>
                {company ?? '—'}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <FieldLabel>Title</FieldLabel>
              <BodyText data-test-id="lead-view-title" className={styles['lead-details-view__value']}>
                {title ?? '—'}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <FieldLabel>Company Size</FieldLabel>
              <BodyText data-test-id="lead-view-company-size" className={styles['lead-details-view__value']}>
                {companySize?.toLocaleString() ?? '—'}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <FieldLabel>Annual Revenue</FieldLabel>
              <BodyText data-test-id="lead-view-annual-revenue" className={styles['lead-details-view__value']}>
                {formatCurrency(annualRevenue)}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <FieldLabel>Website</FieldLabel>
              <BodyText data-test-id="lead-view-website" className={styles['lead-details-view__value']}>
                {website ?? '—'}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <FieldLabel>Fax</FieldLabel>
              <BodyText data-test-id="lead-view-fax" className={styles['lead-details-view__value']}>
                {fax ?? '—'}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['lead-details-view__field']}>
              <FieldLabel>Assigned Agent</FieldLabel>
              <BodyText data-test-id="lead-view-assigned-agent" className={styles['lead-details-view__value']}>
                {assignedAgent ?? '—'}
              </BodyText>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </>
  )
}

export default LeadDetailsView
