import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IMAGES } from '@/images/constants'
import WeatherOverlayCard from '@/images/WeatherOverlayCard'
import { FEATURE_CARDS, FOOTER_SECTIONS, FOOTER_BOTTOM_LINKS } from '@/mocks/homeData'
import AiPlannerFab from '@/components/common/AiPlannerFab'

/* ─────────────────────────────────────────────
   원형 진행률 SVG (모바일 Progress Card)
   색상: blue → cyan (#06B6D4)
───────────────────────────────────────────── */
function CircularProgress({ percent = 85, size = 64 }) {
  const r = (size - 8) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - percent / 100)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* 배경 링 */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#CFFAFE" strokeWidth={6} />
        {/* 진행 링 - cyan */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#06B6D4"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {/* 비행기 아이콘 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-cyan-500"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </svg>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   메인 컴포넌트
───────────────────────────────────────────── */
const SLIDE_INTERVAL = 5000
const HERO_SLIDES = IMAGES.home.heroSlides

function HomePage() {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, SLIDE_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-white">

      {/* ══════════════════════════════════
          [MOBILE ONLY] 히어로 이미지
      ══════════════════════════════════ */}
      <section className="md:hidden relative h-[55vw] min-h-64 max-h-96 overflow-hidden">
        <img
          src={IMAGES.home.heroMobile}
          alt="파리 에펠탑"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </section>

      {/* [MOBILE ONLY] 히어로 텍스트 */}
      <section className="md:hidden px-5 pt-5 pb-4">
        {/* 이미지에서 badge는 채움 없이 cyan 텍스트 스타일 */}
        <span className="inline-block text-cyan-500 text-[10px] font-bold tracking-widest uppercase mb-3">
          Exclusive Journey
        </span>
        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">
          For a new<br />beginning<br />of travel
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          가장 완벽한 여행을 위한<br />건축석 준비 과정.
        </p>
      </section>

      {/* [MOBILE ONLY] 진행률 카드 */}
      <section className="md:hidden px-5 pb-6">
        <div className="bg-white rounded-2xl p-5 flex items-center justify-between shadow-sm border border-gray-100">
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-1">
              Current Progress
            </p>
            <p className="text-4xl font-extrabold text-gray-900">
              85<span className="text-2xl font-bold">%</span>
            </p>
          </div>
          <CircularProgress percent={85} size={72} />
        </div>
      </section>

      {/* ══════════════════════════════════
          [DESKTOP ONLY] 히어로 섹션
      ══════════════════════════════════ */}
      <section
        className="hidden md:block relative overflow-hidden min-h-[520px]"
        style={{
          background: 'linear-gradient(135deg, #ECFDF5 0%, #E0F2FE 30%, #EDE9FE 65%, #FDF2F8 100%)',
        }}
      >
        {/* 장식 블러 오브 */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '40vw', height: '40vw', top: '-12vw', right: '-5vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            width: '30vw', height: '30vw', bottom: '-8vw', left: '10vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(167,139,250,0.10) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            width: '20vw', height: '20vw', top: '20%', left: '-5vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251,191,36,0.07) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* 오른쪽: 풀블리드 이미지 슬라이드쇼 (왼→오 페이드) */}
        <div
          className="absolute top-0 right-0 w-[55%] h-full"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.7) 40%, black 60%)',
            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.7) 40%, black 60%)',
          }}
        >
          {HERO_SLIDES.map((src, idx) => (
            <img
              key={src}
              src={src}
              alt={`여행 풍경 ${idx + 1}`}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out"
              style={{ opacity: idx === currentSlide ? 1 : 0 }}
              loading={idx === 0 ? 'eager' : 'lazy'}
            />
          ))}
        </div>

        {/* 이미지 위 오버레이 카드 */}
        <div className="absolute top-0 right-0 w-[55%] h-full pointer-events-none">
          <div className="relative w-full h-full pointer-events-auto">
            <WeatherOverlayCard />
          </div>
        </div>

        {/* 왼쪽: 텍스트 콘텐츠 */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-md">
            <span
              className="inline-block text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6 text-white shadow-sm"
              style={{ background: 'linear-gradient(135deg, #06B6D4, #8B5CF6)' }}
            >
              Editorial Curation
            </span>
            <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-5">
            여행은 가는데…<br />준비는 안 했죠?
            </h1>
            <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
            찾기만 하고 끝나는 여행 준비는 그만<br />
            저장부터 체크까지 한 번에 체크리스트로 여행 준비를 완성하세요.
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/trips/new/step2')}
                className="text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-[1.03]"
                style={{ background: 'linear-gradient(135deg, #06B6D4, #8B5CF6)' }}
              >
                시작하기
              </button>
              <button className="text-gray-600 hover:text-gray-900 font-medium text-sm flex items-center gap-1.5 transition-colors">
                사용 방법 보기
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          [DESKTOP ONLY] 가치 제안 섹션
      ══════════════════════════════════ */}
      <section className="hidden md:block bg-white py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            여행 준비의 스트레스를<br />창조적인 경험으로
          </h2>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            인증되진 베이스캠프전에를 넘어서 나만의 시스템으로 분석 부여할 수 있는 4코스를에서 찾겠습니다.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════
          피처 카드 섹션 (데스크탑/모바일 공용)
      ══════════════════════════════════ */}
      <section className="bg-white">
        {/* 모바일: 섹션 헤더 */}
        <div className="md:hidden flex items-center justify-between px-5 pb-3 pt-1">
          <h2 className="text-base font-bold text-gray-900">준비 루틴을 시작할까요?</h2>
          <button
            onClick={() => navigate('/trips')}
            className="text-cyan-500 text-sm font-medium"
          >
            See All
          </button>
        </div>

        <div className="mx-auto max-w-6xl px-5 md:px-6 pb-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

            {FEATURE_CARDS.map((card) => {
              const isHighlight = card.variant === 'highlight'

              return (
                <div
                  key={card.id}
                  className={`rounded-2xl p-6 shadow-sm relative overflow-hidden ${
                    isHighlight
                      ? 'bg-amber-400'
                      : 'bg-white border border-gray-100'
                  }`}
                >
                  {/* 모바일 아이콘 */}
                  <div className={`w-10 h-10 ${card.mobileIcon.bg} rounded-xl flex items-center justify-center mb-4 md:hidden`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d={card.mobileIcon.path} />
                    </svg>
                  </div>

                  {/* 데스크탑 아이콘 */}
                  <div className="hidden md:block mb-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 ${card.desktopIcon.bg} rounded-lg`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${card.desktopIcon.color}`} viewBox="0 0 24 24" fill="currentColor">
                        <path d={card.desktopIcon.path} />
                      </svg>
                    </span>
                  </div>

                  {/* 제목 */}
                  <h3 className={`text-base font-bold mb-2 ${isHighlight ? 'text-amber-900' : 'text-gray-900'}`}>
                    <span className="hidden md:inline">{card.title.desktop}</span>
                    <span className="md:hidden">{card.title.mobile}</span>
                  </h3>

                  {/* 설명 */}
                  <p className={`text-sm leading-relaxed hidden md:block ${isHighlight ? 'text-amber-800 mb-6' : 'text-gray-500 mb-4'}`}>
                    {card.description.desktop}
                  </p>
                  <p className={`text-sm leading-relaxed md:hidden ${isHighlight ? 'text-amber-800 mb-4' : 'text-gray-500 mb-4'}`}>
                    {card.description.mobile}
                  </p>

                  {/* 태그 배지 (light 카드에만 표시) */}
                  {card.tags && (
                    <div className="hidden md:flex flex-wrap gap-2 mt-4">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 진행률 (highlight 카드에만 표시) */}
                  {card.progress && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-extrabold text-amber-900">{card.progress.value}</span>
                      <span className="text-sm text-amber-800 font-medium">{card.progress.label}</span>
                    </div>
                  )}

                  {/* 배경 데코 원 (highlight 카드에만 표시) */}
                  {isHighlight && (
                    <>
                      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-300/40 rounded-full" />
                      <div className="absolute -right-2 -top-8 w-20 h-20 bg-amber-300/30 rounded-full" />
                    </>
                  )}
                </div>
              )
            })}

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          [DESKTOP ONLY] 에디토리얼 섹션
      ══════════════════════════════════ */}
      <section className="hidden md:block bg-gray-50 py-14">
        <div className="mx-auto max-w-6xl px-6 flex items-center gap-12">
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">
              Editorial Approach
            </p>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-4">
              준비를 넘어선 큐레이션
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-sm">
              우리는 현 일필 특색 (To-do-list)의 한의력에서 브레이크를 넘었습니다. 편역에 이름이 있는 서비스는 살 두려 저장됩니다 여행 이름이 있는 단 사 계있으로 여러행 과정합니다 정확하 이렇게합니다.
            </p>
            <button className="text-sm font-semibold text-cyan-500 hover:text-cyan-600 flex items-center gap-1 transition-colors">
              더 보이보기
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </button>
          </div>

          <div className="flex gap-4 flex-shrink-0">
            <div className="w-36 h-44 rounded-2xl overflow-hidden shadow-sm">
              <img src={IMAGES.home.product1} alt="여행 가방" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="w-36 h-44 rounded-2xl overflow-hidden shadow-sm mt-6">
              <img src={IMAGES.home.product2} alt="카메라" className="w-full h-full object-cover" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          CTA 섹션 (데스크탑/모바일 공용)
      ══════════════════════════════════ */}
      <section className="bg-white py-10 md:py-20">
        {/* 데스크탑 CTA */}
        <div className="hidden md:block text-center mx-auto max-w-xl px-6">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
            준비 루틴을 시작할까요?
          </h2>
          <p className="text-gray-500 text-sm mb-8">당신의 첫 번째 큐레이션이 지금 시작됩니다.</p>
          <button
            onClick={() => navigate('/trips/new/step2')}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-sm px-8 py-4 rounded-xl transition-colors shadow-sm"
          >
            자동 저장하고 나중에 확인하기
          </button>
          <div className="mt-5 flex items-center justify-center gap-6">
            {FOOTER_BOTTOM_LINKS.map((link, idx) => (
              <span key={link.label} className="contents">
                {idx > 0 && <span className="text-gray-200">|</span>}
                <a href={link.href} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  {link.label}
                </a>
              </span>
            ))}
          </div>
        </div>

        {/* 모바일 CTA */}
        <div className="md:hidden px-5">
          <button
            onClick={() => navigate('/trips/new/step2')}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-base py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            Start Planning Now
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
            </svg>
          </button>
          <p className="text-center text-xs text-gray-400 mt-4">
            이미{' '}
            <span className="font-semibold text-cyan-500">12,400명</span>
            의 여행자가 시작했습니다.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════
          [DESKTOP ONLY] 푸터
      ══════════════════════════════════ */}
      <footer className="hidden md:block bg-white border-t border-gray-100 py-12">
        <div className="mx-auto max-w-6xl px-6 flex items-start justify-between">
          <div className="max-w-xs">
            <p className="text-cyan-500 font-semibold text-sm mb-2">The Editorial Architect</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              세상에서 가장 정교한 편 코드로 이루어진 이 프로젝트 입니다.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">홈페이지</a>
              <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">블로그</a>
            </div>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <div key={section.id}>
              <p className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-4">
                {section.title}
              </p>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-6xl px-6 mt-10 pt-6 border-t border-gray-50">
          <p className="text-xs text-gray-400 text-center">
            © 2024 The Editorial Architect · All rights reserved
          </p>
        </div>
      </footer>

      {/* AI 플래너 FAB (화면 고정) */}
      <AiPlannerFab />
    </div>
  )
}

export default HomePage
