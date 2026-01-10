import { useState } from 'react'

import { toast } from 'react-toastify'
import * as XLSX from 'xlsx'

import { Science as ScienceIcon } from '@mui/icons-material'
import { CircularProgress, Fab, Tooltip } from '@mui/material'

import { leadApi } from '../../../api/leadApi'
import { productApi } from '../../../api/productApi'
import { purchaseOrderImportTemplateStructure } from '../../../models/bulk-import-models/ImportPurchaseOrderGridModel'
import styles from '../../../styles/PurchaseOrders.module.scss'
import { generatePurchaseOrderImportTest, type ProductWithStock } from '../../../utils/generateTestData'

type StylableCell = XLSX.CellObject & { s?: Record<string, unknown> }

const applyCellStyle = (cell: XLSX.CellObject | string | undefined, style: Record<string, unknown>): void => {
  if (!cell || typeof cell === 'string') {
    return
  }

  const stylableCell = cell as StylableCell
  stylableCell.s = style
}

// No props needed - generates test data directly
type FillImportTestDataButtonProps = Record<string, never>

/**
 * FillImportTestDataButton Component for Purchase Orders
 *
 * A floating action button that generates and downloads an XLSX file
 * with test data for purchase order import testing.
 *
 * Each purchase order includes 10 random products with quantities and prices.
 */
