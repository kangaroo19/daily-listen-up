# 13. 단일 선택 퀴즈 UI와 콘텐츠 정리

## 목적

사용자 앱 문제 풀이 화면에서 선택지를 한 번에 1개만 선택할 수 있게 한다.

Firebase Functions와 Firestore 필드명은 변경하지 않는다.
기존 서버 채점은 선택 답안 목록과 `correctChoiceIds`의 정확 일치 기준을 유지하므로, 단일 선택 UI 배포 전 오늘자와 예정 퀴즈의 정답 배열이 반드시 길이 1이어야 한다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/mvp/index.md`
- `docs/exec-plans/mvp/completed/12-banner-ad-result.md`
- `docs/product-specs/quiz.md`
- `docs/product-specs/backend.md`
- `docs/product-specs/admin.md`
- `src/screens/QuizScreen.tsx`
- `src/services/apiClient.ts`

## 범위

- 문제 풀이 화면의 선택 UI를 단일 선택으로 제한한다.
- 기존 `selectedChoiceIds: string[]` 요청 필드명은 유지한다.
- 프론트는 `selectedChoiceIds`에 선택지 ID 1개만 담아 `POST /api/answer-result`로 제출한다.
- 화면 제목과 선택 정책 문구를 단일 선택 기준으로 맞춘다.
- 서버의 `correctChoiceIds` 필드명, `lastSubmittedChoiceIds` 필드명, 정확 일치 채점 로직은 유지한다.
- 배포 전 운영 Firestore의 오늘자와 예정 공개 퀴즈 `correctChoiceIds` 길이를 확인하고 1개로 정리한다.

## 제외 범위

- `correctChoiceIds`, `selectedChoiceIds`, `lastSubmittedChoiceIds` 필드명을 단수형으로 바꾸지 않는다.
- Firestore 스키마와 필드명은 수정하지 않는다. 운영 퀴즈 문서의 `correctChoiceIds` 값 정리는 별도 수동 운영 작업으로 다룬다.
- Firebase Functions의 요청/응답 스키마를 바꾸지 않는다.
- 서버 채점 기준을 `includes` 방식으로 완화하지 않는다.
- 포인트 지급, 재도전, 스크립트 열람, 광고 정책은 변경하지 않는다.
- 관리자 앱 구현은 이 작업에서 수정하지 않는다. 관리자 앱 단일 정답 검증은 `docs/exec-plans/admin/active/10-admin-single-answer-validation.md`에서 다룬다.
- 이미 제출된 사용자 진행 기록의 과거 `lastSubmittedChoiceIds` 데이터는 마이그레이션하지 않는다.

## 확인 필요

- 오늘자 Firestore 퀴즈가 복수 정답이면 단일 선택 UI 배포 후 사용자가 정답을 맞힐 수 없다.
- 운영 Firestore 수정은 저장소 커밋만으로 끝나지 않는다. 배포 전 실제 프로젝트의 `quizzes/{quizDate}` 문서를 확인해야 한다.
- 정답 ID 1개를 고를 때는 콘텐츠 의미 기준으로 최종 정답을 확정해야 한다. 임의로 첫 번째 ID만 남기지 않는다.

## 작업 체크리스트

- [ ] 최신 `dev` 기준에서 `codex/13-single-choice-quiz-ui-and-content` 브랜치를 만든다.
- [ ] `docs/product-specs/quiz.md`와 `docs/product-specs/backend.md`의 단일 선택 기준과 기존 필드명 유지 기준을 확인한다.
- [ ] 직전 completed 문서 `docs/exec-plans/mvp/completed/12-banner-ad-result.md`가 있으면 읽고 배너 위치와 문제 풀이 화면 구조를 확인한다.
- [ ] `src/screens/QuizScreen.tsx`의 제목을 `정답을 골라주세요`로 변경한다.
- [ ] `QuizScreen`에서 선택지 클릭 시 `selectedChoiceIds`가 항상 `[choice.id]`가 되게 한다.
- [ ] 같은 선택지를 다시 눌렀을 때는 선택 해제하지 않고 아무 동작도 하지 않게 구현한다.
- [ ] 제출 버튼 활성 조건을 `selectedChoiceIds.length === 1` 기준으로 변경한다.
- [ ] `POST /api/answer-result` 호출 payload는 기존처럼 `{ quizDate, selectedChoiceIds }`를 보내되 `selectedChoiceIds.length === 1`만 허용한다.
- [ ] `src/services/apiClient.ts`의 타입은 `selectedChoiceIds: string[]`를 유지한다.
- [ ] 기존 서버 채점 로직 `functions/src/services/answerResult.ts`는 정확 일치 방식 그대로 유지한다.
- [ ] 기존 API 진입점 `functions/src/api/answerResult.ts`는 `selectedChoiceIds` 배열 요청 방식 그대로 유지한다.
- [ ] 운영 배포 전 Firestore `quizzes/{오늘 날짜}` 문서의 `correctChoiceIds.length`가 1인지 확인한다.
- [ ] 운영 배포 전 이후 공개 예정 퀴즈 문서의 `correctChoiceIds.length`가 1인지 확인한다.
- [ ] 복수 정답 운영 문서가 발견되면 콘텐츠 기준으로 정답 ID 1개만 남긴다.
- [ ] `npm --prefix functions run test`를 실행한다.
- [ ] `npm run typecheck`를 실행한다.
- [ ] `npm run build`를 실행한다.
- [ ] `docs/exec-plans/mvp/completed/13-single-choice-quiz-ui-and-content-result.md`를 작성한다.

## 검증 체크리스트

- [ ] 문제 풀이 화면 제목이 `정답을 골라주세요`로 표시된다.
- [ ] 선택지는 한 번에 1개만 선택된다.
- [ ] 다른 선택지를 누르면 기존 선택이 해제되고 새 선택지만 선택된다.
- [ ] 선택지가 없으면 제출할 수 없다.
- [ ] 선택지가 1개이면 제출할 수 있다.
- [ ] 답안 제출 요청의 필드명은 `selectedChoiceIds`로 유지된다.
- [ ] 답안 제출 요청의 `selectedChoiceIds` 길이는 항상 1이다.
- [ ] 서버의 `correctChoiceIds` 필드명은 유지된다.
- [ ] 서버의 정확 일치 채점 로직이 유지된다.
- [ ] 운영 Firestore 오늘자 퀴즈의 `correctChoiceIds` 길이 1 확인 결과가 completed 문서에 기록된다.
- [ ] 운영 Firestore 예정 공개 퀴즈의 `correctChoiceIds` 길이 1 확인 결과가 completed 문서에 기록된다.
- [ ] Functions 테스트가 통과한다.
- [ ] 타입 검사가 통과한다.
- [ ] 프론트 빌드가 통과하거나, 미실행 사유가 completed 문서에 기록된다.

## 완료 후 completed 문서 작성 기준

- `docs/exec-plans/mvp/completed/13-single-choice-quiz-ui-and-content-result.md`를 작성한다.
- 이 active 문서의 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- 각 체크 항목에는 근거가 되는 파일, 명령, 테스트 또는 수동 확인 결과를 짧게 기록한다.
- 완료하지 못한 항목은 체크하지 않고 미완료 사유와 후속 처리 기준을 적는다.
- Firestore 필드명과 API 필드명을 변경하지 않았고 배열 길이만 1로 제한했다는 점을 결과 요약에 포함한다.
- 운영 Firestore 오늘자와 예정 퀴즈의 `correctChoiceIds` 확인 또는 수정 결과를 명확히 기록한다.
