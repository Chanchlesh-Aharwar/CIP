import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Content', to: '/content' },
  { label: 'New', to: '/content/new' },
];

export default function AppLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="liquid-orb liquid-orb-1" />
      <div className="liquid-orb liquid-orb-2" />
      <div className="liquid-orb liquid-orb-3" />
      <nav className="liquid-nav" style={{ display: 'flex', gap: '1rem', padding: '0.9rem 1.2rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Link to="/dashboard" style={{ fontWeight: 800, fontSize: '1.2rem', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginRight: '0.5rem', textDecoration: 'none' }}>◆ CIP</Link>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                textDecoration: 'none',
                color: location.pathname === item.to ? '#fff' : '#334155',
                background: location.pathname === item.to ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'transparent',
                padding: '0.35rem 0.7rem',
                borderRadius: 99,
                fontWeight: location.pathname === item.to ? 600 : 400,
                fontSize: '0.9rem',
                boxShadow: location.pathname === item.to ? '0 2px 10px rgba(99,102,241,0.3)' : 'none',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {!user ? (
            <>
              <Link to="/login" style={{ fontSize: '0.9rem', color: '#6366F1', textDecoration: 'none' }}>Login</Link>
              <Link to="/register" className="liquid-btn-primary" style={{ fontSize: '0.85rem', padding: '0.35rem 0.8rem', textDecoration: 'none' }}>Register</Link>
            </>
          ) : (
            <>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{user.name}</span>
              <button onClick={logout} style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.06)', padding: '0.3rem 0.6rem', borderRadius: 99, cursor: 'pointer' }}>Logout</button>
            </>
          )}
        </div>
      </nav>
      <div style={{ display: 'flex', flex: 1, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <aside className="liquid-hide-mobile" style={{ width: 200, padding: '1.2rem 0.8rem', margin: '1rem', height: 'fit-content', position: 'sticky', top: 64 }} >
          <div className="liquid-glass" style={{ padding: '1rem', borderRadius: 16 }}>
            <p style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 0.6rem' }}>Navigate</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li><Link to="/dashboard" style={{ display: 'block', padding: '0.5rem 0.7rem', borderRadius: 10, background: location.pathname === '/dashboard' ? 'rgba(99,102,241,0.12)' : 'transparent', color: location.pathname === '/dashboard' ? '#6366F1' : '#334155', textDecoration: 'none', fontSize: '0.9rem' }}>◆ Dashboard</Link></li>
              <li><Link to="/content" style={{ display: 'block', padding: '0.5rem 0.7rem', borderRadius: 10, background: location.pathname === '/content' ? 'rgba(99,102,241,0.12)' : 'transparent', color: location.pathname === '/content' ? '#6366F1' : '#334155', textDecoration: 'none', fontSize: '0.9rem' }}>◧ Content</Link></li>
              <li><Link to="/content/new" style={{ display: 'block', padding: '0.5rem 0.7rem', borderRadius: 10, background: location.pathname === '/content/new' ? 'rgba(99,102,241,0.12)' : 'transparent', color: location.pathname === '/content/new' ? '#6366F1' : '#334155', textDecoration: 'none', fontSize: '0.9rem' }}>＋ New Content</Link></li>
            </ul>
          </div>
        </aside>
        <main style={{ flex: 1, padding: '1.2rem', minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
