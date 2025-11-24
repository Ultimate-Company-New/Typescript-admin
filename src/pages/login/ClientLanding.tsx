import { useState, useEffect, useMemo } from 'react'

import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Container, Box, Stack, Typography, Grid, Card, CardMedia, CardContent, CardActionArea } from '@mui/material'

import { loginApi } from '../../api/loginApi'
import { Header, Subheader, TextFieldInput, Logo, PaginationComponent } from '../../components'
import { APP_ROUTES } from '../../constants/routes'
import { type ClientResponseModel } from '../../models/LoginModels'
import styles from './Login.module.scss'

interface CarrierGridItem {
  id: number
  name: string
  logo?: string
  apiKey: string
}

interface CarrierGridProps {
  carriers: CarrierGridItem[]
  onCarrierClick: (carrierId: number, apiKey: string) => void
}

/**
 * Carrier Grid Component
 * Displays carriers in a responsive 3-column grid
 * Mobile-friendly: 1 column on xs, 2 on sm, 3 on md+
 */
const CarrierGrid = ({ carriers, onCarrierClick }: CarrierGridProps) => {
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const handleClick = (carrier: CarrierGridItem) => {
    setSelectedId(carrier.id)
    onCarrierClick(carrier.id, carrier.apiKey)
  }

  if (carriers.length === 0) {
    return (
      <Box className={styles['carrier-grid__empty-container']}>
        <Typography variant="h6" color="text.secondary">
          No carriers found
        </Typography>
      </Box>
    )
  }

  return (
    <Grid container spacing={3}>
      {carriers.map(carrier => (
        <Grid item xs={12} sm={6} md={4} key={carrier.id}>
          <Card
            className={`${styles['carrier-grid__card']} ${selectedId === carrier.id ? styles['carrier-grid__card--selected'] : styles['carrier-grid__card--unselected']}`}
            sx={{ borderColor: 'primary.main' }}
            data-test-id={`carrier-card-${carrier.id}`}
          >
            <CardActionArea
              onClick={() => {
                handleClick(carrier)
              }}
              className={styles['carrier-grid__card-action-area']}
            >
              <CardMedia component="div" className={styles['carrier-grid__card-media']}>
                {carrier.logo ? (
                  <Box component="img" src={carrier.logo} alt={carrier.name} className={styles['carrier-grid__card-logo']} />
                ) : (
                  <Box className={styles['carrier-grid__card-placeholder']}>
                    <Typography variant="h4" color="text.secondary">
                      {carrier.name.charAt(0).toUpperCase()}
                    </Typography>
                  </Box>
                )}
              </CardMedia>
              <CardContent className={styles['carrier-grid__card-content']}>
                <Typography variant="h6" component="div" textAlign="center">
                  {carrier.name}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

/**
 * Client Landing Page
 * Displays clients from login response in a searchable, paginated grid
 * User selects a client to get bearer token and proceed to dashboard
 */
const ClientLanding = () => {
  const navigate = useNavigate()
  const [clients, setClients] = useState<ClientResponseModel[]>([])
  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const pageSize = 9 // 3x3 grid

  // Route protection: Check authentication and load clients from localStorage on mount
  useEffect(() => {
    const storedClients = localStorage.getItem('clients')
    const storedLoginName = localStorage.getItem('loginName')

    // Redirect to login if user is not authenticated
    if (!storedClients || !storedLoginName) {
      toast.error('Please login to access this page.')
      navigate(APP_ROUTES.LOGIN, { replace: true })
      return
    }

    try {
      const clientsData: ClientResponseModel[] = JSON.parse(storedClients)

      // Validate that we have at least one client
      if (!clientsData || clientsData.length === 0) {
        toast.error('No clients available. Please contact support.')
        navigate(APP_ROUTES.LOGIN, { replace: true })
        return
      }

      setClients(clientsData)
    } catch (error) {
      console.error('Failed to parse clients data:', error)
      toast.error('Invalid session data. Please login again.')
      navigate(APP_ROUTES.LOGIN, { replace: true })
    }
  }, [navigate])

  // Client-side filtering
  const filteredClients = useMemo(() => {
    if (!searchText.trim()) {
      return clients
    }

    const searchLower = searchText.toLowerCase()
    return clients.filter(client => client.name.toLowerCase().includes(searchLower))
  }, [clients, searchText])

  // Client-side pagination
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return filteredClients.slice(startIndex, endIndex)
  }, [filteredClients, currentPage, pageSize])

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchText])

  // Handle search input
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value)
  }

  // Handle page change
  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page)
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle client selection
  const handleClientClick = async (clientId: number, apiKey: string) => {
    setIsLoading(true)

    try {
      // Get the selected client's login name (email)
      const selectedClient = clients.find(c => c.clientId === clientId)

      if (!selectedClient) {
        toast.error('Client not found')
        return
      }

      // Get bearer token from API (returns plain string)
      const token = await loginApi.getToken({
        loginName: localStorage.getItem('loginName') || '',
        apiKey: apiKey,
      })

      // Store the bearer token and selected client info
      localStorage.setItem('authToken', token)
      localStorage.setItem('selectedCarrierId', clientId.toString())
      localStorage.setItem('selectedCarrierName', selectedClient.name)

      toast.success(`Welcome to ${selectedClient.name}!`)

      // Navigate to dashboard
      navigate(APP_ROUTES.DASHBOARD.ROOT)
    } catch (error) {
      console.error('Failed to get token:', error)
      // Error is handled by axios interceptor
    } finally {
      setIsLoading(false)
    }
  }

  // Convert to grid items
  const gridItems: CarrierGridItem[] = paginatedClients.map(client => ({
    id: client.clientId,
    name: client.name,
    logo: client.logo,
    apiKey: client.apiKey,
  }))

  return (
    <Container maxWidth="lg">
      <Box className={styles['client-landing__container']}>
        <Stack spacing={4}>
          {/* Logo */}
          <Box className={styles['client-landing__logo-container']}>
            <Logo size={80} />
          </Box>

          {/* Header */}
          <Box textAlign="center">
            <Header label="Select Your Client" variant="h3" gutterBottom />
            <Subheader label="Choose a client to access the dashboard" />
          </Box>

          {/* Search Bar */}
          <Box className={styles['client-landing__search-container']}>
            <TextFieldInput
              label="Search Clients"
              name="searchText"
              value={searchText}
              onChange={handleSearchChange}
              placeholder="Search by client name..."
              fullWidth
              inputProps={{
                'data-test-id': 'client-search-input',
              }}
            />
          </Box>

          {/* Client Grid */}
          <Box
            className={`${styles['client-landing__grid-container']} ${isLoading ? styles['client-landing__grid-container--loading'] : styles['client-landing__grid-container--active']}`}
          >
            <CarrierGrid carriers={gridItems} onCarrierClick={handleClientClick} />
          </Box>

          {/* Divider before pagination */}
          {filteredClients.length > pageSize && (
            <Box component="hr" className={styles['client-landing__divider']} sx={{ borderColor: 'divider' }} />
          )}

          {/* Pagination */}
          <PaginationComponent
            totalItems={filteredClients.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            itemLabel="clients"
            data-test-id="client-pagination"
          />

          {/* Empty State */}
          {filteredClients.length === 0 && searchText && (
            <Box textAlign="center" className={styles['client-landing__empty-state']}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No clients found matching "{searchText}"
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try searching with a different term
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>
    </Container>
  )
}

export default ClientLanding
