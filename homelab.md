---
layout: page
title: 홈랩
description: >
  노트북 한 대에 세운 k3s(dev)와 Terraform으로 세운 EKS(stg) — 파이프라인 하나, 허브 하나가 두 클러스터에 같은 이미지를 배달합니다
permalink: /homelab/
---

<!-- 오버뷰 — 왜(동기) → dev 에서 무엇을 했나 → 그것을 stg 로 → 아래 그림이 그 둘. -->

관리형 쿠버네티스가 만들어 주는 컨트롤 플레인 · 네트워크 · 로드밸런서 · 볼륨을 **하나씩 직접 세우려고** 쓰던 노트북을 서버로 삼았습니다.
그 위에 대기열 예매 서비스와 옵저버빌리티를 올려 인터넷에 공개하고, 부하를 걸어 스펙을 실측했습니다 — 이것이 **dev** 입니다.
그 서비스를 같은 차트 · 같은 파이프라인 · 같은 이미지로 **AWS EKS에 두 번째 환경(stg)** 으로 올려 5만 명까지 쟀습니다.
아래가 그 둘의 구성입니다.
{:.lead}

<!-- 전체 구조도 — 집(데스크탑 GitLab · 노트북 k3s dev + ArgoCD 허브)과 AWS(ECR · EKS stg · 관리형).
     집과 AWS 를 잇는 선은 둘뿐(CI → ECR · 허브 → EKS API). 점 넷이 12초 한 바퀴 —
     사용자(빨강) → dev 이미지(주황) → stg 이미지(주황) → 허브 배달(파랑).
     아이콘 = simple-icons(CC0). prefers-reduced-motion 이면 정지 -->
