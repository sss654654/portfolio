---
layout: page
title: CI/CD
description: >
  GitLab 파이프라인 하나가 이미지를 만들고, 노트북 안 ArgoCD 허브 하나가 dev와 stg 두 클러스터에 배달합니다
permalink: /homelab/cicd/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

GitLab 하나 · 파이프라인 하나 · 허브 하나가 클러스터 둘을 배달합니다.
dev는 머지하면 자동으로, stg는 버튼 하나를 누르면 **같은 이미지**가 갑니다 — 갈리는 것은 환경 폴더의 값뿐입니다.
{:.lead}

## CI/CD 구조

<!-- 세 기둥 — 왼쪽 노트북(k3s dev · 허브), 가운데 데스크탑(GitLab · Runner · 레지스트리 · 저장소 둘), 오른쪽 AWS(ECR · EKS stg).
     주황 = 이미지가 가는 길, 파랑 = 배포 정의와 동기화, 점선 = 폴링과 원격 호출.
     허브가 dev 를 동기화하는 선은 그리지 않는다 — 같은 클러스터 안(in-cluster)이라 선이 없다. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<svg viewBox="0 0 760 470" role="img" aria-label="가운데 데스크탑의 GitLab에서 cgv-onprem이 러너 다섯 단을 지나 GitLab 레지스트리에 이미지로 서고, 버튼 하나로 같은 이미지가 오른쪽 AWS ECR로 승격된다. 왼쪽 노트북의 image-updater가 두 레지스트리를 폴링해 cgv-infra의 tag 줄을 커밋하면, 같은 노트북의 ArgoCD 허브가 배포 정의를 읽어 dev 노드 셋과 EKS stg에 동기화한다">
  <defs>
    <marker id="hlm-i" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#f08c2e"/></marker>
    <marker id="hlm-d" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#2f6fdb"/></marker>
    <marker id="hlm-n" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/></marker>
  </defs>

  <!-- 왼쪽 기둥 — 노트북 k3s dev -->
  <rect class="hla-outer" x="16" y="40" width="220" height="390" rx="10"/>
  <image href="/assets/img/icons/kubernetes.svg" x="28" y="52" width="24" height="24"/>
  <text class="hla-t" x="58" y="70">노트북 — k3s dev</text>
  <text class="hla-s" x="58" y="86">격리망 안 · 허브가 여기 있음</text>

  <rect class="hla-inner hla-dash" x="28" y="112" width="196" height="52" rx="6"/>
  <text class="hla-c" x="38" y="132">dev 동기화 — 선이 없음</text>
  <text class="hla-s2" x="38" y="150">허브와 같은 클러스터 · 머지 뒤 3초</text>

  <rect class="hla-box" x="28" y="222" width="196" height="56" rx="6"/>
  <image href="/assets/img/icons/kubernetes.svg" x="38" y="236" width="18" height="18"/>
  <text class="hla-t" x="62" y="250">노드 3대 — dev</text>
  <text class="hla-s2" x="38" y="268">허브와 같은 클러스터 · in-cluster</text>

  <rect class="hla-box" x="28" y="290" width="196" height="52" rx="6"/>
  <image href="/assets/img/icons/argo.svg" x="38" y="303" width="18" height="18"/>
  <text class="hla-t" x="62" y="317">image-updater</text>
  <text class="hla-s2" x="38" y="334">레지스트리 둘 폴링 → tag 커밋</text>

  <rect class="hla-box" x="28" y="360" width="196" height="60" rx="6"/>
  <image href="/assets/img/icons/argo.svg" x="38" y="376" width="22" height="22"/>
  <text class="hla-t" x="66" y="386">ArgoCD 허브</text>
  <text class="hla-s2" x="38" y="410">dev · stg 두 클러스터 동기화</text>

  <!-- 가운데 기둥 — 데스크탑 GitLab -->
  <rect class="hla-outer" x="262" y="40" width="236" height="390" rx="10"/>
  <image href="/assets/img/icons/gitlab.svg" x="274" y="52" width="24" height="24"/>
  <text class="hla-t" x="304" y="70">데스크탑 — GitLab</text>
  <text class="hla-s" x="304" y="86">Runner · 레지스트리 · 저장소 둘</text>

  <rect class="hla-box" x="274" y="104" width="212" height="40" rx="6"/>
  <text class="hla-t" x="286" y="128">cgv-onprem</text>
  <text class="hla-s2" x="376" y="128">앱 소스 · main 하나</text>

  <line class="hla-ln-img" x1="380" y1="144" x2="380" y2="158" marker-end="url(#hlm-i)"/>
  <text class="hla-a" x="388" y="154">1 push</text>

  <rect class="hla-box" x="274" y="160" width="212" height="48" rx="6"/>
  <text class="hla-t" x="286" y="180">Runner — 5단</text>
  <text class="hla-s2" x="286" y="199">check · test · build · scan · publish</text>

  <line class="hla-ln-img" x1="380" y1="208" x2="380" y2="220" marker-end="url(#hlm-i)"/>
  <text class="hla-a" x="388" y="218">2 통과한 것만 · 자동</text>

  <rect class="hla-box" x="274" y="222" width="212" height="56" rx="6"/>
  <g class="hla-glyph" transform="translate(286,234)">
    <rect x="0" y="4" width="11" height="9"/><rect x="4" y="0" width="11" height="9"/>
  </g>
  <text class="hla-t" x="310" y="244">GitLab 레지스트리</text>
  <text class="hla-s2" x="286" y="266">main-106-3b6bd07c · dev 가 받음</text>

  <rect class="hla-box" x="274" y="330" width="212" height="80" rx="6"/>
  <text class="hla-t" x="286" y="352">cgv-infra — 배포 정의</text>
  <text class="hla-s2" x="286" y="372">envs/dev/*.yaml  tag: main-106-…</text>
  <text class="hla-s2" x="286" y="388">envs/stg/*.yaml  tag: 3b6bd07c</text>
  <text class="hla-a" x="286" y="404">이 한 줄이 바뀌면 그 환경에 배포</text>

  <!-- 오른쪽 기둥 — AWS -->
  <rect class="hla-outer" x="524" y="40" width="220" height="390" rx="10"/>
  <text class="hla-t" x="536" y="70">AWS — stg</text>
  <text class="hla-s" x="536" y="86">ap-northeast-2</text>

  <rect class="hla-box" x="536" y="222" width="196" height="56" rx="6"/>
  <text class="hla-t" x="548" y="244">ECR ×3</text>
  <text class="hla-s2" x="548" y="266">3b6bd07c — 같은 이미지</text>

  <line class="hla-ln-img" x1="634" y1="278" x2="634" y2="314" marker-end="url(#hlm-i)"/>
  <text class="hla-a" x="642" y="300">pull · 노드 역할</text>

  <rect class="hla-box" x="536" y="316" width="196" height="104" rx="6"/>
  <image href="/assets/img/icons/kubernetes.svg" x="546" y="330" width="22" height="22"/>
  <text class="hla-t" x="574" y="346">EKS stg — 노드 7대</text>
  <text class="hla-s2" x="546" y="370">허브에 이름 cgv-stg 로 등록</text>
  <text class="hla-s2" x="546" y="386">같은 차트 · envs/stg 의 값</text>
  <text class="hla-s2" x="546" y="402">코드 → 브라우저 19분 41초</text>

  <!-- 기둥 사이 — 이미지(주황) -->
  <line class="hla-ln-img" x1="274" y1="250" x2="228" y2="250" marker-end="url(#hlm-i)"/>
  <text class="hla-a" x="251" y="244" text-anchor="middle">pull</text>
  <line class="hla-ln-img" x1="486" y1="250" x2="532" y2="250" marker-end="url(#hlm-i)"/>
  <text class="hla-a" x="509" y="243" text-anchor="middle">3 승격</text>
  <text class="hla-a" x="509" y="265" text-anchor="middle">버튼 하나</text>

  <!-- 폴링(점선) — image-updater 가 레지스트리 둘을 본다 -->
  <path class="hla-ln hla-dash" d="M224,304 H380 V282" fill="none" marker-end="url(#hlm-n)"/>
  <path class="hla-ln hla-dash" d="M380,304 H560 V282" fill="none" marker-end="url(#hlm-n)"/>
  <text class="hla-a" x="236" y="298">4 새 태그 폴링 — 둘 다</text>

  <!-- 배포 정의(파랑) -->
  <line class="hla-ln-def" x1="224" y1="336" x2="270" y2="336" marker-end="url(#hlm-d)"/>
  <text class="hla-a" x="249" y="330" text-anchor="middle">5 tag 커밋</text>
  <line class="hla-ln-def" x1="274" y1="380" x2="228" y2="380" marker-end="url(#hlm-d)"/>
  <text class="hla-a" x="249" y="374" text-anchor="middle">6 정의 읽기</text>
  <text class="hla-a" x="249" y="394" text-anchor="middle">webhook 3초</text>

  <!-- 허브 → EKS (원격 · 점선 파랑) -->
  <path class="hla-ln-def" d="M126,420 V450 H634 V424" fill="none" stroke-dasharray="5 5" marker-end="url(#hlm-d)"/>
  <text class="hla-a" x="380" y="445" text-anchor="middle">7 sync — EKS API · 집 공인 IP 만 허용</text>
</svg>
<figcaption>주황이 이미지가 가는 길, 파랑이 배포 정의와 동기화, 점선이 폴링과 원격 호출입니다.
dev와 stg가 받는 이미지는 태그 이름만 다르고 내용이 같습니다. 허브가 dev를 동기화하는 선은 없습니다 — 같은 클러스터 안입니다.</figcaption>
</figure>

## 설계 결정

| 항목 | 선택 | 이유 |
|---|---|---|
| Git 서버 자리 | **클러스터 밖 데스크탑** — 러너 · 레지스트리도 같이 | GitHub은 사설망 안 ArgoCD를 호출 불가 · 클러스터 안이면 동반 정지 · 빌드 I/O가 부하 실측을 교란 |
| CI와 CD | **분리** — 파이프라인은 이미지까지, 배포는 클러스터 안 ArgoCD가 | 파이프라인이 배포까지 하려면 전권 자격이 클러스터 밖에 필요 — 갈라 두면 안쪽에만 존재 |
| 브랜치 · 환경 | **trunk 하나(`main`)** · 환경은 폴더 `envs/<환경>/` | 브랜치를 환경 축으로 쓰면 환경 축이 둘(브랜치 · 폴더)이 됨 · 승격이 merge가 아니라 태그 커밋 한 줄이라 이력이 한 줄로 남고 되돌리기 쉬움 |
| 승격 | **한 번 빌드 · 같은 이미지를 ECR로** · 게이트는 `publish-ecr` 수동 버튼 하나 | 부하 비교는 두 환경 이미지가 바이트까지 같아야 함 — 환경마다 빌드하면 "코드 때문인가 이미지가 달라서인가"가 낌 · 버튼을 누르는 것이 승격 결정이고, 변수와 버튼 둘이면 게이트가 두 겹 |
| 원격 클러스터 | **집 허브가 EKS를 클러스터 이름으로 배달** | EKS 안의 어떤 것도 사설망 GitLab을 못 읽음 · 주소 대신 이름으로 가리켜 켜는 날 주소 치환 20곳이 사라짐 |
| 취약점 게이트(scan) | **수정판이 나온 취약점만** 머지 차단 | 패치가 없는 CVE가 수십 개 — 막아도 올릴 수정판이 없어 파이프라인만 정지 |
| 배포 권한 · 자격 | **AppProject**로 단위마다 제한 · dev는 **SealedSecret**, stg는 **Secrets Manager** | ArgoCD는 관리자 권한으로 동작 — 제한이 없으면 Application 하나로 무엇이든 생성 · 봉인은 그 클러스터 개인키에 묶여 stg로 못 옮김 |
{:.hl-dec}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| 취약점 스캔을 처음 켜자 **72건** | 서비스 셋 다 **버전 고정 후 방치** — 간접 의존 2 · Spring Boot 부모 37 · 갱신 멈춘 nginx 33 | 의존 상향 · 부모 교체 · 베이스 이미지 이동 → **0건** |
| 파이프라인 1회에 **10분 15초** | 회마다 의존성과 취약점 DB를 다시 받음 — 받는 자리가 `lint`·`build`로 갈려 **캐시가 두 곳** | 러너 볼륨과 Dockerfile 캐시로 양쪽 다 남김 → 14회째 **1분 54초** |
| ECR push가 레이어를 다 올린 뒤 **마지막에만 403** | push 권한에 `BatchGetImage`가 없음 — docker가 레이어를 올린 뒤 매니페스트를 HEAD로 확인 | 읽기 권한 하나 추가 — 쓰기에도 읽기가 하나 필요 |
{:.hl-tbl}

## 결과

<!-- 캡처 뒤 활성화 — 파일 둘 (EKS 가 꺼져 있어도 찍을 수 있다):
     /assets/img/homelab/cicd/publish-ecr.png       GitLab 파이프라인 화면 — publish 단의 수동 job publish-ecr:* (재생 버튼)
     /assets/img/homelab/cicd/image-updater-commit.png  cgv-infra 커밋 "build: automatic update of queue-stg" 의 diff — envs/stg/queue.yaml image.tag 한 줄
<div class="hl-shots" markdown="0" aria-label="승격 화면 둘 — 버튼과 되쓰기 커밋, 화살표로 넘겨 봅니다">
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cicd/publish-ecr.png" alt="GitLab 파이프라인 — publish 단에 수동 job publish-ecr 셋이 재생 버튼으로 서 있는 화면">
    <figcaption><b>(승격 게이트)</b> 같은 파이프라인의 publish 단입니다 — GitLab 레지스트리 푸시는 자동이고, ECR 푸시는 이 버튼을 눌러야 갑니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cicd/image-updater-commit.png" alt="cgv-infra 커밋 diff — envs/stg/queue.yaml의 image.tag 한 줄이 새 커밋 해시로 바뀜" loading="lazy">
    <figcaption><b>(되쓰기 커밋)</b> image-updater가 ECR에서 새 태그를 보고 stg 환경 파일의 tag 한 줄을 커밋했습니다 — 이 커밋이 허브의 sync를 부릅니다.</figcaption>
  </figure>
</div>
-->

- **두 클러스터가 같은 파이프라인 · 같은 허브에서 배포됩니다** — dev는 머지 뒤 **3초**에 반영, stg는 코드에서 브라우저까지 **19분 41초**(사람 손을 뺀 기계 구간 1분 54초)
- **커밋 뒤 `kubectl`을 실행할 일이 없습니다** — 두 환경 모두 머지가 곧 배포입니다
- **저장소에 평문 자격이 없습니다** — dev 시크릿 19종은 봉인된 채 커밋돼 있고, stg 시크릿 넷은 Secrets Manager에서 스크립트가 만듭니다
- **판 중에는 머지하지 않습니다** — 머지가 곧 배포라 판 도중 파드가 굴러 그 판이 무효가 된 적이 있습니다

## 한계

- **자동화 토큰 셋이 같은 날 만료됩니다** — 이미지 수신·태그 되쓰기·배포 정의 읽기가 함께 멈추는데, 사전 알림이 없습니다
- **stg는 이미지 롤백이 안 됩니다** — image-updater가 가장 새 빌드를 고르므로, 고쳐서 다시 빌드합니다
- **CI → AWS가 IAM 사용자 장기 키입니다** — OIDC 페더레이션이 정석인데 GitLab이 사설 IP라 발급자로 검증할 수 없습니다

## 기술 스택

GitLab CE · GitLab Runner · Docker · Trivy · gitleaks · SpotBugs · ArgoCD · argocd-image-updater · Sealed Secrets · ECR · Secrets Manager
{:.hl-more}

{% include hl-nav.html %}
