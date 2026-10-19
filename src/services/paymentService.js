// =====================================================================
// PAYMENT SERVICE
// Backed by the real PaymentController (Ecom.AgentSolution.API):
//   POST /api/Payment/Create             create a payment (COD / completed online)
//   GET  /api/Payment/order/{orderId}    latest payment for an order
//   POST /api/Payment/razorpay/order     create a Razorpay order
//   POST /api/Payment/razorpay/verify    verify a Razorpay payment
//   POST /api/Payment/razorpay/qr       create a single-use UPI QR code
//   GET  /api/Payment/razorpay/qr/{id}/status  webhook-backed QR status
//
// Handles both payment modes the storefront supports:
//   - COD      : just records a PENDING payment row against the order
//   - RAZORPAY : standard Razorpay "Orders API" checkout flow
//                1. createRazorpayOrder(orderId, amount)  -> { razorpayOrderId, keyId, amount, currency }
//                2. open Razorpay Checkout.js with that razorpayOrderId
//                3. verifyRazorpayPayment({...}) confirms the signature
//                   AND marks the order paid, server-side, in one call.
// =====================================================================

import { digitalApi as api } from "./apiInstances";

// digitalApi's baseURL already ends in "/api"; PaymentController's route
// is "api/[controller]" -> the path appended here is just "/Payment".
const PAYMENT_BASE = "/Payment";
const unwrap = (res) => res?.data ?? res;

const paymentService = {
  /** Records a payment against an order. Used for pending COD payments. */
  createPayment: async ({ orderId, paymentMethod, paymentStatus, transactionId, amount }) =>
    unwrap(
      await api.post(`${PAYMENT_BASE}/Create`, {
        OrderId: orderId,
        PaymentMethod: paymentMethod, // "COD" | "RAZORPAY"
        PaymentStatus: paymentStatus, // "PENDING" | "SUCCESS" | "FAILED"
        TransactionId: transactionId ?? null,
        Amount: amount,
      })
    ),

  getPaymentByOrder: async (orderId) => unwrap(await api.get(`${PAYMENT_BASE}/order/${orderId}`)),

  // ── Razorpay ────────────────────────────────────────────────────────

  /**
   * Ask the backend to create a Razorpay Order for the given amount and
   * return the Razorpay order id + the public key id to open Checkout.js
   * with. Never create the Razorpay order client-side - the amount is
   * set/verified server-side to prevent tampering.
   */
  createRazorpayOrder: async ({ orderId, amount }) =>
    unwrap(
      await api.post(`${PAYMENT_BASE}/razorpay/order`, {
        OrderId: orderId,
        Amount: amount, // rupees; backend converts to paise
      })
    ),

  /**
   * Send the razorpay_payment_id / razorpay_order_id / razorpay_signature
   * returned by Checkout.js's success handler to the backend, which
   * recomputes the HMAC signature and - only if it matches - marks the
   * payment AND the order as paid. This is the step that actually
   * confirms money moved; never trust the client success callback alone.
   */
  verifyRazorpayPayment: async ({ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) =>
    unwrap(
      await api.post(`${PAYMENT_BASE}/razorpay/verify`, {
        OrderId: orderId,
        RazorpayOrderId: razorpayOrderId,
        RazorpayPaymentId: razorpayPaymentId,
        RazorpaySignature: razorpaySignature,
      })
    ),

  createRazorpayQr: async ({ orderId, amount }) =>
    unwrap(
      await api.post(`${PAYMENT_BASE}/razorpay/qr`, {
        OrderId: orderId,
        Amount: amount,
      })
    ),

  getRazorpayQrStatus: async (qrCodeId) =>
    unwrap(await api.get(`${PAYMENT_BASE}/razorpay/qr/${encodeURIComponent(qrCodeId)}/status`)),
};

export default paymentService;
