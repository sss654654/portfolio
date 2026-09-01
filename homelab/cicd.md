---
layout: page
title: CI/CD
description: >
  Git 서버를 직접 세우고, 밖에서 미는 자격 없이 클러스터가 스스로 당겨가게 했습니다
permalink: /homelab/cicd/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

매니페스트도 인그레스 규칙도 다 서 있는데 앱 세 종이 뜨지 않았습니다 — **받아 올 이미지가 없었습니다.**
클러스터 밖 데스크탑에 GitLab을 세우고 저장소 둘을 옮겼습니다.

## 저장소 둘을 다르게 다뤘다

|  | cgv-infra · 배포 정의 | cgv-onprem · 앱 소스 |
|---|---|---|
| 브랜치 | **`main` 하나** — ArgoCD가 보는 브랜치가 곧 배포된 상태인데 클러스터가 하나뿐임. 환경은 `environments/{dev,stg,prd}` 디렉터리가 가름 | **`dev` 기본 · `main`** — 이미지 태그의 앞부분이 브랜치 이름(`dev-15-…`). stg·prd가 생기면 여기서 갈림 |
| 파이프라인 | 없음 — 빌드할 것이 없음 | **다섯 단 13 job.** 데스크탑 러너가 돌리고, 통과해야 머지 버튼이 열림 |
| 발급한 토큰 | 저장소 자격 **하나** — ArgoCD가 읽고, image-updater가 그것으로 되씀 | deploy token **둘** (`read_registry`) — 노드용·봇용을 따로 |
| webhook | **있음** — push하면 GitLab이 ArgoCD를 부름 | **없음** |
{:.hl-two}

## 정한 것

| 정한 것 | 그렇게 한 이유 |
|---|---|
| Git 서버와 러너를 **클러스터 밖 데스크탑**에 | GitHub은 인터넷에 있어 사설망 안의 ArgoCD를 부를 수 없고, 클러스터 안에 세우면 클러스터가 무너질 때 다시 세울 근거도 함께 사라짐. 러너까지 여기 둔 것은 노드 셋이 USB SSD 한 장을 나눠 쓰기 때문 — 빌드가 그 디스크를 쓰면 나중에 부하를 걸어 잰 숫자가 흔들림 |
| 이미지 빌드를 dind 대신 **데스크탑 도커 소켓**으로 | dind는 job마다 도커 데몬을 새로 띄워 메모리가 더 들고, 레이어 캐시가 job이 끝날 때 같이 사라짐. 대가는 job이 그 소켓으로 데스크탑 도커 전체를 부를 수 있게 되는 것 |
| 검사가 실패하면 무조건 막되, **이미지 취약점만 예외** — 수정판이 나온 것만 막음 | 베이스 이미지에는 아직 패치가 안 나온 취약점이 수십 개 들어 있음. 그것까지 막으면 파이프라인이 늘 빨간불이라, 결국 게이트를 꺼 버리게 됨 |
| 새 이미지 이름을 배포 정의에 적는 일을 **클러스터 안 도구**가 하게 | 그 줄이 바뀌어야 ArgoCD가 파드를 새 이미지로 갈아 끼움. 파이프라인이 적으면 러너가 배포 정의 저장소의 쓰기 권한을 갖는데, 러너는 이미 데스크탑 도커 소켓을 쥐고 있어 권한을 더 주지 않음 |
{:.hl-why}

## CI/CD 구조

