import React, { useState, useEffect, useCallback } from 'react';
import { timetableApi } from '../../api/timetableApi';
import { departmentApi } from '../../api/departmentApi';
import { subjectApi } from '../../api/subjectApi';
import { facultyApi } from '../../api/facultyApi';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import {
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Building2,
  User,
  MapPin,
  BookOpen,
  Filter,
} from 'lucide-react';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const ManageTimetable = () => {
  const [entries, setEntries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem] = useState('');
  const [filterDay, setFilterDay] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    departmentId: '',
    semester: 1,
    subjectId: '',
    facultyId: '',
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '10:00',
    roomNumber: 'Room 101',
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { showSuccess, showError } = useToast();

  const loadDropdowns = async () => {
    try {
      const [deptRes, subRes, facRes] = await Promise.all([
        departmentApi.getAllDropdown(),
        subjectApi.getAll(),
        facultyApi.getAllDropdown(),
      ]);
      if (deptRes.success && deptRes.data) setDepartments(deptRes.data);
      if (subRes.success && subRes.data) setSubjects(subRes.data);
      if (facRes.success && facRes.data) setFacultyList(facRes.data);
    } catch {
      // Dropdown load fallback
    }
  };

  const fetchTimetable = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterDept) params.departmentId = filterDept;
      if (filterSem) params.semester = filterSem;
      if (filterDay) params.dayOfWeek = filterDay;

      const res = await timetableApi.getAll(params);
      if (res.success && res.data) {
        setEntries(res.data);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load timetable entries.');
    } finally {
      setLoading(false);
    }
  }, [filterDept, filterSem, filterDay, showError]);

  useEffect(() => {
    loadDropdowns();
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const handleOpenAdd = () => {
    setEditingEntry(null);
    setFormData({
      departmentId: departments[0]?.id || '',
      semester: 1,
      subjectId: subjects[0]?.id || '',
      facultyId: facultyList[0]?.id || '',
      dayOfWeek: 'MONDAY',
      startTime: '09:00',
      endTime: '10:00',
      roomNumber: 'Room 101',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      departmentId: entry.departmentId || '',
      semester: entry.semester || 1,
      subjectId: entry.subjectId || '',
      facultyId: entry.facultyId || '',
      dayOfWeek: entry.dayOfWeek || 'MONDAY',
      startTime: entry.startTime || '09:00',
      endTime: entry.endTime || '10:00',
      roomNumber: entry.roomNumber || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.departmentId || !formData.subjectId) {
      showError('Please select both Department and Subject.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        departmentId: Number(formData.departmentId),
        semester: Number(formData.semester),
        subjectId: Number(formData.subjectId),
        facultyId: formData.facultyId ? Number(formData.facultyId) : null,
        dayOfWeek: formData.dayOfWeek,
        startTime: formData.startTime,
        endTime: formData.endTime,
        roomNumber: formData.roomNumber.trim(),
      };

      if (editingEntry) {
        await timetableApi.update(editingEntry.id, payload);
        showSuccess('Timetable slot updated successfully.');
      } else {
        await timetableApi.create(payload);
        showSuccess('Timetable slot scheduled successfully.');
      }
      setIsModalOpen(false);
      fetchTimetable();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save timetable slot.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await timetableApi.delete(deleteTarget.id);
      showSuccess('Timetable slot removed.');
      setDeleteTarget(null);
      fetchTimetable();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete slot.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <Calendar className="w-3.5 h-3.5" />
            Class Scheduling
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Academic Timetable
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure lecture slots, faculty room assignments, and weekly class schedules.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Schedule Class Slot
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
          <Filter className="w-3.5 h-3.5" />
          Filters:
        </div>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>
        <select
          value={filterSem}
          onChange={(e) => setFilterSem(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
        >
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </select>
        <select
          value={filterDay}
          onChange={(e) => setFilterDay(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
        >
          <option value="">All Days</option>
          {DAYS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {(filterDept || filterSem || filterDay) && (
          <button
            onClick={() => {
              setFilterDept('');
              setFilterSem('');
              setFilterDay('');
            }}
            className="text-indigo-600 hover:text-indigo-800 font-semibold underline ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Timetable Schedule Cards / Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Loading timetable schedules..." size="md" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Timetable Slots Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No schedule matches the current filters. Click "Schedule Class Slot" to add a new slot.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4">Time Window</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Department & Sem</th>
                  <th className="py-3 px-4">Venue</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono text-[11px]">
                        {entry.dayOfWeek}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{entry.startTime} - {entry.endTime}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{entry.subjectName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{entry.subjectCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      {entry.facultyName ? (
                        <div className="flex items-center gap-1 text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{entry.facultyName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{entry.departmentName}</div>
                      <div className="text-[10px] text-indigo-600 font-semibold">Sem {entry.semester}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1 text-slate-700 font-medium bg-slate-100 px-2 py-0.5 rounded">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        {entry.roomNumber || 'TBA'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(entry)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit Slot"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(entry)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEntry ? 'Edit Timetable Slot' : 'Schedule Timetable Slot'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Day of Week <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                required
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Room / Venue <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="e.g. Hall A-101"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Start Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                End Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Semester (1 - 8) <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                required
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
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Subject <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name} ({s.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Instructor / Faculty Member
            </label>
            <select
              value={formData.facultyId}
              onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Faculty (Optional)</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.departmentCode || f.designation})
                </option>
              ))}
            </select>
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
              {submitting ? 'Saving...' : editingEntry ? 'Update Slot' : 'Schedule Slot'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Remove Timetable Slot"
        message={`Are you sure you want to remove the slot for ${deleteTarget?.subjectName} on ${deleteTarget?.dayOfWeek}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ManageTimetable;
