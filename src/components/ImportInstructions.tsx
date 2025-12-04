import { Info as InfoIcon } from '@mui/icons-material'
import { Box, Paper } from '@mui/material'

import styles from '../styles/common.module.scss'

import { BodyText } from './fonts'

export interface ImportInstructionsProps {
  instructions?: string[]
  title?: string
}

/**
 * Reusable Import Instructions Component
 * Displays step-by-step import instructions in a styled info panel
 * Used across import pages (Users, Groups, Products, etc.)
 */
const ImportInstructions = ({
  instructions = [
    'Download the template file to see the required format',
    'Fill in your data following the template structure',
    'Upload the file and preview the data',
    'Set the maximum number of records to import',
    'Review and submit the import',
  ],
  title = 'Import Instructions',
}: ImportInstructionsProps): JSX.Element => (
  <Paper className={styles['import-instructions']}>
    <Box className={styles['import-instructions__header']}>
      <InfoIcon color="primary" />
      <BodyText
        text={title}
        variant="body1"
        sx={{
          fontWeight: 600,
          fontSize: '1.25rem',
        }}
      />
    </Box>
    {instructions.map((instruction, index) => (
      <BodyText
        key={`${instruction}-${title}`}
        text={`${index + 1}. ${instruction}`}
        variant="body2"
        color="text.secondary"
        paragraph={index < instructions.length - 1}
      />
    ))}
  </Paper>
)

export default ImportInstructions
