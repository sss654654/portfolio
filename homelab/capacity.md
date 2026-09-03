---
layout: page
title: 부하테스트
description: >
  합격선을 먼저 정하고, 공개된 경로에서 부하를 걸어 정원·자원 스펙을 실측으로 확정했습니다
permalink: /homelab/capacity/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

앱 저장소(`cgv-onprem`)의 MR을 머지하면 클러스터에 파드로 자동 배포됩니다 — 다만 그 파드에
적어 둔 정원·커넥션 풀·메모리 상한은 **재 보지 않은 값이었습니다.**

## 앱 대시보드

부하 전에 보는 화면부터 — 막힐 거라 예상한 자리(파드 자원·커넥션 풀·Redis·MySQL·좌석 재고)
절반이 **지표가 없었습니다.** 계측을 앱에 심었고, queue · booking · Redis/Kafka
대시보드 세 장을 세웠습니다 — 행 순서는 지표 종류가 아니라 판정 순서입니다.

## 합격선(SLO)

| 무엇 | 합격선 | 왜 이 값 | 어디서 재나 |
|---|---|---|---|
| 5xx | **0건** | 대기열은 기다리게 하는 서비스지, 실패시키는 서비스가 아님 | traefik과 앱, 양쪽에서 |
| 입장 경로 p99 | **1초** | 멈추면 눌린 건지 몰라 다시 누름 — 그 재시도가 부하로 더해짐 | queue — enter·순번 조회 지연 (오픈 순간 몰림이 봉우리) |
| 현황판 p99 | **3초** | 프론트 폴링이 3초 주기 — 그보다 늦으면 다음 폴이 먼저 옴 | booking — 현황판 응답 지연 (오픈 순간 전원이 3초마다 부름) |
| 정상 구간 p99 | **0.5초** | 체감선이 아니라 회귀선 — 평시가 이전 판보다 나빠졌나 | 같은 지연 지표들 — 오픈 몰림을 지난 시간대만 |
| 메모리 | **limit의 80%** | 수집이 15초 간격 — 그 사이에 튄 봉우리는 지표에 안 찍히니, 찍힌 값에 20% 여유를 둠 | 각 대시보드의 메모리 패널 (working_set / limit) |
| CPU | 합격선 없음 | 차면 죽는 게 아니라 느려질 뿐 — 느려짐은 위의 지연 선이 잡음 | 각 대시보드의 CPU·스로틀 패널 — 판정이 아니라 진단용 |
{:.hl-dec.hl-slo}

## 데스크탑 부하테스트

- **한도가 먼저 있습니다** — 파드 스펙은 노드 스펙(8GB · 4vCPU × 3대) 안에서만 올릴 수 있고, 생성기(데스크탑 WSL)는 10,000명이 상한입니다(1만 VU에 약 4코어·4GB)
- **부하는 k6가 실제 여정 그대로 만듭니다** — 입장 → 대기 → 좌석 → 확정
- **올리는 축은 둘입니다**
  - **인원 1,000 → 10,000** (정원 2 고정) — k6가 여정을 도는 사람 수. 앞단(traefik · queue · Redis)이 여기 반응합니다
  - **정원 2 → 1,000** — 좌석 화면에 동시에 들여보내는 인원. `MAX_SESSIONS` 설정값을 바꿔 올리며, 뒷단(booking · MySQL)이 여기 반응합니다

확정 스펙으로 같은 10,000명 판을 다시 돌린 화면입니다 — 행마다 **판 전 값 → 바꾼 값 →
이 판의 실측**을 적고, 그 아래에 그때 부하가 드러낸 것을 한 줄로 남깁니다.

<div class="hl-sub" markdown="0">queue(traefik) 대시보드</div>

