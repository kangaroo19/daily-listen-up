# 04. 오늘 문제 조회와 홈 진입 분기 구현 결과

## 기준 문서

- Active 작업지시서: `docs/exec-plans/active/04-home-today-quiz-entry.md`
- 직전 완료 문서: `docs/exec-plans/completed/03-toss-login-session-result.md`
- MVP 기준: `docs/exec-plans/index.md`
- 제품 기준: `docs/product-specs/home.md`, `docs/product-specs/backend.md`, `docs/product-specs/quiz.md`, `docs/product-specs/result.md`
- UI 기준: `docs/design-docs/style-guidelines.md`

## 작업 체크리스트

- [x] 작업 시작 시 `docs/exec-plans/completed/03-toss-login-session-result.md`가 존재하면 먼저 읽고 앱 세션 저장 위치와 로그인 실패 처리 기준을 반영했다.
  - 근거: `src/services/appSession.ts`의 앱 세션 토큰 저장 위치와 `POST /api/login/toss` 성공 응답 `{ appSessionToken, expiresAt }` 기준을 확인했다.
- [x] 홈 화면 제목을 `오늘의 영어 듣고 포인트 받기`로 표시한다.
  - 근거: `src/screens/HomeScreen.tsx`.
- [x] 홈 화면 설명 `짧은 영어 음성을 듣고 문제를 맞히면 토스 포인트 보상에 도전할 수 있어요.`를 표시한다.
  - 근거: `src/screens/HomeScreen.tsx`.
- [x] 홈 화면 보조 설명 `하루에 한 문제만 제공돼요.`를 표시한다.
  - 근거: `src/screens/HomeScreen.tsx`.
- [x] 하단 주요 CTA `시작하기`를 TDS 우선 기준으로 배치한다.
  - 근거: `src/screens/HomeScreen.tsx`에서 `@toss/tds-mobile` `Button`을 사용한다.
- [x] `시작하기` 클릭 시 03번 작업의 로그인/앱 세션 확보 흐름을 호출한다.
  - 근거: `src/screens/HomeScreen.tsx`가 `startLogin({ requestTossLogin, postTossLogin })`을 호출한다.
- [x] 앱 세션 확보 후 `GET /api/check-today-quiz`를 호출한다.
  - 근거: `src/services/apiClient.ts`의 `getCheckTodayQuiz()`와 `src/screens/HomeScreen.tsx`의 호출 순서.
- [x] `hasTodayQuiz = false`이면 홈에 머무르고 `오늘의 문제가 아직 준비되지 않았어요.` 토스트를 보여준다.
  - 근거: `src/screens/HomeScreen.tsx`, `firebase:verify-home-entry` 검증의 empty quiz 케이스.
- [x] `hasTodayQuiz = true`이면 `GET /api/reward-status`를 호출한다.
  - 근거: `src/screens/HomeScreen.tsx`와 `functions/src/scripts/verifyHomeEntry.ts`.
- [x] `progressStatus`가 `not_started`, `wrong`, `retry_unlocked`이면 문제 풀이 화면 경로로 이동한다.
  - 근거: `src/screens/HomeScreen.tsx`가 `completed`가 아닌 상태에서 `onEnterQuiz()`를 호출한다. `verify:home-entry`는 `not_started`, `wrong`, `retry_unlocked` 응답을 검증한다.
- [x] `progressStatus = completed`이고 `rewardStatus = failed`이면 홈에 머무르고 `포인트 지급 확인이 필요해요` 토스트를 보여준다.
  - 근거: `src/screens/HomeScreen.tsx`, `verify:home-entry`의 completed failed 케이스.
- [x] `progressStatus = completed`이고 `rewardStatus`가 `failed`가 아니면 홈에 머무르고 `오늘 문제풀이를 완료했습니다` 토스트를 보여준다.
  - 근거: `src/screens/HomeScreen.tsx`, `verify:home-entry`의 completed success/pending 케이스.
- [x] 로그인 실패, 오늘 문제 확인 실패, 지급 상태 확인 실패 시 홈에 머무르고 제품 스펙의 실패 토스트를 보여준다.
  - 근거: `src/screens/HomeScreen.tsx`가 로그인 실패와 상태 확인 실패 메시지를 분리한다. `functions/src/api/checkTodayQuiz.ts`, `functions/src/api/rewardStatus.ts`는 세션 오류를 401, 조회 실패를 500으로 분리한다.
- [x] 요청 처리 중에는 `시작하기` 버튼을 비활성화해 중복 클릭을 막는다.
  - 근거: `src/screens/HomeScreen.tsx`의 `isStarting`, `loading`, `disabled`.

## 검증 체크리스트

- [x] 홈 화면이 모바일 WebView 기준으로 한 화면의 주요 목적과 하단 CTA를 명확히 보여준다.
  - 근거: 수동 dev server 실행 `npm run dev -- --host 0.0.0.0`, `http://127.0.0.1:5173/` HTTP 200 확인. 임시 화면 전환 nav와 `다음` 버튼은 `src/App.tsx`에서 제거했다.
