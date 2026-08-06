import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchAllLeaves, reviewLeave } from '../../store/slices/leaveSlice';
import { ClipboardList, CheckCircle, XCircle } from 'lucide-react';

const AdminLeavePage = () => {
  const dispatch = useAppDispatch();
  const { leaves, loading } = useAppSelector((state) => state.leave);
  const [comment, setComment] = useState<Record<number, string>>({});
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  useEffect(() => {
    dispatch(fetchAllLeaves());
  }, [dispatch]);

  const filtered = leaves.filter((l) =>
    filter === 'All' ? true : l.status === filter
  );

  const handleReview = async (id: number, isApproved: boolean) => {
    await dispatch(reviewLeave({ id, isApproved, comment: comment[id] }));
    dispatch(fetchAllLeaves());
  };

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
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Leave Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <ClipboardList size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">No leave requests found.</p>
          </div>
        ) : (
          filtered.map((l) => (
            <div
              key={l.id}
              className="bg-white rounded-2xl shadow-sm p-5"
            >
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
    </Layout>
  );
};

export default AdminLeavePage;