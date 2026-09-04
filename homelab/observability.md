---
layout: page
title: 관측
description: >
  지표·로그·트레이스를 수집기 하나로 모으고, 클러스터와 서버 호스트의 대시보드·알림을 세웠습니다
permalink: /homelab/observability/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

클러스터도 배포 경로도 섰지만, **안에서 무슨 일이 벌어지는지 볼 방법이 없었습니다.**

## 관측 구조

세 신호를 **Alloy**가 모읍니다 — 노드마다 하나씩 돌며 대상을 나눠 가집니다.

<!-- 신호 셋이 각자 레인으로 나란히 흐르고 Alloy 기둥 하나가 셋을 관통하는 구조 —
     수집기 하나가 세 신호를 다 다룬다는 사실이 기둥으로 보이게. 화살표 = 데이터 방향. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<svg viewBox="0 0 760 312" role="img" aria-label="지표·로그·트레이스 세 레인이 나란히 흐르고, 노드마다 도는 Alloy 기둥 하나가 셋을 모아 Mimir·Loki·Tempo로 밀어낸다. 세 저장소의 원본은 MinIO에 앉고 Grafana가 셋을 읽는다">
  <defs>
    <marker id="hlo-n" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/></marker>
  </defs>

  <!-- 레인 1 — 지표 -->
  <rect class="hla-inner" x="24" y="40" width="120" height="56" rx="5"/>
  <text class="hla-t" x="38" y="64">지표</text>
  <text class="hla-s2" x="38" y="84">앱 · 미들웨어 · 노드</text>
  <line class="hla-ln" x1="144" y1="68" x2="234" y2="68" marker-end="url(#hlo-n)" fill="none"/>
  <text class="hla-a" x="189" y="60" text-anchor="middle">scrape</text>
  <text class="hla-a" x="189" y="84" text-anchor="middle">15초·60초 주기</text>
  <line class="hla-ln" x1="336" y1="68" x2="414" y2="68" marker-end="url(#hlo-n)" fill="none"/>
  <rect class="hla-box" x="418" y="40" width="158" height="56" rx="5"/>
  <image href="/assets/img/icons/mimir.svg" x="432" y="51" width="20" height="20"/>
  <text class="hla-t" x="460" y="67">Mimir</text>
  <text class="hla-s" x="432" y="86">지표 · 보존 15일</text>

  <!-- 레인 2 — 로그 -->
  <rect class="hla-inner" x="24" y="110" width="120" height="56" rx="5"/>
  <text class="hla-t" x="38" y="134">로그</text>
  <text class="hla-s2" x="38" y="154">stdout · 이벤트</text>
  <line class="hla-ln" x1="144" y1="138" x2="234" y2="138" marker-end="url(#hlo-n)" fill="none"/>
  <text class="hla-a" x="189" y="130" text-anchor="middle">tail</text>
  <text class="hla-a" x="189" y="154" text-anchor="middle">생기는 대로</text>
  <line class="hla-ln" x1="336" y1="138" x2="414" y2="138" marker-end="url(#hlo-n)" fill="none"/>
  <rect class="hla-box" x="418" y="110" width="158" height="56" rx="5"/>
  <image href="/assets/img/icons/loki.svg" x="432" y="121" width="20" height="20"/>
  <text class="hla-t" x="460" y="137">Loki</text>
  <text class="hla-s" x="432" y="156">로그 · 7일</text>

  <!-- 레인 3 — 트레이스 -->
  <rect class="hla-inner" x="24" y="180" width="120" height="56" rx="5"/>
  <text class="hla-t" x="38" y="204">트레이스</text>
  <text class="hla-s2" x="38" y="224">queue · booking</text>
  <line class="hla-ln" x1="144" y1="208" x2="234" y2="208" marker-end="url(#hlo-n)" fill="none"/>
  <text class="hla-a" x="189" y="200" text-anchor="middle">push — OTLP</text>
  <text class="hla-a" x="189" y="224" text-anchor="middle">앱이 보냄</text>
  <line class="hla-ln" x1="336" y1="208" x2="414" y2="208" marker-end="url(#hlo-n)" fill="none"/>
  <rect class="hla-box" x="418" y="180" width="158" height="56" rx="5"/>
  <image href="/assets/img/icons/tempo.svg" x="432" y="191" width="20" height="20"/>
  <text class="hla-t" x="460" y="207">Tempo</text>
  <text class="hla-s" x="432" y="226">트레이스 · 24시간</text>

  <!-- Alloy 기둥 — 세 레인을 관통 -->
  <rect class="hla-box" x="236" y="30" width="100" height="206" rx="6"/>
  <image href="/assets/img/icons/alloy.svg" x="275" y="42" width="22" height="22"/>
  <text class="hla-t" x="286" y="90" text-anchor="middle">Alloy</text>
  <text class="hla-s2" x="286" y="118" text-anchor="middle">노드마다 하나, 셋</text>
  <text class="hla-s2" x="286" y="136" text-anchor="middle">대상을 나눠 맡음</text>

  <!-- MinIO — 원본이 내려앉는 곳 -->
  <line class="hla-ln" x1="497" y1="238" x2="497" y2="254" marker-end="url(#hlo-n)" fill="none"/>
  <text class="hla-a" x="507" y="251">원본 저장</text>
  <rect class="hla-box" x="418" y="258" width="158" height="44" rx="5"/>
  <image href="/assets/img/icons/minio.svg" x="432" y="266" width="18" height="18"/>
  <text class="hla-t" x="458" y="281">MinIO</text>
  <text class="hla-s2" x="500" y="281">S3 · 100G</text>

  <!-- Grafana — 셋을 읽는 쪽 -->
  <line class="hla-ln" x1="576" y1="68" x2="630" y2="68" marker-end="url(#hlo-n)" fill="none"/>
  <line class="hla-ln" x1="576" y1="138" x2="630" y2="138" marker-end="url(#hlo-n)" fill="none"/>
  <line class="hla-ln" x1="576" y1="208" x2="630" y2="208" marker-end="url(#hlo-n)" fill="none"/>
  <rect class="hla-inner" x="634" y="30" width="102" height="206" rx="6"/>
  <image href="/assets/img/icons/grafana.svg" x="676" y="44" width="20" height="20"/>
  <text class="hla-t" x="685" y="90" text-anchor="middle">Grafana</text>
  <text class="hla-s" x="685" y="118" text-anchor="middle">셋을 읽음</text>
  <text class="hla-s2" x="685" y="180" text-anchor="middle">인프라 판 2장</text>
  <text class="hla-s2" x="685" y="198" text-anchor="middle">앱 판 3장</text>
  <text class="hla-s2" x="685" y="216" text-anchor="middle">알림 — Discord</text>
