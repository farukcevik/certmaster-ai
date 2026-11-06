# Troubleshooting

## `better-sqlite3` ABI/version error

Native SQLite must match the active runtime.

```bash
# Unit tests under Node
pnpm rebuild better-sqlite3

# Electron development/E2E/package runtime
pnpm electron-builder install-app-deps
```

The project test scripts run these in the required order.

## Electron window opens with no data

Run `pnpm build`, confirm `dist/` and `dist-electron/electron/preload/index.cjs` exist, then run the Electron app again. The preload is intentionally CommonJS because sandboxed preloads do not use the renderer's ESM bundle.

## PDF imports zero questions

If the preview reports OCR required, create a searchable/text-layer PDF first. If text exists but layout is unusual, export the authorized data to the documented JSON or CSV schema. The parser will not infer missing answers.

## Ollama connection fails

Confirm Ollama is running, the address is `http://127.0.0.1:11434`, and `curl http://127.0.0.1:11434/api/tags` works locally. The application remains fully usable without Ollama.

## Cloud AI is blocked

Both a stored credential and the explicit cloud-content authorization switch are required. Re-enter keys after restoring a backup on another computer because OS-encrypted credentials may be machine/account bound.

## macOS warns that the app is unidentified

Local unsigned builds are for development. Public packages must be signed with Developer ID Application and notarized. Do not ask users to disable Gatekeeper for production distribution.
