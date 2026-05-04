# 13. 정답 시 토스 포인트 지급 요청 연동

## 목적

정답을 맞힌 사용자가 서버를 통해 토스 포인트 지급 요청을 시작하고, 지급 요청 상태를 명확히 확인할 수 있게 한다.

이 작업은 포인트 지급을 클라이언트에서 직접 실행하는 것이 아니라, 서버 API를 호출하고 응답 상태를 화면에 반영하는 작업이다.

## 구현 범위

- 12번 작업에서 `correct`와 `nextStep: 'point_reward'`로 분기된 경우에만 진입한다.
- `submissionId`와 `quizDate`를 기준으로 포인트 지급 요청 API를 호출한다.
- 지급 요청 중, 지급 완료, 이미 지급됨, 지급 대기, 지급 실패 상태를 구분한다.
- 서버 응답의 `promotionStatus`, `isPromotionGranted`, `promotionGrantKey`를 사용자 진행 상태와 연결한다.
- 지급 완료 또는 이미 지급됨 응답을 받으면 오늘 학습 완료 화면으로 이동할 수 있게 한다.
- 지급 실패 시 재시도 가능한 오류 상태를 제공한다.
- 중복 요청 방지를 위해 요청 중 CTA와 화면 전환을 잠근다.

## 제외 범위

- 클라이언트에서 Toss SDK로 프로모션 포인트를 직접 지급하는 구현
- 서버의 프로모션 key 발급, 프로모션 실행, 지급 결과 조회 구현
- 서버의 1인 1일 1회 지급 보장과 멱등 처리 구현
- 포인트 금액 변경 UI
- 포인트 지갑, 지급 내역, 회수, 재지급 관리 화면
- 오답 재도전, 보상형 광고 호출
- 오늘 학습 완료 화면 최종 구현
- completed 문서 작성

## 구현 기준

- `isCorrect`가 `true`인 서버 결과 확인 이후에만 포인트 지급 요청을 시작한다.
- 정답 상태와 포인트 지급 완료 상태를 같은 의미로 다루지 않는다.
- 클라이언트는 `grantPromotionReward` 같은 SDK 직접 지급 함수를 사용하지 않는다.
- 비게임 프로모션은 서버를 통해 지급하는 방식을 기준으로 한다.
- 서버 API 인터페이스는 `POST /api/quiz-submissions/{submissionId}/point-reward`를 기준으로 한다.
- 요청 본문은 `{ quizDate: string }`를 기준으로 한다.
- 서버는 세션과 `submissionId`, `quizDate`를 기준으로 지급 대상 사용자를 검증한다고 전제한다.
- 성공 응답은 `{ quizDate: string; promotionStatus: 'granted'; isPromotionGranted: true; promotionGrantKey: string; nextStep: 'today_complete' }`를 기준으로 한다.
- 이미 지급된 멱등 응답은 `{ promotionStatus: 'granted'; isPromotionGranted: true; alreadyGranted: true; nextStep: 'today_complete' }`처럼 성공 계열로 처리한다.
- 지급 처리 중 응답은 `{ promotionStatus: 'pending'; isPromotionGranted: false }`를 기준으로 한다.
- 지급 실패 응답은 `{ promotionStatus: 'failed'; isPromotionGranted: false; errorCode?: string; message?: string }`를 기준으로 한다.
- 서버가 `already_granted` 또는 같은 의미의 응답을 반환하면 실패가 아니라 완료 흐름으로 처리한다.
- 지급 요청 중에는 TDS `Button`에 `loading`과 `disabled`를 함께 적용한다.
- 보상 문구는 `지급 요청 중`, `지급 완료`, `이미 지급됨`, `지급 확인 필요`처럼 상태를 구분해서 쓴다.
- 서버 응답 없이 낙관적으로 `지급 완료`를 표시하지 않는다.
- 지급 실패 시 사용자가 같은 요청을 다시 시도할 수 있게 하되, 중복 지급은 서버 멱등 응답으로 처리한다고 명시한다.
- 예산 부족, 프로모션 종료, 서버 오류 등 상세 원인은 사용자에게 짧게 안내하고 운영 확인이 필요한 내용은 completed 문서에 남긴다.

## 상태 및 예외 처리

- `idle`: 정답 결과는 확인했지만 아직 지급 요청을 시작하지 않았다.
- `requesting`: 포인트 지급 요청 API를 호출 중이다.
- `pending`: 서버가 지급 처리 중 상태를 반환했다.
- `granted`: 포인트 지급이 완료되었다.
- `already_granted`: 오늘 같은 보상이 이미 지급되었다.
- `failed`: 지급 요청이 실패했다.
- `error`: 네트워크 오류, 응답 형식 오류, 알 수 없는 오류가 발생했다.
- `blocked`: 정답 상태가 아니거나 이미 완료되어 지급 요청을 시작할 수 없다.
- 지급 요청 중 CTA를 연속 선택해도 API가 중복 호출되지 않게 한다.
- 서버가 `401`을 반환하면 로그인 상태 재확인이 필요한 상태로 처리한다.
- 서버가 `403`을 반환하면 지급 대상이 아닌 상태로 보고 결과 상태를 재조회한다.
- 서버가 `409` 또는 중복 지급 응답을 반환하면 진행 상태를 재조회하고 완료 흐름으로 이동한다.
- 지급 요청 중 페이지를 벗어나면 늦게 도착한 응답이 이전 화면 상태를 덮어쓰지 않게 한다.
- 지급 실패 상태에서는 완료 화면으로 자동 이동하지 않는다.

## 완료 기준

- 정답 결과 이후에만 포인트 지급 요청 흐름에 진입한다.
- 클라이언트가 Toss 포인트를 직접 지급하지 않는다.
- 서버 포인트 지급 API 요청과 응답 처리 기준이 명확하다.
- 지급 요청 중 중복 요청이 발생하지 않는다.
- 지급 완료와 이미 지급됨 응답은 오늘 학습 완료 흐름으로 이어진다.
- 지급 실패와 지급 대기 상태가 완료 상태와 구분된다.
- 서버 응답 없이 지급 완료 문구가 표시되지 않는다.
- `promotionStatus`, `isPromotionGranted`, `promotionGrantKey`가 진행 상태와 연결될 수 있다.
- 보상형 광고, 재도전, 완료 화면 최종 UI, 중복 가드 통합 작업이 포함되지 않는다.

## Git 전략

- 최신 `dev` 기준에서 `codex/13-point-reward-request` 형식의 작업 브랜치를 만든다.
- 의미 있는 기능 단위마다 커밋한다.
- 작업 완료 후 같은 번호의 completed 문서를 작성한다.
- 작업 브랜치에서 `dev`로 PR을 보낸다.
- 예외가 필요한 작업은 이 섹션에 예외 사유와 진행 방식을 명시한다.
- 서버 API가 준비되지 않았다면 mock 또는 임시 어댑터로 상태 전환만 검증하고, 서버 멱등 처리와 프로모션 연동 필요사항을 completed 문서에 남긴다.

## 다음 작업과의 연결

- 15번 작업은 `granted` 또는 `already_granted` 상태를 이어받아 오늘 학습 완료 화면을 보여준다.
- 16번 작업은 같은 `quizDate`에서 지급 요청이 반복되지 않도록 중복 보상 방지 가드를 정리한다.
- 12번 작업은 정답 결과와 `submissionId`, `promotionAmount`를 이 작업으로 전달한다.
