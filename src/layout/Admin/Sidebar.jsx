import { FaHome, FaUsers, FaBox, FaRobot, FaCog, FaAmazon, FaShoppingBag, FaFileInvoiceDollar, FaTags, FaRegNewspaper } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

function Sidebar() {
  const sidebarOpen = useSelector(state => state.menu.sidebarOpen);
  const { pathname } = useLocation();

  const menus = [
    { name: "Dashboard", path: "/dashboard", icon: <FaHome /> },
    { name: "Users", path: "/users", icon: <FaUsers /> },
    { name: "Landing pages", path: "/LandingPages", icon: <FaRegNewspaper /> },
    { name: "Products & Approvals", path: "/ProductManagement", icon: <FaBox /> },
    { name: "Categories", path: "/CategoryManagement", icon: <FaTags /> },
    { name: "Orders & Payments", path: "/Ordermanage", icon: <FaShoppingBag /> },
    { name: "B2B Enquiries", path: "/admin/b2b/enquiries", icon: <FaFileInvoiceDollar /> },
    { name: "Amazon Push", path: "/amazon-push", icon: <FaAmazon /> },
    { name: "AI Agent", path: "/agent", icon: <FaRobot /> },
    { name: "Settings", path: "/settings", icon: <FaCog /> },
  ];

  return (
    <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
      <div className="logo">{sidebarOpen ? "⚡ amarud" : "NX"}
        
      </div>
      <ul className="menu-list">
        {menus.map((menu, index) => (
          <li key={index} className={pathname === menu.path || pathname.startsWith(`${menu.path}/`) ? "active" : ""}>
            <Link to={menu.path}>
              <span className="menu-icon">{menu.icon}</span>
              {sidebarOpen && <span>{menu.name}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default Sidebar;
