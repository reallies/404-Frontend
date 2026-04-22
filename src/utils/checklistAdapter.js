/**
 * 백엔드의 "맞춤 체크리스트 생성" 응답(기본 템플릿 + LLM 추천 Merge)을
 * TripSearchPage 가 쓰는 프론트 데이터 모델로 변환한다.
 *
 * 프론트 데이터 모델:
 *   - CATEGORIES: 상단 탭 (all / supplies / prebooking / predeparture / ai_recommend)
 *   - ITEMS[i]  : {
 *       id, baggageType, category (탭 코드), subCategory (백엔드 세부 카테고리 코드),
 *       subCategoryLabel, categoryLabel (탭 라벨), title, description, detail, source, isEssential
 *     }
 *   - SECTIONS  : `all` 탭 그룹핑을 위해 백엔드 섹션을 그대로 노출.
 *                 AI 추천 섹션은 맨 앞으로 올린다.
 */

/**
 * 백엔드 세부 카테고리 코드 → 프론트 탭 코드 매핑.
 * 백엔드 seed (`checklist_categories`) 와 1:1 로 맞춰 둔다.
 */
const SUB_CATEGORY_TO_TAB = {
  essentials: 'supplies',
  clothing: 'supplies',
  health: 'supplies',
  toiletries: 'supplies',
  beauty: 'supplies',
  electronics: 'supplies',
  travel_goods: 'supplies',
  documents: 'supplies',
  packing: 'supplies',
  activity: 'supplies',
  booking: 'prebooking',
  pre_departure: 'predeparture',
  ai_recommend: 'ai_recommend',
}

const TAB_CATEGORIES = [
  { value: 'all', label: '전체' },
  { value: 'supplies', label: '준비물' },
  { value: 'prebooking', label: '사전 예약/신청' },
  { value: 'predeparture', label: '출국 전 확인사항' },
  { value: 'ai_recommend', label: 'AI 맞춤 추천' },
]

const TAB_LABEL_BY_VALUE = Object.fromEntries(TAB_CATEGORIES.map((c) => [c.value, c.label]))

export function getTabCategories() {
  return TAB_CATEGORIES
}

/**
 * 아이템에 쓸 id 를 결정한다.
 * - Phase 1 이후: 백엔드가 ChecklistItem.id (문자열) 를 내려주므로 그것을 그대로 쓴다.
 * - 미영속(generate-from-context / LLM 실패 후 메모리 응답) 경로에서는 자체 slug id 를 생성한다.
 *   이 경우 `/checklists/items/:itemId/select` 류 API 호출은 불가 (→ 프론트 사이드에서 fallback UI).
 */
function makeItemId(raw, categoryCode, idx) {
  if (raw?.id) return String(raw.id)
  const slug = String(raw?.title ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w가-힣\-]/g, '')
  return `cm-${categoryCode}-${slug || 'item'}-${idx}`
}

function mapPrepTypeToTab(prepType) {
  if (prepType === 'pre_booking') return 'prebooking'
  if (prepType === 'pre_departure_check') return 'predeparture'
  if (prepType === 'ai_recommend') return 'ai_recommend'
  return null
}

function mapItem(raw, idx) {
  const subCategory = raw.categoryCode || 'ai_recommend'
  const subCategoryLabel = raw.categoryLabel || 'AI 추천'

  // LLM 이 카테고리 코드를 돌려줬어도 prepType 이 'pre_booking' / 'pre_departure_check' 이면
  // 그 의미를 우선해 상단 탭을 결정한다.
  const tabFromPrep = mapPrepTypeToTab(raw.prepType)
  const tab = tabFromPrep ?? SUB_CATEGORY_TO_TAB[subCategory] ?? 'ai_recommend'

  return {
    id: makeItemId(raw, subCategory, idx),
    // 백엔드 ChecklistItem.id (BigInt stringified). 없으면 null — select/deselect API 호출 불가.
    serverId: raw?.id != null ? String(raw.id) : null,
    baggageType: raw.baggageType || 'none',
    category: tab,
    categoryLabel: TAB_LABEL_BY_VALUE[tab] ?? '준비물',
    subCategory,
    subCategoryLabel,
    title: raw.title,
    description: raw.description ?? '',
    detail: '',
    source: raw.source || 'template',
    isEssential: Boolean(raw.isEssential),
    prepType: raw.prepType,
    // Candidate pool 상태. 서버 응답이 없으면 관습적으로 false(후보) 로 둔다.
    isSelected: Boolean(raw?.isSelected),
    selectedAt: raw?.selectedAt ?? null,
    isChecked: Boolean(raw?.isChecked),
  }
}

/**
 * 백엔드 응답을 프론트 모델로 변환.
 *
 * @param {object} generated  /checklists/generate/:tripId 응답
 * @returns {{
 *   items: Array,
 *   sections: Array<{ categoryCode, categoryLabel, items: Array }>,
 *   summary: object,
 *   context: object
 * }}
 */
export function adaptGeneratedChecklist(generated) {
  const rawItems = Array.isArray(generated?.items) ? generated.items : []
  const items = rawItems.map(mapItem)

  // 동일 title 이 여러 번 등장하지 않도록 id 매핑으로 다시 찾아 섹션을 구성.
  const byTitleSub = new Map(items.map((it) => [`${it.subCategory}::${it.title}`, it]))

  const rawSections = Array.isArray(generated?.sections) ? generated.sections : []
  const sections = rawSections
    .map((sec) => {
      const mappedItems = (sec.items ?? [])
        .map((r) => byTitleSub.get(`${sec.categoryCode}::${r.title}`))
        .filter(Boolean)
      return {
        categoryCode: sec.categoryCode,
        categoryLabel: sec.categoryLabel,
        items: mappedItems,
      }
    })
    .filter((s) => s.items.length > 0)

  // AI 추천 섹션을 맨 위로 정렬
  sections.sort((a, b) => {
    if (a.categoryCode === 'ai_recommend' && b.categoryCode !== 'ai_recommend') return -1
    if (b.categoryCode === 'ai_recommend' && a.categoryCode !== 'ai_recommend') return 1
    return 0
  })

  return {
    items,
    sections,
    summary: generated?.summary ?? null,
    context: generated?.context ?? null,
  }
}
