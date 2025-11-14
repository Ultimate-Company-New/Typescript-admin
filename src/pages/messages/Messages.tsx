import { Box, Typography } from '@mui/material'

const Messages = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Messages
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Messages grid will be implemented here.
      </Typography>
    </Box>
  )
}

export default Messages

