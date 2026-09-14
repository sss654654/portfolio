---
layout: page
title: 포트폴리오
sitemap: true
---

쿠버네티스 인프라 · 옵저버빌리티 엔지니어입니다.
기구축 k3s 환경의 **옵저버빌리티**를 담당했고, **가상화 · 네트워크부터 AWS EKS까지** 인프라를 단독 구축했습니다.
문제 원인은 metric · log · trace로 추적하고, 용량은 SLO 기반 **부하 테스트로 50,000명까지** 실측했습니다.
{:.lead}

* [이력서 PDF](/assets/subinhong-resume.pdf) — 2장
* [홈랩](/homelab/) — k3s(dev) · EKS(stg) · 대기열 예매 서비스
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

<p class="demo-caption" markdown="0">예매 오픈 · 대기열 통과 · 예매 완료까지 실제 서비스 화면 녹화.</p>

<!-- 가동 상태 점 — 데모의 두 경로를 읽기 전용으로 한 번씩 조회한다.
     queue    GET  /api/admission/stats   Traefik → queue
     frontend HEAD /index.html            Traefik → nginx (방문자가 처음 받는 화면)
     queue 만 보면 frontend 가 멈춰 첫 화면이 503 이어도 '가동 중'이 뜬다(2026-09-14 실제로 그랬다).
     판정: 둘 다 응답이 오고 queue 가 5xx 가 아니며 frontend 가 2xx 면 가동 중. 응답은 왔는데
     그 조건을 못 채우면 접속 장애. 응답이 아예 없으면(꺼짐 · CF 에러 페이지 · 방문자 네트워크)
     낮에는 아무것도 표시하지 않는다 — 확인 못 한 상태를 단정하지 않는다.
     movieId는 2026-08-31 실측값 — 틀려도 404 가 오므로 판정은 안 깨진다.
     교차 출처라 cgv-infra 의 portfolio-status-cors 라우터가 두 경로 모두에 이 origin 의 CORS 를 열어야 동작한다. -->
<script>
(function () {
  var box = document.getElementById('demo-status');
  if (!box || !window.fetch || !window.AbortController || !window.Promise) return;
  var ctrl = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, 6000);
  var base = 'https://ticket.subinhong.dev';
  function show(cls, text) {
    box.className = cls;
    box.getElementsByTagName('span')[0].textContent = text;
    box.hidden = false;
  }
  Promise.all([
    fetch(base + '/api/admission/stats?movieId=kbo-allstar-2025', { cache: 'no-store', signal: ctrl.signal }),
    fetch(base + '/index.html', { method: 'HEAD', cache: 'no-store', signal: ctrl.signal })
  ]).then(function (rs) {
    clearTimeout(timer);
    if (rs[0].status < 500 && rs[1].ok) {
      show('up', '지금 가동 중');
    } else {
      show('down', '지금 접속 장애');
    }
  }).catch(function () {
    clearTimeout(timer);
    /* 응답이 없어도 낮에는 단정하지 않는다(방문자 네트워크 문제일 수 있음).
       단, KST가 가동 시간(08:00-23:30) 밖이면 꺼져 있는 시간이라고 확정할 수 있다.
       주의: compress_html이 한 줄로 누르므로 이 블록에 // 주석 금지 */
    var k = new Date(Date.now() + 9 * 3600 * 1000);
    var m = k.getUTCHours() * 60 + k.getUTCMinutes();
    if (m < 8 * 60 || m >= 23 * 60 + 30) {
      show('down', '지금은 꺼져 있는 시간');
    }
  });
})();
</script>

데모용 설정 — 대기 행렬 표시를 위해 동시 입장 60명, 좌석은 3시간마다 초기화. 구성 · 선택 근거는 [홈랩](/homelab/).

## 이력

* **2026.07 – 09** — [홈랩](/homelab/) — 노트북 k3s(dev) 단독 구축 · 인터넷 공개, Terraform · EKS(stg)로 확장 · **50,000명 부하 테스트 실측**
* **2026.03 – 06** — [semiai 인프라팀](/projects/semiai/) — 기구축 k3s 옵저버빌리티 담당 · 인프라 · 앱 대시보드 · Go 백엔드 네 신호 계측 · heap profile 진단으로 **OOMKilled 해소**
* <small>2026.02 — 단국대학교 소프트웨어학과 졸업</small>
* **2025.06 – 09** — [CJ 올리브네트웍스 클라우드웨이브 6기](/projects/cgv/) — CGV 예매 대기열 · 5인 팀 · **AWS 개발계 네트워크(Terraform)** · Redis 대기열 백엔드 담당
* <small>2023.08 – 2025.05 — 공군 복무</small>
* **2022.07 – 12** — [LevelDB 캐시 메커니즘 분석](/projects/leveldb/) — 학부 연구생 · **KSC 2022 학부생 논문 1저자**
* <small>2021.03 — 단국대학교 소프트웨어학과 편입</small>
{:.timeline}
