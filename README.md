# CertMaster AI – Offline Certification Exam Simulator

CertMaster AI is an offline-first Electron desktop application for importing, managing, translating, and practicing certification questions. The primary UI is Turkish, with English UI support and independent English/Turkish/bilingual question display.

The repository includes the user-authorized, locally extracted Google Cloud Professional Data Engineer bank at `question-banks/GCP_PDE_349_questions.json`, together with its recovered question images. Stable source identifiers make imports idempotent, and no question content is downloaded at runtime.

## Implemented capabilities

- Secure Electron shell: context isolation, sandboxed CommonJS preload, renderer Node.js disabled, sender-validated/Zod-validated IPC, navigation blocking, and file-dialog capability grants.
- Normalized SQLite storage with WAL journaling, foreign keys, indexes, transactional writes, migrations, integrity checks, backup, and restore.
- Certification/provider library and complete question CRUD with single, multiple, true/false, scenario, and image question types.
- Exam, practice, custom, incorrect-question, and bookmarked-question session creation.
- Countdown, pause/resume, automatic progress persistence, answer/option randomization, review flags, navigation grid, automatic timeout submission, and restart recovery.
- Results, history, question review, daily activity, score trends, category accuracy, and weak-topic reporting.
- Local JSON/CSV/PDF text import preview, duplicate detection, manual correction, partial selection, and explicit OCR-required detection.
- Turkish/English UI localization and English/Turkish/bilingual question display without resetting the session.
- Local translation cache, manual editing/approval, configurable terminology, protected-segment validation, Ollama, Gemini, and OpenAI provider abstraction.
- OS-backed Electron `safeStorage` for cloud API credentials. Cloud AI is disabled by default and requires explicit content-sharing authorization.
- Full local SQLite backup/restore with pre-restore integrity and schema validation.
- Unit, integration, React Testing Library, and Electron Playwright tests.

## Requirements

- Node.js 22 or later
- pnpm 10 or later
- macOS 12+ (Apple Silicon or Intel) or Windows 10+
- Xcode Command Line Tools on macOS when a native SQLite prebuild is unavailable

Ollama is optional. No AI component is required for exam functionality.

## Install and develop

```bash
pnpm install
pnpm dev
```

The first install builds `better-sqlite3` for the current platform. Development data is stored under Electron's platform-specific application data directory, never in the repository.

## Validation

```bash
pnpm typecheck
pnpm run test:unit
pnpm run test:e2e
pnpm build
```

`test:e2e` builds the application and rebuilds native dependencies for Electron before launching a temporary isolated profile.

## Distribution

```bash
# Current platform
pnpm package

# macOS arm64 + x64 DMG/ZIP (must run on macOS)
pnpm package:mac

# Windows x64 NSIS installer (prefer running on Windows CI/host)
pnpm package:win
```

Unsigned local macOS packages are suitable for testing. Public distribution requires an Apple Developer ID certificate and notarization credentials. Windows signing similarly requires a code-signing certificate.

## Import Google Cloud Professional Data Engineer questions

1. Obtain an authorized PDF, JSON, or CSV source. Do not import material you are not licensed to use.
2. Open **İçe Aktarma** and select **Google Cloud — Professional Data Engineer**.
3. Choose PDF, JSON, or CSV. All extraction happens locally.
4. Review every parser warning. A source without detectable correct answers is never guessed; affected questions are marked for review and are skipped until corrected.
5. Correct question text/options and select the correct answer in the preview.
6. Deselect unwanted records and choose **Seçilen Soruları İçe Aktar**.
7. Use **Soru Bankası** to assign categories, tags, and final approval state.

For an approximately 349-question source, JSON is the most reliable format. The supported schema is documented in [docs/IMPORT_SCHEMA.md](docs/IMPORT_SCHEMA.md).

The integrated bank contains 349 validated records: 330 single-answer and 19 multiple-answer questions. Thirty records are marked for manual review because the PDF contains embedded images or visual references. Q243 contains image-only SQL answer options and therefore uses explicit missing-image placeholders rather than invented text.

Long PDF questions retain both their immutable normalized text and a versioned structured document. The exam reader renders case-study headings, paragraphs, nested lists, code blocks, tables, and image notices without executing HTML. Case studies offer standard and independently scrollable split views.

Required source visuals are stored directly in the structured question document as offline data images. The integrated PDE bank includes the classification graphic for Q63, all four SQL image options for Q243, and the sample BigQuery table for Q248. In **Soru Bankası → Düzenle**, the **Doğru cevap seçimi** section uses radio controls for single-answer questions and checkboxes for multiple-answer questions; saving preserves the stable question and option identifiers.

To recover formatting for an already imported 349-question database without deleting user data:

```bash
node dist-electron/electron/scripts/reprocessPdeFormatting.js \
  /path/to/professional-data-engineer.pdf \
  /path/to/certmaster.db \
  reports/pde-formatting-recovery.json
```

The command creates a timestamped database backup, matches `GCP-PDE-001` through `GCP-PDE-349`, updates formatting fields in one transaction, and verifies that questions, options, correct answers, history, attempts, bookmarks, and translations are unchanged.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [AI setup and privacy](docs/AI_SETUP.md)
- [Import schema](docs/IMPORT_SCHEMA.md)
- [Question formatting recovery](docs/QUESTION_FORMATTING.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## Known limitations

- OCR is deliberately not bundled. Image-only PDFs are detected and reported; they must be OCRed before import.
- PDF text parsing supports common numbered-question layouts but cannot reliably infer arbitrary publisher layouts. Missing answers are never fabricated.
- Embedded PDF image extraction and question-image editing are represented in the database schema but are not yet exposed by the importer UI.
- Bulk AI translation currently processes one selected question at a time; manual translation and local caching are complete, while resumable batch job controls are not yet exposed in the UI.
- macOS Intel and Windows build configurations are included, but only the host architecture can be runtime-tested locally.

## Data and privacy

Core features never require a network connection. Ollama connects only to the configured local endpoint. Gemini/OpenAI calls are blocked until the user enables cloud AI, stores a credential, and explicitly authorizes sending question content. There is no registration, telemetry, cloud sync, or automatic upload.
