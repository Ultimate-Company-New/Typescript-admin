import type React from 'react'

import { Box, Typography } from '@mui/material'

const ImportPromos = (): React.JSX.Element => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      Import Promos
    </Typography>
    <Typography variant="body1" color="text.secondary">
      Bulk import functionality will be implemented here.
    </Typography>
  </Box>
)

export default ImportPromos
