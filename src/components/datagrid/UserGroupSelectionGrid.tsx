import { useCallback, useEffect, useMemo, useState } from 'react'

import { toast } from 'react-toastify'

import { Box, Divider, Paper } from '@mui/material'
import {
  type GridColDef,
  type GridColumnVisibilityModel,
  type GridFilterModel,
  type GridPaginationModel,
  type GridRowClassNameParams,
  type GridRowId,
  type GridRowSelectionModel,
  type GridSlotsComponent,
  type GridSortModel,
  type GridToolbarProps,
  type GridValidRowModel,
} from '@mui/x-data-grid'

import { userGroupApi } from '../../api/userGroupApi'
import styles from '../../styles/Users.module.scss'
import { type PaginatedGridInterface } from '../../types/grid.types'
import {
  LogicOperator,
  getInitialDensity,
  getRowClassName,
  handleFilterModelChange,
  handlePaginationModelChange,
  handleSortModelChange,
  type GridDensityType,
} from '../../utils/gridUtil'
import { BodyText, Subheader } from '../fonts'

import { type FilterGroup } from './FilterPanel'
import SimpleToolbar from './SimpleToolbar'
import { StyledDataGrid } from './StyledDataGrid'

export interface UserGroupData {
  groupId: number
  userGroupId: number
  groupName: string
  name: string
  description: string
  userIds: number[]
  memberCount: number
  userCount?: number
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

interface UserGroupSelectionGridProps {
  selectedGroupIds: number[]
  onSelectionChange: (selectedIds: number[]) => void
  columns: GridColDef[]
  isView?: boolean
  title?: string
  showSelectionInfo?: boolean
  defaultPageSize?: number
  hideToolbar?: boolean
  selectedGroupIdsFilter?: number[]
}

/**
 * Reusable User Group Selection Grid Component
 * Handles fetching, displaying, and selecting user groups
 * Supports server-side pagination, filtering, and sorting
 */
const UserGroupSelectionGrid = ({
  selectedGroupIds,
  onSelectionChange,
  columns,
  isView = false,
  title = 'User Groups',
  showSelectionInfo = true,
  defaultPageSize = 10,
  hideToolbar = false,
  selectedGroupIdsFilter,
}: UserGroupSelectionGridProps): JSX.Element => {
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set<GridRowId>(selectedGroupIds),
  })
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [density, setDensity] = useState<GridDensityType>(getInitialDensity())
  const [activeFilterGroup, setActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
    groupId: false,
    userGroupId: false,
    createdAt: false,
    updatedAt: false,
    isDeleted: false,
  })
  const [visibleColumnFields, setVisibleColumnFields] = useState<string[]>([])

  // Pagination model - default to specified page size
  const [paginationModel, setPaginationModel] = useState<PaginatedGridInterface>({
    start: 0,
    end: defaultPageSize,
    pageSize: defaultPageSize,
    includeDeleted: false,
    actualDataCount: 0,
    totalPaginationBlockCount: 0,
  })

  const [rows, setRows] = useState<UserGroupData[]>([])

  /**
   * Fetch user groups with pagination and filtering
   */
  const fetchUserGroups = useCallback(async (): Promise<void> => {
    setGroupsLoading(true)
    try {
      const response = await userGroupApi.getUserGroups({
        start: paginationModel.start,
        end: paginationModel.end,
        pageSize: paginationModel.pageSize,
        includeDeleted: false,
        logicOperator: activeFilterGroup.logicOperator,
        filters: activeFilterGroup.filters,
        selectedGroupIds: selectedGroupIdsFilter,
      })

      const responseData = response.data
      const dataArray = Array.isArray(responseData) ? responseData : []
      const mappedData: UserGroupData[] = dataArray.map((group: unknown) => {
        const userGroup = group as {
          groupId?: number
          userGroupId?: number
          groupName?: string
          name?: string
          description?: string
          userIds?: number[]
          memberCount?: number
          userCount?: number
          isDeleted?: boolean
          createdAt?: string
          updatedAt?: string
        }
        const groupIdValue: number = userGroup.groupId ?? userGroup.userGroupId ?? 0
        const groupNameValue: string = userGroup.groupName ?? userGroup.name ?? ''
        let memberCountValue = 0
        if (typeof userGroup.memberCount === 'number') {
          memberCountValue = userGroup.memberCount
        } else if (typeof userGroup.userCount === 'number') {
          memberCountValue = userGroup.userCount
        } else if (Array.isArray(userGroup.userIds)) {
          memberCountValue = userGroup.userIds.length
        }
        return {
          groupId: groupIdValue,
          userGroupId: userGroup.userGroupId ?? 0,
          groupName: groupNameValue,
          name: userGroup.name ?? '',
          description: userGroup.description ?? '',
          userIds: userGroup.userIds ?? [],
          memberCount: memberCountValue,
          userCount: userGroup.userCount,
          isDeleted: userGroup.isDeleted ?? false,
          createdAt: userGroup.createdAt ?? '',
          updatedAt: userGroup.updatedAt ?? '',
        }
      })

      setRows(mappedData)
      setTotalCount(response.totalDataCount || 0)
    } catch (error) {
      toast.error('Failed to load user groups')
      setRows([])
      setTotalCount(0)
    } finally {
      setGroupsLoading(false)
    }
  }, [paginationModel, activeFilterGroup, selectedGroupIdsFilter])

  // Update visible column fields when column visibility changes
  useEffect(() => {
    setVisibleColumnFields(
      columns
        .filter(col => {
          const visibility = columnVisibilityModel[col.field]
          const isVisible = visibility
          const isNotExcluded = !['actions', 'groupId', 'userGroupId'].includes(col.field)
          return isVisible && isNotExcluded
        })
        .map(col => col.field),
    )
  }, [columnVisibilityModel, columns])

  // Fetch user groups when pagination or filters change
  useEffect(() => {
    void fetchUserGroups()
  }, [fetchUserGroups])

  // Sync selected group IDs with row selection model
  useEffect(() => {
    setRowSelectionModel({
      type: 'include',
      ids: new Set<GridRowId>(selectedGroupIds),
    })
  }, [selectedGroupIds])

  // Memoize grid pagination model
  const gridPaginationModel = useMemo(
    () => ({
      page: Math.floor(paginationModel.start / paginationModel.pageSize),
      pageSize: paginationModel.pageSize,
    }),
    [paginationModel.start, paginationModel.pageSize],
  )

  // Memoized callbacks
  const handleClearSelection = useCallback(() => {
    setRowSelectionModel({
      type: 'include',
      ids: new Set<GridRowId>(),
    })
    onSelectionChange([])
  }, [onSelectionChange])

  const handleIncludeDeletedChange = useCallback(() => {
    // Not used - include deleted is always false for selection grid
  }, [])

  // Memoize toolbar props
  const toolbarProps = useMemo(
    () =>
      ({
        density,
        onDensityChange: setDensity,
        columns,
        onFiltersChange: setActiveFilterGroup,
        activeFilterGroup,
        rows,
        includeDeleted: false,
        onIncludeDeletedChange: handleIncludeDeletedChange,
        visibleColumnFields,
        columnVisibilityModel,
        onColumnVisibilityChange: setColumnVisibilityModel,
        hideIncludeDeleted: true,
        hideExport: false,
        onClearSelection: handleClearSelection,
        selectionCount: selectedGroupIds.length,
      }) as GridToolbarProps,
    [
      density,
      columns,
      activeFilterGroup,
      rows,
      visibleColumnFields,
      columnVisibilityModel,
      handleClearSelection,
      handleIncludeDeletedChange,
      selectedGroupIds.length,
    ],
  )

  // Grid callbacks
  const handleColumnVisibilityChange = useCallback((model: GridColumnVisibilityModel) => {
    setColumnVisibilityModel(model)
  }, [])

  const handlePaginationChange = useCallback((model: GridPaginationModel) => {
    handlePaginationModelChange(model, setPaginationModel)
  }, [])

  const handleFilterChange = useCallback(
    (model: GridFilterModel) => {
      handleFilterModelChange(model, paginationModel, setPaginationModel)
    },
    [paginationModel],
  )

  const handleSortChange = useCallback((model: GridSortModel) => {
    handleSortModelChange(model, setPaginationModel)
  }, [])

  const getRowId = useCallback((row: GridValidRowModel): number => {
    const typedRow = row as { groupId?: number; userGroupId?: number }
    return typedRow.groupId ?? typedRow.userGroupId ?? 0
  }, [])

  const getRowClassNameCallback = useCallback(
    (params: GridRowClassNameParams<GridValidRowModel>) => getRowClassName<UserGroupData>(params),
    [],
  )

  const handleRowSelectionChange = useCallback(
    (newSelection: GridRowSelectionModel) => {
      // Merge new selection with existing selection to persist across pages
      const currentIds = new Set<GridRowId>(rowSelectionModel.ids)
      const newIds = new Set<GridRowId>('ids' in newSelection ? (newSelection.ids as Iterable<GridRowId>) : [])

      // Add newly selected IDs
      newIds.forEach(id => {
        currentIds.add(id)
      })

      // Remove deselected IDs (IDs that were in current selection but not in new selection)
      // Only remove if they're in the current page's rows
      const currentPageRowIds = new Set<GridRowId>(
        rows.map((row): GridRowId => {
          const typedRow = row as { groupId?: number; userGroupId?: number }
          return (typedRow.groupId ?? typedRow.userGroupId ?? 0) as GridRowId
        }),
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
      const ids = Array.from(mergedSelection.ids)
      onSelectionChange(ids.map(id => Number(id)))
    },
    [rowSelectionModel.ids, rows, onSelectionChange],
  )

  return (
    <Paper className={styles['add-users-page__section']}>
      <Subheader label={title} className={styles['add-users-page__section-title']} />
      <Divider className={styles['add-users-page__divider']} />
      <Box className={styles['add-users-page__divider-spacer']} />

      <Box className={styles['add-users-page__grid-container']}>
        <StyledDataGrid
          dataTestId="user-groups-selection-data-grid"
          rows={rows}
          columns={columns}
          loading={groupsLoading}
          rowCount={totalCount}
          totalCount={totalCount}
          paginationModelState={paginationModel}
          setPaginationModel={setPaginationModel}
          density={density}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={handleColumnVisibilityChange}
          paginationModel={gridPaginationModel}
          onPaginationModelChange={handlePaginationChange}
          onFilterModelChange={handleFilterChange}
          onSortModelChange={handleSortChange}
          getRowId={getRowId}
          getRowClassName={getRowClassNameCallback}
          checkboxSelection={!isView}
          disableRowSelectionOnClick
          rowSelectionModel={isView ? undefined : rowSelectionModel}
          onRowSelectionModelChange={handleRowSelectionChange}
          slots={{
            toolbar: !hideToolbar && !isView ? (SimpleToolbar as GridSlotsComponent['toolbar']) : undefined,
          }}
          slotProps={{
            toolbar: !hideToolbar && !isView ? toolbarProps : undefined,
          }}
          showToolbar={!hideToolbar && !isView}
          disableColumnMenu={isView}
          className={styles['add-users-page__data-grid']}
        />
      </Box>

      {showSelectionInfo && !isView && (
        <BodyText
          variant="body2"
          color="text.secondary"
          className={`${styles['add-users-page__selection-info']} ${styles['add-users-page__selection-info-text']}`}
        >
          {selectedGroupIds.length} group(s) selected
        </BodyText>
      )}
    </Paper>
  )
}

export default UserGroupSelectionGrid
