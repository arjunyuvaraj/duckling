import { Link, useLocation } from 'react-router-dom';

interface NavbarProps {
  showHome?: boolean;
}

export default function Navbar({ showHome = false }: NavbarProps) {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <nav className="lp-nav">
      <div className="lp-nav-inner">
        <Link to="/" className="lp-logo">
          <div className="lp-logo-icon">
            <svg viewBox="0 0 1514 1514" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M862.5 304C985.616 304 1087.39 395.37 1103.71 514H1208.99C1208.67 590.681 1151.68 653.171 1080.13 656.829C1062.64 691.577 1037.08 721.561 1005.9 744.316C1092.38 781.22 1153 867.03 1153 967C1153 1100.65 1044.65 1209 911 1209H548C414.347 1209 306 1100.65 306 967C306 963.283 306.084 959.585 306.25 955.908V580.613L532.977 725.46C537.945 725.156 542.955 725 548 725H695.809C648.529 680.583 619 617.49 619 547.5C619 413.019 728.019 304 862.5 304Z"/>
            </svg>
          </div>
          <span className="lp-logo-name">ducklings.dev</span>
        </Link>

        {isLanding && (
          <div className="lp-nav-links">
            <Link to="/library" className="lp-nav-link">Library</Link>
            <Link to="/get-started" className="lp-nav-link">Get Started</Link>
            <Link to="/login" className="lp-nav-link">Dashboard</Link>
          </div>
        )}

        <div className="lp-nav-right">
          {isLanding ? (
            <>
              <Link to="/login" className="lp-nav-ghost">Log In</Link>
              <Link to="/register" className="lp-nav-cta">Register</Link>
            </>
          ) : (
            showHome && (
              <Link to="/" className="lp-nav-ghost">← Back</Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
