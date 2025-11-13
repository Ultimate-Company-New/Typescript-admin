import { Grid, Card, CardMedia, CardContent, Box, Typography, CardActionArea } from '@mui/material'
import { useState } from 'react'

export interface CarrierGridItem {
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          No carriers found
        </Typography>
      </Box>
    )
  }

  return (
    <Grid container spacing={3}>
      {carriers.map((carrier) => (
        <Grid item xs={12} sm={6} md={4} key={carrier.id}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
              border: selectedId === carrier.id ? 2 : 0,
              borderColor: 'primary.main',
            }}
            data-test-id={`carrier-card-${carrier.id}`}
          >
            <CardActionArea
              onClick={() => handleClick(carrier)}
              sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
            >
              <CardMedia
                component="div"
                sx={{
                  pt: '75%', // 4:3 aspect ratio
                  backgroundColor: 'grey.200',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {carrier.logo ? (
                  <Box
                    component="img"
                    src={carrier.logo}
                    alt={carrier.name}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      p: 2,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h4" color="text.secondary">
                      {carrier.name.charAt(0).toUpperCase()}
                    </Typography>
                  </Box>
                )}
              </CardMedia>
              <CardContent sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

export default CarrierGrid

