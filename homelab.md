---
layout: page
title: HomeLab
description: >
  개인 프로젝트 · 2026.07 – 09
permalink: /homelab/
---

<!-- 오버뷰 — 홈은 "어떤 엔지니어이고 무엇을 했나", 여기는 "HomeLab 이 무엇인가". 이력 · 목적 변화는 서술하지 않는다.
     한 문장에 한 가지: 두 클러스터의 역할 → 둘의 관계(dev 한계 → stg) → 둘을 잇는 배포 경로(아래 구성도로 넘어간다).
     서비스는 만든 목적이 아니라 올린 워크로드. 5만 명 실측은 홈 리드와 부하 카드가 말한다. -->

노트북 k3s의 **dev**는 공개 데모 · 개발 환경, AWS EKS의 **stg**는 부하 테스트로 prd 스펙을 산정한 환경입니다.
stg는 dev가 3만 명 부하에서 노드 한계에 도달한 뒤 Terraform으로 구성했습니다.
두 클러스터에는 대기열 예매 서비스를 데스크탑 GitLab&nbsp;CI와 노트북 ArgoCD 하나로 배포합니다.
{:.lead}

<!-- 구성도 — 코드가 이미지가 되어 레지스트리 둘에 오르고 각 클러스터가 pull 한다(실선).
     ArgoCD 가 dev 와 stg 를 동기화한다(점선). 사용자는 dev, 부하 발생기는 stg 로.
     클러스터 칸은 위부터 관측(LGTM) · 대기열 서비스 · ArgoCD 또는 관리형 데이터 — 목차의 영역과 같은 것이 그림에 보이게.
     상자 안은 이름과 로고만 — image-updater · webhook · 승격 job 같은 세부는 CI/CD 카드에.
     점 여덟이 14초 한 바퀴 — 요청(빨강) → 이미지 push(주황) → 동기화(파랑) → 이미지 pull(주황).
     pull 이 동기화 뒤라는 순서는 움직임으로만 보인다. prefers-reduced-motion 이면 점은 숨는다.
     관측 칸을 더하며 파이프라인 쪽 세로 여백을 줄여, 노트북 첫 화면에 범례까지 들어오게 했다.
     폰에서는 줄이면 글자가 5px 아래로 떨어져 가로로 넘겨 본다(hl-diagram-scroll). -->
