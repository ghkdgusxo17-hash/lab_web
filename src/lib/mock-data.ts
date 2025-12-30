import { Role, User, Post, PostType, Resource, ResourceType, Reservation, ReservationStatus, CalendarEvent } from '@/types'

// Mock Users - 화학공정연구실
export const mockUsers: User[] = [
    {
        id: '1',
        name: '김철호',
        email: 'chkim@university.ac.kr',
        role: Role.PROFESSOR,
        bio: '화학공정 시스템 최적화 전문. 한국화학공학회 정회원.',
        image: undefined,
        researchInterests: ['Process Optimization', 'Process Control', 'Machine Learning'],
        joinedAt: new Date('2008-03-01'),
    },
    {
        id: '2',
        name: '이정민',
        email: 'jmlee@university.ac.kr',
        role: Role.PHD,
        bio: '반응공정 모델링 및 최적화 연구. 박사 4년차.',
        image: undefined,
        researchInterests: ['Reactor Modeling', 'Kinetics', 'CFD'],
        joinedAt: new Date('2020-09-01'),
    },
    {
        id: '3',
        name: '박수진',
        email: 'sjpark@university.ac.kr',
        role: Role.PHD,
        bio: '분리공정 설계 및 에너지 효율화 연구. 박사 2년차.',
        image: undefined,
        researchInterests: ['Distillation', 'Membrane Separation', 'Energy Integration'],
        joinedAt: new Date('2022-03-01'),
    },
    {
        id: '4',
        name: '최영훈',
        email: 'yhchoi@university.ac.kr',
        role: Role.MS,
        bio: '촉매 반응 공정 연구. 석사 2년차.',
        image: undefined,
        researchInterests: ['Catalysis', 'Reaction Engineering'],
        joinedAt: new Date('2023-03-01'),
    },
    {
        id: '5',
        name: '정하늘',
        email: 'hnjung@university.ac.kr',
        role: Role.MS,
        bio: '공정 데이터 분석 연구. 석사 1년차.',
        image: undefined,
        researchInterests: ['Data Analysis', 'Process Monitoring'],
        joinedAt: new Date('2024-03-01'),
    },
    {
        id: '6',
        name: '김민서',
        email: 'mskim@university.ac.kr',
        role: Role.BS,
        bio: '학부 4학년, 공정 시뮬레이션 학습 중.',
        image: undefined,
        researchInterests: ['Aspen Plus', 'Process Simulation'],
        joinedAt: new Date('2024-06-01'),
    },
    {
        id: '7',
        name: '이동현',
        email: 'dhlee@company.com',
        role: Role.ALUMNI,
        bio: '현 삼성엔지니어링 공정엔지니어. 2022년 박사 졸업.',
        image: undefined,
        researchInterests: ['Process Design', 'Plant Engineering'],
        joinedAt: new Date('2016-09-01'),
        graduatedAt: new Date('2022-02-01'),
    },
    {
        id: '8',
        name: '한소희',
        email: 'shhan@company.com',
        role: Role.ALUMNI,
        bio: '현 LG화학 연구원. 2023년 석사 졸업.',
        image: undefined,
        researchInterests: ['Polymer Process', 'Reaction Engineering'],
        joinedAt: new Date('2021-03-01'),
        graduatedAt: new Date('2023-02-01'),
    },
]

// Mock Posts
export const mockPosts: Post[] = [
    {
        id: '1',
        title: '2024년 겨울학기 랩미팅 일정 안내',
        content: `안녕하세요, 2024년 겨울학기 랩미팅 일정을 안내드립니다.

## 일정
- 매주 금요일 오후 3시
- 장소: 화공관 305호 세미나실

## 발표 순서
1. 12월 6일 - 이정민 (Reactor CFD 시뮬레이션 결과)
2. 12월 13일 - 박수진 (분리공정 에너지 최적화)
3. 12월 20일 - 최영훈 (촉매 반응 실험 결과)

많은 참여 부탁드립니다.`,
        type: PostType.NOTICE,
        author: mockUsers[0],
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-01'),
        isPinned: true,
    },
    {
        id: '2',
        title: 'GC-MS 사용 관련 안내',
        content: 'GC-MS 사용 시 반드시 예약 후 사용해주시고, 사용 후 로그북 작성 부탁드립니다.',
        type: PostType.NOTICE,
        author: mockUsers[0],
        createdAt: new Date('2024-12-03'),
        updatedAt: new Date('2024-12-03'),
        isPinned: false,
    },
    {
        id: '3',
        title: '연말 연구실 대청소 일정',
        content: '12월 23일(월) 오후에 연구실 대청소 예정입니다. 각자 실험대 정리 부탁드려요!',
        type: PostType.FREE,
        author: mockUsers[1],
        createdAt: new Date('2024-12-02'),
        updatedAt: new Date('2024-12-02'),
        isPinned: false,
    },
]

// Mock Resources - 화학공정 연구실 장비
export const mockResources: Resource[] = [
    {
        id: '1',
        name: 'GC-MS',
        description: 'Agilent 7890B GC / 5977B MSD',
        type: ResourceType.EQUIPMENT,
        isAvailable: true,
    },
    {
        id: '2',
        name: 'HPLC',
        description: 'Waters Alliance e2695',
        type: ResourceType.EQUIPMENT,
        isAvailable: true,
    },
    {
        id: '3',
        name: 'Aspen Plus 워크스테이션',
        description: 'HP Z8 G4, Aspen Plus V14',
        type: ResourceType.EQUIPMENT,
        isAvailable: true,
    },
    {
        id: '4',
        name: '세미나실',
        description: '화공관 305호, 최대 15명',
        type: ResourceType.ROOM,
        isAvailable: true,
    },
]

// Mock Reservations
export const mockReservations: Reservation[] = [
    {
        id: '1',
        resource: mockResources[0],
        user: mockUsers[1],
        startTime: new Date('2024-12-05T09:00:00'),
        endTime: new Date('2024-12-05T12:00:00'),
        status: ReservationStatus.APPROVED,
        purpose: '반응 생성물 분석',
        createdAt: new Date('2024-12-04'),
    },
    {
        id: '2',
        resource: mockResources[3],
        user: mockUsers[0],
        startTime: new Date('2024-12-06T15:00:00'),
        endTime: new Date('2024-12-06T17:00:00'),
        status: ReservationStatus.APPROVED,
        purpose: '주간 랩미팅',
        createdAt: new Date('2024-12-01'),
    },
]

// Mock Calendar Events
export const mockEvents: CalendarEvent[] = [
    {
        id: '1',
        title: '랩미팅',
        description: '주간 연구 진행 상황 공유',
        startTime: new Date('2024-12-06T15:00:00'),
        endTime: new Date('2024-12-06T17:00:00'),
        isAllDay: false,
        color: '#3b82f6',
        createdBy: mockUsers[0],
        createdAt: new Date('2024-11-01'),
    },
    {
        id: '2',
        title: 'AIChE 논문 제출 마감',
        description: 'Annual Meeting 논문',
        startTime: new Date('2024-12-15T23:59:00'),
        endTime: new Date('2024-12-15T23:59:00'),
        isAllDay: true,
        color: '#ef4444',
        createdBy: mockUsers[0],
        createdAt: new Date('2024-11-01'),
    },
    {
        id: '3',
        title: '화학공학회 동계 학술대회',
        description: '대전 컨벤션센터',
        startTime: new Date('2024-12-18T09:00:00'),
        endTime: new Date('2024-12-20T18:00:00'),
        isAllDay: true,
        color: '#8b5cf6',
        createdBy: mockUsers[0],
        createdAt: new Date('2024-11-15'),
    },
    {
        id: '4',
        title: '연말 회식',
        description: '',
        startTime: new Date('2024-12-23T18:00:00'),
        endTime: new Date('2024-12-23T21:00:00'),
        isAllDay: false,
        color: '#22c55e',
        createdBy: mockUsers[1],
        createdAt: new Date('2024-12-03'),
    },
]
