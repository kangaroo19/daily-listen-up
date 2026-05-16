# 6. Toss 로그인 클라이언트 및 홈 CTA 구현

## 목적

사용자가 홈 화면에서 `시작하기`를 눌러 Toss 로그인 흐름을 완료하고, 서버에서 발급한 앱 세션을 클라이언트에 저장한 뒤 후속 API 호출을 준비할 수 있게 한다.

## 구현 범위

- 기존 Apps in Toss scaffold 안내 화면을 MVP 홈 화면으로 교체한다.
- 홈 화면 문구는 `docs/product-specs/home.md` 기준을 따른다.
  - 제목: `오늘의 영어 듣고 포인트 받기`
  - 설명: `짧은 영어 음성을 듣고 문제를 맞히면 토스 포인트 보상에 도전할 수 있어요.`
  - 보조 설명: `하루에 한 문제만 제공돼요.`
  - 주요 버튼: `시작하기`
- 홈 화면의 주요 CTA는 `시작하기` 하나로 둔다.
- `시작하기` 클릭 시 `@apps-in-toss/web-framework`의 `appLogin()`을 호출한다.
- `appLogin()`이 반환한 `authorizationCode`, `referrer`를 `POST /api/login/toss`로 전송한다.
- 로그인 성공 응답의 `sessionToken`, `expiresAt`을 `sessionStorage`에 저장한다.
  - `daily-listen-up.sessionToken`
  - `daily-listen-up.sessionExpiresAt`
- 세션 저장 직후 `GET /api/me`를 호출해 세션 유효성과 현재 사용자 상태를 확인한다.
- 프론트 API base URL은 `VITE_API_BASE_URL` 환경변수를 사용한다.
- `.env.example`에 `VITE_API_BASE_URL=http://localhost:4000` 기준을 추가한다.
- 로그인 진행, 성공, 실패 상태를 홈 화면 안에서 표현한다.
- 로그인 흐름과 API 호출 흐름을 검증할 수 있게 클라이언트 코드 구조를 분리한다.

## 제외 범위

- Toss token exchange 서버 구현
- Toss 사용자 정보 조회 서버 구현
- 앱 세션 발급 서버 구현
- 세션 검증 API 서버 구현
- 오늘 문제 조회 API 구현
- 오늘 문제 콘텐츠 로딩 구현
- 로그인 성공 후 실제 문제 화면 이동
- 이미 완료한 사용자 결과 화면 이동
- 오늘 문제 없음 상태 구현
- 라우팅 라이브러리 추가
- 퀴즈 UI 구현
- 결과 화면 구현
- Toss Ads 또는 광고 SDK 연동
- Firebase 클라이언트 SDK 연동

## 구현 기준

- TDS 컴포넌트를 우선 사용한다.
- 모바일 WebView 기준으로 상단에는 서비스 설명, 하단에는 주요 CTA를 둔다.
- 한 화면에는 로그인 시작이라는 하나의 주요 목적만 둔다.
- 임의의 외부 UI 라이브러리나 라우팅 라이브러리를 추가하지 않는다.
- `appLogin()`은 사용자가 `시작하기`를 누른 뒤에만 호출한다.
- `authorizationCode`는 클라이언트에 장기간 저장하지 않는다.
- Toss access token, refresh token, 원본 Toss `userKey`는 클라이언트에 저장하거나 표시하지 않는다.
- `POST /api/login/toss` 요청 body는 다음 기준을 따른다.
  - `authorizationCode`
  - `referrer`
- `GET /api/me` 호출 시 앱 세션 토큰을 `Authorization: Bearer ${sessionToken}` 헤더로 전달한다.
- API URL은 `VITE_API_BASE_URL`과 API path를 조합한다.
- 로그인 성공 후 실제 오늘 문제 조회나 화면 이동은 하지 않는다.
- 로그인 성공 후에는 `로그인 완료, 오늘 문제를 준비 중` 성격의 대기 상태까지만 표현한다.
- 오늘 문제 조회, 실제 진입 분기, 문제 없음 상태는 7번과 8번 작업에서 구현한다.
- 기존 TDS provider와 Apps in Toss WebView 실행 흐름을 깨지 않는다.

## 상태 및 예외 처리

