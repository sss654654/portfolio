---
layout: page
title: 홈랩
description: >
  노트북 한 대에 k3s 클러스터를 세우고 예매 대기열 서비스를 인터넷에 공개해 운영하는 기록 — 구축부터 배포 자동화, 관측, 부하 실측, 보안까지
permalink: /homelab/
---

<!-- ① 개요 — 리드 두 문단 + 배선도 -->

노트북 한 대에 Proxmox를 올려 VM 3대로 k3s 클러스터를 세우고, 그 위에서 예매 대기열 서비스를 운영합니다.
[ticket.subinhong.dev](https://ticket.subinhong.dev) 에 접속하면 지금 직접 예매해 볼 수 있습니다.

클라우드에서 버튼 한 번으로 받던 것 — 네트워크·스토리지·인증서·배포 파이프라인·방화벽 — 을 여기서는 직접 세우고 값을 정해야 했습니다.
그 값은 대부분 추정이 아니라 부하를 걸어 잰 것입니다.

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

  <!-- 집: 공유기 — 사용자 선과 VPN 선 중간. 위아래에서 들어와 오른쪽으로 함께 나간다.
       데스크탑은 같은 홈 LAN이라 포워딩을 거치지 않고 아래로 지난다 -->
  <g class="hla-g hla-g2">
    <line x1="290" y1="72" x2="366" y2="72" class="hla-ln"/>
    <line x1="366" y1="72" x2="366" y2="86" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <line x1="146" y1="170" x2="366" y2="170" class="hla-ln hla-dash"/>
    <line x1="366" y1="170" x2="366" y2="156" class="hla-ln hla-dash" marker-end="url(#hla-arrow)"/>
    <text x="256" y="162" class="hla-s" text-anchor="middle">WireGuard 51820/UDP</text>

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
    <image href="/assets/img/icons/proxmox.svg" x="443" y="52" width="20" height="20"/>
    <text x="469" y="67" class="hla-t">노트북 1대 — Proxmox · 전부 VM</text>

    <!-- OPNsense 세로 벽 — 세로쓰기 한 자씩, 이름은 아래 가로로 -->
    <rect x="444" y="84" width="44" height="232" rx="8" class="hla-wall"/>
    <rect x="444" y="84" width="44" height="232" rx="8" fill="url(#hla-bricks)" stroke="none"/>
    <image href="/assets/img/icons/opnsense.svg" x="448" y="148" width="36" height="36"/>
    <text x="466" y="212" text-anchor="middle" class="hla-wallc">방</text>
    <text x="466" y="232" text-anchor="middle" class="hla-wallc">화</text>
    <text x="466" y="252" text-anchor="middle" class="hla-wallc">벽</text>
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
      path="M70,72 L221,72 L366,72 L366,110 L466,110 L466,132 L560,132 L634,132"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.05;0.07;0.31;0.33;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-v" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.40;0.60;1" keyPoints="0;0;1;1"
      path="M83,170 L366,170 L366,132 L466,132 L466,154 L554,154 L554,218"/>
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

## 무엇을 정했나

무엇을 썼는지는 위 그림에 있습니다. 여기서는 **왜 그렇게 정했는지**를 만든 순서대로 적었습니다.

<div class="hl-list" markdown="0">

  <section class="hl-item">
    <div class="hl-item-head">
      <span class="hl-tag">클러스터</span>
      <h3>기본으로 주는 것을 끄고 직접 골랐다</h3>
      <dl class="hl-stats">
        <div><dt>3대</dt><dd>VM — 전부 control-plane 겸 워커</dd></div>
        <div><dt>10장</dt><dd>워크로드마다 따로 자른 정적 PV</dd></div>
      </dl>
    </div>
    <div class="hl-item-body">
      <p>k3s가 얹어 주는 네트워크·로드밸런서·인그레스를 전부 끄고 Calico·MetalLB·Traefik으로 바꿨습니다. 설정을 남이 쥐고 있으면 나중에 부하를 재도 손댈 곳이 없습니다.</p>
      <ul>
        <li>디스크는 워크로드마다 따로 잘라 정적 PV로 — 한 볼륨을 나눠 쓰면 누가 채웠는지가 지표에 안 남는다</li>
        <li>kubelet이 쓸 몫은 짐작 대신 실측해서 예약</li>
      </ul>
    </div>
  </section>

  <section class="hl-item">
    <div class="hl-item-head">
      <span class="hl-tag">배포</span>
      <h3>미는 대신 당겨가게 했다</h3>
      <dl class="hl-stats">
        <div><dt>3초</dt><dd>push 에서 클러스터 반영까지</dd></div>
        <div><dt>46초</dt><dd>파이프라인 — 캐시 정리 전 6분 6초</dd></div>
      </dl>
    </div>
    <div class="hl-item-body">
      <p>배포 도구에 클러스터 자격을 쥐여 주는 대신, 클러스터가 저장소를 당겨가게 했습니다. 자격이 밖으로 나가지 않고, 저장소의 상태가 곧 클러스터의 상태가 됩니다.</p>
      <ul>
        <li>이미지 태그는 커밋마다 새 값 — 같은 태그를 덮어쓰면 무엇이 도는지 모르고 되돌릴 수도 없다</li>
        <li>검사·빌드·보안 스캔을 통과해야 배포까지 간다</li>
      </ul>
    </div>
  </section>

  <section class="hl-item">
    <div class="hl-item-head">
      <span class="hl-tag">관측</span>
      <h3>재기 전에 볼 눈부터 만들었다</h3>
      <dl class="hl-stats">
        <div><dt>0건</dt><dd>중복 수집을 걷어낸 뒤 지표 거절</dd></div>
        <div><dt>3축</dt><dd>지표·로그·트레이스를 한 화면에서</dd></div>
      </dl>
    </div>
    <div class="hl-item-body">
      <p>부하를 걸기 전에 지표·로그·트레이스를 먼저 세웠습니다. 볼 눈이 없으면 "느렸다"까지만 알고 어디서 느렸는지는 못 잡습니다.</p>
      <ul>
        <li>시리즈가 상한에 차던 원인은 같은 프로세스를 두 곳에서 중복 수집한 것</li>
        <li>노드 메모리 패널이 층이 다른 값을 섞어 빼고 있었다 — 화면이 먼저 틀린다</li>
      </ul>
    </div>
  </section>

  <section class="hl-item">
    <div class="hl-item-head">
      <span class="hl-tag">서비스와 용량</span>
      <h3>정원은 정한 게 아니라 잰 값이다</h3>
      <dl class="hl-stats">
        <div><dt>34회</dt><dd>부하 판</dd></div>
        <div><dt>1,000명</dt><dd>확정한 동시 입장 정원</dd></div>
        <div><dt>0건</dt><dd>76만 요청에서 나온 5xx</dd></div>
      </dl>
    </div>
    <div class="hl-item-body">
      <p>대기열은 정원만큼만 예매 화면에 들여보냅니다. 그 정원을 몇으로 둘지가 이 서비스의 전부인데, 처음엔 근거 없이 적어 둔 숫자였습니다. 판을 거듭할수록 막히는 자리가 앞에서 뒤로 옮겨 갔습니다.</p>
      <div class="hl-chain">
        <span>프록시 메모리</span><i>→</i><span>대기열 CPU</span><i>→</i><span>DB 커넥션 풀</span><i>→</i><span>캐시 폭주</span>
      </div>
      <ul>
        <li>값 대신 <b>계수</b>를 남겼다. 사람이 늘면 무엇이 얼마나 느는지를 알아야 다음 규모를 계산한다</li>
        <li>회차 한 번 조회에 Redis를 스무 번 왕복하던 것은 트레이스가 아니었으면 못 찾았다</li>
      </ul>
    </div>
  </section>

  <section class="hl-item">
    <div class="hl-item-head">
      <span class="hl-tag">격리와 공개</span>
      <h3>열되, 열린 자리를 세어 두었다</h3>
      <dl class="hl-stats">
        <div><dt>2개</dt><dd>인터넷에 열린 포트 — 443 과 51820</dd></div>
        <div><dt>16줄</dt><dd>허용한 파드 간 통로, 나머지는 차단</dd></div>
      </dl>
    </div>
    <div class="hl-item-body">
      <p>공개하기 전에 클러스터를 방화벽 뒤 격리망으로 옮겼습니다. 관리 화면과 공개 서비스가 한 주소에 같이 있어서, 그대로 열면 둘이 같이 열립니다.</p>
      <ul>
        <li>관리 통로는 VPN 하나. 키가 없으면 응답조차 하지 않아 문이 있다는 것도 밖에서는 안 보인다</li>
        <li>공개 쪽은 Cloudflare를 거친 요청만 받는다 — 집 주소를 알아도 우회로는 못 들어온다</li>
        <li>격리망 안쪽도 파드끼리 통로를 하나씩 지정하고 나머지는 막았다</li>
      </ul>
    </div>
  </section>

</div>

<!-- ③ 기록 -->

## 기록

시작한 날부터 편별로 블로그에 남기고 있습니다. 명령과 결과만이 아니라 막힌 곳과 틀린 판단까지 그대로 적었습니다 —
램이 모자란 줄 알고 주문을 넣었다가 원인이 다른 데 있어 취소한 일, 대시보드 숫자가 층이 다른 값을 섞어 빼고 있던 일 같은 것들입니다.

* [HomeLab 시리즈](https://zed6740.tistory.com/category/HomeLab) — 왜 온프렘인지부터 인터넷 공개까지
