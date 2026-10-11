import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GraduationCap, Lock, Mail, Eye, EyeOff, ArrowRight, UserPlus, HelpCircle, X, ShieldAlert } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { showError, showSuccess, showInfo } = useToast();
  const navigate = useNavigate();

  // Load remembered email and check for session expiration query param
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('sms_remembered_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }

    if (searchParams.get('expired') === 'true') {
      setErrorBanner('Your session has expired. Please sign in again.');
      showInfo('Session expired. Please sign in again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorBanner('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorBanner('Please enter both email address and password.');
      showError('Please enter both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const userData = await login(trimmedEmail, password);

      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('sms_remembered_email', trimmedEmail);
      } else {
        localStorage.removeItem('sms_remembered_email');
      }

      showSuccess(`Welcome back, ${userData.name || userData.email}!`);

      if (userData.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (userData.role === 'FACULTY') {
        navigate('/faculty', { replace: true });
      } else if (userData.role === 'STUDENT') {
        navigate('/student', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      const msg = err.message || err.raw?.message || 'Invalid email or password. Please check your credentials.';
      setErrorBanner(msg);
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 mb-4 ring-8 ring-indigo-500/10">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Edu<span className="text-indigo-400">Manage</span> SMS
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise Student Management Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-white">Sign In</h2>
            <Link
              to="/register"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </Link>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Enter your credentials to access your academic portal.
          </p>

          {/* Error Banner */}
          {errorBanner && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300 animate-fadeIn">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorBanner}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                />
                <span>Remember email</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Link to Registration */}
          <div className="mt-5 pt-4 border-t border-slate-700/60 text-center">
            <p className="text-xs text-slate-400 mb-2.5">
              Don't have an account? Register as:
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <Link
                to="/register?role=STUDENT"
                className="py-2 px-2 bg-indigo-600/15 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-xl border border-indigo-500/30 text-center font-semibold transition-all hover:shadow-md hover:shadow-indigo-500/20"
              >
                🎓 Student
              </Link>
              <Link
                to="/register?role=FACULTY"
                className="py-2 px-2 bg-purple-600/15 hover:bg-purple-600 text-purple-300 hover:text-white rounded-xl border border-purple-500/30 text-center font-semibold transition-all hover:shadow-md hover:shadow-purple-500/20"
              >
                👨‍🏫 Faculty
              </Link>
              <Link
                to="/register?role=ADMIN"
                className="py-2 px-2 bg-emerald-600/15 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl border border-emerald-500/30 text-center font-semibold transition-all hover:shadow-md hover:shadow-emerald-500/20"
              >
                🛡️ Admin
              </Link>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Protected by JWT stateless authentication & Spring Security
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Password Recovery</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              For security compliance, user password resets are managed directly by institutional administrators.
            </p>
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 text-xs text-slate-400 space-y-1 mb-5">
              <p>• <strong>Students & Faculty:</strong> Contact your system admin or department head.</p>
              <p>• <strong>Administrators:</strong> Reset passwords anytime from the Admin Users management panel or contact IT support.</p>
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition-colors"
            >
              Got it, Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
