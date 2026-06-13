# 03. 관리자 퀴즈 CRUD 편집기 구현

## 목적

관리자 앱에서 날짜별 퀴즈 문서를 조회, 등록, 수정, 미리보기할 수 있는 CRUD 편집기를 구현한다.

이 작업은 Firestore `quizzes/{quizDate}` 문서의 텍스트 데이터와 발행 전 검증을 다룬다. 오디오 Storage 업로드, TTS 미리듣기, 발행/삭제 정책의 최종 처리는 이후 작업에서 구현한다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/admin/index.md`
- `docs/exec-plans/admin/active/02-admin-auth-rules.md`
- `docs/product-specs/admin.md`
- `docs/design-docs/admin-dashboard-ui.md`
- `docs/operations/quiz-content-seeding.md`
- `docs/product-specs/backend.md`
- `functions/src/domain/models.ts`
- `functions/src/domain/collections.ts`

## 선행 조건

- 01번 작업으로 관리자 앱 구조가 준비되어 있어야 한다.
- 02번 작업으로 관리자 로그인과 Rules 접근 제어가 준비되어 있어야 한다.

## 범위

- 날짜별 퀴즈 목록을 조회한다.
- 퀴즈 목록/상세 2패널 대시보드 UI를 구현한다.
- 새 퀴즈 등록 폼을 구현한다.
- 기존 퀴즈 수정 폼을 구현한다.
- 미발행 저장을 구현한다.
- 퀴즈 상세 미리보기를 구현한다.
- 저장 전 검증을 구현한다.
- 같은 날짜 퀴즈가 있으면 신규 등록 대신 수정 흐름으로 안내한다.

## 제외 범위

- Firebase Storage mp3 업로드는 구현하지 않는다.
- ElevenLabs TTS 미리듣기는 구현하지 않는다.
- 발행, 발행 해제, 삭제, 진행 기록 기반 수정 제한은 최종 구현하지 않는다.
- 사용자 앱 Functions API를 변경하지 않는다.
- 부분 입력 초안 저장은 구현하지 않는다.

## 데이터 기준

관리자 앱은 아래 Firestore 문서를 직접 관리한다.

```text
quizzes/{quizDate}
```

퀴즈 문서 필드는 `docs/product-specs/admin.md`를 따른다.

- `quizDate`
- `isPublished`
- `audioStoragePath`
- `choices`
- `correctChoiceIds`
- `script`
- `promotionAmount`

미발행 저장도 완성된 퀴즈 저장이므로 필수 검증을 모두 통과해야 한다.

## 구현 지침

- 문서 ID와 `quizDate` 필드는 같은 값으로 저장한다.
- 신규 등록 시 같은 날짜 문서가 이미 있으면 새 문서를 만들지 않고 기존 상세를 열도록 안내한다.
- 선택지는 정확히 5개를 입력하게 한다.
- 선택지 ID는 안정적인 값으로 유지하고, 정답은 선택지 ID 기준으로 저장한다.
- `correctChoiceIds`는 `choices`에 존재하는 ID만 포함해야 한다.
- `promotionAmount`는 양수 정수만 허용한다.
- `audioStoragePath`는 04번 작업 전까지 기존 값 또는 업로드 완료된 값이 있어야 저장 가능하다는 검증 메시지를 준비한다.

## 작업 체크리스트

- [ ] 최신 `dev` 기준에서 `codex/03-admin-quiz-crud-editor` 브랜치를 만든다.
- [ ] 01번과 02번 completed 문서를 읽고 관리자 앱 구조와 인증 상태를 확인한다.
- [ ] `quizzes/{quizDate}` 목록 조회 모듈을 구현한다.
- [ ] 날짜별 퀴즈 목록 패널을 구현한다.
- [ ] 퀴즈 상세 편집 패널을 구현한다.
- [ ] 새 퀴즈 작성 상태를 구현한다.
- [ ] 기존 퀴즈 선택 시 상세 폼에 값을 채운다.
- [ ] 선택지 5개 입력 UI를 구현한다.
- [ ] 복수 정답 체크 UI를 구현한다.
- [ ] `script` 입력 UI를 구현한다.
- [ ] `promotionAmount` 입력 UI를 구현한다.
- [ ] 저장 전 검증 로직을 구현한다.
- [ ] Firestore에 미발행 퀴즈를 저장한다.
- [ ] 같은 날짜 문서가 있으면 신규 등록 대신 기존 문서 수정 안내를 표시한다.
- [ ] 사용자 앱 공개 응답에 포함되지 않아야 하는 필드를 관리자 앱 외부로 노출하지 않는지 확인한다.

## 검증 체크리스트

- [ ] `npm --prefix apps/admin run typecheck`가 통과한다.
- [ ] `npm --prefix apps/admin run build`가 통과한다.
- [ ] 관리자 로그인 후 퀴즈 목록이 조회된다.
- [ ] 새 퀴즈를 미발행 상태로 저장하면 `quizzes/{quizDate}` 문서가 생성된다.
- [ ] 기존 퀴즈를 선택하면 상세 폼에 값이 표시된다.
- [ ] 기존 퀴즈를 수정하면 같은 문서가 갱신된다.
- [ ] 잘못된 날짜 형식은 저장되지 않는다.
- [ ] 선택지가 5개가 아니면 저장되지 않는다.
- [ ] 정답이 0개이면 저장되지 않는다.
- [ ] `correctChoiceIds`에 존재하지 않는 선택지 ID가 포함되면 저장되지 않는다.
- [ ] `promotionAmount`가 양수 정수가 아니면 저장되지 않는다.
- [ ] 같은 날짜 문서가 있을 때 신규 등록으로 중복 문서를 만들지 않는다.

## 완료 후 결과 문서 작성 기준

- `docs/exec-plans/admin/completed/03-admin-quiz-crud-editor-result.md`를 작성한다.
- 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- Firestore 문서 생성/수정 검증 근거를 기록한다.
- 실제 운영 데이터나 비밀값은 결과 문서에 기록하지 않는다.

