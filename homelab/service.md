---
layout: page
title: 서비스
description: >
  몰리는 사람을 줄 세우는 대기열과 표를 파는 예매, 두 서비스로 나누고 Kafka가 둘을 잇습니다
permalink: /homelab/service/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

올린 앱은 티케팅 서비스입니다 — 예매가 열리는 순간 전원이 한꺼번에 몰리는데,
좌석은 4,000석뿐입니다.

## 서비스 구조

몰리는 사람을 **줄 세우는 쪽(queue)**과 **표를 파는 쪽(booking)**으로 나눴습니다.
둘 사이는 **Kafka가 비동기 통신으로 연결**하며, 둘을 묶는 값은 `active` —
정원(동시에 들여보낼 인원)입니다.

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
부하테스트 카드에 있습니다.</figcaption>
</figure>

## 정한 것

| 무엇을 | 고른 것 | 그렇게 한 이유 |
|---|---|---|
| queue | **Go · 4대 고정** | **요청이 짧고 많음 — 대기열**<br>goroutine(수 KB)이 요청을 맡아 동시 처리 비용이 작고, 기동 즉시 제 속도(빌드 때 기계어). 오픈은 시각을 아는 부하라 4대를 미리 띄워 둠 — HPA는 봉우리보다 늦게 옴 |
| 순번·현황 | **Redis에 묻는다(폴링)** | **홈·대기 화면이 주기마다 묻는 구조**<br>답(줄·정원·현황)이 전부 Redis에 있어 왕복 1-2번, 1ms에 끝남 — 부하는 횟수(CPU), 어느 파드가 받아도 같은 답 |
| booking | **Java Spring · 한 대** | **요청이 길고 적음 — 입장객**<br>MySQL을 기다리는 동안 메모리를 쥐고, 수는 정원으로 묶임. 돈·좌석의 전부-성공/전부-롤백을 `@Transactional` 하나로 걺 — 대가는 기동부터 드는 수백 MiB의 기본 메모리 |
| 서비스 간 통신 | **Kafka 비동기** — 서로 직접 부르지 않음 | **한쪽이 죽어도 다른 쪽이 안 막힘**<br>동기 호출이면 booking이 죽는 순간 queue도 막힘. 발행하고 끝 — 못 받은 것은 토픽에 남아 따라잡음 |
| 관측 | **코드에 계측을 심음** — 메트릭 · 로그 · 트레이스 | **기본 지표만으론 "어디서"가 안 보임**<br>파드 CPU·메모리는 양만 답함. 요청 수·지연 히스토그램은 메트릭으로, 요청 한 건의 구간별 흐름은 트레이스로, 사건은 로그로 — 로그와 트레이스에 같은 trace_id를 실어 서로 연결 |
{:.hl-dec}

## 결과

- **서비스 둘과 프론트가 클러스터에서 돕니다** — queue 4대 · booking 1대 · frontend 2대. 배포는 MR 머지가 전부입니다
- **세 신호가 코드에 심어졌습니다** — 요청 수·지연(메트릭) · 사건(로그) · 요청 흐름(트레이스). 셋이 trace_id로 이어져, 지표에서 이상을 보면 그 요청의 트레이스와 로그까지 내려갑니다
- **정원·커넥션 풀·메모리 상한은 아직 가정값입니다** — 이 계측 위에서 부하를 걸어 실측으로 바꾸는 것이 부하테스트 카드입니다

## 남은 것

- **booking은 한 대입니다** — 마이그레이션 도구가 없어 Hibernate가 기동 때 스키마를 만들고, 두 대가 같이 뜨면 같은 DB에 DDL을 겹쳐 돌립니다. 늘리려면 도구 도입이 먼저입니다
- **입장과 회수의 처리 순서가 보장되지 않습니다** — 입장(admissions)과 회수(admissions-revoked)가 서로 다른 토픽인데, Kafka의 순서 보장은 토픽 안에서만입니다. 입장 소비가 세션 타임아웃보다 밀리면 회수가 먼저 처리되고, 뒤늦게 처리된 입장이 이미 자리를 잃은 사람의 인증을 다시 적습니다 — 자리 없이 좌석 화면을 통과하는 구멍이라, 성립 조건과 닫는 방법(이벤트 모델 변경)을 코드 주석에 남겼습니다

## 쓴 것

Go · Spring Boot · Redis · Kafka(Strimzi) · MySQL · OpenTelemetry
{:.hl-more}

이 서비스를 인터넷에 여는 일은 다른 문제였습니다.
{:.hl-more}

{% include hl-nav.html %}
