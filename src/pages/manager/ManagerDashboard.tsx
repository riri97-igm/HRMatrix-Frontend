import { useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchTeam } from '../../store/slices/employeeSlice';
import { fetchPendingLeaves } from '../../store/slices/leaveSlice';

const ManagerDashboard = () => {
  const dispatch = useAppDispatch();
  const { employees } = useAppSelector((state) => state.employee);
  const { pendingLeaves } = useAppSelector((state) => state.leave);

  useEffect(() => {
    dispatch(fetchTeam());
    dispatch(fetchPendingLeaves());
  }, [dispatch]);

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manager Dashboard</h2>
        <p className="text-gray-500 text-sm">
          Overview of your team and pending approvals.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
          <div className="bg-indigo-500 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center">
            👥
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{employees.length}</p>
            <p className="text-gray-500 text-sm">Team Members</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
          <div className="bg-yellow-500 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center">
            ⏳
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{pendingLeaves.length}</p>
            <p className="text-gray-500 text-sm">Pending Leave Approvals</p>
          </div>
        </div>
      </div>

      {/* Team List */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">My Team</h3>
        {employees.length === 0 ? (
          <p className="text-gray-400 text-sm">No team members found.</p>
        ) : (
          <div className="space-y-3">
            {employees.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {e.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{e.fullName}</p>
                    <p className="text-xs text-gray-400">{e.position}</p>
                  </div>
                </div>
                <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                  {e.departmentName}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Leaves */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Pending Leave Requests
        </h3>
        {pendingLeaves.length === 0 ? (
          <p className="text-gray-400 text-sm">No pending leave requests. 🎉</p>
        ) : (
          <div className="space-y-3">
            {pendingLeaves.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between p-3 rounded-xl bg-yellow-50"
              >
                <div>
                  <p className="font-medium text-gray-800">{l.employeeName}</p>
                  <p className="text-xs text-gray-500">
                    {l.leaveType} · {l.startDate.split('T')[0]} →{' '}
                    {l.endDate.split('T')[0]} · {l.totalDays} days
                  </p>
                </div>
                <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full">
                  Pending
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManagerDashboard;