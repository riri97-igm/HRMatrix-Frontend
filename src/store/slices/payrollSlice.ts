import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Payslip, Loan } from '../../types';
import { payrollApi } from '../../services/api';

interface PayrollState {
  payslips: Payslip[];
  recentPayslips: Payslip[];
  loans: Loan[];
  loading: boolean;
  error: string | null;
}

const initialState: PayrollState = {
  payslips: [],
  recentPayslips: [],
  loans: [],
  loading: false,
  error: null,
};

// Generate payslip (Admin)
export const generatePayslip = createAsyncThunk(
  'payroll/generate',
  async (data: object, { rejectWithValue }) => {
    try {
      const response = await payrollApi.post('/api/payroll', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to generate payslip'
      );
    }
  }
);

// Fetch my payslips (Employee)
export const fetchMyPayslips = createAsyncThunk(
  'payroll/fetchMyPayslips',
  async (_, { rejectWithValue }) => {
    try {
      const response = await payrollApi.get('/api/payroll/my');
      return response.data as Payslip[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch payslips'
      );
    }
  }
);

// Fetch last 3 months payslips (Employee)
export const fetchRecentPayslips = createAsyncThunk(
  'payroll/fetchRecent',
  async (_, { rejectWithValue }) => {
    try {
      const response = await payrollApi.get('/api/payroll/my/recent');
      return response.data as Payslip[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch recent payslips'
      );
    }
  }
);

// Fetch all payslips (Admin)
export const fetchAllPayslips = createAsyncThunk(
  'payroll/fetchAll',
  async (
    { year, month }: { year?: number; month?: number },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      if (month) params.append('month', month.toString());
      const response = await payrollApi.get(`/api/payroll/all?${params.toString()}`);
      return response.data as Payslip[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch all payslips'
      );
    }
  }
);

// Create loan (Admin)
export const createLoan = createAsyncThunk(
  'payroll/createLoan',
  async (data: object, { rejectWithValue }) => {
    try {
      const response = await payrollApi.post('/api/loan', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create loan'
      );
    }
  }
);

// Fetch my loans (Employee)
export const fetchMyLoans = createAsyncThunk(
  'payroll/fetchMyLoans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await payrollApi.get('/api/loan/my');
      return response.data as Loan[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch loans'
      );
    }
  }
);

// Fetch all loans (Admin)
export const fetchAllLoans = createAsyncThunk(
  'payroll/fetchAllLoans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await payrollApi.get('/api/loan/all');
      return response.data as Loan[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch all loans'
      );
    }
  }
);
// Apply for loan (Employee)
export const applyLoan = createAsyncThunk(
  'payroll/applyLoan',
  async (data: object, { rejectWithValue }) => {
    try {
      const response = await payrollApi.post('/api/loan/apply', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to apply for loan'
      );
    }
  }
);

// Fetch pending HR loans
export const fetchPendingHRLoans = createAsyncThunk(
  'payroll/fetchPendingHR',
  async (_, { rejectWithValue }) => {
    try {
      const response = await payrollApi.get('/api/loan/pending-hr');
      return response.data as Loan[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch pending loans'
      );
    }
  }
);

// Fetch pending manager loans
export const fetchPendingManagerLoans = createAsyncThunk(
  'payroll/fetchPendingManager',
  async (_, { rejectWithValue }) => {
    try {
      const response = await payrollApi.get('/api/loan/pending-manager');
      return response.data as Loan[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch pending loans'
      );
    }
  }
);

// Fetch pending CFO loans
export const fetchPendingCFOLoans = createAsyncThunk(
  'payroll/fetchPendingCFO',
  async (_, { rejectWithValue }) => {
    try {
      const response = await payrollApi.get('/api/loan/pending-cfo');
      return response.data as Loan[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch pending loans'
      );
    }
  }
);

// HR approve loan
export const hrApproveLoan = createAsyncThunk(
  'payroll/hrApprove',
  async ({ id, comment }: { id: number; comment: string }, { rejectWithValue }) => {
    try {
      const response = await payrollApi.put(`/api/loan/${id}/hr-approve`, { comment });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to approve loan'
      );
    }
  }
);

// Manager approve loan
export const managerApproveLoan = createAsyncThunk(
  'payroll/managerApprove',
  async ({ id, comment }: { id: number; comment: string }, { rejectWithValue }) => {
    try {
      const response = await payrollApi.put(`/api/loan/${id}/manager-approve`, { comment });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to approve loan'
      );
    }
  }
);

// CFO approve loan
export const cfoApproveLoan = createAsyncThunk(
  'payroll/cfoApprove',
  async ({ id, comment }: { id: number; comment: string }, { rejectWithValue }) => {
    try {
      const response = await payrollApi.put(`/api/loan/${id}/cfo-approve`, { comment });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to approve loan'
      );
    }
  }
);

// Reject loan
export const rejectLoan = createAsyncThunk(
  'payroll/rejectLoan',
  async ({ id, reason }: { id: number; reason: string }, { rejectWithValue }) => {
    try {
      const response = await payrollApi.put(`/api/loan/${id}/reject`, { reason });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to reject loan'
      );
    }
  }
);
// Fetch loans by employee ID (Admin)
export const fetchLoansByEmployee = createAsyncThunk(
  'payroll/fetchLoansByEmployee',
  async (employeeId: number, { rejectWithValue }) => {
    try {
      const response = await payrollApi.get(`/api/loan/employee/${employeeId}`);
      return response.data as Loan[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch employee loans'
      );
    }
  }
);

// Settle loan (Admin)
export const settleLoan = createAsyncThunk(
  'payroll/settleLoan',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await payrollApi.put(`/api/loan/${id}/settle`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to settle loan'
      );
    }
  }
);

const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch my payslips
      .addCase(fetchMyPayslips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyPayslips.fulfilled, (state, action) => {
        state.loading = false;
        state.payslips = action.payload;
      })
      .addCase(fetchMyPayslips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch recent payslips
      .addCase(fetchRecentPayslips.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRecentPayslips.fulfilled, (state, action) => {
        state.loading = false;
        state.recentPayslips = action.payload;
      })
      .addCase(fetchRecentPayslips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch all payslips
      .addCase(fetchAllPayslips.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllPayslips.fulfilled, (state, action) => {
        state.loading = false;
        state.payslips = action.payload;
      })
      .addCase(fetchAllPayslips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch my loans
      .addCase(fetchMyLoans.fulfilled, (state, action) => {
        state.loans = action.payload;
      })

      // Fetch Loan by Employee
      .addCase(fetchLoansByEmployee.fulfilled, (state, action) => {
        state.loans = action.payload;
      })

      // Fetch all loans
      .addCase(fetchAllLoans.fulfilled, (state, action) => {
        state.loans = action.payload;
      });

  },
});

export const { clearError } = payrollSlice.actions;
export default payrollSlice.reducer;