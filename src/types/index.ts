export type Role = 'Admin' | 'Manager' | 'Employee';

export interface AuthUser {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: Role;
}

export interface Employee {
  id: number;
  employeeId: number;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  departmentName: string;
  departmentId: number;
  managerId: number | null;
  baseSalary: number;
  joinDate: string;
  isActive: boolean;
}

export interface Department {
  id: number;
  name: string;
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewComment?: string;
  createdAt: string;
}

export interface LeaveBalance {
  year: number;
  annualEntitlement: number;
  carryForward: number;
  totalAnnualAvailable: number;
  annualUsed: number;
  annualRemaining: number;
  medicalTotal: number;
  medicalUsed: number;
  medicalRemaining: number;
  serviceYears: number;
}

export interface Payslip {
  id: number;
  employeeId: number;
  employeeName: string;
  month: number;
  year: number;
  country: string;
  basicSalary: number;
  allowance: number;
  overtimePay: number;
  yearEndBonus: number;
  thirteenthMonth: number;
  grossSalary: number;
  taxDeduction: number;
  socialSecurity: number;
  cpfEmployee: number;
  cpfEmployer: number;
  loanDeduction: number;
  otherDeduction: number;
  totalDeduction: number;
  netSalary: number;
  notes: string;
  generatedAt: string;
}

export interface Loan {
  id: number;
  employeeId: number;
  employeeName: string;
  totalLoanAmount: number;
  monthlyDeduction: number;
  remainingBalance: number;
  isSettled: boolean;
  startDate: string;
  settledDate?: string;
  notes: string;
}