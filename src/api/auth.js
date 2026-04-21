import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import {
  apiClient,
  AUTH_PROVIDER_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
} from '@/api/client'

/**
 * 소셜 로그인 진입 / 세션 조회 / 로그아웃 헬퍼.
 *
 * 설계 원칙:
 * - Google/Kakao 는 Supabase Auth 가 처리(`supabase.auth.signInWithOAuth`).
 * - 콜백 처리(`consumeAuthCallback`)는 `/auth/callback` 에서 Supabase 세션을 확정.
 */

const FRONT_ORIGIN = typeof window !== 'undefined' ? window.location.origin : ''
const DEFAULT_CALLBACK = `${FRONT_ORIGIN}/auth/callback`

// ------------------------------------------------------------------
// 로그인 진입
// ------------------------------------------------------------------

/** @param {{ redirectTo?: string }} [opts] */
export async function startGoogleLogin(opts = {}) {
  await startSupabaseOAuth('google', opts)
}

/** @param {{ redirectTo?: string }} [opts] */
export async function startKakaoLogin(opts = {}) {
  await startSupabaseOAuth('kakao', opts)
}

async function startSupabaseOAuth(provider, opts) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase 환경변수 미설정: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 를 .env 에 채워 주세요.',
    )
  }
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: opts?.redirectTo ?? DEFAULT_CALLBACK,
    },
  })
  if (error) throw error
}

// ------------------------------------------------------------------
// /auth/callback 에서 호출 — Supabase 세션 확정
// ------------------------------------------------------------------

/**
 * /auth/callback 에서 호출:
 * - Supabase 클라이언트는 `detectSessionInUrl: true` 로 세션을 자동 생성하므로 `getSession()` 만 읽으면 된다.
 *
 * @returns {Promise<{ ok: true, provider: 'google'|'kakao', sub: string } | { ok: false, error: string }>}
 */
export async function consumeAuthCallback() {
  const hashParams = parseHashParams(
    typeof window !== 'undefined' ? window.location.hash : '',
  )

  if (hashParams.error) {
    return { ok: false, error: hashParams.error }
  }

  const supabase = getSupabaseClient()
  if (supabase) {
    const { data } = await supabase.auth.getSession()
    const session = data?.session
    if (session?.access_token) {
      const provider =
        session.user?.app_metadata?.provider === 'kakao'
          ? 'kakao'
          : session.user?.app_metadata?.provider === 'google'
            ? 'google'
            : null
      try {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, session.access_token)
        if (provider) localStorage.setItem(AUTH_PROVIDER_STORAGE_KEY, provider)
      } catch {
        /* ignore */
      }
      return { ok: true, provider: provider ?? 'google', sub: session.user?.id ?? '' }
    }
  }

  return { ok: false, error: 'no_session' }
}

// ------------------------------------------------------------------
// /auth/me / logout
// ------------------------------------------------------------------

export async function getMe() {
  const res = await apiClient.get('/auth/me')
  return res.data?.user ?? null
}

export async function signOut() {
  try {
    const supabase = getSupabaseClient()
    if (supabase) await supabase.auth.signOut()
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    localStorage.removeItem(AUTH_PROVIDER_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

// ------------------------------------------------------------------
// helpers
// ------------------------------------------------------------------

function parseHashParams(hash) {
  if (!hash || hash.length <= 1) return {}
  const h = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new URLSearchParams(h)
  const out = {}
  for (const [k, v] of params.entries()) out[k] = v
  return out
}
