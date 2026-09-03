---
layout: page
title: CI/CD
description: >
  머지하면 검증과 빌드를 거쳐 이미지가 되고, 클러스터가 그것을 가져가 파드를 교체합니다
permalink: /homelab/cicd/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

클러스터는 준비됐지만 앱은 뜨지 못했습니다 — **받아 올 이미지가 없었습니다.**

## CI/CD 구조

<!-- 왼쪽 열 = 이미지가 만들어지는 길(주황), 오른쪽 = 배포 정의가 도는 길(파랑).
     cgv-infra 를 오른쪽 하단에 두어 연결선이 전부 짧은 직선이 되게 했다.
     번호가 커밋에서 파드까지의 순서. 실선은 전부 클러스터가 밖으로 나가 가져오는 것이고,
     위에서 아래로 가는 것은 webhook 점선 하나 — 알림만 실린다. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<svg viewBox="0 0 760 556" role="img" aria-label="왼쪽 열에서 cgv-onprem 이 러너 다섯 단을 지나 레지스트리에 이미지로 서고, 오른쪽에서 image-updater 가 cgv-infra 의 tag 줄을 바꿔 ArgoCD 가 읽는다. 번호가 커밋에서 파드까지의 순서">
  <defs>
    <marker id="hlm-i" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#f08c2e"/></marker>
    <marker id="hlm-d" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#2f6fdb"/></marker>
    <marker id="hlm-n" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/></marker>
  </defs>

  <rect class="hla-box" x="18" y="26" width="724" height="318" rx="6"/>
  <text class="hla-zone" x="34" y="48">데스크탑 · 클러스터 밖</text>

  <rect class="hla-inner" x="34" y="58" width="692" height="274" rx="5"/>
  <image href="/assets/img/icons/gitlab.svg" x="46" y="66" width="20" height="20"/>
  <text class="hla-c" x="72" y="82">GitLab</text>

  <rect class="hla-inner" x="48" y="92" width="330" height="34" rx="3"/>
  <text class="hla-t" x="62" y="114">cgv-onprem</text>
  <text class="hla-s2" x="170" y="114">앱 소스 세 종</text>

  <line class="hla-ln-img" x1="140" y1="126" x2="140" y2="144" marker-end="url(#hlm-i)" fill="none"/>
  <circle class="hla-num" cx="164" cy="135" r="9"/><text class="hla-nt" x="164" y="139">1</text>
  <text class="hla-a" x="180" y="139">push</text>

  <rect class="hla-inner" x="48" y="148" width="330" height="120" rx="4"/>
  <text class="hla-c" x="60" y="166">GitLab Runner</text>
  <text class="hla-t" x="60" y="186">check</text><text class="hla-s2" x="124" y="186">gitleaks · trivy fs · go vet · SpotBugs</text>
  <text class="hla-t" x="60" y="204">test</text><text class="hla-s2" x="124" y="204">동시 50 요청에도 입장 정원 유지 · 좌석 정규화</text>
  <text class="hla-t" x="60" y="222">build</text><text class="hla-s2" x="124" y="222">서비스마다 멀티스테이지 Dockerfile</text>
  <text class="hla-t" x="60" y="240">scan</text><text class="hla-s2" x="124" y="240">trivy image — 수정판이 있는 것만 막음</text>
  <text class="hla-t" x="60" y="258">publish</text><text class="hla-s2" x="124" y="258">dev 브랜치에서만 job 이 생김</text>

  <line class="hla-ln-img" x1="140" y1="268" x2="140" y2="282" marker-end="url(#hlm-i)" fill="none"/>
  <circle class="hla-num" cx="164" cy="275" r="9"/><text class="hla-nt" x="164" y="279">2</text>
  <text class="hla-a" x="180" y="279">통과한 것만</text>

  <rect class="hla-inner" x="48" y="286" width="330" height="46" rx="3"/>
  <g class="hla-glyph" transform="translate(58,294)">
    <rect x="0" y="4" width="11" height="9"/><rect x="4" y="0" width="11" height="9"/>
  </g>
  <text class="hla-t" x="84" y="306">레지스트리</text>
  <text class="hla-s2" x="58" y="324">dev-15-17dcc495 — 커밋마다 다른 이름</text>

  <rect class="hla-inner" x="420" y="210" width="292" height="122" rx="3"/>
  <text class="hla-t" x="434" y="232">cgv-infra</text>
  <text class="hla-s2" x="520" y="232">배포 정의</text>
  <rect class="hla-inner" x="432" y="244" width="268" height="54" rx="3"/>
  <text class="hla-s2" x="444" y="262">environments/dev/values-queue.yaml</text>
  <text class="hla-s2" x="444" y="282">image.tag: dev-15-17dcc495</text>
  <text class="hla-a" x="434" y="320">이 한 줄이 바뀌면 배포가 일어난다</text>

  <!-- 연결부 — 위쪽 끝 y=338, 아래쪽 끝 y=444(상자 윗변). 번호 원 y=358, 라벨 y=392 한 줄.
       6 번 라벨은 5 번 세로선(x=592)을 넘지 않도록 오른쪽 끝에 붙인다. -->
  <line class="hla-ln-img" x1="140" y1="444" x2="140" y2="338" marker-end="url(#hlm-i)" fill="none"/>
  <circle class="hla-num" cx="140" cy="358" r="9"/><text class="hla-nt" x="140" y="362">7</text>
  <text class="hla-a" x="150" y="392">이미지를 받는다</text>

  <line class="hla-ln-img" x1="330" y1="444" x2="330" y2="338" marker-end="url(#hlm-i)" fill="none"/>
  <circle class="hla-num" cx="330" cy="358" r="9"/><text class="hla-nt" x="330" y="362">3</text>
  <text class="hla-a" x="340" y="392">새 태그를 본다</text>

  <line class="hla-ln-def" x1="450" y1="444" x2="450" y2="338" marker-end="url(#hlm-d)" fill="none"/>
  <circle class="hla-num" cx="450" cy="358" r="9"/><text class="hla-nt" x="450" y="362">4</text>
  <text class="hla-a" x="460" y="392">tag 줄을 커밋한다</text>

  <line class="hla-ln" x1="560" y1="338" x2="560" y2="444" stroke-dasharray="4 4" marker-end="url(#hlm-n)" fill="none"/>
  <circle class="hla-num" cx="560" cy="358" r="9"/><text class="hla-nt" x="560" y="362">5</text>
  <text class="hla-a" x="570" y="424">webhook — 3초</text>

  <line class="hla-ln-def" x1="700" y1="444" x2="700" y2="338" marker-end="url(#hlm-d)" fill="none"/>
  <circle class="hla-num" cx="700" cy="358" r="9"/><text class="hla-nt" x="700" y="362">6</text>
  <text class="hla-a" x="690" y="384" text-anchor="end">배포 정의를 읽는다</text>

  <rect class="hla-box" x="18" y="412" width="724" height="104" rx="6"/>
  <text class="hla-zone" x="34" y="434">k3s 클러스터 · 격리망 안</text>

  <rect class="hla-inner" x="34" y="444" width="230" height="60" rx="4"/>
  <image href="/assets/img/icons/kubernetes.svg" x="46" y="456" width="18" height="18"/>
  <text class="hla-t" x="70" y="470">노드 3대</text>
  <text class="hla-s2" x="46" y="492">containerd 가 받는다</text>

  <rect class="hla-inner" x="292" y="444" width="206" height="60" rx="4"/>
  <image href="/assets/img/icons/argo.svg" x="304" y="456" width="18" height="18"/>
  <text class="hla-t" x="328" y="470">argocd-image-updater</text>
  <text class="hla-s2" x="304" y="492">새 태그를 git 에 되쓴다</text>

  <rect class="hla-inner" x="520" y="444" width="206" height="60" rx="4"/>
  <image href="/assets/img/icons/argo.svg" x="532" y="456" width="18" height="18"/>
  <text class="hla-t" x="556" y="470">ArgoCD</text>
  <text class="hla-s2" x="532" y="492">git 대로 파드를 맞춘다</text>

  <circle class="hla-dot-g" cx="36" cy="536" r="4"/>
  <text class="hla-a" x="48" y="540">이미지</text>
  <circle class="hla-dot-v" cx="124" cy="536" r="4"/>
  <text class="hla-a" x="136" y="540">배포 정의</text>
  <text class="hla-a" x="232" y="540">점선 — 알림만. 배포 내용은 안 실린다</text>
