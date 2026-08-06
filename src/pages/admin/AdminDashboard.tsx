import { useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchEmployees } from '../../store/slices/employeeSlice';
import { fetchAllLeaves } from '../../store/slices/leaveSlice';
import { fetchAllPayslips } from '../../store/slices/payrollSlice';

const AdminDashboard = () => {
  const dispatch = useAppDispatch();
  const { employees } = useAppSelector((state) => state.employee);
  const { leaves } = useAppSelector((state) => state.leave);
  const { payslips } = useAppSelector((state) => state.payroll);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchAllLeaves());
    dispatch(fetchAllPayslips({}));
  }, [dispatch]);

  const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;
  const approvedLeaves = leaves.filter((l) => l.status === 'Approved').length;

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500 text-sm">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="👥"
          label="Total Employees"
          value={employees.length}
          color="bg-indigo-500"
        />
        <StatCard
          icon="⏳"
          label="Pending Leaves"
          value={pendingLeaves}
          color="bg-yellow-500"
        />
        <StatCard
          icon="✅"
          label="Approved Leaves"
          value={approvedLeaves}
          color="bg-green-500"
        />
        <StatCard
          icon="💰"
          label="Total Payslips"
          value={payslips.length}
          color="bg-blue-500"
        />
      </div>

      {/* Recent Leave Requests */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Recent Leave Requests
        </h3>
        {leaves.length === 0 ? (
          <p className="text-gray-400 text-sm">No leave requests yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['Employee', 'Type', 'From', 'To', 'Days', 'Status'].map(
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
              {leaves.slice(0, 5).map((l) => (
                <tr
                  key={l.id}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {l.employeeName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{l.leaveType}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.startDate.split('T')[0]}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.endDate.split('T')[0]}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{l.totalDays}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${l.status === 'Approved'
                          ? 'bg-green-100 text-green-700'
                          : l.status === 'Rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                        }`}
                    >
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Employees */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Recent Employees
        </h3>
        {employees.length === 0 ? (
          <p className="text-gray-400 text-sm">No employees yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['Name', 'Position', 'Department', 'Join Date', 'Status'].map(
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
              {employees.slice(0, 5).map((e) => (
                <tr
                  key={e.id}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {e.fullName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{e.position}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {e.departmentName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {e.joinDate.split('T')[0]}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${e.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                        }`}
                    >
                      {e.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
}) => (
  <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
    <div className={`${color} text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  </div>
);

export default AdminDashboard;