import { forwardRef, type ReactNode } from 'react'

import { Typography, type TypographyProps } from '@mui/material'

export interface BodyTextProps extends Omit<TypographyProps, 'variant' | 'dangerouslySetInnerHTML'> {
  text?: string
  children?: ReactNode
  variant?: 'body1' | 'body2'
  enableHtml?: boolean
}

/**
 * Body text typography component for regular content
 * Defaults to body1 variant
 * Supports both text prop and children for flexibility
 */
const BodyText = forwardRef<HTMLElement, BodyTextProps>(
  ({ text, children, variant = 'body1', color = 'textPrimary', enableHtml = false, ...props }, ref) => {
    const content = text ?? children

    if (enableHtml && typeof content === 'string') {
      return (
        <Typography
          ref={ref}
          variant={variant}
          color={color}
          dangerouslySetInnerHTML={{ __html: content }}
          {...props}
        />
      )
    }

    return (
      <Typography ref={ref} variant={variant} color={color} {...props}>
        {content}
      </Typography>
    )
  },
)

BodyText.displayName = 'BodyText'

export default BodyText
