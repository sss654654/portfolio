---
layout: page
title: semiai 옵저버빌리티
date: 2026-06-01
description: >
  팀이 세운 k3s·LGTM 스택 위에서 클러스터 대시보드와 앱 계측을 맡았습니다
---

<p class="hl-back" markdown="0"><a href="/projects/">← 프로젝트</a></p>

반도체 수율을 AI로 높이는 플랫폼 회사의 인프라팀에서 2026년 3월부터 6월까지 일했습니다.
배포 환경이 docker-compose 단일 인스턴스에서 k3s로 옮겨가던 때였고,
**그 클러스터와 그 위의 앱을 관측할 대시보드가 없었습니다.**
k3s 전환과 LGTM 스택 구축은 팀이 했고, 그 위에서 계측·수집·대시보드를 맡았습니다.

## 관측 구조

<figure class="hl-diagram" markdown="0">
<img src="/assets/img/projects/semiai-pipeline.png" alt="관측 파이프라인 — 백엔드의 metric·trace·log·profile과 클러스터 타겟(kubelet·etcd·apiserver·node-exporter·KSM)을 Grafana Alloy가 모아 LGTM 저장소로 보내고, 과거 블록은 MinIO에, 컴포넌트 PVC는 LVM StorageClass에">
<figcaption>수집기 하나가 백엔드와 클러스터의 신호를 다 받습니다. 최근 데이터는 저장소 메모리와 PVC에, 과거 블록은 MinIO로 내려갑니다.</figcaption>
</figure>

## 한 것

- **[수집 통합]** 신호마다 따로 있던 수집기 넷(Prometheus · Promtail · OTel Collector · Pyroscope agent)을 Alloy 하나로 통합했습니다. 대상에 이미 있는 것(메트릭 · 파일 로그 · 프로파일)은 pull, 앱이 만들어 보내는 것(trace · OTLP 로그)은 push — 파이프라인 여섯을 이 기준으로 갈랐습니다. 저장은 MinIO(S3)로 영속화하고, LGTM 전용 LVM StorageClass를 따로 두었습니다.
- **[클러스터 대시보드]** control-plane 생존 → 비정상 Pod → 자원 한계 임박, 세 단으로 좁혀 가는 데일리 대시보드를 설계했습니다. 단마다 stat(지금)과 table(기간 흔적)을 짝지어, 야간에 났다가 회복된 사고도 출근 뒤 표에 남습니다. 비정상 Pod 식별은 실패 유형 6종을 OR로 묶던 것을 `kube_pod_status_ready` 하나로 바꿨습니다 — 원인이 무엇이든 준비가 안 되면 Ready=false로 수렴하기 때문입니다.
- **[control-plane 수집]** etcd·apiserver는 k3s 단일 바이너리 안에서 돌아 Pod가 아니라, ServiceMonitor의 자동 발견에 잡히지 않습니다. 수동 Service(headless) · Endpoints · ServiceMonitor 셋을 직접 붙이고, 고정할 수 없는 master IP는 설치 스크립트가 `kubectl get nodes` → `envsubst`로 넣습니다.
- **[앱 계측]** Go(Gin) 백엔드에 metric · trace · log · profile 계측을 추가하고, 그 신호를 받는 수집(ServiceMonitor · OTLP receiver · Pyroscope scrape)까지 짝으로 세웠습니다. 같은 요청의 trace · log · profile에 같은 `trace_id`가 찍혀 한 신호에서 나머지로 바로 건너갑니다. metric→trace는 `trace_id`를 라벨에 넣으면 시계열이 폭발해, path 라벨로 TraceQL 검색을 거는 dataLink로 이었습니다.
- **[알림]** 개발자만 쓰는 dev 환경이라 표본이 적어 비율·분위수 기준이 의미 없었습니다. 5xx 절대 건수를 알림 기준으로 두고, 그 지점에서 해당 요청의 trace · log로 이어지게 했습니다.

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| master 2대를 정지시켰는데 대시보드는 **Ready(정상)** | 노드 상태가 kube-state-metrics를 거쳐 오는데, 그 값이 갱신을 멈춘 채 옛 값으로 남음 | kubelet `:10250`을 Alloy가 직접 scrape한 `up`으로 판정 — etcd도 `etcd_server_has_leader` self-metric으로 |
| PVC별 디스크 사용량 패널이 안 만들어짐 — 어느 메트릭을 써도 **LV 전체 값** | `node_filesystem_*`은 statfs 기반이라 파일시스템(마운트) 단위. 한 LV 안에 PVC를 디렉터리로 두는 구조라 PVC를 물어도 LV 값이 옴 | PVC별 패널을 버리고 마운트별로 수렴 |
| Loki 로그와 Tempo trace가 같은 요청인데 **안 이어짐** | `trace_id` 키 이름이 제각각 — backend `traceid`, Traefik `trace_id`·`OtelTraceID` | Alloy `label_format`으로 키 통일, Traefik 설정 정정 |
{:.hl-tbl}

## 남은 것

- **운영 성과 수치가 없습니다** — 구축을 마친 시점이 실 운영 직전이라, 설계로 해결한 문제까지입니다
- **죽은 노드가 정상으로 보이던 현상의 내부 메커니즘은 추론입니다** — 관찰은 사실이지만 멀티노드에서 재현해 확정하지는 못했습니다

## 쓴 것

k3s · Grafana · Mimir · Loki · Tempo · Pyroscope · Alloy · OpenTelemetry · kube-state-metrics · node-exporter · cAdvisor · MinIO · LVM · ArgoCD · Helm
{:.hl-more}
