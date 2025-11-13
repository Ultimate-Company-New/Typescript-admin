import { Typography, TypographyProps } from '@mui/material'
import { forwardRef } from 'react'

export interface HeaderProps extends Omit<TypographyProps, 'variant'> {
  label: string
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

/**
 * Header typography component for main headings
 * Defaults to h4 variant with primary text color
 */
const Header = forwardRef<HTMLElement, HeaderProps>(
  ({ label, variant = 'h4', color = 'textPrimary', ...props }, ref) => {
    return (
      <Typography ref={ref} variant={variant} color={color} {...props}>
        {label}
      </Typography>
    )
  }
)

Header.displayName = 'Header'

export default Header

