# 7. 오늘 문제 조회 API와 콘텐츠 로딩 구현

## 목적

로그인한 사용자가 서버 KST 기준 오늘 제공되는 영어 듣기 문제를 조회하고, 클라이언트가 후속 퀴즈 화면에서 사용할 공개 문제 데이터를 로딩할 수 있게 한다.

## 구현 범위

- `GET /api/today-quiz` 라우트를 추가한다.
- 5번 앱 세션 검증 기준을 재사용한다.
- 서버 KST 기준 오늘 날짜를 계산한다.
- Firestore `quizzes`에서 오늘 날짜의 게시된 문제를 조회한다.
  - `quizDate`가 오늘 날짜와 일치해야 한다.
  - `isPublished`가 `true`여야 한다.
- 오늘 게시된 문제가 없으면 문제 없음 상태를 명시적으로 반환한다.
- 오늘 게시된 문제가 있으면 클라이언트에 공개 가능한 문제 데이터만 반환한다.
- Firestore의 `audioStoragePath`를 기반으로 클라이언트가 재생 가능한 `audioUrl`을 서버에서 발급해 반환한다.
- 오늘 문제가 실제로 존재할 때만 `userProgress` 기본 문서를 초기화한다.
- 기존 오늘 `userProgress`가 있으면 새로 만들지 않고 기존 상태를 반환한다.
- 클라이언트에서 6번에 저장한 `sessionToken`으로 `GET /api/today-quiz`를 호출하는 콘텐츠 로딩 흐름을 추가한다.
- 클라이언트에서 문제 있음, 문제 없음, 로딩 실패 상태를 구분할 수 있게 한다.

## 제외 범위

- Toss 로그인 클라이언트 구현
- 앱 세션 토큰 발급
- 세션 검증 공통 로직 신규 작성
- 홈 진입 분기 완성
- 문제 없음 상태의 최종 홈 UI 구현
- 오디오 플레이어 UI 구현
- 오디오 1회 재생 제한 구현
- 복수응답 선택지 UI 구현
- 답안 제출 구현
- 정답 검증 API 구현
- 결과 화면 이동
- 포인트 지급 API 구현
- 스크립트 공개
- 보상형 광고 연동
- 실제 오디오 파일 업로드

## 구현 기준

- `GET /api/today-quiz`는 `Authorization: Bearer ${sessionToken}` 인증을 요구한다.
- 세션 검증은 5번에서 만든 기준을 재사용한다.
- 날짜 기준은 서버 KST 기준을 사용한다.
- 클라이언트가 날짜를 보내거나 임의로 오늘 날짜를 정하지 않는다.
- 게시되지 않은 문제는 반환하지 않는다.
- 오늘 문제 후보가 여러 개면 서버에서 하나만 반환한다.
  - 같은 날짜에 게시된 문제가 여러 개 있는 상태는 운영 데이터 오류로 보고 completed 문서에 기록한다.
- 응답에는 `correctChoiceIds`를 포함하지 않는다.
- 응답에는 `script`를 포함하지 않는다.
- 응답에는 원본 `audioStoragePath`를 포함하지 않는다.
- 클라이언트에는 서버가 발급한 `audioUrl`만 내려준다.
- Firestore에는 오디오 파일 자체가 아니라 Storage path만 저장한다.
- Storage 접근 URL 발급 실패 시 문제 조회 성공으로 처리하지 않는다.
- `userProgress` 기본값은 오늘 문제가 실제로 존재할 때만 생성한다.
- `userProgress` 기본값은 다음 기준을 따른다.
  - `attemptCount`: `0`
  - `lastSubmittedChoiceIds`: `[]`
  - `isCorrect`: `false`
  - `canRetry`: `false`
  - `canViewScript`: `false`
  - `rewardStatus`: `none`
  - `needsRewardReview`: `false`
- 기존 `userProgress`가 있으면 기존 진행 상태를 유지한다.
- 7번 클라이언트 작업은 데이터 로딩 기반까지만 만들고, 실제 오디오 재생 UX와 선택지 상호작용은 9번과 10번에서 구현한다.

## API 응답 기준

오늘 문제가 있으면 `GET /api/today-quiz`는 다음 형태를 기준으로 응답한다.

```json
{
  "status": "available",
  "quiz": {
    "id": "quiz-id",
    "quizDate": "2026-05-16",
    "questionText": "정답이라고 생각하는 답을 모두 골라주세요",
    "audioUrl": "https://example.com/audio.mp3",
    "choices": [
      { "id": "choice-a", "text": "첫 번째 선택지" },
      { "id": "choice-b", "text": "두 번째 선택지" },
      { "id": "choice-c", "text": "세 번째 선택지" },
      { "id": "choice-d", "text": "네 번째 선택지" },
      { "id": "choice-e", "text": "다섯 번째 선택지" }
    ],
    "promotionAmount": 10
  },
  "progress": {
    "attemptCount": 0,
    "lastSubmittedChoiceIds": [],
    "isCorrect": false,
    "canRetry": false,
    "canViewScript": false,
    "rewardStatus": "none",
    "needsRewardReview": false
  }
}
```

