import { Container, Box } from '@mui/material'
import { Header, Subheader } from '../../components'

/**
 * Import Users Page
 * Page for bulk importing users via CSV/Excel
 */
const ImportUsers = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Header label="Import Users" variant="h3" gutterBottom />
        <Subheader label="Bulk import users from CSV or Excel files" />
        
        <Box sx={{ mt: 4, p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Header label="Import Users Form - Coming Soon" variant="h5" />
        </Box>
      </Box>
    </Container>
  )
}

export default ImportUsers

