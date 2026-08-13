import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { employeeApi } from '../../services/api';
import { Search, Shield } from 'lucide-react';

interface AuditLog {
    id: number;
    userId: number;
    userName: string;
    userRole: string;
    action: string;
    entityType: string;
    entityId: string;
    description: string;
    createdAt: string;
    ipAddress: string;
}

const actionColor = (action: string) => {
    switch (action) {
        case 'Created': return 'bg-green-100 text-green-700';
        case 'Updated': return 'bg-blue-100 text-blue-700';
        case 'Deleted': return 'bg-red-100 text-red-700';
        case 'Approved': return 'bg-indigo-100 text-indigo-700';
        case 'Rejected': return 'bg-orange-100 text-orange-700';
        case 'Generated': return 'bg-purple-100 text-purple-700';
        case 'Applied': return 'bg-yellow-100 text-yellow-700';
        case 'Settled': return 'bg-teal-100 text-teal-700';
        case 'Login': return 'bg-gray-100 text-gray-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

const entityIcon = (entityType: string) => {
    switch (entityType) {
        case 'Employee': return '👤';
        case 'Leave': return '📋';
        case 'Payroll': return '💰';
        case 'Loan': return '🏦';
        case 'Department': return '🏢';
        case 'User': return '🔑';
        default: return '📝';
    }
};

const AuditLogPage = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [filterEntity, setFilterEntity] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await employeeApi.get('/api/auditlog?count=200');
            setLogs(res.data);
        } catch {
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const filtered = logs.filter((l) => {
        const matchSearch =
            search === '' ||
            l.userName.toLowerCase().includes(search.toLowerCase()) ||
            l.description.toLowerCase().includes(search.toLowerCase()) ||
            l.entityType.toLowerCase().includes(search.toLowerCase());
        const matchAction = filterAction === '' || l.action === filterAction;
        const matchEntity = filterEntity === '' || l.entityType === filterEntity;
        return matchSearch && matchAction && matchEntity;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const actions = [...new Set(logs.map((l) => l.action))];
    const entities = [...new Set(logs.map((l) => l.entityType))];

    return (
        <Layout>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Audit Log</h2>
                    <p className="text-gray-500 text-sm">
                        Track all system activities — {logs.length} total records
                    </p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                    <Shield size={16} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
                <div className="flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-48">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by user, description..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>
                    <select
                        value={filterAction}
                        onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1); }}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                        <option value="">All Actions</option>
                        {actions.map((a) => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                    <select
                        value={filterEntity}
                        onChange={(e) => { setFilterEntity(e.target.value); setCurrentPage(1); }}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                        <option value="">All Entities</option>
                        {entities.map((e) => (
                            <option key={e} value={e}>{e}</option>
                        ))}
                    </select>
                    {(search || filterAction || filterEntity) && (
                        <button
                            onClick={() => { setSearch(''); setFilterAction(''); setFilterEntity(''); setCurrentPage(1); }}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                            Clear
                        </button>
                    )}
                    <span className="text-sm text-gray-400 flex items-center">
                        {filtered.length} records
                    </span>
                </div>
            </div>

            {/* Log Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading audit logs...</div>
                ) : paginated.length === 0 ? (
                    <div className="p-8 text-center">
                        <Shield size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-400">No audit logs found.</p>
                        <p className="text-xs text-gray-300 mt-1">
                            Audit logs will appear here as users perform actions in the system.
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                {['Time', 'User', 'Action', 'Entity', 'Description', 'IP'].map((h) => (
                                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((log) => (
                                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                {log.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800 text-xs">{log.userName}</p>
                                                <p className="text-xs text-gray-400">{log.userRole}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${actionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm">
                                            {entityIcon(log.entityType)} {log.entityType}
                                            {log.entityId && (
                                                <span className="text-gray-400 text-xs ml-1">#{log.entityId}</span>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                                        {log.description}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                                        {log.ipAddress}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {filtered.length > 0 && (
                    <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                            {Math.min(currentPage * itemsPerPage, filtered.length)} of{' '}
                            {filtered.length} records
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
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
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
                )}
            </div>
        </Layout>
    );
};

export default AuditLogPage;