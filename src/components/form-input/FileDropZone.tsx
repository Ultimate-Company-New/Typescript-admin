import { useCallback, useRef, useState } from 'react'

import { toast } from 'react-toastify'

import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, InsertDriveFile as FileIcon } from '@mui/icons-material'
import { Box, IconButton, Tooltip, Typography } from '@mui/material'

import styles from '../../styles/FormInput.module.scss'

export interface FileDropZoneProps {
  /** Callback when a file is selected/dropped */
  onFileSelect: (file: File) => void
  /** Callback when file is cleared */
  onFileClear?: () => void
  /** Accepted file types (e.g., '.csv,.xlsx,.xls') */
  accept?: string
  /** Maximum file size in MB */
  maxSizeMB?: number
  /** Whether the component is disabled */
  disabled?: boolean
  /** Currently selected file */
  currentFile?: File | null
  /** Whether the component is in a loading state */
  isLoading?: boolean
  /** Custom validation function for file types */
  validateFileType?: (file: File) => boolean
  /** Custom error message for invalid file type */
  invalidFileTypeMessage?: string
}

/**
 * FileDropZone Component
 *
 * A reusable file upload component with drag-and-drop support
 * Handles file validation (type and size) and provides visual feedback
 *
 * @example
 * <FileDropZone
 *   onFileSelect={(file) => handleFile(file)}
 *   onFileClear={() => clearFile()}
 *   currentFile={file}
 *   accept=".csv,.xlsx,.xls"
 *   maxSizeMB={10}
 * />
 */
const FileDropZone = ({
  onFileSelect,
  onFileClear,
  accept = '.csv,.xlsx,.xls',
  maxSizeMB = 10,
  disabled = false,
  currentFile = null,
  isLoading = false,
  validateFileType,
  invalidFileTypeMessage = 'Please upload a valid CSV or Excel file',
}: FileDropZoneProps): JSX.Element => {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Default file type validation
   */
  const defaultValidateFileType = useCallback(
    (file: File): boolean => {
      const validExtensions = accept.split(',').map(ext => ext.trim().toLowerCase())
      return validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    },
    [accept],
  )

  /**
   * Validate and process file
   */
  const processFile = useCallback(
    (file: File): void => {
      // Validate file type
      const isValidType = validateFileType ? validateFileType(file) : defaultValidateFileType(file)
      if (!isValidType) {
        toast.error(invalidFileTypeMessage)
        return
      }

      // Validate file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024
      if (file.size > maxSizeBytes) {
        toast.error(`File size must be less than ${maxSizeMB}MB`)
        return
      }

      onFileSelect(file)
      toast.success('File uploaded successfully')
    },
    [validateFileType, defaultValidateFileType, invalidFileTypeMessage, maxSizeMB, onFileSelect],
  )

  /**
   * Handle file selection from input
   */
  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const selectedFile = event.target.files?.[0]
      if (!selectedFile) return

      processFile(selectedFile)

      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [processFile],
  )

  /**
   * Handle click on upload area
   */
  const handleUploadAreaClick = (): void => {
    if (!isLoading && !disabled && !currentFile) {
      fileInputRef.current?.click()
    }
  }

  /**
   * Handle drag over
   */
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    event.stopPropagation()
    if (!isLoading && !disabled && !currentFile) {
      setIsDragOver(true)
    }
  }

  /**
   * Handle drag leave
   */
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)
  }

  /**
   * Handle drop
   */
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>): void => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragOver(false)

      if (isLoading || disabled) return
      if (currentFile !== null) return

      const droppedFiles = event.dataTransfer.files
      if (droppedFiles.length === 0) return

      const droppedFile = droppedFiles[0]
      processFile(droppedFile)
    },
    [isLoading, disabled, currentFile, processFile],
  )

  /**
   * Clear uploaded file and data
   */
  const handleClearFile = (event: React.MouseEvent): void => {
    event.stopPropagation()
    if (onFileClear) {
      onFileClear()
      toast.info('File cleared')
    }
  }

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <Box
      className={`${styles['file-drop-zone']} ${isDragOver ? styles['file-drop-zone--drag-over'] : ''} ${currentFile ? styles['file-drop-zone--has-file'] : ''} ${disabled || isLoading ? styles['file-drop-zone--disabled'] : ''}`}
      onClick={handleUploadAreaClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        disabled={disabled || isLoading}
      />

      {currentFile ? (
        /* File selected state */
        <Box className={styles['file-drop-zone__file-info']}>
          <FileIcon className={styles['file-drop-zone__file-icon']} />
          <Box className={styles['file-drop-zone__file-details']}>
            <Typography variant="body1" fontWeight={500}>
              {currentFile.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatFileSize(currentFile.size)}
            </Typography>
          </Box>
          {onFileClear && (
            <Tooltip title="Remove file">
              <IconButton onClick={handleClearFile} color="error" size="small" disabled={disabled || isLoading}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ) : (
        /* Empty state - click to upload or drag & drop */
        <Box className={styles['file-drop-zone__upload-empty']}>
          <CloudUploadIcon
            className={`${styles['file-drop-zone__upload-icon']} ${isDragOver ? styles['file-drop-zone__upload-icon--drag-over'] : ''}`}
          />
          <Box>
            <Typography variant="body1" fontWeight={500}>
              {isDragOver ? 'Drop file here' : 'Click to upload or drag & drop'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {accept.replace(/\./g, '').toUpperCase()} (max {maxSizeMB}MB)
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  )
}
export default FileDropZone
