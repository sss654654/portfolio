---
layout: page
title: HomeLab
description: >
  온프레미스 dev · AWS stg
permalink: /homelab/
---

<!-- 오버뷰 — 서비스와 두 환경의 용도 → stg 를 만든 이유와 배포 → 구성도 → 영역별 카드.
     5만 명 실측은 홈 리드와 부하 카드가 말하므로 여기서는 반복하지 않는다. -->

대기열 예매 서비스를 공개 데모용 **dev**(노트북 k3s)와 부하 테스트용 **stg**(AWS EKS)에 구축했습니다.
stg는 dev가 3만 명 부하에서 노드 한계에 도달한 뒤 Terraform으로 구성했고, 두 환경 모두 GitLab CI와 ArgoCD 하나로 배포합니다.
{:.lead}

<!-- 구성도 — 코드가 이미지가 되어 레지스트리 둘에 오르고 각 클러스터가 pull 한다(실선).
     ArgoCD 가 dev 와 stg 를 동기화한다(점선). 사용자는 dev, 부하 발생기는 stg 로.
     상자 안은 이름과 로고만 — image-updater · webhook · 승격 job 같은 세부는 CI/CD 카드에.
     점 여덟이 14초 한 바퀴 — 요청(빨강) → 이미지 push(주황) → 동기화(파랑) → 이미지 pull(주황).
     pull 이 동기화 뒤라는 순서는 움직임으로만 보인다. prefers-reduced-motion 이면 점은 숨는다.
     폰에서는 줄이면 글자가 5px 아래로 떨어져 가로로 넘겨 본다(hl-diagram-scroll). -->
<figure class="hl-diagram hl-diagram-scroll" markdown="0">
<svg viewBox="0 0 760 350" role="img" aria-label="개발자가 머지한 코드를 데스크탑 GitLab CI가 이미지로 만들어 GitLab 레지스트리(자동)와 ECR(수동 승격)에 올리고, 각 클러스터가 자기 레지스트리에서 pull 한다. 노트북 k3s dev 안 ArgoCD가 dev와 AWS EKS stg를 동기화한다. 사용자는 dev를, 부하 발생기는 stg를 쓴다">
  <defs>
    <marker id="hla-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/>
    </marker>
  </defs>

  <!-- 개발자 → 데스크탑 GitLab CI -->
  <rect x="10" y="20" width="98" height="52" rx="9" class="hla-box"/>
  <circle cx="30" cy="40" r="5.5" class="hla-glyph"/>
  <path d="M20,57 C20,46 40,46 40,57" class="hla-glyph"/>
  <text x="50" y="51" class="hla-t">개발자</text>
  <line x1="108" y1="46" x2="138" y2="46" class="hla-ln" marker-end="url(#hla-arrow)"/>
  <text x="123" y="37" class="hla-s" text-anchor="middle">push</text>

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
      keyTimes="0;0.20;0.36;1" keyPoints="0;0;1;1" path="M108,46 L245,46 L245,132"/>
    <animate attributeName="opacity" dur="14s" begin="1s" repeatCount="indefinite"
      keyTimes="0;0.20;0.21;0.35;0.36;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-g" r="4.5" opacity="0">
    <animateMotion dur="14s" begin="1s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.38;0.56;1" keyPoints="0;0;1;1" path="M108,46 L515,46 L515,132"/>
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
  <text x="26" y="340" class="hla-s">요청</text>
  <circle cx="66" cy="336" r="4.5" fill="#f08c2e"/>
  <text x="76" y="340" class="hla-s">이미지</text>
  <circle cx="126" cy="336" r="4.5" fill="#2f6fdb"/>
  <text x="136" y="340" class="hla-s">ArgoCD 동기화</text>
</svg>
<figcaption>이미지는 한 번 빌드해 dev는 GitLab 레지스트리에, stg는 같은 이미지를 수동 승격해 ECR에 저장. ArgoCD가 두 클러스터를 동기화한 뒤 각 클러스터가 자기 레지스트리에서 pull.</figcaption>
</figure>

<!-- 카드 여섯 — 글자만. 입구의 시각 요소는 위 구성도 하나로 둔다.
     태그 = 영역 이름 · 제목 = 한 일 · 설명 = 결정이나 결과 하나.
     순서: 환경 둘(온프레미스 · 클라우드) → 둘에 공통(CI/CD · 옵저버빌리티) → 그 위 서비스 → 부하 -->

## 구성

<div class="hlc-grid hlc-text" markdown="0">

  <a class="hlc-card" href="/homelab/onprem/">
    <span class="hlc-tag">온프레미스 · dev</span>
    <span class="hlc-title">노트북 1대 k3s HA 클러스터</span>
    <span class="hlc-desc">Proxmox VM 3대 · OPNsense 격리망, 인터넷 개방 포트 443 · 51820</span>
  </a>

  <a class="hlc-card" href="/homelab/cloud/">
    <span class="hlc-tag">클라우드 · stg</span>
    <span class="hlc-title">Terraform으로 구성한 AWS EKS</span>
    <span class="hlc-desc">dev와 같은 차트 · 이미지, DB · 캐시 · 로드밸런서는 AWS 관리형</span>
  </a>

  <a class="hlc-card" href="/homelab/cicd/">
    <span class="hlc-tag">CI/CD</span>
    <span class="hlc-title">파이프라인 하나로 dev · stg 배포</span>
    <span class="hlc-desc">GitLab CI · ArgoCD, dev는 머지 후 자동 · stg는 수동 승격</span>
  </a>

  <a class="hlc-card" href="/homelab/observability/">
    <span class="hlc-tag">옵저버빌리티</span>
    <span class="hlc-title">LGTM 스택으로 metric · log · trace 수집</span>
    <span class="hlc-desc">dev · stg 같은 차트, 부하 테스트는 이 지표로 판정</span>
  </a>

  <a class="hlc-card" href="/homelab/service/">
    <span class="hlc-tag">서비스</span>
    <span class="hlc-title">대기열 · 예매 서비스 분리</span>
    <span class="hlc-desc">queue(Go) · booking(Spring), Kafka로 입장 전달</span>
  </a>

  <a class="hlc-card" href="/homelab/capacity/">
    <span class="hlc-tag">부하 테스트</span>
    <span class="hlc-title">5만 명 부하 테스트 · SLO 5개 통과</span>
    <span class="hlc-desc">dev 1만 · stg 5만 명 실측, 다음 병목은 파드당 동시 요청 수</span>
  </a>

</div>

<!-- 기록과 코드 -->

## 기록 · 저장소

* [HomeLab 시리즈](https://zed6740.tistory.com/category/HomeLab) — 온프레미스 선택 이유부터 인터넷 공개까지, 편별 구축 기록
* [cgv-infra](https://github.com/sss654654/cgv-infra) — 클러스터 · 배포 정의, dev · stg 환경 값
* [cgv-terraform](https://github.com/sss654654/cgv-terraform) — AWS 자원, bootstrap · stg 두 state
* [cgv-onprem](https://github.com/sss654654/cgv-onprem) — 앱 소스, queue(Go) · booking(Spring) · frontend
