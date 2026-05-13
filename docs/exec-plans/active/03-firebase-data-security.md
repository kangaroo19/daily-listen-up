# 3. Firestore/Storage 데이터 모델 및 보안 기준 구현

## 목적

후속 로그인, 세션, 문제 조회, 정답 검증, 보상 API가 같은 데이터 구조와 보안 원칙 위에서 구현되도록 Firebase 기반을 만든다.
Firestore와 Storage는 서버 중심으로 접근하게 하고, 클라이언트가 민감한 데이터에 직접 접근하지 못하게 한다.

## 구현 범위

- Firebase 설정 파일을 추가한다.
  - `firebase.json`
  - `firestore.rules`
  - `storage.rules`
  - `firestore.indexes.json`
- 서버 코드 아래에 Firebase Admin 초기화 구조를 추가한다.
  - `server/src/firebase/admin.ts`
- Firestore 컬렉션 이름 상수를 추가한다.
  - `server/src/firebase/collections.ts`
- Storage 오디오 경로 helper를 추가한다.
  - `server/src/firebase/storagePaths.ts`
- `.env.example`에 Firebase project, emulator, service account 관련 환경변수 이름을 추가한다.
- 컬렉션별 필드 shape를 코드 상수, 타입, 또는 주석으로 표현한다.
- Firestore와 Storage rules는 기본 차단 정책을 기준으로 작성한다.

## 제외 범위

- 실제 Firebase 운영 프로젝트 연결
- 실제 service account key 커밋
- Firebase Functions 배포
- Firestore seed 데이터 생성
- 실제 오디오 파일 업로드
- Toss 로그인 결과 저장
- 오늘 문제 조회 API 구현
- 정답 검증 API 구현
- 포인트 지급 API 구현
- 광고 보상 완료 기록 API 구현
- emulator 기반 rules 자동 테스트 필수화

## 구현 기준

- Firebase Admin은 서버 코드에서만 import한다.
- 클라이언트 번들에서 Firebase Admin 코드가 참조되지 않게 한다.
- Secret 값은 코드와 repo에 하드코딩하지 않는다.
- 실제 secret 값을 담은 `.env` 파일은 커밋하지 않는다.
- `.env.example`에는 환경변수 이름과 설명만 두고 실제 credential 값을 넣지 않는다.
- Firestore 직접 클라이언트 접근은 기본 차단한다.
- Storage 직접 클라이언트 접근은 기본 차단한다.
- 프론트는 후속 서버 API가 내려주는 공개 데이터와 오디오 URL을 사용한다.
- `correctChoiceIds`, 원본 Toss `userKey`, 보상 상태, 광고 보상 기록은 서버 전용 데이터로 둔다.
- Firestore에는 오디오 파일 자체가 아니라 Storage path만 저장한다.

## 데이터 모델 기준

Firestore 컬렉션은 `docs/product-specs/backend.md`의 초안을 따른다.

- `quizzes`
  - `quizDate`
  - `isPublished`
  - `questionText`
  - `audioStoragePath`
  - `choices`
  - `correctChoiceIds`
  - `script`
  - `promotionAmount`
- `users`
  - 내부 사용자 ID
  - 서버 전용 `userKey`
  - 로그인 시각
- `appSessions`
  - 세션 토큰 식별자
  - 내부 사용자 ID
  - KST 당일 만료 시각
- `userProgress`
  - 사용자+날짜 기준 진행 상태
  - 시도 수
  - 마지막 제출 답안
  - 정답 여부
  - 재도전 가능 여부
  - 스크립트 열람 여부
  - 포인트 지급 상태
  - 포인트 지급 실패 시 고객 안내 또는 재확인 대상 여부
- `rewardGrants`
  - 사용자+날짜 기준 프로모션 지급 key
  - 지급 금액
  - 지급 상태
- `adRewardEvents`
  - 사용자
  - 날짜
  - 목적: `retry` 또는 `script`
  - `userEarnedReward` 기록

Storage 오디오 파일 경로는 다음 기준을 따른다.

- `quiz-audio/{quizDate}/{quizId}.mp3`

샘플 seed 파일은 만들지 않는다.
필요한 샘플 quiz 데이터는 7번 오늘 문제 조회 API와 콘텐츠 로딩 구현에서 만든다.

## 상태 및 예외 처리

- Firebase env 값이 없을 때 서버가 어떤 에러를 내는지 명확히 한다.
- 로컬 개발에서는 emulator 또는 project id 기준을 `.env.example`에 적는다.
- service account JSON 원문을 `.env.example`에 넣지 않는다.
- Storage path helper는 `quizDate`와 `quizId`가 없으면 잘못된 경로를 만들지 않게 한다.
- Firebase Admin 초기화 실패 시 secret 누락, project id 누락, credential 형식 오류를 구분해 점검할 수 있게 한다.
- 기존 2번 서버의 `/api/health` 흐름을 깨지 않는다.

## 완료 기준

- `firebase.json`, `firestore.rules`, `storage.rules`, `firestore.indexes.json` 파일이 존재한다.
- 서버 Firebase Admin 초기화 모듈이 `server/` 아래에 분리되어 있다.
- Firestore 컬렉션 이름 기준이 서버 코드에서 재사용 가능한 형태로 존재한다.
- Storage 오디오 경로 기준이 서버 코드에서 재사용 가능한 형태로 존재한다.
- `.env.example`에 Firebase 관련 환경변수 이름이 있고 실제 secret 값은 없다.
- Firestore rules가 기본 차단 정책을 표현한다.
- Storage rules가 기본 차단 정책을 표현한다.
- 클라이언트 코드가 Firebase Admin 모듈을 import하지 않는다.
- 기존 2번 `/api/health` 서버 흐름이 깨지지 않는다.
- 4번 Toss 로그인 서버 연동과 7번 오늘 문제 조회 API가 이 구조를 사용할 수 있다.

## Git 전략

- 최신 `dev` 기준에서 `codex/03-firebase-data-security` 브랜치를 만든다.
- Firebase 설정/rules, 서버 Admin 구조, 상수/helper, 검증 기록을 의미 있는 단위로 커밋한다.
- 작업 완료 후 `docs/exec-plans/completed/03-firebase-data-security-result.md`를 작성한다.
- 작업 브랜치에서 `dev`로 PR을 보낸다.
- PR 설명에는 이 active 문서와 completed 문서를 함께 링크한다.

## 다음 작업과의 연결

- 4번 Toss 로그인 서버 연동 구현은 `users`와 Firebase Admin 구조를 사용해 Toss 로그인 결과를 저장한다.
- 5번 앱 세션 및 사용자 진행 상태 API 구현은 `appSessions`, `userProgress` 기준을 사용한다.
- 7번 오늘 문제 조회 API와 콘텐츠 로딩 구현은 `quizzes`와 Storage audio path 기준을 사용한다.
- 11번 정답 검증 API 구현은 `correctChoiceIds`를 서버에서만 읽어 정답을 검증한다.
- 13번 포인트 지급 및 지급 상태 조회 서버 연동은 `rewardGrants` 기준을 사용한다.
- 15번 보상형 광고 완료 기록 공통 처리 구현은 `adRewardEvents` 기준을 사용한다.

