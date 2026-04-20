import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IMAGES } from '@/images/constants'
import { FEATURE_CARDS, FOOTER_SECTIONS, FOOTER_BOTTOM_LINKS } from '@/mocks/homeData'
import BrandLogo from '@/components/common/BrandLogo'
import { AUTH_CONSENT_PATH, AUTH_CONSENT_PREVIEW_PARAM } from '@/utils/onboardingGate'
import homeMobileHeroTravel from '@/assets/home-mobile-hero-travel.png'

const SLIDE_INTERVAL = 5000
const HERO_SLIDES = IMAGES.home.heroSlides

/** 문의하기 · 개인정보 · 약관 — 푸터 하단 공통 */
function LegalFooterLinks({ className = '' }) {
  return (
    <nav className={className} aria-label="법적 안내">
      {FOOTER_BOTTOM_LINKS.map((link, idx) => (
        <span key={link.label} className="inline-flex items-center gap-x-2">
          {idx > 0 && <span className="text-gray-200 select-none" aria-hidden>|</span>}
          <a href={link.href} className="hover:text-gray-600 transition-colors">
            {link.label}
          </a>
        </span>
      ))}
    </nav>
  )
}

/** 히어로 슬라이드 이미지 (데스크톱·모바일 공용, 레이아웃만 반응형) */
function HeroSlideshow({ currentSlide }) {
  return (
    <>
      {HERO_SLIDES.map((src, idx) => (
        <img
          key={src}
          src={src}
          alt={`여행 풍경 ${idx + 1}`}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ease-in-out"
          style={{ opacity: idx === currentSlide ? 1 : 0 }}
          loading={idx === 0 ? 'eager' : 'lazy'}
        />
      ))}
    </>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    let timer
    const tick = () => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }
    const sync = () => {
      clearInterval(timer)
      if (mq.matches) timer = setInterval(tick, SLIDE_INTERVAL)
    }
    sync()
    mq.addEventListener('change', sync)
    return () => {
      mq.removeEventListener('change', sync)
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="bg-white">
      {/* 히어로 — 웹과 동일 카피·구조, 모바일은 세로 스택 */}
      <section
        className="relative overflow-hidden pb-0 md:min-h-[520px] md:pb-0"
        style={{
          background: 'linear-gradient(135deg, #ECFDF5 0%, #E0F2FE 30%, #EDE9FE 65%, #FDF2F8 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute hidden md:block"
          style={{
            width: '40vw',
            height: '40vw',
            top: '-12vw',
            right: '-5vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="pointer-events-none absolute hidden md:block"
          style={{
            width: '30vw',
            height: '30vw',
            bottom: '-8vw',
            left: '10vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(167,139,250,0.10) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
        <div
          className="pointer-events-none absolute hidden md:block"
          style={{
            width: '20vw',
            height: '20vw',
            top: '20%',
            left: '-5vw',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(251,191,36,0.07) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <div className="relative z-10 mx-auto max-w-6xl px-5 pt-6 md:px-6 md:py-20">
          <div className="mx-auto max-w-md md:mx-0">
            <span
              className="mb-4 inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white shadow-sm md:mb-6 md:px-4 md:py-1.5 md:text-xs"
              style={{ background: 'linear-gradient(135deg, #06B6D4, #8B5CF6)' }}
            >
              Editorial Curation
            </span>
            <h1 className="mb-3 text-3xl font-extrabold leading-tight text-gray-900 md:mb-5 md:text-5xl">
              여행은 가는데…
              <br />
              준비는 안 했죠?
            </h1>
            <p className="mb-6 max-w-md text-sm leading-relaxed text-gray-500 md:mb-8 md:text-base">
              찾기만 하고 끝나는 여행 준비는 그만
              <br />
              저장부터 체크까지 한 번에 체크리스트로 여행 준비를 완성하세요.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/trips/new/step2')}
                className="rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.03] hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #06B6D4, #8B5CF6)' }}
              >
                시작하기
              </button>
              <button
                type="button"
                onClick={() => navigate(`${AUTH_CONSENT_PATH}?${AUTH_CONSENT_PREVIEW_PARAM}=1`)}
                className="rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 shadow-sm transition-colors hover:bg-amber-100"
              >
                약관 동의 페이지 (작업 중)
              </button>
            </div>
          </div>
        </div>

        {/* 모바일: 히어로 단일 이미지 — 하단만 라운드. 뒤에 직사각 흰 판을 두어 border-radius 바깥 삼각형에 그라데이션이 비치지 않게 함 */}
        <div className="relative z-[1] mt-8 h-64 w-full md:hidden">
          <div className="absolute inset-0 bg-white" aria-hidden />
          <div className="absolute inset-0 overflow-hidden rounded-b-2xl">
            <img
              src={homeMobileHeroTravel}
              alt="비행기 창밖으로 보이는 구름 위의 여행 풍경"
              className="absolute left-1/2 top-1/2 h-[106%] w-[106%] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover object-[58%_36%]"
              loading="eager"
            />
          </div>
        </div>

        {/* 데스크톱: 오른쪽 풀블리드 슬라이드 + 마스크 */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-[1] hidden h-full w-[55%] md:block"
          style={{
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.7) 40%, black 60%)',
            maskImage:
              'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.7) 40%, black 60%)',
          }}
        >
          <div className="pointer-events-auto relative h-full w-full">
            <HeroSlideshow currentSlide={currentSlide} />
          </div>
        </div>
      </section>

      {/* 가치 제안 — 웹·모바일 동일 */}
      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-5 text-center md:px-6">
          <h2 className="mb-3 text-2xl font-extrabold text-gray-900 md:mb-4 md:text-3xl">
            여행 준비를 빠짐없이,
            <br />
            한곳에서 완성하세요
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-gray-500 md:text-base">
            항공·일정을 바탕으로 필요한 준비물과 방문 동선을 정리하고, 출발 전까지 체크리스트로 확인할 수 있도록 돕습니다. 흩어진
            메모와 검색에 그치지 않고, 저장부터 확인까지 이어지는 준비 흐름을 제공합니다.
          </p>
        </div>
      </section>

      {/* 피처 카드 — 웹과 동일 카피·태그, 아이콘은 데스크톱 스타일로 통일 */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-5 pb-10 md:px-6 md:py-12 md:pb-12">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {FEATURE_CARDS.map((card) => {
              const isHighlight = card.variant === 'highlight'

              return (
                <div
                  key={card.id}
                  className={`relative overflow-hidden rounded-2xl p-6 shadow-sm ${
                    isHighlight ? 'bg-amber-400' : 'border border-gray-100 bg-white'
                  }`}
                >
                  <div className="mb-4">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${card.desktopIcon.bg}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 ${card.desktopIcon.color}`}
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d={card.desktopIcon.path} />
                      </svg>
                    </span>
                  </div>

                  <h3 className={`mb-2 text-base font-bold ${isHighlight ? 'text-amber-900' : 'text-gray-900'}`}>
                    {card.title}
                  </h3>

                  <p className={`mb-4 text-sm leading-relaxed ${isHighlight ? 'text-amber-800 md:mb-6' : 'text-gray-500 md:mb-4'}`}>
                    {card.description}
                  </p>

                  {card.tags && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {card.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {card.progress && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-extrabold text-amber-900">{card.progress.value}</span>
                      <span className="text-sm font-medium text-amber-800">{card.progress.label}</span>
                    </div>
                  )}

                  {isHighlight && (
                    <>
                      <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-amber-300/40" />
                      <div className="absolute -right-2 -top-8 h-20 w-20 rounded-full bg-amber-300/30" />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 여행 준비 흐름 — 웹·모바일 동일, 모바일은 세로 스택 */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-12 md:py-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 md:px-6 lg:flex-row lg:items-center lg:gap-16">
          <div className="min-w-0 flex-1">
            <p className="mb-3 text-xs font-semibold tracking-widest text-teal-600/90">여행 준비 흐름</p>
            <h2 className="mb-4 text-2xl font-extrabold leading-snug text-gray-900 md:text-[26px]">
              항공·일정을 넣으면
              <br />
              준비물과 동선이 정리됩니다
            </h2>
            <p className="mb-6 max-w-md text-sm leading-relaxed text-gray-600">
              목적지와 여행 기간에 맞춰 필요한 준비 항목을 골라 담고, 동네·일정별로 나눠 볼 수 있습니다. 저장해 둔 가이드는
              보관함에서 다시 열고, 출발 전에는 체크리스트로 빠짐없이 확인하세요.
            </p>
            <button
              type="button"
              onClick={() => navigate('/trips/new/step2')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-teal-700"
            >
              여행 준비 시작하기
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </button>
          </div>

          <div className="flex flex-shrink-0 justify-center gap-4 sm:gap-5 lg:justify-end">
            <div className="h-52 w-36 overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 sm:h-56 sm:w-44">
              <img
                src={IMAGES.home.editorial1}
                alt="여행 일정과 준비물을 정리하는 모습"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="mt-6 h-52 w-36 overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 sm:mt-10 sm:h-56 sm:w-44">
              <img
                src={IMAGES.home.editorial2}
                alt="목적지와 동선을 확인하는 지도"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 푸터 — 웹과 동일 정보, 모바일은 세로 스택 */}
      <footer className="border-t border-gray-100 bg-white py-10 md:py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 md:flex-row md:flex-wrap md:items-start md:justify-between md:gap-10 md:px-6">
          <div className="max-w-xs">
            <div className="mb-2">
              <BrandLogo className="h-6 w-auto" />
            </div>
            <p className="text-xs leading-relaxed text-gray-500">
              항공·일정을 바탕으로 준비물과 방문 동선을 정리하고, 체크리스트로 출발 전까지 한눈에 확인할 수 있는 여행 준비
              서비스입니다.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
              <Link to="/" className="text-xs text-gray-400 transition-colors hover:text-gray-600">
                홈
              </Link>
              <a href="#" className="text-xs text-gray-400 transition-colors hover:text-gray-600">
                공지·소식
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:flex md:flex-1 md:flex-wrap md:justify-end md:gap-10">
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.id} className="min-w-[140px]">
                <p className="mb-3 text-xs font-semibold tracking-wide text-gray-900 md:mb-4">{section.title}</p>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-gray-500 transition-colors hover:text-gray-900">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-6xl border-t border-gray-50 px-5 pt-6 md:mt-10 md:px-6">
          <LegalFooterLinks className="mb-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs text-gray-400 md:mb-5" />
          <p className="text-center text-xs text-gray-400">© 2024 CHECKMATE. 무단 복제 및 배포를 금합니다.</p>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
