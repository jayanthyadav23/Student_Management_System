import React, { useState, useEffect, useCallback } from 'react';
import { announcementApi } from '../../api/announcementApi';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import {
  Megaphone,
  Pin,
  Plus,
  Edit2,
  Trash2,
  Users,
  Calendar,
  CheckCircle,
  Filter,
} from 'lucide-react';

const ManageAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetFilter, setTargetFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetAudience: 'ALL',
    pinned: false,
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showSuccess, showError } = useToast();

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (targetFilter) params.target = targetFilter;
      const res = await announcementApi.getAll(params);
      if (res.success && res.data) {
        setAnnouncements(res.data);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch announcements.');
    } finally {
      setLoading(false);
    }
  }, [targetFilter, showError]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleOpenAdd = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      targetAudience: 'ALL',
      pinned: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingAnnouncement(item);
    setFormData({
      title: item.title,
      content: item.content,
      targetAudience: item.targetAudience || 'ALL',
      pinned: item.pinned || false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      showError('Title and message content are required.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingAnnouncement) {
        await announcementApi.update(editingAnnouncement.id, formData);
        showSuccess('Announcement updated successfully.');
      } else {
        await announcementApi.create(formData);
        showSuccess('Announcement broadcasted successfully.');
      }
      setIsModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to post announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (id) => {
    try {
      await announcementApi.togglePin(id);
      showSuccess('Announcement pin status toggled.');
      fetchAnnouncements();
    } catch (err) {
      showError('Failed to change pin status.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await announcementApi.delete(deleteTarget.id);
      showSuccess('Announcement removed.');
      setDeleteTarget(null);
      fetchAnnouncements();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete announcement.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-2">
            <Megaphone className="w-3.5 h-3.5" />
            Campus Broadcasts
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Announcements & Notices
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Broadcast institutional notices, schedule changes, and alerts to students and faculty.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Announcement
        </button>
      </div>

      {/* Target Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            Audience:
          </div>
          {['', 'ALL', 'STUDENTS', 'FACULTY'].map((aud) => (
            <button
              key={aud}
              onClick={() => setTargetFilter(aud)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                targetFilter === aud
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {aud === '' ? 'All Notices' : aud}
            </button>
          ))}
        </div>
        <div className="text-slate-400 font-medium">
          {announcements.length} notice{announcements.length === 1 ? '' : 's'} found
        </div>
      </div>

      {/* Cards Feed */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Loading campus announcements..." size="md" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Announcements Active</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click "Create Announcement" to post institutional notices to students and faculty.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-5 transition-all shadow-sm hover:shadow-md flex flex-col justify-between ${
                item.pinned
                  ? 'border-amber-300 bg-gradient-to-br from-amber-50/30 to-white'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
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
                        Pinned
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePin(item.id)}
                      className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        item.pinned
                          ? 'text-amber-600 hover:bg-amber-100'
                          : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100'
                      }`}
                      title={item.pinned ? 'Unpin Notice' : 'Pin to Top'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                      title="Edit Notice"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-1 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-400" />
                  By {item.postedBy || 'Administration'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAnnouncement ? 'Edit Announcement' : 'New Campus Broadcast'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notice Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. End Semester Exam Timetable Released"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Audience <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="ALL">Everyone (All Students & Faculty)</option>
              <option value="STUDENTS">Students Only</option>
              <option value="FACULTY">Faculty Members Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Broadcast Message Content <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Provide detailed information regarding schedules, venues, deadlines..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pinnedCheck"
              checked={formData.pinned}
              onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="pinnedCheck" className="text-xs font-semibold text-slate-700 select-none">
              Pin notice to the top of notice boards
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm disabled:opacity-60"
            >
              {submitting ? 'Publishing...' : editingAnnouncement ? 'Update Notice' : 'Broadcast Notice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Remove Announcement"
        message={`Are you sure you want to delete the notice "${deleteTarget?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ManageAnnouncements;
