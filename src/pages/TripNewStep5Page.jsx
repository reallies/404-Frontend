import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  STEP5_CONFIG,
  STEP5_ICON_PATHS,
  STEP5_ICON_COMPOSITE,
  STEP5_PAGE_TITLE,
  STEP5_PAGE_SUBTITLE,
  COMPANIONS,
  TRAVEL_STYLES,
  EDITORIAL_PICK,
} from '@/mocks/tripNewStep5Data'
import StepHeader from '@/components/common/StepHeader'
import {
  TripNewFlowDesktopPrevBar,
  TripNewFlowMobilePrevAction,
} from '@/components/trip/TripNewFlowPrevControls'
import { TripFlowNextStepButton } from '@/components/trip/TripFlowNextStepButton'
import { loadActiveTripPlan, saveActiveTripPlan } from '@/utils/tripPlanContextStorage'
import { listCompanionTypes, listTravelStyles } from '@/api/master'
import { buildCreateTripPayload } from '@/utils/tripPlanToCreatePayload'
import { saveActiveTripId, clearActiveTripId } from '@/utils/activeTripIdStorage'
import { createTrip } from '@/api/trips'

/** placeholder 로 써오던 하드코딩 tripId — Trip 생성 실패 시 graceful fallback 용 */
const PLACEHOLDER_TRIP_ID = '1'

function SvgIcon({ name, className = 'w-6 h-6' }) {
  const composite = STEP5_ICON_COMPOSITE[name]
  if (composite) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        {composite.circles.map((c, i) => (
          <circle key={i} cx={c.cx} cy={c.cy} r={c.r} />
        ))}
        <path d={composite.path} />
      </svg>
    )
  }
  const d = STEP5_ICON_PATHS[name]
  if (!d) return null
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d={d} />
    </svg>
  )
}

/** 미선택: 랜드마크 아이콘 톤(틸) · 선택: 먹방 아이콘 톤(브라운) — PNG 실루엣 후 filter로 통일 */
const TRAVEL_STYLE_ICON_FILTER_IDLE =
  'brightness(0) saturate(100%) invert(44%) sepia(82%) saturate(520%) hue-rotate(139deg) brightness(0.93) contrast(0.95)'
const TRAVEL_STYLE_ICON_FILTER_SELECTED =
  'brightness(0) saturate(100%) invert(22%) sepia(28%) saturate(1300%) hue-rotate(5deg) brightness(0.91) contrast(1.05)'

