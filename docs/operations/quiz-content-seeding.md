# 퀴즈 콘텐츠 적재 운영 가이드

## 목적

이 문서는 듣기 문제 원본을 저장소 안에서 관리하고, 오디오 파일과 함께 실제 Firebase 프로젝트의 Firestore와 Storage에 적재하는 기준을 정리한다.

문제 원본은 날짜와 분리해 문제 단위로 보관한다. 운영 적재 시점에 날짜를 지정해 `quizzes/{quizDate}` 문서와 `quiz-audio/{quizDate}/...` Storage 객체를 만든다.

## 원본 보관 위치

문제 풀 원본은 아래 위치에 둔다.

- 문제 데이터: `functions/src/content/quizPool.json`
- 오디오 파일: `functions/src/content/audio/`

예상 구조:

```text
functions/src/content/
  quizPool.json
  audio/
    morning-video-meeting.mp3
    wrong-salad-delivery.mp3
```

`quizPool.json`은 날짜가 없는 문제 풀이다. 같은 문제를 특정 날짜에 배정하는 책임은 seed 스크립트가 가진다.

## 문제 데이터 형식

문제 하나는 아래 필드를 가진다.

```json
{
  "id": "morning-video-meeting",
  "audioFileName": "morning-video-meeting.mp3",
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

필드 기준:

- `id`: 문제 풀 안에서 문제를 식별하는 고유 ID
- `audioFileName`: `functions/src/content/audio/` 아래에 있는 mp3 파일명
- `script`: 광고 보상 후 열람 가능한 영어 듣기 스크립트
- `choices`: 사용자에게 노출되는 5개 선택지
- `correctChoiceIds`: 서버가 채점에 사용하는 정답 선택지 ID 목록
- `promotionAmount`: 정답 시 지급할 토스 포인트 금액

`correctChoiceIds`, `script`, `promotionAmount`, `audioStoragePath`는 클라이언트의 오늘 문제 응답에 포함하지 않는다. 클라이언트는 서버 API가 내려주는 `quizDate`, `audioUrl`, `choices`만 사용한다.

## 날짜 지정 방식

seed 스크립트는 문제 ID와 날짜 옵션을 받아 실제 운영 데이터를 만든다.

예상 실행 방식:

```bash
npm --prefix functions run seed:quiz -- --id morning-video-meeting --date 2026-06-08
npm --prefix functions run seed:quiz -- --id morning-video-meeting --days-ahead 1
npm --prefix functions run seed:quiz -- --id wrong-salad-delivery --days-ahead 2
```

날짜 옵션 기준:

- `--date YYYY-MM-DD`: 지정한 KST 날짜에 문제를 배정한다.
- `--days-ahead N`: 실행일의 KST 날짜 기준 N일 뒤에 문제를 배정한다.

예를 들어 2026-06-07 KST에 `--days-ahead 1`로 실행하면 `quizDate`는 `2026-06-08`이 된다.

## Firebase 저장 결과

실제 Firebase 프로젝트에 적재되면 아래 위치에 저장된다.

Firestore:

```text
quizzes/{quizDate}
```

Storage:

```text
quiz-audio/{quizDate}/{audioFileName}
```

Firestore 문서에는 날짜가 붙은 운영 데이터가 저장된다.

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

`quizPool.json`은 운영 전 원본이고, Firestore `quizzes/{quizDate}`는 앱이 해당 날짜에 사용하는 운영 데이터다.

## 운영 흐름

1. 30초 분량의 영어 듣기 스크립트를 작성한다.
2. 스크립트 기준으로 5개 선택지와 복수 정답을 만든다.
3. 음성 생성 도구로 mp3 파일을 만든다.
4. mp3 파일을 `functions/src/content/audio/`에 둔다.
5. 문제 데이터를 `functions/src/content/quizPool.json`에 추가한다.
6. `--date` 또는 `--days-ahead`로 실제 Firebase 프로젝트에 seed 한다.
7. Firestore `quizzes/{quizDate}` 문서와 Storage 오디오 객체가 생성됐는지 확인한다.
8. 서버 API로 오늘 문제 조회와 정답 검증 흐름을 확인한다.

## 검증 기준

- 문제 원본에는 날짜가 없어야 한다.
- 스크립트는 음성 기준 30초 분량이어야 한다.
- 운영 Firestore 문서에는 `quizDate`와 날짜별 `audioStoragePath`가 있어야 한다.
- 선택지는 5개여야 한다.
- `correctChoiceIds`는 `choices`에 존재하는 ID만 포함해야 한다.
- 오디오 파일은 mp3로 준비하고 Storage에는 `quiz-audio/{quizDate}/` 아래에 저장해야 한다.
- 클라이언트 공개 응답에 정답, 스크립트, 포인트 금액, 원본 Storage 경로가 노출되지 않아야 한다.
