import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Guidance } from '../types';
import { memoryCache } from './cacheService';
import { db, handleFirestoreError, OperationType } from './firebase';

export const guidanceService = {
  async getAll(): Promise<Guidance[]> {
    const cached = memoryCache.get<Guidance[]>('guidance:all');
    if (cached) return cached;

    try {
      const q = query(collection(db, 'guidance'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      const results = snap.docs.map((d) => {
        const data = d.data();
        return {
          guidanceId: d.id,
          teacherId: data.teacherId || '',
          teacherName: data.teacherName || '',
          studentId: data.studentId || '',
          studentName: data.studentName || '',
          nis: data.nis || '',
          className: data.className || '',
          date: data.date || '',
          category: data.category || 'Akademik',
          problem: data.problem || '',
          action: data.action || '',
          followUp: data.followUp || '',
          status: data.status || 'open',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
      });
      memoryCache.set('guidance:all', results);
      return results;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'guidance');
    }
  },

  async create(data: Omit<Guidance, 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = data.guidanceId || `BIMBINGAN-${Date.now()}`;
      await setDoc(doc(db, 'guidance', id), {
        ...data,
        guidanceId: id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      memoryCache.invalidate('guidance');
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'guidance');
    }
  },

  async update(guidanceId: string, updates: Partial<Guidance>): Promise<void> {
    try {
      await updateDoc(doc(db, 'guidance', guidanceId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      memoryCache.invalidate('guidance');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `guidance/${guidanceId}`);
    }
  },

  async delete(guidanceId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'guidance', guidanceId));
      memoryCache.invalidate('guidance');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `guidance/${guidanceId}`);
    }
  },
};
