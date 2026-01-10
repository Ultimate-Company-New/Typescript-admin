import type React from "react";
import { useEffect, useMemo, useState } from "react";

import { Box } from "@mui/material";
import {
  type GridColumnVisibilityModel,
  type GridFilterModel,
  type GridPaginationModel,
  type GridSlotsComponent,
  type GridSortModel,
  type GridToolbarProps,
} from "@mui/x-data-grid";

import { productApi } from "../../api/productApi";
import {
  CustomNoRowsOverlay,
  GridDensity,
  LogicOperator,
  SimpleToolbar,
  StyledDataGrid,
  createFetchFunction,
  createToggleFunction,
  getRowClassName,
  handleFilterModelChange,
  handleIncludeDeletedChange,
  handlePaginationModelChange,
  handleSortModelChange,
  type FilterGroup,
  type GridDensityType,
} from "../../components/datagrid";
import {
  getProductGridColumns,
  type ProductData,
} from "../../models/grid-models/ProductGridColumns";
import styles from "../../styles/Products.module.scss";
import { type PaginatedGridInterface } from "../../types/grid.types";

/**
 * Products Management Page with DataGrid
 * Features:
 * - Server-side pagination
 * - Custom multi-column filtering
 * - Sorting
 * - Include Deleted toggle
 * - Toggle product activation
 * - Toggle returns allowed
 * - Responsive design with row height 180px for images
 */

const Products = (): React.JSX.Element => {
  const [rows, setRows] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [density, setDensity] = useState<GridDensityType>(GridDensity.STANDARD);
  const [activeFilterGroup, setActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  });
  const [columnVisibilityModel, setColumnVisibilityModel] =
    useState<GridColumnVisibilityModel>({
      isDeleted: false,
      productId: false,
      pickupLocations: true,
    });
  const [visibleColumnFields, setVisibleColumnFields] = useState<string[]>([]);

  // Pagination model
  const [paginationModel, setPaginationModel] =
    useState<PaginatedGridInterface>({
      start: 0,
      end: 25,
      pageSize: 25,
      includeDeleted: false,
      actualDataCount: 0,
      totalPaginationBlockCount: 0,
    });

  // Fetch products function
  const fetchProducts = async (): Promise<void> => {
    await createFetchFunction(
      productApi.getProductsInBatches,
      setLoading,
      setRows,
      setTotalCount,
      paginationModel,
      includeDeleted,
      activeFilterGroup
    );
  };

  // Toggle product (activate/deactivate)
  const handleToggleProduct = async (productId: number): Promise<void> => {
    await createToggleFunction(
      productApi.toggleProduct,
      productId,
      fetchProducts,
      'Product status updated successfully'
    );
  };

  // Get grid columns with action handlers
  const columns = useMemo(
    () => getProductGridColumns(handleToggleProduct),
    [handleToggleProduct]
  );

  // Update visible column fields when column visibility changes
  useEffect(() => {
    setVisibleColumnFields(
      columns
        .filter((col) => {
          const isExcluded = ["isDeleted", "productId", "deleted"].includes(
            col.field
          );
          // Default to visible (true) if not explicitly set in visibility model
          const isVisible = columnVisibilityModel[col.field] ?? true;
          return !isExcluded && isVisible;
        })
        .map((col) => col.field)
    );
  }, [columnVisibilityModel, columns]);

  // Fetch products on mount and when pagination/filters change
  useEffect(() => {
    void fetchProducts();
  }, [paginationModel, includeDeleted, activeFilterGroup]);

  // Toolbar props
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
          handleIncludeDeletedChange(
            checked,
            setIncludeDeleted,
            setPaginationModel
          );
        },
        visibleColumnFields,
        columnVisibilityModel,
        onColumnVisibilityChange: setColumnVisibilityModel,
      } as GridToolbarProps),
    [
      density,
      columns,
      activeFilterGroup,
      rows,
      includeDeleted,
      visibleColumnFields,
      columnVisibilityModel,
    ]
  );

  return (
    <Box className={styles["products-page"]}>
      <Box className={styles["products-page__container"]}>
        <Box className={styles["products-page__card"]}>
          <StyledDataGrid
            dataTestId="products-data-grid"
            rows={rows}
            columns={columns}
            loading={loading}
            rowCount={totalCount}
            totalCount={totalCount}
            paginationModelState={paginationModel}
            setPaginationModel={setPaginationModel}
            density={density}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={(model) => {
              setColumnVisibilityModel(model);
            }}
            paginationModel={{
              page: Math.floor(
                paginationModel.start / paginationModel.pageSize
              ),
              pageSize: paginationModel.pageSize,
            }}
            onPaginationModelChange={(model: GridPaginationModel) => {
              handlePaginationModelChange(model, setPaginationModel);
            }}
            onFilterModelChange={(model: GridFilterModel) => {
              handleFilterModelChange(
                model,
                paginationModel,
                setPaginationModel
              );
            }}
            onSortModelChange={(model: GridSortModel) => {
              handleSortModelChange(model, setPaginationModel);
            }}
            getRowId={(row) =>
              (row as ProductData).productId ??
              (row as ProductData).product?.productId ??
              0
            }
            getRowClassName={(params) => getRowClassName<ProductData>(params)}
            disableRowSelectionOnClick
            slots={{
              toolbar: SimpleToolbar as GridSlotsComponent["toolbar"],
              noRowsOverlay: CustomNoRowsOverlay,
            }}
            slotProps={{
              toolbar: toolbarProps,
            }}
            showToolbar
            disableColumnMenu={false}
            rowHeight={180}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Products;
