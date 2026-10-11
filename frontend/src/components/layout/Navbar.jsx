import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Menu } from 'lucide-react';

const roleBadgeClasses = {
  ADMIN: 'bg-rose-100 text-rose-700 border-rose-200',
  FACULTY: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  STUDENT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Mobile hamburger & title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-indigo-600/20">
              E
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-lg hidden sm:inline">
              Edu<span className="text-indigo-600">Manage</span>
            </span>
          </div>
        </div>

        {/* Right: User status & Logout */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-3 pr-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {user.name}
                </span>
                <span className="text-[11px] text-slate-500">{user.email}</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                  roleBadgeClasses[user.role] || 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {user.role}
              </span>
            </div>
          )}

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-100 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
