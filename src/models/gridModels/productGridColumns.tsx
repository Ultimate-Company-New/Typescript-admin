import { format } from 'date-fns'

import { Avatar, Box, Chip, Link, Switch } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { productApi } from '../../api/productApi'
import { RenderLongCellItem } from '../../components/datagrid'
import { APP_ROUTES } from '../../constants/routes'

import PickupLocationsButton from './PickupLocationsButton'

/**
 * Pickup location data structure
 */
interface PickupLocation {
  pickupLocationId: number
  addressNickName?: string
  [key: string]: unknown
}

/**
 * Product data structure matching API response
 */
export interface ProductData {
  productId?: number
  product?: {
    productId: number
    title?: string
    upc?: string
    length?: number
    breadth?: number
    width?: number
    height?: number
    price?: number
    discount?: number
    discountPercent?: boolean
    availableStock?: number
    itemAvailableFrom?: string
    brand?: string
    condition?: string
    countryOfManufacture?: string
    model?: string
    itemModified?: boolean
    weightKgs?: number
    returnsAllowed?: boolean
    deleted?: boolean
    category?:
      | {
          name?: string
        }
      | string
    pickupLocations?: PickupLocation[]
  }
  title?: string
  upc?: string
  length?: number
  breadth?: number
  width?: number
  height?: number
  price?: number
  discount?: number
  discountPercent?: boolean
  availableStock?: number
  itemAvailableFrom?: string
  brand?: string
  condition?: string
  countryOfManufacture?: string
  model?: string
  itemModified?: boolean
  weightKgs?: number
  returnsAllowed?: boolean
  isDeleted?: boolean
  deleted?: boolean
  category?:
    | {
        name?: string
      }
    | string
  pickupLocations?: PickupLocation[]
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
    renderCell: (params: GridRenderCellParams<ProductData>) => {
      const rowData = params.row
      const productId = rowData.productId ?? rowData.product?.productId
      const imageUrl = productApi.getProductImageUrl(productId ?? 0, 'Main')

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
          <Avatar variant="square" src={imageUrl} sx={{ width: 150,
height: 150 }}>
            {rowData.title?.[0] ?? 'P'}
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
    valueGetter: (_value, row: ProductData) => {
      const rowData = row
      const title = rowData.title ?? rowData.product?.title
      if (!title) return '—'
      return typeof title === 'string' ? title : String(title)
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>
        <RenderLongCellItem value={String(params.value || '')} />
      </Box>
    ),
  },
  {
    field: 'category',
    headerName: 'Category',
    flex: 1.5,
    minWidth: 180,
    headerAlign: 'left',
    valueGetter: (_value, row: ProductData) => {
      const rowData = row
      // The API returns category as ProductCategoryResponseModel object
      if (rowData.category && typeof rowData.category === 'object' && 'name' in rowData.category) {
        return rowData.category.name ?? '—'
      }
      // Fallback for nested product object
      if (
        rowData.product?.category &&
        typeof rowData.product.category === 'object' &&
        'name' in rowData.product.category
      ) {
        return rowData.product.category.name ?? '—'
      }
      // If it's already a string
      if (typeof rowData.category === 'string') {
        return rowData.category
      }
      return '—'
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>
        <RenderLongCellItem value={String(params.value || '—')} />
      </Box>
    ),
  },
  {
    field: 'upc',
    headerName: 'UPC',
    minWidth: 150,
    flex: 1,
    headerAlign: 'left',
    valueGetter: (_value, row: ProductData) => {
      const rowData = row
      const upc = rowData.upc ?? rowData.product?.upc
      if (!upc) return '—'
      return typeof upc === 'string' ? upc : String(upc)
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>
        <RenderLongCellItem value={String(params.value || '')} />
      </Box>
    ),
  },
  {
    field: 'dimensions',
    headerName: 'Dimensions (L x W x H)',
    minWidth: 180,
    flex: 1.2,
    headerAlign: 'left',
    valueGetter: (_value, row: ProductData) => {
      const rowData = row
      const length = rowData.length ?? rowData.product?.length
      const breadth = rowData.breadth ?? rowData.width ?? rowData.product?.breadth
      const height = rowData.height ?? rowData.product?.height
      if (!length && !breadth && !height) return '—'
      return `${length ?? 0} x ${breadth ?? 0} x ${height ?? 0}`
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>{params.value}</Box>
    ),
  },
  {
    field: 'price',
    headerName: 'Price',
    minWidth: 120,
    flex: 0.8,
    headerAlign: 'left',
    valueGetter: (_value, row: ProductData) => {
      const rowData = row
      const price = rowData.price ?? rowData.product?.price
      if (price == null) return '—'
      return `₹ ${price}`
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>{params.value}</Box>
    ),
  },
  {
    field: 'discount',
    headerName: 'Discount',
    minWidth: 120,
    flex: 0.8,
    headerAlign: 'left',
    valueGetter: (_value, row: ProductData) => {
      const rowData = row
      const discount = rowData.discount ?? rowData.product?.discount
      if (discount == null) return '—'
      const isPercent = rowData.discountPercent ?? rowData.product?.discountPercent ?? false
      return isPercent ? `${discount}%` : `₹ ${discount}`
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>{params.value}</Box>
    ),
  },
  {
    field: 'availableStock',
    headerName: 'Stock',
    minWidth: 100,
    flex: 0.6,
    headerAlign: 'left',
    valueGetter: (_value, row: ProductData) => {
      const rowData = row
      const stock = rowData.availableStock ?? rowData.product?.availableStock
      if (stock == null) return '—'
      return stock
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>{params.value}</Box>
    ),
  },
  {
    field: 'itemAvailableFrom',
    headerName: 'Available From',
    minWidth: 150,
    flex: 1,
    headerAlign: 'left',
    valueGetter: (_value, row: ProductData) => {
      const rowData = row
      const date = rowData.itemAvailableFrom ?? rowData.product?.itemAvailableFrom
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
        <RenderLongCellItem value={String(params.value || '')} />
      </Box>
    ),
  },
  {
    field: 'brand',
    headerName: 'Brand',
    minWidth: 150,
    flex: 1,
    headerAlign: 'left',
    valueGetter: (_value, row: ProductData) => {
      const rowData = row
      const brand = rowData.brand ?? rowData.product?.brand
      if (!brand) return '—'
      return brand
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>
        <RenderLongCellItem value={String(params.value || '—')} />
      </Box>
    ),
  },
  {
    field: 'condition',
    headerName: 'Condition',
    minWidth: 140,
    flex: 0.9,
    headerAlign: 'left',
    valueGetter: (_value, row: ProductData) => {
      const rowData = row
      const condition = rowData.condition ?? rowData.product?.condition
      if (!condition) return '—'
      return condition
    },
    renderCell: (params: GridRenderCellParams) => {
      if (params.value === '—') {
        return <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>{params.value}</Box>
      }

      // Map condition to color
      const getConditionColor = (
        condition: string,
      ): 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
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
          <Chip label={params.value as string} color={getConditionColor(String(params.value))} size="small" />
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
    valueGetter: (_value, row: ProductData) => {
      const rowData = row
      const country = rowData.countryOfManufacture ?? rowData.product?.countryOfManufacture
      if (!country) return '—'
      return country
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>
        <RenderLongCellItem value={String(params.value || '—')} />
      </Box>
    ),
  },
  {
    field: 'model',
    headerName: 'Model',
    minWidth: 150,
    flex: 1,
    headerAlign: 'left',
    valueGetter: (_value, row: ProductData) => {
      const rowData = row
      const model = rowData.model ?? rowData.product?.model
      if (!model) return '—'
      return model
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>
        <RenderLongCellItem value={String(params.value || '—')} />
      </Box>
    ),
  },
  {
    field: 'itemModified',
    headerName: 'Item Modified',
    minWidth: 130,
    flex: 0.8,
    headerAlign: 'left',
    valueGetter: (_value, row: ProductData) => {
      const rowData = row
      const modified = rowData.itemModified ?? rowData.product?.itemModified
      if (modified == null) return '—'
      return modified ? 'Yes' : 'No'
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>{params.value}</Box>
    ),
  },
  {
    field: 'weightKgs',
    headerName: 'Weight (kg)',
    minWidth: 120,
    flex: 0.8,
    headerAlign: 'left',
    valueGetter: (_value, row: ProductData) => {
      const rowData = row
      const weight = rowData.weightKgs ?? rowData.product?.weightKgs
      if (weight == null) return '—'
      return `${weight} kg`
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>{params.value}</Box>
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
    renderCell: (params: GridRenderCellParams<ProductData>) => {
      const rowData = params.row
      const locations = rowData.pickupLocations ?? rowData.product?.pickupLocations ?? []
      const productTitle = rowData.title ?? rowData.product?.title

      if (locations.length === 0) {
        return <Box sx={{ display: 'flex',
alignItems: 'center',
justifyContent: 'center',
height: '100%' }}>—</Box>
      }

      return (
        <Box sx={{ display: 'flex',
alignItems: 'center',
justifyContent: 'center',
height: '100%' }}>
          <PickupLocationsButton locations={locations as never} productTitle={productTitle} />
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
    renderCell: (params: GridRenderCellParams<ProductData>) => {
      const rowData = params.row
      const productId = rowData.productId ?? rowData.product?.productId
      const returnsAllowed = rowData.returnsAllowed ?? rowData.product?.returnsAllowed ?? false

      return (
        <Box sx={{ display: 'flex',
alignItems: 'center',
justifyContent: 'center',
height: '100%' }}>
          <Switch
            checked={returnsAllowed}
            onChange={() => {
              if (productId != null) {
                onToggleReturns(productId)
              }
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
    renderCell: (params: GridRenderCellParams<ProductData>) => {
      const rowData = params.row
      const productId = rowData.productId ?? rowData.product?.productId

      if (rowData.isDeleted ?? rowData.deleted ?? rowData.product?.deleted) {
        return (
          <div>
            <Link
              href="#"
              onClick={e => {
                e.preventDefault()
                if (productId != null) {
                  onToggleProduct(productId)
                }
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
          <Link href={`${APP_ROUTES.DASHBOARD.ADD_PRODUCT}?productId=${productId}&isView`} sx={{ cursor: 'pointer' }}>
            View
          </Link>
          <Link href={`${APP_ROUTES.DASHBOARD.ADD_PRODUCT}?productId=${productId}`} sx={{ cursor: 'pointer' }}>
            Edit
          </Link>
          <Link
            href="#"
            onClick={e => {
              e.preventDefault()
              if (productId != null) {
                onToggleProduct(productId)
              }
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
