import { useState } from 'react'

import { toast } from 'react-toastify'
import * as XLSX from 'xlsx'

import { Science as ScienceIcon } from '@mui/icons-material'
import { CircularProgress, Fab, Tooltip } from '@mui/material'

import { productImportTemplateStructure } from '../../../models/bulk-import-models/ImportProductGridModel'
import styles from '../../../styles/Products.module.scss'
import { generateProductFormTest } from '../../../utils/generateTestData'

type StylableCell = XLSX.CellObject & { s?: Record<string, unknown> }

const applyCellStyle = (cell: XLSX.CellObject | string | undefined, style: Record<string, unknown>): void => {
  if (!cell || typeof cell === 'string') {
    return
  }

  const stylableCell = cell as StylableCell
  stylableCell.s = style
}

// No props needed - data is generated independently
type FillImportTestDataButtonProps = Record<string, never>

/**
 * FillImportTestDataButton Component for Product Import
 *
 * A floating action button that generates and downloads an XLSX file
 * with test data for product import testing.
 * Fetches real category IDs and pickup locations from the API.
 */
const FillImportTestDataButton = (_props: FillImportTestDataButtonProps): JSX.Element => {
  const [generating, setGenerating] = useState(false)

  const handleGenerateTestData = async (): Promise<void> => {
    setGenerating(true)

    try {
      // Generate 2 test products with varied data using centralized utility
      const testProducts = await Promise.all(
        Array.from({ length: 2 }, (_, index) => generateProductFormTest(index))
      )

      // Create a new workbook
      const wb = XLSX.utils.book_new()

      // Build the header rows
      const categoryRow: string[] = []
      const fieldRow: string[] = []

      for (const section of productImportTemplateStructure) {
        categoryRow.push(section.category)
        for (let i = 1; i < section.fields.length; i++) {
          categoryRow.push('')
        }
        fieldRow.push(...section.fields)
      }

      // Map test data to XLSX row format (matches productImportTemplateStructure order)
      const dataRows: Array<Array<string | number | boolean>> = testProducts.map((product) => {
        // Convert pickupLocationQuantities from Record<string, number> to "id:qty,id:qty" format
        const pickupLocationStr = Object.entries(product.pickupLocationQuantities || {})
          .map(([id, qty]) => `${id}:${qty}`)
          .join(',')

        // Format itemAvailableFrom as ISO string
        const availableFromStr = product.itemAvailableFrom?.dateTime instanceof Date
          ? product.itemAvailableFrom.dateTime.toISOString()
          : ''

        return [
          // Product Information (includes description, modification fields now)
          product.title,
          product.brand,
          product.model || '',
          product.condition,
          product.color,
          product.colorLabel,
          product.countryOfManufacture,
          product.categoryId,
          product.upc || '',
          product.descriptionHtml || '',
          product.itemModified,
          product.modificationHtml || '',
          // Pricing
          product.price,
          product.discount,
          product.isDiscountPercent,
          product.returnWindowDays,
          // Dimensions
          product.length || '',
          product.breadth || '',
          product.height || '',
          product.weightKgs || '',
          // Availability
          availableFromStr,
          product.itemAvailableFrom?.timezone || 'Asia/Kolkata',
          // Stock
          pickupLocationStr,
          // Required Images (URLs)
          product.mainImage || '',
          product.topImage || '',
          product.bottomImage || '',
          product.frontImage || '',
          product.backImage || '',
          product.rightImage || '',
          product.leftImage || '',
          product.detailsImage || '',
          // Optional Images (URLs)
          product.defectImage || '',
          product.additionalImage1 || '',
          product.additionalImage2 || '',
          product.additionalImage3 || '',
          // Additional Fields
          product.notes || '',
        ]
      })

      // Combine headers and data
      const sheetData = [categoryRow, fieldRow, ...dataRows]

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(sheetData)

      // Define merge ranges for category headers
      const merges: XLSX.Range[] = []
      let colIndex = 0

      for (const section of productImportTemplateStructure) {
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
        if (field.includes('Image') || field === 'descriptionHtml' || field === 'modificationHtml') {
          width = 50
        } else if (field === 'title' || field === 'notes') {
          width = 35
        } else if (field === 'pickupLocationQuantities') {
          width = 30
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
      XLSX.utils.book_append_sheet(wb, ws, 'Products')

      // Generate Excel file and download
      XLSX.writeFile(wb, 'product_import_test_data.xlsx', {
        cellStyles: true,
        bookType: 'xlsx',
      })

      toast.success('Test data file generated successfully!')

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
    <Tooltip title="Generate Test Data (2 products with random categories)" placement="left">
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

