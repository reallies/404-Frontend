| **항목** | **내용 (수식 + 설명)** |
| --- | --- |
| **사용자 관측(지표느낌)** | - 사용자는 여행이 확정된 이후에도 여행 준비를 한 번에 끝내지 못하고, 
   여러 채널을 반복 탐색하며 필요한 정보를 직접 수집·정리한다. 
   현재 관측하고자 하는 행동 구조는 하나의 직선 퍼널이 아니라, 
   저장 루프(Store Loop), 확인 루프(Confirm Loop), 전체 루프(Total Loop)의 3개 루프로 분리된다. 

- 행동 흐름 정의
   - 전체 루프(Total Loop): 
      - Travel Fixed → [Store Loop] → [Confirm Loop] → Reuse 

   - 저장 루프(Store Loop): 
      - Search → Detail Check → Save

   - 확인 루프(Confirm Loop): 
      - Saved List Open → Edit(Edit_text/Edit_add/Edit_del/Edit_reorder) → Prepare Action

- 확인 루프 도중 빠진 항목을 발견하여 새롭게 검색하거나 추가하는 경우는 
   Confirm Loop 내부의 단순 수정이 아니라, Store Loop의 재발동으로 본다. 
   이는 지표 꼬임을 막기 위한 운영 정의이다. 

- [추가 Layer - 관측 확장] 
   - Save 이후에도 Prepare Action으로 바로 이어지지 않고 확인/보완 반복 구간 존재 
   - Confirm Loop 내 Backflow(재탐색) 구조적으로 발생 
   - 일부 Save는 저장 상태에 머무르고 해결 상태(Resolution)로 전이되지 않음 

- [Bootstrap Layer - Cold Start 관측] 
   - 초기 사용자에서는 Search → Save 전이 자체가 발생하지 않을 수 있음 (Zero-Transition Zone 존재) 
   - 초기 Save는 정보 신뢰 기반이 아니라 UI/호기심 기반으로 발생할 가능성 존재 
   - Confirm Loop 진입 전 이탈 비율이 구조적으로 높음 
   - 초기 상태에서는 Loop가 아니라 Fragmented Behavior (단절된 행동 조각) 형태로 관측됨 

- [Upgrade Layer - 상태 전이 정밀화] 
   - 각 상태 간 전이를 확률 변수로 정의 가능 
   - 기존 LCP는 coarse-grained, 본 Layer는 fine-grained 전이 모델 
   - Hidden State 존재 가능 (인지/이해 단계는 직접 관측 불가) |
| **문제 배경** | [저장 루프에서 발생하는 문제] 
   - 정보 분산 문제: 여행 준비에 필요한 정보(준비물, 입국 정책, 예약 정보 등)가 
      검색 포털, 블로그, SNS, 공식 사이트 등 다양한 채널에 분산되어 있다. 

   - 탐색 및 비교 비용 증가: 사용자는 정보를 단순히 찾는 것을 넘어, 
      서로 다른 출처의 정보를 비교, 검증하는 과정까지 수행해야 한다. 
      그 결과 사용자는 필요한 정보를 한 번에 확보하지 못하고, 
      검색 → 상세 확인 → 저장 → 재탐색의 반복 행동을 수행하게 된다.

   - 정보 시의성 부족(노후화) 문제: 
      - 국가별 입국 정책, 여행 규정, 운영 시간 등은 수시로 변경되지만, 일부 정보는 업데이트되지 않은 채 남아 있다. 

   - 상황 맥락 미반영 문제: 여행 조건(여행지, 동행인, 일정, 관광 성격 등) 에 따라 필요한 준비 항목이 달라지지만, 
      일반화된 정보 중심으로 제공되어 사용자가 자신의 상황에 맞게 정보를 재구성해야 한다. 

[확인 루프에서 발생하는 문제] 
   - 준비 및 예약 항목 누락 문제: 
      - 정보가 단편적으로 소비되면서 준비물, 예약, 일정 등의 항목이 하나의 흐름으로 관리되지 않는다.

   - 준비 과정의 반복 확인 문제: 
      - 사용자는 저장한 정보를 다시 확인하고 보완하기 위해 동일한 탐색 과정을 반복한다. 

   - 실제 액션(Prepare Action)으로 이어지지 않는 단절 문제 : 
       - 정보는 존재하지만 개인에게 맞는 구조화와 실행으로 연결되기 어려워 실제 액션으로 옮기는데 지연되는 문제가 발생한다.

