# 09. 관리자 유저 목록 조회 기능 결과

## 요약

관리자 앱에 읽기 전용 `유저 관리` 화면을 추가했다.
관리자는 사이드바에서 `퀴즈 관리`와 `유저 관리`를 전환할 수 있고, 유저 목록은 `users` 컬렉션을 `loggedInAt desc` 기준으로 50명씩 페이지네이션해 조회한다.
`userId` 단건 검색, `userKey` 마스킹 표시, 유저 목록 조회 권한을 위한 Firestore Rules 기준도 함께 반영했다.

## 작업 체크리스트

- [x] 최신 `dev` 기준에서 `codex/09-admin-user-list` 브랜치를 만든다. 근거: `git checkout -b codex/09-admin-user-list dev`.
- [x] 08번 completed 문서를 읽고 관리자 앱의 현재 배포와 화면 구조를 확인한다. 근거: `docs/exec-plans/admin/completed/08-admin-github-pages-deploy-result.md` 확인.
- [x] `docs/product-specs/admin.md`의 유저 목록 조회 기준을 다시 확인한다. 근거: 유저 목록 조회 섹션 확인.
- [x] `docs/product-specs/backend.md`의 `users` 데이터 구조를 다시 확인한다. 근거: `userId`, `userKey`, `loggedInAt` 필드 확인.
- [x] 관리자 앱에 `User` 타입을 추가한다. 근거: `apps/admin/src/types/user.ts`.
- [x] Firestore `users` 목록 조회 서비스를 추가한다. 근거: `fetchUsersPage()`.
- [x] Firestore `users/{userId}` 단건 조회 서비스를 추가한다. 근거: `findUserById()`.
- [x] `userKey` 마스킹 유틸 또는 표시 함수를 추가한다. 근거: `maskUserKey()`.
- [x] 유저 목록 페이지네이션과 검색 상태를 관리하는 훅을 추가한다. 근거: `useUsers()`.
- [x] 유저 목록 컴포넌트를 추가한다. 근거: `UserList`.
- [x] `AdminDashboard`에 `유저 관리` 사이드바 메뉴와 화면 전환 상태를 추가한다. 근거: `activeSection`.
- [x] `유저 관리` 선택 시 유저 목록 화면이 렌더링되게 한다. 근거: `activeSection === 'users'`에서 `UserList` 렌더링.
- [x] 기존 `퀴즈 관리` 선택 시 퀴즈 목록과 편집기가 기존처럼 렌더링되게 한다. 근거: `activeSection === 'quiz'`에서 기존 `QuizList`, `QuizEditor` 렌더링 유지.
- [x] Firestore Rules에 관리자 UID 기준 `users` 읽기 허용과 쓰기 차단 규칙을 추가한다. 근거: `match /users/{userId}`.
- [x] 유저 목록 화면의 로딩, 오류, 빈 목록, 검색 결과 없음 상태를 구현한다. 근거: `UserList` 상태 메시지.
- [x] `docs/exec-plans/admin/completed/09-admin-user-list-result.md`를 작성한다. 근거: 이 문서.

## 검증 체크리스트

