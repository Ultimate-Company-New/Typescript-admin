import type React from 'react'
import { useState, useEffect } from 'react'

import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Box, CircularProgress, Container } from '@mui/material'

import { purchaseOrderApi } from '../../api/purchaseOrderApi'
import { APP_ROUTES } from '../../constants/routes'
import { type PurchaseOrderResponseModel } from '../../models/api-models'
import PurchaseOrderDetailsView from './components/PurchaseOrderDetailsView'
import styles from '../../styles/PurchaseOrders.module.scss'

const ViewPurchaseOrder: React.FC = () => {
  const { purchaseOrderId } = useParams<{ purchaseOrderId: string }>()
  const navigate = useNavigate()
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderResponseModel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPurchaseOrder = async (): Promise<void> => {
      if (!purchaseOrderId) {
        toast.error('Purchase Order ID not provided')
        navigate(APP_ROUTES.DASHBOARD.PURCHASE_ORDERS)
        return
      }

      try {
        setLoading(true)
        const data = await purchaseOrderApi.getPurchaseOrderById(parseInt(purchaseOrderId))
        setPurchaseOrder(data as PurchaseOrderResponseModel)
      } catch (error) {
        toast.error('Failed to load purchase order')
        navigate(APP_ROUTES.DASHBOARD.PURCHASE_ORDERS)
      } finally {
        setLoading(false)
      }
    }

    void fetchPurchaseOrder()
  }, [purchaseOrderId, navigate])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!purchaseOrder) {
    return null
  }

  return (
    <Container maxWidth="xl" className={styles['purchase-order-view']}>
      <Box className={styles['purchase-order-view__container']}>
        {/* Purchase Order Details */}
        <PurchaseOrderDetailsView purchaseOrder={purchaseOrder} />
      </Box>
    </Container>
  )
}

export default ViewPurchaseOrder

