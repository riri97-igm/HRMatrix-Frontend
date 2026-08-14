import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import {
  fetchMyLeaves,
  fetchLeaveBalance,
  applyLeave,
} from '../../store/slices/leaveSlice';
import { fetchMyProfile } from '../../store/slices/employeeSlice';
import { ClipboardList, Plus, X } from 'lucide-react';

const leaveTypes = [
  'Annual',
  'Medical',
  'Emergency',
  'Unpaid',
  'Hospital',
  'Compensate',
];

const EmployeeLeavePage = () => {
  const dispatch = useAppDispatch();
  const { leaves, balance, loading } = useAppSelector((state) => state.leave);
  const { selectedEmployee } = useAppSelector((state) => state.employee);
  const { user } = useAppSelector((state) => state.auth);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    leaveType: 'Annual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    dispatch(fetchMyLeaves());
    dispatch(fetchMyProfile());
  }, [dispatch]);

  useEffect(() => {
    if (selectedEmployee?.joinDate) {
      dispatch(fetchLeaveBalance(selectedEmployee.joinDate));
    }
  }, [dispatch, selectedEmployee?.joinDate]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(
      applyLeave({
        ...form,
        employeeName: user?.fullName || '',
        joinDate: selectedEmployee?.joinDate || '',
        managerId: selectedEmployee?.managerId || null,
      })
    );
    if (applyLeave.fulfilled.match(result)) {
      setMsg('Leave request submitted successfully!');
      setShowForm(false);
      setForm({ leaveType: 'Annual', startDate: '', endDate: '', reason: '' });
      dispatch(fetchMyLeaves());
      if (selectedEmployee?.joinDate) {
        dispatch(fetchLeaveBalance(selectedEmployee.joinDate));
      }
    } else {
      setMsg(result.payload as string || 'Failed to submit leave request.');
    }
  };

  const statusColor = (status: string) =>
    status === 'Approved'
      ? 'bg-green-100 text-green-700'
      : status === 'Rejected'
        ? 'bg-red-100 text-red-700'
        : 'bg-yellow-100 text-yellow-700';

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Leave</h2>
          <p className="text-gray-500 text-sm">
            Apply and track your leave requests
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          <Plus size={16} />
          Apply Leave
        </button>
      </div>

      {msg && (
        <div
          className={`px-4 py-3 rounded-lg mb-4 text-sm font-medium ${msg.includes('success')
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
            }`}
        >
          {msg}
        </div>
      )}

      {/* Leave Balance */}
      {balance && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-sm font-semibold text-indigo-700 mb-2">
              Annual Leave
            </p>
            <p className="text-3xl font-bold text-gray-800">
              {balance.annualRemaining}
              <span className="text-sm font-normal text-gray-400 ml-1">
                / {balance.totalAnnualAvailable} days
              </span>
            </p>
            {balance.carryForward > 0 && (
              <p className="text-xs text-green-600 mt-1">
                Includes {balance.carryForward} carried forward days
              </p>
            )}
            <div className="mt-3 bg-indigo-100 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full"
                style={{
                  width: `${Math.min(
                    (balance.annualUsed / balance.totalAnnualAvailable) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-sm font-semibold text-green-700 mb-2">
              Medical Leave
            </p>
            <p className="text-3xl font-bold text-gray-800">
              {balance.medicalRemaining}
              <span className="text-sm font-normal text-gray-400 ml-1">
                / {balance.medicalTotal} days
              </span>
            </p>
            <div className="mt-3 bg-green-100 rounded-full h-2 mt-6">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{
                  width: `${Math.min(
                    (balance.medicalUsed / balance.medicalTotal) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Leave History */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            Leave History
          </h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : leaves.length === 0 ? (
          <div className="p-8 text-center">
            <ClipboardList size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">No leave requests yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['Type', 'From', 'To', 'Days', 'Reason', 'Status', 'Comment'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-gray-500 font-semibold"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {leaves.map((l) => (
                <tr
                  key={l.id}
                  className="border-t border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3">
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-1 rounded-full">
                      {l.leaveType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.startDate.split('T')[0]}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.endDate.split('T')[0]}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{l.totalDays}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                    {l.reason}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(l.status)}`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {l.reviewComment || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Apply for Leave</h3>
              <button onClick={() => setShowForm(false)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Leave Type
                </label>
                <select
                  value={form.leaveType}
                  onChange={(e) =>
                    setForm({ ...form, leaveType: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {leaveTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Reason
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.reason}
                  onChange={(e) =>
                    setForm({ ...form, reason: e.target.value })
                  }
                  placeholder="Please provide a reason for your leave request..."
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
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EmployeeLeavePage;