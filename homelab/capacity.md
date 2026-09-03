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
절반이 **지표가 없었습니다.** 계측을 앱에 심고 대시보드 세 장을 세웠습니다 —
행 순서는 지표 종류가 아니라 판정 순서입니다.

<!-- 슬라이드 — 각 장이 아래 부하테스트 표의 행 하나를 증거한다.
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
    <figcaption><b>(queue)</b> 폴링 셋(순번·실황·전체 현황)의 지연 p99를 앱 구간과 traefik 전 구간으로
    나눠 봅니다. 합격선 둘(입장 1초 — 순번 조회 · 정상 구간 0.5초)이 여기 걸리고 — 오픈 봉우리가
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
    얼마나 걸리는지(p99 · 패널 기준선 2초)와, 발행·소비가 초당 몇 건씩 쌍으로 맞는지를 봅니다.
    쌍이 어긋나면 어느 쪽이 못 따라가는 것입니다.</figcaption>
  </figure>
</div>

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

판의 규칙은 하나입니다. **선을 넘으면 원인을 찾아 값을 고치고, 같은 판을 다시 돌려
선 안을 확인합니다** — 값을 올릴 수 있는 상한은 노드 스펙(8GB · 4vCPU × 3대)입니다.

## 데스크탑 k6 부하테스트

부하는 k6가 실제 여정(입장 → 대기 → 좌석 → 확정) 그대로 만들고, 생성기는
데스크탑(WSL) — 상한 10,000명입니다(1만 VU에 약 4코어·4GB). 그 안에서 두 계단을
밟았습니다: **인원 계단 1,000 → 10,000**(정원 2 고정)은 인원이 정하는 앞단을,
**정원 계단 2 → 1,000**은 정원이 정하는 뒷단을 잽니다.

<div class="hl-sub" markdown="0">앞단 — 인원을 올려 잰다 (10,000명 부하)</div>

| 값 · 판 전 | 부하가 드러낸 것 | 왜 그런가 | 올린 값 | 올린 뒤 |
|---|---|---|---|---|
| traefik 메모리 · 2대 × 768Mi | 5,000명에서 파드별 워킹셋이 limit의 86% | 브라우저 연결이 사람 수만큼 traefik에 열려, 메모리가 인원을 따라감 | **3대 × 2Gi** | 파드별 40% |
| queue CPU · 500m | 10,000명에서 스로틀 83% · Redis 연결 포기 초당 59건 | CPU가 잘리는 동안 queue가 빌린 연결을 못 돌려줘, 뒤따라온 요청이 포기함 | **1코어** | 스로틀 0 · 포기 0 |
{:.hl-run}

<div class="hl-sub" markdown="0">뒷단 — 정원을 올려 잰다 (2 → 1,000)</div>

| 값 · 판 전 | 부하가 드러낸 것 | 왜 그런가 | 올린 값 | 올린 뒤 |
|---|---|---|---|---|
| booking 메모리 · 1Gi | OOMKill 2회 | 힙 768Mi 밖에서 JVM이 비힙 222Mi를 더 써, 합 990Mi가 limit 1Gi에 닿음 | **1,536Mi · 힙 768Mi 고정** | 워킹셋 47% |
| booking CPU · 1코어 | 정원 500 판에서 스로틀 99.7% | Kafka를 읽는 소비 스레드 넷이 코어 하나에 몰림 | **2코어** | 스로틀 32% |
| DB 커넥션 풀 · 10 | 풀 대기 397건 | 풀이 좁아 대기가 쌓임 — 같은 시각 MySQL CPU는 12%로, 병목은 DB가 아니라 풀 | **30** | 대기 0 |
| 승격 · 100명 / 2초 | 정원 1,000의 오픈 직후, 입장 인증 지연 4.97초 | 100명이 한 묶음으로 도착해 booking의 인증 소비가 밀림 | **25명 / 0.5초** | 0.99초 (초당 상한은 그대로) |
| 정원 · 2 | 500까지 올려도 booking·MySQL이 한도의 절반 아래로 논다 | 뒷단이 노는 만큼 더 들여보낼 여유가 있음 — 대기 시간은 정원 ÷ 체류에 반비례해 줄어듦 | **1,000** | 좌석 4,000 매진 440초 · 마지막 구매자 대기 3분 7초 |
{:.hl-run}

집 구간의 마지막 판은 선 안에서 끝났습니다 — 5xx 0건 · queue 스로틀 0 · DB 풀 대기 0 ·
입장 인증 등록 p99 0.99초(1초 초과 0명 / 전수 2,054건).

## 집의 한계 — 생성기를 클라우드로

집에서 남은 문제가 둘이었습니다.

- **연결 실패 1.27%가 열 판 내내 안 내려갔습니다** — 서버 · OPNsense · Cloudflare 정책 ·
  k6 자원은 전부 무죄. 남은 용의자(집 공유기 · 엣지)는 둘 다 들여다볼 화면이 없어,
  밖에서 쏴야만 갈립니다
- **10,000명이 장비 상한입니다** — 30,000명을 재려면 생성기 자체가 커야 합니다

둘의 답이 같았습니다 — **부하 생성기를 클라우드에 두는 것.** 서비스는 격리와 공개
작업으로 이미 인터넷에 열려 있어, 옮기면 실사용자와 같은 경로에서 쏘게 됩니다.
Terraform으로 인스턴스 하나(8vCPU · 16GB)를 띄우고, 같은 스크립트로 같은 판을 돌립니다.

## 클라우드에서

Terraform으로 띄운 인스턴스(8vCPU · 16GB)에서 같은 스크립트를 쐈습니다 — 인원 10,000 ·
정원 1,000 · 좌석 4,000. 연결 수립 시간이 전부 0ms로 내려가면서(집에서는 평균 수십 ms ·
실패 1.27%) **연결 실패의 범인이 집 공유기로 확정**됐고, 판은 이렇게 끝났습니다.

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
연결은 최대 458개, 메모리는 파드 최대 23%(473MiB) — 집 경로에서는 연결이 사람 수만큼
(10,013개) 열려 메모리가 파드당 40%였습니다. 요청의 37%(28만 건)는 좌석 현황판 캐시로
엣지가 응답해 origin에 오지도 않았습니다.

선 밖으로 남은 것은 하나 — 오픈 순간의 승격→인증 지연입니다.

## 쓴 것

k6 · Terraform(부하 생성기) · Grafana · Mimir
{:.hl-more}

자원이 큰 클러스터로 갈 때, 이 값들이 출발점입니다.
{:.hl-more}

{% include hl-nav.html %}