</svg>
<figcaption>저장소의 메모리와 WAL에는 최근 구간만 있고, 원본은 전부 MinIO로 내려갑니다
(Mimir는 2시간마다 블록으로).</figcaption>
</figure>

## 정한 것

| 무엇을 | 고른 것 | 그렇게 한 이유 |
|---|---|---|
| 지표 저장소 | **Mimir distributed** — ingester만 3대, 노드당 1 | ingester가 죽으면 메모리의 최근 2시간 소실 — 세 저장소를 다 분산할 자원은 없어 **판정에 쓰는 지표만** |
| 로그·트레이스 | **Loki·Tempo는 단일** | 위험은 같아도 조사 도구라 **비어도 판정에 무영향** · WAL로 재시작만 복구, 노드째 유실은 감수 |
| 저장 몸통 | **클러스터 안 MinIO** — S3 호환 | 원본은 전부 여기, 로컬은 WAL만 · 버킷별 전용 계정 — 루트 자격 미노출 |
| Tempo 보유 한도 | **`max_traces_per_user` 5배** — 동시에 열린 트레이스 1만 → 5만 | 전 요청을 남기기로 하자 폴링이 초당 수천 건이라 기본 한도 초과 — 넘친 트레이스는 폐기 |
| 알림에 패널 스크린샷 추가 | **Grafana Image Renderer** — 알림마다 그 지표의 패널을 그려 첨부 | 숫자만으로는 상승 시점 파악 불가 — 패널 캡처가 붙으면 추이까지 전달 |
| 밖에서 보는 감시 | **Better Stack** — `ticket.subinhong.dev` 를 밖에서 확인, 메일 | 다른 알림은 전부 클러스터 안에서 동작 — 클러스터가 죽으면 알림도 동반 정지 |
| 알림 기준 | **받으면 할 일이 있고, 안 받으면 되돌릴 수 없는 것만** | 둘 중 하나만 맞는 것은 대시보드에서 보면 충분 |
{:.hl-dec}

## 클러스터 대시보드

화면이 위에서 아래로 좁혀집니다 — 노드가 살아 있나에서 어느 파드가 문제인가까지.

