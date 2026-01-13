import { useCallback, useEffect, useMemo, useState } from 'react'

import { Box, Divider, Grid, Paper } from '@mui/material'
import {
  type GridColumnVisibilityModel,
  type GridFilterModel,
  type GridPaginationModel,
  type GridSlotsComponent,
  type GridSortModel,
  type GridToolbarProps,
} from '@mui/x-data-grid'

import { packageApi } from '../../../api/packageApi'
import { productApi } from '../../../api/productApi'
import {
  CustomNoRowsOverlay,
  GridDensity,
  LogicOperator,
  SimpleToolbar,
  StyledDataGrid,
  createFetchFunction,
  createToggleFunction,
  handleFilterModelChange,
  handlePaginationModelChange,
  handleSortModelChange,
  type FilterGroup,
  type GridDensityType
} from '../../../components/datagrid'
import { BodyText, Subheader } from '../../../components/fonts'
import AddressDetailsView from '../../../components/form/AddressDetailsView'
import { getPackageGridColumns, type PackageData } from '../../../models/grid-models/PackageGridColumns'
import { getProductGridColumns, type ProductData } from '../../../models/grid-models/ProductGridColumns'
import styles from '../../../styles/Users.module.scss'
import { type PaginatedGridInterface } from '../../../types/grid.types'

interface PickupLocationDetailsViewProps {
  addressNickName: string
  shipRocketPickupLocationId?: number | null
  address: {
    streetAddress: string
    streetAddress2?: string
    streetAddress3?: string
    city: string
    state: string
    postalCode: string
    country: string
    addressType: string
    nameOnAddress?: string
    emailOnAddress?: string
    phoneOnAddress?: string
  }
  notes?: string
  /** The pickup location ID for fetching products and packages */
  pickupLocationId?: number
}

/**
 * Pickup Location Details View Component
 * Displays pickup location information in read-only format
 * Includes Products and Packages grids with quantities at this location
 */
