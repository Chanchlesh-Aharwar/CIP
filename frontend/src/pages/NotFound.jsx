import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div className="liquid-glass-strong" style={{ display: 'inline-block', padding: '2rem 2.5rem' }}>
        <div style={{ fontSize: 56, fontWeight: 800, background: 'linear-gradient(135deg,#6366F1,#EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</div>
        <h2 style={{ margin: '0.5rem 0', color: '#0f172a' }}>Page not found</h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>The page you are looking for drifted away.</p>
        <Link to="/dashboard" className="liquid-btn-primary" style={{ display: 'inline-block', marginTop: '1rem', textDecoration: 'none' }}>Go to Dashboard →</Link>
      </div>
    </div>
  );
}
