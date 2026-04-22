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
 * - Supabase 클라이언트는 `detectSessionInUrl: true` 로 URL 해시를 비동기 파싱해 세션을 세팅한다.
 * - 다만 `createClient()` 직후 `getSession()` 이 호출되는 경우, 해시 파싱이 아직 끝나지 않아
 *   **일시적으로 null** 이 반환되어 `no_session` 오류로 폴백하는 레이스가 있다.
 *   → `onAuthStateChange` (SIGNED_IN) 를 같이 대기 + 짧은 타임아웃으로 안전하게 세션을 획득한다.
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
  if (!supabase) {
    return { ok: false, error: 'no_session' }
  }

  // `detectSessionInUrl` 파싱 race 대응: 이미 세션이 있으면 즉시, 없으면 SIGNED_IN 이벤트를 잠시 대기.
  const hasCallbackHash = Boolean(
    hashParams.access_token || hashParams.refresh_token || hashParams.code,
  )
  const session = await waitForSession(supabase, {
    timeoutMs: hasCallbackHash ? 5000 : 500,
  })

  if (!session?.access_token) {
    return { ok: false, error: 'no_session' }
  }

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

/**
 * 현재 세션을 기다린다. 이미 존재하면 즉시 반환, 없으면 `onAuthStateChange` 로 SIGNED_IN 을 대기하고
 * 타임아웃이 지나면 한 번 더 `getSession()` 을 확인한 뒤 null.
 *
 * @param {ReturnType<typeof getSupabaseClient>} supabase
 * @param {{ timeoutMs: number }} opts
 */
async function waitForSession(supabase, { timeoutMs }) {
  try {
    const { data } = await supabase.auth.getSession()
    if (data?.session?.access_token) return data.session
  } catch {
    /* fall through */
  }

  return await new Promise((resolve) => {
    let settled = false
    const done = (val) => {
      if (settled) return
      settled = true
      try {
        sub?.subscription?.unsubscribe?.()
      } catch {
        /* ignore */
      }
      clearTimeout(timer)
      resolve(val)
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token) done(session)
      else if (event === 'SIGNED_OUT') done(null)
    })

    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase.auth.getSession()
        done(data?.session ?? null)
      } catch {
        done(null)
      }
    }, timeoutMs)
  })
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
