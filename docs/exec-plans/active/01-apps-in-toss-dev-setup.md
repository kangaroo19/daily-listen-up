# 01. Apps in Toss 앱/개발 환경 세팅

## 목적

`daily-listen-up`을 Apps in Toss 비게임 WebView 미니앱으로 개발할 수 있는 최소 앱/개발 환경을 준비한다.
이 작업은 이후 Firebase, Toss 로그인, 홈, 퀴즈 화면 작업이 같은 실행 기준에서 이어질 수 있게 하는 기반 작업이다.

## 참조 문서

- `AGENTS.md`
- `docs/exec-plans/index.md`
- `docs/product-specs/home.md`
- `docs/product-specs/quiz.md`
- `docs/product-specs/result.md`
- `docs/product-specs/backend.md`
- `docs/design-docs/style-guidelines.md`
- 필요한 배경 확인용: `INTRODUCE.md`

## 범위

- Apps in Toss WebView 미니앱으로 로컬 개발을 시작할 수 있는 프론트엔드 앱 구조를 준비한다.
- 비게임 미니앱 기준으로 TDS를 사용할 수 있는 의존성과 기본 진입점을 준비한다.
- 홈, 문제 풀이, 결과 화면을 나중에 붙일 수 있는 최소 라우팅 또는 화면 전환 구조를 준비한다.
- Firebase 클라이언트 SDK와 Toss SDK를 이후 작업에서 연결할 수 있도록 환경 변수와 설정 파일의 위치만 정리한다.
- 로컬 개발 실행, 타입 검사, 빌드 검증 명령을 문서화한다.

## 제외 범위

- Firebase Functions, Firestore, Storage 구현은 02번 작업에서 다룬다.
- Toss 로그인과 앱 세션 구현은 03번 작업에서 다룬다.
- 오늘 문제 조회, 홈 진입 분기, 퀴즈 UI, 답안 제출, 광고, 포인트 지급은 구현하지 않는다.
- ESLint, Prettier, TypeScript 설정값처럼 팀 결정이 필요한 항목은 임의로 새로 정하지 않는다.
- 제품 스펙에 없는 화면, 온보딩, 관리자 기능, 콘텐츠 관리 기능은 만들지 않는다.

## 작업 체크리스트

- [ ] `docs/exec-plans/index.md`의 MVP 개발 기준과 01번 작업 범위를 다시 확인한다.
- [ ] Apps in Toss WebView 미니앱 개발에 필요한 프로젝트 구조가 없으면 최소 구조를 생성하고, 이미 있으면 기존 구조를 유지한다.
- [ ] 비게임 미니앱 기준으로 TDS 사용에 필요한 패키지와 import 기준을 확인하고 프로젝트에 반영한다.
- [ ] 앱의 첫 화면이 홈 화면 작업을 이어받을 수 있는 최소 엔트리로 실행되게 한다.
- [ ] 홈, 문제 풀이, 결과 화면을 이후 작업에서 연결할 수 있도록 라우팅 또는 화면 전환 위치를 정한다.
- [ ] 환경 변수 예시 파일 또는 문서에 공개 가능한 클라이언트 설정값과 서버 전용 비밀값을 구분해 적는다.
- [ ] Firebase, Toss, Toss Ads의 실제 연동 로직은 더미나 TODO 수준으로만 남기고 제품 흐름을 구현하지 않는다.
- [ ] 로컬 개발 실행 명령, 타입 검사 명령, 빌드 명령을 README 또는 작업 결과 문서에 기록할 수 있게 확인한다.

## 검증 체크리스트

- [ ] 로컬 개발 서버가 실행되고 앱 첫 화면이 빈 화면 없이 열린다.
- [ ] 타입 검사 또는 이에 준하는 정적 검증 명령이 통과한다.
- [ ] 빌드 명령이 통과한다.
- [ ] TDS를 기본 UI 기준으로 사용할 수 있는 의존성과 import 경로가 확인된다.
- [ ] 클라이언트 코드에 서버 비밀키, Toss access token, 원본 `userKey`를 저장하거나 노출하는 코드가 없다.
- [ ] 02번 이후 작업에서 Firebase와 Toss 연동을 이어갈 위치가 명확하다.

## 완료 후 completed 문서 작성 기준

- `docs/exec-plans/completed/01-apps-in-toss-dev-setup-result.md`를 작성한다.
- 이 active 문서의 작업 체크리스트와 검증 체크리스트를 가져와 실제 결과에 따라 `- [x]` 또는 `- [ ]`로 표시한다.
- 각 체크 항목에는 근거가 되는 파일, 명령, 실행 결과를 짧게 기록한다.
- 완료하지 못한 항목은 체크하지 않고 미완료 사유와 후속 작업 번호를 적는다.
- 구현 중 02번 이후 작업 범위에 영향을 주는 구조나 정책 변경이 생겼다면 completed 문서의 후속 참고 사항에 남긴다.
