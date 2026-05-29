import InventoryIcon from '@mui/icons-material/Inventory'
import {
    Box,
    Card,
    CardContent,
    Chip,
    Typography
} from '@mui/material'

import { getPackageTypeColor, getPackageTypeLabel } from '../../../constants/appConstants'

// ============================================================================
// Types
// ============================================================================

export interface PackageMappingItem {
  packageId: number
  quantity: number
  reorderLevel: number
  maxStockLevel: number
  packageDetails?: {
    packageName?: string
    packageType?: string
    length?: number
    breadth?: number
    height?: number
    maxWeight?: number
    pricePerUnit?: number
    standardCapacity?: number
    notes?: string
  }
}

// ============================================================================
// Package Card Component
// ============================================================================

interface PackageCardProps {
  mapping: PackageMappingItem
}

export const PackageCard = ({ mapping }: PackageCardProps): JSX.Element => {
  const { packageId, quantity, reorderLevel, maxStockLevel, packageDetails } = mapping

  return (
    <Card
      variant="outlined"
      data-test-id={`pickup-location-package-card-${packageId}`}
      sx={{
        borderRadius: 3,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {/* Header with Icon and Package Type */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                backgroundColor: 'secondary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <InventoryIcon sx={{ color: 'secondary.main', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  lineHeight: 1.3,
                  wordBreak: 'break-word',
                }}
              >
                {packageDetails?.packageName ?? `Package #${packageId}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {packageId}
              </Typography>
            </Box>
          </Box>
          {packageDetails?.packageType && (
            <Chip
              label={getPackageTypeLabel(packageDetails.packageType)}
              size="small"
              color={getPackageTypeColor(packageDetails.packageType)}
              sx={{ fontWeight: 500, height: 24 }}
            />
          )}
        </Box>

        {/* Quantity Badge */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            border: '2px solid',
            borderColor: 'secondary.main',
            borderRadius: 2,
            py: 1.5,
            mb: 2,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>
            {quantity}
          </Typography>
          <Typography variant="body2" sx={{ ml: 1, color: 'secondary.main' }}>
            units in stock
          </Typography>
        </Box>

        {/* Stock Levels */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box
            sx={{
              backgroundColor: 'warning.50',
              borderRadius: 1.5,
              p: 1.5,
              textAlign: 'center',
              border: '1px solid',
              borderColor: 'warning.200',
            }}
          >
            <Typography variant="caption" color="warning.dark" sx={{ fontWeight: 500 }}>
              Reorder At
            </Typography>
            <Typography variant="h6" color="warning.dark" sx={{ fontWeight: 700 }}>
              {reorderLevel}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: 'success.50',
              borderRadius: 1.5,
              p: 1.5,
              textAlign: 'center',
              border: '1px solid',
              borderColor: 'success.200',
            }}
          >
            <Typography variant="caption" color="success.dark" sx={{ fontWeight: 500 }}>
              Max Stock
            </Typography>
            <Typography variant="h6" color="success.dark" sx={{ fontWeight: 700 }}>
              {maxStockLevel}
            </Typography>
          </Box>
        </Box>

        {/* Specifications Grid */}
        {packageDetails && (
          <Box
            sx={{
              backgroundColor: 'grey.50',
              borderRadius: 2,
              p: 1.5,
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1,
              }}
            >
              {packageDetails.length != null && packageDetails.breadth != null && packageDetails.height != null && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Dimensions
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {packageDetails.length} × {packageDetails.breadth} × {packageDetails.height} cm
                  </Typography>
                </Box>
              )}
              {packageDetails.maxWeight != null && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Max Weight
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {packageDetails.maxWeight} kg
                  </Typography>
                </Box>
              )}
              {packageDetails.pricePerUnit != null && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Price/Unit
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                    ₹{packageDetails.pricePerUnit.toLocaleString()}
                  </Typography>
                </Box>
              )}
              {packageDetails.standardCapacity != null && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Capacity
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {packageDetails.standardCapacity} items
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default PackageCard
