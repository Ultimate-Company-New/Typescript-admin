import type React from 'react'

import { Box, Typography } from '@mui/material'

const SalesOrders = (): React.JSX.Element => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
        Sales Orders
    </Typography>
    <Typography variant="body1" color="text.secondary">
        Sales orders grid will be implemented here.
    </Typography>
  </Box>
)

export default SalesOrders
