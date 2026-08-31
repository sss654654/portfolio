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

<!-- 층 그림 — 아래(물리)부터 층이 쌓이고, 요청 점이 사용자→Cloudflare→집→클러스터로 흐른다.
     prefers-reduced-motion 이면 정지 상태로 전부 표시 -->
<figure class="hl-diagram" markdown="0">
<svg viewBox="0 0 680 436" role="img" aria-label="노트북 한 대 위에 Proxmox, VM 3대, k3s 클러스터가 층으로 쌓이고 사용자 요청이 Cloudflare를 거쳐 들어오는 구조">
  <defs>
    <marker id="hl-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".55"/>
    </marker>
  </defs>

  <!-- 물리 층 -->
  <g class="hl-l hl-l1">
    <rect x="40" y="384" width="600" height="44" rx="8" class="hl-box hl-phys"/>
    <text x="60" y="411" class="hl-t">노트북 1대 — 물리 서버</text>
    <text x="620" y="411" class="hl-t hl-dim" text-anchor="end">외장 SSD 부팅 · 07:30–23:30 가동</text>
  </g>

  <!-- 하이퍼바이저 층 -->
  <g class="hl-l hl-l2">
    <rect x="40" y="334" width="600" height="42" rx="8" class="hl-box"/>
    <text x="60" y="360" class="hl-t">Proxmox VE — 하이퍼바이저</text>
  </g>

  <!-- VM 층 -->
  <g class="hl-l hl-l3">
    <rect x="40"  y="268" width="188" height="58" rx="8" class="hl-box"/>
    <rect x="246" y="268" width="188" height="58" rx="8" class="hl-box"/>
    <rect x="452" y="268" width="188" height="58" rx="8" class="hl-box"/>
    <text x="134" y="293" class="hl-t" text-anchor="middle">VM · k3s-1</text>
    <text x="340" y="293" class="hl-t" text-anchor="middle">VM · k3s-2</text>
    <text x="546" y="293" class="hl-t" text-anchor="middle">VM · k3s-3</text>
    <text x="134" y="313" class="hl-t hl-dim" text-anchor="middle">etcd · 8GB</text>
    <text x="340" y="313" class="hl-t hl-dim" text-anchor="middle">etcd · 8GB</text>
    <text x="546" y="313" class="hl-t hl-dim" text-anchor="middle">etcd · 8GB</text>
  </g>

  <!-- 클러스터 층 -->
  <g class="hl-l hl-l4">
    <rect x="40" y="118" width="600" height="142" rx="8" class="hl-box hl-cluster"/>
    <text x="60" y="144" class="hl-t">k3s 클러스터 — HA(embedded etcd) 3노드</text>
    <g class="hl-chips">
      <rect x="60"  y="160" width="96"  height="30" rx="15"/><text x="108" y="180" text-anchor="middle">traefik</text>
      <rect x="166" y="160" width="150" height="30" rx="15"/><text x="241" y="180" text-anchor="middle">queue · booking</text>
      <rect x="326" y="160" width="184" height="30" rx="15"/><text x="418" y="180" text-anchor="middle">Redis · MySQL · Kafka</text>
      <rect x="60"  y="200" width="140" height="30" rx="15"/><text x="130" y="220" text-anchor="middle">ArgoCD — GitOps</text>
      <rect x="210" y="200" width="130" height="30" rx="15"/><text x="275" y="220" text-anchor="middle">LGTM — 관측</text>
      <rect x="350" y="200" width="160" height="30" rx="15"/><text x="430" y="220" text-anchor="middle">NetworkPolicy 16줄</text>
    </g>
  </g>

  <!-- 인터넷 층 -->
  <g class="hl-l hl-l5">
    <rect x="40" y="18" width="100" height="36" rx="18" class="hl-box"/>
    <text x="90" y="41" class="hl-t" text-anchor="middle">사용자</text>
    <line x1="140" y1="36" x2="218" y2="36" class="hl-line" marker-end="url(#hl-arrow)"/>
    <rect x="222" y="18" width="130" height="36" rx="18" class="hl-box"/>
    <text x="287" y="41" class="hl-t" text-anchor="middle">Cloudflare</text>
    <line x1="352" y1="36" x2="430" y2="36" class="hl-line" marker-end="url(#hl-arrow)"/>
    <rect x="434" y="18" width="206" height="36" rx="18" class="hl-box"/>
    <text x="537" y="41" class="hl-t" text-anchor="middle">공유기 · OPNsense 방화벽</text>
    <line x1="537" y1="54" x2="537" y2="112" class="hl-line" marker-end="url(#hl-arrow)"/>
    <text x="548" y="90" class="hl-t hl-dim">TLS · 443</text>
  </g>

  <!-- 흐르는 요청 점 -->
  <circle class="hl-dot" r="5">
    <animateMotion dur="3.6s" begin="2.2s" repeatCount="indefinite"
      path="M90,36 L287,36 L537,36 L537,130 L340,130 L340,160"/>
  </circle>
</svg>
<figcaption>노트북 한 대가 인터넷 공개 서비스가 되기까지의 층 — 전부 직접 구성</figcaption>
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