- [Bootstrap Layer - Cold Start 문제] 
   - 초기에는 정보 밀도가 부족하여 추천/정리 품질이 낮음 
   - 사용자 입력 없이 자동 구조화가 어려움 (Cold Start Knowledge Gap) 
   - 초기 Save 데이터는 노이즈 비율이 높음 (Low Signal-to-Noise) 
   - 초기 단계에서는 정보 부족이 아니라 구조 부재가 핵심 문제 

- [Upgrade Layer - 정보 구조화 문제 정식화] 
   - Information → Structure → Execution Pipeline 존재 
   - 병목은 Information 부족이 아니라 Transformation Failure  |
| **문제 정의** | - 본 서비스가 다루는 핵심 문제는 사용자가 여행 전 준비 단계에서 
   분산된 정보를 반복 탐색하고 직접 정리해야 하기 때문에 준비 부담이 증가하며, 
   저장한 정보를 실제 준비 행동으로 연결하는 과정에서도 다시 정보 공백을 발견해 루프가 재발동된다는 점이다. 

- 즉, 시스템 목표는 전체 루프 (저장 루프 + 확인 루프) 에서 저장 루프에서의 반복 최소화를 통한
   탐색 피로도 최소화와 확인 루프에서의 루프 완성도를 종합적으로 확인하는 것이 필요하다. 

- 따라서 본 문서는 단일 퍼널 완성률이 아니라, 
   루프별 전이 확률과 루프 마찰 지표를 함께 측정하는 구조를 정의한다. 

- 1. 정량 관찰 모델 (Preparation Burden Score) 

   - $PB_t = \alpha Store\_R_t + \beta IG_t + \gamma Delay_t$ 

      → 시점 (t)에서의 여행 준비 부담도(Preparation Burden Score) 

   - $IG_t = \frac{MissingItemDetection\ Sessions}{SavedListOpen\ Sessions}$

      → 저장 리스트를 열어본 뒤, 빠진 준비 항목을 발견한 비율 

   - $Delay_t = \frac{\overline{Time(Search \rightarrow Save)}}{MaxTime}$

      → 검색부터 저장까지 걸린 평균 시간을 정규화한 값 
          즉, 빠진 항목 발견 비율, 재탐색 비율, 저장까지의 지연 시간이 높을수록 준비 부담은 증가한다. 

- 2. Store Loop 전이 확률

  • Search 이후 Detail Check 발생 여부
  •  $SP_1 = \frac{DetailCheck\ Sessions}{Search\ Sessions}$ : 검색 이후 상세 확인으로 이어진 비율 

  • Detail Check 이후 Save 발생 여부
  •  $SP_2 = \frac{Save\ Sessions}{DetailCheck\ Sessions}$ :  상세 확인 이후 저장 행동이 발생한 비율 

   - $Store\_LCP = SP_1 \times SP_2$

      → 저장 루프 완성 확률

   - $Store\_R = \frac{ReSearch\ Sessions}{Search\ Sessions}$

      → 동일 준비 과정에서 재탐색이 발생한 비율

   - $Store\_LSI = Store\_LCP \times (1 - PB_t)$

      → 저장 루프 성공 확률에 준비 부담을 반영한 안정성 지수 

- 3. Confirm Loop 전이 확률

   - $CP_1 = \frac{Edit\ Sessions}{SavedListOpen\ Sessions}$

      → 저장 리스트를 연 뒤 실제 수정 행동이 발생한 비율

   - $CP_2 = \frac{PrepareAction\ Sessions}{Edit\ Sessions}$

      → 수정 이후 실제 준비 완료 행동으로 이어진 비율

   - $Confirm\_LCP = CP_1 \times CP_2$

      → 확인 루프 완성 확률

   - $Backflow = \frac{ReStoreTrigger\ Sessions}{SavedListOpen\ Sessions}$

      → 확인 중 빠진 항목을 발견하여 다시 저장 루프를 재발동한 비율

   - $Confirm\_LSI = Confirm\_LCP \times (1 - Backflow)$

      → 확인 루프 성공 확률에 역류 정도를 반영한 안정성 지수 

