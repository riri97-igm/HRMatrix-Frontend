import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchTeam } from '../../store/slices/employeeSlice';
import { Search, Users } from 'lucide-react';

const ManagerTeamPage = () => {
    const dispatch = useAppDispatch();
    const { employees, loading } = useAppSelector((state) => state.employee);
    const [search, setSearch] = useState('');

    useEffect(() => {
        dispatch(fetchTeam());
    }, [dispatch]);

    const filtered = employees.filter(
        (e) =>
            e.fullName.toLowerCase().includes(search.toLowerCase()) ||
            e.position.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Layout>
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Team</h2>
                <p className="text-gray-500 text-sm">
                    {employees.filter((e) => e.isActive).length} active team members
                </p>
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or position..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                </div>
            </div>

            {/* Team Table — No salary, no status reason */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center">
                        <Users size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-400">No team members found.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                {[
                                    'ID', 'Name', 'Position',
                                    'Department', 'Join Date', 'Status',
                                ].map((h) => (
                                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((emp) => (
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
                                    <td className="px-4 py3">
                                        <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                                            {emp.departmentName}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {emp.joinDate.split('T')[0]}
                                    </td>
                                    <td className="px-4 py-3">
                                        {/* Only show Active/Inactive — no reason */}
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${emp.isActive
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                            {emp.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Info Note */}
            <p className="text-xs text-gray-400 mt-4 text-center">
                🔒 Salary and detailed status information is confidential — contact HR for details.
            </p>
        </Layout>
    );
};

export default ManagerTeamPage;