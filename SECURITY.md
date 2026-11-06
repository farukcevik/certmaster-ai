# Security policy

## Supported versions

Security fixes are applied to the latest release and the `main` branch.

## Reporting a vulnerability

Do not open a public issue for a vulnerability that could expose local question banks, API credentials, backups, or arbitrary file access. Use GitHub's private vulnerability reporting for this repository. Include the affected version, platform, reproduction steps, impact, and any suggested mitigation.

## Security design

- Core operation is offline and requires no account.
- Electron context isolation and renderer sandboxing are enabled; Node.js integration is disabled in the renderer.
- The preload exposes a narrow IPC API, and main-process handlers validate inputs and sender identity.
- Cloud AI is disabled by default and requires an explicit user authorization setting.
- Cloud credentials are stored with Electron `safeStorage` and are never returned to the renderer.
- User data and SQLite databases are stored outside the application installation directory.
- Imported files are accessed only after an operating-system file-picker grant.

## Secrets and signing

Certificates, signing passwords, API keys, and tokens must be stored only as GitHub Actions secrets or in operating-system credential storage. They must never be committed to the repository, included in backups intended for sharing, or embedded in release artifacts.