<figure class="hl-diagram hl-diagram-lg hl-diagram-hero hl-diagram-scroll" markdown="0">
<svg viewBox="0 0 760 354" role="img" aria-label="개발자가 머지한 코드를 데스크탑 GitLab CI가 이미지로 만들어 GitLab 레지스트리(자동)와 ECR(수동 승격)에 올리고, 각 클러스터가 자기 레지스트리에서 pull 한다. 노트북 k3s dev 안 ArgoCD가 dev와 AWS EKS stg를 동기화한다. 두 클러스터 모두 LGTM 관측 스택을 둔다. 사용자는 dev를, 부하 발생기는 stg를 쓴다">
  <defs>
    <marker id="hla-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/>
    </marker>
  </defs>

  <!-- 개발자 → 데스크탑 GitLab CI -->
  <rect x="10" y="12" width="84" height="52" rx="9" class="hla-box"/>
  <circle cx="27" cy="32" r="5.5" class="hla-glyph"/>
  <path d="M17,49 C17,38 37,38 37,49" class="hla-glyph"/>
  <text x="44" y="43" class="hla-t">개발자</text>
  <line x1="94" y1="38" x2="138" y2="38" class="hla-ln" marker-end="url(#hla-arrow)"/>
  <text x="117" y="29" class="hla-s" text-anchor="middle">git push</text>

  <rect x="140" y="12" width="480" height="52" rx="9" class="hla-box"/>
  <image href="/assets/img/icons/gitlab.svg" x="308" y="26" width="24" height="24"/>
  <text x="340" y="43" class="hla-t">데스크탑 · GitLab CI</text>

  <!-- 이미지 — CI → 레지스트리 둘 → 각 클러스터 -->
  <line x1="245" y1="64" x2="245" y2="88" class="hla-ln" marker-end="url(#hla-arrow)"/>
  <text x="253" y="81" class="hla-s">자동</text>
  <line x1="515" y1="64" x2="515" y2="88" class="hla-ln" marker-end="url(#hla-arrow)"/>
  <text x="523" y="81" class="hla-s">수동 승격</text>

  <rect x="140" y="90" width="210" height="40" rx="9" class="hla-box"/>
  <image href="/assets/img/icons/gitlab.svg" x="152" y="101" width="18" height="18"/>
  <text x="178" y="115" class="hla-c">GitLab 레지스트리</text>

  <rect x="410" y="90" width="210" height="40" rx="9" class="hla-box"/>
  <image href="/assets/img/icons/aws-ecr.png" x="422" y="101" width="18" height="18"/>
  <text x="448" y="115" class="hla-c">ECR</text>

  <line x1="245" y1="130" x2="245" y2="156" class="hla-ln" marker-end="url(#hla-arrow)"/>
  <text x="253" y="148" class="hla-s">pull</text>
  <line x1="515" y1="130" x2="515" y2="156" class="hla-ln" marker-end="url(#hla-arrow)"/>
  <text x="523" y="148" class="hla-s">pull</text>

  <!-- 노트북 k3s dev — 관측 · 서비스 · ArgoCD -->
  <rect x="140" y="158" width="210" height="168" rx="12" class="hla-outer"/>
  <image href="/assets/img/icons/kubernetes.svg" x="152" y="169" width="18" height="18"/>
  <text x="176" y="183" class="hla-t">노트북 · k3s dev</text>
  <rect x="152" y="192" width="186" height="30" rx="8" class="hla-box"/>
  <image href="/assets/img/icons/grafana.svg" x="160" y="198" width="18" height="18"/>
  <text x="186" y="211" class="hla-c">관측 · LGTM</text>
  <rect x="152" y="232" width="186" height="30" rx="8" class="hla-box"/>
  <image href="/assets/img/icons/ticket.svg" x="160" y="238" width="18" height="18"/>
  <text x="186" y="251" class="hla-c">대기열 서비스</text>
  <rect x="152" y="284" width="186" height="30" rx="8" class="hla-box"/>
  <image href="/assets/img/icons/argo.svg" x="160" y="290" width="18" height="18"/>
  <text x="186" y="303" class="hla-c">ArgoCD</text>
  <line x1="245" y1="284" x2="245" y2="264" class="hla-ln hla-dash" marker-end="url(#hla-arrow)"/>

  <!-- AWS EKS stg — 관측 · 서비스 · 관리형 데이터 -->
  <rect x="410" y="158" width="210" height="168" rx="12" class="hla-outer"/>
  <image href="/assets/img/icons/aws-eks.png" x="422" y="169" width="18" height="18"/>
  <text x="446" y="183" class="hla-t">AWS · EKS stg</text>
  <rect x="422" y="192" width="186" height="30" rx="8" class="hla-box"/>
  <image href="/assets/img/icons/grafana.svg" x="430" y="198" width="18" height="18"/>
  <text x="456" y="211" class="hla-c">관측 · LGTM</text>
  <rect x="422" y="232" width="186" height="30" rx="8" class="hla-box"/>
  <image href="/assets/img/icons/ticket.svg" x="430" y="238" width="18" height="18"/>
  <text x="456" y="251" class="hla-c">대기열 서비스</text>
  <rect x="422" y="284" width="186" height="30" rx="8" class="hla-box"/>
  <image href="/assets/img/icons/aws-rds.png" x="430" y="290" width="18" height="18"/>
  <image href="/assets/img/icons/aws-elasticache.png" x="452" y="290" width="18" height="18"/>
  <text x="478" y="303" class="hla-c">RDS · ElastiCache</text>

  <!-- ArgoCD → stg 동기화 -->
  <path d="M338,299 H380 V247 H420" class="hla-ln hla-dash" fill="none" marker-end="url(#hla-arrow)"/>
  <text x="380" y="239" class="hla-s" text-anchor="middle">동기화</text>

  <!-- 사용자 → dev · 부하 발생기 → stg (서비스 칸 높이) -->
  <rect x="10" y="230" width="108" height="34" rx="9" class="hla-box"/>
  <circle cx="30" cy="241" r="5" class="hla-glyph"/>
  <path d="M21,257 C21,248 39,248 39,257" class="hla-glyph"/>
  <text x="48" y="252" class="hla-t">사용자</text>
  <line x1="118" y1="247" x2="150" y2="247" class="hla-ln" marker-end="url(#hla-arrow)"/>

  <rect x="642" y="230" width="108" height="34" rx="9" class="hla-box"/>
  <image href="/assets/img/icons/k6.svg" x="652" y="238" width="18" height="18"/>
  <text x="676" y="252" class="hla-t">부하 발생기</text>
  <line x1="642" y1="247" x2="610" y2="247" class="hla-ln" marker-end="url(#hla-arrow)"/>

  <!-- 흐르는 점 — 요청 둘 → 이미지 push 둘 → 동기화 둘 → 이미지 pull 둘 -->
  <circle class="hla-dot hla-dot-u" r="4.5" opacity="0">
    <animateMotion dur="14s" begin="1s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.01;0.08;1" keyPoints="0;0;1;1" path="M118,247 L190,247"/>
    <animate attributeName="opacity" dur="14s" begin="1s" repeatCount="indefinite"
      keyTimes="0;0.01;0.02;0.07;0.08;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-u" r="4.5" opacity="0">
    <animateMotion dur="14s" begin="1s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.10;0.17;1" keyPoints="0;0;1;1" path="M642,247 L560,247"/>
    <animate attributeName="opacity" dur="14s" begin="1s" repeatCount="indefinite"
      keyTimes="0;0.10;0.11;0.16;0.17;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-g" r="4.5" opacity="0">
    <animateMotion dur="14s" begin="1s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.20;0.36;1" keyPoints="0;0;1;1" path="M94,38 L245,38 L245,110"/>
    <animate attributeName="opacity" dur="14s" begin="1s" repeatCount="indefinite"
      keyTimes="0;0.20;0.21;0.35;0.36;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-g" r="4.5" opacity="0">
    <animateMotion dur="14s" begin="1s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.38;0.56;1" keyPoints="0;0;1;1" path="M94,38 L515,38 L515,110"/>
    <animate attributeName="opacity" dur="14s" begin="1s" repeatCount="indefinite"
      keyTimes="0;0.38;0.39;0.55;0.56;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-v" r="4.5" opacity="0">
    <animateMotion dur="14s" begin="1s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.59;0.65;1" keyPoints="0;0;1;1" path="M245,299 L245,247"/>
    <animate attributeName="opacity" dur="14s" begin="1s" repeatCount="indefinite"
      keyTimes="0;0.59;0.60;0.64;0.65;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-v" r="4.5" opacity="0">
    <animateMotion dur="14s" begin="1s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.66;0.77;1" keyPoints="0;0;1;1" path="M338,299 L380,299 L380,247 L470,247"/>
    <animate attributeName="opacity" dur="14s" begin="1s" repeatCount="indefinite"
      keyTimes="0;0.66;0.67;0.76;0.77;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-g" r="4.5" opacity="0">
    <animateMotion dur="14s" begin="1s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.80;0.87;1" keyPoints="0;0;1;1" path="M245,110 L245,170"/>
    <animate attributeName="opacity" dur="14s" begin="1s" repeatCount="indefinite"
      keyTimes="0;0.80;0.81;0.86;0.87;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-g" r="4.5" opacity="0">
    <animateMotion dur="14s" begin="1s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.88;0.95;1" keyPoints="0;0;1;1" path="M515,110 L515,170"/>
    <animate attributeName="opacity" dur="14s" begin="1s" repeatCount="indefinite"
      keyTimes="0;0.88;0.89;0.94;0.95;1" values="0;0;1;1;0;0"/>
  </circle>

  <!-- 범례 — 한 줄 -->
  <circle cx="16" cy="340" r="4.5" fill="#e03131"/>
  <text x="26" y="344" class="hla-s">요청 (dev · stg)</text>
  <circle cx="126" cy="340" r="4.5" fill="#f08c2e"/>
  <text x="136" y="344" class="hla-s">이미지 push · pull</text>
  <circle cx="246" cy="340" r="4.5" fill="#2f6fdb"/>
  <text x="256" y="344" class="hla-s">ArgoCD 동기화</text>
