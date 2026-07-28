(function(){
  'use strict';

  /* ────────── QUESTIONS ──────────
     score: contributes to plan tier
     rooms: which windows light up
     flags: drive the personalized result copy
  */
  var QUESTIONS = [
    {
      time:'5:40 PM', title:'Everyone gets home.',
      sub:'How many people are about to be online at your place?',
      opts:[
        {t:'Just me, or the two of us',            s:0, rooms:['living'],                              flags:[]},
        {t:'A household of three or four',         s:2, rooms:['living','kitchen','bed1'],             flags:['household']},
        {t:'Five or more, and often a guest or two',s:3, rooms:['living','kitchen','bed1','bed2','porch'], flags:['household','guests']}
      ]
    },
    {
      time:'6:15 PM', title:'Somebody is still working.',
      sub:'Does work or school follow you home?',
      opts:[
        {t:'Not really — I clock out',              s:0, rooms:[],                        flags:[]},
        {t:'A few calls a week from the kitchen table', s:2, rooms:['kitchen'],           flags:['wfh']},
        {t:'Every single day, and it is my job on the line', s:3, rooms:['office'],       flags:['wfh','upload']},
        {t:'Two of us, on two calls, at the same time', s:4, rooms:['office','bed1'],     flags:['wfh','upload','coverage']}
      ]
    },
    {
      time:'7:30 PM', title:'Prime time.',
      sub:'What is happening all at once in your house right now?',
      opts:[
        {t:'One screen, one show',                  s:0, rooms:['living'],                       flags:[]},
        {t:'A couple of things streaming',          s:1, rooms:['living','bed1'],                flags:[]},
        {t:'A stream, a game, and somebody scrolling', s:3, rooms:['living','bed1','bed2'],      flags:['gaming']},
        {t:'All of that, in four different rooms',  s:4, rooms:['living','bed1','bed2','kitchen'], flags:['gaming','coverage']}
      ]
    },
    {
      time:'8:45 PM', title:'The far corner of the house.',
      sub:'Where does your signal give up today?',
      opts:[
        {t:'Nowhere. It works everywhere',          s:0, rooms:[],                            flags:[]},
        {t:'One stubborn room',                     s:2, rooms:['bed2'],                      flags:['coverage']},
        {t:'Upstairs, the basement, or the garage', s:3, rooms:['bed2','garage'],             flags:['coverage']},
        {t:'The porch, the shop, the whole back half', s:4, rooms:['garage','shop','yard'],   flags:['coverage','outdoor']}
      ]
    },
    {
      time:'9:20 PM', title:'Devices and bedtimes.',
      sub:'What would actually make your life easier?',
      opts:[
        {t:'Nothing — we are past that stage',      s:0, rooms:[],                    flags:[]},
        {t:'Knowing what they are actually on',     s:2, rooms:['bed1'],              flags:['controls']},
        {t:'Being able to shut the internet off at bedtime', s:3, rooms:['bed1','bed2'], flags:['controls']},
        {t:'Limits that follow the kid, not the device', s:3, rooms:['bed1','bed2'],  flags:['controls']}
      ]
    },
    {
      time:'All night', title:'The things that never sleep.',
      sub:'Cameras, doorbell, thermostat, speakers — how many?',
      opts:[
        {t:'None of that here',                     s:0, rooms:[],                     flags:[]},
        {t:'A few of them',                         s:2, rooms:['porch'],              flags:['smarthome']},
        {t:'A dozen or more, and I have lost count',s:3, rooms:['porch','yard','shop'],flags:['smarthome','security']}
      ]
    },
    {
      time:'Any time', title:'Something breaks.',
      sub:'What should happen next?',
      opts:[
        {t:'I will restart it myself and move on',  s:0, rooms:[],           flags:[]},
        {t:'Somebody local picks up the phone',     s:2, rooms:['kitchen'],  flags:['support']},
        {t:'Somebody notices before I do',          s:3, rooms:['kitchen','office'], flags:['support','proactive']},
        {t:'A truck in my driveway tomorrow',       s:4, rooms:['kitchen','office','garage'], flags:['support','truck']}
      ]
    }
  ];

  /* ────────── PLANS ────────── */
  var PLANS = {
    settle:   {name:'Settle In',            price:'$69',  el:'settle'},
    fullhouse:{name:'Full House',           price:'$89',  el:'fullhouse'},
    never:    {name:'Never Think About It', price:'$119', el:'never'}
  };

  /* flag → why-this-plan line */
  var WHY = {
    household:'There are <b>several people online at once</b>, so the plan has to hold up when everyone sits down together.',
    wfh:      'You <b>work from home</b>, which means your connection is a coworker now.',
    upload:   'You are <b>on camera</b>, and being seen clearly is half of being in the meeting.',
    gaming:   'Somebody is <b>gaming while other people stream</b>, and both need to feel instant.',
    coverage:'There are <b>rooms that do not work today</b>, and coverage is included, not an accessory you go buy.',
    outdoor:  'You need it <b>outside the four walls</b> — porch, garage, shop.',
    controls: 'You want <b>real control over screen time</b>, set by person rather than by gadget.',
    smarthome:'You have <b>a lot of always-on devices</b>, and they need to stay connected quietly.',
    security: 'That many connected devices deserve <b>protection built into the network</b>, not on each one.',
    support:  'You want <b>a person to call</b>, and you want them to be nearby.',
    proactive:'You would rather <b>we caught it first</b>, which is exactly how we run it.',
    truck:    'You want <b>a truck in the driveway</b>, which is a thing only a local provider can promise.',
    guests:   'You host, so <b>guest access should take one text message</b>.'
  };

  /* flag → satellite gap line */
  var GAPS = {
    wfh:      'A signal making a round trip to orbit adds <b>a pause to every exchange</b>. On four calls a day, you feel it.',
    upload:   'Sending is the weaker direction from a dish. <b>You are the part of the call that freezes.</b>',
    gaming:   'Competitive games are decided in fractions of a second, and <b>a trip to space costs you those fractions</b>.',
    coverage:'A dish hands you one box and wishes you luck. <b>The far bedroom is your problem to solve and your gear to buy.</b>',
    outdoor:  'Coverage past the back door is <b>entirely on you</b> — more equipment, more setup, more guessing.',
    household:'Everyone in your area shares the same overhead capacity. <b>At 8pm, that is the whole neighborhood at once.</b>',
    smarthome:'Cameras and doorbells need a connection that is boring and constant. <b>Weather is a variable up there.</b>',
    security: 'You would be securing a dozen devices one at a time. <b>We do it once, at the network.</b>',
    support:  'Support is a form you fill out. <b>Nobody is driving over.</b>',
    proactive:'Nobody is watching your connection but you, <b>so you find out when it fails.</b>',
    truck:    'There is no truck. <b>There is a replacement dish, and a shipping estimate.</b>',
    controls: 'Parental controls come from whatever router you bought, <b>not from anyone who will help you set them up.</b>',
    guests:   'Every guest is another device on capacity you are already splitting with the sky.'
  };

  var ROOMS = ['living','kitchen','bed1','bed2','office','porch','garage','shop','yard'];
  var ROOM_LABEL = {
    living:'Living room', kitchen:'Kitchen', bed1:'Upstairs bedroom', bed2:'Back bedroom',
    office:'The office', porch:'Front porch', garage:'Garage', shop:'The shop', yard:'Back yard'
  };

  /* ────────── STATE ────────── */
  var idx = 0, score = 0, flags = {}, lit = {}, answers = [];

  var $ = function(s){return document.querySelector(s)};
  var stepsEl = $('#steps'), railEl = $('#rail'), resultEl = $('#result');

  /* clone the hero house into the quiz + dark sections */
  var heroSVG = $('#heroHouse');
  // Clones reuse the hero SVG's <defs>: gradient IDs are document-scoped, so we
  // strip defs and all ids from copies to avoid duplicate-id collisions.
  function cloneHouse(target){
    var el = $(target);
    if(!el || !heroSVG) return null;
    el.innerHTML = heroSVG.innerHTML;
    var d = el.querySelector('defs');
    if(d) d.parentNode.removeChild(d);
    el.querySelectorAll('[id]').forEach(function(n){ n.removeAttribute('id'); });
    return el;
  }
  var quizSVG = cloneHouse('#quizHouse');
  /* every house is optional — lift the quiz on its own and these are simply absent */
  function houses(){ return [heroSVG, quizSVG].filter(Boolean); }

  /* ────────── LIGHTING ────────── */
  function lightRoom(room){
    if(lit[room]) return false;
    lit[room] = true;
    houses().forEach(function(svg){
      var w = svg.querySelector('[data-win="'+room+'"]');
      var g = svg.querySelector('[data-glow="'+room+'"]');
      if(w) w.classList.add('lit');
      if(g) g.classList.add('lit');
    });
    return true;
  }
  function resetRooms(){
    lit = {};
    houses().forEach(function(svg){
      svg.querySelectorAll('.win,.glow').forEach(function(n){ n.classList.remove('lit'); n.style.fill=''; });
    });
    updateCount('');
  }
  function set(sel, text){ var el = $(sel); if(el) el.textContent = text; }
  function updateCount(status){
    var n = Object.keys(lit).length;
    set('#litCount', n);
    set('#litCount2', n);
    if(status !== undefined) set('#quizStatus', status || 'Answer to light a room');
  }

  /* ────────── BUILD ────────── */
  function build(){
    railEl.innerHTML = QUESTIONS.map(function(){return '<span></span>'}).join('');
    stepsEl.innerHTML = QUESTIONS.map(function(q,qi){
      return '<div class="step' + (qi===0?' active':'') + '" data-step="'+qi+'">' +
        '<p class="q-time">'+q.time+'</p>' +
        '<h3 class="q-title">'+q.title+'</h3>' +
        '<p class="q-sub">'+q.sub+'</p>' +
        '<div class="opts">' +
          q.opts.map(function(o,oi){
            return '<button class="opt" data-q="'+qi+'" data-o="'+oi+'">' +
                   '<span class="key" aria-hidden="true">'+(oi+1)+'</span>' +
                   '<span>'+o.t+'</span></button>';
          }).join('') +
        '</div>' +
        (qi>0 ? '<button class="q-back">&larr; Back</button>' : '') +
      '</div>';
    }).join('');

    stepsEl.querySelectorAll('.opt').forEach(function(b){
      b.addEventListener('click', function(){ choose(+b.dataset.q, +b.dataset.o); });
    });
    stepsEl.querySelectorAll('.q-back').forEach(function(b){
      b.addEventListener('click', back);
    });
  }

  function show(i){
    stepsEl.querySelectorAll('.step').forEach(function(s){ s.classList.remove('active'); });
    var s = stepsEl.querySelector('[data-step="'+i+'"]');
    if(s){ s.classList.add('active'); }
    railEl.querySelectorAll('span').forEach(function(sp,n){ sp.classList.toggle('done', n < i); });
  }

  function choose(q,o){
    var opt = QUESTIONS[q].opts[o];
    answers[q] = o;
    score += opt.s;
    opt.flags.forEach(function(f){ flags[f]=true; });

    var newest = '';
    opt.rooms.forEach(function(r){ if(lightRoom(r)) newest = ROOM_LABEL[r]; });
    updateCount(newest ? newest + ' is on' : 'Nothing new to light');

    idx = q + 1;
    if(idx >= QUESTIONS.length){ finish(); } else { show(idx); }
  }

  function back(){
    if(idx === 0) return;
    idx--;
    var prev = QUESTIONS[idx].opts[answers[idx]];
    if(prev){ score -= prev.s; }
    // flags/rooms intentionally persist — going back shouldn't un-light the house
    show(idx);
    railEl.querySelectorAll('span').forEach(function(sp,n){ sp.classList.toggle('done', n < idx); });
  }

  function pickPlan(){
    if(score >= 17) return 'never';
    if(score >= 9)  return 'fullhouse';
    return 'settle';
  }

  function topFlags(map, max){
    var order = ['wfh','upload','coverage','gaming','household','support','truck','controls','smarthome','security','outdoor','proactive','guests'];
    var out = [];
    order.forEach(function(f){ if(flags[f] && map[f] && out.length < max) out.push(map[f]); });
    return out;
  }

  var TICK = '<span class="tick"><svg viewBox="0 0 12 12" fill="none"><path d="M2 6.3 4.6 9 10 3.4" stroke="#16283A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';

  function finish(){
    var key = pickPlan(), p = PLANS[key];
    $('#resName').textContent = p.name;
    $('#resPrice').textContent = p.price;

    var why = topFlags(WHY, 4);
    if(!why.length) why = ['You keep it simple, and <b>simple should still work everywhere in the house</b>.'];
    $('#resWhy').innerHTML = why.map(function(t){ return '<li>'+TICK+'<span>'+t+'</span></li>'; }).join('');

    var gaps = topFlags(GAPS, 3);
    if(!gaps.length) gaps = ['Even a quiet house notices when weather gets a vote, and <b>nobody is on the other end of the line</b> when it does.'];
    $('#resGaps').innerHTML = gaps.map(function(t){ return '<li>'+TICK+'<span>'+t+'</span></li>'; }).join('');

    document.querySelectorAll('.plan').forEach(function(el){
      el.classList.toggle('picked', el.dataset.plan === key);
    });

    stepsEl.querySelectorAll('.step').forEach(function(s){ s.classList.remove('active'); });
    railEl.querySelectorAll('span').forEach(function(sp){ sp.classList.add('done'); });
    resultEl.classList.add('on');
    updateCount('Your house, lit up');
    $('#quizCard').scrollIntoView({block:'center', behavior:'smooth'});
  }

  var retakeEl = $('#retake');
  if(retakeEl) retakeEl.addEventListener('click', function(){
    idx = 0; score = 0; flags = {}; answers = [];
    resetRooms();
    resultEl.classList.remove('on');
    document.querySelectorAll('.plan').forEach(function(el){ el.classList.remove('picked'); });
    show(0);
    var card = $('#quizCard');
    if(card) card.scrollIntoView({block:'center', behavior:'smooth'});
  });

  /* number-key shortcuts */
  document.addEventListener('keydown', function(e){
    if(!stepsEl || !resultEl || resultEl.classList.contains('on')) return;
    var n = parseInt(e.key,10);
    if(!n || n < 1 || n > 4) return;
    var active = stepsEl.querySelector('.step.active');
    if(!active) return;
    var tag = (document.activeElement.tagName||'').toLowerCase();
    if(tag === 'input' || tag === 'textarea') return;
    var b = active.querySelectorAll('.opt')[n-1];
    if(b) b.click();
  });

  /* the quiz only mounts if its markup is on the page, so this file can be
     dropped on a page that carries just the simulator (or neither) */
  if(stepsEl && railEl){
    build();
    setTimeout(function(){
      /* light two rooms on load so the house isn't a dead box */
      ['living','kitchen'].forEach(lightRoom);
      updateCount();
    }, 500);
  }


  /* ════════════════════════════════════════════════════════
     THE EVENING SIMULATOR
     Strain on the satellite side is driven by three things the
     visitor controls: the hour (shared capacity), the weather,
     and how much the household has going at once.
     ════════════════════════════════════════════════════════ */

  var ACTS = [
    { k:'call',  label:'A work call',      who:'Work call',   sens:15,
      line:'Clear. Nobody notices the internet.',
      dish:['Clear both ways',
            'You and your boss keep starting sentences at the same time',
            'Frozen mid-sentence, still saying "can you see my screen?"'] },
    { k:'game',  label:'Somebody gaming',  who:'The game',    sens:15,
      line:'Instant. Losing is a skill issue.',
      dish:['Keeping up',
            'You died behind cover again',
            'Rubber-banding. He has quit and gone outside.'] },
    { k:'movie', label:'Movie night',      who:'Movie night', sens:0,
      line:'Started in two seconds and never stopped.',
      dish:['Playing',
            'Picture drops to something blurry, then back, then blurry',
            'Spinning. Everyone is on their phone now.'] },
    { k:'work',  label:'Homework due at midnight', who:'Homework', sens:9,
      line:'Sent. She is already back on her phone.',
      dish:['Uploaded',
            'Still uploading. It is 11:40.',
            'Upload failed at 94%.'] },
    { k:'cams',  label:'Cameras and doorbell', who:'Cameras', sens:7,
      line:'All four online, all night.',
      dish:['All four online',
            'Two cameras dropped off',
            'Doorbell offline. You will find out tomorrow.'] }
  ];

  var HOURS = {
    17:{t:'5:00 PM', hint:'Most of the street is still driving home.',  load:6},
    18:{t:'6:00 PM', hint:'Dinner, and the first screens come on.',     load:20},
    19:{t:'7:00 PM', hint:'Everyone is home and online at once.',       load:34},
    20:{t:'8:00 PM', hint:'Peak. The whole neighborhood, all at once.',load:40},
    21:{t:'9:00 PM', hint:'Still busy. Nobody has gone to bed yet.',    load:33},
    22:{t:'10:00 PM',hint:'Thinning out, slowly.',                      load:17},
    23:{t:'11:00 PM',hint:'Quiet. This is satellite at its best.',      load:5}
  };

  var WX = {
    clear:{ add:0,  why:null },
    storm:{ add:30, why:'<b>Weather gets a vote.</b> A signal that goes to orbit and back is making a round trip through whatever the sky is doing. Ours comes from a few streets over, where it has never once cared what the sky is doing.' },
    snow: { add:42, why:'<b>Snow on the dish is now a chore on your list.</b> Somebody has to go outside and clear it, tonight, in this. Nobody has ever had to sweep off a buried line.' }
  };

  var WHY_LOAD  = '<b>You share the sky.</b> The capacity overhead is split among everyone near you, so the hour your street sits down together is the hour everyone feels it together. We build for the night everyone is home, because that is the only night anyone judges us on.';
  var WHY_HOUSE = '<b>Everything you turn on is competing with everything else.</b> Up there that is a fixed pie. Down here it is what the line was built for.';
  var WHY_PAUSE = '<b>There is always a pause.</b> Even on a clear, quiet night, the trip to space and back costs you a beat on every exchange. It is small. It happens forty times a day.';
  var WHY_IDLE  = 'Drag the time, change the weather, and turn things on. The house on the right never changes.';

  var sim = { hour:20, wx:'clear', on:{} };

  var qs = function(s){return document.querySelector(s)};
  var simRoot = qs('.sim');
  if(!simRoot) return;

  var elTime=qs('#simTime'), elOut=qs('#timeOut'), elHint=qs('#timeHint'),
      elChips=qs('#chips'), elRowsD=qs('#rowsDish'), elRowsL=qs('#rowsLine'),
      elEmptyD=qs('#emptyDish'), elEmptyL=qs('#emptyLine'),
      elVerD=qs('#dishVerdict'), elVerL=qs('#lineVerdict'),
      elWhy=qs('#whyText'), elPaneD=qs('#paneDish'),
      waveD=qs('#waveDish polyline'), waveL=qs('#waveLine polyline'),
      svgD=qs('#waveDish');

  var CHECK='<svg viewBox="0 0 12 12" fill="none"><path d="M2 6.3 4.6 9 10 3.4" stroke="#16283A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  elChips.innerHTML = ACTS.map(function(a){
    return '<button class="chip" data-act="'+a.k+'" aria-pressed="false">' +
           '<span class="box" aria-hidden="true">'+CHECK+'</span>'+a.label+'</button>';
  }).join('');

  elChips.querySelectorAll('.chip').forEach(function(b){
    b.addEventListener('click', function(){
      var k=b.dataset.act;
      sim.on[k] = !sim.on[k];
      b.classList.toggle('on', sim.on[k]);
      b.setAttribute('aria-pressed', sim.on[k] ? 'true' : 'false');
      render();
    });
  });

  simRoot.querySelectorAll('.seg-b').forEach(function(b){
    b.addEventListener('click', function(){
      sim.wx = b.dataset.wx;
      simRoot.querySelectorAll('.seg-b').forEach(function(o){ o.classList.toggle('on', o===b); });
      render();
    });
  });

  elTime.addEventListener('input', function(){
    sim.hour = +elTime.value;
    render();
  });

  function activeActs(){ return ACTS.filter(function(a){ return sim.on[a.k]; }); }

  function strain(){
    var acts = activeActs();
    var s = HOURS[sim.hour].load + WX[sim.wx].add + Math.max(0,(acts.length-1))*8;
    return Math.max(0, Math.min(100, s));
  }

  function why(){
    var acts = activeActs();
    if(WX[sim.wx].why) return WX[sim.wx].why;
    if(HOURS[sim.hour].load >= 33) return WHY_LOAD;
    if(acts.length >= 3) return WHY_HOUSE;
    if(acts.length) return WHY_PAUSE;
    return WHY_IDLE;
  }

  function render(){
    var h = HOURS[sim.hour];
    elOut.textContent = h.t;
    elTime.setAttribute('aria-valuetext', h.t);
    elHint.textContent = h.hint;
    elTime.style.setProperty('--fill', ((sim.hour-17)/6*100)+'%');

    var acts = activeActs(), s = strain(), worst = 0;

    elRowsD.innerHTML = acts.map(function(a){
      var lvl = 0, eff = s + a.sens;
      if(eff >= 64) lvl = 2; else if(eff >= 32) lvl = 1;
      if(lvl > worst) worst = lvl;
      var cls = lvl===2 ? 'bad' : (lvl===1 ? 'warn' : '');
      return '<li class="'+cls+'"><span class="who">'+a.who+'</span><span class="said">'+a.dish[lvl]+'</span></li>';
    }).join('');

    elRowsL.innerHTML = acts.map(function(a){
      return '<li><span class="who">'+a.who+'</span><span class="said">'+a.line+'</span></li>';
    }).join('');

    elEmptyD.style.display = acts.length ? 'none' : 'block';
    elEmptyL.style.display = acts.length ? 'none' : 'block';

    var vd = ['Fine','Annoying','Ruined'][worst];
    elVerD.textContent = acts.length ? vd : 'Idle';
    elVerD.className = 'verdict' + (!acts.length ? '' : worst===2 ? ' bad' : worst===1 ? ' warn' : ' good');
    elVerL.textContent = acts.length ? 'Unbothered' : 'Ready';
    elVerL.className = 'verdict good';

    svgD.classList.toggle('strained', acts.length > 0 && worst === 2);
    svgD.classList.toggle('calm',      acts.length > 0 && worst === 0);
    elWhy.innerHTML = why();
  }

  /* ---- waveforms ---- */
  var N = 76, W = 300, MID = 22;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function draw(el, amp, jitter, flat){
    var pts = [], i;
    for(i=0;i<N;i++){
      var x = i/(N-1)*W;
      var y = flat ? MID : MID + Math.sin(i*0.42 + phase)*amp + (Math.random()-0.5)*jitter;
      pts.push(x.toFixed(1)+','+Math.max(2,Math.min(42,y)).toFixed(1));
    }
    el.setAttribute('points', pts.join(' '));
  }

  var phase = 0, dropUntil = 0, nextRoll = 0;

  function tick(now){
    phase += 0.09;
    var s = strain();

    if(now > nextRoll){
      nextRoll = now + 420;
      if(now > dropUntil && Math.random() < (s - 45) / 190){
        dropUntil = now + 300 + Math.random()*450;
      }
    }
    var dropping = now < dropUntil && activeActs().length > 0;
    elPaneD.classList.toggle('dropping', dropping);

    draw(waveD, 3 + s*0.075, s*0.16, dropping);
    draw(waveL, 3.4, 0, false);

    requestAnimationFrame(tick);
  }

  render();
  if(reduce){
    draw(waveD, 9, 7, false);
    draw(waveL, 3.4, 0, false);
  } else {
    requestAnimationFrame(tick);
  }
})();

