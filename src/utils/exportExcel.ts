import * as XLSX from 'xlsx';
import type { Payslip, Employee, Loan } from '../types';

const months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
];

const getCurrency = (country: string): string => {
    const map: Record<string, string> = {
        'Myanmar': 'MMK', 'Singapore': 'SGD', 'Thailand': 'THB',
        'Malaysia': 'MYR', 'Philippines': 'PHP',
    };
    return map[country] || country;
};

// ── Export Payslip List to Excel ──────────────────
export const exportPayslipsExcel = (payslips: Payslip[], period: string) => {
    if (!payslips || payslips.length === 0) return;

    const data = payslips.map((p) => ({
        'Employee ID': String(p.employeeId).padStart(2, '0'),
        'Employee Name': p.employeeName,
        'Department': p.departmentName || '-',
        'Country': p.country,
        'Currency': getCurrency(p.country),
        'Period': `${months[p.month - 1]} ${p.year}`,
        'Basic Salary': p.basicSalary,
        'Allowance': p.allowance,
        'Overtime Pay': p.overtimePay,
        'Year End Bonus': p.yearEndBonus,
        '13th Month': p.thirteenthMonth,
        'Gross Salary': p.grossSalary,
        'Income Tax': p.taxDeduction,
        'Social Contribution': p.socialSecurity,
        'CPF Employee': p.cpfEmployee,
        'Loan Deduction': p.loanDeduction,
        'Other Deduction': p.otherDeduction,
        'Total Deduction': p.totalDeduction,
        'Net Salary': p.netSalary,
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
        { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 12 },
        { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
        { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
        { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
    XLSX.writeFile(wb, `Payroll_${period}.xlsx`);
};

// ── Export Employee List to Excel ─────────────────
export const exportEmployeesExcel = (employees: Employee[]) => {
    if (!employees || employees.length === 0) return;

    const data = employees.map((e) => ({
        'Employee ID': String(e.id).padStart(2, '0'),
        'Full Name': e.fullName,
        'Email': e.email,
        'Phone': e.phone,
        'Position': e.position,
        'Department': e.departmentName,
        'Join Date': e.joinDate.split('T')[0],
        'Base Salary': e.baseSalary,
        'Status': e.isActive ? 'Active' : (e.status || 'Inactive'),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
        { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 15 },
        { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, `Employees_${new Date().toLocaleDateString()}.xlsx`);
};

// ── Export Loan List to Excel ─────────────────────
export const exportLoansExcel = (loans: Loan[]) => {
    if (!loans || loans.length === 0) return;

    const data = loans.map((l) => ({
        'Loan ID': l.id,
        'Employee': l.employeeName,
        'Department': l.departmentName,
        'Loan Type': l.loanType,
        'Amount': l.totalLoanAmount,
        'Monthly': l.monthlyDeduction,
        'Remaining': l.remainingBalance,
        'Status': l.status,
        'Applied Date': l.appliedDate.split('T')[0],
        'Start Date': l.startDate?.split('T')[0] || '-',
        'Purpose': l.purpose,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
        { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
        { wch: 12 }, { wch: 12 }, { wch: 30 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Loans');
    XLSX.writeFile(wb, `Loans_${new Date().toLocaleDateString()}.xlsx`);
};