# 09. 관리자 유저 목록 조회 기능

## 목적

관리자 앱에서 운영자가 서비스 유저를 읽기 전용으로 확인할 수 있는 `유저 관리` 화면을 추가한다.

유저 목록 조회는 운영 확인을 위한 최소 기능으로 제한한다.
관리자는 최근 로그인한 유저 목록을 페이지 단위로 확인하고, 필요한 경우 `userId`로 특정 유저를 단건 검색할 수 있어야 한다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/admin/index.md`
- `docs/exec-plans/admin/active/08-admin-github-pages-deploy.md`
- `docs/exec-plans/admin/completed/08-admin-github-pages-deploy-result.md`
- `docs/product-specs/admin.md`
- `docs/product-specs/backend.md`
- `docs/design-docs/admin-dashboard-ui.md`
- `apps/admin/src/App.tsx`
- `apps/admin/src/components/AdminDashboard.tsx`
- `apps/admin/src/services/quizzes.ts`
- `apps/admin/src/hooks/useQuizzes.ts`
- `firestore.rules`

## 선행 조건

- 08번 작업으로 관리자 앱 GitHub Pages 수동 배포 설정이 완료되어 있어야 한다.
- `docs/product-specs/admin.md`에 유저 목록 조회 기준이 반영되어 있어야 한다.
- 백엔드 사용자 데이터는 Firestore `users` 컬렉션에 저장되어 있어야 한다.
- `users` 문서는 `docs/product-specs/backend.md` 기준의 `userId`, `userKey`, `loggedInAt` 필드를 가진다.

## 범위

- 관리자 앱 사이드바에 `유저 관리` 메뉴를 추가한다.
- 기존 라우터 도입 없이 `AdminDashboard` 내부 상태로 `퀴즈 관리`와 `유저 관리` 화면을 전환한다.
- Firebase Client SDK로 Firestore `users` 컬렉션을 직접 조회한다.
- Firestore Rules에 관리자 UID만 `users` 컬렉션을 읽을 수 있는 규칙을 추가한다.
- 관리자 앱에서는 `users` 컬렉션 쓰기를 허용하지 않는다.
- 유저 목록은 `loggedInAt` 기준 내림차순으로 페이지네이션한다.
- `userId` 문서 ID 기준 단건 검색을 제공한다.
- 목록과 검색 결과에는 `userId`, 마스킹된 `userKey`, `loggedInAt`만 표시한다.
- 유저 목록 조회 실패, 권한 오류, 검색 결과 없음, 목록 없음 상태를 표시한다.
- 작업 완료 후 `docs/exec-plans/admin/completed/09-admin-user-list-result.md`를 작성한다.

## 제외 범위

- 유저 수정, 삭제, 차단 같은 유저 관리 액션은 만들지 않는다.
- 유저별 진행 기록 상세 조회는 만들지 않는다.
- 유저별 보상 내역 상세 조회는 만들지 않는다.
- `userProgress`, `rewardGrants`, `adRewardEvents`를 유저 목록 화면에서 조인해 조회하지 않는다.
- 유저 수 집계, 활성 유저 집계, 날짜별 가입 또는 로그인 통계는 만들지 않는다.
- 유저 목록 조회용 요약 컬렉션이나 관리자 전용 Function은 만들지 않는다.
- 일반 사용자 앱 `src/`와 Firebase Functions API 동작은 변경하지 않는다.
- 실제 관리자 UID, Firebase 환경변수 값, 관리자 비밀번호를 커밋하지 않는다.

## 데이터 기준

유저 목록 조회 대상 컬렉션은 아래와 같다.

```text
users
```

표시 필드는 아래로 제한한다.

- `userId`
- 마스킹된 `userKey`
- `loggedInAt`

`userKey`는 토스 사용자 식별값이므로 원본 전체를 노출하지 않는다.
마스킹 규칙은 아래 기준을 따른다.

- 값이 충분히 길면 앞 4자와 뒤 4자만 남기고 가운데를 `****`로 표시한다.
- 값이 짧거나 비어 있으면 원본 대신 `마스킹됨`으로 표시한다.

목록 정렬 기준은 아래와 같다.

```text
loggedInAt desc
```

페이지 크기는 50명으로 고정한다.
첫 페이지는 최신 로그인 유저 50명을 표시한다.
다음 페이지는 현재 페이지의 마지막 문서를 기준으로 조회한다.
이전 페이지 이동을 위해 관리자 앱 내부에서 페이지별 커서를 보관한다.

## UI 기준

- 사이드바 메뉴는 `퀴즈 관리`, `유저 관리`, `오디오`, `설정` 순서로 둔다.
- `유저 관리` 화면은 기존 관리자 대시보드의 조용한 SaaS형 운영 도구 톤을 따른다.
- 화면 상단에는 `유저 관리` 제목과 현재 조회 상태를 표시한다.
- 본문에는 `userId` 검색 입력과 유저 목록 테이블을 둔다.
- 테이블 컬럼은 `userId`, `userKey`, `최근 로그인`으로 제한한다.
- 검색어가 있으면 페이지네이션 목록 대신 검색 결과 1건 또는 결과 없음 상태를 보여준다.
- 검색어를 지우면 최근 로그인순 페이지네이션 목록으로 돌아간다.
- `다음`, `이전` 버튼은 이동 가능한 경우에만 활성화한다.
- 좁은 화면에서도 테이블 텍스트와 버튼이 겹치지 않아야 한다.

## 구현 지침

- `apps/admin/src/types`에 관리자 앱에서 사용할 `User` 타입을 추가한다.
- `apps/admin/src/services`에 `users` 조회 전용 서비스를 추가한다.
- `apps/admin/src/hooks`에 유저 목록 페이지네이션과 `userId` 검색 상태를 관리하는 훅을 추가한다.
- `apps/admin/src/components`에 `UserList` 또는 같은 역할의 유저 목록 컴포넌트를 추가한다.
- `AdminDashboard`는 현재 선택된 관리자 섹션 상태를 가지고, `퀴즈 관리` 선택 시 기존 퀴즈 작업 영역을, `유저 관리` 선택 시 유저 목록 화면을 렌더링한다.
- 기존 `QuizList`, `QuizEditor`, 퀴즈 저장/발행/삭제 흐름은 변경하지 않는다.
- `users` 조회 서비스는 Firebase 환경변수가 없을 때 명확한 오류 메시지를 반환한다.
- 권한 오류는 관리자 UID allowlist 확인이 필요하다는 메시지로 표시한다.
- `loggedInAt`이 Firestore Timestamp인 경우 운영자가 읽을 수 있는 날짜/시간 문자열로 표시한다.
- Firestore Rules는 관리자 UID만 `users` 컬렉션을 읽을 수 있게 하고, `users` 쓰기는 모든 클라이언트에서 차단한다.

## 작업 체크리스트

- [ ] 최신 `dev` 기준에서 `codex/09-admin-user-list` 브랜치를 만든다.
- [ ] 08번 completed 문서를 읽고 관리자 앱의 현재 배포와 화면 구조를 확인한다.
- [ ] `docs/product-specs/admin.md`의 유저 목록 조회 기준을 다시 확인한다.
- [ ] `docs/product-specs/backend.md`의 `users` 데이터 구조를 다시 확인한다.
- [ ] 관리자 앱에 `User` 타입을 추가한다.
- [ ] Firestore `users` 목록 조회 서비스를 추가한다.
- [ ] Firestore `users/{userId}` 단건 조회 서비스를 추가한다.
- [ ] `userKey` 마스킹 유틸 또는 표시 함수를 추가한다.
- [ ] 유저 목록 페이지네이션과 검색 상태를 관리하는 훅을 추가한다.
- [ ] 유저 목록 컴포넌트를 추가한다.
- [ ] `AdminDashboard`에 `유저 관리` 사이드바 메뉴와 화면 전환 상태를 추가한다.
- [ ] `유저 관리` 선택 시 유저 목록 화면이 렌더링되게 한다.
- [ ] 기존 `퀴즈 관리` 선택 시 퀴즈 목록과 편집기가 기존처럼 렌더링되게 한다.
- [ ] Firestore Rules에 관리자 UID 기준 `users` 읽기 허용과 쓰기 차단 규칙을 추가한다.
- [ ] 유저 목록 화면의 로딩, 오류, 빈 목록, 검색 결과 없음 상태를 구현한다.
- [ ] `docs/exec-plans/admin/completed/09-admin-user-list-result.md`를 작성한다.

## 검증 체크리스트

- [ ] `npm --prefix apps/admin run typecheck`가 통과한다.
- [ ] `npm run admin:pages:build`가 통과한다.
- [ ] 관리자 앱에서 `퀴즈 관리`와 `유저 관리` 메뉴 전환이 동작한다.
- [ ] `퀴즈 관리` 화면의 기존 목록 조회, 상세 편집 진입, 새 퀴즈 버튼 동작이 깨지지 않는다.
- [ ] 관리자 UID allowlist가 반영된 환경에서 최근 로그인순 유저 목록 첫 페이지가 조회된다.
- [ ] 유저 목록의 `userKey`가 원본 전체가 아니라 마스킹된 값으로 표시된다.
- [ ] `다음` 버튼으로 다음 페이지를 조회할 수 있다.
- [ ] 이전 페이지가 있는 상태에서 `이전` 버튼으로 이전 페이지를 조회할 수 있다.
- [ ] `userId` 검색 결과가 있는 경우 단건 결과가 표시된다.
- [ ] `userId` 검색 결과가 없는 경우 결과 없음 상태가 표시된다.
- [ ] 검색어를 지우면 최근 로그인순 목록으로 돌아간다.
- [ ] 관리자 권한이 없으면 유저 목록 조회 권한 오류 메시지가 표시된다.
- [ ] Firestore Rules에서 관리자는 `users` 읽기가 가능하고 `users` 쓰기는 불가능하다.
- [ ] Firestore Rules에서 비관리자는 `users` 읽기와 쓰기가 모두 불가능하다.
- [ ] 실제 관리자 UID, Firebase 환경변수 값, 관리자 비밀번호가 커밋되지 않았다.

## 완료 후 결과 문서 작성 기준

- `docs/exec-plans/admin/completed/09-admin-user-list-result.md`를 작성한다.
- 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- 새로 추가한 파일과 수정한 파일을 역할 중심으로 요약한다.
- 유저 목록 페이지네이션, `userId` 검색, `userKey` 마스킹, Firestore Rules 검증 결과를 기록한다.
- 수행하지 못한 검증이 있으면 미완료 사유와 후속 처리 기준을 함께 기록한다.
- 실제 Firebase 환경변수 값, 관리자 UID, 관리자 비밀번호는 결과 문서에 기록하지 않는다.
