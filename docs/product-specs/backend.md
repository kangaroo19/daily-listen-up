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

- 호출 시점: 홈에서 `시작하기` 클릭 후 `appLogin()`이 `authorizationCode`, `referrer`를 반환한 직후 호출한다.
- 토스 로그인 결과를 서버에서 검증하고, 토스 사용자 식별값을 우리 앱 세션으로 변환하는 로그인 API다.

처리 과정:

1. 클라이언트가 `appLogin()` 결과인 `authorizationCode`, `referrer`를 서버에 전달한다.
2. 서버가 토스 `POST /api-partner/v1/apps-in-toss/user/oauth2/generate-token`로 access token을 발급받는다.
3. 서버가 access token으로 토스 `GET /api-partner/v1/apps-in-toss/user/oauth2/login-me`를 호출해 사용자 정보를 조회한다.
4. 서버가 조회 결과에서 `userKey`를 확보하고, 내부 사용자 ID와 당일 만료되는 앱 세션을 생성한다.
5. 서버는 프론트에 토스 토큰이나 원본 `userKey`를 내려주지 않고, 이후 우리 서버 API 인증에 사용할 `daily-listen-up` 앱 세션 토큰만 내려준다.
6. 토큰 교환 또는 사용자 조회에 실패하면 앱 세션 토큰을 발급하지 않는다.

### `GET /api/check-today-quiz`

- 호출 시점: `POST /api/login/toss`로 앱 세션 토큰을 확보한 직후, 홈에서 오늘 문제 존재 여부를 확인할 때 호출한다.
- 서버 KST 기준으로 오늘 공개된 문제가 있는지 여부만 반환한다.
- 완료 여부, 지급 상태, 문제 본문, 선택지, 오디오 URL은 반환하지 않는다.

처리 과정:

1. 클라이언트가 앱 세션 토큰과 함께 GET /api/check-today-quiz 호출
2. 서버가 appSessions에서 앱 세션 토큰이 유효한지 확인
3. 서버가 KST 기준 오늘 날짜를 계산
4. quizzes에서 quizDate = 오늘, isPublished = true인 문제를 조회
5. 있으면 hasTodayQuiz: true 반환
6. 없으면 hasTodayQuiz: false 반환

### `GET /api/today-quiz`

- 호출 시점: 문제 풀이 화면 진입 시, 오늘 문제 콘텐츠를 불러올 때 호출한다.
- 서버 KST 기준 오늘 공개된 문제의 풀이용 공개 데이터를 반환한다.
- 정답, 스크립트, 포인트 금액, 원본 Storage 경로는 반환하지 않는다.

처리 과정:

1. 클라이언트가 앱 세션 토큰과 함께 `GET /api/today-quiz`를 호출한다.
2. 서버가 `appSessions`에서 앱 세션 토큰이 유효한지 확인한다.
3. 서버가 KST 기준 오늘 날짜를 계산한다.
4. `quizzes`에서 `quizDate = 오늘`, `isPublished = true`인 문제를 조회한다.
5. 서버가 `audioStoragePath`로 프론트가 재생 가능한 오디오 URL을 만든다.
6. 서버가 문제 풀이에 필요한 공개 데이터만 반환한다.

응답에 포함할 데이터:

- `quizDate`
- `audioUrl`
- `choices`

응답에서 제외할 데이터:

- `correctChoiceIds`
- `script`
- `promotionAmount`
- 원본 `audioStoragePath`

### `POST /api/answer-result`

- 호출 시점: 사용자가 답안을 제출하고 결과 확인 전면형 광고가 완료된 직후 호출한다.
- 선택 답안을 검증하고 정답/오답 및 포인트 지급 상태를 반환한다.
- 정답이면 오늘 학습 완료 상태로 기록하고 포인트 지급 흐름에 진입한다.

처리 과정:

1. 서버가 앱 세션 토큰을 확인한다.
2. 서버가 KST 기준 오늘 문제를 조회한다.
3. 서버가 서버에 저장된 정답 기준으로 제출 답안을 채점한다.
4. 서버가 `userProgress`를 업데이트한다.
5. 정답이면 `rewardGrants`에서 기존 지급 기록을 확인한다.
6. 기존 지급 기록이 없으면 토스 포인트 지급을 요청한다.
7. 서버가 지급 상태를 `rewardGrants` 컬렉션에 저장한다.
8. 클라이언트에 정답 여부와 지급 상태를 반환한다.

### `GET /api/reward-status`

- 호출 시점: 홈 시작 흐름에서 오늘 문제 존재 확인 후, 사용자의 오늘 지급 상태를 확인할 때 호출한다.
- 포인트 지급 상태를 `pending`, `success`, `failed` 중 하나로 반환한다.

처리 과정:

1. 클라이언트가 앱 세션 토큰과 함께 GET /api/reward-status를 호출한다.
2. 서버가 appSessions에서 앱 세션 토큰이 유효한지 확인한다.
3. 서버가 세션에서 내부 userId를 확인한다.
4. 서버가 KST 기준 오늘 날짜를 계산한다.
5. 서버가 userProgress에서 해당 userId, quizDate의 진행 상태를 조회한다.
6. 필요하면 rewardGrants에서 해당 userId, quizDate의 지급 기록도 조회한다.
7. 지급 기록이 있으면 저장된 지급 상태를 반환한다.
8. 지급 기록이 없으면 아직 포인트 지급 흐름에 들어가지 않은 상태로 판단한다.