- 4. Total Loop 구조 지표

   - $Total\_LCP = Store\_LCP \times Confirm\_LCP$

      → 전체 준비 루프 완성 확률

   - $Total\_LSI = Total\_LCP \times (1 - \lambda_1 Store\_R - \lambda_2 Backflow)$ 단, $(\lambda_1 + \lambda_2 = 1)$ 

      → 전체 루프의 성공 확률에 재탐색과 역류를 함께 반영한 안정성 지수

           $(\lambda_1 Store\_R + \lambda_2 Backflow =$ $전체 감점량)$
           (람다 → 두 패널티 항목의 반영 비중)

- 5. 해석 원칙
   - Store_LCP 가 낮으면: 
      - 검색 후 저장까지 이어지는 구조가 약함 

   - $PB_t$ 가 높으면: 
      - 정보 공백, 재탐색, 지연으로 준비 부담이 큼 

   - Backflow 가 높으면: 
      - 저장한 정보만으로 실제 준비가 완료되지 못하고 다시 탐색이 필요함 

   - Total_LSI 가 낮으면: 
      - 전체 여행 준비 구조가 안정적으로 닫히지 못함

- [Bootstrap Layer - Cold Start 모델링] 
   - 초기 확률은 관측 기반이 아니라 추정 기반 필요 

   - $\tilde{SP_1}, \tilde{SP_2}, \tilde{CP_1}, \tilde{CP_2}$ (Pseudo Transition) 정의 필요 

   - $\tilde{P}(Event) = \frac{Observed + \epsilon}{Total + k\epsilon}$ (Laplace Smoothing) 

   - 초기 $PB_t$는 과대추정 경향 존재 (Exploration Bias) 

   - Cold Start 구간에서는 LCP보다 Event 발생 여부 자체가 주요 지표 

- [Upgrade Layer - 확률 구조 고도화] 
   - 전체 구조는 Markov Chain으로 확장 가능 
   - 상태 집합: {Search, Detail, Save, ~~Structured, Actionable, Execute~~} 
   - 전이 행렬 $T$ 정의 가능 
   - 장기 수렴 상태 (Steady State) 분석 가능 |
| **목표** | - 본 문서는 목표 수치 달성 자체를 선언하는 문서가 아니라, 
   여행 준비 행동 구조를 관측 가능한 상태로 정의하는 측정 체계 문서이다. 

- 목표는 사용자의 여행 준비 과정에서 발생하는 반복 탐색, 정보 공백, 저장 이후 재탐색 발생 여부를 수치화하고, 
   저장 루프와 확인 루프가 실제 준비 행동까지 얼마나 안정적으로 이어지는지를 판단할 수 있도록 하는 것이다. 

1. 활성화(초기) 단계에서 여행 준비를 시작하기 쉽게(체크리스트를 저장하기 쉽게)만들고 
2. 유지(중기) 단계에서는 체크 리스트를 확인하기 쉽게 만들고 
3. 동기(후기) 단계에서는 우리 서비스를 처음부터 다시 사용하고 싶게 만들어야 함 

- [초기 단계] → 활성화(Activation) 진입 
   - $PB_t$(여행 준비 부담도) ≤ 70% 
   - Travel Fixed → Store Loop 전이 확률 ≥ 50% 
   - Travel Fixed 이후 Store Loop 발생 여부
   - SP1 ≥ 50% 
   - Search 이후 detail check 발생 여부
   - SP2 ≥ 50% 
   - Detail Check 이후 Save 발생 여부
   - Store_LCP ≥ 50% 
   - Store_R ≤ 50% 
   - 진입 후 첫 Save까지 소요 시간 ≤ 6시간 

- [중기 단계] → 유지(Retention) 
   - $PB_t$ (여행 준비 부담도) ≤ 50% 
   - Backflow ≤ 50%
   - Backflow 발생여부 
   - CP1 ≥ 50% 
   - Saved List Open 이후 Edit 발생 여부
   - CP2 ≥ 50% 
   - Edit 이후  Prepare Action 발생 여부
   - confirme_LCP ≥ 50% 
   - store loop → confirm loop 전이 확률 ≥ 70% 

- [후기 단계] → 동기(Motivation) 
   - PB_t(여행 준비 부담도) ≤ 30% 
   - Total_LCP ≥ 50% 
   - Prepare Action → Reuse 전이 확률 ≥ 50% 
   - Confirm Loop 이후 Reuse 발생 여부
   - 새로운 Store Loop 발생 확률 ≥ 50% 

