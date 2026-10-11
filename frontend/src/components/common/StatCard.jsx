import React from 'react';

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = 'indigo',
  subtext = null,
}) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50 text-indigo-600',
      border: 'border-indigo-100',
      badge: 'text-indigo-600 bg-indigo-50/50',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
      badge: 'text-emerald-600 bg-emerald-50/50',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
      badge: 'text-amber-600 bg-amber-50/50',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600',
      border: 'border-rose-100',
      badge: 'text-rose-600 bg-rose-50/50',
    },
    blue: {
      bg: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100',
      badge: 'text-blue-600 bg-blue-50/50',
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {title}
          </p>
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </p>
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${scheme.bg}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {subtext && (
        <div className="mt-3 text-xs font-medium text-slate-500 flex items-center gap-1">
          {subtext}
        </div>
      )}
    </div>
  );
};

export default StatCard;
