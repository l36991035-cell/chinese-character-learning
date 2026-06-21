import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './client'

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  // Upsert user document
  await setDoc(doc(db, 'users', result.user.uid), {
    email: result.user.email,
    displayName: result.user.displayName,
    photoURL: result.user.photoURL,
    createdAt: serverTimestamp(),
  }, { merge: true })
  // Set a lightweight session cookie so middleware can detect auth state
  if (typeof document !== 'undefined') {
    document.cookie = '__session=1; path=/'
  }
  return result.user
}

export async function signOut() {
  await firebaseSignOut(auth)
  if (typeof document !== 'undefined') {
    document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }
}
