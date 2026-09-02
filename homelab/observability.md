---
layout: page
title: 관측
description: >
  지표·로그·트레이스를 수집기 하나로 모으고, 대시보드와 알림을 그 위에 세웠습니다
permalink: /homelab/observability/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

클러스터도 배포 경로도 섰지만, 안에서 무슨 일이 벌어지는지 볼 방법이 없었습니다 —
그리고 보는 장치는 **세워 놓는다고 도는 것이 아니었습니다.**

## 관측 구조

수집기 하나가 세 신호를 다 모읍니다 — **Alloy**가 노드마다 하나씩 돌고, 셋이 대상을 나눠 가집니다.

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
  <text class="hla-s2" x="685" y="216" text-anchor="middle">알림 5종 — Discord</text>
</svg>
<figcaption>각 저장소의 메모리와 WAL에는 최근 구간만 있고, 원본은 전부 MinIO로 내려갑니다
(Mimir는 2시간마다 블록으로).</figcaption>
</figure>

## 정한 것

| 무엇을 | 고른 것 | 그렇게 한 이유 |
|---|---|---|
| 지표 저장소 | **Mimir distributed** — ingester만 3대, 노드당 1 | 최근 2시간은 ingester 메모리에만 있음 — 죽으면 그 구간이 빔. 복제엔 파드·RAM이 배로 들어 셋 다는 못 하고, **알림과 판 전부가 서 있는 지표에만 그 비용을 냄** — 셋이 같은 값을 들어 한 대가 죽어도 남음 |
| 로그·트레이스 | **Loki·Tempo는 단일** | 위험은 같지만 무게가 다름 — 둘은 원인을 파는 조사 도구(로그는 실패·경합만, 초당 16줄)라 **잠깐 비어도 판정이 무너지지 않음.** WAL로 재시작만 복구하고, 노드째 나갈 때의 유실은 감수 |
| 저장 몸통 | **클러스터 안 MinIO** — S3 호환 | 셋 다 원본은 여기, 로컬엔 WAL만. 전용 계정이 세 버킷만 읽고 씀 — 루트 자격은 앱에 안 나감 |
| Tempo 보유 한도 | **`max_traces_per_user` 5배** — 동시에 열려 있는 트레이스 1만 → 5만 | 전 요청을 남기기로 하자(표본 1.0) queue 폴링이 초당 수천 건이라 기본 한도를 넘음 — 넘친 트레이스는 버려져 그 구간은 열어 볼 것이 없음. Tempo 메모리 상한도 3배로 |
| 알림에 패널 스크린샷 추가 | **Grafana Image Renderer** — 알림마다 그 지표의 패널을 그려 첨부 | 알림은 Discord로 옴 — 숫자만으론 얼마나 급한지 애매함. 그 지표 패널의 캡처가 붙으면 언제부터 얼마나 올랐는지가 바로 읽힘. 렌더러가 죽어도 알림은 텍스트로 계속 감 |
{:.hl-dec}

## 클러스터 대시보드

판은 위에서 아래로 좁혀 내려갑니다 — 노드가 살아 있나에서 어느 파드가 문제인가까지.

<div class="hl-shots" markdown="0" aria-label="클러스터 인프라 대시보드 — 화살표로 넘겨 봅니다">
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/cluster-row0.png" alt="행0 — 노드 Ready · k3s 응답 · etcd 합의 · eviction 임박, 그리고 사고 흔적 표">
    <figcaption>노드가 살아 있나 — 생존은 쿠버네티스 API를 거치지 않고 노드에 직접 물어 잽니다.
    API 경유 값은 합의가 깨지면 갱신을 멈춘 채 마지막 상태로 굳어, 죽었는데 정상으로 남습니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/cluster-row1.png" alt="행1 — 노드 메모리. 선언 기준 표와 실사용 기준 표, 노드별 추이" loading="lazy">
    <figcaption>노드 메모리는 표가 둘입니다 — 스케줄러는 선언(requests)만 보고 커널은 실사용만 봅니다.
    한 표에 섞으면 무엇이 무엇의 한계인지 흐려져, 뺄셈은 같은 기준 안에서만 합니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/cluster-row4.png" alt="행4 — Pending·비정상 파드·재시작 burst와 흔적 표" loading="lazy">
    <figcaption>어느 파드가 문제인가 — 잠깐 죽었다 살아난 것은 흔적 표에 남고, 파드 이름을 누르면
    그 파드의 이벤트와 로그가 같은 시간 범위로 열립니다. 누적 재시작은 절대값이 아니라 격차로 읽습니다 —
    클러스터를 껐다 켠 횟수만큼 다 같이 오르기 때문입니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/cluster-row5.png" alt="행5 — 파드 스펙 장부. 도는 컨테이너 전수의 request 대비 실사용 게이지" loading="lazy">
    <figcaption>스펙 장부 — 도는 컨테이너 전수의 선언 대 실사용입니다. 빨강은 request를 넘겨 쓰는 것(노드가
    몰리면 먼저 쫓겨남), 파랑은 선언만 하고 안 쓰는 것. 여기서 후보를 세우고 확정은 부하 때 값으로 합니다.</figcaption>
  </figure>
