import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFF'];

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [error, setError] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState(null);
  const [budgetInput, setBudgetInput] = useState('');

  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

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
    <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Welcome, {user?.name || 'User'}</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <h3>Total Spent: ₹{totalAmount}</h3>
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', margin: '20px 0' }}>
  <h3>Monthly Budget</h3>

  {!monthlyBudget?.limit && (
    <form onSubmit={handleSetBudget} style={{ display: 'flex', gap: '10px' }}>
      <input
        type="number"
        placeholder="Set your monthly budget"
        value={budgetInput}
        onChange={(e) => setBudgetInput(e.target.value)}
        style={{ padding: '8px', flex: 1 }}
        required
      />
      <button type="submit" style={{ padding: '8px 16px' }}>Set Budget</button>
    </form>
  )}

  {monthlyBudget?.limit && (
    <div>
      <p>Budget: ₹{monthlyBudget.limit} | Spent: ₹{monthlyBudget.totalSpent} | Remaining: ₹{monthlyBudget.remaining}</p>

      <div style={{ background: '#eee', borderRadius: '4px', overflow: 'hidden', height: '20px' }}>
        <div
          style={{
            width: `${Math.min(monthlyBudget.percentUsed, 100)}%`,
            background: monthlyBudget.isOverBudget ? '#e63946' : '#2a9d8f',
            height: '100%',
          }}
        />
      </div>

      {monthlyBudget.isOverBudget && (
        <p style={{ color: '#e63946', fontWeight: 'bold', marginTop: '10px' }}>
          ⚠️ You've gone over your monthly budget by ₹{Math.abs(monthlyBudget.remaining)}.
        </p>
      )}

      {!monthlyBudget.isOverBudget && monthlyBudget.isMonthOver && (
        <div style={{ background: '#e8f5e9', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
          <p style={{ color: '#2a9d8f', fontWeight: 'bold' }}>
            🎉 You stayed under budget this month, with ₹{monthlyBudget.remaining} left over!
          </p>
          <p style={{ fontSize: '14px', color: '#555' }}>
            General idea (not personalized financial advice): consider moving your surplus into a
            savings account, a recurring deposit, or a simple index fund/SIP — small consistent
            amounts add up over time. Always research or consult a financial advisor before investing.
          </p>
        </div>
      )}

      <button
        onClick={() => setMonthlyBudget({ ...monthlyBudget, limit: null })}
        style={{ marginTop: '10px', fontSize: '12px' }}
      >
        Change Budget
      </button>
    </div>
  )}
</div>


      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleAddExpense} style={{ margin: '20px 0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          style={{ padding: '8px', flex: 1 }}
        />
        <input
          type="text"
          placeholder="Description (e.g. Swiggy order)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          style={{ padding: '8px', flex: 2 }}
        />
        <input
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
          style={{ padding: '8px' }}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: '8px' }}
        >
          <option value="">Auto-detect</option>
          <option value="Food">Food</option>
          <option value="Transport">Transport</option>
          <option value="Shopping">Shopping</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Bills">Bills</option>
        </select>
        <button type="submit" style={{ padding: '8px 16px' }}>Add</button>
      </form>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: '8px' }}>
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search description..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          style={{ padding: '8px' }}
        />

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{ padding: '8px' }}
        />
      </div>

      {chartData.length > 0 && (
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
      )}

      <h3>Your Expenses</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Description</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Category</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Amount</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((exp) => (
            <tr key={exp._id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>{exp.description}</td>
              <td style={{ padding: '8px' }}>{exp.category}</td>
              <td style={{ padding: '8px' }}>₹{exp.amount}</td>
              <td style={{ padding: '8px' }}>{new Date(exp.date).toLocaleDateString()}</td>
              <td style={{ padding: '8px' }}>
                <button onClick={() => handleDelete(exp._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;