import type React from 'react'

import { Box, Typography } from '@mui/material'

const AddPackages = (): React.JSX.Element => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      Add/Edit Package
    </Typography>
    <Typography variant="body1" color="text.secondary">
      Package form will be implemented here.
    </Typography>
  </Box>
)

export default AddPackages
