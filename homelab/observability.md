---
layout: page
title: 관측
description: >
  지표·로그·트레이스가 세 저장소에 쌓이고, 그래프의 점을 누르면 그 요청과 로그가 열립니다
permalink: /homelab/observability/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

클러스터도 배포 경로도 섰지만, 안에서 무슨 일이 벌어지는지 볼 방법이 없었습니다 —
그리고 보는 장치는 **세워 놓는다고 도는 것이 아니었습니다.**

## 관측 구조

<!-- 좌 = 신호가 나는 곳(클러스터 안 + 물리 호스트), 중앙 = Alloy, 우 = 저장소 셋 → MinIO, 끝 = Grafana.
     신호별 색: 지표 주황(hla-ln-img) · 로그 파랑(hla-ln-def) · 트레이스 점선.
     호스트 선이 클러스터 경계를 뚫고 들어오는 것이 의도 — 물리 층도 같은 수집기가 긁는다. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<svg viewBox="0 0 760 475" role="img" aria-label="앱과 노드가 내는 지표·로그·트레이스를 노드마다 도는 Alloy가 모아 Mimir·Loki·Tempo로 보내고, 세 저장소의 원본은 MinIO에 앉으며, Grafana가 셋을 읽는다. 클러스터 밖 pve 호스트도 같은 Alloy가 긁는다">
  <defs>
    <marker id="hlo-i" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#f08c2e"/></marker>
    <marker id="hlo-d" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#2f6fdb"/></marker>
    <marker id="hlo-n" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/></marker>
  </defs>

  <rect class="hla-outer" x="14" y="14" width="732" height="380" rx="8"/>
  <text class="hla-zone" x="30" y="36">k3s 클러스터</text>

  <!-- 신호가 나는 곳 -->
  <rect class="hla-inner" x="30" y="50" width="160" height="120" rx="5"/>
  <text class="hla-t" x="44" y="74">앱 · 미들웨어 · 노드</text>
  <text class="hla-s2" x="44" y="100">지표 — 걸어 둠</text>
  <text class="hla-s2" x="44" y="122">로그 — 찍음</text>
  <text class="hla-s2" x="44" y="144">트레이스 — 내보냄</text>

  <line class="hla-ln-img" x1="190" y1="96" x2="228" y2="96" marker-end="url(#hlo-i)" fill="none"/>
  <line class="hla-ln-def" x1="190" y1="118" x2="228" y2="118" marker-end="url(#hlo-d)" fill="none"/>
  <line class="hla-ln hla-dash" x1="190" y1="140" x2="228" y2="140" marker-end="url(#hlo-n)" fill="none"/>

  <!-- Alloy -->
  <rect class="hla-inner" x="230" y="60" width="160" height="100" rx="5"/>
  <image href="/assets/img/icons/grafana.svg" x="242" y="72" width="18" height="18"/>
  <text class="hla-t" x="266" y="86">Alloy</text>
  <text class="hla-s" x="242" y="112">노드마다 하나 — 셋이</text>
  <text class="hla-s" x="242" y="130">대상을 나눠 가짐</text>
  <text class="hla-s2" x="242" y="150">지표는 15초마다 긁음</text>

  <!-- 저장소 셋 -->
  <rect class="hla-box" x="430" y="34" width="140" height="56" rx="5"/>
  <text class="hla-t" x="444" y="58">Mimir</text>
  <text class="hla-s" x="444" y="76">지표 · 보존 15일</text>

  <rect class="hla-box" x="430" y="104" width="140" height="56" rx="5"/>
  <text class="hla-t" x="444" y="128">Loki</text>
  <text class="hla-s" x="444" y="146">로그 · 7일</text>

  <rect class="hla-box" x="430" y="174" width="140" height="56" rx="5"/>
  <text class="hla-t" x="444" y="198">Tempo</text>
  <text class="hla-s" x="444" y="216">트레이스 · 24시간</text>

  <polyline class="hla-ln-img" points="390,80 410,80 410,62 428,62" marker-end="url(#hlo-i)" fill="none"/>
  <polyline class="hla-ln-def" points="390,110 410,110 410,132 428,132" marker-end="url(#hlo-d)" fill="none"/>
  <polyline class="hla-ln hla-dash" points="390,140 410,140 410,202 428,202" marker-end="url(#hlo-n)" fill="none"/>

  <!-- MinIO -->
  <line class="hla-ln" x1="500" y1="230" x2="500" y2="266" marker-end="url(#hlo-n)" fill="none"/>
  <text class="hla-a" x="512" y="252">원본이 내려감</text>
  <rect class="hla-box" x="430" y="268" width="140" height="56" rx="5"/>
  <text class="hla-t" x="444" y="292">MinIO</text>
  <text class="hla-s" x="444" y="310">S3 — 셋의 원본 · 100G</text>

  <!-- Grafana -->
  <rect class="hla-inner" x="610" y="34" width="120" height="196" rx="5"/>
  <image href="/assets/img/icons/grafana.svg" x="622" y="48" width="18" height="18"/>
  <text class="hla-t" x="646" y="62">Grafana</text>
  <text class="hla-s" x="622" y="92">셋을 읽어</text>
  <text class="hla-s" x="622" y="110">한 화면에</text>
  <text class="hla-s2" x="622" y="204">판 7장 · 알림 5종</text>

  <line class="hla-ln" x1="570" y1="62" x2="608" y2="62" marker-end="url(#hlo-n)" fill="none"/>
  <line class="hla-ln" x1="570" y1="132" x2="608" y2="132" marker-end="url(#hlo-n)" fill="none"/>
  <line class="hla-ln" x1="570" y1="202" x2="608" y2="202" marker-end="url(#hlo-n)" fill="none"/>

  <!-- 물리 호스트 — 클러스터 밖 -->
  <line class="hla-ln-img" x1="310" y1="412" x2="310" y2="164" marker-end="url(#hlo-i)" fill="none"/>
  <text class="hla-a" x="320" y="330">호스트도 같은 수집기가 긁음</text>
  <rect class="hla-inner hla-dash" x="30" y="414" width="360" height="46" rx="5"/>
  <text class="hla-c" x="44" y="433">pve 호스트 — 물리 노트북 · 클러스터 밖</text>
  <text class="hla-s2" x="44" y="451">node-exporter :9100 — 온도 · 전원 · 디스크</text>

  <!-- 범례 -->
  <circle class="hla-dot-g" cx="430" cy="446" r="4"/>
  <text class="hla-a" x="442" y="450">지표</text>
  <circle class="hla-dot-v" cx="500" cy="446" r="4"/>
  <text class="hla-a" x="512" y="450">로그</text>
  <line class="hla-ln hla-dash" x1="566" y1="446" x2="590" y2="446" fill="none"/>
  <text class="hla-a" x="598" y="450">트레이스</text>
