# 05. 오디오 재생과 복수응답 퀴즈 UI 구현 결과

## 기준 문서

- Active 작업지시서: `docs/exec-plans/active/05-audio-multiple-choice-quiz.md`
- 직전 완료 문서: `docs/exec-plans/completed/04-home-today-quiz-entry-result.md`
- MVP 기준: `docs/exec-plans/index.md`
- 제품 기준: `docs/product-specs/quiz.md`, `docs/product-specs/backend.md`, `docs/product-specs/home.md`
- UI 기준: `docs/design-docs/style-guidelines.md`

## 작업 체크리스트

- [x] 작업 시작 시 `docs/exec-plans/completed/04-home-today-quiz-entry-result.md`가 존재하면 먼저 읽고 문제 풀이 화면 경로와 앱 세션 사용 방식을 반영했다.
  - 근거: 04번 완료 문서 확인 후 `src/App.tsx`의 `screen = 'quiz'`, `src/services/appSession.ts`의 앱 세션 토큰 사용 기준을 반영했다.
- [x] 문제 풀이 화면 진입 시 `GET /api/today-quiz`를 호출한다.
  - 근거: `src/screens/QuizScreen.tsx`, `src/services/apiClient.ts`의 `getTodayQuiz()`.
- [x] `GET /api/today-quiz` 응답의 `quizDate`를 상태에 보관하고 이후 제출 작업에서 사용할 수 있게 한다.
  - 근거: `src/screens/QuizScreen.tsx`의 `quiz` 상태와 `submissionBoundary`.
- [x] `GET /api/today-quiz` 응답의 `audioUrl`로 오디오를 재생할 수 있게 한다.
  - 근거: `src/screens/QuizScreen.tsx`의 `<audio src={quiz.audioUrl}>`, `functions/src/api/todayQuiz.ts`.
- [x] `GET /api/today-quiz` 응답의 `choices` 5개를 청취 완료 후 표시한다.
  - 근거: `src/services/apiClient.ts`에서 5개 선택지를 검증하고, `src/screens/QuizScreen.tsx`에서 청취 완료 후 렌더링한다.
- [x] 청취 전 제목 `오늘의 영어를 들어보세요`와 안내 `음성을 끝까지 들은 뒤 문제를 풀 수 있어요.`를 표시한다.
  - 근거: `src/screens/QuizScreen.tsx`, Browser 모바일 preview.
- [x] 오디오는 자동 재생하지 않고 `듣기 시작` 버튼으로만 시작한다.
  - 근거: `src/screens/QuizScreen.tsx`의 `handleStartAudio()`, `<audio>`에 `autoPlay` 없음.
- [x] 오디오 재생이 시작된 뒤 같은 시도에서 다시 재생할 수 없게 한다.
  - 근거: `src/screens/QuizScreen.tsx`의 `hasStartedAudio` 상태와 `듣기 시작` 버튼 비활성화.
- [x] 오디오 종료 이벤트 이후 제목을 `정답이라고 생각하는 답을 모두 골라주세요`로 전환한다.
  - 근거: `src/screens/QuizScreen.tsx`의 `onEnded`, Browser 모바일 preview.
- [x] 오디오 청취 완료 전에는 선택지를 숨기거나 비활성 상태로 유지한다.
  - 근거: `src/screens/QuizScreen.tsx`, Browser pre-listen snapshot에서 선택지 없음.
- [x] 청취 완료 후 5개 선택지에서 여러 개를 선택하거나 선택 해제할 수 있게 한다.
  - 근거: `src/screens/QuizScreen.tsx`의 `handleToggleChoice()`, Browser 선택지 선택 preview.
- [x] 선택 개수에는 별도 상한을 두지 않는다.
  - 근거: `src/screens/QuizScreen.tsx`의 배열 토글 로직에 최대 선택 수 제한 없음.
- [x] 선택 답안이 0개이면 `답안 제출` 버튼을 비활성화한다.
  - 근거: `src/screens/QuizScreen.tsx`의 `canSubmit`, Browser pre/post-listen 미선택 snapshot.
- [x] 선택 답안이 1개 이상이면 `답안 제출` 버튼을 활성화한다.
  - 근거: Browser 모바일 preview에서 선택지 1개 선택 후 submit enabled 확인.
- [x] 문제 또는 오디오 로딩 실패 시 `문제를 불러오지 못했어요.`와 `다시 시도` 액션을 같은 화면에 표시한다.
  - 근거: `src/screens/QuizScreen.tsx`의 실패 분기와 `handleRetry()`.
- [x] `답안 제출` 버튼에는 텍스트와 광고/영상 성격의 아이콘을 함께 배치할 수 있는 구조를 둔다.
  - 근거: `src/screens/QuizScreen.tsx`의 `submit-button-content`, `src/styles.css`의 `video-icon`.

## 검증 체크리스트

- [x] 문제 풀이 화면 진입 시 앱 세션 토큰으로 `GET /api/today-quiz`가 호출된다.
  - 근거: `src/screens/QuizScreen.tsx`, `src/services/apiClient.ts`; Browser preview에서 앱 세션 토큰 저장 후 API mock 호출 확인.
- [x] 서버 응답의 `quizDate`가 상태에 보관되고 화면 이탈 전까지 유지된다.
  - 근거: `src/screens/QuizScreen.tsx`의 `quiz` 상태와 `submissionBoundary`.
