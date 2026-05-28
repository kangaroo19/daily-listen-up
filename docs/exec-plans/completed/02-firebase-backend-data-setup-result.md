# 02. Firebase Functions/Firestore/Storage 기반 세팅 결과

## 기준 문서

- Active 작업지시서: `docs/exec-plans/active/02-firebase-backend-data-setup.md`
- 직전 완료 문서: `docs/exec-plans/completed/01-apps-in-toss-dev-setup-result.md`
- MVP 기준: `docs/exec-plans/index.md`
- 제품 기준: `docs/product-specs/backend.md`, `docs/product-specs/home.md`, `docs/product-specs/quiz.md`, `docs/product-specs/result.md`
- UI 기준: `docs/design-docs/style-guidelines.md`

## 작업 체크리스트

- [x] 작업 시작 시 `docs/exec-plans/completed/01-apps-in-toss-dev-setup-result.md`가 존재하면 먼저 읽고 앱 구조와 명령 기준을 반영했다.
  - 근거: 01번 completed 문서의 Vite 앱 구조, `src/config/clientEnv.ts`, `src/integrations/firebase.ts`, 기존 명령 기준을 확인했다.
- [x] Firebase Functions, Firestore, Storage, Emulator를 사용할 수 있는 프로젝트 파일과 실행 명령을 준비했다.
  - 근거: `.firebaserc`, `firebase.json`, `firestore.rules`, `storage.rules`, `firestore.indexes.json`, `functions/package.json`을 추가했다. 루트 `package.json`에 `functions:build`, `functions:test`, `firebase:emulators`, `firebase:seed`, `firebase:verify-sample` 명령을 추가했다.
- [x] Functions 코드는 프론트 프로젝트 내부의 별도 Express 서버가 아니라 Firebase Functions 기준으로 배치했다.
  - 근거: `functions/src/index.ts`에서 Firebase Functions v2 `onRequest` 함수 `api`를 export한다. 별도 프론트 Express 서버는 추가하지 않았다.
- [x] Firestore 컬렉션과 필드 이름은 `docs/product-specs/backend.md`의 초안을 우선해 정리했다.
  - 근거: `functions/src/domain/collections.ts`, `functions/src/domain/models.ts`에 `quizzes`, `users`, `appSessions`, `userProgress`, `rewardGrants`, `adRewardEvents`와 필드 타입을 정리했다.
- [x] KST 기준 오늘 날짜를 계산하는 서버 유틸리티 위치를 정하고 이후 API에서 재사용할 수 있게 했다.
  - 근거: `functions/src/utils/kstDate.ts`의 `getKstDateString()`을 추가했고 `functions/src/api/routes.ts`에서 사용한다.
- [x] 앱 세션 토큰 확인, 오늘 공개 문제 조회, Storage 오디오 URL 생성 로직을 이후 API에서 붙일 수 있는 경계로 분리했다.
  - 근거: 앱 세션은 `functions/src/services/sessionBoundary.ts`, 공개 문제 조회는 `functions/src/repositories/quizRepository.ts`, Storage URL 생성 경계는 `functions/src/services/storageBoundary.ts`에 분리했다.
- [x] `GET /api/check-today-quiz`, `GET /api/today-quiz`, `GET /api/reward-status`, `POST /api/login/toss`, `POST /api/answer-result`, `POST /api/rewarded-ad-complete` 후보의 진입점 또는 라우팅 기준을 준비했다.
  - 근거: `functions/src/api/routes.ts`에 후보 API 라우팅을 추가했다. 실제 제품 로직은 03번 이후 작업 번호를 담은 `501 not_implemented` 경계 응답으로 남겼다.
- [x] 로컬 Emulator에서 사용할 샘플 퀴즈는 정답, 스크립트, 포인트 금액이 클라이언트 공개 응답에 섞이지 않게 준비했다.
  - 근거: `functions/src/sample/sampleQuiz.ts`에는 서버 전용 필드가 포함되어 있고, `functions/src/services/quizPublic.ts`의 `toPublicTodayQuiz()`는 `quizDate`, `audioUrl`, `choices`만 반환한다.
- [x] 환경 변수 예시에서 서버 전용 비밀값과 공개 가능한 클라이언트 값의 구분을 유지했다.
  - 근거: `.env.example`의 `VITE_` 클라이언트 값 구분을 유지하고, 서버 전용 예시 `FIREBASE_PROJECT_ID`, `TOSS_CLIENT_SECRET`, `TOSS_PROMOTION_SECRET`은 `VITE_` prefix 없이 빈 값으로 추가했다.

## 검증 체크리스트

- [x] Firebase Emulator가 로컬에서 실행된다.
  - 근거: `firebase emulators:exec --project daily-listen-up-dev --only firestore,storage "npm --prefix functions run seed:sample && npm --prefix functions run verify:sample"` 실행 성공. Firestore, Storage Emulator가 시작되고 스크립트가 exit code 0으로 종료됐다.
