---
layout: page
title: semiai 옵저버빌리티
date: 2026-06-01
description: >
  온프레미스 k3s 클러스터와 그 위 앱의 옵저버빌리티 — 계측·수집·대시보드
---

<p class="hl-back" markdown="0"><a href="/projects/">← 프로젝트</a></p>

반도체 수율을 AI로 높이는 플랫폼 회사의 인프라팀에서 2026년 3월부터 6월까지 일했습니다.
배포 환경이 docker-compose에서 k3s로 옮겨가면서 그 환경과 앱을 볼 화면이 필요해졌는데,
**대시보드도 신호를 모을 수집 경로도 없었습니다.**
k3s 전환과 구축은 팀이 했고, 그 위의 LGTM 스택 구축부터 계측·대시보드까지 맡았습니다.
{:.lead}

## 옵저버빌리티 구조

<figure class="hl-diagram" markdown="0">
<img src="/assets/img/projects/semiai-pipeline.png" alt="옵저버빌리티 파이프라인 — 백엔드의 metric·trace·log·profile과 클러스터 타겟(kubelet·etcd·apiserver·node-exporter·KSM)을 Grafana Alloy가 모아 LGTM 저장소로 보내고, 과거 블록은 MinIO에, 컴포넌트 PVC는 LVM StorageClass에">
</figure>

## 설계 결정

| 항목 | 선택 | 이유 |
|---|---|---|
| 수집기 | **Alloy 하나로 통합** | 수집기 넷(Prometheus · Promtail · OTel Collector · Pyroscope agent)의 설정이 제각각 |
| 인프라 대시보드 | **3단 동선** — control-plane 생존 → 비정상 Pod → 자원 임박 · 비정상 Pod는 `kube_pod_status_ready` 하나로 판정 | control-plane이 정상이어야 Pod 판정이 유효 · 실패 유형 6종 OR은 조건이 늘수록 신뢰가 떨어짐 |
| 앱 진단 동선 | **오류 종류로 두 갈래** — 500·panic은 trace → log / 502·503·OOM은 Traefik → 그 시각 힙 flame graph · metric→trace는 path 라벨 dataLink | 파드에 닿지 못한 요청은 Traefik만 앎 · `trace_id`를 metric 라벨에 넣으면 요청마다 시계열 폭발 |
| profile | **Pyroscope 연속 프로파일링** — Alloy가 `/debug/pprof`를 주기 수집 | OOMKilled는 SIGKILL이라 trace·log가 flush 전에 끊김 — 죽기 직전 힙을 보려면 계속 찍고 있어야 함 |
| 계측 범위 | **대시보드·알림이 참조하는 신호만** — 자동 계측과 겹치는 span · 미참조 attribute 제거 | 자동 계측과 중복이거나 참조처 없는 신호는 노이즈·카디널리티 |
| 알림 기준 | **5xx 절대 건수** | 개발자만 쓰는 dev라 표본이 적어 비율·분위수는 무의미 |
{:.hl-dec}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| master 2대를 정지시켰는데 대시보드는 **Ready** | 노드 상태가 kube-state-metrics 경유 — 갱신이 멈춘 채 옛 값 그대로 | kubelet `:10250`을 직접 scrape한 `up`으로 판정 — etcd는 `etcd_server_has_leader` self-metric |
| etcd·apiserver metric이 **안 잡힘** | Pod가 아니라 k3s 단일 바이너리 안의 goroutine — Service·Endpoints 자동 생성이 안 돼 ServiceMonitor 부착 불가 | 수동 Service·Endpoints·ServiceMonitor 셋 — master IP는 설치 스크립트가 `envsubst`로 주입 |
| Loki log와 Tempo trace가 같은 요청인데 **안 이어짐** | `trace_id` 키 이름이 제각각 — backend `traceid`, Traefik `trace_id`·`OtelTraceID` | Alloy `label_format`으로 키 통일, Traefik 설정 정정 |
{:.hl-tbl}

## 결과

- **인프라·앱 대시보드를 구성했습니다** — 인프라 대시보드는 인프라팀이, 앱 대시보드는 개발팀이 봅니다
- **앱 코드에 네 신호를 계측했습니다** — Go 백엔드의 metric · trace · log · profile
- **힙 profile로 메모리를 점유하는 함수를 찾아 개발팀에 공유했습니다** — 개발자가 로직을 수정한 뒤 메모리 78% 감소, 50x 에러 소멸

## 기술 스택

k3s · Grafana · Mimir · Loki · Tempo · Pyroscope · Alloy · OpenTelemetry · kube-state-metrics · node-exporter · MinIO · LVM · ArgoCD · Helm
{:.hl-more}

같은 스택을 물리 서버부터 직접 세운 것은 [홈랩 옵저버빌리티](/homelab/observability/)에 있습니다.
{:.hl-more}

{% include pj-nav.html %}
