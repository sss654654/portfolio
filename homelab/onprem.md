---
layout: page
title: 온프렘
description: >
  노트북 한 대를 Proxmox로 부팅해 VM 세 대로 k3s HA 클러스터를 세우고, 노드를 방화벽 뒤 격리망에 둔 뒤 엣지를 거쳐서만 공개했습니다
permalink: /homelab/onprem/
redirect_from:
  - /homelab/cluster/
  - /homelab/security/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

dev 환경입니다 — 부하를 실측해 stg 스펙을 뽑는 자리입니다. 노트북 한 대에 RAM 32GB, 내장 Windows는 지우지 않았습니다.
관리형 쿠버네티스가 만들어 주던 컨트롤 플레인 · 네트워크 · 로드밸런서 · 볼륨이 여기엔 없어 **층마다 직접 골랐고**,
VM 세 대가 데스크탑과 같은 사설망에 있던 것을 **방화벽 뒤로 옮긴 뒤에 포트를 열었습니다.**
그 층들이 stg에서 무엇이 됐는지는 아래 표의 마지막 칸에 있습니다.
{:.lead}

## 온프렘 구조

<div class="hl-sub" markdown="0">집 — 세 경로가 지나는 길</div>

<!-- 배선도 — 실제 토폴로지를 세 이야기로 압축:
     사용자 → Traefik → 대기열 서비스 / 관리자 → VPN → 관리 UI / GitLab → CI → ArgoCD → 배포.
     세 흐름 전부 노트북 안 OPNsense VM(세로 벽)을 지난다. 점 셋이 12초 한 바퀴를 순서대로.
     아이콘 = simple-icons(CC0). prefers-reduced-motion 이면 정지 -->
