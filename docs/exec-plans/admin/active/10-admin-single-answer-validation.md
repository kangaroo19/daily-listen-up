# 10. 관리자 단일 정답 검증 반영

## 목적

관리자 앱에서 새 퀴즈와 기존 퀴즈를 저장할 때 `correctChoiceIds` 배열에 정답 ID가 정확히 1개만 들어가도록 제한한다.

제품 스펙은 단일 선택 퀴즈로 바뀌었지만 Firestore 필드명과 타입은 유지한다.
따라서 관리자 앱은 `correctChoiceIds: array<string>` 구조를 그대로 사용하되, 운영자가 복수 정답을 저장할 수 없게 해야 한다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/admin/index.md`
- `docs/exec-plans/admin/completed/09-admin-user-list-result.md`
- `docs/product-specs/admin.md`
- `docs/product-specs/backend.md`
- `docs/design-docs/admin-dashboard-ui.md`
- `apps/admin/src/components/QuizEditor.tsx`
- `apps/admin/src/types/quiz.ts`
- `apps/admin/src/validation/quizValidation.ts`
- `apps/admin/src/validation/jsonQuizImport.ts`

## 범위

- 관리자 퀴즈 편집기의 정답 선택 UI를 복수 체크박스에서 단일 선택 방식으로 바꾼다.
- `correctChoiceIds` 필드명과 `string[]` 타입은 유지한다.
- 정답 선택 시 `correctChoiceIds`는 항상 길이 1 배열이 되게 한다.
- 저장 검증에서 `correctChoiceIds.length === 1`만 허용한다.
- JSON 가져오기 검증에서 `correctChoiceIds`가 배열이고 길이가 정확히 1인지 확인한다.
- 진행 기록이 있는 퀴즈의 정답 잠금 정책은 유지한다.
- 관리자 앱에서 기존 복수 정답 데이터가 보일 때 저장 전 정답 1개 선택을 요구한다.

## 제외 범위

- Firestore 필드명을 `correctChoiceId`로 바꾸지 않는다.
- Firebase Functions API와 사용자 앱 `src/`는 이 작업에서 수정하지 않는다.
- 운영 Firestore 데이터 일괄 마이그레이션은 이 작업에서 수행하지 않는다.
- 기존 진행 기록이 있는 퀴즈의 수정 잠금 정책을 완화하지 않는다.
- 관리자 앱의 전체 화면 구조, 사이드바, 배포 설정은 변경하지 않는다.

## 확인 필요

- 진행 기록이 있는 퀴즈는 기존 정책상 `correctChoiceIds` 수정이 잠긴다. 오늘자 공개 퀴즈에 이미 진행 기록이 있고 복수 정답이라면 관리자 앱이 아니라 별도 운영 절차로 정답 ID 1개만 남겨야 한다.
- JSON 가져오기 운영 포맷이 외부 도구에 공유되어 있다면 `correctChoiceIds` 배열은 유지하지만 길이 1만 허용한다고 안내해야 한다.
- 관리자 앱의 UI는 단일 선택이어도 저장 payload는 계속 `correctChoiceIds: [choiceId]` 형태여야 한다.

## 작업 체크리스트

- [ ] 최신 `dev` 기준에서 `codex/10-admin-single-answer-validation` 브랜치를 만든다.
- [ ] `docs/product-specs/admin.md`의 `correctChoiceIds` 단일 정답 기준을 확인한다.
- [ ] 직전 completed 문서 `docs/exec-plans/admin/completed/09-admin-user-list-result.md`가 있으면 읽고 현재 관리자 앱 구조를 확인한다.
- [ ] `apps/admin/src/components/QuizEditor.tsx`에서 정답 선택 토글이 복수 누적 배열을 만들지 않게 한다.
- [ ] `QuizEditor`의 정답 입력 UI를 `type="radio"` 또는 동등한 단일 선택 컨트롤로 바꾼다.
- [ ] 정답 선택 핸들러는 선택한 ID를 `correctChoiceIds: [choiceId]`로 저장한다.
- [ ] 진행 기록이 있는 퀴즈에서는 기존처럼 정답 입력이 비활성화되는지 확인한다.
- [ ] `apps/admin/src/validation/quizValidation.ts`에서 `correctChoiceIds.length !== 1`이면 저장 오류를 반환한다.
- [ ] 정답이 0개일 때와 2개 이상일 때 모두 `정답은 1개만 선택하세요.` 같은 단일 정답 오류 문구를 표시한다.
- [ ] `correctChoiceIds`에 `choices[].id`에 없는 값이 포함되면 기존처럼 저장을 막는다.
- [ ] `apps/admin/src/validation/jsonQuizImport.ts`에서 `correctChoiceIds` 배열 길이가 정확히 1인지 검증한다.
- [ ] JSON 가져오기 오류 문구를 `correctChoiceIds는 정답 id 1개만 포함해야 합니다.` 기준으로 바꾼다.
- [ ] JSON 가져오기 성공 시 폼 상태에는 기존 필드명 그대로 `correctChoiceIds: [choiceId]`가 채워진다.
- [ ] `apps/admin/src/styles.css`에 checkbox 전용 스타일명이 있다면 radio 입력에도 깨지지 않게 조정한다.
- [ ] `apps/admin/src/types/quiz.ts`의 필드명과 타입은 `correctChoiceIds: string[]`로 유지한다.
- [ ] `npm --prefix apps/admin run typecheck`를 실행한다.
- [ ] `npm run admin:pages:build`를 실행한다.
- [ ] `docs/exec-plans/admin/completed/10-admin-single-answer-validation-result.md`를 작성한다.

## 검증 체크리스트

- [ ] 새 퀴즈 작성 화면에서 정답은 한 번에 1개만 선택된다.
- [ ] 다른 선택지를 정답으로 고르면 기존 정답 선택이 해제된다.
- [ ] 정답을 0개로 저장하려고 하면 저장되지 않는다.
- [ ] `correctChoiceIds`가 2개 이상인 폼 상태는 저장 검증에서 거부된다.
- [ ] 저장 payload의 필드명은 `correctChoiceIds`이고 값은 길이 1 배열이다.
- [ ] JSON 가져오기는 `correctChoiceIds` 길이가 1일 때만 성공한다.
- [ ] JSON 가져오기는 `correctChoiceIds` 길이가 0 또는 2 이상이면 실패한다.
- [ ] 진행 기록이 있는 퀴즈에서는 정답 필드가 계속 잠겨 있다.
- [ ] 기존 퀴즈 목록 조회, 상세 진입, 발행, 발행 해제 흐름이 깨지지 않는다.
- [ ] 관리자 타입 검사가 통과한다.
- [ ] 관리자 Pages 빌드가 통과하거나, 미실행 사유가 completed 문서에 기록된다.

## 완료 후 결과 문서 작성 기준

- `docs/exec-plans/admin/completed/10-admin-single-answer-validation-result.md`를 작성한다.
- 이 active 문서의 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- 각 체크 항목에는 근거가 되는 파일, 명령, 테스트 또는 수동 확인 결과를 짧게 기록한다.
- 완료하지 못한 항목은 체크하지 않고 미완료 사유와 후속 처리 기준을 적는다.
- Firestore 필드명을 변경하지 않았고 `correctChoiceIds` 배열 길이만 1로 제한했다는 점을 결과 요약에 포함한다.