<div class="hl-shots" markdown="0" aria-label="클러스터 인프라 대시보드 — 화살표로 넘겨 봅니다">
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/cluster-row0.png" alt="행0 — 노드 Ready · k3s 응답 · etcd 합의 · eviction 임박, 그리고 사고 흔적 표">
    <figcaption><b>(행0 · 살아 있나)</b> 왼쪽부터 노드 Ready → k3s 응답 → etcd 합의 순입니다.
    etcd만 지표 이름 체계가 달라 따로 수집합니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/cluster-row1.png" alt="행1 — 노드 메모리. 선언 기준 표와 실사용 기준 표, 노드별 추이" loading="lazy">
    <figcaption><b>(행1 · 노드 메모리)</b> 왼쪽은 스케줄러 기준 — 선언 합으로 새 파드가 들어갈 자리.
    오른쪽은 커널 기준 — 실제 사용 후 남은 양. 축이 달라 표를 나눴고 뺄셈은 한쪽 안에서만 합니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/cluster-row2.png" alt="행2 — 노드 CPU. 선언·실사용 표와 노드별 추이" loading="lazy">
    <figcaption><b>(행2 · 노드 CPU)</b> 같은 두 표인데 판정이 다릅니다 — 차면 종료되는 메모리와 달리
    CPU는 잘립니다. limit 합이 노드 총량을 넘겨도 두고, 겹치면 나눠 쓰며 느려집니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/cluster-row3.png" alt="행3 — 마운트별 용량과 inode" loading="lazy">
    <figcaption><b>(행3 · 마운트)</b> 왼쪽이 용량, 오른쪽이 inode입니다 — 바이트가 남아도
    파일 수가 차면 쓰기가 멈춰 축을 따로 둡니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/cluster-row4.png" alt="행4 — Pending·비정상 파드·재시작 burst와 흔적 표" loading="lazy">
    <figcaption><b>(행4 · 파드 상태)</b> 위는 흔적 — OOMKilled·Pending이었던 파드와 재시작이 잦아진 파드.
    아래는 임박 — 메모리가 limit의 80%를 넘거나 CPU 5분 평균이 limit에 닿은 컨테이너.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/kubeevent-container.png" alt="흔적 표에서 booking 파드를 눌러 열린 쿠버네티스 이벤트와 컨테이너 로그 화면" loading="lazy">
    <figcaption><b>(행4 · 눌러 들어간 화면)</b> 흔적 표에서 booking을 눌러 열립니다 — 왼쪽은
    파드의 쿠버네티스 이벤트(기동 프로브 실패 경고), 오른쪽은 컨테이너 로그입니다.
    흔적에서 원인까지 클릭 두 번입니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/cluster-row5.png" alt="행5 — 파드 스펙 장부. 도는 컨테이너 전수의 request 대비 실사용 게이지" loading="lazy">
    <figcaption><b>(행5 · 스펙 장부)</b> 전체 컨테이너의 선언 대 실사용입니다. 빨강은 request 초과(몰리면 먼저 축출),
    파랑은 선언만 하고 미사용 — 스펙 변경은 여기서 시작합니다.</figcaption>
  </figure>
</div>

## 호스트 대시보드와 알림

물리 노트북은 호스트 대시보드가, 보고 있지 않은 시간은 **알림**이 맡습니다.

