# Meta OKR (Measurement & Observation Framework)

> **문서 용도:** 이 문서는 MVP 단계에서 사용자 행동을 어떻게 관찰하고,  
> 어떤 상태를 "성공"으로 정의할 것인지 정리한 문서이다.  
> 이 프로젝트의 1차 목적은 단순 기능 구현이 아니라,  
> **여행 준비 행동 구조를 데이터로 관찰 가능한 상태로 만드는 것**이다.

---

## 1. 문서 목적

- 사용자 행동을 이벤트 단위로 관찰 가능한 상태로 정의한다.
- 여행 준비 행동을 루프(Store Loop, Confirm Loop, Total Loop) 기준으로 측정할 수 있도록 한다.
- MVP 단계에서 "무엇을 만들 것인가"보다 **"무엇을 측정할 것인가"** 를 명확히 한다.

---

## 2. Objective

> **사용자의 여행 준비 체크리스트 작성 행동 패턴을 관찰 가능한 상태로 만든다.**

### 핵심 의미

- 이 서비스의 1차 목표는 문제 해결이 아니라 **행동 구조를 측정하는 것**이다.
- 모든 기능은 이벤트 수집과 지표 분석이 가능하도록 설계되어야 한다.
- 측정할 수 없는 기능은 MVP 단계에서 의미 없다.

---

## 3. Key Results

| Key | Result |
|-----|--------|
| **K1.** Travel Fixed → [Store Loop] → [Confirm Loop] → Reuse 전환 흐름 이벤트가 수집될 수 있도록 한다 | **R1.** 단계별 이벤트 전환 데이터 수집 가능 |
| **K2.** 체크리스트 저장 이벤트가 수집될 수 있도록 한다 | **R2.** Store Loop 퍼널별 이벤트 수집 가능 |
| **K3.** 체크리스트 실행 이벤트가 수집될 수 있도록 한다 | **R3.** Store Loop 내 전환 데이터 수집 가능 |
| **K4.** 반복과 역류를 별도 이벤트로 식별 가능하게 한다 | **R4.** Confirm Loop 퍼널별 이벤트 수집 가능 |
| | **R5.** Confirm Loop 내 전환 데이터 수집 가능 |
| | **R6.** 반복 탐색 이벤트 수집 가능 |
| | **R7.** 퍼널 간 역류 데이터 수집 가능 |

---

## 4. 측정 구조 (Measurement Structure)

### 4.1 Total Loop 흐름

```
Travel Fixed
 → [Store Loop: Search → Detail Check → Save]
 → [Confirm Loop: Saved List Open → Edit → Prepare Action]
 → Reuse
```

| 전환 구간 | 수집 이벤트 | 계산 지표 |
|-----------|-------------|-----------|
| Travel Fixed → Store Loop | `travel_fixed`, `search_start` | P(StoreLoop \| TravelFixed) |
| Store Loop → Confirm Loop | `save_complete`, `saved_list_open` | Store → Confirm 전이율 |
| Confirm Loop → Reuse | `prepare_action`, `reuse_start` | P(Reuse \| PrepareAction) |
| 전체 루프 완성 | 전 구간 이벤트 | `Total_LCP`, `Total_LSI` |

---

### 4.2 Store Loop 측정 구조

```
Search → Detail Check → Save
```

| 전환 구간 | 수집 이벤트 | 계산 지표 |
|-----------|-------------|-----------|
| Search 시작 | `search_start` | 기준점 |
| Search → Detail Check | `detail_check_open` | SP1 = `P(DetailCheck \| Search)` |
| Detail Check → Save | `save_complete` | SP2 = `P(Save \| DetailCheck)` |
| 재탐색 발생 | `research_trigger` | Store_R = `P(ReSearch \| Search)` |
| 저장 지연 측정 | 타임스탬프 diff | Delay_t |
| Store Loop 완성 | SP1 × SP2 | `Store_LCP` |

---

### 4.3 Confirm Loop 측정 구조

```
Saved List Open → Edit → Prepare Action
```

| 전환 구간 | 수집 이벤트 | 계산 지표 |
|-----------|-------------|-----------|
| 리스트 열람 | `saved_list_open` | 기준점 |
| Saved List Open → Edit | `edit_start` | CP1 = `P(Edit \| SavedListOpen)` |
| Edit 세부 행동 | `edit_text`, `edit_add`, `edit_del`, `edit_reorder` | 세부 행동별 비율 |
| Edit → Prepare Action | `prepare_action` | CP2 = `P(PrepareAction \| Edit)` |
| Backflow 발생 | `re_store_trigger` | Backflow = `P(ReStoreTrigger \| SavedListOpen)` |
| Confirm Loop 완성 | CP1 × CP2 | `Confirm_LCP` |

---

### 4.4 반복 및 역류 이벤트 식별 구조

| 이벤트 유형 | 트리거 조건 | 수집 이벤트명 | 계산 지표 |
|-------------|-------------|---------------|-----------|
| 재탐색 (Store_R) | Search 이후 동일 세션에서 재검색 발생 | `research_trigger` | `Store_R` |
| 역류 (Backflow) | Confirm Loop 도중 새 탐색 발생 | `re_store_trigger` | `Backflow` |
| 정보 공백 발견 (IG_t) | SavedListOpen 이후 빠진 항목 발견 | `missing_item_detected` | `IG_t` |

