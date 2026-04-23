import axios from 'axios'
import { getSupabaseClient } from '@/lib/supabase'

/**
 * 백엔드 API 호출용 axios 인스턴스.
 *
 * 토큰 우선순위:
 *   1. Supabase 세션 (`getSession`) — Google/Kakao 로그인 (기본 경로)
 *   2. localStorage `checkmate:auth_token` — 폴백 (명시적으로 토큰을 저장한 경우)
 */

export const AUTH_TOKEN_STORAGE_KEY = 'checkmate:auth_token'
export const AUTH_PROVIDER_STORAGE_KEY = 'checkmate:auth_provider'

const baseURL = import.meta.env.VITE_API_BASE_URL
if (!baseURL) throw new Error('VITE_API_BASE_URL is required at build time')

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: false,
})

apiClient.interceptors.request.use(async (config) => {
  const token = await resolveAccessToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      try {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
        localStorage.removeItem(AUTH_PROVIDER_STORAGE_KEY)
      } catch {
        /* quota/access issues: ignore */
      }
    }
    return Promise.reject(err)
  },
)

export async function resolveAccessToken() {
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      if (token) return token
    } catch {
      /* fall through */
    }
  }
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || null
  } catch {
    return null
  }
}
