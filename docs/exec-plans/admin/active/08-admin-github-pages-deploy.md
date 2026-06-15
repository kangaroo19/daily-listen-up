# 08. 관리자 앱 GitHub Pages 수동 배포 설정

## 목적

관리자 앱을 GitHub Pages에 수동 배포할 수 있게 배포 기준, 명령어, 검증 흐름을 정리하고 구현한다.

배포 방식은 `gh-pages` 브랜치 수동 배포로 고정한다. 관리자 앱은 저장소 루트 Pages가 아니라 아래 하위 경로에서 제공한다.

```text
https://kangaroo19.github.io/daily-listen-up/admin/
```

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/admin/index.md`
- `docs/exec-plans/admin/active/07-admin-json-mp3-import-remove-tts.md`
- `docs/exec-plans/admin/completed/07-admin-json-mp3-import-remove-tts-result.md`
- `docs/product-specs/admin.md`
- `docs/design-docs/admin-dashboard-ui.md`
- `apps/admin/package.json`
- `apps/admin/vite.config.ts`
- `apps/admin/.env.example`

## 선행 조건

- 07번 작업으로 관리자 앱의 TTS 제거와 JSON 기반 mp3 등록 흐름이 구현되어 있어야 한다.
- GitHub 저장소 `kangaroo19/daily-listen-up`의 Pages 설정을 변경할 권한이 있어야 한다.
- 관리자 앱 빌드에 필요한 Firebase 환경변수를 로컬에 준비해야 한다.
- Firebase Console에서 GitHub Pages 도메인 `kangaroo19.github.io`를 Auth 승인된 도메인에 등록할 수 있어야 한다.

## 범위

- `gh-pages` 패키지를 관리자 앱 Pages 배포에 사용할 수 있게 추가한다.
- 루트 npm script에 관리자 앱 Pages 빌드와 배포 명령을 추가한다.
- 관리자 앱 Pages 빌드는 `/daily-listen-up/admin/` base 경로를 사용한다.
- `apps/admin/dist` 산출물을 `gh-pages` 브랜치의 `admin/` 하위경로로 배포한다.
- GitHub Pages 설정 기준을 문서화한다.
- `docs/product-specs/admin.md`에 수동 배포 명령어와 배포 URL 기준을 명시한다.
- 첫 실제 GitHub Pages 배포를 수행하고 접속을 확인한다.
- 배포 후 관리자 앱 로그인 화면과 정적 asset 로딩을 확인한다.
- Firebase Auth 승인 도메인과 관리자 UID allowlist가 필요한 후속 조건을 completed 문서에 기록한다.

## 제외 범위

- GitHub Actions 자동 배포 workflow는 만들지 않는다.
- `docs/` 폴더 배포 방식은 사용하지 않는다.
- custom domain과 DNS 설정은 하지 않는다.
- 사용자 앱 `src/`와 Apps in Toss 배포 설정은 변경하지 않는다.
- Firebase Functions, Firestore Rules, Storage Rules를 이 작업에서 배포하지 않는다.
- 실제 Firebase 환경변수 값, 관리자 UID, 관리자 비밀번호를 커밋하지 않는다.

## 배포 기준

- GitHub Pages Source는 `Deploy from a branch`를 사용한다.
- GitHub Pages Branch는 `gh-pages`를 사용한다.
- GitHub Pages Folder는 `/ (root)`를 사용한다.
- 관리자 앱 산출물은 `gh-pages` 브랜치의 `admin/` 경로 아래에 둔다.
- Vite base 경로는 `/daily-listen-up/admin/`로 사용한다.
- 배포 URL은 `https://kangaroo19.github.io/daily-listen-up/admin/`로 확인한다.

## 구현 지침

- `gh-pages`는 루트 devDependency로 추가한다.
- 루트 `package.json`에 최소한 아래 목적의 scripts를 추가한다.
  - 관리자 앱 Pages 빌드: `apps/admin`을 `/daily-listen-up/admin/` base로 빌드한다.
  - 관리자 앱 Pages 배포: `apps/admin/dist`를 `gh-pages` 브랜치의 `admin/` 경로로 배포한다.
