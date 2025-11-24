import { Code as CodeIcon, Api as ApiIcon, Book as BookIcon, Security as SecurityIcon } from '@mui/icons-material'
import { Box, Typography, Card, CardContent, Grid, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'

const DeveloperDocs = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h4" gutterBottom>
      Developer Documentation
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
      Comprehensive documentation for developers to integrate and extend the platform.
    </Typography>

    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ApiIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
              <Typography variant="h6">API Reference</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Complete API documentation with endpoints, request/response formats, and examples.
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CodeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="REST API Endpoints" secondary="Full list of available endpoints" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CodeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Authentication" secondary="How to authenticate API requests" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CodeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Rate Limiting" secondary="API rate limits and best practices" />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BookIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
              <Typography variant="h6">Getting Started</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Quick start guides and tutorials to help you get up and running.
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CodeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Installation" secondary="Set up your development environment" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CodeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Quick Start" secondary="Build your first integration" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CodeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Code Examples" secondary="Sample code and implementations" />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SecurityIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
              <Typography variant="h6">Security</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Security best practices and guidelines for secure integration.
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CodeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="API Keys" secondary="Managing and securing API keys" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CodeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="OAuth 2.0" secondary="OAuth authentication flow" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CodeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Data Encryption" secondary="Encryption standards and practices" />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CodeIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
              <Typography variant="h6">SDKs & Libraries</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Official SDKs and libraries for various programming languages.
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CodeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="JavaScript SDK" secondary="Node.js and browser support" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CodeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Python SDK" secondary="Python 3.7+ compatible" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CodeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Java SDK" secondary="Spring Boot integration" />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
)

export default DeveloperDocs
