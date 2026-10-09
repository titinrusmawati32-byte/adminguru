import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { Student } from '../types';
import { memoryCache } from './cacheService';
import { db, handleFirestoreError, OperationType } from './firebase';

export const studentService = {
  async getAll(): Promise<Student[]> {
    const cached = memoryCache.get<Student[]>('students:all');
    if (cached) return cached;

    try {
      const q = query(collection(db, 'students'), orderBy('name', 'asc'));
      const snap = await getDocs(q);
      const results = snap.docs.map((d) => {
        const data = d.data();
        return {
          studentId: d.id,
          nis: data.nis || '',
          nisn: data.nisn || '',
          name: data.name || '',
          gender: data.gender || 'L',
          classId: data.classId || '',
          className: data.className || '',
          status: data.status || 'active',
          qrCode: data.qrCode || `STU-${d.id}`,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
      });
      memoryCache.set('students:all', results);
      return results;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'students');
    }
  },

  async getByClassId(classId: string): Promise<Student[]> {
    const cacheKey = `students:class:${classId}`;
    const cached = memoryCache.get<Student[]>(cacheKey);
    if (cached) return cached;

    try {
      const q = query(
        collection(db, 'students'),
        where('classId', '==', classId),
        where('status', '==', 'active')
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          studentId: d.id,
          nis: data.nis || '',
          nisn: data.nisn || '',
          name: data.name || '',
          gender: data.gender || 'L',
          classId: data.classId || '',
          className: data.className || '',
          status: data.status || 'active',
          qrCode: data.qrCode || `STU-${d.id}`,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
      });
      const sorted = list.sort((a, b) => a.name.localeCompare(b.name));
      memoryCache.set(cacheKey, sorted);
      return sorted;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'students');
    }
  },

  async getById(studentId: string): Promise<Student | null> {
    try {
      const snap = await getDoc(doc(db, 'students', studentId));
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        studentId: snap.id,
        nis: data.nis,
        nisn: data.nisn,
        name: data.name,
        gender: data.gender,
        classId: data.classId,
        className: data.className,
        status: data.status,
        qrCode: data.qrCode || `STU-${snap.id}`,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `students/${studentId}`);
    }
  },

  async create(student: Omit<Student, 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = student.studentId || `SISWA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const qrCode = student.qrCode || `STU-${id}`;
      await setDoc(doc(db, 'students', id), {
        ...student,
        studentId: id,
        qrCode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      memoryCache.invalidate('students');
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'students');
    }
  },

  async update(studentId: string, updates: Partial<Student>): Promise<void> {
    try {
      await updateDoc(doc(db, 'students', studentId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      memoryCache.invalidate('students');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `students/${studentId}`);
    }
  },

  async delete(studentId: string, softDelete = true): Promise<void> {
    try {
      if (softDelete) {
        await updateDoc(doc(db, 'students', studentId), {
          status: 'inactive',
          updatedAt: serverTimestamp(),
        });
      } else {
        await deleteDoc(doc(db, 'students', studentId));
      }
      memoryCache.invalidate('students');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `students/${studentId}`);
    }
  },

  async importFromExcel(file: File, defaultClassId: string, defaultClassName?: string): Promise<{ success: number; errors: string[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows: any[] = XLSX.utils.sheet_to_json(firstSheet);

          let count = 0;
          const errors: string[] = [];

          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const name = row['Nama'] || row['Nama Siswa'] || row['name'] || row['Name'];
            const nis = String(row['NIS'] || row['nis'] || '').trim();
            const nisn = String(row['NISN'] || row['nisn'] || '').trim();
            const genderRaw = String(row['Jenis Kelamin'] || row['JK'] || row['gender'] || 'L').toUpperCase();
            const gender = genderRaw.startsWith('P') ? 'P' : 'L';
            const classId = row['ID Kelas'] || row['classId'] || defaultClassId;
            const className = row['Kelas'] || row['className'] || defaultClassName || '';

            if (!name) {
              errors.push(`Baris ${i + 2}: Nama siswa wajib diisi.`);
              continue;
            }

            const studentId = `SISWA-${Date.now()}-${i}`;
            await setDoc(doc(db, 'students', studentId), {
              studentId,
              nis: nis || `${24000 + i}`,
              nisn: nisn || `${3000000000 + i}`,
              name,
              gender,
              classId,
              className,
              status: 'active',
              qrCode: `STU-${studentId}`,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            count++;
          }
          resolve({ success: count, errors });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  },

  exportToExcel(students: Student[], fileName = 'Data_Siswa'): void {
    const exportData = students.map((s, index) => ({
      No: index + 1,
      'NIS': s.nis,
      'NISN': s.nisn,
      'Nama Siswa': s.name,
      'Jenis Kelamin': s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
      'Kelas': s.className || s.classId,
      'Status': s.status === 'active' ? 'Aktif' : 'Non-Aktif',
      'QR Code ID': s.qrCode || `STU-${s.studentId}`,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    // Auto-fit column widths
    const colWidths = [
      { wch: 6 },
      { wch: 14 },
      { wch: 16 },
      { wch: 28 },
      { wch: 16 },
      { wch: 14 },
      { wch: 12 },
      { wch: 20 },
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Siswa');
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  },
};
