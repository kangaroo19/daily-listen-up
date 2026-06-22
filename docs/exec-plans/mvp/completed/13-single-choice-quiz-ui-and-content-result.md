# 13. 단일 선택 퀴즈 UI와 콘텐츠 정리 결과

## 참조

- Active 작업지시서: `docs/exec-plans/mvp/active/13-single-choice-quiz-ui-and-content.md`
- 제품 스펙: `docs/product-specs/quiz.md`, `docs/product-specs/backend.md`
- 직전 완료 문서: `docs/exec-plans/mvp/completed/12-banner-ad-result.md`

## 작업 체크리스트

- [ ] 최신 `dev` 기준에서 `codex/13-single-choice-quiz-ui-and-content` 브랜치를 만든다.
  - 미수행: 사용자 지시로 브랜치 생성 없이 현재 브랜치에서 작업했다.
- [x] `docs/product-specs/quiz.md`와 `docs/product-specs/backend.md`의 단일 선택 기준과 기존 필드명 유지 기준을 확인한다.
  - 근거: 제품 스펙은 단일 선택 UI, 기존 `selectedChoiceIds` 배열 필드 유지, `correctChoiceIds` 길이 1 운영 기준을 설명한다.
- [x] 직전 completed 문서 `docs/exec-plans/mvp/completed/12-banner-ad-result.md`가 있으면 읽고 배너 위치와 문제 풀이 화면 구조를 확인한다.
  - 근거: `TossBannerAd`는 기존처럼 선택지 목록 이후, 제출 CTA 이전에 유지했다.
- [x] `src/screens/QuizScreen.tsx`의 제목을 `정답을 골라주세요`로 변경한다.
  - 근거: `QuizScreen` 제목 변경.
- [x] `QuizScreen`에서 선택지 클릭 시 `selectedChoiceIds`가 항상 `[choice.id]`가 되게 한다.
  - 근거: `selectSingleChoiceId()`와 `QuizScreen`의 선택 핸들러.
- [x] 같은 선택지를 다시 눌렀을 때는 선택 해제하지 않고 아무 동작도 하지 않게 구현한다.
  - 근거: `selectSingleChoiceId()`가 같은 선택지 재선택 시 기존 배열 참조를 그대로 반환한다.
- [x] 제출 버튼 활성 조건을 `selectedChoiceIds.length === 1` 기준으로 변경한다.
  - 근거: `QuizScreen`의 `canSubmit`.
- [x] `POST /api/answer-result` 호출 payload는 기존처럼 `{ quizDate, selectedChoiceIds }`를 보내되 `selectedChoiceIds.length === 1`만 허용한다.
  - 근거: `submissionBoundary` 필드명은 유지했고, 제출 가능 조건이 길이 1을 요구한다.
- [x] `src/services/apiClient.ts`의 타입은 `selectedChoiceIds: string[]`를 유지한다.
  - 근거: 해당 파일은 수정하지 않았다.
- [x] 기존 서버 채점 로직 `functions/src/services/answerResult.ts`는 정확 일치 방식 그대로 유지한다.
  - 근거: Functions 소스는 수정하지 않았다.
- [x] 기존 API 진입점 `functions/src/api/answerResult.ts`는 `selectedChoiceIds` 배열 요청 방식 그대로 유지한다.
  - 근거: Functions 소스는 수정하지 않았다.
- [ ] 운영 배포 전 Firestore `quizzes/{오늘 날짜}` 문서의 `correctChoiceIds.length`가 1인지 확인한다.
  - 미수행: 운영 Firestore 확인은 별도 수동 운영 작업으로 남겼다.
- [ ] 운영 배포 전 이후 공개 예정 퀴즈 문서의 `correctChoiceIds.length`가 1인지 확인한다.
  - 미수행: 운영 Firestore 확인은 별도 수동 운영 작업으로 남겼다.
- [ ] 복수 정답 운영 문서가 발견되면 콘텐츠 기준으로 정답 ID 1개만 남긴다.
  - 미수행: 운영 Firestore 수정은 별도 수동 운영 작업으로 남겼다.
- [ ] `npm --prefix functions run test`를 실행한다.
  - 미수행: Functions 소스는 수정하지 않았고, 현재 환경에서 shell 기반 npm 실행이 불가능했다.
