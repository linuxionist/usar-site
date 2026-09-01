import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

const ADMIN_NAV = [{ to: "/admin/members", label: "Members" }];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/admin/login");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="brand-mark" style={{ fontSize: "1.2rem" }}>
            Ridgeline Admin
          </span>
        </div>
        <nav className="admin-nav">
          {ADMIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-user">{user?.username}</div>
          <button className="btn btn-outline" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <div className="container admin-container">{children}</div>
      </div>
    </div>
  );
}
