import { useState } from 'react'

import { toast } from 'react-toastify'
import * as XLSX from 'xlsx'

import { Science as ScienceIcon } from '@mui/icons-material'
import { CircularProgress, Fab, Tooltip } from '@mui/material'

import { promoImportTemplateStructure } from '../../../models/bulk-import-models/ImportPromoGridModel'
import styles from '../../../styles/Promos.module.scss'
import { generatePromoImportTest } from '../../../utils/generateTestData'

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
 * FillImportTestDataButton Component for Promos
 *
 * A floating action button that generates and downloads an XLSX file
 * with test data for promo import testing.
 */
const FillImportTestDataButton = (_props: FillImportTestDataButtonProps): JSX.Element => {
  const [generating, setGenerating] = useState(false)

  const handleGenerateTestData = async (): Promise<void> => {
    setGenerating(true)

    try {
      // Generate 30 test promos with varied data using centralized utility
      const testPromos = generatePromoImportTest(30)

      // Create a new workbook
      const wb = XLSX.utils.book_new()

      // Build the header rows from template structure
      const categoryRow: string[] = []
      const fieldRow: string[] = []

      for (const section of promoImportTemplateStructure) {
        categoryRow.push(section.category)
        for (let i = 1; i < section.fields.length; i++) {
          categoryRow.push('')
        }
        fieldRow.push(...section.fields)
      }

      // Map test data to XLSX row format
      // Order must match template structure: promoCode, description, discountValue, isPercent, startDate, expiryDate, notes
      const dataRows: Array<Array<string | number | boolean>> = testPromos.map(promo => [
        promo.promoCode,
        promo.description,
        promo.discountValue,
        promo.isPercent ? 'TRUE' : 'FALSE',
        promo.startDate, // Required: YYYY-MM-DD format
        promo.expiryDate ?? '', // Optional: YYYY-MM-DD format
        promo.notes ?? '',
      ])

      // Combine headers and data
      const sheetData = [categoryRow, fieldRow, ...dataRows]

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(sheetData)

      // Define merge ranges for category headers
      const merges: XLSX.Range[] = []
      let colIndex = 0

      for (const section of promoImportTemplateStructure) {
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
        if (field === 'description' || field === 'notes') {
          return { wch: 40 } // Wide columns for text
        } else if (field === 'startDate' || field === 'expiryDate') {
          return { wch: 15 } // Medium width for dates
        } else if (field === 'promoCode') {
          return { wch: 18 } // Medium width for promo codes
        } else if (field === 'discountValue') {
          return { wch: 15 } // Medium width for numbers
        } else if (field === 'isPercent') {
          return { wch: 12 } // Narrow width for boolean
        }
        return { wch: 20 } // Default width
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
      XLSX.utils.book_append_sheet(wb, ws, 'Promos')

      // Generate Excel file and download with cell styles enabled
      XLSX.writeFile(wb, 'promo_import_test_data.xlsx', {
        cellStyles: true,
        bookType: 'xlsx',
      })

      // Brief visual feedback
      await new Promise(resolve => setTimeout(resolve, 500))
      setGenerating(false)
    } catch (error) {
      // Error handling: show toast and reset generating state
      const message = error instanceof Error ? error.message : 'Failed to generate test data'
      toast.error(message)
      setGenerating(false)
    }
  }

  return (
    <Tooltip title="Generate Test Data (30 promos)" placement="left">
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

