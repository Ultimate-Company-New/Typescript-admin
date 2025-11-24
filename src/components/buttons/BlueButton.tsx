import { forwardRef } from 'react'

import { Button, type ButtonProps, Link } from '@mui/material'

export interface BlueButtonProps extends Omit<ButtonProps, 'color' | 'variant'> {
  label: string
  href?: string
  color?: ButtonProps['color']
  variant?: ButtonProps['variant']
}

/**
 * Primary blue button component with optional href support
 * Defaults to contained variant with primary color
 */
const BlueButton = forwardRef<HTMLButtonElement, BlueButtonProps>(
  (
    { label, href, color = 'primary', variant = 'contained', size = 'large', fullWidth = false, onClick, ...props },
    ref,
  ) => {
    const button = (
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
        {label}
      </Button>
    )

    // Wrap in Link component only if href is provided and we want link styling
    if (href && !props.component) {
      return (
        <Link href={href} underline="none" sx={{ display: fullWidth ? 'block' : 'inline-block' }}>
          {button}
        </Link>
      )
    }

    return button
  },
)

BlueButton.displayName = 'BlueButton'

export default BlueButton
