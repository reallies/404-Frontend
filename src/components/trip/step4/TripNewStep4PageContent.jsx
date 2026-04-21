import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  STEP4_CONFIG,
  HERO_IMAGE,
  CITY_IMAGES,
  AI_TIP,
  fetchTripDatesForStep4,
} from '@/mocks/tripNewStep4Data'
import { loadStep4NavigationState } from '@/utils/tripFlowDraftStorage'
import { arrayMove } from '@/utils/tripStep4Helpers'
import StepHeader from '@/components/common/StepHeader'
import {
  TripNewFlowDesktopPrevBar,
  TripNewFlowMobilePrevAction,
} from '@/components/trip/TripNewFlowPrevControls'
import AiConciergeTip from '@/components/common/AiConciergeTip'
import TripStepDesktopSplit from '@/components/trip/TripStepDesktopSplit'
import { TripFlowNextStepButton } from '@/components/trip/TripFlowNextStepButton'
import { FullBleedMintGlobeHero } from '@/components/trip/MintProgressiveHero'
import FlightSummaryCard from '@/components/trip/step4/FlightSummaryCard'
import Step4NonVnAddRegionInput from '@/components/trip/step4/Step4NonVnAddRegionInput'
import Step4NonVnSelectedPlacesList from '@/components/trip/step4/Step4NonVnSelectedPlacesList'

const Step4GlobeHero = lazy(() => import('@/components/trip/Step4GlobeHero'))

/**
 * Step4 본문 — 항공 요약 + 방문 지역 자유 입력(모든 입국지 동일 UI).
 */
