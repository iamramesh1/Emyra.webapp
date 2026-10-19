// =====================================================================
// Small helper around Razorpay's Checkout.js widget.
// Loads the SDK once, then opens the checkout modal wrapped in a Promise
// so calling code can simply `await openRazorpayCheckout(options)`.
// =====================================================================

const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise = null;

export const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = RAZORPAY_SRC;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  return scriptPromise;
};

/**
 * Opens the Razorpay Checkout modal.
 * @param {Object} opts
 * @param {string} opts.keyId - Razorpay public key id
 * @param {string} opts.razorpayOrderId - order id returned by paymentService.createRazorpayOrder
 * @param {number} opts.amount - amount in rupees (converted to paise here)
 * @param {string} [opts.name] - shown in the checkout header
 * @param {string} [opts.description]
 * @param {{name, email, contact}} [opts.customer]
 * @returns {Promise<{razorpay_payment_id, razorpay_order_id, razorpay_signature}>}
 */
export const openRazorpayCheckout = async (opts) => {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error("Could not load the Razorpay checkout script. Check your internet connection.");
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: opts.keyId,
      amount: Math.round(Number(opts.amount) * 100),
      currency: "INR",
      name: opts.name || "Order Payment",
      description: opts.description || "Payment for your order",
      order_id: opts.razorpayOrderId,
      prefill: {
        name: opts.customer?.name || "",
        email: opts.customer?.email || "",
        contact: opts.customer?.contact || "",
      },
      theme: { color: "#d97757" },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled.")),
      },
    });

    rzp.on("payment.failed", (response) => {
      reject(new Error(response?.error?.description || "Payment failed."));
    });

    rzp.open();
  });
};
