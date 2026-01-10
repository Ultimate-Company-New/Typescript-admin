import axiosInstance from './axiosConfig'

/**
 * Request model for creating a Razorpay order
 */
export interface RazorpayOrderRequest {
  purchaseOrderId: number
  amount?: number // Optional - will use order summary grand total if not provided
  customerName?: string
  customerEmail?: string
  customerPhone?: string
}

/**
 * Response model from createOrder endpoint
 */
export interface RazorpayOrderResponse {
  orderId: string
  amount: number
  amountInPaise: number
  currency: string
  razorpayKeyId: string
  vendorNumber: string
  purchaseOrderId: number
  companyName: string
  description: string
  prefillName?: string
  prefillEmail?: string
  prefillPhone?: string
}

/**
 * Request model for verifying a payment
 */
export interface RazorpayVerifyRequest {
  purchaseOrderId: number
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

/**
 * Response model from verifyPayment endpoint
 */
export interface PaymentVerificationResponse {
  success: boolean
  message: string
  paymentId?: string
  purchaseOrderId?: number
  purchaseOrderStatus?: string
}

/**
 * Request model for recording a cash payment
 */
export interface CashPaymentRequest {
  purchaseOrderId: number
  paymentDate: string // ISO date string (YYYY-MM-DD)
  amount: number
  notes?: string
  upiTransactionId?: string
}

/**
 * Request model for processing payment and shipments.
 * Matches ProcessPaymentAndShipmentRequestModel in the backend.
 *
 * This endpoint handles the complete flow:
 * - Validates product and package availability
 * - Processes payment (online or cash)
 * - Updates inventory
 * - Creates ShipRocket orders
 * - Updates PO status
 *
 * @property isCashPayment - Whether this is a cash payment (true) or online payment (false)
 * @property cashPaymentRequest - Required if isCashPayment is true
 * @property onlinePaymentRequest - Required if isCashPayment is false
 */
export interface ProcessPaymentAndShipmentRequest {
  isCashPayment: boolean
  cashPaymentRequest?: CashPaymentRequest // Required when isCashPayment is true
  onlinePaymentRequest?: RazorpayVerifyRequest // Required when isCashPayment is false
}

/**
 * Razorpay Checkout options
 */
export interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  notes?: Record<string, string>
  theme?: {
    color?: string
  }
  handler: (response: RazorpayPaymentResponse) => void
  modal?: {
    ondismiss?: () => void
    escape?: boolean
    animation?: boolean
  }
}

/**
 * Razorpay payment response after successful payment
 */
export interface RazorpayPaymentResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

/**
 * Test card data for development mode
 */
export interface TestCard {
  name: string
  number: string
  cvv: string
  expiry: string
  description: string
  willSucceed: boolean
}

/**
 * Available test cards for Razorpay test mode
 */
export const RAZORPAY_TEST_CARDS: TestCard[] = [
  {
    name: 'Visa (Success)',
    number: '4111 1111 1111 1111',
    cvv: '123',
    expiry: '12/28',
    description: 'Standard Visa card - Payment will succeed',
    willSucceed: true,
  },
  {
    name: 'Mastercard (Success)',
    number: '5267 3181 8797 5449',
    cvv: '123',
    expiry: '12/28',
    description: 'Standard Mastercard - Payment will succeed',
    willSucceed: true,
  },
  {
    name: 'Failed Payment',
    number: '4000 0000 0000 0002',
    cvv: '123',
    expiry: '12/28',
    description: 'This card will always fail',
    willSucceed: false,
  },
  {
    name: 'International Card',
    number: '4000 0000 0000 0010',
    cvv: '123',
    expiry: '12/28',
    description: 'International card for testing',
    willSucceed: true,
  },
]

/**
 * Test UPI ID for Razorpay test mode
 */
export const RAZORPAY_TEST_UPI = 'success@razorpay'

/**
 * Test Net Banking OTP
 */
export const RAZORPAY_TEST_OTP = '1234'

const API_BASE_URL = '/Payment'

/**
 * Payment API Service
 * Handles Razorpay payment integration
 */
