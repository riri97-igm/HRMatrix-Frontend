import { useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchEmployees } from '../../store/slices/employeeSlice';
import { fetchAllLeaves } from '../../store/slices/leaveSlice';
import { fetchAllPayslips, fetchAllLoans } from '../../store/slices/payrollSlice';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const ReportsPage = () => {
    const dispatch = useAppDispatch();
    const { employees } = useAppSelector((state) => state.employee);
    const { leaves } = useAppSelector((state) => state.leave);
    const { payslips, loans } = useAppSelector((state) => state.payroll);

    useEffect(() => {
        dispatch(fetchEmployees());
        dispatch(fetchAllLeaves());
        dispatch(fetchAllPayslips({}));
        dispatch(fetchAllLoans());
    }, [dispatch]);

    // Department Headcount
    const deptData = employees
        .filter((e) => e.isActive)
        .reduce((acc: any[], emp) => {
            const existing = acc.find((d) => d.name === emp.departmentName);
            if (existing) existing.count++;
            else acc.push({ name: emp.departmentName, count: 1 });
            return acc;
        }, []);

    // Leave Status Distribution
    const leaveStatusData = [
        { name: 'Pending', value: leaves.filter((l) => l.status === 'Pending').length },
        { name: 'Approved', value: leaves.filter((l) => l.status === 'Approved').length },
        { name: 'Rejected', value: leaves.filter((l) => l.status === 'Rejected').length },
    ].filter((d) => d.value > 0);

    // Monthly Payroll Cost 
    const payrollByMonth = payslips.reduce((acc: any[], p) => {
        const key = `${months[p.month - 1]} ${p.year}`;
        const existing = acc.find((d) => d.month === key);
        if (existing) {
            existing.gross += p.grossSalary;
            existing.net += p.netSalary;
        } else {
            acc.push({ month: key, gross: p.grossSalary, net: p.netSalary });
        }
        return acc;
    }, []).slice(-6);

    // Leave Type Distribution 
    const leaveTypeData = leaves.reduce((acc: any[], l) => {
        const existing = acc.find((d) => d.name === l.leaveType);
        if (existing) existing.value++;
        else acc.push({ name: l.leaveType, value: 1 });
        return acc;
    }, []);

    // Loan Status 
    const loanStatusData = [
        { name: 'Pending', value: loans.filter((l) => l.status === 'Pending').length },
        { name: 'HR Approved', value: loans.filter((l) => l.status === 'HRApproved').length },
        { name: 'Mgr Approved', value: loans.filter((l) => l.status === 'ManagerApproved').length },
        { name: 'Active', value: loans.filter((l) => l.status === 'Approved' && !l.isSettled).length },
        { name: 'Settled', value: loans.filter((l) => l.isSettled).length },
    ].filter((d) => d.value > 0);

    // Employee Status
    const empStatusData = [
        { name: 'Active', value: employees.filter((e) => e.isActive).length },
        { name: 'Resigned', value: employees.filter((e) => e.status === 'Resigned').length },
        { name: 'Terminated', value: employees.filter((e) => e.status === 'Terminated').length },
        { name: 'Retired', value: employees.filter((e) => e.status === 'Retired').length },
        { name: 'On Leave', value: employees.filter((e) => e.status === 'OnLeave').length },
    ].filter((d) => d.value > 0);

    // Summary Stats 
    const totalPayroll = payslips.reduce((sum, p) => sum + p.netSalary, 0);
    const totalLoans = loans.reduce((sum, l) => sum + l.remainingBalance, 0);
    const activeEmployees = employees.filter((e) => e.isActive).length;
    const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;

    return (
        <Layout>
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
                <p className="text-gray-500 text-sm">Overview of HR metrics and trends</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard icon="👥" label="Active Employees" value={activeEmployees} color="bg-indigo-500" />
                <StatCard icon="⏳" label="Pending Leaves" value={pendingLeaves} color="bg-yellow-500" />
                <StatCard
                    icon="💰"
                    label="Total Payroll Paid"
                    value={totalPayroll.toLocaleString()}
                    color="bg-green-500"
                    small
                />
                <StatCard
                    icon="🏦"
                    label="Outstanding Loans"
                    value={totalLoans.toLocaleString()}
                    color="bg-red-500"
                    small
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                {/* Headcount by Department */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Headcount by Department
                    </h3>
                    {deptData.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">No data</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={deptData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" name="Employees" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Employee Status */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Employee Status
                    </h3>
                    {empStatusData.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">No data</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={empStatusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                    labelLine={false}
                                >
                                    {empStatusData.map((_, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                {/* Monthly Payroll Cost */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Monthly Payroll Cost (Last 6 Months)
                    </h3>
                    {payrollByMonth.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">No payroll data</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={payrollByMonth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(value: any) => value.toLocaleString()} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="gross"
                                    name="Gross"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="net"
                                    name="Net"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Leave Type Distribution */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Leave Type Distribution
                    </h3>
                    {leaveTypeData.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">No leave data</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={leaveTypeData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                                <Tooltip />
                                <Bar dataKey="value" name="Count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Charts Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Leave Status */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Leave Status Overview
                    </h3>
                    {leaveStatusData.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">No data</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={leaveStatusData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    {leaveStatusData.map((_, index) => (
                                        <Cell
                                            key={index}
                                            fill={
                                                index === 0 ? '#f59e0b' :
                                                    index === 1 ? '#22c55e' : '#ef4444'
                                            }
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Loan Status */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Loan Status Overview
                    </h3>
                    {loanStatusData.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">No loan data</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={loanStatusData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value" name="Loans" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </Layout>
    );
};

const StatCard = ({
    icon,
    label,
    value,
    color,
    small,
}: {
    icon: string;
    label: string;
    value: string | number;
    color: string;
    small?: boolean;
}) => (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
        <div className={`${color} text-white text-2xl w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}>
            {icon}
        </div>
        <div className="min-w-0">
            <p className={`font-bold text-gray-800 truncate ${small ? 'text-lg' : 'text-2xl'}`}>
                {value}
            </p>
            <p className="text-gray-500 text-sm truncate">{label}</p>
        </div>
    </div>
);

export default ReportsPage;