---
layout: page
title: CI/CD
description: >
  배포 · 한 번 빌드한 이미지를 dev · stg에 GitOps로
permalink: /homelab/cicd/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← HomeLab</a></p>

GitLab CI가 `main` 머지마다 이미지를 한 번 빌드(5단 · scan 게이트).
dev는 자동, stg는 수동 job `publish-ecr` 실행 시 **같은 이미지**를 ECR로 승격.
image-updater가 새 태그를 cgv-infra에 커밋하면 노트북 ArgoCD 허브가 두 클러스터에 동기화 — 환경 차이는 `envs/<환경>/` 값뿐.
{:.lead}

## CI/CD 흐름

<!-- 흐름도 — 개발자 → CI → (자동: GitLab 레지스트리 / 수동: ECR) → image-updater → cgv-infra → 허브 → (k3s dev / EKS stg).
     주황 = 이미지, 파랑 = 배포 정의 · 동기화, 회색 점선 = 폴링, 파랑 점선 = EKS API. 위아래 호 = 클러스터가 자기 레지스트리에서 pull -->
<figure class="hl-diagram hl-diagram-lg hl-diagram-scroll" markdown="0">
<svg viewBox="0 0 760 306" role="img" aria-label="개발자가 main 에 머지하면 GitLab CI 가 이미지를 만들어 GitLab 레지스트리(자동)와 ECR(수동)로 나눠 올린다. image-updater 가 두 레지스트리의 새 태그를 감지해 cgv-infra 에 tag 를 커밋하고, webhook 을 받은 ArgoCD 허브가 k3s dev 와 EKS stg 에 동기화한다. 각 클러스터는 자기 레지스트리에서 이미지를 받는다">
  <defs>
    <marker id="hlm-i" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#f08c2e"/></marker>
    <marker id="hlm-d" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#2f6fdb"/></marker>
    <marker id="hlm-n" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/></marker>
  </defs>

  <!-- 개발자 → CI -->
  <g class="hla-g hla-g1">
    <circle cx="46" cy="140" r="7" class="hla-glyph"/>
    <path d="M33,166 C33,150 59,150 59,166" class="hla-glyph"/>
    <text class="hla-c" x="46" y="186" text-anchor="middle">개발자</text>
    <text class="hla-a" x="46" y="200" text-anchor="middle">main 머지</text>
    <line class="hla-ln" x1="66" y1="150" x2="130" y2="150" marker-end="url(#hlm-n)"/>

    <image href="/assets/img/icons/gitlab.svg" x="133" y="133" width="34" height="34"/>
    <text class="hla-c" x="150" y="186" text-anchor="middle">GitLab CI</text>
    <text class="hla-a" x="150" y="200" text-anchor="middle">5단 · scan 게이트</text>
  </g>

  <!-- 레지스트리 둘 — 자동 · 수동 -->
  <g class="hla-g hla-g2">
    <path class="hla-ln-img" d="M167,150 H206 V84 H250" marker-end="url(#hlm-i)"/>
    <path class="hla-ln-img" d="M206,150 V216 H250" marker-end="url(#hlm-i)"/>
    <text class="hla-a" x="212" y="78">자동</text>
    <text class="hla-a" x="212" y="232">수동</text>

    <rect class="hla-box" x="253" y="67" width="34" height="34" rx="7"/>
    <g class="hla-glyph" transform="translate(261,76)"><rect x="0" y="5" width="13" height="11"/><rect x="5" y="0" width="13" height="11"/></g>
    <text class="hla-c" x="270" y="120" text-anchor="middle">GitLab 레지스트리</text>
    <text class="hla-a" x="270" y="134" text-anchor="middle">dev 이미지</text>

    <image href="/assets/img/icons/aws-ecr.png" x="253" y="199" width="34" height="34"/>
    <text class="hla-c" x="270" y="252" text-anchor="middle">ECR</text>
    <text class="hla-a" x="270" y="266" text-anchor="middle">수동 승격</text>

    <path class="hla-ln hla-dash" d="M288,84 H350 V140 H372" fill="none" marker-end="url(#hlm-n)"/>
    <path class="hla-ln hla-dash" d="M287,210 H350 V160 H372" fill="none" marker-end="url(#hlm-n)"/>
    <text class="hla-a" x="300" y="78">폴링</text>
  </g>

  <!-- 하나로 — image-updater → cgv-infra → 허브 → 둘로 -->
  <g class="hla-g hla-g3">
    <image href="/assets/img/icons/argo.svg" x="375" y="133" width="34" height="34"/>
    <text class="hla-c" x="392" y="186" text-anchor="middle">image-updater</text>
    <text class="hla-a" x="392" y="200" text-anchor="middle">새 태그 감지</text>

    <line class="hla-ln-def" x1="411" y1="150" x2="480" y2="150" marker-end="url(#hlm-d)"/>
    <text class="hla-a" x="446" y="142" text-anchor="middle">tag 커밋</text>

    <image href="/assets/img/icons/gitlab.svg" x="483" y="133" width="34" height="34"/>
    <text class="hla-c" x="500" y="186" text-anchor="middle">cgv-infra</text>
    <text class="hla-a" x="500" y="200" text-anchor="middle">envs/dev · envs/stg</text>

    <line class="hla-ln-def" x1="519" y1="150" x2="584" y2="150" marker-end="url(#hlm-d)"/>
    <text class="hla-a" x="552" y="142" text-anchor="middle">webhook · 3초</text>

    <image href="/assets/img/icons/argo.svg" x="587" y="133" width="34" height="34"/>
    <text class="hla-c" x="604" y="186" text-anchor="middle">ArgoCD 허브</text>
    <text class="hla-a" x="604" y="200" text-anchor="middle">노트북 k3s</text>

    <path class="hla-ln-def" d="M623,150 H660 V84 H692" fill="none" marker-end="url(#hlm-d)"/>
    <path class="hla-ln-def hla-dash" d="M660,150 V216 H692" fill="none" marker-end="url(#hlm-d)"/>

    <image href="/assets/img/icons/kubernetes.svg" x="695" y="67" width="34" height="34"/>
    <text class="hla-c" x="712" y="120" text-anchor="middle">k3s dev</text>
    <text class="hla-a" x="712" y="134" text-anchor="middle">노드 3대</text>

    <image href="/assets/img/icons/aws-eks.png" x="695" y="199" width="34" height="34"/>
    <text class="hla-c" x="712" y="252" text-anchor="middle">EKS stg</text>
    <text class="hla-a" x="712" y="266" text-anchor="middle">노드 7대</text>

    <!-- 이미지 pull — 각자의 레지스트리에서 -->
    <path class="hla-ln-img" d="M270,67 V40 H744 V84 H731" marker-end="url(#hlm-i)"/>
    <text class="hla-a" x="507" y="34" text-anchor="middle">이미지 pull</text>
    <path class="hla-ln-img" d="M287,228 H300 V284 H744 V216 H731" marker-end="url(#hlm-i)"/>
    <text class="hla-a" x="507" y="300" text-anchor="middle">이미지 pull</text>
  </g>
