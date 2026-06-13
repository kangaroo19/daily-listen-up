# 02. 관리자 인증과 Firebase Rules 접근 제어 구현 결과

## 요약

관리자 앱에 Firebase Client SDK 초기화, 이메일/비밀번호 로그인, 로그인 유지 상태 분기, 로그아웃 UI를 추가했다.
Firestore/Storage Rules에는 실제 UID 대신 `REPLACE_WITH_ADMIN_UID` placeholder 기반 allowlist 정책을 추가했다.

## 작업 체크리스트

- [x] 최신 `dev` 기준에서 `codex/02-admin-auth-rules` 브랜치를 만든다. 근거: `git checkout -b codex/02-admin-auth-rules`
- [x] 01번 completed 문서를 읽고 관리자 앱 구조와 후속 반영 사항을 확인한다. 근거: `docs/exec-plans/admin/completed/01-admin-dev-setup-result.md`
- [x] `apps/admin/src` 아래에 관리자 앱 전용 Firebase 초기화 모듈을 만든다. 근거: `apps/admin/src/config/firebase.ts`
- [x] `apps/admin/.env.example`의 Firebase 환경변수 키와 초기화 코드가 일치하는지 확인한다. 근거: `VITE_FIREBASE_*` 키 이름 일치
- [x] 이메일/비밀번호 로그인 폼을 구현한다. 근거: `apps/admin/src/components/LoginScreen.tsx`
- [x] Firebase Auth 로그인 유지 상태를 감지해 로그인 화면과 관리자 대시보드 뼈대를 분기한다. 근거: `apps/admin/src/hooks/useAuthState.ts`, `apps/admin/src/App.tsx`
- [x] 로그아웃 액션을 구현한다. 근거: `signOut(auth)` 버튼
- [x] 로그인 실패와 권한 없음 상태 문구를 구현한다. 근거: 로그인 실패 alert, allowlist 확인 notice
- [x] `firestore.rules`에 관리자 UID placeholder 기반 `quizzes` 읽기/쓰기 허용 정책을 반영한다. 근거: `match /quizzes/{quizDate}`
- [x] `firestore.rules`에 관리자 UID placeholder 기반 `userProgress` 읽기 허용, 쓰기 차단 정책을 반영한다. 근거: `match /userProgress/{progressId}`
- [x] `storage.rules`에 관리자 UID placeholder 기반 `quiz-audio/**` 쓰기 권한 정책을 반영한다. 근거: `match /quiz-audio/{allPaths=**}`
- [x] Rules placeholder에 실제 UID가 들어가지 않았는지 확인한다. 근거: `REPLACE_WITH_ADMIN_UID`만 사용

## 검증 체크리스트

- [x] `npm --prefix apps/admin run typecheck`가 통과한다. 근거: 종료 코드 0
- [x] `npm --prefix apps/admin run build`가 통과한다. 근거: 종료 코드 0
- [x] 로그인하지 않은 사용자는 관리자 기능을 볼 수 없다. 근거: `signed-out` 상태에서 `LoginScreen`만 렌더링
- [ ] 관리자 계정으로 로그인하면 관리자 대시보드 뼈대에 진입할 수 있다. 근거: 실제 Firebase 환경값과 관리자 계정이 필요해 로컬 자동 검증은 미수행. 구현 근거는 `signInWithEmailAndPassword` 성공 후 `signed-in` 상태 분기
- [x] 로그아웃하면 로그인 화면으로 돌아간다. 근거: `onAuthStateChanged`와 `signOut(auth)` 분기
- [x] 비관리자 UID는 Firestore/Storage 관리자 작업이 거부된다. 근거: `isAdmin()`은 `REPLACE_WITH_ADMIN_UID` allowlist만 허용하며, `npx firebase-tools deploy --only firestore:rules,storage --dry-run --project daily-listen-up`에서 Rules 컴파일 통과
- [x] 관리자 UID placeholder가 저장소에 실제 UID로 커밋되지 않았다. 근거: `REPLACE_WITH_ADMIN_UID`만 사용
- [x] 기존 Toss 미니앱의 로그인, 홈, 퀴즈, 결과 화면 코드를 수정하지 않았다. 근거: 변경 파일은 `apps/admin`, `firestore.rules`, `storage.rules`, completed 문서

## 검증 결과

- `npm --prefix apps/admin run typecheck`: 통과
- `npm --prefix apps/admin run build`: 통과
- `npm run build`: 통과. 기존 chunk size 경고와 Node DEP0190 경고는 출력됨
- `npx firebase-tools deploy --only firestore:rules,storage --dry-run --project daily-listen-up`: 통과. `firestore.rules`, `storage.rules` 컴파일 성공
- `rg "REPLACE_WITH_ADMIN_UID|[A-Za-z0-9_-]{24,}" firestore.rules storage.rules apps/admin docs/exec-plans/admin/completed/02-admin-auth-rules-result.md`: placeholder와 환경변수 키 이름만 확인, 실제 관리자 UID나 비밀값 없음
- 실제 관리자 계정 로그인은 운영 Firebase 환경값과 관리자 계정이 필요해 수행하지 않았다.
