import { useState } from 'react'

import * as XLSX from 'xlsx'

import { Science as ScienceIcon } from '@mui/icons-material'
import { Fab, Tooltip } from '@mui/material'

import { userImportTemplateStructure } from '../../../models'
import styles from '../../../styles/Users.module.scss'
import { generateUserTest } from '../../../utils/generateTestData'

type StylableCell = XLSX.CellObject & { s?: Record<string, unknown> }

const applyCellStyle = (cell: XLSX.CellObject | string | undefined, style: Record<string, unknown>): void => {
  if (!cell || typeof cell === 'string') {
    return
  }

  const stylableCell = cell as StylableCell
  stylableCell.s = style
}

interface FillImportTestDataButtonProps {
  permissionIds: number[]
  userGroupIds: number[]
}

/**
 * FillImportTestDataButton Component
 *
 * A floating action button that generates and downloads an XLSX file
 * with test data for import testing.
 */
const FillImportTestDataButton = ({ permissionIds, userGroupIds }: FillImportTestDataButtonProps): JSX.Element => {
  const [generating, setGenerating] = useState(false)

  const handleGenerateTestData = (): void => {
    setGenerating(true)

    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new()

      // Build the header rows
      const categoryRow: string[] = []
      const fieldRow: string[] = []

      userImportTemplateStructure.forEach(section => {
        categoryRow.push(section.category)
        section.fields.slice(1).forEach(() => categoryRow.push(''))
        fieldRow.push(...section.fields)
      })

      // Convert permission IDs and group IDs to semicolon-separated strings
      const allPermissionIds = permissionIds.join(';')
      const groupIds = userGroupIds.join(';')

      // Generate test data using utility function
      const testUsers = generateUserTest(2)

      // Map test data to XLSX row format
      const dataRows: Array<Array<string | number | boolean>> = testUsers.map(user => [
        // Info section
        user.loginName ?? '', // loginName
        user.firstName ?? '', // firstName
        user.lastName ?? '', // lastName
        user.phone ?? '', // phone
        user.role ?? '', // role
        user.dob ?? '', // dob
        user.imageUrl ?? '', // imageUrl

        // Address section
        user.address?.streetAddress ?? '', // streetAddress
        user.address?.streetAddress2 ?? '', // streetAddress2
        user.address?.streetAddress3 ?? '', // streetAddress3
        user.address?.city ?? '', // city
        user.address?.state ?? '', // state
        user.address?.zipCode ?? user.address?.postalCode ?? '', // zipCode
        user.address?.country ?? '', // country
        user.address?.addressType ?? '', // addressType
        user.address?.nameOnAddress ?? '', // nameOnAddress
        user.address?.emailOnAddress ?? '', // emailOnAddress
        user.address?.phoneOnAddress ?? '', // phoneOnAddress

        // Other section
        allPermissionIds, // permissionIds
        groupIds, // selectedGroupIds
        user.notes ?? '', // notes
      ])

      // Combine headers and data
      const sheetData = [categoryRow, fieldRow, ...dataRows]

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(sheetData)

      // Define merge ranges for category headers
      const merges: XLSX.Range[] = []
      let colIndex = 0

      userImportTemplateStructure.forEach(section => {
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
      })

      ws['!merges'] = merges

      // Set column widths
      const colWidths = fieldRow.map(() => ({
        wch: 15,
      }))
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
      XLSX.utils.book_append_sheet(wb, ws, 'Users')

      // Generate Excel file and download with cell styles enabled
      XLSX.writeFile(wb, 'user_import_test_data.xlsx', {
        cellStyles: true,
        bookType: 'xlsx',
      })

      // Brief visual feedback
      setTimeout(() => {
        setGenerating(false)
      }, 500)
    } catch {
      // Error handling: reset generating state on any error
      setGenerating(false)
    }
  }

  return (
    <Tooltip title="Generate Test Data (2 rows)" placement="left">
      <span>
        <Fab
          aria-label="generate test data"
          onClick={handleGenerateTestData}
          disabled={generating}
          className={styles['fill-test-data-button__fab']}
        >
          <ScienceIcon />
        </Fab>
      </span>
    </Tooltip>
  )
}

export default FillImportTestDataButton
