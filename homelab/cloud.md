---
layout: page
title: 클라우드
description: >
  dev에서 산정한 서비스를 같은 차트 · 파이프라인 · 이미지로 AWS EKS stg 환경에 구성
permalink: /homelab/cloud/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

stg 환경 — dev에서 산정한 스펙을 AWS 관리형 위에 같은 이미지로 올려 5만 명까지 측정.
컨트롤 플레인 · 로드밸런서 · DB · 캐시 · 레지스트리는 AWS 관리형, Kafka · 옵저버빌리티는 클러스터 안.
{:.lead}

## 클라우드 구조

<!-- AWS 구성도 — AWS > 리전 > VPC > AZ 셋 > EKS 노드 일곱(파드는 아이콘). 배치는 2026-09-14 kubectl · describe 확인.
     집과 잇는 선 둘: 허브 → EKS API(파랑 점선) · CI → ECR(주황). RDS 주 2c · 대기 2b / ElastiCache 주 2b · 복제본 2a. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<svg viewBox="0 0 760 590" role="img" aria-label="AWS 서울 리전 구성도. 집의 ArgoCD 허브가 EKS 컨트롤 플레인으로, GitLab CI가 ECR로 이어진다. 사용자는 인터넷 게이트웨이와 ALB를 거쳐 EKS로 들어간다. VPC 안 가용 영역 2a에 app 노드 둘과 booking 노드, 2b에 app 노드 하나, 2c에 app 노드 · booking 노드 · 관측 노드가 있다. RDS는 주 2c · 대기 2b, ElastiCache는 주 2b · 복제본 2a다">
  <defs>
    <marker id="hlw-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/></marker>
    <marker id="hlw-i" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#f08c2e"/></marker>
    <marker id="hlw-d" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#2f6fdb"/></marker>
  </defs>

  <!-- 집 · AWS · 리전 -->
  <g class="hla-g hla-g1">
    <rect class="hla-inner hla-dash" x="236" y="6" width="290" height="54" rx="8"/>
    <text class="hla-zone" x="250" y="38">집</text>
    <image href="/assets/img/icons/argo.svg" x="290" y="12" width="28" height="28"/>
    <text class="hla-s2" x="304" y="54" text-anchor="middle">ArgoCD 허브</text>
    <image href="/assets/img/icons/gitlab.svg" x="426" y="12" width="28" height="28"/>
    <text class="hla-s2" x="440" y="54" text-anchor="middle">GitLab CI</text>

    <rect x="92" y="72" width="660" height="476" rx="4" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="1.2"/>
    <text class="hla-c" x="104" y="90">AWS</text>
    <rect x="104" y="100" width="638" height="438" rx="4" fill="none" stroke="#00a4a6" stroke-width="1.2" stroke-dasharray="6 4"/>
    <text class="hla-s2" x="116" y="118" style="fill:#00a4a6">ap-northeast-2 서울</text>

    <line class="hla-ln-def hla-dash" x1="304" y1="60" x2="304" y2="127" marker-end="url(#hlw-d)"/>
    <text class="hla-a" x="310" y="88">sync · 집 IP만</text>
    <line class="hla-ln-img" x1="440" y1="60" x2="440" y2="127" marker-end="url(#hlw-i)"/>
    <text class="hla-a" x="446" y="88">승격 push</text>

    <image href="/assets/img/icons/aws-eks.png" x="286" y="130" width="36" height="36"/>
    <text class="hla-s2" x="304" y="182" text-anchor="middle">EKS 컨트롤 플레인</text>
    <image href="/assets/img/icons/aws-ecr.png" x="422" y="130" width="36" height="36"/>
    <text class="hla-s2" x="440" y="182" text-anchor="middle">ECR</text>
    <image href="/assets/img/icons/aws-s3.png" x="540" y="130" width="36" height="36"/>
    <text class="hla-s2" x="558" y="182" text-anchor="middle">S3</text>
    <image href="/assets/img/icons/aws-secrets-manager.png" x="640" y="130" width="36" height="36"/>
    <text class="hla-s2" x="658" y="182" text-anchor="middle">Secrets Manager</text>
  </g>

  <!-- VPC · 입구 -->
  <g class="hla-g hla-g2">
    <rect x="146" y="196" width="590" height="336" rx="4" fill="none" stroke="#8c4fff" stroke-width="1.3"/>
    <text class="hla-s2" x="158" y="213" style="fill:#8c4fff">VPC 10.20.0.0/16</text>

    <line class="hla-ln hla-dash" x1="304" y1="188" x2="304" y2="227" marker-end="url(#hlw-arrow)"/>
    <line class="hla-ln-img hla-dash" x1="440" y1="188" x2="440" y2="227" marker-end="url(#hlw-i)"/>
    <text class="hla-a" x="446" y="210">pull</text>

    <circle cx="46" cy="358" r="8" class="hla-glyph"/>
    <path d="M32,390 C32,372 60,372 60,390" class="hla-glyph"/>
    <text class="hla-s2" x="46" y="408" text-anchor="middle">사용자</text>
    <line class="hla-ln" x1="66" y1="374" x2="129" y2="374" marker-end="url(#hlw-arrow)"/>

    <circle cx="146" cy="374" r="15" class="hla-box" style="stroke:#8c4fff;stroke-width:2"/>
    <path d="M139,382 V372 A7,7 0 0 1 153,372 V382" fill="none" stroke="#8c4fff" stroke-width="2.4"/>
    <text class="hla-s2" x="146" y="404" text-anchor="middle">IGW</text>
    <line class="hla-ln" x1="161" y1="374" x2="186" y2="374" marker-end="url(#hlw-arrow)"/>

    <image href="/assets/img/icons/aws-alb.png" x="188" y="356" width="36" height="36"/>
    <text class="hla-s2" x="206" y="408" text-anchor="middle">ALB</text>
    <text class="hla-a" x="206" y="422" text-anchor="middle">ACM · 443</text>
    <line class="hla-ln" x1="224" y1="374" x2="290" y2="374" marker-end="url(#hlw-arrow)"/>
  </g>

  <!-- AZ 셋 · EKS 노드 · 관리형 -->
  <g class="hla-g hla-g3">
    <rect x="240" y="222" width="488" height="98" rx="4" fill="none" stroke="#147eba" stroke-dasharray="5 4"/>
    <text class="hla-s2" x="248" y="238" style="fill:#147eba">AZ 2a</text>
    <rect x="240" y="328" width="488" height="96" rx="4" fill="none" stroke="#147eba" stroke-dasharray="5 4"/>
    <text class="hla-s2" x="248" y="344" style="fill:#147eba">AZ 2b</text>
    <rect x="240" y="432" width="488" height="94" rx="4" fill="none" stroke="#147eba" stroke-dasharray="5 4"/>
    <text class="hla-s2" x="248" y="448" style="fill:#147eba">AZ 2c</text>

    <rect x="292" y="230" width="290" height="292" rx="4" fill="none" stroke="#ed7100" stroke-width="1.3"/>
    <text class="hla-s2" x="300" y="246" style="fill:#ed7100">EKS 1.36 · 노드 m5.xlarge ×7</text>

    <!-- 2a -->
    <rect class="hla-node" x="300" y="254" width="84" height="58" rx="5"/>
    <text class="hla-a" x="308" y="269">app</text>
    <image href="/assets/img/icons/go.svg" x="308" y="278" width="22" height="22"/>
    <image href="/assets/img/icons/apachekafka.svg" x="334" y="278" width="22" height="22"/>
    <rect class="hla-node" x="392" y="254" width="84" height="58" rx="5"/>
    <text class="hla-a" x="400" y="269">app</text>
    <image href="/assets/img/icons/go.svg" x="400" y="278" width="22" height="22"/>
    <rect class="hla-node" x="484" y="254" width="84" height="58" rx="5"/>
    <text class="hla-a" x="492" y="269">booking</text>
    <image href="/assets/img/icons/spring.svg" x="492" y="278" width="22" height="22"/>

    <image href="/assets/img/icons/aws-elasticache.png" x="660" y="246" width="30" height="30"/>
    <text class="hla-s2" x="675" y="292" text-anchor="middle">Redis 복제본</text>

    <!-- 2b -->
    <rect class="hla-node" x="300" y="358" width="84" height="58" rx="5"/>
    <text class="hla-a" x="308" y="373">app</text>
    <image href="/assets/img/icons/go.svg" x="308" y="382" width="22" height="22"/>
    <image href="/assets/img/icons/apachekafka.svg" x="334" y="382" width="22" height="22"/>

    <image href="/assets/img/icons/aws-rds.png" x="606" y="350" width="30" height="30"/>
    <text class="hla-s2" x="621" y="396" text-anchor="middle">RDS 대기</text>
    <image href="/assets/img/icons/aws-elasticache.png" x="660" y="350" width="30" height="30"/>
    <text class="hla-s2" x="675" y="396" text-anchor="middle">Redis 주</text>

    <!-- 2c -->
    <rect class="hla-node" x="300" y="460" width="84" height="58" rx="5"/>
    <text class="hla-a" x="308" y="475">app</text>
    <image href="/assets/img/icons/go.svg" x="308" y="484" width="22" height="22"/>
    <image href="/assets/img/icons/apachekafka.svg" x="334" y="484" width="22" height="22"/>
    <rect class="hla-node" x="392" y="460" width="84" height="58" rx="5"/>
    <text class="hla-a" x="400" y="475">booking</text>
    <image href="/assets/img/icons/spring.svg" x="400" y="484" width="22" height="22"/>
    <rect class="hla-node" x="484" y="460" width="84" height="58" rx="5"/>
    <text class="hla-a" x="492" y="475">관측</text>
    <image href="/assets/img/icons/grafana.svg" x="490" y="486" width="17" height="17"/>
    <image href="/assets/img/icons/mimir.svg" x="509" y="486" width="17" height="17"/>
    <image href="/assets/img/icons/loki.svg" x="528" y="486" width="17" height="17"/>
    <image href="/assets/img/icons/tempo.svg" x="547" y="486" width="17" height="17"/>

    <image href="/assets/img/icons/aws-rds.png" x="606" y="454" width="30" height="30"/>
    <text class="hla-s2" x="621" y="500" text-anchor="middle">RDS 주</text>

    <!-- 복제 -->
    <line class="hla-ln hla-dash" x1="621" y1="452" x2="621" y2="402" marker-end="url(#hlw-arrow)"/>
    <line class="hla-ln hla-dash" x1="675" y1="348" x2="675" y2="298" marker-end="url(#hlw-arrow)"/>

    <!-- 범례 -->
    <image href="/assets/img/icons/go.svg" x="100" y="560" width="16" height="16"/>
    <text class="hla-s2" x="120" y="572">queue</text>
    <image href="/assets/img/icons/spring.svg" x="172" y="560" width="16" height="16"/>
    <text class="hla-s2" x="192" y="572">booking</text>
    <image href="/assets/img/icons/apachekafka.svg" x="254" y="560" width="16" height="16"/>
    <text class="hla-s2" x="274" y="572">Kafka 브로커</text>
    <image href="/assets/img/icons/grafana.svg" x="356" y="560" width="16" height="16"/>
    <text class="hla-s2" x="376" y="572">Grafana · Mimir · Loki · Tempo</text>
    <line class="hla-ln hla-dash" x1="552" y1="568" x2="576" y2="568"/>
    <text class="hla-s2" x="582" y="572">복제</text>
  </g>
