---
layout: page
title: 격리와 공개
description: >
  노드를 방화벽 뒤 격리망으로 옮기고, 관리 통로는 키로 심사하는 터널 하나만 남긴 뒤 엣지를 통해서만 공개했습니다
permalink: /homelab/security/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

클러스터를 이루는 VM 세 대가 데스크탑과 같은 사설망에 있었습니다. 지금까지의 방어는
인터넷에서 들어오는 길이 없다는 것 하나였고, **포트를 여는 순간 그것이 없어집니다.**

## 격리와 공개 구조

<!-- 층을 실제 배선 그대로 쌓는다 — 인터넷 → 공유기 → 사설 평면(데스크탑 · vmbr0) → OPNsense → 격리망(vmbr1 · k3s).
     격리망(vmbr1 부터)에만 바탕을 깔아 안팎이 글자 전에 갈리게 한다. OPNsense 는 그 바탕 바로 위 —
     두 망에 걸친 유일한 기계. 칸마다 글은 두 줄 — 통과 조건 한 줄, 버리는 것(✕) 한 줄. 떠 있는 라벨은 두지 않는다. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<svg viewBox="0 0 760 628" role="img" aria-label="인터넷에서 온 443은 Cloudflare를 거쳐, 51820은 직접 공유기에 닿고, 공유기는 그 둘만 노트북 안 OPNsense VM으로 넘긴다. OPNsense는 물리 NIC이 있는 vmbr0과 없는 vmbr1 두 브리지에 다 꽂힌 유일한 기계로, WAN으로 받은 443은 출발지가 Cloudflare 대역일 때만 목적지를 10.0.0.240으로 바꿔 LAN으로 넘기고, 51820은 WireGuard가 등록된 키로 풀었을 때만 넘긴다. 노드가 나가는 길은 배포와 감시와 인터넷만 허용하고 옛 평면의 나머지는 차단한다. 그 아래 바탕이 깔린 격리망에 k3s 3대가 있고, Traefik은 443에 예매 화면만 두며 파드 사이는 NetworkPolicy 16줄로 좁혀져 있다">
  <defs>
    <marker id="hlx-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".45"/>
    </marker>
  </defs>

  <!-- 두 평면의 바탕 — 상자들보다 먼저 그려 뒤에 깔린다.
       위 띠 = 사설 평면 192.168.0.x (공유기 아래부터 vmbr0 까지, 노트북 상자를 가로지른다)
       아래 띠 = 격리망 10.0.0.x (vmbr1 부터 k3s 까지, 노트북 안에만 있다)
       두 띠 사이 빈 자리에 OPNsense 가 선다 -->
  <rect x="10" y="166" width="740" height="28" rx="6" fill="currentColor" opacity=".05"/>

  <!-- 층 1 · 인터넷 -->
  <text class="hla-zone" x="20" y="16">인터넷</text>

  <rect class="hla-box" x="20" y="24" width="350" height="46" rx="5"/>
  <image href="/assets/img/icons/cloudflare.svg" x="32" y="33" width="20" height="20"/>
  <text class="hla-t" x="58" y="41">Cloudflare — ticket.subinhong.dev</text>
  <text class="hla-s2" x="32" y="61">집 IP 은닉 · TLS 종료 · 방문자 연결은 여기서 끝난다</text>

  <rect class="hla-box" x="390" y="24" width="350" height="46" rx="5"/>
  <image href="/assets/img/icons/wireguard.svg" x="402" y="33" width="20" height="20"/>
  <text class="hla-t" x="428" y="41">DNS only — 관리용 이름</text>
  <text class="hla-s2" x="402" y="61">집 공인 IP 그대로 · DDNS 가 추적</text>

  <line class="hla-ln" x1="195" y1="70" x2="195" y2="104" marker-end="url(#hlx-arrow)"/>
  <text class="hla-a" x="203" y="91">443/TCP</text>
  <line class="hla-ln" x1="565" y1="70" x2="565" y2="104" marker-end="url(#hlx-arrow)"/>
  <text class="hla-a" x="573" y="91">51820/UDP</text>

  <!-- 층 2 · 공유기 — 집의 경계 -->
  <rect class="hla-box" x="20" y="106" width="720" height="46" rx="5"/>
  <image href="/assets/img/icons/tplink.svg" x="32" y="115" width="18" height="18"/>
  <text class="hla-t" x="56" y="123">공유기 — 집의 경계. 밖에 연 것은 포워딩 둘이 전부</text>
  <text class="hla-s2" x="56" y="143">443/TCP · 51820/UDP → 192.168.0.210 (OPNsense)</text>

  <line class="hla-ln" x1="95" y1="152" x2="95" y2="200"/>
  <line class="hla-ln" x1="465" y1="152" x2="465" y2="226" marker-end="url(#hlx-arrow)"/>

  <!-- 층 3 · 사설 평면 — 데스크탑은 공유기에 직접, 노트북은 vmbr0 로 -->
  <text class="hla-zone" x="280" y="182" text-anchor="middle">사설 평면 192.168.0.x</text>

  <rect class="hla-box" x="20" y="200" width="152" height="58" rx="5"/>
  <text class="hla-t" x="32" y="220">데스크탑 .167</text>
  <text class="hla-s2" x="32" y="237">GitLab · 레지스트리</text>
  <text class="hla-s2" x="32" y="251">kubeconfig</text>

  <rect class="hla-outer" x="190" y="200" width="550" height="412" rx="8"/>
  <image href="/assets/img/icons/proxmox.svg" x="200" y="208" width="16" height="16"/>
  <text class="hla-c" x="222" y="220">노트북 1대 · <tspan font-weight="700">Proxmox .200</tspan> — 아래는 전부 VM</text>

  <rect class="hla-inner" x="204" y="228" width="522" height="40" rx="4"/>
  <text class="hla-t" x="216" y="245">vmbr0</text>
  <text class="hla-s2" x="216" y="261">물리 NIC 이 꽂혀 있다 — 공유기까지 이어진다 · <tspan font-weight="700">OPNsense WAN .210</tspan></text>

  <line class="hla-ln" x1="465" y1="268" x2="465" y2="282" marker-end="url(#hlx-arrow)"/>

  <!-- 층 4 · OPNsense — 격리망 바탕 바로 위 -->
  <rect class="hla-wall" x="204" y="284" width="522" height="80" rx="6"/>
  <image href="/assets/img/icons/opnsense.svg" x="216" y="294" width="18" height="18"/>
  <text class="hla-t" x="240" y="308">OPNsense VM — 브리지 둘에 다 꽂힌 유일한 기계</text>
  <text class="hla-c" x="216" y="332">443/TCP</text>
  <text class="hla-s2" x="290" y="332">출발지가 Cloudflare 대역이면 목적지를 10.0.0.240 으로 바꿔 넘김 · 아니면 버림</text>
  <text class="hla-c" x="216" y="352">51820/UDP</text>
  <text class="hla-s2" x="290" y="352">WireGuard 가 키로 풂 → 안쪽 패킷이 10.0.0.x 행이면 넘김 · 안 풀리면 무응답</text>

  <line class="hla-ln" x1="465" y1="364" x2="465" y2="400" marker-end="url(#hlx-arrow)"/>

  <!-- 층 5 · 격리망 = vmbr1. 브리지 자체가 격리망이라 바탕을 깔고 클러스터를 그 안에 넣는다 -->
  <rect x="204" y="402" width="522" height="200" rx="6" fill="currentColor" opacity=".05"/>
  <rect class="hla-inner" x="204" y="402" width="522" height="200" rx="6"/>
  <text class="hla-t" x="216" y="421">vmbr1 — 격리망 10.0.0.x</text>
  <text class="hla-s2" x="216" y="437">물리 NIC 이 없다 — 밖으로 가는 길은 위의 VM 뿐 · <tspan font-weight="700">OPNsense LAN 10.0.0.1</tspan></text>

  <!-- k3s 클러스터 — 노드 셋을 감싼다. 카드1의 층 그림과 같은 꼴 -->
  <rect class="hla-box" x="216" y="448" width="498" height="144" rx="5"/>
  <image href="/assets/img/icons/kubernetes.svg" x="228" y="458" width="18" height="18"/>
  <text class="hla-t" x="252" y="472">k3s 클러스터 — 셋 다 control-plane 겸 워커</text>
  <text class="hla-s2" x="228" y="492"><tspan font-weight="700">MetalLB 10.0.0.240</tspan> → Traefik — 443 은 예매 화면 하나 · 80 은 터널 안에서만</text>

  <rect class="hla-inner" x="228" y="504" width="150" height="44" rx="4"/>
  <text class="hla-t" x="240" y="523">k3s-1</text>
  <text class="hla-s2" x="240" y="540">10.0.0.11</text>
  <rect class="hla-inner" x="390" y="504" width="150" height="44" rx="4"/>
  <text class="hla-t" x="402" y="523">k3s-2</text>
  <text class="hla-s2" x="402" y="540">10.0.0.12</text>
  <rect class="hla-inner" x="552" y="504" width="150" height="44" rx="4"/>
  <text class="hla-t" x="564" y="523">k3s-3</text>
  <text class="hla-s2" x="564" y="540">10.0.0.13</text>

  <text class="hla-s2" x="228" y="576">파드 사이 — NetworkPolicy 로 적어 둔 통로만 허용 · 나머지 차단</text>
