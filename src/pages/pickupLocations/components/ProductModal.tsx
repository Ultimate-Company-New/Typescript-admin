import { useCallback, useEffect, useState } from 'react'

import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    Modal
} from '@mui/material'

import { toast } from 'react-toastify'

import { productApi } from '../../../api/productApi'
import { BodyText, SecondaryFont, Subheader } from '../../../components/fonts'
import { resolveProductCarouselImages } from '../../../utils/productImages'
import styles from '../../../styles/PickupLocations.module.scss'

import { ProductCard, type ProductImageInfo, type ProductMappingItem } from './ProductCard'

const ITEMS_PER_PAGE = 20

function buildMappingImages(
  source: Record<string, unknown>,
  productId?: number,
): ProductImageInfo[] {
  return resolveProductCarouselImages(source, productId).map((image) => ({
    url: image.url,
    label: image.label ?? '',
  }))
}

// ============================================================================
// Product Modal Component
// ============================================================================

interface ProductModalProps {
  open: boolean
  onClose: () => void
  /** Mappings string in format "productId:quantity,productId:quantity" (for import preview) */
  mappingsString?: string
  /** Pickup location ID to fetch products for (alternative to mappingsString) */
  pickupLocationId?: number
  locationName?: string
  /** Purchase order products array (alternative to mappingsString/pickupLocationId) */
  purchaseOrderProducts?: Array<{
    productId: number
    quantity: number
    pricePerUnit?: number | null
  }>
  /** Purchase order ID for display */
  purchaseOrderId?: number
}

