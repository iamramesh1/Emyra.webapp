// import { createSlice } from "@reduxjs/toolkit";

// const initialState = {
//   token: localStorage.getItem("accessToken"),
//   refreshToken: localStorage.getItem("refreshToken"),
//   user: JSON.parse(localStorage.getItem("user")),
//   permissions: JSON.parse(localStorage.getItem("permissions")) || [],
//   roles: JSON.parse(localStorage.getItem("roles")) || [],
// };

// const authSlice = createSlice({
//   name: "auth",

//   initialState,

//   reducers: {

//     loginSuccess: (state, action) => {

//       state.token = action.payload.accessToken;
//       state.refreshToken = action.payload.refreshToken;
//       state.user = action.payload.user;
//       state.permissions = action.payload.permissions;
//       state.roles = action.payload.roles;

//       localStorage.setItem(
//         "accessToken",
//         action.payload.accessToken
//       );

//       localStorage.setItem(
//         "refreshToken",
//         action.payload.refreshToken
//       );

//       localStorage.setItem(
//         "user",
//         JSON.stringify(action.payload.user)
//       );

//       localStorage.setItem(
//         "permissions",
//         JSON.stringify(action.payload.permissions)
//       );

//       localStorage.setItem(
//         "roles",
//         JSON.stringify(action.payload.roles)
//       );
//     },

//     logout: (state) => {

//       state.token = null;
//       state.refreshToken = null;
//       state.user = null;
//       state.permissions = [];
//       state.roles = [];

//       localStorage.clear();
//     },
//   },
// });

// export const { loginSuccess, logout } =
//   authSlice.actions;

// export default authSlice.reducer;


import { createSlice } from "@reduxjs/toolkit";

const getLocalStorageJSON = (key, defaultValue) => {
  try {
    const value = localStorage.getItem(key);

    if (!value || value === "undefined") {
      return defaultValue;
    }

    return JSON.parse(value);
  } catch (error) {
    console.error(`Invalid localStorage value for "${key}"`, error);
    return defaultValue;
  }
};

const initialState = {
  token: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),

  user: getLocalStorageJSON("user", null),

  permissions: getLocalStorageJSON("permissions", []),

  roles: getLocalStorageJSON("roles", []),
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    loginSuccess: (state, action) => {
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.permissions = action.payload.permissions || [];
      state.roles = action.payload.roles || [];

      localStorage.setItem(
        "accessToken",
        action.payload.accessToken
      );

      localStorage.setItem(
        "refreshToken",
        action.payload.refreshToken
      );

      localStorage.setItem(
        "user",
        JSON.stringify(action.payload.user)
      );

      localStorage.setItem(
        "permissions",
        JSON.stringify(action.payload.permissions || [])
      );

      localStorage.setItem(
        "roles",
        JSON.stringify(action.payload.roles || [])
      );
    },

    logout: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.permissions = [];
      state.roles = [];

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("permissions");
      localStorage.removeItem("roles");
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;

export default authSlice.reducer;