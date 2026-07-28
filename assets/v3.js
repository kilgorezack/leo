/* ════════════════════════════════════════════════════════
   FIND THE SPOT
   Fixed wireless hands you one gateway and asks you to go
   find the place in the house where it works. The catch is
   that the two things you want pull in opposite directions:
   the link to the tower wants a window on the tower side,
   and whole-home coverage wants the middle of the house.
   You can't have both, which is the entire argument.

   The model is an illustration, not a measurement: signal
   falls off with distance and loses more crossing each wall,
   and the tower's own load is subtracted from the link.
   ════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* ---------- the house ---------- */
  var HOUSE = { x:40, y:70, w:460, h:300 };
  var TOWER = { x:648, y:96 };

  var ROOMS = [
    { k:'living',  label:'Living room',    x:40,  y:70,  w:200, h:150 },
    { k:'kitchen', label:'Kitchen',        x:240, y:70,  w:140, h:150 },
    { k:'office',  label:'Office',         x:380, y:70,  w:120, h:150 },
    { k:'bed1',    label:'Front bedroom',  x:40,  y:220, w:150, h:150 },
    { k:'bed2',    label:'Back bedroom',   x:190, y:220, w:150, h:150 },
    { k:'garage',  label:'Garage',         x:340, y:220, w:160, h:150 },
    { k:'porch',   label:'Back porch',     x:150, y:370, w:240, h:42, outside:true }
  ];
  ROOMS.forEach(function(r){ r.cx = r.x + r.w/2; r.cy = r.y + r.h/2; });

  /* walls the signal has to get through */
  var WALLS = [
    /* exterior */
    [40,70,500,70], [500,70,500,370], [500,370,40,370], [40,370,40,70],
    /* interior */
    [240,70,240,220], [380,70,380,220],
    [190,220,190,370], [340,220,340,370],
    [40,220,500,220]
  ];

  var LOADS = [
    { k:'quiet', label:'Quiet afternoon', cost:0,
      note:'Two in the morning, nobody on the tower but you. This is the number they advertise.' },
    { k:'evening', label:'Evening',       cost:12,
      note:'Everyone is home and on their phones. Home internet waits behind them on the same tower.' },
    { k:'busy', label:"Everyone's home",  cost:22,
      note:'Sunday night, the whole sector at once. Your house is last in a queue you never see.' }
  ];

  /* ---------- geometry ---------- */
  function seg(ax,ay,bx,by,cx,cy,dx,dy){
    /* do AB and CD cross? */
    function o(px,py,qx,qy,rx,ry){
      var v = (qy-py)*(rx-qx) - (qx-px)*(ry-qy);
      return v === 0 ? 0 : (v > 0 ? 1 : 2);
    }
    var o1=o(ax,ay,bx,by,cx,cy), o2=o(ax,ay,bx,by,dx,dy),
        o3=o(cx,cy,dx,dy,ax,ay), o4=o(cx,cy,dx,dy,bx,by);
    return o1!==o2 && o3!==o4;
  }
  function wallsBetween(a, b){
    var n = 0;
    for(var i=0;i<WALLS.length;i++){
      var w = WALLS[i];
      if(seg(a.x,a.y,b.x,b.y,w[0],w[1],w[2],w[3])) n++;
    }
    return n;
  }
  function dist(a,b){ return Math.sqrt((a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y)); }
  function clamp(v,lo,hi){ return Math.max(lo, Math.min(hi, v)); }

  /* ---------- the model ---------- */
  function linkQuality(g, loadCost){
    var d = dist(g, TOWER) / 100;
    return clamp(124 - d*6.5 - wallsBetween(g, TOWER)*9.5 - loadCost, 0, 100);
  }
  function roomQuality(g, room, base){
    var p = { x:room.cx, y:room.cy };
    var d = dist(g, p) / 100;
    return clamp(base - d*8.6 - wallsBetween(g, p)*10, 0, 100);
  }
  function band(v){ return v >= 52 ? 2 : v >= 27 ? 1 : 0; }

  var $ = function(s){ return document.querySelector(s); };
  var elPlan = $('#plan');
  if(!elPlan) return;

  var elRooms=$('#roomList'), elScore=$('#score'), elScoreSub=$('#scoreSub'),
      elBest=$('#best'), elWhy=$('#spotWhy'), elLinkVal=$('#linkVal'),
      elLinkFill=$('#linkFill'), elLoads=$('#loads'), elFootText=$('#spotFootText'),
      elSpot=$('.spot'), elA11y=$('#spotA11y'), elHint=$('#dragHint');

  var state = { g:{ x:430, y:120 }, load:'evening', view:'fwa', best:0 };

  /* ---------- draw the plan ---------- */
  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs){
    var n = document.createElementNS(NS, name);
    for(var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  (function drawPlan(){
    var frag = document.createDocumentFragment();

    /* rooms */
    ROOMS.forEach(function(r){
      var rect = el('rect', { x:r.x, y:r.y, width:r.w, height:r.h, rx:3,
        class:'rm', 'data-room':r.k, fill:'rgba(244,246,245,.05)' });
      r.el = rect;
      frag.appendChild(rect);
    });

    /* wall lines */
    WALLS.forEach(function(w){
      frag.appendChild(el('path', { class:'rm-line', d:'M'+w[0]+' '+w[1]+'L'+w[2]+' '+w[3] }));
    });
    /* porch outline */
    frag.appendChild(el('path', { class:'rm-line',
      d:'M150 370 L150 412 L390 412 L390 370', 'stroke-dasharray':'4 4' }));

    /* labels */
    ROOMS.forEach(function(r){
      var t = el('text', { class:'rm-label', x:r.x + 12, y:r.y + 22 });
      t.textContent = r.label;
      if(r.outside){ t.setAttribute('x', r.x + 12); t.setAttribute('y', r.y + 26); }
      frag.appendChild(t);
      var s = el('text', { class:'rm-stat', x:r.x + 12, y:r.y + 38 });
      r.statEl = s;
      if(!r.outside) frag.appendChild(s);
    });

    /* tower */
    frag.appendChild(el('path', { class:'tower-ic',
      d:'M'+(TOWER.x-14)+' '+(TOWER.y+46)+'L'+TOWER.x+' '+(TOWER.y-6)+'L'+(TOWER.x+14)+' '+(TOWER.y+46)+
        'M'+(TOWER.x-9)+' '+(TOWER.y+26)+'L'+(TOWER.x+9)+' '+(TOWER.y+26) }));
    frag.appendChild(el('path', { class:'tower-ic',
      d:'M'+(TOWER.x-17)+' '+(TOWER.y-10)+'a24 24 0 0 1 34 0M'+(TOWER.x-27)+' '+(TOWER.y-20)+'a40 40 0 0 1 54 0' }));
    var tt = el('text', { class:'tower-txt', x:TOWER.x, y:TOWER.y+64, 'text-anchor':'middle' });
    tt.textContent = 'Cell tower';
    frag.appendChild(tt);

    /* beam + puck */
    var beam = el('path', { class:'beam', id:'beam' });
    frag.appendChild(beam);

    var g = el('g', { class:'puck', id:'puck' });
    g.appendChild(el('circle', { class:'puck-ring', r:19, cx:0, cy:0 }));
    g.appendChild(el('circle', { class:'puck-core', r:13, cx:0, cy:0 }));
    var pt = el('text', { class:'puck-txt', x:0, y:4 });
    pt.textContent = 'BOX';
    g.appendChild(pt);
    frag.appendChild(g);

    /* generous invisible drag target over the puck */
    var hit = el('circle', { class:'puck-hit', id:'puckHit', r:30, cx:0, cy:0,
      fill:'transparent', tabindex:'0', role:'slider',
      'aria-label':'Gateway position — drag, or use the arrow keys',
      'aria-valuetext':'' });
    frag.appendChild(hit);

    elPlan.appendChild(frag);
  })();

  var puck = $('#puck'), puckHit = $('#puckHit'), beam = $('#beam');

  /* ---------- controls ---------- */
  elLoads.innerHTML = LOADS.map(function(l){
    return '<button class="seg-b'+(l.k===state.load?' on':'')+'" data-load="'+l.k+'">'+l.label+'</button>';
  }).join('');
  elLoads.addEventListener('click', function(e){
    var b = e.target.closest('[data-load]'); if(!b) return;
    state.load = b.dataset.load;
    elLoads.querySelectorAll('.seg-b').forEach(function(o){ o.classList.toggle('on', o===b); });
    render();
  });

  document.querySelectorAll('.view-b').forEach(function(b){
    b.addEventListener('click', function(){
      state.view = b.dataset.view;
      document.querySelectorAll('.view-b').forEach(function(o){
        var on = o === b;
        o.classList.toggle('on', on);
        o.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      elSpot.classList.toggle('ours-on', state.view === 'ours');
      render();
    });
  });

  /* ---------- dragging ---------- */
  function toPlan(evt){
    var pt = elPlan.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    var m = elPlan.getScreenCTM();
    if(!m) return null;
    return pt.matrixTransform(m.inverse());
  }
  function place(x, y){
    state.g.x = clamp(x, HOUSE.x + 16, HOUSE.x + HOUSE.w - 16);
    state.g.y = clamp(y, HOUSE.y + 16, HOUSE.y + HOUSE.h - 16);
    render();
  }

  var dragging = false;
  function down(e){
    if(state.view !== 'fwa') return;
    dragging = true;
    elPlan.classList.add('dragging');
    if(elHint) elHint.style.display = 'none';
    move(e);
    if(e.pointerId !== undefined && elPlan.setPointerCapture){
      try { elPlan.setPointerCapture(e.pointerId); } catch(err){}
    }
  }
  function move(e){
    if(!dragging) return;
    var p = toPlan(e);
    if(p) place(p.x, p.y);
    e.preventDefault();
  }
  function up(){ dragging = false; elPlan.classList.remove('dragging'); }

  elPlan.addEventListener('pointerdown', down);
  elPlan.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);

  /* keyboard: the puck is a slider you can nudge */
  puckHit.addEventListener('keydown', function(e){
    if(state.view !== 'fwa') return;
    var step = e.shiftKey ? 30 : 12, k = e.key, dx = 0, dy = 0;
    if(k === 'ArrowLeft') dx = -step;
    else if(k === 'ArrowRight') dx = step;
    else if(k === 'ArrowUp') dy = -step;
    else if(k === 'ArrowDown') dy = step;
    else return;
    e.preventDefault();
    if(elHint) elHint.style.display = 'none';
    place(state.g.x + dx, state.g.y + dy);
  });

  /* ---------- render ---------- */
  var BANDS = ['bad','ok','good'];
  var WORDS = ['Dead', 'Patchy', 'Works'];

  function render(){
    var ours = state.view === 'ours';
    var load = LOADS.filter(function(l){ return l.k === state.load; })[0];
    var base = ours ? 100 : linkQuality(state.g, load.cost);

    /* rooms */
    var good = 0, results = [];
    ROOMS.forEach(function(r){
      var q = ours ? 96 : roomQuality(state.g, r, base);
      /* fixed wireless never had a plan for outside the walls */
      if(!ours && r.outside) q = Math.max(0, q - 14);
      var b = band(q);
      if(b === 2) good++;
      results.push({ room:r, q:q, b:b });
      r.el.setAttribute('class', 'rm rm-' + BANDS[b]);
      if(r.statEl) r.statEl.textContent = WORDS[b];
    });

    /* puck + beam */
    puck.setAttribute('transform', 'translate('+state.g.x+','+state.g.y+')');
    puckHit.setAttribute('cx', state.g.x);
    puckHit.setAttribute('cy', state.g.y);
    puck.style.display = ours ? 'none' : '';
    puckHit.style.display = ours ? 'none' : '';
    beam.setAttribute('d', 'M'+state.g.x+' '+state.g.y+'L'+TOWER.x+' '+(TOWER.y+6));
    beam.style.display = ours ? 'none' : '';
    beam.setAttribute('class', 'beam' + (base < 55 ? ' weak' : ''));

    /* link meter */
    var lb = band(base);
    elLinkVal.textContent = ours ? 'Not shared with anybody' : Math.round(base) + '%';
    elLinkFill.style.width = (ours ? 100 : base) + '%';
    elLinkFill.className = 'link-fill ' + ['lo','mid','hi'][lb];

    /* score */
    elScore.textContent = good + ' of ' + ROOMS.length;
    elScore.className = 'score ' + (good >= 6 ? 'hi' : good >= 4 ? 'mid' : 'lo');
    elScoreSub.textContent = ours
      ? 'rooms that work — including the porch'
      : 'rooms that work from where the box is now';

    if(!ours){
      if(good > state.best) state.best = good;
      elBest.innerHTML = state.best
        ? 'Best you have managed so far: <b>' + state.best + ' of ' + ROOMS.length + '</b>'
        : '';
    } else {
      elBest.innerHTML = state.best
        ? 'The best you found by moving the box was <b>' + state.best + ' of ' + ROOMS.length + '</b>.'
        : '';
    }

    /* room list */
    elRooms.innerHTML = results.map(function(r){
      return '<li><span class="pip '+BANDS[r.b]+'"></span>' + r.room.label +
             '<span class="verdict">' + WORDS[r.b] + '</span></li>';
    }).join('');

    /* why */
    if(ours){
      elWhy.innerHTML = '<b>Nothing to hunt for.</b> We design the coverage for the house you actually have, ' +
        'put the equipment where it belongs, and add a second unit if the back bedroom needs one. ' +
        'The porch is included because the porch is part of your house.';
      elFootText.innerHTML = '<b>That is the difference.</b> One of these asks you to solve a puzzle every ' +
        'time you rearrange a room. The other one is just finished.';
    } else {
      var near = base >= 68, spread = good >= 4;
      elWhy.innerHTML = near && !spread
        ? '<b>Good link, wrong place.</b> Up against that window the tower comes in clean — and the far half of the house gets nothing. ' + load.note
        : !near && spread
          ? '<b>Better spread, weaker signal.</b> Move it inward and more rooms see the box, but the box can barely see the tower. ' + load.note
          : !near && !spread
            ? '<b>Worst of both.</b> Too far from the window for a decent link, too far from the middle to cover the house. ' + load.note
            : '<b>This is about as good as it gets.</b> And it is still a compromise you have to live with. ' + load.note;
      elFootText.innerHTML = 'Move the box anywhere you like. <b>There is no position that lights up the whole house</b> — ' +
        'the window that gets a good link is the wrong end of the building for everything else.';
    }

    if(elA11y){
      elA11y.textContent = ours
        ? 'With OtterDrift, all ' + ROOMS.length + ' rooms work.'
        : good + ' of ' + ROOMS.length + ' rooms usable, tower link ' + Math.round(base) + ' percent.';
    }
    puckHit.setAttribute('aria-valuetext', good + ' of ' + ROOMS.length + ' rooms working');
  }

  render();

  /* exposed for tests and for anyone embedding this on their own page */
  window.__spot = { place:place, state:state, render:render, ROOMS:ROOMS };
})();
