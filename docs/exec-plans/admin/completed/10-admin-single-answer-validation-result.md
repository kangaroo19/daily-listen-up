# 10. 관리자 단일 정답 검증 반영 결과

## 참조

- Active 작업지시서: `docs/exec-plans/admin/active/10-admin-single-answer-validation.md`
- 제품 스펙: `docs/product-specs/admin.md`, `docs/product-specs/backend.md`

## 작업 체크리스트

- [ ] 최신 `dev` 기준에서 `codex/10-admin-single-answer-validation` 브랜치를 만든다.
  - 미수행: 사용자 지시로 브랜치 생성과 dev 머지 없이 현재 브랜치에서 작업했다.
- [x] `docs/product-specs/admin.md`의 `correctChoiceIds` 단일 정답 기준을 확인한다.
  - 근거: 제품 스펙은 필드명 `correctChoiceIds`를 유지하고 MVP에서 정답 ID 1개만 담는 기준이다.
- [x] 직전 completed 문서 `docs/exec-plans/admin/completed/09-admin-user-list-result.md`가 있으면 읽고 현재 관리자 앱 구조를 확인한다.
  - 근거: 09번 이후 관리자 앱 구조에서 `QuizEditor`, 검증 모듈, JSON 가져오기 흐름을 확인했다.
- [x] `apps/admin/src/components/QuizEditor.tsx`에서 정답 선택 토글이 복수 누적 배열을 만들지 않게 한다.
  - 근거: `selectCorrectChoice()`가 선택한 ID를 `correctChoiceIds: [choiceId]`로 저장한다.
- [x] `QuizEditor`의 정답 입력 UI를 `type="radio"` 또는 동등한 단일 선택 컨트롤로 바꾼다.
  - 근거: 정답 입력을 `type="radio"`와 동일 `name="correct-choice"` 그룹으로 변경했다.
- [x] 정답 선택 핸들러는 선택한 ID를 `correctChoiceIds: [choiceId]`로 저장한다.
  - 근거: `apps/admin/src/components/QuizEditor.tsx`.
- [x] 진행 기록이 있는 퀴즈에서는 기존처럼 정답 입력이 비활성화되는지 확인한다.
  - 근거: 정답 radio 입력의 `disabled={hasProgress}` 조건을 유지했다.
- [x] `apps/admin/src/validation/quizValidation.ts`에서 `correctChoiceIds.length !== 1`이면 저장 오류를 반환한다.
  - 근거: `validateQuizForm()` 검증 조건과 `quizValidation.test.ts`.
- [x] 정답이 0개일 때와 2개 이상일 때 모두 `정답은 1개만 선택하세요.` 같은 단일 정답 오류 문구를 표시한다.
  - 근거: `quizValidation.test.ts`의 0개, 복수 정답 테스트.
- [x] `correctChoiceIds`에 `choices[].id`에 없는 값이 포함되면 기존처럼 저장을 막는다.
  - 근거: `quizValidation.ts`의 존재하지 않는 선택지 ID 검증 분기를 유지했다.
- [x] `apps/admin/src/validation/jsonQuizImport.ts`에서 `correctChoiceIds` 배열 길이가 정확히 1인지 검증한다.
  - 근거: `parseJsonQuizImport()`와 `jsonQuizImport.test.ts`.
- [x] JSON 가져오기 오류 문구를 `correctChoiceIds는 정답 id 1개만 포함해야 합니다.` 기준으로 바꾼다.
  - 근거: `jsonQuizImport.ts`.
- [x] JSON 가져오기 성공 시 폼 상태에는 기존 필드명 그대로 `correctChoiceIds: [choiceId]`가 채워진다.
  - 근거: `jsonQuizImport.test.ts`의 성공 케이스.
- [x] `apps/admin/src/styles.css`에 checkbox 전용 스타일명이 있다면 radio 입력에도 깨지지 않게 조정한다.
  - 근거: `.choice-row input[type='radio']` 스타일을 checkbox와 같은 크기로 적용했다.
- [x] `apps/admin/src/types/quiz.ts`의 필드명과 타입은 `correctChoiceIds: string[]`로 유지한다.
  - 근거: 타입 파일은 수정하지 않았다.
- [x] `npm --prefix apps/admin run typecheck`를 실행한다.
  - 근거: 통과.
- [x] `npm run admin:pages:build`를 실행한다.
  - 근거: 통과. Vite의 500kB 초과 chunk 경고는 출력됐지만 빌드는 성공했다.
- [x] `docs/exec-plans/admin/completed/10-admin-single-answer-validation-result.md`를 작성한다.
  - 근거: 이 문서.

## 검증 체크리스트

- [x] 새 퀴즈 작성 화면에서 정답은 한 번에 1개만 선택된다.
  - 근거: radio 그룹과 `selectCorrectChoice()` 구현.
- [x] 다른 선택지를 정답으로 고르면 기존 정답 선택이 해제된다.
  - 근거: `correctChoiceIds`를 항상 선택한 ID 1개 배열로 교체한다.
- [x] 정답을 0개로 저장하려고 하면 저장되지 않는다.
  - 근거: `quizValidation.test.ts`.
- [x] `correctChoiceIds`가 2개 이상인 폼 상태는 저장 검증에서 거부된다.
  - 근거: `quizValidation.test.ts`.
- [x] 저장 payload의 필드명은 `correctChoiceIds`이고 값은 길이 1 배열이다.
  - 근거: `toQuizPayload()`는 기존 필드명을 유지하고, 폼 검증과 UI가 길이 1을 보장한다.
- [x] JSON 가져오기는 `correctChoiceIds` 길이가 1일 때만 성공한다.
  - 근거: `jsonQuizImport.test.ts`.
- [x] JSON 가져오기는 `correctChoiceIds` 길이가 0 또는 2 이상이면 실패한다.
  - 근거: `jsonQuizImport.test.ts`.
- [x] 진행 기록이 있는 퀴즈에서는 정답 필드가 계속 잠겨 있다.
  - 근거: `QuizEditor`의 `disabled={hasProgress}` 조건 유지.
- [x] 기존 퀴즈 목록 조회, 상세 진입, 발행, 발행 해제 흐름이 깨지지 않는다.
  - 근거: 해당 흐름 코드는 수정하지 않았고, 관리자 Pages 빌드가 통과했다.
- [x] 관리자 타입 검사가 통과한다.
  - 근거: `npm --prefix apps/admin run typecheck` 통과.
- [x] 관리자 Pages 빌드가 통과하거나, 미실행 사유가 completed 문서에 기록된다.
  - 근거: `npm run admin:pages:build` 통과.

## 변경 요약

- 관리자 퀴즈 편집기의 정답 입력을 checkbox 복수 선택에서 radio 단일 선택으로 바꿨다.
- `correctChoiceIds` 필드명과 `string[]` 타입은 유지했다.
- 폼 저장 검증과 JSON 가져오기 검증에서 `correctChoiceIds.length === 1`만 허용하게 했다.
- 단일 정답 검증 테스트를 추가하고 `apps/admin`에 테스트 스크립트를 추가했다.

## 실행한 검증 명령

- `npm --prefix apps/admin run test`: 통과.
- `npm --prefix apps/admin run typecheck`: 통과.
- `npm run admin:pages:build`: 통과. Vite chunk size warning 출력.

## 후속 참고

- 오늘자 또는 예정 공개 퀴즈에 이미 복수 정답 `correctChoiceIds`가 저장되어 있으면, 사용자 앱 단일 선택 배포 전 별도 운영 절차로 정답 ID 1개만 남겨야 한다.
