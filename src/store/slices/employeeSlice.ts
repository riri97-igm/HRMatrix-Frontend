import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Employee, Department } from '../../types';

interface EmployeeState {
  employees: Employee[];
  departments: Department[];
  selectedEmployee: Employee | null;
  loading: boolean;
  error: string | null;
}

const initialState: EmployeeState = {
  employees: [],
  departments: [],
  selectedEmployee: null,
  loading: false,
  error: null,
};

// Fetch all employees (Admin)
export const fetchEmployees = createAsyncThunk(
  'employee/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/employees');
      return response.data as Employee[];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch employees');
    }
  }
);

// Fetch team (Manager)
export const fetchTeam = createAsyncThunk(
  'employee/fetchTeam',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/employees/team');
      return response.data as Employee[];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch team');
    }
  }
);

// Fetch my profile (Employee)
export const fetchMyProfile = createAsyncThunk(
  'employee/fetchMyProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/employees/me');
      return response.data as Employee;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

// Fetch departments
export const fetchDepartments = createAsyncThunk(
  'employee/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/departments');
      return response.data as Department[];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch departments');
    }
  }
);

// Create employee
export const createEmployee = createAsyncThunk(
  'employee/create',
  async (data: object, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/employees', data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create employee');
    }
  }
);

// Update employee
export const updateEmployee = createAsyncThunk(
  'employee/update',
  async ({ id, data }: { id: number; data: object }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/employees/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update employee');
    }
  }
);

// Deactivate employee
export const deactivateEmployee = createAsyncThunk(
  'employee/deactivate',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/employees/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to deactivate employee');
    }
  }
);

const employeeSlice = createSlice({
  name: 'employee',
  initialState,
  reducers: {
    setSelectedEmployee: (state, action: PayloadAction<Employee | null>) => {
      state.selectedEmployee = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all employees
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch team
      .addCase(fetchTeam.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTeam.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(fetchTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch my profile
      .addCase(fetchMyProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedEmployee = action.payload;
      })
      .addCase(fetchMyProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch departments
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.departments = action.payload;
      });
  },
});

export const { setSelectedEmployee, clearError } = employeeSlice.actions;
export default employeeSlice.reducer;