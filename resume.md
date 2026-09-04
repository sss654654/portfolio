---
layout: page
title: 이력서
description: >
  인프라 엔지니어 · SRE / DevOps — 경력·프로젝트·기술 스택
permalink: /resume/
---

노트북 한 대에 k3s 클러스터를 세워 예매 대기열 서비스를 인터넷에 공개하고,
10,000명 부하에서 5xx 0건을 유지하며 정원·자원 스펙을 실측했습니다.

**[이력서 PDF 내려받기](/assets/subinhong-resume.pdf)**

## Skills

| Kubernetes | k3s · etcd · Helm · Calico · MetalLB · Traefik · NetworkPolicy |
| CI/CD · GitOps | GitLab CI / Runner · ArgoCD · argocd-image-updater · Sealed Secrets · Trivy · gitleaks |
| Observability · Load | Grafana · Mimir · Loki · Tempo · Alloy · Pyroscope · OpenTelemetry · PromQL / LogQL / TraceQL · k6 |
| IaC · Cloud | Terraform · AWS (VPC · VPC Endpoint · Client VPN · Kinesis · ECR · IRSA) |
| Network · Security | OPNsense · WireGuard · Cloudflare · cert-manager · Let's Encrypt |
| Virtualization · OS | Proxmox VE · KVM / QEMU · LVM · Ubuntu Server |
| Backend · Data | Go · Java (Spring Boot) · Redis · Kafka · MySQL |
{:.hl-tbl}

## 경력

#### [semiai](/projects/semiai/) · 인프라팀 · 2026.03 – 06

기구축된 k3s·LGTM 스택 위에서 계측·수집·대시보드를 맡았습니다. 수집기 넷을 Alloy 하나로 통합하고,
control-plane 생존부터 자원 한계 임박까지 3단으로 좁혀 가는 클러스터 대시보드를 설계했습니다.
Go 백엔드에 metric·trace·log·profile 계측을 넣어 한 요청을 신호들에 걸쳐 좇을 수 있게 했습니다.

## 프로젝트

#### [온프레미스 k3s 홈랩](/homelab/) · 2026.07 – 09

노트북 1대에 Proxmox → VM 3대 → k3s를 단독 구축해 인터넷에 공개했습니다.
파이프라인 한 판 10분 15초 → 1분 54초, 커밋에서 반영까지 3분 → 3초,
10,000명 부하에서 735,273 요청 · 5xx 0건. 무엇을 골랐고 왜 그랬는지는 카드 여섯에 정리했습니다.

#### [CGV 예매 대기열 시스템](/projects/cgv/) · 2025.06 – 09 · CJ 올리브네트웍스 클라우드웨이브 6기

5인 팀에서 AWS 개발계 네트워크 계층(Terraform)과 대기열 백엔드(Spring Boot)를 맡았습니다.
VPC·서브넷·엔드포인트를 코드로 정의하고, Redis Sorted Set 둘로 대기와 입장을 나눠 Kinesis로 승격을 전달했습니다.

#### [LevelDB 캐시 메커니즘 분석](/projects/leveldb/) · 2022.07 – 12

Google LevelDB의 2계층 캐시와 ShardedLRUCache를 C++ 소스로 분석하고,
db_bench로 캐시 파라미터가 읽기 성능에 미치는 영향을 실측했습니다 — KSC 2022 학부생 논문 1저자.

## 학력 · 자격 · 병역

**단국대학교 소프트웨어학과** · 2021.03 – 2026.02 · 학점 3.76 / 4.5

AWS Developer Associate 2025.09 · AWS Solutions Architect Associate 2024.11 · 정보처리기사 2024.06 ·
리눅스마스터 2급 2023.12 · SQLD 2022.12
{:.hl-more}

공군 병장 만기전역 · 2023.08 – 2025.05
{:.hl-more}
