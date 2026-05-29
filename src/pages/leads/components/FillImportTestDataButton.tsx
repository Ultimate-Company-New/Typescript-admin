import { useState } from 'react'

import { toast } from 'react-toastify'
import * as XLSX from 'xlsx'

import { Science as ScienceIcon } from '@mui/icons-material'
import { CircularProgress, Fab, Tooltip } from '@mui/material'

import { userApi } from '../../../api/userApi'
import { leadImportTemplateStructure } from '../../../models/bulk-import-models/ImportLeadGridModel'
import styles from '../../../styles/Leads.module.scss'
import { generateLeadImportTest } from '../../../utils/generateTestData'

type StylableCell = XLSX.CellObject & { s?: Record<string, unknown> }

const applyCellStyle = (cell: XLSX.CellObject | string | undefined, style: Record<string, unknown>): void => {
  if (!cell || typeof cell === 'string') {
    return
  }

  const stylableCell = cell as StylableCell
  stylableCell.s = style
}

// No props needed - we fetch users directly
type FillImportTestDataButtonProps = Record<string, never>

/**
 * FillImportTestDataButton Component for Lead Import
 *
 * A floating action button that generates and downloads an XLSX file
 * with test data for lead import testing.
 * Fetches actual user IDs from the API to use as assigned agents.
 */
const FillImportTestDataButton = (_props: FillImportTestDataButtonProps): JSX.Element => {
  const [generating, setGenerating] = useState(false)

  const handleGenerateTestData = async (): Promise<void> => {
    setGenerating(true)

    try {
      // Fetch users from API (first 50 for agent assignment)
      const response = await userApi.fetchUsersInCarrierInBatches({
        start: 0,
        end: 50,
        pageSize: 50,
        includeDeleted: false,
      })

      // Extract user IDs from response
      const allUserIds = response.data.map(user => user.userId).filter(id => id !== 0)

      if (allUserIds.length === 0) {
        toast.error('No users found. Please create some users first.')
        setGenerating(false)
        return
      }

      // Generate 30 test leads with varied data using centralized utility
      const testLeads = generateLeadImportTest(30)

      // Create a new workbook
      const wb = XLSX.utils.book_new()

      // Build the header rows
      const categoryRow: string[] = []
      const fieldRow: string[] = []

      for (const section of leadImportTemplateStructure) {
        categoryRow.push(section.category)
        for (let i = 1; i < section.fields.length; i++) {
          categoryRow.push('')
        }
        fieldRow.push(...section.fields)
      }

      // Map test data to XLSX row format (matches leadImportTemplateStructure order)
      const dataRows: Array<Array<string | number>> = testLeads.map((lead, index) => {
        // Randomly assign an agent from available users
        const randomAgentId = allUserIds[Math.floor(Math.random() * allUserIds.length)]

        const address = lead.address ?? {}
        return [
          // Lead Details
          lead.firstName ?? '',
          lead.lastName ?? '',
          lead.email ?? '',
          lead.phone ?? '',
          lead.leadStatus ?? '',
          lead.title ?? '',
          randomAgentId,
          // Company Details
          lead.company ?? '',
          lead.companySize ?? '',
          lead.annualRevenue ?? '',
          lead.website ?? '',
          lead.fax ?? '',
          // Address
          address.streetAddress ?? '',
          address.streetAddress2 ?? '',
          address.streetAddress3 ?? '',
          address.city ?? '',
          address.state ?? '',
          address.postalCode ?? '',
          address.country ?? '',
          address.addressType ?? '',
          // Notes
          lead.notes || `Test lead ${index + 1} generated for import testing`,
        ]
      })

      // Combine headers and data
      const sheetData = [categoryRow, fieldRow, ...dataRows]

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(sheetData)

      // Define merge ranges for category headers
      const merges: XLSX.Range[] = []
      let colIndex = 0

      for (const section of leadImportTemplateStructure) {
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

      // Set column widths
      const colWidths = fieldRow.map(field => {
        let width = 18
        if (field === 'email' || field === 'website') {
          width = 30
        } else if (field === 'notes') {
          width = 40
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
      XLSX.utils.book_append_sheet(wb, ws, 'Leads')

      // Generate Excel file and download
      XLSX.writeFile(wb, 'lead_import_test_data.xlsx', {
        cellStyles: true,
        bookType: 'xlsx',
      })

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
    <Tooltip title="Generate Test Data (30 leads with random agents)" placement="left">
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
