import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchMyPayslips } from '../../store/slices/payrollSlice';
import { DollarSign, X } from 'lucide-react';
import type { Payslip } from '../../types';

const months = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

const EmployeePayslipsPage = () => {
  const dispatch = useAppDispatch();
  const { payslips, loading } = useAppSelector((state) => state.payroll);
  const [selected, setSelected] = useState<Payslip | null>(null);

  useEffect(() => {
    dispatch(fetchMyPayslips());
  }, [dispatch]);

  const getCurrency = (country: string) => {
    const map: Record<string, string> = {
      'Myanmar': 'MMK', 'Singapore': 'SGD', 'Thailand': 'THB',
      'Malaysia': 'MYR', 'Philippines': 'PHP',
    };
    return map[country] || country;
  };

  const fmt = (amount: number, country: string) =>
    `${getCurrency(country)} ${amount.toLocaleString()}`;

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Payslips</h2>
        <p className="text-gray-500 text-sm">View your salary history</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : payslips.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">No payslips yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Period', 'Country', 'Gross Salary', 'Total Deduction', 'Net Salary', 'Action'].map(
                  (h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">{h}</th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {payslips.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {months[p.month - 1]} {p.year}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                      {p.country}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fmt(p.grossSalary, p.country)}</td>
                  <td className="px-4 py-3 text-red-500">-{fmt(p.totalDeduction, p.country)}</td>
                  <td className="px-4 py-3 font-bold text-green-600">{fmt(p.netSalary, p.country)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(p)}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold underline"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payslip Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Payslip — {months[selected.month - 1]} {selected.year}
              </h3>
              <button onClick={() => setSelected(null)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {/* Employee Info */}
            <div className="bg-indigo-50 rounded-xl p-4 mb-4">
              <p className="font-semibold text-indigo-800">{selected.employeeName}</p>
              <p className="text-xs text-indigo-600">
                {selected.country} Payroll · Currency: {getCurrency(selected.country)}
              </p>
            </div>

            {/* Earnings */}
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Earnings
              </p>
              <div className="space-y-1.5">
                <Row label="Basic Salary" value={fmt(selected.basicSalary, selected.country)} />
                {selected.allowance > 0 && (
                  <Row label="Allowance" value={fmt(selected.allowance, selected.country)} />
                )}
                {selected.overtimePay > 0 && (
                  <Row label="Overtime Pay" value={fmt(selected.overtimePay, selected.country)} />
                )}
                {selected.yearEndBonus > 0 && (
                  <Row label="Year End Bonus" value={fmt(selected.yearEndBonus, selected.country)} />
                )}
                {selected.thirteenthMonth > 0 && (
                  <Row label="13th Month" value={fmt(selected.thirteenthMonth, selected.country)} />
                )}
                <div className="border-t border-gray-100 pt-1.5">
                  <Row label="Gross Salary" value={fmt(selected.grossSalary, selected.country)} bold />
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Deductions
              </p>
              <div className="space-y-1.5">

                {/* Myanmar */}
                {selected.country === 'Myanmar' && (
                  <>
                    {selected.taxDeduction > 0 && (
                      <Row label="Income Tax (Progressive)" value={fmt(selected.taxDeduction, selected.country)} negative />
                    )}
                    {selected.socialSecurity > 0 && (
                      <Row label="SSB Contribution (2%)" value={fmt(selected.socialSecurity, selected.country)} negative />
                    )}
                  </>
                )}

                {/* Singapore - CPF shown as reference only */}
                {selected.country === 'Singapore' && (selected.cpfEmployee > 0 || selected.cpfEmployer > 0) && (
                  <div className="bg-blue-50 rounded-xl p-3 mb-3">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">
                      CPF Information (Reference Only — Paid directly to IRAS)
                    </p>
                    {selected.cpfEmployee > 0 && (
                      <Row label="CPF Employee (20%)" value={fmt(selected.cpfEmployee, selected.country)} blue />
                    )}
                    {selected.cpfEmployer > 0 && (
                      <Row label="CPF Employer (17%)" value={fmt(selected.cpfEmployer, selected.country)} blue />
                    )}
                  </div>
                )}

                {/* Thailand */}
                {selected.country === 'Thailand' && (
                  <>
                    {selected.socialSecurity > 0 && (
                      <Row label="SSF Contribution (5%)" value={fmt(selected.socialSecurity, selected.country)} negative />
                    )}
                    {selected.taxDeduction > 0 && (
                      <Row label="Income Tax (Progressive)" value={fmt(selected.taxDeduction, selected.country)} negative />
                    )}
                  </>
                )}

                {/* Malaysia */}
                {selected.country === 'Malaysia' && (
                  <>
                    {selected.socialSecurity > 0 && (
                      <Row label="EPF Employee (11%)" value={fmt(selected.socialSecurity, selected.country)} negative />
                    )}
                    {selected.taxDeduction > 0 && (
                      <Row label="Income Tax (Progressive)" value={fmt(selected.taxDeduction, selected.country)} negative />
                    )}
                  </>
                )}

                {/* Philippines */}
                {selected.country === 'Philippines' && (
                  <>
                    {selected.socialSecurity > 0 && (
                      <Row label="SSS Contribution (4.5%)" value={fmt(selected.socialSecurity, selected.country)} negative />
                    )}
                    {selected.taxDeduction > 0 && (
                      <Row label="Income Tax (Progressive)" value={fmt(selected.taxDeduction, selected.country)} negative />
                    )}
                  </>
                )}

                {/* Common deductions */}
                {selected.loanDeduction > 0 && (
                  <Row label="Loan Deduction" value={fmt(selected.loanDeduction, selected.country)} negative />
                )}
                {selected.otherDeduction > 0 && (
                  <Row label="Other Deduction" value={fmt(selected.otherDeduction, selected.country)} negative />
                )}

                <div className="border-t border-gray-100 pt-1.5">
                  <Row label="Total Deduction" value={fmt(selected.totalDeduction, selected.country)} negative bold />
                </div>
              </div>
            </div>

            {/* Employer Contributions (info only) */}
            {(selected.cpfEmployer > 0) && (
              <div className="mb-4 bg-blue-50 rounded-xl p-3">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">
                  Employer Contributions (Not deducted from salary)
                </p>
                <div className="space-y-1.5">
                  {selected.cpfEmployer > 0 && (
                    <Row label="CPF Employer Contribution" value={fmt(selected.cpfEmployer, selected.country)} blue />
                  )}
                </div>
              </div>
            )}

            {/* Net Salary */}
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <p className="font-bold text-green-700">Net Salary (Take Home)</p>
                <p className="text-xl font-bold text-green-700">
                  {fmt(selected.netSalary, selected.country)}
                </p>
              </div>
            </div>

            {selected.notes && (
              <p className="text-xs text-gray-400 mt-3">Notes: {selected.notes}</p>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

const Row = ({
  label,
  value,
  negative,
  bold,
  blue,
}: {
  label: string;
  value: string;
  negative?: boolean;
  bold?: boolean;
  blue?: boolean;
}) => (
  <div className="flex justify-between text-sm">
    <span className={`${bold ? 'font-semibold text-gray-700' : 'text-gray-500'}`}>
      {label}
    </span>
    <span className={`${negative ? 'text-red-500' :
      blue ? 'text-blue-600' :
        'text-gray-700'
      } ${bold ? 'font-bold' : ''}`}>
      {negative ? '-' : ''}{value}
    </span>
  </div>
);

export default EmployeePayslipsPage;