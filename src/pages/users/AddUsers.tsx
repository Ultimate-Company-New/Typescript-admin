import { Container, Box } from '@mui/material'
import { Header, Subheader } from '../../components'

/**
 * Add Users Page
 * Page for adding new users to the system
 */
const AddUsers = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Header label="Add Users" variant="h3" gutterBottom />
        <Subheader label="Create new user accounts" />
        
        <Box sx={{ mt: 4, p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Header label="Add User Form - Coming Soon" variant="h5" />
        </Box>
      </Box>
    </Container>
  )
}

export default AddUsers

