# 02. Firebase Functions/Firestore/Storage 기반 세팅

## 목적

Firebase Functions, Firestore, Storage, Emulator 기반을 준비해 서버가 로그인, 사용자 진행 상태, 정답 검증, 포인트 지급을 담당할 수 있는 토대를 만든다.
이 작업은 실제 Toss 로그인 구현 전에 백엔드 프로젝트 구조와 데이터 모델의 최소 기준을 세우는 작업이다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/index.md`
- `docs/product-specs/backend.md`
- `docs/product-specs/home.md`
- `docs/product-specs/quiz.md`
- `docs/product-specs/result.md`
- `docs/design-docs/style-guidelines.md`
- 작업 시작 시 직전 completed 문서가 존재하면 먼저 확인한다: `docs/exec-plans/completed/01-apps-in-toss-dev-setup-result.md`
- 필요한 배경 확인용: `INTRODUCE.md`

## 범위

- Firebase Functions 프로젝트와 로컬 Emulator 실행 기준을 준비한다.
- Firestore 컬렉션 초안인 `quizzes`, `users`, `appSessions`, `userProgress`, `rewardGrants`, `adRewardEvents`를 코드와 문서에서 같은 이름으로 사용할 수 있게 정리한다.
- Storage에는 오디오 파일을 두고 Firestore에는 `audioStoragePath`만 저장한다는 기준을 반영한다.
- KST 기준 날짜 판정, 앱 세션 확인, 공개 문제 조회 같은 공통 서버 유틸리티를 둘 위치를 정한다.
- 이후 작업에서 구현할 API 후보의 라우팅 뼈대 또는 함수 진입점을 준비한다.
- 로컬 검증에 사용할 최소 샘플 퀴즈 데이터를 준비한다.

## 제외 범위

- Toss 인가 코드 교환, 사용자 조회, 앱 세션 발급의 실제 구현은 03번 작업에서 다룬다.
- 홈의 오늘 문제 진입 분기 구현은 04번 작업에서 다룬다.
- 퀴즈 화면 UI와 오디오 재생은 05번 작업에서 다룬다.
- 답안 제출, 전면형 광고, 정답 검증, 포인트 지급, 재도전, 스크립트 열람은 이 작업에서 완성하지 않는다.
- Firestore 인덱스와 세부 보안 규칙은 제품 흐름 검증에 필요한 최소 범위를 넘겨 임의 확정하지 않는다.
- 서버 비밀키나 실제 운영 토큰을 저장소에 커밋하지 않는다.

## 작업 체크리스트

- [ ] 작업 시작 시 `docs/exec-plans/completed/01-apps-in-toss-dev-setup-result.md`가 존재하면 먼저 읽고 앱 구조와 명령 기준을 반영한다.
- [ ] Firebase Functions, Firestore, Storage, Emulator를 사용할 수 있는 프로젝트 파일과 실행 명령을 준비한다.
- [ ] Functions 코드는 프론트 프로젝트 내부의 별도 Express 서버가 아니라 Firebase Functions 기준으로 배치한다.
- [ ] Firestore 컬렉션과 필드 이름은 `docs/product-specs/backend.md`의 초안을 우선해 정리한다.
- [ ] KST 기준 오늘 날짜를 계산하는 서버 유틸리티 위치를 정하고 이후 API에서 재사용할 수 있게 한다.
- [ ] 앱 세션 토큰 확인, 오늘 공개 문제 조회, Storage 오디오 URL 생성 로직을 이후 API에서 붙일 수 있는 경계로 분리한다.
- [ ] `GET /api/check-today-quiz`, `GET /api/today-quiz`, `GET /api/reward-status`, `POST /api/login/toss`, `POST /api/answer-result`, `POST /api/rewarded-ad-complete` 후보의 진입점 또는 라우팅 기준을 준비한다.
- [ ] 로컬 Emulator에서 사용할 샘플 퀴즈는 정답, 스크립트, 포인트 금액이 클라이언트 공개 응답에 섞이지 않게 준비한다.
- [ ] 환경 변수 예시에서 서버 전용 비밀값과 공개 가능한 클라이언트 값의 구분을 유지한다.

## 검증 체크리스트

- [ ] Firebase Emulator가 로컬에서 실행된다.
- [ ] Functions 로컬 엔드포인트 또는 함수 진입점이 빈 화면/런타임 오류 없이 로드된다.
- [ ] Firestore 샘플 퀴즈 데이터에 `quizDate`, `isPublished`, `audioStoragePath`, `choices`, `correctChoiceIds`, `script`, `promotionAmount` 기준이 반영되어 있다.
- [ ] `GET /api/today-quiz`에서 나중에 반환할 공개 데이터와 서버 전용 데이터의 경계가 코드 또는 문서에 명확하다.
- [ ] Storage 오디오 파일 경로는 Firestore에 경로로만 저장되고, 클라이언트 공개 URL 생성은 서버 경계에서 처리하도록 정리되어 있다.
- [ ] 타입 검사 또는 Functions 빌드 검증 명령이 통과한다.
- [ ] 저장소에 Firebase 서비스 계정 키, Toss 비밀키, 운영 토큰이 추가되지 않았다.

## 완료 후 completed 문서 작성 기준

- `docs/exec-plans/completed/02-firebase-backend-data-setup-result.md`를 작성한다.
- 이 active 문서의 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- 각 체크 항목에는 근거가 되는 파일, 명령, Emulator 실행 결과를 짧게 기록한다.
- 완료하지 못한 항목은 체크하지 않고 미완료 사유와 03번 이후 작업에서 처리할 기준을 적는다.
- 03번 Toss 로그인/세션 구현자가 반드시 알아야 할 API 경계, 환경 변수, 데이터 모델 변경 사항을 후속 참고 사항에 남긴다.
