# 남은 수정 작업

기준일: 2026-04-14

원칙:
- 홈페이지 공개 화면과 공개 이미지 동작은 깨지지 않아야 함
- 내부 자료만 단계적으로 더 안전하게 잠글 것
- 이미 바꾼 보안 흐름과 충돌하지 않게 작은 단위로 진행할 것

## 1. 우선 처리

- [ ] 모바일 전사용 공개 오디오 경로 정리
  - 현재 확인 필요 파일:
    - `src/app/api/uploads/audio/[filename]/route.ts`
    - `src/app/api/mobile/transcriptions/route.ts`
  - 이유:
    - 음성 파일이 공개 경로로 남아 있을 수 있음
    - 내부 회의/발표 녹음 노출면이 남아 있음
  - 목표:
    - 멤버 인증 또는 서명 URL 기반으로 재생/다운로드
    - 기존 전사 기능은 유지

- [ ] Google OAuth 시작 흐름 rate limit 추가
  - 현재 확인 필요 파일:
    - `src/app/login/page.tsx`
    - `src/actions/user.ts`
  - 이유:
    - credentials 로그인만 제한되어 있고 Google 로그인 시작은 별도 제한이 없음
  - 목표:
    - 로그인 시도 공통 제한 체계로 통합

- [ ] rate limit 저장소를 메모리에서 지속형 저장소로 변경
  - 현재 확인 필요 파일:
    - `src/lib/rate-limit.ts`
    - `src/lib/request-rate-limit.ts`
  - 이유:
    - 서버 재시작 시 초기화됨
    - 멀티 인스턴스 환경에서는 우회 가능
  - 목표:
    - Redis 또는 DB 기반 저장소로 변경

## 2. 다음 단계

- [ ] 관리자용 storage cleanup 로직을 private bucket 대응으로 수정
  - 현재 확인 필요 파일:
    - `src/actions/admin.ts`
  - 이유:
    - 지금 cleanup 로직은 public bucket 기준이 강함
    - private bucket 파일은 정리/검사 누락 가능

- [ ] 게시판 첨부파일 공개 정책 확정
  - 현재 확인 필요 파일:
    - `src/app/api/attachments/route.ts`
    - `src/actions/board.ts`
  - 메모:
    - 현재는 게시판 공개 열람 흐름과 충돌하지 않게 공개 유지 쪽으로 둠
    - 필요하면 공지/세미나/자유게시판별로 정책 분리 검토

- [ ] 논문/리딩 자료 공개 정책 점검
  - 현재 확인 필요 파일:
    - `src/actions/paper.ts`
    - `src/app/materials/paper/lab/page.tsx`
    - `src/app/materials/paper/reading/page.tsx`
  - 메모:
    - 현재는 기능 회귀를 막기 위해 공개 경로 유지
    - 내부 전용 자료라면 private bucket 전환 검토

## 3. 검증 작업

- [ ] 로그인 후 실제 클릭 기준 QA
  - 대상:
    - 랩미팅 자료 보기/다운로드
    - 워크스페이스 자료 다운로드
    - 작업 첨부 다운로드
    - 재고 MSDS / 견적서 / 영수증 열람
  - 이유:
    - 현재는 코드/HTTP 응답 기준 확인이 중심
    - 실제 브라우저 세션에서 멤버/관리자 역할별 최종 점검 필요

- [ ] private bucket 업로드 이후 실제 파일 누적 시 재마이그레이션 점검
  - 현재 스크립트:
    - `scripts/migrate-private-storage-prefixes.js`
  - 메모:
    - 이번 실행 결과는 `migrated=0`
    - 실제 민감 파일이 쌓인 뒤 한 번 더 점검 필요

## 4. 참고

- 이미 완료된 큰 보안 작업:
  - 권한 회수 즉시 반영
  - 랩미팅 자료 private 처리
  - 익명 문의 access code 해시화
  - storage 프록시 공개/비공개 분기
  - ONLYOFFICE callback 서명 검증

- 이번 문서는 "남은 작업"만 적은 체크리스트임
