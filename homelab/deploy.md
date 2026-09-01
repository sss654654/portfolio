---
layout: page
title: 배포
description: >
  Git 서버를 직접 세우고, 밖에서 미는 자격 없이 클러스터가 스스로 당겨가게 했습니다
permalink: /homelab/deploy/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

매니페스트도 인그레스 규칙도 다 서 있는데 앱 세 종이 뜨지 않았습니다 — **받아 올 이미지가 없었습니다.**
코드는 인터넷의 GitHub에 있고 이미지를 만들 곳도 둘 곳도 없어, 커밋에서 파드까지 오는 구간이 통째로 비어 있었습니다.

## 저장소 둘

|  | cgv-infra | cgv-onprem |
|---|---|---|
| 담긴 것 | 클러스터를 정의하는 매니페스트와 차트 | 앱 소스 셋 — queue-go · booking · frontend |
| 브랜치 | **`main` 하나** | **`dev` 추가.** 기본 브랜치도 dev |
| 그렇게 한 이유 | ArgoCD가 보는 브랜치가 곧 배포된 상태의 정의인데 클러스터가 하나뿐임. 환경 구분은 `environments/{dev,stg,prd}` 디렉터리가 이미 해서, 브랜치에 환경 이름을 또 쓰면 한 가지를 두 축이 가리킴 | 브랜치가 곧 **이미지 태그를 정하는 축.** `dev-15-17dcc495`의 앞부분이 그것이고, 레지스트리에 올리는 job은 dev에서만 생김 — 리뷰를 안 거친 이미지가 배포 후보와 같은 자리에 쌓이지 않음 |
| 클러스터가 받는 법 | ArgoCD가 매니페스트를 당겨감 | 노드가 레지스트리에서 이미지를 받아옴 |
| 쥐여 준 자격 | 저장소 읽기 하나 (`read_repository`) | 이미지 읽기 하나 (`read_registry`) |
{:.hl-two}

두 저장소 모두 **직접 push가 막혀 있고 MR로만 들어갑니다.** 설정만 걸어 두지 않고 빈 커밋을 밀어 실제로 거부되는지 확인했습니다 — 소유자도 예외가 없습니다. 합칠 때는 작업 커밋을 하나로 누른 뒤 이름표만 옮기므로 **MR 하나가 커밋 하나**로 남고, 되돌릴 일이 생기면 그 커밋 하나를 되돌리면 그 작업 전체가 돌아갑니다.

## 커밋에서 파드까지