</svg>
<figcaption>이미지는 한 번 빌드 — dev는 GitLab 레지스트리, stg는 수동 승격한 ECR에서 pull. 배포는 노트북 ArgoCD 하나가 두 클러스터를 동기화.</figcaption>
</figure>

<!-- 목차 — 세 묶음 · 여섯 줄. 이 페이지의 그림은 위 구성도 하나뿐이라 카드 테두리 없이 목록으로 둔다.
     묶음은 구성도와 같은 축: 좌우 클러스터 둘 = 환경 · 위 파이프라인과 관측 칸 = 배포 · 관측 · 서비스 칸과 발생기 = 서비스 · 검증.
     줄 = 영역 이름 + 구절 하나(핵심 구성 + 핵심 선택, 값은 각 카드에 적힌 것만). 문장은 쓰지 않는다.
     제목은 목록의 역할(세부 페이지 안내)만 — "설계 · 결과" 는 줄 내용과 맞지 않았다.
     a 안은 inline 요소만 — 블록을 넣으면 compress_html 과 테마 앵커가 a 를 쪼갠다 -->

## 영역별 상세

<div class="hl-index" markdown="0">

  <div class="hl-index-group">
    <span class="hl-index-head">환경</span>
    <a href="/homelab/onprem/"><b>온프레미스 · dev</b><span>Proxmox VM 3대 k3s HA 클러스터, OPNsense 방화벽 뒤 격리</span></a>
    <a href="/homelab/cloud/"><b>클라우드 · stg</b><span>Terraform으로 EKS 노드 7대 · AZ 3개, RDS · ElastiCache 관리형</span></a>
  </div>

  <div class="hl-index-group">
    <span class="hl-index-head">배포 · 관측</span>
    <a href="/homelab/cicd/"><b>CI/CD</b><span>GitLab CI 1회 빌드 · stg 수동 승격 · ArgoCD 허브 동기화</span></a>
    <a href="/homelab/observability/"><b>옵저버빌리티</b><span>Alloy · Mimir · Loki · Tempo, 부하 테스트 판정은 서버 지표 기준</span></a>
  </div>

  <div class="hl-index-group">
    <span class="hl-index-head">서비스 · 검증</span>
    <a href="/homelab/service/"><b>대기열 예매 서비스</b><span>queue(Go · Redis) · booking(Spring · MySQL), Kafka로 입장 전달</span></a>
    <a href="/homelab/capacity/"><b>부하 테스트</b><span>k6 발생기 4대로 5만 명, SLO 5개 통과</span></a>
  </div>

</div>

<!-- 기록과 코드 — 프로젝트 페이지 끝의 저장소 표기와 같은 한 줄(설명 없음, github.com/sss654654/ 는 첫 이름에만).
     순서 infra → onprem → terraform → 블로그. 외부 링크 표시는 테마가 붙인다 -->

## 기록 · 저장소

[github.com/sss654654/cgv-infra](https://github.com/sss654654/cgv-infra) · [cgv-onprem(앱 소스)](https://github.com/sss654654/cgv-onprem) · [cgv-terraform](https://github.com/sss654654/cgv-terraform) · [HomeLab 시리즈(블로그)](https://zed6740.tistory.com/category/HomeLab)
{:.hl-more}
