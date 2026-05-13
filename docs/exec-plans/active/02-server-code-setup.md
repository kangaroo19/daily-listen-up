# 2. 서버 코드 기반 세팅

## 목적

로그인, 세션, 문제 조회, 정답 검증, 포인트 지급 API가 올라갈 Express 기반 서버 코드 골격을 만든다.
초기에는 프로젝트 내부 서버로 두되, 이후 Firebase Functions로 옮길 수 있는 구조를 전제로 한다.

## 구현 범위

- repo 루트의 `server/` 아래에 서버 코드를 분리한다.
- Express 앱 생성 코드와 서버 실행 진입점을 분리한다.
- 인증 없이 호출 가능한 `GET /api/health` 라우트를 추가한다.
- `/api/health`는 다음 JSON 응답을 반환한다.
  - `{ "ok": true, "service": "daily-listen-up-server" }`
- 서버 환경값 기준을 `.env.example`에 마련한다.
- 서버 실행 스크립트와 테스트 스크립트를 추가한다.
- `/api/health`가 200으로 응답하는 최소 테스트를 작성한다.

## 제외 범위

- Toss 로그인 토큰 교환
- 앱 세션 발급
- Firebase Admin 초기화
- Firestore 또는 Storage 접근
- 오늘 문제 조회 API 구현
- 정답 검증 API 구현
- 포인트 지급 API 구현
- 광고 보상 완료 기록 API 구현
- Firebase Functions 배포 설정

## 구현 기준

- 서버 코드는 클라이언트 번들에 포함되지 않도록 `server/` 아래에 둔다.
- TypeScript를 사용한다.
- Express는 HTTP 어댑터 역할만 담당하게 하고, 실제 비즈니스 로직은 후속 작업에서 서비스 또는 핸들러 단위로 분리할 수 있게 한다.
- Express app 생성과 `listen` 실행을 분리한다.
  - 예: `server/src/app.ts`는 Express app을 만들고 export한다.
  - 예: `server/src/index.ts`는 포트를 읽어 app을 실행한다.
  - 예: `server/src/routes/health.ts`는 health 라우트를 담당한다.
- Secret 값은 코드에 하드코딩하지 않는다.
- 실제 secret 값을 담은 `.env` 파일은 커밋하지 않는다.
- 후속 API들이 같은 응답 형태를 따를 수 있도록 기본 JSON 응답을 사용한다.
- 기존 WebView 앱의 실행과 build 흐름을 깨지 않는다.

## 상태 및 예외 처리

- 서버 포트가 프론트 dev 서버와 충돌하지 않게 한다.
- 서버 포트 충돌이 발생하면 포트 기준을 임의로 한쪽만 바꾸지 말고 실행 스크립트와 `.env.example` 기준을 함께 맞춘다.
- `/api/health` 호출이 실패하면 서버 프로세스 시작, 라우트 등록, 포트 설정 순서로 점검한다.
- `.env.example`에는 이후 Toss, Firebase 관련 secret이 들어갈 위치만 마련하고 실제 값을 넣지 않는다.
- 서버 테스트가 실패하면 실패한 명령, 에러 요약, 조치 내용을 completed 문서에 기록한다.

## 완료 기준

- 서버 코드가 `server/` 아래에 분리되어 있다.
- `GET /api/health`가 HTTP 200과 `{ "ok": true, "service": "daily-listen-up-server" }` 응답을 반환한다.
- 서버 실행 스크립트가 동작한다.
- health endpoint 테스트가 통과한다.
- `.env.example`에 서버 환경값 기준이 있고 실제 secret은 커밋되지 않았다.
- 기존 WebView 앱의 `npm run dev`와 `npm run build` 흐름이 깨지지 않았다.
- 3번 Firebase 데이터/보안 작업과 4번 Toss 로그인 서버 연동이 이어서 작업할 수 있는 구조다.

## Git 전략

- 최신 `dev` 기준에서 `codex/02-server-code-setup` 브랜치를 만든다.
- 서버 구조 생성, 스크립트 연결, 테스트 추가를 의미 있는 단위로 커밋한다.
- 작업 완료 후 `docs/exec-plans/completed/02-server-code-setup-result.md`를 작성한다.
- 작업 브랜치에서 `dev`로 PR을 보낸다.
- PR 설명에는 이 active 문서와 completed 문서를 함께 링크한다.

## 다음 작업과의 연결

- 3번 Firestore/Storage 데이터 모델 및 보안 기준 구현은 이 서버 구조 안에서 Firebase Admin, Firestore, Storage 기준을 붙인다.
- 4번 Toss 로그인 서버 연동 구현은 이 서버 구조 안에 `POST /api/login/toss`를 추가한다.
- 5번 이후 API 작업은 같은 Express app, 실행 스크립트, 테스트 구조를 재사용한다.

