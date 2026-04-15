/**
 * flightMockData.js
 *
 * 백엔드 연동 전까지 사용하는 Mock 항공편 데이터입니다.
 * 실제 API 연동 시 fetchFlightInfo 함수 내부만 교체하면
 * 컴포넌트 코드는 변경 없이 그대로 동작합니다.
 */

/* ─────────────────────────────────────────────
   Mock 항공편 데이터 (편명 → 노선 정보)
───────────────────────────────────────────── */
export const MOCK_FLIGHTS = {
  // 대한항공 (KE)
  KE101: { airline: '대한항공', departure: { iata: 'ICN', city: '서울' }, arrival: { iata: 'CDG', city: '파리', country: '프랑스' } },
  KE102: { airline: '대한항공', departure: { iata: 'CDG', city: '파리' }, arrival: { iata: 'ICN', city: '서울', country: '대한민국' } },
  KE201: { airline: '대한항공', departure: { iata: 'ICN', city: '서울' }, arrival: { iata: 'LAX', city: '로스앤젤레스', country: '미국' } },
  KE202: { airline: '대한항공', departure: { iata: 'LAX', city: '로스앤젤레스' }, arrival: { iata: 'ICN', city: '서울', country: '대한민국' } },
  KE631: { airline: '대한항공', departure: { iata: 'ICN', city: '서울' }, arrival: { iata: 'NRT', city: '도쿄', country: '일본' } },
  KE632: { airline: '대한항공', departure: { iata: 'NRT', city: '도쿄' }, arrival: { iata: 'ICN', city: '서울', country: '대한민국' } },
  KE651: { airline: '대한항공', departure: { iata: 'ICN', city: '서울' }, arrival: { iata: 'KIX', city: '오사카', country: '일본' } },
  KE711: { airline: '대한항공', departure: { iata: 'ICN', city: '서울' }, arrival: { iata: 'BKK', city: '방콕', country: '태국' } },
  KE712: { airline: '대한항공', departure: { iata: 'BKK', city: '방콕' }, arrival: { iata: 'ICN', city: '서울', country: '대한민국' } },
  KE471: { airline: '대한항공', departure: { iata: 'ICN', city: '서울' }, arrival: { iata: 'SYD', city: '시드니', country: '호주' } },
  KE901: { airline: '대한항공', departure: { iata: 'ICN', city: '서울' }, arrival: { iata: 'JFK', city: '뉴욕', country: '미국' } },
  KE902: { airline: '대한항공', departure: { iata: 'JFK', city: '뉴욕' }, arrival: { iata: 'ICN', city: '서울', country: '대한민국' } },

  // 아시아나항공 (OZ)
  OZ101: { airline: '아시아나항공', departure: { iata: 'ICN', city: '서울' }, arrival: { iata: 'NRT', city: '도쿄', country: '일본' } },
  OZ102: { airline: '아시아나항공', departure: { iata: 'NRT', city: '도쿄' }, arrival: { iata: 'ICN', city: '서울', country: '대한민국' } },
  OZ201: { airline: '아시아나항공', departure: { iata: 'ICN', city: '서울' }, arrival: { iata: 'SIN', city: '싱가포르', country: '싱가포르' } },
  OZ202: { airline: '아시아나항공', departure: { iata: 'SIN', city: '싱가포르' }, arrival: { iata: 'ICN', city: '서울', country: '대한민국' } },
  OZ741: { airline: '아시아나항공', departure: { iata: 'ICN', city: '서울' }, arrival: { iata: 'BKK', city: '방콕', country: '태국' } },
  OZ521: { airline: '아시아나항공', departure: { iata: 'ICN', city: '서울' }, arrival: { iata: 'LHR', city: '런던', country: '영국' } },

  // 진에어 (LJ)
  LJ401: { airline: '진에어', departure: { iata: 'ICN', city: '서울' }, arrival: { iata: 'OKA', city: '오키나와', country: '일본' } },
  LJ501: { airline: '진에어', departure: { iata: 'ICN', city: '서울' }, arrival: { iata: 'CTS', city: '삿포로', country: '일본' } },

  // 제주항공 (7C)
  '7C101': { airline: '제주항공', departure: { iata: 'ICN', city: '서울' }, arrival: { iata: 'NRT', city: '도쿄', country: '일본' } },
  '7C2001': { airline: '제주항공', departure: { iata: 'ICN', city: '서울' }, arrival: { iata: 'BKK', city: '방콕', country: '태국' } },

  // 티웨이항공 (TW)
  TW231: { airline: '티웨이항공', departure: { iata: 'ICN', city: '서울' }, arrival: { iata: 'KIX', city: '오사카', country: '일본' } },
  TW601: { airline: '티웨이항공', departure: { iata: 'ICN', city: '서울' }, arrival: { iata: 'SYX', city: '싼야', country: '중국' } },

  // 베트남 (데모 · 출국편 조회 시 도착 국가·공항이 확정됨)
  VN401: {
    airline: '베트남항공',
    departure: { iata: 'ICN', city: '서울' },
    arrival: { iata: 'SGN', city: '호치민', country: '베트남', countryCode: 'VN' },
  },
  VN402: {
    airline: '베트남항공',
    departure: { iata: 'SGN', city: '호치민' },
    arrival: { iata: 'ICN', city: '서울', country: '대한민국' },
  },
  KE801: {
    airline: '대한항공',
    departure: { iata: 'ICN', city: '서울' },
    arrival: { iata: 'DAD', city: '다낭', country: '베트남', countryCode: 'VN' },
  },
  KE802: {
    airline: '대한항공',
    departure: { iata: 'DAD', city: '다낭' },
    arrival: { iata: 'ICN', city: '서울', country: '대한민국' },
  },
  OZ851: {
    airline: '아시아나항공',
    departure: { iata: 'ICN', city: '서울' },
    arrival: { iata: 'HAN', city: '하노이', country: '베트남', countryCode: 'VN' },
  },
  OZ852: {
    airline: '아시아나항공',
    departure: { iata: 'HAN', city: '하노이' },
    arrival: { iata: 'ICN', city: '서울', country: '대한민국' },
  },
}

/* ─────────────────────────────────────────────
   항공편 조회 함수
   - 현재: Mock 데이터에서 조회 (0.8초 딜레이)
   - 추후: fetch 내부를 실제 백엔드 API 호출로 교체
───────────────────────────────────────────── */
export const fetchFlightInfo = (flightNo) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const data = MOCK_FLIGHTS[flightNo.toUpperCase().trim()]
      if (data) {
        resolve({ flightNo: flightNo.toUpperCase().trim(), ...data })
      } else {
        reject(new Error('해당 항공편을 찾을 수 없습니다.'))
      }
    }, 800)
  })
}
