import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Box, Container } from '@mui/material'

import messageApi from '../../api/messageApi'
import { UserGroupSelectionGrid, UserSelectionGrid } from '../../components/datagrid'
import { PERMISSIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import { usePermissions } from '../../hooks/usePermissions'
import type { MessageResponseModel } from '../../models/api-models'
import { getUserGroupGridColumns } from '../../models/grid-models/UserGroupGridColumns'
import { getUserGridColumns } from '../../models/grid-models/UserGridColumns'
import styles from './Messages.module.scss'

import { MessageDetailsView, MessageNotesView, type MessageViewFormData } from './components'

/**
 * Add/View Message page for the admin messages grid (view mode uses ?messageId=&isView).
 */
const AddEditMessages = (): React.JSX.Element => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const messageId = searchParams.get('messageId')
  const isView = searchParams.has('isView')

  const [loading, setLoading] = useState(false)
  const [viewData, setViewData] = useState<MessageViewFormData>({
    title: '',
    descriptionHtml: '',
    sendAsEmail: false,
    publishDate: '',
    notes: '',
  })
  const [recipientUserIds, setRecipientUserIds] = useState<number[]>([])
  const [recipientGroupIds, setRecipientGroupIds] = useState<number[]>([])
  const [viewRecipientUserIds, setViewRecipientUserIds] = useState<number[] | undefined>(undefined)
  const [viewRecipientGroupIds, setViewRecipientGroupIds] = useState<number[] | undefined>(undefined)

  const { hasPermission } = usePermissions()
  const hasCheckedPermissions = useRef(false)
  const hasFetchedMessageDetails = useRef(false)

  const userColumns = useMemo(() => {
    const allColumns = getUserGridColumns(_userId => undefined)
    return allColumns.filter(col => col.field !== 'userActions')
  }, [])

  const groupColumns = useMemo(() => {
    const allColumns = getUserGroupGridColumns(_groupId => undefined)
    return allColumns.filter(col => col.field !== 'actions')
  }, [])

  useEffect(() => {
    if (hasCheckedPermissions.current) {
      return
    }

    if (messageId && !isView) {
      hasCheckedPermissions.current = true
      toast.info('Messages cannot be edited after creation. Redirecting to view mode.')
      navigate(`${APP_ROUTES.DASHBOARD.ADD_MESSAGE}?messageId=${messageId}&isView`, { replace: true })
      return
    }

    const requiredPermission = isView ? PERMISSIONS.VIEW_MESSAGES : PERMISSIONS.INSERT_MESSAGES
    if (!hasPermission(requiredPermission)) {
      hasCheckedPermissions.current = true
      toast.error('You do not have permission to access this page')
      navigate(APP_ROUTES.DASHBOARD.MESSAGES, { replace: true })
    } else {
      hasCheckedPermissions.current = true
    }
  }, [hasPermission, isView, messageId, navigate])

  const fetchMessageDetails = useCallback(async (): Promise<void> => {
    if (!messageId || hasFetchedMessageDetails.current) {
      return
    }

    setLoading(true)
    hasFetchedMessageDetails.current = true

    try {
      const response: MessageResponseModel = await messageApi.getMessageDetailsById(parseInt(messageId, 10))
      const userIds = Array.isArray(response.userIds) ? response.userIds : []
      const groupIds = Array.isArray(response.userGroupIds) ? response.userGroupIds : []

      setViewData({
        title: response.title,
        descriptionHtml: response.descriptionHtml,
        sendAsEmail: response.sendAsEmail ?? false,
        publishDate: response.publishDate ?? '',
        notes: response.notes ?? '',
      })
      setRecipientUserIds(userIds)
      setRecipientGroupIds(groupIds)
      setViewRecipientUserIds(userIds)
      setViewRecipientGroupIds(groupIds)
    } catch {
      toast.error('Failed to fetch message details')
      navigate(APP_ROUTES.DASHBOARD.MESSAGES, { replace: true })
    } finally {
      setLoading(false)
    }
  }, [messageId, navigate])

  useEffect(() => {
    if (messageId && isView && !hasFetchedMessageDetails.current) {
      void fetchMessageDetails()
    }
  }, [messageId, isView, fetchMessageDetails])

  if (!isView) {
    return (
      <Container maxWidth={false} disableGutters className={styles['messages-page']}>
        <Box sx={{ p: 3 }}>
          <MessageDetailsView
            watchedValues={{
              title: 'Message form',
              descriptionHtml: '<p>Create message form is not implemented yet.</p>',
              sendAsEmail: false,
            }}
          />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth={false} disableGutters className={styles['messages-page']}>
      <Box className={styles['add-messages-page__container']}>
        {loading ? (
          <Box sx={{ p: 3 }}>Loading message...</Box>
        ) : (
          <>
            <MessageDetailsView watchedValues={viewData} />

            <UserSelectionGrid
              selectedUserIds={recipientUserIds}
              onSelectionChange={setRecipientUserIds}
              columns={userColumns}
              isView
              title="Recipient Users"
              showSelectionInfo={false}
              defaultPageSize={25}
              hideToolbar={false}
              selectedUserIdsFilter={viewRecipientUserIds}
              dataTestId="message-recipients-users-data-grid"
              dividerSpacerClassName={styles['add-messages-page__divider-spacer']}
              gridContainerClassName={styles['add-messages-page__grid-container']}
            />

            <UserGroupSelectionGrid
              selectedGroupIds={recipientGroupIds}
              onSelectionChange={setRecipientGroupIds}
              columns={groupColumns}
              isView
              title="Recipient User Groups"
              showSelectionInfo={false}
              defaultPageSize={25}
              hideToolbar={false}
              selectedGroupIdsFilter={viewRecipientGroupIds}
              dataTestId="message-recipients-groups-data-grid"
              dividerSpacerClassName={styles['add-messages-page__divider-spacer']}
              gridContainerClassName={styles['add-messages-page__grid-container']}
            />

            <MessageNotesView notes={viewData.notes} />
          </>
        )}
      </Box>
    </Container>
  )
}

export default AddEditMessages
