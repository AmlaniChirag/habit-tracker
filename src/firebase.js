import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBCPlDjPKu71mByrRoujfuFUumEYAkgUzw',
  authDomain: 'habit-tracker-931fc.firebaseapp.com',
  projectId: 'habit-tracker-931fc',
  storageBucket: 'habit-tracker-931fc.firebasestorage.app',
  messagingSenderId: '60109228274',
  appId: '1:60109228274:web:b9099e3add509a0840286b',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
