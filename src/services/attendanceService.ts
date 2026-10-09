import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { AttendanceRecord, AttendanceStatus } from '../types';
import { db, handleFirestoreError, OperationType } from './firebase';

export const attendanceService = {
  subscribeByDateAndClass(
    date: string,
    classId: string,
    onUpdate: (records: AttendanceRecord[]) => void,
    subjectId?: string
  ): () => void {
    const pathForOnSnapshot = 'attendance';
    const q = query(
      collection(db, pathForOnSnapshot),
      where('date', '==', date),
      where('classId', '==', classId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: AttendanceRecord[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            attendanceId: d.id,
            scheduleId: data.scheduleId,
            classId: data.classId,
            className: data.className,
            subjectId: data.subjectId,
            subjectName: data.subjectName,
            teacherId: data.teacherId,
            date: data.date,
            studentId: data.studentId,
            studentName: data.studentName,
            nis: data.nis,
            status: data.status as AttendanceStatus,
            notes: data.notes || '',
            method: data.method || 'manual',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          };
        });

        if (subjectId) {
          onUpdate(list.filter((a) => !a.subjectId || a.subjectId === subjectId));
        } else {
          onUpdate(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
      }
    );

    return unsubscribe;
  },

  async getByDateAndClass(date: string, classId: string, subjectId?: string): Promise<AttendanceRecord[]> {
    try {
      let q = query(
        collection(db, 'attendance'),
        where('date', '==', date),
        where('classId', '==', classId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          attendanceId: d.id,
          scheduleId: data.scheduleId,
          classId: data.classId,
          className: data.className,
          subjectId: data.subjectId,
          subjectName: data.subjectName,
          teacherId: data.teacherId,
          date: data.date,
          studentId: data.studentId,
          studentName: data.studentName,
          nis: data.nis,
          status: data.status as AttendanceStatus,
          notes: data.notes || '',
          method: data.method || 'manual',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
      });

      if (subjectId) {
        return list.filter((a) => !a.subjectId || a.subjectId === subjectId);
      }
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'attendance');
    }
  },

  async getAll(): Promise<AttendanceRecord[]> {
    try {
      const snap = await getDocs(collection(db, 'attendance'));
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          attendanceId: d.id,
          scheduleId: data.scheduleId,
          classId: data.classId,
          className: data.className,
          subjectId: data.subjectId,
          subjectName: data.subjectName,
          teacherId: data.teacherId,
          date: data.date,
          studentId: data.studentId,
          studentName: data.studentName,
          nis: data.nis,
          status: data.status as AttendanceStatus,
          notes: data.notes || '',
          method: data.method || 'manual',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'attendance');
    }
  },

  async saveBatch(records: Omit<AttendanceRecord, 'createdAt' | 'updatedAt'>[]): Promise<void> {
    try {
      for (const rec of records) {
        // Prevent duplicate by composite key id
        const docId = rec.attendanceId || `${rec.date}_${rec.classId}_${rec.studentId}_${rec.subjectId || 'general'}`;
        await setDoc(doc(db, 'attendance', docId), {
          ...rec,
          attendanceId: docId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'attendance');
    }
  },

  async recordScan(record: Omit<AttendanceRecord, 'attendanceId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docId = `${record.date}_${record.classId}_${record.studentId}_${record.subjectId || 'general'}`;
      await setDoc(doc(db, 'attendance', docId), {
        ...record,
        attendanceId: docId,
        method: 'qr',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docId;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'attendance');
    }
  },

  async updateSingle(attendanceId: string, status: AttendanceStatus, notes?: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'attendance', attendanceId), {
        status,
        notes: notes || '',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `attendance/${attendanceId}`);
    }
  },

  async delete(attendanceId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'attendance', attendanceId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `attendance/${attendanceId}`);
    }
  },
};
