import { Navigate } from "react-router-dom";

const RoleRoute = ({
  children,
  roles,
}) => {

  const userRoles =
    JSON.parse(localStorage.getItem("roles")) || [];

  const hasRole = roles.some(
    role => userRoles.includes(role)
  );

  return hasRole
    ? children
    : <Navigate to="/dashboard" />;
};

export default RoleRoute;