<figure class="hl-diagram" markdown="0">
<svg viewBox="0 0 760 450" role="img" aria-label="집의 데스크탑 GitLab이 이미지를 만들어 노트북 k3s(dev)와 AWS ECR에 올리고, 노트북 안 ArgoCD 허브가 dev와 EKS(stg) 두 클러스터에 배포 정의를 배달하는 구조. 사용자는 방화벽을 지나 dev 서비스에, stg는 ALB 뒤에 RDS와 ElastiCache를 둔다">
  <defs>
    <marker id="hla-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/>
    </marker>
    <pattern id="hla-bricks" width="18" height="12" patternUnits="userSpaceOnUse">
      <path d="M0,0.5 H18 M0,6.5 H18 M4.5,0.5 V6.5 M13.5,6.5 V12" stroke="#d94f00" stroke-opacity=".22" stroke-width="1" fill="none"/>
    </pattern>
  </defs>

  <!-- 구역 라벨 -->
  <g class="hla-g hla-g1">
    <text x="95" y="28" class="hla-zone" text-anchor="middle">인터넷</text>
    <text x="321" y="28" class="hla-zone" text-anchor="middle">집 — 온프레미스 · dev</text>
    <text x="620" y="28" class="hla-zone" text-anchor="middle">AWS ap-northeast-2 — stg</text>
  </g>

  <!-- 인터넷: 사용자 -->
  <g class="hla-g hla-g1">
    <rect x="20" y="183" width="150" height="58" rx="9" class="hla-box"/>
    <circle cx="38" cy="205" r="5.5" class="hla-glyph"/>
    <path d="M28,222 C28,211 48,211 48,222" class="hla-glyph"/>
    <text x="58" y="207" class="hla-t">사용자</text>
    <text x="58" y="225" class="hla-a">ticket.subinhong.dev</text>
    <line x1="170" y1="212" x2="188" y2="212" class="hla-ln" marker-end="url(#hla-arrow)"/>
  </g>

  <!-- 집: 데스크탑 -->
  <g class="hla-g hla-g1">
    <rect x="190" y="44" width="262" height="60" rx="9" class="hla-box"/>
    <image href="/assets/img/icons/gitlab.svg" x="200" y="59" width="24" height="24"/>
    <text x="232" y="66" class="hla-t">데스크탑 — GitLab · CI · 레지스트리</text>
    <text x="232" y="86" class="hla-s">push → 5단 파이프라인 → 이미지</text>
  </g>

  <!-- 집: 노트북 -->
  <g class="hla-g hla-g2">
    <rect x="190" y="126" width="262" height="304" rx="12" class="hla-outer"/>
    <image href="/assets/img/icons/proxmox.svg" x="204" y="136" width="20" height="20"/>
    <text x="230" y="151" class="hla-t">노트북 — Proxmox · 전부 VM</text>

    <!-- OPNsense 세로 벽 -->
    <rect x="204" y="162" width="30" height="258" rx="8" class="hla-wall"/>
    <rect x="204" y="162" width="30" height="258" rx="8" fill="url(#hla-bricks)" stroke="none"/>
    <image href="/assets/img/icons/opnsense.svg" x="208" y="170" width="22" height="22"/>
    <text x="219" y="290" text-anchor="middle" class="hla-wallc">방</text>
    <text x="219" y="310" text-anchor="middle" class="hla-wallc">화</text>
    <text x="219" y="330" text-anchor="middle" class="hla-wallc">벽</text>

    <!-- k3s dev -->
    <rect x="244" y="162" width="200" height="258" rx="10" class="hla-inner"/>
    <image href="/assets/img/icons/kubernetes.svg" x="252" y="170" width="18" height="18"/>
    <text x="276" y="184" class="hla-t">k3s dev — VM 3 · HA</text>

    <line x1="234" y1="212" x2="252" y2="212" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <rect x="254" y="194" width="182" height="46" rx="8" class="hla-box"/>
    <image href="/assets/img/icons/ticket.svg" x="262" y="206" width="20" height="20"/>
    <text x="288" y="212" class="hla-c">대기열 서비스</text>
    <text x="288" y="229" class="hla-s2">queue · booking · frontend</text>

    <rect x="254" y="248" width="182" height="34" rx="8" class="hla-box"/>
    <text x="345" y="270" text-anchor="middle" class="hla-s2">Redis · MySQL · Kafka · LGTM</text>

    <rect x="254" y="296" width="182" height="52" rx="8" class="hla-box"/>
    <image href="/assets/img/icons/argo.svg" x="262" y="311" width="20" height="20"/>
    <text x="288" y="316" class="hla-c">ArgoCD 허브</text>
    <text x="288" y="333" class="hla-s2">dev · stg 둘 다 배달</text>

    <rect x="254" y="360" width="182" height="52" rx="8" class="hla-box"/>
    <image href="/assets/img/icons/argo.svg" x="262" y="375" width="20" height="20"/>
    <text x="288" y="380" class="hla-c">image-updater</text>
    <text x="288" y="397" class="hla-s2">새 태그를 보고 tag 커밋</text>
    <line x1="345" y1="360" x2="345" y2="350" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <line x1="345" y1="296" x2="345" y2="284" class="hla-ln" marker-end="url(#hla-arrow)"/>
  </g>

  <!-- 데스크탑 → dev (이미지) · 데스크탑 → ECR (승격) -->
  <g class="hla-g hla-g2">
    <line x1="430" y1="104" x2="430" y2="124" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <text x="424" y="118" class="hla-s2" text-anchor="end">이미지 · 자동</text>
    <line x1="452" y1="74" x2="498" y2="74" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <text x="475" y="94" class="hla-s2" text-anchor="middle">버튼 하나</text>
  </g>

  <!-- AWS: ECR -->
  <g class="hla-g hla-g1">
    <rect x="500" y="44" width="240" height="60" rx="9" class="hla-box"/>
    <text x="516" y="66" class="hla-t">ECR ×3</text>
    <text x="516" y="86" class="hla-s">태그 = 커밋 해시 · dev 와 같은 이미지</text>
    <line x1="620" y1="104" x2="620" y2="124" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <text x="630" y="118" class="hla-s2">pull</text>
  </g>

  <!-- AWS: EKS stg -->
  <g class="hla-g hla-g3">
    <rect x="500" y="126" width="240" height="222" rx="12" class="hla-outer"/>
    <image href="/assets/img/icons/kubernetes.svg" x="512" y="136" width="20" height="20"/>
    <text x="538" y="151" class="hla-t">EKS stg — m5.xlarge ×7 · AZ 3</text>

    <rect x="510" y="162" width="220" height="40" rx="8" class="hla-box"/>
    <text x="520" y="179" class="hla-c">ALB · ticket-stg.subinhong.dev</text>
    <text x="520" y="194" class="hla-s2">ACM · 443 · 파드 IP 대상</text>
    <line x1="620" y1="202" x2="620" y2="212" class="hla-ln" marker-end="url(#hla-arrow)"/>

    <rect x="510" y="214" width="220" height="46" rx="8" class="hla-box"/>
    <image href="/assets/img/icons/ticket.svg" x="518" y="226" width="20" height="20"/>
    <text x="544" y="232" class="hla-c">대기열 서비스 — 같은 이미지</text>
    <text x="544" y="249" class="hla-s2">queue ×4 · booking ×2 · Kafka ×3</text>

    <rect x="510" y="270" width="220" height="40" rx="8" class="hla-box"/>
    <image href="/assets/img/icons/grafana.svg" x="518" y="280" width="20" height="20"/>
    <text x="544" y="287" class="hla-c">LGTM — S3 (IRSA)</text>
    <text x="544" y="302" class="hla-s2">부하 판 5만 명의 판정 지표</text>

    <text x="512" y="334" class="hla-s2">허브 → EKS API · 집 공인 IP 만 허용</text>
  </g>

  <!-- 허브 → EKS -->
  <g class="hla-g hla-g3">
    <line x1="436" y1="322" x2="498" y2="322" class="hla-ln hla-dash" marker-end="url(#hla-arrow)"/>
  </g>

  <!-- AWS: 관리형 -->
  <g class="hla-g hla-g3">
    <rect x="500" y="364" width="240" height="66" rx="9" class="hla-box"/>
    <text x="516" y="382" class="hla-c">클러스터 밖 — 관리형</text>
    <image href="/assets/img/icons/mysql.svg" x="516" y="392" width="16" height="16"/>
    <text x="538" y="404" class="hla-s2">RDS MySQL 8.4 · Multi-AZ</text>
    <image href="/assets/img/icons/redis.svg" x="516" y="410" width="16" height="16"/>
    <text x="538" y="422" class="hla-s2">ElastiCache Redis 7.1 · 복제본 · TLS + AUTH</text>
  </g>

  <!-- 흐르는 점 넷 — 12초 한 바퀴 -->
  <circle class="hla-dot hla-dot-u" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.04;0.22;1" keyPoints="0;0;1;1"
      path="M60,212 L219,212 L254,212 L330,212"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.04;0.06;0.20;0.22;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-g" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.28;0.44;1" keyPoints="0;0;1;1"
      path="M430,88 L430,204"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.28;0.30;0.42;0.44;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-g" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.50;0.72;1" keyPoints="0;0;1;1"
      path="M400,74 L620,74 L620,232"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.50;0.52;0.70;0.72;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-v" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.78;0.94;1" keyPoints="0;0;1;1"
      path="M345,322 L620,322 L620,262"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.78;0.80;0.92;0.94;1" values="0;0;1;1;0;0"/>
  </circle>

  <!-- 범례 -->
  <g class="hla-g hla-g3">
    <circle cx="30" cy="434" r="4.5" fill="#e03131"/>
    <text x="41" y="438" class="hla-s">사용자 요청</text>
    <circle cx="30" cy="416" r="4.5" fill="#f08c2e"/>
    <text x="41" y="420" class="hla-s">이미지</text>
    <circle cx="108" cy="416" r="4.5" fill="#2f6fdb"/>
    <text x="119" y="420" class="hla-s">허브 배달</text>
  </g>
