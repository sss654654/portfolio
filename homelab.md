---
layout: page
title: 홈랩
description: >
  노트북 한 대를 외장 SSD로 Proxmox 부팅해, VM 3대를 컨트롤플레인 노드로 두고 k3s 클러스터를 세웠습니다
permalink: /homelab/
---

<!-- 오버뷰 — 왜(동기) → 무엇을 올렸나 → 어디까지가 범위인가 → 그 구성이 아래 그림.
     홈의 "## 홈랩" 절과 겹치지 않도록 "무엇을 만들었나"는 여기서 반복하지 않는다. -->

관리형 쿠버네티스는 컨트롤플레인·네트워크·로드밸런서·볼륨을 선언만 하면 만들어 줍니다.
그 층을 하나씩 골라 세우고 **그 아래 리눅스·하이퍼바이저·디스크까지** 다루기 위해, 쓰던 노트북을 서버로 삼았습니다.
그 위에 대기열 예매 서비스와 옵저버빌리티를 올려 인터넷에 공개했고, 아래가 그 구성입니다.
{:.lead}

<!-- 배선도 — 실제 토폴로지를 세 이야기로 압축:
     사용자 → Traefik → 대기열 서비스 / 관리자 → VPN → 관리 UI / GitLab → CI → ArgoCD → 배포.
     세 흐름 전부 노트북 안 OPNsense VM(세로 벽)을 지난다. 점 셋이 12초 한 바퀴를 순서대로.
     아이콘 = simple-icons(CC0). prefers-reduced-motion 이면 정지 -->
