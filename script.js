/* ==========================================================================
   PRESENTE PARA VOCÊ — script.js
   Organizado em módulos simples por responsabilidade:
   1. Config (nome/senha, fáceis de alterar)
   2. Navegação entre telas (transições fluidas com GSAP)
   3. Parallax (mouse, toque e giroscópio) — ativo em desktop e celular
   4. Login (validação + mensagem "Você é minha?")
   5. Áudio (fade-in, pausar/continuar)
   6. Tela de código: chuva de código real + texto digitando
   7. Transição "organizando" os códigos até formar a tela final
   8. Bosque de tulipas: foto real + neve + sparkles + parallax
   ========================================================================== */

(() => {
  'use strict';

  const hasGSAP = typeof window.gsap !== 'undefined';

  /* ------------------------------------------------------------------ *
   * 1. CONFIG — altere aqui o nome e a senha quando quiser
   * ------------------------------------------------------------------ */
  const CONFIG = {
    NAME: 'thayla',
    PASSWORD: 'princesa',
  };

  /* ------------------------------------------------------------------ *
   * 2. NAVEGAÇÃO ENTRE TELAS — transição fluida (fade + blur + escala)
   * ------------------------------------------------------------------ */
  const screens = {
    cover: document.getElementById('screen-cover'),
    code: document.getElementById('screen-code'),
    garden: document.getElementById('screen-garden'),
  };

  let isTransitioning = false;

  function transitionTo(name, onMidpoint) {
    const next = screens[name];
    const current = Object.values(screens).find((el) => el.classList.contains('screen--active'));
    if (!next || next === current || isTransitioning) return;
    isTransitioning = true;

    if (!hasGSAP) {
      // fallback simples caso o GSAP não carregue (ex.: sem internet)
      if (current) current.classList.remove('screen--active');
      next.classList.add('screen--active');
      isTransitioning = false;
      if (typeof onMidpoint === 'function') onMidpoint();
      afterScreenEnter(name);
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => {
        if (current) current.classList.remove('screen--active');
        isTransitioning = false;
      },
    });

    if (current) {
      tl.to(current, {
        opacity: 0,
        scale: 0.96,
        filter: 'blur(22px)',
        duration: 0.9,
        onStart: () => { current.style.pointerEvents = 'none'; },
      }, 0);
    }

    tl.set(next, { opacity: 0, scale: 1.05, filter: 'blur(16px)' }, 0);
    tl.call(() => {
      next.classList.add('screen--active');
      next.style.pointerEvents = 'auto';
      if (typeof onMidpoint === 'function') onMidpoint();
      afterScreenEnter(name);
    }, null, current ? 0.35 : 0);
    tl.to(next, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.25 }, current ? 0.35 : 0);

    // reseta o estilo inline após a transição, devolvendo o controle ao CSS
    tl.set(current || next, {}, '+=0');
    tl.call(() => {
      if (current) gsap.set(current, { clearProps: 'all' });
      gsap.set(next, { clearProps: 'opacity,scale,filter' });
    });
  }

  function afterScreenEnter(name) {
    if (name === 'code') startCodeScreen();
    if (name === 'garden') startGarden();
  }

  /* ------------------------------------------------------------------ *
   * 3. PARALLAX — mouse, toque e giroscópio + leve movimento contínuo
   *    (fica visível tanto no computador quanto no celular)
   * ------------------------------------------------------------------ */
  const coverBg = document.getElementById('coverBg');
  const coverSection = document.getElementById('screen-cover');
  const gardenPhoto = document.getElementById('gardenPhoto');

  const pointer = { x: 0, y: 0 };
  let idleT = Math.random() * 10;

  function applyParallaxFrame() {
    idleT += 0.0035;
    // pequeno movimento automático e contínuo, tipo "respiração de câmera"
    const autoX = Math.sin(idleT) * 0.32;
    const autoY = Math.cos(idleT * 0.8) * 0.22;
    const finalX = pointer.x * 0.75 + autoX;
    const finalY = pointer.y * 0.75 + autoY;

    if (coverBg) {
      const moveX = finalX * 20;
      const moveY = finalY * 15;
      coverBg.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) scale(1.08)`;
      coverSection.style.setProperty('--mx', `${50 + finalX * 20}%`);
      coverSection.style.setProperty('--my', `${38 + finalY * 16}%`);
    }

    if (gardenPhoto) {
      const depth = parseFloat(gardenPhoto.dataset.depth || '0.06');
      const moveX = finalX * depth * 340;
      const moveY = finalY * depth * 220;
      gardenPhoto.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
    }

    requestAnimationFrame(applyParallaxFrame);
  }
  requestAnimationFrame(applyParallaxFrame);

  window.addEventListener('mousemove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  window.addEventListener('touchmove', (e) => {
    if (!e.touches || !e.touches[0]) return;
    const t = e.touches[0];
    pointer.x = (t.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (t.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function onOrientation(e) {
    if (e.gamma === null || e.beta === null) return;
    pointer.x = Math.max(-1, Math.min(1, e.gamma / 30));
    pointer.y = Math.max(-1, Math.min(1, (e.beta - 40) / 30));
  }

  function requestMotionAccess() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then((state) => { if (state === 'granted') window.addEventListener('deviceorientation', onOrientation); })
        .catch(() => {});
    } else if (typeof DeviceOrientationEvent !== 'undefined') {
      window.addEventListener('deviceorientation', onOrientation);
    }
  }
  // navegadores exigem um gesto do usuário para liberar o giroscópio (iOS)
  document.addEventListener('touchend', requestMotionAccess, { once: true });
  document.addEventListener('click', requestMotionAccess, { once: true });

  /* ------------------------------------------------------------------ *
   * 4. LOGIN
   * ------------------------------------------------------------------ */
  const loginForm = document.getElementById('loginForm');
  const inputName = document.getElementById('inputName');
  const inputPass = document.getElementById('inputPass');
  const loginError = document.getElementById('loginError');
  const forgotBtn = document.getElementById('forgotBtn');
  const forgotMsg = document.getElementById('forgotMsg');

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (isTransitioning) return;

    const name = inputName.value.trim().toLowerCase();
    const pass = inputPass.value.trim().toLowerCase();
    const isValid = name === CONFIG.NAME && pass === CONFIG.PASSWORD;

    if (!isValid) {
      loginError.textContent = 'Hmm, não é bem isso... tente novamente.';
      loginError.classList.add('is-visible');
      loginForm.classList.remove('shake');
      void loginForm.offsetWidth; // força reflow para repetir a animação
      loginForm.classList.add('shake');
      return;
    }

    loginError.classList.remove('is-visible');

    // transição fluida e cinematográfica de saída do login
    if (hasGSAP) {
      gsap.to(loginForm, {
        opacity: 0,
        y: -18,
        scale: 0.97,
        filter: 'blur(6px)',
        duration: 0.7,
        ease: 'power2.in',
      });
    }

    playMusic();
    setTimeout(() => transitionTo('code'), hasGSAP ? 350 : 0);
  });

  forgotBtn.addEventListener('click', () => {
    forgotMsg.classList.toggle('is-visible');
  });

  const shakeStyle = document.createElement('style');
  shakeStyle.textContent = `
    .login-card.shake { animation: cardRise 0.01s, shakeX 0.5s; }
    @keyframes shakeX {
      0%,100% { transform: translateX(0); }
      20% { transform: translateX(-8px); }
      40% { transform: translateX(7px); }
      60% { transform: translateX(-5px); }
      80% { transform: translateX(4px); }
    }
  `;
  document.head.appendChild(shakeStyle);

  /* ------------------------------------------------------------------ *
   * 5. ÁUDIO — fade-in ao logar, botão de pausar/continuar
   * ------------------------------------------------------------------ */
  const bgAudio = document.getElementById('bgAudio');
  const musicToggle = document.getElementById('musicToggle');
  let targetVolume = 0.55;
  let fadeInterval = null;

  function fadeAudio(to, duration = 2200) {
    clearInterval(fadeInterval);
    const steps = 40;
    const stepTime = duration / steps;
    const startVol = bgAudio.volume;
    const diff = to - startVol;
    let i = 0;
    fadeInterval = setInterval(() => {
      i++;
      bgAudio.volume = Math.min(1, Math.max(0, startVol + (diff * i) / steps));
      if (i >= steps) clearInterval(fadeInterval);
    }, stepTime);
  }

  function playMusic() {
    bgAudio.volume = 0;
    bgAudio.play().catch(() => {});
    fadeAudio(targetVolume);
    musicToggle.classList.add('is-visible');
    musicToggle.classList.remove('is-paused');
  }

  musicToggle.addEventListener('click', () => {
    if (bgAudio.paused) {
      bgAudio.play().catch(() => {});
      fadeAudio(targetVolume, 900);
      musicToggle.classList.remove('is-paused');
    } else {
      fadeAudio(0, 500);
      setTimeout(() => bgAudio.pause(), 520);
      musicToggle.classList.add('is-paused');
    }
  });

  /* ------------------------------------------------------------------ *
   * 6. TELA DE CÓDIGO — chuva com código real do próprio projeto
   *    + frase digitando + botão que só aparece depois de digitada
   * ------------------------------------------------------------------ */
  const codeRainEl = document.getElementById('codeRain');
  const organizeBtn = document.getElementById('organizeBtn');
  const typedTextInner = document.getElementById('typedTextInner');
  const typeCursor = document.querySelector('.type-cursor');
  let codeRainStarted = false;
  let typewriterStarted = false;

  // linhas reais retiradas do index.html, style.css e script.js deste mesmo projeto
  const REAL_CODE_LINES = [
    "const CONFIG = { NAME: 'thayla', PASSWORD: 'princesa' };",
    'function transitionTo(name, onMidpoint) {',
    'const isValid = name === CONFIG.NAME && pass === CONFIG.PASSWORD;',
    ".login-card{ backdrop-filter: blur(22px) saturate(140%); }",
    'background: linear-gradient(135deg, var(--gold-300), var(--gold-500));',
    '--purple-950: #0e0620;',
    'animation: coverBreathe 26s ease-in-out infinite;',
    'bgAudio.volume = Math.min(1, Math.max(0, startVol + diff));',
    "musicToggle.classList.add('is-visible');",
    '<h1 class="login-title">Um presente</h1>',
    '<span class="highlight-you">VOCÊ</span>',
    '<audio id="bgAudio" src="assets/audio/winter_bear.mp3" loop></audio>',
    'window.addEventListener("mousemove", (e) => {',
    'const moveX = finalX * depth * 340;',
    '@keyframes youPulse{ 50%{ transform:scale(1.06); } }',
    'ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);',
    'requestAnimationFrame(applyParallaxFrame);',
    "forgotBtn.addEventListener('click', () => {",
    '.garden__photo{ background-image:url(\'assets/images/tulipas.jpg\'); }',
    'gsap.timeline({ defaults: { ease: "power2.inOut" } });',
    'text-shadow: 0 0 18px rgba(243,221,171,0.65);',
    "organizeBtn.addEventListener('click', playOrganizeTransition);",
    'flake.y += flake.speedY;',
    'box-shadow: var(--glass-shadow), inset 0 1px 0 rgba(255,255,255,0.18);',
    "loginForm.classList.add('shake');",
  ];

  function startCodeRain() {
    if (codeRainStarted) return;
    codeRainStarted = true;

    const hues = ['', 'is-hue-gold', 'is-hue-purple'];
    const columnCount = Math.max(6, Math.floor(window.innerWidth / 78));
    for (let i = 0; i < columnCount; i++) {
      const span = document.createElement('span');
      const lines = [];
      const lineCount = 20 + Math.floor(Math.random() * 14);
      for (let l = 0; l < lineCount; l++) {
        lines.push(REAL_CODE_LINES[Math.floor(Math.random() * REAL_CODE_LINES.length)]);
      }
      span.textContent = lines.join('\n');
      span.className = hues[Math.floor(Math.random() * hues.length)];
      span.style.left = `${(i / columnCount) * 100}%`;
      const duration = 11 + Math.random() * 8;
      const delay = -Math.random() * duration;
      const swayDuration = 3 + Math.random() * 3;
      span.style.animationDuration = `${duration}s, ${swayDuration}s`;
      span.style.animationDelay = `${delay}s, ${-Math.random() * swayDuration}s`;
      span.style.opacity = 0.55 + Math.random() * 0.4;
      codeRainEl.appendChild(span);
    }

    // leve parallax da chuva de código conforme o mouse, reforçando profundidade
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      codeRainEl.style.transform = `translateX(${x * 10}px)`;
    });
  }

  function typeWriter(el, text, speed = 26) {
    return new Promise((resolve) => {
      let i = 0;
      el.textContent = '';
      const interval = setInterval(() => {
        el.textContent += text.charAt(i);
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          resolve();
        }
      }, speed);
    });
  }

  function startCodeScreen() {
    startCodeRain();
    if (typewriterStarted) return;
    typewriterStarted = true;

    const message = 'Esses códigos foram usados pra criar tudo que você vê, mas sem a aplicação e organização correta, são só letras.';

    setTimeout(() => {
      typeWriter(typedTextInner, message).then(() => {
        if (typeCursor) typeCursor.classList.add('is-done');
        organizeBtn.classList.remove('is-hidden');
        if (hasGSAP) {
          gsap.fromTo(organizeBtn, { opacity: 0, y: 10, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power2.out' });
        }
      });
    }, 500);
  }

  /* ------------------------------------------------------------------ *
   * 7. TRANSIÇÃO "ORGANIZANDO" — os códigos voam e se organizam antes
   *    de revelar a tela final (em vez de ir direto para o bosque)
   * ------------------------------------------------------------------ */
  const organizeLayer = document.getElementById('organizeLayer');
  // reanexa a camada diretamente ao <body> para que fique fixa em relação
  // à janela, sem sofrer efeito do "transform" aplicado às telas
  document.body.appendChild(organizeLayer);
  organizeLayer.style.position = 'fixed';
  organizeLayer.style.inset = '0';
  organizeLayer.style.zIndex = '30';

  function playOrganizeTransition() {
    if (isTransitioning) return;

    const codeCard = document.querySelector('.code-card');
    if (hasGSAP) {
      gsap.to(codeCard, { opacity: 0, y: -14, duration: 0.5, ease: 'power2.in' });
    } else {
      codeCard.style.opacity = '0';
    }

    if (!hasGSAP) {
      // fallback sem GSAP: transição direta
      setTimeout(() => transitionTo('garden'), 500);
      return;
    }

    const spans = Array.from(codeRainEl.querySelectorAll('span'));
    const sampleCount = Math.min(50, spans.length);
    const sample = [];
    for (let i = 0; i < sampleCount; i++) {
      sample.push(spans[Math.floor(Math.random() * spans.length)]);
    }

    const flash = document.createElement('div');
    flash.className = 'organize-flash';
    organizeLayer.appendChild(flash);

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const clones = [];

    sample.forEach((span) => {
      const rect = span.getBoundingClientRect();
      if (rect.top < -60 || rect.top > window.innerHeight + 60) return; // ignora fora da tela
      const clone = document.createElement('span');
      const firstLine = span.textContent.split('\n')[0];
      clone.textContent = firstLine;
      clone.className = span.className;
      clone.style.left = `${rect.left}px`;
      clone.style.top = `${rect.top}px`;
      organizeLayer.appendChild(clone);
      clones.push(clone);
    });

    const tl = gsap.timeline({
      onComplete: () => {
        clones.forEach((c) => c.remove());
      },
    });

    tl.to(clones, {
      x: (i, el) => centerX - parseFloat(el.style.left),
      y: (i, el) => centerY - parseFloat(el.style.top),
      scale: 0.25,
      opacity: 0,
      rotation: () => (Math.random() - 0.5) * 40,
      duration: 1.1,
      ease: 'power3.inOut',
      stagger: { amount: 0.55, from: 'random' },
    }, 0.05);

    tl.to(flash, { opacity: 0.85, duration: 0.45, ease: 'power2.in' }, 0.85);
    tl.call(() => { transitionTo('garden'); }, null, 1.05);
    tl.to(flash, { opacity: 0, duration: 1.1, ease: 'power2.out', onComplete: () => flash.remove() }, 1.25);
  }

  organizeBtn.addEventListener('click', playOrganizeTransition);

  /* ------------------------------------------------------------------ *
   * 8. BOSQUE DE TULIPAS — neve e sparkles (tela 3)
   * ------------------------------------------------------------------ */
  let gardenStarted = false;

  function spawnSparkles() {
    const container = document.getElementById('sparkles');
    if (container.childElementCount > 0) return;
    const count = 40;
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('i');
      dot.style.left = `${Math.random() * 100}%`;
      dot.style.top = `${40 + Math.random() * 55}%`;
      dot.style.animationDelay = `${Math.random() * 4}s`;
      dot.style.animationDuration = `${2.5 + Math.random() * 2.5}s`;
      container.appendChild(dot);
    }
  }

  const snowCanvas = document.getElementById('snowCanvas');
  const ctx = snowCanvas.getContext('2d');
  let snowflakes = [];

  function resizeCanvas() {
    snowCanvas.width = window.innerWidth;
    snowCanvas.height = window.innerHeight;
  }

  function initSnow() {
    resizeCanvas();
    const count = Math.floor((window.innerWidth * window.innerHeight) / 20000);
    snowflakes = Array.from({ length: count }, () => ({
      x: Math.random() * snowCanvas.width,
      y: Math.random() * snowCanvas.height,
      r: 1 + Math.random() * 2.6,
      speedY: 0.3 + Math.random() * 0.8,
      speedX: (Math.random() - 0.5) * 0.4,
      drift: Math.random() * Math.PI * 2,
      opacity: 0.35 + Math.random() * 0.5,
    }));
  }

  function drawSnow() {
    ctx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
    ctx.fillStyle = '#faf8ff';
    snowflakes.forEach((flake) => {
      flake.drift += 0.01;
      flake.y += flake.speedY;
      flake.x += flake.speedX + Math.sin(flake.drift) * 0.3;

      if (flake.y > snowCanvas.height) {
        flake.y = -4;
        flake.x = Math.random() * snowCanvas.width;
      }
      if (flake.x > snowCanvas.width) flake.x = 0;
      if (flake.x < 0) flake.x = snowCanvas.width;

      ctx.globalAlpha = flake.opacity;
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(drawSnow);
  }

  function startGarden() {
    if (gardenStarted) return;
    gardenStarted = true;
    spawnSparkles();
    initSnow();
    drawSnow();
  }

  window.addEventListener('resize', () => {
    if (gardenStarted) resizeCanvas();
  });

})();
