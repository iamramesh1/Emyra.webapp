import { userApi } from "../../services/api";
import API_ENDPOINTS from "../../config/apiEndpoints";

const unwrapResponse = (response) => {
  const body = response?.data ?? response;
  if (body?.success === false || body?.Success === false) {
    throw new Error(body.message ?? body.Message ?? "The authentication request failed.");
  }
  return body?.data ?? body?.Data ?? body;
};

const normalizeLogin = (response) => {
  const payload = unwrapResponse(response);
  const user = payload.user ?? payload.User;
  const fullName =
    user?.fullName ??
    user?.FullName ??
    user?.name ??
    user?.Name ??
    "";

  return {
    ...payload,
    accessToken: payload.accessToken ?? payload.AccessToken,
    refreshToken: payload.refreshToken ?? payload.RefreshToken,
    permissions: payload.permissions ?? payload.Permissions ?? [],
    roles: payload.roles ?? payload.Roles ?? [],
    user: user
      ? {
          ...user,
          fullName,
          name: fullName,
        }
      : user,
  };
};

const authService = {
  async login(data) {
    return normalizeLogin(await userApi.post(API_ENDPOINTS.AUTH.LOGIN, data));
  },

  async requestRegistrationOtp(data) {
    return unwrapResponse(await userApi.post(API_ENDPOINTS.AUTH.SIGNUP_REQUEST_OTP, data));
  },

  async verifyRegistrationOtp(data) {
    return unwrapResponse(await userApi.post(API_ENDPOINTS.AUTH.SIGNUP_VERIFY_OTP, data));
  },

  async requestPasswordReset(data) {
    return unwrapResponse(await userApi.post(API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST_OTP, data));
  },

  async resetPassword(data) {
    return unwrapResponse(await userApi.post(API_ENDPOINTS.AUTH.PASSWORD_RESET, data));
  },

  async changePassword(data) {
    return unwrapResponse(await userApi.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data));
  },
};

export default authService;
