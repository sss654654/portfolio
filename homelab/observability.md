---
layout: page
title: 옵저버빌리티
description: >
  metric · log · trace를 수집기 하나로 모으는 LGTM 스택, dev · stg에 같은 차트로 배포 — 부하 판정 기준 서버 지표
permalink: /homelab/observability/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

metric · log · trace를 Alloy 하나로 수집하는 LGTM 스택.
dev · stg에 같은 차트로 배포, **부하 테스트 판정은 모두 이 서버 지표 기준**.
{:.lead}

## 옵저버빌리티 구조

<!-- 신호 셋이 각자 레인으로 나란히 흐르고 Alloy 기둥 하나가 셋을 관통하는 구조.
     원본 저장소 칸이 dev(MinIO) · stg(S3) 로 갈린다. 화살표 = 데이터 방향. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<svg viewBox="0 0 760 312" role="img" aria-label="metric·log·trace 세 레인이 나란히 흐르고, 노드마다 도는 Alloy 기둥 하나가 셋을 모아 Mimir·Loki·Tempo로 보낸다. 세 저장소의 원본은 dev에서 MinIO, stg에서 S3에 저장되고 Grafana가 셋을 읽는다">
  <defs>
    <marker id="hlo-n" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/></marker>
  </defs>

  <!-- 레인 1 — 지표 -->
  <rect class="hla-inner" x="24" y="40" width="120" height="56" rx="5"/>
  <text class="hla-t" x="38" y="64">metric</text>
  <text class="hla-s2" x="38" y="84">앱 · 미들웨어 · 노드</text>
  <line class="hla-ln" x1="144" y1="68" x2="234" y2="68" marker-end="url(#hlo-n)" fill="none"/>
  <text class="hla-a" x="189" y="60" text-anchor="middle">scrape 15초</text>
  <text class="hla-a" x="189" y="84" text-anchor="middle">피크는 5초</text>
  <line class="hla-ln" x1="336" y1="68" x2="414" y2="68" marker-end="url(#hlo-n)" fill="none"/>
  <rect class="hla-box" x="418" y="40" width="158" height="56" rx="5"/>
  <image href="/assets/img/icons/mimir.svg" x="432" y="51" width="20" height="20"/>
  <text class="hla-t" x="460" y="67">Mimir</text>
  <text class="hla-s" x="432" y="86">metric · 보존 15일</text>

  <!-- 레인 2 — 로그 -->
  <rect class="hla-inner" x="24" y="110" width="120" height="56" rx="5"/>
  <text class="hla-t" x="38" y="134">log</text>
  <text class="hla-s2" x="38" y="154">stdout · 이벤트</text>
  <line class="hla-ln" x1="144" y1="138" x2="234" y2="138" marker-end="url(#hlo-n)" fill="none"/>
  <text class="hla-a" x="189" y="130" text-anchor="middle">tail</text>
  <text class="hla-a" x="189" y="154" text-anchor="middle">발생 시 수집</text>
  <line class="hla-ln" x1="336" y1="138" x2="414" y2="138" marker-end="url(#hlo-n)" fill="none"/>
  <rect class="hla-box" x="418" y="110" width="158" height="56" rx="5"/>
  <image href="/assets/img/icons/loki.svg" x="432" y="121" width="20" height="20"/>
  <text class="hla-t" x="460" y="137">Loki</text>
  <text class="hla-s" x="432" y="156">log · 7일</text>

  <!-- 레인 3 — 트레이스 -->
  <rect class="hla-inner" x="24" y="180" width="120" height="56" rx="5"/>
  <text class="hla-t" x="38" y="204">trace</text>
  <text class="hla-s2" x="38" y="224">queue · booking</text>
  <line class="hla-ln" x1="144" y1="208" x2="234" y2="208" marker-end="url(#hlo-n)" fill="none"/>
  <text class="hla-a" x="189" y="200" text-anchor="middle">push — OTLP</text>
  <text class="hla-a" x="189" y="224" text-anchor="middle">앱이 전송</text>
  <line class="hla-ln" x1="336" y1="208" x2="414" y2="208" marker-end="url(#hlo-n)" fill="none"/>
  <rect class="hla-box" x="418" y="180" width="158" height="56" rx="5"/>
  <image href="/assets/img/icons/tempo.svg" x="432" y="191" width="20" height="20"/>
  <text class="hla-t" x="460" y="207">Tempo</text>
  <text class="hla-s" x="432" y="226">trace · 24시간</text>

  <!-- Alloy 기둥 — 세 레인을 관통 -->
  <rect class="hla-box" x="236" y="30" width="100" height="206" rx="6"/>
  <image href="/assets/img/icons/alloy.svg" x="275" y="42" width="22" height="22"/>
  <text class="hla-t" x="286" y="90" text-anchor="middle">Alloy</text>
  <text class="hla-s2" x="286" y="118" text-anchor="middle">노드마다 1개</text>
  <text class="hla-s2" x="286" y="136" text-anchor="middle">수집 대상 분담</text>

  <!-- 원본 — dev MinIO · stg S3 -->
  <line class="hla-ln" x1="497" y1="238" x2="497" y2="254" marker-end="url(#hlo-n)" fill="none"/>
  <text class="hla-a" x="507" y="251">원본 저장</text>
  <rect class="hla-box" x="418" y="258" width="200" height="44" rx="5"/>
  <image href="/assets/img/icons/minio.svg" x="432" y="266" width="18" height="18"/>
  <text class="hla-t" x="458" y="275">MinIO · S3</text>
  <text class="hla-s2" x="432" y="294">dev 파드 · stg IRSA</text>

  <!-- Grafana — 셋을 읽는 쪽 -->
  <line class="hla-ln" x1="576" y1="68" x2="630" y2="68" marker-end="url(#hlo-n)" fill="none"/>
  <line class="hla-ln" x1="576" y1="138" x2="630" y2="138" marker-end="url(#hlo-n)" fill="none"/>
  <line class="hla-ln" x1="576" y1="208" x2="630" y2="208" marker-end="url(#hlo-n)" fill="none"/>
  <rect class="hla-inner" x="634" y="30" width="102" height="206" rx="6"/>
  <image href="/assets/img/icons/grafana.svg" x="676" y="44" width="20" height="20"/>
  <text class="hla-t" x="685" y="90" text-anchor="middle">Grafana</text>
  <text class="hla-s" x="685" y="118" text-anchor="middle">3개 저장소 조회</text>
  <text class="hla-s2" x="685" y="162" text-anchor="middle">대시보드 — 코드</text>
  <text class="hla-s2" x="685" y="180" text-anchor="middle">dev · stg 공통 차트</text>
  <text class="hla-s2" x="685" y="216" text-anchor="middle">알림 — Discord</text>