<figure class="hl-diagram" markdown="0">
<svg viewBox="0 0 760 384" role="img" aria-label="사용자는 ticket.subinhong.dev로 Cloudflare와 공유기를 거쳐 대기열 서비스에, 관리자는 WireGuard로 관리 UI에, 배포는 GitLab에서 ArgoCD로 — 세 흐름이 모두 노트북 안 OPNsense 방화벽 VM을 지나는 구조">
  <defs>
    <marker id="hlp-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/>
    </marker>
    <marker id="hlp-arrow-back" viewBox="0 0 8 8" refX="1" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto">
      <path d="M8,0 L0,4 L8,8 z" fill="currentColor" opacity=".5"/>
    </marker>
    <pattern id="hlp-bricks" width="18" height="12" patternUnits="userSpaceOnUse">
      <path d="M0,0.5 H18 M0,6.5 H18 M4.5,0.5 V6.5 M13.5,6.5 V12" stroke="#d94f00" stroke-opacity=".22" stroke-width="1" fill="none"/>
    </pattern>
  </defs>

  <!-- 구역 라벨 -->
  <g class="hla-g hla-g1">
    <text x="150" y="30" class="hla-zone" text-anchor="middle">인터넷</text>
    <text x="500" y="30" class="hla-zone" text-anchor="middle">집</text>
  </g>

  <!-- 인터넷 쪽: 사용자 · Cloudflare -->
  <g class="hla-g hla-g1">
    <rect x="20" y="46" width="136" height="60" rx="9" class="hla-box"/>
    <circle cx="38" cy="68" r="5.5" class="hla-glyph"/>
    <path d="M28,85 C28,74 48,74 48,85" class="hla-glyph"/>
    <text x="58" y="70" class="hla-t">사용자</text>
    <text x="58" y="88" class="hla-a">ticket.subinhong.dev</text>
    <line x1="156" y1="72" x2="168" y2="72" class="hla-ln" marker-end="url(#hlp-arrow)"/>
    <rect x="170" y="46" width="132" height="60" rx="9" class="hla-box"/>
    <image href="/assets/img/icons/cloudflare.svg" x="178" y="61" width="26" height="26"/>
    <text x="209" y="70" class="hla-t">Cloudflare</text>
    <text x="209" y="88" class="hla-s">DNS · TLS · IP 은닉</text>
  </g>

  <!-- 관리자 · 데스크탑 -->
  <g class="hla-g hla-g1">
    <rect x="20" y="146" width="150" height="48" rx="9" class="hla-box"/>
    <image href="/assets/img/icons/wireguard.svg" x="28" y="157" width="24" height="24"/>
    <text x="57" y="166" class="hla-t">관리자</text>
    <text x="57" y="181" class="hla-s">VPN으로 접속</text>
    <rect x="20" y="244" width="150" height="52" rx="9" class="hla-box"/>
    <image href="/assets/img/icons/gitlab.svg" x="28" y="257" width="24" height="24"/>
    <text x="57" y="264" class="hla-t">데스크탑</text>
    <text x="57" y="280" class="hla-s">GitLab · CI · 레지스트리</text>
  </g>

  <!-- 집: 공유기 — 사용자 선과 VPN 선 중간. 데스크탑은 같은 홈 LAN 이라 포워딩을 거치지 않고 아래로 지난다 -->
  <g class="hla-g hla-g2">
    <line x1="302" y1="72" x2="366" y2="72" class="hla-ln"/>
    <line x1="366" y1="72" x2="366" y2="86" class="hla-ln" marker-end="url(#hlp-arrow)"/>
    <line x1="176" y1="170" x2="366" y2="170" class="hla-ln hla-dash"/>
    <line x1="366" y1="170" x2="366" y2="156" class="hla-ln hla-dash" marker-end="url(#hlp-arrow)"/>
    <text x="271" y="162" class="hla-s" text-anchor="middle">WireGuard 51820/UDP</text>

    <rect x="310" y="90" width="112" height="62" rx="9" class="hla-box"/>
    <rect x="355" y="101" width="22" height="11" rx="2" class="hla-glyph"/>
    <line x1="360" y1="101" x2="357" y2="92" class="hla-glyph"/>
    <line x1="372" y1="101" x2="375" y2="92" class="hla-glyph"/>
    <text x="366" y="128" text-anchor="middle" class="hla-t">공유기</text>
    <text x="366" y="145" text-anchor="middle" class="hla-s">포워딩 443 · 51820만</text>

    <line x1="422" y1="110" x2="442" y2="110" class="hla-ln" marker-end="url(#hlp-arrow)"/>
    <line x1="422" y1="132" x2="442" y2="132" class="hla-ln hla-dash" marker-end="url(#hlp-arrow)"/>
  </g>

  <!-- 노트북 상자 -->
  <g class="hla-g hla-g3">
    <rect x="430" y="40" width="318" height="300" rx="12" class="hla-outer"/>
    <image href="/assets/img/icons/proxmox.svg" x="449" y="53" width="20" height="20"/>
    <text x="476" y="68" class="hla-t">노트북 1대 — Proxmox · 전부 VM</text>

    <!-- OPNsense 세로 벽 -->
    <rect x="444" y="90" width="44" height="226" rx="8" class="hla-wall"/>
    <rect x="444" y="90" width="44" height="226" rx="8" fill="url(#hlp-bricks)" stroke="none"/>
    <image href="/assets/img/icons/opnsense.svg" x="448" y="152" width="36" height="36"/>
    <text x="466" y="216" text-anchor="middle" class="hla-wallc">방</text>
    <text x="466" y="236" text-anchor="middle" class="hla-wallc">화</text>
    <text x="466" y="256" text-anchor="middle" class="hla-wallc">벽</text>
    <text x="466" y="331" text-anchor="middle" class="hla-s">OPNsense VM</text>

    <!-- k3s 클러스터 -->
    <rect x="504" y="90" width="234" height="176" rx="10" class="hla-inner"/>
    <image href="/assets/img/icons/kubernetes.svg" x="513" y="100" width="20" height="20"/>
    <text x="539" y="115" class="hla-t">k3s 클러스터 — VM 3대 · HA</text>

    <line x1="490" y1="140" x2="510" y2="140" class="hla-ln" marker-end="url(#hlp-arrow)"/>
    <text x="500" y="134" class="hla-s2" text-anchor="middle">443</text>
    <line x1="490" y1="162" x2="510" y2="162" class="hla-ln" marker-end="url(#hlp-arrow)"/>
    <text x="500" y="175" class="hla-s2" text-anchor="middle">80</text>
    <rect x="512" y="126" width="84" height="46" rx="12" class="hla-box"/>
    <image href="/assets/img/icons/traefikproxy.svg" x="518" y="140" width="18" height="18"/>
    <text x="540" y="154" class="hla-c">Traefik</text>
    <line x1="596" y1="140" x2="606" y2="140" class="hla-ln" marker-end="url(#hlp-arrow)"/>
    <line x1="554" y1="172" x2="554" y2="202" class="hla-ln" marker-end="url(#hlp-arrow)"/>
    <rect x="608" y="122" width="126" height="62" rx="10" class="hla-box"/>
    <image href="/assets/img/icons/ticket.svg" x="616" y="132" width="22" height="22"/>
    <text x="643" y="147" class="hla-c">대기열 서비스</text>
    <text x="671" y="164" class="hla-s2" text-anchor="middle">frontend · queue · booking</text>
    <text x="671" y="177" class="hla-s2" text-anchor="middle">Redis · MySQL · Kafka</text>

    <rect x="514" y="206" width="216" height="46" rx="10" class="hla-box"/>
    <image href="/assets/img/icons/argo.svg" x="523" y="219" width="20" height="20"/>
    <image href="/assets/img/icons/grafana.svg" x="548" y="219" width="20" height="20"/>
    <text x="572" y="226" class="hla-c">ArgoCD 허브 · Grafana</text>
    <text x="572" y="241" class="hla-s">VPN으로만 · stg 도 배달</text>
    <line x1="660" y1="204" x2="660" y2="188" class="hla-ln hla-dash" marker-end="url(#hlp-arrow)"/>
    <text x="668" y="200" class="hla-s2">배포</text>
    <line x1="620" y1="252" x2="620" y2="296" class="hla-ln hla-dash" marker-end="url(#hlp-arrow)"/>
    <text x="620" y="312" text-anchor="middle" class="hla-s">허브 → stg(EKS) 도 배달</text>

    <path class="hla-pod" d="M598.5,135 L595.25,140.63 L588.75,140.63 L585.5,135 L588.75,129.37 L595.25,129.37 Z"/>
    <path class="hla-pod" d="M736.5,124 L733.25,129.63 L726.75,129.63 L723.5,124 L726.75,118.37 L733.25,118.37 Z"/>
    <path class="hla-pod" d="M732.5,207 L729.25,212.63 L722.75,212.63 L719.5,207 L722.75,201.37 L729.25,201.37 Z"/>
  </g>

  <!-- GitOps — 방향이 둘이라 양쪽 화살표: 당김(클러스터→데스크탑) · webhook(터널로) -->
  <g class="hla-g hla-g2">
    <text x="306" y="256" class="hla-s" text-anchor="middle">코드 push → CI → 이미지</text>
    <line x1="176" y1="268" x2="440" y2="268" class="hla-ln hla-dash"
          marker-start="url(#hlp-arrow-back)" marker-end="url(#hlp-arrow)"/>
    <text x="306" y="284" class="hla-s" text-anchor="middle">ArgoCD·노드가 당겨간다 · webhook은 터널로</text>
  </g>

  <!-- 흐르는 점 셋 — 12초 한 바퀴를 순서대로 -->
  <circle class="hla-dot hla-dot-u" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.05;0.33;1" keyPoints="0;0;1;1"
      path="M70,72 L221,72 L366,72 L366,110 L466,110 L466,140 L560,140 L634,140"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.05;0.07;0.31;0.33;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-v" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.40;0.60;1" keyPoints="0;0;1;1"
      path="M83,170 L366,170 L366,132 L466,132 L466,162 L554,162 L554,228"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.40;0.42;0.58;0.60;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-g" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.68;0.94;1" keyPoints="0;0;1;1"
      path="M87,268 L496,268 L496,229 L660,229 L660,186"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.68;0.70;0.92;0.94;1" values="0;0;1;1;0;0"/>
  </circle>

  <!-- 범례 -->
  <g class="hla-g hla-g3">
    <circle cx="30" cy="364" r="4.5" fill="#e03131"/>
    <text x="41" y="368" class="hla-s">사용자 요청</text>
    <circle cx="140" cy="364" r="4.5" fill="#2f6fdb"/>
    <text x="151" y="368" class="hla-s">관리자 VPN</text>
    <circle cx="250" cy="364" r="4.5" fill="#f08c2e"/>
    <text x="261" y="368" class="hla-s">GitOps 배포</text>
  </g>
</svg>
<figcaption>사용자 · 관리자 · 배포, 세 경로가 모두 노트북 안 방화벽 VM을 지납니다.
Cloudflare 대역 밖에서 온 443은 버리고, 키 없는 VPN 시도에는 응답하지 않습니다. 이 안의 ArgoCD가 stg(EKS)까지 배달하는 허브입니다.</figcaption>
</figure>

<div class="hl-sub" markdown="0">노트북 — 아래에서 위로 쌓인 층</div>

<!-- 층 그림 — 물리 디스크 → Proxmox → VM 3대(각자의 데이터 디스크) → k3s.
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

  <!-- 오른쪽 칸 — 같은 층이 stg 에서 무엇이 됐나 -->
  <rect class="hla-inner hla-dash" x="600" y="44" width="146" height="320" rx="5"/>
  <text class="hla-zone" x="612" y="34">stg 에서는</text>

  <rect class="hla-box" x="30" y="44" width="560" height="48" rx="5"/>
  <text class="hla-t" x="46" y="66">k3s — 세 대 모두 control-plane 겸 워커 · etcd 3멤버</text>
  <text class="hla-s" x="46" y="83">Calico · MetalLB · Traefik · 정적 PV — 기본값 대신 고른 넷</text>
  <text class="hla-c" x="612" y="60">EKS 1.36 — 관리형</text>
  <text class="hla-s2" x="612" y="74">컨트롤 플레인을 AWS 가</text>
  <text class="hla-s2" x="612" y="87">CNI · ALB · EBS 는 애드온</text>

  <text class="hla-c" x="34" y="112">노드 셋 공통 — 4 vCPU · RAM 8GB 고정 · 부트 40G</text>

  <g>
    <rect class="hla-box" x="34" y="122" width="176" height="118" rx="5"/>
    <text class="hla-t" x="46" y="146">k3s-1 · 10.0.0.11</text>
    <text class="hla-a" x="202" y="146" text-anchor="end">db</text>
    <text class="hla-s2" x="46" y="174">mysqldata 20G</text>
    <text class="hla-s2" x="46" y="193">kafkadata 30G</text>
    <text class="hla-s2" x="46" y="212">ingesterwal 5G</text>
  </g>
  <g>
    <rect class="hla-box" x="226" y="122" width="176" height="118" rx="5"/>
    <text class="hla-t" x="238" y="146">k3s-2 · 10.0.0.12</text>
    <text class="hla-a" x="394" y="146" text-anchor="end">obs</text>
    <text class="hla-s2" x="238" y="174">kafkadata 30G</text>
    <text class="hla-s2" x="238" y="193">ingesterwal 5G</text>
    <text class="hla-s2" x="238" y="212">lokiwal 5G</text>
    <text class="hla-s2" x="238" y="231">tempowal 5G</text>
  </g>
  <g>
    <rect class="hla-box" x="418" y="122" width="172" height="118" rx="5"/>
    <text class="hla-t" x="430" y="146">k3s-3 · 10.0.0.13</text>
    <text class="hla-a" x="582" y="146" text-anchor="end">obj</text>
    <text class="hla-s2" x="430" y="174">kafkadata 30G</text>
    <text class="hla-s2" x="430" y="193">ingesterwal 5G</text>
    <text class="hla-s2" x="430" y="212">miniodata 100G</text>
  </g>
  <text class="hla-c" x="612" y="146">EC2 m5.xlarge ×7</text>
  <text class="hla-s2" x="612" y="160">관리형 노드그룹이 만듦</text>
  <text class="hla-s2" x="612" y="174">app 4 · booking 2</text>
  <text class="hla-s2" x="612" y="188">관측 1 — 역할별로</text>
  <text class="hla-s2" x="612" y="202">MySQL · Redis 는 밖으로</text>

  <line class="hla-ln" x1="122" y1="252" x2="122" y2="244" marker-end="url(#hlv-arrow)"/>
  <line class="hla-ln" x1="314" y1="252" x2="314" y2="244" marker-end="url(#hlv-arrow)"/>
  <line class="hla-ln" x1="504" y1="252" x2="504" y2="244" marker-end="url(#hlv-arrow)"/>

  <rect class="hla-box" x="30" y="254" width="560" height="48" rx="5"/>
  <text class="hla-t" x="46" y="276">Proxmox VE — Type 1 하이퍼바이저 · KVM + QEMU</text>
  <text class="hla-s" x="46" y="293">LVM-thin 풀에서 데이터 디스크 10장(235G)을 잘라 VM에 붙임</text>
  <text class="hla-c" x="612" y="272">층 없음</text>
  <text class="hla-s2" x="612" y="286">하이퍼바이저는 AWS 몫</text>

  <line class="hla-ln" x1="202" y1="316" x2="202" y2="306" marker-end="url(#hlv-arrow)"/>
  <text class="hla-a" x="214" y="314">부팅</text>

  <rect class="hla-box" x="30" y="318" width="272" height="46" rx="5"/>
  <text class="hla-c" x="46" y="338">외장 USB SSD 1TB</text>
  <text class="hla-s2" x="46" y="355">부팅 디스크 — 빠지면 서버 정지</text>

  <rect class="hla-inner hla-dash" x="318" y="318" width="272" height="46" rx="5"/>
  <text class="hla-c" x="334" y="338">내장 NVMe</text>
  <text class="hla-s2" x="334" y="355">Windows — 유지</text>
  <text class="hla-c" x="612" y="336">EBS gp3 — 동적</text>
  <text class="hla-s2" x="612" y="350">볼륨이 AZ 에 묶임</text>
</svg>
<figcaption>부팅 디스크를 무엇으로 고르느냐가 이 노트북이 서버인지를 가릅니다. 격리망(vmbr1)에는 물리 NIC이 없어, 밖으로 가는 길은 두 브리지에 다 꽂힌 OPNsense VM 하나뿐입니다.
오른쪽 칸이 같은 층의 stg 모습입니다 — 아래 두 층은 AWS가 맡고, 위 한 층은 애드온으로 바뀝니다.</figcaption>
</figure>

## 설계 결정

<div class="hl-sub" markdown="0">노트북을 서버로 만드는 층</div>

| 항목 | 선택 | 이유 | stg 에서는 |
|---|---|---|---|
| 하이퍼바이저 | **Proxmox** — Type&nbsp;1 | 기본값인 Windows 위 Type&nbsp;2는 호스트 OS 몫이 먼저 나감 — VM에 메모리·CPU를 통째로 주려면 Type&nbsp;1 | 층이 없음 — EC2를 관리형 노드그룹이 만듦 |
| VM 메모리 | **노드마다 8GB 고정** — ballooning 끔 | 부족하면 VM RAM을 회수하는 ballooning이면 쿠버네티스가 보는 노드 용량이 흔들림 | 인스턴스 타입으로 고정 — 대신 계정 vCPU 한도가 제약 |
| 절전 | 덮개 잠자기 · USB 자동절전 **둘 다 차단** | 잠들면 서버도 정지. 루트 디스크가 외장 USB라 절전되면 단절 | — |
{:.hl-map}

<div class="hl-sub" markdown="0">그 위의 쿠버네티스 층 — k3s 기본값 대신 고른 것</div>

| 항목 | 선택 | 이유 | stg 에서는 |
|---|---|---|---|
| 배포판 | **k3s** — 단일 바이너리 · 셋 다 control-plane | 표준 쿠버네티스는 컴포넌트를 따로 세움 — 컨트롤 플레인이 가벼워야 8GB 노드에 서비스 몫이 남음. 대가는 한 프로세스라 동반 종료 | **EKS** — 컨트롤 플레인은 AWS 관리 · 노드 메모리가 차도 etcd가 안 밀림 |
| 파드 네트워크 | **Calico** | 기본 Flannel은 NetworkPolicy 미집행 — 규칙을 적어도 통신은 그대로 개방 | **VPC CNI** + `enableNetworkPolicy` — 같은 정책 그대로 |
| 로드밸런서 · 인그레스 | **MetalLB** `10.0.0.240` → **직접 올린 Traefik** | 기본 ServiceLB는 노드 IP를 빌려 그 노드가 멈추면 주소도 소멸 · k3s 번들 Traefik은 고친 설정이 재기동마다 원복 | **ALB** — MetalLB의 L2 광고가 VPC에서 안 됨 · Traefik 없음 |
| 스토리지 | **정적 PV 10장** — 노드에 붙인 디스크 그대로 | 기본 local-path는 한 파일시스템에 폴더로 — 디스크 metric이 파일시스템 단위라 무엇이 채웠는지 식별 불가. 대가는 파드가 노드에 고정 | **EBS CSI gp3 동적** — 대신 볼륨이 AZ에 묶임 |
| DB · 캐시 · 메시지 | **MySQL · Redis Sentinel · Kafka 전부 파드** | 노트북 한 대 환경에 "클러스터 밖"이라는 자리가 없음 | RDS · ElastiCache로 나가고 **Kafka만 남음** — [클라우드](/homelab/cloud/) |
{:.hl-map}

<div class="hl-sub" markdown="0">격리와 공개</div>

| 항목 | 선택 | 이유 | stg 에서는 |
|---|---|---|---|
| 격리 | **OPNsense 방화벽 VM** + 물리 NIC 없는 브리지(vmbr1) | 한 공유기 아래 노드와 데스크탑이 나란히 인터넷을 향함 — 한쪽이 침해되면 같은 망으로 상호 침투. 격리망에서 밖으로 가는 길은 이 VM 하나 | **VPC · 보안 그룹** — 집은 기본이 닫힘, 클라우드는 기본이 열 수 있어 적극적으로 좁힘 |
| 관리 접근 | **WireGuard** 터널 하나 | 관리 페이지는 공개 대상이 아님 — Grafana·ArgoCD를 도메인으로 열지 않고 키를 등록한 관리자만 | EKS API · Grafana를 **집 공인 IP /32**로 제한 |
| 공개 경로 | **Cloudflare 프록시** + 방화벽 출발지를 엣지 대역으로 · DDNS | 집 공인 IP 은닉 + 방문자 연결을 엣지가 종료 · 공인 IP가 바뀌어도 DDNS가 레코드를 갱신 | Cloudflare **DNS only** — 프록시를 켜면 부하가 엣지로 가서 재는 값이 이 시스템 것이 아니게 됨 |
| 파드 사이 | **NetworkPolicy 24개** — 네임스페이스마다 기본 차단 뒤 통로만 | 쿠버네티스 기본값은 파드끼리 전부 접속 가능 — 앱 하나가 뚫리면 DB 자격까지 도달 | 같은 정책 — 켜는 날 막혀야 할 것이 막히는지 시험 |
| 인증서 | **Let's Encrypt · DNS-01** | CA가 도메인 소유를 DNS 레코드로 확인 — 포트를 열기 전에 인증서를 받음 | **ACM** — ALB가 TLS를 끝냄 · cert-manager 없음 |
{:.hl-map}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| 데스크탑에서 `kubectl`·SSH·Proxmox 웹UI가 무응답 | Intel e1000e NIC 오프로드 결함 — 링크는 살았는데 ARP만 실패 · `Hardware Unit Hang` **34회** | 오프로드를 끄고 CPU 처리로 |
| 노드가 신고한 파드 몫이 실제 여유보다 큼 | 컨트롤 플레인이 파드가 아닌 프로세스라 kubelet 집계에서 빠짐 — **1783Mi** | 신고에서 미리 뺌 — k3s **2Gi**(여유 포함) · OS **512Mi** |
| 데스크탑에서 격리망을 부르면 답이 안 옴 — 방화벽 로그에는 pass | 가는 길은 열렸는데 오는 길이 돌아감 — WAN 규칙에 `reply-to`가 자동으로 붙어 같은 대역에 바로 건넬 응답이 공유기로 나가 버려짐 | 그 규칙에서 `reply-to` 해제 → 손실 **0%**. 뒤에 데스크탑 경로를 터널로 옮기며 이 규칙은 삭제 |
| 443에 `Host` 헤더를 바꿔 넣으면 ArgoCD 로그인 화면 — 응답 **200** | Traefik이 `Host` 헤더로만 가름 — 예매 화면·Grafana·ArgoCD가 80·443 뒤에 함께 있고, 어디로 갈지를 요청자가 보내는 값이 정함 | 관리 UI 라우터를 80에만 — 443에 남는 것은 예매 화면 하나 |
{:.hl-tbl}

