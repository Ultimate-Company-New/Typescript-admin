import CloseIcon from '@mui/icons-material/Close'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { Modal, Box, IconButton, Grid, Chip, CircularProgress } from '@mui/material'

import { BodyText, Subheader, SecondaryFont } from '../../../components/fonts'
import styles from '../../../styles/Products.module.scss'

import PickupLocationCard, { type PickupLocationCardData } from './PickupLocationCard'

interface PickupLocationsModalProps {
  open: boolean
  onClose: () => void
  locations: PickupLocationCardData[]
  productTitle?: string
  loading?: boolean
}

const PickupLocationsModal = ({ open, onClose, locations, productTitle, loading = false }: PickupLocationsModalProps): JSX.Element => (
  <Modal open={open} onClose={onClose} aria-labelledby="pickup-locations-modal-title">
    <Box className={styles['pickup-locations-modal']} data-test-id="pickup-locations-modal">
      {/* Header */}
      <Box className={styles['pickup-locations-modal__header']}>
        <Box className={styles['pickup-locations-modal__header-content']}>
          <LocationOnIcon color="primary" />
          <Subheader label="Pickup Locations" variant="h6" id="pickup-locations-modal-title" />
          {!loading && (
            <Chip
              label={locations.length}
              size="small"
              color="primary"
              data-test-id="pickup-locations-modal-count"
            />
          )}
        </Box>
        <IconButton onClick={onClose} size="small" data-test-id="pickup-locations-modal-close">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Product Title */}
      {productTitle != null && (
        <Box
          className={styles['pickup-locations-modal__product-title']}
          data-test-id="pickup-locations-modal-item-title"
        >
          <SecondaryFont>
            Available locations for: <strong>{productTitle}</strong>
          </SecondaryFont>
        </Box>
      )}

      {/* Content */}
      <Box className={styles['pickup-locations-modal__content']}>
        {loading ? (
          <Box
            className={styles['pickup-locations-modal__loading']}
            data-test-id="pickup-locations-modal-loading"
          >
            <CircularProgress size={40} />
            <SecondaryFont>Loading pickup location details...</SecondaryFont>
          </Box>
        ) : locations.length === 0 ? (
          <Box className={styles['pickup-locations-modal__empty']}>
            <BodyText color="text.secondary">No pickup locations available</BodyText>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {locations.map((location, index) => (
              <Grid item xs={12} sm={6} key={location.pickupLocation?.pickupLocationId ?? location.pickupLocationId ?? index}>
                <PickupLocationCard location={location} index={index} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  </Modal>
)

export default PickupLocationsModal