const PickupLocationDetailsView = ({
  addressNickName,
  shipRocketPickupLocationId,
  address,
  notes,
  pickupLocationId,
}: PickupLocationDetailsViewProps): JSX.Element => {
  // ==================== Product Grid State ====================
  const [productRows, setProductRows] = useState<ProductData[]>([])
  const [productLoading, setProductLoading] = useState(false)
  const [productTotalCount, setProductTotalCount] = useState(0)
  const [productDensity, setProductDensity] = useState<GridDensityType>(GridDensity.STANDARD)
  const [productActiveFilterGroup, setProductActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })
  const [productColumnVisibilityModel, setProductColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
    isDeleted: false,
    productId: false,
    pickupLocations: false, // Hide pickup locations column since we're already filtered
    actions: false, // Hide actions column - not needed in this view
    returnsAllowed: false, // Hide returns toggle - not needed in this view
  })
  const [productPaginationModel, setProductPaginationModel] = useState<PaginatedGridInterface>({
    start: 0,
    end: 10,
    pageSize: 10,
    includeDeleted: false,
    actualDataCount: 0,
    totalPaginationBlockCount: 0,
  })

  // ==================== Package Grid State ====================
  const [packageRows, setPackageRows] = useState<PackageData[]>([])
  const [packageLoading, setPackageLoading] = useState(false)
  const [packageTotalCount, setPackageTotalCount] = useState(0)
  const [packageDensity, setPackageDensity] = useState<GridDensityType>(GridDensity.STANDARD)
  const [packageActiveFilterGroup, setPackageActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })
  const [packageColumnVisibilityModel, setPackageColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
    isDeleted: false,
    packageId: false,
    pickupLocationQuantities: false, // Hide locations column since we're already filtered
    actions: false, // Hide actions column - not needed in this view
  })
  const [packagePaginationModel, setPackagePaginationModel] = useState<PaginatedGridInterface>({
    start: 0,
    end: 10,
    pageSize: 10,
    includeDeleted: false,
    actualDataCount: 0,
    totalPaginationBlockCount: 0,
  })

  // ==================== Product Grid Functions ====================
  const fetchProducts = useCallback(async (): Promise<void> => {
    if (!pickupLocationId) return

    // Create filter group with pickupLocationId filter
    const filterWithLocation: FilterGroup = {
      logicOperator: productActiveFilterGroup.logicOperator,
      filters: [
        ...productActiveFilterGroup.filters,
        {
          id: 'pickupLocationId-filter',
          column: 'pickupLocationId',
          operator: 'equals',
          value: pickupLocationId.toString(),
        },
      ],
    }

    await createFetchFunction(
      productApi.getProductsInBatches,
      setProductLoading,
      setProductRows,
      setProductTotalCount,
      productPaginationModel,
      false,
      filterWithLocation
    )
  }, [pickupLocationId, productPaginationModel, productActiveFilterGroup])

  const handleToggleProduct = useCallback(async (productId: number): Promise<void> => {
    await createToggleFunction(
      productApi.toggleProduct,
      productId,
      fetchProducts,
      'Product status updated successfully'
    )
  }, [fetchProducts])

  // Note: handleToggleReturns removed - returnWindowDays is set at product creation and cannot be changed

  // ==================== Package Grid Functions ====================
  const fetchPackages = useCallback(async (): Promise<void> => {
    if (!pickupLocationId) return

    // Create filter group with pickupLocationId filter
    const filterWithLocation: FilterGroup = {
      logicOperator: packageActiveFilterGroup.logicOperator,
      filters: [
        ...packageActiveFilterGroup.filters,
        {
          id: 'pickupLocationId-filter',
          column: 'pickupLocationId',
          operator: 'equals',
          value: pickupLocationId.toString(),
        },
      ],
    }

    await createFetchFunction(
      packageApi.getPackagesInBatches,
      setPackageLoading,
      setPackageRows,
      setPackageTotalCount,
      packagePaginationModel,
      false,
      filterWithLocation
    )
  }, [pickupLocationId, packagePaginationModel, packageActiveFilterGroup])

  const handleTogglePackage = useCallback(async (packageId: number): Promise<void> => {
    await createToggleFunction(
      packageApi.togglePackage,
      packageId,
      fetchPackages,
      'Package status updated successfully'
    )
  }, [fetchPackages])

  // ==================== Grid Columns with Quantity ====================
  const productColumns = useMemo(
    () => getProductGridColumns(handleToggleProduct, {
      displayQuantity: true,
      pickupLocationId,
    }),
    [handleToggleProduct, pickupLocationId]
  )

  const packageColumns = useMemo(
    () => getPackageGridColumns(handleTogglePackage, {
      displayQuantity: true,
      pickupLocationId,
    }),
    [handleTogglePackage, pickupLocationId]
  )

  // ==================== Effects ====================
  useEffect(() => {
    if (pickupLocationId) {
      void fetchProducts()
    }
  }, [pickupLocationId, productPaginationModel, productActiveFilterGroup, fetchProducts])

  useEffect(() => {
    if (pickupLocationId) {
      void fetchPackages()
    }
  }, [pickupLocationId, packagePaginationModel, packageActiveFilterGroup, fetchPackages])

  // ==================== Toolbar Props ====================
  const productToolbarProps = useMemo(
    () =>
      ({
        density: productDensity,
        onDensityChange: setProductDensity,
        columns: productColumns,
        onFiltersChange: setProductActiveFilterGroup,
        activeFilterGroup: productActiveFilterGroup,
        rows: productRows,
        hideIncludeDeleted: true,
      } as GridToolbarProps),
    [productDensity, productColumns, productActiveFilterGroup, productRows]
  )

  const packageToolbarProps = useMemo(
    () =>
      ({
        density: packageDensity,
        onDensityChange: setPackageDensity,
        columns: packageColumns,
        onFiltersChange: setPackageActiveFilterGroup,
        activeFilterGroup: packageActiveFilterGroup,
        rows: packageRows,
        hideIncludeDeleted: true,
      } as GridToolbarProps),
    [packageDensity, packageColumns, packageActiveFilterGroup, packageRows]
  )

  return (
    <>
      {/* Location Information Section */}
      <Paper className={styles['add-users-page__section']}>
        <Subheader label="Location Information" className={styles['add-users-page__section-title']} />
        <Divider className={styles['add-users-page__divider']} />
        <Box className={styles['add-users-page__divider-spacer']} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Box className={styles['user-details-view__field']}>
              <BodyText className={styles['user-details-view__label']}>Location Name</BodyText>
              <BodyText className={styles['user-details-view__value']}>{addressNickName || '—'}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles['user-details-view__field']}>
              <BodyText className={styles['user-details-view__label']}>Shiprocket ID</BodyText>
              <BodyText className={styles['user-details-view__value']}>
                {shipRocketPickupLocationId ?? '—'}
            </BodyText>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Address Details Section - using shared component */}
      <AddressDetailsView
        streetAddress={address.streetAddress}
        streetAddress2={address.streetAddress2}
        streetAddress3={address.streetAddress3}
        city={address.city}
        state={address.state}
        postalCode={address.postalCode}
        country={address.country}
        addressType={address.addressType}
        nameOnAddress={address.nameOnAddress}
        emailOnAddress={address.emailOnAddress}
        phoneOnAddress={address.phoneOnAddress}
      />

      {/* Notes Section */}
      {notes && (
        <Paper className={styles['add-users-page__section']}>
          <Subheader label="Notes" className={styles['add-users-page__section-title']} />
          <Divider className={styles['add-users-page__divider']} />
          <Box className={styles['add-users-page__divider-spacer']} />
          <BodyText className={styles['user-details-view__notes']}>{notes}</BodyText>
        </Paper>
      )}

      {/* Products at this Location */}
      {pickupLocationId && (
        <Paper className={styles['add-users-page__section']} sx={{ overflow: 'hidden' }}>
          <Subheader label="Products at this Location" className={styles['add-users-page__section-title']} />
          <Divider className={styles['add-users-page__divider']} />
          <Box className={styles['add-users-page__divider-spacer']} />
          <Box sx={{ height: '100%', width: '100%', overflow: 'auto' }}>
            <StyledDataGrid
              rows={productRows}
              columns={productColumns}
              loading={productLoading}
              rowCount={productTotalCount}
              totalCount={productTotalCount}
              paginationModelState={productPaginationModel}
              setPaginationModel={setProductPaginationModel}
              getRowId={(row: ProductData) => row.productId ?? row.product?.productId ?? 0}
              paginationMode="server"
              paginationModel={{
                page: Math.floor(productPaginationModel.start / productPaginationModel.pageSize),
                pageSize: productPaginationModel.pageSize,
              }}
              onPaginationModelChange={(model: GridPaginationModel) => {
                handlePaginationModelChange(model, setProductPaginationModel)
              }}
              sortingMode="server"
              onSortModelChange={(model: GridSortModel) => {
                handleSortModelChange(model, setProductPaginationModel)
              }}
              filterMode="server"
              onFilterModelChange={(model: GridFilterModel) => {
                handleFilterModelChange(model, productPaginationModel, setProductPaginationModel)
              }}
              columnVisibilityModel={productColumnVisibilityModel}
              onColumnVisibilityModelChange={setProductColumnVisibilityModel}
              density={productDensity}
              rowHeight={180}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              autoHeight
              showToolbar
              slots={{
                toolbar: SimpleToolbar as GridSlotsComponent['toolbar'],
                noRowsOverlay: CustomNoRowsOverlay,
              }}
              slotProps={{
                toolbar: productToolbarProps,
              }}
            />
          </Box>
        </Paper>
      )}

      {/* Packages at this Location */}
      {pickupLocationId && (
        <Paper className={styles['add-users-page__section']} sx={{ overflow: 'hidden' }}>
          <Subheader label="Packages at this Location" className={styles['add-users-page__section-title']} />
          <Divider className={styles['add-users-page__divider']} />
          <Box className={styles['add-users-page__divider-spacer']} />
          <Box sx={{ height: '100%', width: '100%', overflow: 'auto' }}>
            <StyledDataGrid
              rows={packageRows}
              columns={packageColumns}
              loading={packageLoading}
              rowCount={packageTotalCount}
              totalCount={packageTotalCount}
              paginationModelState={packagePaginationModel}
              setPaginationModel={setPackagePaginationModel}
              getRowId={(row: PackageData) => row.packageId ?? row._package?.packageId ?? 0}
              paginationMode="server"
              paginationModel={{
                page: Math.floor(packagePaginationModel.start / packagePaginationModel.pageSize),
                pageSize: packagePaginationModel.pageSize,
              }}
              onPaginationModelChange={(model: GridPaginationModel) => {
                handlePaginationModelChange(model, setPackagePaginationModel)
              }}
              sortingMode="server"
              onSortModelChange={(model: GridSortModel) => {
                handleSortModelChange(model, setPackagePaginationModel)
              }}
              filterMode="server"
              onFilterModelChange={(model: GridFilterModel) => {
                handleFilterModelChange(model, packagePaginationModel, setPackagePaginationModel)
              }}
              columnVisibilityModel={packageColumnVisibilityModel}
              onColumnVisibilityModelChange={setPackageColumnVisibilityModel}
              density={packageDensity}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              autoHeight
              showToolbar
              slots={{
                toolbar: SimpleToolbar as GridSlotsComponent['toolbar'],
                noRowsOverlay: CustomNoRowsOverlay,
              }}
              slotProps={{
                toolbar: packageToolbarProps,
              }}
            />
          </Box>
        </Paper>
      )}
    </>
  )
}

export default PickupLocationDetailsView
