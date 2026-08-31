---
layout: page
title: 홈랩
description: >
  노트북 한 대로 시작해 인터넷 공개까지 — k3s 클러스터를 직접 구축하고 운영한 기록
permalink: /homelab/
---

<!-- ① 개요 블록 — 두세 문장 + 층 그림(SVG 애니메이션) + 핵심 숫자 한 줄 -->

노트북 한 대를 Proxmox로 갈라 VM 3대에 k3s 클러스터를 세우고,
그 위에 예매 대기열 서비스를 올려 [인터넷에 공개](https://ticket.subinhong.dev)했습니다.
구축·배포·관측·부하 실측·보안까지 전 구간을 직접 설계하고 운영합니다.

<!-- 배선도 — 실제 토폴로지 그대로. 세 흐름(사용자·관리자 VPN·GitOps)이 전부
     노트북 안 OPNsense VM(세로 벽)을 지난다. 점 셋이 시차를 두고 순환.
     아이콘 = simple-icons(CC0), assets/img/icons/. prefers-reduced-motion 이면 정지 -->
<figure class="hl-diagram" markdown="0">
<svg viewBox="0 0 760 470" role="img" aria-label="사용자는 Cloudflare와 공유기를 거쳐, 관리자는 WireGuard로, 배포는 GitLab에서 — 세 흐름이 모두 노트북 안 OPNsense 방화벽 VM을 지나 k3s 클러스터에 닿는 구조">
  <defs>
    <marker id="hla-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/>
    </marker>
  </defs>

  <!-- 구역 라벨과 경계 -->
  <g class="hla-g hla-g1">
    <text x="150" y="30" class="hla-zone" text-anchor="middle">인터넷</text>
    <text x="520" y="30" class="hla-zone" text-anchor="middle">우리 집</text>
    <line x1="294" y1="38" x2="294" y2="446" class="hla-ln hla-dash" style="opacity:.35"/>
  </g>

  <!-- 인터넷 쪽: 사용자 · Cloudflare -->
  <g class="hla-g hla-g1">
    <rect x="20" y="48" width="118" height="48" rx="9" class="hla-box"/>
    <circle cx="38" cy="65" r="5.5" class="hla-glyph"/>
    <path d="M27,84 C27,73 49,73 49,84" class="hla-glyph"/>
    <text x="58" y="69" class="hla-t">사용자</text>
    <text x="58" y="84" class="hla-s">브라우저 · HTTPS</text>
    <line x1="138" y1="72" x2="156" y2="72" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <rect x="158" y="48" width="126" height="48" rx="9" class="hla-box"/>
    <image href="/assets/img/icons/cloudflare.svg" x="168" y="61" width="22" height="22"/>
    <text x="197" y="69" class="hla-t">Cloudflare</text>
    <text x="197" y="84" class="hla-s">TLS · IP 은닉</text>
  </g>

  <!-- 관리자 · 데스크탑 -->
  <g class="hla-g hla-g1">
    <rect x="20" y="196" width="126" height="48" rx="9" class="hla-box"/>
    <image href="/assets/img/icons/wireguard.svg" x="30" y="209" width="20" height="20"/>
    <text x="57" y="216" class="hla-t">나 — 관리자</text>
    <text x="57" y="231" class="hla-s">밖에서 접속할 때</text>
    <rect x="20" y="330" width="134" height="52" rx="9" class="hla-box"/>
    <image href="/assets/img/icons/gitlab.svg" x="30" y="345" width="20" height="20"/>
    <text x="57" y="350" class="hla-t">데스크탑</text>
    <text x="57" y="365" class="hla-s">GitLab · CI · 레지스트리</text>
  </g>

  <!-- 집: 공유기 -->
  <g class="hla-g hla-g2">
    <rect x="308" y="48" width="96" height="48" rx="9" class="hla-box"/>
    <rect x="317" y="66" width="22" height="11" rx="2" class="hla-glyph"/>
    <line x1="322" y1="66" x2="319" y2="56" class="hla-glyph"/>
    <line x1="334" y1="66" x2="337" y2="56" class="hla-glyph"/>
    <text x="347" y="69" class="hla-t">공유기</text>
    <text x="347" y="84" class="hla-s">443 · 51820만</text>
    <line x1="284" y1="72" x2="306" y2="72" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <line x1="404" y1="72" x2="442" y2="72" class="hla-ln" marker-end="url(#hla-arrow)"/>
  </g>

  <!-- 노트북 상자 -->
  <g class="hla-g hla-g3">
    <rect x="430" y="40" width="318" height="402" rx="12" class="hla-outer"/>
    <image href="/assets/img/icons/proxmox.svg" x="444" y="53" width="18" height="18"/>
    <text x="469" y="67" class="hla-t">노트북 1대 — Proxmox · 전부 VM</text>

    <!-- OPNsense 세로 벽 -->
    <rect x="444" y="84" width="44" height="340" rx="8" class="hla-wall"/>
    <image href="/assets/img/icons/opnsense.svg" x="455" y="94" width="22" height="22"/>
    <text transform="rotate(-90 466 268)" x="466" y="272" text-anchor="middle" class="hla-wallt">OPNsense — 방화벽 VM · 모든 길이 여길 지난다</text>

    <!-- k3s 클러스터 -->
    <rect x="504" y="84" width="234" height="252" rx="10" class="hla-inner"/>
    <image href="/assets/img/icons/kubernetes.svg" x="514" y="95" width="18" height="18"/>
    <text x="539" y="109" class="hla-t">k3s 클러스터 — VM 3대 · HA</text>

    <rect x="514" y="124" width="96" height="32" rx="16" class="hla-box"/>
    <image href="/assets/img/icons/traefikproxy.svg" x="523" y="131" width="18" height="18"/>
    <text x="546" y="145" class="hla-c">Traefik</text>
    <line x1="610" y1="140" x2="626" y2="140" class="hla-ln" marker-end="url(#hla-arrow)"/>
    <rect x="628" y="124" width="100" height="32" rx="16" class="hla-box"/>
    <text x="678" y="145" class="hla-c" text-anchor="middle">queue · booking</text>
    <line x1="678" y1="156" x2="678" y2="168" class="hla-ln" marker-end="url(#hla-arrow)"/>

    <rect x="514" y="170" width="66" height="32" rx="16" class="hla-box"/>
    <image href="/assets/img/icons/redis.svg" x="521" y="177" width="17" height="17"/>
    <text x="542" y="191" class="hla-c">Redis</text>
    <rect x="588" y="170" width="72" height="32" rx="16" class="hla-box"/>
    <image href="/assets/img/icons/mysql.svg" x="595" y="177" width="17" height="17"/>
    <text x="616" y="191" class="hla-c">MySQL</text>
    <rect x="668" y="170" width="64" height="32" rx="16" class="hla-box"/>
    <image href="/assets/img/icons/apachekafka.svg" x="674" y="177" width="17" height="17"/>
    <text x="694" y="191" class="hla-c">Kafka</text>

    <rect x="514" y="216" width="96" height="32" rx="16" class="hla-box"/>
    <image href="/assets/img/icons/argo.svg" x="522" y="223" width="18" height="18"/>
    <text x="545" y="237" class="hla-c">ArgoCD</text>
    <rect x="628" y="216" width="100" height="32" rx="16" class="hla-box"/>
    <image href="/assets/img/icons/grafana.svg" x="636" y="223" width="18" height="18"/>
    <text x="659" y="237" class="hla-c">LGTM 관측</text>

    <text x="514" y="272" class="hla-s">NetworkPolicy 16줄 · SealedSecrets · RBAC</text>
    <text x="514" y="288" class="hla-s">— 격리망 안쪽도 잠금</text>
    <text x="514" y="312" class="hla-s">관리 UI(ArgoCD·Grafana)는 VPN으로만</text>

    <text x="506" y="368" class="hla-s">배포는 클러스터가 당겨간다</text>
    <text x="506" y="384" class="hla-s">git push → 3초 내 반영</text>
  </g>

  <!-- 흐름선: VPN · GitOps -->
  <g class="hla-g hla-g2">
    <line x1="146" y1="220" x2="442" y2="220" class="hla-ln hla-dash" marker-end="url(#hla-arrow)"/>
    <text x="290" y="212" class="hla-s" text-anchor="middle">WireGuard 51820/UDP · 키 인증</text>
    <line x1="154" y1="358" x2="494" y2="358" class="hla-ln hla-dash" marker-end="url(#hla-arrow)"/>
    <text x="300" y="350" class="hla-s" text-anchor="middle">코드 push → CI → 이미지 → ArgoCD pull</text>
  </g>

  <!-- 흐르는 점 셋 — 12초 한 바퀴를 셋이 순서대로 나눠 쓴다 (한 사이클 돌고 사라지고 다음) -->
  <circle class="hla-dot hla-dot-u" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.05;0.33;1" keyPoints="0;0;1;1"
      path="M70,72 L221,72 L356,72 L466,72 L466,140 L562,140 L678,140 L678,186"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.05;0.07;0.31;0.33;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-v" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.40;0.60;1" keyPoints="0;0;1;1"
      path="M83,220 L466,220 L466,232 L562,232"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.40;0.42;0.58;0.60;1" values="0;0;1;1;0;0"/>
  </circle>
  <circle class="hla-dot hla-dot-g" r="4.5" opacity="0">
    <animateMotion dur="12s" begin="1.2s" repeatCount="indefinite" calcMode="linear"
      keyTimes="0;0.68;0.93;1" keyPoints="0;0;1;1"
      path="M87,358 L466,358 L466,232 L562,232"/>
    <animate attributeName="opacity" dur="12s" begin="1.2s" repeatCount="indefinite"
      keyTimes="0;0.68;0.70;0.91;0.93;1" values="0;0;1;1;0;0"/>
  </circle>

  <!-- 범례 -->
  <g class="hla-g hla-g3">
    <circle cx="30" cy="458" r="4.5" fill="#e03131"/>
    <text x="41" y="462" class="hla-s">사용자 요청</text>
    <circle cx="140" cy="458" r="4.5" fill="#2f6fdb"/>
    <text x="151" y="462" class="hla-s">관리자 VPN</text>
    <circle cx="250" cy="458" r="4.5" fill="#f08c2e"/>
    <text x="261" y="462" class="hla-s">GitOps 배포</text>
  </g>
</svg>
<figcaption>ticket.subinhong.dev 로 들어오는 세 갈래 — 사용자도, 관리자도, 배포도 전부 한 방화벽을 지난다</figcaption>
</figure>

<p class="hl-numbers" markdown="0">k3s 3노드 · 부하 판 34회 · 동시 입장 1,000명 실측 · 76만 요청 5xx 0건</p>

<!-- ② 하위 프로젝트 카드 그리드 — 자리표시. 실제 분리는 블로그 폴더 마크다운 전체를 기준으로
     백지에서 정한다 (기존 골격·가안에 갇히지 않기) -->

## 무엇을 했나

<p class="hl-note" markdown="0">아래 카드는 자리표시입니다 — 프로젝트 분리는 별도 작업에서 확정합니다.</p>

<div class="hl-cards" markdown="0">
  <div class="hl-card">
    <h3>프로젝트 이름</h3>
    <p>한 줄 설명이 들어갈 자리 — 무엇을 왜 했고 어떻게 확인했는지</p>
    <span class="hl-num">대표 숫자 자리</span>
  </div>
  <div class="hl-card">
    <h3>프로젝트 이름</h3>
    <p>한 줄 설명이 들어갈 자리 — 무엇을 왜 했고 어떻게 확인했는지</p>
    <span class="hl-num">대표 숫자 자리</span>
  </div>
  <div class="hl-card">
    <h3>프로젝트 이름</h3>
    <p>한 줄 설명이 들어갈 자리 — 무엇을 왜 했고 어떻게 확인했는지</p>
    <span class="hl-num">대표 숫자 자리</span>
  </div>
  <div class="hl-card">
    <h3>프로젝트 이름</h3>
    <p>한 줄 설명이 들어갈 자리 — 무엇을 왜 했고 어떻게 확인했는지</p>
    <span class="hl-num">대표 숫자 자리</span>
  </div>
</div>

<!-- ③ 기록 블록 -->

## 기록

이 전 과정은 블로그에 13편 + 번외로 남겼습니다 — 명령과 결과만이 아니라,
막힌 곳과 틀린 판단까지 그대로.

* [HomeLab 시리즈](https://zed6740.tistory.com/category/HomeLab) — 구축 1부부터 공개까지