<!-- 이 그림이 말할 것은 둘이다. (1) 위 표의 두 저장소가 실제로 다른 경로를 탄다
     (2) 실선이 전부 아래(클러스터)에서 위(밖)로 나간다 — 밖에서 안으로 미는 선이 없다.
     그래서 저장소 표를 먼저 읽은 뒤에 이 그림이 온다. 설명이 아니라 확인이 되도록. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<svg viewBox="0 0 760 380" role="img" aria-label="데스크탑에 GitLab의 두 저장소와 CI, 레지스트리가 있고, 격리망 안의 ArgoCD·image-updater·노드가 각각 그것들을 읽고 받아가는 방향으로 화살표가 그려진 그림">
  <defs>
    <marker id="hld-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".45"/>
    </marker>
  </defs>

  <!-- ── 위: 클러스터 밖 ── -->
  <rect class="hla-box" x="20" y="24" width="720" height="142" rx="6"/>
  <text class="hla-zone" x="36" y="44">데스크탑 · 클러스터 밖</text>

  <rect class="hla-inner" x="36" y="54" width="210" height="104" rx="4"/>
  <text class="hla-t" x="48" y="72">GitLab</text>

  <rect class="hla-inner" x="46" y="80" width="192" height="32" rx="3"/>
  <g opacity=".55" fill="none" stroke="currentColor" stroke-width="1.2">
    <circle cx="59" cy="90" r="2.4"/><circle cx="59" cy="102" r="2.4"/><path d="M59,92.4 L59,99.6"/>
  </g>
  <text class="hla-s2" x="74" y="100">cgv-onprem</text>

  <rect class="hla-inner" x="46" y="118" width="192" height="32" rx="3"/>
  <g opacity=".55" fill="none" stroke="currentColor" stroke-width="1.2">
    <circle cx="59" cy="128" r="2.4"/><circle cx="59" cy="140" r="2.4"/><path d="M59,130.4 L59,137.6"/>
  </g>
  <text class="hla-s2" x="74" y="138">cgv-infra</text>

  <rect class="hla-inner" x="290" y="78" width="150" height="56" rx="4"/>
  <path d="M302,100 L307,105 L316,94" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".55"/>
  <text class="hla-t" x="322" y="103">CI 5단</text>
  <text class="hla-s2" x="302" y="123">통과한 것만 다음으로</text>

  <rect class="hla-inner" x="490" y="78" width="230" height="56" rx="4"/>
  <g opacity=".55" fill="none" stroke="currentColor" stroke-width="1.2">
    <rect x="502" y="97" width="10" height="8"/><rect x="506" y="93" width="10" height="8"/>
  </g>
  <text class="hla-t" x="524" y="103">레지스트리</text>
  <text class="hla-s2" x="502" y="123">검증을 통과한 이미지</text>

  <line class="hla-ln" x1="242" y1="96" x2="286" y2="100" marker-end="url(#hld-arrow)"/>
  <line class="hla-ln" x1="444" y1="106" x2="486" y2="106" marker-end="url(#hld-arrow)"/>

  <!-- ── 아래에서 위로. 미는 선이 하나도 없다 ── -->
  <line class="hla-ln" x1="110" y1="278" x2="110" y2="164" marker-end="url(#hld-arrow)"/>
  <text class="hla-a" x="118" y="200">매니페스트를 읽는다</text>

  <polyline class="hla-ln" points="330,278 330,220 190,220 190,164" fill="none" marker-end="url(#hld-arrow)"/>
  <text class="hla-a" x="240" y="238">태그 한 줄을 되쓴다</text>

  <polyline class="hla-ln" points="400,278 400,220 600,220 600,140" fill="none" marker-end="url(#hld-arrow)"/>
  <text class="hla-a" x="410" y="238">새 태그를 본다</text>

  <line class="hla-ln" x1="690" y1="278" x2="690" y2="140" marker-end="url(#hld-arrow)"/>
  <text class="hla-a" x="682" y="196" text-anchor="end">이미지를 받는다</text>

  <!-- ── 아래: 격리망 안 ── -->
  <rect class="hla-box" x="20" y="252" width="720" height="104" rx="6"/>
  <text class="hla-zone" x="36" y="272">k3s 클러스터 · 격리망 안</text>

  <rect class="hla-inner" x="36" y="282" width="210" height="62" rx="4"/>
  <text class="hla-t" x="50" y="306">ArgoCD</text>
  <text class="hla-s2" x="50" y="326">git 과 클러스터를 맞춘다</text>

  <rect class="hla-inner" x="290" y="282" width="150" height="62" rx="4"/>
  <text class="hla-t" x="302" y="306">image-updater</text>
  <text class="hla-s2" x="302" y="326">레지스트리를 본다</text>

  <rect class="hla-inner" x="490" y="282" width="230" height="62" rx="4"/>
  <g opacity=".55" fill="none" stroke="currentColor" stroke-width="1.2">
    <rect x="502" y="298" width="6" height="10"/><rect x="510" y="298" width="6" height="10"/><rect x="518" y="298" width="6" height="10"/>
  </g>
  <text class="hla-t" x="532" y="306">노드 3대</text>
  <text class="hla-s2" x="502" y="326">containerd 가 받아온다</text>
</svg>
<figcaption>두 저장소가 서로 다른 경로로 클러스터를 만납니다. 실선은 전부 아래에서 위로 향합니다 — 밖에서 안으로 미는 선이 없습니다.</figcaption>
</figure>

## 정한 것

| 무엇을 | 고른 것 | 그렇게 한 이유 |
|---|---|---|
| Git 서버 자리 | 클러스터 밖 — 데스크탑의 도커 | 정본이 자기가 정의하는 대상 안에 살면 대상과 함께 무너짐. 다시 세울 근거가 무너진 것 안에 있으면 안 됨 |
| 이미지 이름 | 커밋마다 다르게 — `dev-15-17dcc495` | 이름을 고정하면 매니페스트가 안 변해 배포를 시킬 방법이 없음. 파드를 갈려면 파이프라인이 클러스터에 직접 명령해야 하고, 그러면 클러스터 자격이 밖으로 나감 |
| 무엇을 막나 | 코드·자격은 조건 없이. 이미지 취약점은 **수정판이 나온 것만** | 베이스 이미지를 훑으면 아직 패치가 없는 것이 수십 개 나옴. 손쓸 수 없는 것으로 막으면 파이프라인이 영구히 빨간불이 되고 결국 게이트를 끄게 됨 |
| 노드가 쓸 자격 | 프로젝트 전용 토큰, 이미지 읽기 하나 | 내 계정 토큰은 내가 닿는 모든 프로젝트에 통함. 노드에 필요한 것은 그 프로젝트의 이미지를 받는 권한뿐 |
| 태그를 되쓰는 주체 | 클러스터 안에서 도는 도구 | 파이프라인이 고치면 배포 정의 저장소에 대한 쓰기 자격이 클러스터 밖으로 나감. 안에서 도는 쪽이 쓰면 밖으로 나가는 자격이 안 늘어남 |
{:.hl-dec}

