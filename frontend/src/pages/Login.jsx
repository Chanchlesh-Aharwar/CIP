import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorBanner from '../components/ErrorBanner';
import { useToast } from '../components/Toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in — welcome');
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
          <div style={{ fontSize: 28, background: 'linear-gradient(135deg,#6366F1,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>Welcome back</div>
          <p style={{ color: '#64748b', fontSize: 14 }}>Sign in to your intelligence workspace</p>
        </div>
        <ErrorBanner message={error} />
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input className="liquid-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required type="email" />
          <input className="liquid-input" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required type="password" />
          <button type="submit" disabled={loading} className="liquid-btn-primary">{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        <p style={{ marginTop: '1rem', fontSize: 14, textAlign: 'center' }}>No account? <Link to="/register" style={{ color: '#6366F1', fontWeight: 600 }}>Register</Link></p>
        <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: '0.5rem', background: 'rgba(99,102,241,0.06)', padding: '0.4rem', borderRadius: 99 }}>Demo: alice@example.com / pass1234</p>
      </div>
    </div>
  );
}
