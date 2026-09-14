---
layout: page
title: 홈랩
description: >
  온프레미스(dev)와 AWS(stg) 두 환경을 직접 구축하고, 파이프라인 하나로 배포합니다
permalink: /homelab/
---

<!-- 오버뷰 — 환경 둘의 역할 · 둘이 생긴 순서 · 둘을 잇는 GitOps. 그림은 흐름도(누가 → 무엇을 → 어디로). -->

**dev**는 노트북 k3s에 세워 개발 · 데모 시연용으로 인터넷에 공개한 환경입니다.
3만 명 부하 테스트에서 노드가 한계에 닿자, prd 스펙을 재려고 같은 서비스를 Terraform · AWS EKS로 세운 **stg**에 올려 5만 명까지 실측했습니다.
{:.lead}

<!-- 흐름도 — 개발자 push → GitLab CI → 레지스트리 둘(여기서 이미지가 멈춘다). 사용자는 dev 데모로, 발생기는 stg 로.
     ArgoCD 허브가 cgv-infra 의 배포 정의를 읽어(오른쪽 · 아래를 도는 점선) dev · stg 에 동기화하고, 그 뒤 노드가 자기 레지스트리에서 pull(점선).
     image-updater · webhook 같은 배관은 CI/CD 카드에.
     점 여섯이 12초 한 바퀴 — 요청(빨강) → 이미지(주황, 레지스트리까지) → 동기화(파랑). prefers-reduced-motion 이면 정지 -->
