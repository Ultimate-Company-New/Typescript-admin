import { Box, Typography } from '@mui/material'

interface LogoProps {
  size?: number
  variant?: 'default' | 'light' | 'dark'
}

/**
 * Company Logo Component
 * Replace this placeholder with your actual logo image
 * 
 * Usage:
 * <Logo size={120} variant="default" />
 * 
 * To use an actual image:
 * <Box component="img" src="/path/to/logo.png" alt="Company Logo" sx={{ width: size, height: size }} />
 */
const Logo = ({ size = 120, variant = 'default' }: LogoProps) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'light':
        return 'rgba(255, 255, 255, 0.1)'
      case 'dark':
        return 'primary.dark'
      default:
        return 'primary.main'
    }
  }

  const getTextColor = () => {
    switch (variant) {
      case 'light':
      case 'dark':
        return 'white'
      default:
        return 'white'
    }
  }

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 2,
        backgroundColor: getBackgroundColor(),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 3,
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      {/* Replace this with actual logo image */}
      <Typography
        variant="h4"
        sx={{
          color: getTextColor(),
          fontWeight: 700,
          letterSpacing: 2,
        }}
      >
        ADMIN
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: getTextColor(),
          opacity: 0.8,
        }}
      >
        PORTAL
      </Typography>
    </Box>
  )
}

export default Logo

