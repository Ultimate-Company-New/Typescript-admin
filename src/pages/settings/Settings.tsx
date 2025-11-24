import { Box, Typography, Container } from '@mui/material'

/**
 * Settings Page
 * Placeholder for application settings
 */
const Settings = () => (
  <Container maxWidth={false} disableGutters sx={{ px: 3,
    py: 3 }}>
    <Box>
      <Typography variant="h4" gutterBottom>
          Settings
      </Typography>
      <Typography variant="body1" color="text.secondary">
          Settings page coming soon...
      </Typography>
    </Box>
  </Container>
)

export default Settings
