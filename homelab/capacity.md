---
layout: page
title: 서비스와 부하테스트
description: >
  대기열과 예매를 두 서비스로 나눠 세우고, 부하를 걸어 정원·자원 스펙을 실측으로 정했습니다
permalink: /homelab/capacity/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

앱 저장소(`cgv-onprem`)의 MR을 머지하면 클러스터에 파드로 자동 배포됩니다 — 다만 그 파드에
적어 둔 정원·커넥션 풀·메모리 상한은 **재 보지 않은 값이었습니다.**

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
아래 결과에 있습니다.</figcaption>
</figure>

## 정한 것

| 무엇을 | 고른 것 | 그렇게 한 이유 |
|---|---|---|
| queue | **Go · 4대** — 늘려서 나누는 쪽 | **요청이 짧고 많음 — 대기열**<br>goroutine(수 KB)이 요청을 맡아 동시 처리 비용이 작고, 예열 없음(빌드 때 기계어) — 파드를 늘리면 바로 나뉨 |
| 순번·현황 | **Redis에 묻는다(폴링)** | **홈·대기 화면이 주기마다 묻는 구조**<br>답(줄·정원·현황)이 전부 Redis에 있어 왕복 1-2번, 1ms에 끝남 — 부하는 횟수(CPU), 어느 파드가 받아도 같은 답 |
| booking | **Java Spring · 한 대** | **요청이 길고 적음 — 입장객**<br>MySQL을 기다리는 동안 메모리를 쥐고, 수는 정원으로 묶임. 돈·좌석의 전부-성공/전부-롤백을 `@Transactional` 하나로 걺 — 대가는 기동부터 드는 수백 MiB의 기본 메모리 |
| 서비스 간 통신 | **Kafka 비동기** — 서로 직접 부르지 않음 | **한쪽이 죽어도 다른 쪽이 안 막힘**<br>동기 호출이면 booking이 죽는 순간 queue도 막힘. 발행하고 끝 — 못 받은 것은 토픽에 남아 따라잡음 |
{:.hl-dec}

## 앱 대시보드

부하 전에 볼 눈부터 — 막힐 거라 예상한 자리(파드 자원·커넥션 풀·Redis·MySQL·좌석 재고)
절반이 **지표가 없었습니다.** 배선을 앱에 심고 대시보드 세 장을 세웠습니다 —
행 순서는 지표 종류가 아니라 판정 순서입니다.

<!-- 슬라이드 10장 — 각 장이 아래 부하테스트 표의 행 하나를 증거한다.
     시간 범위는 실제 부하 판 구간(연출 금지). 캡션은 그 화면에 실제로 보이는 것만 말한다. -->
