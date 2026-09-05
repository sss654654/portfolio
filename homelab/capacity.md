---
layout: page
title: 부하 테스트
description: >
  SLO를 먼저 정하고, 공개된 경로에서 부하를 걸어 입장 인원·자원 스펙을 실측으로 확정했습니다
permalink: /homelab/capacity/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

공개된 경로 위에서 서비스가 돌고 있지만, 파드에 적어 둔 정원·커넥션 풀·메모리 상한은
**재 보지 않은 값이었습니다.**
{:.lead}

## SLO

| 항목 | SLO | 이유 | 측정 위치 |
|---|---|---|---|
| 5xx | **0건** | 대기열은 기다리게 하는 서비스지 실패시키는 것이 아님 | traefik과 앱 양쪽 — 프록시가 만든 5xx는 앱 metric에 미기록 |
| 입장 경로 p99 | **1초** | 멈추면 눌린 건지 몰라 다시 누름 — 재시도가 추가 부하 | queue — enter 지연 (오픈 순간 몰림이 피크) |
| 폴링 p99 | **3초** | 프론트 폴링이 3초 주기 — 늦으면 다음 폴이 먼저 도착 | queue(순번·실황) · booking(좌석 현황판) — 폴링 응답 지연 |
| 정상 구간 p99 | **0.5초** | 체감선이 아니라 회귀를 잡는 선 — 평시가 이전 회차보다 나빠졌나 | 같은 지연 metric — 오픈 몰림을 지난 시간대만 |
| 메모리 | **limit의 80%** | 수집이 15초 간격 — 그 사이 피크는 안 찍히니 찍힌 값에 20% 여유 | 대시보드의 메모리 패널 (working_set / limit) |
| CPU | **없음** | 차면 죽는 게 아니라 느려질 뿐 — 느려짐은 지연 선이 판정 | 대시보드의 CPU·스로틀 패널 — 판정이 아니라 진단용 |
{:.hl-dec.hl-slo}

## 부하 테스트 — 데스크탑

- **한도가 먼저 있습니다** — 노드(8GB · 4vCPU × 3대)가 파드 스펙을, 데스크탑(WSL) 메모리가 생성기 상한 10,000명을 정합니다
- **부하는 k6가 실제 여정 그대로 만듭니다** — 입장 → 대기 → 좌석 → 확정
- **점진 부하** — **인원 1,000 → 10,000** · **정원**(`MAX_SESSIONS` — queue가 동시에 입장시키는 인원) **2 → 1,000**

<div class="hl-sub" markdown="0">queue(traefik) 대시보드</div>

<div class="hl-shots" markdown="0" aria-label="queue 대시보드 — 화살표로 넘겨 봅니다">
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/1.png" alt="queue 대시보드 행1 — traefik 메모리·CPU·연결과 고루틴">
    <figcaption><b>(행1 · traefik)</b> 엣지 공개 전에는 연결이 사람 수만큼 열려
    <b>메모리가 인원을 따라 올랐습니다</b>(CPU 스로틀은 없음).<br>
    → 메모리: 2대 × 768Mi → <b>3대 × 2Gi</b> · 공개 뒤에는 <b>엣지가 방문자 연결을 대신 받습니다</b>.<br>
    → 조정 후: <b>메모리 파드 최대 12%</b> · <b>연결 최대 327</b>.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/2.png" alt="queue 대시보드 행2 — queue 메모리·CPU·스로틀" loading="lazy">
    <figcaption><b>(행2 · queue)</b> queue에는 <b>사람당 폴링 요청</b>이 옵니다 —
    10,000명에서 CPU 몫을 다 써 <b>스로틀 83%</b>.<br>
    → CPU: 500m → <b>1코어</b>.<br>
    → 조정 후: <b>스로틀 0</b> · CPU 최대 28% · 메모리·고루틴은 인원과 무관하게 평평합니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/3.png" alt="queue 대시보드 행3 — 폴링 셋 지연 p99와 5xx" loading="lazy">
    <figcaption><b>(행3 · 폴링)</b> 홈 화면(좌석 현황판 · 실황)과 대기 화면(순번)의
    지연입니다 — SLO는 <b>폴링 3초</b>(프론트 주기)와 <b>정상 구간 0.5초</b>.<br>
    → 실측: 순번 0.04초 · 실황 0.04초 · 좌석 현황판 0.02초 · <b>5xx 0건</b> — 전부 선 안입니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/4.png" alt="queue 대시보드 행4 — enter 호출 수와 지연" loading="lazy">
    <figcaption><b>(행4 · enter)</b> "예매하기"를 누른 사람 수와 응답 지연입니다 —
    <b>입장 경로 SLO 1초</b>가 여기 걸립니다.<br>
    → 실측: p99 최대 0.34초 — 오픈 피크를 포함해 선 안입니다.</figcaption>
  </figure>