- [x] `npm --prefix apps/admin run typecheck`가 통과한다. 근거: 종료 코드 0.
- [x] `npm run admin:pages:build`가 통과한다. 근거: 종료 코드 0. Vite chunk size 경고가 출력됐으나 빌드는 성공했다.
- [ ] 관리자 앱에서 `퀴즈 관리`와 `유저 관리` 메뉴 전환이 동작한다. 관리자 계정/비밀번호가 없어 로그인 후 화면 전환은 직접 확인하지 못했다.
- [ ] `퀴즈 관리` 화면의 기존 목록 조회, 상세 편집 진입, 새 퀴즈 버튼 동작이 깨지지 않는다. 관리자 계정/비밀번호가 없어 로그인 후 직접 확인하지 못했다.
- [ ] 관리자 UID allowlist가 반영된 환경에서 최근 로그인순 유저 목록 첫 페이지가 조회된다. 관리자 계정/비밀번호와 실제 Rules 반영 환경이 없어 직접 확인하지 못했다.
- [ ] 유저 목록의 `userKey`가 원본 전체가 아니라 마스킹된 값으로 표시된다. 브라우저 실데이터 조회는 확인하지 못했으나, 표시 컴포넌트는 `maskUserKey()` 결과만 렌더링한다.
- [ ] `다음` 버튼으로 다음 페이지를 조회할 수 있다. 관리자 로그인 후 실데이터 조회는 확인하지 못했다.
- [ ] 이전 페이지가 있는 상태에서 `이전` 버튼으로 이전 페이지를 조회할 수 있다. 관리자 로그인 후 실데이터 조회는 확인하지 못했다.
- [ ] `userId` 검색 결과가 있는 경우 단건 결과가 표시된다. 관리자 로그인 후 실데이터 조회는 확인하지 못했다.
- [ ] `userId` 검색 결과가 없는 경우 결과 없음 상태가 표시된다. 관리자 로그인 후 실데이터 조회는 확인하지 못했다.
- [ ] 검색어를 지우면 최근 로그인순 목록으로 돌아간다. 관리자 로그인 후 직접 확인하지 못했다.
- [ ] 관리자 권한이 없으면 유저 목록 조회 권한 오류 메시지가 표시된다. 관리자 로그인 후 Rules 거부 환경을 직접 확인하지 못했다.
- [ ] Firestore Rules에서 관리자는 `users` 읽기가 가능하고 `users` 쓰기는 불가능하다. Rules 테스트 환경을 실행하지 못해 정적 규칙 확인만 수행했다.
- [ ] Firestore Rules에서 비관리자는 `users` 읽기와 쓰기가 모두 불가능하다. Rules 테스트 환경을 실행하지 못해 정적 규칙 확인만 수행했다.
- [x] 실제 관리자 UID, Firebase 환경변수 값, 관리자 비밀번호가 커밋되지 않았다. 근거: 변경 파일에 실제 비밀값 없음.

## 변경 파일 요약

- `apps/admin/src/types/user.ts`: 관리자 앱용 유저 타입을 추가했다.
- `apps/admin/src/services/users.ts`: 유저 목록 페이지 조회, `userId` 단건 조회, `userKey` 마스킹, 로그인 시각 표시 함수를 추가했다.
- `apps/admin/src/hooks/useUsers.ts`: 유저 목록 페이지네이션, 이전/다음 이동, 검색 상태를 관리한다.
- `apps/admin/src/components/UserList.tsx`: 유저 검색 입력, 유저 목록 테이블, 페이지 이동과 상태 메시지를 렌더링한다.
- `apps/admin/src/components/AdminDashboard.tsx`: 사이드바에 `유저 관리`를 추가하고 화면 전환 상태를 연결했다.
- `apps/admin/src/styles.css`: 유저 목록 화면, 검색 폼, 테이블, 페이지네이션 스타일을 추가했다.
- `firestore.rules`: 관리자 UID만 `users` 읽기를 허용하고 클라이언트 쓰기는 차단했다.

## 검증 결과

- `npm --prefix apps/admin run typecheck`: 통과.
- `npm run admin:pages:build`: 통과. Vite chunk size 경고가 남았으나 빌드는 성공했다.
- `npm --prefix apps/admin run dev -- --host 127.0.0.1 --port 5174`: dev server 실행 후 `http://127.0.0.1:5174/`에서 로그인 화면 로드를 확인했다.

## 미수행 또는 후속 조치

- 관리자 계정/비밀번호가 없어 로그인 후 `퀴즈 관리`와 `유저 관리` 화면 전환, 실제 Firestore `users` 조회, 검색, 페이지네이션은 직접 확인하지 못했다.
- Firestore Rules emulator 테스트 스크립트가 없어 관리자/비관리자 권한 행렬은 정적 규칙 확인으로만 검토했다.
- 브라우저 로그인 화면 확인 중 favicon 404와 로그인 폼 input id/name 관련 브라우저 이슈가 보였으나, 이번 작업 범위의 유저 목록 화면 변경과 직접 관련된 문제는 아니다.

## 보안 확인

- `userKey` 원본 전체는 `UserList`에서 렌더링하지 않고 `maskUserKey()` 결과만 표시한다.
- `users` 컬렉션은 관리자 UID만 읽을 수 있고, 클라이언트 쓰기는 `allow write: if false`로 차단한다.
- 실제 Firebase 환경변수 값, 관리자 UID, 관리자 비밀번호는 변경 파일에 기록하지 않았다.
