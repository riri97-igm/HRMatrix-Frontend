import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchAllLeaves, reviewLeave } from '../../store/slices/leaveSlice';
import { ClipboardList, CheckCircle, XCircle, Search } from 'lucide-react';

const AdminLeavePage = () => {
  const dispatch = useAppDispatch();
  const { leaves, loading } = useAppSelector((state) => state.leave);
  const [comment, setComment] = useState<Record<number, string>>({});
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    dispatch(fetchAllLeaves());
  }, [dispatch]);

  const handleReview = async (id: number, isApproved: boolean) => {
    await dispatch(reviewLeave({ id, isApproved, comment: comment[id] }));
    dispatch(fetchAllLeaves());
  };

  const filtered = leaves.filter((l) => {
    const matchStatus = filter === 'All' || l.status === filter;

    const matchSearch =
      search === '' ||
      l.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      l.leaveType.toLowerCase().includes(search.toLowerCase());

    const matchDateFrom =
      dateFrom === '' || new Date(l.startDate) >= new Date(dateFrom);

    const matchDateTo =
      dateTo === '' || new Date(l.endDate) <= new Date(dateTo);

    return matchStatus && matchSearch && matchDateFrom && matchDateTo;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusColor = (status: string) =>
    status === 'Approved'
      ? 'bg-green-100 text-green-700'
      : status === 'Rejected'
        ? 'bg-red-100 text-red-700'
        : 'bg-yellow-100 text-yellow-700';

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Leave Requests</h2>
          <p className="text-gray-500 text-sm">
            Manage all leave requests — {leaves.length} total
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {['All', 'Pending', 'Approved', 'Rejected'].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f as any); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${filter === f
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
          >
            {f}
            <span className="ml-1 text-xs opacity-70">
              ({f === 'All' ? leaves.length : leaves.filter(l => l.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* Search + Date Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
        <div className="flex items-end gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <label className="block text-xs text-gray-400 mb-1">Search</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by employee or leave type..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Clear + Count */}
          <div className="flex items-center gap-3">
            {(search || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setSearch('');
                  setDateFrom('');
                  setDateTo('');
                  setCurrentPage(1);
                }}
                className="text-xs text-red-500 hover:text-red-700 font-medium py-2"
              >
                Clear
              </button>
            )}
            <span className="text-sm text-gray-400 py-2">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Leave Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
            Loading...
          </div>
        ) : paginated.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <ClipboardList size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">No leave requests found.</p>
          </div>
        ) : (
          paginated.map((l) => (
            <div key={l.id} className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                      {l.employeeName.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-semibold text-gray-800">{l.employeeName}</p>
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      {l.leaveType}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(l.status)}`}>
                      {l.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 ml-11">
                    {l.startDate.split('T')[0]} → {l.endDate.split('T')[0]}
                    <span className="ml-2 font-medium text-gray-700">
                      ({l.totalDays} day{l.totalDays > 1 ? 's' : ''})
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 ml-11 mt-1 italic">
                    "{l.reason}"
                  </p>
                  {l.reviewComment && (
                    <p className="text-sm text-gray-400 ml-11 mt-1">
                      Comment: {l.reviewComment}
                    </p>
                  )}
                </div>

                {/* Actions - only for pending */}
                {l.status === 'Pending' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Comment (optional)"
                      value={comment[l.id] || ''}
                      onChange={(e) =>
                        setComment({ ...comment, [l.id]: e.target.value })
                      }
                      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-48"
                    />
                    <button
                      onClick={() => handleReview(l.id, true)}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      <CheckCircle size={14} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(l.id, false)}
                      className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm px-6 py-4 flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filtered.length)} of{' '}
            {filtered.length} requests
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
      )}
    </Layout>
  );
};

export default AdminLeavePage;