</div>

<div class="hl-sub" markdown="0">booking 대시보드</div>

<div class="hl-shots" markdown="0" aria-label="booking 대시보드 — 화살표로 넘겨 봅니다">
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/6.png" alt="booking 대시보드 행1 — 메모리·CPU·힙">
    <figcaption><b>(행1 · booking 파드)</b> 힙 768Mi에 비힙 222Mi가 더해져 limit 1Gi에
    닿아 <b>OOMKill 2회</b>, Kafka 소비 스레드 넷이 한 코어에 몰려 <b>스로틀 99.7%</b>.<br>
    → 메모리: 1Gi → <b>1,536Mi</b>(힙 768Mi 고정) · CPU: 1코어 → <b>2코어</b>.<br>
    → 조정 후: 메모리 55% · <b>스로틀 0</b>.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/7.png" alt="booking 대시보드 행2 — 커넥션 풀과 MySQL" loading="lazy">
    <figcaption><b>(행2 · 커넥션 풀 · MySQL)</b> 풀 대기가 <b>397건</b>인데 같은 시각
    MySQL CPU는 12% — 병목은 DB가 아니라 <b>풀 10</b>이었습니다.<br>
    → 풀: 10 → <b>30</b>.<br>
    → 조정 후: 사용 최대 3 · <b>대기 0</b> · MySQL CPU 20%.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/8.png" alt="booking 대시보드 행3 — 여정 단계별 통과와 지연" loading="lazy">
    <figcaption><b>(행3 · 여정)</b> 입장한 사람이 회차 → 좌석 → 선점 → 확정을 지나는
    통과 수와 지연입니다 — 어디서 떨어지는지가 보입니다.<br>
    → 실측: <b>10,000명 전원 완주</b> · 5xx 0 · 단계별 p99 최대 0.25초, 전부 선 안입니다.</figcaption>
  </figure>
</div>

<div class="hl-sub" markdown="0">Redis · Kafka 대시보드 및 trace</div>

<div class="hl-shots" markdown="0" aria-label="Redis·Kafka 대시보드와 trace — 화살표로 넘겨 봅니다">
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/9.png" alt="Redis·Kafka 대시보드 행1 — Redis master CPU와 명령별 호출">
    <figcaption><b>(행1 · Redis)</b> 명령 처리가 <b>단일 스레드</b>라 CPU의 분모는
    limit이 아니라 <b>1코어</b>입니다.<br>
    → 실측: master <b>32%</b> · 초당 호출은 오픈 피크에서만 증가 · 메모리 여유 —
    전부 선 안입니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/10.png" alt="Redis·Kafka 대시보드 행2 — 승격→인증·확정→반환 전달 지연" loading="lazy">
    <figcaption><b>(행2 · 전달)</b> 승격→인증(queue → booking)과 확정→반환(booking → queue)의
    지연입니다. 승격이 <b>100명 묶음</b>으로 나가면 맨 뒤가 앞 99명을 기다려,
    오픈 직후 인증 지연이 <b>2.5–5초 구간</b>이었습니다.<br>
    → 승격: 100명/2초 → <b>25명/0.5초</b> — 초당 상한(50명)은 그대로, 묶음만 4분의 1.<br>
    → 조정 후: 승격→인증 <b>1초 아래</b> · 확정→반환 0.1초.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/11.png" alt="Tempo trace — 확정 요청 하나가 booking·Kafka·queue를 지나는 span 21개와 같은 trace_id의 queue 로그" loading="lazy">
    <figcaption><b>(trace · 확정→반환)</b> 대시보드는 합만 보여줘, 구간별은 앱에 넣은
    trace로 봅니다.<br>
    → 확정 요청 하나(<code>POST /api/bookings</code> 397ms · span 21 · 서비스 2): booking 안 Redis 호출
    <b>182ms</b> · Kafka 발행 <b>96ms</b> · queue 소비 <b>14ms</b>.<br>
    → 오른쪽: 같은 trace_id로 찾은 queue 로그 — "예매완료 수신 → active 제거".</figcaption>
  </figure>