<div class="hl-shots" markdown="0" aria-label="queue 대시보드 — 화살표로 넘겨 봅니다">
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/q-traefik.png" alt="queue 대시보드 행1 — traefik 메모리·CPU·연결과 고루틴">
    <figcaption><b>(행1 · traefik)</b> 2대 × 768Mi → <b>3대 × 2Gi</b> — 이 판: 연결 최대 327 ·
    메모리 파드 최대 12% · 스로틀 0.<br>
    엣지를 붙이기 전(직결)엔 연결이 사람 수만큼 열려 5,000명에 워킹셋이 limit의 86% —
    메모리가 인원을 따라갔습니다. 지금은 그 연결을 엣지가 받습니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/q-queue.png" alt="queue 대시보드 행2 — queue 메모리·CPU·스로틀" loading="lazy">
    <figcaption><b>(행2 · queue)</b> CPU 500m → <b>1코어</b> — 이 판: 스로틀 0 · CPU 최대 28% ·
    메모리 14%.<br>
    500m에선 10,000명에서 스로틀 83% · Redis 연결 포기 초당 59건 — CPU가 잘리는 동안
    빌린 연결을 못 돌려줘, 뒤따라온 요청이 포기했습니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/q-latency.png" alt="queue 대시보드 행3 — 폴링 셋 지연 p99와 5xx" loading="lazy">
    <figcaption><b>(행3 · 지연)</b> 판정 행 — 이 판: 순번 조회 p99 0.04초 · enter 0.34초 ·
    5xx 0건. 합격선(입장 1초 · 정상 구간 0.5초) 안입니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/q-flow.png" alt="queue 대시보드 행4 — 정원의 입출: 입장·회수·반환" loading="lazy">
    <figcaption><b>(행4 · 정원의 입출)</b> 정원 2 → <b>1,000</b> — 이 판: 좌석 4,000 매진,
    입장 = 예매 완료 + 회수가 맞아떨어집니다.<br>
    정원 2로는 뒷단이 놀아 잴 수 없었고(뒷단 부하 = 확정/초 = 정원 ÷ 체류), 500에서도
    자원이 절반 아래라 1,000으로 — 마지막 구매자 대기가 7분 17초 → 3분 7초로 줄었습니다.</figcaption>
  </figure>
</div>

<div class="hl-sub" markdown="0">booking 대시보드</div>

<div class="hl-shots" markdown="0" aria-label="booking 대시보드 — 화살표로 넘겨 봅니다">
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/b-pod.png" alt="booking 대시보드 행1 — 메모리·CPU·힙">
    <figcaption><b>(행1 · booking 파드)</b> 메모리 1Gi → <b>1,536Mi</b>(힙 768Mi 고정) ·
    CPU 1 → <b>2코어</b> — 이 판: 워킹셋 55% · 스로틀 0.<br>
    1Gi에선 힙+비힙 990Mi가 limit에 닿아 OOMKill 2회, 1코어에선 Kafka 소비 스레드 넷이
    몰려 스로틀 99.7%였습니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/b-mysql.png" alt="booking 대시보드 행2 — 커넥션 풀과 MySQL" loading="lazy">
    <figcaption><b>(행2 · 풀과 MySQL)</b> 풀 10 → <b>30</b> — 이 판: 사용 최대 3 · 대기 0 ·
    MySQL CPU 20%.<br>
    풀 10에선 대기 397건 — 같은 시각 MySQL은 12% 유휴. 병목은 DB가 아니라 풀이었습니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/b-journey.png" alt="booking 대시보드 행3 — 여정 단계별 통과와 지연" loading="lazy">
    <figcaption><b>(행3 · 여정)</b> 판정 행 — 이 판: 10,000명 전원 완주 · 5xx 0 ·
    단계별 p99 전부 선 안입니다.</figcaption>
  </figure>
</div>

<div class="hl-sub" markdown="0">Redis · Kafka 대시보드</div>

<div class="hl-shots" markdown="0" aria-label="Redis·Kafka 대시보드 — 화살표로 넘겨 봅니다">
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/rk-redis.png" alt="Redis·Kafka 대시보드 행1 — Redis master CPU와 명령별 호출">
    <figcaption><b>(행1 · Redis)</b> 판정 행 — 이 판: master 32%. 명령 처리가 단일 스레드라
    분모는 limit이 아니라 1코어이고, 선(80%) 안입니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/rk-kafka.png" alt="Redis·Kafka 대시보드 행2 — 승격→인증·확정→반환 전달 지연" loading="lazy">
    <figcaption><b>(행2 · 전달)</b> 승격 100명/2초 → <b>25명/0.5초</b>(초당 상한 50은 그대로) —
    이 판: 승격→인증 p99 최대 0.94초(기준선 2초 안) · 확정→반환 0.1초.<br>
    100명 묶음 시절엔 정원 1,000의 오픈 직후 인증 지연이 4.97초 — 한 묶음이 한꺼번에
    도착해 booking의 소비가 밀린 것입니다.</figcaption>
  </figure>
