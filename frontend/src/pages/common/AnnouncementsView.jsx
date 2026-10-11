import React, { useState, useEffect } from 'react';
import { announcementApi } from '../../api/announcementApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import {
  Megaphone,
  Pin,
  Calendar,
  Users,
} from 'lucide-react';

const AnnouncementsView = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const res = await announcementApi.getAll();
        if (res.success && res.data) {
          setAnnouncements(res.data);
        }
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to fetch campus notices.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [showError]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-3 border border-amber-500/30">
            <Megaphone className="w-3.5 h-3.5" />
            Notice Board
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Campus Announcements
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Important notices, academic circulars, and event updates from administration.
          </p>
        </div>
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Loading notices..." size="md" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Announcements</h3>
          <p className="text-xs text-slate-500 mt-1">There are no notices posted at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all shadow-sm hover:shadow-md ${
                item.pinned
                  ? 'border-amber-300 bg-gradient-to-r from-amber-50/20 via-white to-white'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      item.targetAudience === 'STUDENTS'
                        ? 'bg-blue-100 text-blue-800'
                        : item.targetAudience === 'FACULTY'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {item.targetAudience}
                  </span>
                  {item.pinned && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                      <Pin className="w-3 h-3 fill-amber-700 text-amber-700" />
                      Pinned Notice
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {item.postedBy || 'Admin'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900 mb-2">
                {item.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsView;
