import { forwardRef } from 'react'

import { Button, type ButtonProps } from '@mui/material'

export interface RedButtonProps extends Omit<ButtonProps, 'color' | 'variant'> {
  label?: string
  href?: string
  color?: ButtonProps['color']
  variant?: ButtonProps['variant']
}

/**
 * Red/Error button component for destructive actions
 * Defaults to contained variant with error color
 * Use for: Delete, Cancel, Remove operations
 */
const RedButton = forwardRef<HTMLButtonElement, RedButtonProps>(
  (
    {
      label,
      href,
      color = 'error',
      variant = 'contained',
      size = 'large',
      fullWidth = false,
      onClick,
      children,
      ...props
    },
    ref,
  ) => (
    <Button
      ref={ref}
      color={color}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      onClick={onClick}
      {...(href && { href })}
      {...props}
    >
      {children ?? label}
    </Button>
  ),
)

RedButton.displayName = 'RedButton'

export default RedButton
