---
layout: page
title: 클러스터
description: >
  노트북 한 대를 Proxmox로 나눠 VM 세 대에 k3s를 HA로 세우고, 기본 컴포넌트를 직접 고른 것으로 바꿨습니다
permalink: /homelab/cluster/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

홈랩의 바닥층입니다. 여기서 정한 하이퍼바이저·디스크·클러스터 구성이
뒤의 배포·관측·부하 실측이 올라서는 전제가 됩니다.

<dl class="hl-stats hl-stats-row" markdown="0">
  <div><dt>3대</dt><dd>VM — 전부 control-plane 겸 워커</dd></div>
  <div><dt>10장</dt><dd>워크로드마다 따로 자른 정적 PV</dd></div>
  <div><dt>69개</dt><dd>토대까지 올라온 뒤의 파드</dd></div>
</dl>

## 주어진 조건

<ul class="hl-cond" markdown="0">
  <li>물리 서버는 <b>노트북 한 대</b>. RAM 32GB, 유선 NIC 하나. → etcd 과반에 필요한 노드 세 대를 VM으로 만든다.</li>
  <li>내장 NVMe의 Windows는 <b>지우지 않는다</b>. → Proxmox를 외장 USB SSD로 부팅하고, 그 디스크가 빠지면 서버가 내려간다.</li>
  <li>데스크탑과 노트북이 <b>서로 다른 망</b>에 있고, 가족이 쓰는 망은 건드릴 수 없다. → 공인 IP를 새로 쓰지 않는 방법으로 같은 망에 넣어야 한다.</li>
</ul>

## 서 있는 구조

<!-- 층 그림 — 아래에서 위로: 물리 디스크 → Proxmox → VM 3대(각자의 데이터 디스크) → k3s.
     네트워크 경로는 홈랩 배선도가 담당하므로 여기서는 vmbr0 한 줄로만 언급한다.
     무엇을 끄고 무엇으로 바꿨는지는 아래 대조표가 담당하므로 그림에서 반복하지 않는다. -->
<figure class="hl-diagram" markdown="0">
<svg viewBox="0 0 760 406" role="img" aria-label="노트북 한 대 안에서 외장 USB SSD로 부팅한 Proxmox 위에 VM 세 대가 서고, 각 VM이 자기 데이터 디스크를 가진 채 k3s 클러스터를 이루는 층 구조">
  <defs>
    <marker id="hlv-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".45"/>
    </marker>
  </defs>

  <rect class="hla-outer" x="14" y="14" width="732" height="378" rx="8"/>
  <text class="hla-zone" x="30" y="34">노트북 1대 · Core Ultra 5 125H · RAM 32GB</text>

  <!-- k3s -->
  <rect class="hla-box" x="30" y="44" width="700" height="46" rx="5"/>
  <text class="hla-t" x="46" y="65">k3s v1.36.2 — 세 대 모두 control-plane 겸 워커 · etcd 3멤버</text>
  <text class="hla-s" x="46" y="81">Calico · MetalLB · Traefik · 정적 PV — 기본 컴포넌트 자리를 직접 고른 것으로 채움</text>

  <!-- VM 3대 -->
  <g>
    <rect class="hla-box" x="34" y="102" width="224" height="160" rx="5"/>
    <text class="hla-t" x="48" y="124">k3s-1 · .201</text>
    <text class="hla-a" x="238" y="124" text-anchor="end">db</text>
    <text class="hla-s" x="48" y="142">4 vCPU · RAM 8GB 고정</text>
    <text class="hla-s" x="48" y="157">부트 40G</text>
    <line class="hla-inner" x1="48" y1="168" x2="244" y2="168"/>
    <text class="hla-a" x="48" y="185">데이터 디스크</text>
    <text class="hla-s2" x="48" y="202">mysqldata 20G</text>
    <text class="hla-s2" x="48" y="217">kafkadata 30G</text>
    <text class="hla-s2" x="48" y="232">ingesterwal 5G</text>
  </g>
  <g>
    <rect class="hla-box" x="270" y="102" width="224" height="160" rx="5"/>
    <text class="hla-t" x="284" y="124">k3s-2 · .202</text>
    <text class="hla-a" x="474" y="124" text-anchor="end">obs</text>
    <text class="hla-s" x="284" y="142">4 vCPU · RAM 8GB 고정</text>
    <text class="hla-s" x="284" y="157">부트 40G</text>
    <line class="hla-inner" x1="284" y1="168" x2="480" y2="168"/>
    <text class="hla-a" x="284" y="185">데이터 디스크</text>
    <text class="hla-s2" x="284" y="202">kafkadata 30G</text>
    <text class="hla-s2" x="284" y="217">ingesterwal 5G</text>
    <text class="hla-s2" x="284" y="232">lokiwal 5G</text>
    <text class="hla-s2" x="284" y="247">tempowal 5G</text>
  </g>
  <g>
    <rect class="hla-box" x="506" y="102" width="224" height="160" rx="5"/>
    <text class="hla-t" x="520" y="124">k3s-3 · .203</text>
    <text class="hla-a" x="710" y="124" text-anchor="end">obj</text>
    <text class="hla-s" x="520" y="142">4 vCPU · RAM 8GB 고정</text>
    <text class="hla-s" x="520" y="157">부트 40G</text>
    <line class="hla-inner" x1="520" y1="168" x2="716" y2="168"/>
    <text class="hla-a" x="520" y="185">데이터 디스크</text>
    <text class="hla-s2" x="520" y="202">kafkadata 30G</text>
    <text class="hla-s2" x="520" y="217">ingesterwal 5G</text>
    <text class="hla-s2" x="520" y="232">miniodata 100G</text>
  </g>

  <line class="hla-ln" x1="146" y1="272" x2="146" y2="264" marker-end="url(#hlv-arrow)"/>
  <line class="hla-ln" x1="382" y1="272" x2="382" y2="264" marker-end="url(#hlv-arrow)"/>
  <line class="hla-ln" x1="618" y1="272" x2="618" y2="264" marker-end="url(#hlv-arrow)"/>

  <!-- Proxmox -->
  <rect class="hla-box" x="30" y="274" width="700" height="46" rx="5"/>
  <text class="hla-t" x="46" y="295">Proxmox VE — Type 1 하이퍼바이저 · KVM + QEMU</text>
  <text class="hla-s" x="46" y="311">LVM-thin 풀에서 데이터 디스크 10장(235G)을 잘라 VM 에 붙임 · vmbr0 가 유선 NIC 하나로 세 노드를 공유기에 등록</text>

  <line class="hla-ln" x1="202" y1="332" x2="202" y2="322" marker-end="url(#hlv-arrow)"/>

  <!-- 물리 디스크 -->
  <rect class="hla-box" x="30" y="334" width="344" height="44" rx="5"/>
  <text class="hla-c" x="46" y="353">외장 USB SSD 1TB</text>
  <text class="hla-s2" x="46" y="368">Proxmox 가 여기서 부팅</text>

  <rect class="hla-inner hla-dash" x="386" y="334" width="344" height="44" rx="5"/>
  <text class="hla-c" x="402" y="353">내장 NVMe</text>
  <text class="hla-s2" x="402" y="368">Windows — 지우지 않았다</text>
