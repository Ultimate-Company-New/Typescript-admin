import { useState } from 'react'

import { toast } from 'react-toastify'

import { Science as ScienceIcon } from '@mui/icons-material'
import { CircularProgress, Fab, Tooltip } from '@mui/material'

import { productApi } from '../../../api/productApi'
import { type FillTestDataButtonProps, type ProductBatchItem, type PurchaseOrderProductItemForm } from '../../../models'
import { type PurchaseOrderProductItem } from '../../../models/api-models'
import styles from '../../../styles/PurchaseOrders.module.scss'
import { generatePurchaseOrderFormTest } from '../../../utils/generateTestData'

/**
 * Fill Test Data Button Component for Purchase Order Forms
 *
 * A floating action button (FAB) that automatically fills the purchase order form
 * with realistic test data for development and testing purposes.
 *
 * What it fills:
 * 1. Form fields: vendor number, dates, status, priority, lead assignment, address, fees, notes
 * 2. Attachments: 5 test images (invoice, receipt, quote, contract, delivery note)
 * 3. Products: 10 random products from the database with quantity 10 each
 *
 * Key Features:
 * - Fetches real products from the API (not hardcoded)
 * - Generates realistic test attachments using placeholder service
 * - Handles address state changes (triggers city dropdown updates)
 * - Waits for address effects before adding products (prevents race conditions)
 * - Shows loading state while filling
 * - Provides success/error feedback via toast notifications
 *
 * Why this component exists:
 * - Speeds up development by quickly populating forms
 * - Ensures consistent test data across team members
 * - Tests form validation and calculations with realistic data
 * - Helps QA test various scenarios quickly
 *
 * @param {FillTestDataButtonProps} props - Component props
 * @returns {JSX.Element} Rendered FAB button
 */
