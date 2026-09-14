---
layout: page
title: 홈랩
description: >
  온프레미스 dev · 클라우드 stg — 구축 · 배포 · 관측 · 부하 테스트
permalink: /homelab/
---

<!-- 오버뷰 — 환경 둘이 생긴 순서 → 둘이 공유하는 것 → 전체 그림 → 영역별 카드. -->

**dev**는 노트북 k3s 기반 개발 · 데모 환경으로, 인터넷에 공개했습니다.
dev가 3만 명 부하에서 노드 한계에 도달해, prd 스펙 산정용 **stg**를 Terraform · AWS EKS로 구축하고 5만 명까지 실측했습니다.
두 환경은 같은 서비스 · 관측 스택으로 구성하고, 데스크탑 GitLab CI와 노트북 ArgoCD로 배포합니다.
{:.lead}

<!-- 전체 구성도 — 카드 여섯이 한 그림에 한 번씩 나오게 둔다(상세는 카드에).
     위 = 들어오는 부하(사용자 → dev · k6 부하 테스트 → stg) / 가운데 = 환경 둘(온프레미스 dev · 클라우드 stg)과
     각 환경 안의 서비스 · 옵저버빌리티 / 아래 = CI/CD(데스크탑 GitLab)가 이미지를 두 환경에.
     dev 안 ArgoCD 허브 → stg 동기화(파랑 점선). 점 다섯이 12초 한 바퀴. prefers-reduced-motion 이면 정지 -->
