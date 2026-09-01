import { NavLink } from "react-router-dom";

const NAV_LINKS = [
  { to: "/about", label: "About" },
  { to: "/capabilities", label: "Capabilities" },
  { to: "/deployments", label: "Deployments" },
  { to: "/join", label: "Join" },
  { to: "/donate", label: "Donate" },
  { to: "/contact", label: "Contact" },
];

export default function Header() {
  return (
    <>
      <div className="dispatch-banner">
        <div className="container">
          <span>24/7 Activation Hotline for agencies requesting mutual aid: (555) 019-4477</span>
          <NavLink to="/contact">Dispatch &amp; emergency contacts →</NavLink>
        </div>
      </div>
      <header className="site-header">
        <div className="container">
          <NavLink to="/" className="brand">
            <span className="brand-mark">Ridgeline Task Force</span>
            <span className="brand-sub">Urban Search &amp; Rescue</span>
          </NavLink>
          <nav className="main-nav" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => (isActive ? "active" : undefined)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-ctas">
            <NavLink to="/donate" className="btn btn-outline">
              Donate
            </NavLink>
            <NavLink to="/join" className="btn btn-primary">
              Join the Team
            </NavLink>
          </div>
        </div>
      </header>
    </>
  );
}
