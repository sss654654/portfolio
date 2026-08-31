---
layout: page
title: 안녕하세요, 홍수빈입니다 👋
sitemap: true
---

지금까지 공부하고 만들어 온 것들을 기록해 둔 공간입니다.
인프라를 세우고, 서비스를 올리고, 부하를 재며 배웁니다.
{:.lead}

## 홈랩 — 지금 돌아가고 있는 것

만든 척이 아니라 **지금 인터넷에 떠 있는 서비스**의 실제 화면입니다.
노트북 한 대 위 쿠버네티스 클러스터가 예매 오픈의 폭주를 대기열로 받아냅니다 —
오픈 → 러시 100명 → 대기 순번 → 예매 완료까지.

<!-- 시연 영상 — 무음 자동 재생 루프, 브라우저 창 목업 프레임. 클릭하면 실서비스로.
     심야(서비스 꺼짐)에도 이 영상이 데모를 대신한다. markdown="0" = kramdown 개입 차단 -->
<div class="demo-frame" markdown="0">
  <div class="demo-chrome">
    <span class="demo-dots"><i></i><i></i><i></i></span>
    <span class="demo-url">ticket.subinhong.dev</span>
  </div>
  <a class="demo-shot" href="https://ticket.subinhong.dev" target="_blank" rel="noopener" aria-label="실서비스로 이동">
    <video autoplay loop muted playsinline preload="metadata" poster="/assets/img/demo-poster.jpg">
      <source src="/assets/video/demo.mp4" type="video/mp4">
    </video>
  </a>
</div>

<div class="demo-stats" markdown="0">
  <span><b>30,000</b>명 동시 접속 실측</span>
  <span><b>0</b>건 5xx / 759,813 요청</span>
  <span><b>34</b>회 부하 테스트</span>
  <span><b>7</b>장 대시보드 관측</span>
</div>

<div class="demo-ctas" markdown="0">
  <a class="primary" href="https://ticket.subinhong.dev" target="_blank" rel="noopener">지금 직접 예매해 보기 →</a>
  <a class="ghost" href="/homelab/">어떻게 만들었는지 →</a>
</div>

<p class="demo-note" markdown="0">서비스는 매일 아침 – 23:30 KST 가동 · 꺼진 시간에는 위 영상이 대신합니다.</p>

## 여기까지 온 길

* **2022.07 – 12** — [LevelDB 캐시 구조 분석](/projects/leveldb/)
  소스 코드를 읽고 변수를 통제해 실측하는 법을 익혔습니다 · KSC 2022 논문 1저자
* <small>2023.08 – 2025.05 — 공군 복무</small>
* **2025.06 – 09** — [CJ 올리브네트웍스 클라우드웨이브 6기](/projects/cgv/)
  팀 5인의 CGV 예매 대기열에서 백엔드를 맡았고, 인프라를 직접 다루고 싶다는 방향이 여기서 정해졌습니다
* **2026.03 – 06** — [semiai 인프라팀 · AI 서비스 옵저버빌리티](/projects/semiai/)
  이미 서 있는 k3s 클러스터 위에 메트릭·로그·트레이스·프로파일 관측을 구축했습니다
* **2026.07 –** — [온프레미스 k3s 홈랩](/homelab/)
  이번에는 클러스터 그 자체를 — 물리 서버부터 인터넷 공개까지 직접 세우고 운영합니다
{:.timeline}

## 그 밖에

만든 것만큼 기록을 남기는 것을 중요하게 생각합니다.
공부·자격증·여행, 그리고 읽은 책까지 블로그에 씁니다.

* [블로그](https://zed6740.tistory.com) — 홈랩 구축기 21편을 포함한 공부와 일상의 기록
* [읽은 책](https://zed6740.tistory.com/category/%EC%9D%BC%EC%83%81/%EC%B1%85) — 읽고 남긴 감상 61편
