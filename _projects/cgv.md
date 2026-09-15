---
layout: page
title: CGV 예매 대기열 시스템
date: 2025-08-01
description: >
  개발계 AWS 네트워크(Terraform)와 Redis · Kinesis 대기열 백엔드(Spring Boot)
links:
  - title: dev_terraform
    url: https://github.com/sss654654/dev_terraform
  - title: dev_backend
    url: https://github.com/sss654654/dev_backend
---

<p class="hl-back" markdown="0"><a href="/projects/">← Projects</a></p>

CJ 올리브네트웍스 클라우드웨이브 6기(2025.06 – 09) 5인 · 3주 팀 프로젝트.
2024년 한국시리즈 극장 생중계 예매 대기 16만 명 사례 기준, **몰리는 수요를 백엔드 처리량에 맞춰 조절하는 대기열**을 구현했습니다.
담당 — **AWS 개발계 네트워크 계층(Terraform)** · 대기열 백엔드(Spring Boot).
{:.lead}

## 개발계 구조

<figure class="hl-diagram" markdown="0">
<img src="/assets/img/projects/cgv-arch.png" alt="개발계 아키텍처 — VPC 10.0.0.0/16 안에 GitLab(인터넷 라우트 없음, Client VPN으로 접근) · EKS(NAT 아웃바운드만, ArgoCD 포함) · Public(ALB·NAT, 워크로드 없음) · DB(인터넷 라우트 없음, RDS·ElastiCache). ECR은 ecr.api·ecr.dkr 엔드포인트로, Kinesis도 엔드포인트로">
</figure>

## 설계 결정

| 항목 | 선택 | 이유 |
|---|---|---|
| 서브넷 인터넷 경로 | **Public 양방향 · EKS 나가는 것만 · GitLab · DB 없음** | 소스 저장소와 DB가 같은 VPC — 서브넷마다 필요한 만큼만 개방 |
| ECR 트래픽 | **`ecr.api` · `ecr.dkr` 엔드포인트를 서브넷마다** | 하나만 두면 인증은 되는데 pull이 NAT로 나감 · 인터페이스 엔드포인트는 서브넷 단위 ENI |
| NAT Gateway | **2a 하나만** — 2c 라우트도 여기로 | 시간당 요금 절반 — 개발 환경이라 2a 장애 시 2c 아웃바운드 단절은 감수 |
| 원격 state | **S3 + DynamoDB**, 별도 디렉터리 | 저장소 자신이 state에 들어가면 순환 |
| 대기열 상태 | **Redis Sorted Set 둘** — waiting(상한 없음) · active(Pod 수 기반 정원) | score가 요청 시각이라 도착 순서 유지 · 순위 조회도 빠름 |
| 입장 처리 | **2초 주기 프로세서** — 빈 자리만큼 앞에서부터 | 정원이 비는 즉시가 아니라 주기로 입장시켜야 Redis 왕복이 요청마다 안 늘어남 |
| 입장 통지 | **Kinesis** — WebSocket + 폴링 이중 | 입장 통지를 놓치면 예매 화면 진입 불가 — 24시간 재처리 보존, 연결이 끊겨도 폴링이 수신 |
{:.hl-dec}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| Consumer 폴링에 Kinesis **읽기 한도 초과 오류 반복** | 샤드 1개(초당 5회)를 Pod 6개가 폴링 · 0번 샤드만 읽어 증설로도 해소 불가 | 샤드 **2개**로 증설 · Pod 순번으로 분배(Pod 10 × 초당 1회 ÷ 5회) |
| Pod의 Kinesis 접근 거부 — IRSA가 아닌 **EC2 노드 역할**로 접근 중 | ServiceAccount annotation · 신뢰 관계는 정상 — 앱에 AWS 연동 의존성이 없어 IRSA 환경변수 미인식 | `spring-cloud-aws-starter` 의존성 추가 |
| 인증서를 ACM에 올리고 Client VPN 연결 시 **TLS 핸드셰이크 실패** | 서버 인증서 CN이 `server` 같은 비FQDN이라 ACM이 도메인 인식 불가 | Easy-RSA PKI 재구성, FQDN CN으로 재발급 |
| `destroy → apply` 뒤 GitLab 인스턴스에 **빈 볼륨** | `root_block_device` 인라인이라 인스턴스 교체 시 새 볼륨 생성 — 기존 볼륨은 남았지만 미연결 | 볼륨을 별도 자원으로 분리해 기존 볼륨을 import 후 연결 |
{:.hl-tbl}

## 결과

- **개발계 네트워크 계층 코드화** — VPC · 서브넷 6 · 라우트 테이블 4 · 보안그룹 5 · 엔드포인트 5 · GitLab EC2
- **정원 초과 요청의 대기열 전환 확인** — UUID 10,000명 투입 시 200(즉시 입장) · 202(대기 등록) 분기, 부하 중 HPA 확장을 ArgoCD에서 확인
- **단계별 병목 해소** — 100 → 1,000 → 10,000명에서 Redis 풀 **10 → 20** · Kinesis 샤드 **1 → 2**

## 한계

- **CI/CD · EKS 구축과 배포계는 팀원 담당** — 파이프라인 · 클러스터 직접 구축 없음, 부하는 개발계 동작 확인까지. 클러스터 구축은 [홈랩](/homelab/onprem/), EKS 구축은 [클라우드](/homelab/cloud/)에서 보완
- **Kinesis · WebSocket 기능 대부분 미사용** — 단일 소비자라 Fan-out · 재처리 불필요, 단방향 알림인데 양방향 연결 유지
- **Client VPN을 dev 편의로 퍼블릭 서브넷 접근으로 전환** — 코드에 남은 GitLab 보안그룹 인바운드 `0.0.0.0/0`

## 기술 스택

Terraform · AWS (VPC · VPC Endpoint · Client VPN · EKS · Kinesis · ECR · IRSA) · Java 17 · Spring Boot 3.3 · JPA · Redis (Sorted Set) · WebSocket (STOMP) · MySQL
{:.hl-more}

[github.com/sss654654/dev_terraform](https://github.com/sss654654/dev_terraform) · [dev_backend](https://github.com/sss654654/dev_backend)
{:.hl-more}

{% include pj-nav.html %}
