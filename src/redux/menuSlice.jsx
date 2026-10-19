import { createSlice } from "@reduxjs/toolkit";

import {

  FaHome,

  FaUsers,

  FaBox,

  FaRobot,

  FaCog,

} from "react-icons/fa";

const initialState = {

  sidebarOpen: true,

  menus: [

    {
      id: 1,
      name: "Dashboard",
      path: "/dashboard",
      icon: FaHome,
    },

    {
      id: 2,
      name: "Users",
      path: "/users",
      icon: FaUsers,
    },

    {
      id: 3,
      name: "Products",
      path: "/products",
      icon: FaBox,
    },

    {
      id: 4,
      name: "AI Agent",
      path: "/agent",
      icon: FaRobot,
    },

    {
      id: 5,
      name: "Settings",
      path: "/settings",
      icon: FaCog,
    },
  ],
};

const menuSlice = createSlice({

  name: "menu",

  initialState,

  reducers: {

    toggleSidebar: (state) => {

      state.sidebarOpen =
        !state.sidebarOpen;
    },
  },
});

export const {
  toggleSidebar,
} = menuSlice.actions;

export default menuSlice.reducer;