# Release process

CertMaster AI uses `.github/workflows/release.yml` to build macOS arm64, macOS x64, and Windows x64 packages on native GitHub-hosted operating systems.

## Safety model

- Dependency installation uses `pnpm install --frozen-lockfile`.
- Type checks and unit/integration tests must pass on every build job.
- `better-sqlite3` is explicitly rebuilt for the target Electron ABI before packaging.
- The packaged Windows executable is launched and exercised with Playwright on `windows-latest`.
- A macOS package is launched only when its target matches the runner CPU architecture. The other macOS target is package-structure and native-binary validated.
- Checksums are generated after packaging.
- GitHub Releases are always created as drafts and require manual review before publication.

## Local builds

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm run test:unit

# On macOS
pnpm package:mac:arm64
pnpm package:mac:x64

# On Windows
pnpm package:win
```

Local outputs are written under `release/` and are ignored by Git.

## Creating a release candidate

1. Update `version` in `package.json` and add a matching section to `CHANGELOG.md`.
2. Run the tests available on the development host.
3. Commit and push the version change.
4. Push a matching version tag, for example:

   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

5. Wait for every macOS and Windows job to pass.
6. Review installer names, checksums, runtime-test results, signing status, and question-bank redistribution authorization.
7. Open the generated draft under GitHub Releases and publish it manually only after approval.

The workflow can also be run manually without creating a release. Set `create_draft_release` only when a draft is desired.

## Optional signing secrets

Store credentials only in GitHub Actions repository or environment secrets.

macOS:

- `MACOS_CSC_LINK`
- `MACOS_CSC_KEY_PASSWORD`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

Windows:

- `WINDOWS_CSC_LINK`
- `WINDOWS_CSC_KEY_PASSWORD`

Never commit certificates, private keys, passwords, provisioning profiles, or tokens. When credentials are absent, the workflow produces unsigned testing installers.

## Artifact names

```text
CertMaster-AI-VERSION-mac-arm64.dmg
CertMaster-AI-VERSION-mac-x64.dmg
CertMaster-AI-VERSION-win-x64-setup.exe
SHA256SUMS-mac-arm64.txt
SHA256SUMS-mac-x64.txt
SHA256SUMS-win-x64.txt
```

## Question-bank release gate

The current repository contains a question bank supplied and approved for publication by the repository owner. Before publishing any draft release, the maintainer must independently confirm redistribution rights for every bundled question and image. If authorization is not confirmed, remove question-bank data from the Electron Builder `files` list and distribute the application with its local import workflow only.