</svg>
<figcaption>노드 · 파드 배치는 2026-09-14 클러스터 기준(주요 파드만). booking · 관측 노드는 taint로 다른 파드 배치 차단.
RDS는 2c → 2b 동기 복제, ElastiCache는 2b → 2a 비동기 복제. 서비스 ALB 외 Grafana용 ALB(집 IP만 허용) 1개 추가.</figcaption>
</figure>

## 설계 결정

| 항목 | 선택 | 이유 |
|---|---|---|
| Terraform state | **bootstrap / stg 분리** | 관측 버킷 · ECR은 클러스터 삭제 후에도 유지 — 회차 간 비교용. bootstrap은 유지, stg는 사용 후 삭제 |
| 관리형 경계 | **MySQL · Redis 관리형 / Kafka · 옵저버빌리티 클러스터 안** | MySQL — prd에서 파드로 운영하지 않음 · Redis — Lua가 Cluster Mode에서 `CROSSSLOT`(클러스터 모드 끔) · Kafka — MSK 하루 $3.6, 60배 · 관측 — 집 Mimir 활성 시리즈가 상한의 91.8% |
| AZ | **3개** | Kafka 브로커 3대 = KRaft 과반 + `min.insync.replicas 2`. AZ 2개면 한 AZ에 2대 — 해당 AZ 장애 시 쓰기 중단 |
| 서브넷 | **퍼블릭 · NAT 없음** | NAT 1개는 AZ 3개 설계와 불일치, AZ별 NAT는 비용. 노드 공인 IP는 보안 그룹으로 제한. prd는 프라이빗 + AZ별 NAT |
| 노드그룹 | **app ×4 · booking ×2(AZ별 · taint) · 관측 ×1(AZ 고정)** | 오픈 시 CPU 급증 파드는 booking뿐 — 전용 노드 · 관측은 볼륨이 AZ에 묶여 AZ 고정 · t 계열 제외(크레딧 고갈과 서비스 한계 구분 불가) · 대수 고정(병목 은폐 방지) |
| 파드의 AWS 자격 | **IRSA** · IMDSv2 hop limit 1 | 권한 단위를 ServiceAccount로 — 노드 역할에 부여하면 해당 노드의 파드 전체가 보유. hop 1로 파드의 노드 역할 접근 차단 |
| 진입 | **ALB · ACM · 파드 IP 대상** | MetalLB L2 광고가 VPC에서 동작하지 않음 · 층 6개(Cloudflare · OPNsense · MetalLB · Traefik · cert-manager · Ingress) → 2개(ALB · Service) · 평문 http에서 `crypto.randomUUID` 미제공 → HTTPS 필요 |
| 시크릿 | **Secrets Manager + 스크립트** | SealedSecret은 대상 클러스터 컨트롤러 개인키에 묶여 기동 전 봉인 불가 · 하루 환경이라 ESO 회전 · 동기화 불필요 |
| Redis | **복제본 1 · TLS + AUTH** | 복제본 — Kafka AZ 3개 배치와 짝 · TLS + AUTH가 없으면 6379에 닿는 파드가 대기열 · 좌석 락 · 입장 인증 전권 보유(보안 그룹은 출발지만 검사) |
| 배포 | **집 허브의 원격 배포 · 아티팩트 승격** | EKS에서 사설망 GitLab 접근 불가 · 부하 비교에 두 환경 이미지 동일 필요 — [CI/CD](/homelab/cicd/) |
{:.hl-dec}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| 노드그룹 `CREATING` 20분 이상 지속 — `describe-nodegroup` 정상 · CloudTrail 오류 없음 | 계정 EC2 vCPU 한도 32 소진 — `VcpuLimitExceeded`는 ASG scaling activities에만 기록. 정지 인스턴스는 한도 미포함 | 한도 **64**로 증설 → 1분 23초 후 ACTIVE |
| 노드그룹 교체 후 Mimir ingester **95분 Pending** — 신규 지표 저장 중단 | 관측 노드그룹에 서브넷 3개 지정 → 노드가 2c → 2b로 이동, EBS 볼륨은 2c에 고정 | 상태를 가진 노드그룹만 단일 AZ 고정 |
| Redis 암호화 적용 후 `x509: certificate is valid for …` 연결 실패 | 전송 암호화 활성화 시 주 엔드포인트가 `master.…`로 변경, 인증서는 새 이름 기준 | `REDIS_HOST` 변경. 무중단 순서: preferred → 앱 TLS → required → ROTATE → SET |
| 30명이 1명으로 집계 — requestId 앞 8자 동일 | 평문 http에서 `crypto.randomUUID` 미제공 → 시각 기반 폴백 id 중복 | HTTPS 입구(ACM · 443) + 프론트 폴백 수정 → 30명 중 29명 예매 |
{:.hl-tbl}

