---
layout: page
title: 서비스와 용량
description: >
  대기열과 예매를 두 서비스로 나눠 세우고, 부하를 걸어 정원·자원 스펙을 실측으로 정했습니다
permalink: /homelab/capacity/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

`cgv-onprem`에 머지하면 이미지가 클러스터에 자동으로 반영됩니다. 다만 그 파드에 적어 둔
정원·커넥션 풀·메모리 상한은 **재 보지 않은 값**이었고, 지표와 트레이스를 앱에 심어
부하를 걸고서야 정해졌습니다.

## 서비스 구조

예매 오픈에 몰리는 사람을 **줄 세우는 쪽(queue)**과 **표를 파는 쪽(booking)**으로 나눴습니다.
둘을 잇는 값이 하나 있습니다 — 동시에 몇 명을 들여보낼지, `정원`입니다.
**예매 오픈을 눌러 보세요** — 한 판이 돕니다.

<!-- 정적 구조도가 아니라 실제 코드의 순환을 재현하는 시뮬레이션.
     뼈대(존·줄 트랙·정원 슬롯·Kafka 레인·좌석 격자)는 여기 마크업에 있고,
     움직이는 점(사람·메시지)은 /assets/js/capacity-sim.js 가 그린다.
     JS 가 없으면 뼈대가 정적 구조도로 남는 것이 폴백이다.
     좌표는 JS 가 rect 속성에서 읽으므로 이 마크업이 단일 소스다. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<div class="cap-sim" id="cap-sim">
<div class="cs-ctrl" id="cs-ctrl"><span class="cs-count" id="cs-count">관객 30 · 정원 6 · 좌석 24</span></div>
<svg viewBox="0 0 760 500" role="img" aria-label="대기열 서비스의 한 판 — 관객이 줄에 서고, 승격 루프가 빈자리만큼 앞에서 꺼내 정원에 앉히고, 입장 사건이 Kafka를 건너 booking에 닿아야 좌석을 살 수 있으며, 예매가 끝나면 완료 사건이 되돌아와 자리가 비고 다음 사람이 들어온다">
  <defs>
    <marker id="cs-a" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/></marker>
  </defs>

  <!-- queue 존 -->
  <rect class="hla-box" x="16" y="14" width="728" height="152" rx="6"/>
  <text class="hla-c" x="30" y="38">queue — 줄을 세우고, 빈자리만큼만 들여보낸다</text>
  <text class="hla-s2" x="30" y="64">줄 — 뒤에 서고, 앞에서 나간다</text>
  <rect class="hla-inner" x="28" y="74" width="400" height="26" rx="13"/>
  <line class="hla-ln" x1="432" y1="87" x2="462" y2="87" marker-end="url(#cs-a)"/>
  <text class="hla-a" x="447" y="68" text-anchor="middle">승격</text>
  <text class="hla-s2" x="468" y="64">정원 6 — 동시에 예매하는 인원</text>
  <rect class="cs-slot hla-inner" x="468" y="70" width="36" height="36" rx="5"/>
  <rect class="cs-slot hla-inner" x="512" y="70" width="36" height="36" rx="5"/>
  <rect class="cs-slot hla-inner" x="556" y="70" width="36" height="36" rx="5"/>
  <rect class="cs-slot hla-inner" x="600" y="70" width="36" height="36" rx="5"/>
  <rect class="cs-slot hla-inner" x="644" y="70" width="36" height="36" rx="5"/>
  <rect class="cs-slot hla-inner" x="688" y="70" width="36" height="36" rx="5"/>
  <text class="hla-a" x="30" y="148">순번은 각자 폴링으로 묻는다 — 줄도 정원도 전부 Redis 안이라, 어느 queue 파드가 받아도 같은 답이 나온다</text>

  <!-- Kafka 존 -->
  <rect class="hla-box" x="16" y="186" width="728" height="78" rx="6"/>
  <text class="hla-c" x="30" y="210">Kafka — 두 서비스 사이를 건너는 사건. 서로를 직접 부르지 않는다</text>
  <rect x="30" y="228" width="9" height="9" rx="2" fill="#f08c2e"/>
  <text class="hla-s2" x="46" y="237">admissions ↓ — 이 사람이 입장했다. 도착해야 좌석을 살 수 있다</text>
  <rect x="30" y="248" width="9" height="9" rx="2" fill="#2f6fdb"/>
  <text class="hla-s2" x="46" y="257">bookings-completed ↑ — 예매가 끝났다. 자리가 빈다</text>

  <!-- booking 존 -->
  <rect class="hla-box" x="16" y="284" width="728" height="198" rx="6"/>
  <text class="hla-c" x="30" y="308">booking — 인증을 확인하고 좌석을 판다</text>
  <text class="hla-s2" x="30" y="330">좌석 24</text>
  <rect class="cs-seat hla-inner" x="30" y="338" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="62" y="338" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="94" y="338" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="126" y="338" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="158" y="338" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="190" y="338" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="30" y="364" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="62" y="364" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="94" y="364" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="126" y="364" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="158" y="364" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="190" y="364" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="30" y="390" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="62" y="390" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="94" y="390" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="126" y="390" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="158" y="390" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="190" y="390" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="30" y="416" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="62" y="416" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="94" y="416" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="126" y="416" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="158" y="416" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="190" y="416" width="26" height="20" rx="3"/>
  <rect x="250" y="396" width="10" height="10" rx="2" fill="#e0a53c"/>
  <text class="hla-a" x="266" y="405">선점 — 잠깐 쥔 것. 시간이 지나면 풀린다</text>
  <rect x="250" y="416" width="10" height="10" rx="2" fill="#2f6fdb"/>
  <text class="hla-a" x="266" y="425">확정 — MySQL에 적힘. 같은 좌석은 두 번 못 적는다</text>

  <rect class="hla-inner" x="468" y="322" width="256" height="48" rx="5"/>
  <text class="hla-s2" x="482" y="341">입장 인증 — Kafka로 온 사람만 ✓</text>
  <text class="hla-a" x="482" y="359">인증이 오기 전의 좌석 요청은 403</text>

  <!-- 움직이는 레이어 — JS 가 채운다 -->
  <g id="cs-people"></g>
  <g id="cs-msgs"></g>
