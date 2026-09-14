---
layout: page
title: 온프레미스
description: >
  dev · 개발과 공개 데모
permalink: /homelab/onprem/
redirect_from:
  - /homelab/cluster/
  - /homelab/security/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← HomeLab</a></p>

<!-- 홈 · HomeLab 이 dev 의 역할(개발 · 공개 데모)과 stg 로 넘어간 관계를 이미 말한다. 여기는 목차 줄
     "Proxmox VM 3대 k3s HA 클러스터, OPNsense 방화벽 뒤 격리" 를 한 단계 풀어 무엇으로 어떻게 만들었는지만. 스펙 · 부하는 부하 테스트 카드 몫 -->

노트북 1대(RAM 32GB)에 Proxmox VM으로 k3s 노드 3대(HA)와 OPNsense 방화벽을 구성.
네트워크 · 로드밸런서 · 스토리지는 k3s 기본값 대신 **직접 선택**.
노드는 **방화벽 뒤 격리망**에 두고, 서비스는 Cloudflare를 거쳐 공개(443) · 관리 화면은 WireGuard VPN으로만 <span style="white-space:nowrap">접근(51820)</span>.
{:.lead}

## 온프레미스 구조

<!-- 배선도 — 사용자 → Traefik → 대기열 서비스 / 관리자 → VPN → 관리 UI / GitLab → ArgoCD → 동기화.
     세 흐름 전부 노트북 안 OPNsense VM(세로 벽)을 지난다. 점 셋이 12초 한 바퀴를 순서대로.
     상자 안은 이름과 로고만 — 서비스 구성 · Cloudflare 역할 같은 세부는 설계 결정 표에.
     아이콘 = simple-icons(CC0). prefers-reduced-motion 이면 점은 숨는다 -->
