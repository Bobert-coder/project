/**
 * FLUXFORGE — Anvil Arcade
 * Pure simulation (no DOM). 320x240 playfield, 1980s arcade timing.
 */
(function (root) {
  "use strict";

  var IW = 320;
  var IH = 240;
  var TABLE_L = 22;
  var TABLE_R = 298;
  var TABLE_T = 18;
  var ANVIL_Y = 216;
  var BALL_R = 4;

  var PALETTE = {
    bg: "#070510",
    dim: "#1a1030",
    wall: "#8a7cff",
    cyan: "#3dffe8",
    mag: "#ff3dc8",
    amber: "#ffd23d",
    white: "#e8f4ff",
    danger: "#ff4a3d",
    green: "#6dff4a"
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function irand(a, b) {
    return (a + Math.floor(Math.random() * (b - a + 1))) | 0;
  }

  function wall(x1, y1, x2, y2, bounce) {
    return { x1: x1, y1: y1, x2: x2, y2: y2, bounce: bounce == null ? 0.9 : bounce };
  }

  function baseWalls() {
    return [
      wall(TABLE_L, TABLE_T, TABLE_R, TABLE_T, 0.95),
      wall(TABLE_L, TABLE_T, TABLE_L, 168, 0.92),
      wall(TABLE_R, TABLE_T, TABLE_R, 168, 0.92),
      wall(TABLE_L, 168, 10, 206, 0.88),
      wall(TABLE_R, 168, 310, 206, 0.88),
      wall(10, 206, 10, 238, 0.85),
      wall(310, 206, 310, 238, 0.85),
      wall(46, 186, 78, 214, 0.9),
      wall(274, 186, 242, 214, 0.9)
    ];
  }

  function bumper(x, y, r) {
    return { x: x, y: y, r: r || 11, cd: 0, hits: 0 };
  }
  function drop(x, y) {
    return { x: x, y: y, w: 14, h: 7, down: false };
  }
  function spinner(x, y) {
    return { x: x, y: y, ang: 0, spin: 0, ticks: 0, len: 14, hitCd: 0 };
  }
  function warp(x, y, link) {
    return { x: x, y: y, r: 9, link: link, flash: 0 };
  }
  function mine(x, y) {
    return { x: x, y: y, r: 7, live: true, hitCd: 0 };
  }
  function light(x, y) {
    return { x: x, y: y, on: false, t: 0, r: 7, hitCd: 0 };
  }
  function diamond(x, y) {
    return { x: x, y: y, r: 8, hit: false };
  }
  function seq(x, y, n) {
    return { x: x, y: y, n: n, hit: false, r: 9, hitCd: 0 };
  }
  function well(x, y, str) {
    return { x: x, y: y, r: 10, str: str || 14000, feedCd: 0 };
  }

  var LEVELS = [
    {
      id: 1,
      code: "VAULT 01",
      name: "SPARK PIT",
      task: "CRUSH ALL DROP TARGETS",
      goal: "drops",
      build: function (t) {
        t.drops = [drop(70, 64), drop(110, 64), drop(150, 64), drop(190, 64), drop(230, 64), drop(250, 92)];
        t.bumpers = [bumper(100, 128, 12), bumper(220, 128, 12)];
      }
    },
    {
      id: 2,
      code: "VAULT 02",
      name: "BUMPER NEST",
      task: "RING BUMPERS 24 TIMES",
      goal: "bumpers",
      need: 24,
      build: function (t) {
        t.bumpers = [
          bumper(160, 70, 13),
          bumper(104, 112, 11),
          bumper(216, 112, 11),
          bumper(132, 154, 10),
          bumper(188, 154, 10)
        ];
        t.drops = [drop(64, 48), drop(256, 48)];
      }
    },
    {
      id: 3,
      code: "VAULT 03",
      name: "SPINNER ALLEY",
      task: "SPIN GATES 28 TICKS",
      goal: "spinners",
      need: 28,
      build: function (t) {
        t.spinners = [spinner(90, 88), spinner(160, 70), spinner(230, 88)];
        t.bumpers = [bumper(160, 130, 12)];
        t.walls.push(wall(70, 50, 70, 120, 0.94), wall(250, 50, 250, 120, 0.94));
      }
    },
    {
      id: 4,
      code: "VAULT 04",
      name: "WARP LABYRINTH",
      task: "RIDE BOTH WARP GATES",
      goal: "warps",
      build: function (t) {
        t.warps = [warp(70, 60, 1), warp(250, 150, 0), warp(250, 60, 3), warp(70, 150, 2)];
        t.bumpers = [bumper(160, 100, 12)];
        t.drops = [drop(160, 48), drop(120, 170), drop(200, 170)];
      }
    },
    {
      id: 5,
      code: "VAULT 05",
      name: "MAGNET MINES",
      task: "FLUX-COLLECT ALL MINES",
      goal: "mines",
      build: function (t) {
        t.mines = [mine(80, 70), mine(160, 58), mine(240, 70), mine(110, 120), mine(210, 120), mine(160, 150)];
        t.bumpers = [bumper(64, 160, 10), bumper(256, 160, 10)];
      }
    },
    {
      id: 6,
      code: "VAULT 06",
      name: "PRISM GALLERY",
      task: "SHATTER ALL PRISMS",
      goal: "diamonds",
      build: function (t) {
        t.diamonds = [diamond(160, 46), diamond(86, 86), diamond(234, 86), diamond(120, 130), diamond(200, 130)];
        t.walls.push(
          wall(50, 70, 140, 40, 1.08),
          wall(270, 70, 180, 40, 1.08),
          wall(60, 160, 130, 110, 1.05),
          wall(260, 160, 190, 110, 1.05)
        );
        t.bumpers = [bumper(160, 168, 10)];
      }
    },
    {
      id: 7,
      code: "VAULT 07",
      name: "GRAVITY WELL",
      task: "FEED THE WELL 8 TIMES",
      goal: "well",
      need: 8,
      build: function (t) {
        t.wells = [well(160, 108, 16500)];
        t.diamonds = [diamond(160, 44), diamond(70, 108), diamond(250, 108), diamond(160, 172)];
        t.bumpers = [bumper(96, 64, 9), bumper(224, 64, 9)];
      }
    },
    {
      id: 8,
      code: "VAULT 08",
      name: "TWIN FORGE",
      task: "SPLIT AND CLEAR TARGETS",
      goal: "drops",
      twin: true,
      build: function (t) {
        t.drops = [drop(70, 50), drop(120, 50), drop(200, 50), drop(250, 50), drop(90, 90), drop(230, 90)];
        t.bumpers = [bumper(160, 88, 14), bumper(110, 140, 10), bumper(210, 140, 10)];
        t.splitter = { x: 160, y: 88, used: false };
      }
    },
    {
      id: 9,
      code: "VAULT 09",
      name: "OVERLOAD GRID",
      task: "HOLD ALL 9 LIGHTS ON",
      goal: "grid",
      build: function (t) {
        var i, j;
        t.lights = [];
        for (j = 0; j < 3; j++) {
          for (i = 0; i < 3; i++) {
            t.lights.push(light(100 + i * 60, 58 + j * 42));
          }
        }
        t.bumpers = [bumper(70, 150, 10), bumper(250, 150, 10)];
      }
    },
    {
      id: 10,
      code: "VAULT 10",
      name: "CORE GATE",
      task: "HIT LOCKS IN ORDER 1-5",
      goal: "sequence",
      build: function (t) {
        t.sequence = [seq(70, 70, 1), seq(250, 70, 2), seq(160, 50, 3), seq(100, 130, 4), seq(220, 130, 5)];
        t.bumpers = [bumper(160, 110, 12)];
        t.drops = [drop(160, 168)];
      }
    },
    {
      id: 11,
      code: "MISSION 11",
      name: "TITAN CORE",
      task: "DESTROY THE TITAN CORE",
      goal: "boss",
      build: function (t) {
        t.bumpers = [bumper(56, 168, 9), bumper(264, 168, 9)];
        t.boss = true;
      }
    }
  ];

  function createBoss() {
    var plates = [];
    var i;
    for (i = 0; i < 6; i++) {
      plates.push({ ang: (i * Math.PI) / 3, hp: 2, flash: 0 });
    }
    return {
      x: 160,
      y: 78,
      phase: 1,
      t: 0,
      plates: plates,
      eyes: [
        { dx: -22, dy: 4, hp: 3, flash: 0, cd: 1.2 },
        { dx: 22, dy: 4, hp: 3, flash: 0, cd: 1.8 }
      ],
      coreHp: 8,
      coreMax: 8,
      coreFlash: 0,
      suction: 0,
      slam: 0,
      shots: [],
      blades: [],
      defeated: false,
      intro: 2.2
    };
  }

  function emptyTable() {
    return {
      walls: baseWalls(),
      bumpers: [],
      drops: [],
      spinners: [],
      warps: [],
      mines: [],
      lights: [],
      diamonds: [],
      sequence: [],
      wells: [],
      splitter: null,
      warpUsed: {},
      wellFeeds: 0,
      bumperHits: 0,
      spinnerTicks: 0,
      seqExpect: 1,
      seqFailFlash: 0
    };
  }

  function makeBall(x, y, vx, vy, caught) {
    return {
      x: x,
      y: y,
      vx: vx || 0,
      vy: vy || 0,
      r: BALL_R,
      caught: !!caught,
      alive: true,
      warpCd: 0,
      trail: []
    };
  }

  function createGame(opts) {
    opts = opts || {};
    var g = {
      mode: "title",
      level: 0,
      score: 0,
      lives: 3,
      multiplier: 1,
      combo: 0,
      comboT: 0,
      flux: { meter: 1, active: 0, cd: 0, heat: 0, tilted: 0 },
      anvil: { x: 160, y: ANVIL_Y, w: 86, h: 8, vx: 0, charge: 0, holding: false },
      balls: [],
      table: emptyTable(),
      boss: null,
      particles: [],
      floaters: [],
      shake: 0,
      events: [],
      message: "",
      messageT: 0,
      flash: 0,
      acc: 0,
      time: 0,
      launchArmed: false,
      highScore: opts.highScore || 0,
      paused: false,
      winT: 0,
      clearT: 0,
      deadT: 0
    };
    return g;
  }

  function announce(g, text, t) {
    g.message = text;
    g.messageT = t == null ? 1.6 : t;
  }

  function addScore(g, n, x, y) {
    var pts = (n * g.multiplier) | 0;
    g.score += pts;
    g.combo += 1;
    g.comboT = 1.6;
    if (g.combo > 0 && g.combo % 8 === 0) {
      g.multiplier = clamp(g.multiplier + 1, 1, 5);
      emit(g, "mult");
    }
    if (x != null) {
      g.floaters.push({ x: x, y: y, t: 0.8, text: String(pts) });
    }
    if (g.score > g.highScore) g.highScore = g.score;
    return pts;
  }

  function emit(g, kind, extra) {
    g.events.push({ kind: kind, extra: extra || null });
  }

  function burst(g, x, y, color, n, speed) {
    var i;
    n = n || 8;
    speed = speed || 80;
    for (i = 0; i < n; i++) {
      var a = rand(0, Math.PI * 2);
      var s = rand(speed * 0.3, speed);
      g.particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        t: rand(0.25, 0.7),
        color: color,
        s: rand(1, 2.4)
      });
    }
  }

  function loadLevel(g, index) {
    g.level = index;
    g.table = emptyTable();
    g.boss = null;
    var meta = LEVELS[index];
    meta.build(g.table);
    g.table.meta = meta;
    if (meta.goal === "boss") {
      g.boss = createBoss();
      g.mode = "bossintro";
      announce(g, "TITAN CORE  AWAKENS", 2.4);
    } else {
      g.mode = "play";
      announce(g, meta.code + "  " + meta.name, 2.0);
    }
    g.clearT = 0;
    spawnBall(g, true);
    emit(g, "level", { index: index });
  }

  function startRun(g, startLevel) {
    g.mode = "play";
    g.level = startLevel || 0;
    g.score = 0;
    g.lives = 3;
    g.multiplier = 1;
    g.combo = 0;
    g.flux = { meter: 1, active: 0, cd: 0, heat: 0, tilted: 0 };
    g.winT = 0;
    loadLevel(g, g.level);
  }

  function spawnBall(g, caught) {
    var b = makeBall(g.anvil.x, g.anvil.y - 8, 0, 0, caught !== false);
    g.balls = g.balls.filter(function (x) {
      return x.alive;
    });
    g.balls.push(b);
    g.launchArmed = true;
  }

  function activeBalls(g) {
    var out = [];
    var i;
    for (i = 0; i < g.balls.length; i++) if (g.balls[i].alive) out.push(g.balls[i]);
    return out;
  }

  function collideBallWall(ball, w) {
    var abx = w.x2 - w.x1;
    var aby = w.y2 - w.y1;
    var apx = ball.x - w.x1;
    var apy = ball.y - w.y1;
    var ab2 = abx * abx + aby * aby;
    if (ab2 < 0.0001) return false;
    var t = clamp((apx * abx + apy * aby) / ab2, 0, 1);
    var cx = w.x1 + abx * t;
    var cy = w.y1 + aby * t;
    var dx = ball.x - cx;
    var dy = ball.y - cy;
    var d = hypot(dx, dy);
    var nx;
    var ny;
    if (d < 0.00001) {
      nx = -aby;
      ny = abx;
      var nl = hypot(nx, ny);
      if (nl < 0.00001) return false;
      nx /= nl;
      ny /= nl;
      d = 0;
    } else {
      nx = dx / d;
      ny = dy / d;
    }
    if (d >= ball.r) return false;
    var overlap = ball.r - d;
    ball.x += nx * overlap;
    ball.y += ny * overlap;
    var vn = ball.vx * nx + ball.vy * ny;
    if (vn < 0) {
      ball.vx -= (1 + w.bounce) * vn * nx;
      ball.vy -= (1 + w.bounce) * vn * ny;
    }
    return true;
  }

  function reflectCircle(ball, cx, cy, r, kick, bounce) {
    var dx = ball.x - cx;
    var dy = ball.y - cy;
    var d = hypot(dx, dy);
    var min = ball.r + r;
    if (d >= min || d < 0.00001) return false;
    var nx = dx / d;
    var ny = dy / d;
    var overlap = min - d;
    ball.x += nx * overlap;
    ball.y += ny * overlap;
    var vn = ball.vx * nx + ball.vy * ny;
    if (vn < 0) {
      ball.vx -= (1 + (bounce || 0.95)) * vn * nx;
      ball.vy -= (1 + (bounce || 0.95)) * vn * ny;
    }
    if (kick) {
      ball.vx += nx * kick;
      ball.vy += ny * kick;
    }
    return true;
  }

  function hitBumper(g, bump, ball) {
    var flux = g.flux.active > 0;
    var kick = flux ? -40 : 220;
    if (flux) {
      var dx = bump.x - ball.x;
      var dy = bump.y - ball.y;
      var d = hypot(dx, dy) || 1;
      ball.vx += (dx / d) * 90;
      ball.vy += (dy / d) * 90;
      if (d < bump.r + ball.r + 6) {
        kick = 340;
        reflectCircle(ball, bump.x, bump.y, bump.r, kick, 1.05);
        burst(g, bump.x, bump.y, PALETTE.amber, 14, 140);
      }
    } else {
      reflectCircle(ball, bump.x, bump.y, bump.r, 240, 1.02);
    }
    bump.cd = 0.12;
    bump.hits++;
    g.table.bumperHits++;
    addScore(g, 100, bump.x, bump.y);
    burst(g, ball.x, ball.y, flux ? PALETTE.amber : PALETTE.cyan, 8, 90);
    g.shake = Math.max(g.shake, 0.12);
    emit(g, "bumper");
  }

  function activateFlux(g) {
    if (g.flux.tilted > 0) return false;
    if (g.flux.cd > 0) return false;
    if (g.flux.meter < 0.34) return false;
    g.flux.active = 2.4;
    g.flux.meter = Math.max(0, g.flux.meter - 0.34);
    g.flux.cd = 0.45;
    g.flux.heat += 1;
    g.flash = 0.18;
    if (g.flux.heat >= 4) {
      g.flux.tilted = 3.0;
      g.flux.heat = 0;
      g.flux.active = 0;
      announce(g, "TILT  LOCKOUT", 1.4);
      emit(g, "tilt");
      return true;
    }
    announce(g, "POLAR SHIFT", 0.7);
    emit(g, "flux");
    return true;
  }

  function launchCaught(g, ball) {
    var a = g.anvil;
    var power = 220 + a.charge * 340;
    var aim = clamp((ball.x - a.x) / (a.w * 0.5), -1, 1);
    ball.caught = false;
    ball.vy = -power;
    ball.vx = aim * 180 + a.vx * 12;
    a.charge = 0;
    g.launchArmed = false;
    burst(g, ball.x, ball.y, PALETTE.amber, 10, 100);
    g.shake = 0.16;
    emit(g, "slam");
  }

  function collideAnvil(g, ball) {
    var a = g.anvil;
    var left = a.x - a.w * 0.5;
    var right = a.x + a.w * 0.5;
    var top = a.y;
    if (!ball.alive || ball.caught) return;
    if (ball.x < left - 2 || ball.x > right + 2) return;
    if (ball.y + ball.r < top - 2 || ball.y > top + a.h + 8) return;
    if (ball.vy < -20 && ball.y + ball.r < top + 2) return;

    var pocket = Math.abs(ball.x - a.x) < 12;
    if (a.holding && pocket && ball.vy > 0) {
      ball.caught = true;
      ball.vx = 0;
      ball.vy = 0;
      ball.y = a.y - ball.r - 1;
      emit(g, "catch");
      return;
    }

    if (ball.y + ball.r >= top && ball.vy > -30) {
      ball.y = top - ball.r - 0.2;
      var slam = 260 + a.charge * 420;
      ball.vy = -Math.abs(ball.vy) * 0.35 - slam;
      ball.vx += a.vx * 18 + (ball.x - a.x) * 3.2;
      a.charge = Math.max(0, a.charge - 0.35);
      addScore(g, 10, ball.x, ball.y);
      burst(g, ball.x, top, PALETTE.mag, 6, 70);
      g.shake = Math.max(g.shake, 0.1);
      emit(g, "anvil");
    }
  }

  function maybeKickback(g, ball) {
    if (g.flux.active <= 0) return false;
    if (ball.y < 198) return false;
    if (ball.x > 42 && ball.x < 278) return false;
    ball.vy = -380;
    ball.vx = ball.x < 160 ? 90 : -90;
    ball.y = 196;
    addScore(g, 500, ball.x, ball.y);
    burst(g, ball.x, ball.y, PALETTE.green, 12, 120);
    announce(g, "KICKBACK", 0.6);
    emit(g, "kickback");
    return true;
  }

  function loseBall(g, ball) {
    ball.alive = false;
    burst(g, ball.x, ball.y, PALETTE.danger, 16, 110);
    emit(g, "drain");
    if (activeBalls(g).length === 0) {
      g.lives -= 1;
      g.multiplier = 1;
      g.combo = 0;
      g.deadT = 0.9;
      if (g.lives <= 0) {
        g.mode = "gameover";
        announce(g, "GAME OVER", 3);
        emit(g, "gameover");
      } else {
        g.mode = "balllost";
        announce(g, "ORB LOST", 1.1);
      }
    }
  }

  function goalProgress(g) {
    var t = g.table;
    var meta = t.meta;
    var i, n, c;
    if (!meta) return { done: false, text: "" };
    if (meta.goal === "drops") {
      n = t.drops.length;
      c = 0;
      for (i = 0; i < n; i++) if (t.drops[i].down) c++;
      return { done: n > 0 && c >= n, text: "TARGETS " + c + "/" + n };
    }
    if (meta.goal === "bumpers") {
      return { done: t.bumperHits >= meta.need, text: "RINGS " + t.bumperHits + "/" + meta.need };
    }
    if (meta.goal === "spinners") {
      return { done: t.spinnerTicks >= meta.need, text: "SPINS " + t.spinnerTicks + "/" + meta.need };
    }
    if (meta.goal === "warps") {
      c = 0;
      n = t.warps.length / 2;
      if (t.warpUsed[0] && t.warpUsed[1]) c++;
      if (t.warpUsed[2] && t.warpUsed[3]) c++;
      return { done: c >= 2, text: "GATES " + c + "/2" };
    }
    if (meta.goal === "mines") {
      n = t.mines.length;
      c = 0;
      for (i = 0; i < n; i++) if (!t.mines[i].live) c++;
      return { done: n > 0 && c >= n, text: "MINES " + c + "/" + n };
    }
    if (meta.goal === "diamonds") {
      n = t.diamonds.length;
      c = 0;
      for (i = 0; i < n; i++) if (t.diamonds[i].hit) c++;
      return { done: n > 0 && c >= n, text: "PRISMS " + c + "/" + n };
    }
    if (meta.goal === "well") {
      return { done: t.wellFeeds >= meta.need, text: "FEEDS " + t.wellFeeds + "/" + meta.need };
    }
    if (meta.goal === "grid") {
      n = t.lights.length;
      c = 0;
      for (i = 0; i < n; i++) if (t.lights[i].on) c++;
      return { done: n > 0 && c >= n, text: "GRID " + c + "/" + n };
    }
    if (meta.goal === "sequence") {
      return { done: t.seqExpect > 5, text: "LOCK " + Math.min(t.seqExpect, 5) + "/5" };
    }
    if (meta.goal === "boss") {
      if (!g.boss) return { done: false, text: "TITAN" };
      if (g.boss.defeated) return { done: true, text: "CORE DESTROYED" };
      if (g.boss.phase === 1) {
        c = 0;
        for (i = 0; i < g.boss.plates.length; i++) if (g.boss.plates[i].hp <= 0) c++;
        return { done: false, text: "ARMOR " + c + "/6  PH1" };
      }
      if (g.boss.phase === 2) {
        c = (g.boss.eyes[0].hp <= 0 ? 1 : 0) + (g.boss.eyes[1].hp <= 0 ? 1 : 0);
        return { done: false, text: "EYES " + c + "/2  PH2" };
      }
      return { done: false, text: "CORE " + g.boss.coreHp + "/" + g.boss.coreMax + "  PH3" };
    }
    return { done: false, text: "" };
  }

  function completeLevel(g) {
    if (g.mode !== "play" && g.mode !== "bossintro") return;
    addScore(g, 1500 * (g.level + 1), 160, 80);
    g.flux.meter = clamp(g.flux.meter + 0.25, 0, 1);
    g.mode = "clear";
    g.clearT = 2.2;
    announce(g, g.level >= 10 ? "TITAN DOWN" : "VAULT CLEAR", 2);
    emit(g, "clear");
  }

  function nextAfterClear(g) {
    if (g.level >= LEVELS.length - 1) {
      g.mode = "win";
      g.winT = 0;
      announce(g, "ARC COMPLETE", 4);
      emit(g, "win");
      return;
    }
    loadLevel(g, g.level + 1);
  }

  function serveBallAgain(g) {
    g.mode = "play";
    spawnBall(g, true);
  }

  function stepBallEntities(g, ball, dt) {
    var t = g.table;
    var i, e, dx, dy, d;

    for (i = 0; i < t.bumpers.length; i++) {
      e = t.bumpers[i];
      if (e.cd > 0) continue;
      dx = ball.x - e.x;
      dy = ball.y - e.y;
      if (hypot(dx, dy) < ball.r + e.r) hitBumper(g, e, ball);
    }

    for (i = 0; i < t.drops.length; i++) {
      e = t.drops[i];
      if (e.down) continue;
      if (Math.abs(ball.x - e.x) < e.w * 0.5 + ball.r && Math.abs(ball.y - e.y) < e.h * 0.5 + ball.r) {
        e.down = true;
        addScore(g, 250, e.x, e.y);
        burst(g, e.x, e.y, PALETTE.mag, 10, 80);
        emit(g, "drop");
        ball.vy *= -0.7;
      }
    }

    for (i = 0; i < t.diamonds.length; i++) {
      e = t.diamonds[i];
      if (e.hit) continue;
      if (hypot(ball.x - e.x, ball.y - e.y) < ball.r + e.r) {
        e.hit = true;
        addScore(g, 400, e.x, e.y);
        burst(g, e.x, e.y, PALETTE.cyan, 12, 100);
        emit(g, "prism");
        reflectCircle(ball, e.x, e.y, e.r, 160, 1);
      }
    }

    for (i = 0; i < t.spinners.length; i++) {
      e = t.spinners[i];
      dx = ball.x - e.x;
      dy = ball.y - e.y;
      d = hypot(dx, dy);
      if (d < e.len + ball.r) {
        var cross = Math.abs(ball.vy) + Math.abs(ball.vx);
        e.spin += dt * (8 + cross * 0.05);
        if (e.hitCd <= 0) {
          e.hitCd = 0.09;
          e.ticks += 1;
          t.spinnerTicks += 1;
          addScore(g, 25, e.x, e.y);
          emit(g, "spin");
        }
      }
    }

    for (i = 0; i < t.warps.length; i++) {
      e = t.warps[i];
      if (ball.warpCd > 0) continue;
      if (hypot(ball.x - e.x, ball.y - e.y) < e.r) {
        var dest = t.warps[e.link];
        if (dest) {
          ball.x = dest.x;
          ball.y = dest.y;
          ball.warpCd = 0.55;
          dest.flash = 0.3;
          e.flash = 0.3;
          t.warpUsed[i] = true;
          t.warpUsed[e.link] = true;
          addScore(g, 300, dest.x, dest.y);
          burst(g, dest.x, dest.y, PALETTE.wall, 10, 90);
          emit(g, "warp");
        }
      }
    }

    for (i = 0; i < t.mines.length; i++) {
      e = t.mines[i];
      if (!e.live || e.hitCd > 0) continue;
      if (hypot(ball.x - e.x, ball.y - e.y) < ball.r + e.r) {
        e.hitCd = 0.28;
        if (g.flux.active > 0) {
          e.live = false;
          addScore(g, 700, e.x, e.y);
          burst(g, e.x, e.y, PALETTE.green, 14, 120);
          emit(g, "mine");
        } else {
          ball.vy += 220;
          ball.vx += ball.x < e.x ? -140 : 140;
          burst(g, e.x, e.y, PALETTE.danger, 10, 100);
          g.shake = 0.2;
          emit(g, "minehit");
        }
      }
    }

    for (i = 0; i < t.lights.length; i++) {
      e = t.lights[i];
      if (e.hitCd > 0) continue;
      if (hypot(ball.x - e.x, ball.y - e.y) < ball.r + e.r) {
        e.hitCd = 0.18;
        e.on = true;
        e.t = 4.6;
        addScore(g, 80, e.x, e.y);
        reflectCircle(ball, e.x, e.y, e.r, 80, 0.9);
        emit(g, "light");
      }
    }

    for (i = 0; i < t.sequence.length; i++) {
      e = t.sequence[i];
      if (e.hit || e.hitCd > 0) continue;
      if (hypot(ball.x - e.x, ball.y - e.y) < ball.r + e.r) {
        e.hitCd = 0.25;
        if (e.n === t.seqExpect) {
          e.hit = true;
          t.seqExpect++;
          addScore(g, 500, e.x, e.y);
          burst(g, e.x, e.y, PALETTE.amber, 10, 90);
          emit(g, "seq");
        } else {
          var k;
          for (k = 0; k < t.sequence.length; k++) t.sequence[k].hit = false;
          t.seqExpect = 1;
          t.seqFailFlash = 0.4;
          emit(g, "seqfail");
          announce(g, "SEQUENCE RESET", 0.8);
        }
        reflectCircle(ball, e.x, e.y, e.r, 120, 0.95);
      }
    }

    for (i = 0; i < t.wells.length; i++) {
      e = t.wells[i];
      dx = e.x - ball.x;
      dy = e.y - ball.y;
      d = hypot(dx, dy) || 1;
      var f = e.str / (d * d);
      f = clamp(f, 0, 520);
      ball.vx += (dx / d) * f * dt;
      ball.vy += (dy / d) * f * dt;
      if (d < e.r + 8 && e.feedCd <= 0) {
        e.feedCd = 0.5;
        ball.vx += (ball.y - e.y) * 8;
        ball.vy -= 180;
        t.wellFeeds++;
        addScore(g, 200, e.x, e.y);
        burst(g, e.x, e.y, PALETTE.wall, 8, 90);
        emit(g, "well");
        ball.x += (ball.x - e.x) * 0.35;
        ball.y += (ball.y - e.y) * 0.35;
      }
    }

    if (t.splitter && !t.splitter.used && t.meta && t.meta.twin) {
      if (hypot(ball.x - t.splitter.x, ball.y - t.splitter.y) < 16 && !ball.caught) {
        t.splitter.used = true;
        g.balls.push(makeBall(ball.x + 6, ball.y, -ball.vx * 0.8, ball.vy * 0.7, false));
        announce(g, "TWIN ORB", 0.8);
        emit(g, "twin");
      }
    }
  }

  function platePos(boss, plate) {
    var rad = 36;
    return { x: boss.x + Math.cos(plate.ang + boss.t * 0.4) * rad, y: boss.y + Math.sin(plate.ang + boss.t * 0.4) * rad * 0.72 };
  }

  function damageBoss(g, amount, x, y, why) {
    var b = g.boss;
    if (!b || b.defeated || b.intro > 0) return;
    burst(g, x, y, PALETTE.amber, 12, 110);
    g.shake = 0.22;
    addScore(g, 350 * amount, x, y);
    emit(g, "bosshit", { why: why });
    if (b.phase === 3) {
      b.coreHp = Math.max(0, b.coreHp - amount);
      b.coreFlash = 0.2;
      if (b.coreHp <= 0) {
        b.defeated = true;
        burst(g, b.x, b.y, PALETTE.amber, 40, 180);
        burst(g, b.x, b.y, PALETTE.mag, 28, 150);
        announce(g, "CORE CRITICAL", 2);
        emit(g, "bossdown");
      }
    }
  }

  function stepBoss(g, dt) {
    var b = g.boss;
    if (!b) return;
    b.t += dt;
    if (b.intro > 0) {
      b.intro -= dt;
      if (b.intro <= 0) {
        g.mode = "play";
        announce(g, "PHASE 1  ARMOR", 1.4);
      }
      return;
    }
    var i, p, pos, balls, ball, j, s, e;

    if (b.phase === 1) {
      var alivePlates = 0;
      for (i = 0; i < b.plates.length; i++) {
        p = b.plates[i];
        if (p.hp <= 0) continue;
        alivePlates++;
        p.flash = Math.max(0, p.flash - dt);
        pos = platePos(b, p);
        balls = activeBalls(g);
        for (j = 0; j < balls.length; j++) {
          ball = balls[j];
          if (ball.caught) continue;
          if (hypot(ball.x - pos.x, ball.y - pos.y) < ball.r + 11) {
            p.hp -= 1;
            p.flash = 0.2;
            reflectCircle(ball, pos.x, pos.y, 11, 180, 1);
            damageBoss(g, 1, pos.x, pos.y, "plate");
            if (p.hp <= 0) addScore(g, 800, pos.x, pos.y);
          }
        }
      }
      if (alivePlates === 0) {
        b.phase = 2;
        announce(g, "PHASE 2  EYES", 1.6);
        emit(g, "phase", { n: 2 });
      }
      if (b.t > 1.2 && b.t % 5 < dt) {
        b.slam = 0.35;
        g.shake = 0.3;
        balls = activeBalls(g);
        for (j = 0; j < balls.length; j++) balls[j].vy += 160;
        emit(g, "fist");
      }
    } else if (b.phase === 2) {
      var eyesLive = 0;
      for (i = 0; i < b.eyes.length; i++) {
        e = b.eyes[i];
        if (e.hp <= 0) continue;
        eyesLive++;
        e.flash = Math.max(0, e.flash - dt);
        e.cd -= dt;
        var ex = b.x + e.dx;
        var ey = b.y + e.dy;
        if (e.cd <= 0) {
          e.cd = 1.35 + i * 0.25;
          b.shots.push({ x: ex, y: ey + 8, vx: (i === 0 ? -20 : 20), vy: 70, r: 3.2, fromBoss: true });
          emit(g, "shot");
        }
        balls = activeBalls(g);
        for (j = 0; j < balls.length; j++) {
          ball = balls[j];
          if (ball.caught) continue;
          if (hypot(ball.x - ex, ball.y - ey) < ball.r + 8) {
            e.hp -= 1;
            e.flash = 0.25;
            reflectCircle(ball, ex, ey, 8, 200, 1);
            damageBoss(g, 1, ex, ey, "eye");
          }
        }
      }
      if (eyesLive === 0) {
        b.phase = 3;
        b.blades = [
          { ang: 0, len: 52 },
          { ang: Math.PI / 2, len: 52 }
        ];
        announce(g, "PHASE 3  HEART", 1.6);
        emit(g, "phase", { n: 3 });
      }
    } else if (b.phase === 3) {
      b.suction -= dt;
      if (b.suction <= 0) {
        b.suction = 4.4;
        announce(g, "CORE SUCTION", 0.6);
      }
      if (b.suction > 3.2) {
        balls = activeBalls(g);
        for (j = 0; j < balls.length; j++) {
          ball = balls[j];
          dx = b.x - ball.x;
          dy = b.y - ball.y;
          d = hypot(dx, dy) || 1;
          ball.vx += (dx / d) * 140 * dt;
          ball.vy += (dy / d) * 140 * dt;
        }
      }
      for (i = 0; i < b.blades.length; i++) {
        b.blades[i].ang += dt * (i === 0 ? 1.6 : -1.2);
      }
      balls = activeBalls(g);
      for (j = 0; j < balls.length; j++) {
        ball = balls[j];
        if (ball.caught) continue;
        if (hypot(ball.x - b.x, ball.y - b.y) < ball.r + 14) {
          b.coreHp -= 1;
          b.coreFlash = 0.25;
          reflectCircle(ball, b.x, b.y, 14, 260, 1.05);
          damageBoss(g, 1, b.x, b.y, "core");
        }
        for (i = 0; i < b.blades.length; i++) {
          var ang = b.blades[i].ang;
          var bx = b.x + Math.cos(ang) * 34;
          var by = b.y + Math.sin(ang) * 22;
          if (hypot(ball.x - bx, ball.y - by) < 10) {
            ball.vx += Math.cos(ang) * 80;
            ball.vy += 90;
            emit(g, "blade");
          }
        }
      }
    }

    b.slam = Math.max(0, b.slam - dt);
    b.coreFlash = Math.max(0, b.coreFlash - dt);

    for (i = b.shots.length - 1; i >= 0; i--) {
      s = b.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 40 * dt;
      var a = g.anvil;
      if (s.y > a.y - 4 && s.y < a.y + 10 && s.x > a.x - a.w * 0.5 && s.x < a.x + a.w * 0.5) {
        s.vy = -Math.abs(s.vy) * 1.15 - 40;
        s.vx += a.vx * 10;
        s.fromBoss = false;
        emit(g, "reflect");
      }
      if (!s.fromBoss && b.phase === 2) {
        for (j = 0; j < b.eyes.length; j++) {
          e = b.eyes[j];
          if (e.hp <= 0) continue;
          var ex2 = b.x + e.dx;
          var ey2 = b.y + e.dy;
          if (hypot(s.x - ex2, s.y - ey2) < 10) {
            e.hp -= 1;
            e.flash = 0.3;
            damageBoss(g, 1, ex2, ey2, "reflect");
            b.shots.splice(i, 1);
            s = null;
            break;
          }
        }
      }
      if (!s) continue;
      balls = activeBalls(g);
      for (j = 0; j < balls.length; j++) {
        if (hypot(balls[j].x - s.x, balls[j].y - s.y) < balls[j].r + s.r) {
          balls[j].vx += s.vx * 0.4;
          balls[j].vy += 60;
          burst(g, s.x, s.y, PALETTE.danger, 6, 60);
          b.shots.splice(i, 1);
          s = null;
          break;
        }
      }
      if (s && (s.y > 250 || s.x < 0 || s.x > 320)) b.shots.splice(i, 1);
    }
  }

  function stepOnce(g, dt, input) {
    var i, ball, speed;

    g.time += dt;
    g.messageT = Math.max(0, g.messageT - dt);
    g.flash = Math.max(0, g.flash - dt);
    g.shake = Math.max(0, g.shake - dt * 1.8);
    g.comboT -= dt;
    if (g.comboT <= 0) {
      g.combo = 0;
    }

    if (g.flux.active > 0) g.flux.active = Math.max(0, g.flux.active - dt);
    if (g.flux.cd > 0) g.flux.cd = Math.max(0, g.flux.cd - dt);
    if (g.flux.tilted > 0) g.flux.tilted = Math.max(0, g.flux.tilted - dt);
    g.flux.meter = clamp(g.flux.meter + dt * 0.035, 0, 1);
    g.flux.heat = Math.max(0, g.flux.heat - dt * 0.22);

    var targetX = input && input.anvilX != null ? input.anvilX : g.anvil.x;
    targetX = clamp(targetX, TABLE_L + g.anvil.w * 0.5 + 8, TABLE_R - g.anvil.w * 0.5 - 8);
    var prev = g.anvil.x;
    g.anvil.x += (targetX - g.anvil.x) * clamp(dt * 18, 0, 1);
    g.anvil.vx = (g.anvil.x - prev) / dt;
    g.anvil.holding = !!(input && input.holding);

    if (g.anvil.holding) g.anvil.charge = clamp(g.anvil.charge + dt * 1.15, 0, 1);
    else if (g.anvil.charge > 0 && !g.launchArmed) g.anvil.charge = Math.max(0, g.anvil.charge - dt * 0.6);

    if (input && input.fluxPulse && (g.mode === "play" || g.mode === "bossintro")) activateFlux(g);

    if (g.mode === "bossintro") {
      stepBoss(g, dt);
    }

    if (g.mode === "clear") {
      g.clearT -= dt;
      if (g.clearT <= 0) nextAfterClear(g);
    }

    if (g.mode === "balllost") {
      g.deadT -= dt;
      if (g.deadT <= 0 && g.lives > 0) serveBallAgain(g);
    }

    if (g.mode === "win") g.winT += dt;

    if (g.mode === "play" || g.mode === "bossintro") {
      for (i = 0; i < g.table.bumpers.length; i++) {
        g.table.bumpers[i].cd = Math.max(0, g.table.bumpers[i].cd - dt);
      }
      for (i = 0; i < g.table.warps.length; i++) {
        g.table.warps[i].flash = Math.max(0, g.table.warps[i].flash - dt);
      }
      for (i = 0; i < g.table.spinners.length; i++) {
        g.table.spinners[i].ang += g.table.spinners[i].spin * dt;
        g.table.spinners[i].spin *= Math.max(0, 1 - dt * 1.8);
        g.table.spinners[i].hitCd = Math.max(0, g.table.spinners[i].hitCd - dt);
      }
      for (i = 0; i < g.table.wells.length; i++) {
        g.table.wells[i].feedCd = Math.max(0, g.table.wells[i].feedCd - dt);
      }
      for (i = 0; i < g.table.lights.length; i++) {
        if (g.table.lights[i].on) {
          g.table.lights[i].t -= dt;
          if (g.table.lights[i].t <= 0) g.table.lights[i].on = false;
        }
        g.table.lights[i].hitCd = Math.max(0, g.table.lights[i].hitCd - dt);
      }
      for (i = 0; i < g.table.mines.length; i++) {
        g.table.mines[i].hitCd = Math.max(0, g.table.mines[i].hitCd - dt);
      }
      g.table.seqFailFlash = Math.max(0, g.table.seqFailFlash - dt);
      for (i = 0; i < g.table.sequence.length; i++) {
        g.table.sequence[i].hitCd = Math.max(0, g.table.sequence[i].hitCd - dt);
      }

      var balls = g.balls;
      for (i = 0; i < balls.length; i++) {
        ball = balls[i];
        if (!ball.alive) continue;
        ball.warpCd = Math.max(0, ball.warpCd - dt);

        if (ball.caught) {
          ball.x = g.anvil.x;
          ball.y = g.anvil.y - ball.r - 1;
          ball.vx = 0;
          ball.vy = 0;
          if (g.anvil.holding) g.anvil.charge = clamp(g.anvil.charge + dt * 0.4, 0, 1);
          if (input && input.released && g.anvil.charge > 0.08) launchCaught(g, ball);
          continue;
        }

        ball.vy += 430 * dt;
        ball.vx *= 1 - 0.08 * dt;
        ball.vy *= 1 - 0.04 * dt;
        speed = hypot(ball.vx, ball.vy);
        if (speed > 460) {
          ball.vx *= 460 / speed;
          ball.vy *= 460 / speed;
        }
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        var w;
        for (var k = 0; k < g.table.walls.length; k++) {
          w = g.table.walls[k];
          collideBallWall(ball, w);
        }

        collideAnvil(g, ball);
        if (!maybeKickback(g, ball)) {
          if (ball.y > 236) loseBall(g, ball);
        }
        if (!ball.alive) continue;
        if (ball.x < 6) {
          ball.x = 6;
          ball.vx = Math.abs(ball.vx);
        }
        if (ball.x > IW - 6) {
          ball.x = IW - 6;
          ball.vx = -Math.abs(ball.vx);
        }

        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 8) ball.trail.shift();

        stepBallEntities(g, ball, dt);
      }

      if (g.boss) stepBoss(g, dt);

      var gp = goalProgress(g);
      if (gp.done && g.mode === "play") completeLevel(g);
    }

    for (i = g.particles.length - 1; i >= 0; i--) {
      var p = g.particles[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt;
      if (p.t <= 0) g.particles.splice(i, 1);
    }
    for (i = g.floaters.length - 1; i >= 0; i--) {
      g.floaters[i].t -= dt;
      g.floaters[i].y -= 22 * dt;
      if (g.floaters[i].t <= 0) g.floaters.splice(i, 1);
    }
    if (g.particles.length > 180) g.particles.splice(0, g.particles.length - 180);
  }

  function tick(g, dt, input) {
    if (g.paused) return;
    dt = clamp(dt, 0, 0.05);
    g.acc += dt;
    var step = 1 / 120;
    var guard = 0;
    var eventsBefore = g.events.length;
    while (g.acc >= step && guard++ < 10) {
      g.acc -= step;
      stepOnce(g, step, input);
    }
    var ev = g.events.slice(eventsBefore);
    g.events = [];
    return ev;
  }

  function consumeEvents(g) {
    var e = g.events;
    g.events = [];
    return e;
  }

  root.FluxCore = {
    IW: IW,
    IH: IH,
    PALETTE: PALETTE,
    LEVELS: LEVELS,
    createGame: createGame,
    startRun: startRun,
    loadLevel: loadLevel,
    tick: tick,
    activateFlux: activateFlux,
    goalProgress: goalProgress,
    consumeEvents: consumeEvents,
    collideBallWall: collideBallWall,
    reflectCircle: reflectCircle,
    makeBall: makeBall,
    clamp: clamp
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