<div class="hl-shots" markdown="0" aria-label="앱 대시보드 — 화살표로 넘겨 봅니다">
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/q-traefik.png" alt="queue 대시보드 행1 — traefik 메모리·CPU·클라이언트 연결과 고루틴">
    <figcaption><b>(queue)</b> traefik의 메모리 · CPU·스로틀 · 클라이언트 연결과 고루틴입니다.
    브라우저 연결이 사람 수만큼 여기 열리고 고루틴·버퍼가 딸려 — <b>메모리가 인원을
    따라갑니다</b>(사람당 132KiB).</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/q-queue.png" alt="queue 대시보드 행2 — queue 메모리·CPU·스로틀·소켓과 고루틴" loading="lazy">
    <figcaption><b>(queue)</b> queue의 메모리 · CPU·스로틀 · 소켓과 고루틴입니다.
    폴링은 요청마다 끝나 메모리는 인원과 무관하고, 부하는 CPU로 옵니다 — 판정은
    <b>스로틀 선(빨강)</b>: limit 몫을 다 써 CPU를 회수당한 시간, 잘린 만큼 느려집니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/q-latency.png" alt="queue 대시보드 행3 — 폴링 셋의 지연 p99, 오픈 봉우리" loading="lazy">
    <figcaption><b>(queue)</b> 폴링 셋(순번·실황·현황판)의 지연 p99를 앱 구간과 traefik 전 구간으로
    나눠 봅니다. 합격선 둘(현황판 3초 · 정상 구간 0.5초)이 여기 걸리고 — 오픈 봉우리가
    솟았다 내려오면 처리한 것입니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/q-flow.png" alt="queue 대시보드 행4 — 정원의 입출: enter 호출·지연, 입장·회수·반환" loading="lazy">
    <figcaption><b>(queue)</b> enter · 입장 · 회수 · 반환의 수를 세고, enter와 발행의 지연 p99를
    잽니다. <b>입장 = 예매 완료 + 회수</b>여야 정상입니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/b-pod.png" alt="booking 대시보드 행1 — 메모리 limit, CPU·스로틀·GC, heap·nonheap" loading="lazy">
    <figcaption><b>(booking)</b> booking의 메모리 · CPU·스로틀·GC 정지 · JVM heap입니다.
    지키는 선이 둘 — 컨테이너 limit(넘으면 커널이 OOMKill)과 <b>힙 상한 768Mi</b>(JVM이
    그 안에서 GC로 버팀)입니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/b-mysql.png" alt="booking 대시보드 행2 — 커넥션 풀과 MySQL CPU" loading="lazy">
    <figcaption><b>(booking)</b> 커넥션 풀(사용·대기)과 MySQL CPU를 나란히 봅니다 —
    <b>풀이 차는데 MySQL이 놀면, 상한은 DB가 아니라 풀입니다.</b> 화면의 대기 397 스파이크가
    그 순간입니다(MySQL은 12%).</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/b-journey.png" alt="booking 대시보드 행3 — 여정 단계별 통과 수와 지연" loading="lazy">
    <figcaption><b>(booking)</b> 여정의 단계별 통과 수와 지연 p99입니다 — 입장한 사람이
    어느 단계에서 떨어지는지, <b>전원이 완주했는지</b>가 여기서 판정됩니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/rk-redis.png" alt="Redis·Kafka 대시보드 행1 — master CPU 상한 1코어, 명령별 호출" loading="lazy">
    <figcaption><b>(Redis)</b> 명령이 얼마나 오는지(명령별 초당 호출) · 처리하는 master CPU가
    얼마나 찼는지 · 메모리가 어디까지 왔는지 — 셋으로 포화를 판정합니다.
    명령 처리가 <b>단일 스레드</b>라 CPU의 분모는 limit이 아니라 1코어입니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/rk-kafka.png" alt="Redis·Kafka 대시보드 행2 — 전달 지연 p99와 전달 완결(발행 vs 소비)" loading="lazy">
    <figcaption><b>(Kafka)</b> 두 서비스를 잇는 전달 둘 — <b>승격→인증, 확정→반환</b> — 이
    얼마나 걸리는지(p99 · 통과선 2초)와, 발행·소비가 초당 몇 건씩 쌍으로 맞는지를 봅니다.
    쌍이 어긋나면 어느 쪽이 못 따라가는 것입니다.</figcaption>
  </figure>
</div>

대시보드는 "무엇이 · 얼마나"까지 말합니다 — **"어디서"는 트레이스가** 답합니다.
p99가 튄 자리의 exemplar 점을 누르면 그 요청 하나가 열립니다.

<figure class="hl-shot" markdown="0">
  <img src="/assets/img/homelab/cap/trace.png" alt="Tempo 트레이스 — 예매 확정 한 건: booking의 게이트 확인·MySQL 쓰기·완료 발행에서 Kafka를 건너 queue의 자리 반환까지 한 트레이스" loading="lazy">
  <figcaption>확정 → 반환(bookings-completed) p99의 exemplar로 연 요청 하나 —
  게이트 확인(Redis) · MySQL 쓰기 · 완료 발행, 그리고 <b>Kafka를 건너 queue가 자리를
  비우기까지 한 트레이스</b>입니다(서비스 둘 · 23 span). 오른쪽은 같은 trace_id로 연
  이 요청의 로그 — queue의 "예매완료 수신 → active 제거"까지, 세 신호가 한 요청으로 이어집니다.</figcaption>
</figure>

## 부하테스트

<div class="hl-sub" markdown="0">합격선(SLO) — 통과 판정마다 이 기준으로</div>

