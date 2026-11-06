# AI setup and privacy

AI is optional. Exams, imports, history, analytics, translations already cached, and backups work without it.

## Ollama (offline/local)

1. Install Ollama separately from its official distribution.
2. Download a multilingual instruct model, for example `ollama pull qwen2.5:7b`.
3. In **Ayarlar**, enable Ollama, use `http://127.0.0.1:11434`, and enter the installed model name.
4. Select **Bağlantıyı Test Et**. Models reported by `/api/tags` are shown.

Ollama absence or failure never interrupts an exam.

## OpenAI and Gemini

Cloud providers are disabled by default. To use one:

1. Enter its API key in **Ayarlar**. It is encrypted with Electron `safeStorage`; it never reaches the renderer.
2. Select a model supported by the provider/account.
3. Explicitly enable **Soru içeriğinin buluta gönderilmesine izin ver**.
4. Request a translation or explanation for a specific question.

Disable the authorization switch to block all cloud generation calls immediately.

## Translation protection

Before generation, the service replaces glossary-protected names, fenced/inline code, URLs, paths, and numbers with placeholders. The provider must return structured JSON. Validation rejects invalid JSON, missing options, missing placeholders, and incomplete text. Restored output is saved as `needs_review`; deterministic validation cannot guarantee semantic correctness, so approval remains a human action.

AI explanations are displayed separately and never overwrite an imported explanation.