- 기본 상태에서는 `시작하기` CTA를 활성화한다.
- 로그인 진행 중에는 CTA를 비활성화하고 중복 클릭을 막는다.
- 로그인 진행 중에는 사용자가 기다릴 수 있는 짧은 상태 문구를 보여준다.
- `appLogin()`이 취소되거나 실패하면 홈에 머물고 `로그인을 완료하지 못했어요. 다시 시작해 주세요.` 안내를 보여준다.
- `POST /api/login/toss`가 실패하면 홈에 머물고 같은 실패 안내를 보여준다.
- `GET /api/me`가 실패하면 저장한 세션 정보를 제거하고 홈에 머물게 한다.
- `VITE_API_BASE_URL`이 비어 있거나 API 호출 URL을 만들 수 없으면 로그인 요청을 보내지 않고 실패 상태를 보여준다.
- 로그인 실패 후 사용자가 다시 `시작하기`를 누를 수 있어야 한다.
- 로그인 성공 후 대기 상태에서는 다음 작업에서 오늘 문제 조회가 붙을 수 있도록 상태와 함수 경계를 유지한다.

## 완료 기준

- scaffold 안내 화면이 MVP 홈 화면 문구와 CTA로 교체되어 있다.
- 홈 화면에서 TDS 컴포넌트를 우선 사용한다.
- `시작하기` 클릭 시 `appLogin()`을 호출하는 코드가 존재한다.
- `appLogin()` 결과의 `authorizationCode`, `referrer`를 `POST /api/login/toss`로 전달한다.
- 로그인 성공 시 `sessionStorage`에 `daily-listen-up.sessionToken`, `daily-listen-up.sessionExpiresAt`을 저장한다.
- 세션 저장 후 `GET /api/me`를 `Authorization: Bearer ${sessionToken}` 헤더와 함께 호출한다.
- `appLogin()` 취소 또는 실패 시 홈에 머물고 실패 안내를 보여준다.
- 서버 로그인 실패 시 홈에 머물고 실패 안내를 보여준다.
- `/api/me` 실패 시 저장한 세션 정보를 제거하고 실패 안내를 보여준다.
- 로그인 진행 중 CTA가 비활성화되어 중복 요청이 발생하지 않는다.
- 클라이언트 코드가 Toss access token, refresh token, 원본 `userKey`를 저장하거나 표시하지 않는다.
- `.env.example`에 `VITE_API_BASE_URL=http://localhost:4000` 기준이 있다.
- 오늘 문제 조회, 홈 진입 분기, 문제 없음 상태가 이 작업에 섞이지 않았다.
- `npm run build`가 통과한다.
- `npm run lint`가 통과한다.
- 가능하면 다음 흐름에 대한 컴포넌트 또는 함수 단위 테스트가 존재한다.
  - CTA 클릭 시 `appLogin()` 호출
  - 로그인 성공 시 `POST /api/login/toss` 요청 body 확인
  - 성공 응답 저장 시 `sessionStorage` key 확인
  - `/api/me` 호출에 Bearer token 헤더 포함 확인
  - 로그인 실패 또는 취소 시 CTA 재활성화와 실패 안내 표시

## Git 전략

- 최신 `dev` 기준에서 `codex/06-toss-login-home-cta` 브랜치를 만든다.
- 홈 화면 교체, 로그인 API client, 세션 저장, 상태 처리, 검증 기록을 의미 있는 단위로 커밋한다.
- 작업 완료 후 `docs/exec-plans/completed/06-toss-login-home-cta-result.md`를 작성한다.
- 작업 브랜치에서 `dev`로 PR을 보낸다.
- PR 설명에는 이 active 문서와 completed 문서를 함께 링크한다.

## 다음 작업과의 연결

- 7번 오늘 문제 조회 API와 콘텐츠 로딩 구현은 이 작업에서 저장한 `sessionToken`으로 인증된 API 호출을 이어간다.
- 7번은 오늘 문제가 실제로 존재할 때 `userProgress`를 초기화한다.
- 8번 홈 진입 분기와 문제 없음 상태 구현은 이 작업의 로그인 완료 상태, 5번 `GET /api/me`, 7번 오늘 문제 조회 결과를 조합해 문제 화면, 완료 화면, 문제 없음 상태로 분기한다.
- 9번 이후 퀴즈 화면 작업은 7번과 8번에서 연결된 오늘 문제 데이터를 기반으로 진행한다.
