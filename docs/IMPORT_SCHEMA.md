# Import schema

## JSON (recommended)

Either a top-level array or `{ "questions": [...] }` is accepted.

```json
{
  "questions": [
    {
      "id": "source-001",
      "originalLanguage": "en",
      "originalText": "Which service ...?",
      "type": "single",
      "difficulty": "medium",
      "categoryId": null,
      "explanation": "Reasoning supplied by the authorized source.",
      "tags": ["BigQuery", "storage"],
      "options": [
        { "label": "A", "text": "Option one", "isCorrect": false },
        { "label": "B", "text": "Option two", "isCorrect": true }
      ]
    }
  ]
}
```

`question` may be used instead of `originalText`. `correctAnswer`/`correctAnswers` may contain labels such as `"B"` or `["A", "C"]`. If neither per-option `isCorrect` nor a correct-answer field exists, the record is flagged and no answer is invented.

## CSV

Use UTF-8 with a header row. Common columns:

```text
id,question,optionA,optionB,optionC,optionD,correctAnswer,explanation,type,difficulty,tags
```

Multiple correct labels can be separated by comma, semicolon, pipe, or whitespace. If a comma is used inside a CSV field, quote the field according to RFC 4180.

## PDF

The local parser recognizes common forms such as `1. Question text`, option lines `A. Option`, `Answer: B`, and `Explanation: ...`. PDF layouts vary widely; always review the preview. A low extracted-character count triggers an OCR-required warning. The application does not silently accept a scanned PDF as complete.

## Duplicate detection

Question text is trimmed, case-folded, whitespace-normalized, and SHA-256 hashed. Duplicates in the target certification are skipped and counted in the final report.

The Google PDE adapter additionally assigns stable identifiers `GCP-PDE-001` through `GCP-PDE-349`. The database enforces uniqueness per certification, so re-running the integration reports duplicates without changing existing questions, history, or attempts.
