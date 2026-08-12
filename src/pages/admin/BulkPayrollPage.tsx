import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchEmployees } from '../../store/slices/employeeSlice';
import { payrollApi } from '../../services/api';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
];

interface BulkResult {
    employeeId: number;
    employeeName: string;
    status: 'success' | 'failed' | 'pending';
    message: string;
}

const BulkPayrollPage = () => {
    const dispatch = useAppDispatch();
    const { employees } = useAppSelector((state) => state.employee);
    const { selectedCountry, countries } = useAppSelector(
        (state) => state.settings ?? { selectedCountry: null, countries: [] }
    );

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [countryCode, setCountryCode] = useState(selectedCountry?.countryCode || 'MM');
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [generating, setGenerating] = useState(false);
    const [results, setResults] = useState<BulkResult[]>([]);
    const [progress, setProgress] = useState(0);
    const [bonusSettings, setBonusSettings] = useState({
        allowance: '',
        overtimePay: '',
        yearEndBonusMonths: '',
        thirteenthMonth: false,
        otherDeduction: '',
    });

    useEffect(() => {
        dispatch(fetchEmployees());
    }, [dispatch]);

    useEffect(() => {
        if (selectedCountry) setCountryCode(selectedCountry.countryCode);
    }, [selectedCountry]);

    const activeEmployees = employees.filter((e) => e.isActive);
    const currentPolicy = countries.find((c: any) => c.countryCode === countryCode);

    const toggleEmployee = (id: number) => {
        setSelectedEmployees((prev) =>
            prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedEmployees.length === activeEmployees.length) {
            setSelectedEmployees([]);
        } else {
            setSelectedEmployees(activeEmployees.map((e) => e.id));
        }
    };

    const getEstimatedTotal = () => {
        return activeEmployees
            .filter((e) => selectedEmployees.includes(e.id))
            .reduce((sum, e) => {
                const bonus = bonusSettings.yearEndBonusMonths
                    ? e.baseSalary * parseFloat(bonusSettings.yearEndBonusMonths)
                    : 0;
                const thirteenth = bonusSettings.thirteenthMonth ? e.baseSalary : 0;
                const allowance = parseFloat(bonusSettings.allowance || '0');
                const overtime = parseFloat(bonusSettings.overtimePay || '0');
                return sum + e.baseSalary + bonus + thirteenth + allowance + overtime;
            }, 0);
    };

    const handleBulkGenerate = async () => {
        if (selectedEmployees.length === 0) return;

        const confirmed = window.confirm(
            `Generate payslips for ${selectedEmployees.length} employees for ${months[month - 1]} ${year}?`
        );
        if (!confirmed) return;

        setGenerating(true);
        setResults([]);
        setProgress(0);

        const initialResults: BulkResult[] = selectedEmployees.map((id) => {
            const emp = employees.find((e) => e.id === id)!;
            return {
                employeeId: id,
                employeeName: emp.fullName,
                status: 'pending',
                message: 'Waiting...',
            };
        });
        setResults(initialResults);

        for (let i = 0; i < selectedEmployees.length; i++) {
            const empId = selectedEmployees[i];
            const emp = employees.find((e) => e.id === empId)!;

            try {
                await payrollApi.post('/api/payroll', {
                    employeeId: emp.id,
                    employeeName: emp.fullName,
                    departmentName: emp.departmentName,
                    month,
                    year,
                    country: currentPolicy?.countryName || 'Myanmar',
                    countryCode,
                    basicSalary: emp.baseSalary,
                    allowance: parseFloat(bonusSettings.allowance || '0'),
                    overtimePay: parseFloat(bonusSettings.overtimePay || '0'),
                    yearEndBonus: bonusSettings.yearEndBonusMonths
                        ? emp.baseSalary * parseFloat(bonusSettings.yearEndBonusMonths)
                        : 0,
                    thirteenthMonth: bonusSettings.thirteenthMonth ? emp.baseSalary : 0,
                    otherDeduction: parseFloat(bonusSettings.otherDeduction || '0'),
                    notes: `Bulk generated - ${months[month - 1]} ${year}`,
                });

                setResults((prev) =>
                    prev.map((r) =>
                        r.employeeId === empId
                            ? { ...r, status: 'success', message: 'Generated successfully' }
                            : r
                    )
                );
            } catch (error: any) {
                setResults((prev) =>
                    prev.map((r) =>
                        r.employeeId === empId
                            ? {
                                ...r,
                                status: 'failed',
                                message: error.response?.data?.message || 'Failed',
                            }
                            : r
                    )
                );
            }

            setProgress(Math.round(((i + 1) / selectedEmployees.length) * 100));
        }

        setGenerating(false);
    };

    const successCount = results.filter((r) => r.status === 'success').length;
    const failedCount = results.filter((r) => r.status === 'failed').length;

    return (
        <Layout>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Bulk Payroll Generation</h2>
                <p className="text-gray-500 text-sm">
                    Generate payslips for multiple employees at once
                </p>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Left — Settings + Employee List */}
                <div className="col-span-2 space-y-4">

                    {/* Settings */}
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Payroll Settings
                        </h3>

                        {/* Period + Country */}
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Month</label>
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(parseInt(e.target.value))}
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
                                    value={year}
                                    onChange={(e) => setYear(parseInt(e.target.value))}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Country</label>
                                <select
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
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

                        {currentPolicy && (
                            <div className="mt-3 bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                                💰 {currentPolicy.currency} ·
                                🏦 {currentPolicy.socialContributionLabel} Employee {currentPolicy.socialContributionEmployeeRate}%
                                {currentPolicy.hasProgressiveTax && ' · 🏛️ Progressive Tax'}
                                {currentPolicy.hasAgeBased && ' · 👴 Age-based CPF'}
                            </div>
                        )}

                        {/* Bonus Settings */}
                        <div className="mt-4 border-t border-gray-100 pt-4">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                                Earnings & Bonus Settings
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                                        Allowance (fixed amount for all)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={bonusSettings.allowance}
                                        onChange={(e) =>
                                            setBonusSettings({ ...bonusSettings, allowance: e.target.value })
                                        }
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                                        Overtime Pay (fixed amount for all)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={bonusSettings.overtimePay}
                                        onChange={(e) =>
                                            setBonusSettings({ ...bonusSettings, overtimePay: e.target.value })
                                        }
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                                        Year End Bonus (× months salary)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        placeholder="0"
                                        value={bonusSettings.yearEndBonusMonths}
                                        onChange={(e) =>
                                            setBonusSettings({ ...bonusSettings, yearEndBonusMonths: e.target.value })
                                        }
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        e.g. 1 = 1 month salary, 0.5 = half month
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                                        Other Deduction (fixed amount for all)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={bonusSettings.otherDeduction}
                                        onChange={(e) =>
                                            setBonusSettings({ ...bonusSettings, otherDeduction: e.target.value })
                                        }
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                </div>
                            </div>

                            {/* 13th Month Toggle */}
                            <label className="flex items-center gap-2 mt-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={bonusSettings.thirteenthMonth}
                                    onChange={(e) =>
                                        setBonusSettings({ ...bonusSettings, thirteenthMonth: e.target.checked })
                                    }
                                    className="rounded"
                                />
                                <span className="text-sm text-gray-600">
                                    Include 13th Month Pay (1 × basic salary for each employee)
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Employee Selection */}
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Select Employees
                            </h3>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-500">
                                    {selectedEmployees.length} selected
                                </span>
                                <button
                                    onClick={toggleAll}
                                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                    {selectedEmployees.length === activeEmployees.length
                                        ? 'Deselect All'
                                        : 'Select All'}
                                </button>
                            </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {activeEmployees.map((emp) => (
                                <div
                                    key={emp.id}
                                    onClick={() => toggleEmployee(emp.id)}
                                    className={`flex items-center gap-3 px-6 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 transition ${selectedEmployees.includes(emp.id) ? 'bg-indigo-50' : ''
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedEmployees.includes(emp.id)}
                                        onChange={() => toggleEmployee(emp.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="rounded"
                                    />
                                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                                        {emp.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{emp.fullName}</p>
                                        <p className="text-xs text-gray-400 truncate">
                                            {emp.departmentName} · {emp.position}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-sm text-gray-600">
                                            {currentPolicy?.currency || 'MMK'} {emp.baseSalary.toLocaleString()}
                                        </p>
                                        {bonusSettings.yearEndBonusMonths && (
                                            <p className="text-xs text-green-600">
                                                +{(emp.baseSalary * parseFloat(bonusSettings.yearEndBonusMonths)).toLocaleString()} bonus
                                            </p>
                                        )}
                                        {bonusSettings.thirteenthMonth && (
                                            <p className="text-xs text-blue-600">
                                                +{emp.baseSalary.toLocaleString()} 13th
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right — Summary + Generate */}
                <div className="space-y-4">
                    {/* Summary */}
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Period</span>
                                <span className="font-semibold">{months[month - 1]} {year}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Country</span>
                                <span className="font-semibold">
                                    {currentPolicy?.flagEmoji} {currentPolicy?.countryName || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Selected</span>
                                <span className="font-bold text-indigo-600">
                                    {selectedEmployees.length} employees
                                </span>
                            </div>
                            {bonusSettings.yearEndBonusMonths && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Year End Bonus</span>
                                    <span className="font-semibold text-green-600">
                                        {bonusSettings.yearEndBonusMonths}× salary
                                    </span>
                                </div>
                            )}
                            {bonusSettings.thirteenthMonth && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">13th Month</span>
                                    <span className="font-semibold text-blue-600">Included ✓</span>
                                </div>
                            )}
                            <div className="border-t border-gray-100 pt-3 flex justify-between">
                                <span className="text-gray-500">Est. Total</span>
                                <span className="font-bold text-green-600 text-right">
                                    {currentPolicy?.currency || 'MMK'}{' '}
                                    {getEstimatedTotal().toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleBulkGenerate}
                            disabled={generating || selectedEmployees.length === 0}
                            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {generating
                                ? `Generating... ${progress}%`
                                : `Generate ${selectedEmployees.length} Payslips`}
                        </button>
                    </div>

                    {/* Progress */}
                    {generating && (
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h3 className="text-sm font-semibold text-gray-800 mb-3">
                                Progress
                            </h3>
                            <div className="bg-gray-100 rounded-full h-3 mb-2">
                                <div
                                    className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 text-center">{progress}%</p>
                        </div>
                    )}

                    {/* Results */}
                    {results.length > 0 && !generating && (
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h3 className="text-sm font-semibold text-gray-800 mb-3">Results</h3>
                            <div className="flex gap-6 mb-3">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">{successCount}</p>
                                    <p className="text-xs text-gray-400">Success</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-red-500">{failedCount}</p>
                                    <p className="text-xs text-gray-400">Failed</p>
                                </div>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {results.map((r) => (
                                    <div
                                        key={r.employeeId}
                                        className={`flex items-center gap-2 text-xs p-2 rounded-lg ${r.status === 'success'
                                                ? 'bg-green-50'
                                                : r.status === 'failed'
                                                    ? 'bg-red-50'
                                                    : 'bg-gray-50'
                                            }`}
                                    >
                                        {r.status === 'success' ? (
                                            <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                                        ) : r.status === 'failed' ? (
                                            <XCircle size={14} className="text-red-500 flex-shrink-0" />
                                        ) : (
                                            <Loader size={14} className="text-gray-400 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate text-gray-700 font-medium">{r.employeeName}</p>
                                            {r.status === 'failed' && (
                                                <p className="text-red-400 truncate">{r.message}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default BulkPayrollPage;