import { useState, useEffect, useCallback } from 'react'
import { Box } from '@mui/material'
import {
  GridPaginationModel,
  GridFilterModel,
  GridSortModel,
} from '@mui/x-data-grid'
import { toast } from 'react-toastify'
import {
  StyledDataGrid,
  CustomNoRowsOverlay,
  SimpleToolbar,
  filterChangeFunction,
  FilterGroup,
  PaginationComponent,
} from '../../components/DataGrid'
import { getPackageGridColumns } from '../../utils/packageGridColumns'
import { packageApi } from '../../api/packageApi'
import { PaginatedGridInterface } from '../../types/grid.types'
import '../../styles/Packages.scss'

const DENSITY_STORAGE_KEY = 'mui-data-grid-density-packages'

const getInitialDensity = (): 'compact' | 'standard' | 'comfortable' => {
  try {
    const storedDensity = localStorage.getItem(DENSITY_STORAGE_KEY)
    if (storedDensity && ['compact', 'standard', 'comfortable'].includes(storedDensity)) {
      return storedDensity as 'compact' | 'standard' | 'comfortable'
    }
    return 'standard'
  } catch {
    return 'standard'
  }
}

const Packages = () => {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [density, setDensity] = useState<'compact' | 'standard' | 'comfortable'>(getInitialDensity())
  const [activeFilterGroup, setActiveFilterGroup] = useState<FilterGroup>({ logicOperator: 'AND', filters: [] })

  const [paginationModel, setPaginationModel] = useState<PaginatedGridInterface>({
    start: 0,
    end: 25,
    pageSize: 25,
    includeDeleted: false,
    actualDataCount: 0,
    totalPaginationBlockCount: 0,
  })

  /**
   * Fetch packages from API
   */
  const fetchPackages = useCallback(async () => {
    setLoading(true)
    try {
      const response = await packageApi.getPackagesInBatches({
        start: paginationModel.start,
        end: paginationModel.end,
        includeDeleted: includeDeleted,
        logicOperator: activeFilterGroup.logicOperator,
        filters: activeFilterGroup.filters,
      })

      setRows(response.data || [])
      setTotalCount(response.totalDataCount || 0)
    } catch (error) {
      console.error('Error fetching packages:', error)
      toast.error('Failed to fetch packages')
      setRows([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [paginationModel, includeDeleted, activeFilterGroup])

  /**
   * Handle toggle package (activate/deactivate)
   */
  const handleTogglePackage = useCallback(async (packageId: number) => {
    try {
      await packageApi.togglePackage(packageId)
      toast.success('Package toggled successfully')
      fetchPackages()
    } catch (error) {
      console.error('Error toggling package:', error)
      toast.error('Failed to toggle package')
    }
  }, [fetchPackages])

  /**
   * Get grid columns with action handlers
   */
  const columns = getPackageGridColumns(handleTogglePackage)

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  /**
   * Handle pagination changes
   */
  const handlePaginationModelChange = (model: GridPaginationModel) => {
    const start = model.page * model.pageSize
    const end = start + model.pageSize

    setPaginationModel((prev) => ({
      ...prev,
      start,
      end,
      pageSize: model.pageSize,
    }))
  }

  /**
   * Handle filter model changes
   */
  const handleFilterModelChange = (model: GridFilterModel) => {
    filterChangeFunction({
      gridFilterModel: model,
      setGridFunction: setPaginationModel,
      paginatedGridModel: paginationModel,
    })
  }

  /**
   * Handle sort model changes
   */
  const handleSortModelChange = (model: GridSortModel) => {
    if (model.length > 0) {
      const sortField = model[0].field
      const sortOrder = model[0].sort

      setPaginationModel((prev) => ({
        ...prev,
        columnName: sortField,
        condition: sortOrder === 'desc' ? 'desc' : 'asc',
      }))
    } else {
      setPaginationModel((prev) => ({
        ...prev,
        columnName: undefined,
        condition: undefined,
      }))
    }
  }

  /**
   * Handle include deleted checkbox change
   */
  const handleIncludeDeletedChange = (checked: boolean) => {
    setIncludeDeleted(checked)
    setPaginationModel((prev) => ({
      ...prev,
      includeDeleted: checked,
      start: 0,
    }))
  }

  /**
   * Handle custom pagination change
   */
  const handleCustomPaginationChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    const start = (page - 1) * paginationModel.pageSize
    const end = start + paginationModel.pageSize

    setPaginationModel((prev) => ({
      ...prev,
      start,
      end,
    }))
  }

  /**
   * Get row class name for styling deleted rows
   */
  const getRowClassName = (params: any) => {
    const classes = [params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd']
    if (params.row.isDeleted || params.row.deleted) {
      classes.push('deleted')
    }
    return classes.join(' ')
  }

  return (
    <Box className="packages-page">
      <Box className="packages-page__container">
        <Box className="packages-page__card">
          <StyledDataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            rowCount={totalCount}
            pageSizeOptions={[10, 25, 50, 100]}
            paginationMode="server"
            filterMode="server"
            sortingMode="server"
            density={density}
            paginationModel={{
              page: Math.floor(paginationModel.start / paginationModel.pageSize),
              pageSize: paginationModel.pageSize,
            }}
            onPaginationModelChange={handlePaginationModelChange}
            onFilterModelChange={handleFilterModelChange}
            onSortModelChange={handleSortModelChange}
            getRowId={(row) => row.packageId || row._package?.packageId}
            getRowClassName={getRowClassName}
            slots={{
              toolbar: SimpleToolbar,
              noRowsOverlay: CustomNoRowsOverlay,
            }}
            slotProps={{
              toolbar: {
                density,
                onDensityChange: setDensity,
                columns,
                onFiltersChange: setActiveFilterGroup,
                activeFilterGroup,
                rows,
                includeDeleted,
                onIncludeDeletedChange: handleIncludeDeletedChange,
              },
            }}
            showToolbar
            disableRowSelectionOnClick
            disableColumnMenu={false}
            hideFooter
            initialState={{
              columns: {
                columnVisibilityModel: {
                  isDeleted: false,
                  packageId: false,
                },
              },
            }}
          />

          <Box className="packages-page__pagination">
            <PaginationComponent
              totalItems={totalCount}
              currentPage={Math.floor(paginationModel.start / paginationModel.pageSize) + 1}
              pageSize={paginationModel.pageSize}
              onPageChange={handleCustomPaginationChange}
              itemLabel="packages"
              data-test-id="packages-pagination"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Packages

