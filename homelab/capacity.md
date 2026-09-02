---
layout: page
title: 서비스와 용량
description: >
  대기열과 예매를 두 서비스로 나눠 세우고, 부하를 걸어 정원·자원 스펙을 실측으로 정했습니다
permalink: /homelab/capacity/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

머지하면 클러스터까지는 자동으로 갑니다 — 다만 파드에 적어 둔 정원·커넥션 풀·메모리 상한은
**재 보지 않은 값이었습니다.**

## 서비스 구조

몰리는 사람을 **줄 세우는 쪽(queue)**과 **표를 파는 쪽(booking)**으로 나눴습니다.
둘 사이는 Kafka뿐, 둘을 묶는 값은 `정원`(동시에 들여보낼 인원)뿐입니다.
**예매 오픈**을 눌러 보세요 — 한 판이 돕니다.

<!-- 실제 코드의 순환을 재현하는 시뮬레이션. 뼈대(Redis 상자·줄·정원·producer/consumer·
     토픽 레인·좌석)는 이 마크업에 있고, 움직이는 점(사람·메시지)은
     /assets/js/capacity-sim.js 가 그린다. JS 가 없으면 뼈대가 번호 붙은 정적 흐름도로
     남는 것이 폴백이다. 좌표는 JS 가 rect 속성에서 읽거나 마크업과 맞춰 두었다. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<div class="cap-sim" id="cap-sim">
