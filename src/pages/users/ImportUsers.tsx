import type React from 'react'
import { useCallback, useState } from 'react'

import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Download as DownloadIcon, GridOn as GridIcon, Code as JsonIcon, Send as SendIcon } from '@mui/icons-material'
import {
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'

import { ImportInstructions } from '../../components'
import { BlueButton, RedButton } from '../../components/buttons'
import { BodyText } from '../../components/fonts'
import { ExcelUploadInput } from '../../components/form-input'
import { APP_ROUTES } from '../../constants/routes'
import styles from '../../styles/Users.module.scss'

/**
 * Interface for parsed user data from Excel/CSV
 * Matches UserRequestModel structure from Spring API
 */
interface ImportUserData {
  rowNumber: number
  // User Info
  loginName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  dob: string
  isGuest: boolean
  locked: boolean
  emailConfirmed: boolean
  isDeleted: boolean
  apiKey?: string
  profilePictureBase64?: string
  notes?: string
  // Address Info
  streetAddress: string
  streetAddress2?: string
  city: string
  state: string
  zipCode: string
  country?: string
  isPrimary: boolean
  // Other
  permissionIds: number[]
  selectedGroupIds: number[]
  selectedUserIds: number[]
  errors?: string[]
}

/**
 * JSON structure for bulk user import API
 * Matches UserRequestModel from Spring API
 */
interface BulkUserImportRequest {
  maxRecords: number
  users: Array<{
    loginName: string
    firstName: string
    lastName: string
    email: string
    phone: string
    role: string
    dob: string
    isGuest: boolean
    locked: boolean
    emailConfirmed: boolean
    isDeleted: boolean
    apiKey?: string
    profilePictureBase64?: string
    notes?: string
    address: {
      streetAddress: string
      streetAddress2?: string
      city: string
      state: string
      zipCode: string
      country?: string
      isPrimary: boolean
    }
    permissionIds: number[]
    selectedGroupIds: number[]
    selectedUserIds: number[]
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
const ImportUsers = (): React.JSX.Element => {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<ImportUserData[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'json'>('grid')
  const [maxRecords, setMaxRecords] = useState<number>(25)
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Download Excel template with sample data
   * Template structure matches UserRequestModel columns:
   * - User Info: loginName, firstName, lastName, email, phone, role, dob, isGuest, locked, emailConfirmed, isDeleted, apiKey, profilePictureBase64, notes
   * - Address Info: streetAddress, streetAddress2, city, state, zipCode, country, isPrimary
   * - Other: permissionIds, selectedGroupIds, selectedUserIds
   */
  const handleDownloadTemplate = (): void => {
    // Define headers in logical groups matching UserRequestModel
    const headers = [
      // User Info columns
      'loginName',
      'firstName',
      'lastName',
      'email',
      'phone',
      'role',
      'dob',
      'isGuest',
      'locked',
      'emailConfirmed',
      'isDeleted',
      'apiKey',
      'profilePictureBase64',
      'notes',
      // Address columns
      'streetAddress',
      'streetAddress2',
      'city',
      'state',
      'zipCode',
      'country',
      'isPrimary',
      // Other columns
      'permissionIds',
      'selectedGroupIds',
      'selectedUserIds',
    ]

    // Create sample data rows
    const sampleRows = [
      [
        // User Info
        'john.doe@example.com',
        'John',
        'Doe',
        'john.doe@example.com',
        '1234567890',
        'Manager',
        '1990-01-15',
        'false',
        'false',
        'true',
        'false',
        '',
        '',
        'Sample user for testing',
        // Address
        '123 Main St',
        'Apt 4B',
        'New York',
        'NY',
        '10001',
        'USA',
        'true',
        // Other
        '1;2;3',
        '1;2',
        '',
      ],
      [
        // User Info
        'jane.smith@example.com',
        'Jane',
        'Smith',
        'jane.smith@example.com',
        '0987654321',
        'Employee',
        '1992-05-20',
        'false',
        'false',
        'true',
        'false',
        '',
        '',
        'Another sample user',
        // Address
        '456 Oak Ave',
        '',
        'Los Angeles',
        'CA',
        '90001',
        'USA',
        'true',
        // Other
        '1;2',
        '2',
        '',
      ],
    ]

    // Convert to CSV
    const csvContent = [headers.join(','), ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
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
   * Helper function to parse boolean values
   */
  const parseBoolean = (val: string): boolean => val.toLowerCase() === 'true'

  /**
   * Helper function to parse semicolon-separated IDs
   */
  const parseIds = (val: string): number[] => {
    if (!val) return []
    return val
      .split(';')
      .map(id => parseInt(id.trim()))
      .filter(id => !isNaN(id))
  }

  /**
   * Parse CSV/Excel file
   */
  const parseFile = useCallback(
    (file: File): void => {
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
          const parsedData: ImportUserData[] = []

          for (let i = 1; i < Math.min(lines.length, maxRecords + 1); i++) {
            // Handle quoted CSV values
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
            const errors: string[] = []

            // Validate required fields (User Info)
            if (!values[0]) errors.push('Login name is required')
            if (!values[1]) errors.push('First name is required')
            if (!values[2]) errors.push('Last name is required')
            if (!values[3]) errors.push('Email is required')
            if (!values[4]) errors.push('Phone is required')
            if (!values[5]) errors.push('Role is required')

            parsedData.push({
              rowNumber: i,
              // User Info (indices 0-13)
              loginName: values[0] || '',
              firstName: values[1] || '',
              lastName: values[2] || '',
              email: values[3] || '',
              phone: values[4] || '',
              role: values[5] || '',
              dob: values[6] || '',
              isGuest: parseBoolean(values[7]),
              locked: parseBoolean(values[8]),
              emailConfirmed: parseBoolean(values[9]),
              isDeleted: parseBoolean(values[10]),
              apiKey: values[11] || undefined,
              profilePictureBase64: values[12] || undefined,
              notes: values[13] || undefined,
              // Address Info (indices 14-20)
              streetAddress: values[14] || '',
              streetAddress2: values[15] || undefined,
              city: values[16] || '',
              state: values[17] || '',
              zipCode: values[18] || '',
              country: values[19] || 'USA',
              isPrimary: parseBoolean(values[20]),
              // Other (indices 21-23)
              permissionIds: parseIds(values[21]),
              selectedGroupIds: parseIds(values[22]),
              selectedUserIds: parseIds(values[23]),
              errors: errors.length > 0 ? errors : undefined,
            })
          }

          setImportData(parsedData)
          toast.success(`Parsed ${parsedData.length} records successfully!`)
        } catch {
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
    },
    [maxRecords],
  )

  /**
   * Handle file upload and parse CSV/Excel
   */
  const handleFileUpload = useCallback(
    (uploadedFile: File) => {
      setFile(uploadedFile)
      parseFile(uploadedFile)
    },
    [parseFile],
  )

  /**
   * Clear uploaded file and data
   */
  const handleClearFile = (): void => {
    setFile(null)
    setImportData([])
    toast.info('File cleared')
  }

  /**
   * Generate JSON structure for API
   */
  const generateImportJSON = (): BulkUserImportRequest => ({
    maxRecords,
    users: importData.map(user => ({
      loginName: user.loginName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      dob: user.dob,
      isGuest: user.isGuest,
      locked: user.locked,
      emailConfirmed: user.emailConfirmed,
      isDeleted: user.isDeleted,
      apiKey: user.apiKey,
      profilePictureBase64: user.profilePictureBase64,
      notes: user.notes,
      address: {
        streetAddress: user.streetAddress,
        streetAddress2: user.streetAddress2,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        country: user.country ?? 'USA',
        isPrimary: user.isPrimary,
      },
      permissionIds: user.permissionIds,
      selectedGroupIds: user.selectedGroupIds,
      selectedUserIds: user.selectedUserIds,
    })),
  })

  /**
   * Submit bulk import to API
   */
  const handleSubmit = async (): Promise<void> => {
    if (importData.length === 0) {
      toast.error('No data to import')
      return
    }

    // Check for errors
    const hasErrors = importData.some(user => user.errors && user.errors.length > 0)
    if (hasErrors) {
      toast.error('Please fix validation errors before submitting')
      return
    }

    setIsLoading(true)
    try {
      // TODO: Call API endpoint with generateImportJSON()

      // Simulate API call
      await new Promise<void>(resolve => {
        setTimeout(() => {
          resolve()
        }, 1000)
      })

      toast.success(`Successfully imported ${importData.length} users!`)

      // Navigate back to users grid
      setTimeout(() => {
        navigate(APP_ROUTES.DASHBOARD.USERS)
      }, 1500)
    } catch {
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
      field: 'loginName',
      headerName: 'Login Name',
      width: 200,
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
      field: 'locked',
      headerName: 'Locked',
      width: 90,
      renderCell: params => {
        const row = params.row as ImportUserData
        return <Chip label={row.locked ? 'Yes' : 'No'} color={row.locked ? 'error' : 'success'} size="small" />
      },
    },
    {
      field: 'errors',
      headerName: 'Status',
      width: 120,
      renderCell: params => {
        const row = params.row as ImportUserData
        if (row.errors && row.errors.length > 0) {
          return (
            <Tooltip title={row.errors.join(', ')}>
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
      <Box className={styles['import-users-page__container']}>
        {/* Instructions */}
        <ImportInstructions
          instructions={[
            'Download the template file to see the required format',
            'Fill in your user data following the template structure',
            'Upload the file and preview the data',
            'Set the maximum number of records to import',
            'Review and submit the import',
          ]}
        />

        {/* Actions Bar */}
        <Box className={styles['import-users-page__actions-bar']}>
          {/* Download Template */}
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
            className={styles['import-users-page__action-button']}
          >
            Download Template
          </Button>

          {/* Max Records Dropdown */}
          <FormControl className={styles['import-users-page__max-records-select']}>
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

          {/* View Toggle */}
          {importData.length > 0 && (
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode: 'grid' | 'json' | null) => {
                if (newMode) {
                  setViewMode(newMode)
                }
              }}
              className={styles['import-users-page__view-toggle']}
            >
              <ToggleButton value="grid">
                <GridIcon fontSize="small" />
                <BodyText text="Grid" variant="body2" sx={{ ml: 1 }} />
              </ToggleButton>
              <ToggleButton value="json">
                <JsonIcon fontSize="small" />
                <BodyText text="JSON" variant="body2" sx={{ ml: 1 }} />
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </Box>

        {/* Excel Upload Component */}
        <ExcelUploadInput
          onFileSelect={handleFileUpload}
          onFileClear={handleClearFile}
          currentFile={file}
          disabled={isLoading}
          showFileInfo
          accept=".csv,.xlsx,.xls"
          maxSizeMB={10}
        />

        {/* Data Preview */}
        {importData.length > 0 && (
          <Paper className={styles['import-users-page__preview-paper']}>
            <Box className={styles['import-users-page__preview-header']}>
              <BodyText
                text={`Data Preview (${importData.length} records)`}
                variant="body1"
                sx={{
                  fontWeight: 600,
                  fontSize: '1.25rem',
                }}
              />
            </Box>

            {viewMode === 'grid' ? (
              <Box className={styles['import-users-page__grid-container']}>
                <DataGrid
                  rows={importData}
                  columns={columns}
                  getRowId={(row: ImportUserData) => row.rowNumber}
                  pageSizeOptions={[10, 25, 50, 100]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 25 } },
                  }}
                  disableRowSelectionOnClick
                  autoHeight
                  getRowClassName={params => {
                    const { row } = params
                    return row.errors && row.errors.length > 0 ? styles['import-users-page__error-row'] : ''
                  }}
                />
              </Box>
            ) : (
              <Box className={styles['import-users-page__json-container']}>
                <pre className={styles['import-users-page__json-pre']}>
                  {JSON.stringify(generateImportJSON(), null, 2)}
                </pre>
              </Box>
            )}

            {/* Submit Buttons */}
            <Box className={styles['import-users-page__submit-container']}>
              <RedButton
                onClick={() => {
                  navigate(APP_ROUTES.DASHBOARD.USERS)
                }}
                disabled={isLoading}
                label="Cancel"
              />
              <BlueButton
                startIcon={<SendIcon />}
                onClick={handleSubmit}
                disabled={isLoading}
                label={isLoading ? 'Importing...' : `Import ${importData.length} Users`}
              />
            </Box>
          </Paper>
        )}
      </Box>
    </Container>
  )
}

export default ImportUsers
