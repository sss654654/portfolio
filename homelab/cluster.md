---
layout: page
title: 클러스터
description: >
  노트북 한 대를 Proxmox로 나눠 VM 세 대에 k3s를 HA로 세웠습니다
permalink: /homelab/cluster/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

물리 서버는 노트북 한 대이고, 내장 Windows는 지우지 않습니다. 아래 선택은 대부분 이 두 조건에서 나옵니다.

## 서 있는 구조

<!-- 층 그림 — 아래에서 위로: 물리 디스크 → Proxmox → VM 3대(각자의 데이터 디스크) → k3s.
     네트워크 경로는 홈랩 배선도가 담당하므로 여기서는 vmbr0 한 줄로만 언급한다.
     무엇을 끄고 무엇으로 바꿨는지는 아래 대조표가 담당하므로 그림에서 반복하지 않는다. -->
<figure class="hl-diagram" markdown="0">
<svg viewBox="0 0 760 372" role="img" aria-label="노트북 한 대 안에서 외장 USB SSD로 부팅한 Proxmox 위에 VM 세 대가 서고, 각 VM이 자기 데이터 디스크를 가진 채 k3s 클러스터를 이루는 층 구조">
  <defs>
    <marker id="hlv-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".45"/>
    </marker>
  </defs>

  <rect class="hla-outer" x="14" y="14" width="732" height="344" rx="8"/>
  <text class="hla-zone" x="30" y="34">노트북 1대 · Core Ultra 5 125H · RAM 32GB</text>

  <!-- k3s -->
  <rect class="hla-box" x="30" y="44" width="700" height="46" rx="5"/>
  <text class="hla-t" x="46" y="65">k3s — 세 대 모두 control-plane 겸 워커 · etcd 3멤버</text>
  <text class="hla-s" x="46" y="81">Calico(파드 네트워크) · MetalLB(로드밸런서) · Traefik(인그레스) · 정적 PV(스토리지)</text>

  <!-- 세 노드 공통 스펙은 여기 한 번만. 박스마다 반복하면 면적의 절반을 같은 말이 차지한다 -->
  <text class="hla-a" x="34" y="108">노드 셋 공통 — 4 vCPU · RAM 8GB 고정 · 부트 40G · 데이터 디스크는 역할별로 다르게</text>

  <!-- VM 3대 — 이름·라벨·데이터 디스크만 -->
  <g>
    <rect class="hla-box" x="34" y="118" width="224" height="112" rx="5"/>
    <text class="hla-t" x="48" y="140">k3s-1 · 10.0.0.11</text>
    <text class="hla-a" x="238" y="140" text-anchor="end">db</text>
    <text class="hla-s2" x="48" y="166">mysqldata 20G</text>
    <text class="hla-s2" x="48" y="184">kafkadata 30G</text>
    <text class="hla-s2" x="48" y="202">ingesterwal 5G</text>
  </g>
  <g>
    <rect class="hla-box" x="270" y="118" width="224" height="112" rx="5"/>
    <text class="hla-t" x="284" y="140">k3s-2 · 10.0.0.12</text>
    <text class="hla-a" x="474" y="140" text-anchor="end">obs</text>
    <text class="hla-s2" x="284" y="166">kafkadata 30G</text>
    <text class="hla-s2" x="284" y="184">ingesterwal 5G</text>
    <text class="hla-s2" x="284" y="202">lokiwal 5G</text>
    <text class="hla-s2" x="284" y="220">tempowal 5G</text>
  </g>
  <g>
    <rect class="hla-box" x="506" y="118" width="224" height="112" rx="5"/>
    <text class="hla-t" x="520" y="140">k3s-3 · 10.0.0.13</text>
    <text class="hla-a" x="710" y="140" text-anchor="end">obj</text>
    <text class="hla-s2" x="520" y="166">kafkadata 30G</text>
    <text class="hla-s2" x="520" y="184">ingesterwal 5G</text>
    <text class="hla-s2" x="520" y="202">miniodata 100G</text>
  </g>

  <line class="hla-ln" x1="146" y1="242" x2="146" y2="232" marker-end="url(#hlv-arrow)"/>
  <line class="hla-ln" x1="382" y1="242" x2="382" y2="232" marker-end="url(#hlv-arrow)"/>
  <line class="hla-ln" x1="618" y1="242" x2="618" y2="232" marker-end="url(#hlv-arrow)"/>

  <!-- Proxmox -->
  <rect class="hla-box" x="30" y="244" width="700" height="46" rx="5"/>
  <text class="hla-t" x="46" y="265">Proxmox VE — Type 1 하이퍼바이저 · KVM + QEMU</text>
  <text class="hla-s" x="46" y="281">LVM-thin 풀에서 데이터 디스크 10장(235G)을 잘라 VM 에 붙임 · 노드 셋은 방화벽 VM 뒤 격리망(vmbr1)에</text>

  <line class="hla-ln" x1="202" y1="302" x2="202" y2="292" marker-end="url(#hlv-arrow)"/>
  <text class="hla-a" x="212" y="300">부팅</text>

  <!-- 물리 디스크 — 부팅 디스크를 무엇으로 고르느냐가 이 노트북의 역할을 가른다 -->
  <rect class="hla-box" x="30" y="304" width="344" height="44" rx="5"/>
  <text class="hla-c" x="46" y="323">외장 USB SSD 1TB</text>
  <text class="hla-s2" x="46" y="338">이 디스크로 부팅하면 서버 — 빠지면 그대로 내려간다</text>

  <rect class="hla-inner hla-dash" x="386" y="304" width="344" height="44" rx="5"/>
  <text class="hla-c" x="402" y="323">내장 NVMe</text>
  <text class="hla-s2" x="402" y="338">Windows — 지우지 않았다</text>
