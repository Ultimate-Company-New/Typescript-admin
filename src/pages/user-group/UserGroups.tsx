import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { toast } from 'react-toastify'

import { Box } from '@mui/material'
import {
  type GridColumnVisibilityModel,
  type GridFilterModel,
  type GridPaginationModel,
  type GridSlotsComponent,
  type GridSortModel,
  type GridToolbarProps,
} from '@mui/x-data-grid'

import { userGroupApi } from '../../api/userGroupApi'
import {
  CustomNoRowsOverlay,
  GridDensity,
  LogicOperator,
  SimpleToolbar,
  StyledDataGrid,
  createToggleFunction,
  getRowClassName,
  handleFilterModelChange,
  handleIncludeDeletedChange,
  handlePaginationModelChange,
  handleSortModelChange,
  type FilterGroup,
  type GridDensityType,
} from '../../components/datagrid'
import { getUserGroupGridColumns, type UserGroupData } from '../../models/grid-models/UserGroupGridColumns'
import styles from '../../styles/UserGroups.module.scss'
import { type PaginatedGridInterface } from '../../types/grid.types'

/**
 * User Groups Management Page with DataGrid
 * Features:
 * - Server-side pagination
 * - Custom multi-column filtering
 * - Sorting
 * - Include Deleted toggle
 * - Responsive design
 */

const UserGroups = (): React.JSX.Element => {
  const [rows, setRows] = useState<UserGroupData[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [density, setDensity] = useState<GridDensityType>(GridDensity.STANDARD)
  const [activeFilterGroup, setActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
    id: false,
    isDeleted: false,
    createdAt: false,
    updatedAt: false,
    notes: false,
  })
  const [visibleColumnFields, setVisibleColumnFields] = useState<string[]>([])

  // Pagination model
  const [paginationModel, setPaginationModel] = useState<PaginatedGridInterface>({
    start: 0,
    end: 25,
    pageSize: 25,
    includeDeleted: false,
    actualDataCount: 0,
    totalPaginationBlockCount: 0,
  })

  // Fetch function with data mapping
  const fetchUserGroups = useCallback(async () => {
    setLoading(true)
    try {
      const response = await userGroupApi.getUserGroups({
        start: paginationModel.start,
        end: paginationModel.end,
        pageSize: paginationModel.pageSize,
        includeDeleted,
        logicOperator: activeFilterGroup.logicOperator,
        filters: activeFilterGroup.filters,
      })

      // API response already matches grid structure
      setRows(response.data as UserGroupData[])
      setTotalCount(response.totalDataCount)
    } catch {
      toast.error('Failed to fetch user groups')
      setRows([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [paginationModel, includeDeleted, activeFilterGroup])

  // Get grid columns with action handlers
  const columns = useMemo(
    () =>
      getUserGroupGridColumns(async (userGroupId: number) => {
        await createToggleFunction(userGroupApi.toggleUserGroup, userGroupId, fetchUserGroups)
      }),
    [fetchUserGroups],
  )

  useEffect(() => {
    setVisibleColumnFields(
      columns
        .filter(col => {
          // Column is visible if it's not explicitly hidden and not in the excluded list
          const isExplicitlyHidden = !columnVisibilityModel[col.field]
          const isExcludedFromFilters = ['id', 'isDeleted', 'createdAt', 'updatedAt', 'notes', 'actions'].includes(
            col.field,
          )
          return !isExplicitlyHidden && !isExcludedFromFilters
        })
        .map(col => col.field),
    )
  }, [columnVisibilityModel, columns])

  // Fetch user groups on mount and when pagination model changes
  useEffect(() => {
    void fetchUserGroups()
  }, [fetchUserGroups])

  return (
    <Box className={styles['user-groups-page']}>
      <Box className={styles['user-groups-page__container']}>
        <Box className={styles['user-groups-page__card']} data-test-id="user-groups-grid-card">
          {/* DataGrid with custom toolbar and integrated pagination */}
          <StyledDataGrid
            dataTestId="user-groups-data-grid"
            rows={rows}
            columns={columns}
            loading={loading}
            rowCount={totalCount}
            totalCount={totalCount}
            paginationModelState={paginationModel}
            setPaginationModel={setPaginationModel}
            density={density}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={model => {
              setColumnVisibilityModel(model)
            }}
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
            getRowId={row => {
              const data = row as UserGroupData
              return data.groupId ?? data.userGroupId ?? 0
            }}
            getRowClassName={params => getRowClassName<UserGroupData>(params)}
            slots={{
              toolbar: SimpleToolbar as GridSlotsComponent['toolbar'],
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
                onIncludeDeletedChange: (checked: boolean) => {
                  handleIncludeDeletedChange(checked, setIncludeDeleted, setPaginationModel)
                },
                visibleColumnFields,
                columnVisibilityModel,
                onColumnVisibilityChange: setColumnVisibilityModel,
              } as GridToolbarProps,
            }}
            showToolbar
            disableRowSelectionOnClick
            disableColumnMenu={false}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default UserGroups
