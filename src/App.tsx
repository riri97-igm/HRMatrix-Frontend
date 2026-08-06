import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppSelector } from './hooks/useAppSelector';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeListPage from './pages/admin/EmployeeListPage';
import AdminLeavePage from './pages/admin/AdminLeavePage';
import AdminPayrollPage from './pages/admin/AdminPayrollPage';
import AdminLoansPage from './pages/admin/AdminLoansPage';

// Manager
import ManagerDashboard from './pages/manager/ManagerDashboard';
import ManagerLeavePage from './pages/manager/ManagerLeavePage';

// Employee
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeProfilePage from './pages/employee/EmployeeProfilePage';
import EmployeeLeavePage from './pages/employee/EmployeeLeavePage';
import EmployeePayslipsPage from './pages/employee/EmployeePayslipsPage';
import EmployeeLoansPage from './pages/employee/EmployeeLoansPage';

// Protected Route
const ProtectedRoute = ({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) => {
  const { user } = useAppSelector((state) => state.auth);
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" />;
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute roles={['Admin']}>
              <EmployeeListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/leaves"
          element={
            <ProtectedRoute roles={['Admin']}>
              <AdminLeavePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payroll"
          element={
            <ProtectedRoute roles={['Admin']}>
              <AdminPayrollPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/loans"
          element={
            <ProtectedRoute roles={['Admin']}>
              <AdminLoansPage />
            </ProtectedRoute>
          }
        />

        {/* Manager Routes */}
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute roles={['Manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/leaves"
          element={
            <ProtectedRoute roles={['Manager', 'Admin']}>
              <ManagerLeavePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/team"
          element={
            <ProtectedRoute roles={['Manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Employee Routes */}
        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute roles={['Employee']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/profile"
          element={
            <ProtectedRoute roles={['Employee']}>
              <EmployeeProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/leave"
          element={
            <ProtectedRoute roles={['Employee']}>
              <EmployeeLeavePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/payslips"
          element={
            <ProtectedRoute roles={['Employee']}>
              <EmployeePayslipsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/loans"
          element={
            <ProtectedRoute roles={['Employee']}>
              <EmployeeLoansPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <AppRoutes />
    </Provider>
  );
};

export default App;