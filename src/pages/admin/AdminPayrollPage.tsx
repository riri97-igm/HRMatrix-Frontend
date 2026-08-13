import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import {
  fetchAllPayslips,
  generatePayslip,
} from '../../store/slices/payrollSlice';
import { fetchEmployees } from '../../store/slices/employeeSlice';
import { DollarSign, Plus, X, Search, Download } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { exportPayslipPDF, exportPayslipListPDF } from '../../utils/exportPdf';
import { leaveApi, payrollApi } from '../../services/api';
import { exportPayslipsExcel } from '../../utils/exportExcel';
import { logAction } from '../../utils/auditLog';

const months = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

const AdminPayrollPage = () => {
  const dispatch = useAppDispatch();
  const { payslips, loading } = useAppSelector((state) => state.payroll);
  const { employees } = useAppSelector((state) => state.employee);
  const { selectedCountry, countries } = useAppSelector(
    (state) => state.settings ?? { selectedCountry: null, countries: [] }
  );

  const [showForm, setShowForm] = useState(false);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  const [employeeLoans, setEmployeeLoans] = useState<any[]>([]);
  const [unpaidLeaveDays, setUnpaidLeaveDays] = useState(0);
  const [unpaidLeaveDeduction, setUnpaidLeaveDeduction] = useState(0);
  const [loanDeduction, setLoanDeduction] = useState(0);

  const [form, setForm] = useState({
    employeeId: '',
    employeeName: '',
    departmentName: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    country: selectedCountry?.countryName || 'Myanmar',
    countryCode: selectedCountry?.countryCode || 'MM',
    basicSalary: '',
    allowance: '',
    overtimePay: '',
    yearEndBonus: '',
    thirteenthMonth: '',
    otherDeduction: '',
    employeeAge: '',
    notes: '',
  });

  const [preview, setPreview] = useState({
    grossSalary: 0,
    tax: 0,
    socialContribution: 0,
    cpfEmployee: 0,
    cpfEmployer: 0,
    loanDeduction: 0,
    totalDeduction: 0,
    netSalary: 0,
  });

  useEffect(() => {
    dispatch(fetchAllPayslips({ year: filterYear, month: filterMonth }));
    dispatch(fetchEmployees());
  }, [dispatch, filterYear, filterMonth]);

  useEffect(() => {
    if (selectedCountry) {
      setForm((prev) => ({
        ...prev,
        country: selectedCountry.countryName,
        countryCode: selectedCountry.countryCode,
      }));
    }
  }, [selectedCountry]);

  useEffect(() => {
    const basic = parseFloat(form.basicSalary || '0');
    const allowance = parseFloat(form.allowance || '0');
    const overtime = parseFloat(form.overtimePay || '0');
    const yearEnd = parseFloat(form.yearEndBonus || '0');
    const thirteenth = parseFloat(form.thirteenthMonth || '0');
    const otherDeduction = parseFloat(form.otherDeduction || '0');
    const age = parseInt(form.employeeAge || '30');
    const gross = basic + allowance + overtime + yearEnd + thirteenth;

    const currentPolicy = countries.find((c: any) => c.countryCode === form.countryCode);

    let tax = 0;
    let socialContribution = 0;
    let cpfEmployee = 0;
    let cpfEmployer = 0;

    if (currentPolicy) {
      if (currentPolicy.hasProgressiveTax) {
        const annualGross = gross * 12;
        let annualTax = 0;
        const brackets = [...currentPolicy.taxBrackets].sort(
          (a: any, b: any) => a.minIncome - b.minIncome
        );
        for (const bracket of brackets) {
          if (annualGross <= bracket.minIncome) break;
          const taxable = Math.min(
            annualGross - bracket.minIncome,
            bracket.maxIncome - bracket.minIncome
          );
          annualTax += taxable * (bracket.taxRate / 100);
        }
        tax = Math.round((annualTax / 12) * 100) / 100;
      }

      if (currentPolicy.hasAgeBased) {
        const bracket = currentPolicy.ageBrackets.find(
          (b: any) => age >= b.minAge && age <= b.maxAge
        );
        if (bracket) {
          cpfEmployee = Math.round(gross * bracket.employeeRate / 100 * 100) / 100;
          cpfEmployer = Math.round(gross * bracket.employerRate / 100 * 100) / 100;
        }
      } else {
        socialContribution = Math.round(
          basic * currentPolicy.socialContributionEmployeeRate / 100 * 100
        ) / 100;
      }
    }

    const totalDeduction = tax + socialContribution + otherDeduction + loanDeduction + unpaidLeaveDeduction;
    const net = gross - totalDeduction;

    setPreview({
      grossSalary: gross,
      tax,
      socialContribution,
      cpfEmployee,
      cpfEmployer,
      loanDeduction,
      totalDeduction,
      netSalary: net,
    });
  }, [
    form.basicSalary, form.allowance, form.overtimePay, form.yearEndBonus,
    form.thirteenthMonth, form.otherDeduction, form.employeeAge, form.countryCode,
    countries, loanDeduction, unpaidLeaveDeduction,
  ]);

  const getWorkingDays = (year: number, month: number) => {
    let days = 0;
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month - 1, i).getDay();
      if (day !== 0 && day !== 6) days++;
    }
    return days;
  };

  const fetchEmployeePayrollData = async (
    employeeId: number,
    month: number,
    year: number,
    basicSalary: number
  ) => {
    try {
      const loanRes = await payrollApi.get(`/api/loan/employee/${employeeId}`);
      const activeLoans = loanRes.data.filter((l: any) => !l.isSettled);
      const totalLoan = activeLoans.reduce(
        (sum: number, l: any) => sum + l.monthlyDeduction, 0
      );
      setEmployeeLoans(activeLoans);
      setLoanDeduction(totalLoan);
    } catch {
      setEmployeeLoans([]);
      setLoanDeduction(0);
    }

    try {
      const leaveRes = await leaveApi.get(
        `/api/leave/unpaid?employeeId=${employeeId}&month=${month}&year=${year}`
      );
      const unpaidDays = leaveRes.data.totalUnpaidDays || 0;
      setUnpaidLeaveDays(unpaidDays);
      if (unpaidDays > 0 && basicSalary > 0) {
        const workingDays = getWorkingDays(year, month);
        const dailyRate = basicSalary / workingDays;
        setUnpaidLeaveDeduction(Math.round(dailyRate * unpaidDays * 100) / 100);
      } else {
        setUnpaidLeaveDeduction(0);
      }
    } catch {
      setUnpaidLeaveDays(0);
      setUnpaidLeaveDeduction(0);
    }
  };

  const handleEmployeeIdChange = (value: string) => {
    setForm({ ...form, employeeId: value });
    const emp = employees.find((e: any) => e.id === parseInt(value));
    if (emp) {
      setForm((prev) => ({
        ...prev,
        employeeId: value,
        employeeName: emp.fullName,
        departmentName: emp.departmentName,
        basicSalary: emp.baseSalary.toString(),
      }));
      fetchEmployeePayrollData(parseInt(value), form.month, form.year, emp.baseSalary);
    }
  };

  const handleEmployeeNameChange = (value: string) => {
    setForm({ ...form, employeeName: value });
    const emp = employees.find(
      (e: any) => e.fullName.toLowerCase() === value.toLowerCase()
    );
    if (emp) {
      setForm((prev) => ({
        ...prev,
        employeeName: value,
        employeeId: emp.id.toString(),
        departmentName: emp.departmentName,
        basicSalary: emp.baseSalary.toString(),
      }));
      fetchEmployeePayrollData(emp.id, form.month, form.year, emp.baseSalary);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const result = await dispatch(
        generatePayslip({
          employeeId: parseInt(form.employeeId),
          employeeName: form.employeeName,
          departmentName: form.departmentName,
          month: form.month,
          year: form.year,
          country: form.country,
          countryCode: form.countryCode,
          basicSalary: parseFloat(form.basicSalary),
          allowance: parseFloat(form.allowance || '0'),
          overtimePay: parseFloat(form.overtimePay || '0'),
          yearEndBonus: parseFloat(form.yearEndBonus || '0'),
          thirteenthMonth: parseFloat(form.thirteenthMonth || '0'),
          otherDeduction: parseFloat(form.otherDeduction || '0'),
          employeeAge: form.employeeAge ? parseInt(form.employeeAge) : undefined,
          notes: form.notes,
        })
      );
      if (generatePayslip.fulfilled.match(result)) {
        setMsg('Payslip generated successfully!');
        setShowForm(false);
        dispatch(fetchAllPayslips({ year: filterYear, month: filterMonth }));
        setForm({
          employeeId: '', employeeName: '', departmentName: '',
          month: new Date().getMonth() + 1, year: new Date().getFullYear(),
          country: selectedCountry?.countryName || 'Myanmar',
          countryCode: selectedCountry?.countryCode || 'MM',
          basicSalary: '', allowance: '', overtimePay: '',
          yearEndBonus: '', thirteenthMonth: '', otherDeduction: '',
          employeeAge: '', notes: '',
        });
        await logAction('Generated', 'Payroll', String(result.payload),
          `Payslip generated for ${form.employeeName} — ${months[form.month - 1]} ${form.year} (${form.country})`
        );
        setLoanDeduction(0);
        setUnpaidLeaveDays(0);
        setUnpaidLeaveDeduction(0);
        setEmployeeLoans([]);
      } else {
        setMsg((result.payload as string) || 'Failed to generate payslip.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const filtered = payslips.filter(
    (p) =>
      search === '' ||
      p.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      (p.departmentName?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const currentPolicy = countries.find((c: any) => c.countryCode === form.countryCode);
  const currency = currentPolicy?.currency || 'MMK';

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Payroll</h2>
          <p className="text-gray-500 text-sm">Generate and manage payslips</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportPayslipsExcel(filtered, `${months[filterMonth - 1]} ${filterYear}`)}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
            >
              <Download size={16} />
              Export Excel
            </button>
          </div>
          <button
            onClick={() => exportPayslipListPDF(filtered, `${months[filterMonth - 1]} ${filterYear}`)}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
          >
            <Download size={16} />
            Export PDF
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            <Plus size={16} />
            Generate Payslip
          </button>
        </div>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg mb-4 text-sm font-medium ${msg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
          {msg}
        </div>
      )}

      {/* Country Policy Info */}
      {selectedCountry && (
        <div className="rounded-2xl p-4 mb-4 text-sm border bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{selectedCountry.flagEmoji}</span>
            <p className="font-bold text-gray-700">{selectedCountry.countryName} Payroll Policy</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-gray-600">
            <p>💰 Currency: <strong>{selectedCountry.currency}</strong></p>
            <p>🏦 {selectedCountry.socialContributionLabel}:
              <strong> Employee {selectedCountry.socialContributionEmployeeRate}%
                · Employer {selectedCountry.socialContributionEmployerRate}%</strong>
            </p>
            {selectedCountry.hasProgressiveTax && <p>🏛️ Tax: <strong>Progressive</strong></p>}
            {selectedCountry.hasAgeBased && <p>👴 Contribution: <strong>Age-based</strong></p>}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 flex gap-4 items-end">
        <div className="relative flex-1">
          <label className="block text-xs text-gray-400 mb-1">Search</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by employee or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Year</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Month</label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(parseInt(e.target.value))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {months.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">No payslips found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Employee', 'Department', 'Month/Year', 'Country', 'Gross', 'Deductions', 'Net Salary'].map(
                  (h) => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold">{h}</th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedPayslip(p)}
                  className="border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {p.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{p.employeeName}</p>
                        <p className="text-xs text-gray-400">ID: {String(p.employeeId).padStart(2, '0')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded-full">
                      {p.departmentName || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{months[p.month - 1]} {p.year}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                      {p.country}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatCurrency(p.grossSalary, p.country)}</td>
                  <td className="px-4 py-3 text-red-500">-{formatCurrency(p.totalDeduction, p.country)}</td>
                  <td className="px-4 py-3 font-bold text-green-600">{formatCurrency(p.netSalary, p.country)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Generate Payslip Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Generate Payslip</h3>
              <button onClick={() => setShowForm(false)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleGenerate}>
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Employee Info</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Employee ID</label>
                      <input
                        type="number"
                        required
                        value={form.employeeId}
                        onChange={(e) => handleEmployeeIdChange(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Employee Name</label>
                      <input
                        type="text"
                        required
                        value={form.employeeName}
                        onChange={(e) => handleEmployeeNameChange(e.target.value)}
                        list="employee-names"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                      <datalist id="employee-names">
                        {employees.map((e: any) => (
                          <option key={e.id} value={e.fullName} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {form.departmentName && (
                    <div className="bg-indigo-50 rounded-lg px-3 py-2 text-xs text-indigo-700">
                      🏢 Department: <strong>{form.departmentName}</strong>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Month</label>
                      <select
                        value={form.month}
                        onChange={(e) => setForm({ ...form, month: parseInt(e.target.value) })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        {months.map((m, i) => (
                          <option key={i + 1} value={i + 1}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Year</label>
                      <input
                        type="number"
                        value={form.year}
                        onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Country</label>
                      <select
                        value={form.countryCode}
                        onChange={(e) => {
                          const c = countries.find((x: any) => x.countryCode === e.target.value);
                          setForm({ ...form, countryCode: e.target.value, country: c?.countryName || e.target.value });
                        }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      >
                        {countries.map((c: any) => (
                          <option key={c.countryCode} value={c.countryCode}>
                            {c.flagEmoji} {c.countryName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {currentPolicy?.hasAgeBased && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Employee Age (for {currentPolicy.socialContributionLabel})
                      </label>
                      <input
                        type="number"
                        value={form.employeeAge}
                        onChange={(e) => setForm({ ...form, employeeAge: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  )}

                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide pt-2">
                    Earnings ({currency})
                  </p>

                  {[
                    { label: 'Basic Salary', key: 'basicSalary', required: true },
                    { label: 'Allowance', key: 'allowance' },
                    { label: 'Overtime Pay', key: 'overtimePay' },
                    { label: 'Year End Bonus', key: 'yearEndBonus' },
                    { label: '13th Month', key: 'thirteenthMonth' },
                  ].map(({ label, key, required }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                      <input
                        type="number"
                        required={required}
                        value={form[key as keyof typeof form] as string}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Other Deduction ({currency})
                    </label>
                    <input
                      type="number"
                      value={form.otherDeduction}
                      onChange={(e) => setForm({ ...form, otherDeduction: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>

                {/* Right Column - Preview */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                    Payslip Preview
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm sticky top-0">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Earnings</p>
                    <PreviewRow label="Basic Salary" value={parseFloat(form.basicSalary || '0')} currency={currency} />
                    {parseFloat(form.allowance || '0') > 0 && (
                      <PreviewRow label="Allowance" value={parseFloat(form.allowance)} currency={currency} />
                    )}
                    {parseFloat(form.overtimePay || '0') > 0 && (
                      <PreviewRow label="Overtime Pay" value={parseFloat(form.overtimePay)} currency={currency} />
                    )}
                    {parseFloat(form.yearEndBonus || '0') > 0 && (
                      <PreviewRow label="Year End Bonus" value={parseFloat(form.yearEndBonus)} currency={currency} />
                    )}
                    {parseFloat(form.thirteenthMonth || '0') > 0 && (
                      <PreviewRow label="13th Month" value={parseFloat(form.thirteenthMonth)} currency={currency} />
                    )}
                    <div className="border-t border-gray-200 pt-2">
                      <PreviewRow label="Gross Salary" value={preview.grossSalary} currency={currency} bold />
                    </div>

                    <p className="text-xs font-bold text-gray-500 uppercase mt-3 mb-2">
                      Auto Calculated Deductions
                    </p>

                    {currentPolicy?.hasProgressiveTax && preview.tax > 0 && (
                      <PreviewRow label="Income Tax" value={preview.tax} currency={currency} negative />
                    )}
                    {!currentPolicy?.hasAgeBased && preview.socialContribution > 0 && (
                      <PreviewRow
                        label={`${currentPolicy?.socialContributionLabel || 'Social'} (${currentPolicy?.socialContributionEmployeeRate}%)`}
                        value={preview.socialContribution}
                        currency={currency}
                        negative
                      />
                    )}
                    {currentPolicy?.hasAgeBased && (preview.cpfEmployee > 0 || preview.cpfEmployer > 0) && (
                      <div className="bg-blue-50 rounded-lg p-2 mt-1">
                        <p className="text-xs font-bold text-blue-600 mb-1">CPF Reference (Not deducted)</p>
                        {preview.cpfEmployee > 0 && (
                          <PreviewRow label={`${currentPolicy.socialContributionLabel} Employee`} value={preview.cpfEmployee} currency={currency} />
                        )}
                        {preview.cpfEmployer > 0 && (
                          <PreviewRow label={`${currentPolicy.socialContributionLabel} Employer`} value={preview.cpfEmployer} currency={currency} />
                        )}
                      </div>
                    )}

                    {loanDeduction > 0 && (
                      <div className="bg-orange-50 rounded-lg p-2 mt-1 space-y-1">
                        <p className="text-xs font-bold text-orange-600 mb-1">🏦 Active Loans</p>
                        {employeeLoans.map((loan: any) => (
                          <PreviewRow
                            key={loan.id}
                            label={`Loan #${loan.id} (Remaining: ${currency} ${loan.remainingBalance.toLocaleString()})`}
                            value={loan.monthlyDeduction}
                            currency={currency}
                            negative
                          />
                        ))}
                      </div>
                    )}

                    {unpaidLeaveDays > 0 && (
                      <div className="bg-red-50 rounded-lg p-2 mt-1">
                        <p className="text-xs font-bold text-red-600 mb-1">📅 Unpaid Leave</p>
                        <PreviewRow
                          label={`${unpaidLeaveDays} unpaid day${unpaidLeaveDays > 1 ? 's' : ''} this month`}
                          value={unpaidLeaveDeduction}
                          currency={currency}
                          negative
                        />
                      </div>
                    )}

                    {parseFloat(form.otherDeduction || '0') > 0 && (
                      <PreviewRow label="Other Deduction" value={parseFloat(form.otherDeduction)} currency={currency} negative />
                    )}

                    <div className="border-t border-gray-200 pt-2">
                      <PreviewRow label="Total Deduction" value={preview.totalDeduction} currency={currency} negative bold />
                    </div>

                    <div className="bg-green-50 rounded-xl p-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-green-700">Net Salary</span>
                        <span className="text-lg font-bold text-green-700">
                          {currency} {preview.netSalary.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating || !form.employeeId || !form.basicSalary}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generating...' : 'Generate Payslip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Detail Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Payslip — {months[selectedPayslip.month - 1]} {selectedPayslip.year}
              </h3>
              <button onClick={() => setSelectedPayslip(null)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 mb-4">
              <p className="font-semibold text-indigo-800">{selectedPayslip.employeeName}</p>
              <p className="text-xs text-indigo-600">
                {selectedPayslip.departmentName || '-'} · {selectedPayslip.country}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Earnings</p>
              <div className="space-y-1.5">
                <DetailRow label="Basic Salary" value={selectedPayslip.basicSalary} country={selectedPayslip.country} />
                {selectedPayslip.allowance > 0 && <DetailRow label="Allowance" value={selectedPayslip.allowance} country={selectedPayslip.country} />}
                {selectedPayslip.overtimePay > 0 && <DetailRow label="Overtime Pay" value={selectedPayslip.overtimePay} country={selectedPayslip.country} />}
                {selectedPayslip.yearEndBonus > 0 && <DetailRow label="Year End Bonus" value={selectedPayslip.yearEndBonus} country={selectedPayslip.country} />}
                {selectedPayslip.thirteenthMonth > 0 && <DetailRow label="13th Month" value={selectedPayslip.thirteenthMonth} country={selectedPayslip.country} />}
                <div className="border-t border-gray-100 pt-1.5">
                  <DetailRow label="Gross Salary" value={selectedPayslip.grossSalary} country={selectedPayslip.country} bold />
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Deductions</p>
              <div className="space-y-1.5">
                {selectedPayslip.taxDeduction > 0 && <DetailRow label="Income Tax" value={selectedPayslip.taxDeduction} country={selectedPayslip.country} negative />}
                {selectedPayslip.socialSecurity > 0 && <DetailRow label="Social Contribution" value={selectedPayslip.socialSecurity} country={selectedPayslip.country} negative />}
                {selectedPayslip.cpfEmployee > 0 && <DetailRow label="CPF Employee" value={selectedPayslip.cpfEmployee} country={selectedPayslip.country} negative />}
                {selectedPayslip.loanDeduction > 0 && <DetailRow label="Loan Deduction" value={selectedPayslip.loanDeduction} country={selectedPayslip.country} negative />}
                {selectedPayslip.otherDeduction > 0 && <DetailRow label="Other Deduction" value={selectedPayslip.otherDeduction} country={selectedPayslip.country} negative />}
                <div className="border-t border-gray-100 pt-1.5">
                  <DetailRow label="Total Deduction" value={selectedPayslip.totalDeduction} country={selectedPayslip.country} negative bold />
                </div>
              </div>
            </div>

            {selectedPayslip.cpfEmployer > 0 && (
              <div className="bg-blue-50 rounded-xl p-3 mb-4">
                <p className="text-xs font-bold text-blue-600 mb-1">Employer Contribution (Not deducted)</p>
                <DetailRow label="CPF Employer" value={selectedPayslip.cpfEmployer} country={selectedPayslip.country} blue />
              </div>
            )}

            <div className="bg-green-50 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center">
                <p className="font-bold text-green-700">Net Salary</p>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency(selectedPayslip.netSalary, selectedPayslip.country)}
                </p>
              </div>
            </div>

            {selectedPayslip.notes && (
              <p className="text-xs text-gray-400 mb-4">Notes: {selectedPayslip.notes}</p>
            )}

            <button
              onClick={() => exportPayslipPDF(selectedPayslip)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition"
            >
              <Download size={16} />
              Download PDF
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

const PreviewRow = ({
  label, value, currency, negative, bold,
}: {
  label: string; value: number; currency: string; negative?: boolean; bold?: boolean;
}) => (
  <div className="flex justify-between text-sm">
    <span className={`text-gray-500 ${bold ? 'font-semibold text-gray-700' : ''}`}>{label}</span>
    <span className={`${negative ? 'text-red-500' : 'text-gray-700'} ${bold ? 'font-bold' : ''}`}>
      {negative ? '-' : ''}{currency} {value.toLocaleString()}
    </span>
  </div>
);

const DetailRow = ({
  label, value, country, negative, bold, blue,
}: {
  label: string; value: number; country: string; negative?: boolean; bold?: boolean; blue?: boolean;
}) => (
  <div className="flex justify-between text-sm">
    <span className={`${bold ? 'font-semibold text-gray-700' : 'text-gray-500'}`}>{label}</span>
    <span className={`${negative ? 'text-red-500' : blue ? 'text-blue-600' : 'text-gray-700'} ${bold ? 'font-bold' : ''}`}>
      {negative ? '-' : ''}{formatCurrency(value, country)}
    </span>
  </div>
);

export default AdminPayrollPage;