- [추가 목표 Layer] 
   - Total Loop Closure 극대화 

- [Bootstrap Layer - 초기 목표 정의] 
   - First Save Rate ≥ 30% 
   - First Confirm Entry ≥ 20% 
   - First Loop Completion ≥ 10% 
   - Time To First Meaning (TTFM) ≤ 10min → 초기 단계에서는 완성률이 아니라 첫 의미 경험이 핵심 목표 

- [Upgrade Layer - One-Shot 목표 통합] ⇒ 추후 반영(현재단계 고려X)

   - $Impact = E \cdot (Emotion^\alpha \cdot Meaning^\beta \cdot Identity^\gamma)$

   - 목표: Loop 최적화 → One-Shot Impact 극대화 전환 

   - TTFC (Time To First Completion) 최소화 |
| **관련 지표** | - 전이 확률: SP1, SP2, CP1, CP2 
- 루프 완성 지표: Store_LCP, Confirm_LCP, Total_LCP 
- 마찰/반복 지표: Store_R, Backflow 
- 부담 지표: $PB_t, IG_t, Delay_t$ 
- 안정성 지표: Store_LSI, Confirm_LSI, Total_LSI 
- 후행 결과 지표(선택): Prepare Completion Rate, Return to Checklist Rate 

- 기존 문서의 Reuse는 핵심 루프 전이에서 제외 

- [추가 지표] 
~~~~
   - $CP_{total} = P(Prepare Action \mid Travel Fixed)$

- [Bootstrap Layer - 초기 지표 체계] 
   - FirstEventRate
   - FirstSaveConversion
   - $NoiseRatio = \frac{InvalidSave}{TotalSave}$
   - EarlyDropRate
   - TTFM

- [Upgrade Layer - 고급 지표] 
   - Mutual Information 기반 전이 영향도 
   - KL Divergence 기반 사용자 세그먼트 차이 
   - Path Entropy (행동 다양성) |
| **제약 조건** | - 모든 지표는 동일 집계 기간 기준으로 계산한다. 
- 세션은 30분 inactivity 기준으로 분리한다. 
- Backflow는 원인 완전 분리 불가 
- Prepare Action은 실제 완료 보장 아님 
- $PB_t$ 가중치는 초기 동일 → 추후 조정 
- 이벤트 정의 변경 시 과거 비교 제한 
- 개인정보 최소 수집 원칙 적용 

- [Bootstrap Layer - 초기 제약] 
   - 데이터 sparsity로 인해 통계적 신뢰도 낮음 
   - 초기 분포는 실제 사용자 행동을 대표하지 않을 수 있음 
   - Exploration bias 존재 
   - Early cohort와 later cohort 간 비교 왜곡 발생 가능 

- [Upgrade Layer - 모델 제약] 
   - Markov 가정은 실제 행동을 완전히 설명하지 못함 (Non-Markovian behavior 존재) 
   - Hidden State 추정 필요 (HMM 또는 Latent Variable 모델 필요) |

## 용어 사전

