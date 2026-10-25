(function(){
  var cards = DATA.timeline.cards, n = cards.length;
  var $ = function(id){ return document.getElementById(id); };
  if(!n){
    document.body.innerHTML = '<p style="padding:3rem;font-family:sans-serif;color:#555">This exhibit has no cards yet. Add some in <a href="admin.html">admin.html</a>.</p>';
    return;
  }
  var track = $('track'), info = $('info'), stage = $('stage');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('heading').textContent = DATA.timeline.heading;
  $('dates').textContent = DATA.site.dates;
  $('home').href = 'index.html' + draftSuffix;

  var els = [], ticks = [];
  var S, BIG, GAP, CX, mobile;
  cards.forEach(function(c, i){
    var b = document.createElement('button');
    b.className = 'card'; b.setAttribute('aria-label', c.year + ' — ' + c.title);
    var im = document.createElement('img');
    im.onerror = function(){ im.onerror = null; im.src = 'assets/reflection.svg'; };
    im.src = c.image; im.alt = c.caption || c.title; im.draggable = false;
    b.appendChild(im);
    b.addEventListener('click', function(){ goTo(i); });
    track.appendChild(b); els.push(b);
    var t = document.createElement('span'); t.className = 'tick'; t.textContent = c.year; track.appendChild(t); ticks.push(t);
  });

  /* pos = where the camera is (fractional card index); target = where it is heading */
  var pos = 0, target = 0, shown = -1, last = 0, running = false;

  function layout(){
    var w = window.innerWidth; mobile = w <= 760;
    S = mobile ? 70 : Math.max(96, Math.min(150, w * 0.1));
    BIG = mobile ? 2.6 : Math.min(3.2, (window.innerHeight * 0.5) / S);
    GAP = S * (mobile ? 1.5 : 1.7);
    CX = mobile ? w / 2 : Math.max(w * 0.27, S * BIG / 2 + 48);
    stage.style.setProperty('--s', S + 'px');
    stage.style.setProperty('--big', BIG);
    stage.style.setProperty('--cx', CX + 'px');
    draw();
  }

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  function draw(){
    track.style.transform = 'translateX(' + (CX - pos * GAP) + 'px)';
    for(var i = 0; i < n; i++){
      var d = Math.abs(i - pos), t = clamp(1 - d, 0, 1);           // t: 1 = fully focused
      var e = t * t * (3 - 2 * t), sc = 1 + (BIG - 1) * e, x = i * GAP;
      var el = els[i];
      el.style.transform = 'translateX(' + x + 'px) scale(' + sc.toFixed(3) + ')';
      el.style.filter = 'blur(' + ((1 - e) * 2.5).toFixed(2) + 'px) saturate(' + (0.6 + 0.4 * e).toFixed(2) + ')';
      el.style.opacity = (0.55 + 0.45 * e).toFixed(2);
      el.style.zIndex = Math.round(e * 10);
      var tk = ticks[i], half = S / 2 * sc + (14 + 12 * e);
      tk.style.transform = 'translate(' + x + 'px,' + half + 'px) translateX(-50%)';
      tk.style.fontSize = (0.78 + 0.95 * e).toFixed(3) + 'rem';
      tk.style.fontWeight = e > 0.5 ? 700 : 400;
      tk.style.color = e > 0.5 ? 'var(--ink)' : '';
      // on phones the focused card covers its neighbours' dates
      tk.style.opacity = mobile && d > 0.5 ? clamp((d - 1.1) / 0.5, 0, 1).toFixed(2) : 1;
    }
    var idx = clamp(Math.round(pos), 0, n - 1);
    if(idx !== shown) setActive(idx);
    $('prog').style.width = (n > 1 ? clamp(pos / (n - 1), 0, 1) * 100 : 100) + '%';
  }

  var swapTimer;
  function setActive(idx){
    var first = shown < 0; shown = idx;
    els.forEach(function(e, i){ e.classList.toggle('active', i === idx); });
    $('count').textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
    $('prev').disabled = false; $('next').disabled = idx === n - 1;
    var c = cards[idx];
    function fill(){
      $('iTitle').textContent = c.title; $('iBody').textContent = c.body;
      $('iCap').textContent = c.caption || '';
      $('iSrc').textContent = c.source ? 'Source: ' + c.source : '';
      $('iDraft').hidden = !!(c.source && c.source.trim());
      $('iBack').hidden = idx !== n - 1; $('iBack').href = 'index.html' + draftSuffix;
      info.classList.remove('swap');
    }
    clearTimeout(swapTimer);
    if(first || reduce) fill(); else { info.classList.add('swap'); swapTimer = setTimeout(fill, 140); }
  }

  /* animation loop: exponential ease toward target, frame-rate independent */
  function tick(now){
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    var diff = target - pos;
    if(reduce || Math.abs(diff) < 0.0005){ pos = target; draw(); running = false; return; }
    pos += diff * (1 - Math.exp(-dt * 9));
    draw();
    requestAnimationFrame(tick);
  }
  function run(){ if(!running){ running = true; last = performance.now(); requestAnimationFrame(tick); } }

  /* leaving: pushing past card 1 twice returns to the title page */
  var armed = false, armTimer, over = 0, overCool = 0;
  function tryLeave(){
    if(armed){ leave(); return; }
    armed = true; $('leaveHint').classList.add('on');
    clearTimeout(armTimer); armTimer = setTimeout(function(){ armed = false; $('leaveHint').classList.remove('on'); }, 2200);
  }
  function leave(){
    document.body.classList.add('leaving');
    setTimeout(function(){ location.href = 'index.html' + draftSuffix; }, 450);
  }
  function disarm(){ armed = false; $('leaveHint').classList.remove('on'); }

  function move(delta){            // free movement, in cards
    if(g0 === null) g0 = Math.round(target);
    var t = target + delta;
    if(t < 0){
      var now = Date.now();
      if(delta < 0 && now > overCool){ over += -delta; if(over > 0.35){ over = 0; overCool = now + 900; tryLeave(); } }
      t = 0;
    } else { over = 0; if(t > 0.1) disarm(); }
    target = clamp(t, 0, n - 1);
    run();
  }
  function goTo(i){ target = clamp(i, 0, n - 1); if(i > 0) disarm(); run(); }
  var g0 = null;                   // card the current gesture started on
  function snap(){
    var r = Math.round(target);
    if(g0 !== null && r === g0 && Math.abs(target - g0) > 0.12) r = g0 + (target > g0 ? 1 : -1);   // a single wheel notch still advances one card
    target = clamp(r, 0, n - 1); g0 = null; run();
  }

  var snapTimer;
  function snapSoon(ms){ clearTimeout(snapTimer); snapTimer = setTimeout(snap, ms); }

  window.addEventListener('wheel', function(e){
    e.preventDefault();
    var d = e.deltaY + e.deltaX;
    if(e.deltaMode === 1) d *= 32; else if(e.deltaMode === 2) d *= 400;
    move(d / 320);
    snapSoon(130);
  }, {passive:false});

  var ty = null, tx = null, horiz = false;
  window.addEventListener('touchstart', function(e){ ty = e.touches[0].clientY; tx = e.touches[0].clientX; horiz = false; clearTimeout(snapTimer); }, {passive:true});
  window.addEventListener('touchmove', function(e){
    if(ty === null) return;
    var y = e.touches[0].clientY, x = e.touches[0].clientX, dy = ty - y, dx = tx - x;
    ty = y; tx = x;
    move((Math.abs(dy) >= Math.abs(dx) ? dy : dx) / 220);
  }, {passive:true});
  window.addEventListener('touchend', function(){ ty = null; snapSoon(30); }, {passive:true});

  window.addEventListener('keydown', function(e){
    var t = e.target && e.target.tagName, onCtl = t === 'BUTTON' || t === 'A';
    if(onCtl && (e.key === ' ' || e.key === 'Enter')) return;
    var cur = Math.round(target);
    if(['ArrowDown','ArrowRight','PageDown',' '].indexOf(e.key) > -1){ e.preventDefault(); goTo(cur + 1); }
    if(['ArrowUp','ArrowLeft','PageUp'].indexOf(e.key) > -1){ e.preventDefault(); if(cur === 0) tryLeave(); else goTo(cur - 1); }
    if(e.key === 'Home') goTo(0);
    if(e.key === 'End') goTo(n - 1);
  });
  $('next').addEventListener('click', function(){ goTo(Math.round(target) + 1); });
  $('prev').addEventListener('click', function(){ var c = Math.round(target); if(c === 0) tryLeave(); else goTo(c - 1); });
  window.addEventListener('resize', layout);
  window.addEventListener('pageshow', function(){ document.body.classList.remove('leaving'); });
  layout();
})();