</svg>
<figcaption>vmbr1 에는 물리 NIC 이 없습니다. 격리망에서 밖으로 가는 길은
두 브리지에 다 꽂힌 VM 하나뿐입니다.</figcaption>
</figure>

## 정한 것

<div class="hl-sub" markdown="0">클러스터 밖 — 경계와 공개 경로</div>

| 무엇을 | 고른 것 | 그렇게 한 이유 |
|---|---|---|
| 격리 방식 | **OPNsense 방화벽 VM** + 가상 브리지로 사설망 구축 | **한 공유기 아래 노드와 데스크탑이 나란히 인터넷을 향함**<br>한쪽이 침해되면 같은 망을 타고 서로에게 건너감 |
| 관리 접근 | **WireGuard** (OpenVPN 아님) | **관리 페이지는 공개 대상이 아님**<br>Grafana·ArgoCD 를 도메인으로 열지 않고, 키를 등록한 관리자만 터널로 |
| 엣지 | **Cloudflare 프록시** + 방화벽 출발지를 엣지 대역으로 | **집 공인 IP 은닉 + 연결을 앞에서 종료**<br>엣지가 없으면 방문자 연결이 전부 단일 로드밸런서로 몰림 |
| DNS 설정 | **Cloudflare 에서 도메인 구매 · OPNsense DDNS 연동** | **엣지를 거친 것만 들어오게**<br>공인 IP 가 바뀌면 DDNS 가 레코드를 갱신, 방화벽은 Cloudflare 대역만 통과 |
{:.hl-dec}