<div class="cs-ctrl" id="cs-ctrl"><span class="cs-count" id="cs-count">관객 30 · 정원 6 · 좌석 24</span></div>
<svg viewBox="0 0 760 562" role="img" aria-label="대기열 서비스의 한 판 — 관객이 Redis의 waiting 줄에 서고, 승격이 빈자리만큼 앞에서 꺼내 active 정원에 앉힌다. admissions 메시지가 토픽을 거쳐 booking의 입장 인증(admitted)에 적히면 좌석을 살 수 있고, 확정되면 bookings-completed가 토픽을 거쳐 돌아와 active에서 빠져 자리가 빈다">
  <defs>
    <marker id="cs-a" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/></marker>
  </defs>

  <!-- ───────── queue ───────── -->
  <rect class="hla-box" x="16" y="14" width="728" height="158" rx="6"/>
  <image href="/assets/img/icons/go.svg" x="30" y="28" width="20" height="20"/>
  <text class="hla-t" x="58" y="44">queue</text>

  <rect class="hla-inner" x="28" y="58" width="704" height="98" rx="5"/>
  <image href="/assets/img/icons/redis.svg" x="40" y="68" width="15" height="15"/>
  <text class="hla-c" x="62" y="81">Redis</text>
  <text class="hla-s2" x="44" y="104">waiting — 줄 (ZSet)</text>
  <rect class="hla-inner" x="44" y="110" width="340" height="26" rx="13"/>
  <line class="hla-ln" x1="388" y1="123" x2="418" y2="123" marker-end="url(#cs-a)"/>
  <circle class="hla-num" cx="403" cy="102" r="9"/><text class="hla-nt" x="403" y="106">2</text>
  <text class="hla-s2" x="448" y="104">active — 정원 6 (ZSet)</text>
  <rect class="cs-slot hla-inner" x="448" y="106" width="36" height="36" rx="5"/>
  <rect class="cs-slot hla-inner" x="492" y="106" width="36" height="36" rx="5"/>
  <rect class="cs-slot hla-inner" x="536" y="106" width="36" height="36" rx="5"/>
  <rect class="cs-slot hla-inner" x="580" y="106" width="36" height="36" rx="5"/>
  <rect class="cs-slot hla-inner" x="624" y="106" width="36" height="36" rx="5"/>
  <rect class="cs-slot hla-inner" x="668" y="106" width="36" height="36" rx="5"/>
  <circle class="hla-num" cx="30" cy="123" r="9"/><text class="hla-nt" x="30" y="127">1</text>
  <text class="hla-a" x="38" y="148">입장 요청</text>
  <text class="hla-a" x="403" y="88" text-anchor="middle">승격 — 빈자리만큼 앞에서</text>

  <!-- ───────── Kafka ───────── -->
  <rect class="hla-box" x="16" y="196" width="728" height="150" rx="6"/>
  <image href="/assets/img/icons/apachekafka.svg" x="30" y="210" width="18" height="18"/>
  <text class="hla-t" x="56" y="225">Kafka</text>

  <text class="hla-s2" x="44" y="248">admissions — 입장했다</text>
  <rect class="hla-inner" x="44" y="254" width="460" height="24" rx="4"/>
  <line class="hla-ln hla-dash" x1="136" y1="256" x2="136" y2="276" opacity=".25"/>
  <line class="hla-ln hla-dash" x1="228" y1="256" x2="228" y2="276" opacity=".25"/>
  <line class="hla-ln hla-dash" x1="320" y1="256" x2="320" y2="276" opacity=".25"/>
  <line class="hla-ln hla-dash" x1="412" y1="256" x2="412" y2="276" opacity=".25"/>

  <text class="hla-s2" x="44" y="302">bookings-completed — 자리가 빈다</text>
  <rect class="hla-inner" x="44" y="308" width="460" height="24" rx="4"/>
  <line class="hla-ln hla-dash" x1="136" y1="310" x2="136" y2="330" opacity=".25"/>
  <line class="hla-ln hla-dash" x1="228" y1="310" x2="228" y2="330" opacity=".25"/>
  <line class="hla-ln hla-dash" x1="320" y1="310" x2="320" y2="330" opacity=".25"/>
  <line class="hla-ln hla-dash" x1="412" y1="310" x2="412" y2="330" opacity=".25"/>

  <text class="hla-a" x="516" y="290">메시지 {requestId, movieId}</text>
  <text class="hla-a" x="516" y="308">키 = requestId — 사람별 순서</text>

  <!-- 이동 경로는 메시지 점이 그린다 — 번호와 라벨만 경로 요지에 두고,
       도착지가 먼 소비 둘(4·7)만 가는 점선으로 남긴다 -->
  <circle class="hla-num" cx="540" cy="184" r="9"/><text class="hla-nt" x="540" y="188">3</text>
  <text class="hla-a" x="554" y="188">발행 — 토픽 뒤에 붙는다</text>
  <line class="hla-ln hla-dash" x1="30" y1="270" x2="30" y2="410" opacity=".4" marker-end="url(#cs-a)"/>
  <circle class="hla-num" cx="30" cy="356" r="9"/><text class="hla-nt" x="30" y="360">4</text>
  <text class="hla-a" x="44" y="360">소비 — 인증이 적힌다</text>
  <circle class="hla-num" cx="224" cy="380" r="9"/><text class="hla-nt" x="224" y="384">6</text>
  <text class="hla-a" x="238" y="384">발행 — 확정을 알린다</text>
  <line class="hla-ln hla-dash" x1="714" y1="312" x2="714" y2="168" opacity=".4" marker-end="url(#cs-a)"/>
  <circle class="hla-num" cx="714" cy="240" r="9"/><text class="hla-nt" x="714" y="244">7</text>
  <text class="hla-a" x="702" y="244" text-anchor="end">소비 — active에서 뺀다</text>

  <!-- ───────── booking ───────── -->
  <rect class="hla-box" x="16" y="366" width="728" height="184" rx="6"/>
  <image href="/assets/img/icons/spring.svg" x="30" y="380" width="20" height="20"/>
  <text class="hla-t" x="58" y="396">booking</text>

  <!-- 입장 인증도 Redis — queue 와 같은 인스턴스를 본다. ZSet 이 아니라 키+TTL 이라,
       인증이 오면 칸이 켜지고(SET) 확정하면 소진돼 꺼진다(DEL). 시간이 지나도 저절로 꺼진다 -->
  <rect class="hla-inner" x="28" y="416" width="310" height="84" rx="5"/>
  <image href="/assets/img/icons/redis.svg" x="40" y="426" width="14" height="14"/>
  <text class="hla-c" x="60" y="438">Redis</text>
  <text class="hla-s2" x="44" y="458">admitted:{사람} — 입장 인증 (String · TTL 600초)</text>
  <rect class="cs-adm hla-inner" x="44" y="464" width="22" height="14" rx="3"/>
  <rect class="cs-adm hla-inner" x="74" y="464" width="22" height="14" rx="3"/>
  <rect class="cs-adm hla-inner" x="104" y="464" width="22" height="14" rx="3"/>
  <rect class="cs-adm hla-inner" x="134" y="464" width="22" height="14" rx="3"/>
  <rect class="cs-adm hla-inner" x="164" y="464" width="22" height="14" rx="3"/>
  <rect class="cs-adm hla-inner" x="194" y="464" width="22" height="14" rx="3"/>
  <text class="hla-a" x="44" y="493">Kafka로 인증이 온 사람만 좌석 요청이 통과한다</text>

  <circle class="hla-num" cx="386" cy="426" r="9"/><text class="hla-nt" x="386" y="430">5</text>
  <text class="hla-s2" x="400" y="430">좌석 24 — 선점 → 확정</text>
  <rect class="cs-seat hla-inner" x="400" y="436" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="432" y="436" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="464" y="436" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="496" y="436" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="528" y="436" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="560" y="436" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="400" y="462" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="432" y="462" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="464" y="462" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="496" y="462" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="528" y="462" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="560" y="462" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="400" y="488" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="432" y="488" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="464" y="488" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="496" y="488" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="528" y="488" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="560" y="488" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="400" y="514" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="432" y="514" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="464" y="514" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="496" y="514" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="528" y="514" width="26" height="20" rx="3"/>
  <rect class="cs-seat hla-inner" x="560" y="514" width="26" height="20" rx="3"/>

  <image href="/assets/img/icons/mysql.svg" x="612" y="436" width="16" height="16"/>
  <text class="hla-s2" x="634" y="449">MySQL</text>
  <text class="hla-a" x="612" y="472">확정이 적힌다</text>
  <text class="hla-a" x="612" y="488">같은 좌석 두 번 = 거절</text>

  <rect x="612" y="512" width="10" height="10" rx="2" fill="#e0a53c"/>
  <text class="hla-a" x="628" y="521">선점</text>
  <rect x="672" y="512" width="10" height="10" rx="2" fill="#2f6fdb"/>
  <text class="hla-a" x="688" y="521">확정</text>

  <!-- 움직이는 레이어 — JS 가 채운다 -->
  <g id="cs-people"></g>
  <g id="cs-msgs"></g>
