import type React from 'react'

import { Box, Typography } from '@mui/material'

const AddWebTemplates = (): React.JSX.Element => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      Add/Edit Web Template
    </Typography>
    <Typography variant="body1" color="text.secondary">
      Web template form will be implemented here.
    </Typography>
  </Box>
)

export default AddWebTemplates