<figure class="hl-diagram" markdown="0">
<svg viewBox="0 0 760 384" role="img" aria-label="사용자는 ticket.subinhong.dev로 Cloudflare와 공유기를 거쳐 대기열 서비스에, 관리자는 WireGuard로 관리 UI에, 배포는 GitLab에서 ArgoCD로 — 세 흐름이 모두 노트북 안 OPNsense 방화벽 VM을 지나는 구조">
  <defs>
    <marker id="hla-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/>
    </marker>
    <marker id="hla-arrow-back" viewBox="0 0 8 8" refX="1" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto">
      <path d="M8,0 L0,4 L8,8 z" fill="currentColor" opacity=".5"/>
    </marker>
    <pattern id="hla-bricks" width="18" height="12" patternUnits="userSpaceOnUse">
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
    <line x1="156" y1="72" x2="168" y2="72" class="hla-ln" marker-end="url(#hla-arrow)"/>
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

  <!-- 집: 공유기 — 사용자 선과 VPN 선 중간. 위아래에서 들어와 오른쪽으로 함께 나간다.
       데스크탑은 같은 홈 LAN이라 포워딩을 거치지 않고 아래로 지난다 -->
  <g class="hla-g hla-g2">
    <line x1="302" y1="72" x2="366" y2="72" class="hla-ln"/>
    <line x1="366" y1="72" x2="366" y2="86" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <line x1="176" y1="170" x2="366" y2="170" class="hla-ln hla-dash"/>
    <line x1="366" y1="170" x2="366" y2="156" class="hla-ln hla-dash" marker-end="url(#hla-arrow)"/>
    <text x="271" y="162" class="hla-s" text-anchor="middle">WireGuard 51820/UDP</text>

    <rect x="310" y="90" width="112" height="62" rx="9" class="hla-box"/>
    <rect x="355" y="101" width="22" height="11" rx="2" class="hla-glyph"/>
    <line x1="360" y1="101" x2="357" y2="92" class="hla-glyph"/>
    <line x1="372" y1="101" x2="375" y2="92" class="hla-glyph"/>
    <text x="366" y="128" text-anchor="middle" class="hla-t">공유기</text>
    <text x="366" y="145" text-anchor="middle" class="hla-s">포워딩 443 · 51820만</text>

    <line x1="422" y1="110" x2="442" y2="110" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <line x1="422" y1="132" x2="442" y2="132" class="hla-ln hla-dash" marker-end="url(#hla-arrow)"/>
  </g>

  <!-- 노트북 상자 -->
  <g class="hla-g hla-g3">
    <rect x="430" y="40" width="318" height="300" rx="12" class="hla-outer"/>
    <image href="/assets/img/icons/proxmox.svg" x="449" y="53" width="20" height="20"/>
    <text x="476" y="68" class="hla-t">노트북 1대 — Proxmox · 전부 VM</text>

    <!-- OPNsense 세로 벽 — 세로쓰기 한 자씩, 이름은 아래 가로로 -->
    <rect x="444" y="90" width="44" height="226" rx="8" class="hla-wall"/>
    <rect x="444" y="90" width="44" height="226" rx="8" fill="url(#hla-bricks)" stroke="none"/>
    <image href="/assets/img/icons/opnsense.svg" x="448" y="152" width="36" height="36"/>
    <text x="466" y="216" text-anchor="middle" class="hla-wallc">방</text>
    <text x="466" y="236" text-anchor="middle" class="hla-wallc">화</text>
    <text x="466" y="256" text-anchor="middle" class="hla-wallc">벽</text>
    <text x="466" y="331" text-anchor="middle" class="hla-s">OPNsense VM</text>

    <!-- k3s 클러스터 -->
    <rect x="504" y="90" width="234" height="176" rx="10" class="hla-inner"/>
    <image href="/assets/img/icons/kubernetes.svg" x="513" y="100" width="20" height="20"/>
    <text x="539" y="115" class="hla-t">k3s 클러스터 — VM 3대 · HA</text>

    <line x1="490" y1="140" x2="510" y2="140" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <text x="500" y="134" class="hla-s2" text-anchor="middle">443</text>
    <line x1="490" y1="162" x2="510" y2="162" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <text x="500" y="175" class="hla-s2" text-anchor="middle">80</text>
    <rect x="512" y="126" width="84" height="46" rx="12" class="hla-box"/>
    <image href="/assets/img/icons/traefikproxy.svg" x="518" y="140" width="18" height="18"/>
    <text x="540" y="154" class="hla-c">Traefik</text>
    <line x1="596" y1="140" x2="606" y2="140" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <line x1="554" y1="172" x2="554" y2="202" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <rect x="608" y="122" width="126" height="62" rx="10" class="hla-box"/>
    <image href="/assets/img/icons/ticket.svg" x="616" y="132" width="22" height="22"/>
    <text x="643" y="147" class="hla-c">대기열 서비스</text>
    <text x="671" y="164" class="hla-s2" text-anchor="middle">frontend · queue · booking</text>
    <text x="671" y="177" class="hla-s2" text-anchor="middle">Redis · MySQL · Kafka</text>

    <rect x="514" y="206" width="216" height="46" rx="10" class="hla-box"/>
    <image href="/assets/img/icons/argo.svg" x="523" y="219" width="20" height="20"/>
    <image href="/assets/img/icons/grafana.svg" x="548" y="219" width="20" height="20"/>
    <text x="572" y="226" class="hla-c">관리 UI — ArgoCD · Grafana</text>
    <text x="572" y="241" class="hla-s">VPN으로만 접속</text>
    <line x1="660" y1="204" x2="660" y2="188" class="hla-ln hla-dash" marker-end="url(#hla-arrow)"/>
    <text x="668" y="200" class="hla-s2">배포</text>

    <!-- 파드 배지 — 쿠버네티스 도상(육각형)을 각 상자 우상단에 -->
    <path class="hla-pod" d="M598.5,135 L595.25,140.63 L588.75,140.63 L585.5,135 L588.75,129.37 L595.25,129.37 Z"/>
    <path class="hla-pod" d="M736.5,124 L733.25,129.63 L726.75,129.63 L723.5,124 L726.75,118.37 L733.25,118.37 Z"/>
    <path class="hla-pod" d="M732.5,207 L729.25,212.63 L722.75,212.63 L719.5,207 L722.75,201.37 L729.25,201.37 Z"/>
  </g>

  <!-- GitOps — 방향이 둘이라 양쪽 화살표: 당김(클러스터→데스크탑) · webhook(터널로) -->
  <g class="hla-g hla-g2">
    <text x="306" y="256" class="hla-s" text-anchor="middle">코드 push → CI → 이미지</text>
    <line x1="176" y1="268" x2="440" y2="268" class="hla-ln hla-dash"
          marker-start="url(#hla-arrow-back)" marker-end="url(#hla-arrow)"/>
    <text x="306" y="284" class="hla-s" text-anchor="middle">ArgoCD·노드가 당겨간다 · webhook은 터널로</text>
  </g>

  <!-- 흐르는 점 셋 — 12초 한 바퀴를 순서대로 (한 사이클 돌고 사라지고 다음) -->
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
<figcaption>사용자·관리자·배포, 세 경로가 모두 노트북 안 방화벽 VM을 지납니다.
Cloudflare 대역 밖에서 온 443은 버리고, 키 없는 VPN 시도에는 응답하지 않습니다.</figcaption>
</figure>

<!-- 카드 여섯 — 물리에서 공개까지 순서대로 -->

## 구성

