---
layout: page
title: 클러스터
description: >
  네트워크·로드밸런서·인그레스·스토리지를 k3s 기본 대신 Calico·MetalLB·Traefik·정적 PV로 세웠습니다
permalink: /homelab/cluster/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

노트북 한 대에 RAM 32GB. 내장 Windows를 지우지 않은 채 세 노드가 그것을 나눠 씁니다.

## 클러스터 구조

<!-- 층 그림 — 아래에서 위로: 물리 디스크 → Proxmox → VM 3대(각자의 데이터 디스크) → k3s.
     네트워크 경로는 홈랩 배선도가 담당하므로 여기서는 격리망(vmbr1) 한 줄로만 언급한다.
     무엇을 끄고 무엇으로 바꿨는지는 아래 대조표가 담당하므로 그림에서 반복하지 않는다. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<svg viewBox="0 0 760 390" role="img" aria-label="노트북 한 대 안에서 외장 USB SSD로 부팅한 Proxmox 위에 VM 세 대가 서고, 각 VM이 자기 데이터 디스크를 가진 채 k3s 클러스터를 이루는 층 구조">
  <defs>
    <marker id="hlv-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".45"/>
    </marker>
  </defs>

  <rect class="hla-outer" x="14" y="14" width="732" height="362" rx="8"/>
  <text class="hla-zone" x="30" y="34">노트북 1대 · Core Ultra 5 125H(18스레드) · RAM 32GB</text>

  <!-- k3s -->
  <rect class="hla-box" x="30" y="44" width="700" height="48" rx="5"/>
  <text class="hla-t" x="46" y="66">k3s — 세 대 모두 control-plane 겸 워커 · etcd 3멤버</text>
  <text class="hla-s" x="46" y="83">Calico(파드 네트워크) · MetalLB(로드밸런서) · Traefik(인그레스) · 정적 PV(스토리지)</text>

  <!-- 세 노드 공통 스펙은 여기 한 번만. 박스마다 반복하면 면적의 절반을 같은 말이 차지한다 -->
  <text class="hla-c" x="34" y="112">노드 셋 공통 — 4 vCPU · RAM 8GB 고정 · 부트 40G</text>

  <!-- VM 3대 — 이름·라벨·데이터 디스크만 -->
  <g>
    <rect class="hla-box" x="34" y="122" width="224" height="118" rx="5"/>
    <text class="hla-t" x="48" y="146">k3s-1 · 10.0.0.11</text>
    <text class="hla-a" x="238" y="146" text-anchor="end">db</text>
    <text class="hla-s2" x="48" y="174">mysqldata 20G</text>
    <text class="hla-s2" x="48" y="193">kafkadata 30G</text>
    <text class="hla-s2" x="48" y="212">ingesterwal 5G</text>
  </g>
  <g>
    <rect class="hla-box" x="270" y="122" width="224" height="118" rx="5"/>
    <text class="hla-t" x="284" y="146">k3s-2 · 10.0.0.12</text>
    <text class="hla-a" x="474" y="146" text-anchor="end">obs</text>
    <text class="hla-s2" x="284" y="174">kafkadata 30G</text>
    <text class="hla-s2" x="284" y="193">ingesterwal 5G</text>
    <text class="hla-s2" x="284" y="212">lokiwal 5G</text>
    <text class="hla-s2" x="284" y="231">tempowal 5G</text>
  </g>
  <g>
    <rect class="hla-box" x="506" y="122" width="224" height="118" rx="5"/>
    <text class="hla-t" x="520" y="146">k3s-3 · 10.0.0.13</text>
    <text class="hla-a" x="710" y="146" text-anchor="end">obj</text>
    <text class="hla-s2" x="520" y="174">kafkadata 30G</text>
    <text class="hla-s2" x="520" y="193">ingesterwal 5G</text>
    <text class="hla-s2" x="520" y="212">miniodata 100G</text>
  </g>

  <line class="hla-ln" x1="146" y1="252" x2="146" y2="244" marker-end="url(#hlv-arrow)"/>
  <line class="hla-ln" x1="382" y1="252" x2="382" y2="244" marker-end="url(#hlv-arrow)"/>
  <line class="hla-ln" x1="618" y1="252" x2="618" y2="244" marker-end="url(#hlv-arrow)"/>

  <!-- Proxmox -->
  <rect class="hla-box" x="30" y="254" width="700" height="48" rx="5"/>
  <text class="hla-t" x="46" y="276">Proxmox VE — Type 1 하이퍼바이저 · KVM + QEMU</text>
  <text class="hla-s" x="46" y="293">LVM-thin 풀에서 데이터 디스크 10장(235G)을 잘라 VM 에 붙임 · 노드 셋은 방화벽 VM 뒤 격리망(vmbr1)에</text>

  <line class="hla-ln" x1="202" y1="316" x2="202" y2="306" marker-end="url(#hlv-arrow)"/>
  <text class="hla-a" x="214" y="314">부팅</text>

  <!-- 물리 디스크 — 부팅 디스크를 무엇으로 고르느냐가 이 노트북의 역할을 가른다 -->
  <rect class="hla-box" x="30" y="318" width="344" height="46" rx="5"/>
  <text class="hla-c" x="46" y="338">외장 USB SSD 1TB</text>
  <text class="hla-s2" x="46" y="355">이 디스크로 부팅하면 서버 — 빠지면 그대로 내려간다</text>

  <rect class="hla-inner hla-dash" x="386" y="318" width="344" height="46" rx="5"/>
  <text class="hla-c" x="402" y="338">내장 NVMe</text>
  <text class="hla-s2" x="402" y="355">Windows — 지우지 않았다</text>
