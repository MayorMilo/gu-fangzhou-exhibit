(function(){
  var cards = DATA.timeline.cards, n = cards.length, cur = 0;
  var $ = function(id){ return document.getElementById(id); };
  var track = $('track'), info = $('info'), stage = $('stage');
  $('heading').textContent = DATA.timeline.heading;
  $('dates').textContent = DATA.site.dates;
  $('home').href = 'index.html' + draftSuffix;

  var els = [], ticks = [];
  var S, BIG, GAP, CX;
  cards.forEach(function(c, i){
    var b = document.createElement('button');
    b.className = 'card'; b.setAttribute('role','listitem'); b.setAttribute('aria-label', c.year + ' — ' + c.title);
    var im = document.createElement('img'); im.src = c.image; im.alt = ''; im.draggable = false;
    b.appendChild(im);
    b.addEventListener('click', function(){ go(i); });
    track.appendChild(b); els.push(b);
    var t = document.createElement('span'); t.className = 'tick'; t.textContent = c.year; track.appendChild(t); ticks.push(t);
  });

  function layout(){
    var w = window.innerWidth, mobile = w <= 760;
    S = mobile ? 70 : Math.max(96, Math.min(150, w * 0.1));
    BIG = mobile ? 2.6 : Math.min(3.2, (window.innerHeight * 0.5) / S);
    GAP = S * (mobile ? 1.5 : 1.7);
    CX = mobile ? w / 2 : Math.max(w * 0.27, S * BIG / 2 + 48);
    stage.style.setProperty('--s', S + 'px');
    stage.style.setProperty('--big', BIG);
    stage.style.setProperty('--cx', CX + 'px');
    els.forEach(function(e, i){ e.style.left = (i * GAP) + 'px'; });
    ticks.forEach(function(t, i){ t.style.left = (i * GAP) + 'px'; });
    render(false);
  }

  var swapTimer;
  function render(animate){
    track.style.transform = 'translateX(' + (CX - cur * GAP) + 'px)';
    els.forEach(function(e, i){ e.classList.toggle('active', i === cur); e.tabIndex = i === cur ? -1 : 0; });
    ticks.forEach(function(t, i){ t.classList.toggle('active', i === cur); });
    $('prog').style.width = (n > 1 ? cur / (n - 1) * 100 : 100) + '%';
    $('count').textContent = String(cur + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
    $('prev').disabled = false; $('next').disabled = cur === n - 1;
    var c = cards[cur];
    function fill(){
      $('iYear').textContent = c.year; $('iTitle').textContent = c.title; $('iBody').textContent = c.body;
      $('iCap').textContent = c.caption || ''; $('iSrc').textContent = c.source ? 'Source: ' + c.source : '';
      info.classList.remove('swap');
    }
    clearTimeout(swapTimer);
    if(animate){ info.classList.add('swap'); swapTimer = setTimeout(fill, 260); } else fill();
  }

  var locked = false;
  function go(i){
    if(i < 0){ leave(); return; }
    if(i > n - 1 || i === cur) return;
    cur = i; render(true);
  }
  function leave(){
    document.body.classList.add('leaving');
    setTimeout(function(){ location.href = 'index.html' + draftSuffix; }, 450);
  }
  function step(d){
    if(locked) return; locked = true; go(cur + d);
    setTimeout(function(){ locked = false; }, 750);
  }

  var acc = 0, accTimer;
  window.addEventListener('wheel', function(e){
    e.preventDefault();
    acc += e.deltaY + e.deltaX;
    clearTimeout(accTimer); accTimer = setTimeout(function(){ acc = 0; }, 160);
    if(Math.abs(acc) > 40){ step(acc > 0 ? 1 : -1); acc = 0; }
  }, {passive:false});
  var ty = null, tx = null;
  window.addEventListener('touchstart', function(e){ ty = e.touches[0].clientY; tx = e.touches[0].clientX; }, {passive:true});
  window.addEventListener('touchmove', function(e){
    if(ty === null) return;
    var dy = ty - e.touches[0].clientY, dx = tx - e.touches[0].clientX;
    if(Math.abs(dy) > 40 || Math.abs(dx) > 40){ step((Math.abs(dy) > Math.abs(dx) ? dy : dx) > 0 ? 1 : -1); ty = null; }
  }, {passive:true});
  window.addEventListener('keydown', function(e){
    if(['ArrowDown','ArrowRight','PageDown',' '].indexOf(e.key) > -1){ e.preventDefault(); step(1); }
    if(['ArrowUp','ArrowLeft','PageUp'].indexOf(e.key) > -1){ e.preventDefault(); step(-1); }
    if(e.key === 'Home') go(0);
    if(e.key === 'End') go(n - 1);
  });
  $('next').addEventListener('click', function(){ step(1); });
  $('prev').addEventListener('click', function(){ step(-1); });
  window.addEventListener('resize', layout);
  window.addEventListener('pageshow', function(){ document.body.classList.remove('leaving'); });
  layout();
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ stage.classList.add('ready'); }); });
})();
