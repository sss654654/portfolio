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

## 합격선(SLO)

| 무엇 | 합격선 | 왜 이 값 | 어디서 재나 |
|---|---|---|---|
| 5xx | **0건** | 대기열은 기다리게 하는 서비스지, 실패시키는 서비스가 아님 | traefik과 앱 양쪽 — 프록시가 만든 5xx는 앱 지표에 미기록 |
| 입장 경로 p99 | **1초** | 멈추면 눌린 건지 몰라 다시 누름 — 그 재시도가 그대로 추가 부하 | queue — enter 지연 (오픈 순간 몰림이 봉우리) |
| 폴링 p99 | **3초** | 프론트 폴링이 3초 주기 — 그보다 늦으면 다음 폴이 먼저 도착 | queue(순번·실황) · booking(좌석 현황판) — 폴링 응답 지연 |
| 정상 구간 p99 | **0.5초** | 체감선이 아니라 회귀를 잡는 선 — 평시가 이전 판보다 나빠졌나 | 같은 지연 지표들 — 오픈 몰림을 지난 시간대만 |
| 메모리 | **limit의 80%** | 수집이 15초 간격 — 그 사이에 튄 봉우리는 지표에 안 찍히니, 찍힌 값에 20% 여유를 둠 | 각 대시보드의 메모리 패널 (working_set / limit) |
| CPU | 합격선 없음 | 차면 죽는 게 아니라 느려질 뿐 — 느려짐은 위의 지연 선이 판정 | 각 대시보드의 CPU·스로틀 패널 — 판정이 아니라 진단용 |
{:.hl-dec.hl-slo}

## 부하테스트(데스크탑)

- **한도가 먼저 있습니다** — 노드 스펙(8GB · 4vCPU × 3대)에 따른 파드 스펙 제한, 데스크탑(WSL) 메모리에 따른 생성기 상한 10,000명
- **부하는 k6가 실제 여정 그대로 만듭니다** — 입장 → 대기 → 좌석 → 확정
- **점진 부하** — 인원과 정원을 계단으로 올립니다
  - **인원 1,000 → 10,000** · **정원**(`MAX_SESSIONS` — queue가 동시에 입장시키는 인원) **2 → 1,000**

<div class="hl-sub" markdown="0">queue(traefik) 대시보드</div>

<div class="hl-shots" markdown="0" aria-label="queue 대시보드 — 화살표로 넘겨 봅니다">
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/1.png" alt="queue 대시보드 행1 — traefik 메모리·CPU·연결과 고루틴">
    <figcaption><b>(행1 · traefik)</b> CF 공개 이전에는 연결이 사람 수만큼 열려
    <b>메모리가 인원을 따라 올랐습니다</b>(CPU 스로틀은 없음).<br>
    → 메모리: 2대 × 768Mi → <b>3대 × 2Gi</b> · 공개 때 앞에 선 <b>엣지가 방문자 연결을
    대신 받게</b> 됐습니다.<br>
    → 이 판: <b>메모리 파드 최대 12%</b> · <b>연결 최대 327</b> —
    대다수의 연결이 엣지에서 끝납니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/2.png" alt="queue 대시보드 행2 — queue 메모리·CPU·스로틀" loading="lazy">
    <figcaption><b>(행2 · queue)</b> queue에는 <b>사람당 폴링 요청</b>이 옵니다 —
    10,000명에서 CPU 몫을 다 써 <b>스로틀 83%</b>.<br>
    → CPU: 500m → <b>1코어</b>.<br>
    → 이 판: <b>스로틀 0</b> · CPU 최대 28% · 메모리·고루틴은 인원과 무관하게 평평합니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/3.png" alt="queue 대시보드 행3 — 폴링 셋 지연 p99와 5xx" loading="lazy">
    <figcaption><b>(행3 · 폴링)</b> 홈 화면(좌석 현황판 · 실황)과 대기 화면(순번)의 폴링
    지연입니다 — 합격선은 <b>폴링 3초</b>(프론트 주기)와 <b>정상 구간 0.5초</b>.<br>
    → 이 판: 순번 0.04초 · 실황 0.04초 · 좌석 현황판 0.02초 · <b>5xx 0건</b> — 전부 선 안입니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/4.png" alt="queue 대시보드 행4 — enter 호출 수와 지연" loading="lazy">
    <figcaption><b>(행4 · enter)</b> "예매하기"를 누른 사람 수와 그 응답 지연입니다 —
    <b>입장 경로 합격선 1초</b>가 여기 걸립니다.<br>
    → 이 판: p99 최대 0.34초 — 오픈 몰림 봉우리를 포함해 선 안입니다.</figcaption>
  </figure>
</div>

<div class="hl-sub" markdown="0">booking 대시보드</div>

<div class="hl-shots" markdown="0" aria-label="booking 대시보드 — 화살표로 넘겨 봅니다">
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/6.png" alt="booking 대시보드 행1 — 메모리·CPU·힙">
    <figcaption><b>(행1 · booking 파드)</b> 힙 768Mi에 비힙 222Mi가 더해져 limit 1Gi에
    닿아 <b>OOMKill 2회</b>, Kafka 소비 스레드 넷이 한 코어에 몰려 <b>스로틀 99.7%</b>.<br>
    → 메모리: 1Gi → <b>1,536Mi</b>(힙 768Mi 고정) · CPU: 1코어 → <b>2코어</b>.<br>
    → 이 판: 메모리 55% · <b>스로틀 0</b>.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/7.png" alt="booking 대시보드 행2 — 커넥션 풀과 MySQL" loading="lazy">
    <figcaption><b>(행2 · 커넥션 풀 · MySQL)</b> 풀 대기가 <b>397건</b>인데 같은 시각
    MySQL CPU는 12% — 병목은 DB가 아니라 <b>풀 10</b>이었습니다.<br>
    → 풀: 10 → <b>30</b>.<br>
    → 이 판: 사용 최대 3 · <b>대기 0</b> · MySQL CPU 20%.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/8.png" alt="booking 대시보드 행3 — 여정 단계별 통과와 지연" loading="lazy">
    <figcaption><b>(행3 · 여정)</b> 입장한 사람이 회차 → 좌석 → 선점 → 확정을 지나는
    단계별 통과 수와 지연입니다 — 어디서 떨어지는지가 여기서 보입니다.<br>
    → 이 판: <b>10,000명 전원 완주</b> · 5xx 0 · 단계별 p99 최대 0.25초, 전부 선 안입니다.</figcaption>
  </figure>