</svg>
<div class="cs-log" id="cs-log">위 그림은 멈춰 있는 구조도이자, 재생하면 한 판이 도는 흐름도입니다.</div>
</div>
<figcaption>관객 30 · 정원 6 · 좌석 24는 흐름을 보기 위한 축소값입니다 — 실측으로 정한 값은
아래 결과에 있습니다. 움직임은 전부 실제 코드의 동작입니다: 승격은 빈자리만큼 묶어서 나가고,
인증은 Kafka를 건너오는 동안 늦고, 자리는 완료 사건이 되돌아와야 빕니다.</figcaption>
</figure>

## 정한 것

| 무엇을 | 고른 것 | 그렇게 한 이유 |
|---|---|---|
| 서비스 경계 | **줄(queue)과 판매(booking) 둘로** — 서로 직접 부르지 않고 Kafka로만 알림 | booking은 DB를 들고 있어 무겁고 죽을 수 있음 — 죽어도 줄 전체를 쥔 queue는 살아야 함. 동기 호출이면 booking이 죽는 순간 queue의 호출이 같이 막혀 격리가 깨짐. Kafka는 발행하고 끝 — 못 받은 것은 남아 있다가 booking이 되살아난 뒤 따라잡음 |
| 순번 전달 | **클라이언트가 묻는다(폴링)** — 서버가 밀어 주는 방식(SSE)을 버림 | 밀어 주려면 서버가 연결을 세션 내내 붙들어야 하고, 쿠버네티스는 연결 단위로 파드를 배정 — 사람이 파드 하나에 묶여 파드를 늘려도 부하가 안 나뉨. 폴링은 요청마다 끝나 어느 파드가 받아도 같음. 대가: 부하 축이 유지 연결 수(메모리)에서 초당 요청 수(CPU)로 바뀜 |
| booking 대수 | **한 대** | 대기열이 정원만큼만 흘려보내 인원이 아니라 정원이 booking의 부하를 정함. 그래서 판의 질문도 "몇 대가 필요한가"가 아니라 **"한 대가 어디서 깨지나"**가 됨 |
{:.hl-dec}

## 앱 대시보드

부하를 걸기 전에 볼 눈부터 만들었습니다 — 막힐 거라 예상한 자리 여덟 중
**다섯이 지표로 안 나오고 있었습니다.** 없던 배선을 앱에 심고 판 세 장을 세웠습니다.
행 순서는 지표 종류가 아니라 판정 순서입니다.

