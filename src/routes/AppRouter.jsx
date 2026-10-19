// import { Routes, Route, Navigate } from "react-router-dom";
// import Login from "../modules/Auth/login";
// import Dashboard from "../modules/Dashboard/dashboard";
// import Users from "../modules/Users/users";
// import PrivateRoute from "./PrivateRoute";
// import RoleRoute from "./RoleRoute";
// import MainLayout from "../layout/Admin/MainLayout";
// import WebsiteLayout from "../layout/Website/WebsiteLayout";
// import Home from "../modules/Website/Home/Home";
// import ProductDetails from "../modules/Website/ProductDetails/ProductDetails";
// import Cart from "../modules/Website/Cart/Cart";
// import Checkout from "../modules/Website/Checkout/Checkout";
// import Wishlist from "../modules/Website/Wishlist/Wishlist";
// import ProductList from "../modules/Website/Product/ProductList";
// import AmazonPush from "../modules/Admin/AmazonPush/AmazonPush";

// const AppRouter = () => {
//   return (
//     <Routes>
//       <Route path="/" element={<WebsiteLayout />}>
//         <Route index element={<Home />} />
//         <Route path="product/:id" element={<ProductDetails />} />
//         <Route path="products" element={<ProductList />} />
//         <Route path="cart" element={<Cart />} />
//         <Route path="checkout" element={<Checkout />} />
//         <Route path="wishlist" element={<Wishlist />} />
//       </Route>

//       <Route path="/login" element={<Login />} />

//       <Route element={<PrivateRoute />}>
//         <Route element={<MainLayout />}>
//           <Route path="/dashboard" element={<Dashboard />} />
//           <Route path="/users" element={<RoleRoute roles={["Admin"]}><Users /></RoleRoute>} />
//           <Route path="/amazon-push" element={<AmazonPush />} />
//         </Route>
//       </Route>

//       <Route path="*" element={<Navigate to="/login" />} />
//     </Routes>
//   );
// };

// export default AppRouter;


import { Routes, Route, Navigate } from "react-router-dom";

// Auth
import Login from "../modules/Auth/login";
import Profile from "../modules/Auth/Profile";
import ChangePassword from "../modules/Auth/ChangePassword";

// Admin
import Dashboard from "../modules/Dashboard/dashboard";
import Users from "../modules/Users/users";
import AmazonPush from "../modules/Admin/AmazonPush/AmazonPush";

// Website
import WebsiteLayout from "../layout/Website/WebsiteLayout";
import MainLayout from "../layout/Admin/MainLayout";

import Home from "../modules/Website/Home/Home";
import ProductDetails from "../modules/Website/ProductDetails/ProductDetails";
import ProductList from "../modules/Website/Product/ProductList";
import Cart from "../modules/Website/Cart/Cart";
import Checkout from "../modules/Website/Checkout/Checkout";
import Wishlist from "../modules/Website/Wishlist/Wishlist";

// Routing
import PrivateRoute from "./PrivateRoute";
import RoleRoute from "./RoleRoute";

// B2B
import B2BEnquiryManagement from "../modules/Website/b2b/B2BEnquiryManagement";
import B2BEnquiryDetails from "../modules/Website/b2b/B2BEnquiryDetails";
import B2BQuotation from "../modules/Website/b2b/B2BQuotation";
import B2BOrderTracking from "../modules/Website/b2b/B2BOrderTracking";
import MyBulkOrders from "../modules/Website/b2b/MyBulkOrders";
import Bulkorder from "../modules/Website/Order/Bulkorder";

// Orders (customer)
import MyOrders from "../modules/Website/Order/MyOrders";
import OrderTracking from "../modules/Website/Checkout/OrderTracking";

// Product / Order management (admin)
import ProductManagement from "../modules/Dashboard/Products/ProductManage";
import CategoryManagement from "../modules/Dashboard/Categories/CategoryManagement";
import OrderManage from "../modules/Dashboard/Order/Ordermanage";
import LandingPageAdmin from "../modules/Dashboard/LandingPages/LandingPageAdmin";
import LandingPageView from "../modules/Dashboard/LandingPages/LandingPageView";
import { PrivacyPolicy, TermsAndConditions } from "../modules/Website/PolicyPages";

