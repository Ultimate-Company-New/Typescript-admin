import type React from 'react'

import { Box, Typography } from '@mui/material'

const AddPromos = (): React.JSX.Element => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      Add/Edit Promo
    </Typography>
    <Typography variant="body1" color="text.secondary">
      Promo form will be implemented here.
    </Typography>
  </Box>
)

export default AddPromos
