import { useState } from 'react'

import { toast } from 'react-toastify'
import * as XLSX from 'xlsx'

import { Science as ScienceIcon } from '@mui/icons-material'
import { CircularProgress, Fab, Tooltip } from '@mui/material'

import { packageApi } from '../../../api/packageApi'
import { productApi } from '../../../api/productApi'
import styles from '../../../styles/PickupLocations.module.scss'
import { generatePickupLocationFormTest } from '../../../utils/generateTestData'

type StylableCell = XLSX.CellObject & { s?: Record<string, unknown> }

const applyCellStyle = (cell: XLSX.CellObject | string | undefined, style: Record<string, unknown>): void => {
  if (!cell || typeof cell === 'string') {
    return
  }

  const stylableCell = cell as StylableCell
  stylableCell.s = style
}

// Template structure for pickup location import
const pickupLocationImportTemplateStructure = [
  {
    category: 'Location Information',
    fields: ['addressNickName'],
  },
  {
    category: 'Address Details',
    fields: [
      'streetAddress',
      'streetAddress2',
      'streetAddress3',
      'city',
      'state',
      'postalCode',
      'country',
      'addressType',
      'nameOnAddress',
      'emailOnAddress',
      'phoneOnAddress',
    ],
  },
  {
    category: 'Additional Fields',
    fields: ['notes'],
  },
  {
    category: 'Mappings',
    fields: ['productMappings', 'packageMappings'],
  },
]

// Helper to generate random quantity
const getRandomQuantity = (min = 10, max = 100): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

// No props needed - data is generated independently
type FillImportTestDataButtonProps = Record<string, never>

/**
 * FillImportTestDataButton Component for Pickup Location Import
 *
 * A floating action button that generates and downloads an XLSX file
 * with test data for pickup location import testing.
 * Generates 10 test pickup locations with varied data.
 */
const FillImportTestDataButton = (_props: FillImportTestDataButtonProps): JSX.Element => {
  const [generating, setGenerating] = useState(false)

  const handleGenerateTestData = async (): Promise<void> => {
    setGenerating(true)

    try {
      // Fetch 40 products and 40 packages to create mappings with real IDs
      const [productResponse, packageResponse] = await Promise.all([
        productApi.getProductsInBatches({
          start: 0,
          end: 40,
          pageSize: 40,
          includeDeleted: false,
        }),
        packageApi.getPackagesInBatches({
          start: 0,
          end: 40,
          pageSize: 40,
          includeDeleted: false,
        }),
      ])

      const products = (productResponse.data ?? []) as Array<{ productId?: number }>
      const packages = (packageResponse.data ?? []) as Array<{ packageId?: number }>

      // Filter out any products/packages without valid IDs
      const validProducts = products.filter(p => p.productId != null && p.productId > 0)
      const validPackages = packages.filter(p => p.packageId != null && p.packageId > 0)

      // Validate we have at least 40 products and 40 packages
      if (validProducts.length < 40 || validPackages.length < 40) {
        toast.error(
          `Insufficient test data! Need at least 40 products and 40 packages. ` +
          `Found: ${validProducts.length} products, ${validPackages.length} packages.`
        )
        setGenerating(false)
        return
      }

      // Generate 10 test pickup locations with varied data using centralized utility
      const testLocations = Array.from({ length: 10 }, () => generatePickupLocationFormTest())

      // Create a new workbook
      const wb = XLSX.utils.book_new()

      // Build the header rows
      const categoryRow: string[] = []
      const fieldRow: string[] = []

      for (const section of pickupLocationImportTemplateStructure) {
        categoryRow.push(section.category)
        for (let i = 1; i < section.fields.length; i++) {
          categoryRow.push('')
        }
        fieldRow.push(...section.fields)
      }

      // Map test data to XLSX row format (matches template structure order)
      const dataRows: Array<Array<string | number | boolean>> = testLocations.map((location) => {
        // Generate product mappings string with ALL 40 products (ID:Quantity,...)
        const productMappings = validProducts
          .map(p => `${p.productId}:${getRandomQuantity(50, 150)}`)
          .join(',')

        // Generate package mappings string with ALL 40 packages (ID:Qty:Reorder:MaxStock,...)
        const packageMappings = validPackages
          .map(p => {
            const qty = getRandomQuantity(80, 120)
            const reorder = getRandomQuantity(20, 50)
            const maxStock = getRandomQuantity(150, 250)
            return `${p.packageId}:${qty}:${reorder}:${maxStock}`
          })
          .join(',')

        return [
          // Location Information
          location.addressNickName,
          // Address Details
          location.address.streetAddress,
          location.address.streetAddress2 || '',
          location.address.streetAddress3 || '',
          location.address.city || '',
          location.address.state,
          location.address.postalCode,
          location.address.country,
          location.address.addressType,
          location.address.nameOnAddress || '',
          location.address.emailOnAddress || '',
          location.address.phoneOnAddress || '',
          // Additional Fields
          location.notes || '',
          // Mappings
          productMappings,
          packageMappings,
        ]
      })

      // Combine headers and data
      const sheetData = [categoryRow, fieldRow, ...dataRows]

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(sheetData)

      // Define merge ranges for category headers
      const merges: XLSX.Range[] = []
      let colIndex = 0

      for (const section of pickupLocationImportTemplateStructure) {
        const startCol = colIndex
        const endCol = colIndex + section.fields.length - 1
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

      // Set column widths based on content type
      const colWidths = fieldRow.map(field => {
        let width = 18
        if (field === 'streetAddress' || field === 'notes') {
          width = 35
        } else if (field === 'emailOnAddress') {
          width = 30
        } else if (field === 'addressNickName') {
          width = 25
        }
        return { wch: width }
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
            fgColor: { rgb: 'D3D3D3' },
          },
        })

        // Field row (row 1)
        const fieldCell = XLSX.utils.encode_cell({
          r: 1,
          c: C,
        })
        const fieldCellObject = ws[fieldCell] as XLSX.CellObject | string | undefined
        applyCellStyle(fieldCellObject, {
          font: { bold: true },
          alignment: { horizontal: 'center' },
          fill: {
            fgColor: { rgb: 'E8E8E8' },
          },
        })
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Pickup Locations')

      // Generate Excel file and download
      XLSX.writeFile(wb, 'pickup_location_import_test_data.xlsx', {
        cellStyles: true,
        bookType: 'xlsx',
      })

      toast.success(`Test data file generated! (10 locations with ${validProducts.length} products & ${validPackages.length} packages each)`)

      // Brief visual feedback
      setTimeout(() => {
        setGenerating(false)
      }, 500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate test data'
      toast.error(message)
      setGenerating(false)
    }
  }

  return (
    <Tooltip title="Generate Test Data (10 locations with 40 products & 40 packages each)" placement="left">
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
