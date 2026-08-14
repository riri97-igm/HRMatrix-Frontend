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
  userId: number;
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
  status: string;
  resignationDate?: string;
  remarks?: string;
  address?: string;
  birthday?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
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
  departmentName: string;
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
  departmentName: string;
  managerId?: number;
  loanType: string;
  requestedAmount: number;
  totalLoanAmount: number;
  monthlyDeduction: number;
  remainingBalance: number;
  repaymentMonths: number;
  purpose: string;
  status: string;
  isSettled: boolean;
  appliedDate: string;
  startDate?: string;
  settledDate?: string;
  hrApprovedByName: string;
  hrApprovedAt?: string;
  hrComment: string;
  managerApprovedByName: string;
  managerApprovedAt?: string;
  managerComment: string;
  cfoApprovedByName: string;
  cfoApprovedAt?: string;
  cfoComment: string;
  rejectedByName: string;
  rejectionReason: string;
  rejectedAt?: string;
  notes: string;
}
export interface TaxBracket {
  id: number;
  country: string;
  minIncome: number;
  maxIncome: number;
  taxRate: number;
  description: string;
}

export interface AgeBracket {
  id: number;
  countryCode: string;
  minAge: number;
  maxAge: number;
  employeeRate: number;
  employerRate: number;
  description: string;
}

export interface CountryPolicy {
  id: number;
  countryCode: string;
  countryName: string;
  currency: string;
  flagEmoji: string;
  socialContributionLabel: string;
  socialContributionEmployeeRate: number;
  socialContributionEmployerRate: number;
  hasProgressiveTax: boolean;
  hasAgeBased: boolean;
  isActive: boolean;
  taxBrackets: TaxBracket[];
  ageBrackets: AgeBracket[];
}