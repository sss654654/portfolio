---
layout: page
title: 클라우드
description: >
  stg · prd 스펙 산정용 부하 테스트
permalink: /homelab/cloud/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← HomeLab</a></p>

<!-- 흐름: 온프레미스 한계(노드 RAM — 3만 명에서 k3s 재시작) → dev 에서 확인한 한계 · 스펙을 입력으로 AWS 에 다시 설계한 stg → 결과에서 부하 테스트로.
     리드 첫 줄 = 작업자 정의(09-08). 설계 결정은 "온프레미스 대비" · "stg에서 정한 것" 두 표.
     기록에 없는 효과(EKS 로 etcd 지연이 사라진다 등)와 작업자가 설명할 수 없는 설정은 넣지 않는다 -->

dev에서 확인한 한계와 스펙을 입력으로, 비용을 따져 **AWS에 다시 설계한** 부하 테스트 환경.
Terraform으로 EKS 노드 7대(app 4 · booking 2 · 관측&nbsp;1)를 AZ 3개에 구성.
서비스는 ALB로 인터넷 <span style="white-space:nowrap">공개(443)</span> · EKS API와 Grafana는 집 공인 IP만 허용.
{:.lead}

## 클라우드 구조

<!-- AWS 구성도 — AWS > 리전 > VPC > AZ 셋 > EKS 노드 일곱(파드는 아이콘). 배치는 2026-09-14 kubectl · describe 확인.
     집과 잇는 선 둘: 허브 → EKS API(파랑 점선) · CI → ECR(주황). RDS 주 2c · 대기 2b / ElastiCache 주 2b · 복제본 2a. -->
<figure class="hl-diagram hl-diagram-lg hl-diagram-scroll" markdown="0">
<svg viewBox="0 0 760 590" role="img" aria-label="AWS 서울 리전 구성도. 집의 ArgoCD 허브가 EKS 컨트롤 플레인으로 동기화하고, GitLab CI가 ECR로 이미지를 승격한다. 사용자는 인터넷 게이트웨이와 ALB를 거쳐 EKS로 들어간다. VPC 안 가용 영역 2a에 app 노드 둘과 booking 노드, 2b에 app 노드 하나, 2c에 app 노드 · booking 노드 · 관측 노드가 있다. RDS는 주 2c · 대기 2b, ElastiCache는 주 2b · 복제본 2a다">
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
    <text class="hla-a" x="310" y="88">동기화 · 집 IP만</text>
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
    <text class="hla-s2" x="158" y="213" style="fill:#8c4fff">VPC</text>

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
    <text class="hla-s2" x="300" y="246" style="fill:#ed7100">EKS · m5.xlarge ×7</text>

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
    <text class="hla-s2" x="376" y="572">관측 (LGTM)</text>
    <line class="hla-ln hla-dash" x1="552" y1="568" x2="576" y2="568"/>
    <text class="hla-s2" x="582" y="572">복제</text>
  </g>
</svg>
<figcaption>AZ 3개에 노드 · DB · 캐시를 나눈 배치 — 2026-09-14 클러스터 기준(주요 파드만).</figcaption>
</figure>

## 설계 결정

<div class="hl-sub" markdown="0">온프레미스 대비</div>

| 항목 | 선택 | 이유 |
|---|---|---|
| 입구 | MetalLB · Traefik · cert-manager → **ALB&nbsp;·&nbsp;ACM** | MetalLB는 VPC에서 동작 안 함 · ALB가 TLS까지 종료해 cert-manager 불필요 |
| 쿠버네티스 | k3s(VM 3대) → **EKS 관리형** | EC2에 쿠버네티스 직접 설치는 홈랩과 중복 — 같은 차트 · 이미지를 그대로 배포 |
| 스토리지 | 정적 PV → **EBS CSI 드라이버 · gp3 동적 생성** | PVC마다 볼륨 자동 생성 · 대신 볼륨은 생성된 AZ에서만 연결 |
| MySQL · Redis | 파드 → **RDS Multi-AZ · ElastiCache 복제본 1** | MySQL은 prd 구성과 일치 · 둘 다 AZ 장애 시 AWS가 자동 전환 |
| Kafka · 관측 | **클러스터 안 유지** | MSK는 하루 약 $3.6 추가 · 관측은 같은 차트로 대시보드 재사용 |
{:.hl-dec}

