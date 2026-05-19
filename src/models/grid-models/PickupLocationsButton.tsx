import { useState } from 'react'

import { LocationOn as LocationIcon } from '@mui/icons-material'
import { IconButton, Badge } from '@mui/material'

import { PickupLocationsModal } from '../../pages/products/components'

interface PickupLocation {
  pickupLocationId: number
  locationName: string
  streetAddress: string
  city: string
  state: string
  zipCode: string
}

interface PickupLocationsButtonProps {
  locations: PickupLocation[]
  productTitle?: string
}

/**
 * Component to display pickup locations button with modal
 */
const PickupLocationsButton = ({ locations, productTitle }: PickupLocationsButtonProps): React.JSX.Element => {
  const [open, setOpen] = useState(false)

  const handleOpen = (): void => {
    setOpen(true)
  }
  const handleClose = (): void => {
    setOpen(false)
  }

  return (
    <>
      <IconButton
        data-test-id="product-pickup-locations-button"
        onClick={handleOpen}
        size="small"
        sx={{
          '&:hover': {
            backgroundColor: 'primary.light',
            color: 'primary.contrastText',
          },
        }}
      >
        <Badge
          badgeContent={locations.length}
          color="primary"
          data-test-id="product-pickup-locations-badge"
        >
          <LocationIcon />
        </Badge>
      </IconButton>
      <PickupLocationsModal open={open} onClose={handleClose} locations={locations} productTitle={productTitle} />
    </>
  )
}

export default PickupLocationsButton
