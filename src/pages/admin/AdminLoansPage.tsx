import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import {
  fetchAllLoans,
  fetchPendingHRLoans,
  fetchPendingManagerLoans,
  fetchPendingCFOLoans,
  hrApproveLoan,
  cfoApproveLoan,
  rejectLoan,
  settleLoan,
} from '../../store/slices/payrollSlice';
import { Landmark, CheckCircle, XCircle, Search, Clock, Download } from 'lucide-react';
import { exportLoansExcel } from '../../utils/exportExcel';
import { logAction } from '../../utils/auditLog';

const statusColor = (status: string) => {
  switch (status) {
    case 'Approved': return 'bg-green-100 text-green-700';
    case 'Rejected': return 'bg-red-100 text-red-700';
    case 'Pending': return 'bg-yellow-100 text-yellow-700';
    case 'HRApproved': return 'bg-blue-100 text-blue-700';
    case 'ManagerApproved': return 'bg-purple-100 text-purple-700';
    case 'Settled': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'Pending': return 'Pending Manager';
    case 'ManagerApproved': return 'Manager Approved';
    case 'HRApproved': return 'HR Approved';
    case 'Approved': return 'Approved';
    case 'Rejected': return 'Rejected';
    case 'Settled': return 'Settled';
    default: return status;
  }
};

