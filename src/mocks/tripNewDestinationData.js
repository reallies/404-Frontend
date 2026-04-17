/**
 * TripNewDestinationPage — 방문 국가·날짜 설정 (예매 전 플로우)
 */

export const STEP_DESTINATION_CONFIG = {
  totalSteps: 5,
  currentStep: 2,
}

export const HERO_IMAGE = '/airplane-sky.png'

export const PREVIEW_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=600&auto=format&fit=crop'

export const DESTINATION_ICON_PATHS = {
  mapPin:
    'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
  search:
    'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  calendar:
    'M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z',
}

/**
 * 국가명(한글) 기준 자동완성 · Step4 `destination`과 호환되는 입국 정보
 * name: 표시·검색 기준 국가명
 * aliases: 보조 검색어 (예: '한국' → 대한민국)
 */
export const COUNTRY_ARRIVAL_OPTIONS = [
  { name: '대한민국', aliases: ['한국', '코리아'], iata: 'ICN', city: '인천', country: '대한민국', countryCode: 'KR' },
  { name: '일본', aliases: ['재팬'], iata: 'NRT', city: '도쿄', country: '일본', countryCode: 'JP' },
  { name: '중국', aliases: ['차이나'], iata: 'PEK', city: '베이징', country: '중국', countryCode: 'CN' },
  { name: '미국', aliases: ['USA', 'America'], iata: 'LAX', city: '로스앤젤레스', country: '미국', countryCode: 'US' },
  { name: '미얀마', aliases: ['버마'], iata: 'RGN', city: '양곤', country: '미얀마', countryCode: 'MM' },
  { name: '태국', aliases: [], iata: 'BKK', city: '방콕', country: '태국', countryCode: 'TH' },
  { name: '베트남', aliases: [], iata: 'SGN', city: '호치민', country: '베트남', countryCode: 'VN' },
  { name: '싱가포르', aliases: ['싱가폴'], iata: 'SIN', city: '싱가포르', country: '싱가포르', countryCode: 'SG' },
  { name: '말레이시아', aliases: [], iata: 'KUL', city: '쿠알라룸푸르', country: '말레이시아', countryCode: 'MY' },
  { name: '인도네시아', aliases: [], iata: 'DPS', city: '덴파사르', country: '인도네시아', countryCode: 'ID' },
  { name: '필리핀', aliases: [], iata: 'MNL', city: '마닐라', country: '필리핀', countryCode: 'PH' },
  { name: '대만', aliases: ['타이완'], iata: 'TPE', city: '타이베이', country: '대만', countryCode: 'TW' },
  { name: '홍콩', aliases: ['HK'], iata: 'HKG', city: '홍콩', country: '홍콩', countryCode: 'HK' },
  { name: '마카오', aliases: [], iata: 'MFM', city: '마카오', country: '마카오', countryCode: 'MO' },
  { name: '프랑스', aliases: [], iata: 'CDG', city: '파리', country: '프랑스', countryCode: 'FR' },
  { name: '이탈리아', aliases: [], iata: 'FCO', city: '로마', country: '이탈리아', countryCode: 'IT' },
  { name: '스페인', aliases: [], iata: 'MAD', city: '마드리드', country: '스페인', countryCode: 'ES' },
  { name: '독일', aliases: [], iata: 'FRA', city: '프랑크푸르트', country: '독일', countryCode: 'DE' },
  { name: '영국', aliases: ['UK', '잉글랜드'], iata: 'LHR', city: '런던', country: '영국', countryCode: 'GB' },
  { name: '스위스', aliases: [], iata: 'ZRH', city: '취리히', country: '스위스', countryCode: 'CH' },
  { name: '네덜란드', aliases: ['홀란드'], iata: 'AMS', city: '암스테르담', country: '네덜란드', countryCode: 'NL' },
  { name: '오스트리아', aliases: [], iata: 'VIE', city: '비엔나', country: '오스트리아', countryCode: 'AT' },
  { name: '체코', aliases: [], iata: 'PRG', city: '프라하', country: '체코', countryCode: 'CZ' },
  { name: '폴란드', aliases: [], iata: 'WAW', city: '바르샤바', country: '폴란드', countryCode: 'PL' },
  { name: '터키', aliases: [], iata: 'IST', city: '이스탄불', country: '터키', countryCode: 'TR' },
  { name: '그리스', aliases: [], iata: 'ATH', city: '아테네', country: '그리스', countryCode: 'GR' },
  { name: '호주', aliases: [], iata: 'SYD', city: '시드니', country: '호주', countryCode: 'AU' },
  { name: '뉴질랜드', aliases: [], iata: 'AKL', city: '오클랜드', country: '뉴질랜드', countryCode: 'NZ' },
  { name: '캐나다', aliases: [], iata: 'YVR', city: '밴쿠버', country: '캐나다', countryCode: 'CA' },
  { name: '멕시코', aliases: [], iata: 'MEX', city: '멕시코시티', country: '멕시코', countryCode: 'MX' },
  { name: '브라질', aliases: [], iata: 'GRU', city: '상파울루', country: '브라질', countryCode: 'BR' },
  { name: '아르헨티나', aliases: [], iata: 'EZE', city: '부에노스아이레스', country: '아르헨티나', countryCode: 'AR' },
  { name: '칠레', aliases: [], iata: 'SCL', city: '산티아고', country: '칠레', countryCode: 'CL' },
  { name: '이집트', aliases: [], iata: 'CAI', city: '카이로', country: '이집트', countryCode: 'EG' },
  { name: '모로코', aliases: [], iata: 'CMN', city: '카사블랑카', country: '모로코', countryCode: 'MA' },
  { name: '남아프리카공화국', aliases: ['남아공'], iata: 'JNB', city: '요하네스버그', country: '남아프리카공화국', countryCode: 'ZA' },
  { name: '아랍에미리트', aliases: ['UAE', '두바이'], iata: 'DXB', city: '두바이', country: '아랍에미리트', countryCode: 'AE' },
  { name: '카타르', aliases: [], iata: 'DOH', city: '도하', country: '카타르', countryCode: 'QA' },
  { name: '사우디아라비아', aliases: ['사우디'], iata: 'RUH', city: '리야드', country: '사우디아라비아', countryCode: 'SA' },
  { name: '이스라엘', aliases: [], iata: 'TLV', city: '텔아비브', country: '이스라엘', countryCode: 'IL' },
  { name: '인도', aliases: [], iata: 'DEL', city: '델리', country: '인도', countryCode: 'IN' },
  { name: '스리랑카', aliases: [], iata: 'CMB', city: '콜롬보', country: '스리랑카', countryCode: 'LK' },
  { name: '네팔', aliases: [], iata: 'KTM', city: '카트만두', country: '네팔', countryCode: 'NP' },
  { name: '몽골', aliases: [], iata: 'UBN', city: '울란바토르', country: '몽골', countryCode: 'MN' },
  { name: '러시아', aliases: [], iata: 'SVO', city: '모스크바', country: '러시아', countryCode: 'RU' },
  { name: '포르투갈', aliases: [], iata: 'LIS', city: '리스본', country: '포르투갈', countryCode: 'PT' },
  { name: '벨기에', aliases: [], iata: 'BRU', city: '브뤼셀', country: '벨기에', countryCode: 'BE' },
  { name: '스웨덴', aliases: [], iata: 'ARN', city: '스톡홀름', country: '스웨덴', countryCode: 'SE' },
  { name: '노르웨이', aliases: [], iata: 'OSL', city: '오슬로', country: '노르웨이', countryCode: 'NO' },
  { name: '덴마크', aliases: [], iata: 'CPH', city: '코펜하겐', country: '덴마크', countryCode: 'DK' },
  { name: '핀란드', aliases: [], iata: 'HEL', city: '헬싱키', country: '핀란드', countryCode: 'FI' },
  { name: '아이슬란드', aliases: [], iata: 'KEF', city: '레이캬비크', country: '아이슬란드', countryCode: 'IS' },
  { name: '헝가리', aliases: [], iata: 'BUD', city: '부다페스트', country: '헝가리', countryCode: 'HU' },
  { name: '루마니아', aliases: [], iata: 'OTP', city: '부쿠레슈티', country: '루마니아', countryCode: 'RO' },
  { name: '크로아티아', aliases: [], iata: 'ZAG', city: '자그레브', country: '크로아티아', countryCode: 'HR' },
  { name: '아일랜드', aliases: [], iata: 'DUB', city: '더블린', country: '아일랜드', countryCode: 'IE' },
]