<div class="hlc-grid" markdown="0">

  <a class="hlc-card" href="/homelab/cluster/">
    <img class="hlc-img" src="/assets/img/homelab/cluster-thumb.jpg" alt="뚜껑을 연 노트북과 오른쪽에 케이블로 연결된 외장 SSD">
    <span class="hlc-tag">클러스터</span>
    <span class="hlc-title">Proxmox로 k3s HA 클러스터 구축</span>
    <span class="hlc-desc">네트워크·로드밸런서·인그레스·스토리지를 k3s 기본 대신 Calico·MetalLB·Traefik·정적 PV로 세웠습니다.</span>
  </a>

  <a class="hlc-card" href="/homelab/cicd/">
    <img class="hlc-img" src="/assets/img/homelab/cicd-thumb.jpg" alt="파이프라인이 통과한 GitLab 머지 리퀘스트 화면과 앱이 전부 Synced 인 ArgoCD 화면">
    <span class="hlc-tag">CI/CD</span>
    <span class="hlc-title">GitLab · ArgoCD로 빌드·배포 파이프라인 구축</span>
    <span class="hlc-desc">머지하면 검증과 빌드를 거쳐 이미지가 되고, 클러스터가 가져가 파드를 교체합니다. 커밋에서 반영까지 3초입니다.</span>
  </a>

  <a class="hlc-card" href="/homelab/observability/">
    <img class="hlc-img" src="/assets/img/homelab/observability-thumb.jpg" alt="알림이 발화한 순간의 호스트 대시보드와, 같은 알림이 도착한 폰 Discord 화면">
    <span class="hlc-tag">옵저버빌리티</span>
    <span class="hlc-title">LGTM 스택으로 옵저버빌리티 구축</span>
    <span class="hlc-desc">metric · log · trace를 수집기 하나로 모으고, 클러스터와 서버 호스트의 대시보드·알림을 그 위에 세웠습니다.</span>
  </a>

  <a class="hlc-card" href="/homelab/service/">
    <img class="hlc-img" src="/assets/img/homelab/service-thumb.png" alt="왼쪽에 좌석 현황판과 예매 카드가 뜬 화면, 오른쪽에 대기 순번 2647번이 뜬 대기 화면">
    <span class="hlc-tag">서비스</span>
    <span class="hlc-title">대기열과 예매, 두 서비스</span>
    <span class="hlc-desc">열리는 시각에 인원이 몰리는 티케팅입니다. 줄 세우는 queue(Go)와 표를 파는 booking(Spring)을 나눠 Kafka로 이었습니다.</span>
  </a>

  <a class="hlc-card" href="/homelab/security/">
    <img class="hlc-img" src="/assets/img/homelab/security-thumb.png" alt="OPNsense 방화벽 규칙 목록과, 터널을 켠 폰에서 열린 Grafana 및 WireGuard 연결 화면">
    <span class="hlc-tag">격리와 공개</span>
    <span class="hlc-title">방화벽 뒤로 격리하고 엣지로 공개</span>
    <span class="hlc-desc">노드를 방화벽 뒤 격리망으로 옮겼습니다. 관리는 키를 등록한 터널(51820)로, 서비스는 엣지를 거친 것(443)만 — 인터넷에 열린 포트는 이 둘입니다.</span>
  </a>

  <a class="hlc-card" href="/homelab/capacity/">
    <img class="hlc-img" src="/assets/img/homelab/capacity-thumb.png" alt="k6 실행이 끝난 터미널 — 요청 시간 구간별 지연과 여정 지연, 요청 25,004건 요약">
    <span class="hlc-tag">부하 테스트</span>
    <span class="hlc-title">k6 부하 테스트로 정원·자원 스펙 확정</span>
    <span class="hlc-desc">SLO를 먼저 정하고 공개된 경로에 실제 여정 그대로 부하를 걸었습니다. 막히는 자리를 대시보드에서 찾아 고쳐, 10,000명이 5xx 없이 완주했습니다.</span>
  </a>

</div>

<!-- 기록과 코드 -->

## 기록 · 저장소

시작한 날부터 편별로 블로그에 남겼습니다.

* [HomeLab 시리즈](https://zed6740.tistory.com/category/HomeLab) — 왜 온프렘인지부터 인터넷 공개까지
* [cgv-infra](https://github.com/sss654654/cgv-infra) — 클러스터와 배포 정의. 이 페이지의 설정은 전부 여기 있습니다
* [cgv-onprem](https://github.com/sss654654/cgv-onprem) — 앱 소스. queue(Go) · booking(Spring) · frontend

홈랩 이전의 것은 [프로젝트](/projects/)에, 요약은 [이력서](/resume/)에 있습니다.
{:.hl-more}
