---
layout: page
title: semiai 옵저버빌리티
date: 2026-06-01
description: >
  온프레미스 k3s 클러스터와 그 위 앱의 관측 — 계측·수집·대시보드
---

<p class="hl-back" markdown="0"><a href="/projects/">← 프로젝트</a></p>

반도체 수율을 AI로 높이는 플랫폼 회사의 인프라팀에서 2026년 3월부터 6월까지 일했습니다.
배포 환경이 docker-compose에서 k3s로 옮겨가면서 그 환경과 앱을 볼 화면이 필요해졌는데,
**대시보드도 신호를 모을 수집 경로도 없었습니다.**
k3s 전환과 LGTM 스택 구축은 팀이 했고, 계측·수집과 대시보드 둘을 맡았습니다.

## 관측 구조

<figure class="hl-diagram" markdown="0">
<img src="/assets/img/projects/semiai-pipeline.png" alt="관측 파이프라인 — 백엔드의 metric·trace·log·profile과 클러스터 타겟(kubelet·etcd·apiserver·node-exporter·KSM)을 Grafana Alloy가 모아 LGTM 저장소로 보내고, 과거 블록은 MinIO에, 컴포넌트 PVC는 LVM StorageClass에">
<figcaption>수집기 하나가 백엔드와 클러스터의 신호를 다 받습니다.</figcaption>
</figure>

## 구성한 것

| 무엇을 | 어떻게 | 그렇게 한 이유 |
|---|---|---|
| 수집기 | **Alloy 하나로 통합** | 수집기 넷(Prometheus · Promtail · OTel Collector · Pyroscope agent)의 설정이 제각각 |
| 수집 방식 | **pull / push 를 대상 성질로 가름** | 메트릭·파일 로그·프로파일은 이미 노출된 것, trace·로그는 유실되면 안 되는 이벤트 |
| 저장 | **MinIO(S3) 본저장 · LGTM 전용 LVM** | 컴포넌트가 죽어도 과거 블록은 보존 · 다른 워크로드와 디스크 분리 |
| 대시보드 동선 | **3단** — control-plane 생존 → 비정상 Pod → 자원 한계 임박 | 단마다 stat(지금)과 table(흔적) 한 쌍 — 회복된 사고도 표에 남는 구조 |
| 비정상 Pod 식별 | **`kube_pod_status_ready` 단일 메트릭** | 6종 OR은 조건이 늘수록 신뢰가 떨어짐 — 원인이 무엇이든 준비가 안 되면 Ready=false로 수렴 |
| 네 신호 연결 | **`trace_id`로 잇고 metric→trace만 dataLink** | 같은 요청의 신호를 바로 열려면 공통 키가 필요 · 메트릭 라벨에 넣으면 요청마다 시계열이 폭발 |
| profile | **Pyroscope 연속 프로파일링** — Alloy가 `/debug/pprof`를 주기 수집, MinIO 저장 | OOMKilled는 SIGKILL이라 trace·log가 flush 전에 끊김 — 죽기 직전 힙을 함수별로 보려면 계속 찍고 있어야 함 |
| 진단 동선 | **오류 종류로 두 갈래** — 500·panic은 trace → 로그 / 502·503·OOM은 Traefik 지표·trace의 path → 그 시각 힙 flame graph | 파드에 닿지 못한 요청은 백엔드 지표에 없어 Traefik을 따로 수집 · 힙은 요청이 아니라 시각 단위라 −60s/+5s 창으로 점프 |
| 계측 범위 | **대시보드·알림이 참조하는 신호만** — repository span · 미참조 attribute 22개 · exemplar 제거 | 자동 계측(otelpgx)과 중복이거나 참조처 없는 신호는 노이즈·카디널리티 |
| 알림 기준 | **5xx 절대 건수** | 개발자만 쓰는 dev라 표본이 적어 비율·분위수 기준은 무의미 |
{:.hl-dec}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| master 2대를 정지시켰는데 대시보드는 **Ready(정상)** | 노드 상태가 kube-state-metrics 경유 — 갱신이 멈춘 채 옛 값 그대로 | kubelet `:10250`을 직접 scrape한 `up`으로 판정 — etcd는 `etcd_server_has_leader` self-metric |
| etcd·apiserver 메트릭이 **아예 안 잡힘** | Pod가 아니라 k3s 단일 바이너리 안의 goroutine — Service·Endpoints 자동 생성이 안 돼 ServiceMonitor 부착 불가 | 수동 Service·Endpoints·ServiceMonitor 셋 — master IP는 설치 스크립트가 `envsubst`로 주입 |
| PVC별 디스크 사용량 패널이 안 만들어짐 — 어느 메트릭을 써도 **LV 전체 값** | `node_filesystem_*`은 statfs 기반이라 마운트 단위 — 한 LV 안에 PVC를 디렉터리로 두는 구조 | PVC별 패널을 버리고 마운트별로 수렴 |
| Loki 로그와 Tempo trace가 같은 요청인데 **안 이어짐** | `trace_id` 키 이름이 제각각 — backend `traceid`, Traefik `trace_id`·`OtelTraceID` | Alloy `label_format`으로 키 통일, Traefik 설정 정정 |
{:.hl-tbl}

## 결과

- **인프라·앱 대시보드를 구성했습니다** — 클러스터 데일리 판은 인프라팀이, 앱 판은 개발팀이 봅니다
- **앱 코드에 네 신호를 계측했습니다** — Go 백엔드의 metric · trace · log · profile
- **힙 profile로 메모리를 점유하는 함수를 찾아 개발팀에 공유했습니다** — 개발자가 로직을 수정한 뒤 메모리 78% 감소, 50x 에러 소멸

## 남은 것

- **운영 성과 수치가 없습니다** — 실 운영 전에 나와, dev에서 잡은 것까지입니다
- **노드가 정상으로 보이던 원인은 추론입니다** — 관찰은 사실이나 멀티노드에서 재현해 확정하지 못했습니다

## 쓴 것

k3s · Grafana · Mimir · Loki · Tempo · Pyroscope · Alloy · OpenTelemetry · kube-state-metrics · node-exporter · cAdvisor · MinIO · LVM · ArgoCD · Helm
{:.hl-more}

온프레미스에서 같은 스택을 직접 세운 것은 [홈랩 관측](/homelab/observability/)에 있습니다.
{:.hl-more}

{% include pj-nav.html %}
