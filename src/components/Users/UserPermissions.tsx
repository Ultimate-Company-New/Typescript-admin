import { useState, useEffect } from 'react'

import { Grid, Paper, Typography, Divider, Checkbox, FormControlLabel, Box } from '@mui/material'

export interface Permission {
  permissionId: number
  permissionName: string
  permissionCode: string
  description: string
  category: string
}

interface UserPermissionsProps {
  availablePermissions: Permission[]
  selectedPermissionIds: number[]
  onChange: (permissionIds: number[]) => void
  readOnly?: boolean
}

/**
 * User Permissions Component
 *
 * Features:
 * - Displays permissions grouped by category
 * - Checkbox selection for each permission
 * - Auto-check dependencies (e.g., Delete requires Update, Insert, View)
 * - Read-only mode support
 * - Responsive grid layout
 */
const UserPermissions = ({
  availablePermissions,
  selectedPermissionIds,
  onChange,
  readOnly = false,
}: UserPermissionsProps): JSX.Element => {
  const [localSelectedIds, setLocalSelectedIds] = useState<number[]>(selectedPermissionIds)

  useEffect(() => {
    setLocalSelectedIds(selectedPermissionIds)
  }, [selectedPermissionIds])

  // Group permissions by category
  const groupedPermissions = availablePermissions.reduce<Record<string, Permission[]>>((acc, permission) => {
    const category = permission.category != null && permission.category !== '' ? permission.category : 'GENERAL'
    if (!(category in acc)) {
      acc[category] = []
    }
    acc[category].push(permission)
    return acc
  }, {})

  // Sort permissions within each category by name
  Object.keys(groupedPermissions).forEach(category => {
    groupedPermissions[category].sort((a, b) => a.permissionName.localeCompare(b.permissionName))
  })

  const handlePermissionChange = (permissionId: number, checked: boolean): void => {
    let newSelectedIds = [...localSelectedIds]

    if (checked) {
      // Add permission if not already selected
      if (!newSelectedIds.includes(permissionId)) {
        newSelectedIds.push(permissionId)
      }

      // Auto-check dependencies based on permission hierarchy
      // For example: Delete -> Update -> Insert -> View
      const permission = availablePermissions.find(p => p.permissionId === permissionId)
      if (permission) {
        newSelectedIds = autoCheckDependencies(permission, newSelectedIds)
      }
    } else {
      // Remove permission
      newSelectedIds = newSelectedIds.filter(id => id !== permissionId)

      // Auto-uncheck dependent permissions
      const permission = availablePermissions.find(p => p.permissionId === permissionId)
      if (permission) {
        newSelectedIds = autoUncheckDependents(permission, newSelectedIds)
      }
    }

    setLocalSelectedIds(newSelectedIds)
    onChange(newSelectedIds)
  }

  /**
   * Auto-check dependent permissions based on hierarchy
   * E.g., if "Delete User" is checked, auto-check "Update User", "Insert User", "View User"
   */
  const autoCheckDependencies = (permission: Permission, currentIds: number[]): number[] => {
    const permCode = permission.permissionCode.toLowerCase()
    const { category } = permission
    const updatedIds = [...currentIds]

    // Define permission hierarchy: Delete > Update > Insert > View
    if (permCode.includes('delete') || permCode.includes('toggle')) {
      // If delete/toggle is checked, check update, insert, and view
      const relatedPerms = availablePermissions.filter(
        p =>
          p.category === category &&
          (p.permissionCode.toLowerCase().includes('update') ||
            p.permissionCode.toLowerCase().includes('insert') ||
            p.permissionCode.toLowerCase().includes('view')),
      )
      relatedPerms.forEach(p => {
        if (!updatedIds.includes(p.permissionId)) {
          updatedIds.push(p.permissionId)
        }
      })
    } else if (permCode.includes('update')) {
      // If update is checked, check insert and view
      const relatedPerms = availablePermissions.filter(
        p =>
          p.category === category &&
          (p.permissionCode.toLowerCase().includes('insert') || p.permissionCode.toLowerCase().includes('view')),
      )
      relatedPerms.forEach(p => {
        if (!updatedIds.includes(p.permissionId)) {
          updatedIds.push(p.permissionId)
        }
      })
    } else if (permCode.includes('insert')) {
      // If insert is checked, check view
      const relatedPerms = availablePermissions.filter(
        p => p.category === category && p.permissionCode.toLowerCase().includes('view'),
      )
      relatedPerms.forEach(p => {
        if (!updatedIds.includes(p.permissionId)) {
          updatedIds.push(p.permissionId)
        }
      })
    }

    return updatedIds
  }

  /**
   * Auto-uncheck dependent permissions
   * E.g., if "View User" is unchecked, auto-uncheck "Insert User", "Update User", "Delete User"
   */
  const autoUncheckDependents = (permission: Permission, currentIds: number[]): number[] => {
    const permCode = permission.permissionCode.toLowerCase()
    const { category } = permission
    let updatedIds = [...currentIds]

    if (permCode.includes('view')) {
      // If view is unchecked, uncheck insert, update, delete
      const relatedPerms = availablePermissions.filter(
        p =>
          p.category === category &&
          (p.permissionCode.toLowerCase().includes('insert') ||
            p.permissionCode.toLowerCase().includes('update') ||
            p.permissionCode.toLowerCase().includes('delete') ||
            p.permissionCode.toLowerCase().includes('toggle')),
      )
      updatedIds = updatedIds.filter(id => !relatedPerms.some(p => p.permissionId === id))
    } else if (permCode.includes('insert')) {
      // If insert is unchecked, uncheck update, delete
      const relatedPerms = availablePermissions.filter(
        p =>
          p.category === category &&
          (p.permissionCode.toLowerCase().includes('update') ||
            p.permissionCode.toLowerCase().includes('delete') ||
            p.permissionCode.toLowerCase().includes('toggle')),
      )
      updatedIds = updatedIds.filter(id => !relatedPerms.some(p => p.permissionId === id))
    } else if (permCode.includes('update')) {
      // If update is unchecked, uncheck delete
      const relatedPerms = availablePermissions.filter(
        p =>
          p.category === category &&
          (p.permissionCode.toLowerCase().includes('delete') || p.permissionCode.toLowerCase().includes('toggle')),
      )
      updatedIds = updatedIds.filter(id => !relatedPerms.some(p => p.permissionId === id))
    }

    return updatedIds
  }

  const categories = Object.keys(groupedPermissions).sort()

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={2}>
        {categories.map(category => (
          <Grid item xs={12} sm={6} md={4} key={category}>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                height: '100%',
              }}
            >
              <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                {category.charAt(0) + category.slice(1).toLowerCase().replace(/_/g, ' ')} Permissions
              </Typography>
              <Divider
                sx={{
                  mb: 2,
                }}
              />
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                {groupedPermissions[category].map(permission => (
                  <FormControlLabel
                    key={permission.permissionId}
                    control={
                      <Checkbox
                        checked={localSelectedIds.includes(permission.permissionId)}
                        onChange={e => {
                          handlePermissionChange(permission.permissionId, e.target.checked)
                        }}
                        disabled={readOnly}
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="body2" title={permission.description}>
                        {permission.permissionName}
                      </Typography>
                    }
                  />
                ))}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default UserPermissions
