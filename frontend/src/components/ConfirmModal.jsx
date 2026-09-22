export default function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998, padding: '1rem' }}>
      <div className="liquid-glass-strong" style={{ padding: '1.5rem', maxWidth: 420, width: '100%' }}>
        <h3 style={{ marginTop: 0, color: '#0f172a' }}>{title}</h3>
        <p style={{ color: '#475569', fontSize: 14 }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button onClick={onCancel} disabled={loading} style={{ padding: '0.5rem 0.9rem', background: 'rgba(255,255,255,0.7)', border: '1px solid #e2e8f0', borderRadius: 99, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ padding: '0.5rem 0.9rem', background: 'linear-gradient(135deg,#EF4444,#F43F5E)', color: '#fff', border: 'none', borderRadius: 99, cursor: 'pointer', fontWeight: 600 }}>{loading ? '...' : 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}
