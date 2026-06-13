# 02. 관리자 인증과 Firebase Rules 접근 제어 구현

## 목적

관리자 앱에 Firebase Auth 이메일/비밀번호 로그인과 관리자 UID allowlist 기반 Firestore/Storage 접근 제어를 구현한다.

이 작업은 관리자만 앱에 진입하고, 관리자 UID만 `quizzes`, `userProgress`, `quiz-audio/**`에 필요한 범위로 접근할 수 있게 만드는 보안 기반 작업이다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/admin/index.md`
- `docs/exec-plans/admin/active/01-admin-dev-setup.md`
- `docs/product-specs/admin.md`
- `docs/design-docs/admin-dashboard-ui.md`
- `firestore.rules`
- `storage.rules`
- `firebase.json`

## 선행 조건

- 01번 작업이 완료되어 `apps/admin` 앱이 타입 검사와 빌드 가능한 상태여야 한다.

## 범위

- 관리자 앱에 Firebase Client SDK 초기화 모듈을 만든다.
- Firebase Auth 이메일/비밀번호 로그인, 로그인 유지 상태, 로그아웃 UI를 구현한다.
- 로그인 전에는 관리자 기능을 볼 수 없게 한다.
- Firestore Rules에 관리자 UID placeholder 기반 `quizzes` 읽기/쓰기 허용 정책을 반영한다.
- Firestore Rules에 관리자 UID placeholder 기반 `userProgress` 읽기 허용, 쓰기 차단 정책을 반영한다.
- Storage Rules에 관리자 UID placeholder 기반 `quiz-audio/**` 업로드, 수정, 삭제 허용 정책을 반영한다.
- 실제 관리자 UID는 저장소에 기록하지 않는다.

## 제외 범위

- 퀴즈 CRUD UI는 구현하지 않는다.
- 오디오 업로드와 TTS 미리듣기는 구현하지 않는다.
- 관리자 UID 실제 값, 관리자 비밀번호, Firebase 운영 설정값을 저장소에 기록하지 않는다.
- custom claim 기반 권한 체계는 v1 범위에 포함하지 않는다.
- `userProgress` 존재 여부 확인용 별도 Function 또는 요약 문서는 만들지 않는다.

## 구현 지침

- 관리자 UID allowlist 값은 Rules 파일에서 placeholder로만 둔다.
- placeholder는 운영 배포 전 치환해야 하는 값임을 주석이나 문서로 분명히 남긴다.
- 로그인 실패, 권한 없음, 로그아웃 상태를 사용자에게 짧고 명확하게 보여준다.
- Firebase Auth ID token은 이후 TTS Function 호출에서 재사용할 수 있는 구조로 준비한다.
- 관리자 앱은 Firebase Client SDK를 사용하되, 기존 사용자 미니앱 Firebase 연동 파일을 관리자 앱에 직접 끌어오지 않는다.

## 작업 체크리스트

- [ ] 최신 `dev` 기준에서 `codex/02-admin-auth-rules` 브랜치를 만든다.
- [ ] 01번 completed 문서를 읽고 관리자 앱 구조와 후속 반영 사항을 확인한다.
- [ ] `apps/admin/src` 아래에 관리자 앱 전용 Firebase 초기화 모듈을 만든다.
- [ ] `apps/admin/.env.example`의 Firebase 환경변수 키와 초기화 코드가 일치하는지 확인한다.
- [ ] 이메일/비밀번호 로그인 폼을 구현한다.
- [ ] Firebase Auth 로그인 유지 상태를 감지해 로그인 화면과 관리자 대시보드 뼈대를 분기한다.
- [ ] 로그아웃 액션을 구현한다.
- [ ] 로그인 실패와 권한 없음 상태 문구를 구현한다.
- [ ] `firestore.rules`에 관리자 UID placeholder 기반 `quizzes` 읽기/쓰기 허용 정책을 반영한다.
- [ ] `firestore.rules`에 관리자 UID placeholder 기반 `userProgress` 읽기 허용, 쓰기 차단 정책을 반영한다.
- [ ] `storage.rules`에 관리자 UID placeholder 기반 `quiz-audio/**` 쓰기 권한 정책을 반영한다.
- [ ] Rules placeholder에 실제 UID가 들어가지 않았는지 확인한다.

## 검증 체크리스트

- [ ] `npm --prefix apps/admin run typecheck`가 통과한다.
- [ ] `npm --prefix apps/admin run build`가 통과한다.
- [ ] 로그인하지 않은 사용자는 관리자 기능을 볼 수 없다.
- [ ] 관리자 계정으로 로그인하면 관리자 대시보드 뼈대에 진입할 수 있다.
- [ ] 로그아웃하면 로그인 화면으로 돌아간다.
- [ ] 비관리자 UID는 Firestore/Storage 관리자 작업이 거부된다.
- [ ] 관리자 UID placeholder가 저장소에 실제 UID로 커밋되지 않았다.
- [ ] 기존 Toss 미니앱의 로그인, 홈, 퀴즈, 결과 화면 코드를 수정하지 않았다.

## 완료 후 결과 문서 작성 기준

- `docs/exec-plans/admin/completed/02-admin-auth-rules-result.md`를 작성한다.
- 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- Rules 변경 근거와 관리자/비관리자 접근 검증 결과를 기록한다.
- 실제 관리자 UID, 비밀번호, Firebase 설정값은 결과 문서에 기록하지 않는다.

