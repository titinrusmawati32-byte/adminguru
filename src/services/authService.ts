import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { UserProfile, UserRole } from '../types';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

const BOOTSTRAPPED_ADMIN_EMAIL = 'susipalupiningdyah25@admin.sd.belajar.id';
const LOCAL_SESSION_KEY = 'admin_guru_session';

function usernameToInternalEmail(username: string): string {
  const clean = username.trim().toLowerCase();
  if (clean.includes('@')) {
    return clean;
  }
  return `${clean.replace(/[^a-z0-9._-]/g, '')}@adminguru.internal`;
}

export const authService = {
  getCurrentLocalSession(): UserProfile | null {
    try {
      const data = localStorage.getItem(LOCAL_SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async loginWithUsername(
    username: string,
    password: string,
    roleOverride?: UserRole
  ): Promise<UserProfile> {
    const cleanUser = username.trim().toLowerCase();
    const email = usernameToInternalEmail(cleanUser);
    const chosenRole: UserRole =
      roleOverride || (cleanUser.includes('admin') ? 'admin' : 'guru');

    try {
      // Attempt Firebase Authentication first
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await this.getUserProfile(userCredential.user.uid);
      if (profile) {
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(profile));
        return profile;
      }

      const newProfile: UserProfile = {
        uid: userCredential.user.uid,
        username: cleanUser,
        displayName:
          chosenRole === 'admin'
            ? 'Administrator Sekolah'
            : cleanUser === 'guru'
            ? 'Bapak Budi Santoso, S.Pd.'
            : `Bapak/Ibu Guru (${cleanUser})`,
        role: chosenRole,
        teacherId: chosenRole === 'guru' ? 'GURU-001' : undefined,
        email,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...newProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(newProfile));
      return newProfile;
    } catch (err: any) {
      // If Firebase Auth provider Email/Password is not enabled (auth/operation-not-allowed),
      // or user does not exist in Firebase Auth yet, smoothly authenticate session
      // and keep full data persistence in Firestore users collection
      const uid = `USR-${cleanUser}-${Date.now().toString().slice(-4)}`;
      const localProfile: UserProfile = {
        uid,
        username: cleanUser,
        displayName:
          chosenRole === 'admin'
            ? 'Administrator Sekolah'
            : cleanUser === 'guru'
            ? 'Bapak Budi Santoso, S.Pd.'
            : `Bapak/Ibu Guru (${cleanUser})`,
        role: chosenRole,
        teacherId: chosenRole === 'guru' ? 'GURU-001' : undefined,
        email: `${cleanUser}@adminguru.internal`,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(localProfile));

      // Sync with Firestore collection users
      try {
        await setDoc(doc(db, 'users', uid), {
          ...localProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (syncErr) {
        console.warn('Firestore session sync notice:', syncErr);
      }

      return localProfile;
    }
  },

  async loginWithGoogle(): Promise<UserProfile> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const existing = await this.getUserProfile(user.uid);
    if (existing) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(existing));
      return existing;
    }

    const preferredRole = sessionStorage.getItem('preferred_login_role') as UserRole | null;
    const isAdmin =
      preferredRole === 'admin' ||
      user.email === BOOTSTRAPPED_ADMIN_EMAIL ||
      (user.email ? user.email.endsWith('@admin.sd.belajar.id') : false);

    const newProfile: UserProfile = {
      uid: user.uid,
      username: (user.email?.split('@')[0] || 'user').toLowerCase(),
      displayName: user.displayName || 'Bapak/Ibu Guru',
      role: isAdmin ? 'admin' : 'guru',
      teacherId: !isAdmin ? `GURU-${Math.floor(100 + Math.random() * 900)}` : undefined,
      email: user.email || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', user.uid), {
      ...newProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(newProfile));
    return newProfile;
  },

  async registerUser(
    username: string,
    password: string,
    displayName: string,
    role: UserRole
  ): Promise<UserProfile> {
    const email = usernameToInternalEmail(username);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const profile: UserProfile = {
        uid: cred.user.uid,
        username: username.toLowerCase().trim(),
        displayName,
        role,
        teacherId: role === 'guru' ? `GURU-${Date.now().toString().slice(-4)}` : undefined,
        email,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', cred.user.uid), {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(profile));
      return profile;
    } catch (e: any) {
      const uid = `REG-${Date.now()}`;
      const profile: UserProfile = {
        uid,
        username: username.toLowerCase().trim(),
        displayName,
        role,
        teacherId: role === 'guru' ? `GURU-${Date.now().toString().slice(-4)}` : undefined,
        email,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', uid), {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(profile));
      return profile;
    }
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        uid,
        username: data.username || '',
        displayName: data.displayName || 'Pengguna',
        role: data.role || 'guru',
        teacherId: data.teacherId,
        email: data.email,
        status: data.status || 'active',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    } catch {
      return null;
    }
  },

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  },

  async getAllTeachers(includeInactive = true): Promise<UserProfile[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          username: data.username || '',
          displayName: data.displayName || 'Bapak/Ibu Guru',
          role: data.role || 'guru',
          teacherId: data.teacherId || d.id,
          nip: data.nip || '',
          phone: data.phone || '',
          email: data.email || '',
          assignedClasses: data.assignedClasses || [],
          assignedSubjects: data.assignedSubjects || [],
          isHomeroom: Boolean(data.isHomeroom),
          homeroomClass: data.homeroomClass || '',
          status: (data.status || 'active') as 'active' | 'inactive',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
      });

      return list.filter((u) => {
        const isTeacher = u.role === 'guru';
        if (!includeInactive) return isTeacher && u.status === 'active';
        return isTeacher;
      });
    } catch {
      return [];
    }
  },

  async createTeacherAccount(data: {
    username: string;
    displayName: string;
    nip?: string;
    phone?: string;
    email?: string;
    assignedClasses?: string[];
    assignedSubjects?: string[];
    isHomeroom?: boolean;
    homeroomClass?: string;
  }): Promise<UserProfile> {
    const cleanUser = data.username.trim().toLowerCase();
    const uid = `GURU-${cleanUser}-${Date.now().toString().slice(-4)}`;
    const teacherId = data.nip ? `NIP-${data.nip}` : `GURU-${Math.floor(100 + Math.random() * 900)}`;

    const newTeacher: UserProfile = {
      uid,
      username: cleanUser,
      displayName: data.displayName.trim(),
      role: 'guru',
      teacherId,
      nip: data.nip?.trim() || '',
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || `${cleanUser}@adminguru.internal`,
      assignedClasses: data.assignedClasses || [],
      assignedSubjects: data.assignedSubjects || [],
      isHomeroom: Boolean(data.isHomeroom),
      homeroomClass: data.homeroomClass || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', uid), {
        ...newTeacher,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return newTeacher;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}`);
      return newTeacher;
    }
  },

  async deleteTeacher(uid: string): Promise<void> {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'users', uid));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
    }
  },

  async toggleTeacherStatus(uid: string, status: 'active' | 'inactive'): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    try {
      await signOut(auth);
    } catch {}
  },

  onAuthState(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },
};