- [x] Functions 로컬 엔드포인트 또는 함수 진입점이 빈 화면/런타임 오류 없이 로드된다.
  - 근거: `firebase emulators:exec --project daily-listen-up-dev --only functions 'node -e "...fetch(.../api/api/today-quiz)..."'` 실행 성공. Functions Emulator가 `api` 함수를 로드했고 `GET /api/today-quiz`가 501 JSON 경계 응답을 반환했다.
- [x] Firestore 샘플 퀴즈 데이터에 `quizDate`, `isPublished`, `audioStoragePath`, `choices`, `correctChoiceIds`, `script`, `promotionAmount` 기준이 반영되어 있다.
  - 근거: `functions/src/sample/sampleQuiz.ts`와 `npm --prefix functions run verify:sample` 결과에서 `Verified quizzes/2026-05-28`를 확인했다.
- [x] `GET /api/today-quiz`에서 나중에 반환할 공개 데이터와 서버 전용 데이터의 경계가 코드 또는 문서에 명확하다.
  - 근거: `functions/src/services/quizPublic.ts`는 공개 응답을 `quizDate`, `audioUrl`, `choices`로 제한한다. `functions/src/__tests__/quizPublic.test.ts`가 `correctChoiceIds`, `script`, `promotionAmount`, `audioStoragePath` 제외를 검증한다.
- [x] Storage 오디오 파일 경로는 Firestore에 경로로만 저장되고, 클라이언트 공개 URL 생성은 서버 경계에서 처리하도록 정리되어 있다.
  - 근거: `functions/src/sample/sampleQuiz.ts`는 `audioStoragePath`만 저장한다. `functions/src/scripts/seedSampleData.ts`는 같은 경로로 Storage Emulator에 샘플 오디오 객체를 업로드한다. `functions/src/services/storageBoundary.ts`에 공개 URL 생성 경계를 분리했다.
- [x] 타입 검사 또는 Functions 빌드 검증 명령이 통과한다.
  - 근거: `npm run typecheck`, `npm run build`, `npm run functions:test` 통과. `npm run build`는 기존과 같은 Vite 번들 크기 경고가 있었으나 exit code 0이었다.
- [x] 저장소에 Firebase 서비스 계정 키, Toss 비밀키, 운영 토큰이 추가되지 않았다.
  - 근거: `rg -n "service_account|private_key|BEGIN PRIVATE|TOSS_CLIENT_SECRET=.+|TOSS_PROMOTION_SECRET=.+|accessToken|access_token|refreshToken|refresh_token|rawUserKey|userKey" -S . --glob '!node_modules/**' --glob '!functions/node_modules/**' --glob '!dist/**' --glob '!functions/lib/**' --glob '!package-lock.json' --glob '!functions/package-lock.json'` 실행. 실제 비밀값은 없고 문서/예시/서버 전용 경계 라벨만 확인됐다.

## 변경 요약

- Firebase Emulator 설정과 placeholder project id `daily-listen-up-dev`를 추가했다.
- Firebase Functions v2 기반 `api` 함수와 6개 후보 API 라우팅 경계를 추가했다.
- Firestore 컬렉션/필드 타입, KST 날짜 유틸리티, 세션/Storage/퀴즈 조회 경계 위치를 만들었다.
- Emulator용 샘플 퀴즈 seed/verify 스크립트와 Storage 샘플 객체 업로드 기준을 추가했다.
- 서버 전용 비밀값은 빈 환경 변수 예시로만 남기고 저장소에 실제 값을 추가하지 않았다.

## 검증 결과

- `npm --prefix functions test`: 통과. KST 날짜 계산과 공개 퀴즈 응답 필드 경계를 검증했다.
- `firebase emulators:exec --project daily-listen-up-dev --only firestore,storage "npm --prefix functions run seed:sample && npm --prefix functions run verify:sample"`: 통과. 샘플 Firestore 문서와 Storage 객체를 확인했다.
- `firebase emulators:exec --project daily-listen-up-dev --only functions 'node -e "...fetch(.../api/api/today-quiz)..."'`: 통과. Functions `api` 엔드포인트가 런타임 오류 없이 501 JSON 경계 응답을 반환했다.
- `npm run typecheck`: 통과.
- `npm run build`: 통과. Vite 번들 크기 경고는 01번과 동일하게 남아 있으며 02번 범위에서는 빌드 설정을 바꾸지 않았다.
- 비밀값 검색: 실제 Firebase 서비스 계정 키, Toss 비밀키, 운영 토큰은 추가되지 않았다.

## 후속 참고 사항

- 03번은 `functions/src/services/sessionBoundary.ts`의 `requireAppSession()`과 `POST /api/login/toss` 라우팅 경계를 실제 Toss 로그인/앱 세션 발급 로직으로 채우면 된다.
- `GET /api/today-quiz` 구현 시 `functions/src/services/quizPublic.ts`의 공개 응답 경계를 유지해야 한다.
- Storage 공개 URL 생성은 `functions/src/services/storageBoundary.ts`에서 처리하고, Firestore에는 계속 `audioStoragePath`만 저장한다.
- 로컬 Node가 24라 Functions Emulator 실행 중 Node 20 엔진 경고가 표시됐다. Firebase Functions 배포 런타임은 `functions/package.json`의 `engines.node = 20` 기준으로 유지했다.
