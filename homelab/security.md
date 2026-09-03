---
layout: page
title: 격리와 공개
description: >
  노드를 방화벽 뒤 격리망으로 옮기고, 관리 통로는 키로 심사하는 터널 하나만 남긴 뒤 엣지를 통해서만 공개했습니다
permalink: /homelab/security/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

클러스터를 이루는 VM 세 대가 개발 PC와 같은 사설망에 있었습니다. 인터넷에서 들어오는 경로가
없다는 것이 지금까지의 방어였고, **포워딩 한 줄이 그 평면을 인터넷 표면으로 바꿉니다.**

## 격리와 공개 구조

<!-- 층을 실제 배선 그대로 쌓는다 — 인터넷 → 공유기 → 사설 평면(데스크탑 · vmbr0) → OPNsense → 격리망(vmbr1 · k3s).
     격리망(vmbr1 부터)에만 바탕을 깔아 안팎이 글자 전에 갈리게 한다. OPNsense 는 그 바탕 바로 위 —
     두 망에 걸친 유일한 기계. 칸마다 글은 두 줄 — 통과 조건 한 줄, 버리는 것(✕) 한 줄. 떠 있는 라벨은 두지 않는다. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<svg viewBox="0 0 760 682" role="img" aria-label="인터넷에서 온 443은 Cloudflare를 거쳐, 51820은 직접 공유기에 닿고, 공유기는 그 둘만 노트북 안 OPNsense VM으로 넘긴다. OPNsense는 물리 NIC이 있는 vmbr0과 없는 vmbr1 두 브리지에 다 꽂힌 유일한 기계로, WAN으로 받은 443은 출발지가 Cloudflare 대역일 때만 목적지를 10.0.0.240으로 바꿔 LAN으로 넘기고, 51820은 WireGuard가 등록된 키로 풀었을 때만 넘긴다. 노드가 나가는 길은 배포와 감시와 인터넷만 허용하고 옛 평면의 나머지는 차단한다. 그 아래 바탕이 깔린 격리망에 k3s 3대가 있고, Traefik은 443에 예매 화면만 두며 파드 사이는 NetworkPolicy 16줄로 좁혀져 있다">
  <defs>
    <marker id="hlx-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".45"/>
    </marker>
  </defs>

  <!-- 격리망 바탕 — 이 띠 안이 안쪽. 상자들보다 먼저 그려 뒤에 깔린다 -->
  <rect x="10" y="478" width="740" height="194" rx="8" fill="currentColor" opacity=".05"/>
  <text class="hla-zone" x="22" y="500">격리망 10.0.0.x</text>
  <text class="hla-a" x="22" y="516">물리 NIC 이 없다</text>
  <text class="hla-a" x="22" y="530">노드만 산다</text>

  <!-- 층 1 · 인터넷 -->
  <text class="hla-zone" x="20" y="16">인터넷</text>

  <rect class="hla-box" x="20" y="24" width="350" height="46" rx="5"/>
  <image href="/assets/img/icons/cloudflare.svg" x="32" y="33" width="20" height="20"/>
  <text class="hla-t" x="58" y="41">Cloudflare — ticket.subinhong.dev</text>
  <text class="hla-s2" x="32" y="61">집 IP 은닉 · TLS 종료 · 방문자 연결은 여기서 끝난다</text>

  <rect class="hla-box" x="390" y="24" width="350" height="46" rx="5"/>
  <text class="hla-t" x="402" y="41">DNS only — vpn.subinhong.dev</text>
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

  <rect class="hla-outer" x="190" y="200" width="550" height="462" rx="8"/>
  <image href="/assets/img/icons/proxmox.svg" x="200" y="208" width="16" height="16"/>
  <text class="hla-c" x="222" y="220">노트북 1대 · Proxmox .200 — 아래는 전부 VM</text>

  <rect class="hla-inner" x="204" y="228" width="522" height="40" rx="4"/>
  <text class="hla-t" x="216" y="245">vmbr0</text>
  <text class="hla-s2" x="216" y="261">물리 NIC 이 꽂혀 있다 — 공유기까지 이어진다 · OPNsense WAN .210</text>

  <line class="hla-ln" x1="465" y1="268" x2="465" y2="282" marker-end="url(#hlx-arrow)"/>

  <!-- 층 4 · OPNsense — 격리망 바탕 바로 위 -->
  <rect class="hla-wall" x="204" y="284" width="522" height="186" rx="6"/>
  <image href="/assets/img/icons/opnsense.svg" x="216" y="294" width="18" height="18"/>
  <text class="hla-t" x="240" y="308">OPNsense VM — 브리지 둘에 다 꽂힌 유일한 기계</text>
  <text class="hla-s2" x="216" y="326">WAN = vmbr0 쪽 · 192.168.0.210        LAN = vmbr1 쪽 · 10.0.0.1</text>

  <text class="hla-a" x="216" y="348">들어오는 것 — WAN 으로 받아 LAN 으로 넘긴다</text>
  <text class="hla-c" x="216" y="364">443/TCP</text>
  <text class="hla-s2" x="290" y="364">출발지가 Cloudflare 대역이면 목적지를 .240 으로 바꿔 넘김 · 아니면 버림</text>
  <text class="hla-c" x="216" y="380">51820/UDP</text>
  <text class="hla-s2" x="290" y="380">WireGuard 가 키로 풂 → 안쪽 패킷이 10.0.0.x 행이면 넘김 · 안 풀리면 무응답</text>

  <text class="hla-a" x="216" y="402">나가는 것 — LAN 으로 받아 WAN 으로 내보낸다. 위에서부터 처음 맞는 줄에서 끝</text>
  <text class="hla-s2" x="216" y="418">1   → .167 : 8929 · 5050</text>
  <text class="hla-s2" x="420" y="418">배포 — GitLab · 레지스트리</text>
  <text class="hla-c" x="650" y="418">허용</text>
  <text class="hla-s2" x="216" y="432">2   → .200 : 9100</text>
  <text class="hla-s2" x="420" y="432">감시 — 호스트 지표</text>
  <text class="hla-c" x="650" y="432">허용</text>
  <text class="hla-s2" x="216" y="446">3   → 192.168.0.0/24 나머지</text>
  <text class="hla-s2" x="420" y="446">옛 평면으로 건너가기</text>
  <text class="hla-c" x="650" y="446">차단 + 로그</text>
  <text class="hla-s2" x="216" y="460">4   → 인터넷</text>
  <text class="hla-s2" x="420" y="460">이미지 허브 · apt · 알림</text>
  <text class="hla-c" x="650" y="460">허용</text>

  <line class="hla-ln" x1="465" y1="470" x2="465" y2="484" marker-end="url(#hlx-arrow)"/>

  <!-- 층 5 · 격리망 -->
  <rect class="hla-inner" x="204" y="486" width="522" height="40" rx="4"/>
  <text class="hla-t" x="216" y="503">vmbr1</text>
  <text class="hla-s2" x="216" y="519">물리 NIC 이 없다 — 밖으로 가는 길은 위의 VM 뿐 · OPNsense LAN 10.0.0.1</text>

  <line class="hla-ln" x1="465" y1="526" x2="465" y2="540" marker-end="url(#hlx-arrow)"/>

  <rect class="hla-box" x="204" y="542" width="522" height="108" rx="5"/>
  <image href="/assets/img/icons/kubernetes.svg" x="216" y="552" width="18" height="18"/>
  <text class="hla-t" x="240" y="566">k3s — 노드 3대 .11 · .12 · .13</text>
  <text class="hla-s2" x="216" y="586">MetalLB .240 → Traefik</text>
  <text class="hla-s2" x="232" y="602">443   예매 화면 하나 · Let's Encrypt · Host 헤더로 관리 UI 를 불러도 라우터가 없음</text>
  <text class="hla-s2" x="232" y="618">80   Grafana · ArgoCD — 터널 안에서만</text>
  <text class="hla-s2" x="216" y="638">파드 사이   NetworkPolicy 16줄 · 적히지 않은 조합은 차단</text>
