import { forwardRef, type ReactNode } from 'react'

import { Typography, type TypographyProps } from '@mui/material'

export interface PrimaryFontProps extends Omit<TypographyProps, 'variant'> {
  text?: string
  children?: ReactNode
  variant?: 'subtitle1' | 'subtitle2' | 'h6'
}

/**
 * Primary font component for emphasized text
 * Defaults to subtitle1 variant with primary text color
 * Use for important information that needs emphasis
 */
const PrimaryFont = forwardRef<HTMLElement, PrimaryFontProps>(
  ({ text, children, variant = 'subtitle1', color = 'textPrimary', fontWeight = 500, ...props }, ref) => (
    <Typography ref={ref} variant={variant} color={color} fontWeight={fontWeight} {...props}>
      {text ?? children}
    </Typography>
  ),
)

PrimaryFont.displayName = 'PrimaryFont'

export default PrimaryFont
