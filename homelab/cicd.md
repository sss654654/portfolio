---
layout: page
title: CI/CD
description: >
  Git 서버를 직접 세우고, 밖에서 미는 자격 없이 클러스터가 스스로 당겨가게 했습니다
permalink: /homelab/cicd/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

매니페스트도 인그레스 규칙도 다 서 있는데 앱 세 종이 뜨지 않았습니다 — **받아 올 이미지가 없었습니다.**
GitHub은 인터넷에 있어 사설망 안의 ArgoCD를 부를 수 없습니다. Git 서버를 같은 망에 세우되 **클러스터 밖 데스크탑**에 뒀습니다 — 클러스터를 다시 세울 근거가 그 클러스터 안에 있으면 안 됩니다.

## 저장소 둘

|  | cgv-infra | cgv-onprem |
|---|---|---|
| 무엇이 담겼나 | ArgoCD가 읽는 **배포 정의** | 이미지가 되는 **앱 소스** 세 종 |
| 브랜치 | `main` 하나 — 클러스터가 하나뿐이라 나눠도 볼 대상이 없음. 환경은 `environments/{dev,stg,prd}` 디렉터리가 가름 | `dev` 추가 — 브랜치가 이미지 태그의 앞부분이 됨. 레지스트리에 올리는 job은 dev에서만 생김 |
| 파이프라인 | 없음 — 빌드할 것이 없음 | **다섯 단 13 job.** 통과해야 머지 버튼이 열림 |
| webhook | **있음** — push하면 GitLab이 ArgoCD를 부름 | **없음** — ArgoCD가 이 저장소를 안 읽음 |
| 쥐여 준 자격 | 저장소 읽기 전용 하나 | 이미지 읽기 전용 — **노드 몫과 봇 몫을 따로** |
{:.hl-two}

둘 다 직접 push가 막혀 MR로만 들어갑니다.

## 커밋에서 파드까지

