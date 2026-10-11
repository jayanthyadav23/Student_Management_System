import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
  info: <Info className="w-5 h-5 text-indigo-500 flex-shrink-0" />,
};

const borderClasses = {
  success: 'border-l-4 border-l-emerald-500 bg-white text-slate-800 shadow-lg shadow-emerald-500/5',
  error: 'border-l-4 border-l-rose-500 bg-white text-slate-800 shadow-lg shadow-rose-500/5',
  warning: 'border-l-4 border-l-amber-500 bg-white text-slate-800 shadow-lg shadow-amber-500/5',
  info: 'border-l-4 border-l-indigo-500 bg-white text-slate-800 shadow-lg shadow-indigo-500/5',
};

const Toast = ({ toast, onClose }) => {
  const { type, message } = toast;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border border-slate-100 ${borderClasses[type] || borderClasses.info} transition-all duration-300 animate-slideIn`}
      role="alert"
    >
      {icons[type] || icons.info}
      <div className="flex-1 text-sm font-medium leading-relaxed">{message}</div>
      <button
        onClick={onClose}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
