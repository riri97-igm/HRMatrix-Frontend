import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import {
  fetchEmployees,
  fetchDepartments,
} from '../../store/slices/employeeSlice';
import { Users, Plus, Search, Trash2, X, Pencil, Download } from 'lucide-react';
import { identityApi, employeeApi } from '../../services/api';
import { exportEmployeesExcel } from '../../utils/exportExcel';

const EmployeeListPage = () => {
  const dispatch = useAppDispatch();
  const { employees, departments, loading } = useAppSelector(
    (state) => state.employee
  );
  const { selectedCountry } = useAppSelector(
    (state) => state.settings ?? { selectedCountry: null, countries: [] }
  );

  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('Active');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'Employee',
    fullName: '',
    phone: '',
    position: '',
    departmentId: '',
    managerId: '',
    baseSalary: '',
    joinDate: '',
  });

  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({
    id: 0,
    phone: '',
    position: '',
    departmentId: '',
    managerId: '',
    baseSalary: '',
  });

  const [showDeactivateForm, setShowDeactivateForm] = useState(false);
  const [deactivateId, setDeactivateId] = useState<number | null>(null);
  const [deactivateForm, setDeactivateForm] = useState({
    status: 'Resigned',
    resignationDate: '',
    remarks: '',
  });

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
  }, [dispatch]);

  const filtered = employees.filter((emp) => {
    const matchSearch =
      emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
      emp.position.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase());
    const matchDept =
      filterDept === '' ||
      emp.departmentName.toLowerCase() === filterDept.toLowerCase();
    const matchStatus =
      filterStatus === '' ||
      (filterStatus === 'Active' && emp.isActive === true) ||
      (filterStatus === 'Inactive' && emp.isActive === false);
    return matchSearch && matchDept && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMsg('');
    try {
      const userRes = await identityApi.post('/api/auth/register', {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
        departmentId: form.departmentId ? parseInt(form.departmentId) : null,
      });
      const userId = userRes.data.userId;
      const empRes = await employeeApi.post('/api/employees', {
        userId,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        position: form.position,
        departmentId: parseInt(form.departmentId),
        managerId: form.managerId ? parseInt(form.managerId) : null,
        baseSalary: parseFloat(form.baseSalary),
        joinDate: form.joinDate,
      });
      const employeeId = empRes.data.id;
      setMsg(`✅ Employee created! Employee ID: ${employeeId}`);
      setShowForm(false);
      setForm({
        email: '', password: '', role: 'Employee',
        fullName: '', phone: '', position: '',
        departmentId: '', managerId: '', baseSalary: '', joinDate: '',
      });
      dispatch(fetchEmployees());
    } catch (error: any) {
      setMsg(error.response?.data?.message || 'Failed to create employee.');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (emp: typeof employees[0]) => {
    setEditForm({
      id: emp.id,
      phone: emp.phone,
      position: emp.position,
      departmentId: emp.departmentId.toString(),
      managerId: emp.managerId?.toString() || '',
      baseSalary: emp.baseSalary.toString(),
    });
    setShowEditForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await employeeApi.put(`/api/employees/${editForm.id}`, {
        phone: editForm.phone,
        position: editForm.position,
        departmentId: parseInt(editForm.departmentId),
        managerId: editForm.managerId ? parseInt(editForm.managerId) : null,
        baseSalary: parseFloat(editForm.baseSalary),
      });
      setMsg('Employee updated successfully!');
      setShowEditForm(false);
      dispatch(fetchEmployees());
    } catch (error: any) {
      setMsg(error.response?.data?.message || 'Failed to update employee.');
    }
  };

  const handleDeactivate = (id: number) => {
    setDeactivateId(id);
    setShowDeactivateForm(true);
  };

  const handleConfirmDeactivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deactivateId) return;
    try {
      await employeeApi.delete(`/api/employees/${deactivateId}`, {
        data: {
          status: deactivateForm.status,
          resignationDate: deactivateForm.resignationDate || null,
          remarks: deactivateForm.remarks,
        },
      });
      setMsg(`Employee ${deactivateForm.status.toLowerCase()} successfully!`);
      setShowDeactivateForm(false);
      setDeactivateId(null);
      setDeactivateForm({ status: 'Resigned', resignationDate: '', remarks: '' });
      dispatch(fetchEmployees());
    } catch (error: any) {
      setMsg(error.response?.data?.message || 'Failed to deactivate employee.');
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Employees</h2>
          <p className="text-gray-500 text-sm">
            Manage all employees — {employees.length} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportEmployeesExcel(filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
          >
            <Download size={16} />
            Export Excel
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            <Plus size={16} />
            Add Employee
          </button>
        </div>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg mb-4 text-sm font-medium ${msg.includes('✅') || msg.includes('success')
          ? 'bg-green-50 text-green-700'
          : 'bg-red-50 text-red-700'
          }`}>
          {msg}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, position..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <select
            value={filterDept}
            onChange={(e) => { setFilterDept(e.target.value); setCurrentPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <div className="flex items-center text-sm text-gray-400">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">No employees found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {[
                  'ID', 'Name', 'Position', 'Department',
                  'Join Date', `Salary (${selectedCountry?.currency || 'MMK'})`,
                  'Status', 'Actions',
                ].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {String(emp.id).padStart(2, '0')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-xs">
                        {emp.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{emp.fullName}</p>
                        <p className="text-xs text-gray-400">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{emp.position}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                      {emp.departmentName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {emp.joinDate.split('T')[0]}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {selectedCountry?.currency || 'MMK'} {emp.baseSalary.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${emp.isActive
                      ? 'bg-green-100 text-green-700'
                      : emp.status === 'Resigned'
                        ? 'bg-orange-100 text-orange-700'
                        : emp.status === 'Terminated'
                          ? 'bg-red-100 text-red-700'
                          : emp.status === 'Retired'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {emp.isActive ? 'Active' : emp.status || 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(emp)}
                        className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600 transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeactivate(emp.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {filtered.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filtered.length)} of{' '}
            {filtered.length} employees
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition ${currentPage === page
                    ? 'bg-indigo-600 text-white'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Add New Employee</h3>
              <button onClick={() => setShowForm(false)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Login Account
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                  <input type="text" required value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                  <input type="email" required value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Password</label>
                  <input type="password" required value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>

              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide pt-2">
                Employee Profile
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                  <input type="text" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Position</label>
                  <input type="text" required value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Department</label>
                  <select required value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Manager (optional)</label>
                  <select value={form.managerId}
                    onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="">No Manager</option>
                    {employees.filter(e => e.isActive).map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} — {emp.position}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Basic Salary ({selectedCountry?.currency || 'MMK'})
                  </label>
                  <input type="number" required value={form.baseSalary}
                    onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Join Date</label>
                  <input type="date" required value={form.joinDate}
                    onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
                  {creating ? 'Creating...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Edit Employee</h3>
              <button onClick={() => setShowEditForm(false)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                  <input type="text" value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Position</label>
                  <input type="text" required value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Department</label>
                  <select required value={editForm.departmentId}
                    onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Manager (optional)</label>
                  <select value={editForm.managerId}
                    onChange={(e) => setEditForm({ ...editForm, managerId: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="">No Manager</option>
                    {employees.filter(e => e.isActive).map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} — {emp.position}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Basic Salary ({selectedCountry?.currency || 'MMK'})
                </label>
                <input type="number" required value={editForm.baseSalary}
                  onChange={(e) => setEditForm({ ...editForm, baseSalary: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditForm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Employee Modal */}
      {showDeactivateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Deactivate Employee</h3>
              <button onClick={() => setShowDeactivateForm(false)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleConfirmDeactivate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Reason</label>
                <select required value={deactivateForm.status}
                  onChange={(e) => setDeactivateForm({ ...deactivateForm, status: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  <option value="Resigned">Resigned</option>
                  <option value="Terminated">Terminated</option>
                  <option value="Retired">Retired</option>
                  <option value="OnLeave">On Leave</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Effective Date</label>
                <input type="date" value={deactivateForm.resignationDate}
                  onChange={(e) => setDeactivateForm({ ...deactivateForm, resignationDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Remarks</label>
                <textarea rows={3} value={deactivateForm.remarks}
                  onChange={(e) => setDeactivateForm({ ...deactivateForm, remarks: e.target.value })}
                  placeholder="Add any additional notes..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowDeactivateForm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-semibold transition">
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EmployeeListPage;