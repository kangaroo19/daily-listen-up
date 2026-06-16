# Quiz Generation And Review

Use this reference when creating new quiz objects for `functions/src/content/quizPool.json`.

## Goal

Create N production-ready English listening quiz objects and validate the final JSON.

## Required Setup

- Inspect existing `functions/src/content/quizPool.json`.
- Avoid duplicate IDs, duplicate `quizDate` values, duplicate audio filenames, and materially similar scenarios.
- Include `quizDate` in every new object using `yyyy-mm-dd`.
- Do not create mp3 files unless the user explicitly asks; set only `audioFileName`.
- Set `audioFileName` to `{id}.mp3`.
- Set `speakerGender` to `female` or `male`.
- Set `promotionAmount` to `5`.
- Validate that `quizPool.json` remains valid JSON after editing.

## Product Context

- Users are beginner to intermediate English learners.
- Each day, the user hears one short English audio clip and selects every correct choice among 5 options.
- The activity should feel lightweight inside Toss, so scenarios should be practical and everyday.

## Content Rules

- Write `script` in English.
- Target A2-B1 everyday English.
- Keep sentences short and natural.
- Make the script suitable for 45 seconds to 1 minute of audio.
- Write choice `text` in Korean.
- Use exactly 5 choices.
- Use 1-2 correct choices.
- Make every correct choice directly supported by the script.
- Make every incorrect choice plausible but clearly contradicted by the script.
- Avoid external-knowledge questions; the user should answer by listening only.
- Use kebab-case for `id`.
- Use `choice-a` through `choice-e` unless the surrounding file uses a different established convention.

## Subagent Workflow

For any new quiz generation, use two real Codex subagents instead of simulating A/B roles in the main agent.
Do not use the small-edit exception when creating new quiz content.

- Subagent A drafts quiz objects.
- Subagent B independently reviews A's draft.
- The main agent waits for both results, applies B's valid feedback, edits `quizPool.json`, and validates JSON.
- Subagents must not directly modify `quizPool.json`.
If subagents are unavailable, stop and tell the user instead of generating new quiz content.

## Subagent A: Quiz Author

1. Choose an everyday listening scenario.
2. Write a 45-second to 1-minute English script.
3. Choose an appropriate `speakerGender`.
4. Create 5 Korean choices from key facts in the script.
5. Choose 1-2 correct answers.
6. Output draft JSON objects.

## Subagent B: Reviewer

Review each draft against these checks:

1. Fields are exactly `id`, `quizDate`, `audioFileName`, `speakerGender`, `script`, `choices`, `correctChoiceIds`, and `promotionAmount`.
2. `id` is kebab-case.
3. `quizDate` exists and uses `yyyy-mm-dd`.
4. `audioFileName` is `{id}.mp3`.
5. `speakerGender` is `female` or `male`.
6. `script` is A2-B1 level and suitable for 45 seconds to 1 minute of audio.
7. `choices` has exactly 5 items.
8. `correctChoiceIds` references only existing choice IDs.
9. There are 1-2 correct choices.
10. Every correct choice is directly supported by the script.
11. Every incorrect choice clearly conflicts with the script.
12. Choices are not duplicates or near-duplicates.
13. The quiz can be solved by listening only.
14. The draft does not duplicate existing quiz IDs, dates, audio filenames, or scenarios.

## Final JSON Object Shape

```json
{
  "id": "example-id",
  "quizDate": "2026-06-08",
  "audioFileName": "example-id.mp3",
  "speakerGender": "female",
  "script": "...",
  "choices": [
    { "id": "choice-a", "text": "..." },
    { "id": "choice-b", "text": "..." },
    { "id": "choice-c", "text": "..." },
    { "id": "choice-d", "text": "..." },
    { "id": "choice-e", "text": "..." }
  ],
  "correctChoiceIds": ["choice-a"],
  "promotionAmount": 5
}
```

## Completion Criteria

- `functions/src/content/quizPool.json` has N additional quiz objects.
- Existing IDs, `quizDate` values, audio filenames, and scenarios are not duplicated.
- Each quiz has exactly 5 choices.
- Each quiz has 1-2 `correctChoiceIds`.
- `correctChoiceIds` references only existing choices.
- Each `speakerGender` is `female` or `male`.
- Each `script` is English and each choice text is Korean.
- JSON parsing succeeds.