- 배포 명령은 Windows PowerShell에서도 실행 가능해야 한다.
- 배포 전 `apps/admin/.env.production.local` 같은 gitignore 대상 파일에 Firebase 환경변수가 준비되어 있는지 확인한다.
- `apps/admin/.env.example`에는 필요한 키 이름만 유지하고 실제 값은 기록하지 않는다.
- `docs/product-specs/admin.md`의 배포 기준에는 실제 수동 배포 명령과 Pages URL을 명시한다.
- 첫 배포 후 GitHub Pages 설정 화면에서 `gh-pages` 브랜치와 `/ (root)` 폴더가 선택되어 있는지 확인한다.
- 첫 배포 후 Firebase Auth 승인 도메인에 `kangaroo19.github.io`가 등록되어 있는지 확인한다.
- 관리자 UID allowlist가 실제 Firebase Rules에 반영되어 있지 않아 권한 오류가 발생하면 배포 실패로 보지 않고 후속 조치로 기록한다.

## 작업 체크리스트

- [ ] 최신 `dev` 기준에서 `codex/08-admin-github-pages-deploy` 브랜치를 만든다.
- [ ] 07번 completed 문서를 읽고 관리자 앱 배포 대상 상태를 확인한다.
- [ ] `gh-pages` 패키지를 루트 devDependency에 추가한다.
- [ ] 루트 `package.json`에 관리자 앱 Pages 빌드 script를 추가한다.
- [ ] 루트 `package.json`에 관리자 앱 Pages 배포 script를 추가한다.
- [ ] Pages 빌드 script가 `/daily-listen-up/admin/` base 경로를 사용하게 한다.
- [ ] Pages 배포 script가 `apps/admin/dist`를 `gh-pages` 브랜치의 `admin/` 하위경로로 배포하게 한다.
- [ ] `docs/product-specs/admin.md`에 수동 배포 명령어와 배포 URL 기준을 추가한다.
- [ ] GitHub Pages 설정 기준을 작업 결과 문서에 기록한다.
- [ ] 첫 실제 GitHub Pages 배포를 수행한다.
- [ ] `docs/exec-plans/admin/completed/08-admin-github-pages-deploy-result.md`를 작성한다.

## 검증 체크리스트

- [ ] `npm --prefix apps/admin run typecheck`가 통과한다.
- [ ] 관리자 앱 Pages 빌드 명령이 통과한다.
- [ ] 관리자 앱 Pages 배포 명령이 성공한다.
- [ ] `gh-pages` 브랜치에 `admin/index.html`과 정적 asset이 배포된다.
- [ ] GitHub Pages 설정이 `gh-pages` 브랜치와 `/ (root)` 폴더를 사용한다.
- [ ] `https://kangaroo19.github.io/daily-listen-up/admin/`에서 관리자 앱 로그인 화면이 열린다.
- [ ] 배포된 관리자 앱에서 정적 asset 404가 발생하지 않는다.
- [ ] Firebase Auth 승인 도메인에 `kangaroo19.github.io`가 등록되어 있다.
- [ ] 관리자 UID allowlist가 반영된 환경에서는 날짜별 퀴즈 목록 조회가 가능하다.
- [ ] 관리자 UID allowlist 미반영으로 권한 오류가 남으면 completed 문서에 후속 조치로 기록한다.
- [ ] 실제 Firebase 환경변수 값, 관리자 UID, 관리자 비밀번호가 커밋되지 않았다.

## 완료 후 결과 문서 작성 기준

- `docs/exec-plans/admin/completed/08-admin-github-pages-deploy-result.md`를 작성한다.
- 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- 배포 script, Pages 설정값, 배포 URL, 접속 확인 결과를 기록한다.
- Firebase Auth 승인 도메인과 관리자 UID allowlist 상태를 기록한다.
- 실제 Firebase 환경변수 값, 관리자 UID, 관리자 비밀번호는 결과 문서에 기록하지 않는다.
