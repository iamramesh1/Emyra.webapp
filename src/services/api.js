// Backward-compatible shim. All logic now lives in apiInstances.js
// (the single common API module). Keep this file so any existing
// `import { digitalApi } from "./api"` style imports keep working.
export { userApi, agentApi, digitalApi, publicApi } from "./apiInstances";