</svg>
<div class="cs-log" id="cs-log">멈춰 있으면 구조도, 재생하면 한 판이 도는 흐름도입니다.</div>
</div>
<figcaption>관객 30 · 정원 6 · 좌석 24는 흐름을 보기 위한 축소값입니다 — 실측으로 정한 값은
아래 결과에 있습니다.</figcaption>
</figure>

## 정한 것

| 무엇을 | 고른 것 | 그렇게 한 이유 |
|---|---|---|
| queue | **Go · 4대** — 늘려서 나누는 쪽 | **요청이 짧고 많음 — 대기열**<br>goroutine(수 KB)이 요청을 맡아 동시 처리가 싸고, 예열 없음(빌드 때 기계어) — 파드를 늘리면 바로 나뉨 |
| 순번·현황 | **Redis에 묻는다(폴링)** | **홈·대기 화면이 주기마다 묻는 구조**<br>답(줄·정원·현황)이 전부 Redis에 있어 왕복 1-2번, 1ms에 끝남 — 부하는 횟수(CPU), 어느 파드가 받아도 같은 답 |
| booking | **Java Spring · 한 대** | **요청이 길고 적음 — 입장객**<br>MySQL을 기다리는 동안 메모리를 쥐고, 수는 정원으로 묶임. 돈·좌석의 전부-성공/전부-롤백을 `@Transactional` 하나로 걺 — 대가는 큰 기본 메모리 |
| 서비스 간 통신 | **Kafka 비동기** — 서로 직접 부르지 않음 | **한쪽이 죽어도 다른 쪽이 안 막힘**<br>동기 호출이면 booking이 죽는 순간 queue도 막힘. 발행하고 끝 — 못 받은 것은 토픽에 남아 따라잡음 |
{:.hl-dec}

## 앱 대시보드

부하 전에 볼 눈부터 — 막힐 거라 예상한 자리(파드 자원·커넥션 풀·Redis·MySQL·좌석 재고)
절반이 **지표가 없었습니다.** 배선을 앱에 심고 대시보드 세 장을 세웠습니다 —
행 순서는 지표 종류가 아니라 판정 순서입니다.

<!-- 캐러셀 자리 — queue(traefik) · booking · Redis/Kafka 대시보드 8장 + 트레이스 1장(9장).
     각 장이 아래 부하테스트 표의 행 하나를 증거한다. 트레이스 장 = N+1이 잡힌 화면(요청 하나에
     같은 span 20개) 또는 승격→Kafka→인증이 한 트레이스로 이어진 화면 — 표 7·8행의 "트레이스가
     지목"의 실물. 촬영 전에 패널 제목 정리(시간의 사건들 · 커널의 선 · 다리 완결 등)부터. -->

## 부하테스트

축 둘을 차례로 올렸습니다 — **인원**(줄에 서는 수)과 **정원**(동시에 예매하는 수).
합격선 여섯을 먼저 정했습니다 — 입장 1초 · 현황판 3초 · 정상 구간 0.5초 · 5xx 0건 ·
입장이 실제로 되는가 · 메모리 limit의 80%. **CPU는 없습니다** — 메모리는 차면 죽지만
CPU는 느려질 뿐이고, 느려짐은 지연 선이 잡습니다. 병목은 고칠 때마다 옮겨갔습니다.

