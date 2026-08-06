import { useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchMyLoans } from '../../store/slices/payrollSlice';
import { Landmark } from 'lucide-react';

const EmployeeLoansPage = () => {
  const dispatch = useAppDispatch();
  const { loans, loading } = useAppSelector((state) => state.payroll);

  useEffect(() => {
    dispatch(fetchMyLoans());
  }, [dispatch]);

  const activeLoans = loans.filter((l) => !l.isSettled);
  const settledLoans = loans.filter((l) => l.isSettled);
  const totalRemaining = activeLoans.reduce(
    (sum, l) => sum + l.remainingBalance,
    0
  );

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Loans</h2>
        <p className="text-gray-500 text-sm">
          Track your loan repayment progress
        </p>
      </div>

      {/* Summary Cards */}
      {activeLoans.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-1">Active Loans</p>
            <p className="text-3xl font-bold text-gray-800">
              {activeLoans.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500 mb-1">Total Remaining</p>
            <p className="text-3xl font-bold text-red-500">
              {totalRemaining.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Active Loans */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            Active Loans
          </h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : activeLoans.length === 0 ? (
          <div className="p-8 text-center">
            <Landmark size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">No active loans.</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {activeLoans.map((l) => {
              const progress =
                ((l.totalLoanAmount - l.remainingBalance) /
                  l.totalLoanAmount) *
                100;
              return (
                <div
                  key={l.id}
                  className="border border-gray-100 rounded-xl p-4"
                >
                  <div className="flex justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">
                        Loan #{l.id}
                      </p>
                      <p className="text-xs text-gray-400">
                        Started {l.startDate.split('T')[0]}
                      </p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full h-fit">
                      Active
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-400">Total Amount</p>
                      <p className="font-semibold text-gray-700">
                        {l.totalLoanAmount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Monthly</p>
                      <p className="font-semibold text-gray-700">
                        {l.monthlyDeduction.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Remaining</p>
                      <p className="font-semibold text-red-500">
                        {l.remainingBalance.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Repaid</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {l.notes && (
                    <p className="text-xs text-gray-400 mt-2">
                      Notes: {l.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settled Loans */}
      {settledLoans.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">
              Settled Loans
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {['Loan', 'Total Amount', 'Monthly', 'Start Date', 'Status'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-gray-500 font-semibold"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {settledLoans.map((l) => (
                <tr
                  key={l.id}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    Loan #{l.id}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.totalLoanAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.monthlyDeduction.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {l.startDate.split('T')[0]}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                      Settled ✓
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default EmployeeLoansPage;