</div>

<div class="hl-sub" markdown="0">Redis · Kafka 대시보드</div>

<div class="hl-shots" markdown="0" aria-label="Redis·Kafka 대시보드 — 화살표로 넘겨 봅니다">
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/9.png" alt="Redis·Kafka 대시보드 행1 — Redis master CPU와 명령별 호출">
    <figcaption><b>(행1 · Redis)</b> 읽기·쓰기가 <b>master 한 대</b>로 가고, 명령 처리가
    <b>단일 스레드</b>라 코어를 더 줘도 하나만 씁니다 — CPU의 분모는 limit이 아니라
    <b>1코어</b>입니다.<br>
    → 이 판: master <b>32%</b> · 명령 초당 호출은 오픈 봉우리에서만 증가 · 메모리 여유 —
    전부 선 안입니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cap/10.png" alt="Redis·Kafka 대시보드 행2 — 승격→인증·확정→반환 전달 지연" loading="lazy">
    <figcaption><b>(행2 · 전달)</b> 두 서비스는 Kafka로만 잇습니다 — 승격→인증(queue → booking) ·
    확정→반환(booking → queue)의 전달 지연을 봅니다. 승격이 <b>100명 묶음</b>으로 나가면
    묶음 맨 뒤는 앞 99명을 기다려, 오픈 직후 인증 지연이 <b>4.97초</b>였습니다.<br>
    → 승격: 100명/2초 → <b>25명/0.5초</b> — 초당 상한(50명)은 그대로, 묶음만 4분의 1.<br>
    → 이 판: 승격→인증 p99 최대 <b>0.94초</b>(기준선 2초 안) · 확정→반환 0.1초.</figcaption>
  </figure>
</div>

## 데스크탑의 한계 — 생성기를 클라우드로

| 남은 문제 | 왜 데스크탑에선 못 푸나 | 클라우드로 옮기면 |
|---|---|---|
| **인원 상한 10,000** | 1만 VU가 약 4코어 · 4GB를 써 WSL 메모리가 참 — 이 장비는 10,000이 끝 | [**초기 목표**](/homelab/service/)에 도달하기 위해 10,000 다음 단계를 만들려면 상한이 **인스턴스 스펙**이 되어야 함 |
{:.hl-dec}

## 부하테스트(클라우드)

Terraform으로 띄운 인스턴스(8vCPU · 16GB)에서 같은 스크립트를 쐈습니다 — 인원 10,000 · 정원 1,000.
30,000 부하를 준 결과는 트러블슈팅에 정리했습니다.

| 합격선 | 실측 | 판정 |
|---|---|---|
| 5xx 0건 | queue · booking **0건** — 735,273 요청 · 10,000명 전원 완주 | 통과 |
| 입장 경로 1초 | enter p99 최대 **0.93초** | 통과 |
| 폴링 3초 | 순번 0.94초 · 실황 0.86초 · 좌석 현황판 2.25초 — 전부 오픈 직후 봉우리 | 통과 |
| 정상 구간 0.5초 | 오픈 봉우리 뒤 폴링 셋 **0.02초 아래** | 통과 |
| 메모리 limit의 80% | booking 45% · traefik 40% · queue 35% | 통과 |
{:.hl-dec}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| **오픈 순간 지연이 첫 판에서만 10–20초** | **코드가 컴파일되기 전에 부하가 옴**<br>자바는 실행하면서 컴파일하는데, booking이 93분 놀아 아직 컴파일 전<br>오픈에 1만 명이 오자 컴파일이 CPU **111초**를 먹어 요청 처리는 그만큼 지연 | **측정 절차에 웜업 판 추가**<br>웜업 스크립트 실행 뒤 회차 0.94초 · 현황판 0.1초 |
| **데워진 판에서 폴링 셋이 선 밖** | **queue Redis 풀 파드당 10**<br>오픈에 파드당 동시 요청 540 → 연결 10개 대기<br>대기 **24,158건 · 10,952초** | **풀 50**<br>대기 10,952초 → **785초**<br>순번 0.94 · 실황 0.86 · enter 0.93초 |
| **30,000에서 k3s 컨트롤플레인 정지** | **연결이 메모리를 넘어섬**<br>30,000명을 넣자 엣지 → traefik 연결이 **458 → 22,866**<br>그 연결이 traefik 메모리를 limit의 **90%**, CPU를 **스로틀 30%**까지, 노드 메모리를 **바닥**까지<br>메모리가 마르자 **k3s 재시작** | **10,000 이상은 traefik 스펙 상향이 필요**<br>traefik 메모리 · CPU limit과 노드 RAM(8GB × 3대) 상향<br>또는 동시 요청 상한(`inFlightReq`)으로 연결 자체를 차단 — 초과분은 429 |
{:.hl-tbl}

## 쓴 것

k6 · Terraform(부하 생성기) · Grafana · Mimir
{:.hl-more}

자원이 큰 클러스터로 갈 때, 이 값들이 출발점입니다.
{:.hl-more}

{% include hl-nav.html %}
