import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchMyPayslips } from '../../store/slices/payrollSlice';
import { DollarSign, X } from 'lucide-react';
import type { Payslip } from '../../types';
import { formatCurrency } from '../../utils/currency';

const months = [
  'January','February','March','April',
  'May','June','July','August',
  'September','October','November','December',
];

const EmployeePayslipsPage = () => {
  const dispatch = useAppDispatch();
  const { payslips, loading } = useAppSelector((state) => state.payroll);
  const [selected, setSelected] = useState<Payslip | null>(null);

  useEffect(() => {
    dispatch(fetchMyPayslips());
  }, [dispatch]);

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
                {['Period', 'Country', 'Gross Salary', 'Deductions', 'Net Salary', 'Action'].map(
                  (h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">
                      {h}
                    </th>
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
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      p.country === 'Myanmar'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {p.country}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatCurrency(p.grossSalary, p.country)}
                  </td>
                  <td className="px-4 py-3 text-red-500">
                    -{formatCurrency(p.totalDeduction, p.country)}
                  </td>
                  <td className="px-4 py-3 font-bold text-green-600">
                    {formatCurrency(p.netSalary, p.country)}
                  </td>
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
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Payslip — {months[selected.month - 1]} {selected.year}
              </h3>
              <button onClick={() => setSelected(null)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 mb-4">
              <p className="font-semibold text-indigo-800">{selected.employeeName}</p>
              <p className="text-xs text-indigo-600">
                {selected.country} Payroll · {selected.country === 'Myanmar' ? 'MMK' : 'SGD'}
              </p>
            </div>

            {/* Earnings */}
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Earnings
              </p>
              <div className="space-y-2">
                <PayslipRow label="Basic Salary" value={selected.basicSalary} country={selected.country} />
                {selected.allowance > 0 && (
                  <PayslipRow label="Allowance" value={selected.allowance} country={selected.country} />
                )}
                {selected.overtimePay > 0 && (
                  <PayslipRow label="Overtime Pay" value={selected.overtimePay} country={selected.country} />
                )}
                {selected.yearEndBonus > 0 && (
                  <PayslipRow label="Year End Bonus" value={selected.yearEndBonus} country={selected.country} />
                )}
                {selected.thirteenthMonth > 0 && (
                  <PayslipRow label="13th Month" value={selected.thirteenthMonth} country={selected.country} />
                )}
                <div className="border-t border-gray-100 pt-2">
                  <PayslipRow label="Gross Salary" value={selected.grossSalary} country={selected.country} bold />
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Deductions
              </p>
              <div className="space-y-2">
                {selected.country === 'Myanmar' && (
                  <>
                    {selected.taxDeduction > 0 && (
                      <PayslipRow label="Income Tax" value={selected.taxDeduction} country={selected.country} negative />
                    )}
                    {selected.socialSecurity > 0 && (
                      <PayslipRow label="Social Security (2%)" value={selected.socialSecurity} country={selected.country} negative />
                    )}
                  </>
                )}
                {selected.country === 'Singapore' && (
                  <>
                    {selected.cpfEmployee > 0 && (
                      <PayslipRow label="CPF Employee" value={selected.cpfEmployee} country={selected.country} negative />
                    )}
                    {selected.cpfEmployer > 0 && (
                      <PayslipRow label="CPF Employer" value={selected.cpfEmployer} country={selected.country} />
                    )}
                  </>
                )}
                {selected.loanDeduction > 0 && (
                  <PayslipRow label="Loan Deduction" value={selected.loanDeduction} country={selected.country} negative />
                )}
                {selected.otherDeduction > 0 && (
                  <PayslipRow label="Other Deduction" value={selected.otherDeduction} country={selected.country} negative />
                )}
                <div className="border-t border-gray-100 pt-2">
                  <PayslipRow label="Total Deduction" value={selected.totalDeduction} country={selected.country} negative bold />
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <p className="font-bold text-green-700">Net Salary</p>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency(selected.netSalary, selected.country)}
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

const PayslipRow = ({
  label,
  value,
  negative,
  bold,
  country = 'Myanmar',
}: {
  label: string;
  value: number;
  negative?: boolean;
  bold?: boolean;
  country?: string;
}) => (
  <div className="flex justify-between text-sm">
    <span className={`text-gray-500 ${bold ? 'font-semibold text-gray-700' : ''}`}>
      {label}
    </span>
    <span className={`${negative ? 'text-red-500' : 'text-gray-700'} ${bold ? 'font-bold' : ''}`}>
      {negative ? '-' : ''}{formatCurrency(value, country)}
    </span>
  </div>
);

export default EmployeePayslipsPage;