</svg>
<figcaption>바탕이 깔린 곳부터가 격리망입니다. 그 바로 위의 VM 하나가 브리지 둘을 잇고,
vmbr1 에 물리 NIC 이 없어 노드가 밖으로 가는 길은 그것뿐입니다.</figcaption>
</figure>

## 정한 것

<div class="hl-sub" markdown="0">경계를 세우는 층</div>

| 무엇을 | 고른 것 | 그렇게 한 이유 |
|---|---|---|
| 격리 방식 | **OPNsense 방화벽 VM** + 물리 NIC 이 없는 브리지 | **평면이 두 방향으로 번진다**<br>밖에서 노드로, 그리고 뚫린 노드에서 개발 PC 로. 개발 PC 에는 GitLab·kubeconfig·레지스트리·봉인 키가 있다. 노드는 GitOps 로 다시 세워지지만 그 자격이 새면 다시 세우는 절차 자체가 조종당한다 |
| 관리 접근 | **WireGuard** (OpenVPN 아님) | **출발지 주소는 보내는 쪽이 적는 값**<br>주소로 심사하면 위조된다. 서명은 비밀키 없이 못 만든다. 코드 약 4천 줄이라 사람이 훑을 수 있고, 등록 안 된 키에 응답하지 않는 것이 설정이 아니라 프로토콜 기본 동작 |
| 엣지 | **Cloudflare 프록시** + 방화벽 출발지를 엣지 대역으로 | **우회가 막혀야 엣지가 의미를 갖는다**<br>집 공인 IP 는 조회로 드러난다. 그 주소에 직접 443 을 두드리는 경로를 함께 막지 않으면 은닉도 연결 완충도 성립하지 않는다 |
| 이름 | 한 도메인, **`ticket` 은 프록시 켬 · `vpn` 은 끔** | **프록시가 중계하는 것은 HTTP·HTTPS 뿐**<br>WireGuard 는 UDP 라 켜면 봉투가 엣지에서 버려진다. 같은 도메인에서 한쪽만 가려진다 |
{:.hl-dec}

