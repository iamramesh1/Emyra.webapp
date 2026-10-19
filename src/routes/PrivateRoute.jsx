import { Navigate, Outlet, useLocation } from "react-router-dom";

const PrivateRoute = () => {
  const location = useLocation();
  const token =
    localStorage.getItem("accessToken");

  return token
    ? <Outlet />
    : (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
        replace
      />
    );

};

export default PrivateRoute;