- [x] `시작하기` 클릭 후 로그인, `GET /api/check-today-quiz`, `GET /api/reward-status`가 제품 스펙 순서대로 호출된다.
  - 근거: `src/screens/HomeScreen.tsx`의 `startLogin` -> `getCheckTodayQuiz` -> `getRewardStatus` 순서.
- [x] 오늘 문제가 없을 때 문제 풀이 화면으로 이동하지 않고 준비 중 토스트가 표시된다.
  - 근거: `functions/src/scripts/verifyHomeEntry.ts` empty quiz 케이스와 `src/screens/HomeScreen.tsx`.
- [x] `progressStatus = not_started`일 때 문제 풀이 화면으로 이동한다.
  - 근거: `src/screens/HomeScreen.tsx`와 `verify:home-entry` default status 응답.
- [x] `progressStatus = wrong`일 때 문제 풀이 화면으로 이동한다.
  - 근거: `src/screens/HomeScreen.tsx`와 `verify:home-entry` wrong status 응답.
- [x] `progressStatus = retry_unlocked`일 때 문제 풀이 화면으로 이동한다.
  - 근거: `src/screens/HomeScreen.tsx`와 `verify:home-entry` retry_unlocked status 응답.
- [x] `progressStatus = completed`, `rewardStatus = failed`일 때 홈에 머무르고 지급 실패 토스트가 표시된다.
  - 근거: `src/screens/HomeScreen.tsx`와 `verify:home-entry` completed failed 응답.
- [x] `progressStatus = completed`, `rewardStatus = success` 또는 `pending`일 때 홈에 머무르고 완료 토스트가 표시된다.
  - 근거: `src/screens/HomeScreen.tsx`와 `verify:home-entry` completed success/pending 응답.
- [x] 로그인 취소 또는 API 실패 시 홈에서 다시 시도할 수 있다.
  - 근거: `src/screens/HomeScreen.tsx`의 `catch/finally` 처리로 토스트 표시 후 `isStarting`을 해제한다.
- [x] 타입 검사, 프론트 빌드, 관련 테스트 또는 수동 검증이 통과한다.
  - 근거: `npm run typecheck`, `npm run build`, `npm --prefix functions run build`, `node --test ...`, `firebase emulators:exec --project daily-listen-up-dev --only firestore,functions "npm --prefix functions run verify:home-entry"` 통과.

## 변경 요약

- `GET /api/check-today-quiz`를 구현해 앱 세션 확인 후 KST 기준 오늘 공개 문제 존재 여부만 반환하게 했다.
- `GET /api/reward-status`를 구현해 앱 세션 기준으로 오늘 `progressStatus`, `rewardStatus`를 반환하게 했다.
- 홈 `시작하기` 흐름을 로그인 -> 오늘 문제 확인 -> 지급/진행 상태 확인 -> 문제 화면 진입 또는 토스트 표시 순서로 연결했다.
- 로컬 샘플 데이터 seed/verify 스크립트가 고정 날짜가 아니라 KST 오늘 날짜의 `quizzes/{quizDate}`와 `quiz-audio/{quizDate}/sample.mp3`를 사용하도록 맞췄다.
- 05번에서 이어받을 최소 문제 풀이 화면 전환 경로는 `App`의 `screen = 'quiz'` 상태다.

## 검증 결과

- `npm --prefix functions run build`: 통과.
- `node --test functions/lib/**/*.test.js`에 준하는 파일 목록 직접 실행: 통과, 7개 테스트.
- `firebase emulators:exec --project daily-listen-up-dev --only firestore,functions "npm --prefix functions run verify:home-entry"`: 통과. 세션 없음, 만료 세션, 오늘 문제 없음/있음, `not_started`, `wrong`, `retry_unlocked`, `completed` + `failed/success/pending` 상태를 확인했다.
- `npm run typecheck`: 통과.
- `npm run build`: 통과. 기존 Vite 번들 크기 경고는 유지됐다.
- `npm run firebase:seed && npm run firebase:verify-sample`: 통과. 현재 KST 날짜 `2026-05-31` 기준 샘플 문제와 오디오가 생성됨을 확인했다.
- `npm run dev -- --host 0.0.0.0`: 실행 확인. `http://127.0.0.1:5173/` 응답 200.
- 비밀값 검색: 실제 서버 비밀키, Toss access token, 원본 `userKey`, mTLS 인증서/개인키는 저장소에 추가되지 않았다. 클라이언트는 03번 기준의 앱 세션 토큰만 `sessionStorage`와 서버 API `Authorization` 헤더에 사용한다.

## 후속 참고 사항

- 05번은 `screen = 'quiz'`로 진입한 `QuizScreen`에서 `GET /api/today-quiz`를 호출해 문제 콘텐츠를 불러오면 된다.
- 앱 세션 토큰은 `src/services/appSession.ts`의 `getAppSessionToken()`으로 읽어 이후 서버 API의 `Authorization: Bearer ${token}` 헤더에 사용한다.
- `GET /api/today-quiz`는 아직 05번 경계로 남아 있으며, 오디오 재생/선택지 UI/답안 제출은 구현하지 않았다.
