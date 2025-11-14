import { useState, useCallback, useEffect } from 'react'
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
import { getUserGroupGridColumns } from '../../utils/userGroupGridColumns'
import { PaginatedGridInterface } from '../../types/grid.types'
import { userGroupApi } from '../../api/userGroupApi'
import '../../styles/UserGroups.scss'

/**
 * User Group data structure matching API response
 */
interface UserGroupData {
  groupId: number
  groupName: string
  description: string
  userIds: number[]
  memberCount: number // Calculated from userIds.length
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

/**
 * User Groups Grid Page
 * Features:
 * - Server-side pagination
 * - Custom multi-column filtering
 * - Sorting
 * - Density control
 * - Export to CSV
 * - Include deleted toggle
 * - Responsive design
 */
const DENSITY_STORAGE_KEY = 'mui-data-grid-density-groups'

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

const UserGroups = () => {
  const [rows, setRows] = useState<UserGroupData[]>([])
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

  /**
   * Fetch user groups from API
   */
  const fetchUserGroups = useCallback(async () => {
    setLoading(true)
    try {
      const response = await userGroupApi.getUserGroups({
        start: paginationModel.start,
        end: paginationModel.end,
        includeDeleted: includeDeleted,
        logicOperator: activeFilterGroup.logicOperator,
        filters: activeFilterGroup.filters,
      })

      // Map API response to grid data structure with calculated member count
      const mappedData = (response.data || []).map((group: UserGroupData) => ({
        ...group,
        memberCount: group.userIds ? group.userIds.length : 0,
      }))

      setRows(mappedData)
      setTotalCount(response.totalDataCount || 0)
    } catch (error) {
      console.error('Error fetching user groups:', error)
      toast.error('Failed to fetch user groups')
      setRows([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [paginationModel, includeDeleted, activeFilterGroup])

  /**
   * Handle toggle user group (activate/deactivate)
   */
  const handleToggleGroup = useCallback(async (userGroupId: number) => {
    try {
      await userGroupApi.toggleUserGroup(userGroupId)
      toast.success('User group toggled successfully')
      fetchUserGroups()
    } catch (error) {
      console.error('Error toggling user group:', error)
      toast.error('Failed to toggle user group')
    }
  }, [fetchUserGroups])

  /**
   * Get grid columns with action handlers
   */
  const columns = getUserGroupGridColumns(handleToggleGroup)

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchUserGroups()
  }, [fetchUserGroups])

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
  const getRowClassName = (params: { indexRelativeToCurrentPage: number; row: { isDeleted?: boolean } }) => {
    const classes = [params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd']
    if (params.row.isDeleted) {
      classes.push('deleted')
    }
    return classes.join(' ')
  }

  return (
    <Box className="user-groups-page">
      <Box className="user-groups-page__container">
        <Box className="user-groups-page__card">
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
            getRowId={(row) => row.groupId || row.userGroupId}
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
                onIncludeDeletedChange: setIncludeDeleted,
              },
            }}
            showToolbar
            disableRowSelectionOnClick
            disableColumnMenu={false}
            hideFooter // Hide default pagination footer
            initialState={{
              columns: {
                columnVisibilityModel: {
                  userGroupId: false, // Hide the ID column
                  isDeleted: false, // Hide the isDeleted column
                  createdAt: false, // Hide created at by default
                  updatedAt: false, // Hide updated at by default
                },
              },
            }}
          />

          {/* Custom Pagination Component */}
          <Box className="user-groups-page__pagination">
            <PaginationComponent
              totalItems={totalCount}
              currentPage={Math.floor(paginationModel.start / paginationModel.pageSize) + 1}
              pageSize={paginationModel.pageSize}
              onPageChange={handleCustomPaginationChange}
              itemLabel="groups"
              data-test-id="user-groups-pagination"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default UserGroups
