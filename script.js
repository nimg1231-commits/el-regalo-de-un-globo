(() => {
  "use strict";

  const petalLayer = document.getElementById("petalLayer");

  const successSound = new Audio("Next.mp3");
  successSound.volume = 0.8;

  function playSuccess() {
    successSound.currentTime = 0;
    successSound.play().catch(() => {});
  }
  const doneScreen = document.getElementById("doneScreen");
  const doneBtn = document.getElementById("doneBtn");
  
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const overlay = document.getElementById("overlay");
  const transition = document.getElementById("transition");
  const giftScreen = document.getElementById("giftScreen");
  const finalScreen = document.getElementById("finalScreen");

  const startBtn = document.getElementById("startBtn");
  const continueBtn = document.getElementById("continueBtn");
  const giftBtn = document.getElementById("giftBtn");
  const restartBtn = document.getElementById("restartBtn");

  const musicBtn = document.getElementById("musicBtn");
  const music = document.getElementById("bgMusic");

  const levelLabel = document.getElementById("levelLabel");
  const progressWrap = document.getElementById("progressWrap");
  const progressText = document.getElementById("progressText");
  const progressFill = document.getElementById("progressFill");
  const touchControls = document.getElementById("touchControls");

  const W = 1280;
  const H = 720;

  // Imágenes del juego
  const bgImg = new Image();
  bgImg.src = "images/level_1.png";

  const heartImg = new Image();
  heartImg.src = "images/Corazon_Nube.png";

  const planeImg = new Image();
  planeImg.src = "images/Avion.png";

  const planeLeftImg = new Image();
  planeLeftImg.src = "images/Avion_2.png";

  const TRAIL_LIFE = 1.4; 
  const SHOW_MOVING_CLOUDS = false;

  const HEART_SIZE = 170;                    // tamaño del corazón (ancho = alto)
  const PLANE_W = 150;                       // ancho del avión
  const PLANE_H = PLANE_W * 1024 / 1536;     // conserva la proporción de tu imagen

  let dpr = 1;
  let state = "start";
  let lastTime = performance.now();
  let elapsed = 0;

  let transitionTimer = 0;
  let level1FinishQueued = false;
  let musicOn = false;

  const keys = {
    up: false,
    down: false,
    left: false,
    right: false,
    fire: false
  };

  const player = {
    x: 190,
    y: H / 2,
    speed: 360,
    fireCooldown: 0,
    tilt: 0,
    bob: 0,
    facing: 1
  };

  let bullets = [];
  let particles = [];
  let clouds = [];
  let birds = [];
  let hearts = [];

  let heartRoute = [];
  let routeCoverage = [];
  let routeCoveredCount = 0;
  let level2Trail = [];

  let skyStars = [];

  const rand = (a, b) => a + Math.random() * (b - a);

  const clamp = (v, a, b) =>
    Math.max(a, Math.min(b, v));

  const dist = (x1, y1, x2, y2) =>
    Math.hypot(x1 - x2, y1 - y2);


  // =========================================================
  // AJUSTAR CANVAS
  // =========================================================

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);

    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";

    ctx.setTransform(
      dpr * innerWidth / W,
      0,
      0,
      dpr * innerHeight / H,
      0,
      0
    );
  }

  window.addEventListener("resize", resize);

  resize();


  // =========================================================
  // NUBES
  // =========================================================

  function makeCloud(x, y, scale, speed, alpha = 0.75) {
    return {
      x,
      y,
      scale,
      speed,
      alpha,
      puff: rand(0, Math.PI * 2),
      layer:
        speed < 10
          ? 0
          : speed < 25
          ? 1
          : 2
    };
  }


  // =========================================================
  // REINICIAR MUNDO
  // =========================================================

  function resetWorld() {

    clouds = [];
    birds = [];
    particles = [];
    bullets = [];
    hearts = [];
    level2Trail = [];

    for (let i = 0; i < 26; i++) {

      const layer = i % 3;

      const speed =
        layer === 0
          ? rand(6, 12)
          : layer === 1
          ? rand(15, 27)
          : rand(30, 48);

      clouds.push(
        makeCloud(
          rand(-100, W + 200),
          rand(40, H - 20),
          rand(.45, 1.45),
          speed,
          rand(.3, .82)
        )
      );
    }


    // Pájaros lejanos

    for (let i = 0; i < 4; i++) {

      birds.push({
        x: rand(0, W),
        y: rand(90, H - 120),
        speed: rand(18, 35),
        scale: rand(.45, .8),
        phase: rand(0, Math.PI * 2),
        delay: rand(0, 10)
      });
    }


    // Pequeños puntos del cielo

    skyStars = Array.from(
      { length: 35 },
      () => ({
        x: rand(0, W),
        y: rand(0, H),
        a: rand(.04, .14),
        r: rand(.5, 1.5)
      })
    );


    player.x = 190;
    player.y = H / 2;
    player.fireCooldown = 0;
    player.tilt = 0;
    player.bob = 0;
    player.facing = 1;
  }


  // =========================================================
  // NIVEL 1
  // =========================================================

  function initLevel1() {

    resetWorld();

    level1FinishQueued = false;

    hearts = [

      {
        x: 910,
        y: 145,
        scale: 1.0,
        hp: 1,
        fade: 0,
        dead: false,
        wobble: rand(0, 6)
      },

      {
        x: 1070,
        y: 260,
        scale: .88,
        hp: 1,
        fade: 0,
        dead: false,
        wobble: rand(0, 6)
      },

      {
        x: 850,
        y: 365,
        scale: 1.08,
        hp: 1,
        fade: 0,
        dead: false,
        wobble: rand(0, 6)
      },

      {
        x: 1040,
        y: 495,
        scale: .92,
        hp: 1,
        fade: 0,
        dead: false,
        wobble: rand(0, 6)
      },

      {
        x: 890,
        y: 600,
        scale: 1.0,
        hp: 1,
        fade: 0,
        dead: false,
        wobble: rand(0, 6)
      }

    ];

    state = "level1";

    updateHUD();

    showTouchControls(true);
  }


  // =========================================================
  // CORAZÓN DEL NIVEL 2
  // =========================================================

  function createHeartRoute() {

    const points = [];

    const cx = 790;
    const cy = 355;

    const sx = 250;
    const sy = 230;


    for (let i = 0; i < 260; i++) {

      const t =
        (i / 260) *
        Math.PI *
        2;


      const x =
        cx +
        sx *
        Math.pow(Math.sin(t), 3);


      const y =
        cy -
        sy *
        (
          0.82 * Math.cos(t)
          -
          0.34 * Math.cos(2 * t)
          -
          0.16 * Math.cos(3 * t)
          -
          0.07 * Math.cos(4 * t)
        );


      points.push({
        x,
        y
      });
    }

    return points;
  }


  // =========================================================
  // NIVEL 2
  // =========================================================

  function initLevel2() {

    resetWorld();

    heartRoute = createHeartRoute();

    routeCoverage =
      new Array(
        heartRoute.length
      ).fill(false);

    routeCoveredCount = 0;

    level2Trail = [];

    player.x = heartRoute[0].x;
    player.y = heartRoute[0].y;

    state = "level2";

    updateHUD();

    showTouchControls(true);
  }


  // =========================================================
  // INICIAR JUEGO
  // =========================================================

  function startGame() {

    hideOverlay(overlay);

    getAudioCtx();   // prepara el sonido de colisión (ver punto 3)
    playMusic();

    initLevel1();
  }


  // =========================================================
  // TRANSICIÓN NIVEL 1 -> NIVEL 2
  // =========================================================

  function showTransition() {

    state = "transition";

    playSuccess();

    showTouchControls(false);

    transition.classList.remove(
      "hidden",
      "fadeOut"
    );

    transitionTimer = 0;
  }


  function goToLevel2() {

    hideOverlay(transition);

    initLevel2();
  }


  // =========================================================
  // PANTALLA DEL REGALO
  // =========================================================

  function showDoneScreen() {
    state = "done";
    playSuccess();
    showTouchControls(false);
    doneScreen.classList.remove("hidden", "fadeOut");
  }

  function goToGift() {
    hideOverlay(doneScreen);
    showGiftScreen();
  }

  function showGiftScreen() {

    state = "gift";

    showTouchControls(false);

    giftScreen.classList.remove(
      "hidden",
      "fadeOut"
    );
  }


  // =========================================================
  // ABRIR REGALO
  // =========================================================
  function openGift() {
    if (giftBtn.disabled) return;
    giftBtn.disabled = true;

    giftBtn.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.16) rotate(-3deg)" },
        { transform: "scale(.88) rotate(3deg)" },
        { transform: "scale(1.04)" },
        { transform: "scale(0)" }
      ],
      {
        duration: 650,
        easing: "cubic-bezier(.2,.8,.2,1)",
        fill: "forwards"
      }
    );

    setTimeout(() => {
      giftScreen.classList.add("fadeOut");

      setTimeout(() => {
        giftScreen.classList.add("hidden");
        finalScreen.classList.remove("hidden", "fadeOut");
        state = "final";
      }, 550);
    }, 480);
  }


  // =========================================================
  // REINICIAR
  // =========================================================
  function launchPetals(clickX, clickY) {
    if (petalLayer.childElementCount > 400) return;   // límite por si hacen muchos clics

    const w = finalScreen.clientWidth;
    const h = finalScreen.clientHeight;

    // Esquina más cercana al clic → esquina opuesta
    const fromLeft = clickX < w / 2;
    const fromTop = clickY < h / 2;

    const sx = fromLeft ? -40 : w + 40;
    const sy = fromTop ? -40 : h + 40;
    const ex = fromLeft ? w + 60 : -60;
    const ey = fromTop ? h + 60 : -60;

    const dx = ex - sx;
    const dy = ey - sy;
    const len = Math.hypot(dx, dy);

    // Dirección perpendicular, para abrir los pétalos en abanico
    const px = -dy / len;
    const py = dx / len;

    for (let i = 0; i < 70; i++) {
      const petal = document.createElement("div");
      petal.className = "petal";

      const size = rand(10, 22);
      petal.style.width = size + "px";
      petal.style.height = size * 1.3 + "px";

      petalLayer.appendChild(petal);

      const spread = rand(-.5, .5) * Math.min(w, h);   // ancho de la franja
      const sway = rand(20, 60);                       // vaivén lateral
      const phase = rand(0, Math.PI * 2);
      const spin = rand(360, 900) * (Math.random() < .5 ? -1 : 1);

      const frames = [];
      const steps = 6;

      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const off = spread + Math.sin(phase + t * Math.PI * 3) * sway;

        frames.push({
          transform:
            `translate(${sx + dx * t + px * off}px, ${sy + dy * t + py * off}px) ` +
            `rotate(${spin * t}deg)`,
          opacity: t < .08 ? t / .08 : t > .85 ? (1 - t) / .15 : 1,
          offset: t
        });
      }

      const anim = petal.animate(frames, {
        duration: rand(2800, 4800),
        delay: rand(0, 900),
        easing: "linear",
        fill: "both"
      });

      anim.onfinish = () => petal.remove();
    }
  }

  function restart() {
    finalScreen.classList.add("fadeOut");

    setTimeout(() => {
      finalScreen.classList.add("hidden");
      petalLayer.innerHTML = "";
      overlay.classList.remove("hidden", "fadeOut");

      giftBtn.disabled = false;
      giftBtn.getAnimations().forEach(a => a.cancel());

      state = "start";
      resetWorld();
    }, 500);
  }


  // =========================================================
  // OCULTAR OVERLAY
  // =========================================================

  function hideOverlay(el) {

    el.classList.add("fadeOut");

    setTimeout(() => {

      el.classList.add("hidden");

    }, 550);
  }


  // =========================================================
  // CONTROLES TÁCTILES
  // =========================================================

  function showTouchControls(show) {

    const touchCapable =
      matchMedia("(pointer: coarse)").matches ||
      innerWidth < 700;


    if (
      show &&
      touchCapable
    ) {

      touchControls.classList.remove(
        "hidden"
      );

    } else {

      touchControls.classList.add(
        "hidden"
      );

    }
  }


  // =========================================================
  // HUD
  // =========================================================

  function updateHUD() {

    if (state === "level1") {

      levelLabel.textContent =
        "Nivel 1 · Las nubes";

      progressWrap.classList.remove(
        "hidden"
      );

      const destroyed = hearts.filter(h => h.dead || h.fade > 0).length;


      progressText.textContent =
        `${destroyed} / 5 corazones`;


      progressFill.style.width =
        `${destroyed / 5 * 100}%`;

    }


    else if (state === "level2") {

      levelLabel.textContent =
        "Nivel 2 · Dibujando un corazón";

      progressWrap.classList.remove(
        "hidden"
      );


      const pct =
        routeCoveredCount /
        heartRoute.length *
        100;


      progressText.textContent =
        `Corazón ${Math.round(pct)}% dibujado`;


      progressFill.style.width =
        `${pct}%`;

    }


    else {

      levelLabel.textContent = "";

      progressWrap.classList.add(
        "hidden"
      );
    }
  }


  // =========================================================
  // PARTÍCULAS DE NUBE
  // =========================================================

  function spawnCloudPuff(
    x,
    y,
    amount = 12,
    big = false
  ) {

    for (let i = 0; i < amount; i++) {

      particles.push({

        x:
          x +
          rand(-18, 18),

        y:
          y +
          rand(-18, 18),

        vx:
          rand(-70, 70),

        vy:
          rand(-75, 75),

        life:
          rand(.45, 1.15),

        maxLife: 1.15,

        size:
          rand(
            big ? 7 : 3,
            big ? 18 : 9
          ),

        type: "cloud"
      });
    }
  }


  // =========================================================
  // DISPARAR
  // =========================================================

  let audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function playHitSound() {
    const s = new Audio("Pum.mp3");
    s.volume = 0.7;
    s.play().catch(() => {});
  }

  function fire() {

    if (
      player.fireCooldown > 0
    ) {
      return;
    }


    player.fireCooldown = .19;


    bullets.push({

      x: player.x - 70,

      y: player.y + 6,

      vx: 720,

      life: 2.2
    });
  }


  // =========================================================
  // ACTUALIZAR AVIÓN
  // =========================================================
  function updatePlayer(dt) {
    let dx = 0;
    let dy = 0;

    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;

    // El movimiento horizontal solo existe en el nivel 2
    if (state === "level2") {
      if (keys.left) dx -= 1;
      if (keys.right) dx += 1;
    }

    // En diagonal no va más rápido
    const len = Math.hypot(dx, dy) || 1;

    player.x += dx / len * player.speed * dt;
    player.y += dy / len * player.speed * dt;

    player.x = clamp(player.x, 90, W - 90);
    player.y = clamp(player.y, 55, H - 55);

    if (dx !== 0) player.facing = dx > 0 ? 1 : -1;

    player.bob += dt * 8;

    // Inclinación: hacia abajo baja la nariz, mire a donde mire
    const targetTilt = dy * .13 * player.facing;
    player.tilt += (targetTilt - player.tilt) * Math.min(1, dt * 9);

    // Solo se dispara en el nivel 1
    if (keys.fire && state === "level1") fire();

    player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  }


  // =========================================================
  // ACTUALIZAR FONDO
  // =========================================================

  function updateBackground(dt) {

    for (const c of clouds) {

      c.x -=
        c.speed *
        dt;

      c.puff += dt;


      if (
        c.x <
        -180 * c.scale
      ) {

        c.x =
          W +
          rand(50, 250);

        c.y =
          rand(
            35,
            H - 30
          );
      }
    }


    for (const b of birds) {

      if (
        elapsed <
        b.delay
      ) {
        continue;
      }


      b.x -=
        b.speed *
        dt;


      b.phase +=
        dt * 5;


      b.y +=
        Math.sin(
          b.phase
        ) *
        dt *
        2;


      if (
        b.x <
        -80
      ) {

        b.x =
          W +
          rand(30, 300);

        b.y =
          rand(
            80,
            H - 100
          );

        b.delay =
          elapsed +
          rand(2, 8);
      }
    }
  }


  // =========================================================
  // ACTUALIZAR BALAS
  // =========================================================

  function updateBullets(dt) {

    for (const b of bullets) {

      b.x +=
        b.vx *
        dt;

      b.life -= dt;
    }


    bullets =
      bullets.filter(
        b =>
          b.life > 0 &&
          b.x < W + 100
      );


    if (
      state === "level1"
    ) {

      for (const b of bullets) {

        for (const h of hearts) {

          if (
            h.dead ||
            h.fade > 0
          ) {
            continue;
          }


          const wobbleY =
            h.y +
            Math.sin(
              elapsed * 1.5 +
              h.wobble
            ) *
            5;


          if (
            dist(
              b.x,
              b.y,
              h.x,
              wobbleY
            ) <
            54 * h.scale
          ) {

            h.fade = .001;

            b.life = 0;

            playHitSound();

            spawnCloudPuff(
              h.x,
              wobbleY,
              18,
              true
            );
          }
        }
      }
    }
  }


  // =========================================================
  // ACTUALIZAR CORAZONES
  // =========================================================

  function updateHearts(dt) {

    for (const h of hearts) {

      if (
        h.fade > 0 &&
        !h.dead
      ) {

        h.fade +=
          dt * 3.5;


        if (
          Math.random() <
          dt * 18
        ) {

          spawnCloudPuff(
            h.x,
            h.y,
            1,
            false
          );
        }


        if (
          h.fade >= 1.65
        ) {

          h.dead = true;

          h.fade = 0;
        }
      }
    }


    if (
      hearts.length &&
      hearts.every(
        h => h.dead
      ) &&
      !level1FinishQueued
    ) {

      level1FinishQueued = true;

      setTimeout(
        showTransition,
        900
      );
    }
  }


  // =========================================================
  // ACTUALIZAR NIVEL 2
  // =========================================================
  function updateLevel2(dt) {
    if (!heartRoute.length) return;

    // Pintar todos los puntos del corazón cercanos al avión
    const R = 36;   // radio de pintura: más bajo = más difícil

    for (let i = 0; i < heartRoute.length; i++) {
      if (routeCoverage[i]) continue;

      if (dist(player.x, player.y, heartRoute[i].x, heartRoute[i].y) < R) {
        routeCoverage[i] = true;
        routeCoveredCount++;
      }
    }

    // Humo detrás del avión (según hacia dónde mire)
    level2Trail.push({
      x: player.x - 70 * player.facing,
      y: player.y + 6,
      life: TRAIL_LIFE,
      size: rand(7, 14)
    });

    for (const p of level2Trail) p.life -= dt;
    level2Trail = level2Trail.filter(p => p.life > 0);

    updateHUD();

    // Termina solo cuando el corazón está completo
    if (routeCoveredCount >= heartRoute.length && state === "level2") {
      state = "level2Complete";
      setTimeout(showDoneScreen, 1400);
    }
  }


  // =========================================================
  // ACTUALIZAR PARTÍCULAS
  // =========================================================

  function updateParticles(dt) {

    for (const p of particles) {

      p.x +=
        p.vx *
        dt;

      p.y +=
        p.vy *
        dt;


      p.vy +=
        80 *
        dt;


      p.life -= dt;
    }


    particles =
      particles.filter(
        p =>
          p.life > 0
      );
  }


  // =========================================================
  // ACTUALIZAR TODO
  // =========================================================

  function update(dt) {

    elapsed += dt;

    updateBackground(dt);

    updateParticles(dt);


    if (
      state === "level1"
    ) {

      updatePlayer(dt);
      updateBullets(dt);
      updateHearts(dt);
      updateHUD();
    }


    else if (
      state === "level2"
    ) {

      updatePlayer(dt);
      updateLevel2(dt);
    }


    else if (
      state === "level2Complete"
    ) {

      updatePlayer(dt);
    }


    else if (
      state === "transition"
    ) {

      transitionTimer += dt;
    }
  }


  // =========================================================
  // DIBUJAR CIELO
  // =========================================================
  function drawSky() {
    if (bgImg.complete && bgImg.naturalWidth) {
      ctx.drawImage(bgImg, 0, 0, W, H);
    } else {
      ctx.fillStyle = "#c9fbff";   // color de respaldo mientras carga
      ctx.fillRect(0, 0, W, H);
    }
  }


  // =========================================================
  // DIBUJAR NUBE
  // =========================================================

  function drawCloud(c) {

    ctx.save();

    ctx.globalAlpha =
      c.alpha;

    ctx.translate(
      c.x,
      c.y
    );

    ctx.scale(
      c.scale,
      c.scale
    );


    const puffs = [
      [-48, 8, 27],
      [-25, -7, 32],
      [8, -5, 36],
      [38, 9, 25],
      [-3, 13, 35],
      [26, 19, 27]
    ];


    for (
      const [x, y, r]
      of puffs
    ) {

      ctx.fillStyle =
        "#ffffff";

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        r,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }


    ctx.restore();

    ctx.globalAlpha = 1;
  }


  // =========================================================
  // DIBUJAR PÁJARO
  // =========================================================

  function drawBird(b) {

    if (
      elapsed <
      b.delay
    ) {
      return;
    }


    ctx.save();

    ctx.translate(
      b.x,
      b.y
    );

    ctx.scale(
      b.scale,
      b.scale
    );


    ctx.strokeStyle =
      "rgba(65,82,94,.35)";

    ctx.lineWidth = 3;

    ctx.lineCap =
      "round";


    const wing =
      Math.sin(
        b.phase
      ) * 5;


    ctx.beginPath();

    ctx.moveTo(
      -10,
      wing
    );

    ctx.quadraticCurveTo(
      -4,
      -7,
      0,
      0
    );

    ctx.quadraticCurveTo(
      5,
      -7,
      11,
      wing
    );

    ctx.stroke();


    ctx.restore();
  }


  // =========================================================
  // DIBUJAR CORAZÓN DE NUBE
  // =========================================================
  function drawCloudHeart(h) {
    if (h.dead) return;

    const wobbleY = h.y + Math.sin(elapsed * 1.5 + h.wobble) * 5;

    const fade = h.fade > 0
      ? clamp(1 - h.fade / 1.65, 0, 1)
      : 1;

    const pulse = 1 + Math.sin(elapsed * 2 + h.wobble) * .025;
    const dissolve = 1 + h.fade * .25;   // crece un poco al deshacerse
    const size = HEART_SIZE * h.scale * pulse * dissolve;

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(h.x, wobbleY);

    if (heartImg.complete && heartImg.naturalWidth) {
      ctx.drawImage(heartImg, -size / 2, -size / 2, size, size);
    }

    // Partículas al reventar
    if (h.fade > 0) {
      ctx.globalAlpha = fade * .5;
      ctx.fillStyle = "#ffffff";

      for (let i = 0; i < 18; i++) {
        const a = i / 18 * Math.PI * 2;
        const rr = 55 + h.fade * 45;

        ctx.beginPath();
        ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, rand(2, 6), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }


  // =========================================================
  // DIBUJAR RUTA DEL CORAZÓN
  // =========================================================

  function drawRoute() {

    if (
      !heartRoute.length
    ) {
      return;
    }


    // Corazón gris guía.

    ctx.save();

    ctx.beginPath();

    ctx.moveTo(
      heartRoute[0].x,
      heartRoute[0].y
    );


    for (
      let i = 1;
      i < heartRoute.length;
      i++
    ) {

      ctx.lineTo(
        heartRoute[i].x,
        heartRoute[i].y
      );
    }


    ctx.closePath();


    ctx.strokeStyle =
      "rgba(92,106,118,.55)";

    ctx.lineWidth = 13;

    ctx.lineJoin =
      "round";

    ctx.lineCap =
      "round";

    ctx.stroke();


    ctx.strokeStyle =
      "rgba(235,240,243,.85)";

    ctx.lineWidth = 5;

    ctx.stroke();


    ctx.restore();


    // Partes ya dibujadas.

    ctx.save();

    ctx.lineWidth = 15;

    ctx.lineCap =
      "round";

    ctx.lineJoin =
      "round";

    ctx.strokeStyle =
      "rgba(242,112,143,.95)";


    for (
      let i = 0;
      i <
      heartRoute.length - 1;
      i++
    ) {

      if (
        routeCoverage[i] &&
        routeCoverage[i + 1]
      ) {

        ctx.beginPath();

        ctx.moveTo(
          heartRoute[i].x,
          heartRoute[i].y
        );

        ctx.lineTo(
          heartRoute[i + 1].x,
          heartRoute[i + 1].y
        );

        ctx.stroke();
      }
    }


    ctx.restore();
  }


  // =========================================================
  // DIBUJAR HUMO
  // =========================================================

  function drawTrail() {
    for (const p of level2Trail) {
      ctx.globalAlpha = clamp(p.life / TRAIL_LIFE, 0, 1) * .45;
      ctx.fillStyle = "#ffffff";

      ctx.beginPath();
      ctx.arc(
        p.x,
        p.y,
        p.size * (1 + (TRAIL_LIFE - p.life) * .2),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }


  // =========================================================
  // DIBUJAR AVIÓN
  // =========================================================
  
  function drawPlayer() {
    const bob = Math.sin(player.bob) * 3;
    const facingLeft = player.facing === -1;

    ctx.save();
    ctx.translate(player.x, player.y + bob);
    ctx.rotate(player.tilt);

    // Estela del motor, detrás del avión
    for (let i = 0; i < 5; i++) {
      ctx.globalAlpha = .18 - i * .025;
      ctx.fillStyle = "#ffffff";

      ctx.beginPath();
      ctx.arc(
        (-82 - i * 9) * player.facing,
        6 + Math.sin(elapsed * 5 + i) * 2,
        8 + i * 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    // Si mira a la izquierda usa avion_2.png; si no existe, usa el normal en espejo
    const img = (facingLeft && planeLeftImg.naturalWidth) ? planeLeftImg : planeImg;

    if (img.complete && img.naturalWidth) {
      if (facingLeft && img === planeImg) ctx.scale(-1, 1);
      ctx.drawImage(img, -PLANE_W / 2, -PLANE_H / 2, PLANE_W, PLANE_H);
    }

    ctx.restore();
  }


  // =========================================================
  // DIBUJAR BALAS
  // =========================================================
  function drawBullets() {
    for (const b of bullets) {
      ctx.save();
      ctx.lineCap = "round";

      // Contorno rosa intenso con brillo
      ctx.shadowBlur = 12;
      ctx.shadowColor = "rgba(255,60,110,.9)";
      ctx.strokeStyle = "#ff3d77";
      ctx.lineWidth = 7;

      ctx.beginPath();
      ctx.moveTo(b.x - 16, b.y);
      ctx.lineTo(b.x + 12, b.y);
      ctx.stroke();

      // Centro claro
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#ffe1ea";
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(b.x - 14, b.y);
      ctx.lineTo(b.x + 10, b.y);
      ctx.stroke();

      ctx.restore();
    }
  }

  // =========================================================
  // DIBUJAR PARTÍCULAS
  // =========================================================

  function drawParticles() {

    for (
      const p of particles
    ) {

      const alpha =
        clamp(
          p.life /
            p.maxLife,
          0,
          1
        );


      ctx.globalAlpha =
        alpha;


      if (
        p.type === "heart"
      ) {

        ctx.fillStyle =
          "#df91a8";

        ctx.font =
          `${Math.max(
            10,
            p.size * 3
          )}px Georgia`;

        ctx.textAlign =
          "center";


        ctx.fillText(
          "♡",
          p.x,
          p.y
        );

      }

      else {

        ctx.fillStyle =
          "#ffffff";


        ctx.beginPath();

        ctx.arc(
          p.x,
          p.y,
          p.size,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }
    }


    ctx.globalAlpha = 1;
  }


  // =========================================================
  // PARTÍCULAS DE TRANSICIÓN
  // =========================================================

  function drawTransitionParticles() {

    for (
      let i = 0;
      i < 7;
      i++
    ) {

      const x =
        (
          elapsed *
            (10 + i * 3) +
          i * 170
        ) %
          (W + 120) -
        60;


      const y =
        110 +
        i * 75 +
        Math.sin(
          elapsed * .7 + i
        ) *
        15;


      ctx.globalAlpha =
        .22;

      ctx.fillStyle =
        "#ffffff";


      ctx.beginPath();

      ctx.ellipse(
        x,
        y,
        55,
        18,
        0,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }


    ctx.globalAlpha = 1;
  }


  // =========================================================
  // DIBUJAR TODO
  // =========================================================

  function draw() {

    drawSky();

    if (SHOW_MOVING_CLOUDS) {
      const orderedClouds = [...clouds].sort((a, b) => a.layer - b.layer);

      for (const c of orderedClouds) {
        drawCloud(c);
      }

      for (const b of birds) {
        drawBird(b);
      }
    }

    // Nivel 1.

    if (
      state === "level1" ||
      state === "transition"
    ) {

      for (
        const h of hearts
      ) {

        drawCloudHeart(h);
      }


      drawBullets();

      drawPlayer();
    }


    // Nivel 2.

    if (
      state === "level2" ||
      state === "level2Complete"
    ) {

      drawRoute();

      drawTrail();

      drawPlayer();
    }


    if (
      state === "transition"
    ) {

      drawTransitionParticles();
    }


    drawParticles();
  }


  // =========================================================
  // BUCLE PRINCIPAL
  // =========================================================

  function loop(now) {

    const dt =
      Math.min(
        .033,
        (now - lastTime) /
          1000
      );


    lastTime = now;


    update(dt);

    draw();


    requestAnimationFrame(
      loop
    );
  }


  // =========================================================
  // TECLADO
  // =========================================================

  function keyDown(e) {

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
      e.preventDefault();
    }

    if (
      e.code === "ArrowUp" ||
      e.code === "KeyW"
    ) {

      keys.up = true;
    }


    if (
      e.code === "ArrowDown" ||
      e.code === "KeyS"
    ) {

      keys.down = true;
    }

    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;

    if (
      e.code === "Space"
    ) {

      keys.fire = true;
    }
  }


  function keyUp(e) {

    if (
      e.code === "ArrowUp" ||
      e.code === "KeyW"
    ) {

      keys.up = false;
    }


    if (
      e.code === "ArrowDown" ||
      e.code === "KeyS"
    ) {

      keys.down = false;
    }


    if (
      e.code === "Space"
    ) {

      keys.fire = false;
    }

    if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
    if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
  }

  doneBtn.addEventListener("click", goToGift);

  window.addEventListener(
    "keydown",
    keyDown,
    {
      passive: false
    }
  );


  window.addEventListener(
    "keyup",
    keyUp
  );

  finalScreen.addEventListener("click", e => {
    if (e.target.closest("#restartBtn")) return;   // el botón no lanza pétalos
    launchPetals(e.clientX, e.clientY);
  });


  // =========================================================
  // CONTROLES TÁCTILES
  // =========================================================

  function holdControl(
    name,
    active
  ) {

    keys[name] =
      active;
  }


  function bindTouchButton(
    id,
    key
  ) {

    const el =
      document.getElementById(
        id
      );


    const on = e => {

      e.preventDefault();

      holdControl(
        key,
        true
      );


      if (
        el.setPointerCapture
      ) {

        try {

          el.setPointerCapture(
            e.pointerId
          );

        } catch (_) {}
      }
    };


    const off = e => {

      e.preventDefault();

      holdControl(
        key,
        false
      );
    };


    el.addEventListener(
      "pointerdown",
      on
    );


    el.addEventListener(
      "pointerup",
      off
    );


    el.addEventListener(
      "pointercancel",
      off
    );


    el.addEventListener(
      "pointerleave",
      off
    );
  }


  bindTouchButton(
    "upTouch",
    "up"
  );


  bindTouchButton(
    "downTouch",
    "down"
  );


  bindTouchButton(
    "fireTouch",
    "fire"
  );


  // =========================================================
  // BOTONES
  // =========================================================

  startBtn.addEventListener(
    "click",
    startGame
  );


  continueBtn.addEventListener(
    "click",
    goToLevel2
  );


  giftBtn.addEventListener(
    "click",
    openGift
  );


  restartBtn.addEventListener(
    "click",
    restart
  );


  // =========================================================
  // MÚSICA
  // =========================================================
  music.volume = 0.5;   // de 0 a 1

  async function playMusic() {
    try {
      await music.play();
      musicOn = true;
      musicBtn.textContent = "♫ Música: ON";
    } catch (err) {
      musicOn = false;
      musicBtn.textContent = "♫ Música: OFF";
    }
  }

  function pauseMusic() {
    music.pause();
    musicOn = false;
    musicBtn.textContent = "♫ Música: OFF";
  }

  musicBtn.addEventListener("click", () => {
    if (musicOn) pauseMusic();
    else playMusic();
  });


  music.addEventListener(
    "error",
    () => {

      musicOn = false;
    }
  );


  // =========================================================
  // IMAGEN FINAL
  // =========================================================

  document
    .getElementById("finalImage")
    .addEventListener(
      "error",
      function () {

        this.alt =
          "No se pudo cargar la imagen. Reemplaza la URL de src por un direct image URL.";

        this.style.minHeight =
          "180px";

        this.style.background =
          "rgba(255,255,255,.5)";
      }
    );


  // =========================================================
  // INICIO
  // =========================================================

  resetWorld();

  requestAnimationFrame(
    loop
  );

})();