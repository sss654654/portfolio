---
layout: page
title: 홈랩
description: >
  노트북 한 대에 세운 k3s(dev)와 Terraform으로 세운 EKS(stg) — 파이프라인 하나, ArgoCD 허브 하나가 두 클러스터에 같은 이미지를 배포합니다
permalink: /homelab/
---

<!-- 오버뷰 — 환경 둘의 역할과 그 둘을 잇는 GitOps 를 세 줄로. 그림은 흐름도(누가 → 무엇을 → 어디로). -->

노트북 한 대의 k3s가 **dev** — 개발과 데모 시연을 위해 인터넷에 공개한 환경입니다.
Terraform으로 세운 AWS EKS가 **stg** — prd로 갈 스펙을 재기 위해 부하 테스트를 돌린 클라우드 환경입니다.
두 클러스터는 데스크탑 GitLab의 파이프라인 하나와 노트북 안 ArgoCD 허브 하나가 GitOps로 제어합니다 — 허브-스포크 멀티클러스터 구성입니다.
아래가 그 흐름입니다.
{:.lead}

<!-- 흐름도 — 개발자 push → GitLab CI → 레지스트리 둘 → 클러스터 둘. 사용자는 dev 데모로, 발생기는 stg 로.
     허브는 dev(같은 클러스터)와 stg(EKS API) 둘에 동기화. image-updater · webhook 같은 배관은 CI/CD 카드에.
     점 여섯이 12초 한 바퀴 — 요청(빨강) → 이미지(주황) → 동기화(파랑). prefers-reduced-motion 이면 정지 -->
<figure class="hl-diagram" markdown="0">
<svg viewBox="0 0 760 440" role="img" aria-label="개발자가 push 한 코드를 데스크탑 GitLab CI 가 이미지로 만들어 GitLab 레지스트리와 ECR 에 올리고, 노트북 k3s(dev)와 AWS EKS(stg)가 각각 받는다. 사용자는 dev 데모를 쓰고 부하 발생기는 stg 를 5만 명으로 시험한다. 노트북 안 ArgoCD 허브가 dev 와 stg 둘을 동기화한다">
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

    <line x1="270" y1="164" x2="270" y2="186" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <text x="278" y="180" class="hla-s2">pull</text>
    <line x1="490" y1="164" x2="490" y2="186" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <text x="498" y="180" class="hla-s2">pull</text>
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
    <text x="430" y="313" class="hla-s2">AWS 관리형 · 5만 명 통과</text>

    <path d="M360,300 H380 V250 H398" class="hla-ln hla-dash" fill="none" marker-end="url(#hla-arrow)"/>
    <text x="380" y="356" class="hla-s2" text-anchor="middle">허브 → stg 동기화 — EKS API · 집 공인 IP 만 허용</text>
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
    <text x="612" y="236" class="hla-t">부하 발생기 ×4</text>
    <text x="612" y="256" class="hla-s">k6 · 5만 명 · 관문 다섯</text>
    <line x1="602" y1="240" x2="592" y2="240" class="hla-ln" marker-end="url(#hla-arrow)"/>
  </g>

  <!-- 흐르는 점 — 요청 둘 → 이미지 둘 → 동기화 둘 -->
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
      keyTimes="0;0.36;0.58;1" keyPoints="0;0;1;1" path="M100,50 L270,50 L270,236"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.36;0.38;0.56;0.58;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-g" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.60;0.82;1" keyPoints="0;0;1;1" path="M100,50 L490,50 L490,236"/>
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
    <text x="41" y="410" class="hla-s">이미지 — push 에서 클러스터까지</text>
    <circle cx="30" cy="424" r="4.5" fill="#2f6fdb"/>
    <text x="41" y="428" class="hla-s">동기화 — ArgoCD 허브 → dev · stg</text>
  </g>
</svg>
<figcaption>이미지는 한 번 만들어 두 레지스트리에 서고, 두 클러스터가 각자 받습니다. 배포 정의는 노트북 안 ArgoCD 허브가 dev와 stg에 같이 맞춥니다.
그 사이 배관(image-updater · webhook · 승격 job)은 CI/CD 카드에 있습니다.</figcaption>
</figure>

<!-- 카드 여섯 — 환경 둘(온프렘 · 클라우드) → 둘에 공통인 것(CI/CD · 옵저버빌리티) → 그 위의 서비스 → 부하 -->

## 구성