<figure class="hl-diagram" markdown="0">
<svg viewBox="0 0 760 428" role="img" aria-label="노트북 k3s의 온프레미스 dev와 AWS EKS의 클라우드 stg가 나란히 있고, 두 클러스터 모두 대기열 서비스와 옵저버빌리티 스택을 둔다. 사용자는 Cloudflare와 방화벽을 거쳐 dev로, k6 부하 발생기는 ALB를 거쳐 stg로 들어간다. 데스크탑 GitLab CI가 dev에는 자동으로, stg ECR에는 수동 승격으로 이미지를 보내고, dev 안 ArgoCD 허브가 stg까지 동기화한다">
  <defs>
    <marker id="hla-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/>
    </marker>
    <marker id="hla-mi" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#f08c2e"/></marker>
    <marker id="hla-md" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#2f6fdb"/></marker>
  </defs>

  <!-- 들어오는 부하 — 사용자는 dev, k6 는 stg -->
  <g class="hla-g hla-g1">
    <rect x="120" y="14" width="200" height="44" rx="9" class="hla-box"/>
    <circle cx="138" cy="30" r="5" class="hla-glyph"/>
    <path d="M129,47 C129,38 147,38 147,47" class="hla-glyph"/>
    <text x="156" y="33" class="hla-t">사용자</text>
    <text x="156" y="49" class="hla-a">ticket.subinhong.dev · 데모</text>
    <line x1="220" y1="58" x2="220" y2="94" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <text x="228" y="80" class="hla-s2">Cloudflare · 방화벽</text>

    <rect x="440" y="14" width="200" height="44" rx="9" class="hla-box"/>
    <image href="/assets/img/icons/k6.svg" x="452" y="27" width="18" height="18"/>
    <text x="478" y="33" class="hla-t">부하 테스트 — k6 ×4</text>
    <text x="478" y="49" class="hla-a">5만 명 · SLO 5개</text>
    <line x1="540" y1="58" x2="540" y2="94" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <text x="548" y="80" class="hla-s2">ALB · HTTPS</text>
  </g>

  <!-- 환경 둘 — 같은 행 구성(서비스 · 옵저버빌리티 · 세 번째 행)으로 나란히 -->
  <g class="hla-g hla-g2">
    <rect x="20" y="96" width="350" height="204" rx="12" class="hla-outer"/>
    <image href="/assets/img/icons/proxmox.svg" x="32" y="106" width="18" height="18"/>
    <image href="/assets/img/icons/kubernetes.svg" x="54" y="106" width="18" height="18"/>
    <text x="80" y="120" class="hla-t">온프레미스 — dev</text>
    <text x="210" y="120" class="hla-s2">노트북 · Proxmox · k3s</text>

    <rect x="32" y="132" width="326" height="44" rx="8" class="hla-box"/>
    <text x="44" y="158" class="hla-c">서비스</text>
    <image href="/assets/img/icons/go.svg" x="130" y="146" width="16" height="16"/>
    <image href="/assets/img/icons/spring.svg" x="152" y="146" width="16" height="16"/>
    <image href="/assets/img/icons/apachekafka.svg" x="174" y="146" width="16" height="16"/>
    <image href="/assets/img/icons/redis.svg" x="196" y="146" width="16" height="16"/>
    <image href="/assets/img/icons/mysql.svg" x="218" y="146" width="16" height="16"/>
    <text x="244" y="158" class="hla-s2">전부 클러스터 안</text>

    <rect x="32" y="184" width="326" height="44" rx="8" class="hla-box"/>
    <text x="44" y="210" class="hla-c">옵저버빌리티</text>
    <image href="/assets/img/icons/alloy.svg" x="130" y="198" width="16" height="16"/>
    <image href="/assets/img/icons/mimir.svg" x="152" y="198" width="16" height="16"/>
    <image href="/assets/img/icons/loki.svg" x="174" y="198" width="16" height="16"/>
    <image href="/assets/img/icons/tempo.svg" x="196" y="198" width="16" height="16"/>
    <image href="/assets/img/icons/grafana.svg" x="218" y="198" width="16" height="16"/>
    <text x="244" y="210" class="hla-s2">원본 MinIO</text>

    <rect x="32" y="236" width="326" height="52" rx="8" class="hla-box"/>
    <text x="44" y="266" class="hla-c">GitOps</text>
    <image href="/assets/img/icons/argo.svg" x="130" y="253" width="18" height="18"/>
    <text x="154" y="259" class="hla-c">ArgoCD 허브</text>
    <text x="154" y="276" class="hla-s2">dev · stg 동기화</text>

    <rect x="390" y="96" width="350" height="204" rx="12" class="hla-outer"/>
    <image href="/assets/img/icons/aws-eks.png" x="402" y="106" width="18" height="18"/>
    <text x="426" y="120" class="hla-t">클라우드 — stg</text>
    <text x="540" y="120" class="hla-s2">Terraform · AWS EKS · 노드 7대</text>

    <rect x="402" y="132" width="326" height="44" rx="8" class="hla-box"/>
    <text x="414" y="158" class="hla-c">서비스</text>
    <image href="/assets/img/icons/go.svg" x="500" y="146" width="16" height="16"/>
    <image href="/assets/img/icons/spring.svg" x="522" y="146" width="16" height="16"/>
    <image href="/assets/img/icons/apachekafka.svg" x="544" y="146" width="16" height="16"/>
    <image href="/assets/img/icons/aws-rds.png" x="570" y="146" width="16" height="16"/>
    <image href="/assets/img/icons/aws-elasticache.png" x="592" y="146" width="16" height="16"/>
    <text x="618" y="158" class="hla-s2">DB · 캐시 관리형</text>

    <rect x="402" y="184" width="326" height="44" rx="8" class="hla-box"/>
    <text x="414" y="210" class="hla-c">옵저버빌리티</text>
    <image href="/assets/img/icons/alloy.svg" x="500" y="198" width="16" height="16"/>
    <image href="/assets/img/icons/mimir.svg" x="522" y="198" width="16" height="16"/>
    <image href="/assets/img/icons/loki.svg" x="544" y="198" width="16" height="16"/>
    <image href="/assets/img/icons/tempo.svg" x="566" y="198" width="16" height="16"/>
    <image href="/assets/img/icons/grafana.svg" x="588" y="198" width="16" height="16"/>
    <text x="614" y="210" class="hla-s2">원본 S3</text>

    <rect x="402" y="236" width="326" height="52" rx="8" class="hla-box"/>
    <text x="414" y="266" class="hla-c">레지스트리</text>
    <image href="/assets/img/icons/aws-ecr.png" x="500" y="253" width="18" height="18"/>
    <text x="524" y="259" class="hla-c">ECR</text>
    <text x="524" y="276" class="hla-s2">dev와 같은 이미지</text>
  </g>

  <!-- 배포 — dev 안 허브가 stg 동기화(파랑 점선), 데스크탑 GitLab 이 이미지를 두 환경에(주황) -->
  <g class="hla-g hla-g3">
    <path d="M358,262 H380 V114 H388" class="hla-ln-def hla-dash" marker-end="url(#hla-md)"/>

    <rect x="210" y="340" width="340" height="48" rx="9" class="hla-box"/>
    <image href="/assets/img/icons/gitlab.svg" x="222" y="352" width="24" height="24"/>
    <text x="254" y="360" class="hla-t">CI/CD — 데스크탑 GitLab</text>
    <text x="254" y="377" class="hla-s2">CI 5단 · GitLab 레지스트리 · 수동 승격 job</text>
    <line x1="300" y1="340" x2="300" y2="304" class="hla-ln-img" marker-end="url(#hla-mi)"/>
    <text x="292" y="326" class="hla-s2" text-anchor="end">dev 이미지 · 자동</text>
    <line x1="460" y1="340" x2="460" y2="304" class="hla-ln-img" marker-end="url(#hla-mi)"/>
    <text x="468" y="326" class="hla-s2">stg 이미지 · 수동 승격</text>

    <circle cx="300" cy="410" r="4.5" fill="#e03131"/>
    <text x="310" y="414" class="hla-s">요청</text>
    <circle cx="352" cy="410" r="4.5" fill="#f08c2e"/>
    <text x="362" y="414" class="hla-s">이미지</text>
    <circle cx="416" cy="410" r="4.5" fill="#2f6fdb"/>
    <text x="426" y="414" class="hla-s">동기화</text>
  </g>

  <!-- 흐르는 점 — 요청 둘 → 이미지 둘 → 동기화 하나 -->
  <circle class="hla-dot hla-dot-u" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.02;0.14;1" keyPoints="0;0;1;1" path="M220,40 L220,92"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.02;0.04;0.12;0.14;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-u" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.16;0.28;1" keyPoints="0;0;1;1" path="M540,40 L540,92"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.16;0.18;0.26;0.28;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-g" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.34;0.46;1" keyPoints="0;0;1;1" path="M300,364 L300,306"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.34;0.36;0.44;0.46;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-g" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.50;0.62;1" keyPoints="0;0;1;1" path="M460,364 L460,306"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.50;0.52;0.60;0.62;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-v" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.70;0.86;1" keyPoints="0;0;1;1" path="M358,262 L380,262 L380,114 L386,114"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.70;0.72;0.84;0.86;1" values="0;0;1;1;0;0"/>
  </circle>
