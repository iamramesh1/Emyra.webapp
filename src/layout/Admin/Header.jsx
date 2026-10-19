import { FaBars, FaChevronDown, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { toggleSidebar } from "../../redux/menuSlice";
import { logout } from "../../modules/Auth/authSlice";
import { Link, useNavigate } from "react-router-dom";

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const roles = useSelector(state => state.auth.roles);
  const userName = user?.fullName || user?.FullName || user?.name || user?.Name || "Admin";
  const userEmail = user?.email || user?.Email || user?.emailAddress || user?.EmailAddress || "";
  const userRole = roles?.[0] || user?.role || user?.Role || "Administrator";

  const logoutHandler = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="header">
      <button className="menu-btn" onClick={() => dispatch(toggleSidebar())}>
        <FaBars />
      </button>
      <details className="admin-account">
        <summary className="admin-account-trigger">
          <FaUserCircle size={32} aria-hidden="true" />
          <span className="admin-account-identity">
            <strong>{userName}</strong>
            <small>{userRole}</small>
          </span>
          <FaChevronDown className="admin-account-chevron" size={12} aria-hidden="true" />
        </summary>
        <div className="admin-account-menu">
          <div className="admin-account-info">
            <strong>{userName}</strong>
            {userEmail && <span>{userEmail}</span>}
            <small>{userRole}</small>
          </div>
          <Link to="/profile">My profile</Link>
          <Link to="/change-password">Change password</Link>
          <button className="logout-btn" onClick={logoutHandler}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </details>
    </header>
  );
}

export default Header;
