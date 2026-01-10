import { Close as CloseIcon, Payment as PaymentIcon, Add as AddIcon } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from '@mui/material'
import { useState } from 'react'

import { type PaymentResponseModel } from '../../../models/api-models'
import { IconButton as CustomIconButton } from '../../../components/buttons'
import { Subheader } from '../../../components/fonts'
import { PaymentModal } from '../../../components/dialogs/PaymentModal'
import PaymentsTable from './PaymentsTable'
import styles from '../../../styles/PurchaseOrders.module.scss'

/**
 * Props for PaymentsModal component
 */
interface PaymentsModalProps {
  open: boolean
  onClose: () => void
  payments: PaymentResponseModel[]
  grandTotal: number
  pendingAmount: number
  purchaseOrderId?: number
  vendorNumber?: string
  onPaymentSuccess?: () => void
}

/**
 * Format currency for display
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Payments Modal Component
 *
 * Displays payment history for a purchase order including:
 * - Payment summary (Paid: ₹X / ₹Y (Z%), Remaining: ₹Z)
 * - List of all payments with details
 * - "Make Payment" button to add additional payments
 */
const PaymentsModal = ({
  open,
  onClose,
  payments,
  grandTotal,
  pendingAmount,
  purchaseOrderId,
  vendorNumber = '',
  onPaymentSuccess,
}: PaymentsModalProps): JSX.Element => {
  const totalPaid = grandTotal - pendingAmount
  const paidPercentage = grandTotal > 0 ? (totalPaid / grandTotal) * 100 : 0
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  const handleMakePayment = (): void => {
    setPaymentModalOpen(true)
  }

  const handlePaymentModalClose = (): void => {
    setPaymentModalOpen(false)
  }

  const handlePaymentSuccess = (): void => {
    setPaymentModalOpen(false)
    if (onPaymentSuccess) {
      onPaymentSuccess()
    }
  }

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: styles['shipping-optimization-modal__paper'],
      }}
    >
      <DialogTitle className={styles['shipping-optimization-modal__title']}>
        <Box className={styles['shipping-optimization-modal__title-left']}>
          <PaymentIcon color="primary" />
          <Subheader variant="h6" label="Payment History" />
          <Chip label={payments.length} size="small" color="primary" />
        </Box>
        <CustomIconButton onClick={onClose} size="small">
          <CloseIcon />
        </CustomIconButton>
      </DialogTitle>
      <DialogContent className={styles['shipping-optimization-modal__dialog-content']}>
        <Box sx={{ p: 2 }}>
          {/* Payment Summary Card */}
          <Card variant="outlined" sx={{ mb: 3, bgcolor: 'background.paper' }}>
            <CardContent>
              <Subheader variant="subtitle1" label="Payment Summary" />
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Grand Total:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(grandTotal)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Paid:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="success.main">
                    {formatCurrency(totalPaid)} / {formatCurrency(grandTotal)} ({paidPercentage.toFixed(1)}%)
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Remaining Balance:
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    color={pendingAmount > 0 ? 'warning.main' : 'success.main'}
                  >
                    {formatCurrency(pendingAmount)}
                  </Typography>
                </Box>
                {pendingAmount > 0 && purchaseOrderId && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<AddIcon />}
                      onClick={handleMakePayment}
                    >
                      Make Payment
                    </Button>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Payments List */}
          <PaymentsTable payments={payments} />
        </Box>
      </DialogContent>
    </Dialog>

    {/* Payment Modal for making additional payments */}
    {purchaseOrderId && (
      <PaymentModal
        open={paymentModalOpen}
        onClose={handlePaymentModalClose}
        purchaseOrderId={purchaseOrderId}
        vendorNumber={vendorNumber}
        grandTotal={grandTotal}
        pendingAmount={pendingAmount}
        onPaymentSuccess={handlePaymentSuccess}
        skipShipmentProcessing={true}
      />
    )}
    </>
  )
}

export default PaymentsModal