<div class="hl-sub" markdown="0">그 안과 그 위</div>

| 무엇을 | 고른 것 | 그렇게 한 이유 |
|---|---|---|
| 파드 사이 | **NetworkPolicy 16줄** — 인그레스 6 · 이그레스 9 · 관측 | **경계를 세워도 안은 평평**<br>정책은 허용만 적을 수 있어 통로를 전수로 세야 한다. 데이터 계층만 잠갔던 앞선 판단이 앱 자신을 놓쳤다 — booking 에 닿는 쪽은 booking 을 거쳐 그 DB 자격을 쓴다 |
| 인증서 | **Let's Encrypt · DNS-01 방식** | **포트를 열기 전에 받을 수 있다**<br>소유 확인 문자열을 DNS 에 올리는 방식. HTTP-01 은 80 을 먼저 열어야 해서, 인증서가 없는 상태로 문이 열려 있는 구간이 생긴다 |
| 출발지 제한 자리 | **방화벽** — 인그레스가 아니라 | **인그레스가 볼 때는 이미 원래 주소가 아니다**<br>Traefik 의 Service 가 `externalTrafficPolicy: Cluster` 라, 요청이 다른 노드의 파드로 넘어가며 출발지가 노드 주소로 바뀐다 |
| 데이터 계정 | **booking 을 root 에서 `cgv` 전용 계정으로** | **허용된 통로 끝에서 무엇을 할 수 있나**<br>정책이 booking → MySQL 을 열어 두므로 booking 이 잡히면 그 접속은 그대로 간다. root 는 `SHUTDOWN`·`FILE`·`CREATE USER` 를 포함한 40여 권한을 모든 DB 에 갖는데, 실제로 쓰는 것은 테이블 5개다 |
| 남용 방지 | **앱 rate limit 안 넣음** | **몰리라고 만든 서비스**<br>요청 수로 보면 정상(1만 명이 한 번씩)·부하(한 대에서 1만 번)·남용이 같은 모양이다. 재는 축이 달라 값을 어떻게 잡아도 안 맞고, 엣지 뒤에서는 출발지가 엣지 주소로 뭉친다 — 좌석 오염은 주기 초기화가, 대량 트래픽은 엣지가 받는다 |
{:.hl-dec}