</div>

## 호스트 대시보드와 알림

클러스터 판이 보는 것은 VM 안까지입니다 — 그 아래 물리 노트북은 호스트 판이 보고,
안 볼 때는 **알림 다섯**이 폰으로 옵니다.

<div class="hl-shots" markdown="0" aria-label="호스트 하드웨어 대시보드와 Discord 알림 — 화살표로 넘겨 봅니다">
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/host-row0.png" alt="행0 — 호스트 응답·CPU 온도·전원·배터리·주 디스크 판정·마지막 부팅">
    <figcaption>물리 축 하나에 행 하나 — 열·전력·포화·저장. 평소에는 이 줄만 보고,
    색이 바뀐 축의 행으로 내려갑니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/host-row1.png" alt="행1 — CPU 온도와 클럭 추이" loading="lazy">
    <figcaption>유휴 92°C를 변수 하나씩 좁혔습니다 — 팬은 섀시만 식혔고, 덮개를 여니 78,
    거버너를 바꾸니 66°C. 알림 임계 90°C가 이 실측 위에 섭니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/host-row4.png" alt="행4 — thin pool·마운트 용량·주 디스크 상태" loading="lazy">
    <figcaption>VM 디스크가 사는 thin pool은 마운트가 아니라 기본 지표에 안 나옵니다 —
    lvs를 읽어 지표 파일로 내는 수집기를 직접 붙였습니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/obs/host-alert.png" alt="Discord로 온 알림 — 제목·지금 값·조치·패널 그림" loading="lazy">
    <figcaption>알림 기준은 둘 — 오면 일어나서 할 일이 있나, 안 울리면 되돌릴 수 없나.
    걸러진 다섯은 전부 물리 층입니다. 값이 사라졌을 때 우는 것은 다섯째(감시 경로)뿐이고,
    호스트가 통째로 꺼진 순간만은 밖에서 보는 감시의 몫입니다.</figcaption>
  </figure>
</div>

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| 시리즈 상한 15만이 차서 늦게 온 지표가 거절됨 — 화면엔 에러 없이 **값만 없음** | `:6443`은 API 서버, `:10250`은 kubelet이 듣는 포트 — 표준 k8s에선 서로 다른 프로세스라 둘 다 긁는 게 정석. **k3s는 그 컴포넌트들이 한 프로세스**라 지표 목록도 하나 — 어느 포트로 물어도 같은 전체가 옴. 둘 다 긁어 같은 내용이 이름만 다른 두 벌로 저장 — 15만의 85% | `:6443` 수집을 지우고 상한을 30만으로. 거절 **0** |
| 유휴인데 CPU 패키지 **92°C** — 예고 없이 꺼진 적이 있는데 그때 온도 기록이 없음 | 수집 경로 자체가 없었음 — 온도·전원은 물리 호스트에만 있는 지표라 VM 안 어디서도 안 잡힘 | 호스트에 node-exporter를 얹음 — 그 위에 **호스트 하드웨어 판과 알림 다섯**이 섬 |
| 클러스터 판의 **스펙 장부**에 선언과 실사용의 어긋남이 줄줄이 뜸 — 실사용이 request를 넘는 파드, peak가 limit의 80%를 넘는 파드 | 그 값들이 전부 **실측 없이 넣은 값**이었음 — request를 넘겨 쓰는 파드는 노드가 몰릴 때 먼저 쫓겨나고, limit에 임박한 파드는 스파이크 한 번에 죽음 | 여섯을 실사용 기준으로 정정. 이후 스펙 조정은 전부 이 장부에서 시작함 |
{:.hl-tbl}

## 결과

- 세 신호가 각자의 저장소에 쌓입니다 — 지금 초당 샘플 2,990 · 보유 시리즈 9만 1천(상한의 30%) · 거절 0
- 판과 알림과 배선이 전부 git에 있습니다 — 화면에서 고친 것은 재시작하면 사라지는 구조라, 바뀌는 길이 커밋 하나뿐입니다
- 안 볼 때는 알림 다섯이 폰으로 옵니다 — 지금 값과 할 일, 그 패널의 그림과 함께

## 남은 것

- **지표가 조용히 버려지는 일을 알리는 장치가 아직 없습니다** — 트러블슈팅 첫 행의 그 거절이 다시 생기면, 화면을 열어야 압니다
- **Grafana 상주 메모리가 limit의 82%입니다** — 판이 늘 때마다 따라 올라, 판을 더하기 전에 상한부터 올려야 합니다

## 쓴 것

Mimir · Loki · Tempo · Grafana · Alloy · MinIO · kube-state-metrics · node-exporter
{:.hl-more}

이 화면들 위에서 부하를 걸어 서비스의 용량을 쟀습니다.
{:.hl-more}