function TravelStyleIcon({ src, selected, className }) {
  return (
    <img
      src={src}
      alt=""
      className={`shrink-0 object-contain transition-[filter] duration-200 ease-out ${className ?? ''}`}
      style={{ filter: selected ? TRAVEL_STYLE_ICON_FILTER_SELECTED : TRAVEL_STYLE_ICON_FILTER_IDLE }}
      aria-hidden
    />
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
  /** Trip 생성 POST 진행 상태 — 버튼 중복 클릭 방지 + 인라인 에러 표시용 */
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [companions, setCompanions] = useState(COMPANIONS)
  const [travelStyles, setTravelStyles] = useState(TRAVEL_STYLES)

  useEffect(() => {
    let cancelled = false
    Promise.all([listCompanionTypes(), listTravelStyles()])
      .then(([apiCompanions, apiStyles]) => {
        if (cancelled) return
        setCompanions(
          apiCompanions.map((c) => {
            const mock = COMPANIONS.find((m) => m.id === c.code)
            return { id: c.code, label: c.labelKo, description: mock?.description ?? '', icon: mock?.icon ?? 'person' }
          })
        )
        setTravelStyles(
          apiStyles.map((s) => ({ id: s.code, label: s.labelKo, iconSrc: s.iconPath }))
        )
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const toggleStyle = useCallback((id) => {
    setStyleIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const canSubmit = useMemo(
    () => Boolean(companionId) && styleIds.length > 0 && !submitting,
    [companionId, styleIds, submitting],
  )

  const handleCreatePlan = async () => {
    if (!canSubmit) return
    setSubmitError('')

    // 백엔드 맞춤 체크리스트 호출(/checklists/generate-from-context) fallback 경로 및
    // Trip 생성 payload 생성을 위해, 동행·여행 스타일 라벨을 플랜 스토리지에 합쳐 둔다.
    const existingPlan = loadActiveTripPlan()
    const companionLabel = companions.find((c) => c.id === companionId)?.label ?? null
    const travelStyleLabels = travelStyles.filter((s) => styleIds.includes(s.id)).map((s) => s.label)
    const hasPet = companionId === 'withPet'
    const nextPlan = existingPlan?.destination
      ? {
          ...existingPlan,
          companion: companionLabel,
          hasPet,
          travelStyles: travelStyleLabels,
        }
      : existingPlan
    if (nextPlan) saveActiveTripPlan(nextPlan)

    const step5State = { companionId, travelStyleIds: styleIds }

    // 실제 Trip 영속화 시도. 실패해도 기존 context 기반 플로우로 이어지도록 graceful fallback.
    const payload = buildCreateTripPayload(nextPlan ?? existingPlan, {
      companionId,
      hasPet,
      travelStyleIds: styleIds,
    })

    let createdTripId = null
    if (payload) {
      setSubmitting(true)
      try {
        const created = await createTrip(payload)
        const rawId = created?.id ?? created?.tripId
        // Prisma BigInt 는 JSON 직렬화 시 문자열로 나올 수 있어 모두 문자열 처리.
        createdTripId = rawId != null ? String(rawId) : null
        if (createdTripId) {
          saveActiveTripId(createdTripId)
        }
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          '여행 계획을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.'
        console.warn('[TripNewStep5Page] createTrip 실패, placeholder 플로우로 fallback:', message)
        setSubmitError(
          '여행 계획 저장 중 문제가 발생해 임시로 진행합니다. 계속 문제가 되면 새로고침 후 다시 시도해 주세요.',
        )
        clearActiveTripId()
      } finally {
        setSubmitting(false)
      }
    } else {
      // payload 구성 실패 (목적지/기간/동행/스타일 미비) → 기존 placeholder 플로우.
      clearActiveTripId()
    }

    const targetTripId = createdTripId ?? PLACEHOLDER_TRIP_ID
    navigate(`/trips/${targetTripId}/loading`, {
      state: {
        ...(location.state ?? {}),
        step5: step5State,
        createdTripId,
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
        {/* Header.jsx 와 동일: max-w-7xl + px-3 md:px-6 lg:px-8 → 로고·이전으로·STEP 왼선 일치 */}
        <div className="shrink-0 mx-auto w-full max-w-7xl px-3 pt-8 md:px-6 md:pt-8 lg:px-8 lg:pt-10">
          <TripNewFlowDesktopPrevBar
            align="start"
            to="/trips/new/step4"
            label="이전으로"
            ariaLabel="방문 지역 단계로 돌아가기"
          />
        </div>
        <div className="mx-auto w-full max-w-7xl px-3 pb-4 pt-2 md:px-6 lg:px-8">
          <StepHeader
            currentStep={STEP5_CONFIG.currentStep}
            totalSteps={STEP5_CONFIG.totalSteps}
            title={STEP5_PAGE_TITLE}
            subtitle={STEP5_PAGE_SUBTITLE}
            className="mb-2"
            subtitleClassName="text-sm"
          />
        </div>

        <div className="mx-auto flex w-full max-w-7xl flex-1 items-stretch gap-8 px-3 pb-16 md:px-6 lg:px-8">
          {/* 좌측 패널: 흰 박스(동행인) + 하단 배너(분리) */}
          <div className="flex-1 min-w-0 flex flex-col gap-0">
            <div className="min-w-0 shrink-0 min-h-[590px] rounded-3xl bg-slate-50/80 border border-slate-200/60 px-10 py-8 shadow-sm">
              <SectionLabel num={1} label="동행인 선택" />
              <p className="text-sm text-gray-500 mb-5">누구와 함께 여행하시나요?</p>
              <div className="flex-1 min-h-0">
                <div className="grid grid-cols-2 gap-3 auto-rows-fr">
                  {companions.map((c) => (
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
                      <span className="font-extrabold text-base leading-tight">{c.label}</span>
                      <span className="text-xs text-gray-600 leading-snug">{c.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/*
            <div className="relative h-[188px] overflow-hidden rounded-2xl border border-slate-300/40 shadow-md">
              <img
                src="/airplane-sky.png"
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/74 via-sky-800/62 to-amber-300/32" />
              <div className="relative z-10 px-6 py-5 text-white">
                <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-white/80">
                  {EDITORIAL_PICK.eyebrow}
                </p>
                <p className="text-[30px] font-extrabold leading-tight">{EDITORIAL_PICK.title}</p>
                <p className="mt-2 max-w-sm whitespace-pre-line text-sm text-white/85">
                  {EDITORIAL_PICK.description}
                </p>
              </div>
            </div>
            */}
            {/* 배너 숨김 상태에서도 우측 컬럼(버튼 영역)과 동일 높이를 유지하기 위한 슬롯 */}
            <div className="min-h-[188px]" aria-hidden />
          </div>

          {/* 우측 패널: 흰 박스(여행 스타일) + 하단 버튼(분리) */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            <div className="min-w-0 shrink-0 min-h-[590px] rounded-3xl bg-slate-50/80 border border-slate-200/60 px-10 py-8 shadow-sm">
              <SectionLabel num={2} label="여행 스타일" />
              <p className="text-sm text-gray-500 mb-5">어떤 여행을 계획하고 있나요? (복수 선택 가능)</p>

              <div className="grid w-full grid-cols-3 grid-rows-3 gap-3 min-h-[320px] md:min-h-[400px] md:gap-4">
                {travelStyles.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleStyle(s.id)}
                    className={styleCardClass(s.id)}
                  >
                    <TravelStyleIcon
                      src={s.iconSrc}
                      selected={styleIds.includes(s.id)}
                      className="h-9 w-9 md:h-11 md:w-11"
                    />
                    <span className="text-xs font-bold leading-tight sm:text-sm">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-1 flex flex-col gap-3">
              {submitError ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-950">
                  {submitError}
                </p>
              ) : null}
              <div className="flex justify-end">
                <TripFlowNextStepButton
                  variant="amber"
                  fullWidth={false}
                  disabled={!canSubmit}
                  onClick={handleCreatePlan}
                >
                  {submitting ? '여행 계획 저장 중…' : '여행 계획 생성하기'}
                </TripFlowNextStepButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 모바일: 앱 레퍼런스 — 세로 스택 + 하단 고정 CTA ── */}
      <div className="md:hidden">
        <div className="px-5 pt-4 pb-44">
          <StepHeader
            currentStep={STEP5_CONFIG.currentStep}
            totalSteps={STEP5_CONFIG.totalSteps}
            title={<>누구와 함께<br />하고 싶으세요?</>}
            subtitle={STEP5_PAGE_SUBTITLE}
            className="mb-5"
            titleClassName="text-2xl"
            subtitleClassName="text-sm"
            topEndAction={
              <TripNewFlowMobilePrevAction
                to="/trips/new/step4"
                label="이전으로"
                ariaLabel="방문 지역 단계로 돌아가기"
              />
            }
          />

          <SectionLabel num={1} label="동행인 선택" />
          <p className="text-sm text-gray-500 mb-4">누구와 함께 여행하시나요?</p>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {companions.map((c) => (
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
                <span className="font-extrabold text-sm leading-tight text-center">{c.label}</span>
              </button>
            ))}
          </div>

          <SectionLabel num={2} label="여행 스타일" />
          <div className="grid grid-cols-2 gap-3 min-h-[420px] auto-rows-fr">
            {travelStyles.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleStyle(s.id)}
                className={styleCardClass(s.id)}
              >
                <TravelStyleIcon
                  src={s.iconSrc}
                  selected={styleIds.includes(s.id)}
                  className="h-9 w-9"
                />
                <span className="text-xs font-bold leading-tight sm:text-sm">{s.label}</span>
              </button>
            ))}
          </div>

          {/*
          <div className="relative mt-8 overflow-hidden rounded-2xl border border-slate-300/40 shadow-md">
            <img
              src="/airplane-sky.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/74 via-sky-800/62 to-amber-300/32" />
            <div className="relative z-10 px-5 py-4 text-white">
              <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-white/80">
                {EDITORIAL_PICK.eyebrow}
              </p>
              <p className="text-xl font-extrabold leading-snug">{EDITORIAL_PICK.title}</p>
              <p className="mt-2 whitespace-pre-line text-sm text-white/85">
                {EDITORIAL_PICK.description}
              </p>
            </div>
          </div>
          */}
        </div>

        <div className="fixed bottom-16 left-0 right-0 z-40 flex flex-col gap-2 bg-transparent px-5 pb-3 pt-3 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
          {submitError ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              {submitError}
            </p>
          ) : null}
          <TripFlowNextStepButton
            variant="amber"
            disabled={!canSubmit}
            onClick={handleCreatePlan}
          >
            {submitting ? '여행 계획 저장 중…' : '여행 계획 생성하기'}
          </TripFlowNextStepButton>
        </div>
      </div>
    </div>
  )
}