## 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| **443 에 `Host` 헤더를 바꿔 넣으면 ArgoCD 로그인 화면**<br>응답 **200** | **Traefik 이 `Host` 헤더로만 가른다**<br>80 과 443 뒤에 예매 화면·Grafana·ArgoCD 가 함께 있고, 어디로 보낼지를 요청자가 적는 글자 하나가 정한다 | **관리 UI 라우터를 80 에만**<br>443 에 남는 것은 예매 화면 하나. 공유기가 443 만 열어 관리 UI 는 터널을 켜야 닿는다 |
| **조회 컴포넌트가 전 네임스페이스 Secret 52개를 읽음**<br>MySQL root · ArgoCD 키 · 노드 조인 비밀번호 | **차트가 만든 ClusterRole**<br>values 주석은 "감시 범위를 좁히면 RBAC 도 좁아진다"고 적고 있었는데 그 문장이 틀렸다. 감시 범위와 권한 범위는 다른 값이 정한다 | **네임스페이스 Role 로 내림**<br>실제 쓰는 규칙만 남겨 관측 네임스페이스 안까지. `kube-state-metrics` 는 수집 항목에서 `secrets` 제거 |
| **규칙은 통과인데 응답이 없음**<br>방화벽 로그에는 초록 pass | **응답이 돌아오는 길에서 사라짐**<br>pf 가 WAN 규칙에 기본으로 붙이는 `reply-to` 가 "응답은 무조건 WAN 게이트웨이로"를 강제한다. 회선이 하나라 직행하면 될 응답이 공유기로 우회 | **Disable reply-to**<br>정상 라우팅으로 복귀. 손실 **0%** |
{:.hl-tbl}

## 결과

- **인터넷에 열린 포트는 2개입니다** — `443/TCP`(서비스) · `51820/UDP`(관리 터널). 밖에서 포트 20개를 훑어 확인했고, 집 공인 IP 에서 응답한 것은 없습니다. TLS 는 1.0·1.1 을 거부합니다
- **엣지를 안 지나면 못 들어옵니다** — 공인 IP 로 직접 443 은 타임아웃입니다. 방문자가 보는 인증서는 엣지의 것이고, Let's Encrypt 인증서는 그 뒤 구간에서 엣지가 검증합니다. 공개 첫 24시간 요청 **36,250건**에 차단은 **0%**입니다
- **파드 사이 통로를 16줄만 남겼습니다** — 데이터 계층 파드에서 앱 네 포트와 관측 여덟 목적지가 전부 차단되고, booking 에서 관측 저장소와 인터넷으로도 못 나갑니다
- **평소 조회에 쓰는 자격을 읽기 전용으로 따로 만들었습니다** — 관리자 자격은 고칠 때만 씁니다. 읽기 전용 자격으로는 Secret 조회도 파드 삭제도 거부됩니다
- **관리 접근의 심사가 주소에서 키로 바뀌었습니다** — 출발지 주소는 보내는 쪽이 적는 값이고, 서명은 비밀키 없이 못 만듭니다. 밖에서 서비스를 3분마다 찌르는 감시도 함께 붙였습니다

## 남은 것

- **`vpn` 이름 하나는 가릴 수 없습니다** — WireGuard 가 UDP 라 프록시를 못 켭니다. 조회하면 집 공인 IP 가 나오고, 그 주소에서 응답하는 것은 51820 하나입니다
- **읽기 전용 자격의 키가 새면 90일간 못 막습니다** — 쿠버네티스에 인증서 폐기 목록이 없어 만료가 유일한 회수 수단입니다. 즉시 막으려면 같은 그룹 전체가 함께 막힙니다
- **관리 경로가 OPNsense 한 대에 몰려 있습니다** — 이 VM 이 내려가면 관리·격리망 인터넷·배포 알림이 함께 멈춥니다
- **밖에서 보는 감시가 하루 10시간 40분은 비어 있습니다** — 야간 예약 종료 시간대를 유지보수 창으로 잡아 둔 결과입니다

## 쓴 것

OPNsense · WireGuard · Cloudflare · cert-manager · Let's Encrypt · Calico NetworkPolicy · RBAC · Better Stack
{:.hl-more}

이 경로 위에서 서비스 스펙을 다시 쟀습니다.
{:.hl-more}

{% include hl-nav.html %}
