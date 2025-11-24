import CloseIcon from '@mui/icons-material/Close'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { Modal, Box, Typography, IconButton, Card, CardContent, Grid, Chip } from '@mui/material'

interface PickupLocation {
  // API structure: ProductPickupLocationItem
  pickupLocation?: {
    pickupLocationId: number
    addressNickName?: string
    address?: {
      nameOnAddress?: string
      streetAddress?: string
      streetAddress2?: string
      streetAddress3?: string
      city?: string
      state?: string
      postalCode?: string
      country?: string
      phoneOnAddress?: string
      emailOnAddress?: string
    }
  }
  availableStock?: number
  // Legacy flat structure support
  pickupLocationId?: number
  locationName?: string
  addressNickName?: string
  address?: {
    nameOnAddress?: string
    streetAddress?: string
    streetAddress2?: string
    streetAddress3?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
    phoneOnAddress?: string
    emailOnAddress?: string
  }
  nameOnAddress?: string
  streetAddress?: string
  streetAddress2?: string
  streetAddress3?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  phoneOnAddress?: string
  emailOnAddress?: string
  contactPhone?: string
  contactEmail?: string
}

interface PickupLocationsModalProps {
  open: boolean
  onClose: () => void
  locations: PickupLocation[]
  productTitle?: string
}

const PickupLocationsModal = ({ open, onClose, locations, productTitle }: PickupLocationsModalProps): JSX.Element => (
  <Modal open={open} onClose={onClose} aria-labelledby="pickup-locations-modal-title">
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: 800,
        maxHeight: '90vh',
        bgcolor: 'background.paper',
        boxShadow: 24,
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <LocationOnIcon color="primary" />
          <Typography
            variant="h6"
            component="h2"
            id="pickup-locations-modal-title"
          >
            Pickup Locations
          </Typography>
          <Chip
            label={locations.length}
            size="small"
            color="primary"
          />
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Product Title */}
      {productTitle != null && (
        <Box
          sx={{
            px: 2,
            pt: 2,
            pb: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Available locations for: <strong>{productTitle}</strong>
          </Typography>
        </Box>
      )}

      {/* Content */}
      <Box
        sx={{
          p: 2,
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {locations.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 200,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              No pickup locations available
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {locations.map((item, index) => {
              // Extract data from ProductPickupLocationItem structure
              const location = item.pickupLocation ?? item
              const { availableStock } = item
              const locationId = location.pickupLocationId ?? item.pickupLocationId
              const locationName =
                location.addressNickName ?? item.addressNickName ?? item.locationName ?? `Location ${index + 1}`

              return (
                <Grid item xs={12} sm={6} key={locationId ?? index}>
                  <Card
                    variant="outlined"
                    sx={{
                      height: '100%',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 2,
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <CardContent>
                      {/* Location Name */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1.5,
                        }}
                      >
                        <LocationOnIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle1" fontWeight={600}>
                          {locationName}
                        </Typography>
                      </Box>

                      {/* Available Stock */}
                      {availableStock != null && (
                        <Box
                          sx={{
                            mb: 1.5,
                          }}
                        >
                          <Chip
                            label={`Available Stock: ${availableStock}`}
                            size="small"
                            color={availableStock > 0 ? 'success' : 'error'}
                            sx={{
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                      )}

                      {/* Address */}
                      {(() => {
                        // Get address fields from nested address object or directly from location
                        const address = location.address ?? item.address
                        const nameOnAddress = address?.nameOnAddress ?? item.nameOnAddress
                        const streetAddress = address?.streetAddress ?? item.streetAddress
                        const streetAddress2 = address?.streetAddress2 ?? item.streetAddress2
                        const streetAddress3 = address?.streetAddress3 ?? item.streetAddress3
                        const city = address?.city ?? item.city
                        const state = address?.state ?? item.state
                        const postalCode = address?.postalCode ?? item.postalCode
                        const country = address?.country ?? item.country
                        const phoneOnAddress = address?.phoneOnAddress ?? item.phoneOnAddress
                        const emailOnAddress = address?.emailOnAddress ?? item.emailOnAddress

                        // Check if any address field exists
                        const hasAddress =
                          nameOnAddress != null ||
                          streetAddress != null ||
                          streetAddress2 != null ||
                          streetAddress3 != null ||
                          city != null ||
                          state != null ||
                          postalCode != null ||
                          country != null ||
                          phoneOnAddress != null ||
                          emailOnAddress != null

                        // Debug: Log the data structure
                        if ((import.meta.env.DEV as boolean) === true) {
                          // eslint-disable-next-line no-console -- Debug logging in development
                          console.log('Pickup Location Data:', {
                            item,
                            location,
                            address,
                            hasAddress,
                            fields: {
                              nameOnAddress,
                              streetAddress,
                              streetAddress2,
                              streetAddress3,
                              city,
                              state,
                              postalCode,
                              country,
                              phoneOnAddress,
                              emailOnAddress,
                            },
                          })
                        }

                        return (
                          <Box
                            sx={{
                              mb: 1.5,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary" gutterBottom fontWeight={600}>
                              Address:
                            </Typography>
                            {hasAddress ? (
                              <Typography variant="body2">
                                {nameOnAddress != null && (
                                  <>
                                    <strong>{nameOnAddress}</strong>
                                    <br />
                                  </>
                                )}
                                {streetAddress != null && (
                                  <>
                                    {streetAddress}
                                    <br />
                                  </>
                                )}
                                {streetAddress2 != null && (
                                  <>
                                    {streetAddress2}
                                    <br />
                                  </>
                                )}
                                {streetAddress3 != null && (
                                  <>
                                    {streetAddress3}
                                    <br />
                                  </>
                                )}
                                {city != null && state != null && (
                                  <>
                                    {city}, {state} {postalCode ?? ''}
                                    <br />
                                  </>
                                )}
                                {country != null && (
                                  <>
                                    {country}
                                    <br />
                                  </>
                                )}
                                {phoneOnAddress != null && (
                                  <>
                                    <br />
                                    📞{' '}
                                    <a
                                      href={`tel:${phoneOnAddress}`}
                                      style={{
                                        color: 'inherit',
                                        textDecoration: 'none',
                                      }}
                                    >
                                      {phoneOnAddress}
                                    </a>
                                    <br />
                                  </>
                                )}
                                {emailOnAddress != null && (
                                  <>
                                    ✉️{' '}
                                    <a
                                      href={`mailto:${emailOnAddress}`}
                                      style={{
                                        color: 'inherit',
                                        textDecoration: 'none',
                                      }}
                                    >
                                      {emailOnAddress}
                                    </a>
                                  </>
                                )}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                Address information not available
                              </Typography>
                            )}
                          </Box>
                        )
                      })()}

                      {/* Contact Info (legacy support) */}
                      {(item.contactPhone != null || item.contactEmail != null) && (
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom fontWeight={600}>
                            Contact:
                          </Typography>
                          {item.contactPhone != null && (
                            <Typography variant="body2">
                              📞{' '}
                              <a
                                href={`tel:${item.contactPhone}`}
                                style={{
                                  color: 'inherit',
                                  textDecoration: 'none',
                                }}
                              >
                                {item.contactPhone}
                              </a>
                            </Typography>
                          )}
                          {item.contactEmail != null && (
                            <Typography variant="body2">
                              ✉️{' '}
                              <a
                                href={`mailto:${item.contactEmail}`}
                                style={{
                                  color: 'inherit',
                                  textDecoration: 'none',
                                }}
                              >
                                {item.contactEmail}
                              </a>
                            </Typography>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        )}
      </Box>
    </Box>
  </Modal>
)

export default PickupLocationsModal