/* ════════════════════════════════════════════════════════
   SITE CHROME — nav scroll state + address-check form.
   Kept separate from the page logic above.
   ════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* nav gains a shadow once the hero scrolls past */
  var nav = document.querySelector('.nav');
  if(nav){
    var onScroll = function(){ nav.classList.toggle('scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive:true });
  }

  /* footer address check — client-side confirmation.
     Wire the real availability lookup where marked below. */
  var form = document.querySelector('#addrForm');
  if(form){
    var ok = document.querySelector('#addrOk');
    var okWhere = document.querySelector('#addrOkWhere');
    var input = form.querySelector('input[name="address"]');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var value = (input && input.value || '').trim();
      if(!value){ if(input) input.focus(); return; }

      /* ── Integration point ──────────────────────────────
         Send `value` to your availability API / CRM here, e.g.
           fetch('/api/check-address', {
             method:'POST',
             headers:{'Content-Type':'application/json'},
             body: JSON.stringify({ address: value })
           });
         For now we just confirm receipt on the client.
         ──────────────────────────────────────────────────── */

      if(okWhere) okWhere.textContent = value;
      form.style.display = 'none';
      var note = document.querySelector('#addrNote');
      if(note) note.style.display = 'none';
      if(ok) ok.classList.add('on');
    });
  }
})();
