import axios from 'axios';

// Service URLs
export const IDENTITY_URL = 'http://localhost:5001';
export const EMPLOYEE_URL = 'http://localhost:5002';
export const LEAVE_URL = 'http://localhost:5003';
export const PAYROLL_URL = 'http://localhost:5004';

// Create axios instance per service
const createApi = (baseURL: string) => {
  const instance = axios.create({ baseURL });

  instance.interceptors.request.use((config) => {
    const stored = localStorage.getItem('hr_user');
    if (stored) {
      const user = JSON.parse(stored);
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('hr_user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export const identityApi = createApi(IDENTITY_URL);
export const employeeApi = createApi(EMPLOYEE_URL);
export const leaveApi = createApi(LEAVE_URL);
export const payrollApi = createApi(PAYROLL_URL);

// Default export for backward compatibility
export default identityApi;