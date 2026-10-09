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
import { SchoolClass } from '../types';
import { memoryCache } from './cacheService';
import { db, handleFirestoreError, OperationType } from './firebase';

export const classService = {
  async getAll(): Promise<SchoolClass[]> {
    const cached = memoryCache.get<SchoolClass[]>('classes:all');
    if (cached) return cached;

    try {
      const q = query(collection(db, 'classes'), orderBy('name', 'asc'));
      const snap = await getDocs(q);
      if (snap.empty) {
        return [];
      }
      const results = snap.docs.map((d) => ({
        classId: d.id,
        name: d.data().name,
        grade: d.data().grade,
        academicYear: d.data().academicYear,
        createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate().toISOString() : d.data().createdAt,
        updatedAt: d.data().updatedAt?.toDate ? d.data().updatedAt.toDate().toISOString() : d.data().updatedAt,
      }));
      memoryCache.set('classes:all', results);
      return results;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'classes');
    }
  },

  async create(data: Omit<SchoolClass, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const id = data.classId || `CLS-${Date.now()}`;
      await setDoc(doc(db, 'classes', id), {
        ...data,
        classId: id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      memoryCache.invalidate('classes');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'classes');
    }
  },

  async update(classId: string, data: Partial<SchoolClass>): Promise<void> {
    try {
      await updateDoc(doc(db, 'classes', classId), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      memoryCache.invalidate('classes');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `classes/${classId}`);
    }
  },

  async delete(classId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'classes', classId));
      memoryCache.invalidate('classes');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `classes/${classId}`);
    }
  },
};
