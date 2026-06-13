# 01. 관리자 앱 개발 환경 세팅

## 목적

`apps/admin`에 기존 Toss 미니앱과 분리된 독립 React/Vite 관리자 앱의 기본 개발 환경을 만든다.

이 작업은 관리자 앱의 화면과 기능 구현 전 단계다. Firebase 연결, 인증, CRUD, 오디오 업로드, TTS 호출의 실제 기능은 이후 작업에서 구현한다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/admin/index.md`
- `docs/product-specs/admin.md`
- `docs/design-docs/admin-dashboard-ui.md`
- `docs/design-docs/style-guidelines.md`
- `package.json`
- `vite.config.ts`
- `tsconfig.json`

## 범위

- `apps/admin` 독립 React/Vite 앱 구조를 만든다.
- 관리자 앱 전용 `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/`를 만든다.
- 관리자 앱 전용 `.env.example`을 만든다.
- `dev`, `typecheck`, `build` npm script를 제공한다.
- 데스크톱 우선 관리자 대시보드 레이아웃의 정적 뼈대를 만든다.
- 아직 Firebase Auth, Firestore, Storage, TTS 실제 연동은 하지 않는다.

## 제외 범위

- 기존 Toss 미니앱 `src/` 내부에 관리자 화면을 추가하지 않는다.
- Firebase Auth 로그인은 구현하지 않는다.
- Firestore/Storage Rules를 수정하지 않는다.
- 퀴즈 CRUD, 오디오 업로드, TTS 미리듣기는 구현하지 않는다.
- 실제 Firebase 환경변수 값을 저장소에 기록하지 않는다.

## 구현 지침

- 관리자 앱은 `apps/admin` 아래에서 자체적으로 타입 검사와 빌드가 가능해야 한다.
- 루트 앱과 설정을 공유하더라도 관리자 앱의 진입점과 빌드 산출물은 분리한다.
- UI는 `docs/design-docs/admin-dashboard-ui.md`의 데스크톱 우선, 조용한 SaaS형 대시보드 방향을 따른다.
- 초기 화면은 로그인 구현 전 임시 대시보드 뼈대로 둔다.
- `.env.example`에는 Firebase 설정 키 이름만 기록하고 실제 값은 넣지 않는다.

## 작업 체크리스트

- [ ] 최신 `dev` 기준에서 `codex/01-admin-dev-setup` 브랜치를 만든다.
- [ ] `docs/exec-plans/admin/index.md`와 `docs/product-specs/admin.md`를 읽고 작업 범위를 확인한다.
- [ ] `docs/design-docs/admin-dashboard-ui.md`를 읽고 관리자 앱 UI 방향을 확인한다.
- [ ] `apps/admin/package.json`을 만들고 `dev`, `typecheck`, `build` script를 추가한다.
- [ ] `apps/admin/vite.config.ts`를 만든다.
- [ ] `apps/admin/tsconfig.json`을 만든다.
- [ ] `apps/admin/index.html`을 만든다.
- [ ] `apps/admin/src/main.tsx`와 기본 React 진입점을 만든다.
- [ ] `apps/admin/src/App.tsx`에 정적 관리자 대시보드 뼈대를 만든다.
- [ ] `apps/admin/src/styles.css` 또는 동등한 스타일 파일에 데스크톱 우선 기본 레이아웃을 만든다.
- [ ] `apps/admin/.env.example`에 관리자 앱 Firebase 환경변수 키를 문서화한다.
- [ ] 실제 관리자 UID, Firebase 설정값, API 키, ElevenLabs voice ID를 커밋하지 않았는지 확인한다.

## 검증 체크리스트

- [ ] `npm --prefix apps/admin run typecheck`가 통과한다.
- [ ] `npm --prefix apps/admin run build`가 통과한다.
- [ ] 관리자 앱 빌드 산출물이 기존 Toss 미니앱 빌드 산출물과 분리되어 생성된다.
- [ ] 기존 `npm run build`가 여전히 통과한다.
- [ ] 기존 Toss 미니앱 `src/`에 관리자 화면 파일이 추가되지 않았다.
- [ ] `.env.example`에 실제 비밀값이 없다.

## 완료 후 결과 문서 작성 기준

- `docs/exec-plans/admin/completed/01-admin-dev-setup-result.md`를 작성한다.
- 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- 각 항목에는 근거가 되는 파일, 명령, 테스트 또는 수동 확인 결과를 짧게 기록한다.
- 완료하지 못한 항목은 체크하지 않고, 미완료 사유와 후속 처리 기준을 적는다.

