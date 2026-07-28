/* ════════════════════════════════════════════════════════
   SIGN UP THE STREET
   One control: click a neighbor's house. They join the same
   tower you're on, and the tower's capacity gets divided one
   more way. Nothing about your house changed, and your
   evening got worse — which is the entire argument.

   Deliberately the simplest tool on the site. No modes, no
   toggles, no play button. Click a house, watch two bars and
   a list react.

   The model is an illustration of peak-hour contention: at
   the hour everyone is actually online, a shared radio sector
   splits between the homes on it. Real networks lean on the
   fact that people rarely all transmit at once — which is
   true at 3pm and much less true at 8pm.
   ════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var TOTAL = 16;      /* houses on the street, including yours */
  var YOU   = 7;       /* index of your house */

  /* what an evening asks for, as a share of one tower */
  var NEEDS = [
    { label:'Email and a bit of browsing', need:2 },
    { label:'Music while you cook',        need:3 },
    { label:'One show, in HD',             need:6 },
    { label:'A work call, on camera',      need:9 },
    { label:'Two shows at once',           need:13 },
    { label:'Movie night in 4K',           need:19 },
    { label:'Gaming while somebody streams', need:26 }
  ];

  /* the headroom on our side — a busier house than the tower list ever
     gets to, so our column keeps going after theirs has run out */
  var OURS_EXTRA = [
    'Four screens on 4K, all at once',
    'Two people on camera in two different rooms',
    'A 90GB game downloading through all of it',
    'Six cameras and a doorbell recording all day',
    'The whole laptop backing itself up in the background',
    'And the far bedroom, the garage and the porch'
  ];

  var $ = function(s){ return document.querySelector(s); };
  var elStreet = $('#streetSvg');
  if(!elStreet) return;

  var elSlices=$('#slices'), elThemVal=$('#themVal'), elUsVal=$('#usVal'),
      elCount=$('#countLine'), elWorks=$('#worksList'), elWorksUs=$('#worksUsWrap'),
      elPunch=$('#punchText'), elAll=$('#signAll'), elReset=$('#reset'),
      elA11y=$('#streetA11y'), elThemNote=$('#themNote');

  var joined = {};   /* neighbor index -> true */

  /* ---------- draw the street ---------- */
  var NS = 'http://www.w3.org/2000/svg';
  function mk(name, attrs, parent){
    var n = document.createElementNS(NS, name);
    for(var k in attrs) n.setAttribute(k, attrs[k]);
    if(parent) parent.appendChild(n);
    return n;
  }

  var W = 46, GAP = 6, PAD = 8, TOP = 34;
  var svgW = TOTAL * (W + GAP) - GAP + PAD*2;
  elStreet.setAttribute('viewBox', '0 0 ' + svgW + ' 150');

  for(var i=0;i<TOTAL;i++){
    var x = PAD + i * (W + GAP);
    var isYou = i === YOU;
    var g = mk('g', {
      class:'hz' + (isYou ? ' you' : ''),
      'data-i': i,
      tabindex: isYou ? '-1' : '0',
      role: isYou ? 'img' : 'button',
      'aria-label': isYou ? 'Your house' : 'Neighbor ' + (i < YOU ? i+1 : i) + ' — sign them up to the tower',
      'aria-pressed': isYou ? null : 'false'
    }, elStreet);

    /* body + roof as one outline */
    mk('path', { class:'hz-body',
      d:'M'+x+' '+(TOP+26)+'L'+(x+W/2)+' '+TOP+'L'+(x+W)+' '+(TOP+26)+
        'V'+(TOP+72)+'H'+x+'Z' }, g);
    /* door */
    mk('rect', { class:'hz-body', x:x+W/2-7, y:TOP+50, width:14, height:22, rx:1.5 }, g);

    /* the antenna that appears when they join */
    var ant = mk('g', { class:'hz-ant' }, g);
    mk('path', { d:'M'+(x+W/2)+' '+(TOP-4)+'v-11', stroke:'#D6544A', 'stroke-width':'1.8', 'stroke-linecap':'round' }, ant);
    mk('path', { d:'M'+(x+W/2-7)+' '+(TOP-17)+'a10 10 0 0 1 14 0', stroke:'#D6544A', 'stroke-width':'1.6', fill:'none', 'stroke-linecap':'round' }, ant);

    if(isYou){
      var lab = mk('text', { class:'hz-lab', x:x+W/2, y:TOP+96 }, g);
      lab.textContent = 'You';
    } else {
      var plus = mk('text', { class:'hz-plus', x:x+W/2, y:TOP+96 }, g);
      plus.textContent = '+';
    }
    g.__x = x;
  }

  /* ---------- interaction: one click, that's it ---------- */
  function toggle(i){
    if(i === YOU) return;
    joined[i] = !joined[i];
    render();
  }
  elStreet.addEventListener('click', function(e){
    var g = e.target.closest('.hz'); if(!g) return;
    toggle(+g.dataset.i);
  });
  elStreet.addEventListener('keydown', function(e){
    if(e.key !== 'Enter' && e.key !== ' ') return;
    var g = e.target.closest('.hz'); if(!g) return;
    e.preventDefault();
    toggle(+g.dataset.i);
  });

  elAll.addEventListener('click', function(){
    var all = count() < TOTAL - 1;
    joined = {};
    if(all) for(var i=0;i<TOTAL;i++){ if(i !== YOU) joined[i] = true; }
    render();
  });
  elReset.addEventListener('click', function(){ joined = {}; render(); });

  function count(){
    var n = 0;
    for(var k in joined) if(joined[k]) n++;
    return n;
  }

  /* ---------- render ---------- */
  function render(){
    var n = count(), homes = n + 1;
    var share = 100 / homes;

    /* houses */
    elStreet.querySelectorAll('.hz').forEach(function(g){
      var i = +g.dataset.i;
      if(i === YOU) return;
      var on = !!joined[i];
      g.classList.toggle('on', on);
      g.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    /* how bad it has got, by what the household can no longer do */
    var lostNow = NEEDS.filter(function(a){ return share < a.need; }).length;
    var tone = lostNow === 0 ? 's-good' : lostNow <= 2 ? 's-warn' : 's-bad';

    /* the tower bar, split one way per home, your slice tinted by the damage */
    var html = '';
    for(var s=0;s<homes;s++){
      html += '<div class="slice' + (s === 0 ? ' mine ' + tone : '') + '" style="flex:1 1 0"></div>';
    }
    elSlices.innerHTML = html;

    elThemVal.textContent = homes === 1 ? 'The whole tower' : '1/' + homes + ' of the tower';
    elThemVal.className = 'bar-val them ' + tone;
    elUsVal.textContent = 'All of it';

    elCount.innerHTML = n === 0
      ? 'Right now you are the only house on this tower. <b>Click a neighbor to sign them up.</b>'
      : '<b>' + n + '</b> of your neighbors have signed up for the same service. Nothing about your house changed.';

    /* what still works, at the hour everyone is home */
    var TICK = '<svg viewBox="0 0 12 12" fill="none"><path d="M2 6.3 4.6 9 10 3.4" stroke="#0B131C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var CROSS = '<svg viewBox="0 0 12 12" fill="none"><path d="M3.2 3.2 8.8 8.8M8.8 3.2 3.2 8.8" stroke="#0B131C" stroke-width="2.2" stroke-linecap="round"/></svg>';
    function row(label, works, extra){
      return '<li class="' + (works ? 'ok' : 'no') + (extra ? ' extra' : '') + '">' +
        '<span class="mk">' + (works ? TICK : CROSS) + '</span>' + label + '</li>';
    }

    /* theirs: the same list, going out one item at a time */
    elWorks.innerHTML = NEEDS.map(function(a){
      return row(a.label, share >= a.need, false);
    }).join('');

    /* ours: all of that, and then a good deal more */
    elWorksUs.innerHTML =
      '<ul class="wk">' + NEEDS.map(function(a){ return row(a.label, true, false); }).join('') + '</ul>' +
      '<p class="wk-more">and still room for</p>' +
      '<ul class="wk">' + OURS_EXTRA.map(function(t){ return row(t, true, true); }).join('') + '</ul>';

    var lost = lostNow;

    elThemNote.textContent = n === 0
      ? 'One tower, one house on it. This is the evening they sold you.'
      : 'One tower, ' + homes + ' houses on it, at the hour everybody is actually online.';

    /* the punchline moves with the damage */
    elPunch.innerHTML =
      n === 0
        ? 'This is the brochure. <b>Now start signing up the street</b> — every neighbor who buys the same service is another way the same tower gets divided.'
      : lost === 0
        ? '<b>Still fine.</b> A couple of neighbors is a roommate or two. Keep going.'
      : lost <= 2
        ? '<b>There goes movie night.</b> You didn\'t change a thing — ' + n + ' other households did.'
      : lost === 3
        ? '<b>Now it\'s your work day.</b> ' + n + ' neighbors signed a contract and your call started breaking up. Nobody will ever tell you that\'s why.'
      : '<b>This is the part nobody explains.</b> The better it sells on your street, the worse it works in your house — and you\'re down to email and a radio. A line in the ground has never once cared how popular it is.';

    if(elA11y){
      elA11y.textContent = n + ' neighbors on the tower. Your share: one ' + homes +
        'th. ' + (NEEDS.length - lost) + ' of ' + NEEDS.length + ' things still work on the tower; all of them plus ' + OURS_EXTRA.length + ' more work on OtterDrift.';
    }
    elAll.textContent = n < TOTAL - 1 ? 'Sign up the whole street' : 'Clear the street';
  }

  render();

  /* exposed for tests and for anyone embedding this */
  window.__street = { render:render, toggle:toggle, count:count, joined:joined };
})();
