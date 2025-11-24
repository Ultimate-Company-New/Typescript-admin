import { useState, useCallback } from 'react'

import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  GridOn as GridIcon,
  Code as JsonIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import {
  Container,
  Box,
  Button,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'

import { Header, Subheader } from '../../components'
import { APP_ROUTES } from '../../constants/routes'
import styles from './UserGroups.module.scss'

/**
 * Interface for parsed user group data from Excel/CSV
 */
interface ImportUserGroupData {
  rowNumber: number
  name: string
  description: string
  notes?: string
  userIds: number[]
  errors?: string[]
}

/**
 * JSON structure for bulk user group import API
 */
interface BulkUserGroupImportRequest {
  maxRecords: number
  userGroups: Array<{
    name: string
    description: string
    notes?: string
    userIds: number[]
  }>
}

/**
 * Import User Groups Page
 * Features:
 * - Download Excel template
 * - Upload Excel/CSV files
 * - Preview data in grid or JSON format
 * - Set max records limit
 * - Validate and submit bulk import
 */
const ImportUserGroups = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<ImportUserGroupData[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'json'>('grid')
  const [maxRecords, setMaxRecords] = useState<number>(25)
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Download Excel template with sample data
   */
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        name: 'Administrators',
        description: 'System administrators with full access',
        notes: 'This is a system group',
        userIds: '1,2,3',
      },
      {
        name: 'Managers',
        description: 'Department managers',
        notes: 'Management team',
        userIds: '4,5,6,7',
      },
      {
        name: 'Employees',
        description: 'Regular employees',
        notes: '',
        userIds: '8,9,10,11,12',
      },
    ]

    // Convert to CSV
    const headers = Object.keys(templateData[0]).join(',')
    const rows = templateData.map(row => Object.values(row).join(','))
    const csv = [headers, ...rows].join('\n')

    // Download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'user_group_import_template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.success('Template downloaded successfully!')
  }

  /**
   * Handle file upload and parse CSV/Excel
   */
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (!uploadedFile) return

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    if (
      !validTypes.includes(uploadedFile.type) &&
      !uploadedFile.name.endsWith('.csv') &&
      !uploadedFile.name.endsWith('.xlsx')
    ) {
      toast.error('Please upload a valid CSV or Excel file')
      return
    }

    setFile(uploadedFile)
    parseFile(uploadedFile)
  }, [])

  /**
   * Parse CSV/Excel file
   */
  const parseFile = (file: File) => {
    setIsLoading(true)
    const reader = new FileReader()

    reader.onload = e => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())

        if (lines.length < 2) {
          toast.error('File is empty or invalid')
          setIsLoading(false)
          return
        }

        // Parse CSV
        const headers = lines[0].split(',').map(h => h.trim())
        const parsedData: ImportUserGroupData[] = []

        for (let i = 1; i < Math.min(lines.length, maxRecords + 1); i++) {
          const values = lines[i].split(',').map(v => v.trim())
          const errors: string[] = []

          // Validate required fields
          if (!values[0]) errors.push('Name is required')
          if (!values[1]) errors.push('Description is required')

          // Parse user IDs
          const userIds = values[3] ? values[3].split(';').map(id => parseInt(id.trim())) : []

          if (userIds.length === 0) {
            errors.push('At least one user ID is required')
          }

          parsedData.push({
            rowNumber: i,
            name: values[0] || '',
            description: values[1] || '',
            notes: values[2] || undefined,
            userIds,
            errors: errors.length > 0 ? errors : undefined,
          })
        }

        setImportData(parsedData)
        toast.success(`Parsed ${parsedData.length} records successfully!`)
      } catch (error) {
        console.error('Error parsing file:', error)
        toast.error('Failed to parse file. Please check the format.')
      } finally {
        setIsLoading(false)
      }
    }

    reader.onerror = () => {
      toast.error('Failed to read file')
      setIsLoading(false)
    }

    reader.readAsText(file)
  }

  /**
   * Clear uploaded file and data
   */
  const handleClearFile = () => {
    setFile(null)
    setImportData([])
    toast.info('File cleared')
  }

  /**
   * Generate JSON structure for API
   */
  const generateImportJSON = (): BulkUserGroupImportRequest => ({
    maxRecords,
    userGroups: importData.map(group => ({
      name: group.name,
      description: group.description,
      notes: group.notes,
      userIds: group.userIds,
    })),
  })

  /**
   * Submit bulk import to API
   */
  const handleSubmit = async () => {
    if (importData.length === 0) {
      toast.error('No data to import')
      return
    }

    // Check for errors
    const hasErrors = importData.some(group => group.errors && group.errors.length > 0)
    if (hasErrors) {
      toast.error('Please fix validation errors before submitting')
      return
    }

    setIsLoading(true)
    try {
      const jsonData = generateImportJSON()

      // TODO: Call API endpoint
      console.log('JSON to be sent to API:', JSON.stringify(jsonData, null, 2))

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.success(`Successfully imported ${importData.length} user groups!`)

      // Navigate back to groups grid
      setTimeout(() => {
        navigate(APP_ROUTES.DASHBOARD.GROUPS)
      }, 1500)
    } catch (error) {
      console.error('Import failed:', error)
      toast.error('Failed to import user groups')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Grid columns for data preview
   */
  const columns: GridColDef[] = [
    {
      field: 'rowNumber',
      headerName: 'Row',
      width: 70,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'name',
      headerName: 'Group Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
      minWidth: 300,
    },
    {
      field: 'notes',
      headerName: 'Notes',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'userIds',
      headerName: 'User Count',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      valueGetter: value => (Array.isArray(value) ? value.length : 0),
    },
    {
      field: 'errors',
      headerName: 'Status',
      width: 120,
      renderCell: params => {
        if (params.row.errors && params.row.errors.length > 0) {
          return (
            <Tooltip title={params.row.errors.join(', ')}>
              <Chip label="Error" color="error" size="small" />
            </Tooltip>
          )
        }
        return <Chip label="Valid" color="success" size="small" />
      },
    },
  ]

  return (
    <Container maxWidth="xl">
      <Box className="import-user-groups-page__container">
        <Header label="Import User Groups" variant="h3" gutterBottom />
        <Subheader label="Bulk import user groups from CSV or Excel files" />

        {/* Instructions */}
        <Paper className="import-user-groups-page__instructions-paper">
          <Box className="import-user-groups-page__instructions-header">
            <InfoIcon color="primary" />
            <Typography variant="h6" className="import-user-groups-page__instructions-title">
              Import Instructions
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" paragraph>
            1. Download the template file to see the required format
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            2. Fill in your user group data following the template structure
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            3. User IDs should be comma-separated (e.g., 1,2,3,4)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            4. Upload the file and preview the data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            5. Review and submit the import
          </Typography>
        </Paper>

        {/* Actions Bar */}
        <Box className="import-user-groups-page__actions-bar">
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
            className="import-user-groups-page__action-button"
          >
            Download Template
          </Button>

          <Button
            variant="contained"
            component="label"
            startIcon={<UploadIcon />}
            disabled={isLoading}
            className="import-user-groups-page__action-button"
          >
            Upload File
            <input type="file" hidden accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
          </Button>

          <FormControl className="import-user-groups-page__max-records-select">
            <InputLabel>Max Records</InputLabel>
            <Select
              value={maxRecords}
              label="Max Records"
              onChange={e => {
                setMaxRecords(e.target.value as number)
              }}
              disabled={isLoading}
            >
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={100}>100</MenuItem>
              <MenuItem value={200}>200</MenuItem>
              <MenuItem value={500}>500</MenuItem>
              <MenuItem value={1000}>1000</MenuItem>
            </Select>
          </FormControl>

          {importData.length > 0 && (
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && setViewMode(newMode)}
              className="import-user-groups-page__view-toggle"
            >
              <ToggleButton value="grid">
                <GridIcon fontSize="small" />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  Grid
                </Typography>
              </ToggleButton>
              <ToggleButton value="json">
                <JsonIcon fontSize="small" />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  JSON
                </Typography>
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </Box>

        {/* File Info */}
        {file && (
          <Alert
            severity="info"
            className="import-user-groups-page__file-alert"
            action={
              <IconButton size="small" onClick={handleClearFile} disabled={isLoading}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            }
          >
            <Typography variant="body2">
              <strong>File:</strong> {file.name} ({importData.length} records)
            </Typography>
          </Alert>
        )}

        {/* Data Preview */}
        {importData.length > 0 && (
          <Paper className="import-user-groups-page__preview-paper">
            <Box className="import-user-groups-page__preview-header">
              <Typography variant="h6">Data Preview ({importData.length} records)</Typography>
            </Box>

            {viewMode === 'grid' ? (
              <Box className="import-user-groups-page__grid-container">
                <DataGrid
                  rows={importData}
                  columns={columns}
                  getRowId={row => row.rowNumber}
                  pageSizeOptions={[10, 25, 50, 100]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 25 } },
                  }}
                  disableRowSelectionOnClick
                  autoHeight
                  getRowClassName={params =>
                    params.row.errors && params.row.errors.length > 0 ? 'import-user-groups-page__error-row' : ''
                  }
                />
              </Box>
            ) : (
              <Box className="import-user-groups-page__json-container">
                <pre className="import-user-groups-page__json-pre">{JSON.stringify(generateImportJSON(), null, 2)}</pre>
              </Box>
            )}

            {/* Submit Button */}
            <Box className="import-user-groups-page__submit-container">
              <Button
                variant="outlined"
                onClick={() => {
                  navigate(APP_ROUTES.DASHBOARD.GROUPS)
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
                onClick={handleSubmit}
                disabled={isLoading}
                className="import-user-groups-page__submit-button"
              >
                {isLoading ? 'Importing...' : `Import ${importData.length} Groups`}
              </Button>
            </Box>
          </Paper>
        )}

        {/* Empty State */}
        {!file && (
          <Paper className="import-user-groups-page__empty-state">
            <UploadIcon className="import-user-groups-page__empty-icon" />
            <Typography variant="h6" gutterBottom>
              No file uploaded
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Download the template, fill in your data, and upload the file to get started
            </Typography>
            <Button variant="contained" component="label" startIcon={<UploadIcon />}>
              Upload File
              <input type="file" hidden accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
            </Button>
          </Paper>
        )}
      </Box>
    </Container>
  )
}

export default ImportUserGroups
