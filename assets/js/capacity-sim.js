// 카드4(서비스와 용량) 서비스 흐름 시뮬레이션.
// 실제 코드의 순환 — enter(즉시 입장 or 줄) → 승격 루프(빈자리만큼 앞에서) → admissions가
// Kafka를 건너 인증 발급 → 좌석 선점 → 확정 → bookings-completed가 되돌아와 자리 반환 —
// 을 축소값(관객 30 · 정원 6 · 좌석 24)으로 재현한다. 수치는 흐름 관찰용이지 실측 스펙이 아니다.
// 뼈대 SVG는 페이지 마크업에 있고(폴백 = 정적 구조도), 여기서는 움직이는 점만 그린다.
// Hydejack이 push-state로 본문을 갈아 끼우므로 첫 로드와 hy-push-state-after 양쪽에서
// 초기화한다(재초기화는 data-simInit로 차단).
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var PEOPLE = 30;      // 총 관객
  var BATCH = 2;        // 승격 한 번의 상한 — 실제의 PROCESSING_BATCH_SIZE 자리
  var TICK = 1400;      // 승격 루프 주기(ms) — 눈으로 따라갈 수 있게 실제(0.5초)보다 느리게
  var TRAVEL = 950;     // Kafka를 건너는 시간(ms) — 인증이 늦는 구간이 보이게

  function centers(svg, sel, dx, dy) {
    return Array.prototype.map.call(svg.querySelectorAll(sel), function (r) {
      return { el: r, x: +r.getAttribute('x') + dx, y: +r.getAttribute('y') + dy };
    });
  }

  function init() {
    var root = document.getElementById('cap-sim');
    if (!root || root.dataset.simInit) return;
    root.dataset.simInit = '1';

    var svg = root.querySelector('svg');
    var gPeople = svg.querySelector('#cs-people');
    var gMsgs = svg.querySelector('#cs-msgs');
    var logEl = root.querySelector('#cs-log');
    var countEl = root.querySelector('#cs-count');
    var slots = centers(svg, '.cs-slot', 18, 18);   // 정원 칸의 중심
    var seats = centers(svg, '.cs-seat', 13, 10);   // 좌석 칸의 중심

    // 재생 버튼은 JS가 만든다 — JS가 없으면 눌리지 않는 버튼을 남기지 않기 위해서다.
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'cs-btn'; btn.textContent = '예매 오픈';
    root.querySelector('#cs-ctrl').insertBefore(btn, countEl);

    var timers = [], interval = null;
    var waiting = [], activeN = 0, confirmed = 0, spawned = 0, done = false;

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function log(m) { logEl.textContent = m; }
    function count() {
      countEl.textContent = '대기 ' + waiting.length + ' · 입장 ' + activeN + '/' + slots.length
        + ' · 확정 ' + confirmed + '/' + seats.length;
    }
    function move(el, x, y) { el.style.transform = 'translate(' + x + 'px,' + y + 'px)'; }

    function person() {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', '7'); c.setAttribute('class', 'cs-p');
      gPeople.appendChild(c);
      return c;
    }
    function msg(color) {
      var r = document.createElementNS(NS, 'rect');
      r.setAttribute('width', '9'); r.setAttribute('height', '9'); r.setAttribute('rx', '2');
      r.setAttribute('fill', color); r.setAttribute('class', 'cs-m');
      gMsgs.appendChild(r);
      return r;
    }

    // 줄 — 앞(1번째)이 오른쪽. 승격으로 앞이 빠지면 전원이 한 칸씩 당겨진다.
    function queuePos(i) { return { x: 414 - i * 16, y: 87 }; }
    function relayout() {
      waiting.forEach(function (p, i) { var q = queuePos(i); move(p.el, q.x, q.y); });
    }

    // admissions — 입장 사건이 Kafka를 건너 booking에 닿아야 인증이 생긴다.
    // 건너는 동안 그 사람의 좌석 요청은 403이고, 도착해야 좌석을 살 수 있다.
    function sendAdmission(p) {
      var m = msg('#f08c2e');
      move(m, p.slot.x - 4, p.slot.y - 4);
      later(function () { move(m, 592, 340); }, 30);
      later(function () {
        if (m.parentNode) gMsgs.removeChild(m);
        p.el.classList.add('cs-p--auth');
        log('인증 도착 — 이제 좌석을 살 수 있다 (건너오는 동안의 좌석 요청은 403)');
        later(function () { pickSeat(p); }, 400 + Math.random() * 700);
      }, 30 + TRAVEL);
    }

    function admit(p, how) {
      var s = null;
      for (var i = 0; i < slots.length; i++) { if (!slots[i].used) { s = slots[i]; break; } }
      if (!s) return;
      s.used = true; activeN++;
      p.slot = s; move(p.el, s.x, s.y);
      log(how); count();
      sendAdmission(p);
    }

    function pickSeat(p) {
      if (done) return;
      var free = seats.filter(function (s) { return !s.state; });
      if (!free.length) return;   // 남은 좌석이 없다 — 이 사람은 표를 못 산다
      var s = free[Math.floor(Math.random() * free.length)];
      s.state = 'lock'; s.el.style.fill = '#e0a53c';
      log('좌석 선점 — 잠깐 쥔 것. 시간이 지나면 저절로 풀린다');
      later(function () { confirmSeat(p, s); }, 1200 + Math.random() * 1300);
    }

    function confirmSeat(p, s) {
      if (done) return;
      s.state = 'sold'; s.el.style.fill = '#2f6fdb';
      confirmed++; count();
      log('확정 — MySQL에 적히고 bookings-completed 발행');
      var m = msg('#2f6fdb');
      move(m, s.x - 4, s.y - 4);
      later(function () { move(m, p.slot.x - 4, p.slot.y - 4); }, 30);
      later(function () {
        if (m.parentNode) gMsgs.removeChild(m);
        p.slot.used = false; activeN--;
        p.el.style.opacity = '0';
        later(function () { if (p.el.parentNode) gPeople.removeChild(p.el); }, 600);
        log('자리 반환 — 다음 승격이 줄 앞에서 채운다'); count();
        if (confirmed >= seats.length) finish();
      }, 30 + TRAVEL);
    }

    // 오픈 — 관객이 시차를 두고 도착한다(같은 밀리초에 다 누르지는 않는다).
    // 정원에 자리가 있고 줄이 비어 있으면 즉시 입장, 아니면 줄 꼬리.
    function spawn() {
      if (done || spawned >= PEOPLE) return;
      spawned++;
      var p = { el: person() };
      move(p.el, 20, 87);
      later(function () {
        if (activeN < slots.length && !waiting.length) {
          admit(p, '정원에 자리가 있어 즉시 입장 — admissions 발행');
        } else {
          waiting.push(p); relayout(); count();
          if (waiting.length === 1) log('정원이 찼다 — 줄에 선다. 순번은 각자 폴링으로 묻는다');
        }
      }, 40);
      later(spawn, 180 + Math.random() * 180);
    }

    // 승격 루프 — 주기마다 빈자리(정원 − 입장 인원)를 재고, 줄 앞에서 배치 상한까지 꺼낸다.
    function tick() {
      if (done) return;
      if (!document.body.contains(root)) { stopAll(); return; }   // SPA로 페이지를 떠났다
      var n = Math.min(slots.length - activeN, BATCH, waiting.length);
      if (n <= 0) return;
      var batch = waiting.splice(0, n);
      relayout();
      batch.forEach(function (p) { admit(p, '승격 ' + n + '명 — 줄 앞에서 · admissions 발행'); });
    }

    function finish() {
      done = true;
      var left = waiting.length + activeN;
      log('매진 — 좌석이 다 팔리면 판이 끝난다. 남은 ' + left + '명은 표를 사지 못했다');
    }

    function stopAll() {
      timers.forEach(clearTimeout); timers = [];
      if (interval) { clearInterval(interval); interval = null; }
    }

    function reset() {
      stopAll();
      while (gPeople.firstChild) gPeople.removeChild(gPeople.firstChild);
      while (gMsgs.firstChild) gMsgs.removeChild(gMsgs.firstChild);
      slots.forEach(function (s) { s.used = false; });
      seats.forEach(function (s) { s.state = null; s.el.style.fill = ''; });
      waiting = []; activeN = 0; confirmed = 0; spawned = 0; done = false;
      count();
    }

    btn.addEventListener('click', function () {
      reset();
      btn.textContent = '처음부터';
      log('오픈 — 관객이 시차를 두고 들어온다');
      spawn();
      interval = setInterval(tick, TICK);
    });

    count();
  }

  init();
  var ps = document.getElementById('_pushState');
  if (ps) ps.addEventListener('hy-push-state-after', init);
})();