</svg>
<figcaption>파이프라인 하나가 이미지를 만들고, 노트북 안 ArgoCD 허브가 dev와 stg 둘에 배달합니다.
집과 AWS를 잇는 선은 둘뿐입니다 — CI가 ECR로, 허브가 EKS API로. 갈리는 것은 환경 값뿐이고 코드 · 차트 · 이미지는 같습니다.</figcaption>
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
    <img class="hlc-img" src="/assets/img/homelab/cloud-thumb.png" alt="클라우드 구조도 — 집의 허브와 CI가 EKS API와 ECR로 이어지고, VPC 안에 ALB · 노드그룹 셋 · RDS · ElastiCache가 있는 그림">
    <span class="hlc-tag">클라우드 · stg</span>
    <span class="hlc-title">Terraform · EKS로 stg 환경 구축</span>
    <span class="hlc-desc">같은 차트 · 같은 이미지를 관리형 위에 올렸습니다. 컨트롤 플레인 · 로드밸런서 · DB · 캐시는 AWS가, Kafka와 옵저버빌리티는 클러스터 안에 — 칸마다 근거가 다릅니다.</span>
  </a>

  <a class="hlc-card" href="/homelab/cicd/">
    <img class="hlc-img" src="/assets/img/homelab/cicd-thumb.png" alt="CI/CD 구조도 — GitLab 파이프라인이 이미지를 레지스트리 둘에 올리고, 허브의 image-updater와 ArgoCD가 dev와 stg에 배달하는 그림">
    <span class="hlc-tag">CI/CD · dev → stg</span>
    <span class="hlc-title">GitLab · ArgoCD 허브로 두 클러스터에 배포</span>
    <span class="hlc-desc">파이프라인 하나가 이미지를 만들고, 허브 하나가 dev와 stg에 배달합니다. 승격은 버튼 하나이고, 코드에서 브라우저까지 19분 41초입니다.</span>
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
