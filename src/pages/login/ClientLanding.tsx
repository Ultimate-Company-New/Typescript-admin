import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Box, Stack, Typography } from '@mui/material'
import { toast } from 'react-toastify'

import {
  Header,
  Subheader,
  TextFieldInput,
  Logo,
  PaginationComponent,
} from '../../components'
import CarrierGrid, { CarrierGridItem } from '../../components/CarrierGrid'
import { loginApi } from '../../api/loginApi'
import { ClientResponseModel } from '../../models/LoginModels'
import { APP_ROUTES } from '../../constants/routes'

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
    return clients.filter((client) =>
      client.name.toLowerCase().includes(searchLower)
    )
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
  const gridItems: CarrierGridItem[] = paginatedClients.map((client) => ({
    id: client.clientId,
    name: client.name,
    logo: client.logo,
    apiKey: client.apiKey,
  }))

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          mt: 6,
          mb: 4,
        }}
      >
        <Stack spacing={4}>
          {/* Logo */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Logo size={80} />
          </Box>

          {/* Header */}
          <Box textAlign="center">
            <Header label="Select Your Client" variant="h3" gutterBottom />
            <Subheader label="Choose a client to access the dashboard" />
          </Box>

          {/* Search Bar */}
          <Box sx={{ maxWidth: 600, mx: 'auto', width: '100%' }}>
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
          <Box sx={{ opacity: isLoading ? 0.5 : 1, pointerEvents: isLoading ? 'none' : 'auto' }}>
            <CarrierGrid carriers={gridItems} onCarrierClick={handleClientClick} />
          </Box>

          {/* Divider before pagination */}
          {filteredClients.length > pageSize && (
            <Box component="hr" sx={{ 
              border: 'none', 
              borderTop: '1px solid',
              borderColor: 'divider',
              my: 2 
            }} />
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
            <Box textAlign="center" sx={{ py: 8 }}>
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

