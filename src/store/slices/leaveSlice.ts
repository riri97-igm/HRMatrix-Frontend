import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { LeaveRequest, LeaveBalance } from '../../types';
import { leaveApi } from '../../services/api';

interface LeaveState {
  leaves: LeaveRequest[];
  pendingLeaves: LeaveRequest[];
  balance: LeaveBalance | null;
  loading: boolean;
  error: string | null;
}

const initialState: LeaveState = {
  leaves: [],
  pendingLeaves: [],
  balance: null,
  loading: false,
  error: null,
};

// Apply for leave
export const applyLeave = createAsyncThunk(
  'leave/apply',
  async (data: object, { rejectWithValue }) => {
    try {
      const response = await leaveApi.post('/api/leave', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply leave');
    }
  }
);

// Fetch my leaves
export const fetchMyLeaves = createAsyncThunk(
  'leave/fetchMyLeaves',
  async (_, { rejectWithValue }) => {
    try {
      const response = await leaveApi.get('/api/leave/my');
      return response.data as LeaveRequest[];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leaves');
    }
  }
);

// Fetch leave balance
export const fetchLeaveBalance = createAsyncThunk(
  'leave/fetchBalance',
  async (joinDate: string, { rejectWithValue }) => {
    try {
      const response = await leaveApi.get(`/api/leave/balance?joinDate=${joinDate}`);
      return response.data as LeaveBalance;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch balance');
    }
  }
);

// Fetch pending leaves (Manager/Admin)
export const fetchPendingLeaves = createAsyncThunk(
  'leave/fetchPending',
  async (_, { rejectWithValue }) => {
    try {
      const response = await leaveApi.get('/api/leave/pending');
      return response.data as LeaveRequest[];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending leaves');
    }
  }
);

// Fetch all leaves (Admin)
export const fetchAllLeaves = createAsyncThunk(
  'leave/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await leaveApi.get('/api/leave/all');
      return response.data as LeaveRequest[];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch all leaves');
    }
  }
);

// Review leave (Manager/Admin)
export const reviewLeave = createAsyncThunk(
  'leave/review',
  async (
    { id, isApproved, comment }: { id: number; isApproved: boolean; comment?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await leaveApi.put(`/api/leave/${id}/review`, {
        isApproved,
        comment,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to review leave');
    }
  }
);

const leaveSlice = createSlice({
  name: 'leave',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch my leaves
      .addCase(fetchMyLeaves.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.leaves = action.payload;
      })
      .addCase(fetchMyLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch balance
      .addCase(fetchLeaveBalance.fulfilled, (state, action) => {
        state.balance = action.payload;
      })

      // Fetch pending
      .addCase(fetchPendingLeaves.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPendingLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingLeaves = action.payload;
      })
      .addCase(fetchPendingLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch all leaves
      .addCase(fetchAllLeaves.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.leaves = action.payload;
      })
      .addCase(fetchAllLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Review leave
      .addCase(reviewLeave.fulfilled, (state, action) => {
        state.loading = false;
      });
  },
});

export const { clearError } = leaveSlice.actions;
export default leaveSlice.reducer;