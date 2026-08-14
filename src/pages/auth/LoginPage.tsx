import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { loginAsync } from '../../store/slices/authSlice';
import { Mail, Lock, ArrowRight, Users, ClipboardList, DollarSign, Shield } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(loginAsync({ email, password }));
    if (!loginAsync.fulfilled.match(result)) return;
    const role = result.payload.role;
    if (role === 'Admin') navigate('/admin/dashboard');
    else if (role === 'Manager') navigate('/manager/dashboard');
    else navigate('/employee/dashboard');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex-col justify-between p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur p-2.5 rounded-xl">
            <div className="grid grid-cols-2 gap-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-2.5 h-2.5 bg-white rounded-sm" />
              ))}
            </div>
          </div>
          <span className="text-white text-2xl font-bold">HRMatrix</span>
        </div>

        {/* Center Content */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Manage your workforce<br />with confidence
          </h1>
          <p className="text-indigo-200 text-lg mb-10">
            A complete HR management system for modern teams.
          </p>

          {/* Feature List */}
          <div className="space-y-4">
            {[
              { icon: <Users size={20} />, label: 'Employee Management', desc: 'Track and manage your entire workforce' },
              { icon: <ClipboardList size={20} />, label: 'Leave & Attendance', desc: 'Streamline leave approvals and tracking' },
              { icon: <DollarSign size={20} />, label: 'Payroll Processing', desc: 'Automate payroll with multi-country support' },
              { icon: <Shield size={20} />, label: 'Audit & Compliance', desc: 'Full audit trail for every action' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-4">
                <div className="bg-white/20 p-2 rounded-lg text-white flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.label}</p>
                  <p className="text-indigo-300 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-indigo-300 text-sm">
          © 2026 HRMatrix. Built with .NET 8 & React.
        </p>
      </div>

      {/* Right Side — Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <div className="grid grid-cols-2 gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-white rounded-sm" />
                ))}
              </div>
            </div>
            <span className="text-gray-800 text-xl font-bold">HRMatrix</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-500">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white transition"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Role Info */}
          <div className="mt-8 p-4 bg-white rounded-xl border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Portal Access
            </p>
            <div className="space-y-2">
              {[
                { role: 'Admin', desc: 'Full system access', color: 'bg-indigo-100 text-indigo-700' },
                { role: 'Manager', desc: 'Team & approval access', color: 'bg-blue-100 text-blue-700' },
                { role: 'Employee', desc: 'Self-service access', color: 'bg-green-100 text-green-700' },
              ].map((r) => (
                <div key={r.role} className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.color}`}>
                    {r.role}
                  </span>
                  <span className="text-xs text-gray-400">{r.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            Contact your HR administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;