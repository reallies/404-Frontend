import { useNavigate } from 'react-router-dom'
import {
  STEP2_CONFIG,
  STEP2_ICON_PATHS,
  OPTION_CARDS,
  AI_TIP,
} from '@/mocks/tripNewStep2Data'
import StepHeader from '@/components/common/StepHeader'
import AiConciergeTip from '@/components/common/AiConciergeTip'
import { TripFlowDesktopBar, TripFlowMobileBar } from '@/components/common/TripFlowTopBar'

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

/* ─────────────────────────────────────────────
   메인 컴포넌트
───────────────────────────────────────────── */
function TripNewStep2Page() {
  const navigate = useNavigate()

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

          <TripFlowDesktopBar backTo="/" className="mb-4" />

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
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-16 shadow-sm ${
                    card.variant === 'primary'
                      ? 'bg-cyan-100 text-teal-700'
                      : 'bg-teal-700 text-white'
                  }`}
                >
                  <SvgIcon name={card.icon} className="w-6 h-6" />
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

          {/* 꿀 Tip! 카드 */}
          <AiConciergeTip description={AI_TIP.description} className="mb-12" />

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

        <TripFlowMobileBar backTo="/" />

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
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                      card.variant === 'primary'
                        ? 'bg-cyan-100 text-teal-700'
                        : 'bg-teal-700 text-white'
                    }`}
                  >
                    <SvgIcon name={card.icon} className="w-5 h-5" />
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

          {/* 아래 카드(아직 안 했어요) 직후 · 이 모바일 열은 md 이상에서 전체 숨김 */}
          <aside
            className="mt-2 overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-200/50"
            aria-label="AI 컨시어지 안내 배너"
          >
            <div
              className="relative min-h-[148px] bg-slate-800 bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(105deg, rgba(15, 23, 42, 0.82) 0%, rgba(15, 23, 42, 0.5) 55%, rgba(15, 23, 42, 0.28) 100%), url(${AI_TIP.mobileImage})`,
              }}
            >
              <div className="relative px-5 py-5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/95">
                  {AI_TIP.mobileTitle}
                </p>
                <p className="text-sm font-medium leading-relaxed text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
                  {AI_TIP.mobileDesc}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default TripNewStep2Page