</div>

## 데스크탑의 한계 — 생성기를 클라우드로

남은 문제가 둘이었습니다.

- **연결 실패 1.27%가 열 판 내내 안 내려갔습니다** — 서버 · OPNsense · Cloudflare 정책 ·
  k6 자원은 전부 무죄. 남은 용의자(공유기 · 엣지)는 둘 다 들여다볼 화면이 없어,
  밖에서 쏴야만 갈립니다
- **10,000명이 장비 상한입니다** — 30,000명을 재려면 생성기 자체가 커야 합니다

둘의 답이 같았습니다 — **부하 생성기를 클라우드에 두는 것.** 서비스는 격리와 공개
작업으로 이미 인터넷에 열려 있어, 옮기면 실사용자와 같은 경로에서 쏘게 됩니다.

## 클라우드 부하테스트

Terraform으로 띄운 인스턴스(8vCPU · 16GB)에서 같은 스크립트를 쐈습니다 — 인원 10,000 ·
정원 1,000 · 좌석 4,000. 판정부터:

| 합격선 | 실측 | 판정 |
|---|---|---|
| 5xx 0건 | traefik · queue · booking 모두 0건 — 764,496 요청 · 10,000명 전원 여정 완주 | 통과 |
| 입장 경로 1초 | enter p99 최대 0.82초 · 순번 조회 p99 최대 0.93초 (오픈 봉우리 포함) | 통과 |
| 정상 구간 0.5초 | 전 구간 중앙값 35ms · p95 0.23초 | 통과 |
| 메모리 limit의 80% | booking 54% · traefik 23% · queue 20% | 통과 |
| 전달 기준선 2초 | 승격→인증이 오픈 순간 p99 9.3초(순간 최대 19.7초) — 3분 뒤 0.1초대 | 오픈 구간만 초과 |
{:.hl-dec}

좌석은 오픈부터 약 7분 30초에 3,987석이 팔려 소진됐습니다. k6가 보고한 실패율 1.12%의
내용은 5xx가 아닙니다 — 403(입장 인증 대기 중 재시도) 1,995건 · 409(좌석 선점 충돌)
2,863건, 여정이 재시도로 흡수하는 정상 절차를 도구가 실패로 센 것입니다.

**엣지가 연결을 받는 것도 실측됐습니다.** 10,000명이 접속했는데 traefik의 클라이언트
연결은 최대 458개, 메모리는 파드 최대 23%(473MiB) — 엣지를 붙이기 전(직결 경로)에는
연결이 사람 수만큼(10,013개) 열려 메모리가 파드당 40%였습니다. 요청의 37%(28만 건)는
좌석 현황판 캐시로 엣지가 응답해 origin에 오지도 않았습니다.

**생성기 자리만 다른 같은 판을 데스크탑에서 한 번 더 돌려 나란히 놓았습니다** —
그 회선이 잰 값을 어떻게 바꾸는지가 그대로 드러납니다.

| | 데스크탑 | 클라우드 |
|---|---|---|
| 연결 수립 (blocked · connecting · tls 평균) | 55 · 24 · 31ms — 최대 12.8초 | 전부 0ms |
| 응답 대기 중앙값 | 270ms | 34ms |
| 서버에 닿은 초당 요청 | 804 | 1,061 |
| 실패의 내용 | request timeout · 엣지가 연결을 끊음 (0.53%) | 서버가 답한 403·409뿐 (1.12%) |
{:.hl-two}

데스크탑에서 쏘면 10,000명분 연결이 공유기 하나를 지나며 눌립니다 — 연결 실패의 범인(공유기)과
**서버에 닿는 부하가 24% 깎이는 것**이 이 대조로 확정됐습니다. 실사용자는 각자의
회선에서 오므로, 실물에 가까운 값은 클라우드 쪽입니다.

선 밖으로 남은 것은 하나 — 오픈 순간의 승격→인증 지연입니다.

## 쓴 것

k6 · Terraform(부하 생성기) · Grafana · Mimir
{:.hl-more}

자원이 큰 클러스터로 갈 때, 이 값들이 출발점입니다.
{:.hl-more}

{% include hl-nav.html %}
