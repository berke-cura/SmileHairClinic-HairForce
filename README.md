# Smile Hair Clinic × HairForce Mobile App

Patient-facing companion app built with Expo Router + React Native 0.81 for Smile Hair Clinic’s HairForce experience. It guides patients before, during, and after their procedure with localized education, doctor information, and a guided camera workflow that captures clinically consistent photos for follow-ups.

---

## Highlights
- Patient journeys: onboarding, treatment history, before/after gallery, doctor directory, FAQs, transportation, and post-op guides (`app/(app)/*`).
- Guided camera: auto-pose capture, stability detection, and spoken feedback powered by the hooks/services under `src/` (e.g., `useAutoCapture`, `speechService`).
- Localization: six languages in `locales/*.json`, backed by `src/services/i18n.ts` and Zustand-powered settings store.
- Theming system: shared primitives in `components/` + `constants/theme.ts` for dark/light UI parity.
- Expo + EAS ready: React 19, Expo SDK 54, Hermes-enabled iOS/Android native projects, and production build profiles defined in `eas.json`.

---

## Tech Stack
- **Runtime:** Expo Router, React Native 0.81 (Fabric + Hermes), React 19.
- **State & data:** Zustand stores (`src/stores/*`), static doctor/gallery data (`src/data/*`).
- **Hardware & sensors:** `expo-camera`, `expo-sensors`, `expo-speech`, `expo-haptics`, `expo-av`.
- **UI & animation:** `moti`, `reanimated`, custom themed components.
- **Tooling:** TypeScript 5.9, ESLint 9 + `eslint-config-expo`, Prettier.

---

## Getting Started
```bash
npm install          # install dependencies
npx expo start       # launch Metro + choose iOS, Android, web, or development build
```

Recommended workflow:
1. Use the Expo Go app for quick UI checks.
2. Switch to a development build (`npx expo run:ios --device` / `npx expo run:android`) when you need native modules such as `expo-camera`.
3. Keep Metro running; Router hot refresh keeps most flows instant.

---

## Project Structure

```
app/                 Expo Router entry points (tabs, stacks, modals, camera modal)
src/
  components/        Camera HUD, collapsible cards, progress indicators
  constants/         Pose definitions, tolerances, color tokens
  hooks/             Motion/gyro readings, auto capture logic, pose sequencing
  screens/           Standalone screen implementations (e.g., CameraScreen)
  services/          i18n, speech synthesis, photo analysis stubs
  stores/            Zustand slices for camera + settings + history
locales/             JSON bundles for ar, de, en, fr, it, tr
components/          App-wide theming helpers (cards, buttons, inputs)
eas.json             Dev/preview/prod build profiles
```

Run `npm run reset-project` only if you need to wipe the starter Expo template scaffolding; it moves the default example into `app-example/`.

---

## Environment & Secrets

### Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your OpenAI API key to `.env`:
   ```bash
   EXPO_PUBLIC_OPENAI_API_KEY=your_api_key_here
   ```

3. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

### Available Environment Variables

- `EXPO_PUBLIC_OPENAI_API_KEY`: OpenAI API key for photo analysis service (required)

**Note:** The `.env` file is gitignored. Never commit API keys to version control. Use `.env.example` as a template for required variables.

---

## Quality Gates
- **Linting:** `npm run lint`
- **Type checking:** Expo’s TypeScript integration runs automatically in Metro; run `tsc --noEmit` if you need a clean CI step.


---

## Building & Releasing (EAS)
| Profile      | Purpose                      | Notes                                   |
|--------------|------------------------------|-----------------------------------------|
| `development`| Dev client w/ live reload    | Distribution: internal                  |
| `preview`    | Internal QA builds           | Android builds APK for sideloading      |
| `production` | Store-ready artifacts        | Auto-increments build numbers           |

Typical flow:
```bash
eas login
eas build -p ios --profile preview
eas build -p android --profile production
eas submit -p ios --profile production
```
Ensure `EAS_NO_VCS=1` or a clean git state before triggering CI builds.

---

## Localization Workflow
1. Add strings to `locales/en.json`.
2. Mirror keys in other locale files.
3. Consume via `t('key.path')` helpers from `src/services/i18n.ts`.
4. Keep camera-related prompts concise—speech synthesis reads these verbatim.

---

## Contributing
Treat this repo as an internal Smile Hair Clinic × HairForce project:
1. Branch from `main`, keep commits scoped.
2. Prefer small PRs with video captures (especially for camera flows).
3. Update this README when you add new patient journeys or hardware capabilities so onboarding stays painless.
