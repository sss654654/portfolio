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

예매 오픈에 몰리는 사람을 **줄 세우는 쪽(queue)**과 **표를 파는 쪽(booking)**으로 나눴고,
두 서비스 사이의 통신은 **Kafka 비동기 메시지**가 맡습니다 — "입장했다"와 "자리가 빈다"가
토픽을 건너 서로에게 전해집니다. 둘을 잇는 값이 `정원`(동시에 들여보낼 인원)입니다.
**예매 오픈**을 눌러 보세요 — 한 판이 돕니다.

<!-- 실제 코드의 순환을 재현하는 시뮬레이션. 뼈대(Redis 상자·줄·정원·토픽 레인·좌석)는
     이 마크업에 있고, 움직이는 점(사람·메시지)은 /assets/js/capacity-sim.js 가 그린다.
     JS 가 없으면 뼈대가 번호 붙은 정적 흐름도로 남는 것이 폴백이다.
     좌표는 JS 가 rect 속성에서 읽으므로 이 마크업이 단일 소스다. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<div class="cap-sim" id="cap-sim">
<div class="cs-ctrl" id="cs-ctrl"><span class="cs-count" id="cs-count">관객 30 · 정원 6 · 좌석 24</span></div>
<svg viewBox="0 0 760 566" role="img" aria-label="대기열 서비스의 한 판 — 관객이 Redis의 줄에 서고, 승격이 빈자리만큼 앞에서 꺼내 정원에 앉히고, admissions 메시지가 Kafka 토픽에 적혔다가 소비돼 booking의 입장 인증이 되며, 좌석이 확정되면 bookings-completed 가 같은 길로 되돌아와 자리가 빈다">
  <defs>
    <marker id="cs-a" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/></marker>
  </defs>

  <!-- ───────── queue ───────── -->
  <rect class="hla-box" x="16" y="14" width="728" height="178" rx="6"/>
  <image href="/assets/img/icons/go.svg" x="30" y="28" width="20" height="20"/>
  <text class="hla-t" x="58" y="44">queue</text>
  <text class="hla-a" x="122" y="44">Go — 대기열</text>

  <!-- 줄도 정원도 Redis 안 — 파드가 아니라 여기 산다 -->
  <rect class="hla-inner" x="28" y="58" width="704" height="100" rx="5"/>
  <image href="/assets/img/icons/redis.svg" x="40" y="68" width="15" height="15"/>
  <text class="hla-c" x="62" y="81">Redis</text>
  <text class="hla-a" x="718" y="81" text-anchor="end">줄도 정원도 파드가 아니라 여기 있다</text>
  <text class="hla-s2" x="44" y="104">waiting — 줄</text>
  <rect class="hla-inner" x="44" y="110" width="340" height="26" rx="13"/>
  <line class="hla-ln" x1="388" y1="123" x2="418" y2="123" marker-end="url(#cs-a)"/>
  <circle class="hla-num" cx="403" cy="102" r="9"/><text class="hla-nt" x="403" y="106">2</text>
  <text class="hla-s2" x="448" y="104">active — 정원 6</text>
  <rect class="cs-slot hla-inner" x="448" y="106" width="36" height="36" rx="5"/>
  <rect class="cs-slot hla-inner" x="492" y="106" width="36" height="36" rx="5"/>
  <rect class="cs-slot hla-inner" x="536" y="106" width="36" height="36" rx="5"/>
  <rect class="cs-slot hla-inner" x="580" y="106" width="36" height="36" rx="5"/>
  <rect class="cs-slot hla-inner" x="624" y="106" width="36" height="36" rx="5"/>
  <rect class="cs-slot hla-inner" x="668" y="106" width="36" height="36" rx="5"/>
  <circle class="hla-num" cx="30" cy="123" r="9"/><text class="hla-nt" x="30" y="127">1</text>

  <text class="hla-a" x="44" y="182">consumer — bookings-completed 를 받아 자리를 비운다</text>
  <text class="hla-a" x="716" y="182" text-anchor="end">producer — admissions 를 발행한다</text>

  <circle class="hla-num" cx="58" cy="202" r="9"/><text class="hla-nt" x="58" y="206">7</text>
  <circle class="hla-num" cx="560" cy="202" r="9"/><text class="hla-nt" x="560" y="206">3</text>

  <!-- ───────── Kafka ───────── -->
  <rect class="hla-box" x="16" y="212" width="728" height="150" rx="6"/>
  <image href="/assets/img/icons/apachekafka.svg" x="30" y="226" width="18" height="18"/>
  <text class="hla-t" x="56" y="241">Kafka</text>
  <text class="hla-a" x="126" y="241">발행은 뒤(오른쪽)에 붙고, 소비는 앞(왼쪽)에서부터 가져간다</text>

  <text class="hla-s2" x="44" y="264">admissions</text>
  <text class="hla-a" x="146" y="264">queue → booking · 입장했다</text>
  <rect class="hla-inner" x="44" y="270" width="460" height="24" rx="4"/>
  <line class="hla-ln hla-dash" x1="136" y1="272" x2="136" y2="292" opacity=".25"/>
  <line class="hla-ln hla-dash" x1="228" y1="272" x2="228" y2="292" opacity=".25"/>
  <line class="hla-ln hla-dash" x1="320" y1="272" x2="320" y2="292" opacity=".25"/>
  <line class="hla-ln hla-dash" x1="412" y1="272" x2="412" y2="292" opacity=".25"/>

  <text class="hla-s2" x="44" y="318">bookings-completed</text>
  <text class="hla-a" x="196" y="318">booking → queue · 자리가 빈다</text>
  <rect class="hla-inner" x="44" y="324" width="460" height="24" rx="4"/>
  <line class="hla-ln hla-dash" x1="136" y1="326" x2="136" y2="346" opacity=".25"/>
  <line class="hla-ln hla-dash" x1="228" y1="326" x2="228" y2="346" opacity=".25"/>
  <line class="hla-ln hla-dash" x1="320" y1="326" x2="320" y2="346" opacity=".25"/>
  <line class="hla-ln hla-dash" x1="412" y1="326" x2="412" y2="346" opacity=".25"/>

  <text class="hla-a" x="522" y="272">메시지 — JSON {requestId, movieId}</text>
  <text class="hla-a" x="522" y="290">키 = requestId — 같은 사람의 사건은</text>
  <text class="hla-a" x="522" y="306">발행 순서대로 처리된다</text>
  <text class="hla-a" x="522" y="336">받는 쪽이 죽어도 메시지는 남는다</text>

  <circle class="hla-num" cx="58" cy="372" r="9"/><text class="hla-nt" x="58" y="376">4</text>
  <circle class="hla-num" cx="500" cy="372" r="9"/><text class="hla-nt" x="500" y="376">6</text>

  <!-- ───────── booking ───────── -->
  <rect class="hla-box" x="16" y="382" width="728" height="172" rx="6"/>
  <image href="/assets/img/icons/spring.svg" x="30" y="396" width="20" height="20"/>
  <text class="hla-t" x="58" y="412">booking</text>
  <text class="hla-a" x="140" y="412">Java Spring — 인증을 확인하고 좌석을 판다</text>

  <!-- 입장 인증도 Redis — queue 와 같은 인스턴스를 본다 -->
  <rect class="hla-inner" x="28" y="426" width="310" height="66" rx="5"/>
  <image href="/assets/img/icons/redis.svg" x="40" y="436" width="14" height="14"/>
  <text class="hla-s2" x="60" y="448">admitted — 입장 인증 (시간이 지나면 만료)</text>
  <text class="hla-a" x="40" y="478">여기 적혀야 좌석 요청이 통과한다 — 없으면 403</text>

  <circle class="hla-num" cx="386" cy="430" r="9"/><text class="hla-nt" x="386" y="434">5</text>
  <text class="hla-s2" x="400" y="420">좌석 24</text>
  <rect class="cs-seat hla-inner" x="400" y="426" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="432" y="426" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="464" y="426" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="496" y="426" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="528" y="426" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="560" y="426" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="400" y="452" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="432" y="452" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="464" y="452" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="496" y="452" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="528" y="452" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="560" y="452" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="400" y="478" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="432" y="478" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="464" y="478" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="496" y="478" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="528" y="478" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="560" y="478" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="400" y="504" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="432" y="504" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="464" y="504" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="496" y="504" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="528" y="504" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="560" y="504" width="26" height="20" rx="3"/>

  <image href="/assets/img/icons/mysql.svg" x="612" y="430" width="16" height="16"/>
  <text class="hla-s2" x="634" y="443">MySQL</text>
  <text class="hla-a" x="612" y="466">확정이 여기 적힌다</text>
  <text class="hla-a" x="612" y="482">같은 좌석 두 번 = 거절</text>

  <rect x="400" y="532" width="10" height="10" rx="2" fill="#e0a53c"/>
  <text class="hla-a" x="416" y="541">선점 — 시간이 지나면 풀린다</text>
  <rect x="560" y="532" width="10" height="10" rx="2" fill="#2f6fdb"/>
  <text class="hla-a" x="576" y="541">확정</text>

  <!-- 움직이는 레이어 — JS 가 채운다 -->
  <g id="cs-people"></g>
  <g id="cs-msgs"></g>
