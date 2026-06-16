# Quiz Content Schema

## Purpose

Manage English listening quiz source content in the repository or through the admin app, then seed it with audio files into Firebase Firestore and Storage.

Final Firebase output:

- Firestore document: `quizzes/{quizDate}`
- Storage object: `quiz-audio/{quizDate}/{audioFileName}`

## Source Locations

- Quiz data: `functions/src/content/quizPool.json`
- Audio files: `functions/src/content/audio/`

Expected structure:

```text
functions/src/content/
  quizPool.json
  audio/
    morning-video-meeting.mp3
    wrong-salad-delivery.mp3
```

`quizPool.json` is a dated quiz pool. Each item has a `quizDate` for the operating date.

## Source Quiz Object

Each quiz object uses this shape:

```json
{
  "id": "morning-video-meeting",
  "quizDate": "2026-06-08",
  "audioFileName": "morning-video-meeting.mp3",
  "speakerGender": "female",
  "script": "This morning, I tried to look professional before an important video meeting...",
  "choices": [
    { "id": "choice-a", "text": "화자는 중요한 화상 회의 전에 단정하게 보이려 했다." },
    { "id": "choice-b", "text": "화자는 커피를 만들고 자세를 바로 했다." },
    { "id": "choice-c", "text": "화자는 카메라가 켜지기 전 잠옷 바지를 갈아입었다." },
    { "id": "choice-d", "text": "고양이가 키보드 위에서 자고 있었다." },
    { "id": "choice-e", "text": "회의는 오후에 열릴 예정이었다." }
  ],
  "correctChoiceIds": ["choice-a", "choice-b", "choice-d"],
  "promotionAmount": 5
}
```

## Field Rules

- `id`: unique kebab-case ID inside the quiz pool.
- `quizDate`: KST operating date in `yyyy-mm-dd` format.
- `audioFileName`: mp3 filename under `functions/src/content/audio/`; prefer `{id}.mp3`.
- `speakerGender`: source metadata for the script speaker or narrator. Use only `female` or `male`.
- `script`: English listening script available after rewarded ad access.
- `choices`: exactly 5 Korean choices shown to the user.
- `correctChoiceIds`: IDs of correct choices used by the server for grading.
- `promotionAmount`: Toss point amount paid for a correct answer. Use `5` by default.

`speakerGender` is source metadata. The admin app should not save it to operational Firestore documents or send it to external TTS APIs by default. It should not appear in the client today's quiz response.

`correctChoiceIds`, `script`, `promotionAmount`, and `audioStoragePath` should not appear in the client today's quiz response. The client should use only `quizDate`, `audioUrl`, and `choices`.

## Date Assignment

Seed scripts may accept a quiz ID and date option:

```bash
npm --prefix functions run seed:quiz -- --id morning-video-meeting --date 2026-06-08
npm --prefix functions run seed:quiz -- --id morning-video-meeting --days-ahead 1
npm --prefix functions run seed:quiz -- --id wrong-salad-delivery --days-ahead 2
```

Date option rules:

- `--date YYYY-MM-DD`: assign the quiz to the specified KST date.
- `--days-ahead N`: assign the quiz to N days after the current KST date.

If the source quiz already has `quizDate`, keep the source and seed target date consistent. Stop and ask the user when a requested date conflicts with an existing `quizDate`.

## Firebase Output

Firestore path:

```text
quizzes/{quizDate}
```

Storage path:

```text
quiz-audio/{quizDate}/{audioFileName}
```

Firestore document example:

```json
{
  "quizDate": "2026-06-08",
  "isPublished": true,
  "audioStoragePath": "quiz-audio/2026-06-08/morning-video-meeting.mp3",
  "choices": [],
  "correctChoiceIds": [],
  "script": "",
  "promotionAmount": 5
}
```

## Repository-Based Operation

1. Write a 45-second to 1-minute English listening script.
2. Create 5 Korean choices and multiple correct answers from the script.
3. Prepare the final mp3 file manually.
4. Put the mp3 file in `functions/src/content/audio/`.
5. Add the quiz object to `functions/src/content/quizPool.json`.
6. Seed the quiz into the real Firebase project with `--date` or `--days-ahead`.
7. Confirm the Firestore `quizzes/{quizDate}` document and Storage audio object were created.
8. Verify today's quiz lookup and answer checking through the server API.

## Admin-App Operation

1. Choose manual input or JSON input mode in the admin app.
2. For manual input, enter the date, script, 5 choices, multiple correct answers, point amount, and prepared mp3 file.
3. For JSON input, paste a single `quizPool.json` object and select the mp3 file matching `audioFileName`.
4. `JSON 가져오기` should fill the quiz form and final audio candidate. It should not immediately save to Firestore or Storage.
5. Saving the quiz uploads the final audio under `quiz-audio/{quizDate}/` and saves the `quizzes/{quizDate}` document.
6. Review while unpublished, then publish when ready.
7. Verify today's quiz lookup and answer checking through the server API.

Admin quiz CRUD and final audio upload use the Firebase Client SDK. Admin v1 does not call an external TTS API.

## Validation Checklist

- Source quiz objects include `quizDate`.
- `quizDate` uses `yyyy-mm-dd`.
- Script length is appropriate for 45 seconds to 1 minute of audio.
- `speakerGender` is `female` or `male`.
- JSON input mode may accept `speakerGender`, but operational Firestore should not store it by default.
- Operational Firestore documents include `quizDate` and date-specific `audioStoragePath`.
- Each quiz has exactly 5 choices.
- `correctChoiceIds` contains only IDs present in `choices`.
- Audio files are mp3 files stored under `quiz-audio/{quizDate}/` in Storage.
- In JSON input mode, `audioFileName` exactly matches the selected mp3 filename.
- Client public responses do not expose answers, script, point amount, speaker gender, or raw Storage path.
