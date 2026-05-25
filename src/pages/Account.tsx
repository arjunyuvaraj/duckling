import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Typewriter from '../components/Typewriter';
import { clearSession, readSession } from '../utils/user';

export default function Account() {
  const navigate = useNavigate();
  const session = readSession();
  const user = session?.user;

  function logout() {
    clearSession();
    navigate('/login');
  }

  return (
    <div className="terminal-shell page-flow-enter">
      <Navbar showHome />
      <main className="account-layout">
        <section className="terminal-window account-window terminal-scanlines">
          <div className="terminal-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="terminal-dots">
                <span className="terminal-dot terminal-dot-red" />
                <span className="terminal-dot terminal-dot-yellow" />
                <span className="terminal-dot terminal-dot-green" />
              </div>
              <span>ducklings.dev/account</span>
            </div>
            <span>status: local session</span>
          </div>

          {user ? (
            <>
              <div className="terminal-line">
                <span>$</span> <Typewriter text="duckling account --view" speed={30} delay={150} cursor={false} />
              </div>
              <h1>Account</h1>
              <div className="account-table" aria-label="Account details">
                <div>
                  <span>username</span>
                  <strong>{user.username ?? 'unknown'}</strong>
                </div>
                <div>
                  <span>email</span>
                  <strong>{user.email ?? 'unknown'}</strong>
                </div>
                <div>
                  <span>user_id</span>
                  <strong>{user.id ?? 'unknown'}</strong>
                </div>
                <div>
                  <span>expires</span>
                  <strong>{session ? new Date(session.expiresAt).toLocaleString() : 'unknown'}</strong>
                </div>
              </div>
              <div className="account-actions">
                <Link to="/home" className="terminal-button terminal-button-primary">
                  Go to main page
                </Link>
                <button className="terminal-button" onClick={logout}>
                  Log out
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="terminal-line">
                <span>$</span> <Typewriter text="duckling account --view" speed={30} delay={150} cursor={false} />
              </div>
              <h1>No account loaded</h1>
              <p className="terminal-copy">Log in or register to see your account details here.</p>
              <div className="account-actions">
                <Link to="/login" className="terminal-button terminal-button-primary">
                  Log in
                </Link>
                <Link to="/register" className="terminal-button">
                  Register
                </Link>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
