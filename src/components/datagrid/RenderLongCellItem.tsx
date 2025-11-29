import React from 'react'

import { Tooltip } from '@mui/material'

import { BodyText } from '../fonts'

import styles from '../../styles/DataGrid.module.scss'
interface RenderLongCellItemProps {
  value: string
}

/**
 * Renders text in a DataGrid cell with ellipsis and tooltip on hover
 * Much cleaner than "See More" buttons - just hover to see full text
 */
const RenderLongCellItem: React.FC<RenderLongCellItemProps> = ({ value }) => {
  const [isOverflowing, setIsOverflowing] = React.useState(false)
  const textRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (textRef.current) {
      // Check if the content overflows
      setIsOverflowing(textRef.current.scrollWidth > textRef.current.offsetWidth)
    }
  }, [value])

  return (
    <Tooltip title={isOverflowing ? value : ''} arrow placement="top">
      <BodyText
        ref={textRef}
        variant="body2"
        className={`${styles['render-long-cell-item']} ${isOverflowing ? styles['render-long-cell-item--overflowing'] : styles['render-long-cell-item--default']}`}
      >
        {value}
      </BodyText>
    </Tooltip>
  )
}

export default RenderLongCellItem
