import { Navigate, Outlet } from "react-router-dom";

const PublicRoute = () => {
  const token = localStorage.getItem("accessToken");

  return token ? <Navigate to="/dashboard" /> : <Outlet />;
};

export default PublicRoute;