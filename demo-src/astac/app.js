/* ════════════════════════════════════════════════════════
   A YEAR OF EVENINGS — ASTAC edition

   365 squares, one per evening. The visitor picks a village
   and what their nights involve; we play the year out and
   count what a dish on the roof would have taken from them,
   then run the identical year on ASTAC's buried line.

   The model is deliberately simple and seeded, so the same
   setup always produces the same year: weather by month,
   congestion by night of the week, and the occasional
   obstruction. Nothing here is a measurement — it is an
   illustration of how the two of them stack up.

   Adapted from /assets/v2.js. The original is untouched;
   what changed is the geography and the copy.
   ════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var YEAR = 2025;
  var MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  /* severe-weather likelihood by month, per community */
  var REGIONS = [
    { k:'utq',  label:'Utqiaġvik',
      m:[.55,.52,.46,.34,.22,.16,.18,.20,.28,.42,.52,.56],
      winter:'blizzard', summer:'fog',
      note:'Right on the coast, where the wind gets a say in most of the year.' },
    { k:'nui',  label:'Nuiqsut',
      m:[.48,.46,.38,.26,.14,.10,.12,.14,.20,.32,.44,.50],
      winter:'cold', summer:'storm',
      note:'Inland on the Colville, and cold enough that equipment simply gives up.' },
    { k:'wnw',  label:'Wainwright',
      m:[.50,.47,.40,.30,.20,.14,.16,.19,.27,.39,.48,.52],
      winter:'blizzard', summer:'fog',
      note:'Chukchi coast — storms off the water, and fog for most of the summer.' },
    { k:'akp',  label:'Anaktuvuk Pass',
      m:[.44,.42,.38,.30,.18,.12,.15,.17,.24,.34,.42,.46],
      winter:'wind', summer:'storm',
      note:'Up in the Brooks Range, where the weather comes straight through the pass.' }
  ];

  var ACTS = [
    { k:'call',   label:'Work calls at home' },
    { k:'game',   label:'Somebody gaming' },
    { k:'movie',  label:'Movie nights' },
    { k:'health', label:'Telehealth appointments' },
    { k:'school', label:'Homework and uploads' }
  ];

  /* what a lost evening sounded like */
  var LINES = {
    blizzard: [
      { act:'movie',  t:'Ground blizzard. Movie night turned into a conversation about the dish.' },
      { act:'call',   t:'Blowing snow all evening. You finished the call on your phone.' },
      { act:'health', t:'Whiteout. The appointment dropped twice and got rescheduled to next month.' },
      { act:null,     t:'Drifting snow packed the dish, and somebody had to go out and clear it. In that.' }
    ],
    cold: [
      { act:'call',   t:'Thirty-eight below. Everything slowed to a crawl and you gave up on the meeting.' },
      { act:'school', t:'Cold snap. The assignment failed at 94% at 11:40pm.' },
      { act:'game',   t:'Forty below. He got dropped out of the match three times and went to bed.' },
      { act:null,     t:'Cold enough that the gear on the roof stopped arguing and just quit.' }
    ],
    wind: [
      { act:'health', t:'Wind moved the dish a hair. The visit turned into a phone call.' },
      { act:'movie',  t:'Wind all night. The picture came and went with it.' },
      { act:null,     t:'Wind through the pass, and the signal went with it.' }
    ],
    fog: [
      { act:'movie',  t:'Fog rolled in off the water. The picture dropped to something blurry and stayed there.' },
      { act:'call',   t:'Fog all evening. Everyone kept asking if you were still there.' },
      { act:null,     t:'Thick fog, and the sky got a say in the evening again.' }
    ],
    storm: [
      { act:'call',   t:'Storm came through at seven. You dropped off the call twice and gave up.' },
      { act:'school', t:'Storm. The upload failed three times and the deadline was midnight.' },
      { act:null,     t:'Storm overhead. Everything crawled until it passed, then crawled a while longer.' }
    ],
    peak: [
      { act:'game',   t:'Eight o\'clock on a Sunday. Rubber-banding into walls for an hour.' },
      { act:'movie',  t:'Peak hour. Forty seconds of spinning, then everyone got out their phones.' },
      { act:'call',   t:'The whole village sat down at once, and you were mid-sentence.' },
      { act:null,     t:'Prime time. Everything you started took a run-up first.' }
    ],
    block: [
      { act:null,     t:'Something in the way. Twenty minutes of nothing, and no explanation after.' },
      { act:'school', t:'Dropped out mid-upload. No reason given, and nobody up here to ask.' },
      { act:'call',   t:'Cut out cold, twice, in the same meeting. You apologised both times.' },
      { act:'health', t:'Dropped in the middle of the appointment. You waited out the rest of it on hold.' },
      { act:null,     t:'Down for half an hour, and the help desk was four time zones away.' },
      { act:'movie',  t:'Died forty minutes into the film and came back after everyone left.' }
    ]
  };

  /* the rare night it was on us */
  var OURS_LINES = [
    'A wobble on our end. We saw it before you did and had it back inside the hour.',
    'A fault out on the line. Somebody was already driving out when it cleared.',
    'Twenty quiet minutes while we swapped something out. You got a text, then it was done.',
    'Our equipment, our problem. Fixed the same evening, and nobody had to call us.'
  ];

  /* seeded PRNG — same setup always plays the same year */
  function mulberry32(a){
    return function(){
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function seedOf(region, acts){
    var s = 0, str = region + '|' + acts.slice().sort().join(',');
    for(var i=0;i<str.length;i++){ s = (s*31 + str.charCodeAt(i)) | 0; }
    return s;
  }

  var $ = function(s){ return document.querySelector(s); };

  var elGrid=$('#grid'), elMonths=$('#months'), elLog=$('#log'), elLogEmpty=$('#logEmpty'),
      elLogHead=$('#logHead'), elPlay=$('#play'), elFlip=$('#flip'), elFlipText=$('#flipText'),
      elSub=$('#gridSub'), elVerdict=$('#verdict'), elRunNote=$('#runNote'),
      elA11y=$('#gridA11y'), elTL=$('#tLost'), elTR=$('#tRough'), elTC=$('#tClean'),
      elViews=document.querySelectorAll('.view-b');

  if(!elGrid) return;

  var state = { region:'utq', acts:{call:true, movie:true}, mode:null, playing:false, ran:false };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- controls ---------- */
  $('#regions').innerHTML = REGIONS.map(function(r,i){
    return '<button class="seg-b'+(i===0?' on':'')+'" data-reg="'+r.k+'">'+r.label+'</button>';
  }).join('');

  var CHECK='<svg viewBox="0 0 12 12" fill="none"><path d="M2 6.3 4.6 9 10 3.4" stroke="#001D38" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  $('#acts').innerHTML = ACTS.map(function(a){
    var on = !!state.acts[a.k];
    return '<button class="chip'+(on?' on':'')+'" data-act="'+a.k+'" aria-pressed="'+on+'">' +
           '<span class="box" aria-hidden="true">'+CHECK+'</span>'+a.label+'</button>';
  }).join('');

  $('#regions').addEventListener('click', function(e){
    var b = e.target.closest('[data-reg]'); if(!b) return;
    state.region = b.dataset.reg;
    $('#regions').querySelectorAll('.seg-b').forEach(function(o){ o.classList.toggle('on', o===b); });
    resetRun();
  });
  $('#acts').addEventListener('click', function(e){
    var b = e.target.closest('[data-act]'); if(!b) return;
    var k = b.dataset.act;
    state.acts[k] = !state.acts[k];
    b.classList.toggle('on', state.acts[k]);
    b.setAttribute('aria-pressed', state.acts[k] ? 'true' : 'false');
    resetRun();
  });

  /* ---------- build the grid ---------- */
  var firstDow = new Date(YEAR,0,1).getDay();   /* 0 = Sunday */
  var DAYS = 365, SLOTS = 371;
  var cells = [];

  (function buildGrid(){
    var frag = document.createDocumentFragment();
    for(var i=0;i<SLOTS;i++){
      var d = document.createElement('div');
      var dayIdx = i - firstDow;
      if(dayIdx < 0 || dayIdx >= DAYS){ d.className = 'cell blank'; }
      else { d.className = 'cell'; cells[dayIdx] = d; }
      frag.appendChild(d);
    }
    elGrid.appendChild(frag);

    /* month labels, placed on the week column their 1st falls in */
    var html = '';
    for(var m=0;m<12;m++){
      var doy = Math.round((new Date(YEAR,m,1) - new Date(YEAR,0,1)) / 86400000);
      var col = Math.floor((doy + firstDow) / 7) + 1;
      html += '<span style="grid-column-start:'+col+'">'+MON[m]+'</span>';
    }
    elMonths.innerHTML = html;
  })();

  /* ---------- the model ---------- */
  function activeActs(){
    return ACTS.filter(function(a){ return state.acts[a.k]; }).map(function(a){ return a.k; });
  }

  function simulate(){
    var acts = activeActs();
    var region = REGIONS.filter(function(r){ return r.k === state.region; })[0];
    var rand = mulberry32(seedOf(state.region, acts));
    /* more going on in the house = more ways a strained night shows up */
    var sens = 0.86 + 0.065 * acts.length;

    var dish = [], ours = [], incidents = [], fixed = [];
    var day = new Date(YEAR,0,1);

    for(var i=0;i<DAYS;i++){
      var month = day.getMonth(), dow = day.getDay();

      /* weather */
      var cause = null, strain = 0;
      if(rand() < region.m[month]){
        var heavy = rand() < 0.42;
        strain += heavy ? 2.25 : 1.1;
        /* winter runs long up here — October through April */
        cause = (month <= 3 || month >= 9) ? region.winter : region.summer;
      }
      /* the hour everyone is home — worse Fri/Sat/Sun */
      var busy = (dow === 0 || dow === 5 || dow === 6) ? 1.0 : 0.62;
      strain += busy * (0.55 + rand() * 0.45);
      if(!cause && strain > 1.25) cause = 'peak';

      /* something in the way */
      if(rand() < 0.012){ strain += 2.0; cause = 'block'; }

      strain *= sens;
      var sev = strain >= 2.25 ? 2 : strain >= 1.3 ? 1 : 0;
      dish.push(sev);
      if(sev === 2 && cause) incidents.push({ i:i, date:new Date(day), cause:cause });

      /* ours: a line in the ground has far less to argue with, but we
         don't pretend nothing ever happens — we just get to it first */
      var oSev = rand() < 0.006 ? 1 : 0;
      ours.push(oSev);
      if(oSev === 1) fixed.push({ i:i, date:new Date(day) });

      day.setDate(day.getDate() + 1);
    }

    return { dish:dish, ours:ours, incidents:incidents, fixed:fixed, rand:rand, acts:acts };
  }

  /* ---------- copy helpers ---------- */
  function fmt(d){ return MON[d.getMonth()] + ' ' + d.getDate(); }

  /* pick a line that fits the night, preferring one we haven't used yet
     so a six-item log doesn't say the same thing three times */
  function lineFor(cause, acts, rand, used){
    var pool = LINES[cause] || LINES.peak;
    var fit = pool.filter(function(l){ return !l.act || acts.indexOf(l.act) !== -1; });
    if(!fit.length) fit = pool;
    var fresh = fit.filter(function(l){ return !used || !used[l.t]; });
    var from = fresh.length ? fresh : fit;
    var pick = from[Math.floor(rand() * from.length) % from.length].t;
    if(used) used[pick] = true;
    return pick;
  }

  /* spread the log across the year rather than clustering in January */
  function pickSpread(list, n){
    if(list.length <= n) return list.slice();
    var out = [], step = list.length / n;
    for(var i=0;i<n;i++) out.push(list[Math.floor(i * step)]);
    return out;
  }

  /* ---------- rendering ---------- */
  var run = null;

  function paint(upTo, data){
    var lost=0, rough=0, clean=0;
    for(var i=0;i<DAYS;i++){
      var c = cells[i];
      if(i < upTo){
        var s = data[i];
        if(c.dataset.s !== String(s)){
          c.className = 'cell s' + s;
          c.dataset.s = String(s);
        }
        if(s===2) lost++; else if(s===1) rough++; else clean++;
      } else if(c.dataset.s !== undefined){
        c.className = 'cell'; delete c.dataset.s;
      }
    }
    elTL.textContent = lost; elTR.textContent = rough; elTC.textContent = clean;
    return { lost:lost, rough:rough, clean:clean };
  }

  function finishDish(sim){
    var t = paint(DAYS, sim.dish);
    var weeks = (t.lost / 7);
    elVerdict.innerHTML = '<b>' + t.lost + ' evenings gone</b>, and ' + t.rough +
      ' more you\'d have felt but not complained about. That is ' +
      (weeks >= 1 ? weeks.toFixed(1).replace('.0','') + ' weeks' : 'the better part of a week') +
      ' of nights spent on the internet instead of on your evening.';

    var picks = pickSpread(sim.incidents, 6), used = {};
    elLogHead.textContent = 'What went wrong, and when';
    elLog.innerHTML = picks.map(function(x){
      return '<li class="lost"><span class="when">' + fmt(x.date) + '</span>' +
             '<span class="what">' + lineFor(x.cause, sim.acts, sim.rand, used) + '</span></li>';
    }).join('');
    elLogEmpty.style.display = picks.length ? 'none' : 'block';

    elFlip.textContent = 'See the same year on ASTAC fiber';
    elFlipText.innerHTML = 'Same house, same weather, same twelve months. <b>Now run it on a line that is buried in the ground.</b>';
    elA11y.textContent = 'On a dish: ' + t.lost + ' evenings lost, ' + t.rough +
      ' rough, ' + t.clean + ' with nothing to report.';
  }

  function finishOurs(sim){
    var t = paint(DAYS, sim.ours);
    elVerdict.innerHTML = t.lost === 0 && t.rough === 0
      ? '<b>Not one evening lost.</b> Three hundred and sixty-five nights where the only thing anyone noticed was the show starting.'
      : '<b>No evenings lost.</b> ' + (t.rough === 1 ? 'One night' : t.rough + ' nights') +
        ' had a wobble, and we were already on it before anybody picked up the phone. The other ' +
        t.clean + ' nobody thought about us at all.';

    elLogHead.textContent = 'Everything that happened all year';
    elLog.innerHTML = sim.fixed.length
      ? sim.fixed.map(function(x,n){
          return '<li class="ok"><span class="when">' + fmt(x.date) + '</span>' +
                 '<span class="what">' + OURS_LINES[n % OURS_LINES.length] + '</span></li>';
        }).join('')
      : '';
    elLogEmpty.textContent = 'Nothing to report. That is the entire log.';
    elLogEmpty.style.display = sim.fixed.length ? 'none' : 'block';

    elFlip.textContent = 'Show the dish year again';
    elFlipText.innerHTML = '<b>That is the whole pitch.</b> Same year, same weather, same house full of people — and a log with nothing in it.';
    elA11y.textContent = 'With ASTAC fiber: no evenings lost across the year.';
  }

  function animate(data, done){
    if(reduce){ done(); return; }
    state.playing = true;
    elPlay.disabled = true;
    elRunNote.textContent = 'Playing the year…';
    var start = null, DUR = 2600;
    if(run) cancelAnimationFrame(run);
    (function step(ts){
      if(start === null) start = ts;
      var p = Math.min(1, (ts - start) / DUR);
      paint(Math.floor(p * DAYS), data);
      if(p < 1){ run = requestAnimationFrame(step); }
      else {
        state.playing = false;
        elPlay.disabled = false;
        elRunNote.textContent = 'Change anything above and play it again.';
        done();
      }
    })(performance.now());
  }

  function regionNote(){
    return REGIONS.filter(function(r){ return r.k === state.region; })[0].note;
  }

  function resetRun(){
    if(run) cancelAnimationFrame(run);
    state.playing = false; state.ran = false; state.mode = null; sim = null;
    cells.forEach(function(c){ c.className = 'cell'; delete c.dataset.s; });
    elTL.textContent = elTR.textContent = elTC.textContent = '—';
    elVerdict.textContent = 'Set your year up and press play.';
    markTab('dish');
    elSub.textContent = 'Every square is one evening at your place. Press play to run the year.';
    elLog.innerHTML = '';
    elLogHead.textContent = 'What went wrong, and when';
    elLogEmpty.textContent = 'The log fills in as the year plays.';
    elLogEmpty.style.display = 'block';
    elFlip.textContent = 'See the same year on ASTAC fiber';
    elFlipText.textContent = 'Play the year, then switch the two above to run the exact same twelve months on a line that\'s buried in the ground between here and the village office.';
    elPlay.disabled = false;
    elPlay.innerHTML = 'Play my year <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 3l9 5-9 5V3Z" fill="currentColor"/></svg>';
    elRunNote.textContent = '365 evenings, about four seconds.';
  }

  var sim = null;

  function markTab(view){
    elViews.forEach(function(b){
      var on = b.dataset.view === view;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  /* one path in and out of both views — the tabs, the play button and the
     bottom call-to-action all end up here */
  function showView(view){
    if(state.playing) return;
    if(!sim) sim = simulate();
    state.mode = view; state.ran = true;
    markTab(view);
    elSub.textContent = view === 'dish'
      ? regionNote()
      : 'The identical year — same weather, same house, same nights everybody was home.';
    elPlay.innerHTML = 'Play it again <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 3l9 5-9 5V3Z" fill="currentColor"/></svg>';
    animate(view === 'dish' ? sim.dish : sim.ours, function(){
      if(view === 'dish') finishDish(sim); else finishOurs(sim);
    });
  }

  elViews.forEach(function(b){
    b.addEventListener('click', function(){ showView(b.dataset.view); });
  });

  elPlay.addEventListener('click', function(){
    if(state.playing) return;
    sim = simulate();                       /* re-roll for the current setup */
    showView(state.mode || 'dish');
  });

  elFlip.addEventListener('click', function(){
    showView(state.mode === 'dish' ? 'ours' : 'dish');
    document.querySelector('.year-top').scrollIntoView({ block:'center', behavior:'smooth' });
  });

  /* reduced motion: still usable, just instant */
  if(reduce) elRunNote.textContent = '365 evenings, shown all at once.';
})();
