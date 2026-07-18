import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useTheme } from '../context/ThemeContext';

function Profile() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        setName(res.data.name);
        setEmail(res.data.email);
      } catch (err) {
        setError('Failed to load profile');
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await api.put('/auth/profile', { name, email });
      localStorage.setItem('user', JSON.stringify(res.data));
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', background: 'var(--dashboard-bg)' }}>
      <div className="header">
        <h2>👤 My Profile</h2>
        <div className="row" style={{ flex: 'none', gap: '10px' }}>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
      {message && <p style={{ color: 'var(--success)', fontSize: '14px' }}>{message}</p>}

      <div className="card">
        <h3>Basic Info</h3>
        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            className="input"
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn" type="submit" style={{ width: 'fit-content' }}>Save Changes</button>
        </form>
      </div>

      <div className="card">
        <h3>Change Password</h3>
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            className="input"
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button className="btn" type="submit" style={{ width: 'fit-content' }}>Update Password</button>
        </form>
      </div>
    </div>
  );
}

export default Profile;