---
name: quiz-content-seeding
description: Create, validate, or seed Daily Listen Up English listening quiz content. Use when working with functions/src/content/quizPool.json, quizDate scheduling, quiz audio filenames, Firebase quizzes/{quizDate} documents, quiz-audio/{quizDate} Storage paths, or when generating A2-B1 quiz scripts with Korean choices and answer validation.
---

# Quiz Content Seeding

Use this skill for Daily Listen Up quiz content work. Keep changes scoped to quiz content, seed inputs, and directly related validation.

## Workflow

1. Read `references/content-schema.md` before changing quiz content, seed behavior, admin quiz JSON import behavior, or Firebase storage/document expectations.
2. For generating new quiz items, also read `references/generation-review-prompt.md`.
3. Inspect existing `functions/src/content/quizPool.json` before proposing or adding new items. Avoid duplicate IDs, audio filenames, dates, and materially similar scenarios.
4. Add or update quiz objects with `quizDate` in `yyyy-mm-dd` format.
5. Validate JSON parsing and the content rules before claiming the work is complete.

## Core Rules

- Store source quiz objects in `functions/src/content/quizPool.json`.
- Store source audio files in `functions/src/content/audio/`.
- Use `audioFileName` as `{id}.mp3`.
- Use exactly 5 choices.
- Use 1-2 `correctChoiceIds`.
- Use only `female` or `male` for `speakerGender`.
- Use `promotionAmount: 5` unless the user explicitly asks otherwise.
- Keep client public responses free of `correctChoiceIds`, `script`, `promotionAmount`, `speakerGender`, and raw `audioStoragePath`.

## References

- `references/content-schema.md`: field schema, Firestore/Storage output, and validation checklist.
- `references/generation-review-prompt.md`: A/B generation and review workflow for new quiz items.