</div>

## 생성기를 클라우드로

| 남은 문제 | 왜 데스크탑에선 못 푸나 | 클라우드로 옮기면 |
|---|---|---|
| **인원 상한 10,000** | WSL에 준 메모리가 여기서 참 — 위로는 VU를 더 못 만듦 | [**초기 목표**](/homelab/service/)에 도달하기 위해 10,000 다음 단계를 만들려면 상한이 **인스턴스 스펙**이 되어야 함 |
{:.hl-dec}

## 부하 테스트 — 클라우드

Terraform으로 띄운 인스턴스(8vCPU · 16GB)에서 같은 스크립트를 돌렸습니다 — 인원 10,000 · 정원 1,000.
30,000 부하를 준 결과는 아래 남은 것에 정리했습니다.

<div class="hl-sub" markdown="0">SLO 판정</div>

| SLO | 실측 | 판정 |
|---|---|---|
| 5xx 0건 | 사용자 경로 **0건** — 735,273 요청 · 10,000명 전원 완주 | 통과 |
| 입장 경로 1초 | enter p99 최대 **0.93초** | 통과 |
| 폴링 3초 | `position` **0.94초** · `events` **0.86초** · `board` **0.10초** — 전부 오픈 직후 피크 | 통과 |
| 정상 구간 0.5초 | 오픈 피크 뒤 폴링 셋 **0.02초 아래** | 통과 |
| 메모리 limit의 80% | booking 45% · traefik 40% · queue 35% | 통과 |
{:.hl-dec}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| **오픈 순간 booking 경로가 SLO 밖**<br>`/api/screenings` **4.80초**<br>`/api/screenings/board` **2.38초** | **코드가 컴파일되기 전에 부하 도착**<br>자바는 실행하면서 컴파일 — booking이 93분 유휴, 컴파일된 코드가 없는 상태<br>오픈에 1만 명이 오자 컴파일러가 CPU **111초** 점유 | **측정 절차에 웜업 단계 추가**<br>`/api/screenings` 4.80 → **0.94초**<br>`/api/screenings/board` 2.38 → **0.10초** |
| **웜업 뒤 queue 경로가 SLO 밖**<br>`/api/admission/position` **4.05초**<br>`/api/admission/events` **4.30초**<br>`/api/admission/enter` **2.49초** | **queue의 Redis 커넥션 풀이 파드당 10**<br>오픈에 동시 요청이 파드당 540 — 연결 10개를 기다림<br>대기 **24,158건 · 10,952초** | **풀 50**<br>대기 10,952 → **785초**<br>`position` 4.05 → **0.94초**<br>`events` 4.30 → **0.86초**<br>`enter` 2.49 → **0.93초** |
{:.hl-tbl}

## 한계

- **확인된 규모는 10,000명입니다** — [초기 목표](/homelab/service/)로 잡은 10만의 10분의 1입니다
- **30,000은 못 넘겼습니다** — 엣지 → traefik 연결이 10,000명 때의 **458**에서 **22,866**으로 늘었습니다. traefik 메모리가 limit의 **90%**에 닿고 노드 여유가 **2.3GB → 1.1GB**로 줄자, etcd 디스크 쓰기가 0.06초 → **4초**가 되며 k3s가 재시작했습니다
- **연결이 왜 그만큼 늘었는지는 규명하지 못했습니다** — 엣지가 방문자 연결을 대신 받는 구조인데, 30,000에서는 그렇게 되지 않았습니다
- **그 위를 재려면 스펙 상향이 먼저입니다** — traefik 메모리·CPU limit과 노드 RAM. 8GB × 3대가 이 노트북의 상한입니다

## 기술 스택

k6 · Terraform(부하 생성기) · Grafana · Mimir
{:.hl-more}

{% include hl-nav.html %}
