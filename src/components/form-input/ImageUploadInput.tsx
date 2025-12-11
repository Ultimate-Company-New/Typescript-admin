import { useState } from 'react'

import { toast } from 'react-toastify'

import { Delete as DeleteIcon, CloudUpload as UploadIcon, Image as ImageIcon } from '@mui/icons-material'
import { Avatar, Box } from '@mui/material'

import styles from '../../styles/FormInput.module.scss'
import { LinkButton, RedButton } from '../buttons'

interface ImageUploadInputProps {
  value: string
  onChange: (base64: string) => void
  disabled?: boolean
  size?: number
  label?: string
  accept?: string
  maxSizeMB?: number
}

/**
 * Reusable Image Upload Component
 * Handles image file upload, preview, and removal
 * Converts images to base64 format for storage
 */
const ImageUploadInput = ({
  value,
  onChange,
  disabled = false,
  size = 150,
  label = 'Upload Photo',
  accept = 'image/*',
  maxSizeMB = 5,
}: ImageUploadInputProps): JSX.Element => {
  const [uploadInputId] = useState(() => `image-upload-${Math.random().toString(36).substring(7)}`)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast.error(`Image size must be less than ${maxSizeMB}MB`)
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string
      // Strip the data:image/...;base64, prefix to get pure base64
      const base64 = dataUrl.split(',')[1] || dataUrl
      onChange(base64)
      toast.success('Image uploaded successfully')
    }
    reader.onerror = () => {
      toast.error('Failed to read image file')
    }
    reader.readAsDataURL(file)

    // Reset input so same file can be selected again
    event.target.value = ''
  }

  const handleRemoveImage = (): void => {
    onChange('')
    toast.info('Image removed')
  }

  const getImageSrc = (): string | undefined => {
    if (!value) return undefined
    if (value.startsWith('http')) return value
    return `data:image/png;base64,${value}`
  }

  return (
    <Box className={styles['image-upload']}>
      <Box className={styles['image-upload__preview']}>
        <Avatar
          variant="square"
          src={getImageSrc()}
          sx={{
            width: size,
            height: size,
            fontSize: `${size * 0.4}px`,
          }}
          className={`${styles['image-upload__avatar']} ${disabled ? styles['image-upload__avatar--disabled'] : styles['image-upload__avatar--active']}`}
          onClick={() => !disabled && document.getElementById(uploadInputId)?.click()}
        >
          <ImageIcon sx={{ fontSize: `${size * 0.5}px`, opacity: 0.5 }} />
        </Avatar>
      </Box>

      {!disabled && (
        <Box className={styles['image-upload__actions']}>
          <LinkButton variant="outlined" startIcon={<UploadIcon />} component="label" size="small">
            {label}
            <input
              id={uploadInputId}
              type="file"
              hidden
              accept={accept}
              onChange={handleImageUpload}
              disabled={disabled}
            />
          </LinkButton>
          {value && (
            <RedButton
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={handleRemoveImage}
              size="small"
              label="Remove"
            />
          )}
        </Box>
      )}
    </Box>
  )
}

export default ImageUploadInput
