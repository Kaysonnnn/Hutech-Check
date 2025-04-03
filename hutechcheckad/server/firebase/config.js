import dotenv from 'dotenv'
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

dotenv.config()

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.LAHM_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.LAHM_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.LAHM_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.LAHM_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.LAHM_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.LAHM_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.LAHM_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.LAHM_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)

export default app