<div class="hl-sub" markdown="0">stg에서 정한 것</div>

| 항목 | 선택 | 이유 |
|---|---|---|
| 노드 배치 | **AZ 3개** · app 4 · booking 2(AZ별 · taint) · 관측 1(AZ 고정) | Kafka 브로커 AZ마다 1대 — AZ 장애에도 과반 유지 · booking은 JVM 컴파일이 브로커 CPU를 점유해 분리 |
| 노드 타입 · 수 | **m5.xlarge 고정** — t 계열 · 오토스케일 없음 | 크레딧 고갈이나 자동 증설이 있으면 먼저 막힌 곳을 구분할 수 없음 |
| 파드의 AWS 권한 | **IRSA** 역할 4개 — EBS CSI · ALB Controller · 관측 S3 · CloudWatch | 노드 역할에 주면 그 노드의 모든 파드가 보유 — ServiceAccount 단위로 분리 |
| Redis 접근 | **TLS + AUTH** | 대기열 · 좌석 락 · 입장 인증 데이터 보호 — 인증이 없으면 6379에 닿는 파드가 전권 보유 |
{:.hl-dec}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| 노드그룹이 **`CREATING`에서 20분 넘게 멈춤** — CloudTrail에 오류 없음 | 계정 vCPU 한도 32 소진 — 원인은 ASG scaling activities에만 기록 | 한도 **64**로 증설 → 1분 23초 뒤 ACTIVE |
| 관측 노드 교체 후 **Mimir ingester 95분 Pending** — metric 저장 중단 | 서브넷 3개 지정으로 새 노드가 2b에 생성 — EBS 볼륨은 2c에만 연결 가능 | 관측 노드그룹을 **볼륨이 있는 AZ로 고정** |
{:.hl-tbl}

## 결과

- **자원 65개 · 첫 생성 30–40분** — 부하 테스트 뒤 stg state만 삭제, ECR · S3 관측 버킷은 유지
- **AWS 비용 US$151.79 · 하루 약 US$50** — 5만 명 부하 스펙 stg 3일(2026-09-12 – 14) · 부하 발생기 포함
  - EC2 $95.80 — EKS 노드 m5.xlarge × 7(app 4 · booking 2 · 관측 1) · 부하 발생기 c5.2xlarge 최대 4대
  - RDS $21.38 — MySQL db.m5.large Multi-AZ
  - ElastiCache $17.38 — Redis cache.m5.large × 2(주 · 복제본)
  - EKS 컨트롤 플레인 $4.56 · EC2 기타 $4.44 · 기타 $8.23
- **부하가 queue · booking · Redis · Kafka · MySQL에 집중** — 입구 · 컨트롤 플레인이 클러스터 밖, 판정 · 병목은 [부하 테스트](/homelab/capacity/)

## 한계

- **운영 기간 3일** — 장기 운영 · 업그레이드 · 장애 대응 경험 없음
- **노드가 퍼블릭 서브넷** — AZ별 NAT 비용 대신 보안 그룹으로 제한, prd는 프라이빗 서브넷 + NAT
- **DB 보안 그룹은 노드 단위** — 출구 NetworkPolicy가 없는 파드(관측 Job)도 RDS에 연결됨
- **허브가 집에 위치** — 집 공인 IP가 바뀌면 EKS API 허용 목록 재적용
- **관측 단일 AZ** — 해당 AZ 장애 시 관측 중단

## 기술 스택

AWS (EKS · VPC · IAM/IRSA · RDS · ElastiCache · S3 · ECR · ACM · ALB · Secrets Manager · CloudWatch) · Terraform · Strimzi
{:.hl-more}

{% include hl-nav.html %}
