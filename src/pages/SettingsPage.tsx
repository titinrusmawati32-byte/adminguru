import {
  Bell,
  CheckCircle,
  Database,
  Download,
  GraduationCap,
  HardDriveDownload,
  HardDriveUpload,
  Paintbrush,
  RefreshCw,
  Send,
  Shield,
  Sliders,
  Sparkles,
  Upload,
  User,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { EditBannerModal } from '../components/dashboard/EditBannerModal';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import { backupService } from '../services/backupService';
import {
  bannerConfigService,
  DEFAULT_BANNER_CONFIG,
} from '../services/bannerConfigService';
import { seedService } from '../services/seedService';
import { BannerWallpaperConfig } from '../types';

export const SettingsPage: React.FC = () => {
  const { profile, role, isAdmin } = useAuth();
  const { showToast, sendBroadcast } = useNotification();
  const { mode, setMode } = useTheme();

  // Notification broadcast
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'info' | 'success' | 'warning'>('info');
  const [sendingNotif, setSendingNotif] = useState(false);

  // Backup / Restore
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  // School profile settings
  const [schoolName, setSchoolName] = useState('SD NEGERI HARAPAN BANGSA');
  const [academicYear, setAcademicYear] = useState('2024/2025');
  const [semester, setSemester] = useState('Ganjil');

  // Wallpaper / Banner AI settings
  const [bannerConfig, setBannerConfig] = useState<BannerWallpaperConfig>(() =>
    bannerConfigService.getLocalConfig()
  );
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  useEffect(() => {
    bannerConfigService.getConfig().then((c) => setBannerConfig(c));
    const unsub = bannerConfigService.subscribe((c) => setBannerConfig(c));
    return () => unsub();
  }, []);

  const handleToggleBannerVisibility = async (val: boolean) => {
    try {
      const updated = await bannerConfigService.saveConfig({ isVisible: val });
      setBannerConfig(updated);
      showToast(
        val
          ? 'Wallpaper Banner AI diaktifkan pada menu Dashboard'
          : 'Wallpaper Banner AI dinonaktifkan',
        'info'
      );
    } catch (err: any) {
      showToast('Gagal mengubah visibilitas banner: ' + err.message, 'error');
    }
  };

  const handleResetBanner = async () => {
    if (confirm('Kembalikan setelan wallpaper banner ke default seperti screenshot?')) {
      try {
        const def = await bannerConfigService.resetToDefault();
        setBannerConfig(def);
        showToast('Wallpaper banner berhasil direset ke screenshot default!', 'success');
      } catch (err: any) {
        showToast('Gagal mereset: ' + err.message, 'error');
      }
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      showToast('Judul dan pesan notifikasi wajib diisi.', 'warning');
      return;
    }
    setSendingNotif(true);
    try {
      await sendBroadcast(notifTitle.trim(), notifMessage.trim(), notifType);
      setNotifTitle('');
      setNotifMessage('');
    } catch (e: any) {
      showToast('Gagal mengirim siaran: ' + e.message, 'error');
    } finally {
      setSendingNotif(false);
    }
  };

  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const backupData = await backupService.exportFullDatabase();
      backupService.downloadBackupJSON(backupData);
      showToast(`Cadangan data (${backupData.totalRecords} dokumen) berhasil diekspor!`, 'success');
    } catch (e: any) {
      showToast('Gagal membuat backup database: ' + e.message, 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile) {
      showToast('Pilih file backup .json terlebih dahulu.', 'warning');
      return;
    }

    setRestoreLoading(true);
    try {
      const text = await restoreFile.text();
      const parsed = JSON.parse(text);
      const res = await backupService.restoreDatabase(parsed);
      showToast(`Berhasil memulihkan ${res.success} dokumen dari berkas cadangan!`, 'success');
      setRestoreFile(null);
    } catch (e: any) {
      showToast('Format berkas cadangan tidak valid atau gagal dipulihkan: ' + e.message, 'error');
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleSeedDemoData = async () => {
    setBackupLoading(true);
    try {
      await seedService.seedDemoData(profile?.teacherId || 'GURU-001', profile?.displayName || 'Guru Pengampu');
      showToast('Database berhasil diisi dengan data awal sekolah.', 'success');
    } catch (e: any) {
      showToast('Gagal inisialisasi: ' + e.message, 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleSaveSchoolSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Identitas sekolah dan tahun ajaran berhasil diperbarui.', 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* School Information Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Identitas & Parameter Akademik Sekolah
            </h3>
            <p className="text-xs text-slate-500">
              Digunakan sebagai kop surat resmi dokumen laporan dan kartu QR siswa
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSchoolSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="sm:col-span-1">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nama Sekolah
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tahun Ajaran
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Ganjil">Semester Ganjil (1)</option>
                <option value="Genap">Semester Genap (2)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              Simpan Identitas Sekolah
            </button>
          </div>
        </form>
      </div>

      {/* Real-time Notification Broadcaster */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Sistem Notifikasi Real-Time
            </h3>
            <p className="text-xs text-slate-500">
              Kirim siaran pengumuman instan ke seluruh pengguna dan guru aktif
            </p>
          </div>
        </div>

        <form onSubmit={handleSendBroadcast} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Judul Pengumuman
              </label>
              <input
                type="text"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Contoh: Rapat Dewan Guru Pukul 13.00 WIB"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipe Notifikasi
              </label>
              <select
                value={notifType}
                onChange={(e) => setNotifType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="info">Informasi (Biru)</option>
                <option value="success">Sukses (Hijau)</option>
                <option value="warning">Penting (Kuning/Oranye)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Isi Pesan Siaran
            </label>
            <textarea
              rows={2}
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              placeholder="Tulis rincian pesan notifikasi..."
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={sendingNotif}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim Siaran Notifikasi</span>
            </button>
          </div>
        </form>
      </div>

      {/* Kustomisasi Wallpaper & Banner AI Menu Admin */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Paintbrush className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Tampilan Wallpaper & Banner AI Menu Admin
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  EduTech 2027
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Atur headline, slogan, floating hologram AI, dan wallpaper banner dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetBanner}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            >
              Reset Screenshot
            </button>
            <button
              type="button"
              onClick={() => setIsBannerModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Edit Wallpaper AI</span>
            </button>
          </div>
        </div>

        {/* Live Mini Preview Box */}
        <div className="p-4 rounded-2xl bg-slate-950 text-white border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-blue-300 text-[10px] font-bold">
                {bannerConfig.tagText}
              </span>
              <span className="text-[10px] italic text-blue-200">
                {bannerConfig.sloganText}
              </span>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={bannerConfig.isVisible}
                onChange={(e) => handleToggleBannerVisibility(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Tampilkan Banner di Dashboard</span>
            </label>
          </div>

          <div>
            <h4 className="text-lg sm:text-xl font-extrabold tracking-tight">
              {bannerConfig.headlineMain}{' '}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                {bannerConfig.headlineAccent}
              </span>
            </h4>
            <p className="text-xs text-slate-300/80 mt-1 line-clamp-2">
              {bannerConfig.subheadline}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">{bannerConfig.card1Title}</div>
                <div className="text-slate-400 text-[10px]">{bannerConfig.card1Desc}</div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-bold">
                {bannerConfig.card1Badge}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">{bannerConfig.card2Title}</div>
                <div className="text-slate-400 text-[10px]">{bannerConfig.card2Desc}</div>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 font-bold">
                {bannerConfig.card2Badge}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Backup & Recovery Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Cadangan & Pemulihan Basis Data (Backup & Recovery)
            </h3>
            <p className="text-xs text-slate-500">
              Amankan data siswa, kehadiran, nilai, dan agenda dengan file cadangan terenkripsi JSON
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export Backup */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 font-bold text-xs text-slate-900 dark:text-white">
                <HardDriveDownload className="w-4 h-4 text-emerald-600" />
                <span>Unduh Cadangan Database</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Mengekspor seluruh koleksi siswa, mapel, jadwal, presensi, asesmen, dan agenda ke dalam berkas JSON standar.
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              disabled={backupLoading}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
            >
              {backupLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Unduh File Backup (.json)</span>
            </button>
          </div>

          {/* Restore Backup */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
            <form onSubmit={handleRestoreBackup} className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2 font-bold text-xs text-slate-900 dark:text-white">
                  <HardDriveUpload className="w-4 h-4 text-blue-600" />
                  <span>Pulihkan dari File Cadangan</span>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <button
                type="submit"
                disabled={restoreLoading || !restoreFile}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
              >
                {restoreLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>Pulihkan Database Sekarang</span>
              </button>
            </form>
          </div>
        </div>

        {/* Demo Data Re-seed Button */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Perlu sampel data untuk pengujian modul atau presentasi sekolah?
          </div>
          <button
            onClick={handleSeedDemoData}
            disabled={backupLoading}
            className="px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Isi Ulang Data Sampel Sekolah</span>
          </button>
        </div>
      </div>

      {/* Edit Banner Modal for Admins */}
      <EditBannerModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        config={bannerConfig}
        onSaved={(newCfg) => setBannerConfig(newCfg)}
      />
    </div>
  );
};
