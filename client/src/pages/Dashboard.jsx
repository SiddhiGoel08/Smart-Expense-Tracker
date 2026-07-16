import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../context/ThemeContext';

const COLORS = ['#4f46e5', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6', '#0891b2'];

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [error, setError] = useState('');

  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [monthlyBudget, setMonthlyBudget] = useState(null);
  const [budgetInput, setBudgetInput] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const { theme, toggleTheme } = useTheme();

  const fetchExpenses = async () => {
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (searchFilter) params.search = searchFilter;
      if (dateFilter) {
        params.startDate = dateFilter;
        params.endDate = dateFilter;
      }
      const res = await api.get('/expenses', { params });
      setExpenses(res.data);
    } catch (err) {
      setError('Failed to load expenses');
    }
  };

  const fetchMonthlyBudget = async () => {
    try {
      const res = await api.get('/monthly-budget/status');
      setMonthlyBudget(res.data);
    } catch (err) {
      console.log('No budget set yet');
    }
  };

  const handleSetBudget = async (e) => {
    e.preventDefault();
    try {
      await api.post('/monthly-budget', { limit: Number(budgetInput) });
      setBudgetInput('');
      fetchMonthlyBudget();
    } catch (err) {
      setError('Failed to set budget');
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter, searchFilter, dateFilter]);

  useEffect(() => {
    fetchMonthlyBudget();
  }, [expenses]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/expenses', {
        amount: Number(amount),
        description,
        category: selectedCategory || undefined,
        date: expenseDate ? new Date(expenseDate).toISOString() : new Date().toISOString(),
      });
      setAmount('');
      setDescription('');
      setExpenseDate('');
      setSelectedCategory('');
      fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add expense');
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/expenses/${id}`);
    fetchExpenses();
  };

  const startEdit = (exp) => {
    setEditingId(exp._id);
    setEditAmount(exp.amount);
    setEditDescription(exp.description);
    setEditCategory(exp.category);
  };

  const handleUpdateExpense = async (id) => {
    try {
      await api.put(`/expenses/${id}`, {
        amount: Number(editAmount),
        description: editDescription,
        category: editCategory,
      });
      setEditingId(null);
      fetchExpenses();
    } catch (err) {
      setError('Failed to update expense');
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/expenses/export/csv', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'expenses.csv';
      link.click();
    } catch (err) {
      setError('Failed to export CSV');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const chartData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

  const categories = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Uncategorized'];

  return (
    <div className="container" style={{ minHeight: '100vh', background: 'var(--dashboard-bg)' }}>
      <div className="header">
        <div>
          <h2>Welcome, {user?.name || 'User'} 👋</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Here's your spending overview</p>
        </div>
        <div className="row" style={{ flex: 'none', gap: '10px' }}>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="card">
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>Total Spent</p>
        <h1 style={{ margin: '4px 0' }}>₹{totalAmount}</h1>
      </div>

      <div className="card">
        <h3>📅 Monthly Budget</h3>

        {!monthlyBudget?.limit && (
          <form onSubmit={handleSetBudget} className="row">
            <input
              className="input"
              type="number"
              placeholder="Set your monthly budget"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              required
            />
            <button className="btn" type="submit" style={{ flex: 'none' }}>Set Budget</button>
          </form>
        )}

        {monthlyBudget?.limit && (
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Budget: ₹{monthlyBudget.limit} &nbsp;•&nbsp; Spent: ₹{monthlyBudget.totalSpent} &nbsp;•&nbsp; Remaining: ₹{monthlyBudget.remaining}
            </p>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(monthlyBudget.percentUsed, 100)}%`,
                  background: monthlyBudget.isOverBudget ? 'var(--danger)' : 'var(--success)',
                }}
              />
            </div>

            {monthlyBudget.isOverBudget && (
              <p className="error-text" style={{ fontWeight: 600, marginTop: '12px' }}>
                ⚠️ You've gone over budget by ₹{Math.abs(monthlyBudget.remaining)}.
              </p>
            )}

            {!monthlyBudget.isOverBudget && monthlyBudget.isMonthOver && (
              <div style={{ background: 'var(--success-bg)', padding: '12px', borderRadius: '8px', marginTop: '12px' }}>
                <p style={{ color: 'var(--success)', fontWeight: 600, margin: 0 }}>
                  🎉 You stayed under budget, with ₹{monthlyBudget.remaining} left over!
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 0' }}>
                  General idea (not personalized financial advice): consider a savings account, RD,
                  or SIP for the surplus. Always research or consult an advisor before investing.
                </p>
              </div>
            )}

            <button
              className="btn btn-secondary"
              onClick={() => setMonthlyBudget({ ...monthlyBudget, limit: null })}
              style={{ marginTop: '12px', fontSize: '13px' }}
            >
              Change Budget
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h3>➕ Add Expense</h3>
        <form onSubmit={handleAddExpense} className="row">
          <input
            className="input"
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <input
            className="input"
            type="text"
            placeholder="Description (e.g. Swiggy order)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            style={{ flex: 2 }}
          />
          <input
            className="input"
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
          />
          <select
            className="input"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Auto-detect</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Shopping">Shopping</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Bills">Bills</option>
          </select>
          <button className="btn" type="submit" style={{ flex: 'none' }}>Add</button>
        </form>
      </div>

      <div className="card">
        <h3>🔍 Filter Expenses</h3>
        <div className="row">
          <select className="input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            className="input"
            type="text"
            placeholder="Search description..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
          <input
            className="input"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="card">
          <h3>📊 Spending by Category</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>📋 Your Expenses</h3>
          <button className="btn btn-secondary" onClick={handleExportCSV}>⬇️ Export CSV</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((exp) => (
              <tr key={exp._id}>
                {editingId === exp._id ? (
                  <>
                    <td>
                      <input className="input" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                    </td>
                    <td>
                      <select className="input" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                        <option value="Food">Food</option>
                        <option value="Transport">Transport</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Bills">Bills</option>
                        <option value="Uncategorized">Uncategorized</option>
                      </select>
                    </td>
                    <td>
                      <input className="input" type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                    </td>
                    <td>{new Date(exp.date).toLocaleDateString()}</td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn" onClick={() => handleUpdateExpense(exp._id)}>Save</button>
                      <button className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{exp.description}</td>
                    <td><span className="badge">{exp.category}</span></td>
                    <td>₹{exp.amount}</td>
                    <td>{new Date(exp.date).toLocaleDateString()}</td>
                    <td style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn-secondary" onClick={() => startEdit(exp)}>Edit</button>
                      <button className="btn-danger" onClick={() => handleDelete(exp._id)}>Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;