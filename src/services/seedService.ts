import { collection, doc, getDocs, limit, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export const seedService = {
  async isDatabaseEmpty(): Promise<boolean> {
    try {
      const q = query(collection(db, 'students'), limit(1));
      const snap = await getDocs(q);
      return snap.empty;
    } catch {
      return false;
    }
  },

  async seedDemoData(teacherId = 'GURU-001', teacherName = 'Bapak Budi Santoso, S.Pd.'): Promise<void> {
    // 1. Classes
    const classes = [
      { classId: 'CLS-7A', name: 'Kelas 7A', grade: '7', academicYear: '2024/2025' },
      { classId: 'CLS-7B', name: 'Kelas 7B', grade: '7', academicYear: '2024/2025' },
      { classId: 'CLS-8A', name: 'Kelas 8A', grade: '8', academicYear: '2024/2025' },
      { classId: 'CLS-9A', name: 'Kelas 9A', grade: '9', academicYear: '2024/2025' },
    ];
    for (const c of classes) {
      await setDoc(doc(db, 'classes', c.classId), {
        ...c,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 2. Subjects
    const subjects = [
      { subjectId: 'MAPEL-MTK', code: 'MTK-01', name: 'Matematika', group: 'Kelompok A (Wajib)', status: 'active' },
      { subjectId: 'MAPEL-BIN', code: 'BIN-01', name: 'Bahasa Indonesia', group: 'Kelompok A (Wajib)', status: 'active' },
      { subjectId: 'MAPEL-IPA', code: 'IPA-01', name: 'Ilmu Pengetahuan Alam', group: 'Kelompok A (Wajib)', status: 'active' },
      { subjectId: 'MAPEL-PPN', code: 'PPN-01', name: 'Pendidikan Pancasila', group: 'Kelompok A (Wajib)', status: 'active' },
      { subjectId: 'MAPEL-BIG', code: 'BIG-01', name: 'Bahasa Inggris', group: 'Kelompok A (Wajib)', status: 'active' },
      { subjectId: 'MAPEL-PJK', code: 'PJK-01', name: 'Pendidikan Jasmani & Olahraga', group: 'Kelompok B (Umum)', status: 'active' },
    ];
    for (const s of subjects) {
      await setDoc(doc(db, 'subjects', s.subjectId), {
        ...s,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 3. Students
    const studentNames = [
      { name: 'Aditya Pratama', gender: 'L', nis: '24101', nisn: '0089123411', classId: 'CLS-7A', className: 'Kelas 7A' },
      { name: 'Annisa Rahmawati', gender: 'P', nis: '24102', nisn: '0089123412', classId: 'CLS-7A', className: 'Kelas 7A' },
      { name: 'Bagas Surya', gender: 'L', nis: '24103', nisn: '0089123413', classId: 'CLS-7A', className: 'Kelas 7A' },
      { name: 'Citra Dewi', gender: 'P', nis: '24104', nisn: '0089123414', classId: 'CLS-7A', className: 'Kelas 7A' },
      { name: 'Dimas Anggara', gender: 'L', nis: '24105', nisn: '0089123415', classId: 'CLS-7A', className: 'Kelas 7A' },
      { name: 'Fadhil Rahman', gender: 'L', nis: '24106', nisn: '0089123416', classId: 'CLS-7A', className: 'Kelas 7A' },
      { name: 'Gita Maharani', gender: 'P', nis: '24107', nisn: '0089123417', classId: 'CLS-7A', className: 'Kelas 7A' },
      { name: 'Hafiz Al-Farisi', gender: 'L', nis: '24108', nisn: '0089123418', classId: 'CLS-7A', className: 'Kelas 7A' },
      { name: 'Indah Puspita', gender: 'P', nis: '24109', nisn: '0089123419', classId: 'CLS-7A', className: 'Kelas 7A' },
      { name: 'Joko Widodo Putra', gender: 'L', nis: '24110', nisn: '0089123420', classId: 'CLS-7A', className: 'Kelas 7A' },
      { name: 'Kania Salsabila', gender: 'P', nis: '24111', nisn: '0089123421', classId: 'CLS-7B', className: 'Kelas 7B' },
      { name: 'Muhammad Farhan', gender: 'L', nis: '24112', nisn: '0089123422', classId: 'CLS-7B', className: 'Kelas 7B' },
      { name: 'Nabila Syahrani', gender: 'P', nis: '24113', nisn: '0089123423', classId: 'CLS-7B', className: 'Kelas 7B' },
      { name: 'Rian Hidayat', gender: 'L', nis: '24114', nisn: '0089123424', classId: 'CLS-8A', className: 'Kelas 8A' },
      { name: 'Zahra Amelia', gender: 'P', nis: '24115', nisn: '0089123425', classId: 'CLS-8A', className: 'Kelas 8A' },
    ];

    const studentIds: string[] = [];
    for (let i = 0; i < studentNames.length; i++) {
      const s = studentNames[i];
      const studentId = `SISWA-${100 + i}`;
      studentIds.push(studentId);
      await setDoc(doc(db, 'students', studentId), {
        studentId,
        nis: s.nis,
        nisn: s.nisn,
        name: s.name,
        gender: s.gender,
        classId: s.classId,
        className: s.className,
        status: 'active',
        qrCode: `STU-${studentId}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 4. Schedules
    const schedules = [
      {
        scheduleId: 'JADWAL-1',
        teacherId,
        teacherName,
        classId: 'CLS-7A',
        className: 'Kelas 7A',
        subjectId: 'MAPEL-MTK',
        subjectName: 'Matematika',
        day: 'Senin',
        startTime: '07:30',
        endTime: '09:00',
        room: 'Ruang 7A',
        academicYear: '2024/2025',
        semester: '1',
        status: 'active',
      },
      {
        scheduleId: 'JADWAL-2',
        teacherId,
        teacherName,
        classId: 'CLS-7B',
        className: 'Kelas 7B',
        subjectId: 'MAPEL-MTK',
        subjectName: 'Matematika',
        day: 'Senin',
        startTime: '09:15',
        endTime: '10:45',
        room: 'Ruang 7B',
        academicYear: '2024/2025',
        semester: '1',
        status: 'active',
      },
      {
        scheduleId: 'JADWAL-3',
        teacherId,
        teacherName,
        classId: 'CLS-8A',
        className: 'Kelas 8A',
        subjectId: 'MAPEL-MTK',
        subjectName: 'Matematika',
        day: 'Selasa',
        startTime: '08:00',
        endTime: '09:30',
        room: 'Ruang 8A',
        academicYear: '2024/2025',
        semester: '1',
        status: 'active',
      },
      {
        scheduleId: 'JADWAL-4',
        teacherId,
        teacherName,
        classId: 'CLS-7A',
        className: 'Kelas 7A',
        subjectId: 'MAPEL-IPA',
        subjectName: 'Ilmu Pengetahuan Alam',
        day: 'Rabu',
        startTime: '07:30',
        endTime: '09:00',
        room: 'Laboratorium IPA',
        academicYear: '2024/2025',
        semester: '1',
        status: 'active',
      },
    ];

    for (const sc of schedules) {
      await setDoc(doc(db, 'schedules', sc.scheduleId), {
        ...sc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 5. Attendance (Today & Yesterday)
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const sampleStatuses = ['Hadir', 'Hadir', 'Hadir', 'Sakit', 'Hadir', 'Hadir', 'Izin', 'Hadir', 'Hadir', 'Hadir'];
    for (let i = 0; i < 10; i++) {
      const stu = studentNames[i];
      const sid = studentIds[i];
      const status = sampleStatuses[i] as any;
      const attId = `${today}_CLS-7A_${sid}_MAPEL-MTK`;
      await setDoc(doc(db, 'attendance', attId), {
        attendanceId: attId,
        scheduleId: 'JADWAL-1',
        classId: 'CLS-7A',
        className: 'Kelas 7A',
        subjectId: 'MAPEL-MTK',
        subjectName: 'Matematika',
        teacherId,
        date: today,
        studentId: sid,
        studentName: stu.name,
        nis: stu.nis,
        status,
        method: i === 0 ? 'qr' : 'manual',
        notes: status === 'Sakit' ? 'Surat dokter terlampir' : '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Yesterday
      const yAttId = `${yesterday}_CLS-7A_${sid}_MAPEL-MTK`;
      await setDoc(doc(db, 'attendance', yAttId), {
        attendanceId: yAttId,
        scheduleId: 'JADWAL-1',
        classId: 'CLS-7A',
        className: 'Kelas 7A',
        subjectId: 'MAPEL-MTK',
        subjectName: 'Matematika',
        teacherId,
        date: yesterday,
        studentId: sid,
        studentName: stu.name,
        nis: stu.nis,
        status: 'Hadir',
        method: 'manual',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 6. Assessments
    const mockScores = [
      { studentId: studentIds[0], studentName: studentNames[0].name, nis: studentNames[0].nis, score: 92, notes: 'Sangat baik' },
      { studentId: studentIds[1], studentName: studentNames[1].name, nis: studentNames[1].nis, score: 88, notes: 'Baik' },
      { studentId: studentIds[2], studentName: studentNames[2].name, nis: studentNames[2].nis, score: 75, notes: 'Cukup, perlu latihan' },
      { studentId: studentIds[3], studentName: studentNames[3].name, nis: studentNames[3].nis, score: 95, notes: 'Luar biasa' },
      { studentId: studentIds[4], studentName: studentNames[4].name, nis: studentNames[4].nis, score: 68, notes: 'Remedial bab aljabar' },
      { studentId: studentIds[5], studentName: studentNames[5].name, nis: studentNames[5].nis, score: 84, notes: 'Baik' },
      { studentId: studentIds[6], studentName: studentNames[6].name, nis: studentNames[6].nis, score: 90, notes: 'Sangat baik' },
      { studentId: studentIds[7], studentName: studentNames[7].name, nis: studentNames[7].nis, score: 80, notes: 'Baik' },
      { studentId: studentIds[8], studentName: studentNames[8].name, nis: studentNames[8].nis, score: 85, notes: 'Baik' },
      { studentId: studentIds[9], studentName: studentNames[9].name, nis: studentNames[9].nis, score: 78, notes: 'Tuntas' },
    ];

    await setDoc(doc(db, 'assessments', 'NILAI-1'), {
      assessmentId: 'NILAI-1',
      classId: 'CLS-7A',
      className: 'Kelas 7A',
      subjectId: 'MAPEL-MTK',
      subjectName: 'Matematika',
      teacherId,
      type: 'formatif',
      title: 'Formatif 1: Operasi Bilangan Bulat',
      date: yesterday,
      maxScore: 100,
      scores: mockScores,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'assessments', 'NILAI-2'), {
      assessmentId: 'NILAI-2',
      classId: 'CLS-7A',
      className: 'Kelas 7A',
      subjectId: 'MAPEL-MTK',
      subjectName: 'Matematika',
      type: 'tugas',
      title: 'Tugas Mandiri: Soal Cerita Aljabar',
      date: today,
      maxScore: 100,
      scores: mockScores.map((s) => ({ ...s, score: Math.min(100, s.score + 4) })),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 7. Teaching Agenda
    await setDoc(doc(db, 'teaching_agendas', 'AGENDA-1'), {
      agendaId: 'AGENDA-1',
      teacherId,
      teacherName,
      scheduleId: 'JADWAL-1',
      classId: 'CLS-7A',
      className: 'Kelas 7A',
      subjectId: 'MAPEL-MTK',
      subjectName: 'Matematika',
      date: today,
      topic: 'Konsep Dasar Persamaan Linear Satu Variabel',
      learningObjective: 'Siswa mampu memahami bentuk umum PLSV dan menemukan nilai variabel.',
      activity: 'Diskusi kelompok menggunakan lembar kerja interaktif dan presentasi di depan kelas.',
      attendanceSummary: '8 Hadir, 1 Sakit, 1 Izin',
      notes: 'Materi berjalan lancar, siswa antusias berdiskusi.',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 8. Guidance
    await setDoc(doc(db, 'guidance', 'BIMBINGAN-1'), {
      guidanceId: 'BIMBINGAN-1',
      teacherId,
      teacherName,
      studentId: studentIds[4],
      studentName: studentNames[4].name,
      nis: studentNames[4].nis,
      className: 'Kelas 7A',
      date: today,
      category: 'Akademik',
      problem: 'Mengalami kesulitan fokus pada materi matematika berhitung aljabar.',
      action: 'Memberikan bimbingan remedial personal dan strategi latihan bertahap.',
      followUp: 'Evaluasi ulang kemajuan belajar pada pertemuan minggu depan.',
      status: 'in_progress',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 9. Notifications
    await setDoc(doc(db, 'notifications', 'NOTIF-1'), {
      notificationId: 'NOTIF-1',
      title: 'Selamat Datang di Admin Guru',
      message: 'Sistem administrasi akademik siap digunakan. Silakan kelola jadwal dan siswa Anda.',
      type: 'info',
      read: false,
      createdAt: serverTimestamp(),
    });
  },
};
