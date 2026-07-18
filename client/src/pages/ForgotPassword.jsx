import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useTheme } from '../context/ThemeContext';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--auth-bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px' }}>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
      <div className="auth-container">
        <h2>Forgot Password</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '-8px' }}>
          Enter your email and we'll send you a reset link
        </p>
        {error && <p className="error-text">{error}</p>}
        {message && <p style={{ color: 'var(--success)', fontSize: '14px' }}>{message}</p>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="btn" type="submit">Send Reset Link</button>
        </form>
        <p style={{ marginTop: '16px', fontSize: '14px' }}>
          Remembered your password? <Link to="/login" className="link">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;