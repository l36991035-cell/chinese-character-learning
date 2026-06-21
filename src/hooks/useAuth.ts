'use client'
import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'

export interface AuthContextType {
  user: User | null
  loading: boolean
}

export const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export function useAuth(): AuthContextType {
  return useContext(AuthContext)
}