export const ProductModal = ({
  open,
  onClose,
  mappingsString,
  pickupLocationId,
  locationName,
  purchaseOrderProducts,
  purchaseOrderId,
}: ProductModalProps): JSX.Element => {
  const [mappings, setMappings] = useState<ProductMappingItem[]>([])
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    if (!open) {
      setMappings([])
      setDisplayedCount(ITEMS_PER_PAGE)
      setTotalCount(0)
      setLoading(false)
      setLoadingMore(false)
    }
  }, [open])

  // Fetch products by pickupLocationId
  const fetchByPickupLocation = useCallback(async (): Promise<void> => {
    if (!pickupLocationId) return

    setLoading(true)
    try {
      const response = await productApi.getProductsInBatches({
        start: 0,
        end: ITEMS_PER_PAGE,
        pageSize: ITEMS_PER_PAGE,
        filters: [
          {
            id: 'pickupLocationId-filter',
            column: 'pickupLocationId',
            operator: 'equals',
            value: pickupLocationId.toString(),
          },
        ],
        logicOperator: 'AND',
        includeDeleted: false,
      })

      const products = (response.data ?? []) as Array<{
        productId?: number
        title?: string
        upc?: string
        brand?: string
        price?: number
        discount?: number
        isDiscountPercent?: boolean
        model?: string
        condition?: string
        countryOfManufacture?: string
        weightKgs?: number
        length?: number
        breadth?: number
        height?: number
        category?: { categoryName?: string }
        mainImageUrl?: string
        topImageUrl?: string
        bottomImageUrl?: string
        frontImageUrl?: string
        backImageUrl?: string
        rightImageUrl?: string
        leftImageUrl?: string
        detailsImageUrl?: string
        defectImageUrl?: string
        additionalImage1Url?: string
        additionalImage2Url?: string
        additionalImage3Url?: string
        pickupLocations?: Array<{
          availableStock?: number
          pickupLocation?: { pickupLocationId?: number }
        }>
      }>

      const productMappings: ProductMappingItem[] = products.map(product => {
        const locationData = product.pickupLocations?.find(
          loc => loc.pickupLocation?.pickupLocationId === pickupLocationId
        )
        const quantity = locationData?.availableStock ?? 0

        const images = buildMappingImages(
          product as unknown as Record<string, unknown>,
          product.productId,
        )

        return {
          productId: product.productId ?? 0,
          quantity,
          productDetails: {
            title: product.title,
            upc: product.upc,
            brand: product.brand,
            price: product.price,
            discount: product.discount,
            isDiscountPercent: product.isDiscountPercent,
            model: product.model,
            condition: product.condition,
            countryOfManufacture: product.countryOfManufacture,
            weightKgs: product.weightKgs,
            length: product.length,
            breadth: product.breadth,
            height: product.height,
            category: product.category?.categoryName,
            images,
          },
        }
      })

      setMappings(productMappings)
      setTotalCount(response.totalDataCount ?? productMappings.length)
      setDisplayedCount(ITEMS_PER_PAGE)
    } catch (error) {
      console.error('Failed to load products for pickup location', error)
      toast.error('Failed to load products for this pickup location')
      setMappings([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [pickupLocationId])

  // Parse mappings string and fetch product details
  const parseMappings = useCallback(async (): Promise<void> => {
    if (!mappingsString || mappingsString.trim() === '') {
      setMappings([])
      return
    }

    setLoading(true)
    try {
      const parts = mappingsString.split(',')
      const parsed: ProductMappingItem[] = []

      for (const part of parts) {
        const [productIdStr, quantityStr] = part.trim().split(':')
        const productId = parseInt(productIdStr, 10)
        const quantity = parseInt(quantityStr, 10)

        if (!isNaN(productId) && !isNaN(quantity) && productId > 0 && quantity > 0) {
          parsed.push({ productId, quantity })
        }
      }

      setTotalCount(parsed.length)

      // Fetch product details for the first batch
      const initialBatch = parsed.slice(0, ITEMS_PER_PAGE)
      const productIds = initialBatch.map(p => p.productId)

      if (productIds.length > 0) {
        const response = await productApi.getProductsInBatches({
          start: 0,
          end: productIds.length,
          pageSize: productIds.length,
          selectedIds: productIds,
          includeDeleted: false,
        })

        const productMap = new Map<number, ProductMappingItem['productDetails']>()
        for (const apiProduct of (response.data ?? []) as Array<{
          productId?: number
          title?: string
          upc?: string
          brand?: string
          price?: number
          discount?: number
          isDiscountPercent?: boolean
          model?: string
          condition?: string
          countryOfManufacture?: string
          weightKgs?: number
          length?: number
          breadth?: number
          height?: number
          category?: { categoryName?: string }
          // Individual image URL fields from API
          mainImageUrl?: string
          topImageUrl?: string
          bottomImageUrl?: string
          frontImageUrl?: string
          backImageUrl?: string
          rightImageUrl?: string
          leftImageUrl?: string
          detailsImageUrl?: string
          defectImageUrl?: string
          additionalImage1Url?: string
          additionalImage2Url?: string
          additionalImage3Url?: string
          // Sometimes data is nested under product object
          product?: {
            productId?: number
            title?: string
            upc?: string
            brand?: string
            price?: number
            discount?: number
            isDiscountPercent?: boolean
            model?: string
            condition?: string
            countryOfManufacture?: string
            weightKgs?: number
            length?: number
            breadth?: number
            height?: number
            category?: { categoryName?: string }
            mainImageUrl?: string
            topImageUrl?: string
            bottomImageUrl?: string
            frontImageUrl?: string
            backImageUrl?: string
            rightImageUrl?: string
            leftImageUrl?: string
            detailsImageUrl?: string
            defectImageUrl?: string
            additionalImage1Url?: string
            additionalImage2Url?: string
            additionalImage3Url?: string
          }
        }>) {
          // Handle both root-level and nested product data
          const product = apiProduct.product ?? apiProduct
          const productId = apiProduct.productId ?? product.productId

          if (productId) {
            const images = buildMappingImages(
              {
                ...(product as Record<string, unknown>),
                ...(apiProduct as Record<string, unknown>),
                productId,
              },
              productId,
            )

            productMap.set(productId, {
              title: apiProduct.title ?? product.title,
              upc: apiProduct.upc ?? product.upc,
              brand: apiProduct.brand ?? product.brand,
              price: apiProduct.price ?? product.price,
              discount: apiProduct.discount ?? product.discount,
              isDiscountPercent: apiProduct.isDiscountPercent ?? product.isDiscountPercent,
              model: apiProduct.model ?? product.model,
              condition: apiProduct.condition ?? product.condition,
              countryOfManufacture: apiProduct.countryOfManufacture ?? product.countryOfManufacture,
              weightKgs: apiProduct.weightKgs ?? product.weightKgs,
              length: apiProduct.length ?? product.length,
              breadth: apiProduct.breadth ?? product.breadth,
              height: apiProduct.height ?? product.height,
              category: apiProduct.category?.categoryName ?? product.category?.categoryName,
              images,
            })
          }
        }

        for (const mapping of parsed) {
          mapping.productDetails = productMap.get(mapping.productId)
        }
      }

      setMappings(parsed)
      setDisplayedCount(ITEMS_PER_PAGE)
    } catch {
      // Keep parsed mappings without details
    } finally {
      setLoading(false)
    }
  }, [mappingsString])

  // Fetch products from purchase order products array
  const fetchPurchaseOrderProducts = useCallback(async (): Promise<void> => {
    if (!purchaseOrderProducts || purchaseOrderProducts.length === 0) {
      setMappings([])
      setTotalCount(0)
      setDisplayedCount(ITEMS_PER_PAGE)
      return
    }

    setLoading(true)
    try {
      const productIds = purchaseOrderProducts.map(p => p.productId)
      const productMap = new Map<number, { quantity: number; pricePerUnit?: number | null }>()

      purchaseOrderProducts.forEach(p => {
        productMap.set(p.productId, { quantity: p.quantity, pricePerUnit: p.pricePerUnit })
      })

      const response = await productApi.getProductsInBatches({
        start: 0,
        end: productIds.length,
        pageSize: productIds.length,
        selectedIds: productIds,
        includeDeleted: false,
      })

      const parsed: ProductMappingItem[] = []
      for (const apiProduct of (response.data ?? []) as Array<{
        productId?: number
        title?: string
        upc?: string
        brand?: string
        price?: number
        discount?: number
        isDiscountPercent?: boolean
        model?: string
        condition?: string
        countryOfManufacture?: string
        weightKgs?: number
        length?: number
        breadth?: number
        height?: number
        category?: { categoryName?: string }
        mainImageUrl?: string
        topImageUrl?: string
        bottomImageUrl?: string
        frontImageUrl?: string
        backImageUrl?: string
        rightImageUrl?: string
        leftImageUrl?: string
        detailsImageUrl?: string
        defectImageUrl?: string
        additionalImage1Url?: string
        additionalImage2Url?: string
        additionalImage3Url?: string
        product?: {
          productId?: number
          title?: string
          upc?: string
          brand?: string
          price?: number
          discount?: number
          isDiscountPercent?: boolean
          model?: string
          condition?: string
          countryOfManufacture?: string
          weightKgs?: number
          length?: number
          breadth?: number
          height?: number
          category?: { categoryName?: string }
          mainImageUrl?: string
          topImageUrl?: string
          bottomImageUrl?: string
          frontImageUrl?: string
          backImageUrl?: string
          rightImageUrl?: string
          leftImageUrl?: string
          detailsImageUrl?: string
          defectImageUrl?: string
          additionalImage1Url?: string
          additionalImage2Url?: string
          additionalImage3Url?: string
        }
      }>) {
        const product = apiProduct.product ?? apiProduct
        const productId = apiProduct.productId ?? product.productId

        if (productId) {
          const productData = productMap.get(productId)
          if (!productData) continue

          const images = buildMappingImages(
            {
              ...(product as Record<string, unknown>),
              ...(apiProduct as Record<string, unknown>),
              productId,
            },
            productId,
          )

          parsed.push({
            productId,
            quantity: productData.quantity,
            pricePerUnit: productData.pricePerUnit ?? undefined,
            productDetails: {
              title: apiProduct.title ?? product.title,
              upc: apiProduct.upc ?? product.upc,
              brand: apiProduct.brand ?? product.brand,
              price: apiProduct.price ?? product.price,
              discount: apiProduct.discount ?? product.discount,
              isDiscountPercent: apiProduct.isDiscountPercent ?? product.isDiscountPercent,
              model: apiProduct.model ?? product.model,
              condition: apiProduct.condition ?? product.condition,
              countryOfManufacture: apiProduct.countryOfManufacture ?? product.countryOfManufacture,
              weightKgs: apiProduct.weightKgs ?? product.weightKgs,
              length: apiProduct.length ?? product.length,
              breadth: apiProduct.breadth ?? product.breadth,
              height: apiProduct.height ?? product.height,
              category: apiProduct.category?.categoryName ?? product.category?.categoryName,
              images,
            },
          })
        }
      }

      setMappings(parsed)
      setTotalCount(parsed.length)
      setDisplayedCount(ITEMS_PER_PAGE)
    } catch {
      setMappings([])
    } finally {
      setLoading(false)
    }
  }, [purchaseOrderProducts])

  useEffect(() => {
    if (open) {
      // Priority: purchaseOrderProducts > pickupLocationId > mappingsString
      if (purchaseOrderProducts) {
        void fetchPurchaseOrderProducts()
      } else if (pickupLocationId) {
        void fetchByPickupLocation()
      } else {
        void parseMappings()
      }
    }
  }, [open, purchaseOrderProducts, pickupLocationId, fetchByPickupLocation, parseMappings, fetchPurchaseOrderProducts])

  // Load more products
  const handleLoadMore = async (): Promise<void> => {
    setLoadingMore(true)
    try {
      const nextBatch = mappings.slice(displayedCount, displayedCount + ITEMS_PER_PAGE)
      const productIds = nextBatch.filter(p => !p.productDetails).map(p => p.productId)

      if (productIds.length > 0) {
        const response = await productApi.getProductsInBatches({
          start: 0,
          end: productIds.length,
          pageSize: productIds.length,
          selectedIds: productIds,
          includeDeleted: false,
        })

        const productMap = new Map<number, ProductMappingItem['productDetails']>()
        for (const apiProduct of (response.data ?? []) as Array<{
          productId?: number
          title?: string
          upc?: string
          brand?: string
          price?: number
          discount?: number
          isDiscountPercent?: boolean
          model?: string
          condition?: string
          countryOfManufacture?: string
          weightKgs?: number
          length?: number
          breadth?: number
          height?: number
          category?: { categoryName?: string }
          // Individual image URL fields from API
          mainImageUrl?: string
          topImageUrl?: string
          bottomImageUrl?: string
          frontImageUrl?: string
          backImageUrl?: string
          rightImageUrl?: string
          leftImageUrl?: string
          detailsImageUrl?: string
          defectImageUrl?: string
          additionalImage1Url?: string
          additionalImage2Url?: string
          additionalImage3Url?: string
          // Sometimes data is nested under product object
          product?: {
            productId?: number
            title?: string
            upc?: string
            brand?: string
            price?: number
            discount?: number
            isDiscountPercent?: boolean
            model?: string
            condition?: string
            countryOfManufacture?: string
            weightKgs?: number
            length?: number
            breadth?: number
            height?: number
            category?: { categoryName?: string }
            mainImageUrl?: string
            topImageUrl?: string
            bottomImageUrl?: string
            frontImageUrl?: string
            backImageUrl?: string
            rightImageUrl?: string
            leftImageUrl?: string
            detailsImageUrl?: string
            defectImageUrl?: string
            additionalImage1Url?: string
            additionalImage2Url?: string
            additionalImage3Url?: string
          }
        }>) {
          // Handle both root-level and nested product data
          const product = apiProduct.product ?? apiProduct
          const productId = apiProduct.productId ?? product.productId

          if (productId) {
            const images = buildMappingImages(
              {
                ...(product as Record<string, unknown>),
                ...(apiProduct as Record<string, unknown>),
                productId,
              },
              productId,
            )

            productMap.set(productId, {
              title: apiProduct.title ?? product.title,
              upc: apiProduct.upc ?? product.upc,
              brand: apiProduct.brand ?? product.brand,
              price: apiProduct.price ?? product.price,
              discount: apiProduct.discount ?? product.discount,
              isDiscountPercent: apiProduct.isDiscountPercent ?? product.isDiscountPercent,
              model: apiProduct.model ?? product.model,
              condition: apiProduct.condition ?? product.condition,
              countryOfManufacture: apiProduct.countryOfManufacture ?? product.countryOfManufacture,
              weightKgs: apiProduct.weightKgs ?? product.weightKgs,
              length: apiProduct.length ?? product.length,
              breadth: apiProduct.breadth ?? product.breadth,
              height: apiProduct.height ?? product.height,
              category: apiProduct.category?.categoryName ?? product.category?.categoryName,
              images,
            })
          }
        }

        setMappings(prev =>
          prev.map(m => ({
            ...m,
            productDetails: m.productDetails ?? productMap.get(m.productId),
          }))
        )
      }

      setDisplayedCount(prev => prev + ITEMS_PER_PAGE)
    } catch {
      // Continue without fetching details
      setDisplayedCount(prev => prev + ITEMS_PER_PAGE)
    } finally {
      setLoadingMore(false)
    }
  }

  // Load more products for pickupLocationId mode
  const handleLoadMoreByLocation = async (): Promise<void> => {
    if (!pickupLocationId) return

    setLoadingMore(true)
    try {
      const response = await productApi.getProductsInBatches({
        start: displayedCount,
        end: displayedCount + ITEMS_PER_PAGE,
        pageSize: ITEMS_PER_PAGE,
        filters: [
          {
            id: 'pickupLocationId-filter',
            column: 'pickupLocationId',
            operator: 'equals',
            value: pickupLocationId.toString(),
          },
        ],
        logicOperator: 'AND',
        includeDeleted: false,
      })

      const products = (response.data ?? []) as Array<{
        productId?: number
        title?: string
        upc?: string
        brand?: string
        price?: number
        discount?: number
        isDiscountPercent?: boolean
        model?: string
        condition?: string
        countryOfManufacture?: string
        weightKgs?: number
        length?: number
        breadth?: number
        height?: number
        category?: { categoryName?: string }
        mainImageUrl?: string
        topImageUrl?: string
        bottomImageUrl?: string
        frontImageUrl?: string
        backImageUrl?: string
        rightImageUrl?: string
        leftImageUrl?: string
        detailsImageUrl?: string
        defectImageUrl?: string
        additionalImage1Url?: string
        additionalImage2Url?: string
        additionalImage3Url?: string
        pickupLocations?: Array<{
          availableStock?: number
          pickupLocation?: { pickupLocationId?: number }
        }>
      }>

      const newMappings: ProductMappingItem[] = products.map(product => {
        const locationData = product.pickupLocations?.find(
          loc => loc.pickupLocation?.pickupLocationId === pickupLocationId
        )
        const quantity = locationData?.availableStock ?? 0

        const images = buildMappingImages(
          product as unknown as Record<string, unknown>,
          product.productId,
        )

        return {
          productId: product.productId ?? 0,
          quantity,
          productDetails: {
            title: product.title,
            upc: product.upc,
            brand: product.brand,
            price: product.price,
            discount: product.discount,
            isDiscountPercent: product.isDiscountPercent,
            model: product.model,
            condition: product.condition,
            countryOfManufacture: product.countryOfManufacture,
            weightKgs: product.weightKgs,
            length: product.length,
            breadth: product.breadth,
            height: product.height,
            category: product.category?.categoryName,
            images,
          },
        }
      })

      setMappings(prev => [...prev, ...newMappings])
      setDisplayedCount(prev => prev + ITEMS_PER_PAGE)
    } catch {
      // Ignore error
    } finally {
      setLoadingMore(false)
    }
  }

  const displayedMappings = mappings.slice(0, displayedCount)
  const hasMore = pickupLocationId ? displayedCount < totalCount : displayedCount < mappings.length
  const remainingCount = pickupLocationId ? totalCount - mappings.length : mappings.length - displayedCount

  const onLoadMore = (): void => {
    if (pickupLocationId) {
      void handleLoadMoreByLocation()
    } else {
      void handleLoadMore()
    }
  }

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="product-mappings-modal">
      <Box className={styles['mappings-modal']} data-test-id="pickup-location-products-modal">
        <Box className={styles['mappings-modal__header']}>
          <Box className={styles['mappings-modal__header-content']}>
            <ShoppingCartIcon color="primary" />
            <Subheader label={pickupLocationId ? 'Products' : 'Product Mappings'} variant="h6" />
            {!loading && (
              <Chip
                label={pickupLocationId ? totalCount : mappings.length}
                size="small"
                color="primary"
                data-test-id="pickup-location-products-modal-count"
              />
            )}
          </Box>
          <IconButton onClick={onClose} size="small" data-test-id="pickup-location-products-modal-close">
            <CloseIcon />
          </IconButton>
        </Box>

        {locationName && !purchaseOrderId && (
          <Box
            className={styles['mappings-modal__subtitle']}
            data-test-id="pickup-location-products-modal-subtitle"
          >
            <SecondaryFont>
              Products {pickupLocationId ? 'at' : 'for'}: <strong>{locationName}</strong>
            </SecondaryFont>
          </Box>
        )}

        <Box className={styles['mappings-modal__content']}>
          {loading ? (
            <Box
              className={styles['mappings-modal__loading']}
              data-test-id="pickup-location-products-modal-loading"
            >
              <CircularProgress size={40} />
              <SecondaryFont>Loading products...</SecondaryFont>
            </Box>
          ) : mappings.length === 0 ? (
            <Box className={styles['mappings-modal__empty']}>
              <BodyText color="text.secondary">No products found</BodyText>
            </Box>
          ) : (
            <>
              <Box className={styles['mappings-modal__grid']}>
                {displayedMappings.map((mapping, index) => (
                  <ProductCard key={`${mapping.productId}-${index}`} mapping={mapping} />
                ))}
              </Box>

              {hasMore && (
                <Box className={styles['mappings-modal__load-more']}>
                  <Button
                    variant="outlined"
                    onClick={onLoadMore}
                    disabled={loadingMore}
                    startIcon={loadingMore ? <CircularProgress size={16} /> : <ExpandMoreIcon />}
                  >
                    {loadingMore ? 'Loading...' : `Load More (${remainingCount} remaining)`}
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Modal>
  )
}

export default ProductModal
