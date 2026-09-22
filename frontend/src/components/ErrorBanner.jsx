export default function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="liquid-glass" style={{ background: 'rgba(254,242,242,0.8)', borderColor: 'rgba(254,202,202,0.8)', color: '#991B1B', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 14 }}>{message}</span>
      {onRetry && <button onClick={onRetry} style={{ background: '#EF4444', color: '#fff', border: 'none', padding: '0.35rem 0.7rem', borderRadius: 99, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Retry</button>}
    </div>
  );
}