<!-- 번호가 커밋에서 파드까지의 순서다. 실선은 전부 클러스터가 밖으로 나가 가져오는 것이고,
     위에서 아래로 가는 것은 webhook 점선 하나 — 그것도 다시 읽어라 한 마디뿐이다.
     주황은 이미지가 가는 길, 파랑은 배포 정의가 가는 길. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<svg viewBox="0 0 760 600" role="img" aria-label="데스크탑의 GitLab 안에 저장소 둘과 레지스트리가 있고 GitLab Runner 가 다섯 단을 돈다. 격리망 안의 ArgoCD·image-updater·노드가 각각 읽고 받아가며, 번호가 커밋에서 파드까지의 순서를 나타낸다">
  <defs>
    <marker id="hlm-i" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#f08c2e"/></marker>
    <marker id="hlm-d" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#2f6fdb"/></marker>
    <marker id="hlm-n" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/></marker>
  </defs>

  <rect class="hla-box" x="18" y="26" width="724" height="330" rx="6"/>
  <text class="hla-zone" x="34" y="48">데스크탑 · 클러스터 밖</text>

  <rect class="hla-inner" x="34" y="58" width="692" height="286" rx="5"/>
  <image href="/assets/img/icons/gitlab.svg" x="46" y="66" width="20" height="20"/>
  <text class="hla-c" x="72" y="82">GitLab</text>

  <rect class="hla-inner" x="50" y="94" width="252" height="34" rx="3"/>
  <text class="hla-t" x="64" y="116">cgv-infra</text>
  <text class="hla-s2" x="150" y="116">배포 정의</text>

  <rect class="hla-inner" x="424" y="94" width="288" height="34" rx="3"/>
  <text class="hla-t" x="438" y="116">cgv-onprem</text>
  <text class="hla-s2" x="540" y="116">앱 소스 세 종</text>

  <rect class="hla-inner" x="340" y="150" width="372" height="130" rx="4"/>
  <text class="hla-c" x="352" y="168">GitLab Runner — 13 job</text>
  <text class="hla-t" x="352" y="192">check</text><text class="hla-s2" x="424" y="192">gitleaks · trivy fs · go vet · SpotBugs</text>
  <text class="hla-t" x="352" y="212">test</text><text class="hla-s2" x="424" y="212">동시 50 요청에 정원 유지 · 좌석 정규화</text>
  <text class="hla-t" x="352" y="232">build</text><text class="hla-s2" x="424" y="232">서비스마다 멀티스테이지 Dockerfile</text>
  <text class="hla-t" x="352" y="252">scan</text><text class="hla-s2" x="424" y="252">trivy image — 수정판이 있는 것만 막음</text>
  <text class="hla-t" x="352" y="272">publish</text><text class="hla-s2" x="424" y="272">dev 브랜치에서만 job 이 생김</text>

  <rect class="hla-inner" x="424" y="294" width="288" height="40" rx="3"/>
  <text class="hla-t" x="438" y="312">레지스트리</text>
  <text class="hla-s2" x="438" y="328">dev-15-17dcc495 — 커밋마다 다른 이름</text>

  <line class="hla-ln-img" x1="600" y1="132" x2="600" y2="146" marker-end="url(#hlm-i)" fill="none"/>
  <circle class="hla-num" cx="620" cy="139" r="9"/><text class="hla-nt" x="620" y="143">1</text>

  <line class="hla-ln-img" x1="600" y1="284" x2="600" y2="290" marker-end="url(#hlm-i)" fill="none"/>
  <circle class="hla-num" cx="620" cy="287" r="9"/><text class="hla-nt" x="620" y="291">2</text>

  <polyline class="hla-ln-img" points="470,466 470,412 560,412 560,340" marker-end="url(#hlm-i)" fill="none"/>
  <text class="hla-a" x="478" y="444">새 태그를 본다</text>
  <circle class="hla-num" cx="470" cy="432" r="9"/><text class="hla-nt" x="470" y="436">3</text>

  <polyline class="hla-ln-def" points="352,466 352,386 250,386 250,134" marker-end="url(#hlm-d)" fill="none"/>
  <text class="hla-a" x="262" y="378">tag 한 줄을 커밋한다</text>
  <circle class="hla-num" cx="352" cy="428" r="9"/><text class="hla-nt" x="352" y="432">4</text>

  <line class="hla-ln" x1="196" y1="134" x2="196" y2="462" stroke-dasharray="4 4" marker-end="url(#hlm-n)" fill="none"/>
  <text class="hla-a" x="204" y="448">webhook — 3초</text>
  <circle class="hla-num" cx="196" cy="428" r="9"/><text class="hla-nt" x="196" y="432">5</text>

  <line class="hla-ln-def" x1="112" y1="466" x2="112" y2="134" marker-end="url(#hlm-d)" fill="none"/>
  <text class="hla-a" x="104" y="392" text-anchor="end">읽는다</text>
  <circle class="hla-num" cx="112" cy="372" r="9"/><text class="hla-nt" x="112" y="376">6</text>

  <line class="hla-ln-img" x1="672" y1="466" x2="672" y2="340" marker-end="url(#hlm-i)" fill="none"/>
  <text class="hla-a" x="662" y="392" text-anchor="end">이미지를 받는다</text>
  <circle class="hla-num" cx="672" cy="372" r="9"/><text class="hla-nt" x="672" y="376">7</text>

  <rect class="hla-box" x="18" y="470" width="724" height="102" rx="6"/>
  <text class="hla-zone" x="34" y="490">k3s 클러스터 · 격리망 안</text>

  <rect class="hla-inner" x="34" y="498" width="252" height="60" rx="4"/>
  <image href="/assets/img/icons/argo.svg" x="46" y="510" width="18" height="18"/>
  <text class="hla-t" x="70" y="524">ArgoCD</text>
  <text class="hla-s2" x="46" y="546">git 대로 파드를 맞춘다</text>

  <rect class="hla-inner" x="300" y="498" width="212" height="60" rx="4"/>
  <text class="hla-t" x="312" y="524">image-updater</text>
  <text class="hla-s2" x="312" y="546">새 태그를 git 에 되쓴다</text>

  <rect class="hla-inner" x="526" y="498" width="200" height="60" rx="4"/>
  <image href="/assets/img/icons/kubernetes.svg" x="538" y="510" width="18" height="18"/>
  <text class="hla-t" x="562" y="524">노드 3대</text>
  <text class="hla-s2" x="538" y="546">containerd 가 받는다</text>

  <circle class="hla-dot-g" cx="36" cy="590" r="4"/>
  <text class="hla-a" x="48" y="594">이미지</text>
  <circle class="hla-dot-v" cx="124" cy="590" r="4"/>
  <text class="hla-a" x="136" y="594">배포 정의</text>
  <text class="hla-a" x="232" y="594">점선 — 알림만. 배포 내용은 안 실린다</text>
