import { useNavigate } from 'react-router-dom'

import { Container, Box, Stack } from '@mui/material'

import { Header, BodyText, BlueButton } from '../components'
import { APP_ROUTES } from '../constants/routes'

/**
 * 404 Not Found Page
 */
const NotFound = () => {
  const navigate = useNavigate()

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          mb: 4,
          p: 4,
          textAlign: 'center',
        }}
      >
        <Stack spacing={3}>
          <Header label="404" variant="h1" color="primary" />
          <Header label="Page Not Found" variant="h4" />
          <BodyText text="The page you are looking for doesn't exist or has been moved." />

          <Stack direction="row" spacing={2} justifyContent="center">
            <BlueButton
              label="Go to Home"
              onClick={() => {
                navigate(APP_ROUTES.HOME)
              }}
            />
            <BlueButton
              label="Go Back"
              onClick={() => {
                navigate(-1)
              }}
              variant="outlined"
            />
          </Stack>
        </Stack>
      </Box>
    </Container>
  )
}

export default NotFound
