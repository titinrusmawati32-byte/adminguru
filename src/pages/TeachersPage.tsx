import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  GraduationCap,
  KeyRound,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserCheck,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { ActiveTab } from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { auditService } from '../services/auditService';
import { authService } from '../services/authService';
import { classService } from '../services/classService';
import { reportService } from '../services/reportService';
import { scheduleService } from '../services/scheduleService';
import { subjectService } from '../services/subjectService';
import { Schedule, SchoolClass, Subject, UserProfile } from '../types';

interface TeachersPageProps {
  onSelectTab?: (tab: ActiveTab) => void;
}

export const TeachersPage: React.FC<TeachersPageProps> = ({ onSelectTab }) => {
  const { profile } = useAuth();
  const { showToast } = useNotification();

  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'homeroom' | 'subject'>('all');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<UserProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    nip: '',
    phone: '',
    email: '',
    assignedClasses: [] as string[],
    assignedSubjects: [] as string[],
    isHomeroom: false,
    homeroomClass: '',
    status: 'active' as 'active' | 'inactive',
  });

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<UserProfile | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tch, cls, sub, sch] = await Promise.all([
        authService.getAllTeachers(true),
        classService.getAll(),
        subjectService.getAll(),
        scheduleService.getAll(),
      ]);
      setTeachers(tch);
      setClasses(cls);
      setSubjects(sub);
      setSchedules(sch);
    } catch (err: any) {
      showToast('Gagal memuat data guru: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchSearch =
        t.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.nip && t.nip.includes(searchTerm)) ||
        (t.email && t.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && t.status === 'active') ||
        (statusFilter === 'inactive' && t.status === 'inactive');

      const matchRole =
        roleFilter === 'all' ||
        (roleFilter === 'homeroom' && t.isHomeroom) ||
        (roleFilter === 'subject' && !t.isHomeroom);

      return matchSearch && matchStatus && matchRole;
    });
  }, [teachers, searchTerm, statusFilter, roleFilter]);

  // Statistics
  const totalGuru = teachers.length;
  const activeCount = teachers.filter((t) => t.status === 'active').length;
  const homeroomCount = teachers.filter((t) => t.isHomeroom).length;

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      username: '',
      displayName: '',
      nip: '',
      phone: '',
      email: '',
      assignedClasses: [],
      assignedSubjects: [],
      isHomeroom: false,
      homeroomClass: classes[0]?.name || '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: UserProfile) => {
    setEditingTeacher(t);
    setFormData({
      username: t.username,
      displayName: t.displayName,
      nip: t.nip || '',
      phone: t.phone || '',
      email: t.email || '',
      assignedClasses: t.assignedClasses || [],
      assignedSubjects: t.assignedSubjects || [],
      isHomeroom: Boolean(t.isHomeroom),
      homeroomClass: t.homeroomClass || classes[0]?.name || '',
      status: t.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleToggleClass = (className: string) => {
    setFormData((prev) => {
      const exists = prev.assignedClasses.includes(className);
      return {
        ...prev,
        assignedClasses: exists
          ? prev.assignedClasses.filter((c) => c !== className)
          : [...prev.assignedClasses, className],
      };
    });
  };

  const handleToggleSubject = (subjectName: string) => {
    setFormData((prev) => {
      const exists = prev.assignedSubjects.includes(subjectName);
      return {
        ...prev,
        assignedSubjects: exists
          ? prev.assignedSubjects.filter((s) => s !== subjectName)
          : [...prev.assignedSubjects, subjectName],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.displayName.trim()) {
      showToast('Nama lengkap guru wajib diisi.', 'warning');
      return;
    }
    if (!formData.username.trim()) {
      showToast('Username akun login wajib diisi.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (editingTeacher) {
        await authService.updateUserProfile(editingTeacher.uid, {
          displayName: formData.displayName.trim(),
          nip: formData.nip.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          assignedClasses: formData.assignedClasses,
          assignedSubjects: formData.assignedSubjects,
          isHomeroom: formData.isHomeroom,
          homeroomClass: formData.isHomeroom ? formData.homeroomClass : '',
          status: formData.status,
        });

        await auditService.log(
          'UPDATE_TEACHER',
          'users',
          editingTeacher.uid,
          `Mengupdate profil & penugasan guru ${formData.displayName}`
        );
        showToast('Data guru & penugasan berhasil diperbarui!', 'success');
      } else {
        const created = await authService.createTeacherAccount({
          username: formData.username.trim(),
          displayName: formData.displayName.trim(),
          nip: formData.nip.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          assignedClasses: formData.assignedClasses,
          assignedSubjects: formData.assignedSubjects,
          isHomeroom: formData.isHomeroom,
          homeroomClass: formData.isHomeroom ? formData.homeroomClass : '',
        });

        await auditService.log(
          'CREATE_TEACHER',
          'users',
          created.uid,
          `Mendaftarkan akun guru baru: ${created.displayName}`
        );
        showToast('Akun guru baru berhasil ditambahkan!', 'success');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast('Gagal menyimpan guru: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (teacher: UserProfile) => {
    const nextStatus = teacher.status === 'active' ? 'inactive' : 'active';
    try {
      await authService.toggleTeacherStatus(teacher.uid, nextStatus);
      setTeachers((prev) =>
        prev.map((t) => (t.uid === teacher.uid ? { ...t, status: nextStatus } : t))
      );
      showToast(
        `Akun ${teacher.displayName} berhasil ${nextStatus === 'active' ? 'diaktifkan' : 'dinonaktifkan'}`,
        'info'
      );
    } catch (err: any) {
      showToast('Gagal mengubah status: ' + err.message, 'error');
    }
  };

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    try {
      await authService.deleteTeacher(teacherToDelete.uid);
      await auditService.log(
        'DELETE_TEACHER',
        'users',
        teacherToDelete.uid,
        `Menghapus akun guru: ${teacherToDelete.displayName}`
      );
      showToast(`Akun ${teacherToDelete.displayName} berhasil dihapus`, 'info');
      setIsDeleteOpen(false);
      setTeacherToDelete(null);
      loadData();
    } catch (err: any) {
      showToast('Gagal menghapus akun: ' + err.message, 'error');
    }
  };

  const handleExportPDF = () => {
    const headers = ['No', 'Nama Guru', 'NIP', 'Username', 'Wali Kelas', 'Rombel Diampu', 'Mapel Diampu', 'Status'];
    const rows = filteredTeachers.map((t, i) => [
      i + 1,
      t.displayName,
      t.nip || '-',
      t.username,
      t.isHomeroom ? t.homeroomClass || 'Ya' : 'Bukan',
      (t.assignedClasses || []).join(', ') || '-',
      (t.assignedSubjects || []).join(', ') || '-',
      t.status === 'active' ? 'Aktif' : 'Nonaktif',
    ]);

    reportService.exportToPDF(headers, rows, {
      title: 'DAFTAR PENUGASAN GURU & AKUN AKADEMIK',
      orientation: 'landscape',
    });
    showToast('Rekap Penugasan Guru (PDF) berhasil diunduh!', 'success');
  };

  const handleExportExcel = () => {
    const headers = ['No', 'Nama Guru', 'NIP', 'Username', 'Email', 'No Telepon', 'Wali Kelas', 'Rombel Diampu', 'Mapel Diampu', 'Status'];
    const rows = filteredTeachers.map((t, i) => [
      i + 1,
      t.displayName,
      t.nip || '-',
      t.username,
      t.email || '-',
      t.phone || '-',
      t.isHomeroom ? t.homeroomClass || 'Ya' : 'Bukan',
      (t.assignedClasses || []).join(', ') || '-',
      (t.assignedSubjects || []).join(', ') || '-',
      t.status === 'active' ? 'Aktif' : 'Nonaktif',
    ]);

    reportService.exportToExcel(headers, rows, {
      title: 'Data_Penugasan_Guru',
    });
    showToast('Rekap Penugasan Guru (Excel) berhasil diekspor!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 border border-blue-500/20 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <UserCog className="w-3.5 h-3.5" />
              <span>Manajemen Akun & Penugasan Guru</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Kelola Guru, Penugasan Kelas & Mata Pelajaran
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Admin bertugas mengelola akun akses guru, menentukan wali kelas, penugasan mata pelajaran per rombel, serta memantau status operasional guru di sekolah.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-2 border border-white/15 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor Excel</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Guru Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Total Akun Guru</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {totalGuru}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Terdaftar dalam Firestore</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Guru Aktif</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {activeCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Memiliki hak akses aktif</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Wali Kelas</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {homeroomCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Guru pembina rombel</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Jadwal Terdaftar</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2">
            {schedules.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Sesi mengajar mingguan</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari guru berdasarkan nama, NIP, username, atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="active">Status: Aktif</option>
            <option value="inactive">Status: Nonaktif</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">Semua Jabatan</option>
            <option value="homeroom">Wali Kelas</option>
            <option value="subject">Guru Mata Pelajaran</option>
          </select>

          <button
            onClick={loadData}
            title="Muat Ulang"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Teacher List */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
            <p className="text-xs">Memuat daftar akun guru dan penugasan...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Tidak Ada Guru Ditemukan"
            description="Tidak ada data guru yang cocok dengan filter pencarian atau belum ada akun guru yang didaftarkan."
            actionLabel="Tambah Guru Baru"
            onAction={handleOpenAdd}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="pb-3.5 font-semibold">Identitas Guru</th>
                  <th className="pb-3.5 font-semibold">Penugasan Wali Kelas</th>
                  <th className="pb-3.5 font-semibold">Kelas Diampu</th>
                  <th className="pb-3.5 font-semibold">Mata Pelajaran</th>
                  <th className="pb-3.5 font-semibold text-center">Status</th>
                  <th className="pb-3.5 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTeachers.map((teacher) => {
                  const teacherSchedules = schedules.filter(
                    (s) => s.teacherId === teacher.teacherId || s.teacherId === teacher.uid
                  );

                  return (
                    <tr
                      key={teacher.uid}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Identity */}
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                            {teacher.displayName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{teacher.displayName}</span>
                              {teacher.isHomeroom && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-extrabold border border-amber-300 dark:border-amber-800">
                                  Wali Kelas
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>NIP: {teacher.nip || '-'}</span>
                              <span>•</span>
                              <span className="font-mono text-blue-600 dark:text-blue-400">
                                @{teacher.username}
                              </span>
                            </div>
                            {teacher.email && (
                              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span>{teacher.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Homeroom */}
                      <td className="py-4">
                        {teacher.isHomeroom && teacher.homeroomClass ? (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[11px] border border-amber-200 dark:border-amber-800">
                            {teacher.homeroomClass}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Bukan Wali Kelas</span>
                        )}
                      </td>

                      {/* Assigned Classes */}
                      <td className="py-4">
                        {teacher.assignedClasses && teacher.assignedClasses.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {teacher.assignedClasses.map((c) => (
                              <span
                                key={c}
                                className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-semibold border border-blue-200/60 dark:border-blue-800/60"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum ditugaskan</span>
                        )}
                      </td>

                      {/* Assigned Subjects */}
                      <td className="py-4">
                        {teacher.assignedSubjects && teacher.assignedSubjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {teacher.assignedSubjects.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[10px] font-semibold border border-purple-200/60 dark:border-purple-800/60"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Belum ada mapel</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(teacher)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                            teacher.status === 'active'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
                          }`}
                          title="Klik untuk mengubah status akun"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              teacher.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{teacher.status === 'active' ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(teacher)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                            title="Edit Guru & Penugasan"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setTeacherToDelete(teacher);
                              setIsDeleteOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Hapus Akun Guru"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Teacher Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? 'Edit Akun Guru & Penugasan' : 'Tambah Akun Guru Baru'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Identity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap & Gelar <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Dra. Siti Rahmawati, M.Pd."
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Username Login <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: sitirahma"
                value={formData.username}
                disabled={Boolean(editingTeacher)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''),
                  })
                }
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Digunakan untuk login Guru ke aplikasi.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                NIP / NUPTK
              </label>
              <input
                type="text"
                placeholder="Contoh: 19850412 201001 2 021"
                value={formData.nip}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nomor WhatsApp / HP
              </label>
              <input
                type="text"
                placeholder="08123456789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Guru
              </label>
              <input
                type="email"
                placeholder="guru@sekolah.sch.id"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Penugasan Wali Kelas */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900 dark:text-amber-200">
              <input
                type="checkbox"
                checked={formData.isHomeroom}
                onChange={(e) => setFormData({ ...formData, isHomeroom: e.target.checked })}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Tugaskan sebagai Wali Kelas</span>
            </label>

            {formData.isHomeroom && (
              <div className="pt-1">
                <label className="block text-[11px] font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  Pilih Rombongan Belajar (Kelas Binaan):
                </label>
                <select
                  value={formData.homeroomClass}
                  onChange={(e) => setFormData({ ...formData, homeroomClass: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                >
                  {classes.map((cls) => (
                    <option key={cls.classId} value={cls.name}>
                      {cls.name} ({cls.academicYear})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Penugasan Rombel Kelas */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Penugasan Rombel Kelas (Mengajar di kelas mana saja):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-36 overflow-y-auto">
              {classes.map((cls) => {
                const checked = formData.assignedClasses.includes(cls.name);
                return (
                  <label
                    key={cls.classId}
                    className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-colors text-[11px] ${
                      checked
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleClass(cls.name)}
                      className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="truncate">{cls.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Penugasan Mata Pelajaran */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Penugasan Mata Pelajaran:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-36 overflow-y-auto">
              {subjects.map((sub) => {
                const checked = formData.assignedSubjects.includes(sub.name);
                return (
                  <label
                    key={sub.subjectId}
                    className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-colors text-[11px] ${
                      checked
                        ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleSubject(sub.name)}
                      className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="truncate">{sub.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status Akun
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="active">Aktif (Dapat Login & Melakukan Operasional)</option>
              <option value="inactive">Nonaktif (Akses Sementara Ditutup)</option>
            </select>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingTeacher ? 'Simpan Perubahan' : 'Tambahkan Guru'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteTeacher}
        title="Hapus Akun Guru"
        message={`Apakah Anda yakin ingin menghapus akun guru "${teacherToDelete?.displayName}"? Tindakan ini akan menghapus akses login guru tersebut.`}
        confirmLabel="Ya, Hapus Akun"
        isDestructive={true}
      />
    </div>
  );
};
