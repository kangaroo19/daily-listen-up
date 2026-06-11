# 01. 관리자페이지 v1 구현

## Goal Mode Prompt

아래 목표를 `/goal`에 그대로 넣고 작업한다.

```text
docs/product-specs/admin.md 기준으로 관리자페이지 v1을 구현한다.

Context:
- 관리자 앱은 apps/admin 독립 React/Vite 앱이다.
- 기존 Toss 미니앱 src/에는 관리자 화면을 넣지 않는다.
- 관리자 CRUD와 최종 mp3 업로드는 Firebase Client SDK로 처리한다.
- ElevenLabs TTS 미리듣기 생성만 API 키 보호를 위해 최소 Firebase Function 예외로 구현한다.
- 기존 사용자 앱의 홈, 퀴즈, 결과 화면과 서버 API 동작은 깨지지 않아야 한다.

Constraints:
- docs/product-specs/admin.md와 docs/operations/quiz-content-seeding.md의 정책을 따른다.
- 관리자 비밀번호와 ElevenLabs API 키를 클라이언트 코드, 환경변수 예시 값, 빌드 산출물에 넣지 않는다.
- 퀴즈 등록, 수정, 삭제, 발행용 HTTP API를 새로 만들지 않는다.
- TTS Function은 미리듣기 mp3 생성만 담당하고 Firestore/Storage 저장은 하지 않는다.
- 기존 MVP 문서와 unrelated 파일은 임의로 수정하지 않는다.

Done when:
- apps/admin에서 Firebase Auth 이메일/비밀번호 로그인 후 관리자 UID만 접근할 수 있다.
- 퀴즈 목록, 상세, 등록, 수정, 삭제, 발행, 미리보기, 직접 mp3 업로드가 동작한다.
- 스크립트와 speakerGender로 ElevenLabs TTS 미리듣기를 생성하고, 생성본을 최종 오디오로 선택할 수 있다.
- 최종 저장 시 Firestore quizzes/{quizDate} 문서와 Storage quiz-audio/{quizDate}/{fileName} 객체가 생성된다.
- 진행 기록이 있는 quizDate는 관리자 UI에서 수정/삭제할 수 없다.
- Firestore/Storage Rules가 관리자 UID allowlist 정책을 반영한다.
- npm --prefix apps/admin run typecheck, npm --prefix apps/admin run build, npm --prefix functions run build가 통과한다.
- 변경 결과와 검증 근거가 docs/exec-plans/admin/01-admin-page-result.md에 기록된다.
```

Codex Goal mode에서는 목표 문구가 시작 프롬프트이자 완료 기준이 된다. 따라서 작업자는 위 문구의 `Done when` 항목을 모두 만족할 때만 목표를 완료 처리한다.

## 목적

운영자가 별도 서버 관리자 도구 없이 웹에서 날짜별 듣기 문제를 운영할 수 있게 한다.

관리자페이지는 문제 콘텐츠 작성, 오디오 준비, 발행, 운영 확인을 한 화면 흐름으로 처리한다. 기존 사용자용 Apps in Toss 미니앱과는 별도 정적 웹앱으로 배포한다.

## 참조 문서

- `AGENTS.md`
- `docs/product-specs/admin.md`
- `docs/operations/quiz-content-seeding.md`
- `docs/product-specs/backend.md`
- `docs/design-docs/style-guidelines.md`
- `firestore.rules`
- `storage.rules`
- `functions/src/domain/models.ts`
- `functions/src/domain/collections.ts`
- `src/integrations/firebase.ts`
- `src/config/clientEnv.ts`

## 범위

- `apps/admin`에 독립 React/Vite 앱을 만든다.
- 관리자 앱은 자체 `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/`를 가진다.
- 관리자 앱 전용 `.env.example`을 작성한다.
- Firebase Auth 이메일/비밀번호 로그인과 로그아웃을 구현한다.
- Firestore/Storage 접근은 관리자 UID allowlist Rules로 제한한다.
- 관리자 앱에서 `quizzes/{quizDate}` 목록과 상세를 조회한다.
- 퀴즈 등록, 수정, 삭제, 임시저장, 발행 기능을 구현한다.
- 선택지 5개, 복수 정답, 스크립트, 포인트 금액, 화자 성별, 오디오를 입력할 수 있게 한다.
- 직접 mp3 파일 업로드를 지원한다.
- ElevenLabs TTS 미리듣기 생성 Function을 최소 범위로 추가한다.
- TTS 미리듣기 생성 후 `이 음성 사용`으로 생성본을 최종 업로드 대상으로 지정할 수 있게 한다.
- 최종 저장 시 Firebase Storage에 mp3를 업로드하고 Firestore에 `audioStoragePath`를 저장한다.
- 같은 `quizDate`에 `userProgress` 기록이 있으면 수정과 삭제를 UI에서 막는다.
- GitHub Pages 정적 배포가 가능하도록 관리자 앱 빌드 산출물을 만든다.
- 구현 결과를 `docs/exec-plans/admin/01-admin-page-result.md`에 기록한다.