## 결과

<!-- destroy 전에 콘솔 캡처 뒤 활성화 — 파일 셋:
     /assets/img/homelab/cloud/argocd-clusters.png  허브 ArgoCD Settings → Clusters: in-cluster 와 cgv-stg 둘
     /assets/img/homelab/cloud/eks-nodegroups.png   EKS 콘솔 cgv-stg → Compute: 노드그룹 넷(app · booking-2a · booking-2c · observability)
     /assets/img/homelab/cloud/managed.png          RDS 인스턴스(Multi-AZ) + ElastiCache 복제 그룹(암호화 · AUTH) 한 화면 또는 둘 이어 붙임
<div class="hl-shots" markdown="0" aria-label="stg 콘솔 — 허브의 클러스터 둘 · 노드그룹 넷 · 관리형 둘, 화살표로 넘겨 봅니다">
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cloud/argocd-clusters.png" alt="노트북 ArgoCD 허브의 Clusters 화면 — in-cluster와 cgv-stg 두 클러스터가 등록돼 있음">
    <figcaption><b>(허브 · 클러스터 2개)</b> 노트북 ArgoCD에 dev(in-cluster) · stg(cgv-stg) 등록 — stg는 주소가 아닌 이름으로 등록.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cloud/eks-nodegroups.png" alt="EKS 콘솔 cgv-stg의 노드그룹 넷 — app 4대, booking-2a와 booking-2c 한 대씩, observability 한 대" loading="lazy">
    <figcaption><b>(노드그룹 4개)</b> app 4 · booking 2a · booking 2c · observability — 부하 테스트 결과로 정한 구조. booking은 taint로 다른 파드 배치 차단.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cloud/managed.png" alt="RDS MySQL Multi-AZ 인스턴스와 ElastiCache Redis 복제 그룹의 콘솔 화면" loading="lazy">
    <figcaption><b>(관리형 2개)</b> 클러스터 밖 MySQL · Redis — 노드 보안 그룹에서만 3306 · 6379 허용.</figcaption>
  </figure>
