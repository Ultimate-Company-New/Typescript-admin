import type React from 'react'

import { Box, Divider, Grid, Paper } from '@mui/material'

import { BodyText, FieldLabel, Subheader } from '../../../components/fonts'
import commonStyles from '../../../styles/common.module.scss'
import styles from '../Messages.module.scss'

export interface MessageViewFormData {
  title: string
  descriptionHtml: string
  sendAsEmail: boolean
  publishDate?: string
  notes?: string
}

interface MessageDetailsViewProps {
  watchedValues: MessageViewFormData
}

/**
 * Read-only message details for admin view mode (matches package/promo view layout).
 */
const MessageDetailsView = ({ watchedValues }: MessageDetailsViewProps): React.JSX.Element => {
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '—'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return '—'
    }
  }

  const sendAsEmailLabel = watchedValues.sendAsEmail ? 'Yes' : 'No'
  const sendAsEmailBadgeClass = watchedValues.sendAsEmail
    ? styles['message-details-view__badge--yes']
    : styles['message-details-view__badge--no']

  return (
    <>
      <Paper className={styles['add-messages-page__section']}>
        <Subheader label="Message Details" className={styles['add-messages-page__section-title']} />
        <Divider className={styles['add-messages-page__divider']} />
        <Box className={styles['add-messages-page__divider-spacer']} />

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box className={styles['message-details-view__field']}>
              <FieldLabel>Title</FieldLabel>
              <BodyText data-test-id="message-view-title" className={styles['message-details-view__value']}>
                {watchedValues.title || '—'}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box className={styles['message-details-view__field']}>
              <FieldLabel>Description</FieldLabel>
              <Box className={commonStyles['view-notes__container']}>
                <Box
                  data-test-id="message-view-description-html"
                  className={styles['message-details-view__html-content']}
                  dangerouslySetInnerHTML={{ __html: watchedValues.descriptionHtml || '—' }}
                />
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['message-details-view__field']}>
              <FieldLabel>Send As Email</FieldLabel>
              <Box className={styles['message-details-view__badge-wrapper']}>
                <span
                  data-test-id="message-view-send-as-email"
                  className={`${styles['message-details-view__badge']} ${sendAsEmailBadgeClass}`}
                >
                  {sendAsEmailLabel}
                </span>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['message-details-view__field']}>
              <FieldLabel>Publish Date</FieldLabel>
              <BodyText data-test-id="message-view-publish-date" className={styles['message-details-view__value']}>
                {formatDate(watchedValues.publishDate)}
              </BodyText>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </>
  )
}

export default MessageDetailsView
