import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BrandLogo from '@/components/common/BrandLogo'
import StepProgressBarMascot from '@/components/common/StepProgressBarMascot'
import {
  LOADING_VARIANTS,
  TIPS,
  LOADING_ICON_PATHS,
  BLUR_ORBS,
  BRAND_DOTS,
} from '@/mocks/loadingData'

/* ─────────────────────────────────────────────
   범용 SVG 아이콘 — LOADING_ICON_PATHS 데이터 기반
   diamond 아이콘만 중앙에 원형 포인트가 추가됩니다.
───────────────────────────────────────────── */
function SvgIcon({ name, className = 'w-5 h-5 text-white' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d={LOADING_ICON_PATHS[name]} />
      {name === 'diamond' && <circle cx="12" cy="12" r="2" fill="white" />}
    </svg>
  )
}

/* ─────────────────────────────────────────────
   메인 컴포넌트
───────────────────────────────────────────── */
function TripLoadingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)

  /** 이 페이지 방문당 1회만 고정 (진행률과 무관하게 문구 변경 없음) */
  const variantIndex = useMemo(
    () => Math.floor(Math.random() * LOADING_VARIANTS.length),
    []
  )
  const tipIndex = useMemo(() => Math.floor(Math.random() * TIPS.length), [])

  const v = LOADING_VARIANTS[variantIndex]

  /* 진행률 자동 증가: ~5초 완료 */
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          return 100
        }
        /* 구간별 속도 조정: 후반부 살짝 느리게 */
        const step = prev < 60 ? 1.2 : 0.7
        return Math.min(prev + step, 100)
      })
    }, 50)
    return () => clearInterval(timer)
  }, [])

  /* 진행 완료 후 이동 */
  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(() => navigate(`/trips/${id ?? 1}/search`), 600)
      return () => clearTimeout(t)
    }
  }, [progress, id, navigate])

  const pct = Math.round(progress)

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden select-none">

      {/* ── 배경 ── */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 30%, #E0F2FE 70%, #F0F9FF 100%)' }}
      />
      {/* 블러 오브 */}
      {BLUR_ORBS.map((orb) => (
        <div
          key={orb.id}
          className="absolute pointer-events-none"
          style={{
            width: orb.width,
            height: orb.height,
            top: orb.top,
            right: orb.right,
            bottom: orb.bottom,
            left: orb.left,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            filter: `blur(${orb.blur})`,
          }}
        />
      ))}
      {/* 모바일 데코 아이콘 (온도계 실루엣) */}
      <div className="md:hidden absolute top-6 left-4 opacity-10 pointer-events-none">
        <SvgIcon name="thermometer" className="w-24 h-24 text-cyan-400" />
      </div>

      {/* ══════════════════════════════════
          본문 컨텐츠 (relative z-10)
      ══════════════════════════════════ */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-lg px-6 text-center">

        {/* 마스코트 (public/loading-mascot.png) — 배경 박스 없이 이미지만 */}
        <div className="mb-5 md:mb-7">
          <img
            src="/loading-mascot.png"
            alt=""
            className="mx-auto h-44 w-auto max-w-[min(100%,16rem)] object-contain object-center sm:h-48 md:h-56 md:max-w-[22rem]"
            draggable={false}
          />
        </div>

        {/* 고정 카피 — 워드마크 PNG + 한글 (예시 레이아웃과 동일: 한 줄·줄바꿈 시 가운데 정렬) */}
        <p
          className="mb-6 flex w-full max-w-xl flex-wrap items-center justify-center gap-x-1.5 gap-y-2 px-1 text-center text-[15px] font-semibold leading-snug text-gray-900 sm:text-base md:mb-8 md:text-lg"
          role="status"
          aria-label="MATE가 맞춤 CHECK LIST를 준비하고 있어요"
        >
          <img
            src="/loading-word-mate.png"
            alt=""
            className="inline-block h-7 w-auto max-w-[4.75rem] object-contain object-bottom sm:h-8 md:h-9 md:max-w-[5.75rem]"
            draggable={false}
            aria-hidden
          />
          <span className="whitespace-nowrap">가 맞춤</span>
          <img
            src="/loading-word-checklist.png"
            alt=""
            className="inline-block h-7 w-auto max-w-[9rem] object-contain object-bottom sm:h-8 sm:max-w-[10.5rem] md:h-9 md:max-w-[12.5rem]"
            draggable={false}
            aria-hidden
          />
          <span className="whitespace-nowrap">를 준비하고 있어요!</span>
        </p>

        {/* 분석 카드 */}
        <div className="w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-md px-5 py-5 mb-6 md:mb-8 text-left">
          <div className="mb-4">
            <p className="text-sm font-bold text-gray-800 mb-0.5">{v.cardLabel}</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="hidden md:inline">{v.descDesktop}</span>
              <span className="md:hidden">{v.descMobile}</span>
            </p>
          </div>

          {/* 진행률 바 + 스텝 플로우와 동일 마스코트(채움 끝 = 현재 %) */}
          <StepProgressBarMascot
            percent={pct}
            className="mb-3 w-full"
            trackClassName="bg-gray-100"
            fillClassName=""
            fillStyle={{
              background: 'linear-gradient(to right, #06B6D4, #22C55E, #EAB308)',
            }}
            fillTransitionClassName="transition-all duration-150 ease-linear"
            mascotTransitionClassName="transition-[left] duration-150 ease-linear"
            barHeightClass="h-2"
          />

          {/* 레이블 + % */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
              {v.barLabel}
            </span>
            <span className="text-sm font-extrabold text-cyan-500">{pct}%</span>
          </div>
        </div>

        {/* TIP 영역 */}
        {/* 데스크탑: 황색 pill */}
        <div className="hidden md:flex items-center gap-2 bg-amber-400 text-amber-900 text-xs font-semibold px-5 py-2.5 rounded-full shadow-sm">
          <span className="text-amber-700">✦</span>
          {TIPS[tipIndex]}
        </div>

        {/* 모바일: Editor's Tip 카드 */}
        <div className="md:hidden w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm px-4 py-4 text-left flex items-start gap-3">
          <div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <SvgIcon name="bulb" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest text-amber-500 uppercase mb-1">
              Editor&apos;s Tip
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">{TIPS[tipIndex]}</p>
          </div>
        </div>

      </div>

      {/* ── 하단 브랜딩 ── */}
      <div className="absolute bottom-8 flex flex-col items-center gap-2 z-10">
        <div className="flex items-center gap-1.5">
          {BRAND_DOTS.map((dot) => (
            <span
              key={dot.id}
              className={`w-1.5 h-1.5 rounded-full ${dot.color} ${dot.desktopOnly ? 'hidden md:block' : ''}`}
            />
          ))}
        </div>
        <BrandLogo className="h-5 w-auto opacity-95" />
      </div>

    </div>
  )
}

export default TripLoadingPage
