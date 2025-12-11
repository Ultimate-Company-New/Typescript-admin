import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import type { ZodType } from 'zod'

import {
  Cancel as CancelIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  GridOn as GridIcon,
  Code as JsonIcon,
  Send as SendIcon,
} from '@mui/icons-material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import {
  Box,
  Breadcrumbs,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import type { GridColDef, GridColumnVisibilityModel, GridSlotsComponent, GridToolbarProps } from '@mui/x-data-grid'

import { pickupLocationApi } from '../../api/pickupLocationApi'
import { productApi } from '../../api/productApi'
import { productCategoryApi, type ProductCategoryWithPath } from '../../api/productCategoryApi'
import { ImportInstructions } from '../../components'
import { BlueButton, LinkButton, RedButton } from '../../components/buttons'
import {
  ErrorDetailsModal,
  GridDensity,
  LogicOperator,
  SimpleToolbar,
  StyledDataGrid,
  TableAsJson,
  type ColumnGroup,
  type FilterGroup,
  type GridDensityType,
} from '../../components/datagrid'
import { BodyText, FieldLabel, SecondaryFont, Subheader } from '../../components/fonts'
import { FileDropZone, SelectInput } from '../../components/form-input'
import { DEFAULT_MAX_RECORDS, MAX_RECORDS_OPTIONS, PRODUCT_COLOR_OPTIONS, PRODUCT_CONDITION_OPTIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import type { ProductRequestModel } from '../../models/api-models'
import {
  getProductImportPreviewColumns,
  parsePickupLocationQuantities,
  productImportHeaderNames,
  productImportTemplateStructure,
  type ImportProductData,
} from '../../models/bulk-import-models/ImportProductGridModel'
import {
  getColorGridColumns,
  getConditionGridColumns,
  type ColorData,
  type ConditionData,
} from '../../models/grid-models/ImportProductReferenceGridColumns'
import { getPickupLocationGridColumns, type PickupLocationData } from '../../models/grid-models/PickupLocationGridColumns'
import styles from '../../styles/Products.module.scss'
import { type PaginatedGridInterface } from '../../types/grid.types'
import { applyLocalFilters, downloadImportTemplate, parseImportFile } from '../../utils/gridUtil'
import { bulkProductImportSchema, type BulkProductImportData } from '../../utils/validationSchemas'
import { FillImportTestDataButton, PickupLocationsModal } from './components'

// Validator for product import rows
const bulkProductImportValidator = bulkProductImportSchema as unknown as ZodType<BulkProductImportData>

/**
 * Convert ImportProductData to ProductRequestModel for API
 */
const mapToApiPayload = (product: ImportProductData): ProductRequestModel => ({
  title: product.title,
  brand: product.brand,
  model: product.model,
  condition: product.condition,
  color: product.color,
  colorLabel: product.colorLabel,
  countryOfManufacture: product.countryOfManufacture,
  categoryId: product.categoryId,
  upc: product.upc,
  price: product.price,
  discount: product.discount,
  isDiscountPercent: product.isDiscountPercent,
  returnsAllowed: product.returnsAllowed,
  length: product.length,
  breadth: product.breadth,
  height: product.height,
  weightKgs: product.weightKgs,
  itemAvailableFrom: product.itemAvailableFrom,
  itemAvailableFromTimezone: product.itemAvailableFromTimezone,
  pickupLocationQuantities: parsePickupLocationQuantities(product.pickupLocationQuantities),
  mainImage: product.mainImage,
  topImage: product.topImage,
  bottomImage: product.bottomImage,
  frontImage: product.frontImage,
  backImage: product.backImage,
  rightImage: product.rightImage,
  leftImage: product.leftImage,
  detailsImage: product.detailsImage,
  defectImage: product.defectImage,
  additionalImage1: product.additionalImage1,
  additionalImage2: product.additionalImage2,
  additionalImage3: product.additionalImage3,
  descriptionHtml: product.descriptionHtml,
  itemModified: product.itemModified,
  modificationHtml: product.modificationHtml,
  notes: product.notes,
})

interface NavigationLevel {
  parentId: number | null
  parentName: string
}

/**
 * Import Products Page
 * Features:
 * - Download Excel template
 * - Upload Excel/CSV files
 * - Preview data in grid or JSON format
 * - Set max records limit
 * - Validate and submit bulk import
 */
const ImportProducts = (): React.JSX.Element => {
  // ============================================================================
  // Conditions Grid State (Local Pagination)
  // ============================================================================
  const [conditionsRaw] = useState<ConditionData[]>(() =>
    PRODUCT_CONDITION_OPTIONS.map((option, index) => ({
      id: index + 1,
      value: option.value,
      label: option.label,
    })),
  )
  const [conditions, setConditions] = useState<ConditionData[]>(conditionsRaw)
  const [conditionsDensity, setConditionsDensity] = useState<GridDensityType>(GridDensity.STANDARD)
  const [conditionsColumnVisibility, setConditionsColumnVisibility] = useState<GridColumnVisibilityModel>({})
  const [conditionsActiveFilterGroup, setConditionsActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })

  // ============================================================================
  // Colors Grid State (Local Pagination)
  // ============================================================================
  const [colorsRaw] = useState<ColorData[]>(() =>
    PRODUCT_COLOR_OPTIONS.map((option, index) => ({
      id: index + 1,
      hex: option.hex,
      label: option.name,
    })),
  )
  const [colors, setColors] = useState<ColorData[]>(colorsRaw)
  const [colorsDensity, setColorsDensity] = useState<GridDensityType>(GridDensity.STANDARD)
  const [colorsColumnVisibility, setColorsColumnVisibility] = useState<GridColumnVisibilityModel>({})
  const [colorsActiveFilterGroup, setColorsActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })

  // ============================================================================
  // Pickup Locations Grid State (Server-Side Pagination)
  // ============================================================================
  const [pickupLocations, setPickupLocations] = useState<PickupLocationData[]>([])
  const [pickupLocationsLoading, setPickupLocationsLoading] = useState(false)
  const [pickupLocationsTotalCount, setPickupLocationsTotalCount] = useState(0)
  const [pickupLocationsPaginationModel, setPickupLocationsPaginationModel] = useState<PaginatedGridInterface>({
    start: 0,
    end: 10,
    pageSize: 10,
    includeDeleted: false,
    actualDataCount: 0,
    totalPaginationBlockCount: 0,
  })
  const [pickupLocationsActiveFilterGroup, setPickupLocationsActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })
  const [pickupLocationsDensity, setPickupLocationsDensity] = useState<GridDensityType>(GridDensity.STANDARD)
  const [pickupLocationsColumnVisibility, setPickupLocationsColumnVisibility] = useState<GridColumnVisibilityModel>({
    pickupLocationId: true, // Show ID for reference
  })

  // ============================================================================
  // Category Browser State
  // ============================================================================
  const [categories, setCategories] = useState<ProductCategoryWithPath[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  // ============================================================================
  // Import State
  // ============================================================================
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<ImportProductData[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'json'>('grid')
  const [maxRecords, setMaxRecords] = useState<number>(DEFAULT_MAX_RECORDS as number)
  const [isLoading, setIsLoading] = useState(false)
  const [jsonPreview, setJsonPreview] = useState<string>('')

  // Error modal state
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [selectedRowErrors, setSelectedRowErrors] = useState<string[]>([])
  const [selectedRowNumber, setSelectedRowNumber] = useState<number | null>(null)

  // Stock modal state
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [stockModalLoading, setStockModalLoading] = useState(false)
  const [stockModalLocations, setStockModalLocations] = useState<Array<{ pickupLocationId: number; addressNickName?: string; address?: { streetAddress?: string; city?: string; state?: string; postalCode?: string; phoneOnAddress?: string; emailOnAddress?: string }; availableStock: number }>>([])
  const [stockModalProductTitle, setStockModalProductTitle] = useState<string>('')
  const [currentParentId, setCurrentParentId] = useState<number | null>(null)
  const [navigationStack, setNavigationStack] = useState<NavigationLevel[]>([])
  const [selectedCategory, setSelectedCategory] = useState<ProductCategoryWithPath | null>(null)

  // ============================================================================
  // Fetch Categories for Browser
  // ============================================================================
  const fetchCategories = useCallback(async (parentId: number | null): Promise<void> => {
    setCategoriesLoading(true)
    try {
      const data = await productCategoryApi.getCategoriesByParentId(parentId)
      setCategories(data)
    } catch {
      setCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  // Fetch root categories on mount
  useEffect(() => {
    void fetchCategories(null)
  }, [fetchCategories])

  // Handle drilling down into a category
  const handleDrillDown = useCallback(
    (category: ProductCategoryWithPath): void => {
      setNavigationStack(prev => [
        ...prev,
        {
          parentId: currentParentId,
          parentName: category.name,
        },
      ])
      setCurrentParentId(category.categoryId)
      void fetchCategories(category.categoryId)
    },
    [currentParentId, fetchCategories],
  )

  // Handle going back one level
  const handleGoBack = useCallback((): void => {
    if (navigationStack.length > 0) {
      const newStack = [...navigationStack]
      const previousLevel = newStack.pop()
      setNavigationStack(newStack)
      setCurrentParentId(previousLevel?.parentId ?? null)
      void fetchCategories(previousLevel?.parentId ?? null)
    }
  }, [navigationStack, fetchCategories])

  // Handle selecting a leaf category
  const handleSelectLeaf = useCallback((category: ProductCategoryWithPath): void => {
    setSelectedCategory(category)
  }, [])

  // Build breadcrumb trail
  const breadcrumbs = useMemo(() => navigationStack.map(level => level.parentName), [navigationStack])

  // ============================================================================
  // Apply local filters for Conditions
  // ============================================================================
  useEffect(() => {
    if (conditionsRaw.length > 0) {
      const filteredData = applyLocalFilters(conditionsRaw, conditionsActiveFilterGroup)
      setConditions(filteredData)
    }
  }, [conditionsRaw, conditionsActiveFilterGroup])

  // ============================================================================
  // Apply local filters for Colors
  // ============================================================================
  useEffect(() => {
    if (colorsRaw.length > 0) {
      const filteredData = applyLocalFilters(colorsRaw, colorsActiveFilterGroup)
      setColors(filteredData)
    }
  }, [colorsRaw, colorsActiveFilterGroup])

  // ============================================================================
  // Fetch Pickup Locations (Server-Side)
  // ============================================================================
  const fetchPickupLocations = useCallback(async (): Promise<void> => {
    setPickupLocationsLoading(true)
    try {
      const response = await pickupLocationApi.getPickupLocationsInBatches({
        start: pickupLocationsPaginationModel.start,
        end: pickupLocationsPaginationModel.end,
        pageSize: pickupLocationsPaginationModel.pageSize,
        includeDeleted: pickupLocationsPaginationModel.includeDeleted,
        logicOperator: pickupLocationsActiveFilterGroup.logicOperator,
        filters: pickupLocationsActiveFilterGroup.filters,
      })

      setPickupLocations(response.data as PickupLocationData[])
      setPickupLocationsTotalCount(response.totalDataCount)
    } catch {
      setPickupLocations([])
      setPickupLocationsTotalCount(0)
    } finally {
      setPickupLocationsLoading(false)
    }
  }, [pickupLocationsPaginationModel, pickupLocationsActiveFilterGroup])

  // Fetch pickup locations on mount and when pagination/filters change
  useEffect(() => {
    void fetchPickupLocations()
  }, [fetchPickupLocations])

  // ============================================================================
  // Import Handlers
  // ============================================================================

  /**
   * Download Excel template with merged category headers
   */
  const handleDownloadTemplate = (): void => {
    try {
      downloadImportTemplate({
        templateStructure: productImportTemplateStructure,
        fileName: 'product_import_template.xlsx',
        sheetName: 'Products',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to download template'
      toast.error(message)
    }
  }

  /**
   * Fetch category paths for given IDs and update import data
   * Uses the efficient batch API endpoint instead of recursive fetching
   */
  const fetchCategoryPaths = async (categoryIds: number[]): Promise<void> => {
    try {
      // Use the efficient batch endpoint
      const categoryPathMap = await productCategoryApi.getCategoryPathsByIds(categoryIds)

      // Update data with paths
      if (Object.keys(categoryPathMap).length > 0) {
        setImportData(prevData =>
          prevData.map(row => ({
            ...row,
            categoryPath: categoryPathMap[row.categoryId] ?? row.categoryPath,
          })),
        )
      }
    } catch {
      // Silent fail - grid will show IDs instead
    }
  }

  /**
   * Parse Excel/CSV file
   */
  const parseFile = useCallback(
    (file: File): void => {
      setIsLoading(true)

      void parseImportFile<ImportProductData, BulkProductImportData>({
        file,
        templateStructure: productImportTemplateStructure,
        headerNames: productImportHeaderNames,
        maxRecords,
        validator: bulkProductImportValidator,
        createRowData: ({ rowNumber, getOptionalValue, getRequiredValue }) => {
          // Product Information
          const title = getRequiredValue('title')
          const brand = getRequiredValue('brand')
          const model = getOptionalValue('model')
          const condition = getRequiredValue('condition')
          const color = getRequiredValue('color')
          const colorLabel = getRequiredValue('colorLabel')
          const countryOfManufacture = getRequiredValue('countryOfManufacture')
          const categoryIdRaw = getRequiredValue('categoryId')
          const upc = getOptionalValue('upc')

          // Pricing
          const priceRaw = getRequiredValue('price')
          const discountRaw = getRequiredValue('discount')
          const isDiscountPercentRaw = getRequiredValue('isDiscountPercent')
          const returnsAllowedRaw = getRequiredValue('returnsAllowed')

          // Dimensions
          const lengthRaw = getOptionalValue('length')
          const breadthRaw = getOptionalValue('breadth')
          const heightRaw = getOptionalValue('height')
          const weightKgsRaw = getOptionalValue('weightKgs')

          // Availability
          const itemAvailableFrom = getRequiredValue('itemAvailableFrom')
          const itemAvailableFromTimezone = getRequiredValue('itemAvailableFromTimezone')

          // Stock
          const pickupLocationQuantities = getRequiredValue('pickupLocationQuantities')

          // Required Images
          const mainImage = getRequiredValue('mainImage')
          const topImage = getRequiredValue('topImage')
          const bottomImage = getRequiredValue('bottomImage')
          const frontImage = getRequiredValue('frontImage')
          const backImage = getRequiredValue('backImage')
          const rightImage = getRequiredValue('rightImage')
          const leftImage = getRequiredValue('leftImage')
          const detailsImage = getRequiredValue('detailsImage')

          // Optional Images
          const defectImage = getOptionalValue('defectImage')
          const additionalImage1 = getOptionalValue('additionalImage1')
          const additionalImage2 = getOptionalValue('additionalImage2')
          const additionalImage3 = getOptionalValue('additionalImage3')

          // Content
          const descriptionHtml = getRequiredValue('descriptionHtml')
          const itemModifiedRaw = getOptionalValue('itemModified')
          const modificationHtml = getOptionalValue('modificationHtml')
          const notes = getOptionalValue('notes')

          // Parse values
          const categoryId = parseInt(String(categoryIdRaw), 10) || 0
          const price = parseFloat(String(priceRaw)) || 0
          const discount = parseFloat(String(discountRaw)) || 0
          const isDiscountPercentStr = String(isDiscountPercentRaw).toLowerCase()
          const isDiscountPercent = isDiscountPercentStr === 'true' || isDiscountPercentStr === 'yes' || isDiscountPercentStr === '1'
          const returnsAllowedStr = String(returnsAllowedRaw).toLowerCase()
          const returnsAllowed = returnsAllowedStr === 'true' || returnsAllowedStr === 'yes' || returnsAllowedStr === '1'
          const itemModifiedStr = String(itemModifiedRaw || '').toLowerCase()
          const itemModified = itemModifiedStr === 'true' || itemModifiedStr === 'yes' || itemModifiedStr === '1'
          const parseOptionalNumber = (val: unknown): number | undefined => {
            if (val === null || val === undefined || val === '') return undefined
            const parsed = parseFloat(String(val))
            return isNaN(parsed) ? undefined : parsed
          }
          const length = parseOptionalNumber(lengthRaw)
          const breadth = parseOptionalNumber(breadthRaw)
          const height = parseOptionalNumber(heightRaw)
          const weightKgs = parseOptionalNumber(weightKgsRaw)

          // Create validation payload for Zod schema
          const validationPayload: BulkProductImportData = {
            title: String(title || ''),
            brand: String(brand || ''),
            model: model ? String(model) : '',
            condition: String(condition || ''),
            color: String(color || ''),
            colorLabel: String(colorLabel || ''),
            countryOfManufacture: String(countryOfManufacture || ''),
            categoryId,
            upc: upc ? String(upc) : '',
            price,
            discount,
            isDiscountPercent,
            returnsAllowed,
            length: length ?? null,
            breadth: breadth ?? null,
            height: height ?? null,
            weightKgs: weightKgs ?? null,
            itemAvailableFrom: String(itemAvailableFrom || ''),
            itemAvailableFromTimezone: String(itemAvailableFromTimezone || ''),
            pickupLocationQuantities: String(pickupLocationQuantities || ''),
            mainImage: String(mainImage || ''),
            topImage: String(topImage || ''),
            bottomImage: String(bottomImage || ''),
            frontImage: String(frontImage || ''),
            backImage: String(backImage || ''),
            rightImage: String(rightImage || ''),
            leftImage: String(leftImage || ''),
            detailsImage: String(detailsImage || ''),
            defectImage: defectImage ? String(defectImage) : '',
            additionalImage1: additionalImage1 ? String(additionalImage1) : '',
            additionalImage2: additionalImage2 ? String(additionalImage2) : '',
            additionalImage3: additionalImage3 ? String(additionalImage3) : '',
            descriptionHtml: String(descriptionHtml || ''),
            itemModified,
            modificationHtml: modificationHtml ? String(modificationHtml) : '',
            notes: notes ? String(notes) : '',
          }

          const parsedRow: ImportProductData = {
            rowNumber,
            title: String(title || ''),
            brand: String(brand || ''),
            model: model ? String(model) : undefined,
            condition: String(condition || ''),
            color: String(color || ''),
            colorLabel: String(colorLabel || ''),
            countryOfManufacture: String(countryOfManufacture || ''),
            categoryId,
            upc: upc ? String(upc) : undefined,
            price,
            discount,
            isDiscountPercent,
            returnsAllowed,
            length,
            breadth,
            height,
            weightKgs,
            itemAvailableFrom: String(itemAvailableFrom || ''),
            itemAvailableFromTimezone: String(itemAvailableFromTimezone || ''),
            pickupLocationQuantities: String(pickupLocationQuantities || ''),
            mainImage: String(mainImage || ''),
            topImage: String(topImage || ''),
            bottomImage: String(bottomImage || ''),
            frontImage: String(frontImage || ''),
            backImage: String(backImage || ''),
            rightImage: String(rightImage || ''),
            leftImage: String(leftImage || ''),
            detailsImage: String(detailsImage || ''),
            defectImage: defectImage ? String(defectImage) : undefined,
            additionalImage1: additionalImage1 ? String(additionalImage1) : undefined,
            additionalImage2: additionalImage2 ? String(additionalImage2) : undefined,
            additionalImage3: additionalImage3 ? String(additionalImage3) : undefined,
            descriptionHtml: String(descriptionHtml || ''),
            itemModified,
            modificationHtml: modificationHtml ? String(modificationHtml) : undefined,
            notes: notes ? String(notes) : undefined,
          }

          /* eslint-disable @typescript-eslint/no-unsafe-assignment */
          const result: { parsedRow: ImportProductData; validationPayload: BulkProductImportData } = {
            parsedRow,
            validationPayload,
          }
          /* eslint-enable @typescript-eslint/no-unsafe-assignment */
          return result
        },
      })
        .then(results => {
          // Parse initial data - show immediately without paths
          const parsedData = results.map(
            (result): ImportProductData => ({
              ...result.data,
              errors: result.errors && result.errors.length > 0 ? result.errors : undefined,
            }),
          )

          // Set data immediately so grid shows
          setImportData(parsedData)
          toast.success(`Parsed ${results.length} records successfully!`)

          // Fetch category paths in background and update
          const uniqueCategoryIds = [...new Set(parsedData.map(row => row.categoryId).filter(id => id > 0))]
          if (uniqueCategoryIds.length > 0) {
            void fetchCategoryPaths(uniqueCategoryIds)
          }
        })
        .catch(error => {
          const message = error instanceof Error ? error.message : 'Failed to parse file. Please check the format.'
          toast.error(message)
          if (message.includes('maximum allowed')) {
            setFile(null)
          }
        })
        .finally(() => {
          setIsLoading(false)
        })
    },
    [maxRecords],
  )

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(
    (selectedFile: File): void => {
      setFile(selectedFile)
      parseFile(selectedFile)
    },
    [parseFile],
  )

  /**
   * Clear uploaded file and data
   */
  const handleFileClear = useCallback((): void => {
    setFile(null)
    setImportData([])
  }, [])

  /**
   * Generate JSON structure for API
   */
  const generateImportJSON = useCallback((): ProductRequestModel[] => {
    return importData.map(mapToApiPayload)
  }, [importData])

  // Generate JSON preview when switching to JSON view
  useEffect(() => {
    if (viewMode === 'json' && importData.length > 0) {
      const json = generateImportJSON()
      setJsonPreview(JSON.stringify(json, null, 2))
    }
  }, [viewMode, importData, generateImportJSON])

  const jsonPreviewData = useMemo<unknown>(() => {
    if (!jsonPreview) return []
    try {
      return JSON.parse(jsonPreview) as ProductRequestModel[]
    } catch {
      return []
    }
  }, [jsonPreview])

  /**
   * Submit bulk import to API
   */
  const handleSubmit = async (): Promise<void> => {
    if (importData.length === 0) {
      toast.error('No data to import')
      return
    }

    // Check for errors
    const hasErrors = importData.some((product: ImportProductData) => product.errors && product.errors.length > 0)
    if (hasErrors) {
      toast.error('Please fix validation errors before submitting')
      return
    }

    setIsLoading(true)
    try {
      // Generate import payload
      const payload: ProductRequestModel[] = importData.map(mapToApiPayload)

      // Call bulk create API
      await productApi.bulkCreateProducts(payload)

      // Show success message
      toast.success(
        `Bulk import started for ${importData.length} products! You will receive a message with the results when processing completes.`,
      )

      // Navigate to products page
      navigate(APP_ROUTES.DASHBOARD.PRODUCTS)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import products'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreviewErrorClick = useCallback((errors: string[], rowNumber: number): void => {
    setSelectedRowErrors(errors)
    setSelectedRowNumber(rowNumber)
    setErrorModalOpen(true)
  }, [])

  const handlePreviewStockClick = useCallback(async (_rowNumber: number, stockString: string, productTitle: string): Promise<void> => {
    setStockModalProductTitle(productTitle)
    setStockModalOpen(true)
    setStockModalLoading(true)
    setStockModalLocations([])

    try {
      // Parse the stock string to get location IDs and quantities
      const stockMap = parsePickupLocationQuantities(stockString)
      const locationIds = Object.keys(stockMap).map(id => parseInt(id, 10))

      // Fetch details for each location
      const locationPromises = locationIds.map(async (locationId) => {
        try {
          const locationData = await pickupLocationApi.getPickupLocationById(locationId) as {
            pickupLocationId: number
            addressNickName?: string
            address?: {
              streetAddress?: string
              streetAddress2?: string
              city?: string
              state?: string
              postalCode?: string
              phoneOnAddress?: string
              emailOnAddress?: string
            }
          }
          return {
            ...locationData,
            availableStock: stockMap[locationId],
          }
        } catch {
          // Return minimal data if fetch fails
          return {
            pickupLocationId: locationId,
            addressNickName: `Location ID: ${locationId}`,
            availableStock: stockMap[locationId],
          }
        }
      })

      const locations = await Promise.all(locationPromises)
      setStockModalLocations(locations)
    } catch {
      setStockModalLocations([])
    } finally {
      setStockModalLoading(false)
    }
  }, [])

  // ============================================================================
  // Grid Column Definitions
  // ============================================================================
  const conditionsColumns = useMemo<GridColDef[]>(() => getConditionGridColumns(), [])
  const colorsColumns = useMemo<GridColDef[]>(() => getColorGridColumns(), [])
  const pickupLocationsColumns = useMemo<GridColDef[]>(() => {
    const noOpToggle = (): void => {
      // Read-only grid, no toggle support required
    }
    // Get all columns except actions
    return getPickupLocationGridColumns(noOpToggle).filter(col => col.field !== 'actions')
  }, [])

  // Import preview columns
  const previewColumns = useMemo<GridColDef[]>(
    () => getProductImportPreviewColumns(handlePreviewErrorClick, handlePreviewStockClick),
    [handlePreviewErrorClick, handlePreviewStockClick],
  )

  // Column grouping for preview grid (parent headers)
  // Replace categoryId with categoryPath to match actual grid columns
  const columnGroupingModel = useMemo<ColumnGroup[]>(
    () =>
      productImportTemplateStructure.map(section => ({
        groupId: section.category.toLowerCase().replace(/\s+/g, '-'),
        headerName: section.category,
        children: section.fields.map(field => (field === 'categoryId' ? 'categoryPath' : field)),
      })),
    [],
  )

  // Validation summary
  const { hasValidationErrors, errorCount } = useMemo((): { hasValidationErrors: boolean; errorCount: number } => {
    let count = 0
    for (const row of importData) {
      if (row.errors && row.errors.length > 0) {
        count += 1
      }
    }
    return {
      hasValidationErrors: count > 0,
      errorCount: count,
    }
  }, [importData])

  return (
    <>
    <Container maxWidth={false} disableGutters className={styles['import-products-page__page-wrapper']}>
      <Box className={styles['import-products-page__container']}>
        {/* Instructions */}
        <ImportInstructions
          instructions={[
            'Download the template file to see the required format',
            'Fill in your product data following the template structure',
            'Category ID is required - use the Categories reference grid below to find valid IDs',
            'Pickup Location IDs are required - use the Pickup Locations reference grid to find valid IDs (comma-separated with quantities, e.g., "1:50,2:30")',
            'Valid conditions: NEW_WITH_TAGS, NEW_WITHOUT_TAGS, NEW_WITH_DEFECTS, PRE_OWNED, PRE_OWNED_WITH_DEFECTS',
            'Image URLs should be valid public URLs (main image is required)',
            'Prices and discounts should be numeric values',
            'Upload the file and preview the data',
            'Review and submit the import',
          ]}
        />

        {/* Reference Grids - Conditions and Colors in one row */}
        <Paper className={styles['import-products-page__reference-card']}>
          <Subheader label="Reference Data" className={styles['import-products-page__section-title']} />
          <Divider className={styles['import-products-page__divider']} />

          <Box className={styles['import-products-page__reference-content']}>
          <Grid container spacing={3} className={styles['import-products-page__reference-grids-row']}>
            {/* Conditions Grid */}
            <Grid item xs={12} md={6}>
              <Subheader label="Conditions" className={styles['import-products-page__subsection-title']} />
              <Box className={styles['import-products-page__grid-wrapper']}>
                <StyledDataGrid
                  dataTestId="conditions-reference-grid"
                  rows={conditions}
                  columns={conditionsColumns}
                  getRowId={row => (row as ConditionData).id}
                  loading={false}
                  paginationMode="client"
                  filterMode="client"
                  sortingMode="client"
                  pageSizeOptions={[5, 10]}
                  initialState={{
                    pagination: {
                      paginationModel: {
                        pageSize: 5,
                      },
                    },
                  }}
                  disableRowSelectionOnClick
                  autoHeight
                  density={conditionsDensity}
                  columnVisibilityModel={conditionsColumnVisibility}
                  onColumnVisibilityModelChange={setConditionsColumnVisibility}
                  slots={{
                    toolbar: SimpleToolbar as GridSlotsComponent['toolbar'],
                  }}
                  slotProps={{
                    toolbar: {
                      density: conditionsDensity,
                      onDensityChange: setConditionsDensity,
                      columns: conditionsColumns,
                      rows: conditions,
                      hideIncludeDeleted: true,
                      hideExport: false,
                      hideFilter: false,
                      hideColumns: false,
                      columnVisibilityModel: conditionsColumnVisibility,
                      onColumnVisibilityChange: setConditionsColumnVisibility,
                      activeFilterGroup: conditionsActiveFilterGroup,
                      onFiltersChange: setConditionsActiveFilterGroup,
                    } as GridToolbarProps,
                  }}
                  showToolbar
                  disableColumnMenu={false}
                />
              </Box>
            </Grid>

            {/* Colors Grid */}
            <Grid item xs={12} md={6}>
              <Subheader label="Colors" className={styles['import-products-page__subsection-title']} />
              <Box className={styles['import-products-page__grid-wrapper']}>
                <StyledDataGrid
                  dataTestId="colors-reference-grid"
                  rows={colors}
                  columns={colorsColumns}
                  getRowId={row => (row as ColorData).id}
                  loading={false}
                  paginationMode="client"
                  filterMode="client"
                  sortingMode="client"
                  pageSizeOptions={[5, 10, 25]}
                  initialState={{
                    pagination: {
                      paginationModel: {
                        pageSize: 5,
                      },
                    },
                  }}
                  disableRowSelectionOnClick
                  autoHeight
                  density={colorsDensity}
                  columnVisibilityModel={colorsColumnVisibility}
                  onColumnVisibilityModelChange={setColorsColumnVisibility}
                  slots={{
                    toolbar: SimpleToolbar as GridSlotsComponent['toolbar'],
                  }}
                  slotProps={{
                    toolbar: {
                      density: colorsDensity,
                      onDensityChange: setColorsDensity,
                      columns: colorsColumns,
                      rows: colors,
                      hideIncludeDeleted: true,
                      hideExport: false,
                      hideFilter: false,
                      hideColumns: false,
                      columnVisibilityModel: colorsColumnVisibility,
                      onColumnVisibilityChange: setColorsColumnVisibility,
                      activeFilterGroup: colorsActiveFilterGroup,
                      onFiltersChange: setColorsActiveFilterGroup,
                    } as GridToolbarProps,
                  }}
                  showToolbar
                  disableColumnMenu={false}
                />
              </Box>
            </Grid>
          </Grid>
          </Box>
        </Paper>

        {/* Pickup Locations Grid (Server-Side Pagination) */}
        <Paper className={styles['import-products-page__reference-card']}>
          <Subheader label="Available Pickup Locations" className={styles['import-products-page__section-title']} />
          <Divider className={styles['import-products-page__divider']} />
          <Box className={`${styles['import-products-page__reference-content']} ${styles['import-products-page__grid-wrapper']}`}>
            <StyledDataGrid
              dataTestId="pickup-locations-reference-grid"
              rows={pickupLocations}
              columns={pickupLocationsColumns}
              getRowId={row => {
                const data = row as PickupLocationData
                return data.pickupLocationId ?? data.pickupLocation?.pickupLocationId ?? 0
              }}
              loading={pickupLocationsLoading}
              rowCount={pickupLocationsTotalCount}
              totalCount={pickupLocationsTotalCount}
              paginationModelState={pickupLocationsPaginationModel}
              setPaginationModel={setPickupLocationsPaginationModel}
              paginationMode="server"
              filterMode="server"
              sortingMode="server"
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              autoHeight
              density={pickupLocationsDensity}
              columnVisibilityModel={pickupLocationsColumnVisibility}
              onColumnVisibilityModelChange={setPickupLocationsColumnVisibility}
              slots={{
                toolbar: SimpleToolbar as GridSlotsComponent['toolbar'],
              }}
              slotProps={{
                toolbar: {
                  density: pickupLocationsDensity,
                  onDensityChange: setPickupLocationsDensity,
                  columns: pickupLocationsColumns,
                  rows: pickupLocations,
                  hideIncludeDeleted: true,
                  hideExport: false,
                  hideFilter: false,
                  hideColumns: false,
                  columnVisibilityModel: pickupLocationsColumnVisibility,
                  onColumnVisibilityChange: setPickupLocationsColumnVisibility,
                  activeFilterGroup: pickupLocationsActiveFilterGroup,
                  onFiltersChange: setPickupLocationsActiveFilterGroup,
                } as GridToolbarProps,
              }}
              showToolbar
              disableColumnMenu={false}
            />
          </Box>
        </Paper>

        {/* Product Categories Browser */}
        <Paper className={styles['import-products-page__reference-card']}>
          <Subheader label="Product Categories" className={styles['import-products-page__section-title']} />
          <Divider className={styles['import-products-page__divider']} />

          <Box className={styles['import-products-page__reference-content']}>
          {/* Selected Category Display */}
          {selectedCategory && (
            <Box className={styles['category-browser__selected']}>
              <Box className={styles['category-browser__selected-header']}>
                <CategoryIcon className={styles['category-browser__selected-icon']} />
                <FieldLabel className={styles['category-browser__selected-label']}>
                  Selected Category
                </FieldLabel>
              </Box>
              <Box className={styles['category-browser__selected-details']}>
                <Subheader label={selectedCategory.name} variant="h6" className={styles['category-browser__selected-name']} />
                <SecondaryFont className={styles['category-browser__selected-path']}>
                  {selectedCategory.fullPath}
                </SecondaryFont>
                <Chip
                  label={`Category ID: ${selectedCategory.categoryId}`}
                  color="primary"
                  size="medium"
                  className={styles['category-browser__selected-id-chip']}
                />
              </Box>
            </Box>
          )}

          {/* Category Browser */}
          <Box className={styles['category-browser']}>
            {/* Breadcrumb Trail */}
            {navigationStack.length > 0 && (
              <Box className={styles['category-browser__breadcrumbs']}>
                <Breadcrumbs separator="›" maxItems={6}>
                  <Chip
                    label="Root"
                    size="small"
                    onClick={() => {
                      setNavigationStack([])
                      setCurrentParentId(null)
                      void fetchCategories(null)
                    }}
                    className={styles['category-browser__breadcrumb-chip']}
                  />
                  {breadcrumbs.map((crumb, index) => (
                    <Chip
                      key={index}
                      label={crumb}
                      size="small"
                      className={styles['category-browser__breadcrumb-chip-static']}
                    />
                  ))}
                </Breadcrumbs>
              </Box>
            )}

            {/* Go Back Button */}
            {navigationStack.length > 0 && (
              <ListItemButton onClick={handleGoBack} className={styles['category-browser__back-button']}>
                <ListItemIcon>
                  <ArrowBackIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Go Back"
                  secondary={`Return to ${navigationStack.length > 1 ? navigationStack[navigationStack.length - 2]?.parentName : 'Root'}`}
                />
              </ListItemButton>
            )}

            {/* Loading State */}
            {categoriesLoading && (
              <Box className={styles['category-browser__loading']}>
                <CircularProgress size={24} />
                <SecondaryFont>Loading categories...</SecondaryFont>
              </Box>
            )}

            {/* Empty State */}
            {!categoriesLoading && categories.length === 0 && (
              <Box className={styles['category-browser__empty']}>
                <SecondaryFont>No categories found</SecondaryFont>
              </Box>
            )}

            {/* Category List */}
            {!categoriesLoading && categories.length > 0 && (
              <List className={styles['category-browser__list']}>
                {categories.map(category => {
                  const isLeaf = category.isEnd === true
                  const isSelected = selectedCategory?.categoryId === category.categoryId

                  return (
                    <ListItem key={category.categoryId} disablePadding>
                      <ListItemButton
                        onClick={() => {
                          if (isLeaf) {
                            handleSelectLeaf(category)
                          } else {
                            handleDrillDown(category)
                          }
                        }}
                        selected={isSelected}
                        className={styles['category-browser__item']}
                      >
                        <ListItemText
                          primary={category.name}
                          secondary={isLeaf ? `ID: ${category.categoryId}` : 'Click to browse'}
                        />
                        <ListItemIcon className={styles['category-browser__item-icon']}>
                          {isSelected ? (
                            <CheckCircleIcon color="primary" />
                          ) : isLeaf ? (
                            <CategoryIcon color="action" />
                          ) : (
                            <ArrowForwardIcon color="action" />
                          )}
                        </ListItemIcon>
                      </ListItemButton>
                    </ListItem>
                  )
                })}
              </List>
            )}
          </Box>
          </Box>
        </Paper>

        {/* Import Settings Card with File Upload */}
        <Paper className={styles['import-products-page__settings-card']}>
          <Subheader label="Import Settings" className={styles['import-products-page__section-title']} />
          <Divider className={styles['import-products-page__divider--large']} />

          {/* Top Right - Actions */}
          <Box className={styles['import-products-page__settings-actions']}>
            {/* Download Template */}
            <LinkButton
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
              className={styles['import-products-page__template-button']}
              size="small"
              label="Download Template"
            />

            {/* Max Records Dropdown */}
            <SelectInput
              label="Max Records"
              value={maxRecords}
              onChange={e => {
                setMaxRecords(Number(e.target.value))
              }}
              disabled={isLoading}
              options={(MAX_RECORDS_OPTIONS as readonly number[]).map((value: number) => ({
                value,
                label: String(value),
              }))}
              size="small"
              margin="none"
              fullWidth={false}
              className={styles['import-products-page__max-records-select']}
            />
          </Box>

          {/* File Upload Area */}
          <FileDropZone
            onFileSelect={handleFileSelect}
            onFileClear={handleFileClear}
            currentFile={file}
            accept=".csv,.xlsx,.xls"
            maxSizeMB={10}
            disabled={isLoading}
            isLoading={isLoading}
          />
        </Paper>

        {/* Loading State - Processing File */}
        {isLoading && importData.length === 0 && (
          <Paper className={styles['import-products-page__loading-paper']}>
            <Box className={styles['import-products-page__loading-container']}>
              <CircularProgress size={48} />
              <Subheader label="Processing file..." variant="h6" className={styles['import-products-page__loading-text']} />
              <SecondaryFont>Parsing and validating data</SecondaryFont>
            </Box>
          </Paper>
        )}

        {/* Data Preview */}
        {importData.length > 0 && (
          <Paper className={styles['import-products-page__preview-paper']}>
            {/* Header with Title */}
            <Subheader
              label={`Data Preview (${importData.length} records)`}
              className={styles['import-products-page__section-title']}
            />
            <Divider className={styles['import-products-page__divider']} />

            {/* View Toggle */}
            <Box className={styles['import-products-page__view-toggle-container']}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, newMode: 'grid' | 'json' | null) => {
                  if (newMode) {
                    setViewMode(newMode)
                  }
                }}
                size="small"
              >
                <ToggleButton value="grid">
                  <GridIcon fontSize="small" />
                  <BodyText text="Grid" variant="body2" className={styles['import-products-page__toggle-button-text']} />
                </ToggleButton>
                <ToggleButton value="json">
                  <JsonIcon fontSize="small" />
                  <BodyText text="JSON" variant="body2" className={styles['import-products-page__toggle-button-text']} />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Content Area */}
            {viewMode === 'grid' ? (
              <Box className={styles['import-products-page__grid-container']}>
                <StyledDataGrid
                  dataTestId="import-products-preview-grid"
                  rows={importData}
                  columns={previewColumns}
                  columnGroupingModel={columnGroupingModel}
                  getRowId={row => (row as unknown as ImportProductData).rowNumber}
                  loading={false}
                  paginationMode="client"
                  filterMode="client"
                  sortingMode="client"
                  pageSizeOptions={[10, 25, 50, 100]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 25 } },
                  }}
                  disableRowSelectionOnClick
                  autoHeight
                  rowHeight={130}
                  getRowClassName={params => {
                    const row = params.row as unknown as ImportProductData
                    return row.errors && row.errors.length > 0 ? styles['import-products-page__error-row'] : ''
                  }}
                  showToolbar={false}
                  disableColumnMenu={false}
                />
              </Box>
            ) : (
              <Box className={styles['import-products-page__json-container']}>
                <TableAsJson data={jsonPreviewData} showCopyButton />
              </Box>
            )}
          </Paper>
        )}

        {/* Action Buttons */}
        {importData.length > 0 && (
          <Paper className={styles['import-products-page__actions-card']}>
            {/* Validation Error Warning */}
            {hasValidationErrors && (
              <Box className={styles['import-products-page__error-warning']}>
                <ErrorIcon className={styles['import-products-page__error-warning-icon']} />
                <Box>
                  <BodyText variant="body2" className={styles['import-products-page__error-warning-text']}>
                    <strong>Cannot import data:</strong> {errorCount} {errorCount === 1 ? 'row has' : 'rows have'}{' '}
                    validation errors.
                  </BodyText>
                  <SecondaryFont variant="caption">
                    Please fix all errors before importing. Click on the red error chips to view details.
                  </SecondaryFont>
                </Box>
              </Box>
            )}

            <Box className={styles['import-products-page__actions']}>
              <RedButton
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={() => {
                  navigate(APP_ROUTES.DASHBOARD.PRODUCTS)
                }}
                disabled={isLoading}
                label="Cancel"
                className={styles['import-products-page__action-button']}
              />
              <BlueButton
                variant="contained"
                startIcon={<SendIcon />}
                onClick={handleSubmit}
                disabled={isLoading || hasValidationErrors}
                label={isLoading ? 'Importing...' : `Import ${importData.length} Products`}
                className={styles['import-products-page__action-button']}
              />
            </Box>
          </Paper>
        )}
      </Box>
    </Container>

    {/* Error Details Modal */}
    <ErrorDetailsModal
      open={errorModalOpen}
      onClose={() => {
        setErrorModalOpen(false)
      }}
      title="Validation Errors"
      errors={selectedRowErrors}
      rowIdentifier={selectedRowNumber !== null ? `Row ${selectedRowNumber}` : undefined}
    />

    {/* Stock/Pickup Locations Modal */}
    <PickupLocationsModal
      open={stockModalOpen}
      onClose={() => {
        setStockModalOpen(false)
        setStockModalLocations([])
        setStockModalProductTitle('')
      }}
      locations={stockModalLocations}
      productTitle={stockModalProductTitle}
      loading={stockModalLoading}
    />

    {/* Development Test Data Button */}
    {import.meta.env.DEV && <FillImportTestDataButton />}
  </>
  )
}

export default ImportProducts