const AppRouter = () => {
  return (
    <Routes>

      {/* =====================================================
          PUBLIC WEBSITE ROUTES
      ===================================================== */}
      <Route path="/" element={<WebsiteLayout />}>
        <Route index element={<Home />} />

        <Route
          path="product/:id"
          element={<ProductDetails />}
        />

        <Route
          path="products"
          element={<ProductList />}
        />

        <Route
          path="cart"
          element={<Cart />}
        />

        <Route
          path="checkout"
          element={<Checkout />}
        />

        <Route
          path="wishlist"
          element={<Wishlist />}
        />
        <Route path="p/:slug" element={<LandingPageView />} />
        <Route path="terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
      </Route>

      {/* =====================================================
          CUSTOMER ORDERS (require login)
      ===================================================== */}
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<WebsiteLayout />}>
          <Route path="orders" element={<MyOrders />} />
          <Route path="orders/:id" element={<OrderTracking />} />

          {/* B2B / Bulk order — customer facing */}
          <Route path="bulk-order/new" element={<Bulkorder />} />
          <Route path="my-bulk-orders" element={<MyBulkOrders />} />
          <Route path="my-bulk-orders/:id" element={<B2BOrderTracking />} />
        </Route>
      </Route>


      {/* =====================================================
          LOGIN
      ===================================================== */}
      <Route
        path="/login"
        element={<Login />}
      />


      {/* =====================================================
          ALL PRIVATE ROUTES
      ===================================================== */}
      <Route element={<PrivateRoute />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* =================================================
            ADMIN LAYOUT
        ================================================= */}
        <Route element={<MainLayout />}>

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <RoleRoute roles={["Admin", "SuperAdmin", "Super Admin", "Manager"]}>
                <Dashboard />
              </RoleRoute>
            }
          />

          {/* Users */}
          <Route
            path="/users"
            element={
              <RoleRoute roles={["Admin", "SuperAdmin", "Super Admin"]}>
                <Users />
              </RoleRoute>
            }
          />

          <Route
            path="/LandingPages"
            element={
              <RoleRoute roles={["Admin", "SuperAdmin", "Super Admin"]}>
                <LandingPageAdmin />
              </RoleRoute>
            }
          />

          <Route
            path="/CategoryManagement"
            element={
              <RoleRoute roles={["Admin", "SuperAdmin", "Super Admin", "Manager"]}>
                <CategoryManagement />
              </RoleRoute>
            }
          />

          {/* Amazon Push */}
          <Route
            path="/amazon-push"
            element={
              <RoleRoute roles={["Admin", "SuperAdmin", "Super Admin", "Manager"]}>
                <AmazonPush />
              </RoleRoute>
            }
          />


          {/* =================================================
              B2B ADMIN
          ================================================= */}

          {/* Bulk Enquiry Management */}
          <Route
            path="/admin/b2b/enquiries"
            element={
              <RoleRoute roles={["Admin", "SuperAdmin", "Super Admin", "Manager"]}>
                <B2BEnquiryManagement />
              </RoleRoute>
            }
          />

          {/* Enquiry Details */}
          <Route
            path="/admin/b2b/enquiries/:id"
            element={
              <RoleRoute roles={["Admin", "SuperAdmin", "Super Admin", "Manager"]}>
                <B2BEnquiryDetails />
              </RoleRoute>
            }
          />

          {/* Create/View Quotation */}
          <Route
            path="/admin/b2b/enquiries/:id/quotation"
            element={
              <RoleRoute roles={["Admin", "SuperAdmin", "Super Admin", "Manager"]}>
                <B2BQuotation />
              </RoleRoute>
            }
          />

          {/* Shipment / Tracking Management */}
          <Route
            path="/admin/b2b/enquiries/:id/tracking"
            element={
              <RoleRoute roles={["Admin", "SuperAdmin", "Super Admin", "Manager"]}>
                <B2BOrderTracking />
              </RoleRoute>
            }
          />

        </Route>

      </Route>

      {/* =====================================================
          PRODUCT / ORDER MANAGEMENT (admin)
      ===================================================== */}
      <Route
        path="/ProductManagement"
        element={
          <RoleRoute roles={["Admin", "SuperAdmin", "Super Admin", "Manager"]}>
            <ProductManagement />
          </RoleRoute>
        }
      />
      <Route
        path="/Ordermanage"
        element={
          <RoleRoute roles={["Admin", "SuperAdmin", "Super Admin", "Manager"]}>
            <OrderManage />
          </RoleRoute>
        }
      />

      {/* =====================================================
          FALLBACK
      ===================================================== */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
};

export default AppRouter;