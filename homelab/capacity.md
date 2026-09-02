---
layout: page
title: 서비스와 용량
description: >
  대기열과 예매를 두 서비스로 나눠 세우고, 부하를 걸어 정원·자원 스펙을 실측으로 정했습니다
permalink: /homelab/capacity/
---

<p class="hl-back" markdown="0"><a href="/homelab/">← 홈랩</a></p>

`cgv-onprem`에 머지하면 이미지가 클러스터에 자동으로 반영됩니다. 다만 그 파드에 적어 둔
정원·커넥션 풀·메모리 상한은 **재 보지 않은 값**이었고, 지표와 트레이스를 앱에 심어
부하를 걸고서야 정해졌습니다.

## 서비스 구조

예매 오픈에 몰리는 사람을 **줄 세우는 쪽(queue)**과 **표를 파는 쪽(booking)**으로 나눴습니다.
둘을 잇는 값이 하나 있습니다 — 동시에 몇 명을 들여보낼지, `정원`입니다.

<!-- 두 서비스는 서로를 직접 부르지 않는다 — 가운데 Redis(상태)와 Kafka(사건)로만 만난다.
     그래서 가운데 열이 그림의 본체이고, 대기열의 실제 자료구조(줄 ZSet · 정원 ZSet)를
     칸으로 그린다. 승격 = 줄 앞에서 빈 칸 수만큼 꺼내 옮기는 동작이라 그 모양이 그대로 보인다. -->
