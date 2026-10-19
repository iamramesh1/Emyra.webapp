const API_ENDPOINTS = {

  AUTH: {
    LOGIN: "/Auth/Login",
    SIGNUP_REQUEST_OTP: "/Auth/SignupRequestOtp",
    SIGNUP_VERIFY_OTP: "/Auth/VerifyOtp",
    PASSWORD_RESET_REQUEST_OTP: "/Auth/ForgotPasswordRequestOtp",
    PASSWORD_RESET: "/Auth/ForgotPasswordReset",
    CHANGE_PASSWORD: "/Auth/ChangePassword",
    REFRESH: "/auth/refresh-token",
  },

  USERS: {
    GET_ALL: "/Auth/GetAllUsers",
    GET_BY_ID: "/Auth/GetById",
    CREATE: "/Auth/Register",
    UPDATE: "/Auth/Update",
    DELETE: "/Auth/Delete",
  },

  ROLES: {
    GET_ALL: "/Role/GetAll",
    GET_BY_ID: "/Role/GetById",
    CREATE: "/Role/Create",
    UPDATE: "/Role/Update",
    DELETE: "/Role/Delete",
  },

  PRODUCTS: {
    GET_ALL: "/products",
  },

};

export default API_ENDPOINTS;