</svg>
<figcaption>부팅 디스크를 무엇으로 고르느냐가 이 노트북이 서버인지 아닌지를 가릅니다.</figcaption>
</figure>

## 기본값을 끄고 직접 고른 것

<div class="hl-sub" markdown="0">노트북을 서버로 만드는 층</div>

| | 기본값 | 이 홈랩 | 그렇게 한 이유 |
|---|---|---|---|
| 하이퍼바이저 | Windows 위에 얹는 Type&nbsp;2 | **Proxmox** — Type&nbsp;1 | 호스트 OS가 자원을 상시 차지하지 않아 노트북 몫을 전부 VM에 배분할 수 있고, Windows 재부팅에 세 대가 함께 내려가지도 않음 |
| 게스트 메모리 | ballooning — 호스트가 게스트 RAM을 회수 | **8GB 고정** | 호스트가 바쁠 때 회수가 시작돼 노드 RAM 총량이 실행 중에 줄어드는데, kubelet은 그 값이 고정이라는 전제로 배치와 퇴출을 판단함 |
| 절전 | 뚜껑 닫으면 잠자기 · USB 자동절전 | **둘 다 차단** | 루트 디스크가 외장 USB — 재워지면 파일시스템이 끊김 |
{:.hl-cmp}

<div class="hl-sub" markdown="0">k3s가 안고 오는 층</div>

| | 기본값 | 이 홈랩 | 그렇게 한 이유 |
|---|---|---|---|
| 파드 네트워크 | Flannel | **Calico** | Flannel은 NetworkPolicy를 집행하지 않음 |
| 로드밸런서 | ServiceLB — 노드 IP를 빌림 | **MetalLB** `10.0.0.240-250` | 서비스에 줄 주소 대역을 직접 정해야 함 |
| 인그레스 | 번들 Traefik | **직접 올린 Traefik** | 번들은 설정을 바꿔도 k3s 업그레이드에 덮임 |
| 노드 예약 | 없음 — 전부 파드 몫으로 신고 | **2Gi** — 노드당 allocatable 5081Mi | 메모리가 마르면 커널이 etcd를 안은 프로세스를 죽임 |
| 스토리지 | local-path — 한 파일시스템에 폴더로 | **정적 PV 10장** | 워크로드별 사용량이 지표에서 갈림 |
{:.hl-cmp}

디스크를 워크로드마다 자른 건 성능이 아니라 관측 때문입니다.
사용량은 `statfs`가 **파일시스템 단위로만** 답해서, 한 볼륨에 폴더로 나눠 담으면 나중에 쿼리로 "누가 채웠나"를 못 가립니다.

<figure class="hl-shot" markdown="0">
  <div class="hl-shot-wait">cluster-nodes.png — kubectl get nodes -L cgv.io/data</div>
  <figcaption>세 노드가 control-plane 겸 etcd 멤버로 서고, 디스크 배치에 맞춘 라벨이 붙습니다.</figcaption>
</figure>

## 겪은 문제

| 이슈 | 원인 | 조치 |
|---|---|---|
| 노드가 가진 메모리를 전부 파드 몫으로 신고 | k3s는 API 서버·etcd를 파드가 아닌 프로세스로 돌려 kubelet 집계 밖 | 예약값 설정. 워크로드를 다 올린 뒤 실측 **1783Mi**로 1Gi → 2Gi 수정, 세 노드 반영 |
| 클러스터 전체 무응답. 링크는 정상인데 ARP 실패 | Intel e1000e NIC 세그멘테이션 오프로드 결함 — `Hardware Unit Hang` 34회 | 해당 오프로드 비활성화 |
| 나흘 뒤 같은 증상 재발 | udev 규칙 조건을 NIC의 최종 이름으로 걸었는데, 장치 이벤트 시점에는 아직 `eth0` — 한 번도 실행되지 않음 | 인터페이스 기동 직후로 이동. 적용·재기동·재부팅을 각각 확인 |
{:.hl-tbl}

예약값과 재발 건은 원인이 같습니다 — **값을 추정으로 잡았고, 설정을 넣은 것과 그게 실제로 도는 것을 따로 확인하지 않았습니다.**

<figure class="hl-shot" markdown="0">
  <div class="hl-shot-wait">cluster-allocatable.png — 예약 적용 후 Capacity와 Allocatable</div>
  <figcaption>설치 이후 줄곧 같던 두 숫자가 여기서 갈라집니다.</figcaption>
</figure>

## 남은 것

- **외장 USB SSD 단일 장애점** — 물리 제약이라 없앨 수 없어, 끊길 수 있는 경로를 줄이는 데까지만 했습니다.
- **관리 접근이 노드 한 대만 봅니다** — kubeconfig가 노드 하나를 가리켜, 그 노드가 내려가면 제어면이 살아 있어도 명령이 안 나갑니다.

## 쓴 것

Proxmox VE · KVM/QEMU · LVM-thin · Ubuntu Server · k3s · etcd · Calico · MetalLB · Traefik · Helm
{:.hl-more}
