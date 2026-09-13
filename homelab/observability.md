---
layout: page
title: 옵저버빌리티
description: >
  metric · log · trace를 수집기 하나로 모으는 LGTM 스택을 dev와 stg에 같은 차트로 두었습니다 — 부하 판정은 전부 여기서 나온 서버 지표입니다
permalink: /homelab/observability/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

클러스터도 배포 경로도 갖춰졌지만, **안에서 무슨 일이 벌어지는지 볼 방법이 없었습니다.**
같은 차트가 dev와 stg에 있고, 부하 테스트의 판정은 전부 여기서 나온 서버 지표입니다.
{:.lead}

## 옵저버빌리티 구조

세 신호를 **Alloy**가 모읍니다 — 노드마다 하나씩 돌며 대상을 나눠 가집니다.

<!-- 신호 셋이 각자 레인으로 나란히 흐르고 Alloy 기둥 하나가 셋을 관통하는 구조.
     원본 저장소 칸이 dev(MinIO) · stg(S3) 로 갈린다. 화살표 = 데이터 방향. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<svg viewBox="0 0 760 312" role="img" aria-label="metric·log·trace 세 레인이 나란히 흐르고, 노드마다 도는 Alloy 기둥 하나가 셋을 모아 Mimir·Loki·Tempo로 밀어낸다. 세 저장소의 원본은 dev에서 MinIO, stg에서 S3에 앉고 Grafana가 셋을 읽는다">
  <defs>
    <marker id="hlo-n" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/></marker>
  </defs>

  <!-- 레인 1 — 지표 -->
  <rect class="hla-inner" x="24" y="40" width="120" height="56" rx="5"/>
  <text class="hla-t" x="38" y="64">metric</text>
  <text class="hla-s2" x="38" y="84">앱 · 미들웨어 · 노드</text>
  <line class="hla-ln" x1="144" y1="68" x2="234" y2="68" marker-end="url(#hlo-n)" fill="none"/>
  <text class="hla-a" x="189" y="60" text-anchor="middle">scrape 15초</text>
  <text class="hla-a" x="189" y="84" text-anchor="middle">봉우리는 5초</text>
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
  <text class="hla-a" x="189" y="154" text-anchor="middle">생기는 대로</text>
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
  <text class="hla-a" x="189" y="224" text-anchor="middle">앱이 보냄</text>
  <line class="hla-ln" x1="336" y1="208" x2="414" y2="208" marker-end="url(#hlo-n)" fill="none"/>
  <rect class="hla-box" x="418" y="180" width="158" height="56" rx="5"/>
  <image href="/assets/img/icons/tempo.svg" x="432" y="191" width="20" height="20"/>
  <text class="hla-t" x="460" y="207">Tempo</text>
  <text class="hla-s" x="432" y="226">trace · 24시간</text>

  <!-- Alloy 기둥 — 세 레인을 관통 -->
  <rect class="hla-box" x="236" y="30" width="100" height="206" rx="6"/>
  <image href="/assets/img/icons/alloy.svg" x="275" y="42" width="22" height="22"/>
  <text class="hla-t" x="286" y="90" text-anchor="middle">Alloy</text>
  <text class="hla-s2" x="286" y="118" text-anchor="middle">노드마다 하나</text>
  <text class="hla-s2" x="286" y="136" text-anchor="middle">대상을 나눠 맡음</text>

  <!-- 원본 — dev MinIO · stg S3 -->
  <line class="hla-ln" x1="497" y1="238" x2="497" y2="254" marker-end="url(#hlo-n)" fill="none"/>
  <text class="hla-a" x="507" y="251">원본 저장</text>
  <rect class="hla-box" x="418" y="258" width="200" height="44" rx="5"/>
  <image href="/assets/img/icons/minio.svg" x="432" y="266" width="18" height="18"/>
  <text class="hla-t" x="458" y="275">MinIO · S3</text>
  <text class="hla-s2" x="432" y="294">dev 는 파드 · stg 는 IRSA</text>

  <!-- Grafana — 셋을 읽는 쪽 -->
  <line class="hla-ln" x1="576" y1="68" x2="630" y2="68" marker-end="url(#hlo-n)" fill="none"/>
  <line class="hla-ln" x1="576" y1="138" x2="630" y2="138" marker-end="url(#hlo-n)" fill="none"/>
  <line class="hla-ln" x1="576" y1="208" x2="630" y2="208" marker-end="url(#hlo-n)" fill="none"/>
  <rect class="hla-inner" x="634" y="30" width="102" height="206" rx="6"/>
  <image href="/assets/img/icons/grafana.svg" x="676" y="44" width="20" height="20"/>
  <text class="hla-t" x="685" y="90" text-anchor="middle">Grafana</text>
  <text class="hla-s" x="685" y="118" text-anchor="middle">셋을 읽음</text>
  <text class="hla-s2" x="685" y="162" text-anchor="middle">대시보드 — 코드로</text>
  <text class="hla-s2" x="685" y="180" text-anchor="middle">dev 5장 · stg 4장</text>
  <text class="hla-s2" x="685" y="216" text-anchor="middle">알림 — Discord</text>
</svg>
<figcaption>원본은 dev가 MinIO, stg가 S3입니다. RDS · ElastiCache · ALB처럼 exporter를 옆에 붙일 수 없는 것은
stg에서 CloudWatch exporter가 읽어 같은 Mimir에 넣습니다.</figcaption>
</figure>

## 설계 결정

