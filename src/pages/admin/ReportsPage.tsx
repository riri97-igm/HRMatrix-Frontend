import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchEmployees } from '../../store/slices/employeeSlice';
import { fetchAllLeaves } from '../../store/slices/leaveSlice';
import { fetchAllPayslips, fetchAllLoans } from '../../store/slices/payrollSlice';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
    LineChart, Line, AreaChart, Area,
} from 'recharts';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

type FilterPeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom';

const ReportsPage = () => {
    const dispatch = useAppDispatch();
    const { employees } = useAppSelector((state) => state.employee);
    const { leaves } = useAppSelector((state) => state.leave);
    const { payslips, loans } = useAppSelector((state) => state.payroll);

    const [period, setPeriod] = useState<FilterPeriod>('year');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        dispatch(fetchEmployees());
        dispatch(fetchAllLeaves());
        dispatch(fetchAllPayslips({}));
        dispatch(fetchAllLoans());
    }, [dispatch]);

    // Get date range
    const getDateRange = () => {
        const now = new Date();
        let from = new Date();
        const to = new Date();

        switch (period) {
            case 'week':
                from = new Date(now);
                from.setDate(now.getDate() - 7);
                break;
            case 'month':
                from = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                const q = Math.floor(now.getMonth() / 3);
                from = new Date(now.getFullYear(), q * 3, 1);
                break;
            case 'year':
                from = new Date(now.getFullYear(), 0, 1);
                break;
            case 'custom':
                return {
                    from: dateFrom ? new Date(dateFrom) : new Date(2000, 0, 1),
                    to: dateTo ? new Date(dateTo) : new Date(),
                };
        }
        return { from, to };
    };

    const { from, to } = getDateRange();

    // Filtered Data 
    const filteredLeaves = leaves.filter((l) => {
        const d = new Date(l.startDate);
        return d >= from && d <= to;
    });

    const filteredPayslips = payslips.filter((p) => {
        const d = new Date(p.year, p.month - 1, 1);
        return d >= from && d <= to;
    });

    const filteredLoans = loans.filter((l) => {
        const d = new Date(l.appliedDate);
        return d >= from && d <= to;
    });

    // Department Headcount 
    const deptData = employees
        .filter((e) => e.isActive)
        .reduce((acc: any[], emp) => {
            const existing = acc.find((d) => d.name === emp.departmentName);
            if (existing) existing.count++;
            else acc.push({ name: emp.departmentName, count: 1 });
            return acc;
        }, [])
        .sort((a, b) => b.count - a.count);

    // Payroll Trend 
    const payrollTrend = filteredPayslips
        .reduce((acc: any[], p) => {
            const key = `${months[p.month - 1]} ${p.year}`;
            const existing = acc.find((d) => d.period === key);
            if (existing) {
                existing.gross += p.grossSalary;
                existing.net += p.netSalary;
                existing.count += 1;
            } else {
                acc.push({ period: key, gross: p.grossSalary, net: p.netSalary, count: 1 });
            }
            return acc;
        }, [])
        .sort((a, b) => {
            const [am, ay] = a.period.split(' ');
            const [bm, by] = b.period.split(' ');
            return new Date(`${am} 1 ${ay}`).getTime() - new Date(`${bm} 1 ${by}`).getTime();
        });

    // Leave Analysis 
    const leaveByType = filteredLeaves.reduce((acc: any[], l) => {
        const existing = acc.find((d) => d.name === l.leaveType);
        if (existing) {
            existing.total++;
            if (l.status === 'Approved') existing.approved++;
            if (l.status === 'Rejected') existing.rejected++;
            if (l.status === 'Pending') existing.pending++;
        } else {
            acc.push({
                name: l.leaveType,
                total: 1,
                approved: l.status === 'Approved' ? 1 : 0,
                rejected: l.status === 'Rejected' ? 1 : 0,
                pending: l.status === 'Pending' ? 1 : 0,
            });
        }
        return acc;
    }, []);

    // Headcount Trend (by join date) 
    const headcountTrend = employees
        .filter((e) => {
            const d = new Date(e.joinDate);
            return d >= from && d <= to;
        })
        .reduce((acc: any[], emp) => {
            const d = new Date(emp.joinDate);
            const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
            const existing = acc.find((x) => x.period === key);
            if (existing) existing.joined++;
            else acc.push({ period: key, joined: 1 });
            return acc;
        }, [])
        .sort((a, b) => {
            const [am, ay] = a.period.split(' ');
            const [bm, by] = b.period.split(' ');
            return new Date(`${am} 1 ${ay}`).getTime() - new Date(`${bm} 1 ${by}`).getTime();
        });

    // Employee Status 
    const empStatusData = [
        { name: 'Active', value: employees.filter((e) => e.isActive).length },
        { name: 'Resigned', value: employees.filter((e) => e.status === 'Resigned').length },
        { name: 'Terminated', value: employees.filter((e) => e.status === 'Terminated').length },
        { name: 'Retired', value: employees.filter((e) => e.status === 'Retired').length },
        { name: 'On Leave', value: employees.filter((e) => e.status === 'OnLeave').length },
    ].filter((d) => d.value > 0);

    // Loan Summary 
    const loanByType = filteredLoans.reduce((acc: any[], l) => {
        const existing = acc.find((d) => d.name === l.loanType);
        if (existing) {
            existing.count++;
            existing.amount += l.requestedAmount;
        } else {
            acc.push({ name: l.loanType, count: 1, amount: l.requestedAmount });
        }
        return acc;
    }, []);

    // Summary KPIs 
    const totalPayrollCost = filteredPayslips.reduce((sum, p) => sum + p.grossSalary, 0);
    const avgSalary = employees.filter((e) => e.isActive).length > 0
        ? employees.filter((e) => e.isActive).reduce((sum, e) => sum + e.baseSalary, 0) /
        employees.filter((e) => e.isActive).length
        : 0;
    const leaveApprovalRate = filteredLeaves.length > 0
        ? Math.round((filteredLeaves.filter((l) => l.status === 'Approved').length / filteredLeaves.length) * 100)
        : 0;
    const totalOutstandingLoans = loans
        .filter((l) => l.status === 'Approved' && !l.isSettled)
        .reduce((sum, l) => sum + l.remainingBalance, 0);

    const periodLabel = {
        week: 'This Week',
        month: 'This Month',
        quarter: 'This Quarter',
        year: 'This Year',
        custom: `${dateFrom || '...'} to ${dateTo || '...'}`,
    }[period];

    // Export Summary
    const handleExportSummary = () => {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Payroll Trend
        const payrollSheet = XLSX.utils.json_to_sheet(
            payrollTrend.length > 0 ? payrollTrend.map((p) => ({
                Period: p.period,
                'Gross Salary': p.gross,
                'Net Salary': p.net,
                'Payslips Count': p.count,
            })) : [{ Note: 'No payroll data for selected period' }]
        );
        XLSX.utils.book_append_sheet(wb, payrollSheet, 'Payroll Trend');

        // Sheet 2: Leave Analysis
        const leaveSheet = XLSX.utils.json_to_sheet(
            leaveByType.length > 0 ? leaveByType.map((l) => ({
                'Leave Type': l.name,
                'Total Requests': l.total,
                Approved: l.approved,
                Rejected: l.rejected,
                Pending: l.pending,
                'Approval Rate': l.total > 0
                    ? `${Math.round((l.approved / l.total) * 100)}%`
                    : '0%',
            })) : [{ Note: 'No leave data for selected period' }]
        );
        XLSX.utils.book_append_sheet(wb, leaveSheet, 'Leave Analysis');

        // Sheet 3: Department Headcount
        const deptSheet = XLSX.utils.json_to_sheet(
            deptData.length > 0 ? deptData.map((d) => ({
                Department: d.name,
                'Active Headcount': d.count,
            })) : [{ Note: 'No department data' }]
        );
        XLSX.utils.book_append_sheet(wb, deptSheet, 'Department Headcount');

        // Sheet 4: Employee Status
        const empStatusSheet = XLSX.utils.json_to_sheet(
            empStatusData.length > 0 ? empStatusData.map((e) => ({
                Status: e.name,
                Count: e.value,
            })) : [{ Note: 'No employee data' }]
        );
        XLSX.utils.book_append_sheet(wb, empStatusSheet, 'Employee Status');

        // Sheet 5: New Hires Trend
        const hiresSheet = XLSX.utils.json_to_sheet(
            headcountTrend.length > 0 ? headcountTrend.map((h) => ({
                Period: h.period,
                'New Hires': h.joined,
            })) : [{ Note: 'No hire data for selected period' }]
        );
        XLSX.utils.book_append_sheet(wb, hiresSheet, 'New Hires Trend');

        // Sheet 6: Loan Analysis
        const loanAnalysisSheet = XLSX.utils.json_to_sheet(
            loanByType.length > 0 ? loanByType.map((l) => ({
                'Loan Type': l.name,
                Applications: l.count,
                'Total Amount': l.amount,
                'Avg Amount': Math.round(l.amount / l.count),
            })) : [{ Note: 'No loan data for selected period' }]
        );
        XLSX.utils.book_append_sheet(wb, loanAnalysisSheet, 'Loan Analysis');

        // Sheet 7: All Employees
        const allEmpSheet = XLSX.utils.json_to_sheet(
            employees.length > 0 ? employees.map((e) => ({
                'Employee ID': String(e.id).padStart(2, '0'),
                'Full Name': e.fullName,
                Email: e.email,
                Position: e.position,
                Department: e.departmentName,
                'Join Date': e.joinDate.split('T')[0],
                Status: e.isActive ? 'Active' : (e.status || 'Inactive'),
            })) : [{ Note: 'No employee data' }]
        );
        XLSX.utils.book_append_sheet(wb, allEmpSheet, 'All Employees');

        // Sheet 8: All Payslips
        const allPayslipsSheet = XLSX.utils.json_to_sheet(
            payslips.length > 0 ? payslips.map((p) => ({
                'Employee ID': String(p.employeeId).padStart(2, '0'),
                'Employee Name': p.employeeName,
                Department: p.departmentName || '-',
                Period: `${months[p.month - 1]} ${p.year}`,
                Country: p.country,
                'Basic Salary': p.basicSalary,
                Allowance: p.allowance,
                Overtime: p.overtimePay,
                'Year End Bonus': p.yearEndBonus,
                '13th Month': p.thirteenthMonth,
                'Gross Salary': p.grossSalary,
                Tax: p.taxDeduction,
                Social: p.socialSecurity,
                'Loan Deduction': p.loanDeduction,
                'Other Deduction': p.otherDeduction,
                'Total Deduction': p.totalDeduction,
                'Net Salary': p.netSalary,
            })) : [{ Note: 'No payslip data' }]
        );
        XLSX.utils.book_append_sheet(wb, allPayslipsSheet, 'Payslips');

        // Sheet 9: All Loans
        const allLoansSheet = XLSX.utils.json_to_sheet(
            loans.length > 0 ? loans.map((l) => ({
                'Loan ID': l.id,
                Employee: l.employeeName,
                Department: l.departmentName,
                'Loan Type': l.loanType,
                'Requested Amount': l.requestedAmount,
                'Monthly Deduction': l.monthlyDeduction,
                'Remaining Balance': l.remainingBalance,
                Status: l.status,
                'Applied Date': l.appliedDate.split('T')[0],
                'Start Date': l.startDate?.split('T')[0] || '-',
                Purpose: l.purpose,
            })) : [{ Note: 'No loan data' }]
        );
        XLSX.utils.book_append_sheet(wb, allLoansSheet, 'Loans');

        // Sheet 10: All Leaves
        const allLeavesSheet = XLSX.utils.json_to_sheet(
            leaves.length > 0 ? leaves.map((l) => ({
                Employee: l.employeeName,
                'Leave Type': l.leaveType,
                From: l.startDate.split('T')[0],
                To: l.endDate.split('T')[0],
                Days: l.totalDays,
                Status: l.status,
                Reason: l.reason,
                Comment: l.reviewComment || '-',
            })) : [{ Note: 'No leave data' }]
        );
        XLSX.utils.book_append_sheet(wb, allLeavesSheet, 'Leaves');

        XLSX.writeFile(wb, `HRMatrix_Report_${periodLabel}.xlsx`);
    };

    return (
        <Layout>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
                    <p className="text-gray-500 text-sm">
                        Strategic HR insights and trends — {periodLabel}
                    </p>
                </div>
                <button
                    onClick={handleExportSummary}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                    <Download size={16} />
                    Export Report
                </button>
            </div>

            {/* Period Filter */}
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
                <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        View Period:
                    </p>
                    {(['week', 'month', 'quarter', 'year', 'custom'] as FilterPeriod[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${period === p
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                        >
                            {p === 'week' ? 'This Week' :
                                p === 'month' ? 'This Month' :
                                    p === 'quarter' ? 'This Quarter' :
                                        p === 'year' ? 'This Year' : 'Custom Range'}
                        </button>
                    ))}
                    {period === 'custom' && (
                        <div className="flex items-center gap-2 ml-2">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                            <span className="text-gray-400 text-sm">to</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <KPICard
                    label="Total Payroll Cost"
                    value={totalPayrollCost.toLocaleString()}
                    hint={periodLabel}
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                />
                <KPICard
                    label="Avg. Salary"
                    value={Math.round(avgSalary).toLocaleString()}
                    hint="Active employees"
                    color="text-green-600"
                    bg="bg-green-50"
                />
                <KPICard
                    label="Leave Approval Rate"
                    value={`${leaveApprovalRate}%`}
                    hint={periodLabel}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <KPICard
                    label="Outstanding Loans"
                    value={totalOutstandingLoans.toLocaleString()}
                    hint="Total remaining balance"
                    color="text-red-600"
                    bg="bg-red-50"
                />
            </div>

            {/* Charts Row 1 — Payroll Trend + Headcount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Payroll Cost Trend</h3>
                    <p className="text-xs text-gray-400 mb-4">Gross vs Net salary over time</p>
                    {payrollTrend.length === 0 ? (
                        <EmptyChart />
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={payrollTrend}>
                                <defs>
                                    <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip formatter={(v: any) => v.toLocaleString()} />
                                <Legend />
                                <Area type="monotone" dataKey="gross" name="Gross" stroke="#6366f1" fill="url(#grossGrad)" strokeWidth={2} />
                                <Area type="monotone" dataKey="net" name="Net" stroke="#22c55e" fill="url(#netGrad)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">New Hires Trend</h3>
                    <p className="text-xs text-gray-400 mb-4">Employees joined over time</p>
                    {headcountTrend.length === 0 ? (
                        <EmptyChart />
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={headcountTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="joined" name="New Hires" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Charts Row 2 — Department + Employee Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Headcount by Department</h3>
                    <p className="text-xs text-gray-400 mb-4">Current active employees</p>
                    {deptData.length === 0 ? (
                        <EmptyChart />
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={deptData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={90} />
                                <Tooltip />
                                <Bar dataKey="count" name="Employees" fill="#6366f1" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Employee Status Breakdown</h3>
                    <p className="text-xs text-gray-400 mb-4">All time employee statuses</p>
                    {empStatusData.length === 0 ? (
                        <EmptyChart />
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={empStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={95}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                    labelLine={false}
                                >
                                    {empStatusData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Charts Row 3 — Leave + Loan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Leave Analysis by Type</h3>
                    <p className="text-xs text-gray-400 mb-4">Approved vs Rejected vs Pending</p>
                    {leaveByType.length === 0 ? (
                        <EmptyChart />
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={leaveByType}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="approved" name="Approved" fill="#22c55e" radius={[4, 4, 0, 0]} stackId="a" />
                                <Bar dataKey="pending" name="Pending" fill="#f59e0b" stackId="a" />
                                <Bar dataKey="rejected" name="Rejected" fill="#ef4444" stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">Loan Applications by Type</h3>
                    <p className="text-xs text-gray-400 mb-4">Count of applications per type</p>
                    {loanByType.length === 0 ? (
                        <EmptyChart />
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={loanByType}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={95}
                                    dataKey="count"
                                    label={({ name, value }) => `${name}: ${value}`} labelLine={false}
                                >
                                    {loanByType.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any) => [v, 'Applications']} />                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </Layout>
    );
};

const KPICard = ({
    label, value, hint, color, bg,
}: {
    label: string; value: string; hint: string; color: string; bg: string;
}) => (
    <div className={`${bg} rounded-2xl p-5`}>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-gray-700 text-sm font-medium mt-1">{label}</p>
        <p className="text-gray-400 text-xs mt-0.5">{hint}</p>
    </div>
);

const EmptyChart = () => (
    <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
        No data for this period
    </div>
);

export default ReportsPage;