</svg>
<figcaption>최근 구간만 각 저장소의 메모리와 WAL에 있고, 원본은 전부 MinIO에 있습니다.</figcaption>
</figure>

## 정한 것

| 무엇을 | 고른 것 | 그렇게 한 이유 |
|---|---|---|
| 지표 저장소 | **Mimir distributed** — ingester만 3대, 노드당 1 | 최근 2시간은 MinIO에 없고 ingester 메모리에만 있음. 하나로 합치면 그 구간이 복제가 안 됨 — 셋에 복제해 두 대가 받으면 쓰기 성공 |
| 로그·트레이스 | **Loki·Tempo는 단일** | 지표만큼 유입이 없음(로그는 초당 16줄). 대신 복제가 없어 최근 구간을 지킬 수단이 WAL뿐 — 전용 디스크가 있는 노드에 파드를 고정 |
| 저장 몸통 | **클러스터 안 MinIO** — S3 호환 | 셋 다 원본은 여기 두고 로컬엔 WAL만 남김. 전용 계정이 세 버킷만 읽고 씀 — 루트 자격은 어느 앱에도 안 나감 |
| 시리즈 상한 | 기본 15만 → **30만**, 제어면 버킷은 버림 | 이 클러스터 원천이 약 22만이라 기본값으로는 절반이 거절됨. 대시보드가 안 쓰는 제어면 버킷(전체의 52%)을 저장 전에 버려 보유 9.1만 — 분위수만 포기하고 평균·비율은 남음 |
| 트레이스 표본 | **1.0** — 전 요청, 프로브만 0 | 0.01로 낮췄다 되돌림. p99 그래프에 붙는 점의 수는 표본이 아니라 저장 규칙(스크레이프당 버킷당 하나)이 정함 — 표본이 정하는 건 그 트레이스가 남아 있느냐뿐. 대신 Tempo 보유 한도를 5배로 |
{:.hl-dec}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| 시리즈 상한 15만이 차서 늦게 온 지표가 거절됨 — 화면엔 에러 없이 **값만 없음** | k3s가 컨트롤플레인을 한 프로세스로 합쳐 두 포트(`:6443`·`:10250`)가 **같은 레지스트리**를 찍음. 둘 다 긁어 15만의 85%가 사본 한 벌 | `:6443` 수집을 지우고 상한을 30만으로. 거절 **0** |
| 유휴인데 CPU 패키지 **92°C** — 예고 없이 꺼진 적이 있는데 그때 온도 기록이 없음 | 수집 경로 자체가 없었음 — 온도·전원은 물리 호스트에만 있는 지표라 VM 안 어디서도 안 잡힘 | 호스트에 node-exporter를 얹고 변수 하나씩 — 팬(섀시만 식음) → 덮개 열기 78 → 거버너 **66°C**. 알림 임계 90°C가 이 실측 위에 섬 |
| 알림에 그림이 안 붙음 — 렌더러는 **살아 있고 헬스체크도 통과** | 대기 중엔 88MiB인데 화면을 그리는 순간 크로미움이 **591MiB**로 튐. 상한이 384MiB라 요청마다 죽고, 부르는 쪽엔 연결 끊김으로만 보임 | 상한을 피크의 130%로. 렌더러가 죽어도 알림은 텍스트로 계속 감 |
{:.hl-tbl}