<figure class="hl-diagram hl-diagram-lg hl-diagram-scroll" markdown="0">
<svg viewBox="0 0 760 384" role="img" aria-label="사용자는 Cloudflare와 공유기를 거쳐 대기열 서비스에, 관리자는 WireGuard로 관리 UI에, 데스크탑 GitLab의 변경은 ArgoCD가 동기화 — 세 흐름이 모두 노트북 안 OPNsense 방화벽 VM을 지나는 구조">
  <defs>
    <marker id="hlp-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/>
    </marker>
    <marker id="hlp-arrow-back" viewBox="0 0 8 8" refX="1" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto">
      <path d="M8,0 L0,4 L8,8 z" fill="currentColor" opacity=".5"/>
    </marker>
  </defs>

  <!-- 구역 라벨 -->
  <text x="150" y="30" class="hla-zone" text-anchor="middle">인터넷</text>
  <text x="500" y="30" class="hla-zone" text-anchor="middle">집</text>

  <!-- 인터넷 쪽: 사용자 · Cloudflare -->
  <rect x="20" y="46" width="136" height="60" rx="9" class="hla-box"/>
  <circle cx="38" cy="68" r="5.5" class="hla-glyph"/>
  <path d="M28,85 C28,74 48,74 48,85" class="hla-glyph"/>
  <text x="58" y="81" class="hla-t">사용자</text>
  <line x1="156" y1="72" x2="168" y2="72" class="hla-ln" marker-end="url(#hlp-arrow)"/>
  <rect x="170" y="46" width="132" height="60" rx="9" class="hla-box"/>
  <image href="/assets/img/icons/cloudflare.svg" x="178" y="61" width="26" height="26"/>
  <text x="209" y="80" class="hla-t">Cloudflare</text>

  <!-- 관리자 · 데스크탑 -->
  <rect x="20" y="146" width="150" height="48" rx="9" class="hla-box"/>
  <image href="/assets/img/icons/wireguard.svg" x="28" y="157" width="24" height="24"/>
  <text x="57" y="174" class="hla-t">관리자</text>
  <rect x="20" y="244" width="150" height="52" rx="9" class="hla-box"/>
  <image href="/assets/img/icons/gitlab.svg" x="28" y="257" width="24" height="24"/>
  <text x="57" y="274" class="hla-t">데스크탑</text>

  <!-- 집: 공유기 — 사용자 선과 VPN 선 중간. 데스크탑은 같은 홈 LAN 이라 포워딩을 거치지 않고 아래로 지난다 -->
  <line x1="302" y1="72" x2="366" y2="72" class="hla-ln"/>
  <line x1="366" y1="72" x2="366" y2="86" class="hla-ln" marker-end="url(#hlp-arrow)"/>
  <line x1="176" y1="170" x2="366" y2="170" class="hla-ln hla-dash"/>
  <line x1="366" y1="170" x2="366" y2="156" class="hla-ln hla-dash" marker-end="url(#hlp-arrow)"/>
  <text x="271" y="165" class="hla-s" text-anchor="middle">WireGuard 51820/UDP</text>

  <rect x="310" y="90" width="112" height="62" rx="9" class="hla-box"/>
  <rect x="355" y="101" width="22" height="11" rx="2" class="hla-glyph"/>
  <line x1="360" y1="101" x2="357" y2="92" class="hla-glyph"/>
  <line x1="372" y1="101" x2="375" y2="92" class="hla-glyph"/>
  <text x="366" y="128" text-anchor="middle" class="hla-t">공유기</text>
  <text x="366" y="145" text-anchor="middle" class="hla-s">포워딩 443 · 51820만</text>

  <line x1="422" y1="110" x2="442" y2="110" class="hla-ln" marker-end="url(#hlp-arrow)"/>
  <line x1="422" y1="132" x2="442" y2="132" class="hla-ln hla-dash" marker-end="url(#hlp-arrow)"/>

  <!-- 노트북 상자 -->
  <rect x="430" y="40" width="318" height="300" rx="12" class="hla-outer"/>
  <image href="/assets/img/icons/proxmox.svg" x="449" y="53" width="20" height="20"/>
  <text x="476" y="68" class="hla-t">노트북 · Proxmox</text>

  <!-- OPNsense 세로 벽 -->
  <rect x="444" y="90" width="44" height="226" rx="8" class="hla-wall"/>
  <image href="/assets/img/icons/opnsense.svg" x="448" y="185" width="36" height="36"/>
  <text x="466" y="331" text-anchor="middle" class="hla-s">OPNsense</text>

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
  <image href="/assets/img/icons/ticket.svg" x="616" y="142" width="22" height="22"/>
  <text x="643" y="157" class="hla-c">대기열 서비스</text>

  <rect x="514" y="206" width="216" height="46" rx="10" class="hla-box"/>
  <image href="/assets/img/icons/argo.svg" x="523" y="219" width="20" height="20"/>
  <image href="/assets/img/icons/grafana.svg" x="548" y="219" width="20" height="20"/>
  <text x="572" y="234" class="hla-c">ArgoCD · Grafana</text>
  <line x1="660" y1="204" x2="660" y2="188" class="hla-ln hla-dash" marker-end="url(#hlp-arrow)"/>
  <text x="668" y="200" class="hla-s2">동기화</text>
  <line x1="620" y1="252" x2="620" y2="296" class="hla-ln hla-dash" marker-end="url(#hlp-arrow)"/>
  <text x="620" y="312" text-anchor="middle" class="hla-s">stg(EKS)로 동기화</text>

  <!-- GitOps — 방향이 둘이라 양쪽 화살표: 당김(클러스터 → 데스크탑) · webhook(터널로) -->
  <text x="306" y="260" class="hla-s" text-anchor="middle">pull · webhook(터널)</text>
  <line x1="176" y1="268" x2="440" y2="268" class="hla-ln hla-dash"
        marker-start="url(#hlp-arrow-back)" marker-end="url(#hlp-arrow)"/>

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
  <circle cx="30" cy="364" r="4.5" fill="#e03131"/>
  <text x="41" y="368" class="hla-s">사용자 요청</text>
  <circle cx="140" cy="364" r="4.5" fill="#2f6fdb"/>
  <text x="151" y="368" class="hla-s">관리자 VPN</text>
  <circle cx="250" cy="364" r="4.5" fill="#f08c2e"/>
  <text x="261" y="368" class="hla-s">GitOps 동기화</text>
</svg>
<figcaption>사용자 · 관리자 · GitOps 세 경로 모두 노트북 안 OPNsense VM 경유.</figcaption>
</figure>

## 설계 결정

