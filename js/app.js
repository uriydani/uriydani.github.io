/* =========================================================
   URI & DANI — interacciones
   ========================================================= */
(() => {
  'use strict';

  const { projects, content } = window.SITE;
  const MAILS = window.SITE.mails, MAIL_COPY = window.SITE.mailCopy, MAILTO = window.SITE.mailto;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover)').matches;
  const EASE = 'cubic-bezier(.22, 1, .36, 1)';
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------------------------------------------------------
     SONIDO — sintetizado con WebAudio. Solo suena tras un gesto.
     --------------------------------------------------------- */
  const Sound = (() => {
    let ctx = null, master = null, noiseBuf = null;
    let enabled = (() => { try { return sessionStorage.getItem('ud-sound') !== 'off'; } catch { return true; } })();
    const lastAt = {};
    function ensure() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = .4; master.connect(ctx.destination);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    function noise(t, dur, { type = 'bandpass', f0 = 2000, f1 = f0, q = 1, gain = .5, attack = .005 } = {}) {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf;
      const filt = ctx.createBiquadFilter(); filt.type = type; filt.Q.value = q;
      filt.frequency.setValueAtTime(f0, t); filt.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filt).connect(g).connect(master);
      src.start(t, Math.random()); src.stop(t + dur + .05);
    }
    function tone(t, dur, { f0 = 140, f1 = 50, gain = .8, type = 'sine' } = {}) {
      const o = ctx.createOscillator(); o.type = type;
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(master); o.start(t); o.stop(t + dur + .02);
    }
    const kit = {
      peel(t) { noise(t, .09, { f0: 2400, f1: 6200, q: .8, gain: .2 }); },
      rip(t) { for (let i = 0; i < 9; i++) noise(t + i * .028 + rand(0, .012), rand(.02, .05), { f0: rand(1800, 4200), q: 1.4, gain: rand(.15, .38) }); },
      open(t) { noise(t, .5, { f0: 400, f1: 2600, q: .6, gain: .22, attack: .18 }); tone(t + .5, .12, { f0: 120, f1: 60, gain: .25 }); },
      close(t) { noise(t, .3, { f0: 2400, f1: 500, q: .6, gain: .18, attack: .05 }); },
      thunk(t) { tone(t, .22, { f0: 170, f1: 45, gain: .9 }); noise(t, .07, { type: 'lowpass', f0: 1200, f1: 300, gain: .45 }); },
      click(t) { tone(t, .025, { f0: 1900, f1: 1200, gain: .12, type: 'square' }); },
      flip(t) { noise(t, .55, { f0: 350, f1: 2200, q: .6, gain: .25, attack: .2 }); tone(t + .56, .08, { f0: 200, f1: 90, gain: .2 }); },
      swish(t) { noise(t, .22, { f0: 900, f1: 3000, q: .7, gain: .16, attack: .06 }); }
    };
    function play(id) {
      if (!enabled || !kit[id]) return;
      const now = performance.now();
      if (id === 'peel' && now - (lastAt.peel || 0) < 150) return;
      lastAt[id] = now;
      if (!ensure()) return;
      kit[id](ctx.currentTime + .005);
    }
    function set(on) {
      enabled = on;
      try { sessionStorage.setItem('ud-sound', on ? 'on' : 'off'); } catch {}
      $$('[data-sound-toggle]').forEach(b => {
        b.setAttribute('aria-pressed', String(on));
        $$('.sound-btn__label', b).forEach(l => l.textContent = on ? 'SONIDO ON · SONIDO ON · SONIDO ON ·' : 'SONIDO OFF · SONIDO OFF · SONIDO OFF ·');
      });
      if (on) { ensure(); play('click'); }
    }
    return { play, set, unlock: ensure, get on() { return enabled; } };
  })();
  Sound.set(Sound.on);
  $$('[data-sound-toggle]').forEach(b => b.addEventListener('click', () => Sound.set(!Sound.on)));
  document.addEventListener('click', e => { if (e.target.closest('[data-sound="click"]')) Sound.play('click'); });

  /* ---------------------------------------------------------
     UTILIDADES
     --------------------------------------------------------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('is-on'), 2600);
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-pending]');
    if (a) { e.preventDefault(); toast('Link pendiente'); }
  });

  /* Copia los DOS mails separados por coma: pegado en el campo "Para" de Gmail
     (o de cualquier cliente) se convierte en dos destinatarios. */
  function copyMails() {
    const txt = MAIL_COPY;
    const done = () => toast('Copiados los 2 mails — pegalos en el "Para"');
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(txt).then(done).catch(() => fallbackCopy(txt, done));
    } else fallbackCopy(txt, done);
  }
  function fallbackCopy(txt, done) {
    const ta = document.createElement('textarea');
    ta.value = txt; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (err) { toast(txt); }
    ta.remove();
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-copy-mails]');
    if (b) { e.preventDefault(); copyMails(); Sound.play?.('click'); }
  });

  let lockCount = 0;
  function lock(on) {
    lockCount = Math.max(0, lockCount + (on ? 1 : -1));
    const sbw = innerWidth - document.documentElement.clientWidth;
    if (lockCount) { if (on) document.body.style.paddingRight = sbw + 'px'; document.body.classList.add('is-locked'); }
    else { document.body.style.paddingRight = ''; document.body.classList.remove('is-locked'); }
  }

  const dialogs = [];
  const pushDialog = (el, onClose) => dialogs.push({ el, onClose });
  const popDialog = el => { const i = dialogs.findIndex(d => d.el === el); if (i > -1) dialogs.splice(i, 1); };
  document.addEventListener('keydown', e => {
    const top = dialogs[dialogs.length - 1];
    if (e.key === 'Escape') {
      if (top) { e.preventDefault(); top.onClose(); return; }
      if (!$('#navpanel').hidden) toggleNav(false);
    }
    if (e.key === 'Tab' && top) {
      const f = $$('button, a[href], video[controls]', top.el).filter(x => x.offsetParent !== null || x.matches('.x-btn'));
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!top.el.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  });

  function tilt(el, target, max = 10) {
    if (reduced || !canHover) return;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      target.style.setProperty('--tiltY', (((e.clientX - r.left) / r.width - .5) * max).toFixed(2) + 'deg');
      target.style.setProperty('--tiltX', (-((e.clientY - r.top) / r.height - .5) * max).toFixed(2) + 'deg');
    });
    el.addEventListener('pointerleave', () => { target.style.setProperty('--tiltX', '0deg'); target.style.setProperty('--tiltY', '0deg'); });
  }

  function restamp(el) {
    if (el._stamping) return;
    el._stamping = true;
    const b = getComputedStyle(el).transform; const base = b === 'none' ? '' : b;
    el.animate([
      { transform: `${base} scale(1)`, opacity: 1 },
      { transform: `${base} scale(1.2) rotate(3deg)`, opacity: .15, offset: .35 },
      { transform: `${base} scale(1)`, opacity: 1 }
    ], { duration: 380, easing: 'cubic-bezier(.3,.9,.3,1.1)' }).onfinish = () => { el._stamping = false; };
    Sound.play('thunk');
  }

  /* ---------------------------------------------------------
     NAV
     --------------------------------------------------------- */
  const nav = $('#nav'), burger = $('.nav__burger'), panel = $('#navpanel');
  addEventListener('scroll', () => nav.classList.toggle('is-scrolled', scrollY > 30), { passive: true });
  function toggleNav(open) { panel.hidden = !open; burger.setAttribute('aria-expanded', String(open)); Sound.play('click'); }
  burger.addEventListener('click', () => toggleNav(panel.hidden));
  panel.addEventListener('click', e => { if (e.target.closest('a')) toggleNav(false); });
  const navLinks = $$('.nav__links a');
  const sectionIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['hero', 'laburos', 'content', 'nosotros', 'contacto'].forEach(id => sectionIO.observe(document.getElementById(id)));

  const revealIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    if (el.matches('.reveal')) el.classList.add('is-in');
    if (el.matches('[data-stampin]')) {
      const delay = el.closest('.footer__stamps') ? [...el.parentNode.children].indexOf(el) * 140 : 0;
      setTimeout(() => el.classList.add('is-stamped'), delay);
    }
    revealIO.unobserve(el);
  }), { threshold: .15 });
  $$('.reveal, [data-stampin]').forEach(el => revealIO.observe(el));
  $$('[data-restamp]').forEach(el => el.addEventListener('pointerenter', () => restamp(el)));

  /* ---------------------------------------------------------
     01 HERO
     --------------------------------------------------------- */
  const hero = $('#hero'), poster = $('#poster');
  function fitPoster() {
    poster.style.zoom = 1;
    if (innerWidth < 700) return;
    poster.style.zoom = Math.max(.62, Math.min(1, (innerHeight - 64 - 70) / poster.offsetHeight)).toFixed(3);
  }
  fitPoster();
  addEventListener('resize', fitPoster);
  document.fonts?.ready.then(fitPoster);

  if (!reduced) {
    document.body.classList.add('is-intro');
    const go = () => requestAnimationFrame(() => { document.body.classList.remove('is-intro'); document.body.classList.add('hero-in'); });
    Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 900))]).then(go);
    hero.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      poster.style.setProperty('--ty', ((e.clientX / innerWidth - .5) * 5).toFixed(2) + 'deg');
      poster.style.setProperty('--tx', (-(e.clientY / innerHeight - .5) * 4).toFixed(2) + 'deg');
    });
    hero.addEventListener('pointerleave', () => { poster.style.setProperty('--ty', '0deg'); poster.style.setProperty('--tx', '0deg'); });
  }

  const tabsEl = $('#tabs');
  const TAB_COUNT = 12, PRE_TORN = [2, 6, 9];
  let firstTear = true;
  function buildTabs(animate) {
    tabsEl.innerHTML = '';
    for (let i = 0; i < TAB_COUNT; i++) {
      const t = document.createElement('button');
      t.className = 'tab' + (animate ? ' is-new' : ''); t.type = 'button';
      if (animate) t.style.animationDelay = i * 40 + 'ms';
      t.style.setProperty('--wob', (i % 2 ? -1.6 : 1.6) + 'deg');
      t.setAttribute('aria-label', 'Arrancar papelito con nuestro contacto');
      t.innerHTML = `<span class="tab__txt">${i % 3 === 1 ? 'NUESTROS MAILS' : '0800-URI-DANI'}</span>`;
      if (!animate && PRE_TORN.includes(i)) { t.classList.add('is-torn'); t.tabIndex = -1; t.setAttribute('aria-hidden', 'true'); }
      tabsEl.appendChild(t);
      bindTab(t);
    }
  }
  function bindTab(t) {
    let sx = 0, sy = 0, dragging = false, lastY = 0, lastT = 0, vy = 0, vx = 0;
    t.addEventListener('pointerdown', e => {
      if (t.classList.contains('is-torn')) return;
      dragging = true; sx = e.clientX; sy = lastY = e.clientY; lastT = performance.now(); vy = vx = 0;
      t.setPointerCapture(e.pointerId); t.style.transition = 'none';
      Sound.unlock();
    });
    t.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dy = Math.max(0, e.clientY - sy), dx = e.clientX - sx, now = performance.now();
      vy = (e.clientY - lastY) / Math.max(1, now - lastT) * 16; vx = dx * .05; lastY = e.clientY; lastT = now;
      t.style.transform = `translateY(${dy * .28}px) rotate(${dx * .08}deg) scaleY(${1 + dy * .0015})`;
      if (dy > 70) { dragging = false; tear(t, vx, Math.max(vy, 3)); }
    });
    t.addEventListener('pointerup', e => {
      if (!dragging) return;
      dragging = false;
      if (Math.hypot(e.clientX - sx, e.clientY - sy) < 6) tear(t, rand(-2, 2), 4);
      else { t.style.transition = ''; t.style.transform = ''; }
    });
    t.addEventListener('pointercancel', () => { dragging = false; t.style.transition = ''; t.style.transform = ''; });
    t.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tear(t, rand(-2, 2), 4); } });
  }
  function tear(t, vx, vy) {
    const r = t.getBoundingClientRect();
    t.style.transition = ''; t.style.transform = '';
    const f = document.createElement('div');
    f.className = 'tab-fall'; f.innerHTML = t.innerHTML;
    Object.assign(f.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    document.body.appendChild(f);
    t.classList.add('is-torn'); t.tabIndex = -1;
    Sound.play('rip');
    if (firstTear) { firstTear = false; copyMails(); }
    const next = $$('.tab:not(.is-torn)', tabsEl)[0];
    if (next && document.activeElement === t) next.focus();
    if (!next) setTimeout(() => buildTabs(true), 1400); // se reponen solos

    if (reduced) { f.animate([{ opacity: 1 }, { opacity: 0 }], 300).onfinish = () => f.remove(); return; }
    let x = 0, y = 0, rot = 0, vr = rand(-5, 5) + vx, sway = rand(0, 6.28), last = performance.now();
    (function step(now) {
      const dt = Math.min(2.5, (now - last) / 16.67); last = now;
      vy += .55 * dt; vy *= .985; sway += .06 * dt;
      x += (vx + Math.sin(sway) * 1.6) * dt; y += vy * dt; rot += vr * dt; vr *= .99;
      f.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
      if (r.top + y < innerHeight + 200) requestAnimationFrame(step); else f.remove();
    })(last);
  }
  buildTabs(false);

  /* ---------------------------------------------------------
     02 LABUROS — estampillas
     --------------------------------------------------------- */
  const album = $('#album');
  function stampArt(p) {
    const s = p.stamp;
    if (s.kind === 'png') return `<img class="stamp__png" src="${s.src}" alt="" draggable="false">`;
    const shape = `url('assets/stamps/${s.shape}.png')`;
    return `<span class="cstamp" style="-webkit-mask-image:${shape};mask-image:${shape};--ratio:${s.ratio};--pos:${s.pos};--zoom:${s.zoom || 1};--bright:${s.bright || 1.08};--paper-s:${s.paper};--ink-s:${s.ink}">
      <span class="cstamp__micro">Correo Uri &amp; Dani · ${p.year}</span>
      <span class="cstamp__frame">
        <span class="cstamp__photo"><img src="${s.img}" alt="" draggable="false" loading="lazy"></span>
        <span class="cstamp__label">${s.label}</span>
        <span class="cstamp__denom">${s.denom}</span>
      </span>
      <span class="cstamp__micro cstamp__micro--bot">${p.client}</span>
    </span>`;
  }
  const cancelSvg = year => `<span class="cancel" aria-hidden="true"><svg viewBox="0 0 320 120">
    <g filter="url(#ink)"><circle cx="64" cy="60" r="46"/><circle cx="64" cy="60" r="35"/>
    <text x="64" y="56" text-anchor="middle">BS.AS.</text><text x="64" y="74" text-anchor="middle">${year}</text>
    <path d="M122 34q20-13 40 0t40 0 40 0 40 0 40 0M122 56q20-13 40 0t40 0 40 0 40 0 40 0M122 78q20-13 40 0t40 0 40 0 40 0 40 0"/></g></svg></span>`;
  const stampEls = projects.map((p, i) => {
    const b = document.createElement('button');
    b.className = 'stamp'; b.type = 'button'; b.dataset.id = p.id;
    b.style.setProperty('--rot', p.stamp.rot + 'deg');
    b.style.width = `clamp(${Math.round(p.stamp.w * .5)}px, ${(p.stamp.w / 12).toFixed(1)}vw, ${p.stamp.w}px)`;
    b.setAttribute('aria-label', `Nº${p.n}: ${p.title}, ${p.client}. Abrir proyecto`);
    b.innerHTML = `<span class="stamp__tilt"><span class="stamp__cut">${stampArt(p)}</span><span class="stamp__curl"></span>${p.stamp.postmark ? cancelSvg(p.year) : ''}</span>
      <span class="stamp__tag"><b>Nº${p.n}</b> · ${p.title}</span>`;
    tilt(b, $('.stamp__tilt', b), 12);
    b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') Sound.play('peel'); });
    album.appendChild(b);
    return b;
  });
  let lastPointer = 'mouse';
  document.addEventListener('pointerdown', e => {
    lastPointer = e.pointerType;
    if (!e.target.closest('.stamp')) stampEls.forEach(s => s.classList.remove('is-lifted'));
  }, true);
  stampEls.forEach((el, i) => el.addEventListener('click', () => {
    if (lastPointer === 'touch' && !el.classList.contains('is-lifted')) {
      stampEls.forEach(s => s.classList.remove('is-lifted'));
      el.classList.add('is-lifted'); Sound.play('peel');
      return;
    }
    stampEls.forEach(s => s.classList.remove('is-lifted'));
    openProject(i, el);
  }));

  /* ---------- Afiche de proyecto ---------- */
  const scrim = $('#scrim'), win = $('#projectWin'), stage = $('#winStage'), winClose = $('[data-close]', win);
  let current = -1, openerEl = null, busy = false;
  const starSvg = '<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#star"/></svg>';

  function posterHTML(p) {
    const len = p.title.length;
    const fs = Math.min(150, Math.round(980 / (len * .5 + 1)));
    const kind = p.kind || (p.video ? 'Videocaso' : 'Gráfica');
    const cover = p.cover
      ? `<img src="${p.cover}" alt="Portada de ${p.title}" style="--cp:${p.coverPos || '50% 50%'};--cz:${p.coverZoom || 1}">`
      : `<video src="${p.video}#t=8" muted playsinline preload="metadata"></video>`;
    // Boards y piezas: una por fila, a todo el ancho del afiche
    const gallery = (label, list, alt) => list.length
      ? `<p class="pp__label">${label}</p><div class="pp__board">${list.map((src, i) => `<img src="${src}" alt="${alt} ${i + 1}" loading="lazy">`).join('')}</div>` : '';
    const boards = gallery(p.board.length > 1 ? 'Las gráficas' : 'El board', p.board, `${p.title}, board`);
    const extras = gallery('Piezas', p.extras || [], `${p.title}, pieza`);
    const prev = projects[(current - 1 + projects.length) % projects.length];
    const next = projects[(current + 1) % projects.length];
    return `<article class="pp perf">
      <p class="pp__top"><span>Uri &amp; Dani</span><i></i><span>Nº${String(p.n).padStart(2, '0')}</span></p>
      <svg class="pp__arc" viewBox="0 0 1000 300" role="img" aria-labelledby="ppTitle">
        <title id="ppTitle">${p.title}</title>
        <path id="ppArcPath" d="M 70 290 Q 500 10 930 290" fill="none"/>
        <text font-size="${fs}" text-anchor="middle" letter-spacing="2"><textPath href="#ppArcPath" startOffset="50%">${p.title}</textPath></text>
      </svg>
      <div class="pp__stage${p.award ? " has-award" : ""}">
        <span class="pp__side pp__side--l">${p.year}</span>
        <div class="pp__oval">${cover}</div>
        <span class="pp__side pp__side--r">${p.year}</span>
        <span class="stk stk--rect stk--a">${p.client}</span>
        <span class="stk stk--burst stk--b"><svg viewBox="0 0 200 120"><use href="#burst"/></svg><span>Nº${p.n}</span></span>
        <span class="stk stk--tag stk--c">${p.tags[0]}</span>
        ${p.award ? `<span class="stk stk--award stk--e">${p.award.replace(' · ', '<br>')}</span>` : ''}
        <span class="stk stk--round stk--d"><svg viewBox="0 0 100 100"><defs><path id="stkRing" d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1-76 0"/></defs><text><textPath href="#stkRing">URI &amp; DANI · ${kind.toUpperCase()} ·</textPath></text></svg><b>'${String(p.year).slice(2)}</b></span>
      </div>
      <p class="pp__credits">Dir. de arte Uri ★ Redacción Dani</p>
      <div class="pp__stars" aria-hidden="true">${starSvg}${starSvg}${starSvg}</div>
      <p class="pp__lead">${p.lead}</p>
      ${p.note ? `<p class="pp__note">${p.note}</p>` : ''}
      ${p.video ? `<div><button class="pp__play" data-play><i></i>Play ${kind.toLowerCase()}</button></div>` : ''}
      ${boards}${extras}
      <nav class="pp__nav" aria-label="Otros laburos">
        <button data-go="-1">← Nº${prev.n} ${prev.title}</button>
        <button data-go="1">Nº${next.n} ${next.title} →</button>
      </nav>
      <svg class="pp__foot" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 4l11 35 37 1-30 22 11 36-29-22-30 22 11-36L2 40l37-1z"/></svg>
    </article>`;
  }

  function openProject(i, el) {
    if (busy) return; busy = true;
    current = i; openerEl = el;
    stage.innerHTML = posterHTML(projects[i]);
    el.classList.add('is-pressed');
    Sound.play('open');
    lock(true);
    scrim.hidden = false; win.hidden = false; win.scrollTop = 0;
    pushDialog(win, closeProject);
    if (reduced) {
      el.classList.remove('is-pressed'); busy = false; winClose.focus({ preventScroll: true }); return;
    }
    scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: 'ease' });
    winClose.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay: 450, easing: EASE, fill: 'backwards' });
    stage.animate([
      { transform: 'translateY(105vh) rotate(8deg)' },
      { transform: 'translateY(-14px) rotate(-1.2deg)', offset: .72 },
      { transform: 'translateY(0) rotate(0deg)' }
    ], { duration: 820, easing: 'cubic-bezier(.2,.7,.2,1)', delay: 90 }).onfinish = () => {
      busy = false; winClose.focus({ preventScroll: true });
    };
    setTimeout(() => el.classList.remove('is-pressed'), 380);
  }

  function closeProject() {
    if (busy) return; busy = true;
    popDialog(win);
    Sound.play('close');
    const done = () => { win.hidden = true; scrim.hidden = true; stage.innerHTML = ''; lock(false); busy = false; openerEl?.focus({ preventScroll: true }); };
    if (reduced) return done();
    stage.animate([{ transform: 'none' }, { transform: 'translateY(105vh) rotate(-7deg)' }], { duration: 480, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
    winClose.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 480, delay: 120, fill: 'forwards' }).onfinish = () => {
      stage.getAnimations().forEach(a => a.cancel()); winClose.getAnimations().forEach(a => a.cancel()); scrim.getAnimations().forEach(a => a.cancel());
      done();
    };
  }

  function goProject(dir) {
    if (busy) return; busy = true;
    Sound.play('swish');
    current = (current + dir + projects.length) % projects.length;
    openerEl = stampEls[current];
    const out = stage.animate([{ transform: 'none', opacity: 1 }, { transform: `translateX(${-dir * 30}%) rotate(${-dir * 3}deg)`, opacity: 0 }], { duration: reduced ? 1 : 260, easing: 'ease-in', fill: 'forwards' });
    out.onfinish = () => {
      stage.innerHTML = posterHTML(projects[current]);
      win.scrollTop = 0; out.cancel();
      stage.animate([{ transform: `translateX(${dir * 30}%) rotate(${dir * 3}deg)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: reduced ? 1 : 520, easing: EASE }).onfinish = () => { busy = false; };
    };
  }

  stage.addEventListener('click', e => {
    if (e.target.closest('[data-play]')) {
      const p = projects[current];
      Sound.play('thunk');
      openPlayer(p.youtube ? { youtube: p.youtube } : { src: p.video }, false, e.target.closest('[data-play]'),
        { left: `Nº${String(p.n).padStart(2, '0')} · ${p.title}`, right: `${p.kind} · ${p.client}` });
    }
    const go = e.target.closest('[data-go]');
    if (go) goProject(Number(go.dataset.go));
  });
  winClose.addEventListener('click', closeProject);
  win.addEventListener('click', e => { if (e.target === win) closeProject(); });

  /* ---------- Player (archivo local o YouTube, con la misma barra) ---------- */
  const player = $('#player'), playerFrame = $('#playerFrame');
  let playerFrom = null, media = null;
  const fmt = s => isFinite(s) && s > 0 ? `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '00:00';
  const ICON = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
    sound: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="st" d="M16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/></svg>',
    mute: '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="st" d="M16 9l5 6M21 9l-5 6"/></svg>',
    full: '<svg viewBox="0 0 24 24"><path class="st" d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>'
  };

  // Adaptador para <video>
  function videoMedia(v, onChange) {
    ['play', 'pause', 'ended', 'timeupdate', 'progress', 'loadedmetadata'].forEach(ev => v.addEventListener(ev, onChange));
    return {
      play: () => v.play().catch(() => {}), pause: () => v.pause(),
      get paused() { return v.paused; }, get time() { return v.currentTime; }, set time(t) { v.currentTime = t; },
      get duration() { return v.duration; }, get muted() { return v.muted; }, set muted(m) { v.muted = m; },
      get buffered() { return v.buffered.length && v.duration ? v.buffered.end(v.buffered.length - 1) / v.duration : 0; },
      destroy() { v.pause(); }
    };
  }

  // Adaptador para YouTube (IFrame API, sin controles propios de YouTube)
  let ytApi = null;
  const loadYT = () => ytApi || (ytApi = new Promise(res => {
    if (window.YT && window.YT.Player) return res();
    window.onYouTubeIframeAPIReady = res;
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s);
  }));
  function youtubeMedia(el, id, onChange, onFail) {
    let yt = null, ready = false, state = -1, timer = 0, dead = false;
    loadYT().then(() => {
      if (dead) return;
      yt = new YT.Player(el, {
        videoId: id,
        playerVars: { autoplay: 1, controls: 0, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3, fs: 0, disablekb: 1, origin: location.origin },
        events: {
          onReady: () => { ready = true; yt.playVideo(); onChange(); },
          onStateChange: e => { state = e.data; onChange(); },
          onError: () => { dead = true; clearInterval(timer); onFail(); }
        }
      });
      timer = setInterval(onChange, 250);
    });
    return {
      play: () => ready && yt.playVideo(), pause: () => ready && yt.pauseVideo(),
      get paused() { return state !== 1 && state !== 3; },
      get time() { return ready ? yt.getCurrentTime() : 0; }, set time(t) { if (ready) yt.seekTo(t, true); },
      get duration() { return ready ? yt.getDuration() : 0; },
      get muted() { return ready && yt.isMuted(); }, set muted(m) { if (ready) m ? yt.mute() : yt.unMute(); },
      get buffered() { return ready ? yt.getVideoLoadedFraction() : 0; },
      destroy() { dead = true; clearInterval(timer); try { yt && yt.destroy(); } catch {} }
    };
  }

  function openPlayer(source, vertical, fromEl, meta = {}) {
    playerFrame.classList.toggle('is-vertical', !!vertical);
    playerFrame.innerHTML = `<div class="pl perf">
      <p class="pl__top"><span>${meta.left || 'Uri &amp; Dani'}</span><i aria-hidden="true"></i><span>${meta.right || ''}</span></p>
      <div class="pl__screen">
        ${source.youtube ? '<div class="pl__yt"><div id="plYT"></div></div>' : `<video src="${source.src}" autoplay playsinline></video>`}
        <button class="pl__big" type="button" aria-label="Reproducir">${ICON.play}</button>
      </div>
      <div class="pl__bar">
        <button class="pl__btn pl__toggle" type="button" aria-label="Pausar">${ICON.pause}</button>
        <span class="pl__time"><b class="pl__cur">00:00</b> / <span class="pl__dur">00:00</span></span>
        <div class="pl__track" role="slider" tabindex="0" aria-label="Posición del video" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <div class="pl__buf"></div><div class="pl__fill"><svg class="pl__knob" viewBox="0 0 100 100" aria-hidden="true"><use href="#star"/></svg></div>
        </div>
        <button class="pl__btn pl__mute" type="button" aria-label="Silenciar">${ICON.sound}</button>
        <button class="pl__btn pl__full" type="button" aria-label="Pantalla completa">${ICON.full}</button>
      </div>
    </div>`;
    wirePlayer(source);
    player.hidden = false; lock(true); playerFrom = fromEl || null;
    pushDialog(player, closePlayer);
    $('.pl__toggle', playerFrame).focus({ preventScroll: true });
    $$('#vgrid video').forEach(v => v.pause());
    if (!reduced) {
      player.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
      playerFrame.animate([{ transform: 'translateY(30px) scale(.96)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 460, easing: EASE });
    }
  }
  function closePlayer() {
    popDialog(player);
    media?.pause();
    player.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced ? 1 : 200 }).onfinish = () => {
      media?.destroy(); media = null;
      player.hidden = true; playerFrame.innerHTML = ''; lock(false);
      playerFrom?.focus({ preventScroll: true });
      resumeGrid();
    };
  }
  function wirePlayer(source) {
    const root = $('.pl', playerFrame), big = $('.pl__big', root);
    const toggle = $('.pl__toggle', root), mute = $('.pl__mute', root), track = $('.pl__track', root);
    const fill = $('.pl__fill', root), buf = $('.pl__buf', root), cur = $('.pl__cur', root), dur = $('.pl__dur', root);
    let wasPaused = null;
    const update = () => {
      if (!media) return;
      const paused = media.paused;
      if (paused !== wasPaused) {
        wasPaused = paused;
        root.classList.toggle('is-paused', paused);
        toggle.innerHTML = paused ? ICON.play : ICON.pause;
        toggle.setAttribute('aria-label', paused ? 'Reproducir' : 'Pausar');
      }
      const d = media.duration, t = media.time;
      const pct = d ? t / d * 100 : 0;
      fill.style.width = pct + '%'; cur.textContent = fmt(t); dur.textContent = fmt(d);
      buf.style.width = media.buffered * 100 + '%';
      track.setAttribute('aria-valuenow', Math.round(pct));
    };
    const fail = () => {
      root.classList.add('is-blocked');
      $('.pl__screen', root).insertAdjacentHTML('beforeend', `<div class="pl__blocked"><p>Este video se ve en YouTube<br><small>YouTube no deja reproducirlo dentro de la web</small></p><a class="pp__play" href="https://youtu.be/${source.youtube}" target="_blank" rel="noopener"><i></i>Ver en YouTube ↗</a></div>`);
    };
    media = source.youtube ? youtubeMedia($('#plYT', root), source.youtube, update, fail) : videoMedia($('video', root), update);

    const playPause = () => { Sound.play('click'); media.paused ? media.play() : media.pause(); };
    $('video', root)?.addEventListener('click', playPause);
    big.addEventListener('click', playPause); toggle.addEventListener('click', playPause);
    mute.addEventListener('click', () => {
      media.muted = !media.muted; Sound.play('click');
      setTimeout(() => {
        mute.innerHTML = media.muted ? ICON.mute : ICON.sound;
        mute.setAttribute('aria-label', media.muted ? 'Activar sonido' : 'Silenciar');
      }, 60);
    });
    $('.pl__full', root).addEventListener('click', () => {
      const el = $('.pl__screen', root);
      if (document.fullscreenElement) document.exitFullscreen();
      else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
    });
    const seekTo = x => {
      const r = track.getBoundingClientRect();
      if (media.duration) media.time = Math.max(0, Math.min(1, (x - r.left) / r.width)) * media.duration;
      update();
    };
    track.addEventListener('pointerdown', e => {
      track.setPointerCapture(e.pointerId); seekTo(e.clientX);
      const move = ev => seekTo(ev.clientX);
      track.addEventListener('pointermove', move);
      track.addEventListener('pointerup', () => track.removeEventListener('pointermove', move), { once: true });
    });
    root.addEventListener('keydown', e => {
      if (e.key === ' ' && !e.target.closest('button')) { e.preventDefault(); playPause(); }
      if (e.key === 'ArrowRight') media.time = Math.min(media.duration || 0, media.time + 5);
      if (e.key === 'ArrowLeft') media.time = Math.max(0, media.time - 5);
    });
    update();
  }
  $('[data-close]', player).addEventListener('click', closePlayer);
  player.addEventListener('click', e => { if (e.target === player) closePlayer(); });

  /* ---------------------------------------------------------
     03 CONTENT — estampillas de video
     --------------------------------------------------------- */
  const vgrid = $('#vgrid');
  const rots = [-2.2, 1.6, -1, 2.4, 1.2, -2.6, 2, -1.4];
  const visibleVids = new Set();
  content.forEach((c, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'vstamp';
    b.style.setProperty('--rot', rots[i % rots.length] + 'deg');
    b.setAttribute('aria-label', `Ver con sonido: ${c.title}, ${c.who}. Contenido por ${c.by}`);
    b.innerHTML = `<span class="vstamp__paper perf">
        <span class="vstamp__media"><video data-src="${c.src}" muted loop playsinline preload="none"></video>
          <span class="vstamp__sound" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4zM17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11"/></svg></span>
        </span>
        <span class="vstamp__cap"><b>${String(i + 1).padStart(2, '0')}</b><span>${c.title}<em>${c.who} · Contenido por ${c.by}</em></span></span>
      </span>`;
    b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') Sound.play('peel'); });
    b.addEventListener('click', () => { Sound.play('thunk'); openPlayer({ src: c.src }, true, b, { left: `Content ${String(i + 1).padStart(2, '0')} · ${c.who}`, right: `Contenido por ${c.by}` }); });
    vgrid.appendChild(b);
  });
  const vidIO = new IntersectionObserver(entries => entries.forEach(en => {
    const v = $('video', en.target);
    if (en.isIntersecting) {
      if (!v.src) v.src = v.dataset.src;
      visibleVids.add(v);
      if (player.hidden && !reduced) v.play().catch(() => {});
    } else { visibleVids.delete(v); v.pause(); }
  }), { rootMargin: '150px 0px' });
  $$('.vstamp', vgrid).forEach(el => vidIO.observe(el));
  function resumeGrid() { if (!reduced) visibleVids.forEach(v => v.play().catch(() => {})); }

  /* ---------------------------------------------------------
     05 CONTACTO — postal
     --------------------------------------------------------- */
  const postcard = $('#postcard'), pcInner = $('#postcardInner'), pcShadow = $('.postcard__shadow');
  let flipped = false, flipping = false;
  function flip() {
    if (flipping) return; flipping = true;
    const from = flipped ? 180 : 0, to = flipped ? 0 : 180, dir = flipped ? -1 : 1;
    flipped = !flipped;
    Sound.play('flip');
    const face = flipped ? $('.postcard__back') : $('.postcard__front');
    const end = () => { pcInner.style.transform = `rotateY(${to}deg)`; flipping = false; $('[data-flip]', face)?.focus({ preventScroll: true }); };
    if (reduced) return end();
    pcInner.animate([
      { transform: `rotateY(${from}deg) translateZ(0)` },
      { transform: `rotateY(${from + dir * 90}deg) translateZ(80px)`, offset: .45 },
      { transform: `rotateY(${to + dir * 5}deg) translateZ(0)`, offset: .8 },
      { transform: `rotateY(${to}deg)` }
    ], { duration: 880, easing: 'cubic-bezier(.45,.05,.2,1)' }).onfinish = end;
    pcShadow.animate([
      { transform: 'translateZ(-60px) scale(1)', opacity: 1 },
      { transform: 'translateZ(-60px) translateY(40px) scale(.45, .9)', opacity: .45, offset: .45 },
      { transform: 'translateZ(-60px) scale(1)', opacity: 1 }
    ], { duration: 880, easing: 'ease-in-out' });
  }
  $$('[data-flip]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); flip(); }));
  $('.postcard__front').addEventListener('click', e => { if (!flipped && !e.target.closest('button')) flip(); });
  if (!reduced && canHover) {
    postcard.addEventListener('pointermove', e => {
      const r = postcard.getBoundingClientRect();
      postcard.style.setProperty('--ty', (((e.clientX - r.left) / r.width - .5) * 10).toFixed(2) + 'deg');
      postcard.style.setProperty('--tx', (-((e.clientY - r.top) / r.height - .5) * 8).toFixed(2) + 'deg');
    });
    postcard.addEventListener('pointerleave', () => { postcard.style.setProperty('--ty', '0deg'); postcard.style.setProperty('--tx', '0deg'); });
  }

  const mini = $('#miniStamp'), box = $('#stampBox'), pm = $('#pcPostmark');
  mini.addEventListener('click', () => {
    if (mini.classList.contains('is-stuck')) return;
    const body = $('.mini-stamp__body', mini);
    const tx = box.offsetLeft + (box.offsetWidth - body.offsetWidth) / 2;
    const ty = box.offsetTop + (box.offsetHeight - body.offsetHeight) / 2;
    const rot = rand(-4, 4);
    const start = `translate(${mini.offsetLeft}px, ${mini.offsetTop}px) rotate(-8deg)`;
    const end = `translate(${tx}px, ${ty}px) rotate(${rot.toFixed(1)}deg)`;
    mini.style.left = '0px'; mini.style.top = '0px';
    mini.classList.add('is-stuck');
    mini.style.transform = end;
    mini.animate([
      { transform: start },
      { transform: `translate(${tx}px, ${ty - 30}px) rotate(${(rot * 2).toFixed(1)}deg) scale(1.3)`, offset: .7 },
      { transform: end }
    ], { duration: reduced ? 1 : 560, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => {
      Sound.play('thunk');
      pm.classList.add('is-on');
      toast('Estampilla pegada. Abriendo tu mail…');
      setTimeout(() => { location.href = `${MAILTO}?subject=${encodeURIComponent('Hola Uri & Dani')}`; }, 900);
    };
  });
})();
