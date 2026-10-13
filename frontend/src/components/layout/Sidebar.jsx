import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Users2,
  BookOpen,
  Layers,
  Calendar,
  Megaphone,
  GraduationCap,
  CalendarCheck,
  Award,
  BarChart3,
  X,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { role } = useAuth();

  const getNavItems = () => {
    if (role === 'ADMIN') {
      return [
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/departments', label: 'Departments', icon: Building2 },
        { to: '/admin/faculty', label: 'Faculty', icon: Users2 },
        { to: '/admin/courses', label: 'Courses', icon: BookOpen },
        { to: '/admin/subjects', label: 'Subjects', icon: Layers },
        { to: '/admin/timetable', label: 'Timetable', icon: Calendar },
        { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
        { to: '/admin/students', label: 'Students', icon: GraduationCap },
        { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
      ];
    } else if (role === 'FACULTY') {
      return [
        { to: '/faculty', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/faculty/students', label: 'Students', icon: GraduationCap },
        { to: '/faculty/timetable', label: 'Timetable', icon: Calendar },
        { to: '/faculty/announcements', label: 'Announcements', icon: Megaphone },
        { to: '/faculty/attendance', label: 'Attendance', icon: CalendarCheck },
        { to: '/faculty/marks', label: 'Marks Entry', icon: Award },
        { to: '/faculty/reports', label: 'Reports', icon: BarChart3 },
      ];
    } else if (role === 'STUDENT') {
      return [
        { to: '/student', label: 'My Dashboard', icon: LayoutDashboard },
        { to: '/student/timetable', label: 'My Timetable', icon: Calendar },
        { to: '/student/announcements', label: 'Announcements', icon: Megaphone },
        { to: '/student/attendance', label: 'My Attendance', icon: CalendarCheck },
        { to: '/student/results', label: 'My Results', icon: Award },
      ];
    }
    return [];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 p-5 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand for mobile view */}
        <div className="flex items-center justify-between pb-6 mb-2 border-b border-slate-100 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-indigo-600/20">
              E
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-lg">
              Edu<span className="text-indigo-600">Manage</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {role ? `${role} Portal` : 'Navigation'}
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin' || item.to === '/faculty' || item.to === '/student'}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center font-medium">
          EduManage SMS v1.0.0
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
