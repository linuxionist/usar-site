import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4>Ridgeline Task Force</h4>
            <p>
              A volunteer urban search and rescue team providing specialized technical
              rescue capability to our region and mutual-aid partners nationwide.
            </p>
          </div>
          <div>
            <h4>Organization</h4>
            <Link to="/about">About &amp; Leadership</Link>
            <Link to="/capabilities">Capabilities</Link>
            <Link to="/deployments">Deployment Archive</Link>
          </div>
          <div>
            <h4>Get Involved</h4>
            <Link to="/join">Volunteer</Link>
            <Link to="/donate">Donate &amp; Sponsor</Link>
          </div>
          <div>
            <h4>Contact</h4>
            <Link to="/contact">General Inquiries</Link>
            <Link to="/contact">Media Relations</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Ridgeline Task Force. All rights reserved.</span>
          <span>Headquarters &amp; Training Facility — see Contact page for directions.</span>
        </div>
      </div>
    </footer>
  );
}
