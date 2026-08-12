import {
  LayoutGrid,
  Users,
  ClipboardList,
  DollarSign,
  User,
  CheckSquare,
  Landmark,
  Globe,
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { logout } from '../../store/slices/authSlice';
import { fetchCountries, setSelectedCountry } from '../../store/slices/settingsSlice';
import type { CountryPolicy } from '../../types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutGrid size={18} /> },
  { label: 'Employees', path: '/admin/employees', icon: <Users size={18} /> },
  { label: 'Leave Requests', path: '/admin/leaves', icon: <ClipboardList size={18} /> },
  { label: 'Payroll', path: '/admin/payroll', icon: <DollarSign size={18} /> },
  { label: 'Loans', path: '/admin/loans', icon: <Landmark size={18} /> },
  { label: 'Country Policies', path: '/admin/countries', icon: <Globe size={18} /> },
];

const managerNav: NavItem[] = [
  { label: 'Dashboard', path: '/manager/dashboard', icon: <LayoutGrid size={18} /> },
  { label: 'My Team', path: '/manager/team', icon: <Users size={18} /> },
  { label: 'Leave Approvals', path: '/manager/leaves', icon: <CheckSquare size={18} /> },
];

const employeeNav: NavItem[] = [
  { label: 'Dashboard', path: '/employee/dashboard', icon: <LayoutGrid size={18} /> },
  { label: 'My Profile', path: '/employee/profile', icon: <User size={18} /> },
  { label: 'Apply Leave', path: '/employee/leave', icon: <ClipboardList size={18} /> },
  { label: 'My Payslips', path: '/employee/payslips', icon: <DollarSign size={18} /> },
  { label: 'My Loans', path: '/employee/loans', icon: <Landmark size={18} /> },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAppSelector((state) => state.auth);
  const { countries, selectedCountry } = useAppSelector(
    (state) => state.settings ?? { countries: [], selectedCountry: null }
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    dispatch(fetchCountries());
  }, [dispatch]);

  const navItems =
    user?.role === 'Admin' ? adminNav :
      user?.role === 'Manager' ? managerNav :
        employeeNav;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = countries.find((c: CountryPolicy) => c.countryCode === e.target.value);
    if (country) dispatch(setSelectedCountry(country));
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <LayoutGrid className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">HRMatrix</h1>
            <p className="text-xs text-gray-400">HR Management</p>
          </div>
        </div>

        {/* Role Badge */}
        <div className="px-6 py-3">
          <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            {user?.role}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pb-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 text-sm transition-colors duration-150
                ${location.pathname === item.path
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Country Selector */}
        <div className="px-4 py-3 border-t border-gray-700">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Globe size={12} /> Country / Payroll Policy
          </p>
          <select
            value={selectedCountry?.countryCode || ''}
            onChange={handleCountryChange}
            className="w-full bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select Country</option>
            {countries.map((c: CountryPolicy) => (
              <option key={c.countryCode} value={c.countryCode}>
                {c.flagEmoji} {c.countryName} ({c.currency})
              </option>
            ))}
          </select>
          {selectedCountry && (
            <div className="mt-2 text-xs text-gray-400 space-y-0.5">
              <p>💰 {selectedCountry.currency}</p>
              <p>🏦 {selectedCountry.socialContributionLabel} — Employee {selectedCountry.socialContributionEmployeeRate}%</p>
              {selectedCountry.hasProgressiveTax && <p>🏛️ Progressive Tax</p>}
              {selectedCountry.hasAgeBased && <p>👴 Age-based contribution</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700">
          <p className="text-sm text-gray-400 truncate mb-3">
            {user?.fullName}
          </p>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 rounded-lg transition duration-200"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;