## 제외 범위

- 기존 Toss 미니앱 `src/`에 관리자 화면을 추가하지 않는다.
- 퀴즈 CRUD용 Firebase Functions HTTP API를 만들지 않는다.
- TTS Function에서 Firestore 문서 생성, 수정, 삭제, 발행, Storage 업로드를 처리하지 않는다.
- 관리자 감사 로그, 다중 관리자 역할, 변경 이력 저장은 구현하지 않는다.
- 사용자 앱의 로그인, 정답 검증, 포인트 지급, 광고 보상 로직을 변경하지 않는다.
- ElevenLabs 실제 voice ID 값을 저장소에 기록하지 않는다.
- 운영 Firebase Secret 값, 관리자 UID 실제 값, API 키 실제 값을 저장소에 기록하지 않는다.

## 성공 기준

- 관리자 앱은 기존 미니앱과 독립적으로 `apps/admin`에서 개발, 타입 검사, 빌드할 수 있다.
- 로그인하지 않은 사용자는 관리자 기능을 볼 수 없다.
- 관리자 UID가 아닌 Firebase Auth 사용자는 Firestore와 Storage 관리자 작업을 수행할 수 없다.
- 관리자는 퀴즈를 임시저장하고, 발행 상태로 전환하고, 상세를 다시 조회할 수 있다.
- 관리자는 직접 mp3 파일을 업로드해 퀴즈 오디오로 저장할 수 있다.
- 관리자는 스크립트와 `speakerGender`로 TTS 미리듣기를 생성하고, 생성본을 최종 오디오로 선택해 저장할 수 있다.
- TTS 생성 실패 시 화면에 실패 상태가 표시되고, 직접 mp3 업로드로 대체할 수 있다.
- `quizzes/{quizDate}` 문서에는 `quizDate`, `isPublished`, `audioStoragePath`, `choices`, `correctChoiceIds`, `script`, `promotionAmount`가 저장된다.
- Storage 객체는 `quiz-audio/{quizDate}/{fileName}` 경로에 저장된다.
- 저장 전 검증은 날짜 형식, 선택지 5개, 정답 최소 1개, 정답 ID 유효성, mp3 존재, 양수 `promotionAmount`를 확인한다.
- 이미 `userProgress` 기록이 있는 `quizDate`는 수정과 삭제 버튼이 비활성화된다.
- 기존 사용자 앱의 `GET /api/today-quiz` 공개 응답에는 정답, 스크립트, 포인트 금액, 화자 성별, 원본 Storage 경로가 노출되지 않는다.
- `npm --prefix apps/admin run typecheck`가 통과한다.
- `npm --prefix apps/admin run build`가 통과한다.
- `npm --prefix functions run build`가 통과한다.
- Firebase Emulator 또는 개발 Firebase 프로젝트에서 로그인, CRUD, Storage 업로드, TTS 미리듣기, 발행 흐름을 수동 검증하고 결과를 completed 문서에 기록한다.

## 작업 체크리스트

