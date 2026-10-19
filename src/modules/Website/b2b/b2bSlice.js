import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import b2bService, { mapB2BEnquiry, unwrapB2BResponse } from "./b2bService";


// ============================================
// ADMIN ENQUIRIES
// ============================================

export const fetchB2BEnquiries = createAsyncThunk(
  "b2b/fetchEnquiries",
  async (params, { rejectWithValue }) => {

    try {

      const response =
        await b2bService.getAll(params);

      const result = unwrapB2BResponse(response);
      const list = result?.items ?? result?.Items ?? result;
      return Array.isArray(list) ? list.map(mapB2BEnquiry) : [];

    } catch (error) {

      return rejectWithValue(
        error?.response?.data?.message ||
        "Unable to load enquiries"
      );

    }

  }
);


// ============================================
// ADMIN DASHBOARD
// ============================================

export const fetchB2BDashboard = createAsyncThunk(
  "b2b/fetchDashboard",
  async (_, { rejectWithValue }) => {

    try {

      const response =
        await b2bService.getDashboard();

      return unwrapB2BResponse(response);

    } catch (error) {

      return rejectWithValue(
        error?.response?.data?.message ||
        "Unable to load dashboard"
      );

    }

  }
);


// ============================================
// SLICE
// ============================================

const initialState = {

  enquiries: [],

  dashboard: {
    total: 0,
    submitted: 0,
    underReview: 0,
    quotationSent: 0,
    accepted: 0,
    orders: 0,
    processing: 0,
    shipped: 0,
    delivered: 0
  },

  selectedEnquiry: null,

  loading: false,

  error: null

};


const b2bSlice = createSlice({

  name: "b2b",

  initialState,

  reducers: {

    setSelectedEnquiry(state, action) {

      state.selectedEnquiry =
        action.payload;

    },

    clearSelectedEnquiry(state) {

      state.selectedEnquiry = null;

    }

  },

  extraReducers: (builder) => {

    builder

      // ========================================
      // ENQUIRIES
      // ========================================

      .addCase(
        fetchB2BEnquiries.pending,
        (state) => {

          state.loading = true;
          state.error = null;

        }
      )

      .addCase(
        fetchB2BEnquiries.fulfilled,
        (state, action) => {

          state.loading = false;

          state.enquiries = action.payload || [];

        }
      )

      .addCase(
        fetchB2BEnquiries.rejected,
        (state, action) => {

          state.loading = false;

          state.error =
            action.payload;

        }
      )


      // ========================================
      // DASHBOARD
      // ========================================

      .addCase(
        fetchB2BDashboard.fulfilled,
        (state, action) => {

          state.dashboard =
            action.payload;

        }
      );

  }

});


export const {
  setSelectedEnquiry,
  clearSelectedEnquiry
} = b2bSlice.actions;


export default b2bSlice.reducer;