export default function TripNewStep4PageContent({ arrival, mergedNavState }) {
  const navigate = useNavigate()
  const location = useLocation()

  /** fetchTripDatesForStep4 결과 (목데이터 또는 추후 API) */
  const [tripWindow, setTripWindow] = useState(null)
  const [tripDatesLoading, setTripDatesLoading] = useState(true)
  const [tripDatesError, setTripDatesError] = useState(null)

  /** 입력 초안 / 확인 시 목록에 추가(선택) → Step5 otherStopsNote로 합쳐 전달 */
  const [placeDraft, setPlaceDraft] = useState('')
  const [selectedPlaces, setSelectedPlaces] = useState([])

  const confirmPlace = useCallback((text) => {
    const t = text.trim()
    if (t.length < 1) return
    setSelectedPlaces((prev) => [
      ...prev,
      { id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, label: t },
    ])
    setPlaceDraft('')
  }, [])

  const removePlace = useCallback((id) => {
    setSelectedPlaces((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const reorderPlaces = useCallback((fromIndex, toIndex) => {
    setSelectedPlaces((prev) => arrayMove(prev, fromIndex, toIndex))
  }, [])

  const clearAllPlaces = useCallback(() => {
    setSelectedPlaces([])
  }, [])

  const arrivalKey = `${arrival?.iata ?? ''}-${arrival?.city ?? ''}-${arrival?.country ?? ''}`

  /** 라우터 state와 sessionStorage draft 병합 후 목적지 페이지에서 고른 여행 기간 */
  const tripDateOverride = useMemo(() => {
    const merged = { ...loadStep4NavigationState(), ...location.state }
    if (merged.fromDestinationPage && merged.tripStartDate && merged.tripEndDate) {
      return {
        tripStart: merged.tripStartDate,
        tripEnd: merged.tripEndDate,
        source: 'destination-picker',
      }
    }
    return null
  }, [location.state?.fromDestinationPage, location.state?.tripStartDate, location.state?.tripEndDate])

  useEffect(() => {
    let cancelled = false
    setTripDatesLoading(true)
    setTripDatesError(null)
    setTripWindow(null)

    fetchTripDatesForStep4(arrival, tripDateOverride)
      .then((data) => {
        if (cancelled) return
        setTripWindow({
          tripStart: data.tripStart,
          tripEnd: data.tripEnd,
          totalDays: data.totalDays,
          source: data.source,
        })
      })
      .catch((e) => {
        if (cancelled) return
        setTripDatesError(e?.message || '여행 기간을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setTripDatesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [arrivalKey, tripDateOverride?.tripStart, tripDateOverride?.tripEnd])

  const canProceed = useMemo(() => {
    if (tripDatesLoading || tripDatesError || !tripWindow) return false
    return true
  }, [tripDatesLoading, tripDatesError, tripWindow])

  const heroSrc = useMemo(() => CITY_IMAGES[arrival.city] || HERO_IMAGE, [arrival.city])

  const handleNext = () => {
    if (!canProceed) return
    navigate('/trips/new/step5', {
      state: {
        ...mergedNavState,
        step4: {
          arrival,
          tripStart: tripWindow?.tripStart,
          tripEnd: tripWindow?.tripEnd,
          totalDays: tripWindow?.totalDays,
          tripDatesSource: tripWindow?.source,
          vietnamPresetSchedule: [],
          vietnamCustomSchedule: [],
          otherStopsNote: selectedPlaces.map((p) => p.label).join('\n'),
        },
      },
    })
  }

  const step4HeaderSubtitle = (
    <>
      <span className="block">
        선택하신 취항지(입국 도시) 근처에 더 여행할 지역이 있으면 일정 순서대로 적어 주세요.
      </span>
      <span className="mt-2.5 block text-base font-semibold leading-snug text-teal-900 sm:text-[15px]">
        없으면 그대로 다음 단계로 넘어가도 돼요.
      </span>
    </>
  )

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #E0F7FA 0%, #F0FDFA 100%)' }}
    >
      <TripStepDesktopSplit
        fullBleed={
          <FullBleedMintGlobeHero
            globe={
              <Suspense
                fallback={
                  <div
                    className="absolute inset-0 animate-pulse opacity-50"
                    style={{
                      background:
                        'radial-gradient(ellipse 80% 70% at 50% 45%, rgba(0, 200, 190, 0.15) 0%, transparent 55%)',
                    }}
                  />
                }
              >
                <Step4GlobeHero />
              </Suspense>
            }
          />
        }
        left={
          <>
            <TripNewFlowDesktopPrevBar className="mb-6" />

            <StepHeader
              currentStep={STEP4_CONFIG.currentStep}
              totalSteps={STEP4_CONFIG.totalSteps}
              title="추가로 방문하는 지역이 있나요?"
              subtitle={step4HeaderSubtitle}
              className="mb-6"
              subtitleClassName="text-sm"
            />

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
              <FlightSummaryCard
                arrival={arrival}
                tripWindow={tripWindow}
                tripDatesLoading={tripDatesLoading}
                tripDatesError={tripDatesError}
              />

              <Step4NonVnAddRegionInput
                value={placeDraft}
                onChange={setPlaceDraft}
                onConfirm={confirmPlace}
              />
              <Step4NonVnSelectedPlacesList
                items={selectedPlaces}
                onRemove={removePlace}
                onReorder={reorderPlaces}
                onRemoveAll={clearAllPlaces}
              />
            </div>

            <div className="mt-6">
              <TripFlowNextStepButton variant="amber" disabled={!canProceed} onClick={handleNext} />
            </div>
          </>
        }
        right={
          <div className="pointer-events-auto absolute bottom-8 left-8 right-8 z-30">
            <AiConciergeTip description={AI_TIP.description} />
          </div>
        }
      />

      <div className="md:hidden">
        <div className="px-5 pt-4 pb-44">
          <StepHeader
            currentStep={STEP4_CONFIG.currentStep}
            totalSteps={STEP4_CONFIG.totalSteps}
            title={
              <>
                추가로 방문하는 지역이
                <br />
                있나요?
              </>
            }
            subtitle={step4HeaderSubtitle}
            className="mb-5"
            titleClassName="text-2xl"
            subtitleClassName="text-sm"
            topEndAction={<TripNewFlowMobilePrevAction />}
          />

          <div className="space-y-4 mb-5">
            <FlightSummaryCard
              arrival={arrival}
              tripWindow={tripWindow}
              tripDatesLoading={tripDatesLoading}
              tripDatesError={tripDatesError}
            />

            <Step4NonVnAddRegionInput
              value={placeDraft}
              onChange={setPlaceDraft}
              onConfirm={confirmPlace}
            />
            <Step4NonVnSelectedPlacesList
              items={selectedPlaces}
              onRemove={removePlace}
              onReorder={reorderPlaces}
              onRemoveAll={clearAllPlaces}
            />
          </div>

          <div className="relative rounded-2xl overflow-hidden h-44 mb-4">
            <img src={heroSrc} alt="" className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-5">
              <p className="text-[10px] font-bold text-white/70 tracking-widest uppercase mb-0.5">PREVIEW</p>
              <p className="text-sm font-extrabold text-white">
                {selectedPlaces.length >= 1 ? '방문 지역 입력 완료' : '추가 방문 지역은 선택 사항이에요'}
              </p>
            </div>
          </div>
        </div>

        {/* 바텀 네비에 가리지 않도록 목적지·Step3와 동일: 탭 높이만큼 위에 고정 */}
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-transparent px-5 pb-3 pt-3 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]">
          <TripFlowNextStepButton variant="amber" disabled={!canProceed} onClick={handleNext} />
        </div>
      </div>
    </div>
  )
}
