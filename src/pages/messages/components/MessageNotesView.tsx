import type React from 'react'

import { Box, Divider, Paper } from '@mui/material'

import { BodyText, FieldLabel, Subheader } from '../../../components/fonts'
import commonStyles from '../../../styles/common.module.scss'
import styles from '../Messages.module.scss'

interface MessageNotesViewProps {
  notes?: string
}

/** Read-only notes card for message view mode. */
const MessageNotesView = ({ notes }: MessageNotesViewProps): React.JSX.Element => (
  <Paper className={styles['add-messages-page__section']}>
    <Subheader label="Notes" className={styles['add-messages-page__section-title']} />
    <Divider className={styles['add-messages-page__divider']} />
    <Box className={styles['add-messages-page__divider-spacer']} />
    <FieldLabel>Additional Notes</FieldLabel>
    <Box className={commonStyles['view-notes__container']}>
      <BodyText data-test-id="message-view-notes" className={commonStyles['view-notes__text']}>
        {notes?.trim() ? notes : '—'}
      </BodyText>
    </Box>
  </Paper>
)

export default MessageNotesView