<figure class="hl-diagram hl-diagram-lg" markdown="0">
<svg viewBox="0 0 760 386" role="img" aria-label="traefik이 브라우저 연결을 받고, 왼쪽 queue와 오른쪽 booking이 가운데 Redis의 자료구조를 통해서만 만난다. Redis 안에는 선착순 줄과 정원 슬롯이 칸으로 그려져 있고, 승격은 줄 앞에서 빈 칸 수만큼 꺼내 옮긴다. 아래 Kafka가 두 서비스의 사건을 나르고 booking만 MySQL에 쓴다">
  <defs>
    <marker id="hlq-n" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".5"/></marker>
    <marker id="hlq-s" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="currentColor" opacity=".55"/></marker>
  </defs>

  <!-- traefik — 브라우저를 클러스터에서 처음 받는 자리 -->
  <rect class="hla-box" x="24" y="20" width="712" height="46" rx="5"/>
  <image href="/assets/img/icons/traefikproxy.svg" x="38" y="30" width="18" height="18"/>
  <text class="hla-t" x="66" y="44">traefik · 3대</text>
  <text class="hla-s" x="160" y="44">브라우저 연결이 전부 여기 열려 있다 — 뒤로는 쓰던 소켓을 돌려 쓴다</text>

  <line class="hla-ln" x1="120" y1="66" x2="120" y2="92" marker-end="url(#hlq-n)"/>
  <text class="hla-a" x="128" y="86">순번 폴링</text>
  <line class="hla-ln" x1="636" y1="66" x2="636" y2="92" marker-end="url(#hlq-n)"/>
  <text class="hla-a" x="644" y="86">좌석 · 확정</text>

  <!-- queue — 상태를 안 들고 Redis 만 만진다 -->
  <rect class="hla-box" x="24" y="94" width="200" height="152" rx="5"/>
  <text class="hla-t" x="38" y="118">queue · 4대</text>
  <text class="hla-s2" x="38" y="140">순번 조회 — 한 번에 세 판정</text>
  <text class="hla-s2" x="38" y="157">(입장했나 · 몇 번째인가 · 나갔나)</text>
  <text class="hla-s2" x="38" y="180">승격 루프 — 빈자리만큼 꺼낸다</text>
  <text class="hla-s2" x="38" y="203">배경 루프 넷 — 승격 · 세션 만료</text>
  <text class="hla-s2" x="38" y="219">· 대기 이탈 · 못 보낸 것 재발행</text>
  <text class="hla-a" x="38" y="238">사람을 파드에 안 담는다</text>

  <!-- Redis — 두 서비스가 만나는 자리. 자료구조를 칸으로 -->
  <rect class="hla-box" x="244" y="94" width="272" height="152" rx="5"/>
  <image href="/assets/img/icons/redis.svg" x="256" y="104" width="16" height="16"/>
  <text class="hla-t" x="280" y="117">Redis · 3노드</text>
  <text class="hla-a" x="392" y="117">두 서비스의 공유 상태</text>

  <text class="hla-s2" x="256" y="139">줄 — 들어온 순서대로</text>
  <g>
    <rect x="256" y="145" width="17" height="13" rx="2" fill="currentColor" fill-opacity=".38"/>
    <rect x="276" y="145" width="17" height="13" rx="2" fill="currentColor" fill-opacity=".38"/>
    <rect x="296" y="145" width="17" height="13" rx="2" fill="currentColor" fill-opacity=".38"/>
    <rect class="hla-inner" x="316" y="145" width="17" height="13" rx="2"/>
    <rect class="hla-inner" x="336" y="145" width="17" height="13" rx="2"/>
    <rect class="hla-inner" x="356" y="145" width="17" height="13" rx="2"/>
    <rect class="hla-inner" x="376" y="145" width="17" height="13" rx="2"/>
    <rect class="hla-inner" x="396" y="145" width="17" height="13" rx="2"/>
    <rect class="hla-inner hla-dash" x="416" y="145" width="17" height="13" rx="2"/>
    <rect class="hla-inner hla-dash" x="436" y="145" width="17" height="13" rx="2"/>
  </g>
  <text class="hla-a" x="460" y="156">뒤로 쌓임</text>

  <line class="hla-ln" x1="264" y1="160" x2="264" y2="176" marker-end="url(#hlq-s)"/>
  <text class="hla-a" x="276" y="173">앞에서 빈 칸 수만큼 옮긴다</text>

  <text class="hla-s2" x="256" y="194">정원 — 동시에 예매할 수 있는 자리</text>
  <g>
    <rect x="256" y="200" width="15" height="13" rx="2" fill="currentColor" fill-opacity=".38"/>
    <rect x="274" y="200" width="15" height="13" rx="2" fill="currentColor" fill-opacity=".38"/>
    <rect x="292" y="200" width="15" height="13" rx="2" fill="currentColor" fill-opacity=".38"/>
    <rect x="310" y="200" width="15" height="13" rx="2" fill="currentColor" fill-opacity=".38"/>
    <rect x="328" y="200" width="15" height="13" rx="2" fill="currentColor" fill-opacity=".38"/>
    <rect x="346" y="200" width="15" height="13" rx="2" fill="currentColor" fill-opacity=".38"/>
    <rect class="hla-inner" x="364" y="200" width="15" height="13" rx="2"/>
    <rect class="hla-inner" x="382" y="200" width="15" height="13" rx="2"/>
  </g>
  <text class="hla-a" x="406" y="211">빈 칸 = 다음에 들어갈 수</text>

  <text class="hla-s2" x="256" y="233">입장 인증 · 좌석 점유 — 둘 다 시간이 지나면 저절로 풀린다</text>

  <!-- booking — 상단 띠가 게이트 -->
  <rect class="hla-box" x="536" y="94" width="200" height="152" rx="5"/>
  <path d="M536 99 a5 5 0 0 1 5 -5 h190 a5 5 0 0 1 5 5 v19 h-200 z" fill="#2f6fdb" fill-opacity=".09" stroke="#2f6fdb" stroke-opacity=".45"/>
  <text class="hla-a" x="548" y="112" fill="#2f6fdb">게이트 — 요청마다 인증을 확인</text>
  <text class="hla-t" x="550" y="140">booking · 1대</text>
  <text class="hla-s2" x="550" y="162">좌석 선점 → 결제 → 확정</text>
  <text class="hla-s2" x="550" y="185">같은 파드가 Kafka 소비도 한다</text>
  <text class="hla-s2" x="550" y="208">커넥션 풀 — 동시에 던지는 질의 수</text>
  <text class="hla-a" x="550" y="232">한 대로 둔다 — 정원이 부하를 정한다</text>

  <line class="hla-ln" x1="226" y1="170" x2="240" y2="170" marker-end="url(#hlq-s)"/>
  <line class="hla-ln" x1="534" y1="170" x2="520" y2="170" marker-end="url(#hlq-s)"/>

  <!-- Kafka — 두 서비스는 서로를 직접 안 부른다 -->
  <polyline class="hla-ln" points="90,246 90,308 116,308" fill="none" marker-end="url(#hlq-n)"/>
  <polyline class="hla-ln" points="596,246 596,308 584,308" fill="none" marker-end="url(#hlq-n)"/>
  <rect class="hla-box" x="120" y="266" width="460" height="94" rx="5"/>
  <image href="/assets/img/icons/apachekafka.svg" x="134" y="277" width="16" height="16"/>
  <text class="hla-t" x="158" y="290">Kafka · 3브로커</text>
  <text class="hla-a" x="270" y="290">서로를 직접 부르지 않는다 — 한쪽이 죽어도 남는다</text>
  <text class="hla-s2" x="134" y="313">admissions</text>
  <text class="hla-a" x="250" y="313">queue → booking &#160; 방금 입장시킨 사람</text>
  <text class="hla-s2" x="134" y="333">admissions-revoked</text>
  <text class="hla-a" x="250" y="333">queue → booking &#160; 자리를 거뒀다</text>
  <text class="hla-s2" x="134" y="353">bookings-completed</text>
  <text class="hla-a" x="250" y="353">booking → queue &#160; 예매가 끝나 자리가 빈다</text>

  <!-- MySQL — booking 만 쓴다 -->
  <line class="hla-ln" x1="668" y1="246" x2="668" y2="264" marker-end="url(#hlq-n)"/>
  <rect class="hla-box" x="600" y="266" width="136" height="66" rx="5"/>
  <image href="/assets/img/icons/mysql.svg" x="614" y="277" width="16" height="16"/>
  <text class="hla-t" x="638" y="290">MySQL · 1대</text>
  <text class="hla-s2" x="614" y="311">예매 기록</text>
  <text class="hla-a" x="614" y="326">같은 좌석 두 번은 못 들어간다</text>
</svg>
<figcaption>두 서비스는 서로를 직접 부르지 않습니다 — 가운데 Redis에 상태를 두고, 서로 알려야 할
일은 Kafka로 보냅니다. 승격은 줄 앞에서 정원의 빈 칸 수만큼 꺼내 옮기는 동작이고,
그 수가 뒤쪽 부하 전부를 정합니다.</figcaption>
</figure>
