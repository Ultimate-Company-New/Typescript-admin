import type React from 'react'

import { Box, Typography } from '@mui/material'

const AddPurchaseOrders = (): React.JSX.Element => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      Add/Edit Purchase Order
    </Typography>
    <Typography variant="body1" color="text.secondary">
      Purchase order form will be implemented here.
    </Typography>
  </Box>
)

export default AddPurchaseOrders