</svg>
<figcaption>원본 저장소 — dev MinIO · stg S3. RDS · ElastiCache · ALB처럼 exporter를 붙일 수 없는 자원은 stg의 CloudWatch exporter가 수집해 같은 Mimir에 저장합니다.</figcaption>
</figure>

## 설계 결정

| 항목 | 선택 | 이유 |
|---|---|---|
| metric 저장소 | **Mimir distributed** — ingester 3대, 노드당 1 | ingester 중단 시 메모리의 최근 2시간 소실 — 자원상 **판정용 metric만** 분산 |
| log · trace | **Loki · Tempo 단일** | 조사용이라 공백이 판정에 영향 없음 · WAL로 재시작 복구, 노드 유실은 감수 |
| 원본 저장소 | **dev MinIO 파드 · stg S3(IRSA)** | 원본은 오브젝트 스토리지, 로컬은 WAL만 — stg는 파드가 IRSA로 버킷 권한 획득 |
| stg 스택 | **stg 안에 같은 차트로 별도 구성** — 집으로 전송하지 않음 | 집 Mimir 활성 시리즈가 상한의 91.8% — 수용 불가 · 같은 차트라 대시보드 재사용 |
| 부하 판정용 스크레이프 | **stg queue만 5초** | 오픈 피크가 15초 1주기 안에 끝나 표본 1개 — 5초 주기로 피크 구간 확인 |
| 알림 기준 | **대응 조치가 있고, 놓치면 복구 불가한 것만** · 클러스터 밖 감시는 Better Stack | 한 조건만 맞으면 대시보드 확인으로 충분 · 클러스터 안 알림은 클러스터 중단 시 동반 중단 |
{:.hl-dec}