</div>
-->

- **자원 56개 · Terraform state 2개** — 생성 30–40분, 사용 후 삭제하는 하루 환경
- **허브 ArgoCD가 클러스터 이름 `cgv-stg`로 배포** — ApplicationSet 환경 목록에 한 줄 추가
- **코드 → 브라우저 19분 41초** (기계 구간 1분 54초)
- **부하 테스트 결과로 노드 구조 변경** — app 4 + 관측 1에 booking 전용 2대 추가, 총 7대. 근거는 [부하 테스트](/homelab/capacity/)
- **5만 명 회차 SLO 5개 통과**
- **운영 중인 Redis에 TLS · AUTH 무중단 적용**

## 한계

- **운영 기간 하루** — 장기 운영 · 업그레이드 · 장애 대응 경험 없음
- **노드가 퍼블릭 서브넷 · 공인 IP 보유** — prd는 프라이빗 서브넷 + AZ별 NAT
- **데이터 보안 그룹이 노드 단위** — 노드 위 모든 파드가 통과. 파드 단위 제어는 NetworkPolicy, prd는 Security Groups for Pods
- **CI → AWS 자격이 IAM 사용자 장기 키** — GitLab이 사설 IP라 OIDC 발급자로 사용 불가
- **허브가 집에 위치** — 집 공인 IP 변경 시 재적용 필요, 집 전원 차단 중에는 마지막 sync 상태 유지
- **관측 단일 AZ** — 해당 AZ 장애 시 관측 중단

## 기술 스택

AWS (EKS · VPC · IAM/IRSA · RDS · ElastiCache · S3 · ECR · ACM · ALB · Secrets Manager · CloudWatch) · Terraform · ArgoCD · GitLab CI · Strimzi · Grafana LGTM · k6
{:.hl-more}

{% include hl-nav.html %}
