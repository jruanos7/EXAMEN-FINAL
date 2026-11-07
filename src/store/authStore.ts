import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, LoginResponse } from '../types'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  setSession: (login: LoginResponse) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

// TODO 1.2 (Autenticación): store real con persist (clave 'auth-storage').
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setSession: (login) => {
        const { accessToken, refreshToken, ...user } = login
        set({
          user: user as AuthUser,
          accessToken,
          refreshToken,
        })
      },

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'auth-storage' },
  ),
)