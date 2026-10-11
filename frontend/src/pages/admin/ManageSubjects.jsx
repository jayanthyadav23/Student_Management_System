import React, { useState, useEffect } from 'react';
import { subjectApi } from '../../api/subjectApi';
import { departmentApi } from '../../api/departmentApi';
import { facultyApi } from '../../api/facultyApi';
import { courseApi } from '../../api/courseApi';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import {
  Layers,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  UserCheck,
  BookOpen,
  Archive,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, subject: null });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form state
  const initialFormState = {
    code: '',
    name: '',
    credits: 3,
    type: 'THEORY',
    departmentId: '',
    courseId: '',
    facultyId: '',
    semester: 1,
  };
  const [formData, setFormData] = useState(initialFormState);
  const [assignFacultyId, setAssignFacultyId] = useState('');

  const { showSuccess, showError } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [subsRes, deptsRes, facRes, coursesRes] = await Promise.all([
        subjectApi.getAll({
          search: search || undefined,
          departmentId: selectedDept || undefined,
          semester: selectedSem || undefined,
        }),
        departmentApi.getAllDropdown(),
        facultyApi.getAllDropdown(),
        courseApi.getAllDropdown(),
      ]);

      if (subsRes.success) setSubjects(subsRes.data || []);
      if (deptsRes.success) setDepartments(deptsRes.data || []);
      if (facRes.success) setFacultyList(facRes.data || []);
      if (coursesRes.success) setCoursesList(coursesRes.data || []);
    } catch (err) {
      showError(err.message || 'Failed to load subjects data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDept, selectedSem]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenCreate = () => {
    setSelectedSubject(null);
    setFormData({
      ...initialFormState,
      departmentId: departments[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (subject) => {
    setSelectedSubject(subject);
    setFormData({
      code: subject.code,
      name: subject.name,
      credits: subject.credits,
      type: subject.type || 'THEORY',
      departmentId: subject.departmentId,
      courseId: subject.courseId || '',
      facultyId: subject.facultyId || '',
      semester: subject.semester,
    });
    setIsModalOpen(true);
  };

  const handleOpenAssign = (subject) => {
    setSelectedSubject(subject);
    setAssignFacultyId(subject.facultyId || '');
    setIsAssignModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const payload = {
        ...formData,
        departmentId: Number(formData.departmentId),
        courseId: formData.courseId ? Number(formData.courseId) : null,
        facultyId: formData.facultyId ? Number(formData.facultyId) : null,
        credits: Number(formData.credits),
        semester: Number(formData.semester),
      };

      if (selectedSubject) {
        const res = await subjectApi.update(selectedSubject.id, payload);
        if (res.success) {
          showSuccess(`Subject ${payload.code} updated successfully`);
          setIsModalOpen(false);
          loadData();
        }
      } else {
        const res = await subjectApi.create(payload);
        if (res.success) {
          showSuccess(`Subject ${payload.code} created successfully`);
          setIsModalOpen(false);
          loadData();
        }
      }
    } catch (err) {
      showError(err.message || 'Failed to save subject');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAssignFaculty = async (e) => {
    e.preventDefault();
    if (!selectedSubject) return;
    setFormSubmitting(true);
    try {
      const res = await subjectApi.assignFaculty(
        selectedSubject.id,
        assignFacultyId ? Number(assignFacultyId) : null
      );
      if (res.success) {
        showSuccess('Faculty assigned to subject successfully');
        setIsAssignModalOpen(false);
        loadData();
      }
    } catch (err) {
      showError(err.message || 'Failed to assign faculty');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (subject) => {
    try {
      const res = await subjectApi.toggleStatus(subject.id);
      if (res.success) {
        showSuccess(`Subject ${subject.code} status updated`);
        loadData();
      }
    } catch (err) {
      showError(err.message || 'Failed to update status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.subject) return;
    try {
      await subjectApi.delete(deleteDialog.subject.id);
      showSuccess(`Subject ${deleteDialog.subject.code} removed successfully`);
      setDeleteDialog({ isOpen: false, subject: null });
      loadData();
    } catch (err) {
      showError(err.message || 'Failed to delete subject');
    }
  };

  const columns = [
    {
      header: 'Subject Code',
      accessor: 'code',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
            {row.code}
          </span>
          {row.status === 'ARCHIVED' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase">
              Archived
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Subject Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-sm block">{row.name}</span>
          <span className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
            <span className="font-medium">{row.credits} Credits</span>
            <span>•</span>
            <span className="uppercase text-[11px] font-semibold text-slate-600">{row.type}</span>
          </span>
        </div>
      ),
    },
    {
      header: 'Department & Sem',
      accessor: 'departmentName',
      render: (row) => (
        <div>
          <span className="text-xs font-semibold text-slate-700 block">{row.departmentName}</span>
          <span className="text-[11px] text-slate-500">Semester {row.semester}</span>
        </div>
      ),
    },
    {
      header: 'Parent Course',
      accessor: 'courseTitle',
      render: (row) => (
        row.courseCode ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-semibold">{row.courseCode}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">Independent</span>
        )
      ),
    },
    {
      header: 'Assigned Faculty',
      accessor: 'facultyName',
      render: (row) => (
        row.facultyId ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            {row.facultyName}
          </span>
        ) : (
          <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
            Unassigned
          </span>
        )
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => handleOpenAssign(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Assign Faculty"
          >
            <UserCheck className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            title={row.status === 'ARCHIVED' ? 'Restore Subject' : 'Archive Subject'}
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Edit Subject"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteDialog({ isOpen: true, subject: row })}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Delete Subject"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            Curriculum Architecture
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Academic Subject Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create subjects, link them to academic courses, assign faculty instructors, and structure semester syllabi.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code or title..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedSem}
            onChange={(e) => setSelectedSem(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>

          <button
            onClick={loadData}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Loading academic subjects..." size="lg" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={subjects}
          emptyMessage="No subjects found matching the criteria."
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSubject ? 'Edit Subject' : 'Create Academic Subject'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subject Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. CS201"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Credits (1 - 10) *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Subject Title *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Data Structures & Algorithms"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Department *
              </label>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
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
                Semester *
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Instruction Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="THEORY">Theory Lecture</option>
                <option value="PRACTICAL">Practical / Lab</option>
                <option value="ELECTIVE">Elective Course</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Parent Course Program (Optional)
              </label>
              <select
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None (Independent Subject)</option>
                {coursesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assigned Faculty (Optional)
            </label>
            <select
              value={formData.facultyId}
              onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Unassigned</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.designation})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              {formSubmitting ? 'Saving...' : selectedSubject ? 'Save Changes' : 'Create Subject'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Faculty Assignment Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Instructor to ${selectedSubject?.code}`}
      >
        <form onSubmit={handleAssignFaculty} className="space-y-4">
          <p className="text-xs text-slate-500">
            Select the designated academic instructor responsible for teaching and grading for{' '}
            <span className="font-semibold text-slate-800">{selectedSubject?.name}</span>.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Faculty Instructor
            </label>
            <select
              value={assignFacultyId}
              onChange={(e) => setAssignFacultyId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">No Instructor (Unassigned)</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} - {f.designation} ({f.departmentName})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              {formSubmitting ? 'Updating...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Academic Subject"
        message={`Are you sure you want to delete subject "${deleteDialog.subject?.code} - ${deleteDialog.subject?.name}"? This action is permanent.`}
        confirmText="Delete Subject"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ isOpen: false, subject: null })}
      />
    </div>
  );
};

export default ManageSubjects;
