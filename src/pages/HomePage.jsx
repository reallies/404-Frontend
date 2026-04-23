import { Fragment, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import homeHeroMascotUrl from '@/assets/home-hero-mascot-camera.png'
import featureMascotQuestionUrl from '@/assets/home-feature-mascot-question.png'
import processCardSaveUrl from '@/assets/home-process-card-save.png'
import processCardOpenUrl from '@/assets/home-process-card-open.png'
import processCardCheckUrl from '@/assets/home-process-card-check.png'
import ctaSceneUrl from '@/assets/home-cta-scene.png'
import ctaWordMateUrl from '@/assets/home-cta-word-mate.png'
import ctaWordCheckUrl from '@/assets/home-cta-word-check.png'
import BrandLogo from '@/components/common/BrandLogo'
import { useRevealOnScrollOnce } from '@/hooks/useRevealOnScrollOnce'
import {
  FOOTER_BOTTOM_LINKS,
  FOOTER_SECTIONS,
  FOOTER_SOCIAL_LINKS,
  HOME_BRAND_TAGLINE,
  HOME_CATCHPHRASE_DISPLAY,
  HOME_HERO_SUBTITLE,
  HOME_HERO_TITLE_LINES,
  LANDING_SECTION_IDS,
} from '@/mocks/homeData'

/** 홈 전체 페이지 스크롤 스냅 — index.css 의 html.home-page-scroll-snap 과 함께 사용 */
const HOME_SCROLL_SNAP_HTML_CLASS = 'home-page-scroll-snap'

/** 스냅 슬라이드: 뷰포트 한 장 + 휠 한 번에 다음 섹션으로 */
const SNAP_SLIDE =
  'snap-start snap-always min-h-[100dvh] flex flex-col justify-center'

/**
 * 캐치프레이즈 ~ 푸터: 한 스냅 단위로만 정렬(CTA 다음 한 번). 둘 사이는 스냅 없이 연속 스크롤.
 */
const SNAP_TAIL_GROUP = 'snap-start snap-always flex w-full flex-col'

/** 홈 전체 배경 — 사용자 시안 기준의 연한 민트/스카이 원톤 */
const HOME_PAGE_BG_STYLE = {
  backgroundColor: '#f3fff8',
  backgroundImage: `radial-gradient(circle at 8% 12%, rgba(117, 221, 255, 0.34) 0%, rgba(117, 221, 255, 0) 20%),
    radial-gradient(circle at 80% 16%, rgba(248, 215, 116, 0.34) 0%, rgba(248, 215, 116, 0) 24%),
    radial-gradient(circle at 10% 44%, rgba(117, 221, 255, 0.18) 0%, rgba(117, 221, 255, 0) 20%),
    radial-gradient(circle at 68% 78%, rgba(251, 222, 132, 0.2) 0%, rgba(251, 222, 132, 0) 28%),
    linear-gradient(180deg, #e8fffe 0%, #f4fff1 52%, #fff9e8 100%)`,
}

/** 홈 섹션 공통 리빌: 더 길게·부드럽게 (prefers-reduced-motion 은 duration 0) */
const REVEAL_EASE =
  'transition-[opacity,transform] duration-[1180ms] ease-[cubic-bezier(0.25,0.46,0.45,0.99)] motion-reduce:duration-0 motion-reduce:opacity-100 motion-reduce:translate-y-0'

/** 피처 카드 3장: 제목 이후 왼쪽 → 가운데 → 오른쪽 순 (JIT가 클래스를 생성하도록 리터럴 고정) */
const FEATURE_CARD_REVEAL_DELAY_CLASS = ['delay-[420ms]', 'delay-[980ms]', 'delay-[1540ms]']

/** 섹션 진입 시 페이드 + 살짝 위로 (스크롤 스냅과 별도) */
function RevealBlock({ show, delayClass = '', className = '', children }) {
  return (
    <div
      className={`${REVEAL_EASE} ${delayClass} ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}

const HOME_QUICK_FLOW_CARDS = [
  {
    id: 'save',
    imageSrc: processCardSaveUrl,
    imageAlt: '저장 단계를 안내하는 메이트',
    topLine: '여행과 일정을 정한 뒤,',
    bottomLine: (
      <>
        필요한 준비 항목을 찾아
        <br />
        <span className="text-amber-500">저장</span>합니다
      </>
    ),
  },
  {
    id: 'open',
    imageSrc: processCardOpenUrl,
    imageAlt: '확인 및 수정 단계를 안내하는 메이트',
    topLine: (
      <>
        <span className="text-amber-500">나의 체크리스트</span>에서
      </>
    ),
    bottomLine: (
      <>
        저장한 리스트를 확인하고,
        <br />
        <span className="md:hidden">
          필요한 항목을
          <br />
          <span className="text-amber-500">추가, 수정</span>합니다
        </span>
        <span className="hidden md:inline">
          필요한 항목을 <span className="text-amber-500">추가, 수정</span>합니다
        </span>
      </>
    ),
  },
  {
    id: 'check',
    imageSrc: processCardCheckUrl,
    imageAlt: '체크 단계를 안내하는 메이트',
    topLine: '체크리스트에서',
    bottomLine: (
      <>
        하나씩 준비하면서 <span className="text-amber-500">체크</span>하며
        <br />
        출발 전까지 마무리합니다
      </>
    ),
  },
]

/** 홈 푸터 전용: 클릭·포커스는 되지만 라우팅 등 동작 없음 */
function noopFooterAction() {}

function LegalFooterLinks({ className = '', nonInteractive = false }) {
  if (nonInteractive) {
    return (
      <nav className={className} aria-label="법적 안내">
        {FOOTER_BOTTOM_LINKS.map((link, idx) => (
          <span key={link.label} className="inline-flex items-center gap-x-2">
            {idx > 0 && <span className="text-gray-200 select-none" aria-hidden>|</span>}
            <button
              type="button"
              onClick={noopFooterAction}
              className="cursor-pointer border-0 bg-transparent p-0 text-inherit text-gray-500 underline-offset-2 transition-colors hover:text-gray-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1"
            >
              {link.label}
            </button>
          </span>
        ))}
      </nav>
    )
  }
  return (
    <nav className={className} aria-label="법적 안내">
      {FOOTER_BOTTOM_LINKS.map((link, idx) => (
        <span key={link.label} className="inline-flex items-center gap-x-2">
          {idx > 0 && <span className="text-gray-200 select-none" aria-hidden>|</span>}
          <a href={link.href} className="transition-colors hover:text-gray-600">
            {link.label}
          </a>
        </span>
      ))}
    </nav>
  )
}

/** 홈(/) 전용 — 우하단 맨 위로 스크롤 (모바일은 하단 탭 위로 배치) */
function HomeScrollToTopFab() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 360)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goTop = () => {
    const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: instant ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      onClick={goTop}
      aria-label="페이지 맨 위로 이동"
      className={`fixed bottom-20 right-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-900/30 transition-[opacity,transform] duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 md:bottom-8 md:right-6 ${
        visible ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
      }`}
    >
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
      </svg>
    </button>
  )
}

function SocialIcon({ icon }) {
  if (icon === 'linkedin') {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14m-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
      </svg>
    )
  }
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function FeatureSpeechBubble({ text, tone = 'light', tail = 'left' }) {
  const toneClass =
    tone === 'teal'
      ? 'border-teal-500/30 bg-gradient-to-r from-teal-300/58 via-cyan-200/52 to-teal-200/56'
      : 'border-slate-300/70 bg-gradient-to-r from-slate-100/76 to-slate-200/74'
  const textClass = tone === 'teal' ? 'text-[#08414f]' : 'text-[#0e3a45]'
  const bubbleLayoutClass = tone === 'teal' ? 'flex items-center' : 'flex items-center md:block'
  const textLayoutClass = tone === 'teal' ? 'w-full text-center' : 'w-full text-center md:text-left'
  const bubblePaddingClass = tone === 'teal' ? 'px-8 md:px-12' : 'px-8 md:px-12 md:pt-7'
  const tailPositionClass = tail === 'right' ? 'right-10' : 'left-10'
  const tailColorStyle =
    tone === 'teal'
      ? {
          background:
            'linear-gradient(90deg, rgba(94,234,212,0.58) 0%, rgba(165,243,252,0.52) 55%, rgba(153,246,228,0.56) 100%)',
        }
      : {
          background: 'linear-gradient(90deg, rgba(241,245,249,0.76) 0%, rgba(226,232,240,0.74) 100%)',
        }

  return (
    <div
      className={`relative h-[76px] w-full max-w-[520px] rounded-2xl border shadow-[0_10px_24px_rgba(5,46,66,0.10)] backdrop-blur-[3px] md:h-[94px] ${toneClass} ${bubbleLayoutClass} ${bubblePaddingClass}`}
    >
      <span
        className={`absolute -bottom-[14px] h-4 w-8 drop-shadow-[0_4px_6px_rgba(5,46,66,0.08)] ${tailPositionClass}`}
        style={{
          ...tailColorStyle,
          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
        }}
        aria-hidden
      />
      <p
        className={`text-base font-bold leading-tight md:text-[2rem] ${textClass} ${textLayoutClass}`}
        style={{ fontFamily: "'SeoulNotice', system-ui, sans-serif" }}
      >
        {text}
      </p>
    </div>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const [heroRevealed, setHeroRevealed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  const [featuresRef, featuresRevealed] = useRevealOnScrollOnce({
    threshold: 0.2,
    rootMargin: '0px 0px -12% 0px',
  })
  const [processRef, processRevealed] = useRevealOnScrollOnce({
    threshold: 0.16,
    rootMargin: '0px 0px -10% 0px',
  })
  const [ctaRef, ctaRevealed] = useRevealOnScrollOnce({
    threshold: 0.18,
    rootMargin: '0px 0px -10% 0px',
  })
  const [catchphraseRef, catchphraseRevealed] = useRevealOnScrollOnce({
    threshold: 0.2,
    rootMargin: '0px 0px -10% 0px',
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return undefined
    document.documentElement.classList.add(HOME_SCROLL_SNAP_HTML_CLASS)
    return () => {
      document.documentElement.classList.remove(HOME_SCROLL_SNAP_HTML_CLASS)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setHeroRevealed(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      if (raf2) cancelAnimationFrame(raf2)
    }
  }, [])

  return (
    <div className="relative" style={HOME_PAGE_BG_STYLE}>
      {/* 히어로 — 풀블리드 배경, 왼쪽 카피·CTA / 오른쪽 마스코트 PNG */}
      <section
        className={`relative isolate overflow-hidden bg-transparent ${SNAP_SLIDE}`}
      >
        <div
          className="pointer-events-none absolute right-[-2%] top-[-12%] h-[62vw] w-[62vw] max-h-[560px] max-w-[560px] rounded-full bg-amber-200/58 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-[-14%] left-[-6%] h-[36vw] w-[36vw] max-h-[300px] max-w-[300px] rounded-full bg-cyan-300/40 blur-3xl"
          aria-hidden
        />
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 pb-[clamp(3.5rem,10vh,7rem)] pt-[clamp(4.5rem,12vh,8rem)] md:gap-10 md:px-8 md:pb-[clamp(4rem,12vh,7rem)] md:pt-[clamp(5rem,14vh,8rem)] lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-8 lg:px-12">
          {/* order: 모바일만 마스코트(1) → 카피(2) → 스크롤 안내(3) / md~ 는 카피→마스코트 */}
          <div className="order-2 flex w-full min-w-0 max-w-xl flex-col items-start text-left sm:max-w-2xl md:order-1 lg:order-1 lg:flex-1">
            <RevealBlock show={heroRevealed} className="mb-3 w-full md:mb-4">
              <h1 className="text-[1.9rem] font-extrabold leading-[1.25] tracking-tight text-slate-900 sm:text-[2.2rem] md:text-5xl md:leading-tight lg:text-[3.5rem]">
                {HOME_HERO_TITLE_LINES.map((line, i) => (
                  <Fragment key={i}>
                    {i > 0 && <br />}
                    {Array.isArray(line) ? (
                      <>
                        {line[0]}
                        <span className="text-[#3db4dd]">
                          {line[1]}
                        </span>
                        {line[2]}
                      </>
                    ) : (
                      line
                    )}
                  </Fragment>
                ))}
              </h1>
            </RevealBlock>
            <RevealBlock show={heroRevealed} delayClass="delay-[160ms]" className="mb-5 w-full max-w-xl md:mb-8">
              <p className="text-base font-semibold leading-relaxed text-[#0f5762] md:text-[1.25rem]">
                복잡한 여행 준비, 이제는 <span className="font-extrabold text-amber-500">메이트</span>가
                도와드릴게요
              </p>
            </RevealBlock>
            <RevealBlock
              show={heroRevealed}
              delayClass="delay-[320ms]"
              className="flex w-full flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:justify-start sm:gap-4"
            >
              <button
                type="button"
                onClick={() => navigate('/trips/new/destination')}
                className="w-full max-w-sm self-start rounded-xl bg-gradient-to-r from-amber-300 to-amber-400 px-6 py-3.5 text-center text-sm font-bold text-[#6a4a00] shadow-md shadow-amber-900/15 transition hover:from-amber-200 hover:to-amber-300 md:w-auto md:max-w-none md:px-8"
              >
                여행 준비 시작하기
              </button>
            </RevealBlock>
          </div>
          <RevealBlock
            show={heroRevealed}
            delayClass="delay-[400ms]"
            className="order-1 flex w-full min-w-0 shrink-0 justify-center md:order-2 lg:order-2 lg:w-auto lg:max-w-[min(42vw,400px)] lg:flex-none lg:justify-center"
          >
            <div className="mx-auto w-full max-w-[300px] md:max-w-[420px] lg:flex lg:w-full lg:max-w-[520px] lg:justify-center">
              <img
                src={homeHeroMascotUrl}
                alt="CHECKMATE 마스코트 — 여행 가방과 카메라를 든 체스 기사 캐릭터"
                className="mx-auto block h-auto w-full object-contain object-center drop-shadow-[0_10px_24px_rgba(15,23,42,0.25)] lg:max-w-full lg:object-bottom"
                loading="eager"
                decoding="async"
              />
            </div>
          </RevealBlock>
          {/* 다음 섹션 스크롤 유도 — lg 에서는 한 줄 전체(basis-full)로 아래에 배치 */}
          <div
            className="order-3 flex w-full basis-full flex-col items-center pt-12 md:pt-20 lg:pt-24"
            aria-hidden
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 md:text-[11px]">
              Scroll down
            </span>
            <svg
              className="mt-1.5 h-5 w-5 text-gray-500 motion-safe:animate-bounce motion-reduce:animate-none"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
            </svg>
          </div>
        </div>
      </section>

      {/* 피처 — 시안 구조: 상단 카피 + 좌 말풍선 3개 + 우 마스코트 */}
      <section
        id={LANDING_SECTION_IDS.features}
        className={`${SNAP_SLIDE} relative overflow-hidden bg-transparent py-12 md:py-16`}
        aria-labelledby="landing-features-title"
      >
        <div
          className="pointer-events-none absolute -left-24 -top-16 h-[36vw] w-[36vw] max-h-[300px] max-w-[300px] rounded-full bg-cyan-300/40 blur-3xl md:-left-20 md:-top-20"
          aria-hidden
        />
        <div ref={featuresRef} className="mx-auto max-w-6xl px-5 md:px-6">
          <RevealBlock show={featuresRevealed}>
            <h2
              id="landing-features-title"
              className="mx-auto mb-12 max-w-4xl text-center text-[1.65rem] font-extrabold leading-tight text-[#04384a] md:mb-14 md:text-[3.25rem]"
            >
              <span className="block">조건만 입력하면,</span>
              <span className="block">
                메이트가 <span className="text-amber-500">자동 생성</span>해드려요!
              </span>
            </h2>
          </RevealBlock>
          <div className="grid items-center gap-8 md:grid-cols-[1.35fr_1fr] md:gap-10">
            <div className="relative flex w-full max-w-[640px] flex-col gap-3 md:ml-4 md:gap-4">
              <RevealBlock
                show={featuresRevealed}
                delayClass={FEATURE_CARD_REVEAL_DELAY_CLASS[0]}
                className="relative z-[3] flex w-full justify-start pr-10 md:pr-12"
              >
                <FeatureSpeechBubble text="어디로 떠날 예정이세요?" tone="light" tail="left" />
              </RevealBlock>

              <RevealBlock
                show={featuresRevealed}
                delayClass={FEATURE_CARD_REVEAL_DELAY_CLASS[1]}
                className="relative z-[2] -mt-1 flex w-full justify-end pl-10 md:-mt-2 md:pl-12"
              >
                <FeatureSpeechBubble text="누구와 함께하세요?" tone="teal" tail="right" />
              </RevealBlock>

              <RevealBlock
                show={featuresRevealed}
                delayClass={FEATURE_CARD_REVEAL_DELAY_CLASS[2]}
                className="relative z-[1] -mt-1 flex w-full justify-start pr-10 md:-mt-2 md:pr-12"
              >
                <FeatureSpeechBubble text="여행 스타일은 어떠세요?" tone="light" tail="left" />
              </RevealBlock>
            </div>

            <RevealBlock show={featuresRevealed} delayClass="delay-[480ms]" className="flex justify-center md:justify-end">
              <img
                src={featureMascotQuestionUrl}
                alt="질문표시와 함께 놀란 메이트 마스코트"
                className="h-auto w-full max-w-[320px] object-contain md:max-w-[360px]"
                loading="lazy"
                decoding="async"
              />
            </RevealBlock>
          </div>

          <RevealBlock show={featuresRevealed} delayClass="delay-[620ms]">
            <p className="mx-auto mt-8 max-w-4xl text-center text-[1.05rem] font-extrabold leading-snug text-[#083a4a] md:mt-10 md:text-[1.7rem]">
              <span className="md:hidden">
                간단한 조건 입력만으로 메이트가
                <br />
                필요한 준비물과 주의사항을
                <br />
                한 번에 정리해서 <span className="text-amber-500">체크리스트</span>로 제공해드려요!
              </span>
              <span className="hidden md:inline">
                간단한 조건 입력만으로 메이트가 필요한 준비물과 주의사항을
                <br />
                한 번에 정리해서 <span className="text-amber-500">체크리스트</span>로 제공해드려요!
              </span>
            </p>
          </RevealBlock>
        </div>
      </section>

      {/* 프로세스 — 예시 기반 3카드 구조 */}
      <section
        id={LANDING_SECTION_IDS.how}
        className={`${SNAP_SLIDE} bg-transparent py-12 md:py-16`}
        aria-labelledby="landing-how-title"
      >
        <div ref={processRef} className="mx-auto max-w-6xl px-5 md:px-6">
          <RevealBlock show={processRevealed}>
            <h2
              id="landing-how-title"
              className="text-center text-[2.2rem] font-extrabold leading-tight text-[#083a4a] md:text-[3.2rem]"
            >
              어떻게 이용할까요?
            </h2>
            <p className="mt-2 text-center text-base font-extrabold text-[#0d4b5b] md:text-[1.25rem]">
              <span className="md:hidden">
                복잡한 단계 없이
                <br />
                <span className="text-amber-500">저장</span> -&gt; <span className="text-amber-500">확인</span>{' '}
                -&gt; <span className="text-amber-500">체크</span>만 기억하세요!
              </span>
              <span className="hidden md:inline">
                복잡한 단계 없이 <span className="text-amber-500">저장</span> -&gt;{' '}
                <span className="text-amber-500">확인</span> -&gt; <span className="text-amber-500">체크</span>만
                기억하세요!
              </span>
            </p>
          </RevealBlock>

          <div className="mt-10 grid gap-6 md:mt-12 md:grid-cols-3 md:gap-7">
            {HOME_QUICK_FLOW_CARDS.map((card, index) => (
              <RevealBlock
                key={card.id}
                show={processRevealed}
                delayClass={FEATURE_CARD_REVEAL_DELAY_CLASS[index]}
              >
                <article className="flex h-full min-h-[318px] flex-col items-center rounded-3xl border border-slate-300/60 bg-slate-50 px-6 py-7 text-center shadow-[0_14px_30px_rgba(13,58,76,0.18)]">
                  <div className="flex h-[130px] w-[130px] items-center justify-center rounded-[2rem] bg-[#f3ebce]">
                    <img
                      src={card.imageSrc}
                      alt={card.imageAlt}
                      className="h-[112px] w-[112px] object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <p className="mt-8 text-[1.45rem] font-extrabold leading-tight text-[#113e4b] md:text-[1.3rem]">
                    <span className="block">{card.topLine}</span>
                    <span className="block">{card.bottomLine}</span>
                  </p>
                </article>
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — 시안 기반 장면형 섹션 */}
      <section className={`${SNAP_SLIDE} bg-transparent py-0`}>
        <div ref={ctaRef} className="w-full">
          <div className="relative w-full overflow-hidden bg-transparent pb-0 pt-6 md:pt-8">
            <RevealBlock show={ctaRevealed} className="relative z-20 -mt-4 mx-auto w-fit px-4 text-center md:-mt-8 md:px-0 md:text-center">
              <p
                className="text-[2rem] font-extrabold leading-[1.14] text-[#083a4a] md:text-[3.75rem]"
                style={{ fontFamily: "'SeoulNotice', system-ui, sans-serif" }}
              >
                이제 <img src={ctaWordMateUrl} alt="MATE" className="mx-1 inline-block h-[0.9em] w-auto align-[-0.08em] md:mx-2" />
                와 함께
                <br />
                <img src={ctaWordCheckUrl} alt="CHECK" className="mr-1 inline-block h-[0.9em] w-auto align-[-0.08em] md:mr-2" />
                하러 가볼까요?
              </p>
            </RevealBlock>

            <RevealBlock
              show={ctaRevealed}
              delayClass="delay-[200ms]"
              className="relative mt-5 flex justify-center md:mt-8"
            >
              <img
                src={ctaSceneUrl}
                alt="여행 가방을 든 메이트와 깃발을 든 작은 메이트가 체스판 위에 서 있는 장면"
                className="mx-auto block h-auto w-full max-w-[560px] object-contain md:max-w-[960px] lg:max-w-[1120px]"
                loading="lazy"
                decoding="async"
              />
            </RevealBlock>
          </div>
        </div>
      </section>

      {/* 캐치프레이즈 + 푸터: tail 그룹(내부는 스냅 없음 → 푸터로 자연 스크롤) */}
      <div className={SNAP_TAIL_GROUP}>
      <section
        className="snap-none relative isolate flex min-h-[100dvh] flex-col justify-center overflow-hidden bg-transparent py-14 md:py-20"
      >
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-full -translate-y-1/2 rounded-full bg-teal-300/38 blur-3xl md:ml-[-30rem]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 top-1/4 h-60 w-60 rounded-full bg-cyan-300/45 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-4 left-1/4 h-44 w-44 -translate-x-1/2 rounded-full bg-emerald-200/55 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-8 right-8 h-36 w-36 rounded-full bg-amber-200/60 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage: `radial-gradient(circle at 18% 22%, rgba(45, 212, 191, 0.14) 0%, transparent 45%),
              radial-gradient(circle at 88% 72%, rgba(6, 182, 212, 0.12) 0%, transparent 42%),
              radial-gradient(circle at 48% 100%, rgba(251, 191, 36, 0.1) 0%, transparent 38%)`,
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[length:22px_22px] opacity-[0.08]"
          style={{
            backgroundImage:
              'radial-gradient(circle at center, rgba(13, 148, 136, 0.12) 1.5px, transparent 1.6px)',
          }}
          aria-hidden
        />

        <div
          ref={catchphraseRef}
          className="relative z-10 mx-auto w-full max-w-3xl px-5 md:max-w-4xl md:px-6"
          style={{ fontFamily: "'SeoulNotice', system-ui, sans-serif" }}
        >
          <RevealBlock show={catchphraseRevealed}>
            <p className="text-center text-xl font-extrabold leading-snug text-teal-900 md:text-2xl md:leading-snug lg:text-[1.7rem]">
              <span className="block">{HOME_CATCHPHRASE_DISPLAY.line1}</span>
              <span className="mt-2 inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 md:mt-2.5 md:gap-x-2.5">
                <BrandLogo
                  className="h-7 w-auto shrink-0 object-contain md:h-8 lg:h-9"
                  alt="CHECKMATE"
                />
                <span>{HOME_CATCHPHRASE_DISPLAY.afterLogo}</span>
              </span>
            </p>
          </RevealBlock>
        </div>
      </section>

      <footer className="snap-none bg-transparent py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-5 md:px-6">
          <div className="flex flex-col gap-10 md:flex-row md:justify-between md:gap-12">
            <div className="max-w-xs">
              <BrandLogo className="h-7 w-auto" />
              <p className="mt-3 text-xs leading-relaxed text-gray-600">{HOME_BRAND_TAGLINE}</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <button
                  type="button"
                  onClick={noopFooterAction}
                  className="cursor-pointer border-0 bg-transparent p-0 text-gray-500 transition-colors hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1"
                >
                  홈
                </button>
                <button
                  type="button"
                  onClick={noopFooterAction}
                  className="cursor-pointer border-0 bg-transparent p-0 text-gray-500 transition-colors hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1"
                >
                  공지·소식
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:gap-10">
              {FOOTER_SECTIONS.map((section) => (
                <div key={section.id}>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-900">
                    {section.title}
                  </p>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link}>
                        <button
                          type="button"
                          onClick={noopFooterAction}
                          className="w-full cursor-pointer border-0 bg-transparent p-0 text-left text-sm text-gray-600 transition-colors hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1"
                        >
                          {link}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-200/80 pt-8 md:flex-row">
            <div className="flex items-center gap-4 text-gray-500">
              {FOOTER_SOCIAL_LINKS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={noopFooterAction}
                  aria-label={s.label}
                  className="cursor-pointer border-0 bg-transparent p-0 text-gray-500 transition-colors hover:text-teal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1"
                >
                  <SocialIcon icon={s.icon} />
                </button>
              ))}
            </div>
            <LegalFooterLinks
              nonInteractive
              className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs text-gray-500"
            />
          </div>
          <p className="mt-6 text-center text-xs text-gray-400 md:text-right">
            © {new Date().getFullYear()} CHECKMATE. 무단 복제 및 배포를 금합니다.
          </p>
        </div>
      </footer>
      </div>

      <HomeScrollToTopFab />
    </div>
  )
}

export default HomePage
