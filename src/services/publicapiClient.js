// publicApiClient.js

import axios from "axios";
import env from "../config/env";

const publicApiClient = axios.create({
  baseURL: env.DIGITAL_API_URL,
  timeout: 30000,
});

export default publicApiClient;