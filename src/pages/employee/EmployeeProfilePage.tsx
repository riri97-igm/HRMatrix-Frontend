import { useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { fetchMyProfile } from '../../store/slices/employeeSlice';
import { User, Mail, Phone, Building2, Calendar } from 'lucide-react';

const EmployeeProfilePage = () => {
  const dispatch = useAppDispatch();
  const { selectedEmployee, loading } = useAppSelector((state) => state.employee);

  useEffect(() => {
    dispatch(fetchMyProfile());
  }, [dispatch]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  if (!selectedEmployee) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Profile not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
        <p className="text-gray-500 text-sm">Your personal information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        {/* Banner */}
        <div className="bg-indigo-600 h-24" />

        {/* Avatar + Name */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center text-indigo-600 font-bold text-3xl border-4 border-white">
              {selectedEmployee.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="mb-2">
              <h3 className="text-xl font-bold text-gray-800">
                {selectedEmployee.fullName}
              </h3>
              <p className="text-gray-500 text-sm">{selectedEmployee.position}</p>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedEmployee.isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
              }`}
          >
            {selectedEmployee.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Personal Information
          </h3>
          <div className="space-y-4">
            <InfoRow
              icon={<User size={16} className="text-indigo-500" />}
              label="Full Name"
              value={selectedEmployee.fullName}
            />
            <InfoRow
              icon={<Mail size={16} className="text-indigo-500" />}
              label="Email"
              value={selectedEmployee.email}
            />
            <InfoRow
              icon={<Phone size={16} className="text-indigo-500" />}
              label="Phone"
              value={selectedEmployee.phone || 'Not provided'}
            />
          </div>
        </div>

        {/* Work Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Work Information
          </h3>
          <div className="space-y-4">
            <InfoRow
              icon={<Building2 size={16} className="text-indigo-500" />}
              label="Department"
              value={selectedEmployee.departmentName}
            />
            <InfoRow
              icon={<User size={16} className="text-indigo-500" />}
              label="Position"
              value={selectedEmployee.position}
            />
            <InfoRow
              icon={<Calendar size={16} className="text-indigo-500" />}
              label="Join Date"
              value={selectedEmployee.joinDate.split('T')[0]}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-700">{value}</p>
    </div>
  </div>
);

export default EmployeeProfilePage;