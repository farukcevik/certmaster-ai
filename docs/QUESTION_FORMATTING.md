# Question formatting recovery

PDF.js text items are grouped into lines using their page coordinates. Repeated page chrome is removed by position, and line indentation, page boundaries, vertical spacing, bullets, and known document headings are used to create a versioned structured document. Recovery is deterministic and offline; it never asks an AI model to rewrite source content.

`questions.original_text` remains the normalized import text used for duplicate detection. `questions.raw_text` stores recovered lines from the authoritative PDF. `questions.structured_content_json` stores headings, paragraphs, lists, code, tables, and image notices. `formatting_version` permits future recovery upgrades without changing question identity or answer data.

`reprocessPdeFormatting` backs up the database before mutation and updates only these three formatting columns. Stable source identifiers are the join key. An integrity guard hashes immutable question fields, options, answer flags, and user-data counts before and after the transaction.

The React `QuestionContentRenderer` maps the structured JSON to React elements directly. Raw HTML is neither accepted nor injected. Code is rendered in horizontally scrollable monospace blocks; long case studies can be viewed as a document beside the question prompt.