</svg>
<figcaption>번호가 커밋에서 파드까지의 순서입니다. 실선은 전부 클러스터가 밖으로 나가 가져오는 것이고, 위에서 아래로 가는 것은 점선 하나뿐입니다.</figcaption>
</figure>

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| 취약점 스캔을 처음 켜자 **72건** | 세 서비스 다 **버전을 고정해 두고 오래 안 건드린 것**이었음 — `queue-go`는 다른 라이브러리가 끌고 온 간접 의존 2건, `booking`은 Spring Boot 부모 버전이 낡아 37건, `frontend`는 업스트림이 갱신을 멈춘 nginx 베이스 이미지에서 33건 | 각각 간접 의존 상향 · 부모 버전 교체 · 베이스 이미지 이동. **0건** |
| 한 판에 **10분 15초** | 판마다 같은 의존성과 취약점 DB를 다시 받고 있었음. 캐시를 한 곳에만 두면 절반밖에 안 걸림 — `lint`는 job 컨테이너 안에서 받고, `build`는 소켓 너머 데스크탑 도커가 받아 **서로 다른 곳에 쌓임** | job 컨테이너 쪽은 러너 볼륨으로, 도커 쪽은 Dockerfile 캐시 마운트로. 열네 판째 **1분 54초** |
| 데스크탑에서 하루 열 번씩 뭔가가 죽음 — GitLab·브라우저·편집기가 번갈아. 메모리 부족으로 보고 **램을 주문** | 기록이 진단과 안 맞았음 — 물리 메모리는 **6.6GB가 남아 있었고**, 죽은 것도 GitLab이 아니라 WSL을 켜는 명령이었음. 진짜 천장은 Windows가 약속할 수 있는 총량 **17.9GB**였고, 디스크를 비우려고 페이지파일을 2GB로 고정해 둔 옛 설정이 그 값을 정하고 있었음 | 페이지파일을 12GB로. 한도 **28GB**. 램은 한 장도 안 바꾸고 **주문은 취소** |
{:.hl-tbl}

## 결과

커밋에서 파드까지 끊겨 있던 구간이 이어졌습니다.

- 데스크탑에 **GitLab CE와 GitLab Runner**가 서고, 저장소 둘이 GitHub에서 옮겨졌습니다
- `cgv-onprem` — **다섯 단 13 job**이 돌고, 취약점 **0건**인 이미지만 레지스트리에 섭니다
- `cgv-infra` — ArgoCD가 읽어 클러스터를 맞추고, 새 이미지 이름은 클러스터 안 도구가 적습니다
- 파이프라인 한 판 **1분 54초**, 커밋에서 클러스터 반영까지 **3초**
- **앱 세 종이 처음으로 떴습니다** — 배선을 세운 이래 받아 올 이미지가 없어 멈춰 있던 파드들입니다

## 남은 것

- **러너가 데스크탑의 도커 소켓을 물고 있습니다** — 그 소켓을 쥔 쪽은 사실상 그 기계의 관리자입니다. 격리된 방식은 빌드마다 데몬을 새로 띄우느라 메모리가 더 듭니다
- **러너 설정만 git 밖에 있습니다** — 동시 실행 수와 캐시 볼륨이 러너 컨테이너 안 파일에만 있어, 데스크탑을 다시 세우면 그 설정이 사라집니다. 클러스터 쪽은 전부 git이 정의하는데 여기만 예외입니다
- **자격에 만료·로테이션 계획이 없습니다** — 토큰을 무기한으로 발급해 뒀습니다. 만료가 오면 봇 커밋이 조용히 멈추는데, 그 전에 알려 줄 장치가 없습니다

## 쓴 것

GitLab CE · GitLab Runner · Docker · Trivy · gitleaks · SpotBugs · ArgoCD · argocd-image-updater
{:.hl-more}

배포된 것이 실제로 어떻게 도는지는 관측이 답합니다.
{:.hl-more}