- [x] `npm run typecheck`를 실행한다.
  - 근거: shell 실행이 불가능해 TypeScript compiler API로 루트 `tsconfig.json` 기준 타입 검사를 수행했고 통과했다.
- [ ] `npm run build`를 실행한다.
  - 미수행: 현재 환경에서 shell 기반 빌드 명령 실행이 불가능했다.
- [x] `docs/exec-plans/mvp/completed/13-single-choice-quiz-ui-and-content-result.md`를 작성한다.
  - 근거: 이 문서.

## 검증 체크리스트

- [x] 문제 풀이 화면 제목이 `정답을 골라주세요`로 표시된다.
  - 근거: `src/screens/QuizScreen.tsx`.
- [x] 선택지는 한 번에 1개만 선택된다.
  - 근거: `src/screens/quizSelection.ts`와 `src/screens/quizSelection.test.ts`.
- [x] 다른 선택지를 누르면 기존 선택이 해제되고 새 선택지만 선택된다.
  - 근거: `selectSingleChoiceId(['choice-a'], 'choice-b')` 검증.
- [x] 선택지가 없으면 제출할 수 없다.
  - 근거: `canSubmit`이 `selectedChoiceIds.length === 1`을 요구한다.
- [x] 선택지가 1개이면 제출할 수 있다.
  - 근거: `canSubmit`이 `selectedChoiceIds.length === 1`을 요구한다.
- [x] 답안 제출 요청의 필드명은 `selectedChoiceIds`로 유지된다.
  - 근거: `submissionBoundary`와 `apiClient` 타입 유지.
- [x] 답안 제출 요청의 `selectedChoiceIds` 길이는 항상 1이다.
  - 근거: 단일 선택 helper와 제출 가능 조건.
- [x] 서버의 `correctChoiceIds` 필드명은 유지된다.
  - 근거: Functions 소스 미수정.
- [x] 서버의 정확 일치 채점 로직이 유지된다.
  - 근거: Functions 소스 미수정.
- [ ] 운영 Firestore 오늘자 퀴즈의 `correctChoiceIds` 길이 1 확인 결과가 completed 문서에 기록된다.
  - 미수행: 운영 Firestore 확인은 별도 수동 운영 작업으로 남겼다.
- [ ] 운영 Firestore 예정 공개 퀴즈의 `correctChoiceIds` 길이 1 확인 결과가 completed 문서에 기록된다.
  - 미수행: 운영 Firestore 확인은 별도 수동 운영 작업으로 남겼다.
- [ ] Functions 테스트가 통과한다.
  - 미수행: Functions 소스는 수정하지 않았고, 현재 환경에서 shell 기반 npm 실행이 불가능했다.
- [x] 타입 검사가 통과한다.
  - 근거: TypeScript compiler API 검사 통과.
- [ ] 프론트 빌드가 통과하거나, 미실행 사유가 completed 문서에 기록된다.
  - 미수행: 현재 환경에서 shell 기반 빌드 명령 실행이 불가능했다.

## 변경 요약

- `QuizScreen`의 문제 제목을 단일 선택 문구로 변경했다.
- 선택 상태 계산을 `selectSingleChoiceId()`로 분리했다.
- 선택지 클릭 시 `selectedChoiceIds`는 항상 길이 1 배열이 되며, 같은 선택지 재클릭은 선택 해제 없이 no-op 처리된다.
- 제출 가능 조건을 `selectedChoiceIds.length === 1`로 강화했다.
- API 요청 필드명과 서버/Firestore 필드명은 변경하지 않았다.

## 실행한 검증

- `src/screens/quizSelection.test.ts`의 선택 상태 assertion 4개 통과.
- TypeScript compiler API로 루트 `tsconfig.json` 기준 타입 검사 통과.

## 미실행 검증과 이유

- `npm --prefix functions run test`: Functions 소스를 수정하지 않았고, 현재 환경에서 shell 기반 npm 실행이 불가능했다.
- `npm run build`: 현재 환경에서 shell 기반 빌드 명령 실행이 불가능했다.
- 운영 Firestore `correctChoiceIds` 확인/수정: 별도 수동 운영 작업으로 남겼다.
