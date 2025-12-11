import { forwardRef, type ReactNode } from 'react'

import { Typography, type TypographyProps } from '@mui/material'

export interface FieldLabelProps extends Omit<TypographyProps, 'variant'> {
  text?: string
  children?: ReactNode
}

/**
 * Field label typography component for form field labels
 * Styled as uppercase with letter-spacing for visual distinction
 * Use for labeling form fields, data display fields, etc.
 */
const FieldLabel = forwardRef<HTMLElement, FieldLabelProps>(
  ({ text, children, color = 'text.secondary', sx, ...props }, ref) => (
    <Typography
      ref={ref}
      variant="subtitle2"
      color={color}
      sx={{
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontSize: '0.75rem',
        marginBottom: 1,
        ...sx,
      }}
      {...props}
    >
      {text ?? children}
    </Typography>
  ),
)

FieldLabel.displayName = 'FieldLabel'

export default FieldLabel

