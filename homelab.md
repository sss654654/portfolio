---
layout: page
title: HomeLab
description: >
  온프레미스 dev · AWS stg
permalink: /homelab/
---

<!-- 오버뷰 — 홈은 "어떤 엔지니어이고 무엇을 했나", 여기는 "HomeLab 이 무엇인가". 이력 · 목적 변화는 서술하지 않는다.
     한 문장에 한 가지: 두 클러스터의 역할 → 둘의 관계(dev 한계 → stg) → 둘을 잇는 배포 경로(아래 구성도로 넘어간다).
     서비스는 만든 목적이 아니라 올린 워크로드. 5만 명 실측은 홈 리드와 부하 카드가 말한다. -->

노트북 k3s의 **dev**는 공개 데모 · 개발 환경, AWS EKS의 **stg**는 prd 스펙 산정용 부하 테스트 환경입니다.
stg는 dev가 3만 명 부하에서 노드 한계에 도달한 뒤 Terraform으로 구성했습니다.
두 클러스터에는 대기열 예매 서비스를 데스크탑 GitLab&nbsp;CI와 노트북 ArgoCD 하나로 배포합니다.
{:.lead}

<!-- 구성도 — 코드가 이미지가 되어 레지스트리 둘에 오르고 각 클러스터가 pull 한다(실선).
     ArgoCD 가 dev 와 stg 를 동기화한다(점선). 사용자는 dev, 부하 발생기는 stg 로.
     상자 안은 이름과 로고만 — image-updater · webhook · 승격 job 같은 세부는 CI/CD 카드에.
     점 여덟이 14초 한 바퀴 — 요청(빨강) → 이미지 push(주황) → 동기화(파랑) → 이미지 pull(주황).
     pull 이 동기화 뒤라는 순서는 움직임으로만 보인다. prefers-reduced-motion 이면 점은 숨는다.
     폰에서는 줄이면 글자가 5px 아래로 떨어져 가로로 넘겨 본다(hl-diagram-scroll). -->