<!-- CI 다섯 단을 펼쳐 러너 안에 두고, CD 는 아래에서 위로 오는 선 넷으로 둔다.
     주황은 이미지가 가는 길, 파랑은 배포 정의가 가는 길.  image-updater 에서 색이 바뀌고,
     그 자리가 CI 와 CD 를 잇는 지점이다. 아래에서 위로 가는 선만 있다. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<svg viewBox="0 0 760 562" role="img" aria-label="데스크탑에 GitLab 저장소 둘과 다섯 단 파이프라인을 도는 러너, 레지스트리가 있고, 격리망 안의 ArgoCD·image-updater·노드가 각각 그것들을 읽고 받아가는 그림">
  <defs>
    <marker id="hlm-img" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="#f08c2e"/>
    </marker>
    <marker id="hlm-def" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="#2f6fdb"/>
    </marker>
  </defs>

  <!-- ══════ 위 · 클러스터 밖 ══════ -->
  <rect class="hla-box" x="20" y="30" width="720" height="300" rx="6"/>
  <text class="hla-zone" x="36" y="52">데스크탑 · 클러스터 밖</text>

  <rect class="hla-inner" x="36" y="64" width="240" height="112" rx="4"/>
  <text class="hla-c" x="50" y="84">GitLab</text>
  <rect class="hla-inner" x="46" y="92" width="220" height="34" rx="3"/>
  <g class="hla-glyph" transform="translate(58,100)">
    <circle cx="4" cy="4" r="3"/><circle cx="4" cy="14" r="3"/><path d="M4,7 L4,11"/>
  </g>
  <text class="hla-s2" x="80" y="114">cgv-onprem</text>
  <rect class="hla-inner" x="46" y="132" width="220" height="34" rx="3"/>
  <g class="hla-glyph" transform="translate(58,140)">
    <circle cx="4" cy="4" r="3"/><circle cx="4" cy="14" r="3"/><path d="M4,7 L4,11"/>
  </g>
  <text class="hla-s2" x="80" y="154">cgv-infra</text>

  <rect class="hla-inner" x="310" y="64" width="412" height="192" rx="4"/>
  <text class="hla-c" x="324" y="84">러너 — 13 job, 저마다 컨테이너를 새로 띄운다</text>

  <rect class="hla-inner" x="322" y="92" width="388" height="30" rx="3"/>
  <text class="hla-t" x="334" y="112">check</text>
  <text class="hla-s2" x="416" y="112">자격이 섞였나 · 정적 결함 · 낡은 의존성</text>
  <text class="hla-s2" x="626" y="112">조건 없이 막음</text>

  <rect class="hla-inner" x="322" y="126" width="388" height="30" rx="3"/>
  <text class="hla-t" x="334" y="146">test</text>
  <text class="hla-s2" x="416" y="146">비어 있다</text>

  <rect class="hla-inner" x="322" y="160" width="388" height="30" rx="3"/>
  <text class="hla-t" x="334" y="180">build</text>
  <text class="hla-s2" x="416" y="180">이미지를 만든다. 올리지는 않는다</text>

  <rect class="hla-inner" x="322" y="194" width="388" height="30" rx="3"/>
  <text class="hla-t" x="334" y="214">scan</text>
  <text class="hla-s2" x="416" y="214">만든 이미지 안의 취약점</text>
  <text class="hla-s2" x="602" y="214">수정판이 있는 것만 막음</text>

  <rect class="hla-inner" x="322" y="228" width="388" height="30" rx="3"/>
  <text class="hla-t" x="334" y="248">publish</text>
  <text class="hla-s2" x="416" y="248">레지스트리로 올린다</text>
  <text class="hla-s2" x="642" y="248">dev 에서만</text>

  <rect class="hla-inner" x="310" y="270" width="412" height="46" rx="4"/>
  <g class="hla-glyph" transform="translate(324,284)">
    <rect x="0" y="4" width="11" height="9"/><rect x="4" y="0" width="11" height="9"/>
  </g>
  <text class="hla-t" x="350" y="292">레지스트리</text>
  <text class="hla-s2" x="350" y="308">dev-15-17dcc495 — 커밋마다 다른 이름</text>

  <line class="hla-ln-img" x1="270" y1="109" x2="304" y2="109" marker-end="url(#hlm-img)" fill="none"/>
  <text class="hla-a" x="272" y="100">push</text>
  <line class="hla-ln-img" x1="516" y1="258" x2="516" y2="266" marker-end="url(#hlm-img)" fill="none"/>

  <!-- ══════ 아래에서 위로만 간다 ══════ -->
  <line class="hla-ln-def" x1="120" y1="414" x2="120" y2="182" marker-end="url(#hlm-def)" fill="none"/>
  <text class="hla-a" x="128" y="350">매니페스트를 읽는다</text>

  <polyline class="hla-ln-def" points="350,414 350,372 200,372 200,182" marker-end="url(#hlm-def)" fill="none"/>
  <text class="hla-a" x="252" y="392">태그 한 줄을 되쓴다</text>

  <line class="hla-ln-img" x1="404" y1="414" x2="404" y2="322" marker-end="url(#hlm-img)" fill="none"/>
  <text class="hla-a" x="412" y="352">새 태그를 본다</text>

  <line class="hla-ln-img" x1="620" y1="414" x2="620" y2="322" marker-end="url(#hlm-img)" fill="none"/>
  <text class="hla-a" x="628" y="352">이미지를 받는다</text>

  <!-- ══════ 아래 · 격리망 안 ══════ -->
  <rect class="hla-box" x="20" y="418" width="720" height="112" rx="6"/>
  <text class="hla-zone" x="36" y="440">k3s 클러스터 · 격리망 안</text>

  <rect class="hla-inner" x="36" y="450" width="240" height="66" rx="4"/>
  <g class="hla-glyph" transform="translate(50,466)">
    <path d="M12,3 A6,6 0 1 0 14,8"/><path d="M14,1 L14,5 L10,5"/>
  </g>
  <text class="hla-t" x="76" y="478">ArgoCD</text>
  <text class="hla-s2" x="50" y="498">git 대로 클러스터를 맞춘다</text>

  <rect class="hla-inner" x="310" y="450" width="180" height="66" rx="4"/>
  <text class="hla-t" x="324" y="478">image-updater</text>
  <text class="hla-s2" x="324" y="498">CI 와 CD 를 잇는다</text>

  <rect class="hla-inner" x="524" y="450" width="198" height="66" rx="4"/>
  <g class="hla-glyph" transform="translate(538,468)">
    <rect x="0" y="0" width="5" height="11"/><rect x="8" y="0" width="5" height="11"/><rect x="16" y="0" width="5" height="11"/>
  </g>
  <text class="hla-t" x="566" y="478">노드 3대</text>
  <text class="hla-s2" x="538" y="498">containerd 가 받는다</text>

  <circle class="hla-dot-g" cx="40" cy="550" r="4"/>
  <text class="hla-a" x="52" y="554">이미지가 가는 길</text>
  <circle class="hla-dot-v" cx="196" cy="550" r="4"/>
  <text class="hla-a" x="208" y="554">배포 정의가 가는 길</text>
</svg>
<figcaption>주황이 파랑으로 바뀌는 자리가 image-updater입니다. 그리고 아래에서 위로 가는 선만 있습니다.</figcaption>
</figure>

## 정한 것

