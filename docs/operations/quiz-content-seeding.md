# 퀴즈 콘텐츠 적재 운영 가이드

## 목적

이 문서는 듣기 문제 원본을 저장소 안에서 관리하거나 관리자 앱에서 작성하고, 오디오 파일과 함께 실제 Firebase 프로젝트의 Firestore와 Storage에 적재하는 기준을 정리한다.

저장소 기반 운영에서는 문제 원본을 날짜와 분리해 문제 단위로 보관한다. 관리자 앱 기반 운영에서는 날짜별 운영 문제를 직접 작성한다. 두 흐름 모두 최종 저장 결과는 `quizzes/{quizDate}` 문서와 `quiz-audio/{quizDate}/...` Storage 객체다.

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

필드 기준:

- `id`: 문제 풀 안에서 문제를 식별하는 고유 ID
- `audioFileName`: `functions/src/content/audio/` 아래에 있는 mp3 파일명
- `speakerGender`: 원본 제작 단계에서 참고할 수 있는 화자 성별 메타데이터. 값은 `female` 또는 `male`만 사용한다.
- `script`: 광고 보상 후 열람 가능한 영어 듣기 스크립트
- `choices`: 사용자에게 노출되는 5개 선택지
- `correctChoiceIds`: 서버가 채점에 사용하는 정답 선택지 ID 목록
- `promotionAmount`: 정답 시 지급할 토스 포인트 금액

`speakerGender`는 스크립트의 화자 또는 내레이터를 관리하기 위한 원본 메타데이터다. 관리자 앱은 이 값을 Firestore에 저장하지 않고 외부 TTS API 호출에도 사용하지 않는다. 앱 사용자가 문제를 풀 때 알아야 하는 정보가 아니므로 운영 Firestore 문서와 클라이언트의 오늘 문제 응답에는 기본적으로 포함하지 않는다.

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

### 저장소 기반 운영

1. 45초~1분 분량의 영어 듣기 스크립트를 작성한다.
2. 스크립트 기준으로 5개 선택지와 복수 정답을 만든다.
3. 최종으로 사용할 mp3 파일을 직접 준비한다.
4. mp3 파일을 `functions/src/content/audio/`에 둔다.
5. 문제 데이터를 `functions/src/content/quizPool.json`에 추가한다.
6. `--date` 또는 `--days-ahead`로 실제 Firebase 프로젝트에 seed 한다.
7. Firestore `quizzes/{quizDate}` 문서와 Storage 오디오 객체가 생성됐는지 확인한다.
8. 서버 API로 오늘 문제 조회와 정답 검증 흐름을 확인한다.

### 관리자 앱 기반 운영

1. 관리자 앱에서 수동 입력 또는 JSON 입력 모드를 선택한다.
2. 수동 입력 시 날짜, 스크립트, 5개 선택지, 복수 정답, 포인트 금액을 입력하고 직접 준비한 mp3 파일을 선택한다.
3. JSON 입력 시 `quizPool.json` 단일 객체에 `quizDate`를 추가해 붙여넣고, JSON의 `audioFileName`과 이름이 같은 mp3 파일을 선택한다.
4. `JSON 가져오기`는 기존 퀴즈 폼과 최종 오디오 후보를 채우며, Firestore 또는 Storage에 즉시 저장하지 않는다.
5. 퀴즈를 저장하면 관리자 앱이 최종 오디오를 `quiz-audio/{quizDate}/` 아래에 업로드하고 `quizzes/{quizDate}` 문서를 저장한다.
6. 미발행 상태로 확인한 뒤 필요할 때 발행한다.
7. 서버 API로 오늘 문제 조회와 정답 검증 흐름을 확인한다.

관리자 앱의 퀴즈 CRUD와 최종 오디오 업로드는 Firebase Client SDK를 사용한다. 관리자 v1은 외부 TTS API를 호출하지 않는다.

## 검증 기준

- 문제 원본에는 날짜가 없어야 한다.
- 스크립트는 음성 기준 45초~1분 분량이어야 한다.
- `speakerGender`는 `female` 또는 `male`이어야 한다.
- JSON 입력 모드는 `speakerGender`를 허용하되 운영 Firestore 문서에는 저장하지 않아야 한다.
- 운영 Firestore 문서에는 `quizDate`와 날짜별 `audioStoragePath`가 있어야 한다.
- 선택지는 5개여야 한다.
- `correctChoiceIds`는 `choices`에 존재하는 ID만 포함해야 한다.
- 오디오 파일은 mp3로 준비하고 Storage에는 `quiz-audio/{quizDate}/` 아래에 저장해야 한다.
- JSON 입력 모드에서는 `audioFileName`과 선택한 mp3 파일명이 정확히 일치해야 한다.
- 클라이언트 공개 응답에 정답, 스크립트, 포인트 금액, 화자 성별, 원본 Storage 경로가 노출되지 않아야 한다.
