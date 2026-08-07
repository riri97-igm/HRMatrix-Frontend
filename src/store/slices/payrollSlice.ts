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
      const response = await api.get('/api/payroll/my');
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
      const response = await api.get('/api/payroll/my/recent');
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
      const response = await api.get(`/api/payroll/all?${params.toString()}`);
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
      const response = await api.post('/api/loan', data);
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
      const response = await api.get('/api/loan/my');
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
      const response = await api.get('/api/loan/all');
      return response.data as Loan[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch all loans'
      );
    }
  }
);

// Settle loan (Admin)
export const settleLoan = createAsyncThunk(
  'payroll/settleLoan',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/loan/${id}/settle`);
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

      // Fetch all loans
      .addCase(fetchAllLoans.fulfilled, (state, action) => {
        state.loans = action.payload;
      });
  },
});

export const { clearError } = payrollSlice.actions;
export default payrollSlice.reducer;