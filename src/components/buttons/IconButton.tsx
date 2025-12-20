import { forwardRef } from 'react'

import { IconButton as MuiIconButton, type IconButtonProps } from '@mui/material'

export interface IconButtonComponentProps extends IconButtonProps {
  // Additional props can be added here if needed
}

/**
 * Custom IconButton component built on top of Material UI IconButton
 * Provides consistent styling across the application
 */
const IconButton = forwardRef<HTMLButtonElement, IconButtonComponentProps>(
  ({ className, ...props }, ref) => (
    <MuiIconButton
      ref={ref}
      className={className}
      {...props}
    />
  ),
)

IconButton.displayName = 'IconButton'

export default IconButton