오늘 문제가 없으면 다음 형태를 기준으로 응답한다.

```json
{
  "status": "empty",
  "quiz": null,
  "progress": null
}
```

## 상태 및 예외 처리

- 세션 토큰이 없거나 유효하지 않으면 401로 응답한다.
- 오늘 게시된 문제가 없으면 200과 `status: "empty"`로 응답한다.
- 오늘 문제가 있지만 `audioStoragePath`가 없으면 서버 데이터 오류로 처리한다.
- Storage URL 발급에 실패하면 서버 내부 에러로 처리한다.
- 선택지가 5개가 아니면 서버 데이터 오류로 처리한다.
- 오늘 문제 응답에서 정답, 스크립트, Storage path가 노출되지 않게 한다.
- `userProgress` 생성이 실패하면 문제 조회 성공으로 응답하지 않는다.
- 기존 진행 상태가 이미 완료 상태라면 그대로 반환하고, 실제 완료 화면 분기는 8번에서 처리한다.
- 클라이언트 문제 로딩 실패 시 홈 또는 준비 상태 안에서 재시도 가능한 상태를 유지한다.

## 완료 기준

- `GET /api/today-quiz` 라우트가 서버 app에 등록되어 있다.
- `GET /api/today-quiz`가 5번 세션 검증 기준을 재사용한다.
- 토큰 누락, 만료, 잘못된 세션이면 401로 응답하는 테스트가 존재하고 통과한다.
- 오늘 게시된 문제가 없으면 `status: "empty"`를 반환하는 테스트가 존재하고 통과한다.
- 오늘 게시된 문제가 있으면 공개 문제 데이터와 `audioUrl`을 반환하는 테스트가 존재하고 통과한다.
- 응답에 `correctChoiceIds`, `script`, `audioStoragePath`가 포함되지 않는 테스트가 존재하고 통과한다.
- 오늘 문제가 실제로 있을 때 기존 `userProgress`가 없으면 기본 문서를 생성하는 테스트가 존재하고 통과한다.
- 기존 오늘 `userProgress`가 있으면 중복 생성하지 않고 기존 상태를 반환하는 테스트가 존재하고 통과한다.
- 다른 날짜 문제는 오늘 문제로 반환하지 않는 테스트가 존재하고 통과한다.
- `isPublished: false` 문제는 반환하지 않는 테스트가 존재하고 통과한다.
- 선택지가 5개가 아닌 문제는 서버 데이터 오류로 처리하는 테스트가 존재하고 통과한다.
- 클라이언트가 `sessionStorage`의 `sessionToken`으로 `GET /api/today-quiz`를 호출하는 코드가 존재한다.
- 클라이언트가 문제 있음, 문제 없음, 로딩 실패 상태를 구분할 수 있다.
- 오디오 플레이어 UI와 복수응답 UI가 이 작업에 섞이지 않았다.
- `npm run test:server`가 통과한다.
- `npm run typecheck:server`가 통과한다.
- `npm run build`가 통과한다.
- `npm run lint`가 통과한다.

## Git 전략

- 최신 `dev` 기준에서 `codex/07-today-quiz-api` 브랜치를 만든다.
- 서버 오늘 문제 조회 API, Storage URL 발급, `userProgress` 초기화, 클라이언트 로딩 흐름, 테스트, 검증 기록을 의미 있는 단위로 커밋한다.
- 작업 완료 후 `docs/exec-plans/completed/07-today-quiz-api-result.md`를 작성한다.
- 작업 브랜치에서 `dev`로 PR을 보낸다.
- PR 설명에는 이 active 문서와 completed 문서를 함께 링크한다.

## 다음 작업과의 연결

- 8번 홈 진입 분기와 문제 없음 상태 구현은 이 작업의 `status: "available"`과 `status: "empty"` 응답을 사용한다.
- 8번은 기존 `userProgress`의 완료 상태를 보고 문제 화면 또는 완료 화면으로 분기한다.
- 9번 오디오 재생 UI 구현은 이 작업에서 받은 `audioUrl`을 사용한다.
- 10번 복수응답 퀴즈 풀이 UI 구현은 이 작업에서 받은 `choices`를 사용한다.
- 11번 정답 검증 API 구현은 서버에만 남겨둔 `correctChoiceIds`를 사용해 답안을 검증한다.
