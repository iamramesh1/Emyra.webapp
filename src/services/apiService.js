// Backward-compatible shim.
// Historically this file exported a *factory* `(createapi) => {...}` that
// wrapped an axios instance and unwrapped `response.data` a second time.
// Some modules (e.g. b2bService) imported it expecting a ready-to-use
// instance instead of calling the factory, which crashed at runtime
// ("api.get is not a function"). To avoid hunting every caller down,
// this now default-exports a ready common instance (digitalApi).
import { digitalApi } from "./apiInstances";

export default digitalApi;