<div class="hl-shots" markdown="0" aria-label="호스트 하드웨어 대시보드와 Discord 알림 — 화살표로 넘겨 봅니다">
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/host-row0.png" alt="행0 — 호스트 응답·CPU 온도·전원·배터리·주 디스크 판정·마지막 부팅">
    <figcaption><b>(행0 · 요약)</b> 물리 축 하나에 행 하나 — 열·전력·포화·저장.
    평소에는 이 줄만 보고 색이 바뀐 쪽으로 내려갑니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/host-row1.png" alt="행1 — CPU 온도와 클럭 추이" loading="lazy">
    <figcaption><b>(행1 · 열)</b> 왼쪽이 증상인 온도, 가운데가 원인인 클럭 — powersave로 평시를 낮추되
    최고 4.3GHz는 유지. 오른쪽은 NVMe 온도 — 섀시까지 뜨거운지. 90°C 스파이크는 알림의 5분 지속 조건이 거릅니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/host-row2.png" alt="행2 — 전원 공급·배터리 잔량 추이와 비정상 종료 발생 수" loading="lazy">
    <figcaption><b>(행2 · 전력)</b> 전원이 끊겨도 배터리로 버티는 유예가 알림 둘(AC 끊김 ·
    배터리 잔량)의 근거입니다. 비정상 종료 0은 밤 예약 종료가 정상 동작한다는 뜻입니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/host-row4.png" alt="행4 — local(Proxmox 영역)·local-lvm(VM 디스크 저장고)·주 디스크 온도·SMART" loading="lazy">
    <figcaption><b>(행4 · 저장)</b> 외장 SSD 한 장을 셋으로 나눠 봅니다 — Proxmox 영역(local) · VM 영역(local-lvm, 한도 점선) ·
    물리 상태(온도·읽기 오류). VM 영역은 기본 지표에 없어 <code>lvs</code>를 읽는 수집기를 붙였습니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/host-phone.png" alt="충전선을 뽑은 순간 — 왼쪽 호스트 판의 전원이 배터리(빨강)로 바뀌고 전력 행의 하트가 깨졌으며, 오른쪽 폰 Discord에 발생 알림이 도착" loading="lazy">
    <figcaption><b>(검증 · AC 끊김)</b> 충전선을 뽑아 검증한 화면입니다 — 전원이 배터리(빨강)로
    바뀌고, 알림이 걸린 패널의 하트가 깨지고(평소엔 초록), 같은 순간 폰에 닿습니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/host-alert.png" alt="Discord로 온 실제 알림 — 왼쪽 발생(CPU 과열 103도), 오른쪽 5분 뒤 해소(77도)" loading="lazy">
    <figcaption><b>(알림 · 실물)</b> 실제로 울렸던 알림입니다 — 왼쪽이 발생(103°C), 오른쪽이
    해소(77°C). 현재 값과 조치, 패널 그림이 함께 옵니다.</figcaption>
  </figure>
</div>

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| 시리즈 상한 15만이 차서 늦게 온 지표가 거절됨 — 화면엔 에러 없이 **값만 없음** | 표준 k8s는 `:6443`·`:10250`이 다른 프로세스라 둘 다 수집 — **k3s는 한 프로세스**라 같은 지표가 두 벌, 15만의 85% | `:6443` 수집을 지우고 상한을 30만으로. 거절 **0** |
| 유휴인데 CPU 패키지 **92°C** — 예고 없이 꺼진 적이 있는데 온도 기록이 없음 | 온도·전원은 물리 호스트에만 있는 지표라 VM 안에서는 수집 경로 자체가 없음 | 호스트에 node-exporter를 올리고 변수를 하나씩 바꿈 — 쿨러·덮개 열기·powersave로 **66°C**. 알림 임계 90°C의 근거 |
| 클러스터 판의 **스펙 장부**에 선언과 실사용의 어긋남이 줄줄이 뜸 | 전부 **실측 없이 넣은 값** — request를 넘기면 몰릴 때 1순위 축출, limit에 임박하면 스파이크 한 번에 종료 | request·limit을 실사용 기준으로 재조정 |
{:.hl-tbl}

## 결과

- **세 신호가 각자의 저장소에 쌓입니다** — 지표 Mimir(ingester 3대 · 15일) · 로그 Loki(7일) · 트레이스 Tempo(24시간). 원본은 셋 다 MinIO에 저장됩니다
- **대시보드 둘을 구성했습니다** — 클러스터 상태와 호스트 하드웨어(열·전력·저장). 알림은 호스트 쪽에만 걸었습니다
- 안 볼 때는 **알림이 Discord로** 옵니다 — 지금 값과 할 일, 패널 그림과 함께
- **클러스터가 통째로 죽어도 밖에서 잡힙니다** — Better Stack이 서비스 주소를 밖에서 확인하다 상태가 바뀌면 메일을 보냅니다

## 남은 것

- **관측 스택 자신을 보는 화면이 없습니다** — 구축 중 지표가 에러 없이 버려지거나 상한이 차는 일이 있었습니다
- **request를 넘거나 limit에 다가선 파드가 아직 있습니다** — 노드 메모리 8GB × 3에서는 전부에 여유를 줄 수 없어, 자원이 큰 클러스터에서 다시 잡습니다

## 쓴 것

Mimir · Loki · Tempo · Grafana · Alloy · MinIO · kube-state-metrics · node-exporter · Better Stack
{:.hl-more}

회사에서는 기구축된 같은 스택 위에서 관측만 맡았습니다 — [semiai](/projects/semiai/).
{:.hl-more}

{% include hl-nav.html %}
