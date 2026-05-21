# 백엔드

## 목적

클라이언트에서 직접 처리하면 안 되는 로그인, 사용자 식별, 정답 검증, 포인트 지급, 중복 지급 방지 책임을 서버에서 처리한다.

## 기본 전제

- 백엔드는 Firebase Functions로 구현한다.
- 로컬 개발과 검증은 Firebase Emulator를 기준으로 한다.
- 프론트 프로젝트 내부에는 별도 Express/서버 코드를 두지 않는다.
- DB는 Firestore를 사용한다.
- 오디오 파일은 Firebase Storage에 보관한다.
- 클라이언트에는 공개 가능한 값만 둔다.
- 토큰, 서버 비밀키, 포인트 지급에 필요한 민감한 값은 서버에서만 다룬다.

## 서버가 담당할 제품 책임

- 토스 로그인 인가 코드 처리
- 토스 사용자 식별값 확보
- 오늘 문제에 대한 정답 검증
- 정답 사용자에 대한 포인트 지급 요청
- 하루 1회 보상 지급 보장
- 중복 요청에 대한 중복 지급 방지
- 지급 결과 저장과 재조회 기준 제공

## 참고 문서

- [appLogin](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EB%A1%9C%EA%B7%B8%EC%9D%B8/appLogin.md)
- [토스 로그인 개발하기](https://developers-apps-in-toss.toss.im/login/develop.html)
- [비게임 프로모션](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EB%B9%84%EA%B2%8C%EC%9E%84/promotion.md)
- [인앱 광고](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/%EA%B4%91%EA%B3%A0/IntegratedAd.md)

## API 후보

아래 API는 Firebase HTTPS Functions로 제공하는 HTTP API 후보이며, 제품 흐름을 설명하기 위한 후보이다.
세부 요청/응답 형식은 구현 단계에서 확정한다.

### `POST /api/login/toss`

- 토스 로그인 결과를 서버에서 검증하고, 토스 사용자 식별값을 우리 앱 세션으로 변환하는 로그인 API다.

처리 과정:

  1. 클라이언트가 `appLogin()` 결과인 `authorizationCode`, `referrer`를 서버에 전달한다.
  2. 서버가 토스 `POST /api-partner/v1/apps-in-toss/user/oauth2/generate-token`로 access token을 발급받는다.
  3. 서버가 access token으로 토스 `GET /api-partner/v1/apps-in-toss/user/oauth2/login-me`를 호출해 사용자 정보를 조회한다.
  4. 서버가 조회 결과에서 `userKey`를 확보하고, 내부 사용자 ID와 당일 만료되는 앱 세션을 생성한다.
  5. 서버는 프론트에 토스 토큰이나 원본 `userKey`를 내려주지 않고, 이후 우리 서버 API 인증에 사용할 `daily-listen-up` 앱 세션 토큰만 내려준다.
  6. 토큰 교환 또는 사용자 조회에 실패하면 앱 세션 토큰을 발급하지 않는다.

### `GET /api/check-today-quiz`

  - 앱 세션 확보 이후 호출한다.
  - 서버 KST 기준으로 오늘 공개된 문제가 있는지 여부만 반환한다.
  - 완료 여부, 지급 상태, 문제 본문, 선택지, 오디오 URL은 반환하지 않는다.

### `POST /api/answer-result`

  - 결과 확인 전면형 광고 완료 후 선택 답안을 검증하고 정답/오답 및 포인트 지급 상태를 반환한다.
  - 정답이면 오늘 학습 완료 상태로 기록하고 포인트 지급 흐름에 진입한다.

### `GET /api/reward-status`

  - 포인트 지급 상태를 `pending`, `success`, `failed` 중 하나로 반환한다.
  - 홈의 `시작하기` 클릭 후 앱 세션 확보와 오늘 문제 존재 확인이 완료되면 이 API로 오늘의 지급 상태를 확인한다.

### `POST /api/rewarded-ad-complete`

  - 보상형 광고의 `userEarnedReward` 확인 후 `retry` 또는 `script` 권한을 기록한다.
  - 결과 확인 전면형 광고 완료 여부는 이 API에서 기록하지 않는다.

## Firestore 컬렉션 초안

### `quizzes`

- `quizDate`
- `isPublished`
- `questionText`
- `audioStoragePath`
- `choices`
- `correctChoiceIds`
- `script`
- `promotionAmount`

### `users`

- 내부 사용자 ID
- 서버 전용 `userKey`
- 로그인 시각

### `appSessions`

- 세션 토큰 식별자
- 내부 사용자 ID
- KST 당일 만료 시각

### `userProgress`

- 사용자+날짜 기준 진행 상태
- 시도 수
- 마지막 제출 답안
- 정답 여부
- 재도전 가능 여부
- 스크립트 열람 여부
- 포인트 지급 상태
- 포인트 지급 실패 시 고객 안내 또는 재확인 대상 여부

### `rewardGrants`

- 사용자+날짜 기준 프로모션 지급 key
- 지급 금액
- 지급 상태

### `adRewardEvents`

- 사용자
- 날짜
- 목적: `retry` 또는 `script`
- `userEarnedReward` 기록

## 데이터와 보안 정책

- 날짜 기준은 서버 KST 기준으로 판정한다.
- 인가 코드는 클라이언트에서 장기간 저장하지 않는다.
- 토스 access token, refresh token 같은 민감한 정보는 서버에서만 다룬다.
- 프론트에는 토스 access token이나 원본 `userKey`를 내려주지 않는다.
- 앱 세션 토큰 만료는 토스 로그인 연결 자체를 끊는 정책이 아니다.
- 문서 ID에는 원본 `userKey`를 직접 쓰지 않고 해시 또는 내부 ID를 사용한다.
- 원본 `userKey`는 서버 전용 필드로만 보관한다.
- 정답 목록은 제출 전 클라이언트에 내려주지 않는다.
- 답안 검증은 결과 확인 전면형 광고 완료 후 서버 API로 수행한다.
- Storage에는 오디오 파일을 두고, Firestore에는 `audioStoragePath`만 저장한다.
- 프론트에는 서버가 재생 가능한 오디오 URL을 내려준다.
- 비게임 프로모션 포인트 지급은 서버 API 방식으로 처리한다.
- 같은 사용자와 같은 날짜에 대한 포인트 지급은 한 번만 허용한다.
- 포인트 하루 1회 지급 제어는 우리 서버가 담당한다.
- 포인트 지급 실패 상태에서도 같은 사용자와 같은 날짜에 대한 중복 지급 방지 기준은 유지한다.
- 포인트 지급 실패 상태는 재조회와 고객 안내 대상 상태로 저장한다.
- 재도전과 스크립트 열람을 위한 보상형 광고 보상은 `userEarnedReward` 이벤트 이후에만 서버에 기록한다.
- 재도전과 스크립트 열람을 위한 보상형 광고 완료 기록은 서버에 저장해 재도전권과 스크립트 열람권을 관리한다.

## 아직 확정하지 않는 것

- Firebase Functions 배포와 라우팅 세부 방식
- API 요청/응답 세부 형식
- Firestore 필드의 정확한 타입과 인덱스
- 정답 검증 요청과 지급 요청의 세부 에러 코드