<div class="hl-sub" markdown="0">쿠버네티스 층</div>

| 항목 | 선택 | 이유 |
|---|---|---|
| 배포판 | **k3s** — 3대 모두 control-plane · etcd | 단일 바이너리로 8GB 노드에 서비스 메모리 확보 · 대가 — 컨트롤 플레인 · kubelet 동반 종료 |
| 파드 네트워크 | **Calico** | 기본 Flannel은 NetworkPolicy 미집행 — 규칙이 있어도 통신 허용 |
| 로드밸런서 · 인그레스 | **MetalLB** + **Traefik 별도 설치** | 기본 ServiceLB는 노드 IP 사용 — 노드 중단 시 주소 소멸 · 번들 Traefik은 재기동 시 설정 원복 |
| 스토리지 | **정적 PV** — 노드 디스크 직접 연결 | 기본 local-path는 폴더 공유라 디스크 지표로 사용 주체 식별 불가 · 대가 — 파드가 노드에 고정 |
{:.hl-dec}

<div class="hl-sub" markdown="0">격리 · 공개</div>

| 항목 | 선택 | 이유 |
|---|---|---|
| 격리 | **OPNsense 방화벽 VM** + 물리 NIC 없는 브리지 | 노드 · 데스크탑이 같은 망이면 한쪽 침해 시 상호 접근 — 격리망의 외부 경로를 방화벽 하나로 제한 |
| 관리 접근 | **WireGuard** 터널 | Grafana · ArgoCD 도메인 미공개 — 키를 등록한 기기만 접근 |
| 공개 경로 | **Cloudflare 프록시** + 방화벽 출발지를 엣지 대역으로 제한 | 서비스 도메인의 집 공인 IP 은닉 · 방문자 연결은 엣지에서 종료 |
| 파드 간 통신 | **NetworkPolicy 24개** — 네임스페이스별 기본 차단 | 기본값은 파드 간 전체 허용 — 앱 하나 침해 시 DB 자격까지 도달 |
{:.hl-dec}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| `Host` 헤더만 바꾼 443 요청에 **ArgoCD 로그인 화면 200 응답** | Traefik이 `Host` 헤더로만 라우팅 — 예매 · Grafana · ArgoCD가 같은 80 · 443 뒤에 위치 | 관리 UI 라우터를 **80 전용**으로 분리 — 80은 인터넷 미개방 |
| 노드가 신고한 **가용 메모리가 실제보다 큼** | 컨트롤 플레인이 파드가 아닌 프로세스라 kubelet 집계에서 빠짐 — 빠진 사용량 **1,783Mi** | 예약값 k3s 2Gi · OS 512Mi → 노드당 파드 할당 **5,081Mi** |
| 데스크탑 → 격리망 **응답 없음**, 방화벽 로그는 pass | WAN 규칙에 자동으로 붙은 `reply-to`가 같은 대역 응답을 공유기로 보냄 | 해당 규칙 `reply-to` 해제 → 손실 **0%** |
{:.hl-tbl}

## 결과

- **노드 1대 중단에도 클러스터 유지** — etcd 3대 중 과반 유지
- **외부 접근 차단 확인** — 포트 20개 스캔 응답 없음, 공인 IP로 443 직접 접속 시 타임아웃
- **파드 간 필요 경로만 허용** — booking 출구는 MySQL · Redis · Kafka · 수집기 4곳
- **설치 · 부트스트랩 · 앱 모두 코드** — k3s `config.yaml` · 부트스트랩 9단계 · Helm 차트(차트는 stg와 공통)

## 한계

- **관리 경로가 OPNsense 1대에 집중** — VM 중단 시 터널 · 격리망 인터넷 동시 중단
- **Proxmox · VM 생성은 수동** — 코드는 k3s부터, stg는 Terraform
- **VPN 접속용 도메인은 집 공인 IP 노출** — WireGuard는 UDP라 HTTP만 중계하는 Cloudflare 프록시를 쓸 수 없음

## 기술 스택

Proxmox VE · k3s · Calico · MetalLB · Traefik · Helm · OPNsense · WireGuard · Cloudflare · cert-manager · Let's Encrypt
{:.hl-more}

{% include hl-nav.html %}