const FillTestDataButton = ({
  setValue,
  isEditMode,
  currentVendorNumber,
  onStateChange,
  onProductItemsChange,
}: FillTestDataButtonProps): JSX.Element => {
  // Loading state: Prevents multiple simultaneous fills and shows spinner
  const [filling, setFilling] = useState(false)

  /**
   * Generates test attachment images using a placeholder service.
   *
   * Creates 5 different attachment types:
   * - invoice: Purchase invoice document
   * - receipt: Payment receipt
   * - quote: Price quote
   * - contract: Purchase contract
   * - delivery_note: Delivery note
   *
   * Uses picsum.photos (same service as products) for consistency.
   * Each image has a unique seed based on timestamp and random number to ensure
   * different images are generated each time.
   *
   * @returns {Record<string, string>} Object mapping file names to image URLs
   *   Format: { "test_invoice_1234567890_0.jpg": "https://picsum.photos/..." }
   */
  const generateTestAttachments = (): Record<string, string> => {
    const timestamp = Date.now()
    const attachments: Record<string, string> = {}

    // Generate 5 test images using picsum.photos (same as products)
    const attachmentTypes = ['invoice', 'receipt', 'quote', 'contract', 'delivery_note']

    attachmentTypes.forEach((type, index) => {
      const uniqueSeed = `${timestamp}_attachment_${index}_${Math.floor(Math.random() * 100000)}`
      const imageUrl = `https://picsum.photos/seed/${uniqueSeed}/800/600`
      const fileName = `test_${type}_${timestamp}_${index}.jpg`
      attachments[fileName] = imageUrl
    })

    return attachments
  }

  /**
   * Fetches random products from the API and converts them to PurchaseOrderProductItemForm format.
   *
   * Process:
   * 1. Fetches a batch of products (100 products) to have a good pool for random selection
   * 2. Randomly shuffles the products array
   * 3. Selects the requested count of products
   * 4. Maps each product to PurchaseOrderProductItemForm format with:
   *    - Product ID and title
   *    - Quantity (same for all products)
   *    - Price (with discount applied if applicable)
   *    - Images (all available image URLs from API)
   *    - Empty pickup allocations (will be calculated later via shipping optimization)
   *    - Initial financial values (discounts, subtotals, etc.)
   *
   * Why fetch 100 products?
   * - Ensures we have enough products to randomly select from
   * - Avoids fetching entire database (performance)
   * - Provides variety in test data
   *
   * Why random shuffle?
   * - Ensures different products are selected each time
   * - Better test coverage (not always same products)
   * - More realistic testing scenarios
   *
   * @param {number} count - Number of products to fetch and return
   * @param {number} quantity - Quantity to assign to each product
   * @returns {Promise<PurchaseOrderProductItemForm[]>} Array of formatted product items
   * @throws {Error} If no products are available in the database
   */
  const fetchRandomProducts = async (count: number, quantity: number): Promise<PurchaseOrderProductItemForm[]> => {
    // Fetch a batch of products (get more than needed to allow random selection)
    // We fetch 100 products to have a good pool for randomization
    const response = await productApi.getProductsInBatches({
      start: 0,
      end: 100, // Fetch up to 100 to have a good pool for random selection
      pageSize: 100,
      sortField: 'productId',
      sortOrder: 'asc',
    })

    const allProducts = (response.data as ProductBatchItem[]) || []

    // Validate: Ensure we have products to work with
    if (allProducts.length === 0) {
      throw new Error('No products available in the database')
    }

    // Randomly shuffle array: sort with random comparator (Fisher-Yates style)
    // This ensures different products are selected each time
    const shuffled = [...allProducts].sort(() => Math.random() - 0.5)
    // Select first N products from shuffled array
    const selectedProducts = shuffled.slice(0, Math.min(count, allProducts.length))

    /**
     * Map each selected product to PurchaseOrderProductItemForm format.
     *
     * This conversion is necessary because:
     * - API returns ProductBatchItem format
     * - Form expects PurchaseOrderProductItemForm format
     * - We need to structure the data with images, allocations, and financial fields
     */
    return selectedProducts.map((product) => {
      /**
       * Collect all available image URLs from the API response.
       *
       * The API provides multiple image fields (mainImageUrl, topImageUrl, etc.).
       * We collect all non-empty URLs and label them appropriately.
       * This matches the approach used in ProductPickerModal for consistency.
       */
      const images: Array<{ url: string; label?: string }> = []
      if (product.mainImageUrl) images.push({ url: product.mainImageUrl, label: 'Main' })
      if (product.topImageUrl) images.push({ url: product.topImageUrl, label: 'Top' })
      if (product.bottomImageUrl) images.push({ url: product.bottomImageUrl, label: 'Bottom' })
      if (product.frontImageUrl) images.push({ url: product.frontImageUrl, label: 'Front' })
      if (product.backImageUrl) images.push({ url: product.backImageUrl, label: 'Back' })
      if (product.rightImageUrl) images.push({ url: product.rightImageUrl, label: 'Right' })
      if (product.leftImageUrl) images.push({ url: product.leftImageUrl, label: 'Left' })
      if (product.detailsImageUrl) images.push({ url: product.detailsImageUrl, label: 'Details' })
      if (product.defectImageUrl) images.push({ url: product.defectImageUrl, label: 'Defect' })
      if (product.additionalImage1Url) images.push({ url: product.additionalImage1Url, label: 'Additional 1' })
      if (product.additionalImage2Url) images.push({ url: product.additionalImage2Url, label: 'Additional 2' })
      if (product.additionalImage3Url) images.push({ url: product.additionalImage3Url, label: 'Additional 3' })

      // Calculate initial subtotal: quantity × price
      const subtotal = quantity * product.price

      // Return formatted product item
      return {
        productId: product.productId,
        productTitle: product.title,
        quantity: quantity, // Same quantity for all test products
        pricePerUnit: product.price, // Use product's price from API
        images: images.length > 0 ? images : undefined, // Only include if we have images
        pickupAllocations: [], // Empty - will be calculated via shipping optimization
        discount: product.discount ?? 0, // Use product's discount if available
        isDiscountPercent: product.isDiscountPercent ?? false,
        totalDiscount: 0, // Will be calculated at order level
        subtotal, // Initial subtotal (before packaging/shipping/tax)
        totalPackagingFee: 0, // Will be calculated via shipping optimization
        totalShippingFee: 0, // Will be calculated via shipping optimization
        grandTotal: subtotal, // Just subtotal for now (will be recalculated)
      }
    })
  }

  /**
   * Main handler: Fills the entire purchase order form with test data.
   *
   * This is an async function that:
   * 1. Generates form field test data (address, dates, etc.)
   * 2. Generates test attachments (5 images)
   * 3. Fetches random products from API
   * 4. Fills all form fields using setValue
   * 5. Triggers address state change (for city dropdown)
   * 6. Waits for address effects to complete
   * 7. Adds products to the order
   * 8. Shows success/error feedback
   *
   * Why wait 100ms before adding products?
   * - Address changes trigger effects in parent component
   * - Parent component may clear products when address changes
   * - Waiting ensures address effects complete before adding products
   * - Prevents race condition where products are added then immediately cleared
   *
   * Error Handling:
   * - Catches errors from test data generation or product fetching
   * - Shows error toast with descriptive message
   * - Ensures loading state is reset even on error
   */
  const handleFillTestData = async (): Promise<void> => {
    setFilling(true)

    try {
      // Generate test data (async because it fetches lead ID from database)
      const testData = await generatePurchaseOrderFormTest(isEditMode ? currentVendorNumber : undefined)

      // Fetch 10 random products with quantity 10 each
      const productItems = await fetchRandomProducts(10, 10)

      // Fill form fields
      setValue('vendorNumber', testData.vendorNumber, { shouldValidate: true })
      setValue('expectedDeliveryDate', testData.expectedDeliveryDate, { shouldValidate: true })
      setValue('purchaseOrderStatus', testData.purchaseOrderStatus, { shouldValidate: true })
      setValue('priority', testData.priority, { shouldValidate: true })
      setValue('assignedLeadId', testData.assignedLeadId, { shouldValidate: true })
      setValue('termsConditionsHtml', testData.termsConditionsHtml, { shouldValidate: true })

      // Address fields
      setValue('address.streetAddress', testData.address.streetAddress, { shouldValidate: true })
      setValue('address.streetAddress2', testData.address.streetAddress2 ?? '', { shouldValidate: true })
      setValue('address.streetAddress3', testData.address.streetAddress3 ?? '', { shouldValidate: true })
      setValue('address.city', testData.address.city, { shouldValidate: true })
      setValue('address.state', testData.address.state, { shouldValidate: true })
      setValue('address.postalCode', testData.address.postalCode, { shouldValidate: true })
      setValue('address.country', testData.address.country, { shouldValidate: true })
      setValue('address.addressType', testData.address.addressType, { shouldValidate: true })
      setValue('address.nameOnAddress', testData.address.nameOnAddress ?? '', { shouldValidate: true })
      setValue('address.emailOnAddress', testData.address.emailOnAddress ?? '', { shouldValidate: true })
      setValue('address.phoneOnAddress', testData.address.phoneOnAddress ?? '', { shouldValidate: true })

      // Trigger state change callback for city dropdown update
      if (onStateChange && testData.address.state) {
        onStateChange(testData.address.state)
      }

      // Fee fields
      setValue('deliveryFee', testData.deliveryFee, { shouldValidate: true })
      setValue('serviceFee', testData.serviceFee, { shouldValidate: true })
      setValue('packagingFee', testData.packagingFee, { shouldValidate: true })
      setValue('discount', testData.discount, { shouldValidate: true })

      // Notes
      setValue('notes', testData.notes, { shouldValidate: true })

      // Attachments - 5 test images (same approach as products)
      const testAttachments = generateTestAttachments()
      setValue('attachments', testAttachments, { shouldValidate: true })

      // Wait for address change effects to complete before adding products
      // The parent component clears products when address changes, so we need to delay
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Product items - 10 random products with quantity 10 each
      // Type assertion needed: form schema expects availableStock: number (required),
      // but PurchaseOrderProductItemForm has it optional. Since pickupAllocations is [],
      // the type mismatch doesn't affect runtime behavior.
      setValue('productItems', productItems as any, { shouldValidate: true })
      // Also update parent's local state (cast to PurchaseOrderProductItem for API compatibility)
      if (onProductItemsChange) {
        onProductItemsChange(productItems as unknown as PurchaseOrderProductItem[])
      }

      toast.success(`Test data filled with ${productItems.length} products and ${Object.keys(testAttachments).length} attachments!`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate test data'
      toast.error(message)
    } finally {
      setFilling(false)
    }
  }

  return (
    <Tooltip title="Fill Test Data" placement="left">
      <Fab
        aria-label="fill test data"
        onClick={() => void handleFillTestData()}
        disabled={filling}
        className={styles['fill-test-data-button__fab']}
      >
        {filling ? <CircularProgress size={24} color="inherit" /> : <ScienceIcon />}
      </Fab>
    </Tooltip>
  )
}

export default FillTestDataButton
