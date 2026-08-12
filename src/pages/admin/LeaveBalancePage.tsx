import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchEmployees } from '../../store/slices/employeeSlice';
import { leaveApi } from '../../services/api';
import { Search } from 'lucide-react';

interface LeaveBalance {
    employeeId: number;
    employeeName: string;
    departmentName: string;
    year: number;
    annualEntitlement: number;
    carryForward: number;
    totalAnnualAvailable: number;
    annualUsed: number;
    annualRemaining: number;
    medicalTotal: number;
    medicalUsed: number;
    medicalRemaining: number;
    serviceYears: number;
}

const LeaveBalancePage = () => {
    const dispatch = useAppDispatch();
    const { employees, departments } = useAppSelector((state) => state.employee);
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [filterDept, setFilterDept] = useState('');

    useEffect(() => {
        dispatch(fetchEmployees());
    }, [dispatch]);

    useEffect(() => {
        if (employees.length > 0) fetchAllBalances();
    }, [employees]);

    const fetchAllBalances = async () => {
        setLoading(true);
        const results: LeaveBalance[] = [];

        for (const emp of employees.filter((e) => e.isActive)) {
            try {
                const res = await leaveApi.get(
                    `/api/leave/balance?employeeId=${emp.id}&joinDate=${emp.joinDate}`
                );
                results.push({
                    employeeId: emp.id,
                    employeeName: emp.fullName,
                    departmentName: emp.departmentName,
                    ...res.data,
                });
            } catch {
                // skip if error
            }
        }

        setBalances(results);
        setLoading(false);
    };

    const filtered = balances.filter((b) => {
        const matchSearch =
            search === '' ||
            b.employeeName.toLowerCase().includes(search.toLowerCase());
        const matchDept =
            filterDept === '' || b.departmentName === filterDept;
        return matchSearch && matchDept;
    });

    const getLowLeaveColor = (remaining: number, total: number) => {
        const pct = total > 0 ? (remaining / total) * 100 : 0;
        if (pct <= 20) return 'text-red-500';
        if (pct <= 50) return 'text-yellow-500';
        return 'text-green-600';
    };

    return (
        <Layout>
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Leave Balance Overview</h2>
                <p className="text-gray-500 text-sm">
                    View all employees' leave balances for {new Date().getFullYear()}
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
                <div className="flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-48">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by employee name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>
                    <select
                        value={filterDept}
                        onChange={(e) => setFilterDept(e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                        <option value="">All Departments</option>
                        {departments.map((d) => (
                            <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={fetchAllBalances}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">
                        Loading leave balances...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        No data found.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                {[
                                    'Employee',
                                    'Department',
                                    'Service',
                                    'Annual Leave',
                                    'Annual Used',
                                    'Annual Left',
                                    'Medical Leave',
                                    'Medical Used',
                                    'Medical Left',
                                ].map((h) => (
                                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold text-xs">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((b) => (
                                <tr key={b.employeeId} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                {b.employeeName.charAt(0).toUpperCase()}
                                            </div>
                                            <p className="font-medium text-gray-800 text-xs">{b.employeeName}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                            {b.departmentName}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {b.serviceYears}yr
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">
                                        {b.totalAnnualAvailable}d
                                    </td>
                                    <td className="px-4 py-3 text-red-500 text-xs">
                                        {b.annualUsed}d
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <span className={`text-xs font-semibold ${getLowLeaveColor(b.annualRemaining, b.totalAnnualAvailable)}`}>
                                                {b.annualRemaining}d
                                            </span>
                                            <div className="w-16 bg-gray-100 rounded-full h-1 mt-1">
                                                <div
                                                    className={`h-1 rounded-full ${b.annualRemaining / b.totalAnnualAvailable <= 0.2
                                                        ? 'bg-red-400'
                                                        : b.annualRemaining / b.totalAnnualAvailable <= 0.5
                                                            ? 'bg-yellow-400'
                                                            : 'bg-green-400'
                                                        }`}
                                                    style={{
                                                        width: `${Math.min(
                                                            (b.annualRemaining / b.totalAnnualAvailable) * 100,
                                                            100
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">{b.medicalTotal}d</td>
                                    <td className="px-4 py-3 text-red-500 text-xs">{b.medicalUsed}d</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-semibold ${getLowLeaveColor(b.medicalRemaining, b.medicalTotal)}`}>
                                            {b.medicalRemaining}d
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                    Sufficient (50%+)
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                    Low (20-50%)
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                    Critical (below 20%)
                </span>
            </div>
        </Layout>
    );
};

export default LeaveBalancePage;