<figure class="hl-diagram" markdown="0">
<svg viewBox="0 0 760 440" role="img" aria-label="개발자가 push 한 코드를 데스크탑 GitLab CI 가 이미지로 만들어 GitLab 레지스트리(자동)와 ECR(수동 승격)에 올린다. 노트북 k3s 안 ArgoCD 허브가 GitLab 의 배포 정의를 읽어 dev 와 stg 에 동기화하고, 각 클러스터 노드가 자기 레지스트리에서 이미지를 받는다. 사용자는 dev 데모를 쓰고 부하 발생기는 stg 를 5만 명으로 시험한다">
  <defs>
    <marker id="hla-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/>
    </marker>
  </defs>

  <!-- 개발자 → 데스크탑 GitLab CI -->
  <g class="hla-g hla-g1">
    <rect x="40" y="24" width="120" height="52" rx="9" class="hla-box"/>
    <circle cx="58" cy="44" r="5.5" class="hla-glyph"/>
    <path d="M48,61 C48,50 68,50 68,61" class="hla-glyph"/>
    <text x="78" y="46" class="hla-t">개발자</text>
    <text x="78" y="64" class="hla-s">push · 머지</text>
    <line x1="160" y1="50" x2="198" y2="50" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <rect x="200" y="24" width="380" height="52" rx="9" class="hla-box"/>
    <image href="/assets/img/icons/gitlab.svg" x="210" y="38" width="24" height="24"/>
    <text x="242" y="46" class="hla-t">데스크탑 GitLab — CI 5단 → 이미지</text>
    <text x="242" y="64" class="hla-s">check · test · build · scan · publish</text>
  </g>

  <!-- 레지스트리 둘 -->
  <g class="hla-g hla-g2">
    <line x1="270" y1="76" x2="270" y2="110" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <text x="278" y="98" class="hla-s2">자동</text>
    <line x1="490" y1="76" x2="490" y2="110" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <text x="498" y="98" class="hla-s2">수동 승격</text>

    <rect x="170" y="112" width="200" height="52" rx="9" class="hla-box"/>
    <g class="hla-glyph" transform="translate(182,126)"><rect x="0" y="4" width="11" height="9"/><rect x="4" y="0" width="11" height="9"/></g>
    <text x="206" y="134" class="hla-c">GitLab 레지스트리</text>
    <text x="182" y="153" class="hla-s2">dev 이미지 · 머지마다</text>

    <rect x="390" y="112" width="200" height="52" rx="9" class="hla-box"/>
    <image href="/assets/img/icons/aws-ecr.png" x="400" y="126" width="24" height="24"/>
    <text x="432" y="134" class="hla-c">ECR ×3</text>
    <text x="432" y="153" class="hla-s2">stg 이미지 · dev 와 같은 이미지</text>

    <!-- 노드가 받는 선 — 동기화 뒤에 일어나므로 점선 -->
    <line x1="270" y1="164" x2="270" y2="186" class="hla-ln hla-dash" marker-end="url(#hla-arrow)"/>
    <text x="278" y="180" class="hla-s2">sync 뒤 pull</text>
    <line x1="490" y1="164" x2="490" y2="186" class="hla-ln hla-dash" marker-end="url(#hla-arrow)"/>
    <text x="498" y="180" class="hla-s2">sync 뒤 pull</text>
  </g>

  <!-- 클러스터 둘 -->
  <g class="hla-g hla-g3">
    <rect x="170" y="188" width="200" height="150" rx="12" class="hla-outer"/>
    <image href="/assets/img/icons/kubernetes.svg" x="180" y="196" width="18" height="18"/>
    <text x="204" y="210" class="hla-t">노트북 — k3s dev</text>
    <rect x="180" y="220" width="180" height="40" rx="8" class="hla-box"/>
    <image href="/assets/img/icons/ticket.svg" x="188" y="230" width="20" height="20"/>
    <text x="214" y="237" class="hla-c">대기열 서비스</text>
    <text x="214" y="252" class="hla-s2">개발 · 데모 — 인터넷 공개</text>
    <rect x="180" y="274" width="180" height="52" rx="8" class="hla-box"/>
    <image href="/assets/img/icons/argo.svg" x="188" y="289" width="20" height="20"/>
    <text x="214" y="294" class="hla-c">ArgoCD 허브</text>
    <text x="214" y="311" class="hla-s2">dev · stg 동기화</text>
    <line x1="270" y1="274" x2="270" y2="262" class="hla-ln hla-dash" marker-end="url(#hla-arrow)"/>

    <rect x="390" y="188" width="200" height="150" rx="12" class="hla-outer"/>
    <image href="/assets/img/icons/aws-eks.png" x="400" y="196" width="20" height="20"/>
    <text x="426" y="210" class="hla-t">AWS — EKS stg</text>
    <rect x="400" y="220" width="180" height="40" rx="8" class="hla-box"/>
    <image href="/assets/img/icons/ticket.svg" x="408" y="230" width="20" height="20"/>
    <text x="434" y="237" class="hla-c">대기열 서비스</text>
    <text x="434" y="252" class="hla-s2">prd 스펙 산정 · 부하 테스트</text>
    <rect x="400" y="274" width="180" height="52" rx="8" class="hla-box"/>
    <image href="/assets/img/icons/aws-rds.png" x="408" y="284" width="16" height="16"/>
    <image href="/assets/img/icons/aws-elasticache.png" x="408" y="302" width="16" height="16"/>
    <text x="430" y="296" class="hla-s2">RDS · ElastiCache · ALB</text>
    <text x="430" y="313" class="hla-s2">AWS 관리형</text>

    <path d="M360,300 H380 V250 H398" class="hla-ln hla-dash" fill="none" marker-end="url(#hla-arrow)"/>
    <text x="380" y="356" class="hla-s2" text-anchor="middle">허브 → stg 동기화 — EKS API · 집 공인 IP만 허용</text>

    <!-- GitOps — ArgoCD 가 GitLab 의 배포 정의(cgv-infra)를 읽는다. 다른 선 · 글자와 안 겹치게 오른쪽 가장자리와 아래를 돈다 -->
    <path d="M580,44 H752 V372 H200 V330" class="hla-ln hla-dash" fill="none" marker-end="url(#hla-arrow)"/>
    <text x="745" y="366" class="hla-s2" text-anchor="end">배포 정의(cgv-infra) 읽기</text>
  </g>

  <!-- 사용자 · 부하 발생기 -->
  <g class="hla-g hla-g1">
    <rect x="14" y="210" width="144" height="60" rx="9" class="hla-box"/>
    <circle cx="32" cy="232" r="5.5" class="hla-glyph"/>
    <path d="M22,249 C22,238 42,238 42,249" class="hla-glyph"/>
    <text x="52" y="236" class="hla-t">사용자</text>
    <text x="24" y="261" class="hla-a">ticket.subinhong.dev · 데모</text>
    <line x1="158" y1="240" x2="168" y2="240" class="hla-ln" marker-end="url(#hla-arrow)"/>

    <rect x="602" y="210" width="144" height="60" rx="9" class="hla-box"/>
    <image href="/assets/img/icons/k6.svg" x="611" y="222" width="18" height="18"/>
    <text x="634" y="236" class="hla-t">부하 발생기 ×4</text>
    <text x="612" y="256" class="hla-s">k6 · 5만 명 · SLO 5개</text>
    <line x1="602" y1="240" x2="592" y2="240" class="hla-ln" marker-end="url(#hla-arrow)"/>
  </g>

  <!-- 흐르는 점 — 요청 둘 → 이미지 둘(레지스트리까지) → 동기화 둘 -->
  <circle class="hla-dot hla-dot-u" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.02;0.16;1" keyPoints="0;0;1;1" path="M40,240 L262,240"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.02;0.04;0.14;0.16;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-u" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.18;0.32;1" keyPoints="0;0;1;1" path="M700,240 L498,240"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.18;0.20;0.30;0.32;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-g" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.36;0.58;1" keyPoints="0;0;1;1" path="M100,50 L270,50 L270,136"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.36;0.38;0.56;0.58;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-g" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.60;0.82;1" keyPoints="0;0;1;1" path="M100,50 L490,50 L490,136"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.60;0.62;0.80;0.82;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-v" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.84;0.90;1" keyPoints="0;0;1;1" path="M270,298 L270,244"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.84;0.85;0.89;0.90;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-v" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.90;0.99;1" keyPoints="0;0;1;1" path="M360,300 L380,300 L380,250 L470,250"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.90;0.91;0.98;0.99;1" values="0;0;1;1;0;0"/>
  </circle>

  <!-- 범례 -->
  <g class="hla-g hla-g3">
    <circle cx="30" cy="388" r="4.5" fill="#e03131"/>
    <text x="41" y="392" class="hla-s">요청 — 사용자는 dev, 부하 발생기는 stg</text>
    <circle cx="30" cy="406" r="4.5" fill="#f08c2e"/>
    <text x="41" y="410" class="hla-s">이미지 — push부터 레지스트리까지</text>
    <circle cx="30" cy="424" r="4.5" fill="#2f6fdb"/>
    <text x="41" y="428" class="hla-s">동기화 — ArgoCD → dev · stg</text>
  </g>
