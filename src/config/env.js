const env = {

  ENV:
    import.meta.env.VITE_ENV ||

    "development",

  AGENT_API_URL:
    import.meta.env.VITE_AGENT_API_URL ||

    "https://localhost:7254/api",

  USER_API_URL:
    import.meta.env.VITE_USER_API_URL ||

    "https://localhost:7101/api",

  DIGITAL_API_URL:
    import.meta.env.VITE_DIGITAL_API_URL ||

    "https://localhost:7254/api",

  // Razorpay PUBLIC key id (starts with "rzp_test_" or "rzp_live_").
  // Safe to expose on the client; the secret key stays server-side only.
  // The server may also return the public key ID when it creates an order.
  RAZORPAY_KEY_ID:
    import.meta.env.VITE_RAZORPAY_KEY_ID || "",
};

export default env;