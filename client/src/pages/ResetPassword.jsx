import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useTheme } from '../context/ThemeContext';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset link invalid or expired');
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
        <h2>Reset Password</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '-8px' }}>Enter your new password</p>
        {error && <p className="error-text">{error}</p>}
        {message && <p style={{ color: 'var(--success)', fontSize: '14px' }}>{message}</p>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <input
            className="input"
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button className="btn" type="submit">Reset Password</button>
        </form>
        <p style={{ marginTop: '16px', fontSize: '14px' }}>
          <Link to="/login" className="link">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;