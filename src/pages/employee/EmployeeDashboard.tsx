import { useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchMyProfile } from '../../store/slices/employeeSlice';
import { fetchMyLeaves, fetchLeaveBalance } from '../../store/slices/leaveSlice';
import { fetchRecentPayslips } from '../../store/slices/payrollSlice';

const EmployeeDashboard = () => {
  const dispatch = useAppDispatch();
  const { selectedEmployee } = useAppSelector((state) => state.employee);
  const { leaves, balance } = useAppSelector((state) => state.leave);
  const { recentPayslips } = useAppSelector((state) => state.payroll);

  useEffect(() => {
    dispatch(fetchMyProfile());
    dispatch(fetchMyLeaves());
    dispatch(fetchRecentPayslips());
    if (selectedEmployee?.joinDate) {
      dispatch(fetchLeaveBalance(selectedEmployee.joinDate));
    }
  }, [dispatch, selectedEmployee?.joinDate]);

  const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;
  const approvedLeaves = leaves.filter((l) => l.status === 'Approved').length;

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Welcome, {selectedEmployee?.fullName || 'Employee'}! 👋
        </h2>
        <p className="text-gray-500 text-sm">
          {selectedEmployee?.position} · {selectedEmployee?.departmentName}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
          <div className="bg-indigo-500 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center">
            📋
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{pendingLeaves}</p>
            <p className="text-gray-500 text-sm">Pending Leaves</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
          <div className="bg-green-500 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center">
            ✅
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{approvedLeaves}</p>
            <p className="text-gray-500 text-sm">Approved Leaves</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
          <div className="bg-blue-500 text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center">
            💰
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">
              {recentPayslips.length}
            </p>
            <p className="text-gray-500 text-sm">Recent Payslips</p>
          </div>
        </div>
      </div>

      {/* Leave Balance */}
      {balance && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Leave Balance {balance.year}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Annual Leave */}
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-indigo-700 mb-3">
                Annual Leave
              </p>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Entitlement</span>
                <span className="font-semibold">{balance.annualEntitlement} days</span>
              </div>
              {balance.carryForward > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Carry Forward</span>
                  <span className="font-semibold text-green-600">
                    +{balance.carryForward} days
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Used</span>
                <span className="font-semibold text-red-500">
                  -{balance.annualUsed} days
                </span>
              </div>
              <div className="border-t border-indigo-100 pt-2 flex justify-between text-sm">
                <span className="font-bold text-indigo-700">Remaining</span>
                <span className="font-bold text-indigo-700">
                  {balance.annualRemaining} days
                </span>
              </div>
              {/* Progress Bar */}
              <div className="mt-3 bg-indigo-100 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      (balance.annualUsed / balance.totalAnnualAvailable) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Medical Leave */}
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-green-700 mb-3">
                Medical Leave
              </p>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Total</span>
                <span className="font-semibold">{balance.medicalTotal} days</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Used</span>
                <span className="font-semibold text-red-500">
                  -{balance.medicalUsed} days
                </span>
              </div>
              <div className="border-t border-green-100 pt-2 flex justify-between text-sm">
                <span className="font-bold text-green-700">Remaining</span>
                <span className="font-bold text-green-700">
                  {balance.medicalRemaining} days
                </span>
              </div>
              {/* Progress Bar */}
              <div className="mt-3 bg-green-100 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
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
          <p className="text-xs text-gray-400 mt-3">
            Service Years: {balance.serviceYears} year{balance.serviceYears !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Recent Payslips */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Recent Payslips
        </h3>
        {recentPayslips.length === 0 ? (
          <p className="text-gray-400 text-sm">No payslips yet.</p>
        ) : (
          <div className="space-y-3">
            {recentPayslips.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {new Date(p.year, p.month - 1).toLocaleString('default', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-400">{p.country}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {p.netSalary.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">Net Salary</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmployeeDashboard;