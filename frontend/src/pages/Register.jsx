import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/authApi';
import {
  GraduationCap,
  User,
  Mail,
  Hash,
  BookOpen,
  Layers,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Briefcase,
  Award,
} from 'lucide-react';

const Register = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleParam = searchParams.get('role')?.toUpperCase();
  const [selectedRole, setSelectedRole] = useState(
    ['STUDENT', 'FACULTY', 'ADMIN'].includes(roleParam) ? roleParam : 'STUDENT'
  );

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    departmentId: '',
    semester: '1',
    age: '19',
    designation: 'Assistant Professor',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientErrors, setClientErrors] = useState({});

  const { register } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // Keep state synced if URL role query changes
  useEffect(() => {
    const r = searchParams.get('role')?.toUpperCase();
    if (['STUDENT', 'FACULTY', 'ADMIN'].includes(r)) {
      setSelectedRole(r);
    }
  }, [searchParams]);

  // Fetch departments for dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepts(true);
        const res = await authApi.getPublicDepartments();
        if (res.success && Array.isArray(res.data)) {
          setDepartments(res.data);
          if (res.data.length > 0) {
            setFormData((prev) => ({ ...prev, departmentId: res.data[0].id.toString() }));
          }
        }
      } catch (err) {
        console.error('Failed to load departments', err);
        showError('Could not load department list. Please try again later.');
      } finally {
        setLoadingDepts(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setSearchParams({ role });
    setClientErrors({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (clientErrors[name]) {
      setClientErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (selectedRole === 'STUDENT') {
      if (!formData.rollNumber.trim() || formData.rollNumber.trim().length < 2) {
        errors.rollNumber = 'Student roll number is required (min 2 characters).';
      }

      if (!formData.departmentId) {
        errors.departmentId = 'Please select your academic department.';
      }

      const sem = parseInt(formData.semester, 10);
      if (!sem || sem < 1 || sem > 12) {
        errors.semester = 'Semester must be between 1 and 12.';
      }

      const ageNum = parseInt(formData.age, 10);
      if (!ageNum || ageNum < 16 || ageNum > 100) {
        errors.age = 'Age must be between 16 and 100.';
      }
    } else if (selectedRole === 'FACULTY') {
      if (!formData.departmentId) {
        errors.departmentId = 'Please select your academic department.';
      }
      if (!formData.designation) {
        errors.designation = 'Please select your academic designation.';
      }
    }

    if (!formData.password || formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!formData.agreeTerms) {
      errors.agreeTerms = 'You must agree to the institutional terms & conditions.';
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showError('Please correct the highlighted errors before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        role: selectedRole,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      if (selectedRole === 'STUDENT') {
        payload.rollNumber = formData.rollNumber.trim().toUpperCase();
        payload.departmentId = formData.departmentId ? parseInt(formData.departmentId, 10) : null;
        payload.semester = formData.semester ? parseInt(formData.semester, 10) : 1;
        payload.age = formData.age ? parseInt(formData.age, 10) : 19;
      } else if (selectedRole === 'FACULTY') {
        payload.departmentId = formData.departmentId ? parseInt(formData.departmentId, 10) : null;
        payload.designation = formData.designation ? formData.designation.trim() : 'Assistant Professor';
      }

      const userData = await register(payload);
      showSuccess(`Welcome, ${userData.name || 'User'}! Your ${selectedRole.toLowerCase()} account has been registered.`);

      if (userData.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (userData.role === 'FACULTY') {
        navigate('/faculty', { replace: true });
      } else {
        navigate('/student', { replace: true });
      }
    } catch (err) {
      const msg = err.message || err.raw?.message || 'Registration failed. Please check your details.';
      showError(msg);
      if (err.fieldErrors) {
        setClientErrors(err.fieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 py-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-xl z-10">
        {/* Brand header */}
        <div className="text-center mb-6">
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 mb-3 ring-8 ring-indigo-500/10 transition-transform hover:scale-105"
          >
            <GraduationCap className="w-8 h-8" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Edu<span className="text-indigo-400">Manage</span> Registration
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create your account to access your institutional portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Role Selector Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 text-center">
              Select Your Account Type
            </label>
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-700/70">
              <button
                type="button"
                onClick={() => handleRoleSelect('STUDENT')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  selectedRole === 'STUDENT'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('FACULTY')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  selectedRole === 'FACULTY'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Faculty</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('ADMIN')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  selectedRole === 'ADMIN'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Role Information Banner */}
          <div
            className={`mb-6 p-3 rounded-xl flex items-start gap-2.5 text-xs border transition-colors ${
              selectedRole === 'STUDENT'
                ? 'bg-indigo-950/40 border-indigo-800/40 text-indigo-300'
                : selectedRole === 'FACULTY'
                ? 'bg-purple-950/40 border-purple-800/40 text-purple-300'
                : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {selectedRole === 'STUDENT' &&
                'Registering as Student: Access your enrolled courses, view academic marks, check attendance, and track progress.'}
              {selectedRole === 'FACULTY' &&
                'Registering as Faculty: Access your assigned classes, grade examinations, manage student attendance, and generate course reports.'}
              {selectedRole === 'ADMIN' &&
                'Registering as Administrator: Gain institutional control to manage academic departments, instructors, students, and course catalogs.'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common Row 1: Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={
                      selectedRole === 'FACULTY'
                        ? 'Dr. Alan Turing'
                        : selectedRole === 'ADMIN'
                        ? 'Admin Jane'
                        : 'Ada Lovelace'
                    }
                    required
                    className={`w-full pl-10 pr-4 py-2 bg-slate-900/60 border ${
                      clientErrors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                  />
                </div>
                {clientErrors.name && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {clientErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={
                      selectedRole === 'FACULTY'
                        ? 'faculty@university.edu'
                        : selectedRole === 'ADMIN'
                        ? 'admin@university.edu'
                        : 'student@university.edu'
                    }
                    required
                    className={`w-full pl-10 pr-4 py-2 bg-slate-900/60 border ${
                      clientErrors.email ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                  />
                </div>
                {clientErrors.email && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {clientErrors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Student Specific Fields */}
            {selectedRole === 'STUDENT' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Roll Number <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Hash className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="rollNumber"
                        value={formData.rollNumber}
                        onChange={handleChange}
                        placeholder="CS2026001"
                        required
                        className={`w-full pl-10 pr-4 py-2 bg-slate-900/60 border ${
                          clientErrors.rollNumber ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                        } rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase transition-all`}
                      />
                    </div>
                    {clientErrors.rollNumber && (
                      <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {clientErrors.rollNumber}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Department <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <select
                        name="departmentId"
                        value={formData.departmentId}
                        onChange={handleChange}
                        disabled={loadingDepts}
                        required
                        className={`w-full pl-10 pr-4 py-2 bg-slate-900/60 border ${
                          clientErrors.departmentId ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                        } rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50`}
                      >
                        {loadingDepts ? (
                          <option value="">Loading departments...</option>
                        ) : departments.length === 0 ? (
                          <option value="">No departments available</option>
                        ) : (
                          departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name} ({dept.code})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    {clientErrors.departmentId && (
                      <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {clientErrors.departmentId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Semester <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Layers className="w-4 h-4" />
                      </div>
                      <select
                        name="semester"
                        value={formData.semester}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Semester {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Age
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <input
                        type="number"
                        name="age"
                        min="16"
                        max="100"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="19"
                        className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Faculty Specific Fields */}
            {selectedRole === 'FACULTY' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Department <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleChange}
                      disabled={loadingDepts}
                      required
                      className={`w-full pl-10 pr-4 py-2 bg-slate-900/60 border ${
                        clientErrors.departmentId ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                      } rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-50`}
                    >
                      {loadingDepts ? (
                        <option value="">Loading departments...</option>
                      ) : departments.length === 0 ? (
                        <option value="">No departments available</option>
                      ) : (
                        departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name} ({dept.code})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  {clientErrors.departmentId && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {clientErrors.departmentId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Designation <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Award className="w-4 h-4" />
                    </div>
                    <select
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    >
                      <option value="Professor">Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Lecturer">Lecturer</option>
                      <option value="Visiting Faculty">Visiting Faculty</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Specific Notice */}
            {selectedRole === 'ADMIN' && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  Administrator accounts have unrestricted institutional access to manage all departments, users, faculty, students, courses, and analytical reports.
                </span>
              </div>
            )}

            {/* Common: Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className={`w-full pl-10 pr-10 py-2 bg-slate-900/60 border ${
                      clientErrors.password ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {clientErrors.password && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {clientErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className={`w-full pl-10 pr-10 py-2 bg-slate-900/60 border ${
                      clientErrors.confirmPassword ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {clientErrors.confirmPassword && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {clientErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                />
                <span>
                  I agree to university academic integrity rules and privacy terms. <span className="text-rose-400">*</span>
                </span>
              </label>
              {clientErrors.agreeTerms && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {clientErrors.agreeTerms}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full mt-4 py-3 px-4 font-semibold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group text-white ${
                selectedRole === 'STUDENT'
                  ? 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-indigo-600/30'
                  : selectedRole === 'FACULTY'
                  ? 'bg-purple-600 hover:bg-purple-500 active:bg-purple-700 shadow-purple-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-600/30'
              }`}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>
                    Creating {selectedRole === 'STUDENT' ? 'Student' : selectedRole === 'FACULTY' ? 'Faculty' : 'Admin'} Account...
                  </span>
                </div>
              ) : (
                <>
                  <span>
                    Complete {selectedRole === 'STUDENT' ? 'Student' : selectedRole === 'FACULTY' ? 'Faculty' : 'Administrator'} Registration
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Link back to Sign In */}
          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Sign In here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
