import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Skeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ErrorBanner from '../components/ErrorBanner';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

export default function ContentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [content, setContent] = useState(null);
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [edit, setEdit] = useState({ SUMMARY: '', FAQ: '', SOCIAL_POST: '' });
  const [editingSource, setEditingSource] = useState(false);
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceBody, setSourceBody] = useState('');

  const fetchAll = async () => {
    setError('');
    try {
      const c = await api.get(`/content/${id}`);
      setContent(c.data);
      setSourceTitle(c.data.title);
      setSourceBody(c.data.original_content);
      const o = await api.get(`/content/${id}/outputs`);
      setOutputs(o.data.outputs);
      // populate edit fields from outputs
      const map = {};
      for (const g of o.data.outputs) {
        const val = g.editedContent || g.rawAiContent;
        if (g.outputType === 'SUMMARY') map.SUMMARY = val;
        if (g.outputType === 'FAQ') map.FAQ = val;
        if (g.outputType === 'SOCIAL_POST') map.SOCIAL_POST = val;
      }
      setEdit((prev) => ({ ...prev, ...map }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const getOutput = (type) => outputs.find((o) => o.outputType === type);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await api.post(`/content/${id}/generate`);
      toast.success('AI outputs generated');
      // update edit fields directly from response for instant feedback
      setEdit({ SUMMARY: res.data.summary, FAQ: res.data.faq, SOCIAL_POST: res.data.social_post });
      await fetchAll();
    } catch (e) {
      toast.error(e.message);
      setError(e.message || 'Unable to generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (type) => {
    const out = getOutput(type);
    const value = edit[type];
    if (!value || !value.trim()) return toast.error(`${type} cannot be empty`);
    try {
      if (out) {
        await api.put(`/outputs/${out.id}`, { edited_content: value });
        toast.success(`${type === 'SUMMARY' ? 'Summary' : type === 'FAQ' ? 'FAQ' : 'Social Post'} saved successfully.`);
      } else {
        // fallback: if not yet generated, create via generate then save — but for MVP we require generate first
        toast.error(`Please generate outputs first`);
        return;
      }
      await fetchAll();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleSaveSource = async () => {
    if (!sourceTitle.trim()) return toast.error('Title cannot be empty');
    if (sourceBody.trim().length < 50) return toast.error('Content must be at least 50 characters');
    try {
      await api.put(`/content/${id}`, { title: sourceTitle, original_content: sourceBody });
      toast.success('Source content saved');
      setEditingSource(false);
      await fetchAll();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/content/${id}`);
      toast.success('Deleted');
      navigate('/content');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setShowDelete(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}><Skeleton height={24} width="50%" /><Skeleton height={140} /><Skeleton height={80} /></div>;
  if (error && !content) return <ErrorBanner message={error} onRetry={fetchAll} />;
  if (!content) return <EmptyState icon="❓" title="Not found" description="It may have been deleted." actionTo="/content" actionLabel="Back to List" />;

  const summaryOut = getOutput('SUMMARY');
  const faqOut = getOutput('FAQ');
  const socialOut = getOutput('SOCIAL_POST');

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="liquid-glass-strong" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{content.title}</h2>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{new Date(content.created_at).toLocaleString()} • {content.status}</div>
        </div>
        <button onClick={() => setShowDelete(true)} style={{ color: '#ef4444', background: 'rgba(254,242,242,0.8)', border: '1px solid #fecaca', padding: '0.35rem 0.7rem', borderRadius: 99, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Delete</button>
      </div>

      <div className="liquid-card" style={{ marginTop: '1rem', padding: '1.1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 11, letterSpacing: 1, color: '#6366F1', fontWeight: 700 }}>SOURCE CONTENT</div>
          {!editingSource ? (
            <button onClick={() => setEditingSource(true)} style={{ fontSize: 11, padding: '0.25rem 0.6rem', background: 'rgba(255,255,255,0.8)', border: '1px solid #e2e8f0', borderRadius: 99, cursor: 'pointer' }}>Edit</button>
          ) : (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button onClick={handleSaveSource} className="liquid-btn-primary" style={{ fontSize: 11, padding: '0.25rem 0.7rem' }}>Save</button>
              <button onClick={() => { setEditingSource(false); setSourceTitle(content.title); setSourceBody(content.original_content); }} style={{ fontSize: 11, padding: '0.25rem 0.6rem', background: 'rgba(255,255,255,0.7)', border: '1px solid #e2e8f0', borderRadius: 99, cursor: 'pointer' }}>Cancel</button>
            </div>
          )}
        </div>
        {!editingSource ? (
          <>
            <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{content.title}</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#1e293b', background: 'rgba(255,255,255,0.6)', padding: '0.8rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.7)' }}>{content.original_content}</div>
          </>
        ) : (
          <>
            <input className="liquid-input" value={sourceTitle} onChange={(e) => setSourceTitle(e.target.value)} placeholder="Title" style={{ marginBottom: '0.5rem' }} />
            <textarea className="liquid-input" value={sourceBody} onChange={(e) => setSourceBody(e.target.value)} rows={8} style={{ minHeight: 140 }} />
            <div style={{ fontSize: 11, color: sourceBody.length < 50 ? '#ef4444' : '#64748b', marginTop: 4 }}>{sourceBody.length} / 20000 chars</div>
          </>
        )}
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button onClick={handleGenerate} disabled={generating} className="liquid-btn-primary" style={{ opacity: generating ? 0.6 : 1, minWidth: 200 }}>
            {generating ? 'Generating content...' : 'Generate AI Outputs'}
          </button>
          {generating && <div style={{ fontSize: 12, color: '#6366f1', marginTop: 6 }}>One AI request — summary, FAQ, social post</div>}
        </div>
        {error && <ErrorBanner message={error} />}
      </div>

      {/* Three separate sections — each editable + independent save */}
      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* SUMMARY */}
        <div className="liquid-card" style={{ padding: '1rem 1.1rem' }}>
          <div style={{ fontSize: 12, letterSpacing: 1, fontWeight: 700, color: '#0f172a' }}>SHORT SUMMARY</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>3-5 sentences, preserve facts</div>
          <textarea
            value={edit.SUMMARY || ''}
            onChange={(e) => setEdit((s) => ({ ...s, SUMMARY: e.target.value }))}
            placeholder={generating ? 'Generating...' : 'Click Generate AI Outputs to create summary...'}
            rows={5}
            className="liquid-input"
            style={{ marginTop: '0.6rem', minHeight: 110 }}
          />
          <div style={{ marginTop: '0.5rem' }}>
            <button onClick={() => handleSave('SUMMARY')} className="liquid-btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: 13 }}>Save Summary</button>
            {summaryOut && <span style={{ marginLeft: 8, fontSize: 11, color: summaryOut.editedContent ? '#059669' : '#64748b' }}>{summaryOut.editedContent ? 'Edited' : 'AI Generated'} • {summaryOut.model}</span>}
          </div>
        </div>

        {/* FAQ */}
        <div className="liquid-card" style={{ padding: '1rem 1.1rem' }}>
          <div style={{ fontSize: 12, letterSpacing: 1, fontWeight: 700, color: '#0f172a' }}>FAQ</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>4-5 Q&A, only from source</div>
          <textarea
            value={edit.FAQ || ''}
            onChange={(e) => setEdit((s) => ({ ...s, FAQ: e.target.value }))}
            placeholder={generating ? 'Generating...' : 'Click Generate to create FAQ...'}
            rows={8}
            className="liquid-input"
            style={{ marginTop: '0.6rem', minHeight: 140 }}
          />
          <div style={{ marginTop: '0.5rem' }}>
            <button onClick={() => handleSave('FAQ')} className="liquid-btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: 13 }}>Save FAQ</button>
            {faqOut && <span style={{ marginLeft: 8, fontSize: 11, color: faqOut.editedContent ? '#059669' : '#64748b' }}>{faqOut.editedContent ? 'Edited' : 'AI Generated'} • {faqOut.model}</span>}
          </div>
        </div>

        {/* SOCIAL */}
        <div className="liquid-card" style={{ padding: '1rem 1.1rem' }}>
          <div style={{ fontSize: 12, letterSpacing: 1, fontWeight: 700, color: '#0f172a' }}>SOCIAL MEDIA POST</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Concise, engaging, 3-5 hashtags</div>
          <textarea
            value={edit.SOCIAL_POST || ''}
            onChange={(e) => setEdit((s) => ({ ...s, SOCIAL_POST: e.target.value }))}
            placeholder={generating ? 'Generating...' : 'Click Generate to create social post...'}
            rows={4}
            className="liquid-input"
            style={{ marginTop: '0.6rem', minHeight: 90 }}
          />
          <div style={{ marginTop: '0.5rem' }}>
            <button onClick={() => handleSave('SOCIAL_POST')} className="liquid-btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: 13 }}>Save Social Post</button>
            {socialOut && <span style={{ marginLeft: 8, fontSize: 11, color: socialOut.editedContent ? '#059669' : '#64748b' }}>{socialOut.editedContent ? 'Edited' : 'AI Generated'} • {socialOut.model}</span>}
          </div>
        </div>
      </div>

      <ConfirmModal open={showDelete} title="Delete content?" message="This will soft-delete the content and hide it from history." onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
    </div>
  );
}
