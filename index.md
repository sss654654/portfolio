---
layout: page
title: 안녕하세요, 홍수빈입니다 👋
sitemap: true
---

인프라를 직접 세우고 운영합니다. 지금까지 공부하고 만들어 온 것들을 기록해 둔 공간입니다.
{:.lead}

## 홈랩

노트북 한 대에 k3s로 쿠버네티스 클러스터를 구축해, 예매 대기열 데모 서비스를 운영하고 있습니다.

<!-- 시연 영상 — 무음 자동 재생 루프, 브라우저 창 목업 프레임. 영상 클릭과 아래 버튼 둘 다 실서비스로 이동
     (hover 시 demo-shot::before 배지가 이동 대상임을 알린다). 심야(서비스 꺼짐)에도 이 영상이 데모를 대신한다.
     markdown="0" = kramdown 개입 차단 -->
<div class="demo-frame" markdown="0">
  <div class="demo-chrome">
    <span class="demo-dots"><i></i><i></i><i></i></span>
    <span class="demo-url">ticket.subinhong.dev</span>
    <span class="demo-live"><span id="demo-status" hidden><i></i><span></span> · </span>오픈 08:00–23:30 KST</span>
  </div>
  <a class="demo-shot" href="https://ticket.subinhong.dev" target="_blank" rel="noopener" aria-label="실서비스로 이동">
    <video autoplay loop muted playsinline preload="metadata" poster="/assets/img/demo-poster.jpg">
      <source src="/assets/video/demo.mp4" type="video/mp4">
    </video>
  </a>
</div>

<p class="demo-caption" markdown="0">예매가 열리는 순간부터 대기열을 지나 예매를 마치기까지, 실제 서비스 화면을 녹화한 것입니다.</p>

<!-- 가동 상태 점 — 데모의 stats 엔드포인트(읽기 전용 GET)를 한 번 조회한다.
     판정: 응답이 오면(상태코드 무관) 가동 중 — CORS 헤더가 실린 응답을 받았다는 것 자체가
     origin이 살아 있다는 증거다. 꺼져 있으면 CF 에러 페이지에 그 헤더가 없어 fetch가
     실패하고, 그때는 아무것도 표시하지 않는다(확인 못 한 상태를 단정하지 않기 위해).
     movieId는 2026-08-31 실측값 — 틀려도 404 응답이 오므로 판정은 안 깨진다.
     교차 출처라 cgv-infra의 portfolio-status-cors 라우터가 이 origin에 CORS를 열어야 동작한다. -->
<script>
(function () {
  var box = document.getElementById('demo-status');
  if (!box || !window.fetch || !window.AbortController) return;
  var ctrl = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, 6000);
  fetch('https://ticket.subinhong.dev/api/admission/stats?movieId=kbo-allstar-2025',
        { cache: 'no-store', signal: ctrl.signal })
    .then(function (r) {
      clearTimeout(timer);
      box.className = 'up';
      box.getElementsByTagName('span')[0].textContent = '지금 가동 중';
      box.hidden = false;
    })
    .catch(function () { clearTimeout(timer); });
})();
</script>

지금 배포된 서비스는 데모용 설정입니다 — 대기 행렬이 보이도록 동시 입장을 60명으로 줄였고, 좌석은 3시간마다 초기화됩니다.
서비스와 그 아래 홈랩 인프라를 만들어 온 과정은 [홈랩 페이지](/homelab/)에 정리되어 있습니다.

## 걸어온 길

* **2022.07 – 12** — [LevelDB 캐시 구조 분석](/projects/leveldb/)
  — 소스 코드를 읽고 변수를 통제해 실측하는 법을 익혔습니다 · KSC 2022 논문 1저자
* <small>2023.08 – 2025.05 — 공군 복무</small>
* **2025.06 – 09** — [CJ 올리브네트웍스 클라우드웨이브 6기](/projects/cgv/)
  — 5인 팀으로 CGV 예매 대기열 서비스를 만들며 대기열 백엔드와 개발계 네트워크를 맡았고, 인프라를 직접 다루고 싶다는 방향이 여기서 정해졌습니다 — Redis 대기열·동적 정원 승격, Terraform VPC·Client VPN
* **2026.03 – 06** — [semiai 인프라팀](/projects/semiai/)
  — 반도체 수율을 AI로 높이는 플랫폼 회사. 그 AI 서비스에 LGTM 스택으로 옵저버빌리티를 구축했습니다 — 애플리케이션 에러·트레이스 추적, k3s 데일리 상태 대시보드
* **2026.07 –** — [온프레미스 k3s 홈랩](/homelab/)
  — 그동안의 경험을 토대로, 이번에는 클러스터 자체를 물리 서버부터 인터넷 공개까지 직접 세우고 운영합니다
{:.timeline}

## 그 밖에

군 복무 때 독서 100권 챌린지를 시작하면서 추리소설을 즐겨 읽게 됐고,
읽은 책을 한 권씩 남기다 보니 그게 지금의 블로그로 이어졌습니다.

* [블로그](https://zed6740.tistory.com) — 공부와 일상의 기록
* [읽은 책](https://zed6740.tistory.com/category/%EC%9D%BC%EC%83%81/%EC%B1%85) — 지금까지의 독서 기록
