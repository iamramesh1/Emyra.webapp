import { useCallback, useEffect, useRef, useState } from "react";
import { FaTimes, FaSpinner, FaLock, FaCreditCard, FaQrcode } from "react-icons/fa";
import paymentService from "../../../services/paymentService";
import { openRazorpayCheckout } from "../../../shared/utils/razorpay";
import env from "../../../config/env";

function responseData(response) {
  let data = response?.data ?? response;
  while (data && typeof data === "object" && !Array.isArray(data)) {
    if (data.success === false || data.Success === false) {
      throw new Error(data.message ?? data.Message ?? "The payment request failed.");
    }
    const nested = data.data ?? data.Data;
    if (nested === undefined || nested === data) break;
    data = nested;
  }
  return data;
}

function isVerified(response) {
  const result = responseData(response);
  return result?.verified === true || result?.Verified === true;
}

function isPaid(response) {
  const result = responseData(response);
  const status = String(
    result?.paymentStatus ?? result?.PaymentStatus ?? result?.status ?? result?.Status ?? ""
  ).toLowerCase();
  return result?.paid === true || result?.Paid === true ||
    ["paid", "success", "successful", "captured", "completed"].includes(status);
}

const PaymentModel = ({ orderId, amount = 0, customer, onSuccess, onClose }) => {
  const [status, setStatus] = useState("ready");
  const [qr, setQr] = useState(null);
  const [error, setError] = useState("");
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const startCheckout = useCallback(async () => {
    setStatus("processing");
    setError("");
    try {
      const order = responseData(await paymentService.createRazorpayOrder({ orderId, amount }));
      const razorpayOrderId = order?.razorpayOrderId ?? order?.RazorpayOrderId ?? order?.id;
      const keyId = order?.keyId ?? order?.KeyId ?? env.RAZORPAY_KEY_ID;
      if (!razorpayOrderId || !keyId) {
        throw new Error("The payment service did not return a valid Razorpay order.");
      }

      const result = await openRazorpayCheckout({
        keyId,
        razorpayOrderId,
        amount,
        name: "EMYRA Enterprises",
        description: `Payment for Order #${orderId}`,
        customer,
      });
      const verification = await paymentService.verifyRazorpayPayment({
        orderId,
        razorpayOrderId: result.razorpay_order_id,
        razorpayPaymentId: result.razorpay_payment_id,
        razorpaySignature: result.razorpay_signature,
      });
      if (!isVerified(verification)) {
        throw new Error("Payment could not be verified by the server. Do not retry if your bank was charged; contact support.");
      }
      onSuccessRef.current(result.razorpay_payment_id);
    } catch (err) {
      setError(err?.response?.data?.message ?? err.message ?? "Could not start Razorpay Checkout.");
      setStatus("ready");
    }
  }, [orderId, amount, customer]);

  const startQrPayment = async () => {
    setStatus("processing");
    setError("");
    try {
      const result = responseData(await paymentService.createRazorpayQr({ orderId, amount }));
      const imageUrl = result?.imageUrl ?? result?.ImageUrl ?? result?.image_url ??
        result?.qrCodeImageUrl ?? result?.QrCodeImageUrl;
      const qrCodeId = result?.qrCodeId ?? result?.QrCodeId ?? result?.id ?? result?.Id;
      if (!imageUrl || !qrCodeId) {
        throw new Error("The QR service must return both a QR image URL and QR code ID.");
      }
      setQr({ imageUrl, qrCodeId });
      setStatus("qr");
    } catch (err) {
      setError(err?.response?.data?.message ?? err.message ?? "Could not generate a payment QR code.");
      setStatus("ready");
    }
  };

  useEffect(() => {
    if (status !== "qr" || !qr?.qrCodeId) return undefined;
    let active = true;
    const pollStatus = async () => {
      try {
        const result = await paymentService.getRazorpayQrStatus(qr.qrCodeId);
        if (active && isPaid(result)) {
          active = false;
          onSuccessRef.current(
            responseData(result)?.paymentId ??
            responseData(result)?.PaymentId ??
            responseData(result)?.razorpayPaymentId ??
            responseData(result)?.RazorpayPaymentId ??
            qr.qrCodeId
          );
        }
      } catch (err) {
        if (active) {
          setError(err?.response?.data?.message ?? "Could not check payment status. Please retry.");
        }
      }
    };
    pollStatus();
    const timer = window.setInterval(pollStatus, 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [status, qr]);

  const busy = status === "processing";

  return (
    <div style={overlayStyle} onClick={(event) => {
      if (event.target === event.currentTarget && !busy) onClose();
    }}>
      <div style={modalStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>Pay ₹{Number(amount).toFixed(2)}</h3>
          {!busy && (
            <button type="button" onClick={onClose} style={closeBtnStyle} aria-label="Close payment dialog">
              <FaTimes size={18} />
            </button>
          )}
        </div>

        {busy ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <FaSpinner className="spin" size={28} style={{ color: "var(--accent, #d97757)" }} />
            <p style={{ marginTop: 16, color: "#555" }}>Connecting securely to Razorpay…</p>
          </div>
        ) : (
          <>
            {error && <div role="alert" style={errorStyle}>{error}</div>}
            {status === "qr" && qr ? (
              <div style={{ textAlign: "center" }}>
                <p>Scan this single-use UPI QR with your payment app. This page will update after payment is confirmed.</p>
                <img src={qr.imageUrl} alt="Razorpay payment QR code" style={{ display: "block", width: 240, maxWidth: "100%", margin: "16px auto" }} />
                <p style={{ color: "#666", fontSize: 13 }}>Waiting for secure payment confirmation…</p>
                <button type="button" onClick={startQrPayment} style={secondaryBtnStyle}>
                  Generate a new QR
                </button>
              </div>
            ) : (
              <>
                <p style={{ color: "#555", marginTop: 0 }}> payment method.</p>
                <button type="button" onClick={startCheckout} style={payBtnStyle}>
                  <FaCreditCard /> Pay by Card, UPI or Netbanking
                </button>
                {/* <button type="button" onClick={startQrPayment} style={secondaryBtnStyle}>
                  <FaQrcode /> Generate UPI QR Code
                </button> */}
                <div style={secureNoteStyle}><FaLock /> Payment is confirmed by the server before your order is marked paid.</div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};
const modalStyle = { background: "white", borderRadius: 12, padding: 28, width: 440, maxWidth: "92vw" };
const closeBtnStyle = { background: "transparent", border: "none", cursor: "pointer" };
const errorStyle = { color: "#b42318", background: "#fff1f0", border: "1px solid #fecdca", borderRadius: 8, padding: 12, fontSize: 13, marginBottom: 14 };
const payBtnStyle = {
  width: "100%", padding: 14, borderRadius: 8, border: "none", background: "#d97757",
  color: "white", fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center",
  justifyContent: "center", gap: 8, cursor: "pointer",
};
const secondaryBtnStyle = {
  width: "100%", marginTop: 10, padding: 13, borderRadius: 8, border: "1px solid #ddd",
  background: "white", color: "#222", fontWeight: 600, fontSize: 14, display: "flex",
  alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer",
};
const secureNoteStyle = { display: "flex", alignItems: "center", gap: 8, color: "#666", fontSize: 12, marginTop: 18 };

export default PaymentModel;
