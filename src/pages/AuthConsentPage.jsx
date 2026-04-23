import { useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BrandLogo from '@/components/common/BrandLogo'
import LegalConsentForm from '@/components/auth/LegalConsentForm'
import {
  AUTH_CONSENT_PREVIEW_PARAM,
  FEATURE_PROFILE_ONBOARDING_ENABLED,
  getActiveOnboardingSubject,
  getAuthConsentEntryRedirect,
  getOrCreateMockOAuthSubject,
  markLegalConsentAccepted,
  SESSION_LAST_SOCIAL_PROVIDER,
} from '@/utils/onboardingGate'
import { acceptLegalConsent } from '@/api/users'

/**
 * 소셜 로그인 직후 — 이용약관·개인정보 동의 (필수) 후 홈 또는(온보딩 켜짐 시) 프로필 온보딩으로 이동.
 * `?preview=1`: 레이아웃 작업용(자동 리다이렉트 없음, 임시 세션만 설정).
 */
export default function AuthConsentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isLayoutPreview = searchParams.get(AUTH_CONSENT_PREVIEW_PARAM) === '1'

  useEffect(() => {
    if (isLayoutPreview) {
      if (!sessionStorage.getItem(SESSION_LAST_SOCIAL_PROVIDER)) {
        sessionStorage.setItem(SESSION_LAST_SOCIAL_PROVIDER, 'google')
      }
      getOrCreateMockOAuthSubject('google')
      return
    }
    const r = getAuthConsentEntryRedirect()
    if (r === 'login') navigate('/login', { replace: true })
    else if (r === 'home') navigate('/', { replace: true })
    else if (r === 'onboarding') navigate('/onboarding', { replace: true })
  }, [navigate, isLayoutPreview])

  const handleContinue = useCallback(({ marketingOptIn }) => {
    const sub = getActiveOnboardingSubject()
    if (!sub) {
      navigate('/login', { replace: true })
      return
    }
    markLegalConsentAccepted(sub, { marketingOptIn: Boolean(marketingOptIn) })
    acceptLegalConsent({ marketingOptIn: Boolean(marketingOptIn) }).catch(() => {})
    navigate(FEATURE_PROFILE_ONBOARDING_ENABLED ? '/onboarding' : '/', { replace: true })
  }, [navigate])

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-x-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 85% at 50% -15%, rgba(34, 211, 238, 0.18), transparent 52%),
            radial-gradient(ellipse 70% 50% at 100% 85%, rgba(45, 212, 191, 0.12), transparent 55%),
            linear-gradient(180deg, #f0fdfa 0%, #f8fafc 45%, #ecfeff 100%)
          `,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-8 pb-12 md:px-6 md:py-10">
        <header className="mb-6 text-center">
          <div className="flex justify-center">
            <BrandLogo className="h-8 w-auto md:h-9" alt="CHECKMATE" />
          </div>
          <h1 className="mt-5 text-lg font-extrabold tracking-tight text-gray-900 md:text-xl">
            서비스 이용을 위해
            <br />
            약관에 동의해 주세요
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {FEATURE_PROFILE_ONBOARDING_ENABLED
              ? '필수 항목에 동의하시면 프로필 입력 단계로 이동합니다.'
              : '필수 항목에 동의하시면 서비스를 바로 이용하실 수 있어요.'}
          </p>
        </header>

        <LegalConsentForm onContinue={handleContinue} />
      </div>
    </div>
  )
}
