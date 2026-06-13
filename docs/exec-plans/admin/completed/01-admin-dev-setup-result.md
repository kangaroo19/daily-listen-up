# 01. 관리자 앱 개발 환경 세팅 결과

## 요약

`apps/admin`에 독립 React/Vite 관리자 앱의 기본 구조를 추가했다.
Firebase Auth, Firestore, Storage, TTS 실제 연동은 이후 작업 범위로 남겼다.

## 작업 체크리스트

- [x] 최신 `dev` 기준에서 `codex/01-admin-dev-setup` 브랜치를 만든다. 근거: `git checkout -b codex/01-admin-dev-setup`
- [x] `docs/exec-plans/admin/index.md`와 `docs/product-specs/admin.md`를 읽고 작업 범위를 확인한다. 근거: 작업 전 문서 확인
- [x] `docs/design-docs/admin-dashboard-ui.md`를 읽고 관리자 앱 UI 방향을 확인한다. 근거: 작업 전 문서 확인
- [x] `apps/admin/package.json`을 만들고 `dev`, `typecheck`, `build` script를 추가한다. 근거: `apps/admin/package.json`
- [x] `apps/admin/vite.config.ts`를 만든다. 근거: `apps/admin/vite.config.ts`
- [x] `apps/admin/tsconfig.json`을 만든다. 근거: `apps/admin/tsconfig.json`
- [x] `apps/admin/index.html`을 만든다. 근거: `apps/admin/index.html`
- [x] `apps/admin/src/main.tsx`와 기본 React 진입점을 만든다. 근거: `apps/admin/src/main.tsx`
- [x] `apps/admin/src/App.tsx`에 정적 관리자 대시보드 뼈대를 만든다. 근거: `apps/admin/src/App.tsx`
- [x] `apps/admin/src/styles.css` 또는 동등한 스타일 파일에 데스크톱 우선 기본 레이아웃을 만든다. 근거: `apps/admin/src/styles.css`
- [x] `apps/admin/.env.example`에 관리자 앱 Firebase 환경변수 키를 문서화한다. 근거: `apps/admin/.env.example`
- [x] 실제 관리자 UID, Firebase 설정값, API 키, ElevenLabs voice ID를 커밋하지 않았는지 확인한다. 근거: `.env.example`은 키 이름만 포함

## 검증 체크리스트

- [x] `npm --prefix apps/admin run typecheck`가 통과한다. 근거: 종료 코드 0
- [x] `npm --prefix apps/admin run build`가 통과한다. 근거: 종료 코드 0, `apps/admin/dist` 생성
- [x] 관리자 앱 빌드 산출물이 기존 Toss 미니앱 빌드 산출물과 분리되어 생성된다. 근거: `apps/admin/dist/index.html`, `apps/admin/dist/assets/*`
- [x] 기존 `npm run build`가 여전히 통과한다. 근거: 종료 코드 0, 기존 chunk size 경고와 Node DEP0190 경고는 출력됨
- [x] 기존 Toss 미니앱 `src/`에 관리자 화면 파일이 추가되지 않았다. 근거: 관리자 파일은 `apps/admin`에만 추가
- [x] `.env.example`에 실제 비밀값이 없다. 근거: `apps/admin/.env.example`은 빈 Vite Firebase 키 이름만 포함

## 검증 결과

- `npm --prefix apps/admin run typecheck`: 통과
- `npm --prefix apps/admin run build`: 통과
- `Get-ChildItem apps\admin\dist -Recurse -File | Select-Object FullName,Length`: 관리자 앱 산출물이 `apps/admin/dist` 아래 생성됨을 확인
- `npm run build`: 통과. 기존 루트 빌드 산출물은 `dist`와 `.ait`에 생성되며, 관리자 앱 산출물과 분리됨
- `Get-ChildItem src -Recurse -File | Select-Object FullName`: 기존 Toss 미니앱 `src/`에 관리자 화면 파일 추가 없음