</svg>
<figcaption>번호가 커밋에서 파드까지의 순서입니다. 왼쪽 열이 이미지가 만들어지는 길, 오른쪽이 배포 정의가 도는 길이고, 실선은 전부 클러스터가 밖으로 나가 가져오는 것입니다.</figcaption>
</figure>

## GitLab의 두 저장소

|  | cgv-infra · 배포 정의 | cgv-onprem · 앱 소스 |
|---|---|---|
| 브랜치 | **`main` 하나** — ArgoCD가 보는 브랜치가 곧 배포 상태. 환경은 `environments/` 아래 디렉터리로 가름 | **`dev` 기본 · `main`** — 이미지 태그 앞부분이 브랜치 이름(`dev-15-…`). stg·prd가 생기면 여기서 갈림 |
| 파이프라인 | 없음 — 빌드할 것이 없음 | **다섯 단** — 바뀐 서비스 job만 뜸. 데스크탑 러너가 돌리고 통과해야 머지 버튼이 열림 |
| 발급한 자격 | 저장소 자격 **하나** — ArgoCD의 매니페스트 읽기와 image-updater의 태그 쓰기에 공용 | deploy token **둘** (`read_registry`) — 노드의 이미지 받기와 봇의 태그 조회를 따로 |
| webhook | **있음** — push하면 GitLab이 ArgoCD를 부름 | **없음** |
{:.hl-two}

