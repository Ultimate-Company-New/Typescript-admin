import { Payment as PaymentIcon, CreditCard as CreditCardIcon, AttachMoney as CashIcon, Download as DownloadIcon } from '@mui/icons-material'
import {
  Box,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { format } from 'date-fns'
import { toast } from 'react-toastify'

import { type PaymentResponseModel } from '../../../models/api-models'
import { paymentApi } from '../../../api/paymentApi'

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
 * Format date for display
 * Prioritizes capturedAt (actual payment timestamp) over paymentDate (which may be midnight for cash payments)
 */
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    // Check if time is midnight (00:00:00) - likely a date-only field
    const isMidnight = date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0
    if (isMidnight) {
      // For date-only fields, show just the date
      return format(date, 'MMM dd, yyyy')
    }
    // For timestamps with actual time, show date and time
    return format(date, 'MMM dd, yyyy HH:mm')
  } catch {
    return dateString
  }
}

/**
 * Get payment status color
 */
const getPaymentStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
  const upperStatus = status.toUpperCase()
  if (upperStatus.includes('CAPTURED') || upperStatus.includes('SUCCESS') || upperStatus.includes('COMPLETED')) {
    return 'success'
  }
  if (upperStatus.includes('PENDING') || upperStatus.includes('AUTHORIZED')) {
    return 'warning'
  }
  if (upperStatus.includes('FAILED') || upperStatus.includes('CANCELLED') || upperStatus.includes('REFUNDED')) {
    return 'error'
  }
  return 'default'
}

/**
 * Get payment method icon
 */
const getPaymentMethodIcon = (method?: string): JSX.Element => {
  if (!method) return <PaymentIcon />
  const upperMethod = method.toUpperCase()
  if (upperMethod.includes('CASH') || upperMethod.includes('UPI')) {
    return <CashIcon />
  }
  return <CreditCardIcon />
}

/**
 * Props for PaymentsTable component
 */
interface PaymentsTableProps {
  payments: PaymentResponseModel[]
}

/**
 * Payments Table Component
 *
 * Reusable table component for displaying payment history.
 * Used in both PaymentsModal and AddEditPurchaseOrder view page.
 */
const PaymentsTable = ({ payments }: PaymentsTableProps): JSX.Element => {
  const handleDownloadReceipt = async (paymentId: number): Promise<void> => {
    try {
      const response = await paymentApi.downloadPaymentReceipt(paymentId)
      // Create blob from response
      const blob = new Blob([response], { type: 'application/pdf' })
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `payment_receipt_${paymentId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Payment receipt downloaded successfully')
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to download payment receipt'
      toast.error(errorMessage)
      console.error('Download receipt error:', error)
    }
  }

  if (payments.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', padding: 4 }}>
        <Typography variant="body2" color="text.secondary">
          No payments recorded
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer component={Box}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Payment ID</TableCell>
            <TableCell>Method</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="center">Download Receipt</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.paymentId}>
              <TableCell>
                <Typography variant="body2" fontWeight="bold">
                  #{payment.paymentId}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getPaymentMethodIcon(payment.paymentMethod)}
                  <Typography variant="body2">
                    {payment.paymentMethod || payment.paymentGateway || 'N/A'}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight="bold" color="primary">
                  {formatCurrency(payment.amountPaid || (payment.amountPaidPaise || 0) / 100)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={payment.paymentStatus}
                  size="small"
                  color={getPaymentStatusColor(payment.paymentStatus)}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {/* Prioritize capturedAt (actual timestamp) over paymentDate (may be midnight for cash) */}
                  {formatDate(payment.capturedAt || payment.paymentDate || payment.orderCreatedAt)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Tooltip title="Download Payment Receipt">
                  <IconButton
                    onClick={() => handleDownloadReceipt(payment.paymentId!)}
                    color="primary"
                    size="small"
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default PaymentsTable