<div class="hlc-grid" markdown="0">

  <a class="hlc-card" href="/homelab/onprem/">
    <img class="hlc-img" src="/assets/img/homelab/onprem-thumb.png" alt="온프렘 구조도 — 사용자 · 관리자 · 배포 세 경로가 노트북 안 방화벽 VM을 지나 k3s 클러스터에 닿는 그림">
    <span class="hlc-tag">온프렘 · dev</span>
    <span class="hlc-title">Proxmox · k3s · OPNsense로 dev 환경 구축</span>
    <span class="hlc-desc">노트북 한 대에 VM 세 대로 HA 클러스터를 세우고, 노드를 방화벽 뒤 격리망으로 옮겼습니다. 인터넷에 열린 포트는 서비스용 443과 관리 터널 51820, 둘입니다.</span>
  </a>

  <a class="hlc-card" href="/homelab/cloud/">
    <img class="hlc-img" src="/assets/img/homelab/cloud-thumb.png" alt="클라우드 구성도 — VPC 안 AZ 셋에 노드 일곱과 각 노드의 파드, ALB, 클러스터 밖 RDS · ElastiCache, VPC 밖 EKS 컨트롤 플레인 · ECR · S3 · Secrets Manager">
    <span class="hlc-tag">클라우드 · stg</span>
    <span class="hlc-title">Terraform · EKS로 stg 환경 구축</span>
    <span class="hlc-desc">같은 차트 · 같은 이미지를 관리형 위에 올렸습니다. 컨트롤 플레인 · 로드밸런서 · DB · 캐시는 AWS가, Kafka와 옵저버빌리티는 클러스터 안에 — 칸마다 근거가 다릅니다.</span>
  </a>

  <a class="hlc-card" href="/homelab/cicd/">
    <img class="hlc-img" src="/assets/img/homelab/cicd-thumb.png" alt="CI/CD 흐름 — push 에서 CI, 레지스트리 둘, image-updater, cgv-infra, ArgoCD 허브를 거쳐 k3s dev 와 EKS stg 의 파드 교체까지 위에서 아래로 갈라지는 그림">
    <span class="hlc-tag">CI/CD · dev → stg</span>
    <span class="hlc-title">GitLab · ArgoCD 허브로 두 클러스터에 배포</span>
    <span class="hlc-desc">파이프라인 하나가 이미지를 만들고, 허브 하나가 dev와 stg에 배포합니다. 승격은 수동 job 하나이고, 코드에서 브라우저까지 19분 41초입니다.</span>
  </a>

  <a class="hlc-card" href="/homelab/observability/">
    <img class="hlc-img" src="/assets/img/homelab/observability-thumb.png" alt="옵저버빌리티 구조도 — metric · log · trace 세 레인을 Alloy 하나가 모아 Mimir · Loki · Tempo로 보내고 Grafana가 읽는 그림">
    <span class="hlc-tag">옵저버빌리티 · dev · stg</span>
    <span class="hlc-title">LGTM 스택을 두 클러스터에</span>
    <span class="hlc-desc">metric · log · trace를 수집기 하나로 모읍니다. 원본은 dev가 MinIO, stg가 S3이고, 부하 판정은 전부 여기서 나온 서버 지표입니다.</span>
  </a>

  <a class="hlc-card" href="/homelab/service/">
    <img class="hlc-img" src="/assets/img/homelab/service-thumb.png" alt="서비스 구조도 — queue의 대기 줄과 정원, Kafka 토픽 둘, booking의 입장 인증과 좌석이 한 회를 이루는 그림">
    <span class="hlc-tag">서비스 · 같은 이미지</span>
    <span class="hlc-title">Go · Spring · Kafka로 대기열 예매 서비스 구축</span>
    <span class="hlc-desc">열리는 시각에 인원이 몰리는 티케팅입니다. 줄 세우는 queue(Go)와 표를 파는 booking(Spring)을 나눠 Kafka로 이었고, 둘을 묶는 값이 정원입니다.</span>
  </a>

  <a class="hlc-card" href="/homelab/capacity/">
    <img class="hlc-img" src="/assets/img/homelab/capacity-thumb.png" alt="부하 테스트 결과 — 1만 · 2.5만 · 5만 명에서 관문 다섯과 요청 수 · 자원 사용을 나란히 둔 표">
    <span class="hlc-tag">부하 테스트 · dev → stg</span>
    <span class="hlc-title">k6로 dev 1만 · stg 5만 명 실측</span>
    <span class="hlc-desc">SLO 다섯을 먼저 정하고 실제 여정 그대로 부하를 걸었습니다. 5만 명에서 관문 다섯이 통과했고, 다음 축은 파드당 동시 요청 수입니다.</span>
  </a>

</div>

<!-- 기록과 코드 -->

## 기록 · 저장소

시작한 날부터 편별로 블로그에 남겼습니다.

* [HomeLab 시리즈](https://zed6740.tistory.com/category/HomeLab) — 왜 온프렘인지부터 인터넷 공개까지
* [cgv-infra](https://github.com/sss654654/cgv-infra) — 클러스터와 배포 정의. dev · stg 환경 값이 전부 여기 있습니다
* [cgv-terraform](https://github.com/sss654654/cgv-terraform) — AWS 자원. bootstrap과 stg, 두 state
* [cgv-onprem](https://github.com/sss654654/cgv-onprem) — 앱 소스. queue(Go) · booking(Spring) · frontend
