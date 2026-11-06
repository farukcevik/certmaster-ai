# Architecture

## Process boundaries

The application uses three trust zones:

1. **Renderer** — React, Zustand, i18next, Tailwind, and Recharts. It has no Node.js or filesystem access.
2. **Preload** — a sandbox-compatible CommonJS bridge that exposes a small typed `certmaster` API.
3. **Main process** — SQLite, dialogs, import parsing, backups, credentials, and AI network calls.

The main process validates the IPC sender and all untrusted payloads. Imported paths are usable only after the native file dialog grants a per-path capability. New windows and remote navigation are denied.

## Data flow

Renderer actions call the preload bridge, which invokes a named IPC handler. The handler validates input with Zod, performs a transactional database/service operation, and returns serializable data. Credentials are encrypted/decrypted only in the main process through Electron `safeStorage`.

## Offline behavior

React assets, migrations, fonts, questions, translations, settings, history, and analytics are local. No startup request is made. AI failures are isolated from exam persistence. The renderer CSP allows only local application assets and the default local Ollama endpoint; cloud calls originate from the main process only after explicit authorization.

## Exam durability

An exam creates immutable session-question rows containing question order and option-ID order. Answers are stored as option IDs, so visual randomization cannot change correctness. Navigation and remaining time are checkpointed every three seconds; each answer is saved immediately. Completion scores the stored IDs transactionally and creates attempt history.

## Project layout

```text
electron/
  database/       migrations and transactional repository
  main/           window lifecycle and validated IPC
  preload/        context-isolated API bridge
  services/       import and AI providers
shared/           schemas, contracts, pure protection logic
src/
  components/     shell and reusable UI
  pages/          functional application modules
  store/          Zustand application state
  test/           renderer test setup
e2e/              Playwright Electron smoke tests
docs/             operator and developer documentation
```

## Packaging

Vite emits renderer assets; TypeScript emits Electron code. Electron Builder packages both outputs and unpacks native `.node` modules from ASAR. Targets are macOS DMG/ZIP for arm64/x64 and Windows NSIS x64.