<div class="hl-sub" markdown="0">클러스터 안 — 통신과 인증서</div>

| 무엇을 | 고른 것 | 그렇게 한 이유 |
|---|---|---|
| 파드 사이 | **NetworkPolicy 16줄** — 인그레스 6 · 이그레스 9 · 관측 | **쿠버네티스 기본값은 파드끼리 전부 접속 가능**<br>하나가 뚫리면 그 파드가 닿는 곳이 전부 따라오고, 앱을 거치면 DB 자격까지 넘어감 |
| 인증서 | **Let's Encrypt · DNS-01 방식** | **문을 열기 전에 인증서를 받을 수 있음**<br>CA 가 도메인 소유를 확인하는데, DNS 레코드로 증명하면 포트를 안 열어도 됨 |
{:.hl-dec}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| **데스크탑에서 격리망을 부르면 답이 안 옴**<br>방화벽 로그에는 초록 pass 가 찍힘 | **가는 길은 열렸는데 오는 길이 돌아감**<br>WAN 쪽 규칙에 `reply-to` 가 자동으로 붙어 응답을 공유기로 보냄 — 데스크탑은 같은 대역이라 옆으로 건네면 될 것이 밖으로 나갔다 버려짐 | **그 규칙에서 `reply-to` 해제**<br>응답이 같은 대역으로 바로 오면서 손실 **0%** |
| **정책을 건 뒤 Grafana 접속이 타임아웃**<br>Traefik 까지는 도달 | **정책에 Service 포트 80 을 적음**<br>정책이 판정하는 것은 파드가 여는 포트 3000 — Service 번호는 파드에 닿기 전에 바뀜 | **3000 으로 교체**<br>`targetPort` 를 이름으로 적은 자리도 전부 숫자로 |
| **443 에 `Host` 헤더를 바꿔 넣으면 ArgoCD 로그인 화면**<br>응답 **200** | **Traefik 이 `Host` 헤더로만 가름**<br>80 과 443 뒤에 예매 화면·Grafana·ArgoCD 가 함께 있고, 어디로 보낼지는 요청자가 적는 글자가 정함 | **관리 UI 라우터를 80 에만**<br>443 에 남는 것은 예매 화면 하나 — 관리 UI 는 터널을 켜야 닿음 |
{:.hl-tbl}

## 결과

- **인터넷에 열린 포트는 둘입니다** — 서비스용 `443/TCP` 와 관리 터널용 `51820/UDP`. 밖에서 포트 20개를 훑었고 집 공인 IP 에서 응답한 것은 없습니다
- **엣지를 지나지 않으면 서비스에 못 들어옵니다** — 공인 IP 로 직접 443 을 두드리면 타임아웃입니다. 방문자가 보는 인증서는 엣지의 것이고, 클러스터가 내미는 Let's Encrypt 인증서는 엣지가 검증합니다
- **관리 화면은 터널 안에서만 열립니다** — Grafana·ArgoCD 는 443 에 라우터가 없고, 등록된 키로 서명이 풀린 기기만 격리망에 닿습니다
- **파드 사이는 적어 둔 통로만 남았습니다** — 데이터 계층 파드에서 앱 네 포트와 관측 여덟 목적지가 전부 차단되고, booking 에서 인터넷으로도 못 나갑니다

## 남은 것

- **관리용 이름 하나가 집 공인 IP 를 내보냅니다** — 엣지 프록시는 HTTP·HTTPS 만 중계해 UDP 를 쓰는 터널 쪽은 켤 수 없습니다. 어디에도 알리지 않았지만 그 이름을 조회하면 집 주소가 나옵니다
- **관리 경로가 OPNsense 한 대에 몰려 있습니다** — 이 VM 이 내려가면 관리 접근과 격리망의 인터넷이 함께 멈춥니다

## 쓴 것

OPNsense · WireGuard · Cloudflare · cert-manager · Let's Encrypt · Calico NetworkPolicy · RBAC · Better Stack
{:.hl-more}

이 경로 위에서 서비스 스펙을 다시 쟀습니다.
{:.hl-more}

{% include hl-nav.html %}
