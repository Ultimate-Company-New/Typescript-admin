import type React from 'react'

import { Box, Typography } from '@mui/material'

const AddProducts = (): React.JSX.Element => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      Add/Edit Product
    </Typography>
    <Typography variant="body1" color="text.secondary">
      Product form will be implemented here.
    </Typography>
  </Box>
)

export default AddProducts
