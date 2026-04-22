import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import { signOut } from '@/api/auth'

const PAGE_BG = {
  background: 'linear-gradient(180deg, #E0F7FA 0%, #F8FAFC 55%, #F0FDFA 100%)',
}

/**
 * /mypage — 프로필/계정 관리. 현재는 **로그인 상태 확인 카드** 를 주 콘텐츠로 사용.
 *
 * 로그인 상태 판정은 **Supabase 세션**(`getSession` + `onAuthStateChange`)을 단일 소스 오브 트루스로 삼는다.
 * (헤더의 `isMockWebSessionLoggedIn` 은 `sessionStorage` 플래그 기반 mock 판정이라 실제 토큰 유무와 어긋날 수 있어
 *  이 페이지에서는 사용하지 않음.)
 */

/** @typedef {'loading'|'signed_in'|'signed_out'|'unconfigured'} AuthUiState */

function MyPage() {
  const navigate = useNavigate()
  /** @type {[AuthUiState, (v: AuthUiState) => void]} */
  const [state, setState] = useState(isSupabaseConfigured() ? 'loading' : 'unconfigured')
  const [session, setSession] = useState(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured()) return undefined
    const supabase = getSupabaseClient()
    if (!supabase) return undefined

    let cancelled = false
    ;(async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (cancelled) return
        const s = data?.session ?? null
        setSession(s)
        setState(s?.access_token ? 'signed_in' : 'signed_out')
      } catch {
        if (!cancelled) setState('signed_out')
      }
    })()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null)
      setState(nextSession?.access_token ? 'signed_in' : 'signed_out')
    })

    return () => {
      cancelled = true
      try {
        sub?.subscription?.unsubscribe?.()
      } catch {
        /* ignore */
      }
    }
  }, [])

  const handleSignOut = useCallback(async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      setSigningOut(false)
    }
  }, [signingOut])

  return (
    <div className="flex min-h-full w-full flex-1 flex-col" style={PAGE_BG}>
      {/* 모바일 */}
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pb-28 pt-6 md:hidden">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600">My page</p>
        <h1 className="mb-4 text-2xl font-extrabold text-gray-900">마이페이지</h1>
        <AuthStatusCard
          state={state}
          session={session}
          signingOut={signingOut}
          onSignOut={handleSignOut}
          onGoLogin={() => navigate('/login')}
        />
      </div>

      {/* 데스크톱 */}
      <div className="mx-auto hidden w-full max-w-5xl flex-1 flex-col px-8 py-12 md:block">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-600">My page</p>
        <h1 className="mb-6 text-3xl font-extrabold text-gray-900">마이페이지</h1>
        <AuthStatusCard
          state={state}
          session={session}
          signingOut={signingOut}
          onSignOut={handleSignOut}
          onGoLogin={() => navigate('/login')}
        />
      </div>
    </div>
  )
}

/**
 * @param {{
 *   state: AuthUiState,
 *   session: any,
 *   signingOut: boolean,
 *   onSignOut: () => void,
 *   onGoLogin: () => void,
 * }} props
 */
function AuthStatusCard({ state, session, signingOut, onSignOut, onGoLogin }) {
  if (state === 'loading') {
    return (
      <section
        aria-busy="true"
        aria-label="로그인 상태 확인 중"
        className="w-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:max-w-xl md:p-6"
      >
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 animate-pulse rounded-full bg-gray-300" aria-hidden />
          <span className="text-sm font-semibold text-gray-500">로그인 상태 확인 중…</span>
        </div>
      </section>
    )
  }

  if (state === 'unconfigured') {
    return (
      <section
        aria-label="로그인 구성 정보"
        className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm md:max-w-xl md:p-6"
      >
        <StatusDot color="amber" label="Supabase 미설정" />
        <p className="mt-3 text-sm leading-relaxed text-amber-900">
          `.env` 의 <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_URL</code> /
          <code className="ml-1 rounded bg-amber-100 px-1">VITE_SUPABASE_ANON_KEY</code> 가 비어 있어
          소셜 로그인 상태를 확인할 수 없습니다.
        </p>
      </section>
    )
  }

  if (state === 'signed_out') {
    return (
      <section
        aria-label="로그인 상태"
        className="w-full rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:max-w-xl md:p-6"
      >
        <StatusDot color="gray" label="로그인되어 있지 않음" />
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          마이페이지의 개인화 기능을 이용하려면 먼저 로그인해 주세요.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onGoLogin}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-600/20 transition hover:from-cyan-600 hover:to-teal-600"
          >
            로그인하러 가기
          </button>
          <Link
            to="/"
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            홈으로
          </Link>
        </div>
      </section>
    )
  }

  const user = session?.user
  const provider = pickProvider(user)
  const email = user?.email || user?.user_metadata?.email || ''
  const name =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.preferred_username ||
    ''
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || ''
  const sub = user?.id || ''
  const expiresAt = session?.expires_at ? new Date(session.expires_at * 1000) : null

  return (
    <section
      aria-label="로그인 상태"
      className="w-full rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm md:max-w-xl md:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <StatusDot color="emerald" label="로그인됨" />
        {provider ? <ProviderBadge provider={provider} /> : null}
      </div>

      <div className="mt-5 flex items-center gap-4">
        <Avatar src={avatarUrl} name={name || email} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-extrabold text-gray-900 md:text-lg">
            {name || email || '이름 없음'}
          </p>
          {email ? (
            <p className="mt-0.5 truncate text-xs text-gray-500 md:text-sm">{email}</p>
          ) : null}
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-3 rounded-xl bg-gray-50/80 p-4 text-xs md:text-sm">
        <InfoRow label="사용자 ID (sub)" value={sub ? shortenSub(sub) : '—'} title={sub} />
        <InfoRow label="프로바이더" value={provider ?? '—'} />
        <InfoRow
          label="세션 만료"
          value={expiresAt ? formatDateTime(expiresAt) : '—'}
          hint={expiresAt ? formatRelative(expiresAt) : ''}
        />
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {signingOut ? '로그아웃 중…' : '로그아웃'}
        </button>
        <Link
          to="/"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          홈으로
        </Link>
      </div>
    </section>
  )
}