export const paymentApi = {
  /**
   * Creates a Razorpay order for a purchase order
   * @param request Order creation request
   * @returns Razorpay order details for checkout
   */
  createOrder: async (request: RazorpayOrderRequest): Promise<RazorpayOrderResponse> => {
    const response = await axiosInstance.post<RazorpayOrderResponse>(
      `${API_BASE_URL}/createOrder`,
      request
    )
    return response.data
  },

  /**
   * Creates a Razorpay order for a follow-up payment (order already approved/partially paid).
   * This endpoint allows orders with APPROVED or APPROVED_WITH_PARTIAL_PAYMENT status.
   * @param request Order creation request
   * @returns Razorpay order details for checkout
   */
  createOrderFollowUp: async (request: RazorpayOrderRequest): Promise<RazorpayOrderResponse> => {
    const response = await axiosInstance.post<RazorpayOrderResponse>(
      `${API_BASE_URL}/createOrderFollowUp`,
      request
    )
    return response.data
  },

  /**
   * Verifies a Razorpay payment after completion
   * @param request Payment verification request
   * @returns Verification result
   */
  verifyPayment: async (request: RazorpayVerifyRequest): Promise<PaymentVerificationResponse> => {
    const response = await axiosInstance.post<PaymentVerificationResponse>(
      `${API_BASE_URL}/verifyPayment`,
      request
    )
    return response.data
  },

  /**
   * Gets the Razorpay Key ID (public key)
   * @returns Razorpay Key ID string
   */
  getRazorpayKeyId: async (): Promise<string> => {
    const response = await axiosInstance.get<string>(`${API_BASE_URL}/getRazorpayKeyId`)
    return response.data
  },

  /**
   * Records a cash payment for a purchase order
   * @param request Cash payment details
   * @returns Payment verification response
   */
  recordCashPayment: async (request: CashPaymentRequest): Promise<PaymentVerificationResponse> => {
    const response = await axiosInstance.post<PaymentVerificationResponse>(
      `${API_BASE_URL}/recordCashPayment`,
      request
    )
    return response.data
  },

  /**
   * Processes payment and shipments for a purchase order
   * This endpoint handles the complete flow:
   * - Validates product and package availability
   * - Processes payment (online or cash)
   * - Updates inventory
   * - Creates ShipRocket orders
   * - Updates PO status
   * @param request Payment and shipment processing request
   * @returns Payment verification response
   */
  processPaymentAndShipments: async (request: ProcessPaymentAndShipmentRequest): Promise<PaymentVerificationResponse> => {
    const response = await axiosInstance.post<PaymentVerificationResponse>(
      `${API_BASE_URL}/processPaymentAndShipments`,
      request
    )
    return response.data
  },

  /**
   * Verifies a Razorpay payment for a follow-up payment (order already approved/partially paid).
   * This endpoint allows payments for APPROVED or APPROVED_WITH_PARTIAL_PAYMENT orders.
   * Does NOT trigger shipment processing (shipments already created).
   * @param request Payment verification request
   * @returns Verification result
   */
  verifyPaymentFollowUp: async (request: RazorpayVerifyRequest): Promise<PaymentVerificationResponse> => {
    const response = await axiosInstance.post<PaymentVerificationResponse>(
      `${API_BASE_URL}/verifyPaymentFollowUp`,
      request
    )
    return response.data
  },

  /**
   * Records a cash/manual payment for a follow-up payment (order already approved/partially paid).
   * This endpoint allows payments for APPROVED or APPROVED_WITH_PARTIAL_PAYMENT orders.
   * Does NOT trigger shipment processing (shipments already created).
   * @param request Cash payment details
   * @returns Payment verification response
   */
  recordCashPaymentFollowUp: async (request: CashPaymentRequest): Promise<PaymentVerificationResponse> => {
    const response = await axiosInstance.post<PaymentVerificationResponse>(
      `${API_BASE_URL}/recordCashPaymentFollowUp`,
      request
    )
    return response.data
  },

  /**
   * Downloads a PDF receipt for a payment.
   * @param paymentId The ID of the payment to download receipt for
   * @returns PDF file as Blob/ArrayBuffer
   */
  downloadPaymentReceipt: async (paymentId: number): Promise<ArrayBuffer> => {
    const response = await axiosInstance.get(`${API_BASE_URL}/downloadPaymentReceipt/${paymentId}`, {
      responseType: 'arraybuffer',
    })
    return response.data
  },
}

export default paymentApi

