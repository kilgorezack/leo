/* ════════════════════════════════════════════════════════
   READ THE THIRTEENTH MONTH
   The cable "free internet" offer is a pricing structure, not
   a price. This draws all 36 months of it: the fees that land
   during the free year, the step when the promo ends, the
   second step after that — against a flat line.

   ⚠️  EVERY NUMBER BELOW IS A PLACEHOLDER.
   Promo terms, rack rates, equipment charges and surcharges
   differ by market and change constantly. Before this page
   goes anywhere near a customer, replace these with figures
   taken from the competitor's own published terms in YOUR
   footprint, keep a dated copy of the source, and have legal
   review any named comparison.
   ════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var MONTHS = 36;

  /* the cable offer, as a shape */
  var CABLE = {
    promoRate: 0,        /* months 1–12, the "free" part      */
    y2Rate: 59.99,       /* months 13–24, once promo lapses   */
    y3Rate: 79.99        /* months 25–36                      */
  };

  /* what a flat, all-in local fiber plan costs */
  var OURS = 70;

  /* the conditions that come with the offer */
  var ADDONS = [
    { k:'fees',   label:'Fees and surcharges',            amt:12, on:true,
      note:'These arrive during the free year too. Free was never zero.' },
    { k:'equip',  label:'Their router, rented',           amt:15, on:true,
      note:'Billed every month you keep it, and it is still theirs at the end.' },
    { k:'raise',  label:'The annual price adjustment',    pct:true, on:true,
      note:'A few percent a year, applied quietly, on top of the step-ups.' },
    { k:'mobile', label:'The mobile line that makes it free', amt:30, on:false,
      note:'On many of these offers the internet is only free while you carry the phone line.' }
  ];

  var $ = function(s){ return document.querySelector(s); };
  var elChart = $('#chart');
  if(!elChart) return;

  var elOpts=$('#billOpts'), elRead=$('#readout'), elFree=$('#totFree'),
      elThem=$('#totThem'), elUs=$('#totUs'), elVerdict=$('#verdict'),
      elFoot=$('#billFoot'), elA11y=$('#billA11y');

  var on = {};
  ADDONS.forEach(function(a){ on[a.k] = a.on; });

  /* ---------- the model ---------- */
  function addonsPerMonth(){
    var sum = 0;
    ADDONS.forEach(function(a){ if(on[a.k] && a.amt) sum += a.amt; });
    return sum;
  }
  function baseFor(m){                     /* m is 0-indexed */
    var base = m < 12 ? CABLE.promoRate : m < 24 ? CABLE.y2Rate : CABLE.y3Rate;
    if(on.raise && m >= 12) base *= (m < 24 ? 1.05 : 1.1);
    return base;
  }
  function cableFor(m){ return baseFor(m) + addonsPerMonth(); }

  function totals(){
    var free = 0, all = 0;
    for(var m=0;m<MONTHS;m++){
      var v = cableFor(m);
      all += v;
      if(m < 12) free += v;
    }
    return { free:free, cable:all, ours:OURS*MONTHS };
  }
  function money(n){ return '$' + Math.round(n).toLocaleString('en-US'); }

  /* ---------- controls ---------- */
  var CHECK='<svg viewBox="0 0 12 12" fill="none"><path d="M2 6.3 4.6 9 10 3.4" stroke="#16283A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  elOpts.innerHTML = ADDONS.map(function(a){
    return '<button class="chip'+(a.on?' on':'')+'" data-add="'+a.k+'" aria-pressed="'+a.on+'">' +
           '<span class="box" aria-hidden="true">'+CHECK+'</span>'+a.label+'</button>';
  }).join('');
  elOpts.addEventListener('click', function(e){
    var b = e.target.closest('[data-add]'); if(!b) return;
    var k = b.dataset.add;
    on[k] = !on[k];
    b.classList.toggle('on', on[k]);
    b.setAttribute('aria-pressed', on[k] ? 'true' : 'false');
    var a = ADDONS.filter(function(x){ return x.k === k; })[0];
    hold = on[k] && a.note ? '<b>' + a.label + '.</b> ' + a.note : null;
    render();
  });

  /* ---------- chart ---------- */
  var NS='http://www.w3.org/2000/svg';
  var W=760, H=300, L=46, R=10, T=18, B=42;
  var plotW = W-L-R, plotH = H-T-B;
  var bw = plotW/MONTHS;

  function el(n,a,p){ var e=document.createElementNS(NS,n); for(var k in a) e.setAttribute(k,a[k]); if(p)p.appendChild(e); return e; }

  elChart.setAttribute('viewBox','0 0 '+W+' '+H);
  var gGrid = el('g',{},elChart), gBars = el('g',{},elChart), gOver = el('g',{},elChart);
  var bars = [];

  function yFor(v, max){ return T + plotH - (v/max)*plotH; }

  var hold = null;   /* sticky caption after a toggle, cleared on hover */

  function render(){
    var t = totals();
    var vals = [];
    for(var m=0;m<MONTHS;m++) vals.push(cableFor(m));
    var max = Math.max(OURS, Math.max.apply(null, vals)) * 1.18;

    /* grid + axis */
    gGrid.innerHTML = '';
    [0,50,100,150].forEach(function(v){
      if(v > max) return;
      el('line',{class:'axis-line',x1:L,y1:yFor(v,max),x2:W-R,y2:yFor(v,max)},gGrid);
      var tx = el('text',{class:'axis',x:L-9,y:yFor(v,max)+4,'text-anchor':'end'},gGrid);
      tx.textContent = '$'+v;
    });
    ['Year 1','Year 2','Year 3'].forEach(function(lbl,i){
      var tx = el('text',{class:'yr-tick',x:L+bw*(i*12+6),y:H-14,'text-anchor':'middle'},gGrid);
      tx.textContent = lbl;
    });

    /* bars */
    gBars.innerHTML = '';
    bars = [];
    vals.forEach(function(v,m){
      var y = yFor(v,max);
      var r = el('rect',{
        class:'bar '+(m<12?'promo':'after'),
        x:(L+bw*m+1.5).toFixed(1), y:y.toFixed(1),
        width:Math.max(2,bw-3).toFixed(1), height:Math.max(0,(T+plotH)-y).toFixed(1),
        rx:2
      },gBars);
      r.dataset.m = m;
      bars.push(r);
    });

    /* our flat line + markers */
    gOver.innerHTML = '';
    var oy = yFor(OURS,max);
    el('line',{class:'ours-line',x1:L,y1:oy,x2:W-R,y2:oy},gOver);
    var ot = el('text',{class:'ours-tag',x:L+6,y:oy-10},gOver);
    ot.textContent = 'Us — ' + money(OURS) + ', every month, all in';

    var cx = L + bw*12;
    el('line',{class:'cliff',x1:cx,y1:T,x2:cx,y2:T+plotH},gOver);
    var ct = el('text',{class:'cliff-tag',x:cx+7,y:T+13},gOver);
    ct.textContent = 'month 13 — the promo ends';

    /* totals */
    elFree.textContent = money(t.free);
    elThem.textContent = money(t.cable);
    elUs.textContent = money(t.ours);

    var diff = t.cable - t.ours;
    elVerdict.innerHTML =
      t.free <= 0
        /* every extra switched off — don't pretend we're cheaper, make the
           point that actually survives: the number moves and ours doesn't */
        ? 'Strip every extra away and it <b>still steps up in month thirteen</b>, then again in month twenty-five. The price you were quoted was only ever the first twelve of thirty-six.'
      : diff > 0
        ? 'Over three years that is <b class="big">' + money(diff) + ' more</b> than the flat price — and the year they called free still came with ' + money(t.free) + ' of bills.'
        : 'The year they called free still came with <b>' + money(t.free) + '</b> of bills, and the number kept moving after it. Ours does not move at all.';

    elRead.innerHTML = hold ||
      '<b>Hover any month</b> to see what that bill was actually made of.';

    elFoot.innerHTML = '<b>Nothing here is a discount.</b> It is the same number thirty-six times, ' +
      'with the equipment in it, no promo to expire, and nobody to call in month thirteen to ask what happened.';

    if(elA11y){
      elA11y.textContent = 'Over 36 months: cable ' + money(t.cable) + ', including ' + money(t.free) +
        ' during the free year. Ours ' + money(t.ours) + ', flat.';
    }
  }

  /* hover readout — what that month was made of */
  elChart.addEventListener('pointermove', function(e){
    var r = e.target.closest('.bar'); if(!r) return;
    var m = +r.dataset.m;
    var parts = [];
    var base = baseFor(m);
    parts.push(base === 0 ? 'the plan at $0' : 'the plan at ' + money(base));
    ADDONS.forEach(function(a){ if(on[a.k] && a.amt) parts.push(a.label.toLowerCase() + ' ' + money(a.amt)); });
    hold = null;
    elRead.innerHTML = '<b>Month ' + (m+1) + ' — ' + money(cableFor(m)) + '</b> · ' + parts.join(' + ');
  });
  elChart.addEventListener('pointerleave', function(){
    elRead.innerHTML = hold || '<b>Hover any month</b> to see what that bill was actually made of.';
  });

  render();

  /* exposed for tests and for anyone embedding this */
  window.__bill = { render:render, on:on, totals:totals, CABLE:CABLE, OURS:OURS };
})();
