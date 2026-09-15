---
layout: page
title: CI/CD
description: >
  배포 · 한 번 빌드한 이미지를 dev · stg에 GitOps로
permalink: /homelab/cicd/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← HomeLab</a></p>

GitLab CI가 cgv-onprem(앱 소스) `main` 머지마다 이미지를 한 번 빌드 — 검사 통과 시 등록.
dev 자동 배포, stg는 수동 job `publish-ecr`로 **같은 이미지**를 ECR에 승격.
image-updater가 새 태그를 cgv-infra(배포 정의)에 커밋하면 노트북 ArgoCD 허브가 두 클러스터에 동기화.
{:.lead}

## CI/CD 흐름

<!-- 흐름도 — 개발자 → CI → (자동: GitLab 레지스트리 / 수동: ECR) → image-updater → cgv-infra → 허브 → (k3s dev / EKS stg).
     주황 = 이미지, 파랑 = 배포 정의 · 동기화, 회색 점선 = 폴링, 파랑 점선 = EKS API. 위아래 호 = 클러스터가 자기 레지스트리에서 pull.
     범례는 그림 아래 선 견본 넷. 설계 결정 표의 행 순서는 이 그림의 왼쪽 → 오른쪽 순서 -->
<figure class="hl-diagram hl-diagram-lg hl-diagram-scroll" markdown="0">
<svg viewBox="0 0 760 334" role="img" aria-label="개발자가 main 에 머지하면 GitLab CI 가 이미지를 만들어 GitLab 레지스트리(자동)와 ECR(수동)로 나눠 올린다. image-updater 가 두 레지스트리의 새 태그를 감지해 cgv-infra 에 tag 를 커밋하고, webhook 을 받은 ArgoCD 허브가 k3s dev 와 EKS stg 에 동기화한다. 각 클러스터는 자기 레지스트리에서 이미지를 받는다">
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
    <text class="hla-a" x="150" y="200" text-anchor="middle">cgv-onprem</text>
    <text class="hla-a" x="150" y="214" text-anchor="middle">check · test · scan</text>
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
    <text class="hla-a" x="446" y="142" text-anchor="middle">태그 커밋</text>

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

  <!-- 범례 — 선 견본 넷 -->
  <g>
    <line class="hla-ln-img" x1="184" y1="322" x2="210" y2="322"/>
    <text class="hla-a" x="216" y="326">이미지</text>
    <line class="hla-ln-def" x1="274" y1="322" x2="300" y2="322"/>
    <text class="hla-a" x="306" y="326">배포 정의 · 동기화</text>
    <line class="hla-ln hla-dash" x1="424" y1="322" x2="450" y2="322"/>
    <text class="hla-a" x="456" y="326">폴링</text>
    <line class="hla-ln-def hla-dash" x1="506" y1="322" x2="532" y2="322"/>
    <text class="hla-a" x="538" y="326">EKS API</text>
  </g>
</svg>
<figcaption>image-updater · 허브는 노트북 k3s, GitLab(CI · 레지스트리 · cgv-infra)은 데스크탑.</figcaption>
</figure>

## 설계 결정

