import { useState } from 'react'

import { format } from 'date-fns'

import LocationOnIcon from '@mui/icons-material/LocationOn'
import { Link, Avatar, Box, Switch, Chip, IconButton, Badge } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { productApi } from '../../api/productApi'
import { RenderLongCellItem } from '../../components/DataGrid'
import { PickupLocationsModal } from '../../components/Products'
import { APP_ROUTES } from '../../constants/routes'

/**
 * Component to display pickup locations button with modal
 */
const PickupLocationsButton = ({ locations, productTitle }: { locations: any[], productTitle?: string }) => {
  const [open, setOpen] = useState(false)

  const handleOpen = () => {
    setOpen(true)
  }
  const handleClose = () => {
    setOpen(false)
  }

  return (
    <>
      <IconButton
        onClick={handleOpen}
        size="small"
        sx={{
          '&:hover': {
            backgroundColor: 'primary.light',
            color: 'primary.contrastText',
          },
        }}
      >
        <Badge badgeContent={locations.length} color="primary">
          <LocationOnIcon />
        </Badge>
      </IconButton>
      <PickupLocationsModal
        open={open}
        onClose={handleClose}
        locations={locations}
        productTitle={productTitle}
      />
    </>
  )
}

/**
 * Get product grid columns with action handlers
 */
