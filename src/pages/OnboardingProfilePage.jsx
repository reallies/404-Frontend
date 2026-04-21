import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import step3DesktopMascotUrl from '@/assets/step3-desktop-mascot.png'
import onboardingFinishMascotUrl from '@/assets/onboarding-finish-mascot.png'
import BrandLogo from '@/components/common/BrandLogo'
import OnboardingBirthCalendar from '@/components/onboarding/OnboardingBirthCalendar'
import OnboardingCustomSelect from '@/components/onboarding/OnboardingCustomSelect'
import {
  AUTH_CONSENT_PATH,
  getActiveOnboardingSubject,
  getOnboardingEntryRedirect,
  markOnboardingComplete,
} from '@/utils/onboardingGate'

/** 국적 / 여권 발급국 공통 목록 (ISO 코드) */
const COUNTRY_OPTIONS = [
  { value: 'KR', label: '대한민국' },
  { value: 'US', label: '미국' },
  { value: 'JP', label: '일본' },
  { value: 'CN', label: '중국' },
  { value: 'TW', label: '대만' },
  { value: 'VN', label: '베트남' },
  { value: 'TH', label: '태국' },
  { value: 'GB', label: '영국' },
  { value: 'DE', label: '독일' },
  { value: 'FR', label: '프랑스' },
  { value: 'OTHER', label: '기타' },
]

/** 온보딩 마지막「체크메이트 시작하기」 */
const ONBOARDING_FINISH_BTN_CLASS =
  'mt-8 w-full rounded-xl bg-amber-400 py-4 text-base font-bold text-gray-900 shadow-lg shadow-amber-900/15 transition hover:bg-amber-500 hover:shadow-md disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none'

function parseIsoDate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

