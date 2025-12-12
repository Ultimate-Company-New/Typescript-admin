import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Box, Divider, Paper } from '@mui/material'
import {
  type GridColumnVisibilityModel,
  type GridFilterModel,
  type GridPaginationModel,
  type GridRowId,
  type GridRowSelectionModel,
  type GridSlotsComponent,
  type GridSortModel,
  type GridToolbarProps,
} from '@mui/x-data-grid'

import { productApi } from '../../api/productApi'
import { getProductGridColumns, type ProductData } from '../../models/grid-models/ProductGridColumns'
import styles from '../../styles/Users.module.scss'
import { type PaginatedGridInterface } from '../../types/grid.types'
import {
  createFetchFunction,
  getRowClassName,
  GridDensity,
  handleFilterModelChange,
  handlePaginationModelChange,
  handleSortModelChange,
  LogicOperator,
  type GridDensityType,
} from '../../utils/gridUtil'
import { Subheader } from '../fonts'

import CustomNoRowsOverlay from './CustomNoRowsOverlay'
import { type FilterGroup } from './FilterPanel'
import SimpleToolbar from './SimpleToolbar'
import { StyledDataGrid } from './StyledDataGrid'

/**
 * Product with quantity mapping
 */
export interface ProductQuantityMapping {
  productId: number
  productTitle: string
  quantity: number
}

interface ProductSelectionGridProps {
  /** Current product-quantity mappings */
  selectedProducts: ProductQuantityMapping[]
  /** Callback when selection or quantities change */
  onSelectionChange: (products: ProductQuantityMapping[]) => void
  /** Whether the grid is in view-only mode */
  isView?: boolean
  /** Grid title */
  title?: string
  /** Default page size */
  defaultPageSize?: number
}

/**
 * Product Selection Grid Component
 * Same as Products page grid but with:
 * - Editable quantity column
 * - No actions column
 * - Checkbox selection
 */
