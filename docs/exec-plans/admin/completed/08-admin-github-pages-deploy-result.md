# 08. 관리자 앱 GitHub Pages 수동 배포 설정 결과

## 요약

관리자 앱을 GitHub Pages의 `gh-pages` 브랜치 수동 배포 방식으로 배포할 수 있도록 루트 npm script와 문서를 추가했다.
첫 실제 배포를 수행해 `gh-pages` 브랜치의 `admin/` 하위경로에 관리자 앱 산출물이 배포됐고, `https://kangaroo19.github.io/daily-listen-up/admin/`에서 로그인 화면과 정적 asset 로딩을 확인했다.

## 작업 체크리스트

- [x] 최신 `dev` 기준에서 `codex/08-admin-github-pages-deploy` 브랜치를 만든다. 근거: 원격 `dev` fetch 후 로컬 `dev` 기준 `git checkout -b codex/08-admin-github-pages-deploy` 실행. 로컬 `dev`는 `origin/dev`보다 27커밋 앞선 상태였다.
- [x] 07번 completed 문서를 읽고 관리자 앱 배포 대상 상태를 확인한다. 근거: `docs/exec-plans/admin/completed/07-admin-json-mp3-import-remove-tts-result.md` 확인.
- [x] `gh-pages` 패키지를 루트 devDependency에 추가한다. 근거: `npm install --save-dev gh-pages`.
- [x] 루트 `package.json`에 관리자 앱 Pages 빌드 script를 추가한다. 근거: `admin:pages:build`.
- [x] 루트 `package.json`에 관리자 앱 Pages 배포 script를 추가한다. 근거: `admin:pages:deploy`.
- [x] Pages 빌드 script가 `/daily-listen-up/admin/` base 경로를 사용하게 한다. 근거: `npm --prefix apps/admin run build -- --base=/daily-listen-up/admin/`.
- [x] Pages 배포 script가 `apps/admin/dist`를 `gh-pages` 브랜치의 `admin/` 하위경로로 배포하게 한다. 근거: `gh-pages -d apps/admin/dist -b gh-pages --dest admin`.
- [x] `docs/product-specs/admin.md`에 수동 배포 명령어와 배포 URL 기준을 추가한다.
- [ ] GitHub Pages 설정 기준을 작업 결과 문서에 기록한다. 기준값은 기록했으나 GitHub 설정 화면/API 직접 확인은 수행하지 못했다. 후속 조치: 저장소 Settings > Pages에서 Source `Deploy from a branch`, Branch `gh-pages`, Folder `/ (root)`를 직접 확인한다.
- [x] 첫 실제 GitHub Pages 배포를 수행한다. 근거: `npm run admin:pages:deploy`가 `Published`로 종료.
- [x] `docs/exec-plans/admin/completed/08-admin-github-pages-deploy-result.md`를 작성한다. 근거: 이 문서.

## 검증 체크리스트