function isoToLabel(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${y}년 ${parseInt(m, 10)}월 ${parseInt(d, 10)}일`
}

/**
 * 여권 국가 선택: 열린 listbox 내부·`data-onboarding-next` 버튼은 그대로 둠
 */
function handleEnterToAdvanceSection(e, canProceed, advance) {
  if (e.key !== 'Enter' || e.repeat) return
  if (e.nativeEvent?.isComposing) return
  const el = e.target
  if (typeof el?.closest === 'function') {
    if (el.closest('[data-onboarding-next]')) return
    if (el.closest('[role="listbox"]')) return
  }
  if (!canProceed) return
  e.preventDefault()
  advance()
}

/** 섹션 입력이 조건을 만족할 때 표시하는 완료 피드백 */
function SectionInputConfirmed({ show, align = 'start' }) {
  if (!show) return null
  const justify = align === 'center' ? 'justify-center' : 'justify-start'
  return (
    <p className={`mt-3 flex items-center gap-1.5 text-sm font-medium text-cyan-600 ${justify}`} role="status">
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 12.5l2.5 2.5L15 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      </svg>
      입력이 확인되었어요
    </p>
  )
}

/**
 * 소셜 로그인 직후 1회 프로필 수집 — **성별·생년월일** → **여권에 기재된 국가**.
 * 섹션은 순차적으로만 펼쳐지며(@formkit/auto-animate), 이전 단계는 살짝 흐리게.
 */
export default function OnboardingProfilePage() {
  const navigate = useNavigate()
  const [listRef] = useAutoAnimate({ duration: 320, easing: 'ease-out' })

  const [gender, setGender] = useState('')
  const [birthDate, setBirthDate] = useState('')
  /** 여권 데이터에 표시되는 국가(국적·발급국 등 여권 상 국가 필드에 해당) */
  const [passportCountryOnRecord, setPassportCountryOnRecord] = useState('')

  /** 순차 단계: 성별 1, 생년월일 2, 여권 국가(+하단 완료 버튼) 3 */
  const [revealed, setRevealed] = useState(1)
  const [finishModalOpen, setFinishModalOpen] = useState(false)

  const bottomAnchorRef = useRef(null)

  const genderOk = gender !== ''
  const birthOk = birthDate !== ''
  const passportCountryOk = passportCountryOnRecord !== ''

  const canFinish = genderOk && birthOk && passportCountryOk

  const scrollToBottom = useCallback(() => {
    window.setTimeout(() => {
      bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 80)
  }, [])

  const openFinishModalIfReady = useCallback(() => {
    if (!passportCountryOk) return
    setFinishModalOpen(true)
  }, [passportCountryOk])

  const completeOnboarding = useCallback(() => {
    if (!canFinish) return
    // TODO: API `PATCH /users/me` 또는 Supabase 등
    const profilePayload = {
      gender,
      dateOfBirth: birthDate,
      passportCountryCode: passportCountryOnRecord,
    }
    void profilePayload
    const sub = getActiveOnboardingSubject()
    if (sub) markOnboardingComplete(sub)
    setFinishModalOpen(false)
    navigate('/', { replace: true })
  }, [birthDate, canFinish, gender, navigate, passportCountryOnRecord])

  const handleFormSubmit = (e) => {
    e.preventDefault()
  }

  /** 소셜 로그인 직후 세션이 없거나 이미 온보딩을 마친 계정이면 분기 */
  useEffect(() => {
    const redirect = getOnboardingEntryRedirect()
    if (redirect === 'login') {
      navigate('/login', { replace: true })
      return
    }
    if (redirect === 'home') {
      navigate('/', { replace: true })
      return
    }
    if (redirect === 'consent') {
      navigate(AUTH_CONSENT_PATH, { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    if (!finishModalOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setFinishModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finishModalOpen])

  useEffect(() => {
    if (!finishModalOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [finishModalOpen])

  const sectionShell = (isDimmed) =>
    `rounded-2xl border transition-colors ${
      isDimmed
        ? 'border-gray-100 bg-gray-50/60 opacity-[0.72]'
        : 'border-cyan-100/80 bg-white shadow-sm shadow-cyan-900/5'
    }`

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-x-hidden bg-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #ecfeff 0%, #ffffff 28%, #f8fafc 100%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-8 pb-12 md:px-6 md:py-10">
        <header className="flex flex-col items-center text-center">
          <img
            src={step3DesktopMascotUrl}
            alt=""
            role="presentation"
            decoding="async"
            className="mx-auto w-full max-w-56 object-contain select-none"
          />
          <h1
            className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xl font-bold tracking-tight text-gray-900 md:text-2xl"
            aria-label="CHECKMATE에 오신 것을 환영합니다!"
          >
            <BrandLogo className="h-8 w-auto max-w-[min(100%,14rem)] shrink-0 object-contain md:h-9" alt="" />
            <span>에 오신 것을 환영합니다!</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            성별·생년월일과 여권에 적힌 국가만 입력하면 나중에 서비스에 안전하게 저장할 수 있어요.
          </p>
        </header>

        <form onSubmit={handleFormSubmit} className="mt-10 flex flex-col">
          <div ref={listRef} className="flex flex-col gap-6">
            <div>
              <h2 className="mb-3 text-left text-base font-bold tracking-tight text-gray-900">기본 정보</h2>
              <p className="text-xs text-gray-500">성별과 생년월일을 입력해 주세요.</p>
            </div>

            {/* 1 성별 */}
            <section className={sectionShell(revealed >= 2 && genderOk)}>
              <div className="p-5">
                <p className="mb-3 text-sm font-semibold text-gray-800">성별 (Gender)</p>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {[
                    { v: 'female', label: '여성' },
                    { v: 'male', label: '남성' },
                  ].map(({ v, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setGender(v)
                        setRevealed((r) => Math.max(r, 2))
                        scrollToBottom()
                      }}
                      className={`rounded-xl border-2 py-3 text-sm font-bold transition ${
                        gender === v
                          ? 'border-cyan-500 bg-cyan-50 text-cyan-800'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-cyan-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <SectionInputConfirmed show={genderOk} />
              </div>
            </section>

            {/* 2 생년월일 */}
            {revealed >= 2 && genderOk && (
              <section className={sectionShell(revealed >= 3 && birthOk)}>
                <div className="p-5">
                  <p className="mb-2 text-sm font-semibold text-gray-800">생년월일 (Date of Birth)</p>
                  <p className="mb-3 text-xs text-gray-500">연·월을 고른 뒤 날짜를 눌러 주세요.</p>
                  <OnboardingBirthCalendar
                    key="onboarding-dob"
                    value={birthDate}
                    initialEmptyYear={2000}
                    onChange={(iso) => {
                      setBirthDate(iso)
                      if (iso) {
                        setRevealed((r) => Math.max(r, 3))
                        scrollToBottom()
                      }
                    }}
                  />
                  {birthDate ? (
                    <p className="mt-3 text-center text-sm font-medium text-cyan-800">선택: {isoToLabel(birthDate)}</p>
                  ) : null}
                  <SectionInputConfirmed show={birthOk} align="center" />
                </div>
              </section>
            )}

            {revealed >= 3 && birthOk && (
              <div className="pt-2">
                <h2 className="mb-3 text-left text-base font-bold tracking-tight text-gray-900">여권에 적힌 국가</h2>
                <p className="text-xs text-gray-500">
                  여권 정보 페이지에 표시된 국가(국적·발급국 등)에 맞게 선택해 주세요.
                </p>
              </div>
            )}

            {revealed >= 3 && birthOk && (
              <section className={sectionShell(passportCountryOk)}>
                <div
                  className="p-5"
                  onKeyDown={(e) => handleEnterToAdvanceSection(e, passportCountryOk, openFinishModalIfReady)}
                >
                  <label htmlFor="onboarding-passport-country" className="mb-3 block text-sm font-semibold text-gray-800">
                    여권에 기재된 국가
                  </label>
                  <OnboardingCustomSelect
                    id="onboarding-passport-country"
                    value={passportCountryOnRecord}
                    onValueChange={setPassportCountryOnRecord}
                    placeholder="국가를 선택해 주세요"
                    options={COUNTRY_OPTIONS}
                  />
                  <SectionInputConfirmed show={passportCountryOk} />
                </div>
              </section>
            )}
          </div>

          <div ref={bottomAnchorRef} className="h-px w-full shrink-0" aria-hidden="true" />

          {revealed >= 3 && birthOk && (
            <button
              type="button"
              disabled={!canFinish}
              onClick={() => canFinish && setFinishModalOpen(true)}
              className={ONBOARDING_FINISH_BTN_CLASS}
            >
              체크메이트 시작하기
            </button>
          )}
        </form>
      </div>

      {finishModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-teal-950/40 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => setFinishModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-finish-modal-title"
            className="relative w-full max-w-md rounded-2xl border border-teal-100/90 bg-white p-4 shadow-2xl shadow-teal-900/15 ring-1 ring-teal-50 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={onboardingFinishMascotUrl}
              alt=""
              role="presentation"
              decoding="async"
              className="mx-auto mb-4 block h-auto w-full max-w-[min(7.5rem,58vw)] -translate-x-2 object-contain object-center select-none sm:mb-5 sm:max-w-44 sm:-translate-x-3 md:-translate-x-5"
            />
            <h2
              id="onboarding-finish-modal-title"
              className="text-center text-xs font-extrabold leading-relaxed text-gray-900 sm:text-sm md:text-base md:leading-snug"
            >
              모든 준비가 완료되셨군요!
              <br />
              이제 저희와 함께 여행을 준비하러 가볼까요?
            </h2>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row">
              <button
                type="button"
                onClick={completeOnboarding}
                className="min-h-12 flex-1 rounded-2xl border-2 border-amber-300 bg-amber-50 py-3 text-sm font-bold text-amber-950 shadow-sm transition-colors hover:border-amber-400 hover:bg-amber-100"
              >
                확인
              </button>
              <button
                type="button"
                onClick={() => setFinishModalOpen(false)}
                className="min-h-12 flex-1 rounded-2xl border-2 border-teal-600 bg-white py-3 text-sm font-bold text-teal-800 shadow-sm transition-colors hover:bg-teal-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
