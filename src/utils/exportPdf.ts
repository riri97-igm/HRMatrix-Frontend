import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Payslip } from '../types';

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

const fmt = (amount: number, country: string): string =>
    `${getCurrency(country)} ${amount.toLocaleString()}`;

export const exportPayslipPDF = (payslip: Payslip | null) => {
    if (!payslip) return;

    const doc = new jsPDF();
    const currency = getCurrency(payslip.country);
    const period = `${months[payslip.month - 1]} ${payslip.year}`;

    // Header
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('HRMatrix', 14, 18);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('HR Management System', 14, 26);
    doc.text(`Payslip — ${period}`, 14, 34);

    // Employee Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Information', 14, 52);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 54, 196, 54);

    const empInfo = [
        ['Employee Name', payslip.employeeName],
        ['Employee ID', String(payslip.employeeId).padStart(2, '0')],
        ['Department', payslip.departmentName || '-'],
        ['Country', payslip.country],
        ['Currency', currency],
        ['Pay Period', period],
    ];

    let y = 62;
    empInfo.forEach(([label, value]) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        doc.text(label + ':', 14, y);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 80, y);
        y += 7;
    });

    // Earnings Table
    y += 5;
    const earningsRows: string[][] = [];
    earningsRows.push(['Basic Salary', fmt(payslip.basicSalary, payslip.country)]);
    if (payslip.allowance > 0)
        earningsRows.push(['Allowance', fmt(payslip.allowance, payslip.country)]);
    if (payslip.overtimePay > 0)
        earningsRows.push(['Overtime Pay', fmt(payslip.overtimePay, payslip.country)]);
    if (payslip.yearEndBonus > 0)
        earningsRows.push(['Year End Bonus', fmt(payslip.yearEndBonus, payslip.country)]);
    if (payslip.thirteenthMonth > 0)
        earningsRows.push(['13th Month Pay', fmt(payslip.thirteenthMonth, payslip.country)]);
    earningsRows.push(['Gross Salary', fmt(payslip.grossSalary, payslip.country)]);

    autoTable(doc, {
        startY: y,
        head: [['Earnings', 'Amount']],
        body: earningsRows,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        columnStyles: { 1: { halign: 'right' } },
        styles: { fontSize: 10 },
    });

    // Deductions Table
    const deductionRows: string[][] = [];
    if (payslip.taxDeduction > 0)
        deductionRows.push(['Income Tax', fmt(payslip.taxDeduction, payslip.country)]);
    if (payslip.socialSecurity > 0)
        deductionRows.push(['Social Contribution', fmt(payslip.socialSecurity, payslip.country)]);
    if (payslip.cpfEmployee > 0)
        deductionRows.push(['CPF Employee', fmt(payslip.cpfEmployee, payslip.country)]);
    if (payslip.loanDeduction > 0)
        deductionRows.push(['Loan Deduction', fmt(payslip.loanDeduction, payslip.country)]);
    if (payslip.otherDeduction > 0)
        deductionRows.push(['Other Deduction', fmt(payslip.otherDeduction, payslip.country)]);
    deductionRows.push(['Total Deduction', fmt(payslip.totalDeduction, payslip.country)]);

    autoTable(doc, {
        head: [['Deductions', 'Amount']],
        body: deductionRows,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        columnStyles: { 1: { halign: 'right' } },
        styles: { fontSize: 10 },
    });

    // Net Salary
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(240, 253, 244);
    doc.rect(14, finalY, 182, 20, 'F');
    doc.setDrawColor(34, 197, 94);
    doc.rect(14, finalY, 182, 20, 'S');
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 128, 61);
    doc.text('NET SALARY (TAKE HOME)', 20, finalY + 8);
    doc.text(fmt(payslip.netSalary, payslip.country), 196, finalY + 8, { align: 'right' });

    // CPF note
    if (payslip.cpfEmployer > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text(
            `* Employer CPF: ${fmt(payslip.cpfEmployer, payslip.country)} (paid separately, not deducted)`,
            14, finalY + 30
        );
    }

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(
        `Generated by HRMatrix on ${new Date().toLocaleDateString()} — Computer generated payslip`,
        14, 285
    );

    doc.save(`Payslip_${payslip.employeeName}_${period}.pdf`);
};

export const exportPayslipListPDF = (payslips: Payslip[], period: string) => {
    if (!payslips || payslips.length === 0) return;

    const doc = new jsPDF('landscape');

    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 297, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('HRMatrix — Payroll Summary', 14, 14);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${period}`, 14, 24);

    const rows = payslips.map((p) => [
        String(p.employeeId).padStart(2, '0'),
        p.employeeName,
        p.departmentName || '-',
        p.country,
        p.grossSalary.toLocaleString(),
        p.totalDeduction.toLocaleString(),
        p.netSalary.toLocaleString(),
    ]);

    autoTable(doc, {
        startY: 38,
        head: [['ID', 'Employee', 'Department', 'Country', 'Gross', 'Deductions', 'Net Salary']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: 255 },
        columnStyles: {
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
        },
        styles: { fontSize: 9 },
    });

    doc.save(`Payroll_Summary_${period}.pdf`);
};