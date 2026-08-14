/**
 * FLUXFORGE — rendering, audio, input, loop. Requires FluxCore.
 */
(function () {
  "use strict";

  var C = window.FluxCore;
  var IW = C.IW;
  var IH = C.IH;
  var P = C.PALETTE;

  var canvas, ctx, buffer, btx;
  var game;
  var last = 0;
  var input = { anvilX: 160, holding: false, released: false, fluxPulse: false };
  var keys = {};
  var audio = null;
  var muted = false;
  var pointerDown = false;
  var fluxBtn = { x: 286, y: 206, r: 16 };
  var shakeSeed = 0;
  var crtOn = true;
  var highScore = 0;

  try {
    highScore = parseInt(localStorage.getItem("fluxforge.hs") || "0", 10) || 0;
  } catch (e) {
    highScore = 0;
  }

  var FONT = {
    " ": ["00000", "00000", "00000", "00000", "00000"],
    A: ["01110", "10001", "11111", "10001", "10001"],
    B: ["11110", "10001", "11110", "10001", "11110"],
    C: ["01111", "10000", "10000", "10000", "01111"],
    D: ["11110", "10001", "10001", "10001", "11110"],
    E: ["11111", "10000", "11110", "10000", "11111"],
    F: ["11111", "10000", "11110", "10000", "10000"],
    G: ["01111", "10000", "10111", "10001", "01110"],
    H: ["10001", "10001", "11111", "10001", "10001"],
    I: ["11111", "00100", "00100", "00100", "11111"],
    J: ["00111", "00001", "00001", "10001", "01110"],
    K: ["10001", "10010", "11100", "10010", "10001"],
    L: ["10000", "10000", "10000", "10000", "11111"],
    M: ["10001", "11011", "10101", "10001", "10001"],
    N: ["10001", "11001", "10101", "10011", "10001"],
    O: ["01110", "10001", "10001", "10001", "01110"],
    P: ["11110", "10001", "11110", "10000", "10000"],
    Q: ["01110", "10001", "10101", "10010", "01101"],
    R: ["11110", "10001", "11110", "10010", "10001"],
    S: ["01111", "10000", "01110", "00001", "11110"],
    T: ["11111", "00100", "00100", "00100", "00100"],
    U: ["10001", "10001", "10001", "10001", "01110"],
    V: ["10001", "10001", "10001", "01010", "00100"],
    W: ["10001", "10001", "10101", "11011", "10001"],
    X: ["10001", "01010", "00100", "01010", "10001"],
    Y: ["10001", "01010", "00100", "00100", "00100"],
    Z: ["11111", "00010", "00100", "01000", "11111"],
    "0": ["01110", "10011", "10101", "11001", "01110"],
    "1": ["00100", "01100", "00100", "00100", "01110"],
    "2": ["01110", "10001", "00110", "01000", "11111"],
    "3": ["11110", "00001", "01110", "00001", "11110"],
    "4": ["10010", "10010", "11111", "00010", "00010"],
    "5": ["11111", "10000", "11110", "00001", "11110"],
    "6": ["01110", "10000", "11110", "10001", "01110"],
    "7": ["11111", "00001", "00010", "00100", "00100"],
    "8": ["01110", "10001", "01110", "10001", "01110"],
    "9": ["01110", "10001", "01111", "00001", "01110"],
    "-": ["00000", "00000", "11111", "00000", "00000"],
    ":": ["00000", "00100", "00000", "00100", "00000"],
    ".": ["00000", "00000", "00000", "00000", "00100"],
    "!": ["00100", "00100", "00100", "00000", "00100"],
    "/": ["00001", "00010", "00100", "01000", "10000"],
    "?": ["01110", "10001", "00010", "00000", "00010"]
  };

  function drawText(ctx2, str, x, y, color, scale) {
    scale = scale || 1;
    ctx2.fillStyle = color;
    str = String(str).toUpperCase();
    var i, j, k, ch, row, px, py;
    px = x;
    for (i = 0; i < str.length; i++) {
      ch = FONT[str.charAt(i)] || FONT["?"];
      for (j = 0; j < 5; j++) {
        row = ch[j];
        for (k = 0; k < 5; k++) {
          if (row.charAt(k) === "1") {
            ctx2.fillRect(px + k * scale, y + j * scale, scale, scale);
          }
        }
      }
      px += 6 * scale;
    }
  }

  function textWidth(str, scale) {
    return String(str).length * 6 * (scale || 1);
  }

  function centerText(ctx2, str, y, color, scale) {
    var w = textWidth(str, scale);
    drawText(ctx2, str, (IW - w) / 2, y, color, scale);
  }

  function ensureAudio() {
    if (audio || muted) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audio = {
      ctx: new AC(),
      t: 0,
      step: 0,
      next: 0
    };
    var master = audio.ctx.createGain();
    master.gain.value = 0.08;
    master.connect(audio.ctx.destination);
    audio.master = master;
  }

  function beep(freq, dur, type, vol) {
    if (!audio || muted) return;
    var c = audio.ctx;
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, c.currentTime);
    g.gain.setValueAtTime(vol || 0.12, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g);
    g.connect(audio.master);
    o.start();
    o.stop(c.currentTime + dur);
  }

  function noise(dur, vol) {
    if (!audio || muted) return;
    var c = audio.ctx;
    var n = (c.sampleRate * dur) | 0;
    var buf = c.createBuffer(1, n, c.sampleRate);
    var d = buf.getChannelData(0);
    var i;
    for (i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var src = c.createBufferSource();
    src.buffer = buf;
    var g = c.createGain();
    g.gain.setValueAtTime(vol || 0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    var f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 900;
    src.connect(f);
    f.connect(g);
    g.connect(audio.master);
    src.start();
  }

  function musicTick() {
    if (!audio || muted) return;
    if (game.mode === "title" || game.mode === "help" || game.mode === "gameover" || game.mode === "win") return;
    var c = audio.ctx;
    if (c.currentTime < audio.next) return;
    var bass = [110, 110, 146, 110, 98, 98, 130, 98];
    var lead = [330, 0, 392, 330, 494, 0, 392, 330];
    var i = audio.step % 8;
    beep(bass[i], 0.12, "triangle", 0.07);
    if (lead[i]) beep(lead[i] * (game.flux.active > 0 ? 1.34 : 1), 0.08, "square", 0.04);
    if (i % 2 === 0) noise(0.03, 0.03);
    audio.step++;
    audio.next = c.currentTime + (game.boss && game.boss.phase === 3 ? 0.14 : 0.18);
  }

  function sfx(kind) {
    if (kind === "bumper") beep(220 + Math.random() * 80, 0.08, "square", 0.1);
    else if (kind === "drop" || kind === "prism") beep(520, 0.1, "square", 0.1);
    else if (kind === "slam" || kind === "anvil") beep(140, 0.07, "sawtooth", 0.08);
    else if (kind === "catch") beep(180, 0.12, "triangle", 0.1);
    else if (kind === "flux") {
      beep(90, 0.25, "sawtooth", 0.12);
      beep(240, 0.2, "square", 0.06);
    } else if (kind === "drain") {
      beep(200, 0.25, "sawtooth", 0.1);
      beep(90, 0.35, "triangle", 0.08);
    } else if (kind === "kickback") beep(440, 0.15, "square", 0.1);
    else if (kind === "warp") beep(660, 0.12, "triangle", 0.09);
    else if (kind === "mine") beep(700, 0.14, "square", 0.1);
    else if (kind === "minehit") noise(0.12, 0.1);
    else if (kind === "spin") beep(380, 0.04, "square", 0.04);
    else if (kind === "clear") {
      beep(330, 0.1, "square", 0.1);
      setTimeout(function () {
        beep(440, 0.1, "square", 0.1);
      }, 90);
      setTimeout(function () {
        beep(660, 0.18, "square", 0.1);
      }, 180);
    } else if (kind === "bosshit") {
      noise(0.08, 0.1);
      beep(80, 0.12, "sawtooth", 0.1);
    } else if (kind === "shot") beep(160, 0.06, "square", 0.06);
    else if (kind === "bossdown" || kind === "win") {
      beep(262, 0.2, "square", 0.1);
      setTimeout(function () {
        beep(330, 0.2, "square", 0.1);
      }, 120);
      setTimeout(function () {
        beep(392, 0.4, "square", 0.1);
      }, 240);
    } else if (kind === "tilt") noise(0.2, 0.12);
    else if (kind === "seqfail") beep(110, 0.2, "sawtooth", 0.1);
    if (kind === "bumper" || kind === "slam" || kind === "bosshit" || kind === "flux") {
      if (navigator.vibrate) navigator.vibrate(kind === "flux" ? 40 : 18);
    }
  }

  function worldFromEvent(ev) {
    var rect = canvas.getBoundingClientRect();
    var x = ((ev.clientX - rect.left) / rect.width) * IW;
    var y = ((ev.clientY - rect.top) / rect.height) * IH;
    return { x: x, y: y };
  }

  function inFluxBtn(p) {
    var dx = p.x - fluxBtn.x;
    var dy = p.y - fluxBtn.y;
    return dx * dx + dy * dy <= fluxBtn.r * fluxBtn.r * 1.4;
  }

  function tapMenu(p) {
    if (game.mode === "title") {
      if (p.y > 150 && p.y < 175) beginRun();
      else if (p.y > 180 && p.y < 200) game.mode = "help";
      return;
    }
    if (game.mode === "help") {
      game.mode = "title";
      return;
    }
    if (game.mode === "gameover" || game.mode === "win") {
      game.mode = "title";
    }
  }

  function beginRun() {
    var start = 0;
    try {
      var q = new URLSearchParams(location.search).get("lvl");
      if (q) start = C.clamp(parseInt(q, 10) - 1, 0, C.LEVELS.length - 1);
    } catch (e) {}
    C.startRun(game, start);
  }

  function bindInput() {
    window.addEventListener("keydown", function (e) {
      keys[e.code] = true;
      ensureAudio();
      if (audio && audio.ctx.state === "suspended") audio.ctx.resume();
      if (e.code === "KeyM") muted = !muted;
      if (e.code === "KeyC") crtOn = !crtOn;
      if (e.code === "KeyP" && (game.mode === "play" || game.paused)) game.paused = !game.paused;
      if (e.code === "KeyF" || e.code === "ShiftLeft" || e.code === "ShiftRight") input.fluxPulse = true;
      if (e.code === "Enter" || e.code === "Space") {
        if (game.mode === "title") beginRun();
        else if (game.mode === "help") game.mode = "title";
        else if (game.mode === "gameover" || game.mode === "win") game.mode = "title";
      }
      if (e.code === "Escape") {
        if (game.mode === "play") game.mode = "title";
      }
      e.preventDefault();
    });
    window.addEventListener("keyup", function (e) {
      keys[e.code] = false;
      if (e.code === "Space") input.released = true;
    });

    function down(ev) {
      ensureAudio();
      if (audio && audio.ctx.state === "suspended") audio.ctx.resume();
      pointerDown = true;
      var p = worldFromEvent(ev);
      if (game.mode !== "play" && game.mode !== "bossintro" && game.mode !== "clear" && game.mode !== "balllost") {
        tapMenu(p);
        return;
      }
      if (inFluxBtn(p)) {
        input.fluxPulse = true;
        return;
      }
      input.holding = true;
      input.anvilX = p.x;
    }
    function move(ev) {
      if (!pointerDown) return;
      var p = worldFromEvent(ev);
      if (!inFluxBtn(p)) input.anvilX = p.x;
    }
    function up() {
      if (pointerDown && input.holding) input.released = true;
      pointerDown = false;
      input.holding = false;
    }
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);

    window.addEventListener("devicemotion", function (e) {
      var a = e.accelerationIncludingGravity;
      if (!a) return;
      var mag = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0);
      if (mag > 28) input.fluxPulse = true;
    });
  }

  function glow(color, blur) {
    btx.strokeStyle = color;
    btx.fillStyle = color;
    btx.shadowColor = color;
    btx.shadowBlur = blur || 6;
  }

  function noGlow() {
    btx.shadowBlur = 0;
  }

  function drawHex(x, y, r, fill) {
    var i;
    btx.beginPath();
    for (i = 0; i < 6; i++) {
      var a = (Math.PI / 3) * i - Math.PI / 6;
      var px = x + Math.cos(a) * r;
      var py = y + Math.sin(a) * r * 0.78;
      if (i === 0) btx.moveTo(px, py);
      else btx.lineTo(px, py);
    }
    btx.closePath();
    if (fill) btx.fill();
    btx.stroke();
  }

  function drawPlayfield() {
    var t = game.table;
    var i, e;

    btx.fillStyle = P.bg;
    btx.fillRect(0, 0, IW, IH);

    btx.fillStyle = "#0d0820";
    btx.fillRect(8, 16, IW - 16, IH - 20);

    glow(game.flux.active > 0 ? P.amber : P.wall, 8);
    btx.lineWidth = 1;
    btx.beginPath();
    for (i = 0; i < t.walls.length; i++) {
      e = t.walls[i];
      btx.moveTo(e.x1, e.y1);
      btx.lineTo(e.x2, e.y2);
    }
    btx.stroke();

    for (i = 0; i < t.bumpers.length; i++) {
      e = t.bumpers[i];
      glow(e.cd > 0 ? P.white : game.flux.active > 0 ? P.amber : P.cyan, e.cd > 0 ? 14 : 8);
      btx.beginPath();
      btx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      btx.stroke();
      btx.beginPath();
      btx.arc(e.x, e.y, 3, 0, Math.PI * 2);
      btx.fill();
    }

    for (i = 0; i < t.drops.length; i++) {
      e = t.drops[i];
      glow(e.down ? "#33204a" : P.mag, 6);
      btx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
    }

    for (i = 0; i < t.diamonds.length; i++) {
      e = t.diamonds[i];
      if (e.hit) continue;
      glow(P.cyan, 8);
      btx.beginPath();
      btx.moveTo(e.x, e.y - e.r);
      btx.lineTo(e.x + e.r, e.y);
      btx.lineTo(e.x, e.y + e.r);
      btx.lineTo(e.x - e.r, e.y);
      btx.closePath();
      btx.stroke();
    }

    for (i = 0; i < t.spinners.length; i++) {
      e = t.spinners[i];
      glow(P.amber, 6);
      btx.beginPath();
      btx.moveTo(e.x + Math.cos(e.ang) * e.len, e.y + Math.sin(e.ang) * e.len);
      btx.lineTo(e.x - Math.cos(e.ang) * e.len, e.y - Math.sin(e.ang) * e.len);
      btx.stroke();
    }

    for (i = 0; i < t.warps.length; i++) {
      e = t.warps[i];
      glow(e.flash > 0 ? P.white : P.wall, 10);
      btx.beginPath();
      btx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      btx.stroke();
      btx.beginPath();
      btx.arc(e.x, e.y, e.r * 0.45, 0, Math.PI * 2);
      btx.stroke();
    }

    for (i = 0; i < t.mines.length; i++) {
      e = t.mines[i];
      if (!e.live) continue;
      glow(game.flux.active > 0 ? P.green : P.danger, 8);
      btx.beginPath();
      btx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      btx.stroke();
      btx.beginPath();
      btx.moveTo(e.x - 3, e.y - 3);
      btx.lineTo(e.x + 3, e.y + 3);
      btx.moveTo(e.x + 3, e.y - 3);
      btx.lineTo(e.x - 3, e.y + 3);
      btx.stroke();
    }

    for (i = 0; i < t.lights.length; i++) {
      e = t.lights[i];
      glow(e.on ? P.green : P.dim, e.on ? 12 : 2);
      btx.beginPath();
      btx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      if (e.on) btx.fill();
      else btx.stroke();
    }

    for (i = 0; i < t.sequence.length; i++) {
      e = t.sequence[i];
      glow(e.hit ? P.green : t.seqExpect === e.n ? P.amber : P.mag, 7);
      btx.beginPath();
      btx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      btx.stroke();
      noGlow();
      drawText(btx, String(e.n), e.x - 2, e.y - 2, e.hit ? P.green : P.white, 1);
    }

    for (i = 0; i < t.wells.length; i++) {
      e = t.wells[i];
      glow(P.wall, 12);
      btx.beginPath();
      btx.arc(e.x, e.y, e.r + 6 + Math.sin(game.time * 6) * 2, 0, Math.PI * 2);
      btx.stroke();
      btx.beginPath();
      btx.arc(e.x, e.y, 4, 0, Math.PI * 2);
      btx.fill();
    }
  }

  function drawBoss() {
    var b = game.boss;
    if (!b) return;
    var i, p, pos;
    glow(b.slam > 0 ? P.danger : P.mag, 12);
    drawHex(b.x, b.y, 40, false);
    if (b.phase === 1) {
      for (i = 0; i < b.plates.length; i++) {
        p = b.plates[i];
        if (p.hp <= 0) continue;
        pos = {
          x: b.x + Math.cos(p.ang + b.t * 0.4) * 36,
          y: b.y + Math.sin(p.ang + b.t * 0.4) * 36 * 0.72
        };
        glow(p.flash > 0 ? P.white : P.cyan, 8);
        drawHex(pos.x, pos.y, 10, false);
      }
    }
    if (b.phase >= 2) {
      for (i = 0; i < b.eyes.length; i++) {
        var e = b.eyes[i];
        if (e.hp <= 0) continue;
        glow(e.flash > 0 ? P.white : P.danger, 10);
        btx.beginPath();
        btx.arc(b.x + e.dx, b.y + e.dy, 6, 0, Math.PI * 2);
        btx.stroke();
        btx.beginPath();
        btx.arc(b.x + e.dx, b.y + e.dy, 2, 0, Math.PI * 2);
        btx.fill();
      }
    }
    if (b.phase === 3) {
      glow(b.coreFlash > 0 ? P.white : P.amber, 16);
      btx.beginPath();
      btx.arc(b.x, b.y, 12 + Math.sin(b.t * 8) * 2, 0, Math.PI * 2);
      btx.fill();
      glow(P.danger, 6);
      for (i = 0; i < b.blades.length; i++) {
        var ang = b.blades[i].ang;
        btx.beginPath();
        btx.moveTo(b.x, b.y);
        btx.lineTo(b.x + Math.cos(ang) * 50, b.y + Math.sin(ang) * 32);
        btx.stroke();
      }
    }
    glow(P.danger, 6);
    for (i = 0; i < b.shots.length; i++) {
      var s = b.shots[i];
      btx.beginPath();
      btx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      btx.fill();
    }
    noGlow();
    if (b.phase === 3) {
      var w = 80;
      var hp = b.coreHp / b.coreMax;
      btx.fillStyle = "#220818";
      btx.fillRect(b.x - w / 2, b.y - 52, w, 4);
      btx.fillStyle = P.danger;
      btx.fillRect(b.x - w / 2, b.y - 52, w * hp, 4);
    }
  }

  function drawAnvil() {
    var a = game.anvil;
    var left = a.x - a.w / 2;
    glow(a.holding ? P.amber : P.mag, 8);
    btx.fillStyle = a.holding ? P.amber : P.mag;
    btx.fillRect(left, a.y, a.w, a.h);
    btx.fillStyle = P.white;
    btx.fillRect(a.x - 8, a.y - 2, 16, 3);
    if (a.charge > 0) {
      glow(P.amber, 10);
      btx.fillRect(left, a.y + a.h + 2, a.w * a.charge, 2);
    }
    noGlow();
  }

  function drawBalls() {
    var i, j, b;
    for (i = 0; i < game.balls.length; i++) {
      b = game.balls[i];
      if (!b.alive) continue;
      for (j = 0; j < b.trail.length; j++) {
        btx.globalAlpha = (j + 1) / b.trail.length * 0.35;
        glow(P.cyan, 6);
        btx.beginPath();
        btx.arc(b.trail[j].x, b.trail[j].y, 2, 0, Math.PI * 2);
        btx.fill();
      }
      btx.globalAlpha = 1;
      glow(P.white, 12);
      btx.beginPath();
      btx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      btx.fill();
      noGlow();
    }
  }

  function drawFx() {
    var i, p;
    for (i = 0; i < game.particles.length; i++) {
      p = game.particles[i];
      btx.globalAlpha = Math.max(0, p.t * 1.6);
      btx.fillStyle = p.color;
      btx.fillRect(p.x, p.y, p.s, p.s);
    }
    btx.globalAlpha = 1;
    for (i = 0; i < game.floaters.length; i++) {
      p = game.floaters[i];
      drawText(btx, p.text, p.x - 8, p.y, P.amber, 1);
    }
  }

  function drawHud() {
    btx.fillStyle = "#05030c";
    btx.fillRect(0, 0, IW, 16);
    var sc = String(game.score | 0);
    while (sc.length < 6) sc = "0" + sc;
    drawText(btx, sc, 6, 4, P.amber, 1);
    drawText(btx, "x" + game.multiplier, 78, 4, P.cyan, 1);
    var lives = "";
    var i;
    for (i = 0; i < game.lives; i++) lives += "O";
    drawText(btx, lives || "-", 118, 4, P.mag, 1);
    var gp = C.goalProgress(game);
    drawText(btx, gp.text, 148, 4, P.white, 1);

    var fm = game.flux.meter;
    btx.fillStyle = "#22102a";
    btx.fillRect(6, 228, 50, 4);
    btx.fillStyle = game.flux.tilted > 0 ? P.danger : game.flux.active > 0 ? P.amber : P.cyan;
    btx.fillRect(6, 228, 50 * fm, 4);

    glow(game.flux.tilted > 0 ? P.danger : P.cyan, 8);
    btx.beginPath();
    btx.arc(fluxBtn.x, fluxBtn.y, fluxBtn.r, 0, Math.PI * 2);
    btx.stroke();
    noGlow();
    drawText(btx, "F", fluxBtn.x - 2, fluxBtn.y - 2, game.flux.tilted > 0 ? P.danger : P.cyan, 1);

    if (game.messageT > 0) {
      btx.fillStyle = "rgba(5,3,12,0.55)";
      btx.fillRect(20, 104, 280, 16);
      centerText(btx, game.message, 108, P.white, 1);
    }
    if (game.paused) centerText(btx, "PAUSED", 120, P.amber, 2);
  }

  function drawTitle() {
    btx.fillStyle = P.bg;
    btx.fillRect(0, 0, IW, IH);
    var i;
    glow(P.cyan, 10);
    for (i = 0; i < 12; i++) {
      btx.strokeStyle = i % 2 ? P.cyan : P.mag;
      btx.globalAlpha = 0.25;
      btx.beginPath();
      btx.moveTo(20, 30 + i * 14);
      btx.lineTo(300, 40 + i * 12 + Math.sin(game.time * 2 + i) * 6);
      btx.stroke();
    }
    btx.globalAlpha = 1;
    centerText(btx, "FLUXFORGE", 48, P.cyan, 3);
    centerText(btx, "ANVIL ARCADE", 72, P.mag, 1);
    glow(P.amber, 12);
    btx.beginPath();
    btx.arc(160 + Math.sin(game.time * 2) * 40, 118, 5, 0, Math.PI * 2);
    btx.fill();
    btx.fillRect(118, 132, 84, 8);
    noGlow();
    centerText(btx, "TAP START  OR  ENTER", 158, P.white, 1);
    centerText(btx, "HOW TO PLAY", 178, P.amber, 1);
    centerText(btx, "HI " + String(game.highScore | 0), 204, P.wall, 1);
    centerText(btx, "C.1986  VECTOR WORKS", 220, "#4a3a68", 1);
  }

  function drawHelp() {
    btx.fillStyle = P.bg;
    btx.fillRect(0, 0, IW, IH);
    centerText(btx, "HOW TO FORGE", 18, P.cyan, 1);
    var lines = [
      "THIS IS NOT PINBALL",
      "YOU WIELD THE ANVIL",
      "DRAG TO SLIDE",
      "HOLD TO CHARGE  RELEASE TO SLAM",
      "CATCH THE ORB IN THE POCKET",
      "FLUX REVERSES BUMPERS",
      "FLUX ALSO SAVES INLANES",
      "OVERUSE FLUX AND YOU TILT",
      "10 VAULTS THEN TITAN CORE",
      "SHAKE PHONE OR TAP F FOR FLUX",
      "",
      "TAP TO RETURN"
    ];
    var i;
    for (i = 0; i < lines.length; i++) {
      drawText(btx, lines[i], 24, 36 + i * 14, i === lines.length - 1 ? P.amber : P.white, 1);
    }
  }

  function drawEnd(win) {
    btx.fillStyle = "rgba(5,3,12,0.72)";
    btx.fillRect(0, 0, IW, IH);
    centerText(btx, win ? "ARC COMPLETE" : "GAME OVER", 70, win ? P.amber : P.danger, 2);
    centerText(btx, "SCORE " + (game.score | 0), 110, P.white, 1);
    centerText(btx, "HI " + (game.highScore | 0), 128, P.cyan, 1);
    centerText(btx, "TAP TO TITLE", 170, P.amber, 1);
  }

  function render() {
    var sx = 0;
    var sy = 0;
    if (game.shake > 0) {
      sx = (Math.random() - 0.5) * 6 * game.shake;
      sy = (Math.random() - 0.5) * 6 * game.shake;
    }
    btx.save();
    btx.translate(sx, sy);

    if (game.mode === "title") drawTitle();
    else if (game.mode === "help") drawHelp();
    else {
      drawPlayfield();
      drawBoss();
      drawAnvil();
      drawBalls();
      drawFx();
      drawHud();
      if (game.mode === "gameover") drawEnd(false);
      if (game.mode === "win") drawEnd(true);
    }
    if (game.flash > 0) {
      btx.fillStyle = "rgba(255,210,61," + game.flash * 0.45 + ")";
      btx.fillRect(0, 0, IW, IH);
    }
    btx.restore();

    var dw = canvas.width;
    var dh = canvas.height;
    var scale = Math.floor(Math.min(dw / IW, dh / IH));
    if (scale < 1) scale = Math.min(dw / IW, dh / IH);
    var ox = Math.floor((dw - IW * scale) / 2);
    var oy = Math.floor((dh - IH * scale) / 2);
    ctx.fillStyle = "#05030a";
    ctx.fillRect(0, 0, dw, dh);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buffer, 0, 0, IW, IH, ox, oy, IW * scale, IH * scale);

    if (crtOn) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      var y;
      for (y = oy; y < oy + IH * scale; y += 2) ctx.fillRect(ox, y, IW * scale, 1);
      ctx.fillStyle = "rgba(61,255,232,0.03)";
      ctx.fillRect(ox, oy, IW * scale, IH * scale);
    }
  }

  function applyKeys(dt) {
    var speed = 220;
    if (keys.ArrowLeft || keys.KeyA) input.anvilX -= speed * dt;
    if (keys.ArrowRight || keys.KeyD) input.anvilX += speed * dt;
    if (!pointerDown) input.holding = !!keys.Space;
    input.anvilX = C.clamp(input.anvilX, 50, 270);
  }

  function loop(ts) {
    if (!last) last = ts;
    var dt = (ts - last) / 1000;
    last = ts;
    applyKeys(dt);
    var ev = C.tick(game, dt, input) || [];
    var i;
    for (i = 0; i < ev.length; i++) sfx(ev[i].kind);
    if (game.score > highScore) {
      highScore = game.score;
      game.highScore = highScore;
      try {
        localStorage.setItem("fluxforge.hs", String(highScore));
      } catch (e) {}
    }
    input.fluxPulse = false;
    input.released = false;
    musicTick();
    render();
    requestAnimationFrame(loop);
  }

  function fit() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
  }

  function boot() {
    canvas = document.getElementById("game");
    ctx = canvas.getContext("2d");
    buffer = document.createElement("canvas");
    buffer.width = IW;
    buffer.height = IH;
    btx = buffer.getContext("2d");
    game = C.createGame({ highScore: highScore });
    fit();
    bindInput();
    window.addEventListener("resize", fit);
    var bootEl = document.getElementById("boot");
    if (bootEl) bootEl.remove();
    requestAnimationFrame(loop);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
