import { useCallback, useState } from 'react'

import { toast } from 'react-toastify'

import { Delete as DeleteIcon, Image as ImageIcon, CloudUpload as UploadIcon } from '@mui/icons-material'
import { Avatar, Box, Grid } from '@mui/material'

import styles from '../../styles/FormInput.module.scss'
import { BlueButton, RedButton } from '../buttons'
import { BodyText, SecondaryFont } from '../fonts'

interface MultipleImageUploadInputProps {
  value: Record<string, string> // Map of fileName -> base64Data
  onChange: (attachments: Record<string, string>) => void
  disabled?: boolean
  maxFiles?: number
  maxSizeMB?: number
  accept?: string
  label?: string
}

/**
 * Multiple Image Upload Component for Purchase Order Attachments
 * Handles multiple image file uploads, previews, and removal
 * Converts images to base64 format for storage
 */
const MultipleImageUploadInput = ({
  value,
  onChange,
  disabled = false,
  maxFiles = 30,
  maxSizeMB = 5,
  accept = 'image/*',
  label = 'Upload Images',
}: MultipleImageUploadInputProps): JSX.Element => {
  const [uploadInputId] = useState(() => `multiple-image-upload-${Math.random().toString(36).substring(7)}`)

  // Convert value map to array for easier manipulation
  // Handle both URLs (existing attachments) and base64 (new uploads)
  const attachments = Object.entries(value || {}).map(([fileName, urlOrBase64]) => {
    const isUrl = urlOrBase64 && urlOrBase64.startsWith('http')
    return {
      fileName,
      base64Data: urlOrBase64,
      preview: isUrl ? urlOrBase64 : `data:image/png;base64,${urlOrBase64}`,
      isUrl, // Track if this is a URL (existing) or base64 (new)
    }
  })

  const handleImageUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const files = event.target.files
      if (!files || files.length === 0) return

      // Check max files limit
      const currentCount = attachments.length
      const newFilesCount = files.length
      if (currentCount + newFilesCount > maxFiles) {
        toast.error(`Maximum ${maxFiles} images allowed. You can upload ${maxFiles - currentCount} more.`)
        event.target.value = ''
        return
      }

      const newAttachments: Record<string, string> = { ...value }
      const filesArray = Array.from(files)
      let processedCount = 0
      let errorCount = 0

      // Process each file
      filesArray.forEach((file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`)
          errorCount++
          processedCount++
          // Always call onChange when all files are processed, even if some failed
          if (processedCount === filesArray.length) {
            onChange(newAttachments)
            if (errorCount < filesArray.length) {
              toast.success(`Uploaded ${filesArray.length - errorCount} image(s) successfully`)
            }
          }
          return
        }

        // Validate file size
        const maxSizeBytes = maxSizeMB * 1024 * 1024
        if (file.size > maxSizeBytes) {
          toast.error(`${file.name} size must be less than ${maxSizeMB}MB`)
          errorCount++
          processedCount++
          // Always call onChange when all files are processed, even if some failed
          if (processedCount === filesArray.length) {
            onChange(newAttachments)
            if (errorCount < filesArray.length) {
              toast.success(`Uploaded ${filesArray.length - errorCount} image(s) successfully`)
            }
          }
          return
        }

        // Check for duplicate file names
        let finalFileName = file.name
        if (newAttachments[file.name]) {
          toast.warning(`${file.name} already exists. Renaming to ${file.name}_${Date.now()}`)
          const timestamp = Date.now()
          const extension = file.name.split('.').pop()
          const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'))
          finalFileName = `${nameWithoutExt}_${timestamp}.${extension}`
        }

        // Convert to base64
        const reader = new FileReader()
        reader.onload = e => {
          const dataUrl = e.target?.result as string
          // Strip the data:image/...;base64, prefix to get pure base64
          const base64 = dataUrl.split(',')[1] || dataUrl
          newAttachments[finalFileName] = base64
          processedCount++

          // Update state after all files are processed
          if (processedCount === filesArray.length) {
            onChange(newAttachments)
            if (errorCount < filesArray.length) {
              toast.success(`Uploaded ${filesArray.length - errorCount} image(s) successfully`)
            }
          }
        }
        reader.onerror = () => {
          toast.error(`Failed to read ${file.name}`)
          errorCount++
          processedCount++
          // Always call onChange when all files are processed, even if some failed
          if (processedCount === filesArray.length) {
            onChange(newAttachments)
            if (errorCount < filesArray.length) {
              toast.success(`Uploaded ${filesArray.length - errorCount} image(s) successfully`)
            }
          }
        }
        reader.readAsDataURL(file)
      })

      // Reset input so same files can be selected again
      event.target.value = ''
    },
    [value, onChange, attachments.length, maxFiles, maxSizeMB]
  )

  const handleRemoveImage = useCallback(
    (fileName: string): void => {
      const newAttachments = { ...value }
      delete newAttachments[fileName]
      onChange(newAttachments)
      toast.info(`${fileName} removed`)
    },
    [value, onChange]
  )

  return (
    <Box className={styles['image-upload']}>
      <Box className={styles['image-upload__header']}>
        <BodyText variant="body2" className={styles['image-upload__label']}>
          {label} ({attachments.length}/{maxFiles} images)
        </BodyText>
        {!disabled && (
          <BlueButton
            variant="outlined"
            component="label"
            startIcon={<UploadIcon />}
            size="small"
            disabled={attachments.length >= maxFiles}
            className={styles['image-upload__upload-button']}
          >
            {attachments.length >= maxFiles ? 'Maximum files reached' : 'Add Images'}
            <input
              id={uploadInputId}
              type="file"
              hidden
              accept={accept}
              multiple
              onChange={handleImageUpload}
              disabled={disabled || attachments.length >= maxFiles}
            />
          </BlueButton>
        )}
      </Box>

      {attachments.length > 0 && (
        <Grid container spacing={2}>
          {attachments.map((attachment) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={attachment.fileName}>
              <Box className={styles['image-upload__attachment-container']}>
                <Box className={styles['image-upload__attachment-content']}>
                  <Avatar
                    variant="square"
                    src={attachment.preview}
                    className={styles['image-upload__attachment-avatar']}
                  >
                    <ImageIcon className={styles['image-upload__attachment-placeholder-icon']} />
                  </Avatar>
                  <SecondaryFont
                    variant="caption"
                    className={styles['image-upload__attachment-filename']}
                    title={attachment.fileName}
                  >
                    {attachment.fileName}
                  </SecondaryFont>
                  {!disabled && (
                    <RedButton
                      variant="outlined"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleRemoveImage(attachment.fileName)}
                      size="small"
                      label="Remove"
                    />
                  )}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {attachments.length === 0 && (
        <Box className={styles['image-upload__empty']}>
          <ImageIcon className={styles['image-upload__empty-icon']} />
          <BodyText variant="body2" className={styles['image-upload__empty-text']}>
            No images uploaded yet
          </BodyText>
        </Box>
      )}
    </Box>
  )
}

export default MultipleImageUploadInput