<figure class="hl-diagram hl-diagram-lg hl-diagram-hero hl-diagram-scroll" markdown="0">
<svg viewBox="0 0 760 350" role="img" aria-label="개발자가 머지한 코드를 데스크탑 GitLab CI가 이미지로 만들어 GitLab 레지스트리(자동)와 ECR(수동 승격)에 올리고, 각 클러스터가 자기 레지스트리에서 pull 한다. 노트북 k3s dev 안 ArgoCD가 dev와 AWS EKS stg를 동기화한다. 사용자는 dev를, 부하 발생기는 stg를 쓴다">
  <defs>
    <marker id="hla-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/>
    </marker>
  </defs>

  <!-- 개발자 → 데스크탑 GitLab CI -->
  <rect x="10" y="20" width="84" height="52" rx="9" class="hla-box"/>
  <circle cx="27" cy="40" r="5.5" class="hla-glyph"/>
  <path d="M17,57 C17,46 37,46 37,57" class="hla-glyph"/>
  <text x="44" y="51" class="hla-t">개발자</text>
  <line x1="94" y1="46" x2="138" y2="46" class="hla-ln" marker-end="url(#hla-arrow)"/>
  <text x="117" y="37" class="hla-s" text-anchor="middle">git push</text>

  <rect x="140" y="20" width="480" height="52" rx="9" class="hla-box"/>
  <image href="/assets/img/icons/gitlab.svg" x="308" y="34" width="24" height="24"/>
  <text x="340" y="51" class="hla-t">데스크탑 · GitLab CI</text>

  <!-- 이미지 — CI → 레지스트리 둘 → 각 클러스터 -->
  <line x1="245" y1="72" x2="245" y2="110" class="hla-ln" marker-end="url(#hla-arrow)"/>
  <text x="253" y="95" class="hla-s">자동</text>
  <line x1="515" y1="72" x2="515" y2="110" class="hla-ln" marker-end="url(#hla-arrow)"/>
  <text x="523" y="95" class="hla-s">수동 승격</text>

  <rect x="140" y="112" width="210" height="40" rx="9" class="hla-box"/>
  <image href="/assets/img/icons/gitlab.svg" x="152" y="123" width="18" height="18"/>
  <text x="178" y="137" class="hla-c">GitLab 레지스트리</text>

  <rect x="410" y="112" width="210" height="40" rx="9" class="hla-box"/>
  <image href="/assets/img/icons/aws-ecr.png" x="422" y="123" width="18" height="18"/>
  <text x="448" y="137" class="hla-c">ECR</text>

  <line x1="245" y1="152" x2="245" y2="186" class="hla-ln" marker-end="url(#hla-arrow)"/>
  <text x="253" y="173" class="hla-s">pull</text>
  <line x1="515" y1="152" x2="515" y2="186" class="hla-ln" marker-end="url(#hla-arrow)"/>
  <text x="523" y="173" class="hla-s">pull</text>

  <!-- 노트북 k3s dev -->
  <rect x="140" y="188" width="210" height="128" rx="12" class="hla-outer"/>
  <image href="/assets/img/icons/kubernetes.svg" x="152" y="199" width="18" height="18"/>
  <text x="176" y="213" class="hla-t">노트북 · k3s dev</text>
  <rect x="152" y="222" width="186" height="30" rx="8" class="hla-box"/>
  <image href="/assets/img/icons/ticket.svg" x="160" y="228" width="18" height="18"/>
  <text x="186" y="241" class="hla-c">대기열 서비스</text>
  <rect x="152" y="274" width="186" height="30" rx="8" class="hla-box"/>
  <image href="/assets/img/icons/argo.svg" x="160" y="280" width="18" height="18"/>
  <text x="186" y="293" class="hla-c">ArgoCD</text>
  <line x1="245" y1="274" x2="245" y2="254" class="hla-ln hla-dash" marker-end="url(#hla-arrow)"/>

  <!-- AWS EKS stg -->
  <rect x="410" y="188" width="210" height="128" rx="12" class="hla-outer"/>
  <image href="/assets/img/icons/aws-eks.png" x="422" y="199" width="18" height="18"/>
  <text x="446" y="213" class="hla-t">AWS · EKS stg</text>
  <rect x="422" y="222" width="186" height="30" rx="8" class="hla-box"/>
  <image href="/assets/img/icons/ticket.svg" x="430" y="228" width="18" height="18"/>
  <text x="456" y="241" class="hla-c">대기열 서비스</text>
  <rect x="422" y="274" width="186" height="30" rx="8" class="hla-box"/>
  <image href="/assets/img/icons/aws-rds.png" x="430" y="280" width="18" height="18"/>
  <image href="/assets/img/icons/aws-elasticache.png" x="452" y="280" width="18" height="18"/>
  <text x="478" y="293" class="hla-c">RDS · ElastiCache</text>

  <!-- ArgoCD → stg 동기화 -->
  <path d="M338,289 H380 V237 H420" class="hla-ln hla-dash" fill="none" marker-end="url(#hla-arrow)"/>
  <text x="380" y="229" class="hla-s" text-anchor="middle">동기화</text>

  <!-- 사용자 → dev · 부하 발생기 → stg -->
  <rect x="10" y="220" width="108" height="34" rx="9" class="hla-box"/>
  <circle cx="30" cy="231" r="5" class="hla-glyph"/>
  <path d="M21,247 C21,238 39,238 39,247" class="hla-glyph"/>
  <text x="48" y="242" class="hla-t">사용자</text>
  <line x1="118" y1="237" x2="150" y2="237" class="hla-ln" marker-end="url(#hla-arrow)"/>

  <rect x="642" y="220" width="108" height="34" rx="9" class="hla-box"/>
  <image href="/assets/img/icons/k6.svg" x="652" y="228" width="18" height="18"/>
  <text x="676" y="242" class="hla-t">부하 발생기</text>
  <line x1="642" y1="237" x2="610" y2="237" class="hla-ln" marker-end="url(#hla-arrow)"/>

  <!-- 흐르는 점 — 요청 둘 → 이미지 push 둘 → 동기화 둘 → 이미지 pull 둘 -->
  <circle class="hla-dot hla-dot-u" r="4.5" opacity="0">
    <animateMotion dur="14s" begin="1s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.01;0.08;1" keyPoints="0;0;1;1" path="M118,237 L190,237"/>
    <animate attributeName="opacity" dur="14s" begin="1s" repeatCount="indefinite"
      keyTimes="0;0.01;0.02;0.07;0.08;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-u" r="4.5" opacity="0">
    <animateMotion dur="14s" begin="1s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.10;0.17;1" keyPoints="0;0;1;1" path="M642,237 L560,237"/>
    <animate attributeName="opacity" dur="14s" begin="1s" repeatCount="indefinite"
      keyTimes="0;0.10;0.11;0.16;0.17;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-g" r="4.5" opacity="0">
    <animateMotion dur="14s" begin="1s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.20;0.36;1" keyPoints="0;0;1;1" path="M94,46 L245,46 L245,132"/>
    <animate attributeName="opacity" dur="14s" begin="1s" repeatCount="indefinite"
      keyTimes="0;0.20;0.21;0.35;0.36;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-g" r="4.5" opacity="0">
    <animateMotion dur="14s" begin="1s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.38;0.56;1" keyPoints="0;0;1;1" path="M94,46 L515,46 L515,132"/>
    <animate attributeName="opacity" dur="14s" begin="1s" repeatCount="indefinite"
      keyTimes="0;0.38;0.39;0.55;0.56;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-v" r="4.5" opacity="0">
    <animateMotion dur="14s" begin="1s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.59;0.65;1" keyPoints="0;0;1;1" path="M245,289 L245,237"/>
    <animate attributeName="opacity" dur="14s" begin="1s" repeatCount="indefinite"
      keyTimes="0;0.59;0.60;0.64;0.65;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-v" r="4.5" opacity="0">
    <animateMotion dur="14s" begin="1s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.66;0.77;1" keyPoints="0;0;1;1" path="M338,289 L380,289 L380,237 L470,237"/>
    <animate attributeName="opacity" dur="14s" begin="1s" repeatCount="indefinite"
      keyTimes="0;0.66;0.67;0.76;0.77;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-g" r="4.5" opacity="0">
    <animateMotion dur="14s" begin="1s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.80;0.87;1" keyPoints="0;0;1;1" path="M245,132 L245,196"/>
    <animate attributeName="opacity" dur="14s" begin="1s" repeatCount="indefinite"
      keyTimes="0;0.80;0.81;0.86;0.87;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-g" r="4.5" opacity="0">
    <animateMotion dur="14s" begin="1s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.88;0.95;1" keyPoints="0;0;1;1" path="M515,132 L515,196"/>
    <animate attributeName="opacity" dur="14s" begin="1s" repeatCount="indefinite"
      keyTimes="0;0.88;0.89;0.94;0.95;1" values="0;0;1;1;0;0"/>
  </circle>

  <!-- 범례 — 한 줄 -->
  <circle cx="16" cy="336" r="4.5" fill="#e03131"/>
  <text x="26" y="340" class="hla-s">요청 (dev · stg)</text>
  <circle cx="126" cy="336" r="4.5" fill="#f08c2e"/>
  <text x="136" y="340" class="hla-s">이미지 push · pull</text>
  <circle cx="246" cy="336" r="4.5" fill="#2f6fdb"/>
  <text x="256" y="340" class="hla-s">ArgoCD 동기화</text>
