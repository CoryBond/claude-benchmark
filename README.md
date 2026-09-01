# Claude Bench

A minimal, installable Android app for testing prompts against the Claude API —
system prompt, alternating user/assistant turns, model/max_tokens/temperature,
and a Run button. Your API key is stored on-device only (Android Keystore /
iOS Keychain via `expo-secure-store`) and sent straight to `api.anthropic.com`
from your phone — no third-party server in between.

## What's here

```
App.tsx                       Main screen (system prompt, turns, params, Run)
src/api.ts                    Calls POST https://api.anthropic.com/v1/messages
src/storage.ts                Secure on-device storage for the API key
src/types.ts                  Message/Role types
src/components/MessageRow.tsx One editable turn (role toggle + text)
src/components/SettingsModal.tsx   API key entry sheet
```

It's already been verified to type-check (`tsc --noEmit`) and bundle
(`expo export`) cleanly, so `npm install` + one of the build paths below
should just work.

## Get the APK — pick one

### Option A: EAS Build (cloud, easiest, free tier available)

No Android Studio needed. Anthropic's own sandbox can't reach Expo's build
servers, so this step has to run on your machine.

```bash
npm install
npm install -g eas-cli
eas login                      # free Expo account
eas build:configure            # choose Android when prompted
eas build --platform android --profile preview
```

The `preview` profile builds an `.apk` (not `.aab`) so you can sideload it
directly. When the build finishes, the CLI prints a download link — open it
on your phone, or run `eas build:download` to save it locally and transfer
it over.

### Option B: Build locally with Android Studio

Use a full JDK 17 in
**Settings > Build, Execution, Deployment > Build Tools > Gradle > Gradle JDK**.
The project requires `javac`; a Java runtime-only installation is not enough.

```bash
npm install
cd android
./gradlew assembleDebug
```

The `android/` folder is checked in as the native Android Studio project. Open
that folder in Android Studio, wait for Gradle sync to finish, select the
`app` configuration and a device or emulator, then press Run. Android Studio
will use Expo's Gradle integration to bundle the JavaScript during the build.

For a command-line build, the debug APK lands in
`android/app/build/outputs/apk/debug/`. Debug builds install straight away;
release builds need you to sign them (Android Studio's "Generate Signed Bundle
/ APK" wizard handles this, or `apksigner` on the command line).

If the project was copied from another directory, run `./gradlew clean` from
`android/` once before syncing. Gradle's autolinking metadata contains local
paths and is regenerated automatically.

## Installing on your phone

1. Copy the `.apk` to your device (email, cloud drive, USB, `adb install path/to/app.apk`).
2. On the phone, enable "Install unknown apps" for whichever app you used to
   open the file (Settings → Apps → Special access → Install unknown apps).
3. Tap the file to install.

## Using it

1. Open the app, tap the gear in the header, paste an API key from
   platform.claude.com, save.
2. Optionally write a system prompt.
3. Add message turns — tap **User**/**Claude** to set each turn's role, type
   the content. Roles don't have to alternate perfectly; the API will
   validate that server-side and the app surfaces any error it returns.
4. Set model / max tokens / temperature, tap **Run**.
5. The response is appended as a new **Claude** turn, with token usage shown
   below. Keep editing and re-running — it behaves like a scratchpad, same
   idea as the web Workbench.

## Notes / things you might want to change

- **Models**: the quick-select chips are hardcoded to a handful of current
  model strings. Since these change over time, the model field is also a
  free-text input — edit it directly if a newer model isn't in the list.
- **No conversation persistence**: closing the app clears the transcript
  (the API key is the only thing saved). Add `AsyncStorage` if you want
  saved sessions.
- **No streaming**: this calls the non-streaming Messages endpoint, so the
  Run button just waits for the full response. Streaming would need
  server-sent-event parsing, which React Native's `fetch` doesn't support
  natively — doable, but a bigger lift.
- **iOS**: the same code runs on iOS via Expo (`npm run ios` on a Mac, or
  `eas build --platform ios`) since none of it is Android-specific.