## 세 축을 잇는 배선

신호는 원래 이어져 있습니다 — 로그 줄에 trace ID가 찍히고, 히스토그램에 그 요청의 ID가 실려 옵니다.
설정 세 줄이 그 연결을 화면에서 건너게 합니다.

<!-- 2열 표 — 열 폭 클래스는 캐러셀 CSS 작업 때 함께 -->

| 건너감 | 실제로 하는 일 |
|---|---|
| 지표 → 트레이스 | p99 그래프의 **점**을 누르면 그 봉우리를 만든 요청 하나가 열림 |
| 트레이스 → 로그 | span 아래 버튼이 그 요청이 남긴 로그만 엶 |
| 로그 → 트레이스 | 로그 줄의 trace ID를 눌러 그 요청으로 되돌아감 |

**이 배선은 끊겨도 증상이 없습니다.** 실제로 한 번 끊겼습니다 — 설정의 `${...}`를 Grafana가
환경변수 자리로 읽어 필터가 빈 문자열로 저장됐고, 화면에는 그 요청과 무관한 로그가 정상처럼
떴습니다. 파일에는 원문이 남아 있어 코드만 봐서는 안 보입니다. `$$`로 이스케이프하고,
확인은 파일이 아니라 저장된 값으로 합니다.

## 클러스터 대시보드

판은 위에서 아래로 좁혀 내려갑니다 — 노드가 살아 있나에서 어느 파드가 문제인가까지.

- 노드 생존은 쿠버네티스 API를 거치지 않고 **노드에 직접 물어** 잽니다 — API 경유 값은 합의가 깨지면 갱신을 멈춘 채 마지막 상태로 굳어, 죽었는데 정상으로 남습니다
- 메모리 행은 표가 둘입니다 — 스케줄러는 선언(requests)만 보고 커널은 실사용만 봐서, **한 표에 섞으면 무엇이 무엇의 한계인지 흐려집니다.** 뺄셈은 같은 기준 안에서만 합니다

