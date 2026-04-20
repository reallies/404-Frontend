<aside>
💡

# Meta OKR

| Objective | Key | Result |
| --- | --- | --- |
| 사용자 여행 준비 체크리스트 작성 행동 패턴을 관찰 가능한 상태로 만든다. | K1. Travel Fixed → [Store Loop] → [Confirm Loop] → Reuse 전환 흐름 이벤트가 수집될 수 있도록 한다 | R1. 단계별 이벤트 전환 데이터 수집 가능 |
|  | K2. 체크리스트 저장 이벤트가 수집될 수 있도록 한다. | R2. Store_Loop 퍼널별 이벤트 수집 가능 |
|  | K3. 체크리스트 실행 이벤트가 수집될 수 있도록 한다. | R3. Store_Loop 내 전환 데이터 수집 가능 |
|  | K4. 반복과 역류를 별도 이벤트로 식별 가능하게 한다. | R4. Confirm_Loop 퍼널별 이벤트 수집 가능 |
|  |  | R5. Confirm_Loop 내 전환 데이터 수집 가능 |
|  |  | R6. 반복 탐색 이벤트 수집 가능 |
|  |  | R7. 퍼널간 역류 데이터 수집 가능 |

</aside>

<aside>
💡

# Strategy OKR

## Store Loop 전략

| **Objective** | **사용자가 자신의 여행 조건에 맞는 준비 정보를 빠르게 탐색하고, 저장까지 이어지는 행동 구조 형성** |
| --- | --- |
| **K1** | **K1. Store Loop의 전체 흐름(`Search → Detail Check -> Save` ) 확인** |
| **R1** | R1. `SP1 = P(Detail Check | Search)`, `SP2 = P(Save | Detail Check)` 변화 확인 가능 |
| **K2** | **K2. 반복 탐색 여부 확인** |
| **R2** | R2. `Store_R = P(ReSearch | Search)` 여부 확인 가능 |
| **연결 결정사항** | • 사용자 필터 맞춤형 준비 항목 추천
• 구조화된 탐색 결과 제공
• 즉시 저장 가능한 체크리스트 구조 도입 |

---

## Confirm Loop 전략

| **Objective** | **사용자가 저장한 여행 준비 정보를 카테고리 기반으로 점검·수정하고 실제 준비 행동까지 이어지는 확인 구조 형성** |
| --- | --- |
| **K1** | K1. Confirm Loop의 전체 흐름(`Saved List Open → Edit → Prepare Action`) 확인 |
| **R1** | R1. `CP1 = P(Edit | Saved List Open)`, `CP2 = P(Prepare Action | Edit)`변화 확인 가능 |
| **K2** | K2. 사용자의 수정 행동 발생 여부 확인 |
| **R2** | R2. 세부 수정 행동 여부 측정 가능 |
| K3 | K3. 이탈 및 Backflow 발생여부 확인  |
| R3 | R3. 이탈률, Backflow를 통해 확인 루프의 구조적 한계 식별  |
| 연결 결정사항 | 카테고리 기반 확인 구조 도입 |
</aside>

## 초기 반응

### 조건 기반 추천

사용자가 Travel Fixed 이후 서비스에 진입했을 때,
조건 기반 추천을 먼저 인지하고 탐색 행동을 시작하도록 유도하는 단계

| Objective | Key | Result |
| --- | --- | --- |
| 검색 시작 화면에서 여행 조건 입력 강조 UI 노출 실험 | CTR, SR, SS(검색착수율) 검색 시작 여부, SP1 | 탐색 시작 여부 및 detail check로 전환하는데 걸린 시간 확인 |
| 사용자 입력 조건 기반 카테고리 구조로 묶어 탐색 결과 제공 실험 | SR, Detail check 퍼널 체류 시간 | 탐색 버튼 클릭 이후 detail check 체류 시간 확인 |

## 그룹 분리

### 로그인 / 비로그인 사용자

사용자를 로그인 여부에 따라 나누고,

어떤 집단에서 저장과 이후 루프 연결이 더 잘 발생하는지 비교하는 단계

| Objective | Key | Result |
| --- | --- | --- |
| 저장된 체크리스트 보기 제공 그룹(로그인) vs 미제공 그룹(비로그인) 분리 실험 | CTR, Backflow, 재진입률(리텐션) | 저장된 체크리스트 보기 클릭률 및 재탐색 여부 비교 |

---

## 3. 지속 행동 유도

### 탐색한 체크리스트 저장

사용자가 탐색만 하고 끝나는 것이 아니라,

확인한 준비 정보를 실제 체크리스트 저장까지 이어가도록 유도하는 단계

| Objective | Key | Result |
| --- | --- | --- |
| 검색 결과에서 원클릭 체크리스트 저장 구조 제공 실험 | CVR, 저장 여부, SP2 | 상세 확인 이후 저장 행동 발생 여부 확인 |

---

## 4. 재진입 유도

### Confirm Loop에서 저장한 체크리스트 확인·수정

저장 이후 끝나는 것이 아니라,

사용자가 다시 들어와 저장한 체크리스트를 확인하고 수정하며 실제 준비 행동으로 이어지도록 유도하는 단계

| Objective | Key | Result |
| --- | --- | --- |
| 인증된 사용자가 ‘내 체크리스트 보기’ UI 노출 실험 | CTR, SR | 저장 이후 Confirm Loop(Saved List Open) 진입 여부 및 비율 확인 |
| 정의된 도메인 기반 카테고리로 구조화된 체크리스트 제공 실험  | CP2, Edit_text, Edit_add, Edit_del, Edit_reorder | Edit 이후  Prepare Action 발생 여부 |
| 저장된 체크리스트에서 편집 기능 제공 실험 | Edit_text, Edit_add, Edit_del, Edit_reorder, CP1 | Edit 내 세부 데이터별 평균 사용률 확인 및 Saved List Open 이후 Edit 발생 여부 확인 |