| 용어 | 정의 | 설명 |
| --- | --- | --- |
| Travel Fixed | 여행이 확정된 상태 | 사용자가 여행지 선정, 항공권 예매, 숙소 예약 등을 완료하여 여행 자체는 확정되었으나 세부 준비는 아직 진행 중인 상태를 의미한다. |
| Search | 여행 준비 정보를 찾기 위한 탐색 행동 | 사용자가 블로그, 카페, 유튜브, 포털 검색 등을 통해 여행 준비와 관련된 정보를 찾는 행동이다. |
| Detail Check | 특정 콘텐츠의 상세 내용을 확인하는 행동 | 검색 결과 중 하나를 선택하여 게시글, 영상, 후기, 가이드 문서 등의 실제 내용을 열람하는 행동이다. |
| Save | 필요한 정보를 저장하는 행동 | 사용자가 필요한 내용을 체크리스트, 메모, 링크 저장, 캡처 등의 방식으로 보관하는 행동이다. 현재 문제정의서 v1에서는 기존의 External Save를 Save로 단순화하여 사용한다. |
| Saved List Open | 저장된 리스트를 다시 여는 행동 | 사용자가 이전에 저장한 준비물 리스트, 체크리스트, 메모 목록 등을 다시 열어 확인하는 행동이다. |
| Edit | 저장된 내용을 점검하거나 수정하는 행동 | 사용자가 저장된 항목을 체크하거나, 빠진 항목을 추가하거나, 내용을 수정하는 행동이다. |
| Prepare Action | 실제 준비 행동 | 사용자가 체크리스트를 바탕으로 실제로 준비물을 챙기거나, 예약/환전/유심 구매 등 준비 완료에 가까운 행동을 수행하는 것을 의미한다. |
| Re-Search | 추가 정보를 얻기 위한 재탐색 행동 | 첫 탐색만으로 정보가 충분하지 않다고 판단하여 다른 검색어, 다른 게시글, 다른 플랫폼으로 다시 탐색하는 행동이다. |
| Missing Item | 누락된 준비 항목 | 사용자가 저장한 리스트를 다시 확인하는 과정에서 빠져 있음을 발견한 준비 요소를 의미한다. |
| Missing Item Detection | 빠진 항목 발견 행동 | 사용자가 저장 리스트를 열어본 뒤, 누락된 준비물이나 할 일을 인지하는 행동 또는 상태를 의미한다. |
| Store Loop | 탐색 후 저장까지 이어지는 루프 | `Search → Detail Check → Save`로 구성되는 정보 수집 단계의 행동 루프이다. |
| Confirm Loop | 저장된 내용을 실제 준비 행동으로 연결하는 루프 | `Saved List Open → Check / Edit → Prepare Action`으로 구성되는 확인 및 실행 단계의 행동 루프이다. |
| Total Loop | 전체 여행 준비 사이클 | `Travel Fixed → Store Loop → Confirm Loop → Prepare Action`으로 이어지는 전체 준비 구조를 의미한다. |
| Backflow | 확인 루프에서 저장 루프로 다시 돌아가는 현상 | 저장된 리스트를 확인하던 중 빠진 항목을 발견하여 다시 탐색하거나 저장 루프를 재발동하는 상태를 의미한다. |
| Session | 사용자 활동 단위 | 동일 사용자의 이벤트를 일정 시간 내에서 묶은 분석 단위이다. 현재 문제정의서에서는 30분 inactivity 기준으로 세션을 구분한다. |
| Search Session | Search가 발생한 세션 | 여행 준비를 위한 정보 탐색 행동이 최소 1회 이상 발생한 세션이다. |
| Detail Check Session | Detail Check가 발생한 세션 | 외부 콘텐츠의 상세 내용을 실제로 확인한 행동이 포함된 세션이다. |
| Save Session | Save가 발생한 세션 | 필요한 정보를 저장하는 행동이 최소 1회 이상 발생한 세션이다. |
| Saved List Open Session | Saved List Open이 발생한 세션 | 저장 리스트를 다시 열어본 행동이 포함된 세션이다. |
| Edit Session | Check / Edit가 발생한 세션 | 저장된 리스트를 수정하거나 점검한 행동이 포함된 세션이다. |
| Prepare Action Session | Prepare Action이 발생한 세션 | 실제 준비 행동이 포함된 세션이다. |
| ReSearch Session | Re-Search가 발생한 세션 | 동일 준비 과정 안에서 추가 탐색이 발생한 세션이다. |
| ReStoreTrigger Session | 저장 루프 재발동이 발생한 세션 | Confirm Loop 중 빠진 항목을 발견해 다시 Search 또는 Save 루프로 되돌아간 세션이다. |
| Preparation Burden | 여행 준비 부담 | 정보가 흩어져 있고 직접 정리해야 하므로 발생하는 시간적·인지적 부담을 의미한다. |
| Decision Delay | 준비 완료 판단 지연 | 필요한 정보를 충분히 모으지 못하거나 확신을 갖지 못해 준비 완료 판단이 늦어지는 상태를 의미한다. |
| PB_t | Preparation Burden Score | 시점 t에서의 여행 준비 부담도를 나타내는 합성 지표이다. 빠진 항목 발견, 재탐색, 지연 시간이 클수록 값이 커진다. |
| IG_t | Info Gap / Missing Item Detection Rate | 저장 리스트 확인 시 빠진 항목을 발견한 비율이다. `MissingItemDetection Sessions / SavedListOpen Sessions`로 계산한다. |
| Store_R_t | Re-Search Rate | 검색 세션 대비 재탐색 세션의 비율이다. `ReSearch Sessions / Search Sessions`로 계산한다. |
| Delay_t | Search-to-Save Delay | 검색부터 저장까지 걸린 평균 시간을 정규화한 값이다. 저장까지 오래 걸릴수록 준비 부담이 크다고 본다. |
| SP1 | Search → Detail Check 전이 확률 | 검색 이후 상세 확인으로 이어진 비율이다. `DetailCheck Sessions / Search Sessions`로 계산한다. |
| SP2 | Detail Check → Save 전이 확률 | 상세 정보를 확인한 뒤 저장 행동이 발생한 비율이다. `Save Sessions / DetailCheck Sessions`로 계산한다. |
| CP1 | Saved List Open → Check / Edit 전이 확률 | 저장 리스트를 연 뒤 실제 점검/수정 행동으로 이어진 비율이다. `Edit Sessions / SavedListOpen Sessions`로 계산한다. |
| CP2 | Check / Edit → Prepare Action 전이 확률 | 점검 또는 수정 이후 실제 준비 행동으로 이어진 비율이다. `PrepareAction Sessions / Edit Sessions`로 계산한다. |
| Store_LCP | Store Loop Completion Probability | Store Loop의 전체 완료 확률이다. `SP1 × SP2`로 계산한다. |
| Confirm_LCP | Confirm Loop Completion Probability | Confirm Loop의 전체 완료 확률이다. `CP1 × CP2`로 계산한다. |
| Total_LCP | Total Loop Completion Probability | 전체 준비 루프의 완료 확률이다. `Store_LCP × Confirm_LCP`로 계산한다. |
| Store_R | 저장 루프 반복 비율 | Search가 발생한 세션 중 재탐색이 다시 발생한 비율이다. 저장 루프가 한 번에 닫히지 않는 정도를 의미한다. |
| Store_LSI | Store Loop Stability Index | 저장 루프의 안정성 지수이다. `Store_LCP × (1 - PB_t)`로 계산하며, 저장 루프 성공 확률에 준비 부담을 반영한다. |
| Confirm_LSI | Confirm Loop Stability Index | 확인 루프의 안정성 지수이다. `Confirm_LCP × (1 - Backflow)`로 계산하며, 확인 중 다시 저장 루프로 되돌아가는 정도를 반영한다. |
| Total_LSI | Total Loop Stability Index | 전체 여행 준비 구조의 안정성 지수이다. 전체 루프 성공 확률에 반복 탐색과 역류를 반영한 종합 지표이다. |
| Search Query | 사용자가 입력하는 검색어 | 준비물, 환전, 유심, 비자, 보험, 날씨, 교통 등 여행 준비를 위해 입력하는 키워드를 의미한다. |
| Channel | 사용자가 정보를 확인하는 외부 플랫폼 | 블로그, 카페, 유튜브, 인스타그램, 관광청 사이트 등 여행 정보를 탐색하는 채널을 의미한다. |
| Preparation Checklist | 여행 전 준비 항목을 구조화한 목록 | 준비물, 사전 예약, 출국 전 확인사항 등을 체크 가능한 형태로 정리한 리스트를 의미한다. |
| $SS$ (SearchStart) | SearchStart/ ServiceUsers | 검색 착수율:
서비스 접속한 사용자 중 검색을 한 사용자의 비율. |
| $SCR$(SaveConversionRate) | Save Session / DetailCheck Session | 저장 전환율:
준비 정보 세션에서 저장 세션으로 전환된 비율. |
| RR 
(Resolution Rate) | Structured / Saved | 저장된 것 중 정리까지 간 비율
(save의 질 측정) |
| ERS 
(Execution Readiness Score) | Actionable / Total (또는 Structured 기준도 가능) | 얼마나 행동 가능한 상태까지 갔는가
(정보 → 실행으로 변환되는 능력) |
| Edit_text | 텍스트 (항목) 편집 | Confirm Loop에서 발생하는 Edit 행동 중, 
사용자가 기존 항목의 텍스트를 수정하는 행동  |
| Edit_add | 항목 추가 | Confirm Loop에서 발생하는 Edit 행동 중, 
사용자가 새로운 항목을 추가하는 행동  |
| Edit_del | 항목 삭제 | Confirm Loop에서 발생하는 Edit 행동 중, 
사용자가 기존의 항목을 삭제하는 행동  |
| Edit_reorder | 항목 순서 재배치 | Confirm Loop에서 발생하는 Edit 행동 중, 
사용자가 기존의 항목 순서를 재배치하는 행동  |