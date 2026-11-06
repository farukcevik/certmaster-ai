# Changelog

All notable changes are documented here. Version headings follow semantic versioning.

## [Unreleased]

### Added

- Native GitHub Actions builds for macOS arm64, macOS x64, and Windows x64.
- Draft GitHub Release automation with SHA-256 checksum files.
- Explicit Electron ABI rebuilds for `better-sqlite3`.
- Packaged question-bank initialization on first application launch.
- Windows icon, release documentation, security policy, screenshots, and issue templates.

### Changed

- Installer artifact names now include version, operating system, and architecture.
- Release builds fail when mandatory tests, packaging, resource validation, or native runtime validation fail.

## [1.0.0] - 2026-11-06

### Added

- Offline certification library, question bank, examination engine, practice and custom modes.
- 349-question Google Cloud Professional Data Engineer bank with stable identifiers and recovered images.
- English, Turkish, and bilingual question display.
- Local SQLite persistence, history, analytics, bookmarks, backup, restore, and statistics reset.
- Optional Ollama, Gemini, and OpenAI integrations with local translation cache and terminology protection.
- macOS Apple Silicon testing package.