- [x] `npm --prefix apps/admin run typecheck`가 통과한다. 근거: 종료 코드 0.
- [x] 관리자 앱 Pages 빌드 명령이 통과한다. 근거: `npm run admin:pages:build` 종료 코드 0. Vite chunk size 경고가 출력됐으나 빌드는 성공했다.
- [x] 관리자 앱 Pages 배포 명령이 성공한다. 근거: `npm run admin:pages:deploy` 종료 코드 0, `Published` 출력.
- [x] `gh-pages` 브랜치에 `admin/index.html`과 정적 asset이 배포된다. 근거: `git ls-tree -r --name-only origin/gh-pages admin` 결과 `admin/index.html`, `admin/assets/index-LLxzN3gk.js`, `admin/assets/index-dQwdNOmK.css` 확인.
- [ ] GitHub Pages 설정이 `gh-pages` 브랜치와 `/ (root)` 폴더를 사용한다. 배포 URL은 정상 동작하지만, `gh` CLI가 설치되어 있지 않고 GitHub 공개 Pages API가 404를 반환해 설정 화면/API 직접 확인은 수행하지 못했다.
- [x] `https://kangaroo19.github.io/daily-listen-up/admin/`에서 관리자 앱 로그인 화면이 열린다. 근거: 브라우저 확인 결과 문서 제목 `Daily Listen Up Admin`, 로그인 텍스트, 이메일/비밀번호 필드 확인.
- [x] 배포된 관리자 앱에서 정적 asset 404가 발생하지 않는다. 근거: 배포 index가 참조하는 JS/CSS asset HEAD 요청이 모두 HTTP 200.
- [ ] Firebase Auth 승인 도메인에 `kangaroo19.github.io`가 등록되어 있다. Firebase Auth config API 확인 시 권한 오류가 발생해 직접 확인하지 못했다.
- [ ] 관리자 UID allowlist가 반영된 환경에서는 날짜별 퀴즈 목록 조회가 가능하다. 관리자 계정/비밀번호를 사용하지 않아 로그인 후 목록 조회는 수행하지 않았다.
- [x] 관리자 UID allowlist 미반영으로 권한 오류가 남으면 completed 문서에 후속 조치로 기록한다. 현재는 UID allowlist 반영 여부를 직접 확인하지 못했으므로 후속 조치로 기록한다.
- [x] 실제 Firebase 환경변수 값, 관리자 UID, 관리자 비밀번호가 커밋되지 않았다. 근거: `apps/admin/.env.local`과 `apps/admin/.env.production.local`은 `.gitignore`의 `.env.*` 대상이며, 변경 파일에는 실제 값이 없다.

## 배포 기준 기록

- Pages URL: `https://kangaroo19.github.io/daily-listen-up/admin/`
- Vite base: `/daily-listen-up/admin/`
- 배포 브랜치: `gh-pages`
- 배포 경로: `admin/`
- Pages Source 기준: `Deploy from a branch`
- Pages Branch 기준: `gh-pages`
- Pages Folder 기준: `/ (root)`
- 빌드 명령: `npm run admin:pages:build`
- 배포 명령: `npm run admin:pages:deploy`

## 검증 결과

- `npm --prefix apps/admin run typecheck`: 통과.
- `npm run admin:pages:build`: 통과. 산출물 `apps/admin/dist/index.html`은 `/daily-listen-up/admin/assets/...` 경로로 JS/CSS를 참조한다.
- `npm run admin:pages:deploy`: 통과, `Published` 출력.
- `git ls-tree -r --name-only origin/gh-pages admin`: `admin/index.html`, JS asset, CSS asset 확인.
- 배포 URL 브라우저 확인: 로그인 화면, 이메일/비밀번호 필드, 콘솔 에러 없음.
- 정적 asset 확인: JS/CSS asset HTTP 200.

## 미수행 또는 후속 조치

- GitHub Pages 설정 화면/API 직접 확인: `gh` CLI가 설치되어 있지 않고 GitHub 공개 Pages API가 404를 반환해 직접 확인하지 못했다. 저장소 Settings > Pages에서 Source `Deploy from a branch`, Branch `gh-pages`, Folder `/ (root)`를 확인해야 한다.
- Firebase Auth 승인 도메인 확인: Identity Toolkit config API가 권한 오류를 반환해 `kangaroo19.github.io` 등록 여부를 직접 확인하지 못했다. Firebase Console > Authentication > Settings > Authorized domains에서 등록 여부를 확인하고, 없으면 추가해야 한다.
- 날짜별 퀴즈 목록 조회: 관리자 계정/비밀번호를 사용하지 않아 로그인 후 Firestore 목록 조회를 수행하지 않았다. Auth 승인 도메인과 관리자 UID allowlist 반영 후 배포 URL에서 로그인해 목록 조회를 확인해야 한다.

## 보안 확인

- 실제 Firebase 환경변수 값은 `apps/admin/.env.local`에만 있으며 `.gitignore` 대상이다.
- 결과 문서에는 실제 Firebase 환경변수 값, 관리자 UID, 관리자 비밀번호를 기록하지 않았다.
- 이 작업에서 Firebase Functions, Firestore Rules, Storage Rules는 배포하지 않았다.
- 사용자 앱 `src/`와 Apps in Toss 배포 설정은 변경하지 않았다.
