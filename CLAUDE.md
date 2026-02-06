# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

연구실 관리 웹 플랫폼 (Next.js 16 + App Router)
- 한국어 UI
- 로컬 Supabase (Docker) 사용
- Cloudflare Tunnel로 외부 배포 (hail.co.kr)

## 주요 명령어

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드 & 실행
npm run build && npm run start

# Prisma 스키마 변경 후 (반드시 백업 먼저!)
npm run db:migrate -- --name <설명>

# DB 백업/복원
npm run db:backup                        # 즉시 백업
npm run db:backup -- before-migration    # 라벨 붙여서 백업
npm run db:restore                       # 백업 목록 보기
npm run db:restore -- <파일명>            # 특정 백업으로 복원

# 자동 백업 설정 (매일 새벽 3시)
node scripts/setup-auto-backup.js

# Cloudflare Tunnel 실행
cloudflared tunnel run --token <토큰>
```

## DB 백업 및 안전 규칙

> **절대 `prisma db push`를 사용하지 마세요.** 테이블을 drop하고 재생성하여 데이터가 손실될 수 있습니다.

- 스키마 변경 시 반드시 `npm run db:migrate` 사용 (자동으로 백업 후 `prisma migrate dev` 실행)
- 백업 파일은 `backups/` 폴더에 저장 (gitignore됨), 최대 30개 유지
- 백업 방식: `docker exec supabase_db_Supabase pg_dump`
- Prisma CLI 사용 시 반드시 v5: `npx --package=prisma@5 prisma ...`

## 아키텍처

### 기술 스택
- Next.js 16.0.7, React 18, TypeScript
- Prisma + PostgreSQL (로컬 Supabase)
- NextAuth 5.0 (Google OAuth + Credentials)
- Supabase Storage (파일 업로드)
- TipTap (리치 텍스트 에디터)
- Tailwind CSS (다크모드 지원)

### 디렉토리 구조
```
src/
├── app/          # Next.js App Router 페이지
├── actions/      # Server Actions ('use server')
├── components/   # React 컴포넌트
├── lib/          # 유틸리티 (prisma, supabase, email)
├── types/        # TypeScript 타입
└── auth.ts       # NextAuth 설정
```

### Server Actions 패턴
- `src/actions/` 폴더에 도메인별 서버 액션
- `revalidatePath()`로 캐시 무효화
- 모든 데이터 변경은 Server Actions 통해 처리

### 권한 체계
- **Admin** (`isAdmin=true`): 전체 관리 권한
- **Member** (`isApproved=true`): 게시글 작성, 예약 등
- **Guest** (`isApproved=false`): 자유게시판만 접근

### 주요 모델 (Prisma)
- User, Post, Comment, Attachment - 게시판
- Task, Project, Workspace - 협업
- Material, LabMeeting - 연구 자료
- Resource, Reservation - 장비 예약
- InventoryItem, PurchaseRequest, LedgerAccount - 재고/재무

## 제약사항

- **업로드 제한**: 100MB (Cloudflare 무료 플랜)
- **bodySizeLimit**: 100mb (next.config.js)
- 대용량 파일은 localhost:3000에서 직접 업로드

## 환경 변수 (.env.local)

필수 변수:
- `REAL_DATABASE_URL`, `REAL_DIRECT_URL` - PostgreSQL
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