function StatusDot({ color, label }) {
  const ringClass =
    color === 'emerald'
      ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]'
      : color === 'amber'
        ? 'bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.18)]'
        : 'bg-gray-400 shadow-[0_0_0_4px_rgba(156,163,175,0.18)]'
  const textClass =
    color === 'emerald'
      ? 'text-emerald-700'
      : color === 'amber'
        ? 'text-amber-800'
        : 'text-gray-600'
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${ringClass}`} aria-hidden />
      <span className={`text-sm font-bold ${textClass}`}>{label}</span>
    </div>
  )
}

function ProviderBadge({ provider }) {
  const isKakao = provider === 'kakao'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
        isKakao ? 'bg-[#FEE500] text-[#191919]' : 'bg-gray-100 text-gray-700'
      }`}
    >
      {isKakao ? (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 3c5.523 0 10 3.582 10 8s-4.477 8-10 8c-.555 0-1.1-.036-1.633-.105L5.5 21.5l.825-3.96C3.93 16.32 2 13.86 2 11c0-4.418 4.477-8 10-8z" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      )}
      {provider}
    </span>
  )
}

function Avatar({ src, name }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?'
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="h-14 w-14 shrink-0 rounded-full border border-gray-100 object-cover md:h-16 md:w-16"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
    )
  }
  return (
    <div
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-xl font-extrabold text-white md:h-16 md:w-16"
      aria-hidden
    >
      {initial}
    </div>
  )
}

function InfoRow({ label, value, hint, title }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-xs font-semibold text-gray-500 md:text-sm">{label}</dt>
      <dd
        className="min-w-0 flex-1 truncate text-right font-mono text-xs text-gray-800 md:text-sm"
        title={title}
      >
        {value}
        {hint ? <span className="ml-2 font-sans text-[10px] text-gray-400 md:text-xs">({hint})</span> : null}
      </dd>
    </div>
  )
}

function pickProvider(user) {
  const p = user?.app_metadata?.provider
  if (p === 'google' || p === 'kakao') return p
  const providers = user?.app_metadata?.providers
  if (Array.isArray(providers)) {
    if (providers.includes('kakao')) return 'kakao'
    if (providers.includes('google')) return 'google'
  }
  return null
}

function shortenSub(sub) {
  if (sub.length <= 12) return sub
  return `${sub.slice(0, 6)}…${sub.slice(-4)}`
}

function formatDateTime(d) {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return d.toISOString()
  }
}

function formatRelative(target) {
  const diffMs = target.getTime() - Date.now()
  const abs = Math.abs(diffMs)
  const mins = Math.round(abs / 60000)
  if (mins < 1) return diffMs >= 0 ? '곧 만료' : '만료됨'
  if (mins < 60) return diffMs >= 0 ? `${mins}분 후` : `${mins}분 전`
  const hours = Math.round(mins / 60)
  if (hours < 24) return diffMs >= 0 ? `${hours}시간 후` : `${hours}시간 전`
  const days = Math.round(hours / 24)
  return diffMs >= 0 ? `${days}일 후` : `${days}일 전`
}

export default MyPage
