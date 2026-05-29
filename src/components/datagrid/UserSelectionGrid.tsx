import { useCallback, useEffect, useMemo, useState } from 'react'

import { Box, Divider, Paper } from '@mui/material'
import {
  type GridColDef,
  type GridColumnVisibilityModel,
  type GridFilterModel,
  type GridPaginationModel,
  type GridRowId,
  type GridRowSelectionModel,
  type GridSlotsComponent,
  type GridSortModel,
  type GridToolbarProps,
} from '@mui/x-data-grid'

import { userApi } from '../../api/userApi'
import { type UserResponseModel } from '../../models/api-models'
import styles from '../../styles/Users.module.scss'
import { type PaginatedGridInterface } from '../../types/grid.types'
import {
  GridDensity,
  LogicOperator,
  createFetchFunction,
  getRowClassName,
  handleFilterModelChange,
  handleIncludeDeletedChange,
  handlePaginationModelChange,
  handleSortModelChange,
  type GridDensityType,
  type LogicOperatorType,
} from '../../utils/gridUtil'
import { BodyText, Subheader } from '../fonts'

import { CustomNoRowsOverlay, SimpleToolbar, StyledDataGrid, type FilterCondition, type FilterGroup } from '.'

export interface UserData {
  userId: number
  loginName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

interface UserSelectionGridProps {
  selectedUserIds: number[]
  onSelectionChange: (selectedIds: number[]) => void
  columns: GridColDef[]
  isView?: boolean
  title?: string
  showSelectionInfo?: boolean
  defaultPageSize?: number
  hideToolbar?: boolean
  selectedUserIdsFilter?: number[]
  preloadedUsers?: UserResponseModel[]
  dataTestId?: string
  gridContainerClassName?: string
  dividerSpacerClassName?: string
}

/**
 * Reusable User Selection Grid Component
 * A replica of Users.tsx with 2 key differences:
 * 1. No actions column (filtered out from columns)
 * 2. Checkbox selection enabled with selection count display
 *
 * Handles fetching, displaying, and selecting users
 * Supports server-side pagination, filtering, and sorting
 */
const UserSelectionGrid = ({
  selectedUserIds,
  onSelectionChange,
  columns,
  isView = false,
  title = 'Users',
  showSelectionInfo = true,
  defaultPageSize = 10,
  hideToolbar = false,
  selectedUserIdsFilter,
  preloadedUsers,
  dataTestId = 'users-selection-data-grid',
  gridContainerClassName = styles['add-users-page__grid-container'],
  dividerSpacerClassName = styles['add-users-page__divider-spacer'],
}: UserSelectionGridProps): JSX.Element => {
  const [rows, setRows] = useState<UserResponseModel[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [density, setDensity] = useState<GridDensityType>(GridDensity.STANDARD)
  const [activeFilterGroup, setActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
    isDeleted: false,
    userId: false,
  })
  const [visibleColumnFields, setVisibleColumnFields] = useState<string[]>([])
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set<GridRowId>(selectedUserIds),
  })

  // Pagination model - default to specified page size
  const [paginationModel, setPaginationModel] = useState<PaginatedGridInterface>({
    start: 0,
    end: defaultPageSize,
    pageSize: defaultPageSize,
    includeDeleted: false,
    actualDataCount: 0,
    totalPaginationBlockCount: 0,
  })

  // Update visible column fields when column visibility changes
  useEffect(() => {
    setVisibleColumnFields(
      columns
        .filter(col => {
          const isExcluded = ['isDeleted', 'userId', 'userActions'].includes(col.field)
          const isVisible = columnVisibilityModel[col.field]
          return !isExcluded && isVisible
        })
        .map(col => col.field),
    )
  }, [columnVisibilityModel, columns])

  // Fetch users on mount and when pagination model changes
  useEffect(() => {
    const useViewFilter =
      isView && Array.isArray(selectedUserIdsFilter) && selectedUserIdsFilter.length > 0
    if (isView && !useViewFilter) {
      const viewRows = Array.isArray(preloadedUsers) ? preloadedUsers : []
      setRows(viewRows)
      setTotalCount(viewRows.length)
      return
    }

    void createFetchFunction(
      async (params: {
        start: number
        end: number
        includeDeleted: boolean
        logicOperator: LogicOperatorType
        filters: FilterCondition[]
      }) => {
        const result = await userApi.fetchUsersInCarrierInBatches({
          ...params,
          filters: params.filters as never,
          selectedUserIds: selectedUserIdsFilter,
        })
        return {
          data: result.data,
          totalDataCount: result.totalDataCount,
        }
      },
      setLoading,
      setRows,
      setTotalCount,
      paginationModel,
      includeDeleted,
      activeFilterGroup,
    )
  }, [paginationModel, includeDeleted, activeFilterGroup, isView, preloadedUsers, selectedUserIdsFilter])

  // Sync selected user IDs with row selection model
  useEffect(() => {
    setRowSelectionModel({
      type: 'include',
      ids: new Set<GridRowId>(selectedUserIds),
    })
  }, [selectedUserIds])

  // Memoized callbacks
  const handleClearSelection = useCallback((): void => {
    setRowSelectionModel({
      type: 'include',
      ids: new Set<GridRowId>(),
    })
    onSelectionChange([])
  }, [onSelectionChange])

  // Handle row selection changes
  const handleRowSelectionChange = (newSelection: GridRowSelectionModel): void => {
    // Merge new selection with existing selection to persist across pages
    const currentIds = new Set<GridRowId>(rowSelectionModel.ids)
    const newIds = new Set<GridRowId>('ids' in newSelection ? (newSelection.ids as Iterable<GridRowId>) : [])

    // Add newly selected IDs
    newIds.forEach(id => {
      currentIds.add(id)
    })

    // Remove deselected IDs (IDs that were in current selection but not in new selection)
    // Only remove if they're in the current page's rows
    const currentPageRowIds = new Set<GridRowId>(rows.map((row): GridRowId => row.userId))

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
  }

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
        includeDeleted,
        onIncludeDeletedChange: (checked: boolean) => {
          handleIncludeDeletedChange(checked, setIncludeDeleted, setPaginationModel)
        },
        visibleColumnFields,
        columnVisibilityModel,
        onColumnVisibilityChange: setColumnVisibilityModel,
        hideIncludeDeleted: true,
        hideExport: false,
        // Only show selection-related features when not in view mode
        onClearSelection: isView ? undefined : handleClearSelection,
        selectionCount: isView ? undefined : selectedUserIds.length,
      }) as GridToolbarProps,
    [
      density,
      columns,
      activeFilterGroup,
      rows,
      includeDeleted,
      visibleColumnFields,
      columnVisibilityModel,
      handleClearSelection,
      selectedUserIds.length,
      isView,
    ],
  )

  return (
    <Paper className={styles['add-users-page__section']}>
      <Subheader label={title} className={styles['add-users-page__section-title']} />
      <Divider className={styles['add-users-page__divider']} />
      <Box className={dividerSpacerClassName} />

      <Box className={gridContainerClassName}>
        <StyledDataGrid
          dataTestId={dataTestId}
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
          getRowId={row => (row as UserResponseModel).userId}
          getRowClassName={params => getRowClassName<UserResponseModel>(params)}
          checkboxSelection={!isView}
          disableRowSelectionOnClick
          rowSelectionModel={isView ? undefined : rowSelectionModel}
          onRowSelectionModelChange={handleRowSelectionChange}
          slots={{
            toolbar: !hideToolbar ? (SimpleToolbar as GridSlotsComponent['toolbar']) : undefined,
            noRowsOverlay: CustomNoRowsOverlay,
          }}
          slotProps={{
            toolbar: !hideToolbar ? toolbarProps : undefined,
          }}
          showToolbar={!hideToolbar}
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
          {selectedUserIds.length} user(s) selected
        </BodyText>
      )}
    </Paper>
  )
}

export default UserSelectionGrid
