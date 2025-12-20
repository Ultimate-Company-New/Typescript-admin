import { useState } from 'react'

import { Box } from '@mui/material'

import {
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    ImageNotSupported as ImageNotSupportedIcon,
} from '@mui/icons-material'

import { IconButton } from '../../../components/buttons'
import { type MiniImageCarouselProps } from '../../../models'
import styles from '../../../styles/PurchaseOrders.module.scss'

/**
 * Mini Image Carousel Component
 *
 * A compact, space-efficient image carousel designed for use in product list items.
 * Similar to ImageCarousel but optimized for smaller display areas.
 *
 * Features:
 * - Fixed size (default 72px, configurable via size prop)
 * - Navigation arrows overlay on the image (only shown when multiple images)
 * - Image counter badge (only shown when multiple images)
 * - Circular navigation (wraps around)
 * - Error handling with fallback placeholder
 * - Prevents event bubbling to avoid triggering parent click handlers
 *
 * Use Cases:
 * - Product item cards in lists
 * - Compact product displays
 * - Any component needing a small image carousel
 *
 * Differences from ImageCarousel:
 * - No thumbnail strip (saves vertical space)
 * - Fixed size instead of responsive
 * - Smaller navigation controls
 * - Optimized for list item display
 *
 * @param {MiniImageCarouselProps} props - Component props
 * @returns {JSX.Element} Rendered mini image carousel
 */
const MiniImageCarousel = ({ images, size = 72 }: MiniImageCarouselProps): JSX.Element => {
  // State: Track which image is currently displayed (0-indexed)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Early return: Show empty state placeholder if no images
  if (!images || images.length === 0) {
    return (
      <Box
        className={styles['mini-image-carousel__empty']}
        style={{ width: size, height: size }}
      >
        <ImageNotSupportedIcon color="disabled" style={{ fontSize: size * 0.5 }} />
      </Box>
    )
  }

  // Determine if we have multiple images (affects navigation visibility)
  const hasMultipleImages = images.length > 1

  /**
   * Handles previous image navigation with circular wrapping.
   *
   * @param {React.MouseEvent} e - Click event
   */
  const handlePrev = (e: React.MouseEvent): void => {
    // Prevent event bubbling (important when carousel is in clickable card)
    e.stopPropagation()
    if (hasMultipleImages) {
      // Circular: if at start (0), wrap to end (images.length - 1)
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    }
  }

  /**
   * Handles next image navigation with circular wrapping.
   *
   * @param {React.MouseEvent} e - Click event
   */
  const handleNext = (e: React.MouseEvent): void => {
    // Prevent event bubbling
    e.stopPropagation()
    if (hasMultipleImages) {
      // Circular: if at end, wrap to start (0)
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }
  }

  return (
    <Box className={styles['mini-image-carousel']} style={{ width: size, height: size }}>
      <Box className={styles['mini-image-carousel__image-container']}>
        <Box
          component="img"
          src={images[currentIndex].url}
          alt={images[currentIndex].label || `Product image ${currentIndex + 1}`}
          className={styles['mini-image-carousel__image']}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="10">No Image</text></svg>'
          }}
        />
      </Box>

      {hasMultipleImages && (
        <>
          <IconButton
            onClick={handlePrev}
            size="small"
            className={`${styles['mini-image-carousel__nav-button']} ${styles['mini-image-carousel__nav-button--prev']}`}
          >
            <ChevronLeftIcon className={styles['mini-image-carousel__nav-icon']} />
          </IconButton>
          <IconButton
            onClick={handleNext}
            size="small"
            className={`${styles['mini-image-carousel__nav-button']} ${styles['mini-image-carousel__nav-button--next']}`}
          >
            <ChevronRightIcon className={styles['mini-image-carousel__nav-icon']} />
          </IconButton>
        </>
      )}

      {hasMultipleImages && (
        <Box className={styles['mini-image-carousel__counter']}>
          {currentIndex + 1}/{images.length}
        </Box>
      )}
    </Box>
  )
}

export default MiniImageCarousel
