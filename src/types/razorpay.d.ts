/**
 * TypeScript declarations for Razorpay Checkout
 */

interface RazorpayPaymentResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

interface RazorpayPrefill {
  name?: string
  email?: string
  contact?: string
  method?: 'card' | 'netbanking' | 'wallet' | 'emi' | 'upi'
}

interface RazorpayTheme {
  color?: string
  backdrop_color?: string
  hide_topbar?: boolean
}

interface RazorpayModal {
  ondismiss?: () => void
  escape?: boolean
  animation?: boolean
  backdropclose?: boolean
  confirm_close?: boolean
}

interface RazorpayNotes {
  [key: string]: string
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description?: string
  image?: string
  order_id: string
  prefill?: RazorpayPrefill
  notes?: RazorpayNotes
  theme?: RazorpayTheme
  modal?: RazorpayModal
  handler: (response: RazorpayPaymentResponse) => void
  callback_url?: string
  redirect?: boolean
  customer_id?: string
  remember_customer?: boolean
  recurring?: boolean
  subscription_id?: string
  subscription_card_change?: boolean
  display_currency?: string
  display_amount?: string
}

interface RazorpayInstance {
  open: () => void
  close: () => void
  on: (event: string, callback: () => void) => void
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance
}

interface Window {
  Razorpay: RazorpayConstructor
}