| 항목 | 선택 | 이유 |
|---|---|---|
| Git 서버 위치 | **GitLab을 클러스터 밖 데스크탑에** — 러너 · 레지스트리 포함 | 클러스터 안이면 장애 시 함께 중단 · 빌드 I/O가 부하 측정에 간섭 · GitHub은 사설망 webhook 불가 |
| CI · CD | **분리** — CI는 이미지 빌드(cgv-onprem) · 배포 정의 검사(cgv-infra)까지, 배포는 ArgoCD | 파이프라인이 배포하면 러너에 클러스터 전권 자격 필요 — 분리하면 배포 자격은 허브 ArgoCD에만 |
| 브랜치 · 환경 | **두 저장소 모두 trunk 하나(`main`)** · 환경은 cgv-infra `envs/<환경>/` 폴더 | 브랜치를 환경으로 쓰면 환경 구분이 브랜치 · 폴더 두 곳에 생김 · 승격은 merge 대신 태그 커밋 한 줄 |
| 취약점 게이트 | **수정판 있는 HIGH 이상만** 차단 — 소스(빌드 전) · 이미지(등록 전) 두 겹 | 수정판 없는 취약점까지 막으면 고칠 수단 없이 파이프라인 상시 실패 |
| 승격 | **1회 빌드 · 같은 이미지를 ECR로** · 게이트는 수동 job `publish-ecr` | 환경별로 빌드하면 부하 결과 차이의 원인 구분 불가 · 버튼 실행 기록이 곧 승격 기록 |
| 원격 클러스터 | **집 허브가 EKS를 클러스터 이름으로 배포** | EKS에서 사설망 GitLab 저장소 · 레지스트리 접근 불가 · 이름 지정으로 재생성 시 주소 치환 20곳 제거 |
| 배포 권한 · 자격 | **AppProject**로 배포 범위 제한 · dev **SealedSecret** · stg는 생성 뒤 스크립트로 주입 | 제한 없으면 Application 하나로 전 자원 생성 · 봉인본은 dev 클러스터 개인키로만 복호화 |
{:.hl-dec}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| 취약점 스캔 첫 적용 시 **72건** | 서비스 3개 모두 버전 고정 후 미갱신 — Go 간접 의존 2 · Spring Boot 부모 37 · 갱신 중단 nginx 태그 33 | 간접 의존 상향 · 부모 3.5.16 + netty 지정 · nginx 1.31 → **0건** |
| 파이프라인 1회 **10분 15초** | job 컨테이너가 매번 새로 떠 의존성 · 취약점 DB 재다운로드 — docker build 안쪽은 러너 볼륨이 닿지 않음 | 러너 볼륨 · BuildKit 캐시 마운트 · 동시 실행 2 → **1분 54초** |
| ECR push가 레이어 업로드 후 **마지막에 403** | push 정책에 `BatchGetImage` 없음 — 매니페스트 등록 전 존재 확인(HEAD)을 ECR이 읽기로 판정 | `ci-push` 정책에 `BatchGetImage` 추가 |
{:.hl-tbl}

## 결과

- **머지부터 dev · stg 배포까지 GitOps 경로 완성** — 배포에 `kubectl` 0회 · stg는 승격 버튼 1회, ECR 등록 뒤 태그 커밋 93초 → 동기화 완료 21초
- **[CI 파이프라인](https://github.com/sss654654/cgv-onprem/blob/main/.gitlab-ci.yml) 검사 · 차단 동작 확인** — 새로 공개된 취약점 grpc HIGH · netty CRITICAL을 등록 전 차단, 버전 상향 후 통과
- **배포 저장소에 평문 시크릿 0건** — cgv-infra의 시크릿 매니페스트 19종 전부 SealedSecret 봉인본

## 한계

- **자동화 토큰 3개가 2026-11-01 동시 만료** — 노드 이미지 pull · image-updater 태그 조회 · 저장소 읽기와 태그 되쓰기 중단, 만료 알림 없음
- **stg 이미지 롤백 불가** — image-updater가 항상 최신 빌드 선택, 문제 시 수정 후 재빌드
- **ECR 자격이 IAM 사용자 장기 키 둘** — CI push · image-updater 조회용, GitLab이 사설 IP라 OIDC 페더레이션 불가
- **허브가 가진 EKS 자격이 만료 없는 cluster-admin 토큰** — 교체는 수동, 허브 침해 시 EKS 전권 노출

## 기술 스택

GitLab CE · GitLab Runner · Docker · Trivy · gitleaks · SpotBugs · ArgoCD · argocd-image-updater · Sealed Secrets · ECR · Secrets Manager
{:.hl-more}

{% include hl-nav.html %}
