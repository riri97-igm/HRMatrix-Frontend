import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchDepartments } from '../../store/slices/employeeSlice';
import { employeeApi } from '../../services/api';
import { Building2, Plus, Pencil, Trash2, X } from 'lucide-react';
import { logAction } from '../../utils/auditLog';

const DepartmentPage = () => {
    const dispatch = useAppDispatch();
    const { departments, loading } = useAppSelector((state) => state.employee);

    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [name, setName] = useState('');
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        dispatch(fetchDepartments());
    }, [dispatch]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await employeeApi.post('/api/departments', { name });
            setMsg('Department created successfully!');
            setIsError(false);
            setShowAddForm(false);
            setName('');
            dispatch(fetchDepartments());
        } catch (error: any) {
            setMsg(error.response?.data?.message || 'Failed to create department.');
            setIsError(true);
        }
        await logAction('Created', 'Department', String(name),
            `Department created: ${name}`
        );
    };

    const handleEdit = (id: number, currentName: string) => {
        setEditId(id);
        setName(currentName);
        setShowEditForm(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editId) return;
        try {
            await employeeApi.put(`/api/departments/${editId}`, { name });
            setMsg('Department updated successfully!');
            setIsError(false);
            setShowEditForm(false);
            setName('');
            setEditId(null);
            dispatch(fetchDepartments());
        } catch (error: any) {
            setMsg(error.response?.data?.message || 'Failed to update department.');
            setIsError(true);
        }
        await logAction('Updated', 'Department', String(editId),
            `Department renamed to: ${name}`
        );
    };

    const handleDelete = async (id: number, deptName: string) => {
        if (!window.confirm(`Delete department "${deptName}"?`)) return;
        try {
            await employeeApi.delete(`/api/departments/${id}`);
            setMsg('Department deleted successfully!');
            setIsError(false);
            dispatch(fetchDepartments());
        } catch (error: any) {
            setMsg(error.response?.data?.message || 'Failed to delete department.');
            setIsError(true);
        }
        await logAction('Deleted', 'Department', String(id),
            `Department deleted: ${deptName}`
        );
    };

    return (
        <Layout>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Departments</h2>
                    <p className="text-gray-500 text-sm">
                        Manage company departments — {departments.length} total
                    </p>
                </div>
                <button
                    onClick={() => { setShowAddForm(true); setName(''); }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                    <Plus size={16} />
                    Add Department
                </button>
            </div>

            {msg && (
                <div className={`px-4 py-3 rounded-lg mb-4 text-sm font-medium ${isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                    }`}>
                    {msg}
                </div>
            )}

            {/* Department List */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading...</div>
                ) : departments.length === 0 ? (
                    <div className="p-8 text-center">
                        <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-400">No departments found.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                {['ID', 'Department Name', 'Actions'].map((h) => (
                                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {departments.map((d) => (
                                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                                        {String(d.id).padStart(2, '0')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                <Building2 size={16} className="text-indigo-600" />
                                            </div>
                                            <p className="font-medium text-gray-800">{d.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEdit(d.id, d.name)}
                                                className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600 transition"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(d.id, d.name)}
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
            </div>

            {/* Add Modal */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Add Department</h3>
                            <button onClick={() => setShowAddForm(false)}>
                                <X size={20} className="text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">
                                    Department Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Engineering"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditForm && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Edit Department</h3>
                            <button onClick={() => setShowEditForm(false)}>
                                <X size={20} className="text-gray-400 hover:text-gray-600" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">
                                    Department Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEditForm(false)}
                                    className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default DepartmentPage;