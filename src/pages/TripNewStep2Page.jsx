import { useNavigate } from 'react-router-dom'
import {
  STEP2_CONFIG,
  STEP2_ICON_PATHS,
  OPTION_CARDS,
  AI_TIP,
} from '@/mocks/tripNewStep2Data'
import StepHeader from '@/components/common/StepHeader'
import AiPlannerFab from '@/components/common/AiPlannerFab'
import BackButton from '@/components/common/BackButton'
import AiConciergeTip from '@/components/common/AiConciergeTip'

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

  const handleSelect = () => navigate('/trips/new/step3')

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #E0F7FA 0%, #F0FDFA 100%)' }}
    >

      {/* ══════════════════════════════════
          데스크탑 레이아웃 (md 이상)
      ══════════════════════════════════ */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-5xl px-6 py-10">

          {/* 뒤로가기 버튼 */}
          <div className="flex justify-end mb-4">
            <BackButton to="/trips/new" />
          </div>

          <StepHeader
            currentStep={STEP2_CONFIG.currentStep}
            totalSteps={STEP2_CONFIG.totalSteps}
            title={<>항공권 예매를 하셨나요?</>}
            className="mb-10"
          />

          {/* 옵션 카드 2열 */}
          <div className="grid grid-cols-2 gap-6 mb-10">
            {OPTION_CARDS.map((card) => (
              <button
                key={card.id}
                onClick={handleSelect}
                className={`text-left rounded-3xl p-8 transition-all hover:shadow-lg hover:scale-[1.01] ${
                  card.variant === 'primary'
                    ? 'bg-white shadow-sm'
                    : 'bg-cyan-50 shadow-sm'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-16 ${
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

          {/* AI 컨시어지 팁 */}
          <AiConciergeTip
            title={AI_TIP.title}
            description={AI_TIP.description}
            className="mb-12"
          />

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

        {/* 모바일 상단 바 */}
        <div className="flex items-center justify-between px-5 py-4 bg-white/80">
          <span className="font-bold text-gray-900">Travel Plans</span>
          <BackButton to="/trips/new" />
        </div>

        <div className="px-5 pt-4 pb-32">

          <StepHeader
            currentStep={STEP2_CONFIG.currentStep}
            totalSteps={STEP2_CONFIG.totalSteps}
            title={<>항공편 예약을<br />하셨나요?</>}
            className="mb-4"
          />

          {/* 옵션 카드 */}
          <div className="space-y-4 mb-6">
            {OPTION_CARDS.map((card) => (
              <button
                key={card.id}
                onClick={handleSelect}
                className={`w-full text-left rounded-2xl p-5 transition-all relative ${
                  card.variant === 'primary'
                    ? 'bg-gradient-to-br from-cyan-100 to-cyan-50'
                    : 'bg-white shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      card.variant === 'primary'
                        ? 'bg-teal-700/10 text-teal-700'
                        : 'bg-gray-100 text-gray-500'
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

          {/* AI Concierge Tips 카드 (버튼 제거) */}
          <div className="relative rounded-2xl overflow-hidden mb-6">
            <img
              src={AI_TIP.mobileImage}
              alt="하늘 풍경"
              className="w-full h-44 object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <p className="text-[10px] font-bold text-white/70 tracking-widest uppercase mb-1">
                {AI_TIP.mobileTitle}
              </p>
              <p className="text-sm text-white/90 leading-relaxed">
                {AI_TIP.mobileDesc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI 플래너 FAB (화면 고정) */}
      <AiPlannerFab />
    </div>
  )
}

export default TripNewStep2Page
