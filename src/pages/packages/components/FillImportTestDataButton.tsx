import { useState } from 'react'

import { toast } from 'react-toastify'
import * as XLSX from 'xlsx'

import { Science as ScienceIcon } from '@mui/icons-material'
import { CircularProgress, Fab, Tooltip } from '@mui/material'

import styles from '../../../styles/Packages.module.scss'
import { generatePackageFormTest, type PackagePickupLocationMappingRequestModel } from '../../../utils/generateTestData'

type StylableCell = XLSX.CellObject & { s?: Record<string, unknown> }

const applyCellStyle = (cell: XLSX.CellObject | string | undefined, style: Record<string, unknown>): void => {
  if (!cell || typeof cell === 'string') {
    return
  }

  const stylableCell = cell as StylableCell
  stylableCell.s = style
}

/**
 * Template structure for Package import Excel file
 * Must match the structure in ImportPackages.tsx
 */
const packageImportTemplateStructure = [
  {
    category: 'Package Information',
    fields: ['packageName', 'packageType', 'length', 'breadth', 'height', 'maxWeight', 'standardCapacity', 'pricePerUnit'],
  },
  {
    category: 'Stock',
    fields: ['pickupLocationQuantities'],
  },
  {
    category: 'Additional',
    fields: ['notes'],
  },
]

/**
 * Convert pickup location quantities Record to import string format
 * Format: locationId|qty|reorderLevel|maxStock;locationId|qty|reorderLevel|maxStock
 */
const formatPickupLocationQuantities = (
  pickupLocationQuantities: Record<string, PackagePickupLocationMappingRequestModel> | undefined,
): string => {
  if (!pickupLocationQuantities) return ''

  return Object.entries(pickupLocationQuantities)
    .map(([id, data]) => `${id}|${data.quantity}|${data.reorderLevel}|${data.maxStockLevel}`)
    .join(';')
}

// No props needed - data is generated independently
type FillImportTestDataButtonProps = Record<string, never>

/**
 * FillImportTestDataButton Component for Package Import
 *
 * A floating action button that generates and downloads an XLSX file
 * with test data for package import testing.
 * Uses the same generatePackageFormTest function that fills the AddEditPackage form.
 */
const FillImportTestDataButton = (_props: FillImportTestDataButtonProps): JSX.Element => {
  const [generating, setGenerating] = useState(false)

  const handleGenerateTestData = async (): Promise<void> => {
    setGenerating(true)

    try {
      // Generate 30 test packages with varied data using centralized utility
      const testPackages = await Promise.all(
        Array.from({ length: 30 }, () => generatePackageFormTest())
      )

      // Create a new workbook
      const wb = XLSX.utils.book_new()

      // Build the header rows
      const categoryRow: string[] = []
      const fieldRow: string[] = []

      for (const section of packageImportTemplateStructure) {
        categoryRow.push(section.category)
        for (let i = 1; i < section.fields.length; i++) {
          categoryRow.push('')
        }
        fieldRow.push(...section.fields)
      }

      // Map test data to XLSX row format (matches packageImportTemplateStructure order)
      const dataRows: Array<Array<string | number | boolean>> = testPackages.map((pkg) => {
        // Convert pickupLocationQuantities to import string format
        const pickupLocationStr = formatPickupLocationQuantities(pkg.pickupLocationQuantities)

        return [
          // Package Information
          pkg.packageName,
          pkg.packageType,
          pkg.length,
          pkg.breadth,
          pkg.height,
          pkg.maxWeight,
          pkg.standardCapacity,
          pkg.pricePerUnit,
          // Stock
          pickupLocationStr,
          // Additional
          pkg.notes || '',
        ]
      })

      // Combine headers and data
      const sheetData = [categoryRow, fieldRow, ...dataRows]

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(sheetData)

      // Define merge ranges for category headers
      const merges: XLSX.Range[] = []
      let colIndex = 0

      for (const section of packageImportTemplateStructure) {
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
        let width = 15
        if (field === 'packageName') {
          width = 35
        } else if (field === 'notes') {
          width = 45
        } else if (field === 'packageType') {
          width = 15
        } else if (field === 'pricePerUnit') {
          width = 15
        } else if (field === 'pickupLocationQuantities') {
          width = 50
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
      XLSX.utils.book_append_sheet(wb, ws, 'Packages')

      // Generate Excel file and download
      XLSX.writeFile(wb, 'package_import_test_data.xlsx', {
        cellStyles: true,
        bookType: 'xlsx',
      })

      toast.success('Test data file generated successfully! (30 packages)')

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
    <Tooltip title="Generate Test Data (30 packages with random data)" placement="left">
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

