import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import loginSideMascotUrl from '@/assets/login-side-mascot.png'

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
 * LoginPage — 웹은 좌측 브랜드 패널 + 우측 폼 카드, 모바일은 단일 컬럼.
 * 인증 연동 전: 폼 제출 시 홈으로 이동(플레이스홀더).
 */
function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotPhase, setForgotPhase] = useState('form')
  const [forgotError, setForgotError] = useState('')
  const forgotEmailInputRef = useRef(null)
  const forgotTitleId = useId()
  const forgotDescId = useId()

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
    <div
      className="flex min-h-0 w-full flex-1 flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(180deg, #f0fdfa 0%, #f8fafc 45%, #ecfeff 100%)',
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-4 py-6 md:px-6 md:py-8">
        <form
          onSubmit={SHOW_EMAIL_LOGIN ? handleLogin : (e) => e.preventDefault()}
          className="mx-auto w-full max-w-5xl shrink-0 overflow-hidden rounded-2xl border border-cyan-100/80 bg-white shadow-lg shadow-cyan-900/5 md:flex md:flex-row md:rounded-3xl md:shadow-xl"
        >
          {/* 데스크톱: 좌측 정보 패널 */}
          <aside className="relative hidden w-full shrink-0 flex-col bg-gradient-to-br from-cyan-500 via-teal-500 to-teal-600 p-6 text-white md:flex md:w-[42%] md:p-8">
            <div>
              <div className="mb-4 flex items-center gap-2 text-white/95">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" strokeLinecap="round" />
                    <path d="m16 8-4 4-2-2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
              <h1 className="text-xl font-extrabold leading-snug tracking-tight lg:text-2xl">
                더 체계적인 여행 준비의 시작
              </h1>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-teal-50/95">
                일정·체크리스트·가이드를 한곳에서 정리하고, 출발 전 놓치는 준비를 줄여 보세요.
              </p>
              <div className="mt-6 flex w-full justify-center lg:mt-8">
                <img
                  src={loginSideMascotUrl}
                  alt=""
                  role="presentation"
                  decoding="async"
                  className="max-h-[min(112px,18vh)] w-auto max-w-[min(100%,160px)] object-contain drop-shadow-md"
                />
              </div>
            </div>
          </aside>

          {/* 폼 영역: 모바일 전체 / 데스크톱 우측 */}
          <div className="flex flex-col px-5 py-5 md:w-[58%] md:px-8 md:py-6 lg:px-10">
            {/* 모바일 타이틀 블록 — 텍스트 왼쪽, 마스코트 오른쪽 위 */}
            <div className="mb-4 flex items-start justify-between gap-2 md:hidden">
              <div className="min-w-0 flex-1 pr-0 pt-0.5">
                <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
                  반가워요!
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  완벽한 여행 준비의 시작,
                  <br />
                  체크메이트와 함께하세요.
                </p>
              </div>
              <img
                src={loginSideMascotUrl}
                alt=""
                role="presentation"
                decoding="async"
                className="h-[72px] w-auto shrink-0 -translate-x-5 -translate-y-1 object-contain sm:h-20 sm:-translate-x-6"
              />
            </div>

            {/* 데스크톱 타이틀 */}
            <div className="mb-4 hidden md:block">
              <h1 className="text-xl font-extrabold tracking-tight text-gray-900 lg:text-2xl">
                반가워요!
              </h1>
              <p className="mt-2 text-sm text-gray-600 lg:text-base">
                {SHOW_EMAIL_LOGIN
                  ? '계정에 로그인하여 여행 계획을 관리하세요.'
                  : 'SNS 계정으로 로그인하여 여행 계획을 관리하세요.'}
              </p>
            </div>

            {SHOW_EMAIL_LOGIN ? (
            <div className="flex flex-1 flex-col gap-5">
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
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">간편 로그인</span>
              </div>
            </div>
            ) : (
              <p className="mb-2 mt-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-400 md:mb-3 md:mt-0 md:text-left">
                SNS 로그인
              </p>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-800 shadow-sm transition hover:border-gray-300"
                onClick={() => {
                  // TODO: Google OAuth
                }}
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                구글 로그인
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#03C75A] py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95"
                onClick={() => {
                  // TODO: Naver OAuth
                }}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white text-sm font-black text-[#03C75A]" aria-hidden="true">
                  N
                </span>
                네이버 로그인
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3 text-sm font-bold text-[#191919] shadow-sm transition hover:brightness-95"
                onClick={() => {
                  // TODO: Kakao OAuth
                }}
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 3c5.523 0 10 3.582 10 8s-4.477 8-10 8c-.555 0-1.1-.036-1.633-.105L5.5 21.5l.825-3.96C3.93 16.32 2 13.86 2 11c0-4.418 4.477-8 10-8z" />
                </svg>
                카카오 로그인
              </button>
            </div>

            {SHOW_SIGNUP_LINK ? (
            <p className="mt-8 text-center text-sm text-gray-600">
              <span className="md:hidden">처음이신가요? </span>
              <span className="hidden md:inline">아직 계정이 없으신가요? </span>
              <Link to="/signup" className="font-bold text-cyan-600 hover:text-cyan-700 hover:underline">
                회원가입
              </Link>
            </p>
            ) : null}
          </div>
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
