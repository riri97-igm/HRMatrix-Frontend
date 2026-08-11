import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { CountryPolicy } from '../../types';
import { payrollApi } from '../../services/api';

interface SettingsState {
  selectedCountry: CountryPolicy | null;
  countries: CountryPolicy[];
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  selectedCountry: null,
  countries: [],
  loading: false,
  error: null,
};

export const fetchCountries = createAsyncThunk(
  'settings/fetchCountries',
  async (_, { rejectWithValue }) => {
    try {
      const response = await payrollApi.get('/api/countrypolicy');
      return response.data as CountryPolicy[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch countries'
      );
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSelectedCountry: (state, action: PayloadAction<CountryPolicy>) => {
      state.selectedCountry = action.payload;
      localStorage.setItem('hr_country', JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCountries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCountries.fulfilled, (state, action) => {
        state.loading = false;
        state.countries = action.payload;
        const stored = localStorage.getItem('hr_country');
        if (stored) {
          state.selectedCountry = JSON.parse(stored);
        } else if (action.payload.length > 0) {
          state.selectedCountry = action.payload[0];
          localStorage.setItem('hr_country', JSON.stringify(action.payload[0]));
        }
      })
      .addCase(fetchCountries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedCountry } = settingsSlice.actions;
export default settingsSlice.reducer;