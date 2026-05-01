# AGENTS.md

## 역할

이 파일은 에이전트가 이 저장소에서 작업할 때 사용하는 목차다.
상세한 제품 기준, 작업 목록, Git 운영 방식은 각 문서를 따른다.

## 먼저 읽을 문서

- MVP 개발 기준, 작업 목록, Git 운영 방식: `docs/exec-plans/index.md`
- 제품 기획 원본: `INTRODUCE.md`
- UI/TDS 기준: `docs/design-docs/style-guidelines.md`

## 작업 유형별 진입점

- 새 기능 구현: `docs/exec-plans/index.md`에서 해당 작업 번호와 파일명을 확인한다.
- 세부 작업 수행: `docs/exec-plans/active/`의 해당 번호 작업지시서를 먼저 읽는다.
- 작업 완료 기록: `docs/exec-plans/completed/`에 결과 문서를 작성한다.
- UI 변경: `docs/design-docs/style-guidelines.md`를 먼저 확인한다.
- 제품 범위 판단: `docs/exec-plans/index.md`의 MVP 개발 기준을 먼저 확인하고, 더 자세한 배경이 필요하면 `INTRODUCE.md`를 확인한다.

## 기본 작업 흐름

1. `docs/exec-plans/index.md`에서 작업 번호와 범위를 확인한다.
2. 관련 active 작업지시서를 읽는다.
3. 필요한 기준 문서를 확인한다.
4. 최신 `dev` 기준에서 `codex/{번호}-{작업명}` 형식의 작업 브랜치를 만든다.
5. 범위 밖 작업은 하지 않는다.
6. 구현 후 completed 문서를 작성한다.
7. 작업 브랜치에서 `dev`로 PR을 보낸다.

## 중요한 원칙

- `AGENTS.md`에 세부 규칙을 계속 쌓지 않는다.
- 새 규칙이 필요하면 가장 적절한 문서에 추가한다.
- 문서와 구현이 충돌하면 작업을 멈추고 사용자에게 확인한다.
- ESLint, Prettier, TypeScript 설정값처럼 팀 결정이 필요한 항목은 임의로 정하지 않는다.
