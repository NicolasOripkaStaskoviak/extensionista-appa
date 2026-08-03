import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  browserSessionPersistence,
  getAuth,
  setPersistence,
} from 'firebase/auth'
import type { Auth } from 'firebase/auth'

const configuracao = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

function valorValido(valor: string | undefined) {
  return Boolean(
    valor &&
      !valor.includes('SUBSTITUA') &&
      !valor.includes('SEU_') &&
      !valor.includes('seu-projeto'),
  )
}

export const firebaseConfigurado = Object.values(configuracao).every(valorValido)

export const auth: Auth | null = firebaseConfigurado
  ? getAuth(getApps().length ? getApp() : initializeApp(configuracao))
  : null

export const persistenciaConfigurada = auth
  ? setPersistence(auth, browserSessionPersistence)
  : Promise.resolve()