</svg>
<div class="cs-log" id="cs-log">멈춰 있으면 구조도, 재생하면 한 판이 도는 흐름도입니다.</div>
</div>
<figcaption>1 입장 · 2 승격(빈자리만큼 앞에서) · 3 발행 · 4 소비 — 인증 · 5 좌석 선점·확정 ·
6 발행 · 7 소비 — 자리 반환. 관객 30 · 정원 6 · 좌석 24는 흐름을 보기 위한 축소값이고,
실측으로 정한 값은 아래 결과에 있습니다. 인증은 토픽을 건너오는 동안 늦고,
자리는 완료 사건이 되돌아와야 빕니다.</figcaption>
</figure>

## 정한 것

| 무엇을 | 고른 것 | 그렇게 한 이유 |
|---|---|---|
| queue | **Go · 4대** — 늘려서 나누는 쪽 | 요청이 짧고 많음 — Redis 왕복 한두 번, 1ms에 끝나 부하가 횟수(CPU)로 옴. 상태를 파드에 안 두니 파드를 늘리면 다음 요청부터 나뉨. Go는 빌드 때 이미 기계어라 **예열이 없음** — 배포 직후에도 첫 요청부터 같은 속도라, 초당 수천 폴링을 받는 자리에 맞음 |
| booking | **Java Spring · 한 대** — 한 대가 어디서 깨지나를 재는 쪽 | 요청이 길고 적음 — MySQL의 커밋·잠금을 기다리는 동안 요청이 메모리를 쥐고, 수는 정원으로 묶임. 돈·좌석은 여러 테이블 쓰기가 **전부 성공하거나 전부 되돌아야** 해서, 그 경계를 선언(`@Transactional`) 하나로 거는 쪽을 택함 — 대가는 시작부터 큰 메모리 |
| 서비스 경계 | **Kafka로만 알림** — 서로 직접 부르지 않음 | booking은 DB를 들고 있어 무겁고 죽을 수 있음 — 죽어도 줄 전체를 쥔 queue는 살아야 함. 동기 호출이면 booking이 죽는 순간 queue의 호출이 같이 막혀 격리가 깨짐. Kafka는 발행하고 끝 — 못 받은 것은 토픽에 남아 booking이 되살아난 뒤 따라잡음 |
| 순번 전달 | **클라이언트가 묻는다(폴링)** — 서버가 밀어 주는 방식(SSE)을 버림 | 밀어 주려면 서버가 연결을 세션 내내 붙들어야 하고, 쿠버네티스는 연결 단위로 파드를 배정 — 사람이 파드 하나에 묶여 파드를 늘려도 부하가 안 나뉨. 폴링은 요청마다 끝나 어느 파드가 받아도 같음. 대가: 부하 축이 유지 연결 수(메모리)에서 초당 요청 수(CPU)로 바뀜 |
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