<!-- 캐러셀 A 자리 — 슬라이드 후보: 행0 생존(Ready·k3s응답·etcd합의·사고흔적) / 행1 메모리 두 표 / 행4 파드 흔적·재시작 burst -->

## 호스트와 알림

클러스터 판이 보는 것은 VM 안까지입니다. 그 아래 물리 층도 리눅스라 같은 node-exporter를
얹으면 되고, 판은 **물리 축 하나에 행 하나**입니다 — 열 · 전력 · 포화 · 저장.
평소에는 첫 행의 숫자만 보고, 색이 바뀐 축의 행으로 내려갑니다.

화면은 볼 때만 답합니다. 안 볼 때를 위한 알림은 기준 둘로 골랐습니다 —
**오면 일어나서 할 일이 있나, 안 울리면 되돌릴 수 없나.** 이 둘로 거르면 전부 물리 층이 됩니다.
클러스터와 앱은 재기동으로 회복되지만, 과열·전원 상실·디스크 사망은 되돌릴 수 없습니다.

| 알림 | 조건 | 오면 하는 일 |
|---|---|---|
| CPU 과열 | 패키지 90°C, 5분 | 클럭이 높으면 설정이 풀렸거나 부하. 클럭이 정상인데 뜨거우면 물리 냉각 |
| AC 전원 끊김 | 어댑터 0, 2분 | 배터리 잔량 기울기로 남은 시간을 보고 플러그·정전 확인 |
| 배터리 20% | 잔량 미달 | AC가 안 돌아왔으면 정상 종료 — 갑자기 끊기면 etcd·MySQL이 깨짐 |
| 주 디스크 이상 | SMART 판정 0, 5분 | 아직 읽히는 동안 백업을 다른 매체로 빼고 교체 준비 |
| 감시 경로 끊김 | `up` 0, 5분 | **위 넷의 보증** — 넷은 호스트 수집 하나에 매달려 있어, 그게 끊기면 조용함이 정상으로 읽힘 |
{:.hl-tbl}

값이 사라졌을 때 우는 것은 다섯째뿐입니다 — 넷을 전부 울리게 두면 수집이 한 번 끊길 때
알림 다섯이 쏟아져 원인이 묻힙니다. 그리고 호스트가 통째로 꺼진 순간은 다섯 다 못 알립니다 —
알림이 그 호스트 위 클러스터에서 돌기 때문이고, 그 구간은 밖에서 보는 감시의 몫입니다.

<!-- 캐러셀 B 자리 — 슬라이드 후보: 행0 지금 / 행1 열(온도 계단 실측) / 행4 저장(thin pool) / 마지막 = 디스코드 알림 실물(값·조치·패널 그림) -->

## 결과

- 세 신호가 각자의 저장소에 쌓이고 서로 건너갑니다 — 지금 초당 샘플 2,990 · 보유 시리즈 9만 1천(상한의 30%) · 거절 0
- 판과 알림과 배선이 전부 git에 있습니다 — 화면에서 고친 것은 재시작하면 사라지는 구조라, 바뀌는 길이 커밋 하나뿐입니다
- 안 볼 때는 알림 다섯이 폰으로 옵니다 — 지금 값과 할 일, 그 패널의 그림과 함께

## 남은 것

- **관측 파이프라인을 보는 판에는 알림이 없습니다** — 지표가 조용히 버려지는 일을 겪고 만든 판인데, 그 판 자체는 열어야 압니다
- **Grafana 상주 메모리가 limit의 82%입니다** — 판이 늘 때마다 따라 올라, 판을 더하기 전에 상한부터 올려야 합니다

## 쓴 것

Mimir · Loki · Tempo · Grafana · Alloy · MinIO · kube-state-metrics · node-exporter
{:.hl-more}

이 화면들 위에서 부하를 걸어 서비스의 용량을 쟀습니다.
{:.hl-more}
