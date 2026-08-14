# Google Play listing kit — FLUXFORGE

Use this with a [Play Console](https://play.google.com/console) account. Google currently requires a one-time developer registration fee.

## What to upload

| Asset | File | Notes |
| --- | --- | --- |
| App icon 512×512 | `fluxforge/assets/icon-512.png` | Also used by the PWA |
| Feature graphic 1024×500-ish | `fluxforge/assets/feature.png` | Crop/scale to 1024×500 in any image editor if Play rejects the 16:9 source |
| Phone screenshots | Capture from the running game | Need at least 2, JPEG/PNG, 16:9 or 9:16 |
| Privacy policy URL | Host `fluxforge/privacy.html` | Put your email in that file first |
| App bundle | `.aab` from Android Studio | Not a raw APK for new listings |

## Store text (copy-paste)

**App name:** FLUXFORGE: Anvil Arcade

**Short description (80 chars max):**  
1980s arcade forge-table. Catch the orb. Slam the anvil. Kill the Titan Core.

**Full description:**

FLUXFORGE is a 1980s arcade cabinet game with a new table mechanic: there are no flippers. You are the anvil.

Catch a plasma orb in the forge pocket, hold to charge, and release a slam. Spend FLUX to reverse bumper polarity and kick the orb out of the drain lanes. Overuse it and the table TILTs.

10 vaults. Then mission 11: the Titan Core, a three-phase boss with armor plates, plasma eyes, and a beating heart.

• 320×240 CRT look, scanlines, neon vector tables  
• Touch drag + hold controls, optional shake-to-FLUX  
• Local high score only — no ads, no accounts  

Made for portrait phones. One sitting, arcade-short missions.

## Content rating

Answer the IARC questionnaire as a **simulated violence / cartoon** arcade game. No blood, no purchases required, no chat, no location, no user-generated content. Expected rating: Everyone / PEGI 3, depending on country.

## Data safety form

- Does your app collect or share user data? **No** (default build)
- Security practices: data is encrypted in transit? **N/A** (no network in the WebView build)
- Independent security review? **No**
- Data collected: none, except an on-device high score that is not uploaded

If you later add ads, IAP, or analytics, you must update this form and the privacy policy.

## Packaging options

### A. PWABuilder / TWA (hosted)

1. Host the `fluxforge` folder on HTTPS (GitHub Pages, Netlify, Firebase Hosting, itch.io with HTTPS, etc.).
2. Confirm `manifest.webmanifest` and `sw.js` load.
3. Open https://www.pwabuilder.com/ and paste your URL.
4. Package for Android, then upload the bundle to Play.

Best when you want instant game updates without resubmitting an APK for every balance tweak.

### B. Bundled WebView (this repo)

Offline, simple, no hosting. Run `bash fluxforge/scripts/sync-android.sh`, open `fluxforge-android` in Android Studio, sign an App Bundle.

Change the package name before the first upload. Package names cannot be reused on Play.

### C. Capacitor (later)

```bash
npm create @capacitor/app
# set webDir to the fluxforge folder
npx cap add android
npx cap copy android
```

Use this if you want Play Games sign-in, IAP, or native review prompts.

## Before you press Submit

- [ ] Your own package id and developer name
- [ ] Privacy policy hosted with a real contact email
- [ ] Feature graphic cropped to 1024×500
- [ ] At least two screenshots from a phone
- [ ] Target API set to Play’s current requirement (project is 34; bump in Gradle if Console asks)
- [ ] App signed with a keystore you have backed up
- [ ] Testing track (internal) installed on a real device once
