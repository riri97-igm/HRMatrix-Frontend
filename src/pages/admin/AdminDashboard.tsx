import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchEmployees } from '../../store/slices/employeeSlice';
import { fetchAllLeaves, reviewLeave } from '../../store/slices/leaveSlice';
import { fetchAllPayslips, fetchAllLoans } from '../../store/slices/payrollSlice';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, Clock, Users,
  ClipboardList, DollarSign, Landmark, AlertCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { employees } = useAppSelector((state) => state.employee);
  const { leaves } = useAppSelector((state) => state.leave);
  const { payslips, loans } = useAppSelector((state) => state.payroll);
  const [comment, setComment] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState('');

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchAllLeaves());
    dispatch(fetchAllPayslips({}));
    dispatch(fetchAllLoans());
  }, [dispatch]);

  // Stats
  const activeEmployees = employees.filter((e) => e.isActive).length;
  const pendingLeaves = leaves.filter((l) => l.status === 'Pending');
  const pendingLoans = loans.filter((l) =>
    ['Pending', 'ManagerApproved', 'HRApproved'].includes(l.status)
  );
  const payslipsThisMonth = payslips.filter(
    (p) => p.month === currentMonth + 1 && p.year === currentYear
  ).length;
  const newEmployeesThisMonth = employees.filter((e) => {
    const d = new Date(e.joinDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  // Quick Approve Leave
  const handleQuickApprove = async (id: number, approved: boolean) => {
    await dispatch(reviewLeave({ id, isApproved: approved, comment: comment[id] || '' }));
    setMsg(approved ? 'Leave approved!' : 'Leave rejected!');
    dispatch(fetchAllLeaves());
  };

  // Work Anniversaries This Month
  const anniversaries = employees.filter((e) => {
    if (!e.isActive) return false;
    const join = new Date(e.joinDate);
    return join.getMonth() === currentMonth && join.getDate() >= new Date().getDate();
  });

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Welcome back, {user?.fullName}! 👋
        </h2>
        <p className="text-gray-500 text-sm">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </p>
      </div>

      {msg && (
        <div className="px-4 py-3 rounded-lg mb-4 text-sm font-medium bg-green-50 text-green-700">
          {msg}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <QuickStat
          icon={<Users size={20} className="text-white" />}
          label="Active Employees"
          value={activeEmployees}
          hint="Total headcount"
          color="bg-indigo-500"
          onClick={() => navigate('/admin/employees')}
        />
        <QuickStat
          icon={<ClipboardList size={20} className="text-white" />}
          label="Pending Leaves"
          value={pendingLeaves.length}
          hint="Need your approval"
          color={pendingLeaves.length > 0 ? 'bg-yellow-500' : 'bg-green-500'}
          onClick={() => navigate('/admin/leaves')}
        />
        <QuickStat
          icon={<Landmark size={20} className="text-white" />}
          label="Pending Loans"
          value={pendingLoans.length}
          hint="In approval process"
          color={pendingLoans.length > 0 ? 'bg-orange-500' : 'bg-green-500'}
          onClick={() => navigate('/admin/loans')}
        />
        <QuickStat
          icon={<DollarSign size={20} className="text-white" />}
          label="Payslips This Month"
          value={payslipsThisMonth}
          hint={`${new Date().toLocaleString('default', { month: 'long' })} ${currentYear}`}
          color="bg-blue-500"
          onClick={() => navigate('/admin/payroll')}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left — Pending Leave Approvals */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Pending Leave Requests
              </h3>
              <button
                onClick={() => navigate('/admin/leaves')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View All →
              </button>
            </div>

            {pendingLeaves.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={32} className="mx-auto text-green-400 mb-2" />
                <p className="text-gray-400 text-sm">All caught up! No pending leave requests.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLeaves.slice(0, 5).map((l) => (
                  <div key={l.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {l.employeeName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{l.employeeName}</p>
                          <p className="text-xs text-gray-400">
                            {l.leaveType} · {l.startDate.split('T')[0]} → {l.endDate.split('T')[0]} · {l.totalDays} day{l.totalDays > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 italic mb-3">"{l.reason}"</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Comment (optional)"
                        value={comment[l.id] || ''}
                        onChange={(e) => setComment({ ...comment, [l.id]: e.target.value })}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <button
                        onClick={() => handleQuickApprove(l.id, true)}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1 rounded-lg transition"
                      >
                        <CheckCircle size={12} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleQuickApprove(l.id, false)}
                        className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-lg transition"
                      >
                        <XCircle size={12} />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {pendingLeaves.length > 5 && (
                  <button
                    onClick={() => navigate('/admin/leaves')}
                    className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium py-2"
                  >
                    View {pendingLeaves.length - 5} more pending requests →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pending Loans Summary */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Loan Approval Queue</h3>
              <button
                onClick={() => navigate('/admin/loans')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View All →
              </button>
            </div>

            {pendingLoans.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle size={32} className="mx-auto text-green-400 mb-2" />
                <p className="text-gray-400 text-sm">No pending loan requests.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Pending stages breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: 'Waiting Manager',
                      count: loans.filter((l) => l.status === 'Pending').length,
                      color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                    },
                    {
                      label: 'Waiting HR',
                      count: loans.filter((l) => l.status === 'ManagerApproved').length,
                      color: 'bg-blue-50 text-blue-700 border-blue-200',
                    },
                    {
                      label: 'Waiting CFO',
                      count: loans.filter((l) => l.status === 'HRApproved').length,
                      color: 'bg-purple-50 text-purple-700 border-purple-200',
                    },
                  ].map((stage) => (
                    <div key={stage.label} className={`border rounded-xl p-3 text-center ${stage.color}`}>
                      <p className="text-2xl font-bold">{stage.count}</p>
                      <p className="text-xs font-medium">{stage.label}</p>
                    </div>
                  ))}
                </div>

                {/* Recent pending loans */}
                {pendingLoans.slice(0, 3).map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {loan.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{loan.employeeName}</p>
                        <p className="text-xs text-gray-400">{loan.loanType} · {loan.requestedAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${loan.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      loan.status === 'ManagerApproved' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                      {loan.status === 'Pending' ? 'Waiting Manager' :
                        loan.status === 'ManagerApproved' ? 'Waiting HR' : 'Waiting CFO'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — Sidebar Info */}
        <div className="space-y-4">
          {/* New Employees This Month */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">
              🆕 New This Month
            </h3>
            {newEmployeesThisMonth === 0 ? (
              <p className="text-gray-400 text-xs">No new employees this month.</p>
            ) : (
              <>
                <p className="text-3xl font-bold text-indigo-600 mb-1">{newEmployeesThisMonth}</p>
                <p className="text-xs text-gray-400">New employees joined</p>
              </>
            )}
          </div>

          {/* Work Anniversaries */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">
              🎂 Work Anniversaries
            </h3>
            {anniversaries.length === 0 ? (
              <p className="text-gray-400 text-xs">No anniversaries this month.</p>
            ) : (
              <div className="space-y-2">
                {anniversaries.slice(0, 5).map((e) => {
                  const years = currentYear - new Date(e.joinDate).getFullYear();
                  return (
                    <div key={e.id} className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-bold text-xs">
                        {e.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-800">{e.fullName}</p>
                        <p className="text-xs text-gray-400">{years} year{years > 1 ? 's' : ''} 🎉</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Payroll */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700">💰 Payroll This Month</h3>
              <button
                onClick={() => navigate('/admin/payroll')}
                className="text-xs text-indigo-600"
              >
                View →
              </button>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {payslipsThisMonth}
            </p>
            <p className="text-xs text-gray-400">Payslips generated</p>
            {payslipsThisMonth < activeEmployees && (
              <div className="mt-2 flex items-center gap-1 text-xs text-orange-500">
                <AlertCircle size={12} />
                {activeEmployees - payslipsThisMonth} employees without payslip
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: '+ Add Employee', path: '/admin/employees', color: 'text-indigo-600' },
                { label: '📊 View Reports', path: '/admin/reports', color: 'text-blue-600' },
                { label: '💳 Bulk Payroll', path: '/admin/bulk-payroll', color: 'text-green-600' },
                { label: '🌍 Country Policies', path: '/admin/countries', color: 'text-purple-600' },
              ].map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`w-full text-left text-sm font-medium ${link.color} hover:underline py-1`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const QuickStat = ({
  icon, label, value, hint, color, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint: string;
  color: string;
  onClick: () => void;
}) => (
  <div
    onClick={onClick}
    className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4 cursor-pointer hover:shadow-md transition"
  >
    <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-gray-600 text-sm font-medium">{label}</p>
      <p className="text-xs text-gray-400">{hint}</p>
    </div>
  </div>
);

export default AdminDashboard;