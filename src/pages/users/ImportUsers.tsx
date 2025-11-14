import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  GridOn as GridIcon,
  Code as JsonIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { toast } from 'react-toastify'
import { Header, Subheader } from '../../components'
import { APP_ROUTES } from '../../constants/routes'
import '../../styles/Users.scss'

/**
 * Interface for parsed user data from Excel/CSV
 */
interface ImportUserData {
  rowNumber: number
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  dob: string
  street1: string
  street2?: string
  city: string
  state: string
  zipCode: string
  country?: string
  permissionIds: number[]
  groupIds: number[]
  errors?: string[]
}

/**
 * JSON structure for bulk user import API
 */
interface BulkUserImportRequest {
  maxRecords: number
  users: Array<{
    firstName: string
    lastName: string
    email: string
    phone: string
    role: string
    dob: string
    address: {
      street1: string
      street2?: string
      city: string
      state: string
      zipCode: string
      country?: string
      isPrimary: boolean
    }
    permissionIds: number[]
    selectedGroupIds: number[]
  }>
}

/**
 * Import Users Page
 * Features:
 * - Download Excel template
 * - Upload Excel/CSV files
 * - Preview data in grid or JSON format
 * - Set max records limit
 * - Validate and submit bulk import
 */
const ImportUsers = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<ImportUserData[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'json'>('grid')
  const [maxRecords, setMaxRecords] = useState<number>(25)
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Download Excel template with sample data
   */
  const handleDownloadTemplate = () => {
    // Create template data
    const templateData = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        role: 'Manager',
        dob: '1990-01-15',
        street1: '123 Main St',
        street2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        permissionIds: '1,2,3',
        groupIds: '1,2',
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '0987654321',
        role: 'Employee',
        dob: '1992-05-20',
        street1: '456 Oak Ave',
        street2: '',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001',
        country: 'USA',
        permissionIds: '1,2',
        groupIds: '2',
      },
    ]

    // Convert to CSV
    const headers = Object.keys(templateData[0]).join(',')
    const rows = templateData.map((row) => Object.values(row).join(','))
    const csv = [headers, ...rows].join('\n')

    // Download
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'user_import_template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.success('Template downloaded successfully!')
  }

  /**
   * Handle file upload and parse CSV/Excel
   */
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFile = event.target.files?.[0]
      if (!uploadedFile) return

      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ]
      if (!validTypes.includes(uploadedFile.type) && 
          !uploadedFile.name.endsWith('.csv') && 
          !uploadedFile.name.endsWith('.xlsx')) {
        toast.error('Please upload a valid CSV or Excel file')
        return
      }

      setFile(uploadedFile)
      parseFile(uploadedFile)
    },
    []
  )

  /**
   * Parse CSV/Excel file
   */
  const parseFile = (file: File) => {
    setIsLoading(true)
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter((line) => line.trim())

        if (lines.length < 2) {
          toast.error('File is empty or invalid')
          setIsLoading(false)
          return
        }

        // Parse CSV
        const headers = lines[0].split(',').map((h) => h.trim())
        const parsedData: ImportUserData[] = []

        for (let i = 1; i < Math.min(lines.length, maxRecords + 1); i++) {
          const values = lines[i].split(',').map((v) => v.trim())
          const errors: string[] = []

          // Validate required fields
          if (!values[0]) errors.push('First name is required')
          if (!values[1]) errors.push('Last name is required')
          if (!values[2]) errors.push('Email is required')
          if (!values[3]) errors.push('Phone is required')
          if (!values[4]) errors.push('Role is required')

          // Parse permission and group IDs
          const permissionIds = values[12]
            ? values[12].split(';').map((id) => parseInt(id.trim()))
            : []
          const groupIds = values[13]
            ? values[13].split(';').map((id) => parseInt(id.trim()))
            : []

          parsedData.push({
            rowNumber: i,
            firstName: values[0] || '',
            lastName: values[1] || '',
            email: values[2] || '',
            phone: values[3] || '',
            role: values[4] || '',
            dob: values[5] || '',
            street1: values[6] || '',
            street2: values[7] || undefined,
            city: values[8] || '',
            state: values[9] || '',
            zipCode: values[10] || '',
            country: values[11] || 'USA',
            permissionIds,
            groupIds,
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
  const generateImportJSON = (): BulkUserImportRequest => {
    return {
      maxRecords,
      users: importData.map((user) => ({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        dob: user.dob,
        address: {
          street1: user.street1,
          street2: user.street2,
          city: user.city,
          state: user.state,
          zipCode: user.zipCode,
          country: user.country || 'USA',
          isPrimary: true,
        },
        permissionIds: user.permissionIds,
        selectedGroupIds: user.groupIds,
      })),
    }
  }

  /**
   * Submit bulk import to API
   */
  const handleSubmit = async () => {
    if (importData.length === 0) {
      toast.error('No data to import')
      return
    }

    // Check for errors
    const hasErrors = importData.some((user) => user.errors && user.errors.length > 0)
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
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      toast.success(`Successfully imported ${importData.length} users!`)
      
      // Navigate back to users grid
      setTimeout(() => {
        navigate(APP_ROUTES.DASHBOARD.USERS)
      }, 1500)
    } catch (error) {
      console.error('Import failed:', error)
      toast.error('Failed to import users')
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
      field: 'firstName',
      headerName: 'First Name',
      width: 130,
    },
    {
      field: 'lastName',
      headerName: 'Last Name',
      width: 130,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 220,
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 130,
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
    },
    {
      field: 'dob',
      headerName: 'DOB',
      width: 120,
    },
    {
      field: 'city',
      headerName: 'City',
      width: 130,
    },
    {
      field: 'state',
      headerName: 'State',
      width: 80,
    },
    {
      field: 'errors',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
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
      <Box className="import-users-page__container">
        <Header label="Import Users" variant="h3" gutterBottom />
        <Subheader label="Bulk import users from CSV or Excel files" />

        {/* Instructions */}
        <Paper className="import-users-page__instructions-paper">
          <Box className="import-users-page__instructions-header">
            <InfoIcon color="primary" />
            <Typography variant="h6" className="import-users-page__instructions-title">
              Import Instructions
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" paragraph>
            1. Download the template file to see the required format
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            2. Fill in your user data following the template structure
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            3. Upload the file and preview the data
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            4. Set the maximum number of records to import
          </Typography>
          <Typography variant="body2" color="text.secondary">
            5. Review and submit the import
          </Typography>
        </Paper>

        {/* Actions Bar */}
        <Box className="import-users-page__actions-bar">
          {/* Download Template */}
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
            className="import-users-page__action-button"
          >
            Download Template
          </Button>

          {/* Upload File */}
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadIcon />}
            disabled={isLoading}
            className="import-users-page__action-button"
          >
            Upload File
            <input
              type="file"
              hidden
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
            />
          </Button>

          {/* Max Records Dropdown */}
          <FormControl className="import-users-page__max-records-select">
            <InputLabel>Max Records</InputLabel>
            <Select
              value={maxRecords}
              label="Max Records"
              onChange={(e) => setMaxRecords(e.target.value as number)}
              disabled={isLoading}
            >
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={100}>100</MenuItem>
              <MenuItem value={200}>200</MenuItem>
              <MenuItem value={500}>500</MenuItem>
              <MenuItem value={1000}>1000</MenuItem>
            </Select>
          </FormControl>

          {/* View Toggle */}
          {importData.length > 0 && (
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && setViewMode(newMode)}
              className="import-users-page__view-toggle"
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
            className="import-users-page__file-alert"
            action={
              <IconButton
                size="small"
                onClick={handleClearFile}
                disabled={isLoading}
              >
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
          <Paper className="import-users-page__preview-paper">
            <Box className="import-users-page__preview-header">
              <Typography variant="h6">
                Data Preview ({importData.length} records)
              </Typography>
            </Box>

            {viewMode === 'grid' ? (
              <Box className="import-users-page__grid-container">
                <DataGrid
                  rows={importData}
                  columns={columns}
                  getRowId={(row) => row.rowNumber}
                  pageSizeOptions={[10, 25, 50, 100]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 25 } },
                  }}
                  disableRowSelectionOnClick
                  autoHeight
                  getRowClassName={(params) =>
                    params.row.errors && params.row.errors.length > 0
                      ? 'import-users-page__error-row'
                      : ''
                  }
                />
              </Box>
            ) : (
              <Box className="import-users-page__json-container">
                <pre className="import-users-page__json-pre">
                  {JSON.stringify(generateImportJSON(), null, 2)}
                </pre>
              </Box>
            )}

            {/* Submit Button */}
            <Box className="import-users-page__submit-container">
              <Button
                variant="outlined"
                onClick={() => navigate(APP_ROUTES.DASHBOARD.USERS)}
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
                className="import-users-page__submit-button"
              >
                {isLoading ? 'Importing...' : `Import ${importData.length} Users`}
              </Button>
            </Box>
          </Paper>
        )}

        {/* Empty State */}
        {!file && (
          <Paper className="import-users-page__empty-state">
            <UploadIcon className="import-users-page__empty-icon" />
            <Typography variant="h6" gutterBottom>
              No file uploaded
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Download the template, fill in your data, and upload the file to get started
            </Typography>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadIcon />}
            >
              Upload File
              <input
                type="file"
                hidden
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
              />
            </Button>
          </Paper>
        )}
      </Box>
    </Container>
  )
}

export default ImportUsers