</svg>
<figcaption>부팅 디스크를 무엇으로 고르느냐가 이 노트북이 서버인지 아닌지를 가릅니다.</figcaption>
</figure>

## 기본값을 끄고 직접 고른 것

**노트북을 서버로 만드는 층**

| | 기본값 | 이 홈랩 | 그렇게 한 이유 |
|---|---|---|---|
| 하이퍼바이저 | 호스트 OS 위 Type 2 | **Proxmox** (Type 1) | Windows 업데이트와 재부팅에 VM 세 대가 함께 내려감 |
| 게스트 메모리 | ballooning — 호스트가 회수 | **8GB 고정** | kubelet은 노드 RAM 총량이 고정이라는 전제로 배치와 퇴출을 판단함 |
| 디스크 캐시 | No cache | **그대로 유지** | Write back은 호스트 RAM에 올라간 순간 완료를 보고해, etcd·MySQL의 커밋 보장을 뒤집음 |
| 절전 | 뚜껑 닫으면 잠자기 · 유휴 USB 절전 | **둘 다 차단** | 루트 디스크가 외장 USB라 재워지면 파일시스템이 끊김 |

**k3s가 안고 오는 층**

| | 기본값 | 이 홈랩 | 그렇게 한 이유 |
|---|---|---|---|
| 데이터스토어 | SQLite — 단일 노드 | **내장 etcd 3멤버** | 한 대가 멈춰도 과반이 남음 |
| 파드 네트워크 | Flannel | **Calico** | Flannel은 트래픽을 나르기만 하고 NetworkPolicy를 집행하지 않음 |
| 로드밸런서 | ServiceLB — 노드 IP를 빌림 | **MetalLB** — `.240-.250` | 서비스에 줄 주소를 직접 정해야 공유기 DHCP와 겹치지 않음 |
| 인그레스 | 번들 Traefik | **직접 올린 Traefik** | 값을 바꾸려면 k3s가 관리하는 자리를 건드려야 하고, 그 변경이 업그레이드에 덮임 |
| 스토리지 | local-path — 한 파일시스템에 폴더로 | **정적 PV 10장** | 파일시스템이 하나면 사용량 지표가 갈리지 않음 — 아래 |
| 노드 예약 | 없음 — 가진 메모리를 전부 파드에게 준다고 신고 | **2Gi** | 메모리가 마르면 커널이 etcd를 안은 프로세스를 죽임 — 아래 |

<figure class="hl-shot" markdown="0">
  <div class="hl-shot-wait">cluster-nodes.png — kubectl get nodes -L cgv.io/data</div>
  <figcaption>세 노드가 control-plane 겸 etcd 멤버로 서고, 디스크 배치에 맞춘 라벨이 붙습니다.</figcaption>
</figure>

## 파고든 것

위 표에서 두 칸을 펼칩니다. 마지막 하나는 고른 것이 아니라 겪은 것입니다.

#### **디스크를 자르는 단위를 관측이 정했다**