- [ ] 작업 시작 시 `docs/product-specs/admin.md`와 `docs/operations/quiz-content-seeding.md`를 읽고 최신 정책을 확인한다.
- [ ] `apps/admin` 독립 React/Vite 앱 구조를 만든다.
- [ ] 관리자 앱의 package script에 `dev`, `typecheck`, `build`를 둔다.
- [ ] 관리자 앱 전용 Firebase 환경변수 예시를 작성하되 실제 비밀값은 넣지 않는다.
- [ ] Firebase 초기화, Auth, Firestore, Storage 클라이언트 모듈을 관리자 앱 안에 만든다.
- [ ] 이메일/비밀번호 로그인, 로그인 유지 상태, 로그아웃 UI를 구현한다.
- [ ] 관리자 UID allowlist 기준을 Firestore Rules와 Storage Rules에 반영한다.
- [ ] 퀴즈 목록과 상세 조회 UI를 구현한다.
- [ ] 퀴즈 등록/수정 폼을 구현한다.
- [ ] 선택지 5개와 복수 정답 입력을 검증한다.
- [ ] 직접 mp3 파일 업로드 input을 구현한다.
- [ ] ElevenLabs TTS 미리듣기 Function을 추가하고 API 키를 Secret으로만 읽는다.
- [ ] TTS Function은 Firebase Auth ID token과 관리자 UID를 검증한다.
- [ ] 관리자 앱에서 스크립트와 `speakerGender`로 TTS 미리듣기를 요청한다.
- [ ] 생성된 TTS mp3를 브라우저에서 재생할 수 있게 한다.
- [ ] `이 음성 사용` 액션으로 생성본을 최종 오디오 대상으로 지정한다.
- [ ] 퀴즈 저장 시 최종 오디오를 Storage에 업로드하고 Firestore 문서를 저장한다.
- [ ] 퀴즈 발행 액션으로 `isPublished = true`를 저장한다.
- [ ] `userProgress` 기록이 있는 `quizDate`의 수정/삭제를 UI에서 막는다.
- [ ] 삭제 시 진행 기록이 없는 퀴즈만 삭제하고 관련 Storage 오디오 정리 기준을 적용한다.
- [ ] TTS 생성 실패, Storage 업로드 실패, Firestore 저장 실패 상태를 화면에 표시한다.
- [ ] GitHub Pages 배포에 필요한 Vite base 또는 빌드 기준을 정리한다.
- [ ] `npm --prefix apps/admin run typecheck`를 실행한다.
- [ ] `npm --prefix apps/admin run build`를 실행한다.
- [ ] `npm --prefix functions run build`를 실행한다.
- [ ] Firebase Emulator 또는 개발 Firebase 프로젝트에서 주요 운영 흐름을 수동 검증한다.

## 검증 체크리스트

- [ ] 비로그인 상태에서 관리자 기능이 보이지 않는다.
- [ ] 관리자 계정으로 로그인하면 대시보드 또는 퀴즈 목록에 진입할 수 있다.
- [ ] 관리자 UID가 아닌 계정은 Firestore/Storage 작업이 거부된다.
- [ ] 새 퀴즈를 임시저장하면 Firestore `quizzes/{quizDate}` 문서가 생성된다.
- [ ] 직접 mp3 업로드로 저장하면 Storage `quiz-audio/{quizDate}/...` 객체가 생성된다.
- [ ] ElevenLabs TTS 미리듣기를 생성하고 재생할 수 있다.
- [ ] `이 음성 사용` 후 저장하면 생성본 mp3가 최종 오디오로 업로드된다.
- [ ] 발행 액션 후 `isPublished = true`가 저장된다.
- [ ] 진행 기록이 있는 날짜는 수정과 삭제가 막힌다.
- [ ] 잘못된 날짜, 선택지 수, 정답 ID, 포인트 금액, 오디오 누락 입력은 저장되지 않는다.
- [ ] TTS 생성 실패 시 직접 mp3 업로드로 저장을 계속할 수 있다.
- [ ] 기존 사용자 앱의 오늘 문제 조회, 답안 제출, 결과, 보상 흐름이 유지된다.
- [ ] 타입 검사 명령이 통과한다.
- [ ] 관리자 앱 빌드 명령이 통과한다.
- [ ] Functions 빌드 명령이 통과한다.

## 완료 후 결과 문서 작성 기준

- `docs/exec-plans/admin/01-admin-page-result.md`를 작성한다.
- 이 작업지시서의 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- 각 항목에는 근거가 되는 파일, 명령, 테스트 또는 수동 검증 결과를 짧게 기록한다.
- 완료하지 못한 항목은 체크하지 않고 미완료 사유와 후속 처리 기준을 적는다.
- 실제 관리자 UID, ElevenLabs API 키, voice ID, Firebase Secret 값은 결과 문서에 기록하지 않는다.
- 최종 변경 요약, 실행한 검증 명령, 수동 검증 결과, 남은 운영 설정 작업을 문서 끝에 정리한다.