### `POST /api/rewarded-ad-complete`

- 호출 시점: 재도전 또는 스크립트 열람을 위한 보상형 광고에서 `userEarnedReward` 이벤트가 발생한 직후 호출한다.
- 보상형 광고의 `userEarnedReward` 확인 후 `retry` 또는 `script` 권한을 기록한다.
- 결과 확인 전면형 광고 완료 여부는 이 API에서 기록하지 않는다.

처리 과정:

1. 클라이언트가 앱 세션 토큰과 함께 POST /api/rewarded-ad-complete를 호출한다.
2. 서버가 appSessions에서 앱 세션이 유효한지 확인한다.
3. 서버가 KST 기준 오늘 날짜를 계산한다.
4. 서버가 요청의 purpose가 retry 또는 script인지 확인한다.
5. 서버가 보상형 광고의 userEarnedReward 이벤트가 확인된 요청인지 검증한다.
6. 서버가 adRewardEvents에 광고 보상 기록을 저장한다.
7. purpose = retry면 userProgress.canRetry = true로 업데이트한다.
8. purpose = script면 userProgress.canViewScript = true로 업데이트한다.
9. 클라이언트에 갱신된 권한 상태를 반환한다.

## Firestore 컬렉션 초안

### `quizzes`

- `quizDate` - 타입: `string`, 역할: KST 기준 문제 날짜. 예: `2026-05-24`
- `isPublished` - 타입: `boolean`, 역할: 오늘 문제 공개 여부
- `audioStoragePath` - 타입: `string`, 역할: Firebase Storage에 저장된 오디오 파일 경로
- `choices` - 타입: `array`, 역할: 선택지 목록. 각 항목은 선택지 ID와 문구를 포함한다
- `correctChoiceIds` - 타입: `array<string>`, 역할: 정답 선택지 ID 목록. 서버 전용으로만 사용한다
- `script` - 타입: `string`, 역할: 광고 보상 후 열람 가능한 듣기 스크립트
- `promotionAmount` - 타입: `number`, 역할: 정답 시 지급할 토스 포인트 금액

### `users`

- `userId` - 타입: `string`, 역할: 서비스 내부 사용자 ID
- `userKey` - 타입: `string`, 역할: 토스 사용자 식별값. 서버 전용으로 보관한다
- `loggedInAt` - 타입: `timestamp`, 역할: 마지막 로그인 처리 시각

### `appSessions`

- `sessionTokenId` - 타입: `string`, 역할: 앱 세션 토큰을 식별하는 값
- `userId` - 타입: `string`, 역할: 세션이 연결된 내부 사용자 ID
- `expiresAt` - 타입: `timestamp`, 역할: KST 기준 당일 만료 시각

### `userProgress`

- `userId` - 타입: `string`, 역할: 진행 상태의 사용자 ID
- `quizDate` - 타입: `string`, 역할: KST 기준 진행 날짜
- `status` - 타입: `string`, 역할: 당일 진행 상태
- `attemptCount` - 타입: `number`, 역할: 정답 제출 시도 횟수
- `lastSubmittedChoiceIds` - 타입: `array<string>`, 역할: 마지막으로 제출한 선택지 ID 목록
- `isCorrect` - 타입: `boolean`, 역할: 마지막 제출 결과의 정답 여부
- `canRetry` - 타입: `boolean`, 역할: 보상형 광고 완료 후 재도전 가능 여부
- `canViewScript` - 타입: `boolean`, 역할: 보상형 광고 완료 후 스크립트 열람 가능 여부
- `rewardStatus` - 타입: `string`, 역할: 포인트 지급 상태. `pending`, `success`, `failed` 중 하나
- `rewardReviewRequired` - 타입: `boolean`, 역할: 포인트 지급 실패 후 고객 안내 또는 재확인 대상 여부

### `rewardGrants`

- `userId` - 타입: `string`, 역할: 포인트 지급 대상 사용자 ID
- `quizDate` - 타입: `string`, 역할: KST 기준 지급 대상 날짜
- `promotionKey` - 타입: `string`, 역할: 토스 비게임 프로모션 지급 요청에 사용할 중복 방지 key
- `amount` - 타입: `number`, 역할: 지급 포인트 금액
- `status` - 타입: `string`, 역할: 지급 상태. `pending`, `success`, `failed` 중 하나

### `adRewardEvents`

- `userId` - 타입: `string`, 역할: 광고 보상 대상 사용자 ID
- `quizDate` - 타입: `string`, 역할: KST 기준 광고 보상 날짜
- `purpose` - 타입: `string`, 역할: 광고 보상 목적. `retry` 또는 `script`
- `userEarnedReward` - 타입: `boolean`, 역할: Toss Ads의 보상 획득 이벤트 확인 여부
- `earnedAt` - 타입: `timestamp`, 역할: 보상 획득 이벤트를 서버에 기록한 시각

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
- Firestore 인덱스와 세부 제약
- 정답 검증 요청과 지급 요청의 세부 에러 코드
