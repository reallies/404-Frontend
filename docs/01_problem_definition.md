# 문제정의서 (Problem Definition)

> **문서 용도:** 이 문서는 MVP 개발 참고용 문제정의 문서입니다.  
> 새로운 기능을 제안하거나 구현할 때, 이 문서에서 정의한 사용자 루프와 병목을 기준으로 판단합니다.  
> MVP 범위를 벗어나는 고도화 아이디어는 바로 구현하지 않고 별도 후보로만 기록합니다.

---

## 1. 문서 목적

이 문서는 Cursor 및 LLM이 프로젝트의 핵심 문제를 이해하고, MVP 개발 시 판단 기준으로 활용하기 위한 참고 문서다.

- 사용자 행동 구조(루프)를 정의하고
- 각 루프에서 발생하는 병목을 명확히 하며
- 어떤 지표로 이를 측정할지 설계한다

---

## 2. 서비스가 해결하려는 핵심 문제

> **"정보는 있다. 근데 실행이 안 된다."**

사용자는 여행이 확정된 이후에도 준비를 한 번에 끝내지 못한다.  
검색 → 저장 → 확인 → 재검색을 반복하며 루프가 닫히지 않는다.

핵심은 **정보 부족이 아니라**, 정보가 실행 가능한 형태로 전환되지 않는 **구조적 문제**다.

```
Information → Structure → Execution
              ↑ 여기가 막혀있다
```

---

## 3. 사용자 행동 흐름

### 전체 루프 (Total Loop)

```
Travel Fixed → [Store Loop] → [Confirm Loop] → Reuse
```

### 저장 루프 (Store Loop)

```
Search → Detail Check → Save
```

### 확인 루프 (Confirm Loop)

```
Saved List Open → Edit (Edit_text / Edit_add / Edit_del / Edit_reorder) → Prepare Action
```

---

## 4. 루프 구조 설명

| 루프 | 역할 | 핵심 목표 |
|------|------|-----------|
| **Store Loop** | 정보를 수집하고 저장하는 단계 | Search → Save 전이율 높이기 |
| **Confirm Loop** | 저장된 정보를 검토하고 실행하는 단계 | Edit → Prepare Action 전이율 높이기 |
| **Total Loop** | 전체 여행 준비 흐름 완성 | 루프 전체가 닫히는 구조 만들기 |

---

## 5. Store Loop 문제

| 문제 유형 | 설명 |
|-----------|------|
| **정보 분산** | 준비 정보가 블로그·SNS·공식사이트 등에 흩어져 있어 한 번에 수집 불가 |
| **탐색·비교 비용** | 단순 검색을 넘어 출처 간 교차 검증이 필요해 탐색 시간 증가 |
| **정보 노후화** | 입국 정책, 운영 시간 등이 수시로 변경되지만 업데이트 안 된 정보 존재 |
| **상황 미반영** | 여행지·동행인·일정에 따라 필요한 항목이 달라지지만 일반화된 정보만 제공 |

**결과:** 사용자는 `Search → Detail Check → Save → 재탐색`을 반복하며 피로 누적

---

## 6. Confirm Loop 문제

| 문제 유형 | 설명 |
|-----------|------|
| **항목 누락** | 정보가 단편 소비되면서 준비물·예약·일정이 하나의 흐름으로 관리 안 됨 |
| **반복 확인** | 저장 후에도 재확인·보완을 위해 동일한 탐색을 반복 |
| **실행 단절** | 정보는 있지만 개인 상황에 맞는 구조화 없이 실제 액션으로 이어지지 않음 |
| **Backflow 발생** | 확인 중 빠진 항목 발견 → Store Loop 재발동 (지표 꼬임 주의) |

> **운영 정의:** Confirm Loop 도중 새 항목을 검색·추가하는 경우는 내부 Edit이 아닌 **Store Loop 재발동**으로 집계한다.

---

## 7. Total Loop 관점 문제

- Store Loop + Confirm Loop가 **순차적으로 닫히지 않으면** 전체 준비가 완료되지 않는다.
- Backflow(재탐색)와 Store_R(재검색)이 높으면 전체 루프 안정성이 무너진다.
- **Cold Start 구간**에서는 루프 자체가 성립하지 않고 단절된 행동 조각(Fragmented Behavior)으로 관측된다.

---

## 8. 핵심 지표 요약

### 8-1. 준비 부담 지수 (Preparation Burden Score)

```
PB_t = α·Store_R_t + β·IG_t + γ·Delay_t
```

| 변수 | 의미 |
|------|------|
| `Store_R_t` | 동일 준비 과정에서 재탐색 발생 비율 |
| `IG_t` | 저장 리스트를 열어본 뒤 빠진 항목 발견 비율 = `MissingItemDetection / SavedListOpen` |
| `Delay_t` | 검색→저장까지 평균 소요 시간 (정규화) |

→ 세 값이 높을수록 사용자 부담 증가

---

### 8-2. Store Loop 지표

| 지표 | 공식 | 의미 |
|------|------|------|
| `SP1` | `DetailCheck / Search` | 검색 후 상세 확인 전이율 |
| `SP2` | `Save / DetailCheck` | 상세 확인 후 저장 전이율 |
| `Store_LCP` | `SP1 × SP2` | 저장 루프 완성 확률 |
| `Store_R` | `ReSearch / Search` | 재탐색 발생 비율 |
| `Store_LSI` | `Store_LCP × (1 - PB_t)` | 준비 부담을 반영한 저장 루프 안정성 지수 |