이 검사를 처음 켠 판에서 취약점 **72건**이 나왔습니다. 서비스마다 원인이 달랐습니다.

```
queue-go    2건    직접 import 한 적 없는 간접 의존 — 다른 라이브러리가 딸고 들어옴
booking    37건    부모 POM 하나가 수백 개 라이브러리의 버전을 정하는데 그 부모가 낡음
frontend   33건    베이스 이미지가 업스트림이 더 굽지 않는 태그 — 새로 받아도 같은 것이 옴
```

셋 다 **고정해 둔 것이 시간이 지나 낡은 것**입니다. 코드가 안 바뀌었으니 아무 신호가 없었고, 스캔이 처음으로 그 시간을 드러냈습니다. 지금은 0건입니다.

## 막힌 자리

| 증상 | 원인 | 조치 |
|---|---|---|
| 데스크탑에서 하루 열 번씩 뭔가가 죽음 — GitLab·브라우저·편집기가 번갈아 | Windows가 약속할 수 있는 메모리 총량이 **17.9GB**에 묶여 있었음. 디스크를 비우려고 페이지파일을 2GB로 고정해 둔 옛 설정이 남아 있었던 것 — **물리 메모리가 6.6GB 남아 있어도 새 요청이 거절됨** | 페이지파일을 12GB로. 총량 28GB. 램은 한 장도 안 바꿈 |
| 이미지 스캔 job 둘이 잠금 대기로 죽음 | 스캐너가 취약점 DB를 지키려고 캐시 디렉터리에 잠금을 검. 세 job이 한 캐시를 공유하는데 같은 판에 동시 실행 수를 2로 올림 — 동시성이 숨어 있던 공유 자원을 드러냄 | job 이름별로 캐시 폴더를 가름. 대가는 DB가 여러 벌이 되는 디스크 |
| 의존성 검사가 `429 Too Many Requests` | 검사 대상에 Java 쪽이 있어 라이브러리 버전을 공용 저장소에 물어야 했는데, 같은 공인 주소에서 빌드가 판마다 의존성 수백 개를 받고 있었음. 서버 눈에는 전부 한 명 | 원격 조회 없이 판정되는 쪽으로 대상을 좁힘. Java는 만들어진 이미지를 여는 검사가 대신 봄 |
{:.hl-tbl}

## 결과

코드를 고쳐 머지한 다음부터는 사람 손이 없습니다.

- 파이프라인이 **다섯 단**을 돌고, 통과한 것만 이미지가 되어 레지스트리에 섭니다
- 클러스터 안 도구가 그 새 이름을 **배포 정의에 커밋으로 되씁니다** — 작성자가 봇으로 찍혀 사람과 갈립니다
- ArgoCD가 그 커밋을 읽어 파드를 교체하고, 노드는 자기 몫 자격으로 이미지를 받아옵니다
- **지금 무엇이 도는지가 git에 적혀 있습니다.** 되돌리는 것은 이전 태그로 되돌리는 커밋 하나입니다
- 파이프라인이 캐시가 채워진 판에서 **1분 54초**입니다 — 다섯 단으로 처음 재편했을 때가 10분 15초였습니다
- 클러스터 밖 어디에도 **클러스터를 조작할 자격이 없습니다**

## 남은 것

**테스트 칸이 비어 있습니다.** 자리는 선언해 뒀지만 도는 job이 없습니다 — 저장소에 돌릴 테스트가 0개입니다. 코드만 읽고 쓰면 통과만 하는 테스트가 되기 쉬워, 앱을 띄우고 동작을 보면서 쓰기로 미뤘습니다. 그래서 지금 이 파이프라인이 보장하는 것은 빌드와 보안 검사까지고, 합쳐진 결과가 실제로 도는지는 아닙니다.

**러너가 데스크탑의 도커 소켓을 물고 있습니다.** 그 소켓으로는 빌드만이 아니라 그 데몬이 할 수 있는 전부를 부를 수 있어, 소켓을 쥔 쪽은 사실상 그 기계의 관리자입니다. 빌드마다 데몬을 새로 띄우는 격리된 방식은 메모리가 더 들고 캐시도 매번 사라져, 지금 조건에서는 이 상태를 받아들였습니다.

## 쓴 것

GitLab CE · GitLab Runner · Docker · Trivy · gitleaks · SpotBugs · ArgoCD · argocd-image-updater
{:.hl-more}

파이프라인은 job마다 컨테이너를 새로 띄워 돌리고, 언어마다 다른 빌드 절차는 각 서비스의 Dockerfile이 품습니다. 배포된 것이 실제로 어떻게 도는지는 관측이 답합니다.
{:.hl-more}