| 정한 것 | 그렇게 한 이유 |
|---|---|
| 이미지 이름을 커밋마다 다르게 — `dev-15-17dcc495` | 고정하면 `tag:` 줄이 안 변해 ArgoCD가 할 일이 없어짐. 파드를 갈려면 밖에서 클러스터에 명령해야 하고, 그러면 클러스터 전권 자격이 밖에 있어야 함 |
| 태그를 되쓰는 쪽을 클러스터 안에 | 파이프라인이 그 줄을 고치면 배포 정의 저장소에 대한 쓰기 자격이 클러스터 밖으로 나감 |
| 노드가 쓸 자격을 이미지 읽기 하나로 | 내 계정 토큰은 내가 닿는 모든 프로젝트에 통함. 노드에 필요한 것은 그 프로젝트의 이미지를 받는 권한뿐 |
| 이미지 취약점만 조건부 게이트 | 베이스 이미지에는 아직 패치가 없는 것이 수십 개 있음. 손쓸 수 없는 것으로 막으면 파이프라인이 영구히 빨간불이 되고 결국 게이트를 끄게 됨 |
| 폴링 위에 webhook | webhook만 믿으면 네 번 연속 실패했을 때 GitLab이 스스로 끄는데 알려 주지 않음. 폴링이 그물로 남고, 평소 반영은 3분에서 **3초** |
{:.hl-why}

## 취약점 72건 → 0

게이트를 처음 켠 판에서 나온 수입니다. 원인이 서비스마다 달랐습니다.

```
queue-go    2건    직접 import 한 적 없는 간접 의존 — 다른 라이브러리가 딸고 들어옴
booking    37건    부모 POM 하나가 수백 개 라이브러리의 버전을 정하는데 그 부모가 낡음
frontend   33건    베이스 이미지가 업스트림이 더 굽지 않는 태그 — 새로 받아도 같은 것이 옴
```

셋 다 **고정해 둔 것이 낡은 것**입니다. 코드가 안 바뀌어 아무 신호가 없었습니다.

## 막힌 자리

| 증상 | 원인 | 조치 |
|---|---|---|
| 데스크탑에서 하루 열 번씩 뭔가가 죽음 — GitLab·브라우저·편집기가 번갈아 | Windows가 약속할 수 있는 메모리 총량이 **17.9GB**에 묶여 있었음. 디스크를 비우려고 페이지파일을 2GB로 고정해 둔 옛 설정 — **물리 메모리가 6.6GB 남아 있어도 새 요청이 거절됨** | 페이지파일 12GB. 총량 **28GB**. 램은 한 장도 안 바꿈 |
| 이미지 스캔 job 둘이 잠금 대기로 죽음 | 스캐너가 취약점 DB를 지키려고 캐시 디렉터리에 잠금을 검. 세 job이 한 캐시를 공유하는데 같은 판에 동시 실행 수를 2로 올림 | job 이름별로 캐시 폴더를 가름. 대가는 DB가 네 벌이 되는 **8.5GB** |
| 파이프라인 한 판이 **10분 15초** | 판마다 같은 것을 다시 받는데, 같은 다운로드가 **두 방에서** 일어남 — lint는 job 컨테이너 안에서, build는 소켓 너머 데스크탑 데몬에서 | 방마다 캐시를 따로 둠. **열네 판째 1분 54초** |
{:.hl-tbl}

## 결과

- **앱 세 종이 처음으로 떴습니다** — 배선을 세운 이래 받아 올 이미지가 없어 멈춰 있던 파드들입니다
- 코드를 머지하면 사람 손 없이 파드까지 갑니다. **지금 무엇이 도는지가 git에 적혀 있고**, 되돌리는 것은 커밋 하나입니다
- 파이프라인이 **1분 54초**, 반영이 **3초**입니다
- 클러스터 밖 어디에도 **클러스터를 조작할 자격이 없습니다**

## 남은 것

- **테스트 칸이 비어 있습니다** — 저장소에 돌릴 테스트가 0개라 자리만 선언해 뒀습니다. 지금 보장하는 것은 빌드와 보안 검사까지고, 합쳐진 결과가 도는지는 아닙니다
- **러너가 데스크탑의 도커 소켓을 물고 있습니다** — 그 소켓을 쥔 쪽은 사실상 그 기계의 관리자입니다. 격리된 방식은 빌드마다 데몬을 새로 띄우느라 메모리가 더 듭니다

## 쓴 것

GitLab CE · GitLab Runner · Docker · Trivy · gitleaks · SpotBugs · ArgoCD · argocd-image-updater
{:.hl-more}

러너는 job마다 컨테이너를 새로 띄워 돌리고, 언어마다 다른 빌드 절차는 각 서비스의 Dockerfile이 품습니다. 배포된 것이 실제로 어떻게 도는지는 관측이 답합니다.
{:.hl-more}
