# 2. 서버 코드 기반 세팅 결과

## 작업 요약

- `server/` 아래에 Express 기반 서버 코드를 분리했다.
- Express app 생성(`server/src/app.ts`)과 서버 실행 진입점(`server/src/index.ts`)을 분리했다.
- 인증 없이 호출 가능한 `GET /api/health` 라우트를 추가했다.
- 서버 실행, 서버 테스트, 서버 타입 체크 스크립트를 추가했다.
- `.env.example`에 서버 포트와 후속 Toss/Firebase secret 자리만 마련했다.

## 변경 파일

- `server/src/app.ts`
- `server/src/index.ts`
- `server/src/routes/health.ts`
- `server/src/routes/health.test.ts`
- `.env.example`
- `tsconfig.server.json`
- `package.json`
- `package-lock.json`
- `eslint.config.js`

## 완료 기준 확인

- [x] 서버 코드가 `server/` 아래에 분리되어 있다.
  - 확인: `server/src/app.ts`, `server/src/index.ts`, `server/src/routes/health.ts`

- [x] `GET /api/health`가 HTTP 200과 `{ "ok": true, "service": "daily-listen-up-server" }` 응답을 반환한다.
  - 확인 명령: `npm run test:server`
  - 실행 결과: 1개 테스트 통과
  - 추가 확인: `npm run dev:server`를 백그라운드 실행 후 `http://127.0.0.1:4000/api/health` 호출 결과 동일 JSON 반환

- [x] 서버 실행 스크립트가 동작한다.
  - 확인 명령: `npm run dev:server`
  - 실행 결과: `SERVER_PORT` 기본값 4000에서 health endpoint 응답 확인

- [x] health endpoint 테스트가 통과한다.
  - 확인 명령: `npm run test:server`
  - 실행 결과: `server/src/routes/health.test.ts` 통과

- [x] `.env.example`에 서버 환경값 기준이 있고 실제 secret은 커밋되지 않았다.
  - 확인: `.env.example`에는 `SERVER_PORT`, Toss/Firebase placeholder만 포함
  - 확인: `.gitignore`는 `.env`, `.env.*`를 제외하고 `!.env.example`만 허용

- [ ] 기존 WebView 앱의 `npm run dev`와 `npm run build` 흐름이 깨지지 않았다.
  - `npm run build`: 성공
  - `npm run dev`: 현재 같은 프로젝트의 기존 `node ... @apps-in-toss/web-framework/bin.js dev` 프로세스가 `0.0.0.0:8081`을 점유 중이라 새 실행은 `EADDRINUSE`로 실패
  - 조치: 사용자 실행 중일 수 있는 기존 dev 프로세스는 종료하지 않았고, 포트 충돌 사실만 기록

- [x] 3번 Firebase 데이터/보안 작업과 4번 Toss 로그인 서버 연동이 이어서 작업할 수 있는 구조다.
  - 확인: Express app 생성과 listen 분리
  - 확인: 라우트 파일을 `server/src/routes/` 아래에 분리
  - 확인: 서버 전용 TypeScript 설정과 테스트 스크립트 추가

## 실행한 검증 명령

- `npm run test:server`
- `npm run typecheck:server`
- `npm run lint`
- `npm run build`
- `npm run dev:server` 백그라운드 실행 후 `GET /api/health` 호출
- `npm run dev`

## 참고 사항

- `npm install` 과정에서 기존 Apps in Toss 의존성 하위 패키지의 peer dependency 경고와 기존 audit 취약점 알림이 출력되었다. 이번 작업 범위의 서버 코드 변경과 직접 관련이 없어 별도 수정하지 않았다.
- `npm run lint`가 `.vite` 생성 파일을 검사하지 않도록 ESLint ignore 기준을 `.gitignore`와 맞췄다.
