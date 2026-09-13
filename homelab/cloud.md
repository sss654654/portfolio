---
layout: page
title: 클라우드
description: >
  홈랩에서 실측으로 뽑은 서비스를 같은 차트 · 같은 파이프라인 · 같은 이미지로 AWS EKS에 두 번째 환경(stg)으로 올렸습니다
permalink: /homelab/cloud/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

stg 환경입니다 — dev에서 뽑은 스펙을 관리형 위에 같은 이미지로 올려 5만 명까지 잰 자리입니다.
컨트롤 플레인 · 로드밸런서 · 스토리지 · DB · 캐시 · 레지스트리 · 인증서는 AWS에 맡기고, Kafka와 옵저버빌리티는 클러스터 안에 남겼습니다.
**켠 뒤 부하 판이 노드 구조를 바꿨고, 운영 기간은 하루입니다.**
{:.lead}

## 클라우드 구조

<!-- 왼쪽 열 = 집에 남은 셋(허브 · CI · 부하 발생기). 집과 AWS 를 잇는 선은 둘뿐 — 허브 → EKS API · CI → ECR.
     발생기는 기본 VPC 에서 ALB 공인 주소를 부르므로 왼쪽에 둔다. 오른쪽 = AWS.
     노드그룹 셋과 관리형 둘이 VPC 안, bootstrap 은 지우지 않는 것이라 점선. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<svg viewBox="0 0 760 560" role="img" aria-label="집의 ArgoCD 허브가 EKS API로, GitLab CI가 ECR로 이어지고, AWS VPC 안에 ALB 아래 app · booking · 관측 세 노드그룹과 클러스터 밖 RDS · ElastiCache가 있으며, 부하 발생기 네 대가 ALB를 부르는 구조. bootstrap 자원은 클러스터보다 오래 산다">
  <defs>
    <marker id="hlw-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/>
    </marker>
  </defs>

  <!-- 구역 라벨 -->
  <text class="hla-zone" x="114" y="28" text-anchor="middle">집</text>
  <text class="hla-zone" x="492" y="28" text-anchor="middle">AWS ap-northeast-2</text>

  <!-- 집: 허브 · CI · 발생기 -->
  <rect class="hla-box" x="16" y="60" width="196" height="64" rx="8"/>
  <image href="/assets/img/icons/argo.svg" x="28" y="78" width="22" height="22"/>
  <text class="hla-t" x="58" y="84">ArgoCD 허브</text>
  <text class="hla-s2" x="58" y="104">노트북 k3s dev 안 · stg 도 배달</text>

  <rect class="hla-box" x="16" y="150" width="196" height="64" rx="8"/>
  <image href="/assets/img/icons/gitlab.svg" x="28" y="168" width="22" height="22"/>
  <text class="hla-t" x="58" y="174">GitLab CI</text>
  <text class="hla-s2" x="58" y="194">publish-ecr — 수동 버튼 하나</text>

  <rect class="hla-box" x="16" y="262" width="196" height="50" rx="8"/>
  <text class="hla-t" x="28" y="283">부하 발생기 EC2 ×4</text>
  <text class="hla-s2" x="28" y="301">기본 VPC · 대당 12,500명</text>

  <!-- 집 → AWS 선 둘 + 발생기 → ALB -->
  <line class="hla-ln hla-dash" x1="212" y1="92" x2="254" y2="92" marker-end="url(#hlw-arrow)"/>
  <line class="hla-ln" x1="212" y1="182" x2="254" y2="182" marker-end="url(#hlw-arrow)"/>
  <line class="hla-ln" x1="212" y1="287" x2="266" y2="287" marker-end="url(#hlw-arrow)"/>

  <!-- AWS 바깥 상자 -->
  <rect class="hla-outer" x="240" y="40" width="504" height="504" rx="10"/>

  <!-- EKS 컨트롤 플레인 -->
  <rect class="hla-box" x="256" y="60" width="472" height="64" rx="6"/>
  <image href="/assets/img/icons/kubernetes.svg" x="268" y="78" width="22" height="22"/>
  <text class="hla-t" x="298" y="84">EKS 1.36 cgv-stg — 컨트롤 플레인은 AWS 관리</text>
  <text class="hla-s2" x="298" y="104">API 는 집 공인 IP /32 만 · OIDC → IRSA 역할 넷 (S3 · EBS · ALB · CloudWatch)</text>

  <!-- ECR -->
  <rect class="hla-box" x="256" y="150" width="200" height="64" rx="6"/>
  <text class="hla-t" x="268" y="172">ECR ×3</text>
  <text class="hla-s2" x="268" y="190">태그 = 커밋 해시 8자</text>
  <text class="hla-s2" x="268" y="206">dev 와 같은 이미지</text>
  <line class="hla-ln" x1="356" y1="214" x2="356" y2="232" marker-end="url(#hlw-arrow)"/>
  <text class="hla-s2" x="364" y="228">pull</text>

  <!-- Secrets Manager -->
  <rect class="hla-box" x="476" y="150" width="252" height="64" rx="6"/>
  <text class="hla-t" x="488" y="172">Secrets Manager</text>
  <text class="hla-s2" x="488" y="190">RDS 마스터 비밀번호 (AWS 가 만듦)</text>
  <text class="hla-s2" x="488" y="206">Redis AUTH 토큰 → secrets.sh</text>

  <!-- VPC -->
  <rect class="hla-inner" x="256" y="234" width="472" height="256" rx="6"/>
  <text class="hla-t" x="268" y="253">VPC 10.20.0.0/16 · 퍼블릭 서브넷 ×3 AZ · NAT 없음</text>

  <rect class="hla-box" x="268" y="264" width="448" height="40" rx="6"/>
  <text class="hla-c" x="280" y="281">ALB — ticket-stg.subinhong.dev</text>
  <text class="hla-s2" x="280" y="296">ACM · 443 · 파드 IP 대상 · 접근 로그 S3 · 초기화 API 403</text>

  <line class="hla-ln" x1="373" y1="304" x2="373" y2="322" marker-end="url(#hlw-arrow)"/>
  <line class="hla-ln" x1="545" y1="304" x2="545" y2="322" marker-end="url(#hlw-arrow)"/>

  <rect class="hla-box" x="268" y="324" width="210" height="80" rx="6"/>
  <text class="hla-c" x="280" y="343">app — m5.xlarge ×4</text>
  <text class="hla-s2" x="280" y="362">queue ×4 (노드마다 하나)</text>
  <text class="hla-s2" x="280" y="378">frontend · Kafka ×3 (AZ 마다 하나)</text>
  <text class="hla-s2" x="280" y="394">Strimzi · ALB Controller</text>

  <rect class="hla-box" x="490" y="324" width="110" height="80" rx="6"/>
  <text class="hla-c" x="500" y="343">booking ×2</text>
  <text class="hla-s2" x="500" y="362">2a · 2c 한 대씩</text>
  <text class="hla-s2" x="500" y="378">taint — 혼자 씀</text>
  <text class="hla-s2" x="500" y="394">JIT 컴파일 격리</text>

  <rect class="hla-box" x="612" y="324" width="104" height="80" rx="6"/>
  <image href="/assets/img/icons/grafana.svg" x="622" y="331" width="16" height="16"/>
  <text class="hla-c" x="644" y="343">관측 ×1</text>
  <text class="hla-s2" x="622" y="362">2c 고정 · taint</text>
  <text class="hla-s2" x="622" y="378">LGTM · Alloy</text>
  <text class="hla-s2" x="622" y="394">→ S3 (IRSA)</text>

  <line class="hla-ln" x1="373" y1="404" x2="373" y2="422" marker-end="url(#hlw-arrow)"/>
  <line class="hla-ln" x1="545" y1="404" x2="545" y2="422" marker-end="url(#hlw-arrow)"/>

  <rect class="hla-box" x="268" y="424" width="448" height="56" rx="6"/>
  <text class="hla-c" x="280" y="442">클러스터 밖 — 노드 보안 그룹에서만 3306 · 6379</text>
  <image href="/assets/img/icons/mysql.svg" x="280" y="452" width="16" height="16"/>
  <text class="hla-s2" x="302" y="464">RDS MySQL 8.4 · Multi-AZ</text>
  <image href="/assets/img/icons/redis.svg" x="492" y="452" width="16" height="16"/>
  <text class="hla-s2" x="514" y="464">ElastiCache Redis 7.1 · 복제본 · TLS + AUTH</text>

  <!-- bootstrap — 지우지 않는 것 -->
  <rect class="hla-inner hla-dash" x="256" y="502" width="472" height="30" rx="6"/>
  <text class="hla-s2" x="268" y="521">bootstrap (지우지 않음) — tfstate · 관측 버킷 ×3 · ALB 로그 · ECR · IAM 사용자 둘 · ACM · 예산 경보</text>