## 대시보드와 알림

대시보드는 코드(cgv-infra `manifests/`)로 배포 — dev는 클러스터 · 호스트 · 앱, stg는 흐름(판정 · 층별 진단 · 노드) · queue · booking · 데이터. 상시 감시는 알림 담당.

<figure class="hl-shot" markdown="0">
  <img src="/assets/img/homelab/obs/host-phone.png" alt="충전선을 뽑은 순간 — 왼쪽 호스트 대시보드의 전원이 배터리(빨강)로 바뀌고 전력 행의 알림 상태 표시가 바뀌었으며, 오른쪽 폰 Discord에 발생 알림이 도착" loading="lazy">
  <figcaption>충전선 분리 검증 — 전원 상태 배터리(빨강) 전환, 알림 패널 상태 변경, 같은 시각 폰 Discord 알림 수신.</figcaption>
</figure>

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| 시리즈 상한 15만 도달 — 늦게 온 metric 거절, 화면엔 오류 없이 **값만 누락** | 표준 쿠버네티스는 `:6443` · `:10250`이 별도 프로세스라 둘 다 수집 — **k3s는 단일 프로세스**라 같은 metric 중복, 15만의 85% | `:6443` 수집 제거 · 상한 30만. 거절 **0** |
| 유휴 시 CPU 패키지 **92°C** — 예고 없는 전원 차단 이력, 온도 기록 없음 | 온도 · 전원은 물리 호스트 metric — VM 안에서 수집 경로 없음 | 호스트에 node-exporter 설치 후 변수별 조정 — 쿨러 · 덮개 · powersave로 **66°C**. 알림 임계 90°C 근거 |
| stg 2.5만 명 회차 입장 전파 **97.445%** — 브로커 유휴, 브로커 대기 1.852초 | 요청 96%가 폴링, 요청당 접근 로그 1줄 — Loki **초당 4,256줄** · 수집기가 노드당 0.5코어 · booking 노드 런큐 **3.30초/초**. 노드 부하 원인은 서비스가 아닌 수집기 | 성공 폴링 접근 로그 제외(4xx · 5xx 유지) → 100.000% · **741줄/초** · 런큐 **0.26** |
{:.hl-tbl}

## 결과

- **신호별 저장소** — metric Mimir 15일 · log Loki 7일 · trace Tempo 24시간
- **두 환경에 같은 차트 · 대시보드** — 부하 테스트 19회의 판정 · 진단 모두 stg Mimir 서버 지표 기준
- **알림은 Discord** — 현재 값 · 조치 · 패널 이미지 포함. 클러스터 전체 중단은 Better Stack이 외부에서 감지
- **관측 자체의 부하 실측** — 로그 비용은 디스크가 아닌 수집기 CPU, 같은 노드의 서비스 파드에 영향

## 한계

- **관측 스택 자체의 모니터링 화면 없음** — 구축 중 metric이 오류 없이 누락된 사례 있음
- **stg에 알림 규칙 미적용** — 테스트 중 수동 관찰
- **stg RDS · ElastiCache 지표는 CloudWatch 1분 해상도 · 지연** — 5만 명 회차 오픈 구간 판정에 미사용

## 기술 스택

Mimir · Loki · Tempo · Grafana · Alloy · MinIO · S3 · CloudWatch exporter · kube-state-metrics · node-exporter · Better Stack
{:.hl-more}

{% include hl-nav.html %}
