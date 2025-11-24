import { forwardRef } from 'react'

import { Typography, type TypographyProps } from '@mui/material'

export interface SubheaderProps extends Omit<TypographyProps, 'variant'> {
  label: string
  variant?: 'h5' | 'h6' | 'subtitle1' | 'subtitle2'
}

/**
 * Subheader typography component for section headings
 * Defaults to h6 variant with secondary text color
 */
const Subheader = forwardRef<HTMLElement, SubheaderProps>(
  ({ label, variant = 'h6', color = 'textSecondary', ...props }, ref) => (
    <Typography ref={ref} variant={variant} color={color} {...props}>
      {label}
    </Typography>
  ),
)

Subheader.displayName = 'Subheader'

export default Subheader