</svg>
<figcaption>dev는 DB · 캐시 · Kafka까지 클러스터 안, stg는 DB · 캐시를 AWS 관리형으로 분리. GitLab이 사설망에 있어 stg는 ECR 승격과 노트북 ArgoCD의 원격 동기화로 배포 — 이미지는 두 환경 동일.</figcaption>
</figure>

<!-- 목차 — 세 묶음 · 여섯 줄. 이 페이지의 그림은 위 구성도 하나뿐이라 카드 테두리 없이 목록으로 둔다.
     묶음은 구성도와 같은 축: 좌우 클러스터 둘 = 환경 · 위 파이프라인 = 배포 · 관측 · 서비스 상자와 발생기 = 서비스 · 검증.
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
    <span class="hl-index-head">배포 · 관측 — 두 환경 공통</span>
    <a href="/homelab/cicd/"><b>CI/CD</b><span>GitLab CI 1회 빌드 · stg 수동 승격 · ArgoCD 허브 동기화</span></a>
    <a href="/homelab/observability/"><b>옵저버빌리티</b><span>Alloy · Mimir · Loki · Tempo, 부하 판정은 서버 지표 기준</span></a>
  </div>

  <div class="hl-index-group">
    <span class="hl-index-head">서비스 · 검증</span>
    <a href="/homelab/service/"><b>대기열 예매 서비스</b><span>queue(Go · Redis) · booking(Spring · MySQL), Kafka로 입장 전달</span></a>
    <a href="/homelab/capacity/"><b>부하 테스트</b><span>k6 발생기 4대로 5만 명, SLO 5개 통과</span></a>
  </div>

</div>

<!-- 기록과 코드 — 위 목차와 같은 줄 모양(이름 + 구절) -->

## 기록 · 저장소

<div class="hl-index" markdown="0">

  <div class="hl-index-group">
    <a href="https://zed6740.tistory.com/category/HomeLab"><b>블로그 · HomeLab 시리즈</b><span>온프레미스 선택부터 인터넷 공개까지 구축 기록</span></a>
    <a href="https://github.com/sss654654/cgv-infra"><b>GitHub · cgv-infra</b><span>클러스터 · 배포 정의, dev · stg 환경 값</span></a>
    <a href="https://github.com/sss654654/cgv-terraform"><b>GitHub · cgv-terraform</b><span>AWS 자원, 유지용 bootstrap · 삭제용 stg 두 state</span></a>
    <a href="https://github.com/sss654654/cgv-onprem"><b>GitHub · cgv-onprem</b><span>앱 소스, queue(Go) · booking(Spring) · frontend</span></a>
  </div>

</div>
