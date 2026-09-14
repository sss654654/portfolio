---
layout: page
title: 클라우드
description: >
  stg · prd 스펙 산정용 부하 테스트
permalink: /homelab/cloud/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← HomeLab</a></p>

<!-- 홈 · HomeLab 이 stg 의 역할(prd 스펙 산정)과 dev 에서 넘어온 이유 · 5만 명 실측을 이미 말한다. 여기는 목차 줄
     "Terraform으로 EKS 노드 7대 · AZ 3개, RDS · ElastiCache 관리형" 을 한 단계 풀어 무엇으로 어떻게 만들었는지만.
     온프레미스 리드와 같은 틀: 구성 → 경계(관리형 · 클러스터 안) → 공개 · 관리 경로 -->

Terraform으로 AWS 서울 리전 VPC에 EKS 노드 7대(app 4 · booking 2 · 관측&nbsp;1)를 AZ 3개에 나눠 구성.
컨트롤 플레인 · 로드밸런서 · DB · 캐시 · 레지스트리는 **AWS 관리형**, Kafka&nbsp;·&nbsp;옵저버빌리티는 **클러스터 안**.
서비스는 ALB · ACM으로 인터넷 <span style="white-space:nowrap">공개(443)</span> · EKS API와 Grafana는 집 공인 IP만 허용.
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
<figcaption>배치는 2026-09-14 클러스터 기준(주요 파드만). RDS는 동기 · ElastiCache는 비동기 복제.</figcaption>
</figure>

## 설계 결정

<!-- 클라우드의 판단 축 = 가용성 · 보안 · 비용의 절충. 진입(ALB · ACM)과 관리 경로 제한은 리드가 말한다 -->

<div class="hl-sub" markdown="0">가용성</div>

| 항목 | 선택 | 이유 |
|---|---|---|
| 노드 배치 | **AZ 3개** · app 4 · booking 2(AZ별 · taint) · 관측 1(AZ 고정) | Kafka 브로커 AZ마다 1대 — 한 AZ 장애에도 과반 유지 · JVM 컴파일이 브로커를 밀어낸 booking만 전용 노드 |
| DB · 캐시 | **RDS Multi-AZ · ElastiCache 복제본 1** | MySQL은 prd 조건 재현(관리형 전환 · 동기 복제 쓰기 지연) · Redis 복제본은 Kafka처럼 AZ 장애 대비 |
{:.hl-dec}

<div class="hl-sub" markdown="0">보안</div>

| 항목 | 선택 | 이유 |
|---|---|---|
| 파드의 AWS 권한 | **IRSA** · IMDSv2 hop limit 1 | 노드 역할에 주면 그 노드의 모든 파드가 보유 — ServiceAccount 단위로 분리, 노드 역할 접근 차단 |
| Redis 접근 | **TLS + AUTH** | 인증이 없으면 6379에 닿는 파드가 대기열 · 좌석 락 · 입장 인증 전권 보유(보안 그룹은 출발지만 검사) |
{:.hl-dec}

<div class="hl-sub" markdown="0">비용 · 수명주기</div>

| 항목 | 선택 | 이유 |
|---|---|---|
| 환경 수명 | **Terraform state 둘** — bootstrap 유지 · stg 삭제 | ECR · 관측 버킷은 남기고 클러스터만 지워 회차 간 비교 데이터 유지 |
| 서브넷 | **퍼블릭 · NAT 없음** | AZ별 NAT 비용 대신 보안 그룹으로 제한 — prd는 프라이빗 + AZ별 NAT |
| 클러스터 안에 둔 것 | **Kafka · 관측** | MSK는 비용 60배 · 집 Mimir는 활성 시리즈 상한의 91.8%라 stg 지표 수용 불가 |
{:.hl-dec}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| 노드그룹이 **`CREATING`에서 20분 넘게 멈춤** — CloudTrail에 오류 없음 | 계정 vCPU 한도 32 소진 — 원인은 ASG scaling activities에만 기록 | 한도 **64**로 증설 → 1분 23초 뒤 ACTIVE |
| 노드그룹 교체 후 **Mimir ingester 95분 Pending** | 서브넷 3개 지정으로 관측 노드가 2c → 2b 이동, EBS 볼륨은 2c에 고정 | 상태를 가진 노드그룹만 **단일 AZ 고정** |
| Redis 암호화 적용 후 **인증서 오류로 연결 실패** | 전송 암호화를 켜면 엔드포인트가 `master.…`로 바뀌고 인증서도 새 이름 기준 | `REDIS_HOST` 변경, 앱 TLS를 먼저 켠 뒤 required로 — **무중단 전환** |
| **30명이 1명으로 집계** — requestId 앞 8자 동일 | 평문 http에서 `crypto.randomUUID` 미제공 → 시각 기반 폴백 id 중복 | HTTPS 입구 + 폴백 수정 → **30명 개별 집계** |
{:.hl-tbl}

## 결과

- **자원 56개 · 생성 30–40분** — 부하 테스트 뒤 stg state만 삭제
- **AWS 비용 US$151.79** — stg 운영 3일(2026-09-12 – 14), 부하 발생기 포함 · EC2 $95.80 · RDS $21.38 · ElastiCache $17.38
- **5만 명 부하 수용** — 판정 · 병목은 [부하 테스트](/homelab/capacity/)

## 한계

- **운영 기간 3일** — 장기 운영 · 업그레이드 · 장애 대응 경험 없음
- **DB 보안 그룹은 노드 단위** — 출구 NetworkPolicy가 없는 파드(관측 Job)는 RDS에 연결됨, prd는 Security Groups for Pods
- **허브가 집에 위치** — 집 공인 IP가 바뀌면 재적용
- **관측 단일 AZ** — 해당 AZ 장애 시 관측 중단

## 기술 스택

AWS (EKS · VPC · IAM/IRSA · RDS · ElastiCache · S3 · ECR · ACM · ALB · Secrets Manager · CloudWatch) · Terraform · Strimzi
{:.hl-more}

{% include hl-nav.html %}
