/**
 * TripSearchPage 목데이터
 *
 * 여행 컨텍스트(저장 스냅샷용)와 카테고리별 필수품 목데이터를 둡니다.
 * (MVP: 날짜·지역별 세부 안내는 제외) API 연동 시 이 구조를 응답 타입으로 쓸 수 있습니다.
 */

/** 카테고리 필터 탭 (체크리스트 CATEGORIES id와 맞춤) */
export const CATEGORIES = [
  { value: 'all', label: '전체' },
  { value: 'documents', label: '필수 서류' },
  { value: 'electronics', label: '전자 기기' },
  { value: 'clothing', label: '의류 · 신발' },
  { value: 'packing', label: '세면 · 위생' },
  { value: 'health', label: '건강 · 약' },
  { value: 'activity', label: '액티비티' },
  { value: 'booking', label: '예약 · 교통' },
  /** 추후 AI 연동 시 이 탭에 추천 항목만 표시 (목은 MOCK으로 대체) */
  { value: 'ai_recommend', label: 'AI 맞춤 추천' },
]

/** 상단 요약: 목적지 날씨·환경 컨텍스트 */
export const TRIP_SEARCH_CONTEXT = {
  title: '맞춤 여행 체크리스트',
  destination: '다낭 · 호이안 · 바나힐 일대',
  country: '베트남',
  tripWindowLabel: '5월 18일 ~ 5월 24일 (예시)',
  weatherSummary:
    '5월은 우기에 접어들어 소나기·국지성 호우가 잦고 습도가 높습니다. 한낮 자외선이 강하고, 산악 지역은 안개·바람이 식을 수 있어 겹쳐 입기를 권장합니다.',
  temperatureRange: '약 26–34°C',
  rainChance: '강수 확률 중간 이상 — 우산·방수 파우치 필수',
  environmentTags: [
    { id: 'sea', label: '해변·해양', detail: '자외선·모래·물놀이' },
    { id: 'mountain', label: '산악(바나힐)', detail: '케이블카·계단·기온 차' },
    { id: 'town', label: '올드타운·야시장', detail: '저녁 혼잡·오토바이' },
    { id: 'trek', label: '트레킹·도보', detail: '미끄럼·발 피로' },
  ],
  phaseHints: [
    { phase: '출국 전', text: '여권·e티켓·보험 증빙을 모바일+출력 이중으로 준비하세요.' },
    { phase: '기내·경유', text: '기내 건조, 담요·목베개·보습제로 비행 피로를 줄이세요.' },
    { phase: '현지 체류', text: '이동이 많은 날에는 가방을 소분해 두면 체크인·이동이 편합니다.' },
    { phase: '귀국 전', text: '세관·환전·남은 현금 정리, 짐 무게 재측정을 잊지 마세요.' },
  ],
}

/**
 * 카테고리별 추천 필수품 (저장 시 체크리스트로 전달)
 * id는 문자열로 유지해 초기 체크리스트 숫자 id와 충돌하지 않게 함
 */
