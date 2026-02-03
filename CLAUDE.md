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

# Prisma 스키마 변경 후
npx prisma migrate dev --name <설명>
npx prisma generate

# Cloudflare Tunnel 실행
cloudflared tunnel run --token <토큰>
```

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
