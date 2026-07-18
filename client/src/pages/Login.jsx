import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useTheme } from '../context/ThemeContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleMouseMove = (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    setOffset({ x, y });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      style={{ minHeight: '100vh', background: 'var(--auth-bg)', position: 'relative', overflow: 'hidden' }}
    >
      <div
        className="floating-shape"
        style={{
          width: '280px', height: '280px', background: '#4f46e5', top: '10%', left: '10%',
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
      />
      <div
        className="floating-shape"
        style={{
          width: '220px', height: '220px', background: '#ec4899', bottom: '10%', right: '12%',
          transform: `translate(${-offset.x}px, ${-offset.y}px)`,
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px', position: 'relative' }}>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
      <motion.div
        className="auth-container"
        style={{ position: 'relative' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="coin-3d">
          <div className="coin-3d-inner">₹</div>
        </div>
        <h2>Welcome Back</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '-8px' }}>Log in to track your expenses</p>
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn" type="submit">Login</button>
        </form>
        <p style={{ marginTop: '16px', fontSize: '14px' }}>
          Don't have an account? <Link to="/signup" className="link">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;