## 정한 것

| 무엇을 | 고른 것 | 그렇게 한 이유 |
|---|---|---|
| Git 서버 자리 | **클러스터 밖 데스크탑** — 러너도 같이 | GitHub은 사설망 안 ArgoCD를 못 부르고, 클러스터 안은 클러스터와 함께 무너짐. 러너도 밖 — 빌드 I/O가 부하 실측을 흔듦 |
| 취약점 게이트(scan) | **수정판이 나온 취약점만** 머지 차단 | 패치가 안 나온 CVE가 수십 개 — 그것까지 막으면 늘 빨간불이라 게이트 자체가 무력해짐 |
| 배포 방식 | **CI와 CD를 분리** — 파이프라인은 이미지까지, 배포는 클러스터 안 ArgoCD가 | 파이프라인이 배포까지 하려면 클러스터 전권 자격이 필요 — 갈라 두면 그 자격이 클러스터 안에만 남음 |
| 배포 권한 | **AppProject** — 배포 단위마다 읽을 저장소·쓸 네임스페이스·만들 리소스를 제한 | ArgoCD는 클러스터 관리자 권한으로 동작 — 제한이 없으면 `Application` 하나의 실수로 무엇이든 생김 |
{:.hl-dec}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| 취약점 스캔을 처음 켜자 **72건** | 셋 다 **버전을 고정해 두고 오래 안 건드린 것** — 간접 의존 2건 · Spring Boot 부모 버전 37건 · 갱신이 멈춘 nginx 베이스 33건 | 간접 의존 상향 · 부모 버전 교체 · 베이스 이미지 이동. **0건** |
| 파이프라인 한 판에 **10분 15초** | 판마다 같은 의존성과 취약점 DB를 다시 받음. `lint`는 job 컨테이너가, `build`는 데스크탑 도커가 받아 **캐시가 두 곳으로 갈림** | 러너 볼륨과 Dockerfile 캐시 마운트로 **양쪽 다** 남김. 열네 판째 **1분 54초** |
| 데스크탑에서 하루 열 번씩 GitLab·브라우저·편집기가 번갈아 죽음. 메모리 부족으로 보고 **램을 주문** | 물리 메모리는 **6.6GB 여유** — 진짜 천장은 Windows의 커밋 한도 **17.9GB**였고, 페이지파일 2GB 고정이 그 값의 상한 | 페이지파일을 12GB로. 한도 **28GB**. 램은 한 장도 안 바꾸고 **주문은 취소** |
{:.hl-tbl}

## 결과

- Git 서버가 GitHub에서 **데스크탑의 GitLab CE**로 옮겨지고, 러너와 레지스트리가 한자리에 섰습니다
- 두 저장소 모두 **머지가 곧 배포입니다** — 앱은 CI와 이미지를 거쳐, 배포 정의는 바로. 커밋 뒤 `kubectl`을 칠 일이 없습니다
- 커밋에서 클러스터 반영까지 최대 3분 폴링이던 것이 **3초**가 됐습니다
- **앱 세 종이 처음으로 떴습니다** — 이미지가 없어 멈춰 있던 파드들입니다

## 남은 것

- **자동화를 잇는 토큰 셋이 같은 날 만료됩니다** — 이미지 받기·태그 되쓰기·배포 정의 읽기가 그날 함께 멈추는데, 만료를 미리 알려 줄 장치가 없습니다
- **환경이 dev 하나입니다** — stg·prd는 자원이 큰 서버에 설 다음 자리라 배포 정의에 골격만 있고, 환경이 서면 검증된 이미지를 올리는 승격 절차부터 필요합니다

## 쓴 것

GitLab CE · GitLab Runner · Docker · Trivy · gitleaks · SpotBugs · ArgoCD · argocd-image-updater
{:.hl-more}

배포된 것이 실제로 어떻게 도는지는 관측이 답합니다.
{:.hl-more}

{% include hl-nav.html %}
