import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchAllLoans, createLoan, settleLoan } from '../../store/slices/payrollSlice';
import { Landmark, Plus, X, CheckCircle } from 'lucide-react';

const AdminLoansPage = () => {
  const dispatch = useAppDispatch();
  const { loans, loading } = useAppSelector((state) => state.payroll);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Settled'>('All');
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    employeeId: '',
    employeeName: '',
    totalLoanAmount: '',
    monthlyDeduction: '',
    startDate: '',
    notes: '',
  });

  useEffect(() => {
    dispatch(fetchAllLoans());
  }, [dispatch]);

  const filtered = loans.filter((l) =>
    filter === 'All' ? true :
    filter === 'Active' ? !l.isSettled :
    l.isSettled
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(
      createLoan({
        ...form,
        employeeId: parseInt(form.employeeId),
        totalLoanAmount: parseFloat(form.totalLoanAmount),
        monthlyDeduction: parseFloat(form.monthlyDeduction),
      })
    );
    if (createLoan.fulfilled.match(result)) {
      setMsg('Loan registered successfully!');
      setShowForm(false);
      dispatch(fetchAllLoans());
      setForm({
        employeeId: '',
        employeeName: '',
        totalLoanAmount: '',
        monthlyDeduction: '',
        startDate: '',
        notes: '',
      });
    } else {
      setMsg('Failed to register loan.');
    }
  };

  const handleSettle = async (id: number) => {
    await dispatch(settleLoan(id));
    dispatch(fetchAllLoans());
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Employee Loans</h2>
          <p className="text-gray-500 text-sm">
            Manage employee loans — auto deducted monthly
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          <Plus size={16} />
          Register Loan
        </button>
      </div>

      {msg && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium">
          {msg}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {['All', 'Active', 'Settled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Landmark size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">No loans found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  'Employee',
                  'Total Amount',
                  'Monthly',
                  'Remaining',
                  'Start Date',
                  'Status',
                  'Actions',
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-gray-500 font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {l.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-medium text-gray-800">
                        {l.employeeName}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.totalLoanAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.monthlyDeduction.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-red-500">
                    {l.remainingBalance.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.startDate.split('T')[0]}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        l.isSettled
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {l.isSettled ? 'Settled' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {!l.isSettled && (
                      <button
                        onClick={() => handleSettle(l.id)}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        <CheckCircle size={12} />
                        Settle
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Register Loan Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Register Loan
              </h3>
              <button onClick={() => setShowForm(false)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="number"
                    required
                    value={form.employeeId}
                    onChange={(e) =>
                      setForm({ ...form, employeeId: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.employeeName}
                    onChange={(e) =>
                      setForm({ ...form, employeeName: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Total Loan Amount
                  </label>
                  <input
                    type="number"
                    required
                    value={form.totalLoanAmount}
                    onChange={(e) =>
                      setForm({ ...form, totalLoanAmount: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Monthly Deduction
                  </label>
                  <input
                    type="number"
                    required
                    value={form.monthlyDeduction}
                    onChange={(e) =>
                      setForm({ ...form, monthlyDeduction: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminLoansPage;