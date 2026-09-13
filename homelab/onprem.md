---
layout: page
title: 온프레미스
description: >
  노트북 1대에 Proxmox · VM 3대로 k3s HA 클러스터를 구성하고, 방화벽 뒤 격리망에서 엣지를 거쳐 공개했습니다
permalink: /homelab/onprem/
redirect_from:
  - /homelab/cluster/
  - /homelab/security/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

dev 환경 — 부하 테스트로 stg 스펙을 산정하는 환경입니다. 노트북 1대(RAM 32GB, 내장 Windows 유지)에 구성했습니다.
컨트롤 플레인 · 네트워크 · 로드밸런서 · 볼륨을 **층마다 직접 선택**하고, 노드를 **방화벽 뒤로 격리한 뒤 포트를 열었습니다.**
{:.lead}

## 온프레미스 구조

<!-- 배선도 — 사용자 → Traefik → 대기열 서비스 / 관리자 → VPN → 관리 UI / GitLab → CI → ArgoCD → 배포.
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
    <text x="57" y="181" class="hla-s">WireGuard VPN</text>
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
    <text x="572" y="241" class="hla-s">VPN 전용 · stg 배포</text>
    <line x1="660" y1="204" x2="660" y2="188" class="hla-ln hla-dash" marker-end="url(#hlp-arrow)"/>
    <text x="668" y="200" class="hla-s2">배포</text>
    <line x1="620" y1="252" x2="620" y2="296" class="hla-ln hla-dash" marker-end="url(#hlp-arrow)"/>
    <text x="620" y="312" text-anchor="middle" class="hla-s">허브 → stg(EKS) 배포</text>

    <path class="hla-pod" d="M598.5,135 L595.25,140.63 L588.75,140.63 L585.5,135 L588.75,129.37 L595.25,129.37 Z"/>
    <path class="hla-pod" d="M736.5,124 L733.25,129.63 L726.75,129.63 L723.5,124 L726.75,118.37 L733.25,118.37 Z"/>
    <path class="hla-pod" d="M732.5,207 L729.25,212.63 L722.75,212.63 L719.5,207 L722.75,201.37 L729.25,201.37 Z"/>
  </g>

  <!-- GitOps — 방향이 둘이라 양쪽 화살표: 당김(클러스터→데스크탑) · webhook(터널로) -->
  <g class="hla-g hla-g2">
    <text x="306" y="256" class="hla-s" text-anchor="middle">코드 push → CI → 이미지</text>
    <line x1="176" y1="268" x2="440" y2="268" class="hla-ln hla-dash"
          marker-start="url(#hlp-arrow-back)" marker-end="url(#hlp-arrow)"/>
    <text x="306" y="284" class="hla-s" text-anchor="middle">ArgoCD · 노드가 pull · webhook은 터널</text>
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
<figcaption>사용자 · 관리자 · 배포 경로 모두 노트북 안 방화벽 VM(OPNsense) 경유.
Cloudflare 대역 밖 443은 차단, 키 없는 VPN 요청은 무응답. 이 안의 ArgoCD가 stg(EKS)까지 배포하는 허브입니다.</figcaption>
</figure>

## 설계 결정

<div class="hl-sub" markdown="0">노트북 → 서버</div>

| 항목 | 선택 | 이유 | stg 에서는 |
|---|---|---|---|
| 하이퍼바이저 | **Proxmox** — Type&nbsp;1 | Windows 위 Type&nbsp;2는 호스트 OS가 자원을 먼저 점유 — VM에 메모리 · CPU를 온전히 할당하려면 Type&nbsp;1 | 해당 층 없음 — 관리형 노드그룹이 EC2 생성 |
| VM 메모리 | **노드당 8GB 고정** — ballooning 끔 | ballooning은 VM RAM을 회수 → 쿠버네티스가 보는 노드 용량 변동 | 인스턴스 타입으로 고정 — 계정 vCPU 한도가 제약 |
| 절전 | 덮개 잠자기 · USB 자동절전 **차단** | 절전 시 서버 중단 · 루트 디스크가 외장 USB라 절전 시 연결 끊김 | — |
{:.hl-map}

<div class="hl-sub" markdown="0">쿠버네티스 층 — k3s 기본값 대신 선택</div>

| 항목 | 선택 | 이유 | stg 에서는 |
|---|---|---|---|
| 배포판 | **k3s** — 단일 바이너리 · 3대 모두 control-plane | 표준 쿠버네티스는 컴포넌트별 프로세스 — 8GB 노드에 서비스 몫을 남기려고 경량 선택. 대가: 한 프로세스라 동반 종료 | **EKS** — 컨트롤 플레인 AWS 관리 · 노드 메모리가 차도 etcd 지연 없음 |
| 파드 네트워크 | **Calico** | 기본 Flannel은 NetworkPolicy 미집행 — 규칙이 있어도 통신 개방 | **VPC CNI** + `enableNetworkPolicy` — 같은 정책 적용 |
| 로드밸런서 · 인그레스 | **MetalLB** `10.0.0.240` → **Traefik 별도 설치** | 기본 ServiceLB는 노드 IP 사용 — 노드 중단 시 주소 소멸 · 번들 Traefik은 재기동 시 설정 원복 | **ALB** — MetalLB L2 광고가 VPC에서 동작하지 않음 · Traefik 없음 |
| 스토리지 | **정적 PV 10개** — 노드 디스크 직접 연결 | 기본 local-path는 한 파일시스템에 폴더 단위 — 디스크 metric으로 사용 주체 식별 불가. 대가: 파드가 노드에 고정 | **EBS CSI gp3 동적** — 볼륨이 AZ에 고정 |
| DB · 캐시 · 메시지 | **MySQL · Redis Sentinel · Kafka 모두 파드** | 노트북 1대 환경에 클러스터 밖 자리 없음 | RDS · ElastiCache로 이전, **Kafka만 유지** — [클라우드](/homelab/cloud/) |
{:.hl-map}

<div class="hl-sub" markdown="0">격리 · 공개</div>

| 항목 | 선택 | 이유 | stg 에서는 |
|---|---|---|---|
| 격리 | **OPNsense 방화벽 VM** + 물리 NIC 없는 브리지(vmbr1) | 공유기 하나에 노드 · 데스크탑이 같은 망 — 한쪽 침해 시 상호 접근 가능. 격리망의 외부 경로는 이 VM 하나 | **VPC · 보안 그룹** — 집은 기본 차단, 클라우드는 규칙으로 범위 축소 |
| 관리 접근 | **WireGuard** 터널 1개 | 관리 페이지 비공개 — Grafana · ArgoCD는 도메인 미공개, 키를 등록한 관리자만 접근 | EKS API · Grafana를 **집 공인 IP /32**로 제한 |
| 공개 경로 | **Cloudflare 프록시** + 방화벽 출발지를 엣지 대역으로 제한 · DDNS | 집 공인 IP 은닉 · 방문자 연결은 엣지에서 종료 · 공인 IP 변경 시 DDNS가 레코드 갱신 | Cloudflare **DNS only** — 프록시를 켜면 엣지가 부하를 받아 이 시스템 측정 불가 |
| 파드 간 통신 | **NetworkPolicy 24개** — 네임스페이스별 기본 차단 후 필요 경로만 허용 | 쿠버네티스 기본값은 파드 간 전체 허용 — 앱 하나 침해 시 DB 자격까지 도달 | 같은 정책 — 차단 대상 경로를 켜는 날 시험 |
| 인증서 | **Let's Encrypt · DNS-01** | DNS 레코드로 도메인 소유 확인 — 포트 개방 전 발급 | **ACM** — ALB에서 TLS 종료 · cert-manager 없음 |
{:.hl-map}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| 데스크탑에서 `kubectl` · SSH · Proxmox 웹 UI 무응답 | Intel e1000e NIC 오프로드 결함 — 링크 정상, ARP만 실패 · `Hardware Unit Hang` **34회** | 오프로드 비활성화 |
| 노드가 신고한 가용 메모리가 실제보다 큼 | 컨트롤 플레인이 파드가 아닌 프로세스라 kubelet 집계에서 누락 — **1783Mi** | 예약값 지정 — k3s **2Gi**(여유 포함) · OS **512Mi** |
| 데스크탑 → 격리망 응답 없음 — 방화벽 로그는 pass | 응답 경로 이탈 — WAN 규칙에 자동 추가된 `reply-to`가 같은 대역 응답을 공유기로 전송 | 해당 규칙 `reply-to` 해제 → 손실 **0%**. 이후 데스크탑 경로를 터널로 옮기며 규칙 삭제 |
| 443에 `Host` 헤더를 바꿔 요청하면 ArgoCD 로그인 화면 **200** | Traefik이 `Host` 헤더로만 라우팅 — 예매 · Grafana · ArgoCD가 같은 80 · 443 뒤에 위치 | 관리 UI 라우터를 80 전용으로 — 443은 예매 화면만 |
{:.hl-tbl}

## 결과

- **VM 3대 · 각 4 vCPU · RAM 8GB 고정** — 덮개를 닫거나 USB 절전 조건에서도 무중단
- **3대 모두 control-plane · etcd 멤버** — 1대 중단 시 유지. 노드당 파드 할당 **5081Mi**(7941Mi − k3s 2048 · OS 512 · eviction 300)
- **인터넷 개방 포트 2개** — `443/TCP` 서비스 · `51820/UDP` 관리 터널. 공인 IP로 443 직접 접속 시 타임아웃, 외부 포트 20개 스캔 응답 없음
- **관리 화면은 터널 안에서만 접근** — Grafana · ArgoCD는 443 라우터 없음
- **파드 간 필요 경로만 허용** — booking 출구는 MySQL · Redis · Kafka · 수집기 4곳
- **설치 · 부트스트랩 · 앱 모두 코드로 정의** — k3s `config.yaml` · 부트스트랩 스크립트 9단계(Calico → ArgoCD) · Helm 차트. 같은 정의로 stg 구축

## 한계

- **외장 USB SSD 단일 장애점** — 케이블 분리 시 서버 중단. Windows 유지 조건이라 자동절전 차단 · 종료 절차로 대응
- **Proxmox · VM 생성은 수동** — 코드는 k3s부터. stg에서는 Terraform으로 대체
- **관리 경로가 OPNsense 1대에 집중** — VM 중단 시 터널 · 격리망 인터넷 동시 중단
- **관리용 도메인 1개가 집 공인 IP 노출** — 엣지 프록시는 HTTP · HTTPS만 중계, UDP 터널 불가

## 기술 스택

Proxmox VE · KVM/QEMU · LVM-thin · Ubuntu Server · k3s · etcd · Calico · MetalLB · Traefik · Helm · OPNsense · WireGuard · Cloudflare · cert-manager · Let's Encrypt
{:.hl-more}

{% include hl-nav.html %}