</svg>
<figcaption>부팅 디스크를 무엇으로 고르느냐가 이 노트북이 서버인지 아닌지를 가릅니다.</figcaption>
</figure>

## 정한 것

<div class="hl-sub" markdown="0">노트북을 서버로 만드는 층</div>

| | 기본값 | 이 홈랩 | 그렇게 한 이유 |
|---|---|---|---|
| 하이퍼바이저 | Windows 위에 얹는 Type&nbsp;2 | **Proxmox** — Type&nbsp;1 | 호스트 OS가 가져가는 몫 없이 메모리·CPU 전부를 VM에 배분 |
| VM 메모리 | ballooning — Proxmox가 부족하면 VM RAM을 도로 회수 | **노드마다 8GB 통째로 고정** | 쿠버네티스가 RAM을 고정으로 보고 파드를 배치 |
| 절전 | 덮개를 닫으면 잠자기 · USB 자동절전 | **둘 다 차단** | 잠들면 서버도 그대로 정지. 루트 디스크가 외장 USB라 절전되면 그대로 단절 |
{:.hl-cmp}

<div class="hl-sub" markdown="0">그 위의 쿠버네티스 층</div>

| | 기본값 | 이 홈랩 | 그렇게 한 이유 |
|---|---|---|---|
| 배포판 | 표준 k8s — 컴포넌트를 따로 세움 | **k3s** — 단일 바이너리 | 컨트롤플레인이 가벼워야 8GB 노드에 서비스 몫이 남음. 넷이 한 프로세스라 같이 죽는 것이 대가 — HA를 3대로 |
| 파드 네트워크 | Flannel — 전달만 | **Calico** | 쿠버네티스 기본은 파드끼리 전부 통신 가능 — 막는 NetworkPolicy가 Flannel에서는 무효 |
| 로드밸런서 | ServiceLB — 노드 IP를 빌림 | **MetalLB** `10.0.0.240-250` | 노드 IP로 부르면 그 노드가 죽을 때 주소도 함께 소멸 — 주소와 노드의 분리가 전제 |
| 인그레스 | k3s가 같이 깔아 주는 Traefik | **직접 올린 Traefik** | 공개 443과 관리 80을 나누려면 설정을 고쳐야 하는데, k3s가 관리하는 쪽은 재기동마다 원래대로 되돌아감 |
| 스토리지 | local-path — 한 파일시스템에 폴더로 | **정적 PV 10장** — 노드에 붙인 디스크 그대로 | 사용량 지표가 **파일시스템 단위**(`statfs`)라 안 자르면 무엇이 채웠는지 못 가림. 대가는 파드가 그 노드에 묶임 |
{:.hl-cmp}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| 데스크탑에서 `kubectl`·SSH·Proxmox 웹UI가 전부 무응답 | Intel e1000e NIC의 세그멘테이션 오프로드 결함. 링크는 살아 있는데 ARP만 실패하고 `Hardware Unit Hang` **34회** | 그 기능을 끄고 CPU 처리로 전환 |
| 나흘 뒤 재발 | 규칙 조건을 NIC 최종 이름으로 걸었는데 그 이름은 부팅 중에 붙음 — **조건이 맞는 순간이 없어 한 번도 실행되지 않음** | 적용 시점을 이름이 확정된 뒤로 옮기고, 적용·재기동·재부팅을 각각 확인 |
| 노드가 신고한 파드 몫이 실제 여유보다 큼 | k3s는 컨트롤플레인을 파드가 아니라 리눅스 프로세스로 돌리는데 kubelet은 파드만 집계 — 그 몫 **1783Mi**가 통째로 누락 | 신고에서 미리 뺌 — k3s **2Gi** · OS **512Mi** |
{:.hl-tbl}

## 결과

서비스를 올리기 전, 여기까지가 준비된 상태입니다.

- 노트북 한 대에 Proxmox가 서고, **VM 세 대가 각각 4 vCPU · RAM 8GB 고정**으로 뜹니다
- 세 대가 k3s 클러스터로 묶여 **셋 다 control-plane 겸 etcd 멤버**입니다 — 한 대가 멈춰도 유지됩니다
- 노드가 파드에 내줄 수 있는 몫이 **노드당 5081Mi**로 정해졌습니다 — 전체 노드 메모리 7941에서 k3s 프로세스 2048 · OS 512 · eviction 여유 300을 뺀 값
- 노트북 덮개를 닫아도 잠들지 않고, 입출력이 뜸해도 USB 디스크 전원이 **내려가지 않습니다**

## 남은 것

**외장 USB SSD가 단일 장애점입니다.** 케이블이 빠지면 서버가 그대로 내려갑니다.
내장 디스크의 Windows를 지키는 선택의 대가라 없앨 수는 없고 — 자동절전 차단과
종료 절차 고정으로 끊길 경로를 줄이는 데까지만 했습니다.

## 쓴 것

Proxmox VE · KVM/QEMU · LVM-thin · Ubuntu Server · k3s · etcd · Calico · MetalLB · Traefik · Helm
{:.hl-more}

노드 OS는 Ubuntu Server LTS입니다. 클러스터가 서기 전에 있어야 하는 것은 스크립트로 올리고,
그 뒤의 것은 Helm 차트로 정의해 GitOps로 올립니다.
{:.hl-more}

{% include hl-nav.html %}
