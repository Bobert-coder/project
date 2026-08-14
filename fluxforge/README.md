# FLUXFORGE — Anvil Arcade

A 1980s-resolution arcade game you can play in a browser and wrap for **Google Play**.

This is not a pinball clone. There are no flippers. You wield a sliding **anvil**: catch a plasma orb, charge a forge slam, and use **FLUX** to reverse bumper polarity. Clear 10 vaults, then fight the **Titan Core**.

Internal resolution: **320×240**, integer-scaled with CRT scanlines.

## Play right now

```bash
cd fluxforge
python3 scripts/serve.py
```

Open http://127.0.0.1:8080/ — or just open `index.html` in a browser.

### Controls

| Action | Touch | Keyboard |
| --- | --- | --- |
| Move anvil | Drag | A / D or arrows |
| Charge / catch / slam | Hold, then release | Space |
| FLUX polar shift | Tap **F** or shake the phone | F or Shift |
| Pause | — | P |
| Mute / CRT | — | M / C |

FLUX also **kickbacks** a dying orb in the side inlanes. Overuse FLUX and the table **TILTs** (lockout).

## The 11 missions

1. **Spark Pit** — crush every drop target
2. **Bumper Nest** — ring bumpers 24 times
3. **Spinner Alley** — spin gates 28 ticks
4. **Warp Labyrinth** — ride both warp pairs
5. **Magnet Mines** — FLUX-collect every mine
6. **Prism Gallery** — shatter the prisms
7. **Gravity Well** — feed the well 8 times
8. **Twin Forge** — split the orb and clear targets
9. **Overload Grid** — hold all 9 lights on at once
10. **Core Gate** — hit locks in order 1–5
11. **Titan Core** — three-phase boss (armor, eyes, heart)

Debug skip: `http://127.0.0.1:8080/?lvl=11` starts at a mission.

## Best ways to put this on Google Play

Ranked for this project (HTML5 canvas, no engine license):

1. **Trusted Web Activity via PWABuilder (recommended if you can host the game)**  
   Host the `fluxforge/` folder on HTTPS, then wrap it with [PWABuilder](https://www.pwabuilder.com/) / Bubblewrap. Google’s preferred path for web games. You still need a Play Console account and a signing key.
2. **The Android WebView project in `fluxforge-android/` (best copy-paste if you want an APK today)**  
   The game files are bundled inside the app. Open that folder in Android Studio, Generate Signed App Bundle, upload the `.aab` to Play Console. No website required.
3. **Capacitor**  
   Use this later if you want native plugins (leaderboards, IAP). Create a Capacitor app and point `webDir` at `fluxforge/`.

Store listing copy, Data safety answers, and a privacy-policy template are in `PLAY_STORE.md`.

### Android Studio steps (option 2)

```bash
cd fluxforge
bash scripts/sync-android.sh
```

1. Install [Android Studio](https://developer.android.com/studio).
2. Open `fluxforge-android/`.
3. Let Gradle sync (Android Studio can generate the Gradle wrapper if it is missing).
4. Change `applicationId` in `app/build.gradle.kts` from `com.fluxforge.arcade` to your own id.
5. Build → Generate Signed App Bundle / APK.
6. Upload the `.aab` at [Google Play Console](https://play.google.com/console).

You must have a Play developer account, a 512×512 icon (`assets/icon-512.png`), a feature graphic (`assets/feature.png`), and a hosted privacy policy (`privacy.html`).

## Tests

```bash
node fluxforge/tests/test_core.js
```

## Project layout

```
fluxforge/                 playable game (copy this folder anywhere)
  index.html
  js/core.js               simulation, 11 missions, boss
  js/game.js               CRT render, audio, touch
  assets/                  Play icon + feature graphic
fluxforge-android/         Android Studio wrapper
```

Chiptune audio is synthesized at runtime. No extra art or music files are required to play.
