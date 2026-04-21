import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import loginCheckmateBrandUrl from '@/assets/login-checkmate-brand.png'
import { resolvePostSocialLoginPath } from '@/utils/onboardingGate'
import { startGoogleLogin, startKakaoLogin } from '@/api/auth'
import { isSupabaseConfigured } from '@/lib/supabase'

/**
 * UI 보관용 플래그 — 이메일 로그인·비밀번호 찾기·회원가입 링크를 다시 켤 때 true로 변경.
 * (코드 삭제 없이 숨김 처리)
 */
const SHOW_EMAIL_LOGIN = false
const SHOW_FORGOT_PASSWORD_MODAL = false
const SHOW_SIGNUP_LINK = false

/** 로그인 폼용 기본 비밀번호 규칙: 8자 이상, 영문 1자 이상, 숫자 1자 이상 */
const PASSWORD_HINT = '8자 이상, 영문과 숫자를 각각 1자 이상 포함해 주세요.'

function isPasswordValid(value) {
  if (value.length < 8) return false
  if (!/[A-Za-z]/.test(value)) return false
  if (!/\d/.test(value)) return false
  return true
}

function isEmailShape(value) {
  const v = value.trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

/**
 * LoginPage — 중앙 정렬 단일 컬럼(브랜딩 → 카피 → SNS), 체크메이트 톤 배경.
 * 인증 연동 전: 이메일 폼 제출 시 홈으로 이동(플레이스홀더).
 */
function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotPhase, setForgotPhase] = useState('form')
  const [forgotError, setForgotError] = useState('')
  const [socialError, setSocialError] = useState('')
  const [socialPending, setSocialPending] = useState('')
  const forgotEmailInputRef = useRef(null)
  const forgotTitleId = useId()
  const forgotDescId = useId()

  /**
   * 소셜 로그인 핸들러 — Supabase env 가 있으면 실제 OAuth, 없으면 기존 mock 경로로 폴백.
   * (env 없이 UI 작업 중인 팀원이 막히지 않도록 폴백 유지)
   */
  const handleSocialLogin = useCallback(
    async (provider) => {
      if (socialPending) return
      setSocialError('')

      // Google/Kakao: Supabase 필요. 미설정이면 기존 플레이스홀더 동작(이동)으로 폴백.
      if (!isSupabaseConfigured()) {
        navigate(resolvePostSocialLoginPath(provider))
        return
      }

      setSocialPending(provider)
      try {
        if (provider === 'google') await startGoogleLogin()
        else if (provider === 'kakao') await startKakaoLogin()
      } catch (err) {
        setSocialError(err?.message || '로그인을 시작하지 못했습니다.')
        setSocialPending('')
      }
    },
    [navigate, socialPending],
  )

  const closeForgotModal = useCallback(() => {
    setForgotOpen(false)
    setForgotPhase('form')
    setForgotEmail('')
    setForgotError('')
  }, [])

  const openForgotModal = useCallback(() => {
    setForgotOpen(true)
    setForgotPhase('form')
    setForgotError('')
    setForgotEmail('')
  }, [])

  useEffect(() => {
    if (!forgotOpen) return undefined
    const t = window.setTimeout(() => forgotEmailInputRef.current?.focus(), 50)
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeForgotModal()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [forgotOpen, closeForgotModal])

  const handleForgotSubmit = (e) => {
    e.preventDefault()
    if (!isEmailShape(forgotEmail)) {
      setForgotError('올바른 이메일 주소를 입력해 주세요.')
      return
    }
    setForgotError('')
    // TODO: Supabase Auth `resetPasswordForEmail` 등 연동
    setForgotPhase('sent')
  }

  const handleLogin = (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const password = form.password?.value ?? ''
    if (!isPasswordValid(password)) {
      setPasswordError(PASSWORD_HINT)
      form.password?.focus()
      return
    }
    setPasswordError('')
    // TODO: Supabase Auth 연동 후 실제 로그인 처리
    navigate('/')
  }

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col items-center justify-center overflow-hidden">
      {/* 체크메이트 톤: 시안·틸 그라데이션 + 상단/모서리 소프트 글로우 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 85% at 50% -15%, rgba(34, 211, 238, 0.22), transparent 52%),
            radial-gradient(ellipse 70% 50% at 100% 85%, rgba(45, 212, 191, 0.14), transparent 55%),
            radial-gradient(ellipse 60% 45% at 0% 60%, rgba(6, 182, 212, 0.1), transparent 50%),
            linear-gradient(180deg, #f0fdfa 0%, #f8fafc 46%, #ecfeff 100%)
          `,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-4 py-10 md:px-8 md:py-12">
        <form
          onSubmit={SHOW_EMAIL_LOGIN ? handleLogin : (e) => e.preventDefault()}
          className="w-full max-w-[min(100%,460px)] shrink-0"
        >
          {/* 브랜딩: 체크메이트 로고 락업(PNG) + 한 줄 태그 — 배경 위에 직접 배치 (카드 박스 없음) */}
          <div className="flex flex-col items-center text-center">
            <img
              src={loginCheckmateBrandUrl}
              alt="CHECKMATE"
              decoding="async"
              className="h-auto w-auto max-h-[11rem] max-w-[min(100%,280px)] object-contain object-center drop-shadow-md md:max-h-[12.5rem] md:max-w-[min(100%,320px)]"
            />
            <p className="mt-6 text-sm font-semibold tracking-tight text-cyan-800 md:mt-7 md:text-base">
              골라 담고 · 체크하고 · 떠나자!
            </p>
          </div>

          <div className="mt-10 text-center md:mt-12">
            <p className="text-lg font-semibold leading-snug text-gray-900 md:text-xl lg:text-2xl">
              복잡한 준비는 줄이고, 설렘은 올리고
              <br />
              나만의 여행 준비 메이트
            </p>
          </div>

            {SHOW_EMAIL_LOGIN ? (
            <div className="mt-10 flex flex-col gap-5 md:mt-12">
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold text-gray-600 md:text-sm">
                  이메일 주소
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="example@email.com"
                  className="w-full rounded-xl border border-cyan-100 bg-cyan-50/40 px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 md:border-gray-200 md:bg-white md:focus:border-cyan-500 md:focus:ring-cyan-500/25"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold text-gray-600 md:text-sm">
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    minLength={8}
                    pattern="^(?=.*[A-Za-z])(?=.*\d).{8,}$"
                    title={PASSWORD_HINT}
                    placeholder="••••••••"
                    aria-invalid={passwordError ? 'true' : 'false'}
                    aria-describedby={
                      passwordError ? 'login-password-hint login-password-error' : 'login-password-hint'
                    }
                    onChange={() => passwordError && setPasswordError('')}
                    onBlur={(ev) => {
                      const v = ev.target.value
                      if (v && !isPasswordValid(v)) setPasswordError(PASSWORD_HINT)
                      else if (isPasswordValid(v)) setPasswordError('')
                    }}
                    className="w-full rounded-xl border border-cyan-100 bg-cyan-50/40 py-3 pl-3.5 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 md:border-gray-200 md:bg-white md:focus:border-cyan-500 md:focus:ring-cyan-500/25"
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                    aria-pressed={showPassword}
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.4 10.4 0 0 1 12 5c4.5 0 8.3 2.7 10 6.5a11.4 11.4 0 0 1-4.6 5.3M6.3 6.3C4.2 7.9 2.7 10.1 2 12.5 3.7 16.3 7.5 19 12 19c1.2 0 2.4-.2 3.5-.6" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {!passwordError ? (
                  <p id="login-password-hint" className="mt-1.5 text-xs text-gray-500">
                    {PASSWORD_HINT}
                  </p>
                ) : (
                  <p id="login-password-hint" className="sr-only">
                    {PASSWORD_HINT}
                  </p>
                )}
                {passwordError ? (
                  <p id="login-password-error" role="alert" className="mt-1 text-xs font-medium text-red-600">
                    {passwordError}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-gray-700">
                  <input type="checkbox" name="remember" className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500" />
                  <span className="md:hidden">로그인 상태 유지</span>
                  <span className="hidden md:inline">자동 로그인</span>
                </label>
                <button
                  type="button"
                  className="font-semibold text-cyan-600 underline-offset-2 hover:text-cyan-700 hover:underline"
                  onClick={openForgotModal}
                >
                  비밀번호 찾기
                </button>
              </div>

              <button
                type="submit"
                className="mt-1 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-3.5 text-sm font-bold text-white shadow-md shadow-cyan-600/25 transition hover:from-cyan-600 hover:to-teal-600 md:shadow-lg md:shadow-cyan-600/20"
              >
                로그인
              </button>
            </div>
            ) : null}

            {SHOW_EMAIL_LOGIN ? (
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-cyan-900/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#f0fdfa] px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  간편 로그인
                </span>
              </div>
            </div>
            ) : null}

            <div className="mt-10 flex flex-col gap-3 md:mt-12">
              <button
                type="button"
                disabled={Boolean(socialPending)}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-200/90 bg-white py-4 text-base font-bold text-gray-900 shadow-sm transition hover:border-gray-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => handleSocialLogin('google')}
              >
                <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google로 시작하기
              </button>
              <button
                type="button"
                disabled={Boolean(socialPending)}
                className="flex w-full items-center justify-center gap-3 rounded-full bg-[#FEE500] py-4 text-base font-bold text-[#191919] shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => handleSocialLogin('kakao')}
              >
                <svg className="h-6 w-6 shrink-0 text-[#191919]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 3c5.523 0 10 3.582 10 8s-4.477 8-10 8c-.555 0-1.1-.036-1.633-.105L5.5 21.5l.825-3.96C3.93 16.32 2 13.86 2 11c0-4.418 4.477-8 10-8z" />
                </svg>
                Kakao로 시작하기
              </button>
            </div>

            {socialError ? (
              <p role="alert" className="mt-4 text-center text-xs font-medium text-red-600">
                {socialError}
              </p>
            ) : null}

            {SHOW_SIGNUP_LINK ? (
            <p className="mt-10 text-center text-base text-gray-600">
              <span className="md:hidden">처음이신가요? </span>
              <span className="hidden md:inline">아직 계정이 없으신가요? </span>
              <Link to="/signup" className="font-bold text-cyan-600 hover:text-cyan-700 hover:underline">
                회원가입
              </Link>
            </p>
            ) : null}
        </form>

        {SHOW_FORGOT_PASSWORD_MODAL && forgotOpen ? (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <button
              type="button"
              className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
              aria-label="모달 닫기"
              onClick={closeForgotModal}
            />
            <div
              className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl border border-gray-100 bg-white shadow-2xl sm:max-h-[min(90vh,640px)] sm:rounded-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby={forgotTitleId}
              aria-describedby={forgotDescId}
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h2 id={forgotTitleId} className="text-lg font-extrabold text-gray-900">
                  비밀번호 찾기
                </h2>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                  aria-label="닫기"
                  onClick={closeForgotModal}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto px-5 py-5">
                {forgotPhase === 'form' ? (
                  <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                    <p id={forgotDescId} className="text-sm leading-relaxed text-gray-600">
                      가입 시 사용한 이메일을 입력하시면, 비밀번호 재설정 안내 메일을 보내 드립니다. 메일이 오지 않으면 스팸함을 확인해 주세요.
                    </p>
                    <div>
                      <label htmlFor="forgot-email" className="mb-1.5 block text-xs font-semibold text-gray-600">
                        이메일 주소
                      </label>
                      <input
                        ref={forgotEmailInputRef}
                        id="forgot-email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        value={forgotEmail}
                        onChange={(ev) => {
                          setForgotEmail(ev.target.value)
                          if (forgotError) setForgotError('')
                        }}
                        placeholder="example@email.com"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/25"
                      />
                      {forgotError ? (
                        <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
                          {forgotError}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="submit"
                      className="mt-1 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-3 text-sm font-bold text-white shadow-md shadow-cyan-600/20 transition hover:from-cyan-600 hover:to-teal-600"
                    >
                      재설정 링크 보내기
                    </button>
                  </form>
                ) : (
                  <div className="flex flex-col gap-4">
                    <p id={forgotDescId} className="text-sm leading-relaxed text-gray-600">
                      <span className="font-semibold text-cyan-700">{forgotEmail.trim()}</span>로 비밀번호 재설정 안내를 보냈습니다. 링크는 일정 시간 후 만료될 수 있습니다.
                    </p>
                    <p className="text-xs text-gray-500">
                      실제 메일 발송은 서버 연동 후 동작합니다. (현재는 화면 안내용 데모입니다.)
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        className="rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:px-4"
                        onClick={() => {
                          setForgotPhase('form')
                          setForgotError('')
                          window.setTimeout(() => forgotEmailInputRef.current?.focus(), 0)
                        }}
                      >
                        다른 이메일로 시도
                      </button>
                      <button
                        type="button"
                        className="rounded-xl bg-cyan-600 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-700 sm:px-5"
                        onClick={closeForgotModal}
                      >
                        확인
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default LoginPage