</svg>
<figcaption>집과 AWS를 잇는 선은 둘입니다 — 허브가 EKS API로(집 공인 IP만 허용), CI가 ECR로.
Terraform state는 둘로, 클러스터보다 오래 살아야 하는 것(bootstrap)과 하루 살고 지우는 것(stg)을 갈랐습니다.</figcaption>
</figure>

## 설계 결정

| 항목 | 선택 | 이유 |
|---|---|---|
| Terraform state | **bootstrap / stg 둘** | 판 결과(관측 버킷)와 이미지(ECR)가 클러스터보다 오래 살아야 판과 판을 비교 — bootstrap은 지우지 않고 stg는 하루 살고 지움 |
| 관리형 경계 | **MySQL · Redis는 관리형, Kafka · 옵저버빌리티는 클러스터 안** | 칸마다 근거가 다름 — MySQL은 목적(prd에서 파드로 안 돌림) · Redis는 코드(Lua가 Cluster Mode에서 `CROSSSLOT` → 클러스터 모드 끔) · Kafka는 비용(MSK가 하루 $3.6으로 60배) · 관측은 용량(집 Mimir가 활성 시리즈 상한의 91.8%) |
| AZ | **셋** | Kafka 브로커 셋이 KRaft 과반과 `min.insync.replicas 2`를 겸함 — AZ 둘이면 한쪽에 둘이 가고 그 AZ가 죽으면 쓰기가 멈춤 |
| 서브넷 | **퍼블릭 · NAT 없음** | NAT 하나는 AZ 셋 설계와 어긋나고 AZ마다는 비용. 노드에 공인 IP가 붙는 대신 보안 그룹으로 좁힘. prd는 프라이빗 + AZ마다 NAT |
| 노드그룹 | **app ×4 · booking ×2(AZ별 · taint) · 관측 ×1(AZ 고정)** | 오픈 순간 튀는 파드는 booking 하나라 노드를 혼자 쓰게 함 · 볼륨이 AZ에 묶이는 관측만 AZ를 고정 · t 계열은 크레딧 고갈과 서비스 한계를 가를 수 없어 금지 · 수는 고정 — 판에서 막힘을 가리지 않게 |
| 파드의 AWS 자격 | **IRSA** · IMDSv2 hop limit 1 | 권한 단위를 노드가 아니라 ServiceAccount로 — 노드 역할에 붙이면 그 노드의 파드 전부가 가짐. hop 1이면 파드가 노드 역할 자격에 닿지 못함 |
| 진입 | **ALB · ACM · 파드 IP 대상** | MetalLB의 L2 광고가 VPC에서 안 됨 · 층 여섯(Cloudflare · OPNsense · MetalLB · Traefik · cert-manager · Ingress)이 둘(ALB · Service)로 · 평문 http에서 브라우저가 `crypto.randomUUID`를 안 줘 앱 id가 겹침 → HTTPS |
| 시크릿 | **Secrets Manager + 스크립트** | SealedSecret은 봉인이 그 클러스터 컨트롤러의 개인키에 묶여 컨트롤러가 뜨기 전에 봉인할 수 없음 · 하루 환경이라 ESO의 회전 · 동기화 가치가 0 |
| Redis | **복제본 1 · TLS + AUTH** | 복제본은 Kafka를 AZ 셋에 둔 것과 짝 · TLS + AUTH가 없으면 6379에 닿는 파드 하나가 대기열 · 좌석 락 · 입장 인증 전권 — 보안 그룹은 "어디서 오는가"만 봄 |
| 배포 | **집 허브가 원격 배달 · 아티팩트 승격** | EKS 안의 어떤 것도 사설망 GitLab을 못 읽음 · 부하 비교는 두 환경 이미지가 바이트까지 같아야 함 — 상세는 [CI/CD](/homelab/cicd/) |
{:.hl-dec}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| 노드그룹이 `CREATING`에서 20분 넘게 안 끝남 — `describe-nodegroup` 정상 · CloudTrail 무오류 | 계정 EC2 vCPU 한도 32 소진 — 실패는 ASG scaling activities에만 `VcpuLimitExceeded`. 정지 인스턴스는 한도에 안 셈 | 한도 **64**로 증설 → 1분 23초에 ACTIVE. 관리형 서비스의 실패는 한 층 아래(ASG · EC2)에서 본다 |
| 노드그룹 교체 뒤 Mimir ingester **95분 Pending** — 새 지표 저장 중단 | 관측 노드그룹에 서브넷 셋을 줘 노드가 2c → 2b로 옮겨 떴고, EBS 볼륨은 2c에 묶여 있음 | 상태를 든 노드그룹만 AZ 하나에 고정 — 앱 노드그룹 값을 그대로 넘긴 것이 원인 |
| Redis 암호화를 켠 뒤 앱이 `x509: certificate is valid for …`로 연결 실패 | 전송 암호화를 켜면 주 엔드포인트 이름이 `master.…`로 바뀌고, 인증서는 새 이름에만 맞음 | `REDIS_HOST`를 새 이름으로. 떠 있는 그룹에 앱을 끊지 않고 붙이는 순서는 preferred → 앱 TLS → required → ROTATE → SET |
| 30명이 한 사람으로 세어짐 — requestId 앞 8자가 전부 같은 시각 | 평문 http에서 브라우저가 `crypto.randomUUID`를 안 줌 → 시각 기반 폴백 id가 겹침 | HTTPS 입구(ACM · 443) + 프론트 폴백 수정 → 30명 중 29명 예매 |
{:.hl-tbl}

