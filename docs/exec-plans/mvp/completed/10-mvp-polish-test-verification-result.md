# 10. TDS UI 정리, 테스트, 빌드 검증, MVP 완료 체크 결과

## 기준 문서

- Active 작업지시서: `docs/exec-plans/active/10-mvp-polish-test-verification.md`
- 직전 완료 문서: `docs/exec-plans/completed/09-daily-completion-duplicate-guard-result.md`
- MVP 기준: `docs/exec-plans/index.md`
- 제품 기준: `docs/product-specs/home.md`, `docs/product-specs/quiz.md`, `docs/product-specs/result.md`, `docs/product-specs/backend.md`
- UI 기준: `docs/design-docs/style-guidelines.md`

## 작업 체크리스트

- [x] 작업 시작 시 `docs/exec-plans/completed/09-daily-completion-duplicate-guard-result.md`를 읽고 상태 전이 표, 테스트 데이터, 남은 확인 필요 항목을 반영했다.
  - 근거: completed 09의 completed 재진입, `/api/today-quiz` 409, `/api/answer-result` 409, 중복 보상 방지 후속 항목을 확인했다.
- [x] 홈 화면이 `docs/product-specs/home.md`의 목적, 문구, CTA, 토스트 기준을 따른다.
  - 근거: `src/screens/HomeScreen.tsx`.
- [x] 문제 풀이 화면이 `docs/product-specs/quiz.md`의 오디오 1회 재생, 5개 선택지, 복수응답, 제출 조건을 따른다.
  - 근거: `src/screens/QuizScreen.tsx`.
- [x] 결과 화면이 `docs/product-specs/result.md`의 정답, 오답, 완료, 포인트 상태, 재도전, 스크립트 보기 기준을 따른다.
  - 근거: `src/screens/ResultScreen.tsx`.
- [x] 서버 API가 `docs/product-specs/backend.md`의 앱 세션, `quizDate`, `progressStatus`, `rewardStatus`, 중복 지급 방지 기준을 따른다.
  - 근거: `functions/src/services/*`, `npm --prefix functions run test`, Emulator verify 스크립트.
- [x] TDS 컴포넌트를 우선 사용했는지 화면별로 점검했다.
  - 근거: `Button`, `useToast`, `AppTDSProvider` 사용 확인.
- [x] 한 화면에 하나의 주요 목적만 보이도록 UI 밀도와 배치를 정리했다.
  - 근거: 홈 CTA를 `home-bottom-action`으로 분리하고 공통 `.screen` 정렬을 상단 맥락 + 하단 액션 구조로 조정했다.
- [x] 주요 액션이 모바일 WebView 하단에서 명확하게 보이고 다른 콘텐츠와 겹치지 않게 정리했다.
  - 근거: `src/styles.css`의 `home-bottom-action`, `quiz-bottom-action`, `result-bottom-action`.
- [x] 정답, 오답, 완료, 재도전, 보상 상태가 서로 혼동되지 않게 문구와 시각 표현을 점검했다.
  - 근거: `src/screens/ResultScreen.tsx`, 제품 스펙 문구 대조.
- [x] 홈에서 로그인 성공 후 오늘 문제 있음/없음 분기를 검증했다.
  - 근거: `npm run firebase:verify-home-entry`.
- [x] 문제 풀이에서 오디오 자동 재생 방지와 1회 재생 제한을 검증했다.
  - 근거: `src/screens/QuizScreen.tsx`는 `<audio preload="metadata">`와 사용자 클릭 `audio.play()`만 사용하며 `hasStartedAudio` 이후 재생 버튼을 비활성화한다.
- [x] 복수응답 선택과 선택 0개 제출 비활성화를 검증했다.
  - 근거: `src/screens/QuizScreen.tsx`의 `selectedChoiceIds` 토글과 `canSubmit`.
- [x] 답안 제출 후 전면형 광고 `dismissed` 이벤트 이후에만 정답 검증 API가 호출되는지 검증했다.
  - 근거: `src/screens/QuizScreen.tsx`, `src/integrations/tossAds.ts`.
- [x] 정답 제출 후 포인트 지급 상태가 결과 화면과 홈 재진입에서 일관되게 보이는지 검증했다.
  - 근거: `src/screens/ResultScreen.tsx`, `src/screens/HomeScreen.tsx`, `npm run firebase:verify-home-entry`.
