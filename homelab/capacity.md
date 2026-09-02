---
layout: page
title: 서비스와 용량
description: >
  대기열과 예매를 두 서비스로 나눠 세우고, 부하를 걸어 정원·자원 스펙을 실측으로 정했습니다
permalink: /homelab/capacity/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

앱 세 종은 이미 돌고 있었습니다 — 다만 정원도, 커넥션 풀도, 메모리 상한도
**재 보고 넣은 값이 아니었습니다.**

## 서비스 구조

예매 오픈에 몰리는 사람을 **줄 세우는 쪽(queue)**과 **표를 파는 쪽(booking)**으로 나눴습니다.
둘을 잇는 값이 하나 있습니다 — 동시에 몇 명을 들여보낼지, `정원`입니다.

<!-- 위에서 아래로 흐르되 게이트가 booking 앞에 놓이는 그림. 게이트는 별도 컴포넌트가 아니라
     booking 이 요청마다 확인하는 검문이라 booking 박스 상단 띠로 그린다.
     저장소 셋의 배치가 곧 분리 근거다 — Redis 공유 · MySQL 전용 · Kafka 계약. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<svg viewBox="0 0 760 384" role="img" aria-label="traefik이 브라우저 연결을 전부 받고, 그 아래 queue·booking·frontend 파드가 놓인다. booking 앞에는 입장 인증을 확인하는 게이트 띠가 있고, 아래에 두 서비스가 공유하는 Redis, booking 전용 MySQL, 두 서비스를 잇는 Kafka가 있다">
  <defs>
    <marker id="hlq-n" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/></marker>
  </defs>

  <!-- traefik — 브라우저를 클러스터에서 처음 받는 자리 -->
  <rect class="hla-box" x="30" y="26" width="706" height="54" rx="5"/>
  <image href="/assets/img/icons/traefikproxy.svg" x="44" y="38" width="20" height="20"/>
  <text class="hla-t" x="74" y="53">traefik · 3대</text>
  <text class="hla-s" x="44" y="72">브라우저에서 온 연결이 전부 여기 열려 있다 — 뒤로는 쓰던 소켓을 돌려 쓴다</text>

  <line class="hla-ln" x1="165" y1="80" x2="165" y2="104" marker-end="url(#hlq-n)"/>
  <text class="hla-a" x="175" y="98">줄서기 · 순번</text>
  <line class="hla-ln" x1="475" y1="80" x2="475" y2="104" marker-end="url(#hlq-n)"/>
  <text class="hla-a" x="485" y="98">좌석 · 확정</text>
  <line class="hla-ln" x1="688" y1="80" x2="688" y2="104" marker-end="url(#hlq-n)"/>

  <!-- queue -->
  <rect class="hla-box" x="30" y="106" width="270" height="72" rx="5"/>
  <text class="hla-t" x="44" y="130">queue · 4대</text>
  <text class="hla-s2" x="44" y="151">줄 세우기 · 순번 · 승격</text>
  <text class="hla-s2" x="44" y="169">파드에 사람을 안 담는다 — 상태가 전부 Redis에</text>

  <!-- booking — 상단 띠가 게이트 -->
  <rect class="hla-box" x="340" y="106" width="270" height="72" rx="5"/>
  <path d="M340 111 a5 5 0 0 1 5 -5 h260 a5 5 0 0 1 5 5 v17 h-270 z" fill="#2f6fdb" fill-opacity=".09" stroke="#2f6fdb" stroke-opacity=".45"/>
  <text class="hla-a" x="352" y="122" fill="#2f6fdb">게이트 — 좌석·확정 요청마다 입장 인증을 확인한다</text>
  <text class="hla-t" x="354" y="152">booking · 1대</text>
  <text class="hla-s2" x="354" y="170">좌석 고르기 · 예매 확정</text>

  <!-- frontend -->
  <rect class="hla-box" x="640" y="106" width="96" height="72" rx="5"/>
  <text class="hla-t" x="652" y="130">frontend</text>
  <text class="hla-s2" x="652" y="151">로비 화면</text>
  <text class="hla-s2" x="652" y="169">정적 서빙</text>

  <line class="hla-ln" x1="165" y1="178" x2="165" y2="206" marker-end="url(#hlq-n)"/>
  <line class="hla-ln" x1="475" y1="178" x2="475" y2="206" marker-end="url(#hlq-n)"/>
  <line class="hla-ln" x1="590" y1="178" x2="590" y2="206" marker-end="url(#hlq-n)"/>

  <!-- Redis — 두 서비스가 같이 쓴다 -->
  <rect class="hla-box" x="86" y="210" width="458" height="56" rx="5"/>
  <image href="/assets/img/icons/redis.svg" x="100" y="222" width="18" height="18"/>
  <text class="hla-t" x="126" y="237">Redis · 3노드</text>
  <text class="hla-s2" x="100" y="257">대기열 · 좌석 잠금 · 입장 인증 — 두 서비스가 같은 인스턴스를 쓴다</text>

  <!-- MySQL — booking 전용 -->
  <rect class="hla-box" x="570" y="210" width="166" height="56" rx="5"/>
  <image href="/assets/img/icons/mysql.svg" x="584" y="222" width="18" height="18"/>
  <text class="hla-t" x="610" y="237">MySQL · 1대</text>
  <text class="hla-s2" x="584" y="257">예매 기록 — booking만</text>

  <!-- Kafka — 두 서비스의 계약. 파드 하단에서 좌우 통로로 내려온다 -->
  <polyline class="hla-ln" points="60,178 60,326 82,326" fill="none" marker-end="url(#hlq-n)"/>
  <polyline class="hla-ln" points="556,178 556,326 548,326" fill="none" marker-end="url(#hlq-n)"/>
  <rect class="hla-box" x="86" y="290" width="458" height="72" rx="5"/>
  <image href="/assets/img/icons/apachekafka.svg" x="100" y="302" width="18" height="18"/>
  <text class="hla-t" x="126" y="317">Kafka · 3브로커</text>
  <text class="hla-s2" x="100" y="337">queue → booking &#160; admissions 입장 승인 · admissions-revoked 입장 회수</text>
  <text class="hla-s2" x="100" y="354">booking → queue &#160; bookings-completed 자리 반환</text>
</svg>
<figcaption>게이트는 booking이 요청마다 확인하는 검문입니다 — queue가 승격시킨 사람만 좌석 화면으로
넘어갑니다. 저장소 셋의 자리가 곧 두 서비스를 나눈 근거입니다.</figcaption>
</figure>
