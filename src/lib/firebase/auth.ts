import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './client'

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  await signInWithRedirect(auth, provider)
}

export async function handleGoogleRedirect() {
  const result = await getRedirectResult(auth)
  if (!result) return null
  // Set cookie immediately so middleware allows access
  if (typeof document !== 'undefined') {
    document.cookie = '__session=1; path=/'
  }
  // Firestore write is best-effort — don't block login if it fails
  try {
    await setDoc(doc(db, 'users', result.user.uid), {
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      createdAt: serverTimestamp(),
    }, { merge: true })
  } catch (err) {
    console.error('Failed to save user profile:', err)
  }
  return result.user
}

export async function signOut() {
  await firebaseSignOut(auth)
  if (typeof document !== 'undefined') {
    document.cookie = '__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }
}
