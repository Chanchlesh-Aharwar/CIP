import { Link } from 'react-router-dom';

export default function EmptyState({ icon = '📄', title, description, actionTo, actionLabel }) {
  return (
    <div className="liquid-glass" style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.5)' }}>
      <div style={{ fontSize: 36 }} className="liquid-animate-float">{icon}</div>
      <h3 style={{ margin: '0.5rem 0', color: '#1e293b' }}>{title}</h3>
      {description && <p style={{ color: '#64748b', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>{description}</p>}
      {actionTo && actionLabel && <Link to={actionTo} className="liquid-btn-primary" style={{ display: 'inline-block', marginTop: '0.75rem', textDecoration: 'none' }}>{actionLabel}</Link>}
    </div>
  );
}
