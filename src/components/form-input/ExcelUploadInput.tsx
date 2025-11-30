import { useCallback, useState } from 'react'

import { toast } from 'react-toastify'

import { CloudUpload as UploadIcon, Delete as DeleteIcon, Description as FileIcon } from '@mui/icons-material'
import { Alert, Box, IconButton, Paper } from '@mui/material'

import styles from '../../styles/FormInput.module.scss'
import { BodyText } from '../fonts'

import { BlueButton } from '../buttons'

export interface ExcelUploadInputProps {
  onFileSelect: (file: File) => void
  onFileClear?: () => void
  accept?: string
  maxSizeMB?: number
  disabled?: boolean
  currentFile?: File | null
  showFileInfo?: boolean
}

/**
 * Reusable Excel/CSV Upload Component
 * Handles file upload with validation for Excel and CSV files
 * Displays file information and provides clear functionality
 */
const ExcelUploadInput = ({
  onFileSelect,
  onFileClear,
  accept = '.csv,.xlsx,.xls',
  maxSizeMB = 10,
  disabled = false,
  currentFile = null,
  showFileInfo = true,
}: ExcelUploadInputProps): JSX.Element => {
  const [uploadInputId] = useState(() => `excel-upload-${Math.random().toString(36).substring(7)}`)

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFile = event.target.files?.[0]
      if (!uploadedFile) return

      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ]
      const validExtensions = ['.csv', '.xlsx', '.xls']
      const hasValidType = validTypes.includes(uploadedFile.type)
      const hasValidExtension = validExtensions.some(ext => uploadedFile.name.toLowerCase().endsWith(ext))

      if (!hasValidType && !hasValidExtension) {
        toast.error('Please upload a valid CSV or Excel file')
        event.target.value = ''
        return
      }

      // Validate file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024
      if (uploadedFile.size > maxSizeBytes) {
        toast.error(`File size must be less than ${maxSizeMB}MB`)
        event.target.value = ''
        return
      }

      onFileSelect(uploadedFile)
      // Reset input so same file can be selected again
      event.target.value = ''
    },
    [maxSizeMB, onFileSelect],
  )

  const handleClearFile = useCallback((): void => {
    if (onFileClear) {
      onFileClear()
    }
  }, [onFileClear])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <Box className={styles['excel-upload']}>
      {/* Upload Button */}
      <Box className={styles['excel-upload__button-container']}>
        <BlueButton
          component="label"
          startIcon={<UploadIcon />}
          disabled={disabled}
          label="Upload File"
          className={styles['excel-upload__button']}
        >
          <input id={uploadInputId} type="file" hidden accept={accept} onChange={handleFileUpload} disabled={disabled} />
        </BlueButton>
      </Box>

      {/* File Info */}
      {showFileInfo && currentFile && (
        <Alert
          severity="info"
          className={styles['excel-upload__file-alert']}
          icon={<FileIcon />}
          action={
            onFileClear && (
              <IconButton size="small" onClick={handleClearFile} disabled={disabled} aria-label="Clear file">
                <DeleteIcon fontSize="small" />
              </IconButton>
            )
          }
        >
          <Box className={styles['excel-upload__file-info']}>
            <BodyText text={currentFile.name} variant="body2" sx={{ fontWeight: 600 }} />
            <BodyText text={formatFileSize(currentFile.size)} variant="body2" color="text.secondary" />
          </Box>
        </Alert>
      )}

      {/* Empty State */}
      {!currentFile && (
        <Paper className={styles['excel-upload__empty-state']}>
          <UploadIcon className={styles['excel-upload__empty-icon']} />
          <BodyText text="No file uploaded" variant="body1" sx={{ fontWeight: 600, mb: 1 }} />
          <BodyText text="Upload a CSV or Excel file to get started" variant="body2" color="text.secondary" />
        </Paper>
      )}
    </Box>
  )
}

export default ExcelUploadInput