| 무엇 | 합격선 | 왜 이 값 | 어디서 재나 |
|---|---|---|---|
| 5xx | **0건** | 대기열은 기다리게 하는 서비스지, 실패시키는 서비스가 아님 | traefik과 앱, 양쪽에서 |
| 입장 경로 p99 | **1초** | 멈추면 눌린 건지 몰라 다시 누름 — 그 재시도가 부하로 더해짐 | queue — `enter` 지연 히스토그램 (오픈 순간 몰림이 봉우리) |
| 현황판 p99 | **3초** | 프론트 폴링이 3초 주기 — 그보다 늦으면 다음 폴이 먼저 옴 | booking — 현황판 응답 지연 (오픈 순간 전원이 3초마다 부름) |
| 정상 구간 p99 | **0.5초** | 체감선이 아니라 회귀선 — 평시가 이전 판보다 나빠졌나 | 같은 지연 지표들 — 오픈 몰림을 지난 시간대만 |
| 메모리 | **limit의 80%** | 수집이 15초 간격 — 그 사이에 튄 봉우리는 지표에 안 찍히니, 찍힌 값에 20% 여유를 둠 | 각 대시보드의 메모리 패널 (working_set / limit) |
| CPU | 합격선 없음 | 차면 죽는 게 아니라 느려질 뿐 — 느려짐은 위의 지연 선이 잡음 | 각 대시보드의 CPU·스로틀 패널 — 판정이 아니라 진단용 |
{:.hl-dec.hl-slo}

## 결과

부하는 k6 — 실제 여정(줄서기 → 폴링 → 좌석 → 확정)을 그대로 밟는 가상 사용자로,
**인원 1,000 → 10,000**(정원 2 고정), 다음 **정원 2 → 500**, 마지막엔 생성기를 클라우드로
옮겨 공개 경로에서 **정원 1,000 · 인원 30,000까지** 걸었습니다. 한 판에 한 변수 —
가정 값이 걸릴 때마다 아래 값이 하나씩 실측으로 바뀌었습니다.

- **앞단은 인원이 걸었습니다** — traefik은 연결이 사람 수만큼 열려 10,000명에서 메모리가 찼고(2대×768Mi → **3대×2Gi**, 올린 뒤 40%), queue는 정한 것대로 CPU — 스로틀 83%·풀 포기 초당 59건이 **1코어**에서 둘 다 0이 됐습니다
- **뒷단은 정원이 걸었습니다** — booking은 정한 것대로 메모리(힙+비힙 990Mi가 1Gi에 닿아 OOMKill → **1,536Mi** · 힙 768Mi 고정, 워킹셋 47%). CPU는 예상 밖의 자리 — Kafka 소비 스레드 넷이 한 코어에 몰려 스로틀 99.7% → **2코어**
- **MySQL은 무죄였습니다** — 풀 대기 397건인 순간 CPU 12%로 유휴. 상한은 DB가 아니라 커넥션 풀이라 **30**으로(대기 0)
- **오픈의 문제는 양이 아니라 뭉텅이였습니다** — 승격 100명 묶음이 인증 지연 4.97초를 만들어, 초당 상한(50명)은 그대로 두고 **25명 / 0.5초**로(0.99초)
- **정원의 상한은 자원이 아니었습니다** — 전 자원이 한도의 절반 아래인 채 좌석 4,000이 먼저 끝났고, 정원은 **1,000**으로(더 올리면 100초에 소진돼 잴 구간이 없음)

이 스펙으로 **10,000명 · 정원 1,000** 판을 통과했습니다 — 76만 요청(대부분 폴링)에 5xx 0 · 재시작 0 ·
풀 대기 0 · 전원 완주. 좌석 4,000은 **440초에 매진**됐고, 마지막 구매자의 대기는
3분 7초였습니다. 인원만 5배 올려도 booking은 그대로였습니다 — **줄이 길어져도 뒤는 안 밀렸습니다.**

스펙 값과 함께 **계수**(사람·확정 한 건당 자원의 기울기)가 남았습니다 — 안 재 본 목표도
계산이 됩니다. "좌석 4,000을 10분에"를 넣으면 booking CPU 18% · MySQL 7%.

## 남은 것

- **Redis만 자원으로 못 풉니다** — 단일 스레드라 코어를 더 줘도, 파드를 늘려도 그 한 대가 나뉘지 않습니다. 계수상 약 2만 5천 명에서 1코어 — 그 위는 명령 수를 줄이는 코드 변경이나 샤딩입니다
- **계수의 실측 구간은 확정 2-11건/초** — 26.5건/초에서 검산해 오차 19%. 그 위는 외삽입니다
- **3만 명 위는 못 쟀습니다** — 노드 메모리(8GB×3)의 물리 한계. 자원이 큰 클러스터에서 같은 방법으로 다시 잽니다

## 쓴 것

k6 · Go · Spring Boot · Redis · Kafka(Strimzi) · MySQL · Traefik · OpenTelemetry
{:.hl-more}

이 용량의 서비스를 인터넷에 여는 일은 다른 문제였습니다.
{:.hl-more}

{% include hl-nav.html %}
