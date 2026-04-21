import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandLogo from '@/components/common/BrandLogo'
import { consumeAuthCallback } from '@/api/auth'
import {
  AUTH_CONSENT_PATH,
  SESSION_LAST_SOCIAL_PROVIDER,
  hasAcceptedLegalConsent,
  hasCompletedOnboarding,
} from '@/utils/onboardingGate'

/**
 * /auth/callback — Google/Kakao 소셜 로그인(Supabase Auth) 콜백 처리.
 *
 * 흐름:
 *   1. Supabase 세션에서 access_token + provider + sub 추출 (`consumeAuthCallback`).
 *   2. sub 를 `onboardingGate` 의 mock sub 위치(localStorage) 에 덮어씀 →
 *      기존 게이트 유틸(`hasCompletedOnboarding`, `hasAcceptedLegalConsent`)이 **그대로** 실 사용자용으로 작동.
 *   3. 기존/신규 사용자 분기: 온보딩 완료 → /, 약관 미동의 → /auth/consent, 약관만 OK → /onboarding.
 *
 * 이 페이지는 팀원 작업 중인 `AuthConsentPage.jsx` / `onboardingGate.js` 를 **수정하지 않고** 동일 계약을 재사용.
 */

const ONBOARDING_MOCK_SUB_KEY = (provider) => `checkmate:mock_oauth_sub:${provider}`

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const ranRef = useRef(false)
  const [status, setStatus] = useState('processing')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    let alive = true
    ;(async () => {
      const result = await consumeAuthCallback()
      if (!alive) return

      if (!result.ok) {
        setStatus('error')
        setErrorMessage(mapCallbackError(result.error))
        return
      }

      const { provider, sub } = result

      // 기존 프론트 게이트(`onboardingGate.js`) 와 호환되도록 실제 sub 를
      // mock sub 슬롯에 주입. 이 한 줄 덕분에 `AuthConsentPage` / `OnboardingProfilePage` 는 수정 불필요.
      try {
        if (sub) localStorage.setItem(ONBOARDING_MOCK_SUB_KEY(provider), sub)
        sessionStorage.setItem(SESSION_LAST_SOCIAL_PROVIDER, provider)
        // URL hash 정리 (토큰 노출 방지)
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search)
        }
      } catch {
        /* storage access issues: 무시 */
      }

      const next = resolveNext(sub)
      navigate(next, { replace: true })
    })()

    return () => {
      alive = false
    }
  }, [navigate])

  if (status === 'error') {
    return (
      <div className="relative flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-hidden">
        <BackgroundGlow />
        <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-10 text-center">
          <BrandLogo className="h-10 w-auto md:h-12" alt="CHECKMATE" />
          <h1 className="mt-2 text-lg font-extrabold tracking-tight text-gray-900 md:text-xl">
            로그인을 완료하지 못했어요
          </h1>
          <p className="text-sm leading-relaxed text-gray-600">{errorMessage}</p>
          <button
            type="button"
            className="mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-cyan-600/20 transition hover:from-cyan-600 hover:to-teal-600"
            onClick={() => navigate('/login', { replace: true })}
          >
            로그인 화면으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-hidden">
      <BackgroundGlow />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center gap-5 px-4 py-10 text-center">
        <BrandLogo className="h-10 w-auto md:h-12" alt="CHECKMATE" />
        <div
          aria-hidden
          className="mt-1 h-10 w-10 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-500"
        />
        <p className="text-base font-semibold text-gray-800">로그인 처리 중…</p>
        <p className="text-xs text-gray-500">잠시만 기다려 주세요.</p>
      </div>
    </div>
  )
}

function resolveNext(sub) {
  if (!sub) return AUTH_CONSENT_PATH
  if (hasCompletedOnboarding(sub)) return '/'
  if (!hasAcceptedLegalConsent(sub)) return AUTH_CONSENT_PATH
  return '/onboarding'
}

function mapCallbackError(code) {
  switch (code) {
    case 'no_session':
      return '세션을 확인할 수 없습니다. 다시 시도해 주세요.'
    case 'invalid_state':
      return '인증 요청이 만료되었거나 일치하지 않습니다. 다시 시도해 주세요.'
    case 'storage_unavailable':
      return '브라우저 저장소에 접근할 수 없어 로그인 상태를 유지할 수 없습니다.'
    default:
      return code ? `오류: ${code}` : '알 수 없는 오류가 발생했습니다.'
  }
}

function BackgroundGlow() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background: `
          radial-gradient(ellipse 120% 85% at 50% -15%, rgba(34, 211, 238, 0.22), transparent 52%),
          radial-gradient(ellipse 70% 50% at 100% 85%, rgba(45, 212, 191, 0.14), transparent 55%),
          linear-gradient(180deg, #f0fdfa 0%, #f8fafc 46%, #ecfeff 100%)
        `,
      }}
      aria-hidden="true"
    />
  )
}
