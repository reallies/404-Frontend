/**
 * Step3/4 데스크톱: 화면 전체 너비 기준 왼쪽 끝→중앙까지 민트가 옅어지고
 * 비주얼(사진 또는 글로브)이 점점 선명해지는 풀블리드 레이어.
 * Step3·Step4 동일한 그라데이션·마스크 상수 사용.
 */
const MINT = '224, 247, 250'
const MINT_SOFT = '240, 253, 250'

const mintWashFullBleed = {
  background: `linear-gradient(to right,
    rgba(240, 253, 250, 0.98) 0%,
    rgba(${MINT}, 0.88) 18%,
    rgba(${MINT}, 0.55) 36%,
    rgba(${MINT}, 0.22) 46%,
    rgba(${MINT_SOFT}, 0.06) 52%,
    transparent 58%
  )`,
}

const mintVeilSoft = {
  background: `linear-gradient(to right,
    rgba(${MINT}, 0.35) 0%,
    rgba(${MINT}, 0.12) 44%,
    transparent 58%
  )`,
}

/** 가로 방향 선명도 — 이미지·글로브 콘텐츠 공통 */
const SHARP_MASK =
  'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.08) 28%, rgba(0,0,0,0.45) 44%, rgba(0,0,0,0.88) 54%, #000 62%, #000 100%)'

export function FullBleedMintImageHero({ src, alt }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#E0F7FA]">
      <img
        src={src}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-105 object-cover opacity-95 blur-[38px]"
        loading="eager"
      />
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        style={{
          maskImage: SHARP_MASK,
          WebkitMaskImage: SHARP_MASK,
        }}
      />
      <div className="absolute inset-0" style={mintVeilSoft} />
      <div className="absolute inset-0" style={mintWashFullBleed} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/18 via-transparent to-black/52" />
    </div>
  )
}

/**
 * Step4 글로브 — Step3와 동일 스택: 베이스 민트 → 마스크된 콘텐츠 → mintVeilSoft → mintWashFullBleed → 하단 비네트
 * (WebGL은 한 겹만 두고, 가로 페이드는 이미지 히어로와 같은 SHARP_MASK 적용)
 */
export function FullBleedMintGlobeHero({ globe }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#E0F7FA]">
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          maskImage: SHARP_MASK,
          WebkitMaskImage: SHARP_MASK,
        }}
      >
        {globe}
      </div>
      <div className="absolute inset-0" style={mintVeilSoft} />
      <div className="absolute inset-0" style={mintWashFullBleed} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/18 via-transparent to-black/52" />
    </div>
  )
}
