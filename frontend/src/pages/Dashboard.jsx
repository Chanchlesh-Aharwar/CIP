import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/Skeleton';
import ErrorBanner from '../components/ErrorBanner';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.get('/health'), api.get('/content?limit=5')]).then(([h, s]) => {
      if (h.status === 'fulfilled') setHealth(h.value.data);
      else setError(h.reason?.message);
      if (s.status === 'fulfilled') setStats(s.value.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}><div className="liquid-card" style={{ flex: 1, height: 110 }}><Skeleton height={80} style={{ margin: 16 }} /></div><div className="liquid-card" style={{ flex: 1, height: 110 }}><Skeleton height={80} style={{ margin: 16 }} /></div></div>;

  return (
    <div>
      <div className="liquid-glass" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ margin: 0, background: 'linear-gradient(135deg,#0f172a,#6366F1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dashboard</h2>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Welcome {user?.email} </p>
        </div>
        {user && <button onClick={logout} className="liquid-glass" style={{ padding: '0.4rem 0.8rem', borderRadius: 99, cursor: 'pointer', fontSize: '0.85rem' }}>Logout</button>}
      </div>
      <ErrorBanner message={error} />
      <div className="liquid-glass" style={{ marginTop: '1rem', padding: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div className="liquid-card" style={{ padding: '1.2rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))' }}>
          <div style={{ fontSize: 11, letterSpacing: 1, color: '#6366F1', fontWeight: 700 }}>TOTAL CONTENTS</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{stats ? stats.pagination.total : '-'}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Across your workspace</div>
        </div>
        {/* <div className="liquid-card" style={{ padding: '1.2rem', background: 'linear-gradient(135deg, rgba(6,182,214,0.12), rgba(59,130,246,0.08))' }}>
          <div style={{ fontSize: 11, letterSpacing: 1, color: '#0891b2', fontWeight: 700 }}>API HEALTH</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: health?.status === 'ok' ? '#059669' : '#dc2626' }}>{health ? health.status.toUpperCase() : '—'}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{health ? 'All systems operational' : 'Checking...'}</div>
        </div> */}
      </div>
      <div className="liquid-glass" style={{ marginTop: '1rem', padding: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Link to="/content/new" className="liquid-btn-primary" style={{ textDecoration: 'none' }}>＋ New Content</Link>
        <Link to="/content" style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,0.7)', borderRadius: 12, textDecoration: 'none', color: '#334155', border: '1px solid #e2e8f0' }}>View History →</Link>
      </div>
      {stats && stats.data.length > 0 && (
        <div className="liquid-card" style={{ marginTop: '1rem', padding: '1rem' }}>
          <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Recent</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.data.map((c) => (
              <Link key={c.id} to={`/content/${c.id}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.6)', borderRadius: 12, textDecoration: 'none', color: '#0f172a', border: '1px solid rgba(255,255,255,0.6)' }}>
                <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>{c.title}</span>
                <span className="liquid-badge" style={{ background: c.status === 'completed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', borderColor: c.status === 'completed' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)', color: c.status === 'completed' ? '#065f46' : '#92400e' }}>{c.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      {stats && stats.data.length === 0 && <div className="liquid-glass" style={{ marginTop: '1rem', padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>No contents yet — create your first to see it here.</div>}
    </div>
  );
}
