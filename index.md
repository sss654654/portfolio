---
layout: page
title: 포트폴리오
sitemap: true
---

노트북 한 대로 쿠버네티스 · CI/CD · 옵저버빌리티 · 방화벽을 세우고, 그 위에 대기열 예매 서비스를 인터넷에 운영하며 **1만 명 부하 테스트를 에러 없이 통과**했습니다.
회사에서는 k3s 옵저버빌리티를 구축하고, profile로 찾은 함수를 개발팀이 고쳐 **메모리를 78%** 줄였습니다.
부트캠프에서는 대기열 백엔드를 맡아 **AWS에 개발계를 구성해 배포**했습니다.
{:.lead}

* [이력서 PDF](/assets/subinhong-resume.pdf) — 2장
* [홈랩](/homelab/) — k3s 클러스터 · 대기열 예매 서비스
* [프로젝트](/projects/) — 회사 · 부트캠프 · 학부 연구
* [블로그](https://zed6740.tistory.com) — 기술 기록

## 대기열 예매 서비스

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
    .catch(function () {
      clearTimeout(timer);
      /* 응답이 없어도 낮에는 단정하지 않는다(방문자 네트워크 문제일 수 있음).
         단, KST가 가동 시간(08:00-23:30) 밖이면 꺼져 있는 시간이라고 확정할 수 있다.
         주의: compress_html이 한 줄로 누르므로 이 블록에 // 주석 금지 */
      var k = new Date(Date.now() + 9 * 3600 * 1000);
      var m = k.getUTCHours() * 60 + k.getUTCMinutes();
      if (m < 8 * 60 || m >= 23 * 60 + 30) {
        box.className = 'down';
        box.getElementsByTagName('span')[0].textContent = '지금은 꺼져 있는 시간';
        box.hidden = false;
      }
    });
})();
</script>

지금 배포된 서비스는 데모용 설정입니다 — 대기 행렬이 보이도록 동시 입장을 60명으로 줄였고, 좌석은 3시간마다 초기화됩니다.
클러스터부터 부하 실측까지, 무엇을 골랐고 왜 골랐는지는 [홈랩 페이지](/homelab/)에 있습니다.

## 이력

* **2026.07 – 09** — [온프레미스 k3s 홈랩](/homelab/) — 물리 서버부터 인터넷 공개까지 단독 구축 · **10,000명 부하에서 5xx 0건**
* **2026.03 – 06** — [semiai 인프라팀](/projects/semiai/) — 기구축 k3s 위 옵저버빌리티 담당 · 인프라·앱 대시보드, Go 백엔드 네 신호 계측 — profile로 찾은 함수를 개발팀이 수정해 **메모리 78% 감소**
* **2025.06 – 09** — [CJ 올리브네트웍스 클라우드웨이브 6기](/projects/cgv/) — CGV 예매 대기열, 5인 팀 · **AWS 개발계 네트워크(Terraform)**와 Redis 대기열 백엔드 담당
* <small>2023.08 – 2025.05 — 공군 복무</small>
* **2022.07 – 12** — [LevelDB 캐시 구조 분석](/projects/leveldb/) — 학부 연구생 · **KSC 2022 논문 1저자**
{:.timeline}