---

### 8-3. Confirm Loop 지표

| 지표 | 공식 | 의미 |
|------|------|------|
| `CP1` | `Edit / SavedListOpen` | 리스트 열람 후 수정 전이율 |
| `CP2` | `PrepareAction / Edit` | 수정 후 실제 준비 완료 전이율 |
| `Confirm_LCP` | `CP1 × CP2` | 확인 루프 완성 확률 |
| `Backflow` | `ReStoreTrigger / SavedListOpen` | 확인 중 Store Loop 재발동 비율 |
| `Confirm_LSI` | `Confirm_LCP × (1 - Backflow)` | 역류를 반영한 확인 루프 안정성 지수 |

---

### 8-4. Total Loop 지표

| 지표 | 공식 | 의미 |
|------|------|------|
| `Total_LCP` | `Store_LCP × Confirm_LCP` | 전체 루프 완성 확률 |
| `Total_LSI` | `Total_LCP × (1 - λ1·Store_R - λ2·Backflow)` | 전체 루프 안정성 지수 (λ1+λ2=1) |

---

### 8-5. 지표 해석 원칙

| 상태 | 의미 |
|------|------|
| `Store_LCP` 낮음 | 검색 → 저장까지 이어지는 구조가 약함 |
| `PB_t` 높음 | 정보 공백·재탐색·지연으로 준비 부담이 큼 |
| `Backflow` 높음 | 저장된 정보만으로 준비가 완료되지 않고 재탐색 필요 |
| `Total_LSI` 낮음 | 전체 여행 준비 구조가 안정적으로 닫히지 못함 |

---

## 9. MVP 개발에서 중요하게 볼 포인트

### 단계별 목표 지표

#### 초기 단계 → 활성화 (Activation)

| 지표 | 목표값 |
|------|--------|
| `PB_t` | ≤ 70% |
| Travel Fixed → Store Loop 전이 | ≥ 50% |
| `SP1` (Search → Detail Check) | ≥ 50% |
| `SP2` (Detail Check → Save) | ≥ 50% |
| `Store_LCP` | ≥ 50% |
| `Store_R` | ≤ 50% |
| 첫 Save까지 소요 시간 | ≤ 6시간 |

#### 중기 단계 → 유지 (Retention)

| 지표 | 목표값 |
|------|--------|
| `PB_t` | ≤ 50% |
| `Backflow` | ≤ 50% |
| `CP1` (SavedListOpen → Edit) | ≥ 50% |
| `CP2` (Edit → PrepareAction) | ≥ 50% |
| `Confirm_LCP` | ≥ 50% |
| Store Loop → Confirm Loop 전이 | ≥ 70% |

#### 후기 단계 → 동기 (Motivation)

| 지표 | 목표값 |
|------|--------|
| `PB_t` | ≤ 30% |
| `Total_LCP` | ≥ 50% |
| Prepare Action → Reuse 전이 | ≥ 50% |
| 새로운 Store Loop 재발생 | ≥ 50% |

---

### Cold Start (초기 사용자) 주의사항

- 초기에는 루프가 완성되지 않고 **단절된 행동 조각**으로만 관측될 수 있음
- 첫 Save가 정보 신뢰 기반이 아닌 **UI 호기심 기반**일 가능성 존재
- 초기 `PB_t`는 과대추정 경향이 있으므로 절대값보다 **추세**를 봐야 함
- Cold Start 구간에서는 LCP보다 **이벤트 발생 여부 자체**가 핵심 지표

| Bootstrap 지표 | 목표값 |
|----------------|--------|
| First Save Rate | ≥ 30% |
| First Confirm Entry | ≥ 20% |
| First Loop Completion | ≥ 10% |
| TTFM (첫 의미 경험까지 시간) | ≤ 10분 |

---

## 10. 개발 참고 메모

### UI/UX 구현 시 판단 기준

```
기능을 추가할 때 → "이 기능이 Store_LCP를 높이는가, 아니면 Backflow를 줄이는가?"
```

| 루프 | 개발 우선순위 포인트 |
|------|----------------------|
| **Store Loop** | 검색 → 저장까지의 마찰 최소화. 저장 버튼 진입 장벽 낮추기 |
| **Confirm Loop** | 저장된 리스트를 빠르게 열고 수정할 수 있는 UX. 빠진 항목 발견 시 즉시 추가 가능 구조 |
| **Backflow 대응** | Confirm 중 재탐색이 필요할 때 앱 밖으로 나가지 않아도 되는 구조 설계 |

### 제약 조건 (개발 시 인지 필요)

- 모든 지표는 **동일 집계 기간 기준**으로 계산
- 세션은 **30분 비활성 기준**으로 분리
- `Backflow`는 원인을 완전히 분리하기 어려움 (측정 한계 존재)
- `Prepare Action`은 실제 완료를 보장하지 않음
- 이벤트 정의 변경 시 **과거 데이터와 비교 제한** 발생
- 개인정보 최소 수집 원칙 적용

---

## 이 문서가 말하고 싶은 핵심

> 여행 준비 서비스의 핵심 병목은 **"정보 부족"이 아니라 "정보가 실행으로 연결되지 않는 구조"** 다.
>
> MVP에서는 모든 문제를 해결하려 하지 말고,  
> **Store Loop와 Confirm Loop가 닫히는 구조를 만들고, 그 과정을 측정 가능하게 하는 것**에 집중한다.
>
> 루프가 닫혀야 여행 준비가 끝난다.
