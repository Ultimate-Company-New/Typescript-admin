import { forwardRef } from 'react'

import { Button, type ButtonProps } from '@mui/material'

export interface LinkButtonProps extends Omit<ButtonProps, 'variant'> {
  label: string
  href?: string
  variant?: ButtonProps['variant']
}

/**
 * Outlined button component that looks like a link
 * Defaults to outlined variant with primary color
 */
const LinkButton = forwardRef<HTMLButtonElement, LinkButtonProps>(
  (
    { label, href, variant = 'outlined', color = 'primary', size = 'large', fullWidth = false, onClick, ...props },
    ref,
  ) => (
    <Button
      ref={ref}
      variant={variant}
      color={color}
      size={size}
      fullWidth={fullWidth}
      onClick={onClick}
      {...(href && { href })}
      {...props}
    >
      {label}
    </Button>
  ),
)

LinkButton.displayName = 'LinkButton'

export default LinkButton
