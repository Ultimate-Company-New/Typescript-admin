import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Divider,
} from '@mui/material'
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material'
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid'
import { toast } from 'react-toastify'
import { Header, Subheader } from '../../components'
import { APP_ROUTES } from '../../constants/routes'
import '../../styles/UserGroups.scss'

// TODO: Import from your API
// import { userGroupApi } from '../../api/userGroupApi'

/**
 * Mock user data structure
 */
interface UserData {
  userId: number
  firstName: string
  lastName: string
  email: string
  role: string
  isDeleted: boolean
}

/**
 * Add/Edit User Group Page
 * Features:
 * - Create new user group
 * - Edit existing user group
 * - View user group details
 * - Select users to add to group
 * - Multi-select user grid
 */
const AddUserGroups = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userGroupId = searchParams.get('userGroupId')
  const isView = searchParams.get('isView') === 'true'
  const isEdit = !!userGroupId && !isView

  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<GridRowSelectionModel>([])
  const [users, setUsers] = useState<UserData[]>([])

  /**
   * Fetch user group details if editing
   */
  const fetchUserGroupDetails = useCallback(async (id: string) => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await userGroupApi.getUserGroupById(id)
      
      // Mock data
      const mockGroup = {
        userGroupId: parseInt(id),
        name: 'Administrators',
        description: 'System administrators with full access',
        notes: 'This is a system group',
        userIds: [1, 2, 3],
      }

      setName(mockGroup.name)
      setDescription(mockGroup.description)
      setNotes(mockGroup.notes || '')
      setSelectedUserIds(mockGroup.userIds)
    } catch (error) {
      console.error('Error fetching user group:', error)
      toast.error('Failed to fetch user group details')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Fetch all users for selection grid
   */
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await userApi.getAllUsers()

      // Mock data
      const mockUsers: UserData[] = [
        {
          userId: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          role: 'Admin',
          isDeleted: false,
        },
        {
          userId: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          role: 'Manager',
          isDeleted: false,
        },
        {
          userId: 3,
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob.johnson@example.com',
          role: 'Employee',
          isDeleted: false,
        },
        {
          userId: 4,
          firstName: 'Alice',
          lastName: 'Williams',
          email: 'alice.williams@example.com',
          role: 'Employee',
          isDeleted: false,
        },
        {
          userId: 5,
          firstName: 'Charlie',
          lastName: 'Brown',
          email: 'charlie.brown@example.com',
          role: 'Employee',
          isDeleted: false,
        },
      ]

      setUsers(mockUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      toast.error('Group name is required')
      return
    }

    if (!description.trim()) {
      toast.error('Description is required')
      return
    }

    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one user')
      return
    }

    setLoading(true)
    try {
      const requestData = {
        userGroupId: isEdit ? parseInt(userGroupId!) : undefined,
        name: name.trim(),
        description: description.trim(),
        notes: notes.trim(),
        userIds: selectedUserIds.map((id) => parseInt(id.toString())),
      }

      if (isEdit) {
        // TODO: Call update API
        // await userGroupApi.updateUserGroup(requestData)
        toast.success('User group updated successfully')
      } else {
        // TODO: Call create API
        // await userGroupApi.createUserGroup(requestData)
        toast.success('User group created successfully')
      }

      // Navigate back to groups page
      setTimeout(() => {
        navigate(APP_ROUTES.DASHBOARD.GROUPS)
      }, 1000)
    } catch (error) {
      console.error('Error saving user group:', error)
      toast.error('Failed to save user group')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    navigate(APP_ROUTES.DASHBOARD.GROUPS)
  }

  /**
   * User selection grid columns
   */
  const userColumns: GridColDef[] = [
    {
      field: 'userId',
      headerName: 'ID',
      width: 80,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'firstName',
      headerName: 'First Name',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'lastName',
      headerName: 'Last Name',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 2,
      minWidth: 250,
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
    },
  ]

  // Fetch data on mount
  useEffect(() => {
    fetchUsers()
    if (userGroupId) {
      fetchUserGroupDetails(userGroupId)
    }
  }, [userGroupId, fetchUsers, fetchUserGroupDetails])

  return (
    <Container maxWidth="xl">
      <Box className="add-user-groups-page__container">
        {/* Header */}
        <Header
          label={
            isView
              ? 'View User Group'
              : isEdit
              ? 'Edit User Group'
              : 'Add User Group'
          }
          variant="h3"
          gutterBottom
        />
        <Subheader
          label={
            isView
              ? 'View user group details and members'
              : 'Fill in the details to create or update a user group'
          }
        />

        {/* Group Details Section */}
        <Paper className="add-user-groups-page__section">
          <Typography variant="h6" className="add-user-groups-page__section-title">
            Group Details
          </Typography>
          <Divider className="add-user-groups-page__divider" />

          <Box className="add-user-groups-page__form">
            <TextField
              fullWidth
              label="Group Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isView || loading}
              required
              placeholder="Enter group name"
              className="add-user-groups-page__field"
            />

            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isView || loading}
              required
              multiline
              rows={3}
              placeholder="Enter group description"
              className="add-user-groups-page__field"
            />

            <TextField
              fullWidth
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isView || loading}
              multiline
              rows={3}
              placeholder="Additional notes (optional)"
              className="add-user-groups-page__field"
            />
          </Box>
        </Paper>

        {/* User Selection Section */}
        <Paper className="add-user-groups-page__section">
          <Typography variant="h6" className="add-user-groups-page__section-title">
            Select Users
          </Typography>
          <Divider className="add-user-groups-page__divider" />

          <Box className="add-user-groups-page__grid-container">
            <DataGrid
              rows={users}
              columns={userColumns}
              getRowId={(row) => row.userId}
              checkboxSelection
              disableRowSelectionOnClick
              rowSelectionModel={selectedUserIds}
              onRowSelectionModelChange={setSelectedUserIds}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              autoHeight
              loading={loading}
              sx={{
                '& .MuiDataGrid-row.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                },
              }}
            />
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            className="add-user-groups-page__selection-info"
          >
            {selectedUserIds.length} user(s) selected
          </Typography>
        </Paper>

        {/* Action Buttons */}
        {!isView && (
          <Box className="add-user-groups-page__actions">
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={loading}
              className="add-user-groups-page__action-button"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
              disabled={loading}
              className="add-user-groups-page__action-button"
            >
              {loading ? 'Saving...' : isEdit ? 'Update Group' : 'Create Group'}
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  )
}

export default AddUserGroups

