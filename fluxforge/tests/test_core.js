"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var corePath = path.join(__dirname, "..", "js", "core.js");
var code = fs.readFileSync(corePath, "utf8");
var sandbox = { console: console, Math: Math };
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
var C = sandbox.FluxCore;
assert.ok(C, "FluxCore should load");

function run(g, seconds, input) {
  var t = 0;
  var step = 1 / 60;
  input = input || { anvilX: 160, holding: false, released: false };
  while (t < seconds) {
    C.tick(g, step, input);
    t += step;
  }
}

function forceGoal(g) {
  var t = g.table;
  var meta = t.meta;
  var i;
  if (meta.goal === "drops") {
    for (i = 0; i < t.drops.length; i++) t.drops[i].down = true;
  } else if (meta.goal === "bumpers") {
    t.bumperHits = meta.need;
  } else if (meta.goal === "spinners") {
    t.spinnerTicks = meta.need;
  } else if (meta.goal === "warps") {
    t.warpUsed[0] = t.warpUsed[1] = t.warpUsed[2] = t.warpUsed[3] = true;
  } else if (meta.goal === "mines") {
    for (i = 0; i < t.mines.length; i++) t.mines[i].live = false;
  } else if (meta.goal === "diamonds") {
    for (i = 0; i < t.diamonds.length; i++) t.diamonds[i].hit = true;
  } else if (meta.goal === "well") {
    t.wellFeeds = meta.need;
  } else if (meta.goal === "grid") {
    for (i = 0; i < t.lights.length; i++) {
      t.lights[i].on = true;
      t.lights[i].t = 10;
    }
  } else if (meta.goal === "sequence") {
    t.seqExpect = 6;
    for (i = 0; i < t.sequence.length; i++) t.sequence[i].hit = true;
  } else if (meta.goal === "boss") {
    g.mode = "play";
    g.boss.intro = 0;
    g.boss.defeated = true;
  }
}

assert.strictEqual(C.LEVELS.length, 11, "11 missions including the Titan Core");
assert.strictEqual(C.LEVELS[10].goal, "boss");
assert.strictEqual(C.LEVELS[10].name, "TITAN CORE");
for (var li = 0; li < 10; li++) {
  assert.strictEqual(C.LEVELS[li].id, li + 1);
  assert.ok(C.LEVELS[li].name, "level name");
  assert.ok(C.LEVELS[li].task, "level task");
}

var g = C.createGame();
assert.strictEqual(g.mode, "title");
C.startRun(g, 0);
assert.strictEqual(g.mode, "play");
assert.strictEqual(g.lives, 3);
assert.ok(g.balls.length >= 1);
assert.strictEqual(g.balls[0].caught, true);
assert.strictEqual(g.table.drops.length, 6);
assert.strictEqual(g.table.bumpers.length, 2);

run(g, 0.6, { anvilX: 160, holding: true, released: false });
assert.ok(g.anvil.charge > 0.4, "charge builds while holding");
C.tick(g, 1 / 60, { anvilX: 160, holding: false, released: true });
assert.strictEqual(g.balls[0].caught, false, "release launches the orb");
assert.ok(g.balls[0].vy < -100, "launch is upward");

var wallHit = C.makeBall(24, 80, -80, 0, false);
var hit = C.collideBallWall(wallHit, { x1: 22, y1: 18, x2: 22, y2: 168, bounce: 0.9 });
assert.ok(hit, "ball collides with left wall");
assert.ok(wallHit.vx >= 0, "wall reflects vx");

var bumperBall = C.makeBall(100, 100, 40, 0, false);
assert.ok(C.reflectCircle(bumperBall, 110, 100, 11, 200, 1.0));
assert.ok(bumperBall.vx < 0, "bumper kicks left");

var drain = C.createGame();
C.startRun(drain, 0);
drain.balls[0].caught = false;
drain.balls[0].x = 160;
drain.balls[0].y = 250;
drain.balls[0].vy = 40;
run(drain, 0.2, { anvilX: 160, holding: false, released: false });
assert.ok(drain.lives <= 2, "draining the orb costs a life");

var flux = C.createGame();
C.startRun(flux, 0);
assert.ok(C.activateFlux(flux));
assert.ok(flux.flux.active > 0);
C.activateFlux(flux);
C.activateFlux(flux);
C.activateFlux(flux);
assert.ok(flux.flux.tilted > 0 || flux.flux.heat >= 0, "flux heat tracked");

var campaign = C.createGame();
C.startRun(campaign, 0);
for (var n = 0; n < 11; n++) {
  assert.strictEqual(campaign.level, n, "campaign at vault " + (n + 1));
  if (campaign.mode === "bossintro") {
    campaign.mode = "play";
    campaign.boss.intro = 0;
  }
  assert.ok(campaign.mode === "play" || campaign.mode === "bossintro");
  forceGoal(campaign);
  var gp = C.goalProgress(campaign);
  assert.ok(gp.done, "goal completable for " + campaign.table.meta.name + " (" + gp.text + ")");
  run(campaign, 2.5, { anvilX: 160, holding: false, released: false });
}
assert.strictEqual(campaign.mode, "win", "clearing 10 vaults plus Titan Core wins the arc");
assert.ok(campaign.score > 10000, "score accumulates");

var live = C.createGame();
C.startRun(live, 0);
var bump = live.table.bumpers[0];
live.balls[0].caught = false;
live.balls[0].x = bump.x;
live.balls[0].y = bump.y - bump.r - 5;
live.balls[0].vx = 0;
live.balls[0].vy = 90;
run(live, 0.25, { anvilX: 160, holding: false, released: false });
assert.ok(live.table.bumperHits >= 1, "orb registers bumper hits");
assert.ok(live.score >= 100, "bumper awards score");

var names = C.LEVELS.map(function (l) { return l.name; }).join("|");
assert.strictEqual(
  names,
  "SPARK PIT|BUMPER NEST|SPINNER ALLEY|WARP LABYRINTH|MAGNET MINES|PRISM GALLERY|GRAVITY WELL|TWIN FORGE|OVERLOAD GRID|CORE GATE|TITAN CORE"
);

console.log("ok - " + C.LEVELS.length + " missions, physics, flux, and full campaign clear");