<!-- 캐러셀 자리 — queue(traefik) · booking · Redis/Kafka 판. 사건 기준으로 6-7장.
     촬영 전에 패널 제목 정리(시간의 사건들 · 커널의 선 · 다리 완결 등)부터. 작업자와 한 장씩. -->

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| 정원을 200으로 올린 판 — 자원 여섯 선이 전부 10% 미만인데 처리량이 **12분의 1**, 4xx가 37% | 설정 둘의 충돌 — 부하 도구가 준 체류 90초가 세션 타임아웃 60초를 넘어, 좌석을 고르는 중에 자리가 회수됨. 회수 속도(6.7/초)가 새로 인증받는 속도(4.4/초)보다 빨랐음 | 자원 화면으로는 못 잡는 판이라 판에 넷을 추가 — 여정 통과·인증 회수·4xx 코드별·체류와 타임아웃 선. 만료 시간 셋의 순서를 **좌석 180 < 세션 300 < 인증 600초**로 고정 |
| 오픈 직후 입장 인증 지연 p99 **29.7초** — Kafka 밀림 지표(`records_lag`)는 세 시간 내내 0 | 메시지가 토픽이 아니라 **컨슈머 안에서 줄 서 있었음** — 가져올 때 묶음으로 가져와(그 순간 lag은 0) 한 건씩 처리하고, 건마다 오프셋 커밋 10.3ms, 1코어 위에 리스너 스레드 넷. 트레이스를 열어야 보였음 | 변수를 하나씩 갈라 판 일곱 번 — 리스너 스레드 1→4 · CPU limit 1→2코어 · 커밋 건별→배치. **0.81초** |
| 같은 조건 판에서 계수가 안 맞음 — booking CPU 예측 0.157코어 · 실측 0.35코어(**2.2배**). 지표는 "회차 조회가 느리다"까지만 | 트레이스를 여니 요청 하나에 같은 Redis 왕복이 **스무 번** — 회차 20개의 점유 수를 회차마다 따로 묻고 있었음 | 회차 전부를 한 번에 받는 Lua 하나로. 처리량 2배 · p99 1.47초→0.1초 아래 · 계수 예측-실측 일치 복구 |
{:.hl-tbl}

## 결과

숫자가 바뀐 것보다 중요한 것은 **전부에 근거가 생겼다**는 점입니다 — 안 바뀐 값도
"이 정도면 되겠지"에서 "어디까지 받는지 안다"로 바뀌었습니다.

| 값 | 판 전 | 판 후 | 근거 |
|---|---|---|---|
| 동시 입장 정원 | 2 — 데모값 | **1,000** | 상한은 자원이 아니라 좌석 4,000 — 더 올리면 100초에 소진돼 잴 구간이 없음 |
| 세션 만료 | 60초 | **300초** | 여정 실측 합 100-330초. 체류가 이 값을 넘으면 위 첫 트러블이 남 |
| DB 커넥션 풀 | 10 | **30** | 10일 때 대기 397건 — 같은 시각 MySQL은 CPU 12%로 유휴 |
| booking 메모리 | 1Gi | **1,536Mi** · 힙 768Mi 고정 | 힙+비힙 합 990Mi가 limit에 닿아 오픈 순간 OOMKill 2회 |
| booking CPU | 1코어 | **2코어** | 1코어에 리스너 스레드 넷이 올라 스로틀 99.7% |
| queue CPU | 500m | **1000m** | 10,000명에서 스로틀 83% — 풀자 Redis 풀 포기 초당 59건도 0이 됨 |
| traefik | 2대 × 768Mi | **3대 × 2Gi** | 연결이 사람 수만큼 앞단에 열려 메모리가 여기 쌓임 — 사람당 132KiB |
| 승격 배치 / 주기 | 100명 / 2초 | **25명 / 0.5초** | 초당 상한(50명)은 같고 뭉텅이만 4분의 1 — 인증 지연 4.97→0.99초 |
{:.hl-cmp}

이 스펙으로 **10,000명 · 정원 1,000** 판을 통과했습니다 — 76만 요청에 5xx 0건 ·
재시작 0 · 풀 대기 0 · 전원 여정 완주. 그리고 값보다 오래 남는 산출물이 하나 더 있습니다:
**사람 한 명·확정 한 건이 자원을 얼마나 쓰는지의 계수**라, 안 재 본 목표도 계산이 됩니다 —
"좌석 4,000을 10분에 팔겠다"를 넣으면 booking CPU 18% · MySQL 7%가 나옵니다.

## 남은 것

- **Redis만 자원으로 못 풉니다** — 명령을 하나씩 처리하는 단일 스레드라 코어를 더 줘도, 파드를 늘려도 그 한 대가 나뉘지 않습니다. 계수상 약 2만 5천 명에서 1코어에 닿고, 그 위는 폴링마다 순번을 다시 세지 않는 코드 변경이나 샤딩이 필요합니다
- **계수의 실측 구간은 확정 2-11건/초입니다** — 26.5건/초에서 검산해 오차 19%로 맞았지만, 그 위는 여전히 외삽입니다
- **3만 명에서 노드 메모리(8GB×3)에 닿았습니다** — 서비스가 아니라 노트북의 물리 한계라 여기서 멈추고, 그 위는 계수로 계산해 뒀습니다. 자원이 큰 클러스터에서 같은 방법으로 다시 잽니다

## 쓴 것

k6 · Redis · Kafka(Strimzi) · MySQL · Traefik · OpenTelemetry · Grafana Tempo
{:.hl-more}

여기까지가 집 안에서 잰 값입니다. 이 서비스를 인터넷에 여는 것은 다른 문제였습니다.
{:.hl-more}
