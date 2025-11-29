import { useEffect, useMemo, useState } from 'react'

import { Box } from '@mui/material'
import { type GridColumnVisibilityModel, type GridSlotsComponent, type GridToolbarProps } from '@mui/x-data-grid'

import { userApi } from '../../api/userApi'
import {
  CustomNoRowsOverlay,
  LogicOperator,
  SimpleToolbar,
  StyledDataGrid,
  createFetchFunction,
  createToggleFunction,
  getInitialDensity,
  getRowClassName,
  handleFilterModelChange,
  handleIncludeDeletedChange,
  handlePaginationModelChange,
  handleSortModelChange,
  type FilterGroup,
  type GridDensityType,
} from '../../components/datagrid'
import { getUserGridColumns } from '../../models/gridModels/userGridColumns'
import { type UserResponseModel } from '../../models/UserModels'
import { type PaginatedGridInterface } from '../../types/grid.types'

import styles from '../../styles/Users.module.scss'

/**
 * Users Management Page with DataGrid
 * Features:
 * - Server-side pagination
 * - Custom multi-column filtering
 * - Sorting
 * - Include Deleted toggle
 * - Responsive design
 */

const Users = (): JSX.Element => {
  const [rows, setRows] = useState<UserResponseModel[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [density, setDensity] = useState<GridDensityType>(getInitialDensity())
  const [activeFilterGroup, setActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
    isDeleted: false,
    userId: false,
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

  // Get grid columns with action handlers
  const columns = useMemo(
    () =>
      getUserGridColumns(async (userId: number) => {
        await createToggleFunction(
          userApi.toggleUser,
          userId,
          async () => {
            await createFetchFunction(
              async params => {
                const result = await userApi.fetchUsersInCarrierInBatches({
                  ...params,
                  filters: params.filters as never,
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
              'Failed to fetch users',
            )
          },
          'Failed to toggle user',
        )
      }),
    [paginationModel, includeDeleted, activeFilterGroup],
  )

  useEffect(() => {
    setVisibleColumnFields(
      columns
        .filter(col => {
          const isExcluded = ['isDeleted', 'userId'].includes(col.field)
          const isVisible = columnVisibilityModel[col.field]
          return !isExcluded && isVisible
        })
        .map(col => col.field),
    )
  }, [columnVisibilityModel, columns])

  // Fetch users on mount and when pagination model changes
  useEffect(() => {
    void createFetchFunction(
      async params => {
        const result = await userApi.fetchUsersInCarrierInBatches({
          ...params,
          filters: params.filters as never,
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
      'Failed to fetch users',
    )
  }, [paginationModel, includeDeleted, activeFilterGroup])

  return (
    <Box className={styles['users-page']}>
      <Box className={styles['users-page__container']}>
        <Box className={styles['users-page__card']} data-test-id="users-grid-card">
          {/* DataGrid with custom toolbar and integrated pagination */}
          <StyledDataGrid
            dataTestId="users-data-grid"
            rows={rows}
            columns={columns}
            loading={loading}
            rowCount={totalCount}
            totalCount={totalCount}
            paginationModelState={paginationModel}
            setPaginationModel={setPaginationModel}
            paginationTestId="users-pagination"
            density={density}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={model => {
              setColumnVisibilityModel(model)
            }}
            paginationModel={{
              page: Math.floor(paginationModel.start / paginationModel.pageSize),
              pageSize: paginationModel.pageSize,
            }}
            onPaginationModelChange={model => {
              handlePaginationModelChange(model, setPaginationModel)
            }}
            onFilterModelChange={model => {
              handleFilterModelChange(model, paginationModel, setPaginationModel)
            }}
            onSortModelChange={model => {
              handleSortModelChange(model, setPaginationModel)
            }}
            getRowId={(row): number => (row as UserResponseModel).userId}
            getRowClassName={params => getRowClassName<UserResponseModel>(params)}
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

export default Users
