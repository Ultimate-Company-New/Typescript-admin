import type React from 'react'
import { useState, useEffect, useMemo, useCallback } from 'react'

import { toast } from 'react-toastify'

import { Box } from '@mui/material'
import { type GridColumnVisibilityModel, type GridToolbarProps, type GridSlotsComponent } from '@mui/x-data-grid'

import { userGroupApi, type UserGroupResponseModel } from '../../api/userGroupApi'
import {
  StyledDataGrid,
  CustomNoRowsOverlay,
  SimpleToolbar,
  type FilterGroup,
  handlePaginationModelChange,
  handleFilterModelChange,
  handleSortModelChange,
  handleIncludeDeletedChange,
  getRowClassName,
  getInitialDensity,
  type GridDensityType,
  LogicOperator,
  createToggleFunction,
} from '../../components/datagrid'
import { getUserGroupGridColumns, type UserGroupData } from '../../models/gridModels/userGroupGridColumns'
import { type PaginatedGridInterface } from '../../types/grid.types'

import styles from './UserGroups.module.scss'

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
  const [density, setDensity] = useState<GridDensityType>(getInitialDensity() as GridDensityType)
  const [activeFilterGroup, setActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
    isDeleted: false,
    userGroupId: false,
    groupId: false,
    createdAt: false,
    updatedAt: false,
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
        includeDeleted,
        logicOperator: activeFilterGroup.logicOperator,
        filters: activeFilterGroup.filters,
      })

      // Map API response to grid data structure
      const mappedData = (response.data || []).map(
        (group: UserGroupResponseModel & { groupId?: number; groupName?: string; memberCount?: number }) => ({
          ...group,
          groupId: group.groupId ?? group.userGroupId,
          groupName: group.groupName ?? group.name,
          memberCount: group.memberCount ?? group.userCount ?? (group.userIds ? group.userIds.length : 0),
        }),
      )

      setRows(mappedData)
      setTotalCount(response.totalDataCount ?? 0)
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
        await createToggleFunction(
          userGroupApi.toggleUserGroup,
          userGroupId,
          fetchUserGroups,
          'Failed to toggle user group',
        )
      }),
    [fetchUserGroups],
  )

  useEffect(() => {
    setVisibleColumnFields(
      columns
        .filter(col => columnVisibilityModel[col.field] && !['isDeleted', 'userGroupId', 'groupId'].includes(col.field))
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
            itemLabel="groups"
            paginationTestId="user-groups-pagination"
            density={density}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={model => {
              setColumnVisibilityModel(model as GridColumnVisibilityModel)
            }}
            paginationModel={{
              page: Math.floor(paginationModel.start / paginationModel.pageSize),
              pageSize: paginationModel.pageSize,
            }}
            onPaginationModelChange={model => {
              void handlePaginationModelChange(model, setPaginationModel)
            }}
            onFilterModelChange={model => {
              void handleFilterModelChange(model, paginationModel, setPaginationModel)
            }}
            onSortModelChange={model => {
              void handleSortModelChange(model, setPaginationModel)
            }}
            getRowId={row => (row as UserGroupData).groupId ?? (row as UserGroupData).userGroupId}
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
