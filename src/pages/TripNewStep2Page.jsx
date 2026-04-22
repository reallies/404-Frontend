import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { STEP2_CONFIG, STEP2_ICON_PATHS, OPTION_CARDS } from '@/mocks/tripNewStep2Data'
import StepHeader from '@/components/common/StepHeader'
import {
  TripNewFlowDesktopPrevBar,
  TripNewFlowMobilePrevAction,
} from '@/components/trip/TripNewFlowPrevControls'
import { clearActiveTripId } from '@/utils/activeTripIdStorage'

/* ─────────────────────────────────────────────
   범용 SVG 아이콘
───────────────────────────────────────────── */
function SvgIcon({ name, className = 'w-4 h-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d={STEP2_ICON_PATHS[name]} />
    </svg>
  )
}

/**
 * 예매 여부 선택 — ○(예/맞음) · X(아직 아님)
 * 틸/시안 카드 배경 위에서 currentColor로 대비 유지
 */
function Step2ChoiceGlyph({ booked, className }) {
  if (booked) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <circle cx="12" cy="12" r="7.35" fill="none" stroke="currentColor" strokeWidth="2.35" />
      </svg>
    )
  }
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M8.5 8.5l7 7M15.5 8.5l-7 7"
        stroke="currentColor"
        strokeWidth="2.35"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ─────────────────────────────────────────────
   메인 컴포넌트
───────────────────────────────────────────── */
function TripNewStep2Page() {
  const navigate = useNavigate()

  // 새 여행 플로우 진입 시, 이전 세션에 남은 activeTripId 를 정리해
  // 다음 /trips/:id/loading 이 엉뚱한 id 로 잡히지 않도록 한다.
  useEffect(() => {
    clearActiveTripId()
  }, [])

  const handleCardNavigate = (cardId) => {
    if (cardId === 'notBooked') {
      navigate('/trips/new/destination')
      return
    }
    navigate('/trips/new/step3')
  }

  const pageBgStyle = {
    background: `
      radial-gradient(ellipse 110% 75% at 50% -8%, rgba(165, 243, 252, 0.35), transparent 58%),
      radial-gradient(ellipse 85% 60% at 100% 12%, rgba(204, 251, 241, 0.45), transparent 52%),
      radial-gradient(ellipse 80% 55% at 100% 92%, rgba(167, 243, 208, 0.22), transparent 55%),
      radial-gradient(ellipse 70% 50% at 0% 45%, rgba(236, 253, 245, 0.9), transparent 52%),
      radial-gradient(ellipse 95% 65% at 50% 105%, rgba(207, 250, 254, 0.35), transparent 55%),
      linear-gradient(152deg, #f0fdfa 0%, #ecfeff 18%, #f0fdfa 42%, #eefcf6 68%, #f7fef9 100%)
    `,
  }

  return (
    <div className="min-h-screen" style={pageBgStyle}>

      {/* ══════════════════════════════════
          데스크탑 레이아웃 (md 이상)
      ══════════════════════════════════ */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-5xl px-6 py-10">

          <TripNewFlowDesktopPrevBar className="mb-4" to="/" label="홈으로" />

          <StepHeader
            currentStep={STEP2_CONFIG.currentStep}
            totalSteps={STEP2_CONFIG.totalSteps}
            title={
              <>
                항공편 예약을
                <br />
                하셨나요?
              </>
            }
            className="mb-10"
          />

          {/* 옵션 카드 2열 */}
          <div className="grid grid-cols-2 gap-6 mb-10">
            {OPTION_CARDS.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardNavigate(card.id)}
                className="text-left rounded-3xl p-8 bg-white shadow-lg shadow-slate-900/[0.08] ring-1 ring-slate-200/90 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] hover:ring-slate-300/90"
              >
                <div
                  className={`mb-16 flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ring-1 ${
                    card.variant === 'primary'
                      ? 'bg-cyan-100 text-teal-700 ring-teal-600/15'
                      : 'bg-teal-700 text-white ring-teal-900/10'
                  }`}
                >
                  <Step2ChoiceGlyph booked={card.variant === 'primary'} className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                  {card.titleDesktop}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {card.descDesktop}
                </p>
              </button>
            ))}
          </div>

          {/* 푸터 */}
          <div className="border-t border-gray-200 pt-6 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              © 2024 Aerostatic Editorial. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                개인정보처리방침
              </button>
              <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                도움말
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          모바일 레이아웃 (md 미만)
      ══════════════════════════════════ */}
      <div className="md:hidden">
        <div className="px-5 pt-4 pb-32">
          <StepHeader
            currentStep={STEP2_CONFIG.currentStep}
            totalSteps={STEP2_CONFIG.totalSteps}
            title={
              <>
                항공편 예약을
                <br />
                하셨나요?
              </>
            }
            className="mb-4"
            titleClassName="text-2xl"
            topEndAction={<TripNewFlowMobilePrevAction to="/" label="홈으로" />}
          />

          {/* 옵션 카드 */}
          <div className="space-y-4">
            {OPTION_CARDS.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardNavigate(card.id)}
                className="w-full text-left rounded-2xl p-5 bg-white shadow-lg shadow-slate-900/[0.08] ring-1 ring-slate-200/90 transition-all duration-300 active:scale-[0.99] active:shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ring-1 ${
                      card.variant === 'primary'
                        ? 'bg-cyan-100 text-teal-700 ring-teal-600/15'
                        : 'bg-teal-700 text-white ring-teal-900/10'
                    }`}
                  >
                    <Step2ChoiceGlyph booked={card.variant === 'primary'} className="h-5 w-5" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <SvgIcon name="chevronRight" className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-1">
                  {card.titleMobile}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {card.descMobile}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TripNewStep2Page
