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
import { TeachingAgenda } from '../types';
import { memoryCache } from './cacheService';
import { db, handleFirestoreError, OperationType } from './firebase';

export const agendaService = {
  async getAll(): Promise<TeachingAgenda[]> {
    const cached = memoryCache.get<TeachingAgenda[]>('agendas:all');
    if (cached) return cached;

    try {
      const q = query(collection(db, 'teaching_agendas'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      const results = snap.docs.map((d) => {
        const data = d.data();
        return {
          agendaId: d.id,
          teacherId: data.teacherId || '',
          teacherName: data.teacherName || '',
          scheduleId: data.scheduleId,
          classId: data.classId || '',
          className: data.className || '',
          subjectId: data.subjectId || '',
          subjectName: data.subjectName || '',
          date: data.date || '',
          topic: data.topic || '',
          learningObjective: data.learningObjective || '',
          activity: data.activity || '',
          attendanceSummary: data.attendanceSummary || '',
          notes: data.notes || '',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
      });
      memoryCache.set('agendas:all', results);
      return results;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'teaching_agendas');
    }
  },

  async create(data: Omit<TeachingAgenda, 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = data.agendaId || `AGENDA-${Date.now()}`;
      await setDoc(doc(db, 'teaching_agendas', id), {
        ...data,
        agendaId: id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      memoryCache.invalidate('agendas');
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'teaching_agendas');
    }
  },

  async update(agendaId: string, updates: Partial<TeachingAgenda>): Promise<void> {
    try {
      await updateDoc(doc(db, 'teaching_agendas', agendaId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      memoryCache.invalidate('agendas');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `teaching_agendas/${agendaId}`);
    }
  },

  async delete(agendaId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'teaching_agendas', agendaId));
      memoryCache.invalidate('agendas');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `teaching_agendas/${agendaId}`);
    }
  },
};
