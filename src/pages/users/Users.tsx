import { useState, useEffect, useCallback } from 'react'
import { Container, Box } from '@mui/material'
import {
  GridPaginationModel,
  GridFilterModel,
  GridSortModel,
} from '@mui/x-data-grid'
import {
  StyledDataGrid,
  CustomNoRowsOverlay,
  SimpleToolbar,
  filterChangeFunction,
  FilterGroup,
} from '../../components/DataGrid'
import { getUserGridColumns } from '../../utils/userGridColumns'
import { userApi } from '../../api/userApi'
import { UserResponseModel } from '../../models/UserModels'
import { PaginatedGridInterface } from '../../types/grid.types'

/**
 * Users Management Page with DataGrid
 * Features:
 * - Server-side pagination
 * - Custom multi-column filtering
 * - Sorting
 * - Include Deleted toggle
 * - Responsive design
 */
const DENSITY_STORAGE_KEY = 'mui-data-grid-density'

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

const Users = () => {
  const [rows, setRows] = useState<UserResponseModel[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [density, setDensity] = useState<'compact' | 'standard' | 'comfortable'>(getInitialDensity())
  const [activeFilterGroup, setActiveFilterGroup] = useState<FilterGroup>({ logicOperator: 'AND', filters: [] })

  // Pagination model
  const [paginationModel, setPaginationModel] = useState<PaginatedGridInterface>({
    start: 0,
    end: 25,
    pageSize: 25,
    includeDeleted: false,
    actualDataCount: 0,
    totalPaginationBlockCount: 0,
  })

  // Grid columns
  const columns = getUserGridColumns()

  /**
   * Fetch users from API
   */
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await userApi.fetchUsersInCarrierInBatches({
        start: paginationModel.start,
        end: paginationModel.end,
        includeDeleted: paginationModel.includeDeleted,
        columnName: paginationModel.columnName,
        condition: paginationModel.condition,
        filterExpr: paginationModel.filterExpr,
      })

      setRows(response.data)
      setTotalCount(response.totalDataCount)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setRows([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [paginationModel])

  // Fetch users on mount and when pagination model changes
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

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
   * Handle filter changes
   */
  const handleFilterModelChange = (model: GridFilterModel) => {
    filterChangeFunction({
      gridFilterModel: model,
      setGridFunction: setPaginationModel,
      paginatedGridModel: paginationModel,
    })
  }

  /**
   * Handle sorting changes
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
      // Clear sorting
      setPaginationModel((prev) => ({
        ...prev,
        columnName: undefined,
        condition: undefined,
      }))
    }
  }

  /**
   * Handle include deleted checkbox
   */
  const handleIncludeDeletedChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = event.target.checked
    setIncludeDeleted(checked)

    setPaginationModel((prev) => ({
      ...prev,
      includeDeleted: checked,
      start: 0, // Reset to first page
    }))
  }

  /**
   * Get row class name for styling deleted rows
   */
  const getRowClassName = (params: any) => {
    const classes = [params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd']
    if (params.row.isDeleted) {
      classes.push('deleted')
    }
    return classes.join(' ')
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* DataGrid with custom toolbar */}
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
          getRowId={(row) => row.userId}
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
            },
          }}
          showToolbar
          disableRowSelectionOnClick
          disableColumnMenu={false}
          initialState={{
            columns: {
              columnVisibilityModel: {
                isDeleted: false, // Hide the isDeleted column
                userId: false, // Hide the userId column
                locked: false, // Hide locked status by default
                lastLoginAt: false, // Hide last login by default
                createdAt: false, // Hide created at by default
              },
            },
          }}
        />
      </Box>
    </Container>
  )
}

export default Users
