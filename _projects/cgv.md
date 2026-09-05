---
layout: page
title: CGV 예매 대기열 시스템
date: 2025-08-01
description: >
  개발계 AWS 네트워크(Terraform)와 Redis·Kinesis 대기열 백엔드(Spring Boot)
links:
  - title: dev_terraform
    url: https://github.com/sss654654/dev_terraform
  - title: dev_backend
    url: https://github.com/sss654654/dev_backend
---

<p class="hl-back" markdown="0"><a href="/projects/">← 프로젝트</a></p>

CJ 올리브네트웍스 클라우드웨이브 6기(2025.06–09)에서 5인이 3주 동안 만든 팀 프로젝트입니다.
2024년 한국시리즈 극장 생중계 예매에서 대기 인원이 16만 명까지 불어난 사례를 놓고,
**몰리는 수요를 백엔드가 감당할 유량으로 바꾸는 대기열**을 과제로 잡았습니다.
그중 **AWS 개발계 네트워크 계층(Terraform)**과 대기열 백엔드(Spring Boot)를 맡았습니다.
{:.lead}

## 개발계 구조

<figure class="hl-diagram" markdown="0">
<img src="/assets/img/projects/cgv-arch.png" alt="개발계 아키텍처 — VPC 10.0.0.0/16 안에 GitLab(인터넷 라우트 없음, Client VPN으로 접근) · EKS(NAT 아웃바운드만, ArgoCD 포함) · Public(ALB·NAT, 워크로드 없음) · DB(인터넷 라우트 없음, RDS·ElastiCache). ECR은 ecr.api·ecr.dkr 엔드포인트로, Kinesis도 엔드포인트로">
</figure>

## 설계 결정

| 항목 | 선택 | 이유 |
|---|---|---|
| 서브넷 인터넷 경로 | **Public 양방향 · EKS 나가는 것만 · GitLab·DB 없음** | 소스 저장소와 DB가 같은 VPC — 서브넷마다 필요한 만큼만 개방 |
| ECR 트래픽 | **`ecr.api`·`ecr.dkr` 엔드포인트를 서브넷마다** | 하나만 두면 인증은 되는데 pull이 NAT로 나감 · 인터페이스 엔드포인트는 서브넷 단위 ENI |
| NAT Gateway | **2a 하나만** — 2c 라우트도 여기로 | 시간당 요금 절반 — 개발 환경이라 2a 장애 시 2c 아웃바운드 단절은 감수 |
| 원격 state | **S3 + DynamoDB**, 별도 디렉터리 | 저장소 자신이 state에 들어가면 순환 |
| 대기열 상태 | **Redis Sorted Set 둘** — waiting(상한 없음) · active(Pod 수 기반 정원) | score가 요청 시각이라 도착 순서 유지 · 순위 조회도 빠름 |
| 승격 | **2초 주기 프로세서** — 빈 자리만큼 앞에서부터 | 정원이 비는 즉시가 아니라 주기로 옮겨야 Redis 왕복이 요청마다 안 늘어남 |
| 승격 통지 | **Kinesis** — WebSocket + 폴링 이중 | 승격을 놓치면 예매 화면 진입 불가 — 24시간 재처리 보존, 연결이 끊겨도 폴링이 수신 |
{:.hl-dec}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| Consumer 폴링에 `ProvisionedThroughputExceededException` **반복** | 샤드 1개(읽기 초당 5회)를 Pod마다 폴링 → Pod 6개에서 한도 초과 · Consumer가 0번 샤드만 읽어 증설로도 해소 불가 | Pod 순번으로 샤드를 라운드로빈 분배, 샤드별 스레드로 소비 — 필요 샤드 = Pod 10 × 초당 1회 ÷ 샤드당 5회 = **2개** |
| Pod의 Kinesis 접근이 `AccessDeniedException` — **EC2 노드 역할**로 접근 중 | 서비스 계정 annotation과 신뢰 관계는 정상 — `pom.xml`에 `spring-cloud-aws-starter`가 없어 IRSA 환경변수 미인식 | 의존성 추가 |
| 인증서를 ACM에 올리고 Client VPN 연결 시 **TLS 핸드셰이크 실패** | 서버 인증서 CN이 `server` 같은 비FQDN이라 ACM이 도메인 인식 불가 | Easy-RSA PKI 재구성, FQDN CN으로 재발급 |
| `destroy → apply` 뒤 GitLab 인스턴스에 **빈 볼륨** | `root_block_device` 인라인 정의라 볼륨이 인스턴스 수명주기에 종속 — 기존 볼륨은 살아 있는데 새 인스턴스가 미연결 | 독립 `aws_ebs_volume` + `terraform import` + `aws_volume_attachment`로 분리 |
{:.hl-tbl}

## 결과

- **개발계 전체가 코드 한 벌로 남았습니다** — VPC·서브넷 6개·라우트 테이블 4개·보안그룹 5개·엔드포인트 5개·GitLab EC2
- **정원이 차면 이후 요청은 대기열로 갑니다** — UUID 10,000명 분을 투입해 200(즉시 입장)과 202(대기 등록)로 갈리는 것을 확인했고, 부하 중 HPA로 파드가 늘어나는 것을 ArgoCD에서 확인했습니다
- **투입 인원을 늘리며 드러난 병목을 고쳤습니다** — 100 → 1,000 → 10,000명에서 Redis 풀 **10 → 20** · Kinesis 샤드 **1 → 2**

## 한계

- **CI/CD · EKS 구축과 배포계는 팀원 몫이었습니다** — 파이프라인과 클러스터를 직접 세우지 않았고, 부하는 개발계에서 동작 확인까지만 했습니다. 클러스터 구축은 [홈랩](/homelab/cluster/)에서 채웠습니다
- **Kinesis와 WebSocket은 이 규모에 과했습니다** — 단일 소비자라 Fan-out·재처리를 쓸 자리가 없었고, 단방향 알림에 양방향 연결은 비용만 컸습니다
- **Client VPN은 dev 편의로 퍼블릭 서브넷 접근으로 전환했습니다** — 코드에 남은 GitLab 보안그룹 인바운드가 `0.0.0.0/0`입니다

## 기술 스택

Terraform · AWS (VPC · VPC Endpoint · Client VPN · EKS · Kinesis · ECR · IRSA) · Java 17 · Spring Boot 3.3 · JPA · Redis (Sorted Set) · WebSocket (STOMP) · MySQL
{:.hl-more}

[github.com/sss654654/dev_terraform](https://github.com/sss654654/dev_terraform) · [dev_backend](https://github.com/sss654654/dev_backend)
{:.hl-more}

{% include pj-nav.html %}