- [x] 오답 제출 후 보상형 광고 완료로 재도전하고, 재제출 시 재도전권이 소진되는지 검증했다.
  - 근거: `npm --prefix functions run test`, `npm run firebase:verify-answer-result`.
- [x] 정답과 오답 상태 모두에서 보상형 광고 완료 후 스크립트가 표시되는지 검증했다.
  - 근거: `src/screens/ResultScreen.tsx`, `functions/src/__tests__/rewardedAdComplete.test.ts`.
- [x] 완료 사용자가 홈 재진입 시 결과 화면이나 문제 풀이 화면으로 이동하지 않는지 검증했다.
  - 근거: `src/screens/HomeScreen.tsx`, `npm run firebase:verify-home-entry`.
- [x] 지급 실패 상태가 서버 기준으로 저장되고 홈 토스트와 결과 안내에서 확인되는지 검증했다.
  - 근거: `functions/src/__tests__/pointReward.test.ts`, `src/screens/HomeScreen.tsx`, `src/screens/ResultScreen.tsx`.
- [x] 같은 사용자와 같은 날짜에 중복 포인트 지급 요청이 발생하지 않는지 검증했다.
  - 근거: `functions/src/__tests__/pointReward.test.ts`.
- [x] API 실패, 광고 실패/취소, 문제 로딩 실패 상태에서 사용자가 다시 시도할 수 있는지 검증했다.
  - 근거: `HomeScreen` 토스트, `QuizScreen` 다시 시도 버튼, `ResultScreen` 광고 실패 토스트.
- [ ] Firebase Functions 배포 전 Toss mTLS 인증서/개인키가 Firebase Secret Manager로 주입되는지 확인하고, 로컬 파일 경로 기반 설정이 운영 배포에 사용되지 않게 정리한다.
  - 미완료 사유: 실제 Firebase 배포/Secret Manager 구성은 이 작업의 제외 범위다. MVP 출시 전 운영 배포 작업에서 Secret Manager 주입 방식과 배포 환경변수를 확정해야 한다.
- [x] 타입 검사, 테스트, 프론트 빌드, Functions 빌드 또는 Emulator 검증 명령을 실행했다.
  - 근거: 아래 검증 결과.
- [x] MVP 완료 여부와 남은 확인 필요 항목을 completed 문서에 기록했다.
  - 근거: 아래 MVP 완료 판단과 남은 확인 필요 항목.

## 검증 체크리스트

- [x] 홈, 문제 풀이, 결과 화면이 모바일 WebView 기준으로 주요 액션과 콘텐츠가 겹치지 않는다.
  - 근거: 하단 액션 CSS 구조, Vite 로컬 실행 DOM 확인.
- [x] 모든 화면에서 TDS 우선 원칙을 따르고 임의 디자인 시스템이 섞이지 않았다.
  - 근거: `@toss/tds-mobile`, `@toss/tds-mobile-ait` provider와 TDS Button/Toast 사용.
- [x] 제품 스펙의 핵심 문구와 토스트가 구현에 반영되어 있다.
  - 근거: `src/screens/*.tsx`.
- [x] 오늘 문제 없음 사용자는 홈에 머무르고 준비 중 토스트를 본다.
  - 근거: `HomeScreen`, `npm run firebase:verify-home-entry`.
- [x] 신규 사용자는 로그인 후 오늘 문제를 조회하고 문제 풀이 화면에 진입한다.
  - 근거: `HomeScreen`의 login/check/reward-status 흐름.
- [x] 사용자는 오디오를 1회 듣고 5개 선택지 중 여러 개를 선택할 수 있다.
  - 근거: `QuizScreen`, `npm run firebase:verify-today-quiz`.
- [x] 답안 제출은 전면형 광고 `dismissed` 이벤트 이후 서버 API로 처리된다.
  - 근거: `showTossAd('answer-result')` 이후 `postAnswerResult()`.
- [x] 정답 사용자는 `progressStatus = completed`가 되고 포인트 지급 상태를 확인한다.
  - 근거: `npm run firebase:verify-answer-result`, `pointReward.test.ts`.
- [x] 오답 사용자는 `progressStatus = wrong`이 되고 보상형 광고 완료 후 재도전할 수 있다.
  - 근거: `answerResult.test.ts`, `rewardedAdComplete.test.ts`.