const ProductSelectionGrid = ({
  selectedProducts,
  onSelectionChange,
  isView = false,
  title = 'Select Products',
  defaultPageSize = 10,
}: ProductSelectionGridProps): JSX.Element => {
  const [rows, setRows] = useState<ProductData[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  // Use STANDARD density like Products.tsx
  const [density, setDensity] = useState<GridDensityType>(GridDensity.STANDARD)
  const [activeFilterGroup, setActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })
  // Same column visibility as Products.tsx - only hide productId and isDeleted, plus actions
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
    isDeleted: false,
    productId: false,
    actions: false, // Hide actions column for selection grid
  })
  const [visibleColumnFields, setVisibleColumnFields] = useState<string[]>([])
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set<GridRowId>(selectedProducts.map(p => p.productId)),
  })

  // Local state for quantity inputs
  const [quantityInputs, setQuantityInputs] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {}
    selectedProducts.forEach(p => {
      initial[p.productId] = p.quantity
    })
    return initial
  })

  // Pagination model - same as Products.tsx (pageSize 25)
  const [paginationModel, setPaginationModel] = useState<PaginatedGridInterface>({
    start: 0,
    end: defaultPageSize,
    pageSize: defaultPageSize,
    includeDeleted: false,
    actualDataCount: 0,
    totalPaginationBlockCount: 0,
  })

  // Selected product IDs as a Set for the column
  const selectedProductIds = useMemo(
    () => new Set(selectedProducts.map(p => p.productId)),
    [selectedProducts]
  )

  // Use refs to avoid re-creating columns on every quantity/selection change
  const quantityInputsRef = useRef(quantityInputs)
  const selectedProductsRef = useRef(selectedProducts)
  const onSelectionChangeRef = useRef(onSelectionChange)
  const selectedProductIdsRef = useRef(selectedProductIds)

  // Keep refs updated
  useEffect(() => {
    quantityInputsRef.current = quantityInputs
  }, [quantityInputs])

  useEffect(() => {
    selectedProductsRef.current = selectedProducts
    selectedProductIdsRef.current = selectedProductIds
  }, [selectedProducts, selectedProductIds])

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange
  }, [onSelectionChange])

  // Stable quantity change handler using refs
  const handleQuantityChange = useCallback((productId: number, quantity: number) => {
    setQuantityInputs(prev => ({ ...prev, [productId]: quantity }))

    // Update parent if product is already selected
    if (selectedProductIdsRef.current.has(productId)) {
      const updatedProducts = selectedProductsRef.current.map(p =>
        p.productId === productId ? { ...p, quantity } : p
      )
      onSelectionChangeRef.current(updatedProducts)
    }
  }, [])

  // Get columns from ProductGridColumns with editable quantity
  // Recreate columns when selectedProducts changes to ensure quantities are correct
  const columns = useMemo(
    () => {
      // Build quantity map directly from selectedProducts to ensure correct initial values
      const quantityMap: Record<number, number> = {}
      selectedProducts.forEach(p => {
        quantityMap[p.productId] = p.quantity
      })

      return getProductGridColumns(
        () => {}, // onToggleProduct - not used in selection grid
        () => {}, // onToggleReturns - not used in selection grid
        {
          quantityEditable: !isView,
          quantityValues: quantityMap,
          onQuantityChange: handleQuantityChange,
          selectedProductIds,
        }
      )
    },
    [isView, handleQuantityChange, selectedProductIds, selectedProducts]
  )

  // Update visible column fields when column visibility changes - same logic as Products.tsx
  useEffect(() => {
    setVisibleColumnFields(
      columns
        .filter(col => {
          const isExcluded = ['isDeleted', 'productId', 'deleted'].includes(col.field)
          const isVisible = columnVisibilityModel[col.field]
          return !isExcluded && isVisible
        })
        .map(col => col.field)
    )
  }, [columnVisibilityModel, columns])

  // Fetch products
  useEffect(() => {
    void createFetchFunction(
      productApi.getProductsInBatches,
      setLoading,
      setRows,
      setTotalCount,
      paginationModel,
      false,
      activeFilterGroup
    )
  }, [paginationModel, activeFilterGroup])

  // Sync selected product IDs with row selection model
  useEffect(() => {
    setRowSelectionModel({
      type: 'include',
      ids: new Set<GridRowId>(selectedProducts.map(p => p.productId)),
    })
    // Also sync quantity inputs
    const newInputs: Record<number, number> = {}
    selectedProducts.forEach(p => {
      newInputs[p.productId] = p.quantity
    })
    setQuantityInputs(newInputs)
  }, [selectedProducts])

  // Handle row selection changes
  const handleRowSelectionChange = useCallback(
    (newSelection: GridRowSelectionModel): void => {
      const currentIds = new Set<GridRowId>(rowSelectionModel.ids)
      const newIds = new Set<GridRowId>(
        'ids' in newSelection ? (newSelection.ids as Iterable<GridRowId>) : []
      )

      // Add newly selected IDs
      newIds.forEach(id => {
        currentIds.add(id)
      })

      // Remove deselected IDs from current page
      const currentPageRowIds = new Set<GridRowId>(
        rows.map((row): GridRowId => row.productId ?? row.product?.productId ?? 0)
      )

      currentPageRowIds.forEach(id => {
        if (!newIds.has(id)) {
          currentIds.delete(id)
        }
      })

      const mergedSelection: GridRowSelectionModel = {
        type: 'include',
        ids: currentIds,
      }

      setRowSelectionModel(mergedSelection)

      // Update parent with new selection
      const updatedProducts: ProductQuantityMapping[] = []
      currentIds.forEach(id => {
        const productId = Number(id)
        const existingProduct = selectedProducts.find(p => p.productId === productId)
        const row = rows.find(r => (r.productId ?? r.product?.productId) === productId)
        const productTitle = row?.title ?? row?.product?.title ?? ''

        updatedProducts.push({
          productId,
          productTitle: existingProduct?.productTitle ?? productTitle,
          quantity: quantityInputs[productId] ?? existingProduct?.quantity ?? 1,
        })
      })

      onSelectionChange(updatedProducts)
    },
    [rowSelectionModel.ids, rows, selectedProducts, quantityInputs, onSelectionChange]
  )

  // Handle clear selection
  const handleClearSelection = useCallback((): void => {
    setRowSelectionModel({
      type: 'include',
      ids: new Set<GridRowId>(),
    })
    setQuantityInputs({})
    onSelectionChange([])
  }, [onSelectionChange])

  // Toolbar props - similar to Products.tsx
  const toolbarProps = useMemo(
    () =>
      ({
        density,
        onDensityChange: setDensity,
        columns,
        onFiltersChange: setActiveFilterGroup,
        activeFilterGroup,
        rows,
        hideIncludeDeleted: true,
        visibleColumnFields,
        columnVisibilityModel,
        onColumnVisibilityChange: setColumnVisibilityModel,
        onClearSelection: isView ? undefined : handleClearSelection,
        selectionCount: isView ? undefined : selectedProducts.length,
      }) as GridToolbarProps,
    [
      density,
      columns,
      activeFilterGroup,
      rows,
      visibleColumnFields,
      columnVisibilityModel,
      handleClearSelection,
      selectedProducts.length,
      isView,
    ]
  )

  return (
    <Paper className={styles['add-users-page__section']} sx={{ overflow: 'hidden' }}>
      <Subheader label={title} className={styles['add-users-page__section-title']} />
      <Divider className={styles['add-users-page__divider']} />
      <Box className={styles['add-users-page__divider-spacer']} />

      <Box sx={{ height: '100%', width: '100%', overflow: 'auto' }}>
        <StyledDataGrid
          dataTestId="product-selection-grid"
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={totalCount}
          totalCount={totalCount}
          paginationModelState={paginationModel}
          setPaginationModel={setPaginationModel}
          density={density}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={setColumnVisibilityModel}
          paginationModel={{
            page: Math.floor(paginationModel.start / paginationModel.pageSize),
            pageSize: paginationModel.pageSize,
          }}
          onPaginationModelChange={(model: GridPaginationModel) => {
            handlePaginationModelChange(model, setPaginationModel)
          }}
          onFilterModelChange={(model: GridFilterModel) => {
            handleFilterModelChange(model, paginationModel, setPaginationModel)
          }}
          onSortModelChange={(model: GridSortModel) => {
            handleSortModelChange(model, setPaginationModel)
          }}
          getRowId={row =>
            (row as ProductData).productId ?? (row as ProductData).product?.productId ?? 0
          }
          getRowClassName={params => getRowClassName<ProductData>(params)}
          checkboxSelection={!isView}
          disableRowSelectionOnClick
          rowSelectionModel={isView ? undefined : rowSelectionModel}
          onRowSelectionModelChange={handleRowSelectionChange}
          showToolbar
          slots={{
            toolbar: SimpleToolbar as GridSlotsComponent['toolbar'],
            noRowsOverlay: CustomNoRowsOverlay,
          }}
          slotProps={{
            toolbar: toolbarProps,
          }}
          disableColumnMenu={false}
          rowHeight={180}
          pageSizeOptions={[10, 25, 50]}
        />
      </Box>
    </Paper>
  )
}

export default ProductSelectionGrid
