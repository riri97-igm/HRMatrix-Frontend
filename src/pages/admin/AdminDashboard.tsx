import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchEmployees } from '../../store/slices/employeeSlice';
import { fetchAllLeaves } from '../../store/slices/leaveSlice';
import { fetchAllPayslips } from '../../store/slices/payrollSlice';
import { Search } from 'lucide-react';

const AdminDashboard = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { employees } = useAppSelector((state) => state.employee);
  const { leaves } = useAppSelector((state) => state.leave);
  const { payslips } = useAppSelector((state) => state.payroll);

  // Leave filters
  const [leaveSearch, setLeaveSearch] = useState('');
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('');
  const [leaveDateFrom, setLeaveDateFrom] = useState('');
  const [leaveDateTo, setLeaveDateTo] = useState('');
  const [leavePage, setLeavePage] = useState(1);
  const leavePerPage = 5;

  // Employee filters
  const [empSearch, setEmpSearch] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('');
  const [empPage, setEmpPage] = useState(1);
  const empPerPage = 5;

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchAllLeaves());
    dispatch(fetchAllPayslips({}));
  }, [dispatch]);

  const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;
  const approvedLeaves = leaves.filter((l) => l.status === 'Approved').length;

  // ── Leave Filters ─────────────────────────────────────
  const filteredLeaves = leaves.filter((l) => {
    const matchSearch =
      l.employeeName.toLowerCase().includes(leaveSearch.toLowerCase()) ||
      l.leaveType.toLowerCase().includes(leaveSearch.toLowerCase());

    const matchStatus = leaveStatusFilter === '' || l.status === leaveStatusFilter;

    const matchDateFrom =
      leaveDateFrom === '' ||
      new Date(l.startDate) >= new Date(leaveDateFrom);

    const matchDateTo =
      leaveDateTo === '' ||
      new Date(l.endDate) <= new Date(leaveDateTo);

    return matchSearch && matchStatus && matchDateFrom && matchDateTo;
  });

  const totalLeavePages = Math.ceil(filteredLeaves.length / leavePerPage);
  const paginatedLeaves = filteredLeaves.slice(
    (leavePage - 1) * leavePerPage,
    leavePage * leavePerPage
  );

  // ── Employee Filters ──────────────────────────────────
  const departments = [...new Set(employees.map((e) => e.departmentName))];

  const filteredEmployees = employees.filter((e) => {
    const matchSearch =
      e.fullName.toLowerCase().includes(empSearch.toLowerCase()) ||
      e.position.toLowerCase().includes(empSearch.toLowerCase());

    const matchDept =
      empDeptFilter === '' || e.departmentName === empDeptFilter;

    return matchSearch && matchDept;
  });

  const totalEmpPages = Math.ceil(filteredEmployees.length / empPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (empPage - 1) * empPerPage,
    empPage * empPerPage
  );

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Welcome back, {user?.fullName}! 👋
        </h2>
        <p className="text-gray-500 text-sm">
          Here's what's happening in HRMatrix today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon="👥" label="Total Employees" value={employees.length} color="bg-indigo-500" />
        <StatCard icon="⏳" label="Pending Leaves" value={pendingLeaves} color="bg-yellow-500" />
        <StatCard icon="✅" label="Approved Leaves" value={approvedLeaves} color="bg-green-500" />
        <StatCard icon="💰" label="Total Payslips" value={payslips.length} color="bg-blue-500" />
      </div>

      {/* Leave Requests Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Leave Requests
        </h3>

        {/* Leave Filters */}
        <div className="flex gap-3 flex-wrap mb-4">
          <div className="relative flex-1 min-w-40">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employee or type..."
              value={leaveSearch}
              onChange={(e) => { setLeaveSearch(e.target.value); setLeavePage(1); }}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <select
            value={leaveStatusFilter}
            onChange={(e) => { setLeaveStatusFilter(e.target.value); setLeavePage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={leaveDateFrom}
              onChange={(e) => { setLeaveDateFrom(e.target.value); setLeavePage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={leaveDateTo}
              onChange={(e) => { setLeaveDateTo(e.target.value); setLeavePage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {(leaveSearch || leaveStatusFilter || leaveDateFrom || leaveDateTo) && (
            <button
              onClick={() => {
                setLeaveSearch('');
                setLeaveStatusFilter('');
                setLeaveDateFrom('');
                setLeaveDateTo('');
                setLeavePage(1);
              }}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Leave Table */}
        {filteredLeaves.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">
            No leave requests found.
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {['Employee', 'Type', 'From', 'To', 'Days', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedLeaves.map((l) => (
                  <tr key={l.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{l.employeeName}</td>
                    <td className="px-4 py-3 text-gray-600">{l.leaveType}</td>
                    <td className="px-4 py-3 text-gray-600">{l.startDate.split('T')[0]}</td>
                    <td className="px-4 py-3 text-gray-600">{l.endDate.split('T')[0]}</td>
                    <td className="px-4 py-3 text-gray-600">{l.totalDays}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${l.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        l.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Leave Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Showing {((leavePage - 1) * leavePerPage) + 1} to{' '}
                {Math.min(leavePage * leavePerPage, filteredLeaves.length)} of{' '}
                {filteredLeaves.length} requests
              </p>
              {totalLeavePages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLeavePage((p) => Math.max(1, p - 1))}
                    disabled={leavePage === 1}
                    className="px-3 py-1 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalLeavePages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setLeavePage(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition ${leavePage === page
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setLeavePage((p) => Math.min(totalLeavePages, p + 1))}
                    disabled={leavePage === totalLeavePages}
                    className="px-3 py-1 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Recent Employees Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Employees
        </h3>

        {/* Employee Filters */}
        <div className="flex gap-3 flex-wrap mb-4">
          <div className="relative flex-1 min-w-40">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or position..."
              value={empSearch}
              onChange={(e) => { setEmpSearch(e.target.value); setEmpPage(1); }}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <select
            value={empDeptFilter}
            onChange={(e) => { setEmpDeptFilter(e.target.value); setEmpPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {(empSearch || empDeptFilter) && (
            <button
              onClick={() => {
                setEmpSearch('');
                setEmpDeptFilter('');
                setEmpPage(1);
              }}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Employee Table */}
        {filteredEmployees.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">
            No employees found.
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {['ID', 'Name', 'Position', 'Department', 'Join Date', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.map((e) => (
                  <tr key={e.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {String(e.id).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {e.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{e.fullName}</p>
                          <p className="text-xs text-gray-400">{e.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{e.position}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                        {e.departmentName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {e.joinDate.split('T')[0]}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${e.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}>
                        {e.isActive ? 'Active' : e.status || 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Employee Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Showing {((empPage - 1) * empPerPage) + 1} to{' '}
                {Math.min(empPage * empPerPage, filteredEmployees.length)} of{' '}
                {filteredEmployees.length} employees
              </p>
              {totalEmpPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEmpPage((p) => Math.max(1, p - 1))}
                    disabled={empPage === 1}
                    className="px-3 py-1 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalEmpPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setEmpPage(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition ${empPage === page
                        ? 'bg-indigo-600 text-white'
                        : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setEmpPage((p) => Math.min(totalEmpPages, p + 1))}
                    disabled={empPage === totalEmpPages}
                    className="px-3 py-1 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
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