import type React from 'react'

import { Email as EmailIcon, Phone as PhoneIcon, Chat as ChatIcon } from '@mui/icons-material'
import { Box, Typography, Card, CardContent, Grid, Button } from '@mui/material'

const Support = (): React.JSX.Element => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      Support
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
      Get help and support for your account and services.
    </Typography>

    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ textAlign: 'center',
py: 4 }}>
            <EmailIcon sx={{ fontSize: 48,
color: 'primary.main',
mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Email Support
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Send us an email and we&apos;ll get back to you within 24 hours.
            </Typography>
            <Button variant="contained" href="mailto:support@example.com">
              Send Email
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ textAlign: 'center',
py: 4 }}>
            <PhoneIcon sx={{ fontSize: 48,
color: 'primary.main',
mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Phone Support
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Call us during business hours for immediate assistance.
            </Typography>
            <Button variant="contained" href="tel:+1234567890">
              Call Now
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ textAlign: 'center',
py: 4 }}>
            <ChatIcon sx={{ fontSize: 48,
color: 'primary.main',
mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Live Chat
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Chat with our support team in real-time.
            </Typography>
            <Button variant="contained">Start Chat</Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
)

export default Support
