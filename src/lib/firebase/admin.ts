import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0]
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export async function getFirebaseAdmin() {
  const app = getAdminApp()
  const db = getFirestore(app)
  return { app, db }
}

export async function requireAuth(request: Request): Promise<string> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) throw new Error('Unauthorized')
  const { app } = await getFirebaseAdmin()
  const decoded = await getAuth(app).verifyIdToken(token)
  return decoded.uid
}