이 선택을 결정한 것은 성능이 아니라 관측입니다.
리눅스에서 디스크 사용량을 알려주는 `statfs`가 **파일시스템 단위로만** 답하기 때문입니다.

| 자르는 방식 | 파일시스템 | 지표로 보이는 것 |
|---|---|---|
| 디스크 하나에 폴더로 나눠 담기 | 1개 | "80% 찼다"까지. 누가 채웠는지는 안 보임 |
| **워크로드마다 디스크 하나** | 워크로드 수만큼 | "MySQL이 15G를 썼다"가 보임 |

스토리지를 자르는 방식이 그대로 **관측 분해능**이 되고, 나중에 쿼리나 대시보드로 뒤집을 수 없습니다.
그래서 디스크 하나 = 파일시스템 하나 = PV 하나로 갔습니다.

<figure class="hl-shot" markdown="0">
  <div class="hl-shot-wait">cluster-disks.png — 재부팅 후 df -h · swapon --show</div>
  <figcaption>노드마다 마운트가 재부팅을 넘고, swap이 꺼진 채로 올라옵니다.</figcaption>
</figure>

#### **예약값을 추정으로 잡았다가, 실측으로 고쳤다**

k3s는 API 서버와 etcd를 파드가 아니라 프로세스 한 덩어리로 돌리는데 **kubelet은 파드만 세므로**,
노드가 가진 메모리를 전부 파드에게 줄 수 있다고 신고하고 있었습니다.
이대로 메모리가 마르면 커널이 개입하고, 커널은 대상을 가리지 않습니다 —
그 시점 가장 큰 프로세스 중 하나가 **etcd를 안은 k3s 덩어리**입니다.

그래서 k3s 몫을 신고에서 미리 뺐는데, **그 값을 추정으로 잡은 것이 틀렸습니다.**

| | 파드 0개일 때 | 파드 69개 뒤 | 예약해 둔 값 |
|---|---|---|---|
| k3s가 회수 못 하게 쥔 메모리 | 450Mi | **1783Mi** (최대 노드) | 1024Mi |

파드 0개 시점의 실측에 추정을 얹어 잡은 예약을, 워크로드가 다 오른 뒤의 실측이 넘었습니다.
초과분은 파드 몫에서 나가고 있었고, 가장 큰 노드 기준에 여유를 더해 **2Gi**로 고쳤습니다.

<figure class="hl-shot" markdown="0">
  <div class="hl-shot-wait">cluster-allocatable.png — 예약 적용 후 Capacity와 Allocatable</div>
  <figcaption>설치 이후 줄곧 같던 두 숫자가 여기서 갈라집니다.</figcaption>
</figure>

#### **설정을 넣은 것과 그 설정이 도는 것은 다른 사실이다**

```
증상   데스크탑에서 kubectl·SSH·Proxmox 웹 UI 가 전부 안 닿음
진단   범위를 반씩 좁힘 — 호스트까지 안 닿는데 호스트 콘솔은 로그인됨
       호스트에서 VM 은 닿고, 데스크탑에서 공유기는 닿는데, 호스트에서 공유기만 안 닿음
원인   링크는 살아 있는데(carrier yes) ARP 가 실패 — 선이 아니라 그 위에서 멈춤
       dmesg 에 Intel e1000e NIC 의 Hardware Unit Hang 34회 = 세그멘테이션 오프로드 결함
조치   해당 오프로드를 꺼서 그 회로를 쓰지 않게 함
```

나흘 뒤 재발했습니다. 원인은 재부팅 대비로 넣어 둔 udev 규칙 —
조건을 NIC의 최종 이름으로 걸었는데, 장치 이벤트가 접수되는 순간의 이름은 아직 `eth0`이고
최종 이름은 그 이벤트 처리의 결과물이라, **조건이 성립하는 순간이 존재하지 않아 한 번도 실행되지 않았습니다.**
같은 명령을 인터페이스가 올라온 직후로 옮기고, 실행되지 않는 것이 확인된 규칙은 지웠습니다.

이번에는 **"지금 적용됐다" · "올릴 때마다 적용된다" · "재부팅을 넘는다"를 각각 따로 확인**하고 닫았습니다.

## 남은 것

- **외장 USB SSD 단일 장애점** — 물리 제약이라 없앨 수 없어, 끊길 수 있는 경로를 줄이는 데까지만 했습니다.
- **관리 접근이 노드 한 대만 봅니다.** 제어면은 세 대인데 접속 설정이 한 노드를 가리켜, 그 노드가 내려가면 클러스터가 살아 있어도 명령이 안 나갑니다.
- **파드 사이를 막는 정책이 아직 없습니다.** 정책을 집행할 수 있는 것으로 CNI를 골라 두고도 이 시점에는 0건입니다.
- **예약값 2Gi가 저장소에만 반영돼 있습니다.** 노드에 걸린 값은 아직 1Gi이고, 반영하려면 노드를 비우고 재시작해야 합니다.

## 쓴 것

Proxmox VE · KVM/QEMU · LVM-thin · Ubuntu Server · k3s · etcd · Calico · MetalLB · Traefik · Helm
{:.note}
