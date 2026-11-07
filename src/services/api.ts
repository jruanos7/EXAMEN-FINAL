import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_URL } from '../config'
import { useAuthStore } from '../store/authStore'
import { authService } from './authService'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// TODO 1.3 (Autenticación)
// a) Interceptor de petición: agrega Authorization: Bearer <token>.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// b) Interceptor de respuesta: ante un 401 renueva UNA sola vez y repite la petición.
type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let refreshPromise: Promise<string> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined

    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error)
    }

    original._retry = true
    const { refreshToken, setTokens, logout } = useAuthStore.getState()

    if (!refreshToken) {
      logout()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    try {
      // Si varias peticiones fallan a la vez, todas esperan la misma renovación.
      if (!refreshPromise) {
        refreshPromise = authService
          .refresh(refreshToken)
          .then((tokens) => {
            setTokens(tokens.accessToken, tokens.refreshToken)
            return tokens.accessToken
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      const newToken = await refreshPromise
      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch (refreshError) {
      logout()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    }
  },
)