- [x] 오디오가 자동 재생되지 않는다.
  - 근거: `<audio>`에 `autoPlay` 없음, Browser pre-listen snapshot에서 `듣기 시작` 대기 상태 확인.
- [x] 사용자가 `듣기 시작`을 누르면 오디오가 재생된다.
  - 근거: `src/screens/QuizScreen.tsx`의 `audio.play()` 호출; Browser preview에서 버튼 액션 상태를 확인했다.
- [x] 같은 시도에서 오디오를 두 번째로 재생할 수 없다.
  - 근거: `hasStartedAudio` 이후 버튼 비활성화 및 청취 완료 후 버튼 제거.
- [x] 오디오가 끝나기 전에는 선택지가 표시되지 않거나 선택할 수 없다.
  - 근거: Browser pre-listen snapshot에서 선택지 없음.
- [x] 오디오가 끝난 뒤 정확히 5개 선택지가 표시된다.
  - 근거: Browser post-listen snapshot에서 5개 선택지 표시.
- [x] 사용자가 선택지를 여러 개 선택하고 다시 해제할 수 있다.
  - 근거: `src/screens/QuizScreen.tsx`의 선택 토글 로직; 선택 개수 제한 없음.
- [x] 선택 답안이 0개이면 `답안 제출` 버튼이 비활성화된다.
  - 근거: Browser post-listen 미선택 snapshot에서 disabled 확인.
- [x] 선택 답안이 1개 이상이면 `답안 제출` 버튼이 활성화된다.
  - 근거: Browser preview에서 1개 선택 후 `submit enabled true` 확인.
- [x] API 또는 오디오 로딩 실패 시 같은 화면에서 다시 시도할 수 있다.
  - 근거: `src/screens/QuizScreen.tsx` 실패 분기와 `다시 시도` 버튼.
- [x] 클라이언트 응답 또는 상태에 `correctChoiceIds`, `script`, `promotionAmount`, 원본 `audioStoragePath`가 필요 이상으로 노출되지 않는다.
  - 근거: `functions/src/scripts/verifyTodayQuiz.ts`가 응답 key를 `quizDate`, `audioUrl`, `choices`로 검증; `rg` 클라이언트 검색에서 실제 서버 전용 값 저장/노출 없음.
- [x] 모바일 WebView 기준으로 주요 콘텐츠와 하단 액션이 겹치지 않는다.
  - 근거: Browser 390x844 preview에서 청취 전/청취 후/선택 후 화면을 확인했고 하단 액션과 선택지 겹침 없음.
- [x] 타입 검사, 프론트 빌드, 관련 테스트 또는 수동 검증이 통과한다.
  - 근거: `npm run typecheck`, `npm --prefix functions run test`, `npm run build`, `npm --prefix functions run verify:today-quiz` 통과.

## 변경 요약

- `GET /api/today-quiz`를 구현해 앱 세션 확인 후 서버 KST 기준 오늘 공개 문제의 `quizDate`, `audioUrl`, `choices`만 반환하게 했다.
- 원본 Storage 경로를 직접 내려주지 않도록 `audioUrl`은 `/api/quiz-audio?quizDate=...` 프록시 URL로 만들고, 서버에서 Storage 파일을 스트리밍한다.
- `QuizScreen`을 문제 로딩, 1회 오디오 재생, 청취 완료 후 5개 복수 선택, 제출 버튼 활성/비활성 경계까지 구현했다.
- `verify:today-quiz` 검증 스크립트를 추가해 세션 없음, 만료 세션, 오늘 문제 없음, 성공 응답, 오디오 URL 재생 가능 여부를 Firebase Emulator 기준으로 확인한다.
- 샘플 seed/verify 스크립트 로그에서 원본 Storage 경로 값이 출력되지 않게 조정했다.

## 검증 결과

- `npm run typecheck`: 통과.
- `npm --prefix functions run test`: 통과, 11개 테스트.
- `npm run build`: 통과. 기존 Vite 번들 크기 경고는 유지됐다.
- `npm --prefix functions run verify:today-quiz`: 통과. 기존 emulator가 포트를 점유하고 있어 `GCLOUD_PROJECT`, `FIRESTORE_EMULATOR_HOST`, `FIREBASE_STORAGE_EMULATOR_HOST`, `FUNCTIONS_EMULATOR`를 지정해 실행했다.
- `http://127.0.0.1:5173/`: HTTP 200 확인.
- Browser 모바일 preview `390x844`: 청취 전, 청취 완료 후 5개 선택지, 선택 후 제출 버튼 활성 상태 확인.
- 비밀값 검색: 클라이언트 코드에 서버 비밀키, Toss access token, 원본 `userKey`, mTLS 인증서/개인키, 정답 목록, 스크립트 본문, 포인트 금액, 원본 Storage 경로를 저장하거나 노출하는 코드가 없음을 확인했다.

## 후속 참고 사항

- 06번은 `QuizScreen`의 `submissionBoundary`에 있는 `quizDate`와 `selectedChoiceIds`를 `POST /api/answer-result` 연결 지점으로 사용하면 된다.
- `답안 제출` 버튼은 05번에서는 활성/비활성 경계까지만 구현했고, 클릭 시 광고/제출/정답 검증은 수행하지 않는다.
- 앱 세션은 04번과 동일하게 `getAppSessionToken()`으로 읽고, `GET /api/today-quiz`의 `Authorization: Bearer` 헤더에만 사용한다.
