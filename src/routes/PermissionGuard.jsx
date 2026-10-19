const PermissionGuard = ({
  permission,
  children,
}) => {

  const permissions =
    JSON.parse(localStorage.getItem("permissions")) || [];

  if (!permissions.includes(permission)) {
    return null;
  }

  return children;
};

export default PermissionGuard;