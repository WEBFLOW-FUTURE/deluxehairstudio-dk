/* ====================================================
   DELUXE HAIRSTUDIO — Shared front-end scripts
   ==================================================== */
(function(){
  'use strict';

  /* Mark that JS is active so CSS can opt-out of fallback visible state */
  document.documentElement.classList.add('js-ready');

  /* ---------- Helpers ---------- */
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------- Year in footer ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Mobile menu ---------- */
  const toggle = $('#menuToggle');
  const links  = $('#navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open);
    });
    $$('a', links).forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ---------- Reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => revealObserver.observe(el));

  /* ---------- Split-text reveal on headings ---------- */
  /* Wrap each word's characters in spans, then animate with staggered delays */
  function initSplitText() {
    $$('[data-split]').forEach(el => {
      if (el.dataset.splitInit) return;
      el.dataset.splitInit = '1';
      const html = el.innerHTML;
      // preserve <em>, <br>, <span> tags — walk child nodes
      const frag = document.createDocumentFragment();
      let i = 0;
      function walk(node, parent) {
        node.childNodes.forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent;
            text.split('').forEach(ch => {
              const span = document.createElement('span');
              span.className = 'char' + (ch === ' ' ? ' space' : '');
              span.textContent = ch;
              span.style.transitionDelay = (i * 0.028) + 's';
              i++;
              parent.appendChild(span);
            });
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const clone = child.cloneNode(false);
            parent.appendChild(clone);
            walk(child, clone);
          }
        });
      }
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      el.innerHTML = '';
      walk(tmp, el);
      el.classList.add('split-reveal');
    });
  }
  initSplitText();

  // Trigger split-text when it enters view (or immediately if already above the fold)
  const splitObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        splitObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  $$('.split-reveal').forEach(el => {
    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (inView) {
      // Element already visible at load → fire after a short delay for smooth entrance
      setTimeout(() => el.classList.add('in'), 120);
    } else {
      splitObserver.observe(el);
    }
  });
  // Final safety net: after 3s, force-show any split-reveal that hasn't animated
  setTimeout(() => {
    $$('.split-reveal').forEach(el => el.classList.add('in'));
  }, 3000);

  /* ---------- 3D Tilt cards ---------- */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced) {
    $$('.tilt').forEach(card => {
      let rect;
      const max = 8; // max degree of tilt
      card.addEventListener('mouseenter', () => { rect = card.getBoundingClientRect(); });
      card.addEventListener('mousemove', (e) => {
        if (!rect) rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * max}deg) rotateX(${-y * max}deg) translateZ(0)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ---------- Testimonial slider ---------- */
  const slides = $$('[data-tslide]');
  const dots   = $$('.testimonial-dots button');
  if (slides.length && dots.length) {
    let idx = 0;
    function showSlide(i) {
      slides.forEach((s, j) => s.hidden = j !== i);
      dots.forEach((d, j) => d.classList.toggle('active', j === i));
    }
    dots.forEach(d => d.addEventListener('click', () => {
      idx = parseInt(d.dataset.target, 10);
      showSlide(idx);
    }));
    setInterval(() => { idx = (idx + 1) % slides.length; showSlide(idx); }, 7000);
  }

  /* ---------- Hero video: keep looping forever ---------- */
  const video = $('#heroVideo');
  if (video) {
    const keep = () => { try { video.currentTime = 0; } catch(e){} video.play().catch(()=>{}); };
    video.play().catch(()=>{});
    video.addEventListener('ended', keep);
    video.addEventListener('pause', () => {
      if (!document.hidden && !video.ended) video.play().catch(()=>{});
    });
    setInterval(() => {
      if (!document.hidden && video.paused) video.play().catch(()=>{});
      if (video.duration && (video.duration - video.currentTime) < 0.1) keep();
    }, 2000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) video.play().catch(()=>{});
    });
  }

  /* ---------- Gallery filters ---------- */
  const gFilters = $$('.gallery-filter');
  const gItems   = $$('.full-gallery .gallery-item');
  if (gFilters.length && gItems.length) {
    gFilters.forEach(btn => {
      btn.addEventListener('click', () => {
        gFilters.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.filter;
        gItems.forEach(item => {
          const match = cat === 'all' || item.dataset.cat.split(',').includes(cat);
          item.classList.toggle('hidden', !match);
        });
      });
    });
  }

  /* ---------- Scroll progress bar ---------- */
  const sp = $('#scrollProgress');
  if (sp) {
    const bar = $('span', sp);
    function updateProgress(){
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      if (bar) bar.style.width = pct + '%';
    }
    window.addEventListener('scroll', updateProgress, { passive:true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  /* ---------- Gold magnetic cursor ---------- */
  const cur  = $('#goldCursor');
  const curD = $('#goldCursorDot');
  if (cur && curD && !prefersReduced && window.matchMedia('(hover:hover)').matches) {
    let tx = 0, ty = 0, x = 0, y = 0;
    let dotX = 0, dotY = 0;
    document.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      dotX = tx; dotY = ty;
      curD.style.transform = `translate(${dotX}px,${dotY}px) translate(-50%,-50%)`;
      if (!document.documentElement.classList.contains('cursor-ready')) {
        document.documentElement.classList.add('cursor-ready');
      }
    });
    function lerp(){
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      cur.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
      requestAnimationFrame(lerp);
    }
    lerp();
    // hover state on interactive elements
    const hoverables = 'a, button, .tilt, .service-card, .member, .gallery-item, .review-card, .price-list li, input, textarea';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverables)) document.documentElement.classList.add('cursor-hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverables)) document.documentElement.classList.remove('cursor-hover');
    });
    document.addEventListener('mouseleave', () => {
      document.documentElement.classList.remove('cursor-ready');
    });
  }

  /* ---------- Smooth scroll for in-page anchors ---------- */
  $$('a[href^="#"]').forEach(a => {
    const id = a.getAttribute('href');
    if (id === '#' || id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior:'smooth' });
    });
  });

  /* ---------- Sticky category nav · active section highlighting ---------- */
  const catLinks = $$('.cat-nav [data-cat-link]');
  if (catLinks.length) {
    const targets = catLinks
      .map(l => document.querySelector(l.getAttribute('href')))
      .filter(Boolean);
    function syncActive(){
      const offset = window.scrollY + 140;
      let active = targets[0];
      targets.forEach(t => { if (t.offsetTop <= offset) active = t; });
      catLinks.forEach(l => {
        const match = l.getAttribute('href') === '#' + active.id;
        l.classList.toggle('active', match);
      });
    }
    window.addEventListener('scroll', syncActive, { passive:true });
    syncActive();
  }

  /* ---------- Intro stats counter ---------- */
  const statNums = $$('.intro-stat .num, .stat-num');
  if (statNums.length) {
    const seen = new WeakSet();
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting || seen.has(e.target)) return;
        seen.add(e.target);
        const el = e.target;
        const raw = el.textContent.trim();
        const m = raw.match(/^(\d+(?:\.\d+)?)(.*)$/);
        if (!m) return;
        const end = parseFloat(m[1]);
        const suffix = m[2] || '';
        const dur = 1400;
        const start = performance.now();
        const isFloat = /\./.test(m[1]);
        function tick(t){
          const p = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = end * eased;
          el.textContent = (isFloat ? val.toFixed(1) : Math.floor(val)) + suffix;
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = raw;
        }
        requestAnimationFrame(tick);
      });
    }, { threshold:.4 });
    statNums.forEach(n => obs.observe(n));
  }

  /* ---------- Lightbox ---------- */
  const lightbox = $('#lightbox');
  if (lightbox) {
    const lbImg  = $('.lightbox-img', lightbox);
    const lbPrev = $('.lightbox-prev', lightbox);
    const lbNext = $('.lightbox-next', lightbox);
    const lbClose= $('.lightbox-close', lightbox);
    let visible = [];
    let cur = 0;

    function refreshVisible() {
      visible = $$('.full-gallery .gallery-item:not(.hidden) img');
    }
    function open(src, index) {
      refreshVisible();
      cur = index;
      lbImg.src = src;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }
    function step(dir) {
      if (!visible.length) return;
      cur = (cur + dir + visible.length) % visible.length;
      lbImg.src = visible[cur].src;
    }

    $$('.full-gallery .gallery-item').forEach((item) => {
      item.addEventListener('click', () => {
        refreshVisible();
        const img = $('img', item);
        const idx = visible.indexOf(img);
        if (idx !== -1) open(img.src, idx);
      });
    });
    if (lbPrev) lbPrev.addEventListener('click', () => step(-1));
    if (lbNext) lbNext.addEventListener('click', () => step(1));
    if (lbClose) lbClose.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

})();
