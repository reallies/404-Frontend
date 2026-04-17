import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  STEP5_CONFIG,
  STEP5_ICON_PATHS,
  STEP5_PAGE_TITLE,
  STEP5_PAGE_SUBTITLE,
  COMPANIONS,
  TRAVEL_STYLES,
  EDITORIAL_PICK,
} from '@/mocks/tripNewStep5Data'
import StepHeader from '@/components/common/StepHeader'
import { TripFlowDesktopBar, TripFlowMobileBar } from '@/components/common/TripFlowTopBar'
import { TripFlowNextStepButton } from '@/components/trip/TripFlowNextStepButton'

function SvgIcon({ name, className = 'w-6 h-6' }) {
  const d = STEP5_ICON_PATHS[name]
  if (!d) return null
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d={d} />
    </svg>
  )
}

function SectionLabel({ num, label }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="w-8 h-8 rounded-full bg-teal-700 text-white text-sm font-extrabold flex items-center justify-center flex-shrink-0">
        {num}
      </span>
      <span className="font-extrabold text-gray-900 text-base tracking-tight">{label}</span>
      <div className="flex-1 h-px bg-gray-200/90 min-w-0" />
    </div>
  )
}

export default function TripNewStep5Page() {
  const navigate = useNavigate()
  const location = useLocation()

  const [companionId, setCompanionId] = useState(null)
  const [styleIds, setStyleIds] = useState([])

  const toggleStyle = useCallback((id) => {
    setStyleIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const canSubmit = useMemo(
    () => Boolean(companionId) && styleIds.length > 0,
    [companionId, styleIds],
  )

  const handleCreatePlan = () => {
    if (!canSubmit) return
    navigate('/trips/1/loading', {
      state: {
        ...(location.state ?? {}),
        step5: {
          companionId,
          travelStyleIds: styleIds,
        },
      },
    })
  }

  const companionCardClass = (id) => {
    const on = companionId === id
    return [
      'rounded-2xl border-2 p-4 text-left transition-all duration-200 flex flex-col gap-2 min-h-[120px]',
      on
        ? 'border-amber-400 bg-amber-200/95 shadow-md ring-2 ring-amber-300/80 text-gray-900'
        : 'border-transparent bg-cyan-50/90 hover:bg-cyan-100/80 text-gray-800 shadow-sm',
    ].join(' ')
  }

  /** 여행 스타일 카드 — 섹션 안에서 셀을 넓게 채우도록 높이·패딩 확대 */
  const styleCardClass = (id) => {
    const on = styleIds.includes(id)
    const base = [
      'w-full h-full min-h-[92px] rounded-2xl border-2 p-3.5 sm:p-4 md:p-5 flex flex-col items-center justify-center gap-2 text-center transition-all duration-200 md:min-h-0',
    ]
    if (on) {
      base.push('border-amber-400 bg-amber-200/95 shadow-md ring-1 ring-amber-300/70 text-gray-900')
    } else {
      base.push('border-gray-100 bg-white/95 hover:bg-cyan-50/80 text-gray-800 shadow-sm')
    }
    return base.join(' ')
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #E0F7FA 0%, #F0FDFA 45%, #F8FAFC 100%)' }}
    >
      {/* ── 데스크톱: 웹 레퍼런스 — 좌 동행·에디토리얼 / 우 스타일 그리드 ── */}
      <div className="hidden md:flex flex-col min-h-screen">
        <div className="max-w-[1320px] mx-auto w-full px-12 pt-10 pb-4">
          <TripFlowDesktopBar backTo="/trips/new/step4" className="mb-6" />
          <StepHeader
            currentStep={STEP5_CONFIG.currentStep}
            totalSteps={STEP5_CONFIG.totalSteps}
            title={STEP5_PAGE_TITLE}
            subtitle={STEP5_PAGE_SUBTITLE}
            className="mb-2"
            subtitleClassName="text-sm"
          />
        </div>

        <div className="max-w-[1320px] mx-auto w-full px-12 pb-16 flex gap-12 flex-1 items-stretch">
          {/* 좌측 패널 */}
          <div className="w-[480px] flex-shrink-0 flex flex-col gap-6">
            <SectionLabel num={1} label="동행인 선택" />
            <div className="grid grid-cols-2 gap-3 auto-rows-fr">
              {COMPANIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCompanionId(c.id)}
                  className={companionCardClass(c.id)}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      companionId === c.id ? 'bg-white/70 text-teal-800' : 'bg-white/80 text-teal-700'
                    }`}
                  >
                    <SvgIcon name={c.icon} className="w-6 h-6" />
                  </div>
                  <span className="font-extrabold text-lg leading-tight">{c.label}</span>
                  <span className="text-xs text-gray-600 leading-snug">{c.description}</span>
                </button>
              ))}
            </div>

            <div className="relative rounded-2xl overflow-hidden min-h-[140px] shadow-md border border-teal-900/20">
              <img
                src="/airplane-sky.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-teal-900/92 via-teal-800/75 to-cyan-800/55" />
              <div className="relative z-10 p-6 text-white">
                <p className="text-[10px] font-bold tracking-[0.2em] text-white/80 mb-1">
                  {EDITORIAL_PICK.eyebrow}
                </p>
                <p className="text-xl font-extrabold leading-snug">{EDITORIAL_PICK.title}</p>
                <p className="text-sm text-white/85 mt-2 max-w-sm">{EDITORIAL_PICK.description}</p>
              </div>
            </div>
          </div>

          {/* 우측 패널 */}
          <div className="flex-1 min-w-0 flex flex-col rounded-3xl bg-slate-50/80 border border-slate-200/60 px-10 py-8 shadow-sm min-h-0">
            <SectionLabel num={2} label="여행 스타일" />
            <p className="text-sm text-gray-500 mb-5">원하는 만큼 골라 주세요. (복수 선택)</p>

            <div className="grid w-full flex-1 grid-cols-3 grid-rows-3 gap-3 min-h-[320px] md:min-h-[400px] md:gap-4">
              {TRAVEL_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleStyle(s.id)}
                  className={styleCardClass(s.id)}
                >
                  <span className="text-3xl leading-none md:text-4xl" aria-hidden>
                    {s.emoji}
                  </span>
                  <span className="text-xs font-bold leading-tight sm:text-sm">{s.label}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-end mt-10 pt-4 border-t border-slate-200/70">
              <TripFlowNextStepButton
                variant="teal"
                fullWidth={false}
                disabled={!canSubmit}
                onClick={handleCreatePlan}
              >
                여행 계획 생성하기
              </TripFlowNextStepButton>
            </div>
          </div>
        </div>
      </div>

      {/* ── 모바일: 앱 레퍼런스 — 세로 스택 + 하단 고정 CTA ── */}
      <div className="md:hidden">
        <TripFlowMobileBar backTo="/trips/new/step4" />

        <div className="px-5 pt-5 pb-44">
          <StepHeader
            currentStep={STEP5_CONFIG.currentStep}
            totalSteps={STEP5_CONFIG.totalSteps}
            title={<>누구와 함께<br />하고 싶으세요?</>}
            subtitle={STEP5_PAGE_SUBTITLE}
            className="mb-6"
            titleClassName="text-2xl"
            subtitleClassName="text-sm"
          />

          <SectionLabel num={1} label="동행인 선택" />
          <div className="grid grid-cols-2 gap-3 mb-8">
            {COMPANIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCompanionId(c.id)}
                className={companionCardClass(c.id)}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto ${
                    companionId === c.id ? 'bg-white/70 text-teal-800' : 'bg-white text-teal-700'
                  }`}
                >
                  <SvgIcon name={c.icon} className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-base text-center">{c.label}</span>
              </button>
            ))}
          </div>

          <SectionLabel num={2} label="여행 스타일" />
          <div className="grid grid-cols-2 gap-3 min-h-[420px] auto-rows-fr">
            {TRAVEL_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleStyle(s.id)}
                className={styleCardClass(s.id)}
              >
                <span className="text-3xl leading-none" aria-hidden>
                  {s.emoji}
                </span>
                <span className="text-xs font-bold leading-tight sm:text-sm">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="fixed bottom-16 left-0 right-0 z-40 bg-transparent px-5 pb-3 pt-3 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
          <TripFlowNextStepButton
            variant="teal"
            disabled={!canSubmit}
            onClick={handleCreatePlan}
            showTrailingIcon={false}
          >
            여행 계획 생성하기
          </TripFlowNextStepButton>
        </div>
      </div>
    </div>
  )
}
