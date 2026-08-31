---
layout: page
title: 안녕하세요, 홍수빈입니다 👋
sitemap: true
---

인프라를 직접 세우고 운영합니다.
{:.lead}

## 홈랩

노트북 한 대에 쿠버네티스 클러스터를 구축해, 영화 예매 대기열 데모 서비스를 운영하고 있습니다.

<!-- 시연 영상 — 무음 자동 재생 루프, 브라우저 창 목업 프레임. 재생 전용 — 실서비스 이동은 아래 버튼 하나로.
     심야(서비스 꺼짐)에도 이 영상이 데모를 대신한다. markdown="0" = kramdown 개입 차단 -->
<div class="demo-frame" markdown="0">
  <div class="demo-chrome">
    <span class="demo-dots"><i></i><i></i><i></i></span>
    <span class="demo-url">ticket.subinhong.dev</span>
  </div>
  <video autoplay loop muted playsinline preload="metadata" poster="/assets/img/demo-poster.jpg">
    <source src="/assets/video/demo.mp4" type="video/mp4">
  </video>
</div>

<p class="demo-caption" markdown="0">예매 오픈부터 대기열 입장, 예매 완료까지의 실제 화면 녹화입니다.</p>

<div class="demo-ctas" markdown="0">
  <a class="primary" href="https://ticket.subinhong.dev" target="_blank" rel="noopener">직접 해보기 →</a>
  <span class="demo-note"><span id="demo-status" hidden><i></i><span></span> · </span>매일 07:30–23:30 KST 가동 · 이 시간 외에는 서버가 꺼져 있습니다</span>
</div>

<!-- 가동 상태 점 — 데모의 stats 엔드포인트(읽기 전용 GET)를 한 번 조회한다.
     응답을 받았을 때만 점을 띄운다. 응답이 없으면(꺼짐·타임아웃·차단) 아무것도 표시하지 않는다 —
     확인하지 못한 상태를 단정해서 보여주지 않기 위해서다.
     교차 출처라 cgv-infra의 portfolio-status-cors 라우터가 이 origin에 CORS를 열어야 동작한다. -->
<script>
(function () {
  var box = document.getElementById('demo-status');
  if (!box || !window.fetch || !window.AbortController) return;
  var ctrl = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, 6000);
  fetch('https://ticket.subinhong.dev/api/admission/stats?movieId=1',
        { cache: 'no-store', signal: ctrl.signal })
    .then(function (r) {
      clearTimeout(timer);
      box.className = r.ok ? 'up' : 'down';
      box.getElementsByTagName('span')[0].textContent =
        r.ok ? '지금 돌아가고 있습니다' : '지금은 꺼져 있습니다';
      box.hidden = false;
    })
    .catch(function () { clearTimeout(timer); });
})();
</script>

데모 설정입니다 — 대기 행렬이 보이도록 동시 입장을 줄였고, 좌석은 3시간마다 초기화됩니다.
구축 과정과 부하 실측 기록은 [홈랩 페이지](/homelab/)에 있습니다.

## 여기까지 온 길

* **2022.07 – 12** — [LevelDB 캐시 구조 분석](/projects/leveldb/)
  — 소스 코드를 읽고 변수를 통제해 실측하는 법을 익혔습니다 · KSC 2022 논문 1저자
* <small>2023.08 – 2025.05 — 공군 복무</small>
* **2025.06 – 09** — [CJ 올리브네트웍스 클라우드웨이브 6기](/projects/cgv/)
  — 5인 팀으로 CGV 예매 대기열 서비스를 만들며 백엔드를 맡았습니다. 인프라를 직접 다루고 싶다는 방향이 여기서 정해졌습니다
* **2026.03 – 06** — [semiai 인프라팀](/projects/semiai/)
  — 반도체 수율 플랫폼 회사. AI 서비스에 LGTM 스택으로 옵저버빌리티를 구축했습니다 — 애플리케이션 에러·트레이스 추적, k3s 데일리 상태 대시보드
* **2026.07 –** — [온프레미스 k3s 홈랩](/homelab/)
  — 이번에는 클러스터 자체를, 물리 서버부터 인터넷 공개까지 직접 세우고 운영합니다
{:.timeline}

## 그 밖에

취미는 독서입니다. 기록하는 습관도 읽은 책을 남기는 데서 시작했고,
지금은 공부한 것들까지 블로그에 쓰고 있습니다.

* [블로그](https://zed6740.tistory.com) — 공부와 일상의 기록
* [읽은 책](https://zed6740.tistory.com/category/%EC%9D%BC%EC%83%81/%EC%B1%85) — 그 시작이 된 독서록 61편
