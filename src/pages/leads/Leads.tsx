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
import { getLeadGridColumns, LeadData } from '../../utils/leadGridColumns'
import { PaginatedGridInterface } from '../../types/grid.types'
import { leadApi } from '../../api/leadApi'
import '../../styles/Leads.scss'

/**
 * Leads Grid Page
 * Features:
 * - Server-side pagination
 * - Custom multi-column filtering
 * - Sorting
 * - Density control
 * - Export to CSV
 * - Include deleted toggle
 * - Responsive design
 */
const DENSITY_STORAGE_KEY = 'mui-data-grid-density-leads'

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

const Leads = () => {
  const [rows, setRows] = useState<LeadData[]>([])
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
   * Fetch leads from API
   */
  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const response = await leadApi.getLeadsInBatches({
        start: paginationModel.start,
        end: paginationModel.end,
        includeDeleted: includeDeleted,
        logicOperator: activeFilterGroup.logicOperator,
        filters: activeFilterGroup.filters,
      })

      setRows(response.data || [])
      setTotalCount(response.totalDataCount || 0)
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Failed to fetch leads')
      setRows([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [paginationModel, includeDeleted, activeFilterGroup])

  /* OLD MOCK DATA - REMOVED
  const fetchLeads_OLD = useCallback(async () => {
    setLoading(true)
    try {
      // Mock data for now
      const mockData: LeadData[] = [
        {
          lead: {
            leadId: 1,
            leadStatus: 'New',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            website: 'https://example.com',
            phone: '1234567890',
            company: 'Acme Corp',
            companySize: 50,
            annualRevenue: '1000000',
            title: 'CEO',
            deleted: false,
          },
          address: {
            line1: '123 Main St',
            line2: 'Suite 100',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
          },
          assignedAgent: {
            firstName: 'Jane',
            lastName: 'Smith',
            loginName: 'jane.smith@company.com',
          },
          createdBy: {
            firstName: 'Admin',
            lastName: 'User',
            loginName: 'admin@company.com',
          },
        },
        {
          lead: {
            leadId: 2,
            leadStatus: 'Contacted',
            firstName: 'Alice',
            lastName: 'Johnson',
            email: 'alice.johnson@example.com',
            website: 'https://aliceco.com',
            phone: '9876543210',
            company: 'Tech Solutions Inc',
            companySize: 100,
            annualRevenue: '5000000',
            title: 'CTO',
            deleted: false,
          },
          address: {
            line1: '456 Oak Ave',
            line2: '',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94102',
          },
          assignedAgent: {
            firstName: 'Bob',
            lastName: 'Williams',
            loginName: 'bob.williams@company.com',
          },
          createdBy: {
            firstName: 'Admin',
            lastName: 'User',
            loginName: 'admin@company.com',
          },
        },
        {
          lead: {
            leadId: 3,
            leadStatus: 'Qualified',
            firstName: 'Michael',
            lastName: 'Brown',
            email: 'michael.brown@example.com',
            website: 'https://brownenterprises.com',
            phone: '5551234567',
            company: 'Brown Enterprises',
            companySize: 200,
            annualRevenue: '10000000',
            title: 'VP Sales',
            deleted: false,
          },
          address: {
            line1: '789 Pine Rd',
            line2: 'Floor 5',
            city: 'Chicago',
            state: 'IL',
            zipCode: '60601',
          },
          assignedAgent: {
            firstName: 'Sarah',
            lastName: 'Davis',
            loginName: 'sarah.davis@company.com',
          },
          createdBy: {
            firstName: 'Admin',
            lastName: 'User',
            loginName: 'admin@company.com',
          },
        },
      ]

      setRows(mockData)
      setTotalCount(mockData.length)
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Failed to fetch leads')
      setRows([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [paginationModel, includeDeleted, activeFilterGroup])
  */

  /**
   * Handle toggle lead (activate/deactivate)
   */
  const handleToggleLead = useCallback(async (leadId: number) => {
    try {
      await leadApi.toggleLead(leadId)
      toast.success('Lead toggled successfully')
      fetchLeads()
    } catch (error) {
      console.error('Error toggling lead:', error)
      toast.error('Failed to toggle lead')
    }
  }, [fetchLeads])

  /**
   * Get grid columns with action handlers
   */
  const columns = getLeadGridColumns(handleToggleLead)

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

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
  const getRowClassName = (params: any) => {
    const classes = [params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd']
    if (params.row.isDeleted || params.row.lead?.deleted) {
      classes.push('deleted')
    }
    return classes.join(' ')
  }

  return (
    <Box className="leads-page">
      <Box className="leads-page__container">
        <Box className="leads-page__card">
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
            getRowId={(row) => row.leadId || row.lead?.leadId}
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
                  leadId: false, // Hide the ID column
                  deleted: false, // Hide the deleted column
                  website: false, // Hide website by default
                  createdBy: false, // Hide created by by default
                },
              },
            }}
          />

          {/* Custom Pagination Component */}
          <Box className="leads-page__pagination">
            <PaginationComponent
              totalItems={totalCount}
              currentPage={Math.floor(paginationModel.start / paginationModel.pageSize) + 1}
              pageSize={paginationModel.pageSize}
              onPageChange={handleCustomPaginationChange}
              itemLabel="leads"
              data-test-id="leads-pagination"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Leads

