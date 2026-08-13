import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchMyLoans, applyLoan } from '../../store/slices/payrollSlice';
import { fetchMyProfile } from '../../store/slices/employeeSlice';
import { Landmark, Plus, X, } from 'lucide-react';
import { logAction } from '../../utils/auditLog';

const loanTypes = [
  'Personal',
  'Emergency',
  'Education',
  'Equipment',
  'Medical',
  'FestivalAdvance',
];

const loanTypeLabels: Record<string, string> = {
  Personal: 'Personal Loan',
  Emergency: 'Emergency Loan',
  Education: 'Education Loan',
  Equipment: 'Equipment Loan',
  Medical: 'Medical Loan',
  FestivalAdvance: 'Festival Advance',
};

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
    case 'ManagerApproved': return '✅ Manager Approved — Waiting HR';
    case 'HRApproved': return '✅ HR Approved — Waiting CFO';
    case 'Approved': return '✅ Fully Approved — Active';
    case 'Rejected': return '❌ Rejected';
    case 'Settled': return '✅ Settled';
    default: return '⏳ Pending Manager Review';
  }
};

const EmployeeLoansPage = () => {
  const dispatch = useAppDispatch();
  const { loans, loading } = useAppSelector((state) => state.payroll);
  const { selectedEmployee } = useAppSelector((state) => state.employee);
  const { user } = useAppSelector((state) => state.auth);

  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [form, setForm] = useState({
    loanType: 'Personal',
    purpose: '',
  });

  // Calculated values
  const monthlyDeduction = loanAmount
    ? Math.round((parseFloat(loanAmount) / 12) * 100) / 100
    : 0;

  useEffect(() => {
    dispatch(fetchMyLoans());
    dispatch(fetchMyProfile());
  }, [dispatch]);

  const activeLoans = loans.filter(
    (l) => l.status === 'Approved' && !l.isSettled
  );
  const pendingLoans = loans.filter((l) =>
    ['Pending', 'HRApproved', 'ManagerApproved'].includes(l.status)
  );
  const settledLoans = loans.filter((l) => l.isSettled);
  const totalRemaining = activeLoans.reduce(
    (sum, l) => sum + l.remainingBalance, 0
  );

  // Check eligibility
  const hasActiveLoan = activeLoans.length > 0 || pendingLoans.length > 0;

  // Calculate max loan based on service years
  const getMaxLoan = () => {
    if (!selectedEmployee?.joinDate) return 0;
    const joinDate = new Date(selectedEmployee.joinDate);
    const now = new Date();
    const months =
      (now.getFullYear() - joinDate.getFullYear()) * 12 +
      (now.getMonth() - joinDate.getMonth());

    if (months < 6) return 0; // Not eligible
    if (months < 12) return selectedEmployee.baseSalary * 1;
    if (months < 36) return selectedEmployee.baseSalary * 3;
    if (months < 60) return selectedEmployee.baseSalary * 4;
    return selectedEmployee.baseSalary * 6;
  };

  const maxLoan = getMaxLoan();
  const serviceMonths = selectedEmployee?.joinDate
    ? Math.floor(
      (new Date().getTime() - new Date(selectedEmployee.joinDate).getTime()) /
      (1000 * 60 * 60 * 24 * 30)
    )
    : 0;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(loanAmount);

    if (amount <= 0) {
      setMsg('Please enter a valid loan amount.');
      return;
    }
    if (amount > maxLoan) {
      setMsg(`Maximum loan amount is ${maxLoan.toLocaleString()} based on your service years.`);
      return;
    }

    const result = await dispatch(
      applyLoan({
        employeeId: selectedEmployee?.id || user?.userId,
        employeeName: user?.fullName || '',
        departmentName: selectedEmployee?.departmentName || '',
        managerId: selectedEmployee?.managerId || null,
        loanType: form.loanType,
        requestedAmount: amount,
        purpose: form.purpose,
      })
    );
    await logAction('Applied', 'Loan', String(result.payload),
      `Loan application submitted: ${loanTypeLabels[form.loanType]} — ${parseFloat(loanAmount).toLocaleString()}`
    );

    if (applyLoan.fulfilled.match(result)) {
      setMsg('✅ Loan application submitted successfully!');
      setShowForm(false);
      setLoanAmount('');
      setForm({ loanType: 'Personal', purpose: '' });
      dispatch(fetchMyLoans());
    } else {
      setMsg((result.payload as string) || 'Failed to submit loan application.');
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Loans</h2>
          <p className="text-gray-500 text-sm">
            Apply and track your loan requests
          </p>
        </div>
        {!hasActiveLoan && maxLoan > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            <Plus size={16} />
            Apply for Loan
          </button>
        )}
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg mb-4 text-sm font-medium ${msg.includes('✅') || msg.includes('success')
          ? 'bg-green-50 text-green-700'
          : 'bg-red-50 text-red-700'
          }`}>
          {msg}
        </div>
      )}

      {/* Eligibility Info */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Loan Eligibility</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs mb-1">Service Period</p>
            <p className="font-semibold text-gray-700">
              {serviceMonths < 6
                ? `${serviceMonths} months (Min 6 months required)`
                : `${serviceMonths} months ✅`}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Max Loan Amount</p>
            <p className="font-semibold text-indigo-600">
              {maxLoan > 0 ? maxLoan.toLocaleString() : 'Not eligible yet'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Active Loan</p>
            <p className={`font-semibold ${hasActiveLoan ? 'text-red-500' : 'text-green-600'}`}>
              {hasActiveLoan ? 'Has active/pending loan' : 'No active loan ✅'}
            </p>
          </div>
        </div>
      </div>

      {/* Active Loans */}
      {activeLoans.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Loans</h3>
          {activeLoans.map((loan) => {
            const progress =
              ((loan.totalLoanAmount - loan.remainingBalance) /
                loan.totalLoanAmount) *
              100;
            return (
              <div key={loan.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {loanTypeLabels[loan.loanType] || loan.loanType}
                    </p>
                    <p className="text-xs text-gray-400">
                      Started {loan.startDate?.split('T')[0]}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold h-fit ${statusColor(loan.status)}`}>
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-400">Total Amount</p>
                    <p className="font-semibold">{loan.totalLoanAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Monthly</p>
                    <p className="font-semibold">{loan.monthlyDeduction.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Remaining</p>
                    <p className="font-semibold text-red-500">{loan.remainingBalance.toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Repaid</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                {loan.purpose && (
                  <p className="text-xs text-gray-400 mt-2">Purpose: {loan.purpose}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pending Loans */}
      {pendingLoans.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Loans</h3>
          <div className="space-y-3">
            {pendingLoans.map((loan) => (
              <div key={loan.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {loanTypeLabels[loan.loanType] || loan.loanType}
                    </p>
                    <p className="text-xs text-gray-400">
                      Applied {loan.appliedDate.split('T')[0]}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold h-fit ${statusColor(loan.status)}`}>
                    {statusLabel(loan.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-400">Requested Amount</p>
                    <p className="font-semibold">{loan.requestedAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Monthly Deduction</p>
                    <p className="font-semibold">{loan.monthlyDeduction.toLocaleString()}</p>
                  </div>
                </div>

                {/* Approval Timeline */}
                <div className="flex items-center gap-2 mt-3">
                  <StepBadge label="Manager" done={!!loan.managerApprovedAt} name={loan.managerApprovedByName} />
                  <div className="flex-1 h-px bg-gray-200" />
                  <StepBadge label="HR" done={!!loan.hrApprovedAt} name={loan.hrApprovedByName} />
                  <div className="flex-1 h-px bg-gray-200" />
                  <StepBadge label="CFO" done={!!loan.cfoApprovedAt} name={loan.cfoApprovedByName} />
                </div>

                {loan.purpose && (
                  <p className="text-xs text-gray-400 mt-2 italic">
                    Purpose: {loan.purpose}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No loans */}
      {loans.length === 0 && !loading && (
        <div className="bg-white rounded-2xl p-8 text-center">
          <Landmark size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">No loan applications yet.</p>
          {maxLoan > 0 && !hasActiveLoan && (
            <p className="text-gray-400 text-sm mt-1">
              You are eligible for up to {maxLoan.toLocaleString()} loan.
            </p>
          )}
        </div>
      )}

      {/* Settled Loans */}
      {settledLoans.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Settled Loans</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['Type', 'Amount', 'Monthly', 'Applied', 'Settled'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {settledLoans.map((l) => (
                <tr key={l.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{loanTypeLabels[l.loanType] || l.loanType}</td>
                  <td className="px-4 py-3">{l.totalLoanAmount.toLocaleString()}</td>
                  <td className="px-4 py-3">{l.monthlyDeduction.toLocaleString()}</td>
                  <td className="px-4 py-3">{l.appliedDate.split('T')[0]}</td>
                  <td className="px-4 py3">
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                      ✓ {l.settledDate?.split('T')[0]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Apply Loan Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Apply for Loan</h3>
              <button onClick={() => setShowForm(false)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4">
              {/* Loan Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Loan Type
                </label>
                <select
                  value={form.loanType}
                  onChange={(e) => setForm({ ...form, loanType: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {loanTypes.map((t) => (
                    <option key={t} value={t}>{loanTypeLabels[t]}</option>
                  ))}
                </select>
              </div>

              {/* Loan Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Loan Amount (Max: {maxLoan.toLocaleString()})
                </label>
                <input
                  type="number"
                  required
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  max={maxLoan}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* Loan Calculator */}
              {loanAmount && parseFloat(loanAmount) > 0 && (
                <div className="bg-indigo-50 rounded-xl p-4 text-sm">
                  <p className="font-bold text-indigo-700 mb-2">📊 Loan Calculator</p>
                  <div className="space-y-1 text-gray-600">
                    <div className="flex justify-between">
                      <span>Loan Amount</span>
                      <span className="font-semibold">{parseFloat(loanAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Repayment Period</span>
                      <span className="font-semibold">12 months</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interest Rate</span>
                      <span className="font-semibold text-green-600">0%</span>
                    </div>
                    <div className="border-t border-indigo-100 pt-1 flex justify-between">
                      <span className="font-bold text-indigo-700">Monthly Deduction</span>
                      <span className="font-bold text-indigo-700">
                        {monthlyDeduction.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Purpose */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Purpose
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  placeholder="Please explain the purpose of this loan..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

const StepBadge = ({
  label,
  done,
  name,
}: {
  label: string;
  done: boolean;
  name?: string;
}) => (
  <div className="flex flex-col items-center">
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
      }`}>
      {done ? '✓' : label[0]}
    </div>
    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    {done && name && <p className="text-xs text-green-600">{name}</p>}
  </div>
);

export default EmployeeLoansPage;