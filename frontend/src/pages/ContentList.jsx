import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { CardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import { useToast } from '../components/Toast';

export default function ContentList() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const fetch = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.set('search', search);
      if (tag) params.set('tag', tag);
      const res = await api.get(`/content?${params}`);
      setItems(res.data.data);
      setPagination(res.data.pagination);
    } catch (e) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetch();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, background: 'linear-gradient(135deg,#0f172a,#6366F1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>History</h2>
        <Link to="/content/new" className="liquid-btn-primary" style={{ textDecoration: 'none', fontSize: '0.9rem' }}>＋ New</Link>
      </div>
      <form onSubmit={handleSearch} className="liquid-glass" style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0', padding: '0.6rem', flexWrap: 'wrap' }}>
        <input className="liquid-input" style={{ flex: '2 1 160px' }} placeholder="Search title or body" value={search} onChange={(e) => setSearch(e.target.value)} />
        <input className="liquid-input" style={{ flex: '1 1 120px' }} placeholder="Filter tag" value={tag} onChange={(e) => setTag(e.target.value)} />
        <button type="submit" className="liquid-btn-primary" style={{ flex: '0 0 auto' }}>Search</button>
      </form>
      <ErrorBanner message={error} onRetry={fetch} />
      {loading && <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>}
      {!loading && items.length === 0 && !error && <EmptyState icon="📭" title="No contents yet" description="Create your first content to start analyzing with AI." actionTo="/content/new" actionLabel="Create Content" />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        {items.map((c) => (
          <Link key={c.id} to={`/content/${c.id}`} className="liquid-card" style={{ padding: '1rem 1.1rem', textDecoration: 'none', color: '#0f172a', display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '1rem', flex: 1, minWidth: 120 }}>{c.title}</strong>
              <span className="liquid-badge" style={{ background: c.status === 'completed' ? 'rgba(16,185,129,0.15)' : c.status === 'failed' ? 'rgba(239,68,68,0.15)' : c.status === 'processing' ? 'rgba(245,158,11,0.15)' : 'rgba(148,163,184,0.15)', borderColor: c.status === 'completed' ? 'rgba(16,185,129,0.3)' : c.status === 'failed' ? 'rgba(239,68,68,0.3)' : c.status === 'processing' ? 'rgba(245,158,11,0.3)' : 'rgba(148,163,184,0.3)', color: c.status === 'completed' ? '#065f46' : c.status === 'failed' ? '#991b1b' : c.status === 'processing' ? '#92400e' : '#475569' }}>{c.status}</span>
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: '0.35rem', lineHeight: 1.5 }}>{c.original_content.slice(0,130)}…</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: '0.4rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span>{new Date(c.created_at).toLocaleDateString()}</span>
              {c.tags.length > 0 && <span>• {c.tags.map((t) => `#${t.name}`).join(' ')}</span>}
            </div>
          </Link>
        ))}
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="liquid-glass" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', padding: '0.6rem' }}>
          <button className="liquid-glass" style={{ padding: '0.3rem 0.7rem', borderRadius: 99, cursor: 'pointer' }} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
          <span style={{ fontSize: 13, color: '#475569' }}>Page {pagination.page} / {pagination.totalPages} • {pagination.total} total</span>
          <button className="liquid-glass" style={{ padding: '0.3rem 0.7rem', borderRadius: 99, cursor: 'pointer' }} disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next ›</button>
        </div>
      )}
    </div>
  );
}