## 결과

<!-- destroy 전에 콘솔 캡처 뒤 활성화 — 파일 셋:
     /assets/img/homelab/cloud/argocd-clusters.png  허브 ArgoCD Settings → Clusters: in-cluster 와 cgv-stg 둘
     /assets/img/homelab/cloud/eks-nodegroups.png   EKS 콘솔 cgv-stg → Compute: 노드그룹 넷(app · booking-2a · booking-2c · observability)
     /assets/img/homelab/cloud/managed.png          RDS 인스턴스(Multi-AZ) + ElastiCache 복제 그룹(암호화 · AUTH) 한 화면 또는 둘 이어 붙임
<div class="hl-shots" markdown="0" aria-label="stg 콘솔 — 허브의 클러스터 둘 · 노드그룹 넷 · 관리형 둘, 화살표로 넘겨 봅니다">
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cloud/argocd-clusters.png" alt="노트북 ArgoCD 허브의 Clusters 화면 — in-cluster와 cgv-stg 두 클러스터가 등록돼 있음">
    <figcaption><b>(허브 · 클러스터 둘)</b> 집 노트북의 ArgoCD가 dev(in-cluster)와 stg(cgv-stg)를 같이 봅니다 — stg는 주소가 아니라 이름으로 등록돼 있습니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cloud/eks-nodegroups.png" alt="EKS 콘솔 cgv-stg의 노드그룹 넷 — app 4대, booking-2a와 booking-2c 한 대씩, observability 한 대" loading="lazy">
    <figcaption><b>(노드그룹 넷)</b> app 4 · booking 2a · booking 2c · observability — 부하 판이 정한 구조입니다. booking 둘은 taint가 있어 다른 파드가 앉지 못합니다.</figcaption>
  </figure>
  <figure class="hl-shot">
    <img src="/assets/img/homelab/cloud/managed.png" alt="RDS MySQL Multi-AZ 인스턴스와 ElastiCache Redis 복제 그룹의 콘솔 화면" loading="lazy">
    <figcaption><b>(관리형 둘)</b> 클러스터 밖으로 뺀 MySQL과 Redis입니다 — 노드 보안 그룹에서만 3306 · 6379를 받습니다.</figcaption>
  </figure>
