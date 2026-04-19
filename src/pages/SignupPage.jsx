import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import loginSideMascotUrl from '@/assets/login-side-mascot.png'

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
 * SignupPage — 로그인과 동일 카드·틸 패널·모바일 마스코트 배치.
 * 인증 연동 전: 제출 시 로그인 페이지로 이동(플레이스홀더).
 */
function SignupPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showPassword2, setShowPassword2] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [password2Error, setPassword2Error] = useState('')
  const [termsError, setTermsError] = useState('')

  const handleSignup = (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const email = form.email?.value ?? ''
    const password = form.password?.value ?? ''
    const password2 = form.passwordConfirm?.value ?? ''
    const terms = form.terms?.checked

    setEmailError('')
    setPasswordError('')
    setPassword2Error('')
    setTermsError('')

    if (!isEmailShape(email)) {
      setEmailError('올바른 이메일 주소를 입력해 주세요.')
      form.email?.focus()
      return
    }
    if (!isPasswordValid(password)) {
      setPasswordError(PASSWORD_HINT)
      form.password?.focus()
      return
    }
    if (password !== password2) {
      setPassword2Error('비밀번호가 일치하지 않습니다.')
      form.passwordConfirm?.focus()
      return
    }
    if (!terms) {
      setTermsError('이용약관 및 개인정보 처리방침에 동의해 주세요.')
      return
    }

    // TODO: Supabase Auth `signUp` 등 연동
    navigate('/login')
  }

  return (
    <div
      className="flex min-h-full w-full flex-1 flex-col"
      style={{
        background: 'linear-gradient(180deg, #f0fdfa 0%, #f8fafc 45%, #ecfeff 100%)',
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 pb-12 md:px-6 md:py-12 md:pb-16">
        <form
          onSubmit={handleSignup}
          className="mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-hidden rounded-2xl border border-cyan-100/80 bg-white shadow-lg shadow-cyan-900/5 md:min-h-[min(560px,calc(100vh-8rem))] md:flex-row md:rounded-3xl md:shadow-xl"
        >
          <aside className="relative hidden w-full shrink-0 flex-col bg-gradient-to-br from-cyan-500 via-teal-500 to-teal-600 p-8 text-white md:flex md:w-[42%] md:p-10">
            <div>
              <div className="mb-8 flex items-center gap-2 text-white/95">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" strokeLinecap="round" />
                    <path d="m16 8-4 4-2-2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
              <h1 className="text-2xl font-extrabold leading-snug tracking-tight lg:text-3xl">
                여행 준비, 첫걸음은 가입부터
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-teal-50/95">
                무료로 시작하고 일정과 체크리스트를 저장해 두었다가, 출발 전에 다시 꺼내 보세요.
              </p>
              <div className="mt-28 flex w-full justify-center lg:mt-36">
                <img
                  src={loginSideMascotUrl}
                  alt=""
                  role="presentation"
                  decoding="async"
                  className="max-h-[min(220px,32vh)] w-auto max-w-[min(100%,200px)] object-contain drop-shadow-md"
                />
              </div>
            </div>
          </aside>

          <div className="flex flex-1 flex-col px-5 py-8 md:w-[58%] md:px-10 md:py-10 lg:px-12">
            <div className="mb-8 flex items-start justify-between gap-2 md:hidden">
              <div className="min-w-0 flex-1 pr-0 pt-0.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">회원가입</h1>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  계정을 만들고
                  <br />
                  체크메이트와 함께해요.
                </p>
              </div>
              <img
                src={loginSideMascotUrl}
                alt=""
                role="presentation"
                decoding="async"
                className="h-[88px] w-auto shrink-0 -translate-x-5 -translate-y-1 object-contain sm:h-[100px] sm:-translate-x-6"
              />
            </div>

            <div className="mb-8 hidden md:block">
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 lg:text-3xl">회원가입</h1>
              <p className="mt-2 text-sm text-gray-600 lg:text-base">이메일로 가입하고 여행 계획을 저장해 보세요.</p>
            </div>

            <div className="flex flex-1 flex-col gap-4 md:gap-5">
              <div>
                <label htmlFor="signup-name" className="mb-1.5 block text-xs font-semibold text-gray-600 md:text-sm">
                  이름 (닉네임)
                </label>
                <input
                  id="signup-name"
                  name="displayName"
                  type="text"
                  autoComplete="nickname"
                  placeholder="여행에서 쓸 이름"
                  className="w-full rounded-xl border border-cyan-100 bg-cyan-50/40 px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 md:border-gray-200 md:bg-white md:focus:border-cyan-500 md:focus:ring-cyan-500/25"
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="mb-1.5 block text-xs font-semibold text-gray-600 md:text-sm">
                  이메일 주소
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="example@email.com"
                  aria-invalid={emailError ? 'true' : 'false'}
                  onChange={() => emailError && setEmailError('')}
                  className="w-full rounded-xl border border-cyan-100 bg-cyan-50/40 px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 md:border-gray-200 md:bg-white md:focus:border-cyan-500 md:focus:ring-cyan-500/25"
                />
                {emailError ? (
                  <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                    {emailError}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="signup-password" className="mb-1.5 block text-xs font-semibold text-gray-600 md:text-sm">
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    pattern="^(?=.*[A-Za-z])(?=.*\d).{8,}$"
                    title={PASSWORD_HINT}
                    placeholder="••••••••"
                    aria-invalid={passwordError ? 'true' : 'false'}
                    aria-describedby={passwordError ? 'signup-password-hint signup-password-error' : 'signup-password-hint'}
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
                  <p id="signup-password-hint" className="mt-1.5 text-xs text-gray-500">
                    {PASSWORD_HINT}
                  </p>
                ) : (
                  <p id="signup-password-hint" className="sr-only">
                    {PASSWORD_HINT}
                  </p>
                )}
                {passwordError ? (
                  <p id="signup-password-error" role="alert" className="mt-1 text-xs font-medium text-red-600">
                    {passwordError}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="signup-password-confirm" className="mb-1.5 block text-xs font-semibold text-gray-600 md:text-sm">
                  비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    id="signup-password-confirm"
                    name="passwordConfirm"
                    type={showPassword2 ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    aria-invalid={password2Error ? 'true' : 'false'}
                    aria-describedby={password2Error ? 'signup-password2-error' : undefined}
                    onChange={() => password2Error && setPassword2Error('')}
                    className="w-full rounded-xl border border-cyan-100 bg-cyan-50/40 py-3 pl-3.5 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 md:border-gray-200 md:bg-white md:focus:border-cyan-500 md:focus:ring-cyan-500/25"
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                    aria-pressed={showPassword2}
                    aria-label={showPassword2 ? '비밀번호 확인 숨기기' : '비밀번호 확인 보기'}
                    onClick={() => setShowPassword2((s) => !s)}
                  >
                    {showPassword2 ? (
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
                {password2Error ? (
                  <p id="signup-password2-error" role="alert" className="mt-1 text-xs font-medium text-red-600">
                    {password2Error}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
                  <input
                    id="signup-terms"
                    name="terms"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>
                    <span className="font-semibold text-cyan-700">이용약관</span>
                    {' 및 '}
                    <span className="font-semibold text-cyan-700">개인정보 처리방침</span>
                    에 동의합니다. (필수){' '}
                    <span className="text-xs text-gray-400">(정책 페이지 연동 예정)</span>
                  </span>
                </label>
                {termsError ? (
                  <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                    {termsError}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                className="mt-1 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-3.5 text-sm font-bold text-white shadow-md shadow-cyan-600/25 transition hover:from-cyan-600 hover:to-teal-600 md:shadow-lg md:shadow-cyan-600/20"
              >
                가입하기
              </button>
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">간편 가입</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:flex md:gap-3">
              <button
                type="button"
                className="order-2 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-800 shadow-sm transition hover:border-gray-300 md:order-1 md:flex-1"
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
                className="order-1 flex items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3 text-sm font-bold text-[#191919] shadow-sm transition hover:brightness-95 md:order-2 md:flex-1"
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

            <p className="mt-8 text-center text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="font-bold text-cyan-600 hover:text-cyan-700 hover:underline">
                로그인
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignupPage
