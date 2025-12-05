import { useState } from 'react'

import { toast } from 'react-toastify'
import * as XLSX from 'xlsx'

import { Science as ScienceIcon } from '@mui/icons-material'
import { CircularProgress, Fab, Tooltip } from '@mui/material'

import { userApi } from '../../../api/userApi'
import styles from '../../../styles/Users.module.scss'
import { generateUserGroupImportTest } from '../../../utils/generateTestData'

type StylableCell = XLSX.CellObject & { s?: Record<string, unknown> }

const applyCellStyle = (cell: XLSX.CellObject | string | undefined, style: Record<string, unknown>): void => {
  if (!cell || typeof cell === 'string') {
    return
  }

  const stylableCell = cell as StylableCell
  stylableCell.s = style
}

// No props needed anymore - we fetch users directly
type FillImportTestDataButtonProps = Record<string, never>

/**
 * FillImportTestDataButton Component
 *
 * A floating action button that generates and downloads an XLSX file
 * with test data for user group import testing.
 * Fetches actual user IDs from the API and randomly assigns 20-30 users per group.
 */
const FillImportTestDataButton = (_props: FillImportTestDataButtonProps): JSX.Element => {
  const [generating, setGenerating] = useState(false)

  const handleGenerateTestData = async (): Promise<void> => {
    setGenerating(true)

    try {
      // Fetch users from API (first 100)
      const response = await userApi.fetchUsersInCarrierInBatches({
        start: 0,
        end: 100,
        pageSize: 100,
        includeDeleted: false,
      })

      // Extract user IDs from response (filter out 0 which represents invalid/new users)
      const allUserIds = response.data.map(user => user.userId).filter(id => id !== 0)

      if (allUserIds.length === 0) {
        toast.error('No users found. Please create some users first.')
        setGenerating(false)
        return
      }
      // Generate 30 test groups with varied data using centralized utility
      const testUserGroups = generateUserGroupImportTest(30, allUserIds, 20, 30)

      // Create a new workbook
      const wb = XLSX.utils.book_new()

      // Template structure for user groups
      const templateStructure = [
        {
          category: 'Group Information',
          fields: ['name', 'description', 'notes'],
        },
        {
          category: 'Members',
          fields: ['userIds'],
        },
      ]

      // Build the header rows
      const categoryRow: string[] = []
      const fieldRow: string[] = []

      templateStructure.forEach(section => {
        categoryRow.push(section.category)
        section.fields.slice(1).forEach(() => categoryRow.push(''))
        fieldRow.push(...section.fields)
      })

      // Map test data to XLSX row format
      const dataRows: Array<Array<string | number>> = testUserGroups.map(group => [
        group.groupName, // name
        group.description, // description
        group.notes ?? '', // notes
        group.userIds.join(','), // userIds (comma-separated)
      ])

      // Combine headers and data
      const sheetData = [categoryRow, fieldRow, ...dataRows]

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(sheetData)

      // Define merge ranges for category headers
      const merges: XLSX.Range[] = []
      let colIndex = 0

      templateStructure.forEach(section => {
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
      const colWidths = fieldRow.map((_, idx) => ({
        wch: idx === 3 ? 30 : 25, // Make userIds column wider
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
      XLSX.utils.book_append_sheet(wb, ws, 'UserGroups')

      // Generate Excel file and download with cell styles enabled
      XLSX.writeFile(wb, 'user_group_import_test_data.xlsx', {
        cellStyles: true,
        bookType: 'xlsx',
      })

      // Brief visual feedback
      setTimeout(() => {
        setGenerating(false)
      }, 500)
    } catch (error) {
      // Error handling: show toast and reset generating state
      const message = error instanceof Error ? error.message : 'Failed to generate test data'
      toast.error(message)
      setGenerating(false)
    }
  }

  return (
    <Tooltip title="Generate Test Data (30 rows with 20-30 random users each)" placement="left">
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