| 항목 | 선택 | 이유 |
|---|---|---|
| metric 저장소 | **Mimir distributed** — ingester만 3대, 노드당 1 | ingester가 죽으면 메모리의 최근 2시간 소실 — 세 저장소를 다 분산할 자원은 없어 **판정에 쓰는 metric만** |
| log · trace | **Loki · Tempo는 단일** | 소실 범위는 같아도 조사 도구라 비어도 판정에 무영향 · WAL로 재시작만 복구, 노드째 유실은 감수 |
| 원본 저장소 | **dev는 MinIO 파드 · stg는 S3(IRSA)** | 원본은 전부 오브젝트 스토리지, 로컬은 WAL만 — stg에서는 MinIO 자리가 S3로 넘어가고 파드가 IRSA로 버킷 권한을 받음 |
| stg의 스택 | **stg 안에 같은 차트로 따로** — 집으로 보내지 않음 | 집 Mimir가 활성 시리즈 상한의 91.8% — stg를 받을 자리가 없음 · 같은 차트라 대시보드를 그대로 씀 |
| 부하 판정용 스크레이프 | **stg queue만 5초** | 오픈 봉우리가 15초 한 주기 안에 끝나 표본이 하나 — 5초로 봉우리 안이 보임 |
| 알림 기준 | **받으면 할 일이 있고, 안 받으면 되돌릴 수 없는 것만** · 클러스터 밖 감시는 Better Stack | 둘 중 하나만 맞는 것은 대시보드에서 보면 충분 · 클러스터 안 알림은 클러스터가 죽으면 같이 죽음 |
{:.hl-dec}

## 대시보드와 알림

대시보드는 코드(cgv-infra `manifests/dashboards`)로 배포됩니다 — dev는 클러스터 · 호스트 · 앱 셋, stg는 흐름(판정 + 층별 진단 + 노드) · queue · booking · 데이터. 보고 있지 않은 시간은 알림이 맡습니다.

<figure class="hl-shot" markdown="0">
  <img src="/assets/img/homelab/obs/host-phone.png" alt="충전선을 뽑은 순간 — 왼쪽 호스트 대시보드의 전원이 배터리(빨강)로 바뀌고 전력 행의 하트가 깨졌으며, 오른쪽 폰 Discord에 발생 알림이 도착" loading="lazy">
  <figcaption>충전선을 뽑아 검증한 화면입니다 — 전원이 배터리(빨강)로 바뀌고, 알림이 걸린 패널의 하트가 깨지고, 같은 순간 폰에 닿습니다.</figcaption>
</figure>

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| 시리즈 상한 15만이 차서 늦게 온 metric이 거절됨 — 화면엔 에러 없이 **값만 없음** | 표준 쿠버네티스는 `:6443`·`:10250`이 다른 프로세스라 둘 다 수집 — **k3s는 한 프로세스**라 같은 metric이 두 벌, 15만의 85% | `:6443` 수집을 지우고 상한을 30만으로. 거절 **0** |
| 유휴인데 CPU 패키지 **92°C** — 예고 없이 꺼진 적이 있는데 온도 기록이 없음 | 온도·전원은 물리 호스트에만 있는 metric이라 VM 안에서는 수집 경로 자체가 없음 | 호스트에 node-exporter를 올리고 변수를 하나씩 바꿈 — 쿨러·덮개 열기·powersave로 **66°C**. 알림 임계 90°C의 근거 |
| stg 2.5만 판에서 입장 전파가 **97.445%** — 브로커는 한가한데 브로커에서 기다린 시간 1.852초 | 요청의 96%가 폴링이고 요청마다 접근 로그 한 줄 — Loki **초당 4,256줄** · 로그 수집기가 노드마다 0.5코어 · booking 노드 런큐 **3.30초/초**. 노드를 채운 것은 서비스가 아니라 수집기 | 성공한 폴링의 접근 로그 제외 · 4xx·5xx는 유지 → 100.000% · **741줄/초** · 런큐 **0.26** |
{:.hl-tbl}

## 결과

- **세 신호가 각자의 저장소에 쌓입니다** — metric Mimir(15일) · log Loki(7일) · trace Tempo(24시간). 원본은 dev가 MinIO, stg가 S3입니다
- **같은 차트 · 같은 대시보드가 두 환경에 있습니다** — 부하 판 19회의 판정과 진단이 전부 stg Mimir의 서버 지표로 나왔습니다
- 안 볼 때는 **알림이 Discord로** 옵니다 — 지금 값과 할 일, 패널 그림과 함께. 클러스터가 통째로 죽어도 Better Stack이 밖에서 잡습니다
- **관측이 부하를 만든다는 것을 실측으로 봤습니다** — 로그 한 줄의 비용은 디스크가 아니라 그 줄을 읽어 보내는 수집기의 CPU이고, 그것이 같은 노드의 서비스 파드를 밀었습니다

## 한계

- **옵저버빌리티 스택 자신을 보는 화면이 없습니다** — 구축 중 metric이 에러 없이 버려지거나 상한이 차는 일이 있었습니다
- **알림 규칙을 stg에 옮기지 않았습니다** — 판 중에는 사람이 보고 있었습니다
- **stg의 RDS · ElastiCache 칸은 CloudWatch 해상도(1분)와 지연에 묶입니다** — 5만 판의 오픈 순간에는 신뢰하지 않았습니다

## 기술 스택

Mimir · Loki · Tempo · Grafana · Alloy · MinIO · S3 · CloudWatch exporter · kube-state-metrics · node-exporter · Better Stack
{:.hl-more}

{% include hl-nav.html %}
