import type React from 'react'

import { Box, Typography } from '@mui/material'

const AddMessages = (): React.JSX.Element => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      Add/Edit Message
    </Typography>
    <Typography variant="body1" color="text.secondary">
      Message form will be implemented here.
    </Typography>
  </Box>
)

export default AddMessages
