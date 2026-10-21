(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const page = document.body.dataset.page || 'home';

  // Shared autonomous 2.5D environment. Objects and particles are CSS-animated.
  const ambient = document.createElement('div');
  ambient.className = 'fx-backdrop';
  ambient.setAttribute('aria-hidden', 'true');
  ambient.innerHTML = '<div class="fx-stars"></div><div class="fx-nebula fx-nebula--a"></div><div class="fx-nebula fx-nebula--b"></div><div class="fx-grid"></div><div class="fx-orbit fx-orbit--a"></div><div class="fx-orbit fx-orbit--b"></div><div class="fx-cube">' + '<span></span>'.repeat(6) + '</div><div class="fx-diamond"></div><div class="fx-lens"></div><div class="fx-particles"></div><div class="noise"></div>';
  document.body.prepend(ambient);

  // Create a small, deterministic particle field (fewer particles on phones).
  const particleLayer = ambient.querySelector('.fx-particles');
  const isSmallScreen = window.matchMedia('(max-width: 720px)').matches;
  const particleCount = reducedMotion ? 0 : (isSmallScreen ? 14 : 30);
  for (let i = 0; i < particleCount; i += 1) {
    const particle = document.createElement('i');
    particle.className = 'fx-particle';
    particle.style.setProperty('--x', `${(i * 37 + 9) % 97}%`);
    particle.style.setProperty('--y', `${(i * 53 + 7) % 91}%`);
    particle.style.setProperty('--size', `${1 + (i % 3)}px`);
    particle.style.setProperty('--dx', `${((i * 29) % 100) - 50}px`);
    particle.style.setProperty('--dy', `${24 + ((i * 17) % 58)}px`);
    particle.style.setProperty('--duration', `${12 + (i % 13)}s`);
    particle.style.setProperty('--delay', `${-((i * 7) % 19)}s`);
    particleLayer.append(particle);
  }

  // Pause ambient motion on hidden tabs to reduce rendering work.
  document.addEventListener('visibilitychange', () => { ambient.style.visibility = document.hidden ? 'hidden' : 'visible'; });

  const header = $('.site-header');
  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 16);
  window.addEventListener('scroll', updateHeader, { passive: true }); updateHeader();

  // Mobile menu works on every page.
  const menuToggle = $('.menu-toggle');
  const mainNav = $('.main-nav');
  const closeMenu = () => { mainNav?.classList.remove('is-open'); menuToggle?.setAttribute('aria-expanded', 'false'); };
  menuToggle?.addEventListener('click', () => {
    const open = !mainNav.classList.contains('is-open');
    mainNav.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  $$('.main-nav a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('click', e => { if (mainNav?.classList.contains('is-open') && !mainNav.contains(e.target) && !menuToggle?.contains(e.target)) closeMenu(); });

  // Reveal on scroll while keeping content immediately visible when reduced motion is enabled.
  const revealTargets = $$('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .07, rootMargin: '0px 0px -18px 0px' });
    revealTargets.forEach(el => revealObserver.observe(el));
    window.setTimeout(() => revealTargets.filter(el => el.getBoundingClientRect().top < innerHeight * .95).forEach(el => el.classList.add('is-visible')), 80);
  } else revealTargets.forEach(el => el.classList.add('is-visible'));

  // Subtle pointer parallax, only on fine-pointer devices; transforms never affect layout.
  if (!reducedMotion && matchMedia('(pointer:fine)').matches) {
    let raf = 0;
    document.addEventListener('pointermove', event => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const px = (event.clientX / innerWidth) - .5;
        const py = (event.clientY / innerHeight) - .5;
        document.documentElement.style.setProperty('--mouse-x', (px * 28).toFixed(1) + 'px');
        document.documentElement.style.setProperty('--mouse-y', (py * 28).toFixed(1) + 'px');
        document.documentElement.style.setProperty('--cube-x', (px * -24).toFixed(1) + 'px');
        document.documentElement.style.setProperty('--cube-y', (py * -18).toFixed(1) + 'px');
        document.documentElement.style.setProperty('--diamond-x', (px * 18).toFixed(1) + 'px');
        document.documentElement.style.setProperty('--diamond-y', (py * 15).toFixed(1) + 'px');
        document.documentElement.style.setProperty('--lens-x', (px * -15).toFixed(1) + 'px');
        document.documentElement.style.setProperty('--lens-y', (py * 12).toFixed(1) + 'px');
        document.documentElement.style.setProperty('--orbit-a-x', (px * 10).toFixed(1) + 'px');
        document.documentElement.style.setProperty('--orbit-a-y', (py * 8).toFixed(1) + 'px');
        document.documentElement.style.setProperty('--orbit-b-x', (px * -8).toFixed(1) + 'px');
        document.documentElement.style.setProperty('--orbit-b-y', (py * -7).toFixed(1) + 'px');
        raf = 0;
      });
    }, { passive: true });
  }

  let toastTimer;
  function toast(message) {
    let el = $('#toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.append(el); }
    el.textContent = message; el.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 2400);
  }
  async function copyText(value, success = 'Đã sao chép!') {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
      else {
        const field = document.createElement('textarea'); field.value = value; field.style.position = 'fixed'; field.style.opacity = '0'; document.body.append(field); field.select();
        const ok = document.execCommand('copy'); field.remove(); if (!ok) throw new Error('copy failed');
      }
      toast(success);
    } catch { toast('Không sao chép tự động được. Bạn hãy bôi đen nội dung để sao chép nhé.'); }
  }
  const pad = n => String(n).padStart(2, '0');
  const students = Array.isArray(window.STUDENTS) ? window.STUDENTS : [];
  const glyphs = ['✳','✧','◇','✦','◈','✺','⬡','✷','◉','❋','✣','✴','✥','✵','✹','✶','✻','❖','⌘','✸','⟡','✼','◌','✽'];

  if (page === 'students') {
    const grid = $('#studentGrid'), search = $('#studentSearch'), count = $('#visibleCount'), empty = $('#emptyState');
    const render = (query = '') => {
      if (!grid) return;
      const q = query.trim().toLocaleLowerCase('vi-VN');
      const matched = students.filter(s => !q || s.name.toLocaleLowerCase('vi-VN').includes(q) || String(s.number).includes(q));
      grid.innerHTML = '';
      const fragment = document.createDocumentFragment();
      matched.forEach((student, i) => {
        const index = students.findIndex(s => s.number === student.number);
        const a = document.createElement('a'); a.className = 'student-card'; a.href = `profile.html?number=${encodeURIComponent(student.number)}`; a.style.setProperty('--card-i', Math.min(i, 18));
        a.setAttribute('aria-label', `Mở hồ sơ số ${student.number}: ${student.name}`);
        a.innerHTML = `<div class="student-card-top"><span class="student-index">ROSTER NO. ${pad(student.number)}</span><span class="student-signal">IDENTITY</span></div><span class="student-glyph" aria-hidden="true">${glyphs[index % glyphs.length]}</span><div class="student-card-bottom"><p class="student-name"></p><span class="student-open" aria-hidden="true">↗</span></div>`;
        $('.student-name', a).textContent = student.name; fragment.append(a);
      });
      grid.append(fragment); if (count) count.textContent = pad(matched.length);
      if (empty) empty.hidden = matched.length > 0; grid.hidden = matched.length === 0;
    };
    render(); search?.addEventListener('input', () => render(search.value));
    $('#clearSearch')?.addEventListener('click', () => { search.value = ''; render(); search.focus(); });
    document.addEventListener('keydown', e => { if (e.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName) && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); search?.focus(); } });
  }

  if (page === 'profile') {
    const params = new URLSearchParams(location.search);
    let idx = students.findIndex(s => s.number === Number(params.get('number')));
    if (idx < 0) idx = 0;
    const student = students[idx];
    if (student) {
      document.title = `${student.name} / 9A11`;
      $('#profileOrdinal').textContent = `ROSTER PROFILE / ${pad(student.number)}`;
      $('#profileFileNumber').textContent = `NO. ${pad(student.number)}`;
      $('#profileNumber').textContent = `ROSTER NO. ${pad(student.number)} / 9A11`;
      $('#profileName').textContent = student.name;
      $('#profileGreeting').textContent = student.greeting;
      $('#copyProfileGreeting')?.addEventListener('click', () => copyText(`Gửi ${student.name},\n\n${student.greeting}\n\nChúc mừng ngày Phụ nữ Việt Nam 20/10! — 9A11`, 'Đã sao chép lời chúc dành cho ' + student.name));
      const prev = students[(idx - 1 + students.length) % students.length]; const next = students[(idx + 1) % students.length];
      const prevLink = $('#prevProfile'), nextLink = $('#nextProfile');
      if (prevLink) { prevLink.href = `profile.html?number=${prev.number}`; prevLink.textContent = `← NO. ${pad(prev.number)}`; prevLink.setAttribute('aria-label', `Hồ sơ trước: ${prev.name}`); }
      if (nextLink) { nextLink.href = `profile.html?number=${next.number}`; nextLink.textContent = `NEXT · NO. ${pad(next.number)} ↗`; nextLink.setAttribute('aria-label', `Hồ sơ tiếp theo: ${next.name}`); }
    }
  }

  if (page === 'message') {
    const panel = $('#letterPanel'), art = $('.message-hero-art'), status = $('#messageStatus');
    const unlock = () => {
      panel?.classList.add('is-open'); art?.classList.add('unlocked');
      if (status) status.textContent = 'TRANSMISSION RECEIVED / MESSAGE DECRYPTED';
      $('#revealFullMessage')?.setAttribute('aria-expanded', 'true');
      setTimeout(() => panel?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' }), 180);
    };
    $('#unlockMessage')?.addEventListener('click', unlock);
    $('#revealFullMessage')?.addEventListener('click', () => { unlock(); panel?.classList.add('is-open'); $('.letter-content')?.classList.add('full-reveal'); });
    const collective = 'Gửi 24 cô gái của 9A11,\n\nChúc các bạn luôn vui vẻ, tự tin và rực rỡ theo cách riêng của mình. Mong rằng mỗi ngày đến lớp đều có thêm những niềm vui, những tiếng cười và những kỷ niệm đáng nhớ.\n\nCảm ơn vì đã cùng tạo nên một 9A11 thật đặc biệt.\n\nChúc mừng ngày Phụ nữ Việt Nam 20/10!';
    $('#copyCollective')?.addEventListener('click', () => copyText(collective, 'Đã sao chép lời chúc tập thể'));
    const select = $('#studentSelect'), open = $('#openSelectedProfile');
    if (select && students.length) {
      students.forEach(s => { const op = document.createElement('option'); op.value = String(s.number); op.textContent = `No. ${pad(s.number)} — ${s.name}`; select.append(op); });
      select.addEventListener('change', () => { if (open) open.href = select.value ? `profile.html?number=${select.value}` : 'students.html'; });
    }
  }

  if (page === 'memories') {
    const grid = $('#memoryGrid'); const memories = Array.isArray(window.MEMORIES) ? window.MEMORIES : [];
    const lightbox = $('#memoryLightbox'); let previousFocus = null;
    const openMemory = memory => {
      previousFocus = document.activeElement;
      $('#lightboxDate').textContent = memory.date || 'MEMORY INDEX / 9A11';
      $('#lightboxTitle').textContent = memory.title || 'Một khoảnh khắc của 9A11';
      $('#lightboxCaption').textContent = memory.caption || '';
      const frame = $('#lightboxFrame'); frame.innerHTML = '';
      if (memory.image) { const img = document.createElement('img'); img.src = memory.image; img.alt = memory.title || 'Ảnh kỷ niệm'; img.onerror = () => { frame.innerHTML = `<span class="memory-glyph">${memory.symbol || '✳'}</span>`; }; frame.append(img); }
      else frame.innerHTML = `<div class="memory-frame" aria-hidden="true"></div><span class="memory-glyph">${memory.symbol || '✳'}</span>`;
      lightbox.hidden = false; document.body.classList.add('modal-open'); $('#closeLightbox')?.focus();
    };
    const closeMemory = () => { if (!lightbox || lightbox.hidden) return; lightbox.hidden = true; document.body.classList.remove('modal-open'); previousFocus?.focus?.(); };
    memories.forEach((m, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'memory-card'; button.style.setProperty('--card-i', index); button.setAttribute('aria-label', `Mở kỷ niệm: ${m.title}`);
      const visual = document.createElement('div'); visual.className = 'memory-visual';
      const addMemoryPlaceholder = () => {
        if (visual.querySelector('.memory-frame')) return;
        const frame = document.createElement('span'); frame.className = 'memory-frame'; frame.setAttribute('aria-hidden', 'true');
        const glyph = document.createElement('span'); glyph.className = 'memory-glyph'; glyph.textContent = m.symbol || '✳';
        visual.append(frame, glyph);
      };
      if (m.image) {
        const img = document.createElement('img'); img.loading = 'lazy'; img.alt = m.title || 'Kỷ niệm 9A11'; img.src = m.image;
        img.onerror = () => { img.remove(); addMemoryPlaceholder(); }; visual.append(img);
      } else addMemoryPlaceholder();
      const meta = document.createElement('div'); meta.className = 'memory-meta'; const date = document.createElement('span'); date.className = 'mono'; date.textContent = m.date || `MEMORY / ${pad(index + 1)}`; const arrow = document.createElement('span'); arrow.className = 'memory-open'; arrow.textContent = '↗'; meta.append(date, arrow);
      const title = document.createElement('h2'); title.className = 'memory-title'; title.textContent = m.title || 'Một khoảnh khắc của 9A11';
      const caption = document.createElement('p'); caption.className = 'memory-caption'; caption.textContent = m.caption || 'Thêm chú thích của lớp trong data/memories.js.';
      button.append(visual, meta, title, caption); button.addEventListener('click', () => openMemory(m)); grid?.append(button);
    });
    $('#closeLightbox')?.addEventListener('click', closeMemory);
    lightbox?.addEventListener('click', e => { if (e.target === lightbox) closeMemory(); });
    document.addEventListener('keydown', e => { if (!lightbox?.hidden && e.key === 'Escape') closeMemory(); });
  }
})();
