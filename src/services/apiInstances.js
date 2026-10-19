// =====================================================================
// COMMON API INSTANCES
// This is the ONE place every service in the app should import its
// HTTP client from. Do not create new axios instances elsewhere.
//
//   userApi     -> env.USER_API_URL     (authentication and user management)
//   digitalApi  -> env.DIGITAL_API_URL  (catalog, cart, addresses, orders,
//                                       payments, shipment, B2B, admin products)
//   agentApi    -> env.AGENT_API_URL    (internal/agent specific APIs)
//   publicApi   -> env.DIGITAL_API_URL, NO auth header (guest browsing)
//
// All authenticated instances are built by apiClient.js, which already:
//   - attaches `Authorization: Bearer <accessToken>` from localStorage
//   - auto-refreshes an expired access token using `refreshToken`
//   - unwraps the axios response down to `response.data` (the JSON body)
//
// So every call like `digitalApi.get('/Orders')` resolves directly to the
// JSON body the API returned, e.g. `{ success, data, message }`.
// Callers should read `.data` off that body for the actual payload.
// =====================================================================

import env from "../config/env";
import axios from "axios";
import createApiClient from "./apiClient";

export const userApi = createApiClient(env.USER_API_URL);

export const agentApi = createApiClient(env.AGENT_API_URL);

export const digitalApi = createApiClient(env.DIGITAL_API_URL);

// Public, unauthenticated client for guest-safe endpoints (product catalog,
// categories, etc). Deliberately does NOT attach a bearer token so it never
// gets redirected to /login on a 401 refresh failure.
export const publicApi = axios.create({
  baseURL: env.DIGITAL_API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});