export const getProductGridColumns = (
  onToggleProduct: (productId: number) => void,
  onToggleReturns: (productId: number) => void,
): GridColDef[] => [
  {
    field: 'productId',
    headerName: 'Product ID',
    hideable: false,
    filterable: false,
    width: 0,
    minWidth: 0,
  },
  {
    field: 'mainImage',
    headerName: 'Image',
    minWidth: 180,
    flex: 1,
    sortable: false,
    filterable: false,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams) => {
      const productId = params.row.productId || params.row.product?.productId
      const imageUrl = productApi.getProductImageUrl(productId, 'Main')

      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            width: '100%',
          }}
        >
          <Avatar
            variant="square"
            src={imageUrl}
            sx={{ width: 150,
              height: 150 }}
          >
            {params.row.title?.[0] || 'P'}
          </Avatar>
        </div>
      )
    },
  },
  {
    field: 'title',
    headerName: 'Title',
    flex: 2,
    minWidth: 250,
    headerAlign: 'left',
    valueGetter: (value, row: any) => {
      const title = row.title || row.product?.title
      if (!title) return '—'
      return typeof title === 'string' ? title : String(title)
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        <RenderLongCellItem
          columnWidth={params.colDef.computedWidth}
          value={String(params.value || '')}
        />
      </Box>
    ),
  },
  {
    field: 'category',
    headerName: 'Category',
    flex: 1.5,
    minWidth: 180,
    headerAlign: 'left',
    valueGetter: (value, row: any) => {
      // The API returns category as ProductCategoryResponseModel object
      if (row.category && typeof row.category === 'object' && row.category !== null) {
        return row.category.name || '—'
      }
      // Fallback for nested product object
      if (row.product?.category && typeof row.product.category === 'object') {
        return row.product.category.name || '—'
      }
      // If it's already a string
      if (typeof row.category === 'string') {
        return row.category
      }
      return '—'
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        <RenderLongCellItem
          columnWidth={params.colDef.computedWidth}
          value={String(params.value || '—')}
        />
      </Box>
    ),
  },
  {
    field: 'upc',
    headerName: 'UPC',
    minWidth: 150,
    flex: 1,
    headerAlign: 'left',
    valueGetter: (value, row: any) => {
      const upc = row.upc || row.product?.upc
      if (!upc) return '—'
      return typeof upc === 'string' ? upc : String(upc)
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        <RenderLongCellItem
          columnWidth={params.colDef.computedWidth}
          value={String(params.value || '')}
        />
      </Box>
    ),
  },
  {
    field: 'dimensions',
    headerName: 'Dimensions (L x W x H)',
    minWidth: 180,
    flex: 1.2,
    headerAlign: 'left',
    valueGetter: (value, row: any) => {
      const length = row.length || row.product?.length
      const breadth = row.breadth || row.width || row.product?.breadth
      const height = row.height || row.product?.height
      if (!length && !breadth && !height) return '—'
      return `${length || 0} x ${breadth || 0} x ${height || 0}`
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        {params.value}
      </Box>
    ),
  },
  {
    field: 'price',
    headerName: 'Price',
    minWidth: 120,
    flex: 0.8,
    headerAlign: 'left',
    valueGetter: (value, row: any) => {
      const price = row.price || row.product?.price
      if (!price && price !== 0) return '—'
      return `₹ ${price}`
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        {params.value}
      </Box>
    ),
  },
  {
    field: 'discount',
    headerName: 'Discount',
    minWidth: 120,
    flex: 0.8,
    headerAlign: 'left',
    valueGetter: (value, row: any) => {
      const discount = row.discount || row.product?.discount
      if (!discount && discount !== 0) return '—'
      const isPercent = row.discountPercent || row.product?.discountPercent || false
      return isPercent ? `${discount}%` : `₹ ${discount}`
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        {params.value}
      </Box>
    ),
  },
  {
    field: 'availableStock',
    headerName: 'Stock',
    minWidth: 100,
    flex: 0.6,
    headerAlign: 'left',
    valueGetter: (value, row: any) => {
      const stock = row.availableStock || row.product?.availableStock
      if (stock === null || stock === undefined) return '—'
      return stock
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        {params.value}
      </Box>
    ),
  },
  {
    field: 'itemAvailableFrom',
    headerName: 'Available From',
    minWidth: 150,
    flex: 1,
    headerAlign: 'left',
    valueGetter: (value, row: any) => {
      const date = row.itemAvailableFrom || row.product?.itemAvailableFrom
      if (!date) return '—'
      try {
        return format(new Date(date), 'do MMM yyyy')
      } catch {
        return '—'
      }
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        <RenderLongCellItem
          columnWidth={params.colDef.computedWidth}
          value={String(params.value || '')}
        />
      </Box>
    ),
  },
  {
    field: 'brand',
    headerName: 'Brand',
    minWidth: 150,
    flex: 1,
    headerAlign: 'left',
    valueGetter: (value, row: any) => {
      const brand = row.brand || row.product?.brand
      if (!brand) return '—'
      return brand
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        <RenderLongCellItem
          columnWidth={params.colDef.computedWidth}
          value={String(params.value || '—')}
        />
      </Box>
    ),
  },
  {
    field: 'condition',
    headerName: 'Condition',
    minWidth: 140,
    flex: 0.9,
    headerAlign: 'left',
    valueGetter: (value, row: any) => {
      const condition = row.condition || row.product?.condition
      if (!condition) return '—'
      return condition
    },
    renderCell: (params: GridRenderCellParams) => {
      if (params.value === '—') {
        return (
          <Box sx={{ display: 'flex',
            alignItems: 'center',
            height: '100%' }}>
            {params.value}
          </Box>
        )
      }

      // Map condition to color
      const getConditionColor = (condition: string) => {
        const conditionLower = condition.toLowerCase()
        if (conditionLower.includes('new')) return 'success'
        if (conditionLower.includes('refurbished') || conditionLower.includes('renewed')) return 'info'
        if (conditionLower.includes('used') || conditionLower.includes('pre-owned')) return 'warning'
        if (conditionLower.includes('damaged') || conditionLower.includes('defective')) return 'error'
        return 'default'
      }

      return (
        <Box sx={{ display: 'flex',
          alignItems: 'center',
          height: '100%' }}>
          <Chip
            label={params.value}
            color={getConditionColor(String(params.value))}
            size="small"
          />
        </Box>
      )
    },
  },
  {
    field: 'countryOfManufacture',
    headerName: 'Country of Manufacture',
    minWidth: 180,
    flex: 1.2,
    headerAlign: 'left',
    valueGetter: (value, row: any) => {
      const country = row.countryOfManufacture || row.product?.countryOfManufacture
      if (!country) return '—'
      return country
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        <RenderLongCellItem
          columnWidth={params.colDef.computedWidth}
          value={String(params.value || '—')}
        />
      </Box>
    ),
  },
  {
    field: 'model',
    headerName: 'Model',
    minWidth: 150,
    flex: 1,
    headerAlign: 'left',
    valueGetter: (value, row: any) => {
      const model = row.model || row.product?.model
      if (!model) return '—'
      return model
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        <RenderLongCellItem
          columnWidth={params.colDef.computedWidth}
          value={String(params.value || '—')}
        />
      </Box>
    ),
  },
  {
    field: 'itemModified',
    headerName: 'Item Modified',
    minWidth: 130,
    flex: 0.8,
    headerAlign: 'left',
    valueGetter: (value, row: any) => {
      const modified = row.itemModified || row.product?.itemModified
      if (modified === null || modified === undefined) return '—'
      return modified ? 'Yes' : 'No'
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        {params.value}
      </Box>
    ),
  },
  {
    field: 'weightKgs',
    headerName: 'Weight (kg)',
    minWidth: 120,
    flex: 0.8,
    headerAlign: 'left',
    valueGetter: (value, row: any) => {
      const weight = row.weightKgs || row.product?.weightKgs
      if (weight === null || weight === undefined) return '—'
      return `${weight} kg`
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        {params.value}
      </Box>
    ),
  },
  {
    field: 'pickupLocations',
    headerName: 'Pickup Locations',
    minWidth: 150,
    flex: 1,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams) => {
      const locations = params.row.pickupLocations || params.row.product?.pickupLocations || []
      const productTitle = params.row.title || params.row.product?.title

      if (locations.length === 0) {
        return (
          <Box sx={{ display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%' }}>
              —
          </Box>
        )
      }

      return (
        <Box sx={{ display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%' }}>
          <PickupLocationsButton locations={locations} productTitle={productTitle} />
        </Box>
      )
    },
  },
  {
    field: 'returnsAllowed',
    headerName: 'Returns Allowed',
    minWidth: 150,
    flex: 1,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams) => {
      const productId = params.row.productId || params.row.product?.productId
      const returnsAllowed = params.row.returnsAllowed || params.row.product?.returnsAllowed || false

      return (
        <Box sx={{ display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%' }}>
          <Switch
            checked={returnsAllowed}
            onChange={() => {
              onToggleReturns(productId)
            }}
            color="primary"
            size="small"
          />
        </Box>
      )
    },
  },
  {
    field: 'actions',
    headerName: 'Actions',
    minWidth: 200,
    flex: 1.2,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams) => {
      const productId = params.row.productId || params.row.product?.productId

      if (params.row.isDeleted || params.row.deleted || params.row.product?.deleted) {
        return (
          <div>
            <Link
              href="#"
              onClick={e => {
                e.preventDefault()
                onToggleProduct(productId)
              }}
              sx={{ cursor: 'pointer',
                color: 'success.main' }}
            >
                Activate
            </Link>
          </div>
        )
      }

      return (
        <div style={{ display: 'flex',
          gap: '12px' }}>
          <Link
            href={`${APP_ROUTES.DASHBOARD.ADD_PRODUCT}?productId=${productId}&isView`}
            sx={{ cursor: 'pointer' }}
          >
              View
          </Link>
          <Link
            href={`${APP_ROUTES.DASHBOARD.ADD_PRODUCT}?productId=${productId}`}
            sx={{ cursor: 'pointer' }}
          >
              Edit
          </Link>
          <Link
            href="#"
            onClick={e => {
              e.preventDefault()
              onToggleProduct(productId)
            }}
            sx={{ cursor: 'pointer',
              color: 'error.main' }}
          >
              Deactivate
          </Link>
        </div>
      )
    },
  },
]