const AdminLoansPage = () => {
  const dispatch = useAppDispatch();
  const { loans, loading } = useAppSelector((state) => state.payroll);
  const [activeTab, setActiveTab] = useState<'all' | 'pending-manager' | 'pending-hr' | 'pending-cfo'>('pending-manager');
  const [search, setSearch] = useState('');
  const [comment, setComment] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (activeTab === 'all') dispatch(fetchAllLoans());
    else if (activeTab === 'pending-manager') dispatch(fetchPendingManagerLoans());
    else if (activeTab === 'pending-hr') dispatch(fetchPendingHRLoans());
    else if (activeTab === 'pending-cfo') dispatch(fetchPendingCFOLoans());
  }, [dispatch, activeTab]);

  const filtered = loans.filter((l) =>
    search === '' ||
    l.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    l.loanType.toLowerCase().includes(search.toLowerCase()) ||
    l.departmentName.toLowerCase().includes(search.toLowerCase())
  );

  const handleHRApprove = async (id: number) => {
    await dispatch(hrApproveLoan({ id, comment: comment[id] || '' }));
    setMsg('Loan HR approved! Forwarded to CFO.');
    dispatch(fetchPendingHRLoans());
    await logAction('Approved', 'Loan', String(id),
      `Loan #${id} HR approved${comment[id] ? ` — ${comment[id]}` : ''}`
    );
  };

  const handleCFOApprove = async (id: number) => {
    await dispatch(cfoApproveLoan({ id, comment: comment[id] || '' }));
    setMsg('Loan fully approved by CFO! Loan is now active.');
    dispatch(fetchPendingCFOLoans());
    await logAction('Approved', 'Loan', String(id),
      `Loan #${id} CFO final approved — loan is now active`
    );
  };

  const handleReject = async (id: number) => {
    if (!comment[id]) {
      setMsg('Please provide a rejection reason.');
      return;
    }
    await dispatch(rejectLoan({ id, reason: comment[id] }));
    setMsg('Loan rejected.');
    await logAction('Rejected', 'Loan', String(id),
      `Loan #${id} rejected — ${comment[id]}`
    );
    if (activeTab === 'all') dispatch(fetchAllLoans());
    else if (activeTab === 'pending-manager') dispatch(fetchPendingManagerLoans());
    else if (activeTab === 'pending-hr') dispatch(fetchPendingHRLoans());
    else dispatch(fetchPendingCFOLoans());
  };

  const handleSettle = async (id: number) => {
    if (window.confirm('Mark this loan as settled?')) {
      await dispatch(settleLoan(id));
      await logAction('Settled', 'Loan', String(id),
        `Loan #${id} marked as settled`
      );
      setMsg('Loan settled successfully!');
      dispatch(fetchAllLoans());
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Loan Management</h2>
          <p className="text-gray-500 text-sm">Review and approve employee loan requests</p>
        </div>
        <button
          onClick={() => exportLoansExcel(filtered)}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
        >
          <Download size={16} />
          Export Excel
        </button>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg mb-4 text-sm font-medium ${msg.includes('rejected') || msg.includes('Please')
          ? 'bg-red-50 text-red-700'
          : 'bg-green-50 text-green-700'
          }`}>
          {msg}
        </div>
      )}

      {/* Approval Flow Info */}
      <div className="bg-indigo-50 rounded-2xl p-4 mb-4 text-sm text-indigo-700">
        <p className="font-semibold mb-1">📋 Loan Approval Flow</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">1️⃣ Employee Applies</span>
          <span>→</span>
          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">2️⃣ Manager Reviews</span>
          <span>→</span>
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">3️⃣ HR Reviews</span>
          <span>→</span>
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">4️⃣ CFO Approves</span>
          <span>→</span>
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">✅ Active</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: 'pending-manager', label: '1️⃣ Pending Manager' },
          { key: 'pending-hr', label: '2️⃣ Pending HR Review' },
          { key: 'pending-cfo', label: '3️⃣ Pending CFO Approval' },
          { key: 'all', label: 'All Loans' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === tab.key
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by employee, loan type, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Loan Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <Landmark size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">No loan requests found.</p>
          </div>
        ) : (
          filtered.map((loan) => (
            <div key={loan.id} className="bg-white rounded-2xl shadow-sm p-5">

              {/* Loan Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                    {loan.employeeName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{loan.employeeName}</p>
                    <p className="text-xs text-gray-400">
                      {loan.departmentName} · Applied {loan.appliedDate.split('T')[0]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-1 rounded-full">
                    {loan.loanType}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor(loan.status)}`}>
                    {statusLabel(loan.status)}
                  </span>
                </div>
              </div>

              {/* Loan Details */}
              <div className="grid grid-cols-4 gap-4 mb-4 bg-gray-50 rounded-xl p-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Requested Amount</p>
                  <p className="font-semibold text-gray-700">{loan.requestedAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Monthly Deduction</p>
                  <p className="font-semibold text-gray-700">{loan.monthlyDeduction.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Repayment</p>
                  <p className="font-semibold text-gray-700">{loan.repaymentMonths} months</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Remaining</p>
                  <p className="font-semibold text-red-500">{loan.remainingBalance.toLocaleString()}</p>
                </div>
              </div>

              {/* Purpose */}
              <p className="text-sm text-gray-600 mb-4 italic">
                Purpose: "{loan.purpose}"
              </p>

              {/* Approval Timeline — Manager → HR → CFO */}
              <div className="flex items-center gap-2 mb-4">
                <ApprovalStep
                  label="Manager"
                  approved={!!loan.managerApprovedAt}
                  approverName={loan.managerApprovedByName}
                  rejected={loan.status === 'Rejected' && !loan.managerApprovedAt}
                />
                <div className="flex-1 h-px bg-gray-200" />
                <ApprovalStep
                  label="HR"
                  approved={!!loan.hrApprovedAt}
                  approverName={loan.hrApprovedByName}
                  rejected={loan.status === 'Rejected' && !!loan.managerApprovedAt && !loan.hrApprovedAt}
                />
                <div className="flex-1 h-px bg-gray-200" />
                <ApprovalStep
                  label="CFO"
                  approved={!!loan.cfoApprovedAt}
                  approverName={loan.cfoApprovedByName}
                  rejected={loan.status === 'Rejected' && !!loan.hrApprovedAt && !loan.cfoApprovedAt}
                />
              </div>

              {/* Comments shown if approved */}
              {loan.managerComment && (
                <p className="text-xs text-gray-400 mb-1">Manager: "{loan.managerComment}"</p>
              )}
              {loan.hrComment && (
                <p className="text-xs text-gray-400 mb-1">HR: "{loan.hrComment}"</p>
              )}
              {loan.cfoComment && (
                <p className="text-xs text-gray-400 mb-1">CFO: "{loan.cfoComment}"</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">

                {/* Step 1 — Waiting Manager */}
                {loan.status === 'Pending' && (
                  <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg w-full">
                    <Clock size={14} />
                    Waiting for Department Manager to review first
                  </div>
                )}

                {/* Step 2 — HR Approve (after Manager) */}
                {loan.status === 'ManagerApproved' && (
                  <>
                    <input
                      type="text"
                      placeholder="HR Comment (optional)"
                      value={comment[loan.id] || ''}
                      onChange={(e) => setComment({ ...comment, [loan.id]: e.target.value })}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <button
                      onClick={() => handleHRApprove(loan.id)}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      <CheckCircle size={14} />
                      HR Approve
                    </button>
                    <button
                      onClick={() => handleReject(loan.id)}
                      className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                  </>
                )}

                {/* Step 3 — CFO Approve (after HR) */}
                {loan.status === 'HRApproved' && (
                  <>
                    <input
                      type="text"
                      placeholder="CFO Comment (optional)"
                      value={comment[loan.id] || ''}
                      onChange={(e) => setComment({ ...comment, [loan.id]: e.target.value })}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <button
                      onClick={() => handleCFOApprove(loan.id)}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      <CheckCircle size={14} />
                      CFO Approve
                    </button>
                    <button
                      onClick={() => handleReject(loan.id)}
                      className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      <XCircle size={14} />
                      Reject
                    </button>
                  </>
                )}

                {/* Settle */}
                {loan.status === 'Approved' && !loan.isSettled && (
                  <button
                    onClick={() => handleSettle(loan.id)}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    <CheckCircle size={14} />
                    Mark Settled
                  </button>
                )}

                {loan.status === 'Rejected' && (
                  <p className="text-sm text-red-500">
                    ❌ Rejected: {loan.rejectionReason}
                  </p>
                )}

                {loan.isSettled && (
                  <span className="text-sm text-gray-400">
                    ✅ Settled on {loan.settledDate?.split('T')[0]}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
};

const ApprovalStep = ({
  label,
  approved,
  approverName,
  rejected,
}: {
  label: string;
  approved: boolean;
  approverName?: string;
  rejected?: boolean;
}) => (
  <div className="flex flex-col items-center">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${approved
      ? 'bg-green-100 text-green-700'
      : rejected
        ? 'bg-red-100 text-red-700'
        : 'bg-gray-100 text-gray-400'
      }`}>
      {approved ? '✓' : rejected ? '✗' : label[0]}
    </div>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
    {approved && approverName && (
      <p className="text-xs text-green-600 text-center max-w-16 truncate">{approverName}</p>
    )}
  </div>
);

export default AdminLoansPage;