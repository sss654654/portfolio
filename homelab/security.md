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

<!-- 이 그림이 답하는 질문 = 무엇이 어디서 버려지나. 통과 경로는 홈랩 오버뷰 배선도가 이미 그리므로
     여기서는 심사대마다 통과 조건과 차단 대상을 나란히 둔다. 왼쪽 열이 누구나 오는 문(443),
     오른쪽이 키를 가진 기기만 오는 문(51820). 둘의 심사 기준이 다른 것이 이 카드의 논지다. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<svg viewBox="0 0 760 446" role="img" aria-label="인터넷에서 들어오는 문이 둘이고, 왼쪽 443은 Cloudflare와 공유기와 OPNsense와 Traefik을 차례로 지나며 출발지 대역과 Host 헤더로 걸러지고, 오른쪽 51820은 공유기를 지나 WireGuard의 키 검문에서 걸러진다. 둘 다 물리 NIC이 없는 격리망으로 들어가고 그 안은 통로 16줄로 좁혀져 있다">
  <defs>
    <marker id="hlx-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".45"/>
    </marker>
  </defs>

  <!-- 인터넷 — 제품이 아니라 층이라 로고 대신 직접 그린다 -->
  <circle class="hla-glyph" cx="356" cy="15" r="6.5"/>
  <ellipse class="hla-glyph" cx="356" cy="15" rx="2.7" ry="6.5"/>
  <line class="hla-glyph" x1="349.5" y1="15" x2="362.5" y2="15"/>
  <text class="hla-zone" x="369" y="19">인터넷</text>
  <line class="hla-ln" x1="380" y1="26" x2="380" y2="33"/>
  <line class="hla-ln" x1="224" y1="33" x2="536" y2="33"/>
  <line class="hla-ln" x1="224" y1="33" x2="224" y2="42" marker-end="url(#hlx-arrow)"/>
  <line class="hla-ln" x1="536" y1="33" x2="536" y2="42" marker-end="url(#hlx-arrow)"/>

  <!-- 두 문 — 성격이 정반대인 것이 첫 줄에서 보이게 -->
  <rect class="hla-box" x="84" y="44" width="280" height="48" rx="5"/>
  <text class="hla-t" x="98" y="66">443/TCP — 서비스</text>
  <text class="hla-s2" x="98" y="83">누구나 들어온다. 그것이 목적이다</text>

  <rect class="hla-box" x="396" y="44" width="280" height="48" rx="5"/>
  <text class="hla-t" x="410" y="66">51820/UDP — 관리</text>
  <text class="hla-s2" x="410" y="83">등록된 키를 가진 기기 둘</text>

  <line class="hla-ln" x1="224" y1="92" x2="224" y2="102" marker-end="url(#hlx-arrow)"/>
  <line class="hla-ln" x1="536" y1="92" x2="536" y2="166" marker-end="url(#hlx-arrow)"/>

  <!-- 엣지 — 왼쪽 문에만 붙는다 -->
  <rect class="hla-box" x="84" y="104" width="280" height="52" rx="5"/>
  <image href="/assets/img/icons/cloudflare.svg" x="98" y="116" width="20" height="20"/>
  <text class="hla-t" x="124" y="131">Cloudflare</text>
  <text class="hla-s2" x="98" y="148">집 공인 IP 은닉 · TLS 종료 · /api 는 캐시에서 제외</text>

  <line class="hla-ln" x1="224" y1="156" x2="224" y2="166" marker-end="url(#hlx-arrow)"/>

  <!-- 공유기 — 두 문이 함께 지난다 -->
  <rect class="hla-box" x="84" y="168" width="592" height="46" rx="5"/>
  <image href="/assets/img/icons/tplink.svg" x="98" y="176" width="18" height="18"/>
  <text class="hla-t" x="122" y="190">공유기 — 포워딩 2개</text>
  <text class="hla-x" x="98" y="206">✕ 그 밖의 포트는 버린다 — 밖에서 20개를 훑어 확인</text>

  <line class="hla-ln" x1="224" y1="214" x2="224" y2="224" marker-end="url(#hlx-arrow)"/>
  <line class="hla-ln" x1="536" y1="214" x2="536" y2="224" marker-end="url(#hlx-arrow)"/>

  <!-- 심사대 — 왼쪽은 대역, 오른쪽은 서명 -->
  <rect class="hla-box" x="84" y="226" width="280" height="62" rx="5"/>
  <image href="/assets/img/icons/opnsense.svg" x="98" y="238" width="18" height="18"/>
  <text class="hla-t" x="122" y="252">OPNsense</text>
  <text class="hla-s2" x="98" y="269">출발지가 Cloudflare 대역인 것만</text>
  <text class="hla-x" x="98" y="283">✕ 공인 IP 로 직접 443 — 타임아웃</text>

  <rect class="hla-box" x="396" y="226" width="280" height="62" rx="5"/>
  <image href="/assets/img/icons/wireguard.svg" x="410" y="238" width="18" height="18"/>
  <text class="hla-t" x="434" y="252">WireGuard</text>
  <text class="hla-s2" x="410" y="269">등록된 키로 서명이 풀리는 것만</text>
  <text class="hla-x" x="410" y="283">✕ 등록 안 된 키 — 응답하지 않는다</text>

  <line class="hla-ln" x1="224" y1="288" x2="224" y2="298" marker-end="url(#hlx-arrow)"/>
  <line class="hla-ln" x1="536" y1="288" x2="536" y2="372" marker-end="url(#hlx-arrow)"/>

  <rect class="hla-box" x="84" y="300" width="280" height="62" rx="5"/>
  <image href="/assets/img/icons/traefikproxy.svg" x="98" y="312" width="18" height="18"/>
  <text class="hla-t" x="122" y="326">Traefik</text>
  <text class="hla-s2" x="98" y="343">443 라우터는 예매 화면 하나 · 정식 인증서</text>
  <text class="hla-x" x="98" y="357">✕ Host 헤더를 관리 UI 이름으로</text>

  <line class="hla-ln" x1="224" y1="362" x2="224" y2="372" marker-end="url(#hlx-arrow)"/>

  <!-- 격리망 — 물리 포트가 없다는 것이 이 망의 정의다 -->
  <rect class="hla-outer" x="84" y="374" width="592" height="56" rx="6"/>
  <image href="/assets/img/icons/kubernetes.svg" x="98" y="386" width="18" height="18"/>
  <text class="hla-t" x="122" y="400">격리망 — 물리 NIC 이 없는 브리지 · k3s 3대</text>
  <text class="hla-s2" x="98" y="419">파드 사이 통로 16줄 — 적히지 않은 조합은 차단</text>
</svg>
<figcaption>밖에서 들어올 수 있는 지점은 두 곳이고, 심사 기준이 서로 다릅니다 —
왼쪽은 엣지를 지났는지, 오른쪽은 키가 등록됐는지.</figcaption>
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
