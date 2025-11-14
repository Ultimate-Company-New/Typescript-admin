import { Box, Typography } from '@mui/material'

const AddMessages = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Add/Edit Message
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Message form will be implemented here.
      </Typography>
    </Box>
  )
}

export default AddMessages

