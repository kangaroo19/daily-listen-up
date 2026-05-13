# 1. Apps in Toss 기본 앱 구조 세팅

## 목적

후속 작업에서 홈, 로그인, 퀴즈, 결과 화면을 구현할 수 있도록 Apps in Toss WebView 미니앱의 최소 실행 기반을 만든다.

## 구현 범위

- npm 기준으로 Apps in Toss WebView 앱을 스캐폴드한다.
- repo 루트에 `package.json`, `src`, `index.html`, `granite.config.ts` 등 앱 실행에 필요한 기본 파일을 둔다.
- `create-ait-app` 선택값은 다음 기준을 따른다.
  - TDS: 사용
  - AI Skills: 추가하지 않음
  - 예제 코드: 추가하지 않음
- `granite.config.ts`에 앱 식별값을 설정한다.
  - `appName`: `daily-english-listening`
  - `brand.displayName`: `오늘의 리스닝`
  - `web.port`: scaffold 기본값을 유지한다.
- 기본 개발 서버 실행과 production build가 가능한지 확인한다.
- 기존 `docs`, `INTRODUCE.md`, `AGENTS.md`, `TERMS_OF_SERVICE.md` 문서는 유지한다.

## 제외 범위

- 홈 화면 구현
- Toss 로그인 연동
- Firebase, Firestore, Storage 연동
- 서버 코드 작성
- 광고 SDK 연동
- 퀴즈, 결과 화면 라우팅
- 실제 오디오 또는 문제 데이터 추가
- Apps in Toss 배포 또는 출시 설정

## 구현 기준

- 공식 WebView 시작 기준에 따라 `npm create ait-app daily-english-listening` 명령을 사용한다.
- repo 루트가 비어 있지 않으므로 임시 위치에서 앱을 생성한 뒤 생성된 앱 파일을 repo 루트로 옮긴다.
- scaffold 과정에서 기존 문서와 약관 파일을 삭제하거나 덮어쓰지 않는다.
- TDS를 기본 UI 기준으로 사용할 수 있는 의존성과 설정이 포함되어야 한다.
- 임의의 디자인 시스템, 라우팅 라이브러리, 상태관리 라이브러리는 추가하지 않는다.
- scaffold 기본 화면은 실행 확인용으로만 유지하고 제품 문구나 홈 CTA를 넣지 않는다.
- 개발 명령은 Windows PowerShell 환경에서도 실행 가능한 형태로 확인한다.

## 상태 및 예외 처리

- 포트 충돌이 발생하면 임의로 포트만 바꾸지 말고 `granite.config.ts`의 `web.port`와 실행 명령의 기준을 함께 맞춘다.
- 임시 위치에서 생성한 scaffold 결과를 루트로 옮길 때 기존 repo 파일과 충돌하는 파일이 있으면 덮어쓰기 전에 내용을 비교한다.
- 생성된 예제 코드나 샘플 기능이 있다면 MVP 범위와 무관한 기능은 남기지 않는다.
- `npm install`, `npm run dev`, `npm run build` 중 실패가 발생하면 실패 명령, 에러 요약, 조치 내용을 completed 문서에 기록한다.
- 개발 서버 실행 확인 후 장시간 백그라운드 프로세스가 남지 않도록 종료한다.

## 완료 기준

- `npm install`이 성공하고 npm lockfile이 생성된다.
- `npm run dev`로 로컬 개발 서버를 실행할 수 있다.
- `npm run build`가 성공하고 production build 결과물이 생성된다.
- `granite.config.ts`에 `daily-english-listening`과 `오늘의 리스닝`이 반영되어 있다.
- TDS 사용 전제가 의존성 또는 설정에 반영되어 있다.
- 기존 문서와 약관 파일이 삭제되거나 덮어써지지 않았다.
- 2번 서버 코드 기반 세팅 전에 프론트 앱이 독립적으로 실행 가능한 상태다.

## Git 전략

- 최신 `dev` 기준에서 `codex/01-apps-in-toss-setup` 브랜치를 만든다.
- scaffold 생성, 설정 정리, 검증 기록처럼 의미 있는 단위로 커밋한다.
- 작업 완료 후 `docs/exec-plans/completed/01-apps-in-toss-setup-result.md`를 작성한다.
- 작업 브랜치에서 `dev`로 PR을 보낸다.
- PR 설명에는 이 active 문서와 completed 문서를 함께 링크한다.

## 다음 작업과의 연결

- 2번 서버 코드 기반 세팅은 이 앱 구조 안에서 서버 코드를 둘 위치를 정한다.
- 6번 Toss 로그인 클라이언트 및 홈 CTA 구현은 1번에서 만든 기본 앱 화면을 실제 홈 화면으로 교체한다.
- 19번 전체 화면 UI 정리 및 TDS 스타일 적용은 1번에서 선택한 TDS 기반 위에서 진행한다.