const MAX_SUGGESTIONS = 14

function matchesCountryQuery(entry, q) {
  if (entry.name.includes(q)) return true
  if (entry.aliases?.some((a) => a.includes(q))) return true
  return false
}

/** 입력 문자열로 국가 목록 필터 (자동완성 드롭다운용) */
export function filterCountriesByQuery(rawQuery) {
  const q = rawQuery.trim()
  if (!q) return []
  return COUNTRY_ARRIVAL_OPTIONS.filter((c) => matchesCountryQuery(c, q)).slice(0, MAX_SUGGESTIONS)
}

/**
 * 국가명 입력용 — 숫자·기호 등만 제거.
 * 한글은 음절(\uAC00-\uD7A3)뿐 아니라 IME 조합 중 자모(\u3130-\u318F, \u1100-\u11FF)도 허용해야
 * 입력창에 글자가 안 써지는 현상(조합 중 문자가 전부 삭제됨)이 나지 않습니다.
 */
export function sanitizeCountryInput(raw) {
  return raw.replace(/[^\uAC00-\uD7A3\u3130-\u318F\u1100-\u11FFa-zA-Z\s·]/g, '')
}

export const AI_TIP = {
  description:
    '목록에서 <strong>국가</strong>를 고르고 여행 기간을 정하면, 그에 맞는 <strong>일정·준비물</strong> 안내를 이어갈 수 있어요. 나중에 항공편을 예약하시면 공항 정보만 다듬으면 됩니다.',
}

export const MOBILE_TIP =
  '국가는 자동완성에서 선택해 주세요. 출발·귀국일까지 입력하면 다음 단계로 갈 수 있어요.'
