# How to Build the JAVIS APK

## Prerequisites (one-time setup)

1. **Install Node.js** on your computer: https://nodejs.org (LTS version)
2. **Install EAS CLI globally:**
   ```bash
   npm install -g eas-cli
   ```
3. **Create a free Expo account** at https://expo.dev/signup (free — no credit card needed)
4. **Log in:**
   ```bash
   eas login
   ```

---

## Build the APK (one command)

From inside the `artifacts/javis` folder on your computer, run:

```bash
eas build --platform android --profile preview
```

- EAS builds it on Expo's cloud servers (free tier: 30 builds/month)
- Takes ~10–15 minutes
- When done, EAS gives you a **direct download link** for the `.apk` file
- Download it and transfer to your phone → install directly (enable "Install unknown apps" in settings)

---

## Add your Groq API key (for voice-to-text)

Before building, set your Groq key as an EAS secret so voice transcription works:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_GROQ_KEY --value YOUR_GROQ_API_KEY
```

Get your Groq key free at: https://console.groq.com

---

## What's included in the APK

### Permissions granted at install / first launch:
| Permission | What it enables |
|---|---|
| `RECORD_AUDIO` | Voice input (hold mic button) |
| `SYSTEM_ALERT_WINDOW` | Floating overlay button (like Siri) |
| `POST_NOTIFICATIONS` | JAVIS reply notifications |
| `FOREGROUND_SERVICE` | Background listening |
| `READ_CONTACTS` | "Message John on WhatsApp" |
| `READ_SMS` / `RECEIVE_SMS` | Read messages when asked |
| `READ/WRITE_EXTERNAL_STORAGE` | Save files |
| `WAKE_LOCK` | Keep JAVIS responsive |

### Features:
- **Hold mic button** → JAVIS listens → speaks reply through speaker
- **Animated JAVIS orb** changes color per state (cyan=idle, orange=listening, gold=processing, green=speaking)
- **Notifications** — JAVIS replies show as Android notifications
- **WhatsApp integration** — say "send [name] a message saying [text]"
- **Memory** — JAVIS remembers your name and context across the session
- **Reset button** — clears memory for a fresh session

---

## MT Manager (offline compilation alternative)

MT Manager cannot directly compile React Native / Expo apps from source — it works with already-compiled Java bytecode (`.dex`/`.class` files). For JAVIS to work with MT Manager:

1. First build the APK using EAS as above
2. Download the `.apk`
3. Open in MT Manager to re-sign, modify resources, or patch

If you want a **fully offline build** without EAS, you need Android Studio on a PC:
```bash
# After downloading this project:
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
# APK output: android/app/build/outputs/apk/release/app-release.apk
```

---

## Quick reference

```bash
# Debug APK (faster, shows logs):
eas build --platform android --profile development

# Release APK (optimized, production-ready):
eas build --platform android --profile preview

# Check build status:
eas build:list
```