- [x] 재도전 사용자는 `progressStatus = retry_unlocked`에서만 재제출할 수 있고 제출 시 재도전권이 소진된다.
  - 근거: `npm run firebase:verify-answer-result`.
- [x] 정답과 오답 상태 모두에서 스크립트는 보상형 광고 완료 후에만 표시된다.
  - 근거: `ResultScreen`, `rewardedAdComplete.test.ts`.
- [x] 완료 사용자는 홈 재진입 시 홈 토스트만 보고 결과 화면으로 이동하지 않는다.
  - 근거: `HomeScreen`, `npm run firebase:verify-home-entry`.
- [x] 당일 완료, 중복 보상 방지, 지급 실패 상태가 서버 기준 테스트 또는 Emulator 검증으로 확인된다.
  - 근거: `npm --prefix functions run test`, `npm run firebase:verify-home-entry`, `npm run firebase:verify-answer-result`, `npm run firebase:verify-today-quiz`.
- [ ] Toss mTLS 인증서/개인키가 클라이언트 번들, 저장소, 배포 산출물에 포함되지 않고 Firebase Secret Manager 기반 서버 비밀값으로만 사용된다.
  - 미완료 사유: 저장소에는 실제 인증서/키가 없고 `.env.example`은 서버 전용 빈 값만 포함하지만, Firebase Secret Manager 배포 설정은 아직 확인되지 않았다. 출시 전 필수 확인이다.
- [x] 타입 검사 명령이 통과한다.
  - 근거: `npm run typecheck`.
- [x] 프론트 빌드 명령이 통과한다.
  - 근거: `npm run build`.
- [x] Functions 빌드 또는 Emulator 검증 명령이 통과한다.
  - 근거: `npm --prefix functions run build`, Emulator verify 스크립트.
- [x] 전체 테스트 또는 수동 시나리오 검증 결과가 completed 문서에 근거와 함께 기록된다.
  - 근거: 이 문서의 검증 결과.

## 변경 요약

- 홈 CTA를 하단 액션 영역으로 분리해 문제 풀이/결과 화면과 같은 하단 액션 구조를 맞췄다.
- 공통 `.screen` 정렬을 상단 맥락 중심으로 조정했다.
- `verifyTodayQuiz` Emulator 스크립트에 completed 사용자의 `/api/today-quiz` 409 거부 검증을 추가했다.

## 검증 결과

- `npm run typecheck`: 통과.
- `npm --prefix functions run build`: 통과.
- `npm --prefix functions run test`: 통과, 32개 테스트.
- `npm run build`: 통과. Vite chunk size 경고는 기존처럼 발생했다.
- `npm run firebase:verify-home-entry`: 통과.
- `npm run firebase:verify-answer-result`: 통과.
- `npm run firebase:verify-today-quiz`: 통과, completed 사용자의 today-quiz 재조회 409 검증 포함.
- Vite 로컬 실행: `http://127.0.0.1:5175`에서 홈 화면 DOM 확인, 시작하기 버튼 하단 배치와 콘솔 오류 없음 확인.

## 남은 확인 필요 항목

- Firebase Functions 운영 배포 전 `TOSS_MTLS_CERT_PATH`, `TOSS_MTLS_KEY_PATH`를 로컬 파일 경로가 아니라 Firebase Secret Manager 기반으로 주입해야 한다.
- Toss SDK, Toss Ads, 비게임 프로모션 API의 검수/운영 전환 조건과 테스트 광고 ID 교체 기준은 Toss 운영 설정에서 확인해야 한다.
- 최종 심사 제출용 스크린샷, 개인정보/약관 표기, Toss 검수 제출 양식은 별도 작업으로 분리한다.
- 09번에서 남긴 Firestore 동시 요청 경합의 transaction 또는 `create()` 기반 원자성 강화는 운영 요구가 확정되면 별도 작업으로 분리한다.

## MVP 완료 판단

- 로컬 구현과 Emulator 검증 기준으로 홈, 문제 풀이, 결과, 서버 API 상태 전이, 당일 완료, 중복 보상 방지는 MVP 기준을 충족한다.
- 운영 배포/검수 기준으로는 Toss mTLS Secret Manager 구성, Toss 운영 설정, 심사 제출 자료 확인이 남아 있으므로 출시 전 별도 확인이 필요하다.
