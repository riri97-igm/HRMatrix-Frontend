import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import {
    fetchPendingManagerLoans,
    managerApproveLoan,
    rejectLoan,
} from '../../store/slices/payrollSlice';
import { Landmark, CheckCircle, XCircle } from 'lucide-react';

const loanTypeLabels: Record<string, string> = {
    Personal: 'Personal Loan',
    Emergency: 'Emergency Loan',
    Education: 'Education Loan',
    Equipment: 'Equipment Loan',
    Medical: 'Medical Loan',
    FestivalAdvance: 'Festival Advance',
};

const ManagerLoansPage = () => {
    const dispatch = useAppDispatch();
    const { loans, loading } = useAppSelector((state) => state.payroll);
    const [comment, setComment] = useState<Record<number, string>>({});
    const [msg, setMsg] = useState('');

    useEffect(() => {
        dispatch(fetchPendingManagerLoans());
    }, [dispatch]);

    const handleApprove = async (id: number) => {
        await dispatch(managerApproveLoan({ id, comment: comment[id] || '' }));
        setMsg('Loan approved! Forwarded to CFO for final approval.');
        dispatch(fetchPendingManagerLoans());
    };

    const handleReject = async (id: number) => {
        if (!comment[id]) {
            setMsg('Please provide a rejection reason.');
            return;
        }
        await dispatch(rejectLoan({ id, reason: comment[id] }));
        setMsg('Loan rejected.');
        dispatch(fetchPendingManagerLoans());
    };

    return (
        <Layout>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Loan Approvals</h2>
                <p className="text-gray-500 text-sm">
                    Review loan requests from your team — HR has already approved these
                </p>
            </div>

            {msg && (
                <div className={`px-4 py-3 rounded-lg mb-4 text-sm font-medium ${msg.includes('rejected') || msg.includes('Please')
                        ? 'bg-red-50 text-red-700'
                        : 'bg-green-50 text-green-700'
                    }`}>
                    {msg}
                </div>
            )}

            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white rounded-2xl p-8 text-center text-gray-400">Loading...</div>
                ) : loans.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center">
                        <Landmark size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-400 font-medium">No pending loan approvals! 🎉</p>
                        <p className="text-gray-400 text-sm mt-1">
                            Your team has no HR-approved loans waiting for your review.
                        </p>
                    </div>
                ) : (
                    loans.map((loan) => (
                        <div key={loan.id} className="bg-white rounded-2xl shadow-sm p-5">
                            {/* Header */}
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
                                <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-1 rounded-full">
                                    {loanTypeLabels[loan.loanType] || loan.loanType}
                                </span>
                            </div>

                            {/* Loan Details */}
                            <div className="grid grid-cols-4 gap-4 mb-4 bg-gray-50 rounded-xl p-3">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Amount</p>
                                    <p className="font-semibold">{loan.requestedAmount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Monthly</p>
                                    <p className="font-semibold">{loan.monthlyDeduction.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Period</p>
                                    <p className="font-semibold">{loan.repaymentMonths} months</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Interest</p>
                                    <p className="font-semibold text-green-600">0%</p>
                                </div>
                            </div>

                            {/* Purpose */}
                            <p className="text-sm text-gray-600 mb-3 italic">
                                Purpose: "{loan.purpose}"
                            </p>

                            {/* HR Approval Info */}
                            <div className="bg-blue-50 rounded-lg p-3 mb-4 text-xs text-blue-700">
                                ✅ HR Approved by <strong>{loan.hrApprovedByName}</strong>
                                {loan.hrApprovedAt && ` on ${loan.hrApprovedAt.split('T')[0]}`}
                                {loan.hrComment && ` — "${loan.hrComment}"`}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                                <input
                                    type="text"
                                    placeholder="Comment (required for rejection)"
                                    value={comment[loan.id] || ''}
                                    onChange={(e) =>
                                        setComment({ ...comment, [loan.id]: e.target.value })
                                    }
                                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                                <button
                                    onClick={() => handleApprove(loan.id)}
                                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition"
                                >
                                    <CheckCircle size={14} />
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleReject(loan.id)}
                                    className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition"
                                >
                                    <XCircle size={14} />
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

export default ManagerLoansPage;
