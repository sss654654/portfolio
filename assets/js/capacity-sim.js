// 카드4(서비스와 용량) 서비스 흐름 시뮬레이션.
// 실제 코드의 순환 — enter(즉시 입장 or 줄) → 승격(빈자리만큼 앞에서) → admissions 발행 →
// 토픽에 적혔다가(append) 앞에서 소비 → 입장 인증(Redis) → 좌석 선점 → 확정 →
// bookings-completed 가 같은 길로 되돌아와 자리 반환 — 을 축소값(관객 30 · 정원 6 · 좌석 24)으로
// 재현한다. 수치는 흐름 관찰용이지 실측 스펙이 아니다.
// 메시지 점은 토픽 레인의 뒤(오른쪽)에 붙었다가 잠깐 머문 뒤 앞(왼쪽)으로 흘러 나간다 —
// 로그에 적히고 컨슈머가 가져가는 동작이 그대로 보이게.
// 뼈대 SVG는 페이지 마크업에 있고(폴백 = 번호 붙은 정적 흐름도), 여기서는 움직이는 점만 그린다.
// Hydejack이 push-state로 본문을 갈아 끼우므로 첫 로드와 hy-push-state-after 양쪽에서
// 초기화한다(재초기화는 data-simInit로 차단).
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var PEOPLE = 30;   // 총 관객
  var BATCH = 2;     // 승격 한 번의 상한 — 실제의 PROCESSING_BATCH_SIZE 자리
  var TICK = 2200;   // 승격 루프 주기(ms) — 눈으로 따라갈 수 있게 실제(0.5초)보다 느리게

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
    var adms = centers(svg, '.cs-adm', 11, 7);      // 입장 인증 칸 — SET으로 켜지고 소진(DEL)으로 꺼진다

    // 재생 버튼은 JS가 만든다 — JS가 없으면 눌리지 않는 버튼을 남기지 않기 위해서다.
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'cs-btn'; btn.textContent = '시연해보기';
    root.querySelector('#cs-ctrl').insertBefore(btn, countEl);

    var timers = [], interval = null;
    var waiting = [], activeN = 0, confirmed = 0, spawned = 0, done = false;

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function log(m) { logEl.textContent = m; }
    function count() {
      countEl.textContent = '대기 ' + waiting.length + ' · 입장 ' + activeN + '/' + slots.length
        + ' · 확정 ' + confirmed + '/' + seats.length;
    }
    function move(el, x, y, dur) {
      if (dur != null) el.style.transitionDuration = dur + 'ms';
      el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    }

    function person() {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', '7'); c.setAttribute('class', 'cs-p');
      gPeople.appendChild(c);
      return c;
    }

    // 메시지 점 하나가 경로(steps)를 따라간다. 각 단계 = {x, y, dur, hold}.
    // hold = 그 자리에 머무는 시간 — 토픽에 적혀 있는 구간을 보여준다.
    function travel(color, from, steps, onArrive) {
      var m = document.createElementNS(NS, 'rect');
      m.setAttribute('width', '9'); m.setAttribute('height', '9'); m.setAttribute('rx', '2');
      m.setAttribute('fill', color); m.setAttribute('class', 'cs-m');
      gMsgs.appendChild(m);
      move(m, from.x, from.y, 0);
      var i = 0;
      function step() {
        if (i >= steps.length) {
          if (m.parentNode) gMsgs.removeChild(m);
          onArrive();
          return;
        }
        var s = steps[i]; i++;
        move(m, s.x, s.y, s.dur);
        later(step, s.dur + (s.hold || 40));
      }
      later(step, 30);
    }

    // 줄 — 앞(1번째)이 오른쪽. 승격으로 앞이 빠지면 전원이 한 칸씩 당겨진다.
    function queuePos(i) { return { x: 372 - i * 14, y: 123 }; }
    function relayout() {
      waiting.forEach(function (p, i) { var q = queuePos(i); move(p.el, q.x, q.y); });
    }

    // 3→4 — admissions: 정원 칸에서 토픽 뒤(오른쪽)에 붙고, 머물다가, 앞(왼쪽)으로 흘러
    // booking의 인증(admitted)에 적힌다. 도착 전까지 그 사람의 좌석 요청은 403이다.
    function sendAdmission(p) {
      travel('#f08c2e', { x: p.slot.x - 4, y: p.slot.y - 4 }, [
        { x: 484, y: 262, dur: 600, hold: 450 },   // append — 토픽 뒤에 적힌다
        { x: 50, y: 262, dur: 1150, hold: 150 },   // 앞으로 흘러간다
        { x: 26, y: 262, dur: 250 },               // 소비 — 4번 길을 따라
        { x: 26, y: 442, dur: 650 },
        { x: 50, y: 464, dur: 300 }                // admitted 에 적힌다
      ], function () {
        p.el.classList.add('cs-p--auth');
        for (var i = 0; i < adms.length; i++) {
          if (!adms[i].used) { adms[i].used = true; adms[i].el.style.fill = '#f08c2e'; p.adm = adms[i]; break; }
        }
        log('인증 도착 — 이제 좌석을 살 수 있다 (건너오는 동안의 좌석 요청은 403)');
        later(function () { pickSeat(p); }, 600 + Math.random() * 900);
      });
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
      later(function () { confirmSeat(p, s); }, 1800 + Math.random() * 1600);
    }

    // 5→6→7 — 확정이 MySQL에 적히면 bookings-completed 가 같은 길(토픽)로 되돌아가고,
    // queue 가 그것을 소비해야 자리가 빈다.
    function confirmSeat(p, s) {
      if (done) return;
      s.state = 'sold'; s.el.style.fill = '#2f6fdb';
      confirmed++; count();
      log('확정 — MySQL에 적히고 bookings-completed 발행 · 인증은 소진');
      // 후처리 순서는 코드 그대로 — completed 발행이 먼저, admitted 소진(DEL)이 그다음.
      // 서로를 기다리지 않는 독립 뒷정리라 화면에서는 사실상 동시다.
      travel('#2f6fdb', { x: s.x - 4, y: s.y - 4 }, [
        { x: 64, y: 316, dur: 600, hold: 450 },    // append — 토픽 뒤에 적힌다
        { x: 492, y: 316, dur: 1150, hold: 150 },  // 흘러간다 — 이 레인은 소비가 오른쪽(순환이 시계방향이 되게)
        { x: 710, y: 316, dur: 250 },              // 소비 — 7번 길을 따라
        { x: 710, y: 156, dur: 650 }               // active 에서 뺀다
      ], function () {
        p.slot.used = false; activeN--;
        p.el.style.opacity = '0';
        later(function () { if (p.el.parentNode) gPeople.removeChild(p.el); }, 600);
        log('자리 반환 — 다음 승격이 줄 앞에서 채운다'); count();
        if (confirmed >= seats.length) finish();
      });
      if (p.adm) { p.adm.used = false; p.adm.el.style.fill = ''; p.adm = null; }   // 인증 소진(DEL) — 발행 다음
    }

    // 1 — 오픈. 관객이 시차를 두고 도착한다(같은 밀리초에 다 누르지는 않는다).
    // 정원에 자리가 있고 줄이 비어 있으면 즉시 입장, 아니면 줄 꼬리.
    function spawn() {
      if (done || spawned >= PEOPLE) return;
      spawned++;
      var p = { el: person() };
      move(p.el, 24, 123);
      later(function () {
        if (activeN < slots.length && !waiting.length) {
          admit(p, '정원에 자리가 있어 즉시 입장 — admissions 발행');
        } else {
          waiting.push(p); relayout(); count();
          if (waiting.length === 1) log('정원이 찼다 — 줄에 선다. 순번은 각자 폴링으로 묻는다');
        }
      }, 40);
      later(spawn, 350 + Math.random() * 250);
    }

    // 2 — 승격 루프. 주기마다 빈자리(정원 − 입장 인원)를 재고, 줄 앞에서 배치 상한까지 꺼낸다.
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
      adms.forEach(function (s) { s.used = false; s.el.style.fill = ''; });
      waiting = []; activeN = 0; confirmed = 0; spawned = 0; done = false;
      count();
    }

    btn.addEventListener('click', function () {
      reset();
      btn.textContent = '다시 시연';
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
