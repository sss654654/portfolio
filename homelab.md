---
layout: page
title: 홈랩
description: >
  노트북 한 대에 k3s 클러스터를 세우고 예매 대기열 서비스를 인터넷에 공개해 운영하는 기록 — 구축부터 배포 자동화, 관측, 부하 실측, 보안까지
permalink: /homelab/
---

<!-- ① 개요 — 리드 두 문단 + 배선도 -->

집에 있던 노트북 한 대에 Proxmox를 올리고, VM 3대로 k3s 클러스터를 세웠습니다.
그 안에서 예매 대기열 서비스가 돌고 있고, [ticket.subinhong.dev](https://ticket.subinhong.dev) 에 접속하면 지금 직접 예매를 해볼 수 있습니다.

클라우드에서 버튼 한 번으로 받던 것들 — 네트워크·스토리지·인증서·배포 파이프라인·방화벽 — 을 여기서는 전부 직접 세우고 값을 정해야 했습니다.
그 값들은 대부분 추정이 아니라 부하를 걸어 잰 것입니다.

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
    <pattern id="hla-bricks" width="18" height="12" patternUnits="userSpaceOnUse">
      <path d="M0,0.5 H18 M0,6.5 H18 M4.5,0.5 V6.5 M13.5,6.5 V12" stroke="#d94f00" stroke-opacity=".22" stroke-width="1" fill="none"/>
    </pattern>
  </defs>

  <!-- 구역 라벨 -->
  <g class="hla-g hla-g1">
    <text x="150" y="30" class="hla-zone" text-anchor="middle">인터넷</text>
    <text x="500" y="30" class="hla-zone" text-anchor="middle">우리 집</text>
  </g>

  <!-- 인터넷 쪽: 사용자 · Cloudflare -->
  <g class="hla-g hla-g1">
    <rect x="20" y="48" width="118" height="56" rx="9" class="hla-box"/>
    <circle cx="36" cy="66" r="5" class="hla-glyph"/>
    <path d="M26,83 C26,73 46,73 46,83" class="hla-glyph"/>
    <text x="54" y="71" class="hla-t">사용자</text>
    <text x="30" y="96" class="hla-a">ticket.subinhong.dev</text>
    <line x1="138" y1="72" x2="156" y2="72" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <rect x="158" y="48" width="132" height="56" rx="9" class="hla-box"/>
    <image href="/assets/img/icons/cloudflare.svg" x="166" y="61" width="26" height="26"/>
    <text x="197" y="71" class="hla-t">Cloudflare</text>
    <text x="197" y="90" class="hla-s">DNS · TLS · IP 은닉</text>
  </g>

  <!-- 관리자 · 데스크탑 -->
  <g class="hla-g hla-g1">
    <rect x="20" y="146" width="126" height="48" rx="9" class="hla-box"/>
    <image href="/assets/img/icons/wireguard.svg" x="28" y="157" width="24" height="24"/>
    <text x="57" y="166" class="hla-t">나 — 관리자</text>
    <text x="57" y="181" class="hla-s">밖에서 접속할 때</text>
    <rect x="20" y="244" width="150" height="52" rx="9" class="hla-box"/>
    <image href="/assets/img/icons/gitlab.svg" x="28" y="257" width="24" height="24"/>
    <text x="57" y="264" class="hla-t">데스크탑</text>
    <text x="57" y="280" class="hla-s">GitLab · CI · 레지스트리</text>
  </g>

  <!-- 집: 공유기 — 밖에서 오는 둘(443·51820)만 지나는 세로 관문.
       데스크탑은 같은 홈 LAN이라 포워딩을 거치지 않고 이 아래로 지난다 -->
  <g class="hla-g hla-g2">
    <rect x="316" y="48" width="56" height="150" rx="8" class="hla-box"/>
    <rect x="333" y="70" width="22" height="11" rx="2" class="hla-glyph"/>
    <line x1="338" y1="70" x2="335" y2="60" class="hla-glyph"/>
    <line x1="350" y1="70" x2="353" y2="60" class="hla-glyph"/>
    <text x="344" y="100" text-anchor="middle" class="hla-t">공유기</text>
    <text x="344" y="214" text-anchor="middle" class="hla-s">포워딩 443 · 51820만</text>
    <line x1="290" y1="72" x2="314" y2="72" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <line x1="374" y1="72" x2="442" y2="72" class="hla-ln" marker-end="url(#hla-arrow)"/>
  </g>

  <!-- 노트북 상자 -->
  <g class="hla-g hla-g3">
    <rect x="430" y="40" width="318" height="300" rx="12" class="hla-outer"/>
    <image href="/assets/img/icons/proxmox.svg" x="443" y="52" width="20" height="20"/>
    <text x="469" y="67" class="hla-t">노트북 1대 — Proxmox · 전부 VM</text>

    <!-- OPNsense 세로 벽 — 세로쓰기 한 자씩, 이름은 아래 가로로 -->
    <rect x="444" y="84" width="44" height="232" rx="8" class="hla-wall"/>
    <rect x="444" y="84" width="44" height="232" rx="8" fill="url(#hla-bricks)" stroke="none"/>
    <image href="/assets/img/icons/opnsense.svg" x="450" y="94" width="32" height="32"/>
    <text x="466" y="156" text-anchor="middle" class="hla-wallc">방</text>
    <text x="466" y="176" text-anchor="middle" class="hla-wallc">화</text>
    <text x="466" y="196" text-anchor="middle" class="hla-wallc">벽</text>
    <text x="466" y="331" text-anchor="middle" class="hla-s">OPNsense VM</text>

    <!-- k3s 클러스터 -->
    <rect x="504" y="84" width="234" height="172" rx="10" class="hla-inner"/>
    <image href="/assets/img/icons/kubernetes.svg" x="513" y="94" width="20" height="20"/>
    <text x="539" y="109" class="hla-t">k3s 클러스터 — VM 3대 · HA</text>

    <line x1="490" y1="132" x2="510" y2="132" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <text x="500" y="126" class="hla-s2" text-anchor="middle">443</text>
    <line x1="490" y1="154" x2="510" y2="154" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <text x="500" y="167" class="hla-s2" text-anchor="middle">80</text>
    <rect x="512" y="118" width="84" height="46" rx="12" class="hla-box"/>
    <image href="/assets/img/icons/traefikproxy.svg" x="518" y="132" width="18" height="18"/>
    <text x="540" y="146" class="hla-c">Traefik</text>
    <line x1="596" y1="132" x2="606" y2="132" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <line x1="554" y1="164" x2="554" y2="192" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <rect x="608" y="114" width="126" height="62" rx="10" class="hla-box"/>
    <image href="/assets/img/icons/ticket.svg" x="616" y="124" width="22" height="22"/>
    <text x="643" y="139" class="hla-c">대기열 서비스</text>
    <text x="671" y="156" class="hla-s2" text-anchor="middle">frontend · queue · booking</text>
    <text x="671" y="169" class="hla-s2" text-anchor="middle">Redis · MySQL · Kafka</text>

    <rect x="514" y="196" width="216" height="44" rx="10" class="hla-box"/>
    <image href="/assets/img/icons/argo.svg" x="523" y="208" width="20" height="20"/>
    <image href="/assets/img/icons/grafana.svg" x="548" y="208" width="20" height="20"/>
    <text x="572" y="215" class="hla-c">관리 UI — ArgoCD · Grafana</text>
    <text x="572" y="230" class="hla-s">VPN으로만 접속</text>
    <line x1="660" y1="194" x2="660" y2="178" class="hla-ln hla-dash" marker-end="url(#hla-arrow)"/>
    <text x="668" y="190" class="hla-s2">배포</text>

    <!-- 파드 배지 — 쿠버네티스 도상(육각형)을 각 상자 우상단에 -->
    <path class="hla-pod" d="M598.5,127 L595.25,132.63 L588.75,132.63 L585.5,127 L588.75,121.37 L595.25,121.37 Z"/>
    <path class="hla-pod" d="M736.5,116 L733.25,121.63 L726.75,121.63 L723.5,116 L726.75,110.37 L733.25,110.37 Z"/>
    <path class="hla-pod" d="M732.5,197 L729.25,202.63 L722.75,202.63 L719.5,197 L722.75,191.37 L729.25,191.37 Z"/>
  </g>

  <!-- 흐름선: VPN · GitOps -->
  <g class="hla-g hla-g2">
    <line x1="146" y1="170" x2="314" y2="170" class="hla-ln hla-dash" marker-end="url(#hla-arrow)"/>
    <line x1="374" y1="170" x2="442" y2="170" class="hla-ln hla-dash" marker-end="url(#hla-arrow)"/>
    <text x="230" y="162" class="hla-s" text-anchor="middle">WireGuard 51820/UDP</text>
    <line x1="170" y1="268" x2="442" y2="268" class="hla-ln hla-dash" marker-end="url(#hla-arrow)"/>
    <text x="304" y="260" class="hla-s" text-anchor="middle">코드 push → CI → 이미지 → ArgoCD가 당겨가 배포</text>
  </g>

  <!-- 흐르는 점 셋 — 12초 한 바퀴를 순서대로 (한 사이클 돌고 사라지고 다음) -->
  <circle class="hla-dot hla-dot-u" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.05;0.33;1" keyPoints="0;0;1;1"
      path="M70,72 L221,72 L344,72 L466,72 L466,132 L560,132 L634,132"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.05;0.07;0.31;0.33;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-v" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.40;0.60;1" keyPoints="0;0;1;1"
      path="M83,170 L344,170 L466,170 L466,154 L554,154 L554,218"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.40;0.42;0.58;0.60;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-g" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.68;0.94;1" keyPoints="0;0;1;1"
      path="M87,268 L496,268 L496,221 L660,221 L660,176"/>
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
<figcaption>ticket.subinhong.dev 로 들어오는 세 갈래 — 전부 한 방화벽을 지납니다.
Cloudflare 대역 밖에서 온 443은 버리고, 키 없는 VPN 시도에는 응답하지 않습니다.</figcaption>
</figure>

<!-- ② 다섯 갈래 — 물리에서 공개까지 순서대로 -->

## 다섯 갈래

물리 서버에서 인터넷 공개까지, 순서대로 다섯 갈래입니다.

<div class="hl-cards" markdown="0">
  <div class="hl-card">
    <span class="hl-tag">구축</span>
    <h3>노트북 한 대를 클러스터로</h3>
    <p>Proxmox로 VM 3대를 만들어 k3s를 HA로 세웠습니다. k3s가 기본으로 주는 네트워크·로드밸런서·인그레스는 끄고 Calico·MetalLB·Traefik으로 바꿔 설정을 직접 쥐었고, 디스크는 워크로드마다 따로 잘라 정적 PV로 붙였습니다.</p>
    <span class="hl-num">VM 3대 · etcd 3멤버 · 정적 PV 10장</span>
  </div>
  <div class="hl-card">
    <span class="hl-tag">GitOps · CI/CD</span>
    <h3>커밋 하나로 파드까지</h3>
    <p>GitLab을 직접 세우고, 클러스터가 저장소를 당겨가도록 ArgoCD를 붙였습니다. 커밋 하나가 검사·빌드·스캔을 지나 이미지가 되고, 그 태그가 저장소로 돌아와 파드가 바뀝니다.</p>
    <span class="hl-num">push → 반영 3초 · 파이프라인 6분 6초 → 46초</span>
  </div>
  <div class="hl-card">
    <span class="hl-tag">관측</span>
    <h3>지표·로그·트레이스를 잇다</h3>
    <p>LGTM 스택을 올려 세 축을 한 화면에서 오갑니다. 시리즈가 상한에 차던 원인은 같은 프로세스를 두 곳에서 중복 수집한 것이었고, 트레이스는 회차 조회가 Redis를 스무 번 왕복하던 N+1을 찾아냈습니다.</p>
    <span class="hl-num">중복 수집 제거 후 거절 0건 · N+1 수정으로 p99 1.47초 → 0.1초</span>
  </div>
  <div class="hl-card">
    <span class="hl-tag">부하 테스트</span>
    <h3>추정값을 실측값으로</h3>
    <p>"이 정도면 되겠지"로 적어 둔 값들을 부하를 걸어 다시 정했습니다. 판을 거듭할수록 병목이 앞에서 뒤로 옮겨 갔고, 옮겨간 자리를 하나씩 따라가 정원·타임아웃·자원 스펙을 확정했습니다.</p>
    <span class="hl-num">판 34회 · 동시 입장 1,000명 · 76만 요청에 5xx 0건</span>
  </div>
  <div class="hl-card">
    <span class="hl-tag">보안 · 공개</span>
    <h3>격리망 안에서 인터넷 열기</h3>
    <p>클러스터를 방화벽 뒤 격리망으로 옮기고, 관리 통로는 VPN 하나만 남겼습니다. 밖으로는 Cloudflare를 거친 443만 열려 있고, 안쪽도 파드끼리 오갈 수 있는 통로를 지정해 잠갔습니다.</p>
    <span class="hl-num">인터넷에 열린 포트 2개 · 파드 간 통로 16줄</span>
  </div>
</div>

<!-- ③ 기록 -->

## 기록

구축 과정을 블로그에 편별로 남겼습니다. 명령과 결과만이 아니라 막힌 곳과 틀린 판단까지 그대로 적었습니다 —
램이 모자란 줄 알고 주문까지 넣었다가 원인이 다른 데 있었던 일, 대시보드 숫자가 층을 섞어 계산되고 있던 일 같은 것들입니다.

* [HomeLab 시리즈](https://zed6740.tistory.com/category/HomeLab) — 구축 1부부터 인터넷 공개까지
