import { Typography, TypographyProps } from '@mui/material'
import { forwardRef, ReactNode } from 'react'

export interface SecondaryFontProps extends Omit<TypographyProps, 'variant'> {
  text?: string
  children?: ReactNode
  variant?: 'body2' | 'caption' | 'overline'
}

/**
 * Secondary font component for less prominent text
 * Defaults to body2 variant with secondary text color
 * Use for supporting information, captions, or metadata
 */
const SecondaryFont = forwardRef<HTMLElement, SecondaryFontProps>(
  (
    {
      text,
      children,
      variant = 'body2',
      color = 'textSecondary',
      ...props
    },
    ref
  ) => {
    return (
      <Typography ref={ref} variant={variant} color={color} {...props}>
        {text || children}
      </Typography>
    )
  }
)

SecondaryFont.displayName = 'SecondaryFont'

export default SecondaryFont

