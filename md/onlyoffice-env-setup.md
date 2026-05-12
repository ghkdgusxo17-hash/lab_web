# V4 env 정리 가이드

## 기준 파일
- 앱 기준: `.env.local`
- ONLYOFFICE Docker 기준: `.env.onlyoffice`
- `.env.development.local`, `.env.production.local`은 헷갈리면 비우거나 `.bak`로 이름 변경

## .env.local 권장값
```env
NEXTAUTH_URL=https://hail.co.kr
NEXT_PUBLIC_APP_URL="https://hail.co.kr"

ONLYOFFICE_DOCUMENT_SERVER_URL=https://hail.co.kr/onlyoffice
ONLYOFFICE_INTERNAL_APP_URL=http://host.docker.internal:3000
ONLYOFFICE_INTERNAL_STORAGE_URL=http://host.docker.internal:54321
ONLYOFFICE_JWT_SECRET=같은_시크릿값
```

## .env.onlyoffice 권장값
```env
ONLYOFFICE_DOCUMENT_SERVER_URL=https://hail.co.kr/onlyoffice
ONLYOFFICE_INTERNAL_APP_URL=http://host.docker.internal:3000
ONLYOFFICE_INTERNAL_STORAGE_URL=http://host.docker.internal:54321
ONLYOFFICE_JWT_SECRET=같은_시크릿값
```

## 핵심 원칙
- `hail.co.kr`에서 로그인/뷰어를 쓸 때는 `localhost`나 `127.0.0.1` 기준 URL을 브라우저에 직접 넘기면 안 됨
- 브라우저는 `https://hail.co.kr/onlyoffice`로 접근
- 내부적으로만 ONLYOFFICE 컨테이너가 `3000` 앱 서버와 `54321` 스토리지를 봄

## 적용 후 실행 순서
```powershell
cd C:\Users\admin\Desktop\Server\lab_web\V4
docker compose --env-file .env.onlyoffice -f docker-compose.onlyoffice.yml up -d
npm run build
npm run start
```

## 스크립트 동작
- `npm run dev`, `npm run start`, `npm run dev:test`, `npm run start:test` 실행 전 `scripts/onlyoffice-container.js ensure`가 문서 서버를 보장
- 이미 실행 중이어도 `up -d`는 그대로 유지되고, 내려가 있으면 자동으로 다시 올라옴
- 기존에 이름만 남아 있는 `labweb_onlyoffice` 컨테이너가 있으면 새로 만들지 않고 그 컨테이너를 다시 시작
- `npm run onlyoffice:stop`은 `labweb_onlyoffice` 컨테이너를 지우지 않고 정지만 함
- 완전히 내리려면 `npm run onlyoffice:down` 사용
- Docker Compose의 `restart: unless-stopped`가 있어, 컨테이너가 생성된 뒤 Docker Desktop 재시작 시 자동 재기동 가능

## 체크 포인트
- 로그인은 `https://hail.co.kr`에서 시도
- PPT 뷰어는 `https://hail.co.kr/onlyoffice/...` 요청으로 열려야 정상
