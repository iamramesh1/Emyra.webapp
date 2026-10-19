import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../modules/Auth/authSlice";
import b2bReducer from "../modules/Website/b2b/b2bSlice";
import loaderReducer from "../redux/loaderSlice";
import menuReducer from "../redux/menuSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    b2b: b2bReducer,
    loader: loaderReducer,
    menu: menuReducer,
  },
});