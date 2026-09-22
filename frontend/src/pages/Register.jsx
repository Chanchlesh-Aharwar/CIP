import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/ErrorBanner';
import { useToast } from '../components/Toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Account created — welcome');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '2rem auto' }}>
      <div className="liquid-glass-strong" style={{ padding: '1.8rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: 28, background: 'linear-gradient(135deg,#6366F1,#EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>Create account</div>
          <p style={{ color: '#64748b', fontSize: 14 }}>Start transforming content in seconds</p>
        </div>
        <ErrorBanner message={error} />
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input className="liquid-input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          <input className="liquid-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required type="email" />
          <input className="liquid-input" placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} type="password" />
          <button type="submit" disabled={loading} className="liquid-btn-primary">{loading ? 'Creating...' : 'Create account'}</button>
        </form>
        <p style={{ marginTop: '1rem', fontSize: 14, textAlign: 'center' }}>Have an account? <Link to="/login" style={{ color: '#6366F1', fontWeight: 600 }}>Login</Link></p>
      </div>
    </div>
  );
}
