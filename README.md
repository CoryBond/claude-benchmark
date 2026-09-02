# Claude Bench

A native Android (and iOS) app for testing prompts against the Claude API —
essentially a phone-native version of the Workbench at platform.claude.com.
Set a system prompt, build a conversation turn by turn with a User/Claude
role toggle on each message, tune model/max tokens/temperature, hit Run, and
see the response appended as a new turn. Save and reload named conversations.
Your API key never leaves the device except to call `api.anthropic.com`
directly — there's no backend server in between.

**Stack:** Expo SDK 57 · React Native 0.86 · React 19 · TypeScript

## Features

- System prompt + free-form multi-turn conversation editor
- Model, max tokens, and temperature controls (model field doubles as
  free-text, so new model strings work without an app update)
- API key stored via Android Keystore / iOS Keychain (`expo-secure-store`) —
  never hardcoded, never sent anywhere but Anthropic's API
- Save/load named conversations on-device (`AsyncStorage`)
- No account, no backend, no analytics — it's a thin client over the API

## Prerequisites (once per machine)

Install these before touching the project:

1. **Node.js 20 or newer** — check with `node -v`. (Built and tested against
   Node 22.)
2. **Android Studio** (includes the Android SDK, platform-tools, and an
   emulator). During its first-run setup wizard, let it install the default
   SDK — it typically lands at `~/Android/Sdk`.
3. **`ANDROID_HOME` set permanently.** Add this to your `~/.bashrc` (or
   `~/.zshrc`), then restart your terminal:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   ```
   This matters more than it sounds like it should: Expo's `prebuild`
   command regenerates the `android/` folder from scratch (including
   deleting `android/local.properties`, which is where the SDK path is
   normally recorded), so relying on that file alone means re-doing this
   every time. The environment variable survives regeneration.
4. A Claude API key from **platform.claude.com** — you don't need this until
   you actually run the app (it's entered in-app, not at build time), but
   grab one now if you don't have one.

No specific JDK version pinning is needed — this project runs on current
Android Gradle Plugin (8.12) and Gradle (9.3), both of which work fine with
modern JDKs including 21.

## Clean clone → running, step by step

```bash
git clone <your-repo-url>
cd claude-bench
npm install
```

That's it for setup — `android/` is already committed, so you don't need to
run `expo prebuild` on a normal clone. From here, jump to either "Android
Studio" or "physical device" below.

**If `android/` is ever missing, corrupted, or you want to reset it** (e.g.
after bumping Expo/RN versions), regenerate it with:
```bash
npx expo prebuild --platform android --clean
```
This is safe to run any time — it deletes and rebuilds `android/` from
`app.json` and your dependencies, but never touches `App.tsx` or `src/`.

## Running in the Android Studio emulator

1. Open Android Studio → **Open** → select the `android/` folder inside the
   project (not the repo root — Android Studio needs the actual Gradle
   project directory to recognize it correctly).
2. Wait for Gradle sync to finish (progress bar at the bottom; click "Sync
   Now" if it doesn't start automatically). First sync downloads
   dependencies and can take a few minutes.
3. Set up a virtual device: **View → Tool Windows → Device Manager → Create
   Device**, pick a phone profile and a system image to download.
4. In the toolbar, confirm the run configuration dropdown says **app** (not
   "Current File" — if it says that, the Run button will silently do
   nothing). Select your emulator from the device dropdown.
5. Click the green ▶ Run button. First build is slow; later ones are much
   faster.
6. The app loads its JavaScript from the Metro bundler. This usually starts
   automatically as part of the Run step. If you land on a red error screen
   instead of the app, run `npx expo start` in a terminal at the project
   root and reload (Ctrl+M / Cmd+M in the emulator → Reload).

**Command-line alternative**, once the SDK/emulator are set up: from the
project root, `npx expo run:android` builds, installs, starts Metro, and
launches the app on your selected device in one step — no need to open
Android Studio at all for routine runs.

## Installing on your phone

**Option A — direct from Android Studio (fastest for active development):**
1. On the phone: Settings → About phone → tap "Build number" seven times to
   unlock Developer Options, then enable USB debugging.
2. Connect via USB. The phone should appear in Android Studio's device
   dropdown (you may get a "trust this computer?" prompt on the phone).
3. Hit Run as above, with the phone selected instead of an emulator.

**Option B — build an APK and sideload it (no cable needed after transfer):**
```bash
cd android
./gradlew assembleDebug
```
The APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`.
Transfer it to the phone any way you like (email, cloud drive, USB file
copy, or `adb install app-debug.apk` over USB), then on the phone: enable
"Install unknown apps" for whichever app you used to open the file (Settings
→ Apps → Special access → Install unknown apps), and tap the APK to install.

## Project structure

```
App.tsx                              Main screen (system prompt, turns, params, Run)
src/api.ts                           Calls POST https://api.anthropic.com/v1/messages
src/storage.ts                       Secure API key storage + conversation save/load
src/types.ts                         Message/Role/Conversation types
src/components/MessageRow.tsx        One editable turn (role toggle + text)
src/components/SettingsModal.tsx     API key entry sheet
src/components/SaveConversationModal.tsx   Name-and-save dialog
src/components/ConversationsModal.tsx      Saved conversations list
android/                             Generated native Android project (committed)
ios/                                 Not currently maintained — see note below
```

## Troubleshooting

- **`SDK location not found`** — `ANDROID_HOME` isn't set, or
  `android/local.properties` got wiped by a `prebuild --clean` and the env
  var isn't set either. See Prerequisites step 3.
- **Run button does nothing (`Executing… / Execution finished.` with no
  output)** — the run configuration dropdown is set to "Current File"
  instead of **app**. Change it in the toolbar dropdown.
- **`Process 'command 'node'' finished with non-zero exit value 1` during
  Gradle sync** — almost always means `node_modules` is missing at the
  current path (common after moving/cloning the project without reinstalling).
  Run `npm install` from the project root, not `android/`.
- **A Gradle "Configuration Cache Report" or "Problems Report" HTML file** —
  this is just a warnings log Gradle generates alongside a build; check
  whether the build itself said `BUILD SUCCESSFUL` or `BUILD FAILED` before
  worrying about it. Deprecation warnings about Gradle 10 compatibility are
  expected and come from generated files, not app code.
- **UI changes don't appear when you edit `App.tsx` or components** — the
  Metro bundler needs to be running and the app needs to be connected to it.
  Start Metro with `npx expo start` in a terminal, or in a new terminal run
  `npx expo run:android` to build and launch the app. Now edits will hot-reload
  (press Ctrl+M in the emulator → Reload to manually refresh).
- **Dependency versions look inconsistent / build errors that don't match
  any of the above** — regenerate from a known-good baseline:
  ```bash
  rm -rf node_modules package-lock.json android
  npm install
  npx expo prebuild --platform android --clean
  ```

## Notes

- **iOS**: not actively maintained in this repo right now. Regenerate it
  fresh with `npx expo prebuild --platform ios` on a Mac when needed — it'll
  pick up the same `package.json`.
- **Models**: the model chips in the app are a handful of hardcoded current
  model strings, but the field is also free-text — edit directly if a newer
  model isn't listed.
- **No `.env` or build-time secrets**: the API key is entered in-app and
  stored locally per-device, so there's nothing to configure before a
  teammate can run this themselves beyond what's in this file.