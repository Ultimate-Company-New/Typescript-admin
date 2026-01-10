import {
  AccountBalance as BankIcon,
  AttachMoney as CashIcon,
  CreditCard as CreditCardIcon,
  CurrencyRupee as CurrencyIcon,
  Payment as PaymentIcon,
  Percent as PercentIcon,
  QrCode as UpiIcon,
  Wallet as WalletIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { paymentApi, type RazorpayOptions } from "../../api/paymentApi";

// ============================================================================
// Types
// ============================================================================

export interface PaymentModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Purchase order ID to pay for */
  purchaseOrderId: number;
  /** Vendor number for display */
  vendorNumber: string;
  /** Grand total amount */
  grandTotal: number;
  /** Pending amount (remaining to be paid) */
  pendingAmount: number;
  /** Callback when payment is successful */
  onPaymentSuccess: () => void;
  /** Customer name for prefill */
  customerName?: string;
  /** Customer email for prefill */
  customerEmail?: string;
  /** Customer phone for prefill */
  customerPhone?: string;
  /** Whether this is a follow-up payment (skip shipment processing) */
  skipShipmentProcessing?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Payment Modal with Razorpay Integration and Partial Payment Support
 *
 * Features:
 * - Full Payment (Razorpay/Cash)
 * - Partial Payment (Percentage or Fixed Amount, Online/Cash)
 * - Creates Razorpay order via backend
 * - Opens Razorpay checkout modal
 * - Verifies payment after completion
 * - Processes shipments after payment
 */
export const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onClose,
  purchaseOrderId,
  vendorNumber,
  grandTotal,
  pendingAmount,
  onPaymentSuccess,
  customerName,
  customerEmail,
  customerPhone,
  skipShipmentProcessing = false,
}) => {
  const [loading, setLoading] = useState(false);

  // Main tab: Full Payment vs Partial Payment
  const [mainTab, setMainTab] = useState<"full" | "partial">("full");

  // Full Payment tab: Razorpay vs Cash
  const [fullPaymentType, setFullPaymentType] = useState<"razorpay" | "cash">(
    "razorpay"
  );

  // Partial Payment tab: Online vs Cash
  const [partialPaymentType, setPartialPaymentType] = useState<
    "online" | "cash"
  >("online");

  // Partial Payment: Amount input type (percentage or fixed)
  const [partialAmountType, setPartialAmountType] = useState<
    "percentage" | "fixed"
  >("percentage");

  // Partial Payment: Amount input values
  const [partialPercentage, setPartialPercentage] = useState<string>("");
  const [partialFixedAmount, setPartialFixedAmount] = useState<string>("");

  // Cash payment form state (used for both full and partial)
  const [cashPaymentDate, setCashPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [cashPaymentNotes, setCashPaymentNotes] = useState<string>("");
  const [cashPaymentUpiTransactionId, setCashPaymentUpiTransactionId] =
    useState<string>("");

  // Format currency for display
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  }, []);

  // Calculate partial payment amount
  const partialPaymentAmount = useMemo(() => {
    if (mainTab !== "partial") return 0;

    if (partialAmountType === "percentage") {
      const percentage = parseFloat(partialPercentage) || 0;
      return (pendingAmount * percentage) / 100;
    } else {
      return parseFloat(partialFixedAmount) || 0;
    }
  }, [
    mainTab,
    partialAmountType,
    partialPercentage,
    partialFixedAmount,
    pendingAmount,
  ]);

  // Calculate remaining amount after partial payment
  const remainingAfterPartial = useMemo(() => {
    if (mainTab !== "partial") return 0;
    return pendingAmount - partialPaymentAmount;
  }, [mainTab, pendingAmount, partialPaymentAmount]);

  // Validate partial payment amount
  const partialPaymentError = useMemo(() => {
    if (mainTab !== "partial") return null;

    if (partialAmountType === "percentage") {
      const percentage = parseFloat(partialPercentage) || 0;
      if (percentage <= 0) return "Percentage must be greater than 0";
      if (percentage > 100) return "Percentage cannot exceed 100%";
    } else {
      const amount = parseFloat(partialFixedAmount) || 0;
      if (amount <= 0) return "Amount must be greater than 0";
      if (amount > pendingAmount)
        return `Amount cannot exceed pending amount (${formatCurrency(
          pendingAmount
        )})`;
    }

    return null;
  }, [
    mainTab,
    partialAmountType,
    partialPercentage,
    partialFixedAmount,
    pendingAmount,
    formatCurrency,
  ]);

  // Create Razorpay order and open checkout (for full payment)
  const handleProceedToFullPayment = useCallback(async () => {
    setLoading(true);
    try {
      const orderData = skipShipmentProcessing
        ? await paymentApi.createOrderFollowUp({
            purchaseOrderId,
            amount: pendingAmount, // Use pending amount for full payment
            customerName,
            customerEmail,
            customerPhone,
          })
        : await paymentApi.createOrder({
            purchaseOrderId,
            amount: pendingAmount, // Use pending amount for full payment
            customerName,
            customerEmail,
            customerPhone,
          });

      // Immediately open Razorpay checkout
      const options: RazorpayOptions = {
        key: orderData.razorpayKeyId,
        amount: orderData.amountInPaise,
        currency: orderData.currency,
        name: orderData.companyName,
        description: orderData.description,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.prefillName,
          email: orderData.prefillEmail,
          contact: orderData.prefillPhone,
        },
        theme: {
          color: "#1976d2", // MUI primary blue
        },
        handler: async (response) => {
          // Payment successful - process payment (and shipments if not follow-up)
          setLoading(true);
          try {
            const verifyResponse = skipShipmentProcessing
              ? await paymentApi.verifyPaymentFollowUp({
                  purchaseOrderId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                })
              : await paymentApi.processPaymentAndShipments({
                  isCashPayment: false,
                  onlinePaymentRequest: {
                    purchaseOrderId,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                  },
                });

            if (verifyResponse.success) {
              toast.success(
                skipShipmentProcessing
                  ? "Payment successful! Payment recorded."
                  : "Payment successful! Purchase order approved and shipments processed."
              );
              onPaymentSuccess();
              onClose();
            } else {
              toast.error(
                verifyResponse.message || "Payment verification failed"
              );
            }
          } catch (error) {
            toast.error(
              skipShipmentProcessing
                ? "Failed to process payment"
                : "Failed to process payment and shipments"
            );
            console.error("Process payment error:", error);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled");
            setLoading(false);
          },
          escape: true,
          animation: true,
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error("Failed to create payment order");
      console.error("Create order error:", error);
      setLoading(false);
    }
  }, [
    purchaseOrderId,
    pendingAmount,
    customerName,
    customerEmail,
    customerPhone,
    onPaymentSuccess,
    onClose,
    skipShipmentProcessing,
  ]);

  // Handle full cash payment submission
  const handleFullCashPayment = useCallback(async () => {
    if (!cashPaymentDate) {
      toast.error("Payment date is required");
      return;
    }

    setLoading(true);
    try {
      const cashPaymentRequest = {
        purchaseOrderId,
        paymentDate: cashPaymentDate,
        amount: pendingAmount, // Full payment
        notes: cashPaymentNotes || undefined,
        upiTransactionId: cashPaymentUpiTransactionId || undefined,
      };
      console.log("Cash payment request payload:", cashPaymentRequest);

      const response = skipShipmentProcessing
        ? await paymentApi.recordCashPaymentFollowUp(cashPaymentRequest)
        : await paymentApi.processPaymentAndShipments({
            isCashPayment: true,
            cashPaymentRequest,
          });

      if (response.success) {
        toast.success(
          skipShipmentProcessing
            ? "Cash payment recorded successfully! Payment recorded."
            : "Cash payment recorded successfully! Purchase order approved and shipments processed."
        );
        onPaymentSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to record cash payment");
      }
    } catch (error) {
      toast.error("Failed to record cash payment");
      console.error("Cash payment error:", error);
    } finally {
      setLoading(false);
    }
  }, [
    purchaseOrderId,
    pendingAmount,
    cashPaymentDate,
    cashPaymentNotes,
    cashPaymentUpiTransactionId,
    onPaymentSuccess,
    onClose,
    skipShipmentProcessing,
  ]);

  // Handle partial online payment
  const handlePartialOnlinePayment = useCallback(async () => {
    if (partialPaymentError) {
      toast.error(partialPaymentError);
      return;
    }

    setLoading(true);
    try {
      const orderData = skipShipmentProcessing
        ? await paymentApi.createOrderFollowUp({
            purchaseOrderId,
            amount: partialPaymentAmount,
            customerName,
            customerEmail,
            customerPhone,
          })
        : await paymentApi.createOrder({
            purchaseOrderId,
            amount: partialPaymentAmount,
            customerName,
            customerEmail,
            customerPhone,
          });

      const options: RazorpayOptions = {
        key: orderData.razorpayKeyId,
        amount: orderData.amountInPaise,
        currency: orderData.currency,
        name: orderData.companyName,
        description: orderData.description,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.prefillName,
          email: orderData.prefillEmail,
          contact: orderData.prefillPhone,
        },
        theme: {
          color: "#1976d2",
        },
        handler: async (response) => {
          setLoading(true);
          try {
            const verifyResponse = skipShipmentProcessing
              ? await paymentApi.verifyPaymentFollowUp({
                  purchaseOrderId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                })
              : await paymentApi.processPaymentAndShipments({
                  isCashPayment: false,
                  onlinePaymentRequest: {
                    purchaseOrderId,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                  },
                });

            if (verifyResponse.success) {
              toast.success(
                skipShipmentProcessing
                  ? "Partial payment successful! Payment recorded."
                  : "Partial payment successful! Purchase order approved and shipments processed."
              );
              onPaymentSuccess();
              onClose();
            } else {
              toast.error(
                verifyResponse.message || "Payment verification failed"
              );
            }
          } catch (error) {
            toast.error(
              skipShipmentProcessing
                ? "Failed to process payment"
                : "Failed to process payment and shipments"
            );
            console.error("Process payment error:", error);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled");
            setLoading(false);
          },
          escape: true,
          animation: true,
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.details ||
        error?.message ||
        "Failed to create payment order";
      toast.error(errorMessage);
      console.error("Create order error:", error);
      setLoading(false);
    }
  }, [
    purchaseOrderId,
    partialPaymentAmount,
    partialPaymentError,
    customerName,
    customerEmail,
    customerPhone,
    onPaymentSuccess,
    onClose,
    skipShipmentProcessing,
  ]);

  // Handle partial cash payment submission
  const handlePartialCashPayment = useCallback(async () => {
    if (partialPaymentError) {
      toast.error(partialPaymentError);
      return;
    }

    if (!cashPaymentDate) {
      toast.error("Payment date is required");
      return;
    }

    setLoading(true);
    try {
      const cashPaymentRequest = {
        purchaseOrderId,
        paymentDate: cashPaymentDate,
        amount: partialPaymentAmount,
        notes: cashPaymentNotes || undefined,
        upiTransactionId: cashPaymentUpiTransactionId || undefined,
      };

      const response = skipShipmentProcessing
        ? await paymentApi.recordCashPaymentFollowUp(cashPaymentRequest)
        : await paymentApi.processPaymentAndShipments({
            isCashPayment: true,
            cashPaymentRequest,
          });

      if (response.success) {
        toast.success(
          skipShipmentProcessing
            ? "Partial cash payment recorded successfully! Payment recorded."
            : "Partial cash payment recorded successfully! Purchase order approved and shipments processed."
        );
        onPaymentSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to record cash payment");
      }
    } catch (error) {
      toast.error("Failed to record cash payment");
      console.error("Cash payment error:", error);
    } finally {
      setLoading(false);
    }
  }, [
    purchaseOrderId,
    partialPaymentAmount,
    partialPaymentError,
    cashPaymentDate,
    cashPaymentNotes,
    cashPaymentUpiTransactionId,
    onPaymentSuccess,
    onClose,
    skipShipmentProcessing,
  ]);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    if (!loading) {
      setMainTab("full");
      setFullPaymentType("razorpay");
      setPartialPaymentType("online");
      setPartialAmountType("percentage");
      setPartialPercentage("");
      setPartialFixedAmount("");
      setCashPaymentDate(new Date().toISOString().split("T")[0]);
      setCashPaymentNotes("");
      setCashPaymentUpiTransactionId("");
      onClose();
    }
  }, [loading, onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <PaymentIcon color="primary" />
        <Typography variant="h6">Payment for Purchase Order</Typography>
      </DialogTitle>

      <DialogContent dividers>
        {/* Order Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Purchase Order
          </Typography>
          <Typography variant="h5" fontWeight="bold">
            #{purchaseOrderId} ({vendorNumber})
          </Typography>
          <Box
            sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 0.5 }}
          >
            <Typography variant="body1" color="text.secondary">
              Grand Total: <strong>{formatCurrency(grandTotal)}</strong>
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Pending Amount: <strong>{formatCurrency(pendingAmount)}</strong>
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Main Tabs: Full Payment vs Partial Payment */}
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={mainTab}
            onChange={(_, newValue) => setMainTab(newValue)}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Full Payment" value="full" />
            <Tab
              label="Partial Payment"
              value="partial"
              disabled={pendingAmount <= 0}
            />
          </Tabs>
          {pendingAmount <= 0 && (
            <Alert severity="info" sx={{ mt: 1 }}>
              This purchase order is fully paid. No partial payment needed.
            </Alert>
          )}
        </Box>

        {/* Full Payment Tab Content */}
        {mainTab === "full" && (
          <Box>
            {/* Payment Type Selection - Card Based */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Select Payment Method
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                {/* Online Payment Card */}
                <Card
                  onClick={() => setFullPaymentType("razorpay")}
                  sx={{
                    flex: 1,
                    cursor: "pointer",
                    border: fullPaymentType === "razorpay" ? 2 : 1,
                    borderColor:
                      fullPaymentType === "razorpay"
                        ? "primary.main"
                        : "divider",
                    bgcolor:
                      fullPaymentType === "razorpay"
                        ? "action.selected"
                        : "background.paper",
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 3 }}>
                    <CreditCardIcon
                      sx={{
                        fontSize: 48,
                        color:
                          fullPaymentType === "razorpay"
                            ? "primary.main"
                            : "text.secondary",
                        mb: 1,
                      }}
                    />
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Online Payment
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Credit/Debit Card, UPI, Net Banking, Wallets
                    </Typography>
                  </CardContent>
                </Card>

                {/* Cash Payment Card */}
                <Card
                  onClick={() => setFullPaymentType("cash")}
                  sx={{
                    flex: 1,
                    cursor: "pointer",
                    border: fullPaymentType === "cash" ? 2 : 1,
                    borderColor:
                      fullPaymentType === "cash" ? "success.main" : "divider",
                    bgcolor:
                      fullPaymentType === "cash"
                        ? "success.light"
                        : "background.paper",
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: "success.main",
                      bgcolor: "success.light",
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 3 }}>
                    <CashIcon
                      sx={{
                        fontSize: 48,
                        color:
                          fullPaymentType === "cash"
                            ? "success.main"
                            : "text.secondary",
                        mb: 1,
                      }}
                    />
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Cash Payment
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Record cash or UPI transaction
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Razorpay Payment Section */}
            {fullPaymentType === "razorpay" && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Payment Details
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                    mb: 2,
                    mt: 2,
                  }}
                >
                  <Chip
                    icon={<CreditCardIcon />}
                    label="Credit/Debit Card"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<UpiIcon />}
                    label="UPI"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<BankIcon />}
                    label="Net Banking"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<WalletIcon />}
                    label="Wallets"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Amount to Pay:</strong>{" "}
                    {formatCurrency(pendingAmount)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    You will be redirected to Razorpay checkout to complete the
                    payment securely.
                  </Typography>
                </Alert>
              </Box>
            )}

            {/* Cash Payment Form */}
            {fullPaymentType === "cash" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Payment Details
                </Typography>
                <Alert severity="success" sx={{ mb: 1 }}>
                  Recording full payment of{" "}
                  <strong>{formatCurrency(pendingAmount)}</strong>
                </Alert>
                <TextField
                  label="Payment Date Received"
                  type="date"
                  value={cashPaymentDate}
                  onChange={(e) => setCashPaymentDate(e.target.value)}
                  required
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <TextField
                  label="UPI Transaction ID (Optional)"
                  value={cashPaymentUpiTransactionId}
                  onChange={(e) =>
                    setCashPaymentUpiTransactionId(e.target.value)
                  }
                  fullWidth
                  placeholder="If payment was made via UPI, enter transaction ID"
                  helperText="Leave blank if payment was made in cash"
                />

                <TextField
                  label="Notes (Optional)"
                  value={cashPaymentNotes}
                  onChange={(e) => setCashPaymentNotes(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Additional notes about this payment..."
                />
              </Box>
            )}
          </Box>
        )}

        {/* Partial Payment Tab Content */}
        {mainTab === "partial" && (
          <Box>
            {/* Payment Type Toggle (Online/Cash) */}
            <Box sx={{ mb: 3 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Payment Type</FormLabel>
                <RadioGroup
                  row
                  value={partialPaymentType}
                  onChange={(e) =>
                    setPartialPaymentType(e.target.value as "online" | "cash")
                  }
                >
                  <FormControlLabel
                    value="online"
                    control={<Radio />}
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CreditCardIcon fontSize="small" />
                        <span>Online</span>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="cash"
                    control={<Radio />}
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CashIcon fontSize="small" />
                        <span>Cash</span>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            {/* Amount Input Type (Percentage/Fixed) */}
            <Box sx={{ mb: 3 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Amount Input</FormLabel>
                <RadioGroup
                  value={partialAmountType}
                  onChange={(e) => {
                    setPartialAmountType(
                      e.target.value as "percentage" | "fixed"
                    );
                    setPartialPercentage("");
                    setPartialFixedAmount("");
                  }}
                >
                  <FormControlLabel
                    value="percentage"
                    control={<Radio />}
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <PercentIcon fontSize="small" />
                        <span>Percentage</span>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="fixed"
                    control={<Radio />}
                    label={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <CurrencyIcon fontSize="small" />
                        <span>Fixed Amount</span>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            {/* Amount Input Field */}
            <Box sx={{ mb: 3 }}>
              {partialAmountType === "percentage" ? (
                <TextField
                  label="Percentage of Pending Amount"
                  type="number"
                  value={partialPercentage}
                  onChange={(e) => setPartialPercentage(e.target.value)}
                  required
                  fullWidth
                  inputProps={{
                    min: 0,
                    max: 100,
                    step: 0.01,
                  }}
                  InputProps={{
                    endAdornment: <Typography>%</Typography>,
                  }}
                  helperText={`of ${formatCurrency(pendingAmount)}`}
                  error={!!partialPaymentError}
                />
              ) : (
                <TextField
                  label="Fixed Amount"
                  type="number"
                  value={partialFixedAmount}
                  onChange={(e) => setPartialFixedAmount(e.target.value)}
                  required
                  fullWidth
                  inputProps={{
                    min: 0,
                    max: pendingAmount,
                    step: 0.01,
                  }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
                  }}
                  helperText={`Maximum: ${formatCurrency(pendingAmount)}`}
                  error={!!partialPaymentError}
                />
              )}
              {partialPaymentError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {partialPaymentError}
                </Alert>
              )}
            </Box>

            {/* Payment Summary */}
            <Box
              sx={{
                mb: 3,
                p: 2,
                bgcolor: "background.paper",
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Payment Summary
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  mt: 1,
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Grand Total:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(grandTotal)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Amount to Pay:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {formatCurrency(partialPaymentAmount)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Remaining:
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color={
                      remainingAfterPartial > 0
                        ? "warning.main"
                        : "success.main"
                    }
                  >
                    {formatCurrency(remainingAfterPartial)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Cash Payment Fields (if Cash selected) */}
            {partialPaymentType === "cash" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  label="Payment Date Received"
                  type="date"
                  value={cashPaymentDate}
                  onChange={(e) => setCashPaymentDate(e.target.value)}
                  required
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />

                <TextField
                  label="UPI Transaction ID (Optional)"
                  value={cashPaymentUpiTransactionId}
                  onChange={(e) =>
                    setCashPaymentUpiTransactionId(e.target.value)
                  }
                  fullWidth
                  placeholder="If payment was made via UPI, enter transaction ID"
                />

                <TextField
                  label="Notes (Optional)"
                  value={cashPaymentNotes}
                  onChange={(e) => setCashPaymentNotes(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Additional notes about this payment..."
                />
              </Box>
            )}

            {/* Online Payment Info (if Online selected) */}
            {partialPaymentType === "online" && (
              <Alert severity="info">
                You will be redirected to Razorpay checkout to complete the
                payment of {formatCurrency(partialPaymentAmount)}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Cancel
        </Button>

        {/* Full Payment Actions */}
        {mainTab === "full" && (
          <>
            {fullPaymentType === "razorpay" ? (
              <Button
                onClick={handleProceedToFullPayment}
                variant="contained"
                disabled={loading}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <PaymentIcon />
                }
              >
                {loading ? "Processing..." : "Proceed to Payment"}
              </Button>
            ) : (
              <Button
                onClick={handleFullCashPayment}
                variant="contained"
                color="success"
                disabled={loading}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <CashIcon />
                }
              >
                {loading ? "Recording..." : "Record Cash Payment"}
              </Button>
            )}
          </>
        )}

        {/* Partial Payment Actions */}
        {mainTab === "partial" && (
          <>
            {partialPaymentType === "online" ? (
              <Button
                onClick={handlePartialOnlinePayment}
                variant="contained"
                disabled={
                  loading || !!partialPaymentError || partialPaymentAmount <= 0
                }
                startIcon={
                  loading ? <CircularProgress size={20} /> : <PaymentIcon />
                }
              >
                {loading ? "Processing..." : "Proceed to Payment"}
              </Button>
            ) : (
              <Button
                onClick={handlePartialCashPayment}
                variant="contained"
                color="success"
                disabled={
                  loading || !!partialPaymentError || partialPaymentAmount <= 0
                }
                startIcon={
                  loading ? <CircularProgress size={20} /> : <CashIcon />
                }
              >
                {loading ? "Recording..." : "Record Cash Payment"}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PaymentModal;
