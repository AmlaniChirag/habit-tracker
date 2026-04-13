import { useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

/**
 * Two-way sync between the in-memory habit state and Firestore.
 *
 * On login:
 *   - If a Firestore doc exists → load it into the app (cloud wins).
 *   - If no Firestore doc exists → push current localStorage data up (first-login migration).
 *
 * On every subsequent state change (while authed):
 *   - Debounce-write the full state to Firestore.
 *
 * localStorage continues to work as the instant-read cache; Firestore is
 * the durable cloud layer on top.
 */
export default function useFirestoreSync(state, user, replaceState) {
  const skipNextSync = useRef(false);
  const initialLoadDone = useRef(false);
  const debounceTimer = useRef(null);

  // --- On login: load from Firestore or push current state up. -----------
  useEffect(() => {
    if (!user) {
      initialLoadDone.current = false;
      return;
    }

    const docRef = doc(db, 'users', user.uid);
    getDoc(docRef)
      .then((snap) => {
        if (snap.exists()) {
          skipNextSync.current = true;
          replaceState(snap.data());
        } else {
          // First login — migrate existing localStorage data to Firestore.
          setDoc(docRef, state).catch(console.error);
        }
        initialLoadDone.current = true;
      })
      .catch((err) => {
        console.error('Firestore load failed:', err);
        initialLoadDone.current = true;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- On state change: debounce-save to Firestore. ----------------------
  useEffect(() => {
    if (!user || !initialLoadDone.current) return;

    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }

    // Debounce to avoid hammering Firestore on rapid toggles.
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const docRef = doc(db, 'users', user.uid);
      setDoc(docRef, state).catch(console.error);
    }, 800);

    return () => clearTimeout(debounceTimer.current);
  }, [state, user]);
}