</svg>
<figcaption>두 환경 모두 서비스(queue · booking · Kafka)와 옵저버빌리티(LGTM)를 클러스터 안에 두고, stg만 DB · 캐시를 AWS 관리형으로 분리. 영역별 상세 구조는 아래 카드.</figcaption>
</figure>

<!-- 카드 여섯 — 환경 둘(온프레미스 · 클라우드) → 둘에 공통인 것(CI/CD · 옵저버빌리티) → 그 위의 서비스 → 부하 -->

## 구성

<div class="hlc-grid" markdown="0">

  <a class="hlc-card" href="/homelab/onprem/">
    <img class="hlc-img" src="/assets/img/homelab/onprem-thumb.png" alt="온프레미스 · dev — 노트북 한 대로 k3s HA 클러스터. Proxmox · Kubernetes · OPNsense · Traefik · WireGuard, 인터넷에 연 포트 443 · 51820">
    <span class="hlc-tag">온프레미스 · dev</span>
    <span class="hlc-title">Proxmox · k3s · OPNsense로 dev 환경 구축</span>
    <span class="hlc-desc">노트북 1대 · VM 3대 HA 클러스터를 방화벽 뒤 격리망에 구성, 인터넷 개방 포트는 443 · 51820 두 개.</span>
  </a>

  <a class="hlc-card" href="/homelab/cloud/">
    <img class="hlc-img" src="/assets/img/homelab/cloud-thumb.png" alt="클라우드 · stg — Terraform으로 AWS EKS 구축. EKS · RDS · ElastiCache · ALB · ECR, 자원 56개">
    <span class="hlc-tag">클라우드 · stg</span>
    <span class="hlc-title">Terraform · EKS로 stg 환경 구축</span>
    <span class="hlc-desc">같은 차트 · 이미지로 AWS에 구성. DB · 캐시 · 로드밸런서는 AWS 관리형, Kafka · 관측은 클러스터 안.</span>
  </a>

  <a class="hlc-card" href="/homelab/cicd/">
    <img class="hlc-img" src="/assets/img/homelab/cicd-thumb.png" alt="CI/CD · dev → stg — 파이프라인 하나, 클러스터 둘. GitLab · ArgoCD · ECR · Kubernetes · EKS, 코드에서 브라우저까지 19분 41초">
    <span class="hlc-tag">CI/CD · dev → stg</span>
    <span class="hlc-title">GitLab · ArgoCD로 두 클러스터에 배포</span>
    <span class="hlc-desc">파이프라인 1개 · ArgoCD 1개로 dev · stg 배포. stg 승격은 수동 job, 코드 → 브라우저 19분 41초.</span>
  </a>

  <a class="hlc-card" href="/homelab/observability/">
    <img class="hlc-img" src="/assets/img/homelab/observability-thumb.png" alt="옵저버빌리티 · dev · stg — metric · log · trace LGTM 스택. Alloy · Mimir · Loki · Tempo · Grafana, 부하 판정 19회">
    <span class="hlc-tag">옵저버빌리티 · dev · stg</span>
    <span class="hlc-title">LGTM 스택을 두 클러스터에</span>
    <span class="hlc-desc">metric · log · trace를 Alloy 하나로 수집. 원본은 dev MinIO · stg S3, 부하 판정 기준 지표.</span>
  </a>

  <a class="hlc-card" href="/homelab/service/">
    <img class="hlc-img" src="/assets/img/homelab/service-thumb.png" alt="서비스 — 대기열 · 예매 분리, Kafka로 연결. Go · Spring · Kafka · Redis · MySQL, 정원 1,000">
    <span class="hlc-tag">서비스 · 같은 이미지</span>
    <span class="hlc-title">Go · Spring · Kafka로 대기열 예매 서비스 구축</span>
    <span class="hlc-desc">대기열 queue(Go) · 예매 booking(Spring)을 Kafka로 연결, 둘을 묶는 값은 정원.</span>
  </a>

  <a class="hlc-card" href="/homelab/capacity/">
    <img class="hlc-img" src="/assets/img/homelab/capacity-thumb.png" alt="부하 테스트 — k6 50,000명 실측. 1만 · 2.5만 · 5만 단계, 5만 명 회차 SLO 5개 통과">
    <span class="hlc-tag">부하 테스트 · dev → stg</span>
    <span class="hlc-title">k6로 dev 1만 · stg 5만 명 실측</span>
    <span class="hlc-desc">SLO 5개 확정 후 실제 사용자 여정으로 부하. 5만 명 SLO 통과, 다음 병목은 파드당 동시 요청 수.</span>
  </a>

</div>

<!-- 기록과 코드 -->

## 기록 · 저장소

* [HomeLab 시리즈](https://zed6740.tistory.com/category/HomeLab) — 온프레미스 선택 이유부터 인터넷 공개까지, 편별 구축 기록
* [cgv-infra](https://github.com/sss654654/cgv-infra) — 클러스터 · 배포 정의, dev · stg 환경 값
* [cgv-terraform](https://github.com/sss654654/cgv-terraform) — AWS 자원, bootstrap · stg 두 state
* [cgv-onprem](https://github.com/sss654654/cgv-onprem) — 앱 소스, queue(Go) · booking(Spring) · frontend
