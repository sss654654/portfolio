---
layout: page
title: 옵저버빌리티
description: >
  관측 · dev 감시와 stg 부하 테스트 판정
permalink: /homelab/observability/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← HomeLab</a></p>

노드마다 Alloy가 metric · log · trace를 모아 Mimir · Loki · Tempo에 저장하고 Grafana로 조회.
dev(온프레미스) · stg(클라우드)에 **같은 차트로 각각 구성**.
dev는 클러스터 · 호스트 감시와 알림, stg는 부하 테스트 판정용 대시보드.
{:.lead}

## 옵저버빌리티 구조

<!-- 신호 셋이 각자 레인으로 나란히 흐르고 Alloy 기둥 하나가 셋을 관통하는 구조. 두 환경 공통.
     원본 저장소 칸이 dev(MinIO) · stg(S3) 로 갈린다. 대시보드 · 알림은 환경별 — 결과 절. 화살표 = 데이터 방향. -->
<figure class="hl-diagram hl-diagram-lg hl-diagram-scroll" markdown="0">
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
  <text class="hla-a" x="189" y="84" text-anchor="middle">stg queue 5초</text>
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
  <text class="hla-s2" x="685" y="180" text-anchor="middle">환경별로 구성</text>
  <text class="hla-s2" x="685" y="216" text-anchor="middle">dev 알림 — Discord</text>
</svg>
<figcaption>화살표 — 데이터 방향. exporter를 붙일 수 없는 RDS · ElastiCache · ALB는 stg의 CloudWatch exporter가 Mimir로 수집.</figcaption>
</figure>

## 설계 결정

| 항목 | 선택 | 이유 |
|---|---|---|
| metric 저장소 | **Mimir distributed** — ingester dev 3대 · stg 1대 | ingester 1대면 중단 시 최근 2시간 metric 소실 — dev는 분산 · stg는 테스트 기간 한정 환경이라 1대 |
| log · trace | **Loki · Tempo 단일** | 조사용이라 공백이 판정에 영향 없음 · WAL로 재시작 복구, 노드 유실은 감수 |
| 원본 저장소 | **dev MinIO 파드 · stg S3(IRSA)** | 원본은 오브젝트 스토리지 · 로컬은 WAL만 — stg는 IRSA로 키 없이 버킷 접근 |
| dev 알림 기준 | **조치할 수 있는 것만** Discord로 · 클러스터 밖 감시는 Better Stack | 물리 층은 재기동으로 회복 불가 · 앱 지연은 임계 근거가 없어 제외 · 클러스터 안 알림은 동반 중단 |
| stg 스택 | **stg 안에 같은 차트로 별도 구성** — 집으로 전송하지 않음 | 집 Mimir 활성 시리즈가 상한의 91.8% — stg 시리즈 수용 불가 |
| stg 판정 대시보드 | **4개 새로 구성** — 흐름 · queue · booking · 데이터 · queue만 5초 수집 | dev 대시보드는 Traefik · 파드 DB 전제라 stg에서 행 절반이 빔 · 오픈 피크가 15초 1주기 안에 끝남 |
{:.hl-dec}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| dev 시리즈 상한 15만 도달 — 오류 표시 없이 metric **값만 누락** | k3s는 `:6443` · `:10250`이 **한 프로세스** — 둘 다 수집하면 중복 metric이 상한 15만의 85% 차지 | `:6443` 수집 제거 · 상한 30만. 거절 **0** |
| dev 호스트 유휴 CPU **92°C** — 예고 없는 전원 차단 이력, 온도 기록 없음 | 온도 · 전원은 물리 호스트 metric — VM 안에서 수집 경로 없음 | 호스트 node-exporter · 쿨러 조정 → **66°C** · 알림 90°C |
| stg 2.5만 명 입장 반영 **97.445%** — 브로커 유휴 · 메시지 대기 1.852초 | 폴링(요청의 96%)마다 접근 로그 1줄 — Loki **초당 4,256줄** · 수집기 노드당 0.5코어 · booking 노드 런큐 **3.30초/초** | 성공 폴링 로그 제외 → 100.000% · 741줄/초 · 런큐 0.26 |
{:.hl-tbl}

## 결과

- **dev · stg에 같은 차트로 관측 스택 구축** — 수집 · 저장 · 대시보드 · 알림 규칙 전부 코드(cgv-infra)
- **dev — 클러스터 · 호스트 상태 확인** — 클러스터 대시보드로 노드 CPU · 메모리와 문제 파드 식별, 호스트(노트북 Proxmox)는 대시보드와 과열 · 전원 · 디스크 이상 Discord 알림

<figure class="hl-shot" markdown="0">
  <img src="/assets/img/homelab/obs/host-phone.png" alt="충전선을 뽑은 순간 — 왼쪽 호스트 대시보드의 전원이 배터리(빨강)로 바뀌고 전력 행의 알림 상태 표시가 바뀌었으며, 오른쪽 폰 Discord에 발생 알림이 도착" loading="lazy">
  <figcaption>dev 알림 시험 — 충전선 분리 시 호스트 대시보드 전원 상태가 배터리(빨강)로 전환, 같은 시각 폰에 Discord 알림 도착.</figcaption>
</figure>

- **stg — 앱 서비스 흐름 대시보드로 부하 테스트 판정** — 입구 → 대기열 → Kafka 전달 → 예매 순서로 막힌 곳 확인, 결과는 [부하 테스트](/homelab/capacity/)

## 한계

- **실 서비스(prd) 관측 경험 없음** — 대시보드는 dev 현 상태 확인 · stg 부하 테스트용까지 구축

## 기술 스택

Mimir · Loki · Tempo · Grafana · Alloy · MinIO · S3 · CloudWatch exporter · kube-state-metrics · node-exporter · Better Stack
{:.hl-more}

{% include hl-nav.html %}