</svg>
<figcaption>주황 — 이미지 · 파랑 — 배포 정의 · 동기화 · 회색 점선 — 폴링 · 파랑 점선 — EKS API(집 IP만 허용).
image-updater · 허브는 노트북 k3s, cgv-infra는 데스크탑 GitLab.</figcaption>
</figure>

## 설계 결정

| 항목 | 선택 | 이유 |
|---|---|---|
| Git 서버 위치 | **클러스터 밖 데스크탑** — 러너 · 레지스트리 포함 | GitHub webhook은 사설망 ArgoCD에 도달 불가 · 클러스터 안이면 클러스터와 함께 중단 · 빌드 I/O가 부하 측정에 간섭 |
| CI · CD | **분리** — 파이프라인은 이미지까지, 배포는 ArgoCD | 파이프라인이 배포하면 클러스터 전권 자격이 외부에 필요 — 분리하면 자격이 클러스터 안에만 존재 |
| 브랜치 · 환경 | **trunk 하나(`main`)** · 환경은 `envs/<환경>/` 폴더 | 브랜치를 환경으로 쓰면 환경 축이 둘(브랜치 · 폴더) · 승격 이력이 태그 커밋 한 줄 |
| 승격 | **1회 빌드 · 같은 이미지를 ECR로** · 게이트는 수동 job `publish-ecr` | 부하 비교에 두 환경 이미지 동일 필요 — 환경별로 빌드하면 결과 차이가 코드인지 빌드인지 구분 불가 · job 실행 = 승격 결정, 변수 게이트를 더하면 이중 게이트 |
| 원격 클러스터 | **집 허브가 EKS를 클러스터 이름으로 배포** | EKS에서 사설망 GitLab 접근 불가 · 주소 대신 이름 지정 — 클러스터 재생성 시 주소 치환 20곳 제거 |
| 취약점 게이트(scan) | **수정판 있는 취약점만** 머지 차단 | 패치 없는 CVE 수십 개 — 차단해도 올릴 수정판이 없어 파이프라인만 중단 |
| 배포 권한 · 자격 | **AppProject**로 단위별 제한 · dev **SealedSecret** · stg **Secrets Manager** | ArgoCD는 관리자 권한 — 제한이 없으면 Application 하나로 모든 자원 생성 가능 · SealedSecret 봉인은 클러스터 개인키에 묶여 stg로 이전 불가 |
{:.hl-dec}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| 취약점 스캔 첫 적용 시 **72건** | 서비스 3개 모두 **버전 고정 후 미갱신** — 간접 의존 2 · Spring Boot 부모 37 · nginx 33 | 의존성 상향 · 부모 교체 · 베이스 이미지 변경 → **0건** |
| 파이프라인 1회 **10분 15초** | 매 회 의존성 · 취약점 DB 재다운로드 — `lint` · `build`의 **캐시 위치 분리** | 러너 볼륨 · Dockerfile 캐시로 양쪽 유지 → 14회째 **1분 54초** |
| ECR push가 레이어 업로드 후 **마지막에 403** | push 권한에 `BatchGetImage` 없음 — docker가 업로드 후 매니페스트를 HEAD로 확인 | 읽기 권한 1개 추가 |
{:.hl-tbl}