</svg>
<figcaption>이미지는 한 번 빌드해 GitLab 레지스트리와 ECR에 저장합니다. ArgoCD가 GitLab의 배포 정의를 읽어 dev · stg에 동기화하면, 각 클러스터 노드가 자기 레지스트리에서 이미지를 받습니다.
세부 경로(image-updater · webhook · 승격 job)는 CI/CD 카드에 있습니다.</figcaption>
</figure>

<!-- 카드 여섯 — 환경 둘(온프레미스 · 클라우드) → 둘에 공통인 것(CI/CD · 옵저버빌리티) → 그 위의 서비스 → 부하 -->

## 구성

<div class="hlc-grid" markdown="0">

  <a class="hlc-card" href="/homelab/onprem/">
    <img class="hlc-img" src="/assets/img/homelab/onprem-thumb.png" alt="온프레미스 · dev — 노트북 한 대로 k3s HA 클러스터. Proxmox · Kubernetes · OPNsense · Traefik · WireGuard, 인터넷에 연 포트 443 · 51820">
    <span class="hlc-tag">온프레미스 · dev</span>
    <span class="hlc-title">Proxmox · k3s · OPNsense로 dev 환경 구축</span>
    <span class="hlc-desc">노트북 1대 · VM 3대 HA 클러스터를 방화벽 뒤 격리망에 구성. 인터넷 개방 포트는 443 · 51820 두 개입니다.</span>
  </a>

  <a class="hlc-card" href="/homelab/cloud/">
    <img class="hlc-img" src="/assets/img/homelab/cloud-thumb.png" alt="클라우드 · stg — Terraform으로 AWS EKS 구축. EKS · RDS · ElastiCache · ALB · ECR, 자원 56개">
    <span class="hlc-tag">클라우드 · stg</span>
    <span class="hlc-title">Terraform · EKS로 stg 환경 구축</span>
    <span class="hlc-desc">같은 차트 · 이미지를 AWS 관리형 위에 구성. DB · 캐시 · 로드밸런서는 AWS, Kafka · 관측은 클러스터 안에 두었습니다.</span>
  </a>

  <a class="hlc-card" href="/homelab/cicd/">
    <img class="hlc-img" src="/assets/img/homelab/cicd-thumb.png" alt="CI/CD · dev → stg — 파이프라인 하나, 클러스터 둘. GitLab · ArgoCD · ECR · Kubernetes · EKS, 코드에서 브라우저까지 19분 41초">
    <span class="hlc-tag">CI/CD · dev → stg</span>
    <span class="hlc-title">GitLab · ArgoCD로 두 클러스터에 배포</span>
    <span class="hlc-desc">파이프라인 1개 · ArgoCD 1개로 dev · stg 배포. stg 승격은 수동 job, 코드 → 브라우저 19분 41초입니다.</span>
  </a>

  <a class="hlc-card" href="/homelab/observability/">
    <img class="hlc-img" src="/assets/img/homelab/observability-thumb.png" alt="옵저버빌리티 · dev · stg — metric · log · trace LGTM 스택. Alloy · Mimir · Loki · Tempo · Grafana, 부하 판정 19회">
    <span class="hlc-tag">옵저버빌리티 · dev · stg</span>
    <span class="hlc-title">LGTM 스택을 두 클러스터에</span>
    <span class="hlc-desc">metric · log · trace를 Alloy 하나로 수집. 원본은 dev MinIO · stg S3, 부하 판정 기준 지표입니다.</span>
  </a>

  <a class="hlc-card" href="/homelab/service/">
    <img class="hlc-img" src="/assets/img/homelab/service-thumb.png" alt="서비스 — 대기열 · 예매 분리, Kafka로 연결. Go · Spring · Kafka · Redis · MySQL, 정원 1,000">
    <span class="hlc-tag">서비스 · 같은 이미지</span>
    <span class="hlc-title">Go · Spring · Kafka로 대기열 예매 서비스 구축</span>
    <span class="hlc-desc">대기열 queue(Go)와 예매 booking(Spring)을 Kafka로 분리 연결. 둘을 묶는 값은 정원입니다.</span>
  </a>

  <a class="hlc-card" href="/homelab/capacity/">
    <img class="hlc-img" src="/assets/img/homelab/capacity-thumb.png" alt="부하 테스트 — k6 50,000명 실측. 1만 · 2.5만 · 5만 단계, 5만 명 회차 SLO 5개 통과">
    <span class="hlc-tag">부하 테스트 · dev → stg</span>
    <span class="hlc-title">k6로 dev 1만 · stg 5만 명 실측</span>
    <span class="hlc-desc">SLO 5개를 먼저 확정하고 실제 사용자 여정으로 부하. 5만 명 SLO 통과, 다음 병목은 파드당 동시 요청 수입니다.</span>
  </a>

</div>

<!-- 기록과 코드 -->

## 기록 · 저장소

* [HomeLab 시리즈](https://zed6740.tistory.com/category/HomeLab) — 온프레미스 선택 이유부터 인터넷 공개까지, 편별 구축 기록
* [cgv-infra](https://github.com/sss654654/cgv-infra) — 클러스터 · 배포 정의, dev · stg 환경 값
* [cgv-terraform](https://github.com/sss654654/cgv-terraform) — AWS 자원, bootstrap · stg 두 state
* [cgv-onprem](https://github.com/sss654654/cgv-onprem) — 앱 소스, queue(Go) · booking(Spring) · frontend