| 판 | 나온 것 | 정한 것 |
|---|---|---|
| 버린 네 판 — 인원 1,000부터 | 잰 값 전부 과소 — traefik이 먼저 잘렸고, 도구의 도착이 정렬돼 있었음 | **앞을 열고 도착을 흩은 값만 쓴다** |
| 인원 계단 1,000 → 5,000 · 정원 2 고정 | traefik 메모리·queue CPU·Redis 명령이 인원에 정비례 | **사람당 계수** |
| 그 5,000명 판 도중 | booking 스로틀 82% — 로비는 줄 서기 전이라 대기열이 못 막음. 전원이 직접 부름 | 로비 응답을 nginx가 10초 캐시 |
| 인원 10,000 | 병목이 두 번 이동 — traefik 메모리가 차고, 풀자 queue CPU가 잘림 | 앞단 스펙 상향 — 통과선 여섯 통과 |
| 정원 계단 2 → 500 — 축 전환 | 판을 끝낸 건 자원(25% 미만)이 아니라 **좌석 4,000 완판** | **확정당 계수** — 1코어가 받는 확정/초 |
| 정원 200 · 체류 90초 | 자원 전부 초록인데 처리량 **12분의 1** — 체류(자리를 쥐는 시간) > 세션 만료라 고르는 중 회수됨 | 만료 셋의 순서 고정 · 여정·회수 패널 추가 |
| 관측을 얹고 같은 판 재현 | 계수 예측-실측 **2.2배** — 트레이스가 요청당 Redis 왕복 20번을 지목 | Lua 하나로 묶음 — **계수 복구** |
| 인증 지연 추적 — 판 일곱 | p99 **29.7초** — 밀림 지표는 0, 줄은 컨슈머 안에 있었음 | 스레드·CPU·커밋을 하나씩 갈라 **0.81초** |
| 부하 생성기를 집 밖으로 | "서버 여유" 판정이 뒤집힘 — 도구가 느려 부하가 40% 낮았음 | 공개 경로에서 재측정 — 최종 스펙 |
| 인원 30,000 | 노드 메모리가 파드를 쫓아냄 — 노트북의 물리 한계 | **멈춤** — 위는 계수로 |
{:.hl-tbl}

## 결과

왼쪽 열은 전부 짐작이었고, 오른쪽 열은 전부 잰 값입니다.

| 값 | 판 전 | 판 후 | 근거 |
|---|---|---|---|
| 동시 입장 정원 | 2 — 데모값 | **1,000** | 상한은 자원이 아니라 좌석 4,000 — 더 올리면 100초에 소진돼 잴 구간이 없음 |
| 세션 만료 | 60초 | **300초** | 여정 실측 합 100-330초 |
| DB 커넥션 풀 | 10 | **30** | 10일 때 대기 397건 — 같은 시각 MySQL은 CPU 12%로 유휴 |
| booking 메모리 | 1Gi | **1,536Mi** · 힙 768Mi 고정 | 힙+비힙 합 990Mi가 limit에 닿아 오픈 순간 OOMKill 2회 |
| booking CPU | 1코어 | **2코어** | 1코어에 리스너 스레드 넷이 올라 스로틀 99.7% |
| queue CPU | 500m | **1000m** | 10,000명에서 스로틀 83% |
| traefik | 2대 × 768Mi | **3대 × 2Gi** | 연결이 사람 수만큼 여기 열림 — 사람당 132KiB |
| 승격 배치 / 주기 | 100명 / 2초 | **25명 / 0.5초** | 초당 상한(50명)은 같고 뭉텅이만 4분의 1 — 인증 지연 4.97→0.99초 |
{:.hl-cmp}

이 스펙으로 **10,000명 · 정원 1,000** 판을 통과했습니다 — 76만 요청에 5xx 0 · 재시작 0 ·
풀 대기 0 · 전원 완주. 좌석 4,000은 **440초에 매진**됐고, 마지막 구매자의 대기는
3분 7초였습니다. 인원만 5배 올려도 booking은 그대로 — 줄이 아무리 길어도 **뒤가 안 밀립니다.**

값보다 오래 남는 것은 **계수**(사람·확정 한 건당 자원의 기울기)입니다 — 안 재 본 목표도
계산됩니다. "좌석 4,000을 10분에"를 넣으면 booking CPU 18% · MySQL 7%.

## 남은 것

- **Redis만 자원으로 못 풉니다** — 단일 스레드라 코어를 더 줘도, 파드를 늘려도 그 한 대가 나뉘지 않습니다. 계수상 약 2만 5천 명에서 1코어 — 그 위는 명령 수를 줄이는 코드 변경이나 샤딩입니다
- **계수의 실측 구간은 확정 2-11건/초** — 26.5건/초에서 검산해 오차 19%. 그 위는 외삽입니다
- **3만 명 위는 못 쟀습니다** — 노드 메모리(8GB×3)의 물리 한계. 자원이 큰 클러스터에서 같은 방법으로 다시 잽니다

## 쓴 것

k6 · Go · Spring Boot · Redis · Kafka(Strimzi) · MySQL · Traefik · OpenTelemetry
{:.hl-more}

이 용량의 서비스를 인터넷에 여는 일은 다른 문제였습니다.
{:.hl-more}
