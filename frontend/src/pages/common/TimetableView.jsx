import React, { useState, useEffect } from 'react';
import { timetableApi } from '../../api/timetableApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  Filter,
} from 'lucide-react';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const TimetableView = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('');
  const { showError } = useToast();

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const params = {};
        if (selectedDay) params.dayOfWeek = selectedDay;
        const res = await timetableApi.getAll(params);
        if (res.success && res.data) {
          setEntries(res.data);
        }
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to load class schedule.');
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [selectedDay, showError]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
            <Calendar className="w-3.5 h-3.5" />
            Class Schedule
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Weekly Academic Timetable
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            View course lecture timings, lecture halls, and assigned faculty slots.
          </p>
        </div>
      </div>

      {/* Day Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setSelectedDay('')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedDay === ''
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Full Week
        </button>
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedDay === day
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Timetable Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Loading schedules..." size="md" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Classes Scheduled</h3>
          <p className="text-xs text-slate-500 mt-1">There are no classes found for the selected day filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] font-mono border border-indigo-100">
                    {entry.dayOfWeek}
                  </span>
                  <div className="flex items-center gap-1 text-slate-600 font-semibold text-xs">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{entry.startTime} - {entry.endTime}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {entry.subjectName}
                </h3>
                <div className="text-xs font-mono text-slate-400 mb-4">
                  Code: {entry.subjectCode} • Sem {entry.semester}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Faculty:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {entry.facultyName || 'TBA'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    Venue:
                  </span>
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {entry.roomNumber || 'Room TBA'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimetableView;