</div>
-->

- **Terraform 두 state로 자원 56개가 30–40분에 뜹니다** — 켜고, 판을 돌리고, 지우는 하루 환경입니다
- **허브 ArgoCD가 `cgv-stg`를 클러스터 이름으로 배달합니다** — 주소를 옮겨 적는 단계 없이, 기존 ApplicationSet의 환경 목록에 한 줄
- **코드에서 브라우저까지 19분 41초**, 사람 손을 뺀 기계 구간 1분 54초
- **부하 판이 노드 구조를 바꿨습니다** — app 4 + 관측 1로 켰다가 booking 전용 노드그룹 둘이 더해져 일곱 대. 근거 수치는 [부하 테스트](/homelab/capacity/)에 있습니다
- **5만 명 판에서 관문 다섯이 통과했습니다**
- **떠 있는 Redis에 암호화와 AUTH를 앱을 끊지 않고 붙였습니다**

## 한계

- **운영 기간이 하루입니다** — 켜고 판을 돌리고 지우는 환경이라, 장기 운영 · 업그레이드 · 장애 대응은 없습니다. "운영했다"가 아니라 "구축하고 측정했다"입니다
- **퍼블릭 서브넷에 노드가 있고 공인 IP가 붙습니다** — prd는 프라이빗 서브넷 + AZ마다 NAT
- **데이터 보안 그룹이 노드 단위입니다** — 노드 인터페이스에 붙어 노드 위 어느 파드든 통과합니다. 파드 단위는 NetworkPolicy 하나가 맡고, prd는 Security Groups for Pods
- **CI → AWS가 IAM 사용자 장기 키입니다** — GitLab이 사설 IP라 OIDC 발급자로 쓸 수 없습니다
- **허브가 집에 있습니다** — 집 공인 IP가 바뀌면 apply를 다시 해야 하고, 집이 밤에 꺼지는 동안 EKS는 마지막 sync 상태로 돕니다
- **관측이 단일 AZ입니다** — 볼륨이 AZ에 묶이고 노드가 한 대라, 그 AZ가 죽으면 관측이 끊깁니다

## 기술 스택

AWS (EKS · VPC · IAM/IRSA · RDS · ElastiCache · S3 · ECR · ACM · ALB · Secrets Manager · CloudWatch) · Terraform · ArgoCD · GitLab CI · Strimzi · Grafana LGTM · k6
{:.hl-more}

{% include hl-nav.html %}
