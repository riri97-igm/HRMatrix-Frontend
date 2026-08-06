import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchPendingLeaves, reviewLeave } from '../../store/slices/leaveSlice';
import { CheckCircle, XCircle, ClipboardList } from 'lucide-react';

const ManagerLeavePage = () => {
  const dispatch = useAppDispatch();
  const { pendingLeaves, loading } = useAppSelector((state) => state.leave);
  const [comment, setComment] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    dispatch(fetchPendingLeaves());
  }, [dispatch]);

  const handleReview = async (id: number, isApproved: boolean) => {
    const result = await dispatch(
      reviewLeave({ id, isApproved, comment: comment[id] })
    );
    if (reviewLeave.fulfilled.match(result)) {
      setMsg(isApproved ? 'Leave approved!' : 'Leave rejected!');
      dispatch(fetchPendingLeaves());
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Leave Approvals</h2>
        <p className="text-gray-500 text-sm">
          Review and approve pending leave requests from your team.
        </p>
      </div>

      {msg && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium">
          {msg}
        </div>
      )}

      {/* Leave Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
            Loading...
          </div>
        ) : pendingLeaves.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <ClipboardList
              size={40}
              className="mx-auto text-gray-300 mb-3"
            />
            <p className="text-gray-400 font-medium">
              No pending leave requests! 🎉
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Your team is all caught up.
            </p>
          </div>
        ) : (
          pendingLeaves.map((l) => (
            <div key={l.id} className="bg-white rounded-2xl shadow-sm p-5">
              {/* Employee Info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                    {l.employeeName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {l.employeeName}
                    </p>
                    <p className="text-xs text-gray-400">
                      Applied on {l.createdAt.split('T')[0]}
                    </p>
                  </div>
                </div>
                <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
                  {l.leaveType}
                </span>
              </div>

              {/* Leave Details */}
              <div className="grid grid-cols-3 gap-4 mb-4 bg-gray-50 rounded-xl p-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">From</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {l.startDate.split('T')[0]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">To</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {l.endDate.split('T')[0]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Duration</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {l.totalDays} day{l.totalDays > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-1">Reason</p>
                <p className="text-sm text-gray-600 italic">"{l.reason}"</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Add a comment (optional)"
                  value={comment[l.id] || ''}
                  onChange={(e) =>
                    setComment({ ...comment, [l.id]: e.target.value })
                  }
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  onClick={() => handleReview(l.id, true)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
                <button
                  onClick={() => handleReview(l.id, false)}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
};

export default ManagerLeavePage;