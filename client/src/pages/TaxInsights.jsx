import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useCurrency } from '../context/CurrencyContext';

const CATEGORY_COLORS = {
  'Interest payments & debt servicing': '#6b7280',
  'Defence': '#4f46e5',
  'Infrastructure (roads & railways)': '#16a34a',
  'Agriculture & rural development': '#65a30d',
  'Home affairs & security': '#0891b2',
  'Food & public distribution': '#f59e0b',
  'Education': '#8b5cf6',
  'Healthcare': '#dc2626',
  'Other public services': '#9ca3af',
};

function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start;
    const step = (now) => {
      if (!start) start = now;
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return value;
}

function TaxInsights() {
  const [income, setIncome] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { symbol } = useCurrency();

  const handleCalculate = async (e) => {
    e.preventDefault();
    setError('');
    if (!income || Number(income) <= 0) {
      setError('Please enter a valid yearly income');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/tax/insights', { income: Number(income) });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not calculate tax insights');
    } finally {
      setLoading(false);
    }
  };

  const maxPercent = result ? Math.max(...result.breakdown.map((b) => b.percent)) : 0;
  const animatedTax = useCountUp(result?.estimatedTax || 0);

  return (
    <motion.div
      className="container"
      style={{ minHeight: '100vh', background: 'var(--dashboard-bg)' }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="header">
        <div>
          <h2>Tax insights</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>See where your tax rupees go</p>
        </div>
        <div className="row" style={{ flex: 'none', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </button>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="card" style={{ marginBottom: '16px' }}>
        <form onSubmit={handleCalculate} className="row" style={{ gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Yearly income</label>
            <input
              type="number"
              className="input"
              placeholder="e.g. 800000"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
            />
          </div>
          <button type="submit" className="btn" disabled={loading} style={{ alignSelf: 'flex-end' }}>
            {loading ? 'Calculating…' : 'Calculate'}
          </button>
        </form>
      </div>

      {result && (
        <>
          <div className="row" style={{ gap: '12px', marginBottom: '20px' }}>
            <div className="card" style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Estimated tax</p>
              <p style={{ fontSize: '24px', fontWeight: 500, margin: '4px 0 0' }}>
                {symbol}{animatedTax.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="card" style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Effective rate</p>
              <p style={{ fontSize: '24px', fontWeight: 500, margin: '4px 0 0' }}>{result.effectiveRate}%</p>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Estimated breakdown, based on published Union Budget allocation
          </p>

          <div className="card">
            {result.breakdown.map((item) => (
              <div key={item.category} style={{ marginBottom: '14px' }}>
                <div className="row" style={{ justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>{item.category}</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {symbol}{item.amount.toLocaleString('en-IN')} · {item.percent}%
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(item.percent / maxPercent) * 100}%`,
                      background: CATEGORY_COLORS[item.category] || '#4f46e5',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>{result.note}</p>
        </>
      )}
    </motion.div>
  );
}

export default TaxInsights;