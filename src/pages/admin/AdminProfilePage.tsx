import { useEffect, useState } from 'react';
import Layout from '../../components/layout/Layout';
import { useAppSelector } from '../../hooks/useAppSelector';
import { identityApi } from '../../services/api';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const AdminProfilePage = () => {
    const { user } = useAppSelector((state) => state.auth);
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setMsg('New passwords do not match.');
            setIsError(true);
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            setMsg('Password must be at least 6 characters.');
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

    return (
        <Layout>
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
                <p className="text-gray-500 text-sm">View and manage your account</p>
            </div>

            {msg && (
                <div className={`px-4 py-3 rounded-lg mb-4 text-sm font-medium ${isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                    }`}>
                    {msg}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Info */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {/* Banner */}
                    <div className="bg-indigo-600 h-24" />
                    <div className="px-6 pb-6">
                        <div className="flex items-end gap-4 -mt-10 mb-6">
                            <div className="w-20 h-20 bg-white rounded-2xl shadow-md flex items-center justify-center text-indigo-600 font-bold text-3xl border-4 border-white">
                                {user?.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="mb-2">
                                <h3 className="text-xl font-bold text-gray-800">{user?.fullName}</h3>
                                <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                    {user?.role}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                    <User size={16} className="text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Full Name</p>
                                    <p className="text-sm font-medium text-gray-700">{user?.fullName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                    <Mail size={16} className="text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Email</p>
                                    <p className="text-sm font-medium text-gray-700">{user?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                    <Lock size={16} className="text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Role</p>
                                    <p className="text-sm font-medium text-gray-700">{user?.role}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Change Password */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Change Password
                    </h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Current Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showOld ? 'text' : 'password'}
                                    required
                                    value={passwordForm.oldPassword}
                                    onChange={(e) =>
                                        setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
                                    }
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOld(!showOld)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                    {showOld ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    required
                                    value={passwordForm.newPassword}
                                    onChange={(e) =>
                                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                                    }
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    required
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) =>
                                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                                    }
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                >
                                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Password strength */}
                        {passwordForm.newPassword && (
                            <div>
                                <div className="flex gap-1 mb-1">
                                    {[1, 2, 3, 4].map((level) => (
                                        <div
                                            key={level}
                                            className={`h-1 flex-1 rounded-full ${passwordForm.newPassword.length >= level * 3
                                                    ? level <= 1
                                                        ? 'bg-red-400'
                                                        : level <= 2
                                                            ? 'bg-yellow-400'
                                                            : level <= 3
                                                                ? 'bg-blue-400'
                                                                : 'bg-green-400'
                                                    : 'bg-gray-200'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400">
                                    {passwordForm.newPassword.length < 4
                                        ? 'Too short'
                                        : passwordForm.newPassword.length < 7
                                            ? 'Weak'
                                            : passwordForm.newPassword.length < 10
                                                ? 'Good'
                                                : 'Strong'}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-semibold transition"
                        >
                            Change Password
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
};

export default AdminProfilePage;
