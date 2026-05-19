import { useCallback, useEffect, useState } from 'react'

import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import InventoryIcon from '@mui/icons-material/Inventory'
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Modal
} from '@mui/material'

import { packageApi } from '../../../api/packageApi'
import { BodyText, SecondaryFont, Subheader } from '../../../components/fonts'
import styles from '../../../styles/PickupLocations.module.scss'

import { PackageCard, type PackageMappingItem } from './PackageCard'

const ITEMS_PER_PAGE = 20

// ============================================================================
// Package Modal Component
// ============================================================================

interface PackageModalProps {
  open: boolean
  onClose: () => void
  /** Mappings string in format "packageId:quantity:reorder:maxStock,..." (for import preview) */
  mappingsString?: string
  /** Pickup location ID to fetch packages for (alternative to mappingsString) */
  pickupLocationId?: number
  locationName?: string
}

export const PackageModal = ({
  open,
  onClose,
  mappingsString,
  pickupLocationId,
  locationName,
}: PackageModalProps): JSX.Element => {
  const [mappings, setMappings] = useState<PackageMappingItem[]>([])
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  // Fetch packages by pickupLocationId
  const fetchByPickupLocation = useCallback(async (): Promise<void> => {
    if (!pickupLocationId) return

    setLoading(true)
    try {
      const response = await packageApi.getPackagesInBatches({
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

      const packages = (response.data ?? []) as Array<{
        packageId?: number
        packageName?: string
        packageType?: string
        length?: number
        breadth?: number
        height?: number
        maxWeight?: number
        pricePerUnit?: number
        standardCapacity?: number
        notes?: string
        pickupLocationQuantities?: Record<number, {
          quantity?: number
          availableQuantity?: number
          reorderLevel?: number
          maxStockLevel?: number
        }>
      }>

      const packageMappings: PackageMappingItem[] = packages.map(pkg => {
        const locationData = pkg.pickupLocationQuantities?.[pickupLocationId]
        const quantity = locationData?.quantity ?? locationData?.availableQuantity ?? 0
        const reorderLevel = locationData?.reorderLevel ?? 1
        const maxStockLevel = locationData?.maxStockLevel ?? quantity * 2

        return {
          packageId: pkg.packageId ?? 0,
          quantity,
          reorderLevel,
          maxStockLevel,
          packageDetails: {
            packageName: pkg.packageName,
            packageType: pkg.packageType,
            length: pkg.length,
            breadth: pkg.breadth,
            height: pkg.height,
            maxWeight: pkg.maxWeight,
            pricePerUnit: pkg.pricePerUnit,
            standardCapacity: pkg.standardCapacity,
            notes: pkg.notes,
          },
        }
      })

      setMappings(packageMappings)
      setTotalCount(response.totalDataCount ?? packageMappings.length)
      setDisplayedCount(ITEMS_PER_PAGE)
    } catch {
      setMappings([])
    } finally {
      setLoading(false)
    }
  }, [pickupLocationId])

  // Parse mappings string and fetch package details
  const parseMappings = useCallback(async (): Promise<void> => {
    if (!mappingsString || mappingsString.trim() === '') {
      setMappings([])
      return
    }

    setLoading(true)
    try {
      const parts = mappingsString.split(',')
      const parsed: PackageMappingItem[] = []

      for (const part of parts) {
        const [packageIdStr, quantityStr, reorderStr, maxStockStr] = part.trim().split(':')
        const packageId = parseInt(packageIdStr, 10)
        const quantity = parseInt(quantityStr, 10)
        const reorderLevel = parseInt(reorderStr, 10) || 1
        const maxStockLevel = parseInt(maxStockStr, 10) || quantity * 2

        if (!isNaN(packageId) && !isNaN(quantity) && packageId > 0 && quantity > 0) {
          parsed.push({ packageId, quantity, reorderLevel, maxStockLevel })
        }
      }

      setTotalCount(parsed.length)

      // Fetch package details for the first batch
      const initialBatch = parsed.slice(0, ITEMS_PER_PAGE)
      const packageIds = initialBatch.map(p => p.packageId)

      if (packageIds.length > 0) {
        const response = await packageApi.getPackagesInBatches({
          start: 0,
          end: packageIds.length,
          pageSize: packageIds.length,
          selectedIds: packageIds,
          includeDeleted: false,
        })

        const packageMap = new Map<number, PackageMappingItem['packageDetails']>()
        for (const pkg of (response.data ?? []) as Array<{
          packageId?: number
          packageName?: string
          packageType?: string
          length?: number
          breadth?: number
          height?: number
          maxWeight?: number
          pricePerUnit?: number
          standardCapacity?: number
          notes?: string
        }>) {
          if (pkg.packageId) {
            packageMap.set(pkg.packageId, {
              packageName: pkg.packageName,
              packageType: pkg.packageType,
              length: pkg.length,
              breadth: pkg.breadth,
              height: pkg.height,
              maxWeight: pkg.maxWeight,
              pricePerUnit: pkg.pricePerUnit,
              standardCapacity: pkg.standardCapacity,
              notes: pkg.notes,
            })
          }
        }

        for (const mapping of parsed) {
          mapping.packageDetails = packageMap.get(mapping.packageId)
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

  useEffect(() => {
    if (open) {
      // Use pickupLocationId if provided, otherwise parse mappingsString
      if (pickupLocationId) {
        void fetchByPickupLocation()
      } else {
        void parseMappings()
      }
    }
  }, [open, pickupLocationId, fetchByPickupLocation, parseMappings])

  // Load more packages
  const handleLoadMore = async (): Promise<void> => {
    setLoadingMore(true)
    try {
      const nextBatch = mappings.slice(displayedCount, displayedCount + ITEMS_PER_PAGE)
      const packageIds = nextBatch.filter(p => !p.packageDetails).map(p => p.packageId)

      if (packageIds.length > 0) {
        const response = await packageApi.getPackagesInBatches({
          start: 0,
          end: packageIds.length,
          pageSize: packageIds.length,
          selectedIds: packageIds,
          includeDeleted: false,
        })

        const packageMap = new Map<number, PackageMappingItem['packageDetails']>()
        for (const pkg of (response.data ?? []) as Array<{
          packageId?: number
          packageName?: string
          packageType?: string
          length?: number
          breadth?: number
          height?: number
          maxWeight?: number
          pricePerUnit?: number
          standardCapacity?: number
          notes?: string
        }>) {
          if (pkg.packageId) {
            packageMap.set(pkg.packageId, {
              packageName: pkg.packageName,
              packageType: pkg.packageType,
              length: pkg.length,
              breadth: pkg.breadth,
              height: pkg.height,
              maxWeight: pkg.maxWeight,
              pricePerUnit: pkg.pricePerUnit,
              standardCapacity: pkg.standardCapacity,
              notes: pkg.notes,
            })
          }
        }

        setMappings(prev =>
          prev.map(m => ({
            ...m,
            packageDetails: m.packageDetails ?? packageMap.get(m.packageId),
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

  // Load more packages for pickupLocationId mode
  const handleLoadMoreByLocation = async (): Promise<void> => {
    if (!pickupLocationId) return

    setLoadingMore(true)
    try {
      const response = await packageApi.getPackagesInBatches({
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

      const packages = (response.data ?? []) as Array<{
        packageId?: number
        packageName?: string
        packageType?: string
        length?: number
        breadth?: number
        height?: number
        maxWeight?: number
        pricePerUnit?: number
        standardCapacity?: number
        notes?: string
        pickupLocationQuantities?: Record<number, {
          quantity?: number
          availableQuantity?: number
          reorderLevel?: number
          maxStockLevel?: number
        }>
      }>

      const newMappings: PackageMappingItem[] = packages.map(pkg => {
        const locationData = pkg.pickupLocationQuantities?.[pickupLocationId]
        const quantity = locationData?.quantity ?? locationData?.availableQuantity ?? 0
        const reorderLevel = locationData?.reorderLevel ?? 1
        const maxStockLevel = locationData?.maxStockLevel ?? quantity * 2

        return {
          packageId: pkg.packageId ?? 0,
          quantity,
          reorderLevel,
          maxStockLevel,
          packageDetails: {
            packageName: pkg.packageName,
            packageType: pkg.packageType,
            length: pkg.length,
            breadth: pkg.breadth,
            height: pkg.height,
            maxWeight: pkg.maxWeight,
            pricePerUnit: pkg.pricePerUnit,
            standardCapacity: pkg.standardCapacity,
            notes: pkg.notes,
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
    <Modal open={open} onClose={onClose} aria-labelledby="package-mappings-modal">
      <Box className={styles['mappings-modal']} data-test-id="pickup-location-packages-modal">
        <Box className={styles['mappings-modal__header']}>
          <Box className={styles['mappings-modal__header-content']}>
            <InventoryIcon color="secondary" />
            <Subheader label={pickupLocationId ? 'Packages' : 'Package Mappings'} variant="h6" />
            {!loading && (
              <Chip
                label={pickupLocationId ? totalCount : mappings.length}
                size="small"
                color="secondary"
                data-test-id="pickup-location-packages-modal-count"
              />
            )}
          </Box>
          <IconButton onClick={onClose} size="small" data-test-id="pickup-location-packages-modal-close">
            <CloseIcon />
          </IconButton>
        </Box>

        {locationName && (
          <Box
            className={styles['mappings-modal__subtitle']}
            data-test-id="pickup-location-packages-modal-subtitle"
          >
            <SecondaryFont>
              Packages {pickupLocationId ? 'at' : 'for'}: <strong>{locationName}</strong>
            </SecondaryFont>
          </Box>
        )}

        <Box className={styles['mappings-modal__content']}>
          {loading ? (
            <Box
              className={styles['mappings-modal__loading']}
              data-test-id="pickup-location-packages-modal-loading"
            >
              <CircularProgress size={40} />
              <SecondaryFont>Loading packages...</SecondaryFont>
            </Box>
          ) : mappings.length === 0 ? (
            <Box className={styles['mappings-modal__empty']}>
              <BodyText color="text.secondary">No packages found</BodyText>
            </Box>
          ) : (
            <>
              <Box className={styles['mappings-modal__grid']}>
                {displayedMappings.map((mapping, index) => (
                  <PackageCard key={`${mapping.packageId}-${index}`} mapping={mapping} />
                ))}
              </Box>

              {hasMore && (
                <Box className={styles['mappings-modal__load-more']}>
                  <Button
                    variant="outlined"
                    color="secondary"
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

export default PackageModal