## 결과

- 노트북 한 대에 Proxmox를 올리고 **VM 세 대를 각각 4 vCPU · RAM 8GB 고정**으로 구성했습니다. 덮개를 닫아도 잠들지 않고 USB 디스크 전원이 내려가지 않습니다
- **셋 다 control-plane 겸 etcd 멤버**로 묶여 한 대가 멈춰도 유지됩니다. 파드에 내줄 몫은 **노드당 5081Mi** — 7941Mi에서 k3s 2048 · OS 512 · eviction 300을 뺀 값
- **인터넷에 열린 포트는 둘입니다** — 서비스용 `443/TCP`와 관리 터널용 `51820/UDP`. 공인 IP로 직접 443에 접속하면 타임아웃이고, 밖에서 포트 20개를 스캔해 응답한 것은 없습니다
- **관리 화면은 터널 안에서만 열립니다** — Grafana·ArgoCD는 443에 라우터가 없고, 등록된 키로 서명이 풀린 기기만 격리망에 닿습니다
- **파드 사이는 적어 둔 통로만 남았습니다** — 네임스페이스가 기본 차단이고, booking이 나갈 수 있는 곳은 MySQL·Redis·Kafka·수집기 넷뿐입니다
- **k3s 설치는 `config.yaml`, 그 위 부트스트랩(Calico부터 ArgoCD까지 9단계)은 스크립트, 그 위는 Helm 차트로 정의돼 있습니다** — 이 정의를 그대로 써서 stg를 세웠습니다

## 한계

- **외장 USB SSD가 단일 장애점입니다** — 케이블이 빠지면 서버가 정지합니다. Windows를 유지하는 한 없앨 수 없어, 자동절전 차단과 종료 절차 고정으로 대응했습니다
- **Proxmox와 VM 생성은 코드가 아닙니다** — 하이퍼바이저 설치와 VM 3대는 손으로 만들었고, 코드는 그 위 k3s부터입니다. stg에서는 이 층이 Terraform이 됐습니다
- **관리 경로가 OPNsense 한 대에 몰려 있습니다** — 이 VM이 내려가면 터널 접근과 격리망의 인터넷이 함께 멈춥니다
- **관리용 이름 하나가 집 공인 IP를 노출합니다** — 엣지 프록시는 HTTP·HTTPS만 중계해 UDP 터널에는 쓸 수 없습니다

## 기술 스택

Proxmox VE · KVM/QEMU · LVM-thin · Ubuntu Server · k3s · etcd · Calico · MetalLB · Traefik · Helm · OPNsense · WireGuard · Cloudflare · cert-manager · Let's Encrypt
{:.hl-more}

{% include hl-nav.html %}
