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
  Grid,
  MenuItem,
  Avatar,
  IconButton,
} from '@mui/material'
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { GridRowId, GridRowSelectionModel } from '@mui/x-data-grid'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { toast } from 'react-toastify'
import { AddressForm, AddressFormData, UserPermissions, Permission, StyledDataGrid } from '../../components'
import { APP_ROUTES } from '../../constants/routes'
import { userApi } from '../../api/userApi'
import { UserResponseModel, UserRequestModel } from '../../models/UserModels'
import '../../styles/Users.scss'

/**
 * Form field configuration for repeated text fields
 */
interface FormField {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  multiline?: boolean
  rows?: number
  type?: string
  gridSize?: { xs: number; md: number }
}

/**
 * Add/Edit User Page
 * Features:
 * - Create new user
 * - Edit existing user
 * - View user details (read-only)
 * - Personal information section
 * - Address details section
 * - User permissions section
 * - User groups section with selection grid
 * - User logs section (edit/view mode only)
 * - Profile picture upload
 */
const AddEditUsers = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('userId')
  const isView = searchParams.has('isView')
  const isEdit = !!userId && !isView

  const [loading, setLoading] = useState(false)

  // Personal Information
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState<Date | null>(null)
  const [role, setRole] = useState('')
  const [profilePictureBase64, setProfilePictureBase64] = useState('')

  // Address Details
  const [address, setAddress] = useState<AddressFormData>({
    street1: '',
    street2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
  })

  // User Groups
  interface UserGroupRow {
    userGroupId: number
    name: string
    description?: string
    userCount: number
    createdAt?: string
    updatedAt?: string
    isDeleted?: boolean
  }

  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set<GridRowId>(),
  })
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([])
  const [availableGroups, setAvailableGroups] = useState<UserGroupRow[]>([])
  const [groupsLoading, setGroupsLoading] = useState(false)

  // Permissions
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([])
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([])

  // Dropdown data
  const roles = ['Admin', 'Manager', 'Employee', 'Customer']
  const states = ['CA', 'NY', 'TX', 'FL', 'IL']

  /**
   * Fetch user details if editing or viewing
   */
  const fetchUserDetails = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const response: UserResponseModel = await userApi.getUserById(parseInt(id))

      // Set personal information
      setFirstName(response.firstName || '')
      setLastName(response.lastName || '')
      setEmail(response.email || '')
      setPhone(response.phone || '')
      setDob(response.dob ? new Date(response.dob) : null)
      setRole(response.role || '')

      // Set address details
      if (response.addresses && response.addresses.length > 0) {
        const primaryAddress = response.addresses.find((addr) => addr.isPrimary) || response.addresses[0]
        setAddress({
          street1: primaryAddress.street1 || '',
          street2: primaryAddress.street2 || '',
          city: primaryAddress.city || '',
          state: primaryAddress.state || '',
          zipCode: primaryAddress.zipCode || '',
          country: primaryAddress.country || 'USA',
        })
      }

      // Set user groups
      if (response.userGroups && response.userGroups.length > 0) {
        const groupIds = response.userGroups.map((group) => group.groupId)
        setSelectedGroupIds(groupIds)
        setRowSelectionModel({
          type: 'include',
          ids: new Set<GridRowId>(groupIds),
        })
      } else {
        setSelectedGroupIds([])
        setRowSelectionModel({
          type: 'include',
          ids: new Set<GridRowId>(),
        })
      }

      // Set permissions
      if (response.permissions && response.permissions.length > 0) {
        setSelectedPermissionIds(response.permissions.map((perm) => perm.permissionId))
      }

      toast.success('User details loaded successfully')
    } catch (error) {
      console.error('Error fetching user:', error)
      toast.error('Failed to fetch user details')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Fetch available user groups for selection
   */
  const fetchUserGroups = useCallback(async () => {
    try {
      setGroupsLoading(true)
      
      // TODO: Replace with actual API call when userGroupApi is ready
      // Mock data matching API structure
      const mockGroups = [
        { 
          userGroupId: 1, 
          name: 'Administrators', 
          description: 'System administrators',
          userCount: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDeleted: false,
        },
        { 
          userGroupId: 2, 
          name: 'Managers', 
          description: 'Department managers',
          userCount: 12,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDeleted: false,
        },
        { 
          userGroupId: 3, 
          name: 'Employees', 
          description: 'Regular employees',
          userCount: 45,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isDeleted: false,
        },
      ]
      
      setAvailableGroups(mockGroups)
    } catch (error) {
      console.error('Error fetching user groups:', error)
      toast.error('Failed to load user groups')
    } finally {
      setGroupsLoading(false)
    }
  }, [])

  /**
   * Fetch available permissions
   */
  const fetchPermissions = useCallback(async () => {
    try {
      // TODO: Replace with actual API call when backend endpoint is ready
      // const response = await permissionApi.getAllPermissions()
      
      // All permissions from backend Authorizations.java
      const mockPermissions: Permission[] = [
        // User Permissions
        { permissionId: 1, permissionName: 'View User', permissionCode: 'ViewUser', description: 'View user details', category: 'USER' },
        { permissionId: 2, permissionName: 'Insert User', permissionCode: 'InsertUser', description: 'Create new users', category: 'USER' },
        { permissionId: 3, permissionName: 'Update User', permissionCode: 'UpdateUser', description: 'Update user details', category: 'USER' },
        { permissionId: 4, permissionName: 'Delete User', permissionCode: 'DeleteUser', description: 'Delete users', category: 'USER' },
        
        // User Log Permissions
        { permissionId: 5, permissionName: 'View Logs', permissionCode: 'ViewLogs', description: 'View user logs', category: 'USER_LOG' },
        
        // Groups Permissions
        { permissionId: 6, permissionName: 'View Groups', permissionCode: 'ViewGroups', description: 'View user groups', category: 'GROUP' },
        { permissionId: 7, permissionName: 'Insert Groups', permissionCode: 'InsertGroups', description: 'Create new groups', category: 'GROUP' },
        { permissionId: 8, permissionName: 'Update Groups', permissionCode: 'UpdateGroups', description: 'Update group details', category: 'GROUP' },
        { permissionId: 9, permissionName: 'Delete Groups', permissionCode: 'DeleteGroups', description: 'Delete groups', category: 'GROUP' },
        
        // Messages Permissions
        { permissionId: 10, permissionName: 'View Messages', permissionCode: 'ViewMessages', description: 'View messages', category: 'MESSAGE' },
        { permissionId: 11, permissionName: 'Insert Messages', permissionCode: 'InsertMessages', description: 'Send messages', category: 'MESSAGE' },
        { permissionId: 12, permissionName: 'Update Messages', permissionCode: 'UpdateMessages', description: 'Update messages', category: 'MESSAGE' },
        { permissionId: 13, permissionName: 'Delete Messages', permissionCode: 'DeleteMessages', description: 'Delete messages', category: 'MESSAGE' },
        
        // Promos Permissions
        { permissionId: 14, permissionName: 'View Promos', permissionCode: 'ViewPromos', description: 'View promotions', category: 'PROMO' },
        { permissionId: 15, permissionName: 'Insert Promos', permissionCode: 'InsertPromos', description: 'Create promotions', category: 'PROMO' },
        { permissionId: 16, permissionName: 'Update Promos', permissionCode: 'UpdatePromos', description: 'Update promotions', category: 'PROMO' },
        { permissionId: 17, permissionName: 'Delete Promos', permissionCode: 'DeletePromos', description: 'Delete promotions', category: 'PROMO' },
        
        // Pickup Location Permissions
        { permissionId: 18, permissionName: 'View Pickup Locations', permissionCode: 'ViewPickupLocations', description: 'View pickup locations', category: 'PICKUP_LOCATION' },
        { permissionId: 19, permissionName: 'Insert Pickup Locations', permissionCode: 'InsertPickupLocations', description: 'Create pickup locations', category: 'PICKUP_LOCATION' },
        { permissionId: 20, permissionName: 'Update Pickup Locations', permissionCode: 'UpdatePickupLocations', description: 'Update pickup locations', category: 'PICKUP_LOCATION' },
        { permissionId: 21, permissionName: 'Delete Pickup Locations', permissionCode: 'DeletePickupLocations', description: 'Delete pickup locations', category: 'PICKUP_LOCATION' },
        
        // Products Permissions
        { permissionId: 22, permissionName: 'View Products', permissionCode: 'ViewProducts', description: 'View products', category: 'PRODUCT' },
        { permissionId: 23, permissionName: 'Insert Products', permissionCode: 'InsertProducts', description: 'Create products', category: 'PRODUCT' },
        { permissionId: 24, permissionName: 'Update Products', permissionCode: 'UpdateProducts', description: 'Update products', category: 'PRODUCT' },
        { permissionId: 25, permissionName: 'Delete Products', permissionCode: 'DeleteProducts', description: 'Delete products', category: 'PRODUCT' },
        { permissionId: 26, permissionName: 'Toggle Product Availability', permissionCode: 'ToggleProductAvailability', description: 'Toggle product availability', category: 'PRODUCT' },
        { permissionId: 27, permissionName: 'Toggle Product Returns', permissionCode: 'ToggleProductReturns', description: 'Toggle product returns', category: 'PRODUCT' },
        
        // Orders Permissions
        { permissionId: 28, permissionName: 'View Orders', permissionCode: 'ViewOrders', description: 'View orders', category: 'ORDER' },
        { permissionId: 29, permissionName: 'Insert Orders', permissionCode: 'InsertOrders', description: 'Create orders', category: 'ORDER' },
        { permissionId: 30, permissionName: 'Update Orders', permissionCode: 'UpdateOrders', description: 'Update orders', category: 'ORDER' },
        { permissionId: 31, permissionName: 'Cancel Orders', permissionCode: 'CancelOrders', description: 'Cancel orders', category: 'ORDER' },
        { permissionId: 32, permissionName: 'View Order Statistics', permissionCode: 'ViewOrderStatistics', description: 'View order statistics', category: 'ORDER' },
        
        // Address Permissions
        { permissionId: 33, permissionName: 'View Address', permissionCode: 'ViewAddress', description: 'View addresses', category: 'ADDRESS' },
        { permissionId: 34, permissionName: 'Insert Address', permissionCode: 'InsertAddress', description: 'Create addresses', category: 'ADDRESS' },
        { permissionId: 35, permissionName: 'Update Address', permissionCode: 'UpdateAddress', description: 'Update addresses', category: 'ADDRESS' },
        { permissionId: 36, permissionName: 'Delete Address', permissionCode: 'DeleteAddress', description: 'Delete addresses', category: 'ADDRESS' },
        
        // Client Permissions
        { permissionId: 37, permissionName: 'View Client', permissionCode: 'ViewClient', description: 'View clients', category: 'CLIENT' },
        { permissionId: 38, permissionName: 'Insert Client', permissionCode: 'InsertClient', description: 'Create clients', category: 'CLIENT' },
        { permissionId: 39, permissionName: 'Update Client', permissionCode: 'UpdateClient', description: 'Update clients', category: 'CLIENT' },
        { permissionId: 40, permissionName: 'Delete Client', permissionCode: 'DeleteClient', description: 'Delete clients', category: 'CLIENT' },
        
        // Payments Permissions
        { permissionId: 41, permissionName: 'View Payments', permissionCode: 'ViewPayments', description: 'View payments', category: 'PAYMENT' },
        { permissionId: 42, permissionName: 'View Payment Statistics', permissionCode: 'ViewPaymentStatistics', description: 'View payment statistics', category: 'PAYMENT' },
        { permissionId: 43, permissionName: 'Process Refunds', permissionCode: 'ProcessRefunds', description: 'Process refunds', category: 'PAYMENT' },
        
        // Events Permissions
        { permissionId: 44, permissionName: 'View Events', permissionCode: 'ViewEvents', description: 'View events', category: 'EVENT' },
        { permissionId: 45, permissionName: 'Insert Events', permissionCode: 'InsertEvents', description: 'Create events', category: 'EVENT' },
        { permissionId: 46, permissionName: 'Update Events', permissionCode: 'UpdateEvents', description: 'Update events', category: 'EVENT' },
        { permissionId: 47, permissionName: 'Toggle Events', permissionCode: 'ToggleEvents', description: 'Toggle events', category: 'EVENT' },
        
        // API Keys Permissions
        { permissionId: 48, permissionName: 'View API Keys', permissionCode: 'ViewApiKeys', description: 'View API keys', category: 'API_KEY' },
        { permissionId: 49, permissionName: 'Insert API Keys', permissionCode: 'InsertApiKeys', description: 'Create API keys', category: 'API_KEY' },
        { permissionId: 50, permissionName: 'Update API Keys', permissionCode: 'UpdateApiKeys', description: 'Update API keys', category: 'API_KEY' },
        
        // Leads Permissions
        { permissionId: 51, permissionName: 'View Leads', permissionCode: 'ViewLeads', description: 'View leads', category: 'LEAD' },
        { permissionId: 52, permissionName: 'Insert Leads', permissionCode: 'InsertLeads', description: 'Create leads', category: 'LEAD' },
        { permissionId: 53, permissionName: 'Update Leads', permissionCode: 'UpdateLeads', description: 'Update leads', category: 'LEAD' },
        { permissionId: 54, permissionName: 'Toggle Leads', permissionCode: 'ToggleLeads', description: 'Toggle leads', category: 'LEAD' },
        
        // Purchase Order Permissions
        { permissionId: 55, permissionName: 'View Purchase Orders', permissionCode: 'ViewPurchaseOrders', description: 'View purchase orders', category: 'PURCHASE_ORDER' },
        { permissionId: 56, permissionName: 'Insert Purchase Orders', permissionCode: 'InsertPurchaseOrders', description: 'Create purchase orders', category: 'PURCHASE_ORDER' },
        { permissionId: 57, permissionName: 'Update Purchase Orders', permissionCode: 'UpdatePurchaseOrders', description: 'Update purchase orders', category: 'PURCHASE_ORDER' },
        { permissionId: 58, permissionName: 'Toggle Purchase Orders', permissionCode: 'TogglePurchaseOrders', description: 'Toggle purchase orders', category: 'PURCHASE_ORDER' },
        
        // Sales Order Permissions
        { permissionId: 59, permissionName: 'View Sales Orders', permissionCode: 'ViewSalesOrders', description: 'View sales orders', category: 'SALES_ORDER' },
        { permissionId: 60, permissionName: 'Insert Sales Orders', permissionCode: 'InsertSalesOrders', description: 'Create sales orders', category: 'SALES_ORDER' },
        { permissionId: 61, permissionName: 'Update Sales Orders', permissionCode: 'UpdateSalesOrders', description: 'Update sales orders', category: 'SALES_ORDER' },
        { permissionId: 62, permissionName: 'Toggle Sales Orders', permissionCode: 'ToggleSalesOrders', description: 'Toggle sales orders', category: 'SALES_ORDER' },
        
        // Web Template Permissions
        { permissionId: 63, permissionName: 'View Web Template', permissionCode: 'ViewWebTemplate', description: 'View web templates', category: 'WEB_TEMPLATE' },
        { permissionId: 64, permissionName: 'Insert Web Template', permissionCode: 'InsertWebTemplate', description: 'Create web templates', category: 'WEB_TEMPLATE' },
        { permissionId: 65, permissionName: 'Update Web Template', permissionCode: 'UpdateWebTemplate', description: 'Update web templates', category: 'WEB_TEMPLATE' },
        { permissionId: 66, permissionName: 'Deploy Web Template', permissionCode: 'DeployWebTemplate', description: 'Deploy web templates', category: 'WEB_TEMPLATE' },
        { permissionId: 67, permissionName: 'Deactivate Web Template', permissionCode: 'DeactivateWebTemplate', description: 'Deactivate web templates', category: 'WEB_TEMPLATE' },
        
        // Packages Permissions
        { permissionId: 68, permissionName: 'View Packages', permissionCode: 'ViewPackages', description: 'View packages', category: 'PACKAGE' },
        { permissionId: 69, permissionName: 'Insert Packages', permissionCode: 'InsertPackages', description: 'Create packages', category: 'PACKAGE' },
        { permissionId: 70, permissionName: 'Update Packages', permissionCode: 'UpdatePackages', description: 'Update packages', category: 'PACKAGE' },
        { permissionId: 71, permissionName: 'Toggle Packages', permissionCode: 'TogglePackages', description: 'Toggle packages', category: 'PACKAGE' },
        
        // Support Permissions
        { permissionId: 72, permissionName: 'View Tickets', permissionCode: 'ViewTickets', description: 'View support tickets', category: 'SUPPORT' },
        { permissionId: 73, permissionName: 'Raise Tickets', permissionCode: 'RaiseTickets', description: 'Raise support tickets', category: 'SUPPORT' },
        { permissionId: 74, permissionName: 'Edit Tickets', permissionCode: 'EditTickets', description: 'Edit support tickets', category: 'SUPPORT' },
        { permissionId: 75, permissionName: 'Delete Tickets', permissionCode: 'DeleteTickets', description: 'Delete support tickets', category: 'SUPPORT' },
        { permissionId: 76, permissionName: 'View Comments', permissionCode: 'ViewComments', description: 'View ticket comments', category: 'SUPPORT' },
        { permissionId: 77, permissionName: 'Post Comments', permissionCode: 'PostComments', description: 'Post ticket comments', category: 'SUPPORT' },
        { permissionId: 78, permissionName: 'Download Attachments', permissionCode: 'DownloadAttachments', description: 'Download ticket attachments', category: 'SUPPORT' },
      ]
      
      setAvailablePermissions(mockPermissions)
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
      toast.error('Failed to load permissions')
    }
  }, [])

  /**
   * Handle profile picture upload
   */
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setProfilePictureBase64(base64)
      toast.success('Profile picture uploaded')
    }
    reader.onerror = () => {
      toast.error('Failed to read image file')
    }
    reader.readAsDataURL(file)
  }

  /**
   * Remove profile picture
   */
  const handleRemoveImage = () => {
    setProfilePictureBase64('')
    toast.info('Profile picture removed')
  }

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    if (!firstName.trim()) {
      toast.error('First name is required')
      return false
    }
    if (!lastName.trim()) {
      toast.error('Last name is required')
      return false
    }
    if (!email.trim()) {
      toast.error('Email is required')
      return false
    }
    if (!phone.trim()) {
      toast.error('Phone is required')
      return false
    }
    if (!role) {
      toast.error('Role is required')
      return false
    }
    if (!dob) {
      toast.error('Date of birth is required')
      return false
    }
    if (!address.street1.trim()) {
      toast.error('Street address is required')
      return false
    }
    if (!address.city.trim()) {
      toast.error('City is required')
      return false
    }
    if (!address.state) {
      toast.error('State is required')
      return false
    }
    if (!address.zipCode.trim()) {
      toast.error('Zip code is required')
      return false
    }
    return true
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const requestData: UserRequestModel = {
        userId: isEdit ? parseInt(userId!) : undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: role,
        dob: dob?.toISOString().split('T')[0],
        address: {
          street1: address.street1.trim(),
          street2: address.street2.trim() || undefined,
          city: address.city.trim(),
          state: address.state,
          zipCode: address.zipCode.trim(),
          country: address.country,
          isPrimary: true,
        },
        selectedGroupIds: selectedGroupIds,
        permissionIds: selectedPermissionIds,
        profilePictureBase64: profilePictureBase64 || undefined,
      }

      if (isEdit) {
        await userApi.updateUser(requestData.userId!, requestData)
        toast.success('User updated successfully')
      } else {
        await userApi.createUser(requestData)
        toast.success('User created successfully')
      }

      // Navigate back to users grid
      setTimeout(() => {
        navigate(APP_ROUTES.DASHBOARD.USERS)
      }, 1000)
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} user`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    navigate(APP_ROUTES.DASHBOARD.USERS)
  }


  // Personal information fields configuration
  const personalInfoFields: FormField[] = [
    {
      id: 'firstName',
      label: 'First Name',
      value: firstName,
      onChange: setFirstName,
      required: true,
      gridSize: { xs: 12, md: 6 },
    },
    {
      id: 'lastName',
      label: 'Last Name',
      value: lastName,
      onChange: setLastName,
      required: true,
      gridSize: { xs: 12, md: 6 },
    },
    {
      id: 'email',
      label: 'Email',
      value: email,
      onChange: setEmail,
      required: true,
      type: 'email',
      gridSize: { xs: 12, md: 6 },
    },
    {
      id: 'phone',
      label: 'Phone',
      value: phone,
      onChange: setPhone,
      required: true,
      type: 'tel',
      gridSize: { xs: 12, md: 6 },
    },
  ]


  // Fetch data on mount
  useEffect(() => {
    fetchUserGroups()
    fetchPermissions()
    if (userId) {
      fetchUserDetails(userId)
    }
  }, [fetchPermissions, fetchUserDetails, fetchUserGroups, userId])

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl">
        <Box className="add-users-page__container">
          {/* Personal Information Section */}
          <Paper className="add-users-page__section">
            <Typography variant="h6" className="add-users-page__section-title">
              Personal Information
            </Typography>
            <Divider className="add-users-page__divider" />

            <Grid container spacing={2}>
              {/* Profile Picture */}
              <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={profilePictureBase64}
                  sx={{ width: 120, height: 120, cursor: isView ? 'default' : 'pointer' }}
                  onClick={() => !isView && document.getElementById('profile-picture-input')?.click()}
                />
                {!isView && (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      component="label"
                      size="small"
                    >
                      Upload Photo
                      <input
                        id="profile-picture-input"
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </Button>
                    {profilePictureBase64 && (
                      <IconButton size="small" color="error" onClick={handleRemoveImage}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                )}
              </Grid>

              {/* Text Fields */}
              {personalInfoFields.map((field) => (
                <Grid item xs={12} sm={6} key={field.id}>
                  <TextField
                    fullWidth
                    label={field.label}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    required={field.required}
                    disabled={isView || loading}
                    type={field.type || 'text'}
                    multiline={field.multiline}
                    rows={field.rows}
                  />
                </Grid>
              ))}

              {/* Role Dropdown */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  disabled={isView || loading}
                >
                  {roles.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Date of Birth */}
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Date of Birth"
                  value={dob}
                  onChange={(newValue: Date | null) => setDob(newValue)}
                  disabled={isView || loading}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Address Details Section */}
          <Paper className="add-users-page__section">
            <Typography variant="h6" className="add-users-page__section-title">
              Address Details
            </Typography>
            <Divider className="add-users-page__divider" />

            <AddressForm
              address={address}
              onChange={(field, value) => setAddress({ ...address, [field]: value })}
              disabled={isView || loading}
              states={states}
            />
          </Paper>

          {/* User Permissions Section */}
          <Paper className="add-users-page__section">
            <Typography variant="h6" className="add-users-page__section-title">
              User Permissions
            </Typography>
            <Divider className="add-users-page__divider" />

            <UserPermissions
              availablePermissions={availablePermissions}
              selectedPermissionIds={selectedPermissionIds}
              onChange={setSelectedPermissionIds}
              readOnly={isView}
            />
          </Paper>

          {/* User Groups Section */}
          <Paper className="add-users-page__section">
            <Typography variant="h6" className="add-users-page__section-title">
              User Groups
            </Typography>
            <Divider className="add-users-page__divider" />

            <Box className="add-users-page__grid-container">
              <StyledDataGrid
                rows={availableGroups}
                columns={[
                  {
                    field: 'userGroupId',
                    headerName: 'ID',
                    width: 80,
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
                    field: 'userCount',
                    headerName: 'Members',
                    width: 100,
                    align: 'center',
                    headerAlign: 'center',
                  },
                ]}
                getRowId={(row) => row.userGroupId}
                checkboxSelection={!isView}
                disableRowSelectionOnClick
                rowSelectionModel={rowSelectionModel}
                onRowSelectionModelChange={(newSelection) => {
                  setRowSelectionModel(newSelection)
                  const ids = Array.from(newSelection.ids ?? new Set<GridRowId>())
                  setSelectedGroupIds(ids.map((id) => Number(id)))
                }}
                loading={groupsLoading}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: {
                    paginationModel: {
                      page: 0,
                      pageSize: 10,
                    },
                  },
                }}
                autoHeight
                hideFooter
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
              className="add-users-page__selection-info"
              sx={{ mt: 2 }}
            >
              {selectedGroupIds.length} group(s) selected
            </Typography>
          </Paper>

          {/* User Logs Section (Edit/View Mode Only) */}
          {/* TODO: Fix DataGrid configuration */}
          {/* {(isEdit || isView) && (
            <Paper className="add-users-page__section">
              <Typography variant="h6" className="add-users-page__section-title">
                User Activity Logs
              </Typography>
              <Divider className="add-users-page__divider" />

              <Box className="add-users-page__grid-container">
                <DataGrid
                  rows={userLogs}
                  columns={logColumns}
                  getRowId={(row) => row.logId}
                  pageSizeOptions={[5, 10, 25]}
                  initialState={{
                    pagination: {
                      paginationModel: { page: 0, pageSize: 5 },
                    },
                  }}
                  autoHeight
                  hideFooter
                  disableRowSelectionOnClick
                />
              </Box>
            </Paper>
          )} */}

          {/* Action Buttons */}
          {!isView && (
            <Box className="add-users-page__actions">
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={loading}
                className="add-users-page__action-button"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={loading}
                className="add-users-page__action-button"
              >
                {loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
              </Button>
            </Box>
          )}
        </Box>
      </Container>
    </LocalizationProvider>
  )
}

export default AddEditUsers

