import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchAllPayslips, generatePayslip } from '../../store/slices/payrollSlice';
import { DollarSign, Plus, X } from 'lucide-react';

const AdminPayrollPage = () => {
  const dispatch = useAppDispatch();
  const { payslips, loading } = useAppSelector((state) => state.payroll);
  const [showForm, setShowForm] = useState(false);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [form, setForm] = useState({
    employeeId: '',
    employeeName: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    country: 'Myanmar',
    basicSalary: '',
    allowance: '',
    overtimePay: '',
    yearEndBonus: '',
    thirteenthMonth: '',
    otherDeduction: '',
    employeeAge: '',
    notes: '',
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    dispatch(fetchAllPayslips({ year: filterYear, month: filterMonth }));
  }, [dispatch, filterYear, filterMonth]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(
      generatePayslip({
        ...form,
        employeeId: parseInt(form.employeeId),
        basicSalary: parseFloat(form.basicSalary),
        allowance: parseFloat(form.allowance || '0'),
        overtimePay: parseFloat(form.overtimePay || '0'),
        yearEndBonus: parseFloat(form.yearEndBonus || '0'),
        thirteenthMonth: parseFloat(form.thirteenthMonth || '0'),
        otherDeduction: parseFloat(form.otherDeduction || '0'),
        employeeAge: form.employeeAge ? parseInt(form.employeeAge) : undefined,
      })
    );
    if (generatePayslip.fulfilled.match(result)) {
      setMsg('Payslip generated successfully!');
      setShowForm(false);
      dispatch(fetchAllPayslips({ year: filterYear, month: filterMonth }));
    } else {
      setMsg('Failed to generate payslip.');
    }
  };

  const months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
  ];

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Payroll</h2>
          <p className="text-gray-500 text-sm">
            Generate and manage payslips
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          <Plus size={16} />
          Generate Payslip
        </button>
      </div>

      {msg && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium">
          {msg}
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 flex gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Year</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Month</label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(parseInt(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {months.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : payslips.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">No payslips found for this period.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Employee', 'Month/Year', 'Country', 'Gross', 'Deductions', 'Net Salary'].map(
                  (h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {payslips.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {p.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-medium text-gray-800">{p.employeeName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {months[p.month - 1]} {p.year}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      p.country === 'Myanmar'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {p.country}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {p.grossSalary.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-red-500">
                    -{p.totalDeduction.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-bold text-green-600">
                    {p.netSalary.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Generate Payslip Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Generate Payslip</h3>
              <button onClick={() => setShowForm(false)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="number"
                    required
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Month</label>
                  <select
                    value={form.month}
                    onChange={(e) => setForm({ ...form, month: parseInt(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {months.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Year</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Country</label>
                  <select
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="Myanmar">Myanmar</option>
                    <option value="Singapore">Singapore</option>
                  </select>
                </div>
              </div>

              {/* Earnings */}
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide pt-2">
                Earnings
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Basic Salary', key: 'basicSalary', required: true },
                  { label: 'Allowance', key: 'allowance' },
                  { label: 'Overtime Pay', key: 'overtimePay' },
                  { label: 'Year End Bonus', key: 'yearEndBonus' },
                  { label: '13th Month', key: 'thirteenthMonth' },
                ].map(({ label, key, required }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      {label}
                    </label>
                    <input
                      type="number"
                      required={required}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                ))}
              </div>

              {/* Deductions */}
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide pt-2">
                Manual Deductions
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Other Deduction
                  </label>
                  <input
                    type="number"
                    value={form.otherDeduction}
                    onChange={(e) => setForm({ ...form, otherDeduction: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                {form.country === 'Singapore' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Employee Age (for CPF)
                    </label>
                    <input
                      type="number"
                      value={form.employeeAge}
                      onChange={(e) => setForm({ ...form, employeeAge: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminPayrollPage;