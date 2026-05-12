# 모바일 앱 연동 가이드

이 문서는 랩 웹사이트의 **발표 녹음 → 트랜스크립션 → 요약** 기능을 모바일 앱에서 사용할 수 있도록 연동하는 방법을 설명합니다.

---

## 1. 시스템 아키텍처 개요

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────────┐
│   Mobile App    │────▶│   Lab Web API   │────▶│  Transcription Service  │
│  (React Native) │     │   (Next.js 16)  │     │  (Docker: VibeVoice +   │
└─────────────────┘     └────────┬────────┘     │   Ollama)               │
                                 │              └─────────────────────────┘
                                 ▼
                        ┌─────────────────┐
                        │    Supabase     │
                        │  (PostgreSQL +  │
                        │   Storage)      │
                        └─────────────────┘
```

### 1.1 구성 요소

| 구성 요소 | 기술 스택 | 역할 |
|----------|----------|------|
| **Lab Web** | Next.js 16, Prisma, NextAuth | 웹 프론트엔드 + API 서버 |
| **Database** | PostgreSQL (Supabase) | 사용자, 자료, 트랜스크립션 데이터 저장 |
| **Storage** | Supabase Storage | 오디오 파일, 발표자료 파일 저장 |
| **Transcription Service** | Docker (VibeVoice-ASR + Ollama) | 음성인식 + 요약 생성 |

### 1.2 서버 주소

| 서비스 | 개발 환경 | 프로덕션 환경 |
|--------|----------|--------------|
| Lab Web | `http://localhost:3000` | `https://your-domain.com` |
| Supabase | `http://127.0.0.1:54321` | Supabase Cloud URL |
| Transcription | `http://localhost:8000` | 내부 네트워크 전용 |

> **중요**: Transcription Service는 Lab Web 서버에서만 접근 가능합니다. 모바일 앱은 Lab Web API를 통해서만 트랜스크립션 기능을 사용합니다.

---

## 2. 데이터베이스 스키마

### 2.1 핵심 모델

```prisma
// 사용자
model User {
  id              String    @id @default(cuid())
  name            String?
  email           String?   @unique
  image           String?
  role            String    @default("MEMBER")
  isApproved      Boolean   @default(false)
  isAdmin         Boolean   @default(false)

  materialsUploaded  Material[] @relation("MaterialUploader")
  materialsPresented Material[] @relation("MaterialPresenter")
  transcriptionsRecorded MeetingTranscription[] @relation("TranscriptionRecorder")
}

// 랩미팅
model LabMeeting {
  id          String   @id @default(cuid())
  date        DateTime
  title       String
  description String?
  materials   Material[]
  presenters  LabMeetingPresenter[]
  createdAt   DateTime @default(now())
}

// 발표자료
model Material {
  id            String    @id @default(cuid())
  title         String
  description   String?
  category      String    @default("OTHER")  // PPT, PAPER, DATA, OTHER
  filename      String
  url           String
  size          Int
  mimeType      String

  uploaderId    String
  uploader      User      @relation("MaterialUploader", fields: [uploaderId], references: [id])

  presenterId   String?
  presenter     User?     @relation("MaterialPresenter", fields: [presenterId], references: [id])

  labMeetingId  String?
  labMeeting    LabMeeting? @relation(fields: [labMeetingId], references: [id])

  transcription MeetingTranscription?

  createdAt     DateTime  @default(now())
}

// 트랜스크립션 (발표 녹음 요약)
model MeetingTranscription {
  id            String   @id @default(cuid())

  audioUrl      String                    // Supabase Storage URL
  audioFilename String?                   // 원본 파일명

  status        String   @default("PENDING")  // PENDING, PROCESSING, COMPLETED, FAILED
  jobId         String?                   // Transcription Service job ID

  transcript    String?  @db.Text         // JSON: {segments: [{Start, End, Speaker, Content}]}
  summary       String?  @db.Text         // 요약 텍스트
  error         String?                   // 에러 메시지 (실패 시)

  materialId    String   @unique
  material      Material @relation(fields: [materialId], references: [id], onDelete: Cascade)

  recorderId    String
  recorder      User     @relation("TranscriptionRecorder", fields: [recorderId], references: [id])
  recorderName  String                    // 녹음자 이름 (캐시)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 2.2 트랜스크립션 상태 흐름

```
PENDING → PROCESSING → COMPLETED
                    ↘ FAILED
```

| 상태 | 설명 |
|-----|------|
| `PENDING` | 오디오 업로드 완료, 처리 대기 중 |
| `PROCESSING` | 트랜스크립션/요약 진행 중 |
| `COMPLETED` | 처리 완료, 요약 확인 가능 |
| `FAILED` | 처리 실패, 재시도 가능 |

---

## 3. 인증 시스템

### 3.1 현재 웹 인증 방식

웹에서는 **NextAuth.js**를 사용하며, Google OAuth 로그인을 지원합니다.

```typescript
// auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub
        session.user.isApproved = token.isApproved
        session.user.isAdmin = token.isAdmin
      }
      return session
    }
  }
})
```

### 3.2 모바일 앱 인증 옵션

#### 옵션 A: NextAuth 세션 공유 (권장)

1. 모바일 앱에서 WebView로 Google 로그인 진행
2. 로그인 성공 시 세션 쿠키 획득
3. 이후 API 요청에 쿠키 포함

```typescript
// React Native 예시
import { CookieJar } from 'tough-cookie';
import axios from 'axios';

const cookieJar = new CookieJar();
const api = axios.create({
  baseURL: 'https://your-domain.com',
  withCredentials: true,
  jar: cookieJar
});
```

#### 옵션 B: API 토큰 방식 (구현 필요)

별도의 API 토큰 시스템을 구현해야 합니다:

```typescript
// 새로 구현 필요: /api/auth/mobile-token
// 1. 모바일에서 Google OAuth로 ID 토큰 획득
// 2. ID 토큰을 서버로 전송
// 3. 서버에서 검증 후 API 토큰 발급
// 4. 모바일은 API 토큰을 헤더에 포함하여 요청
```

### 3.3 권한 체크

| 권한 | 조건 | 가능한 작업 |
|-----|------|------------|
| 일반 사용자 | 로그인 | 목록 조회 |
| 승인된 멤버 | `isApproved: true` | 자료 업로드, 녹음 업로드 |
| 관리자 | `isAdmin: true` | 모든 작업 + 삭제 |

---

## 4. API 엔드포인트

### 4.1 현재 사용 가능한 Server Actions

현재는 Next.js Server Actions를 사용하므로, 모바일 앱을 위해 **REST API 엔드포인트를 추가 구현**해야 합니다.

### 4.2 구현해야 할 REST API

#### 4.2.1 인증

```
POST /api/mobile/auth/login
  - Body: { idToken: string } (Google ID Token)
  - Response: { token: string, user: User }

GET /api/mobile/auth/me
  - Headers: { Authorization: "Bearer {token}" }
  - Response: { user: User }
```

#### 4.2.2 랩미팅 목록

```
GET /api/mobile/lab-meetings
  - Headers: { Authorization: "Bearer {token}" }
  - Response: {
      meetings: [{
        id: string,
        date: string,
        title: string,
        description: string,
        presenters: [{ id, name, image }],
        materialsCount: number
      }]
    }

GET /api/mobile/lab-meetings/:id
  - Response: {
      meeting: {
        id, date, title, description,
        presenters: [...],
        materials: [{
          id, title, category, filename,
          uploader: { id, name },
          presenter: { id, name },
          transcription: { id, status, summary } | null
        }]
      }
    }
```

#### 4.2.3 발표자료 목록 (트랜스크립션 가능)

```
GET /api/mobile/materials/for-transcription
  - Headers: { Authorization: "Bearer {token}" }
  - Query: { labMeetingId?: string }
  - Response: {
      materials: [{
        id: string,
        title: string,
        filename: string,
        uploader: { id, name },
        presenter: { id, name } | null,
        labMeeting: { id, date, title } | null,
        transcription: { status } | null  // FAILED면 재시도 가능
      }]
    }
```

#### 4.2.4 트랜스크립션 업로드

```
POST /api/mobile/transcriptions
  - Headers: {
      Authorization: "Bearer {token}",
      Content-Type: "multipart/form-data"
    }
  - Body: {
      materialId: string,
      audioFile: File,
      presenterId?: string  // 발표자 변경 시
    }
  - Response: {
      success: true,
      transcriptionId: string
    }
  - Errors:
      - 401: 로그인 필요
      - 403: 승인된 멤버만 가능
      - 400: 이미 트랜스크립션 존재 (FAILED 아닌 경우)
      - 404: 발표자료 없음
```

#### 4.2.5 트랜스크립션 상태 확인

```
GET /api/mobile/transcriptions/:id/status
  - Headers: { Authorization: "Bearer {token}" }
  - Response: {
      id: string,
      status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED",
      error?: string
    }
```

#### 4.2.6 트랜스크립션 결과 조회

```
GET /api/mobile/transcriptions/:id
  - Headers: { Authorization: "Bearer {token}" }
  - Response: {
      id: string,
      status: string,
      audioUrl: string,
      audioFilename: string,
      summary: string | null,
      transcript: {
        segments: [{
          Start: number,    // 시작 시간 (초)
          End: number,      // 종료 시간 (초)
          Speaker: number,  // 화자 번호 (0, 1, 2, ...)
          Content: string   // 발화 내용
        }]
      } | null,
      material: {
        id, title,
        labMeeting: { id, date, title }
      },
      recorder: { id, name },
      createdAt: string
    }
```

---

## 5. 모바일 앱 기술 스택 추천

### 5.1 프레임워크 비교

| 프레임워크 | 장점 | 단점 | 추천도 |
|-----------|-----|------|-------|
| **React Native** | 웹 개발자 친숙, 큰 생태계 | 네이티브 기능 브릿지 필요 | ⭐⭐⭐⭐⭐ |
| **Flutter** | 빠른 개발, 일관된 UI | Dart 학습 필요 | ⭐⭐⭐⭐ |
| **Swift/Kotlin** | 최고 성능, 네이티브 기능 | 2개 앱 개발 필요 | ⭐⭐⭐ |

### 5.2 권장 스택: React Native + Expo

```json
{
  "dependencies": {
    "expo": "~50.0.0",
    "expo-av": "~14.0.0",           // 오디오 녹음
    "expo-file-system": "~16.0.0",  // 파일 시스템
    "expo-secure-store": "~13.0.0", // 토큰 저장
    "@react-native-google-signin/google-signin": "^11.0.0",
    "axios": "^1.6.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0"             // 상태 관리
  }
}
```

### 5.3 필수 권한

```json
// app.json (Expo)
{
  "expo": {
    "android": {
      "permissions": [
        "RECORD_AUDIO",
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE"
      ]
    },
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "발표 녹음을 위해 마이크 접근이 필요합니다."
      }
    }
  }
}
```

---

## 6. 모바일 앱 화면 구성

### 6.1 화면 플로우

```
[로그인] → [메인 (랩미팅 목록)]
              │
              ▼
         [랩미팅 상세]
              │
              ├──▶ [발표자료 선택]
              │         │
              │         ▼
              │    [녹음 화면] ──▶ [업로드 중] ──▶ [완료]
              │
              └──▶ [요약 보기] (완료된 트랜스크립션)
```

### 6.2 주요 화면 상세

#### 화면 1: 로그인
- Google 로그인 버튼
- 자동 로그인 (저장된 토큰)

#### 화면 2: 랩미팅 목록
- 날짜별 정렬된 랩미팅 카드
- 각 카드에 발표자, 자료 수 표시
- Pull-to-refresh

#### 화면 3: 랩미팅 상세
- 발표자료 목록
- 각 자료별 트랜스크립션 상태 표시:
  - 없음: "녹음 추가" 버튼
  - 처리 중: 프로그레스 표시
  - 완료: "요약 보기" 버튼
  - 실패: "다시 시도" 버튼

#### 화면 4: 녹음 화면
- 발표자료 정보 표시
- 발표자 선택 (드롭다운)
- 녹음 버튼 (시작/일시정지/중지)
- 녹음 시간 표시
- 파형 시각화 (선택)

#### 화면 5: 업로드 중
- 업로드 프로그레스
- "처리에 10~30분 소요됩니다" 안내
- 백그라운드 처리 안내

#### 화면 6: 요약 보기
- 요약 텍스트
- 전체 트랜스크립트 (접기/펼치기)
  - 화자별 색상 구분
  - 타임스탬프 표시
- 오디오 재생 버튼

---

## 7. 녹음 및 업로드 구현 가이드

### 7.1 오디오 녹음 (Expo AV)

```typescript
import { Audio } from 'expo-av';

// 녹음 설정
const RECORDING_OPTIONS = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {}
};

// 녹음 클래스
class AudioRecorder {
  private recording: Audio.Recording | null = null;

  async startRecording(): Promise<void> {
    // 권한 요청
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) throw new Error('마이크 권한이 필요합니다');

    // 오디오 모드 설정
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // 녹음 시작
    const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
    this.recording = recording;
  }

  async stopRecording(): Promise<string> {
    if (!this.recording) throw new Error('녹음 중이 아닙니다');

    await this.recording.stopAndUnloadAsync();
    const uri = this.recording.getURI();
    this.recording = null;

    return uri!;
  }

  async pauseRecording(): Promise<void> {
    await this.recording?.pauseAsync();
  }

  async resumeRecording(): Promise<void> {
    await this.recording?.startAsync();
  }
}
```

### 7.2 파일 업로드

```typescript
import * as FileSystem from 'expo-file-system';
import axios from 'axios';

async function uploadTranscription(
  audioUri: string,
  materialId: string,
  presenterId?: string
): Promise<{ transcriptionId: string }> {
  // 파일 정보 가져오기
  const fileInfo = await FileSystem.getInfoAsync(audioUri);
  if (!fileInfo.exists) throw new Error('파일을 찾을 수 없습니다');

  // FormData 생성
  const formData = new FormData();
  formData.append('materialId', materialId);
  formData.append('audioFile', {
    uri: audioUri,
    type: 'audio/m4a',
    name: `recording_${Date.now()}.m4a`,
  } as any);

  if (presenterId) {
    formData.append('presenterId', presenterId);
  }

  // 업로드
  const response = await axios.post(
    `${API_BASE_URL}/api/mobile/transcriptions`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${await getToken()}`,
      },
      timeout: 60000, // 1분 타임아웃
      onUploadProgress: (progressEvent) => {
        const progress = progressEvent.loaded / progressEvent.total!;
        console.log(`Upload progress: ${Math.round(progress * 100)}%`);
      },
    }
  );

  return response.data;
}
```

### 7.3 상태 폴링

```typescript
import { useQuery } from '@tanstack/react-query';

function useTranscriptionStatus(transcriptionId: string) {
  return useQuery({
    queryKey: ['transcription-status', transcriptionId],
    queryFn: async () => {
      const response = await api.get(`/api/mobile/transcriptions/${transcriptionId}/status`);
      return response.data;
    },
    refetchInterval: (data) => {
      // 완료 또는 실패 시 폴링 중지
      if (data?.status === 'COMPLETED' || data?.status === 'FAILED') {
        return false;
      }
      return 10000; // 10초마다 폴링
    },
  });
}
```

### 7.4 백그라운드 업로드 (선택)

```typescript
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const UPLOAD_TASK = 'TRANSCRIPTION_UPLOAD_TASK';

// 태스크 정의
TaskManager.defineTask(UPLOAD_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }

  // 대기 중인 업로드 처리
  const pendingUploads = await AsyncStorage.getItem('pendingUploads');
  if (pendingUploads) {
    const uploads = JSON.parse(pendingUploads);
    for (const upload of uploads) {
      try {
        await uploadTranscription(upload.audioUri, upload.materialId);
        // 성공 시 목록에서 제거
      } catch (e) {
        console.error('Upload failed:', e);
      }
    }
  }

  return BackgroundFetch.BackgroundFetchResult.NewData;
});
```

---

## 8. API 구현 예시 (Next.js)

모바일 앱을 위한 REST API 엔드포인트 구현 예시입니다.

### 8.1 파일 구조

```
src/app/api/mobile/
├── auth/
│   ├── login/route.ts
│   └── me/route.ts
├── lab-meetings/
│   ├── route.ts
│   └── [id]/route.ts
├── materials/
│   └── for-transcription/route.ts
└── transcriptions/
    ├── route.ts
    └── [id]/
        ├── route.ts
        └── status/route.ts
```

### 8.2 인증 미들웨어

```typescript
// src/lib/mobile-auth.ts
import { prisma } from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

export async function authenticateMobile(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verify(token, process.env.MOBILE_JWT_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isApproved: true,
        isAdmin: true,
      }
    });

    return user;
  } catch {
    return null;
  }
}
```

### 8.3 트랜스크립션 업로드 API

```typescript
// src/app/api/mobile/transcriptions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateMobile } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase';
import { STORAGE_BUCKET } from '@/lib/storage-constants';

export async function POST(request: NextRequest) {
  // 인증 확인
  const user = await authenticateMobile(request);
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  if (!user.isApproved && !user.isAdmin) {
    return NextResponse.json({ error: '승인된 멤버만 사용할 수 있습니다.' }, { status: 403 });
  }

  // FormData 파싱
  const formData = await request.formData();
  const materialId = formData.get('materialId') as string;
  const audioFile = formData.get('audioFile') as File;
  const presenterId = formData.get('presenterId') as string | null;

  if (!materialId || !audioFile) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 });
  }

  // 발표자료 확인
  const material = await prisma.material.findUnique({
    where: { id: materialId },
    include: { transcription: true }
  });

  if (!material) {
    return NextResponse.json({ error: '발표자료를 찾을 수 없습니다.' }, { status: 404 });
  }

  // 기존 트랜스크립션 확인
  if (material.transcription) {
    if (material.transcription.status === 'FAILED') {
      await prisma.meetingTranscription.delete({
        where: { id: material.transcription.id }
      });
    } else {
      return NextResponse.json({ error: '이미 트랜스크립션이 존재합니다.' }, { status: 400 });
    }
  }

  // 발표자 업데이트
  if (presenterId) {
    await prisma.material.update({
      where: { id: materialId },
      data: { presenterId }
    });
  }

  // 오디오 파일 업로드
  const timestamp = Date.now();
  const safeName = audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${timestamp}_${safeName}`;
  const filePath = `transcriptions/${filename}`;

  const bytes = await audioFile.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType: audioFile.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: '파일 업로드 실패' }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  // DB 레코드 생성
  const transcription = await prisma.meetingTranscription.create({
    data: {
      materialId,
      audioUrl: urlData.publicUrl,
      audioFilename: audioFile.name,
      status: 'PENDING',
      recorderId: user.id,
      recorderName: user.name || '알 수 없음'
    }
  });

  // 백그라운드 처리 시작 (기존 함수 재사용)
  // startTranscriptionJob(transcription.id, urlData.publicUrl);

  return NextResponse.json({
    success: true,
    transcriptionId: transcription.id
  });
}
```

---

## 9. 환경 변수

### 9.1 서버 (.env)

```env
# 기존 환경 변수
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
TRANSCRIPTION_SERVICE_URL=http://localhost:8000

# 모바일 앱용 추가
MOBILE_JWT_SECRET=your-mobile-jwt-secret-key
GOOGLE_CLIENT_ID_MOBILE=your-mobile-google-client-id
```

### 9.2 모바일 앱 (.env)

```env
API_BASE_URL=https://your-domain.com
GOOGLE_CLIENT_ID=your-mobile-google-client-id
```

---

## 10. 구현 체크리스트

### Phase 1: 서버 API 구현

- [ ] 모바일 인증 시스템 (`/api/mobile/auth/*`)
- [ ] JWT 토큰 발급/검증
- [ ] 랩미팅 목록 API (`/api/mobile/lab-meetings`)
- [ ] 발표자료 목록 API (`/api/mobile/materials/for-transcription`)
- [ ] 트랜스크립션 업로드 API (`/api/mobile/transcriptions`)
- [ ] 트랜스크립션 상태/결과 API

### Phase 2: 모바일 앱 기본 구조

- [ ] Expo 프로젝트 생성
- [ ] 네비게이션 설정 (React Navigation)
- [ ] 상태 관리 설정 (Zustand + React Query)
- [ ] API 클라이언트 설정 (Axios)
- [ ] 인증 플로우 구현

### Phase 3: 핵심 기능

- [ ] 로그인 화면
- [ ] 랩미팅 목록 화면
- [ ] 랩미팅 상세 화면
- [ ] 오디오 녹음 기능
- [ ] 파일 업로드 기능
- [ ] 상태 폴링

### Phase 4: 결과 표시

- [ ] 요약 보기 화면
- [ ] 트랜스크립트 표시 (화자 구분)
- [ ] 오디오 재생

### Phase 5: 개선

- [ ] 백그라운드 업로드
- [ ] 오프라인 지원
- [ ] 푸시 알림 (처리 완료 시)
- [ ] 에러 처리 및 재시도

---

## 11. 보안 고려사항

1. **HTTPS 필수**: 모든 API 통신은 HTTPS로
2. **토큰 저장**: Secure Store 사용 (Keychain/Keystore)
3. **토큰 만료**: Access Token 1시간, Refresh Token 30일
4. **파일 검증**: 서버에서 오디오 파일 형식 검증
5. **Rate Limiting**: API 요청 제한 (분당 60회)
6. **파일 크기 제한**: 최대 100MB

---

## 12. 문의 및 참고

- **웹 코드 위치**: `C:\Users\admin\Desktop\Server\lab_web\V1\lab_web`
- **Transcription Service**: `C:\Users\admin\Desktop\Server\lab_web\transcription-service`
- **Prisma 스키마**: `prisma/schema.prisma`
- **Server Actions**: `src/actions/meeting-transcription.ts`

---

*이 문서는 2026-02-03에 작성되었습니다.*
