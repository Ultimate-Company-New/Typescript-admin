import { AccountBalance, Close as CloseIcon } from '@mui/icons-material'
import { Box, Dialog, DialogContent, IconButton } from '@mui/material'

import { type OrderSummaryResponseData } from '../../../models/api-models'
import { Subheader } from '../../../components/fonts'
import styles from '../../../styles/PurchaseOrders.module.scss'

import GrandTotalSummary from './GrandTotalSummary'

interface FinancialsModalProps {
  open: boolean
  onClose: () => void
  orderSummary: OrderSummaryResponseData
  shipmentsCount: number
}

/**
 * Financials Modal Component
 * Displays order financial summary using GrandTotalSummary component
 */
const FinancialsModal = ({ open, onClose, orderSummary, shipmentsCount }: FinancialsModalProps): JSX.Element => {
  // Calculate grand totals from orderSummary
  const grandTotals = {
    grossSubtotal: orderSummary.productsSubtotal ?? 0,
    subtotal: (orderSummary.productsSubtotal ?? 0) - (orderSummary.totalDiscount ?? 0),
    discount: orderSummary.totalDiscount ?? 0,
    packaging: orderSummary.packagingFee ?? 0,
    shipping: orderSummary.totalShipping ?? 0,
    total: orderSummary.grandTotal ?? 0,
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: styles['shipping-optimization-modal__paper'],
      }}
    >
      <Box className={styles['shipping-optimization-modal__title']}>
        <Box className={styles['shipping-optimization-modal__title-left']}>
          <AccountBalance color="primary" />
          <Subheader variant="h6" label="Order Financials" />
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent className={styles['shipping-optimization-modal__dialog-content']}>
        <Box sx={{ p: 2 }}>
          <GrandTotalSummary
            grandTotals={grandTotals}
            totalPackagingCost={orderSummary.packagingFee ?? 0}
            totalShippingCost={orderSummary.totalShipping ?? 0}
            shippingCalculated={true}
            hasShippingData={shipmentsCount > 0}
            serviceFee={orderSummary.serviceFee ?? 0}
            isView={true}
            disabled={true}
          />
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default FinancialsModal