> **운영 정의:** Confirm Loop 도중 새 항목을 추가하기 위해 탐색하는 경우는  
> Confirm Loop 내부 Edit이 아닌 **Store Loop 재발동(Backflow)** 으로 집계한다.  
> 이는 지표 꼬임을 방지하기 위한 운영 원칙이다.

---

## 5. 이벤트 정의 목록

> 아래 이벤트는 FE에서 수집해야 하는 최소 단위 이벤트 목록이다.  
> 이벤트 정의가 변경되면 과거 데이터와의 비교가 제한되므로, 변경 시 반드시 기록한다.

| 이벤트명 | 발생 시점 | 관련 루프 | 비고 |
|----------|-----------|-----------|------|
| `travel_fixed` | 여행 일정 확정 시 | Total Loop | 전체 루프 시작점 |
| `search_start` | 탐색 시작 시 | Store Loop | SP1 분모 |
| `detail_check_open` | 항목 상세 확인 시 | Store Loop | SP1 분자 |
| `save_complete` | 항목 저장 완료 시 | Store Loop | SP2 분자 |
| `research_trigger` | 동일 준비 과정 내 재탐색 발생 시 | Store Loop | Store_R 분자 |
| `saved_list_open` | 저장 리스트 열람 시 | Confirm Loop | CP1 분모 |
| `edit_start` | 수정 행동 시작 시 | Confirm Loop | CP1 분자 |
| `edit_text` | 텍스트 수정 시 | Confirm Loop | Edit 세부 |
| `edit_add` | 항목 추가 시 | Confirm Loop | Edit 세부 |
| `edit_del` | 항목 삭제 시 | Confirm Loop | Edit 세부 |
| `edit_reorder` | 순서 변경 시 | Confirm Loop | Edit 세부 |
| `prepare_action` | 준비 완료 체크 시 | Confirm Loop | CP2 분자 |
| `re_store_trigger` | 확인 중 재탐색 발생 시 | Confirm Loop | Backflow 분자 |
| `missing_item_detected` | 빠진 항목 발견 시 | Confirm Loop | IG_t 분자 |
| `reuse_start` | 새로운 여행 준비 시작 시 | Total Loop | Reuse 전이 |

---

## 6. 지표 계산 체계

### 6.1 Store Loop 지표

```
SP1         = DetailCheck Sessions / Search Sessions
SP2         = Save Sessions / DetailCheck Sessions
Store_LCP   = SP1 × SP2
Store_R     = ReSearch Sessions / Search Sessions
Delay_t     = avg(Time(Search → Save)) / MaxTime
Store_LSI   = Store_LCP × (1 - PB_t)
```

### 6.2 Confirm Loop 지표

```
CP1           = Edit Sessions / SavedListOpen Sessions
CP2           = PrepareAction Sessions / Edit Sessions
Confirm_LCP   = CP1 × CP2
Backflow      = ReStoreTrigger Sessions / SavedListOpen Sessions
Confirm_LSI   = Confirm_LCP × (1 - Backflow)
```

### 6.3 Total Loop 지표

```
Total_LCP   = Store_LCP × Confirm_LCP
Total_LSI   = Total_LCP × (1 - λ1·Store_R - λ2·Backflow)   (λ1 + λ2 = 1)
PB_t        = α·Store_R + β·IG_t + γ·Delay_t
IG_t        = MissingItemDetection Sessions / SavedListOpen Sessions
```

---

## 7. MVP 단계 측정 우선순위

> 초기에는 모든 지표를 동시에 보지 않는다.  
> 루프 단계별로 **"이벤트 발생 여부"** 를 먼저 확인한 뒤, 전환율을 측정한다.

| 우선순위 | 확인 항목 | 목적 |
|----------|-----------|------|
| 1순위 | Travel Fixed → Search 이벤트 발생 여부 | 루프 진입 여부 확인 |
| 2순위 | Search → Save 전환 여부 (SP1, SP2) | Store Loop 작동 여부 |
| 3순위 | Save → Saved List Open 전환 여부 | 루프 간 연결 여부 |
| 4순위 | Edit → Prepare Action 전환 여부 (CP1, CP2) | Confirm Loop 작동 여부 |
| 5순위 | Store_R, Backflow 발생 여부 | 병목 위치 파악 |
| 6순위 | Total_LCP, Total_LSI 계산 | 전체 루프 안정성 평가 |

---

## 8. 측정 제약 조건

| 제약 | 내용 |
|------|------|
| 세션 기준 | 30분 비활성 기준으로 세션 분리 |
| 집계 기준 | 모든 지표는 동일 집계 기간 기준으로 계산 |
| Backflow 측정 한계 | Backflow 원인을 완전히 분리하기 어려움 |
| Prepare Action 한계 | 실제 준비 완료를 보장하지 않음 |
| 이벤트 변경 제한 | 이벤트 정의 변경 시 과거 데이터와 비교 제한 |
| 개인정보 원칙 | 개인정보 최소 수집 원칙 적용 |
| Cold Start | 초기 데이터는 통계적 신뢰도 낮음 (Exploration Bias 존재) |

---

## 9. 이 문서의 핵심

> MVP에서 가장 먼저 해야 할 일은 **측정 가능한 구조를 만드는 것**이다.
>
> 모든 기능은 아래 질문에 답할 수 있어야 한다.
>
> ```
> "이 기능을 통해 어떤 이벤트를 수집할 수 있는가?"
> "그 이벤트는 어떤 지표 계산에 사용되는가?"
> ```
>
> 측정할 수 없으면, 개선할 수 없다.
