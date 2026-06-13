# 03. 관리자 퀴즈 CRUD 편집기 구현 결과

## 요약

관리자 앱에 Firestore `quizzes/{quizDate}` 목록 조회, 신규 미발행 저장, 기존 문서 수정, 상세 편집 폼, 미리보기를 추가했다.
오디오 업로드와 TTS 미리듣기, 발행/삭제 정책은 후속 작업 범위로 남겼다.

## 작업 체크리스트

- [x] 최신 `dev` 기준에서 `codex/03-admin-quiz-crud-editor` 브랜치를 만든다. 근거: `git checkout -b codex/03-admin-quiz-crud-editor`
- [x] 01번과 02번 completed 문서를 읽고 관리자 앱 구조와 인증 상태를 확인한다. 근거: `completed/01`, `completed/02` 확인
- [x] `quizzes/{quizDate}` 목록 조회 모듈을 구현한다. 근거: `apps/admin/src/services/quizzes.ts`, `apps/admin/src/hooks/useQuizzes.ts`
- [x] 날짜별 퀴즈 목록 패널을 구현한다. 근거: `apps/admin/src/components/QuizList.tsx`
- [x] 퀴즈 상세 편집 패널을 구현한다. 근거: `apps/admin/src/components/QuizEditor.tsx`
- [x] 새 퀴즈 작성 상태를 구현한다. 근거: `createEmptyQuizForm`, `새로 작성`, `새 퀴즈`
- [x] 기존 퀴즈 선택 시 상세 폼에 값을 채운다. 근거: `quizToFormState(selectedQuiz)`
- [x] 선택지 5개 입력 UI를 구현한다. 근거: `defaultChoiceIds` 5개 기반 렌더링
- [x] 복수 정답 체크 UI를 구현한다. 근거: `correctChoiceIds` checkbox 토글
- [x] `script` 입력 UI를 구현한다. 근거: `textarea`
- [x] `promotionAmount` 입력 UI를 구현한다. 근거: number input
- [x] 저장 전 검증 로직을 구현한다. 근거: `apps/admin/src/validation/quizValidation.ts`
- [x] Firestore에 미발행 퀴즈를 저장한다. 근거: `saveQuiz()`가 `isPublished: false` payload를 `quizzes/{quizDate}`에 `setDoc`
- [x] 같은 날짜 문서가 있으면 신규 등록 대신 기존 문서 수정 안내를 표시한다. 근거: `quizExists()`와 `notice`
- [x] 사용자 앱 공개 응답에 포함되지 않아야 하는 필드를 관리자 앱 외부로 노출하지 않는지 확인한다. 근거: 기존 사용자 앱 `src/`와 Functions API 미수정

## 검증 체크리스트

- [x] `npm --prefix apps/admin run typecheck`가 통과한다. 근거: 종료 코드 0
- [x] `npm --prefix apps/admin run build`가 통과한다. 근거: 종료 코드 0, Firebase SDK chunk size 경고 출력
- [ ] 관리자 로그인 후 퀴즈 목록이 조회된다. 근거: 실제 Firebase 환경값과 관리자 계정이 필요해 로컬 자동 검증은 미수행. 구현 근거는 `subscribeToQuizzes()`
- [ ] 새 퀴즈를 미발행 상태로 저장하면 `quizzes/{quizDate}` 문서가 생성된다. 근거: 실제 Firebase 환경값과 관리자 계정이 필요해 로컬 자동 검증은 미수행. 구현 근거는 `saveQuiz()`
- [ ] 기존 퀴즈를 선택하면 상세 폼에 값이 표시된다. 근거: 실제 Firebase 데이터가 필요해 로컬 자동 검증은 미수행. 구현 근거는 `quizToFormState(selectedQuiz)`
- [ ] 기존 퀴즈를 수정하면 같은 문서가 갱신된다. 근거: 실제 Firebase 환경값과 관리자 계정이 필요해 로컬 자동 검증은 미수행. 구현 근거는 `setDoc(doc(db, 'quizzes', quizDate), payload)`
- [x] 잘못된 날짜 형식은 저장되지 않는다. 근거: `validateQuizForm`
- [x] 선택지가 5개가 아니면 저장되지 않는다. 근거: `validateQuizForm`
- [x] 정답이 0개이면 저장되지 않는다. 근거: `validateQuizForm`
- [x] `correctChoiceIds`에 존재하지 않는 선택지 ID가 포함되면 저장되지 않는다. 근거: `validateQuizForm`
- [x] `promotionAmount`가 양수 정수가 아니면 저장되지 않는다. 근거: `validateQuizForm`
- [x] 같은 날짜 문서가 있을 때 신규 등록으로 중복 문서를 만들지 않는다. 근거: `quizExists()` 후 수정 흐름 안내

## 검증 결과

- `npm --prefix apps/admin run typecheck`: 통과
- `npm --prefix apps/admin run build`: 통과. Firebase SDK 포함으로 Vite chunk size 경고가 출력됨
- `npm run build`: 통과. 기존 chunk size 경고와 Node DEP0190 경고는 출력됨
- Browser `http://127.0.0.1:4174`: Firebase 환경변수 미설정 상태에서 로그인 화면과 설정 누락 메시지가 표시되고, 관리자 대시보드는 노출되지 않음
- Firestore 실제 생성/수정/조회 검증은 운영 Firebase 환경값과 관리자 계정이 필요해 수행하지 않았다.