export const MOCK_ITEMS = [
  {
    id: 'sg-doc-01',
    category: 'documents',
    categoryLabel: '필수 서류',
    title: '여권·비자·e티켓 묶음',
    description: '입국 후에도 수시로 제시하니 파일·클립으로 정리해 휴대합니다.',
    detail: '유효기간 6개월 이상, 사본·스캔을 클라우드에 동기화해 두세요.',
  },
  {
    id: 'sg-doc-02',
    category: 'documents',
    categoryLabel: '필수 서류',
    title: '여행자 보험 증권(영문)',
    description: '해외 의료·항공 지연 보장 범위를 출국 전에 확인합니다.',
    detail: '긴급 연락처를 항공기 좌석 주머니에 적어 둡니다.',
  },
  {
    id: 'sg-ele-01',
    category: 'electronics',
    categoryLabel: '전자 기기',
    title: '멀티 어댑터 + USB 허브',
    description: '베트남 220V A/C·C 타입 혼용 — 호텔 콘센트 개수가 부족할 수 있습니다.',
    detail: '고용량 멀티탭은 현지에서 구하기 어려울 수 있어 휴대를 권장합니다.',
  },
  {
    id: 'sg-ele-02',
    category: 'electronics',
    categoryLabel: '전자 기기',
    title: '보조배터리(기내 규격)',
    description: 'Wh 표기 확인, 비행기 탑승 전에 충전 상태를 표시합니다.',
    detail: '방수 파우치에 넣어 습기를 피합니다.',
  },
  {
    id: 'sg-ele-03',
    category: 'electronics',
    categoryLabel: '전자 기기',
    title: '방수 스마트폰 케이스·스트랩',
    description: '해변·소나기 시 촬영·내비게이션에 유리합니다.',
    detail: '야시장에서는 스트랩으로 낙상을 방지하세요.',
  },
  {
    id: 'sg-clo-01',
    category: 'clothing',
    categoryLabel: '의류 · 신발',
    title: '속건 기능성 이너 + 얇은 방수 재킷',
    description: '습도가 높아 금방 젖습니다. 겹쳐 입기로 실내외 온도를 조절합니다.',
    detail: '산악 일정에는 바람막이를 추가하세요.',
  },
  {
    id: 'sg-clo-02',
    category: 'clothing',
    categoryLabel: '의류 · 신발',
    title: '등산화 또는 쿠션 좋은 워킹화',
    description: '바나힐·호이안 돌길에서 발 피로·미끄럼을 줄입니다.',
    detail: '샌들만으로는 계단 구간이 불편할 수 있습니다.',
  },
  {
    id: 'sg-pk-01',
    category: 'packing',
    categoryLabel: '세면 · 위생',
    title: '여행용 세트 + 물티슈',
    description: '고온다습 환경에서 상비 위생용품을 소분해 둡니다.',
    detail: '액체류는 기내 반입 용량을 준수합니다.',
  },
  {
    id: 'sg-pk-02',
    category: 'packing',
    categoryLabel: '세면 · 위생',
    title: '미니 건조대·옷핀',
    description: '세탁한 수영복·속옷을 숙소에서 빠르게 말릴 때 유용합니다.',
    detail: '일부 숙소는 세탁 서비스 비용이 높을 수 있습니다.',
  },
  {
    id: 'sg-hl-01',
    category: 'health',
    categoryLabel: '건강 · 약',
    title: '지사제·전해질·멀미약',
    description: '식중독·설사·케이블카 멀미에 대비합니다.',
    detail: '처방약은 영문 처방전을 함께 휴대합니다.',
  },
  {
    id: 'sg-hl-02',
    category: 'health',
    categoryLabel: '건강 · 약',
    title: '모기 기피제·진통제',
    description: '저녁 해변·호이안 운하 주변에 대비합니다.',
    detail: '피부 알레르기가 있으면 무향 제품을 선택하세요.',
  },
  {
    id: 'sg-act-01',
    category: 'activity',
    categoryLabel: '액티비티',
    title: '스노클·수경(선택)',
    description: '해양 액티비티 일정이 있으면 렌탈보다 맞춤 사이즈가 편할 수 있습니다.',
    detail: '방수 가방에 넣어 모래·소금물을 분리합니다.',
  },
  {
    id: 'sg-act-02',
    category: 'activity',
    categoryLabel: '액티비티',
    title: '경량 배낭·폴딩백',
    description: '당일치기 이동 시 메인 캐리어를 두고 가볍게 다닐 때 좋습니다.',
    detail: '야시장에서 소매치기 방지에도 도움이 됩니다.',
  },
  {
    id: 'sg-bk-01',
    category: 'booking',
    categoryLabel: '예약 · 교통',
    title: '그랩·택시 앱 + 현지 결제 카드 등록',
    description: '피크 타임 요금 변동이 크니 앱 견적을 먼저 확인합니다.',
    detail: '호텔 앞 도로는 혼잡 시간대(저녁)에 우회로가 느려질 수 있습니다.',
  },
  {
    id: 'sg-bk-02',
    category: 'booking',
    categoryLabel: '예약 · 교통',
    title: '투어·케이블카 예약 QR',
    description: '바나힐 등 인기 코스는 시간대별 입장 제한이 있을 수 있습니다.',
    detail: '스크린샷을 오프라인에도 저장해 두세요.',
  },
  {
    id: 'sg-ai-01',
    category: 'ai_recommend',
    categoryLabel: 'AI 맞춤 추천',
    title: '우기·습도 대비 소형 제습제(옷장용)',
    description: '이번 일정 구간은 습도가 높은 날이 많을 수 있어, 숙소 옷장에 두면 의류 냄새·곰팡이 예방에 도움이 됩니다.',
    detail: '실제 연동 시 여행지 날씨·숙소 유형을 반영해 추천합니다.',
  },
  {
    id: 'sg-ai-02',
    category: 'ai_recommend',
    categoryLabel: 'AI 맞춤 추천',
    title: '야시장·혼잡 구간용 슬링·앞쪽 착용 가방',
    description: '호이안 야시장 등 보행·인파가 많은 코스가 포함되어 있어, 소매치기·낙상 위험을 줄이는 착용 방식을 권장합니다.',
    detail: '동선·시간대 데이터를 반영한 추천(목업)입니다.',
  },
  {
    id: 'sg-ai-03',
    category: 'ai_recommend',
    categoryLabel: 'AI 맞춤 추천',
    title: '케이블카·고도 변화 구간용 얇은 겹옷 세트',
    description: '바나힐 등 고도 이동이 있는 날은 기온 차가 클 수 있어, 겹쳐 입기용 얇은 겉옷을 챙기는 편이 좋습니다.',
    detail: '추후 일정·기상 조건을 입력하면 AI가 우선순위를 조정합니다.',
  },
]
