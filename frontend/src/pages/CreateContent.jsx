import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ErrorBanner from '../components/ErrorBanner';
import { useToast } from '../components/Toast';

export default function CreateContent() {
  const navigate = useNavigate();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (body.trim().length < 50) return setError('Content must be at least 50 characters');
    if (body.length > 20000) return setError('Content exceeds 20000 chars');
    setLoading(true);
    try {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
      const res = await api.post('/content', { title: title || undefined, original_content: body, tags: tagList });
      toast.success('Content saved — now analyze it');
      navigate(`/content/${res.data.id}`);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="liquid-glass-strong" style={{ padding: '1.5rem' }}>
        <h2 style={{ marginTop: 0, background: 'linear-gradient(135deg,#0f172a,#6366F1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Create Content</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '-0.5rem' }}>Paste your article, report, or announcement — AI will turn it into structured intelligence.</p>
        <ErrorBanner message={error} />
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '0.5rem' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Title <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional — auto if empty)</span>
            <input className="liquid-input" style={{ marginTop: 6 }} placeholder="e.g. Q3 Launch Report" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Content *
            <textarea className="liquid-input" style={{ marginTop: 6, minHeight: 180, resize: 'vertical' }} placeholder="Paste your article here (50-20000 chars)" value={body} onChange={(e) => setBody(e.target.value)} required minLength={50} rows={10} />
          </label>
          <div style={{ fontSize: 11, color: body.length < 50 ? '#ef4444' : '#059669', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>{body.length} / 20000 chars {body.length > 0 && body.length < 50 && '— need 50 min'}</span>
            <span style={{ color: '#94a3b8' }}>{body.split(/\s+/).filter(Boolean).length} words</span>
          </div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Tags
            <input className="liquid-input" style={{ marginTop: 6 }} placeholder="e.g. tech, ai, report (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
          </label>
          <button type="submit" disabled={loading} className="liquid-btn-primary" style={{ marginTop: 4 }}>{loading ? 'Saving…' : 'Save Content'}</button>
        </form>
      </div>
    </div>
  );
}
