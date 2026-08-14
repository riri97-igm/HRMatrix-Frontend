import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { fetchMyProfile } from '../../store/slices/employeeSlice';
import { identityApi, employeeApi } from '../../services/api';
import { User, Mail, Phone, Building2, Lock, Eye, EyeOff, Pencil, X, Calendar, MapPin, Heart, AlertCircle } from 'lucide-react';

const EmployeeProfilePage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { selectedEmployee } = useAppSelector((state) => state.employee);
  const dispatch = useAppDispatch();

  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'personal' | 'emergency' | 'password'>('profile');
  const [showEdit, setShowEdit] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [editForm, setEditForm] = useState({
    phone: '',
    address: '',
    birthday: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    dispatch(fetchMyProfile());
  }, [dispatch]);

  useEffect(() => {
    if (selectedEmployee) {
      setEditForm({
        phone: selectedEmployee.phone || '',
        address: selectedEmployee.address || '',
        birthday: selectedEmployee.birthday?.split('T')[0] || '',
        emergencyContactName: selectedEmployee.emergencyContactName || '',
        emergencyContactPhone: selectedEmployee.emergencyContactPhone || '',
        emergencyContactRelation: selectedEmployee.emergencyContactRelation || '',
      });
    }
  }, [selectedEmployee]);

  const handleUpdatePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await employeeApi.put('/api/employees/me/personal', {
        phone: editForm.phone,
        address: editForm.address,
        birthday: editForm.birthday || null,
        emergencyContactName: editForm.emergencyContactName,
        emergencyContactPhone: editForm.emergencyContactPhone,
        emergencyContactRelation: editForm.emergencyContactRelation,
      });
      setMsg('Personal info updated successfully!');
      setIsError(false);
      setShowEdit(false);
      dispatch(fetchMyProfile());
    } catch (error: any) {
      setMsg(error.response?.data?.message || 'Failed to update.');
      setIsError(true);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMsg('New passwords do not match.');
      setIsError(true);
      return;
    }
    try {
      await identityApi.put('/api/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setMsg('Password changed successfully!');
      setIsError(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setMsg(error.response?.data?.message || 'Failed to change password.');
      setIsError(true);
    }
  };

  const serviceYears = selectedEmployee?.joinDate
    ? Math.floor((new Date().getTime() - new Date(selectedEmployee.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : 0;

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
        <p className="text-gray-500 text-sm">Manage your personal information and account settings</p>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-lg mb-4 text-sm font-medium ${isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
          {msg}
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-green-500 to-teal-600 h-28" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center text-green-600 font-bold text-3xl border-4 border-white">
                {user?.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="mb-2">
                <h3 className="text-xl font-bold text-gray-800">{user?.fullName}</h3>
                <p className="text-gray-500 text-sm">{selectedEmployee?.position || '-'}</p>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  Employee
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-semibold px-3 py-2 rounded-lg transition mb-2"
            >
              <Pencil size={14} />
              Edit Profile
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm font-bold text-gray-800">{selectedEmployee?.departmentName || '-'}</p>
              <p className="text-xs text-gray-400">Department</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-800">{selectedEmployee?.joinDate?.split('T')[0] || '-'}</p>
              <p className="text-xs text-gray-400">Join Date</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-800">{serviceYears} year{serviceYears !== 1 ? 's' : ''}</p>
              <p className="text-xs text-gray-400">Service</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-800">
                {selectedEmployee?.isActive ? '🟢 Active' : '🔴 Inactive'}
              </p>
              <p className="text-xs text-gray-400">Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: 'profile', label: '👤 Work Info' },
          { key: 'personal', label: '📋 Personal Info' },
          { key: 'emergency', label: '🚨 Emergency Contact' },
          { key: 'password', label: '🔒 Change Password' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key as any); setMsg(''); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === tab.key
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Work Info Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Work Information</h3>
          <div className="grid grid-cols-2 gap-6">
            <InfoRow icon={<User size={16} />} label="Full Name" value={user?.fullName || '-'} />
            <InfoRow icon={<Mail size={16} />} label="Email" value={user?.email || '-'} />
            <InfoRow icon={<Building2 size={16} />} label="Department" value={selectedEmployee?.departmentName || '-'} />
            <InfoRow icon={<User size={16} />} label="Position" value={selectedEmployee?.position || '-'} />
            <InfoRow icon={<Calendar size={16} />} label="Join Date" value={selectedEmployee?.joinDate?.split('T')[0] || '-'} />
            <InfoRow icon={<Lock size={16} />} label="Employee ID" value={String(selectedEmployee?.id || '-').padStart(2, '0')} />
          </div>
        </div>
      )}

      {/* Personal Info Tab */}
      {activeTab === 'personal' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
          <div className="grid grid-cols-2 gap-6">
            <InfoRow icon={<Phone size={16} />} label="Phone Number" value={selectedEmployee?.phone || 'Not provided'} />
            <InfoRow icon={<Calendar size={16} />} label="Birthday" value={selectedEmployee?.birthday?.split('T')[0] || 'Not provided'} />
            <div className="col-span-2">
              <InfoRow icon={<MapPin size={16} />} label="Address" value={selectedEmployee?.address || 'Not provided'} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Click <strong>Edit Profile</strong> to update your personal information.
          </p>
        </div>
      )}

      {/* Emergency Contact Tab */}
      {activeTab === 'emergency' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Contact</h3>
          {!selectedEmployee?.emergencyContactName ? (
            <div className="text-center py-8">
              <AlertCircle size={40} className="mx-auto text-yellow-400 mb-3" />
              <p className="text-gray-500 font-medium">No emergency contact added</p>
              <p className="text-gray-400 text-sm mt-1">
                Please add an emergency contact for safety purposes.
              </p>
              <button
                onClick={() => setShowEdit(true)}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              >
                Add Emergency Contact
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              <InfoRow icon={<User size={16} />} label="Contact Name" value={selectedEmployee?.emergencyContactName || '-'} />
              <InfoRow icon={<Heart size={16} />} label="Relationship" value={selectedEmployee?.emergencyContactRelation || '-'} />
              <InfoRow icon={<Phone size={16} />} label="Contact Phone" value={selectedEmployee?.emergencyContactPhone || '-'} />
            </div>
          )}
        </div>
      )}

      {/* Change Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 max-w-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {[
              { label: 'Current Password', key: 'oldPassword', show: showOld, toggle: () => setShowOld(!showOld) },
              { label: 'New Password', key: 'newPassword', show: showNew, toggle: () => setShowNew(!showNew) },
              { label: 'Confirm New Password', key: 'confirmPassword', show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
            ].map(({ label, key, show, toggle }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    required
                    value={passwordForm[key as keyof typeof passwordForm]}
                    onChange={(e) => setPasswordForm({ ...passwordForm, [key]: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            ))}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition"
            >
              Change Password
            </button>
          </form>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Edit Personal Info</h3>
              <button onClick={() => setShowEdit(false)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleUpdatePersonal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Birthday</label>
                <input
                  type="date"
                  value={editForm.birthday}
                  onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide pt-2">
                Emergency Contact
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={editForm.emergencyContactName}
                  onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Relationship</label>
                  <select
                    value={editForm.emergencyContactRelation}
                    onChange={(e) => setEditForm({ ...editForm, emergencyContactRelation: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">Select</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={editForm.emergencyContactPhone}
                    onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

const InfoRow = ({ icon, label, value }: {
  icon: React.ReactNode; label: string; value: string;
}) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-700">{value}</p>
    </div>
  </div>
);

export default EmployeeProfilePage;