const FillImportTestDataButton = (_props: FillImportTestDataButtonProps): JSX.Element => {
  const [generating, setGenerating] = useState(false)

  const handleGenerateTestData = async (): Promise<void> => {
    setGenerating(true)

    try {
      // Fetch available products with their pickup location stock data
      const productResponse = await productApi.getProductsInBatches({
        start: 0,
        end: 100,
        pageSize: 100,
        includeDeleted: false,
      })

      const products = productResponse.data as Array<{
        productId: number
        price: number
        pickupLocations?: Array<{
          pickupLocation?: { pickupLocationId?: number }
          availableStock?: number
        }>
      }>

      if (!products || products.length === 0) {
        throw new Error('No products available in the database. Please add some products first.')
      }

      // Transform products for purchase order test data
      // For purchase orders (ordering FROM vendors), we don't require existing stock
      // Use a default quantity range for test data generation
      const productsWithStock: ProductWithStock[] = products.map(p => {
        return {
          productId: p.productId,
          totalAvailableStock: 100, // Default quantity available for ordering (purchase orders don't depend on current stock)
          price: p.price ?? 100, // Default price if not set
        }
      })

      // Fetch available lead IDs from the database
      const leadResponse = await leadApi.getLeadsInBatches({
        start: 0,
        end: 100,
        pageSize: 100,
        includeDeleted: false,
      })

      const leads = leadResponse.data as Array<{ leadId: number }>
      const leadIds = leads ? leads.map(l => l.leadId) : []

      // Generate 5 test purchase orders (DRAFT status, 2 products each, ~20-40k total for payment testing)
      const testPurchaseOrders = generatePurchaseOrderImportTest(5, productsWithStock, leadIds)

      // Create a new workbook
      const wb = XLSX.utils.book_new()

      // Build the header rows from template structure
      const categoryRow: string[] = []
      const fieldRow: string[] = []

      for (const section of purchaseOrderImportTemplateStructure) {
        categoryRow.push(section.category)
        for (let i = 1; i < section.fields.length; i++) {
          categoryRow.push('')
        }
        fieldRow.push(...section.fields)
      }

      // Map test data to XLSX row format
      // Order must match template structure
      const dataRows: Array<Array<string | number | boolean>> = testPurchaseOrders.map(po => [
        // Order Information
        po.vendorNumber,
        po.purchaseOrderStatus,
        po.priority,
        po.assignedLeadId,
        po.expectedDeliveryDate,
        po.termsConditionsHtml,
        // Delivery Address
        po.addressType,
        po.streetAddress,
        po.streetAddress2,
        po.city,
        po.state,
        po.postalCode,
        po.country,
        po.nameOnAddress,
        po.phoneOnAddress,
        po.emailOnAddress,
        // Products
        po.products,
        // Additional Fields
        po.notes,
        po.attachments,
      ])

      // Combine headers and data
      const sheetData = [categoryRow, fieldRow, ...dataRows]

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(sheetData)

      // Define merge ranges for category headers
      const merges: XLSX.Range[] = []
      let colIndex = 0

      for (const section of purchaseOrderImportTemplateStructure) {
        const startCol = colIndex
        const endCol = colIndex + section.fields.length - 1
        // Merge cells in first row for category header
        merges.push({
          s: {
            r: 0,
            c: startCol,
          },
          e: {
            r: 0,
            c: endCol,
          },
        })
        colIndex += section.fields.length
      }

      ws['!merges'] = merges

      // Set column widths based on field type
      const colWidths = fieldRow.map(field => {
        if (field === 'products') {
          return { wch: 80 } // Wide column for products string
        } else if (field === 'streetAddress' || field === 'notes' || field === 'termsConditionsHtml') {
          return { wch: 40 } // Wide columns for text
        } else if (field === 'expectedDeliveryDate') {
          return { wch: 18 } // Medium width for dates
        } else if (field === 'vendorNumber' || field === 'emailOnAddress') {
          return { wch: 25 } // Medium width
        } else if (field === 'city' || field === 'state' || field === 'country') {
          return { wch: 15 } // Standard width for location fields
        }
        return { wch: 18 } // Default width
      })
      ws['!cols'] = colWidths

      // Style the header rows
      const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
      for (let C = range.s.c; C <= range.e.c; ++C) {
        // Category row (row 0)
        const categoryCell = XLSX.utils.encode_cell({
          r: 0,
          c: C,
        })
        const categoryCellObject = ws[categoryCell] as XLSX.CellObject | string | undefined
        applyCellStyle(categoryCellObject, {
          font: {
            bold: true,
            sz: 12,
          },
          alignment: {
            horizontal: 'center',
            vertical: 'center',
          },
          fill: {
            fgColor: {
              rgb: 'D3D3D3',
            },
          },
        })

        // Field row (row 1)
        const fieldCell = XLSX.utils.encode_cell({
          r: 1,
          c: C,
        })
        const fieldCellObject = ws[fieldCell] as XLSX.CellObject | string | undefined
        applyCellStyle(fieldCellObject, {
          font: {
            bold: true,
          },
          alignment: {
            horizontal: 'center',
          },
          fill: {
            fgColor: {
              rgb: 'E8E8E8',
            },
          },
        })
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'PurchaseOrders')

      // Generate Excel file and download with cell styles enabled
      XLSX.writeFile(wb, 'purchase_order_import_test_data.xlsx', {
        cellStyles: true,
        bookType: 'xlsx',
      })

      // Brief visual feedback
      await new Promise(resolve => setTimeout(resolve, 500))
      setGenerating(false)
      toast.success(
        `Test data generated: ${testPurchaseOrders.length} DRAFT orders (2 products each, ₹20-40k range for payment testing)`
      )
    } catch (error) {
      // Error handling: show toast and reset generating state
      const message = error instanceof Error ? error.message : 'Failed to generate test data'
      toast.error(message)
      setGenerating(false)
    }
  }

  return (
    <Tooltip title="Generate Test Data (5 DRAFT orders, 2 products each, ~₹20-40k total for payment testing)" placement="left">
      <span>
        <Fab
          aria-label="generate test data"
          onClick={() => {
            void handleGenerateTestData()
          }}
          disabled={generating}
          className={styles['fill-test-data-button__fab']}
        >
          {generating ? <CircularProgress size={24} color="inherit" /> : <ScienceIcon />}
        </Fab>
      </span>
    </Tooltip>
  )
}

export default FillImportTestDataButton

