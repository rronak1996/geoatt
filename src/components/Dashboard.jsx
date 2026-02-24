import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const NAV = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/students', icon: '👥', label: 'Students' },
  { to: '/sessions', icon: '📋', label: 'Sessions' },
  { to: '/reports', icon: '📊', label: 'Reports' },
]

export default function Dashboard({ user, children }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const isHome = location.pathname === '/dashboard'

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar glass-card">
        <div className="sidebar-brand">
          <span className="brand-icon">📡</span>
          <span className="brand-name">QR Attend</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`nav-item ${location.pathname === to ? 'nav-active' : ''}`}
            >
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.email?.[0]?.toUpperCase()}</div>
            <div className="user-email">{user?.email}</div>
          </div>
          <button className="btn btn-danger logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {isHome && (
          <div className="page-container">
            <div className="page-header">
              <div>
                <h1>Welcome back 👋</h1>
                <p>Manage students, sessions, and attendance from here.</p>
              </div>
            </div>

            <div className="dash-grid">
              {NAV.filter(n => n.to !== '/dashboard').map(({ to, icon, label }) => (
                <Link to={to} key={to} className="glass-card dash-card">
                  <span className="dash-icon">{icon}</span>
                  <span className="dash-label">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        {children}
      </main>

      <style>{`
        .layout {
          display: flex;
          min-height: 100vh;
          position: relative;
          z-index: 1;
        }
        /* Sidebar */
        .sidebar {
          width: 240px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          position: sticky;
          top: 0;
          height: 100vh;
          border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
          border-left: none;
          flex-shrink: 0;
        }
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          margin-bottom: 28px;
        }
        .brand-icon { font-size: 1.5rem; }
        .brand-name {
          font-size: 1.15rem;
          font-weight: 800;
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.93rem;
          font-weight: 500;
          transition: var(--transition);
        }
        .nav-item:hover {
          background: var(--glass-hover);
          color: var(--text-primary);
        }
        .nav-active {
          background: rgba(108,99,255,0.2);
          color: var(--accent-1);
          border: 1px solid rgba(108,99,255,0.35);
        }
        .nav-icon { font-size: 1rem; }
        .sidebar-footer { margin-top: 16px; }
        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          margin-bottom: 10px;
          background: var(--glass-bg);
          border-radius: var(--radius-sm);
          border: 1px solid var(--glass-border);
        }
        .user-avatar {
          width: 32px;
          height: 32px;
          background: var(--accent-gradient);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }
        .user-email {
          font-size: 0.75rem;
          color: var(--text-secondary);
          word-break: break-all;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .logout-btn { width: 100%; justify-content: center; }
        /* Main */
        .main-content { flex: 1; overflow-y: auto; }
        /* Dashboard cards */
        .dash-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 20px;
        }
        .dash-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 32px 20px;
          text-decoration: none;
          cursor: pointer;
          transition: var(--transition);
        }
        .dash-card:hover { transform: translateY(-4px); }
        .dash-icon { font-size: 2rem; }
        .dash-label {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        /* Responsive */
        @media (max-width: 768px) {
          .layout { flex-direction: column; }
          .sidebar {
            width: 100%;
            height: auto;
            min-height: unset;
            position: relative;
            border-radius: 0 0 var(--radius-lg) var(--radius-lg);
            padding: 16px;
          }
          .sidebar-nav { flex-direction: row; flex-wrap: wrap; gap: 6px; }
          .nav-item { padding: 8px 12px; font-size: 0.82rem; }
          .sidebar-brand { margin-bottom: 12px; }
          .sidebar-footer { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
          .logout-btn { width: auto; }
          .user-info { flex: 1; margin-bottom: 0; }
        }
      `}</style>
    </div>
  )
}