## 결과

<!-- 캡처 뒤 활성화 — 파일 둘 (EKS 가 꺼져 있어도 찍을 수 있다):
     /assets/img/homelab/cicd/publish-ecr.png       GitLab 파이프라인 화면 — publish 단의 수동 job publish-ecr:* (재생 버튼)
     /assets/img/homelab/cicd/image-updater-commit.png  cgv-infra 커밋 "build: automatic update of queue-stg" 의 diff — envs/stg/queue.yaml image.tag 한 줄
<div class="hl-shots" markdown="0" aria-label="승격 화면 둘 — 수동 job과 되쓰기 커밋, 화살표로 넘겨 봅니다">
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cicd/publish-ecr.png" alt="GitLab 파이프라인 — publish 단에 수동 job publish-ecr 셋이 실행 대기 중인 화면">
    <figcaption><b>(승격 게이트)</b> publish 단 — GitLab 레지스트리 푸시는 자동, ECR 푸시는 이 job 수동 실행 시에만.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cicd/image-updater-commit.png" alt="cgv-infra 커밋 diff — envs/stg/queue.yaml의 image.tag 한 줄이 새 커밋 해시로 바뀜" loading="lazy">
    <figcaption><b>(되쓰기 커밋)</b> image-updater가 ECR 새 태그를 감지해 stg 환경 파일 tag 한 줄 커밋 — 이 커밋이 허브 sync 시작점.</figcaption>
  </figure>
</div>
-->

- **배포 시간 실측** — dev는 태그 커밋 후 **3초** 반영(webhook) · stg는 커밋부터 화면 반영까지 **19분 41초**(자동 구간 1분 54초)
- **머지가 곧 배포** — 커밋 후 `kubectl` 실행 없음
- **저장소에 평문 자격 없음** — dev 시크릿 19종은 봉인 상태로 커밋, stg 시크릿 4종은 Secrets Manager에서 스크립트로 생성

## 한계

- **자동화 토큰 3개가 같은 날 만료** — 이미지 pull · 태그 되쓰기 · 배포 정의 읽기가 동시 중단, 사전 알림 없음
- **stg 이미지 롤백 불가** — image-updater가 최신 빌드를 선택, 수정 후 재빌드
- **CI → AWS 자격이 IAM 사용자 장기 키** — GitLab이 사설 IP라 OIDC 페더레이션 불가
- **부하 테스트 중 머지 금지** — 테스트 도중 파드 교체로 회차가 무효 처리된 사례 있음

## 기술 스택

GitLab CE · GitLab Runner · Docker · Trivy · gitleaks · SpotBugs · ArgoCD · argocd-image-updater · Sealed Secrets · ECR · Secrets Manager
{:.hl-more}

{% include hl-nav.html %}
