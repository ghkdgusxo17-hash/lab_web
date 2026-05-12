'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  LineChart,
  RefreshCcw,
  Sparkles,
  StickyNote,
  Target,
  Users,
  X,
} from 'lucide-react'
import type { PublicLabNote } from '@/actions/lab-note'
import { LabNoteBoard } from './LabNoteBoard'

type AxisId = 'curiosity' | 'design' | 'data' | 'execution' | 'collaboration'

interface AxisMeta {
  id: AxisId
  label: string
  shortLabel: string
  colorClass: string
  description: string
  weight: number
  funAtLab: string[]
  careerCopy: string
  starterCopy: string
}

interface Question {
  id: string
  title: string
  prompt: string
  axis: AxisId
}

interface RadarPoint {
  x: number
  y: number
}

interface AxisScore extends AxisMeta {
  rawScore: number
  coherenceBonus: number
  profileWeight: number
  score: number
}

interface ProfileCopy {
  title: string
  summary: string
  lens?: string
  keywords?: string[]
}

interface FitBand {
  label: string
  message: string
}

interface LabFunPoint {
  title: string
  description: string
}

interface SynergyRule {
  id: string
  title: string
  description: string
  questionIds: string[]
  fitBonus: number
  axisBoosts: Partial<Record<AxisId, number>>
}

interface SynergyInsight {
  id: string
  title: string
  description: string
  fitBonus: number
  axisBoosts: Partial<Record<AxisId, number>>
  answerAverage: number
}

const AXES: AxisMeta[] = [
  {
    id: 'curiosity',
    label: '호기심 탐구형',
    shortLabel: '탐구',
    colorClass: 'text-blue-600 dark:text-blue-400',
    description: '처음 보는 개념이 나오면 왜 그런지 더 파고들고 이해하려는 성향',
    weight: 0.24,
    funAtLab: ['새로운 주제를 가볍게 파보는 미니 프로젝트', '결과의 이유를 추적해보는 탐구형 과제', '자료를 읽고 질문을 만드는 시간'],
    careerCopy:
      '이런 성향은 원인을 깊게 이해하고 스스로 질문을 만드는 힘으로 이어져 진학뿐 아니라 기술 이해와 문제 해결 측면에서도 자산이 될 수 있어요.',
    starterCopy:
      '처음부터 경험이 많지 않아도, 궁금한 걸 끝까지 따라가려는 마음이 있으면 연구의 흐름을 빠르게 익히기 좋은 타입이에요.',
  },
  {
    id: 'design',
    label: '개선 설계형',
    shortLabel: '설계',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    description: '더 나은 방법을 찾고 흐름과 구조를 먼저 잡아보려는 성향',
    weight: 0.24,
    funAtLab: ['실험 흐름을 더 좋게 바꾸는 아이디어', '조건을 비교하며 최적점을 찾는 과정', '프로젝트 구조를 먼저 잡아보는 역할'],
    careerCopy:
      '이런 성향은 문제를 더 좋은 방식으로 구조화하고 개선하는 힘으로 이어져 연구와 실무 양쪽에서 모두 강점이 될 수 있어요.',
    starterCopy:
      '정답이 하나가 아닌 문제에서 더 좋은 방법을 찾는 걸 즐긴다면, 랩에서 꽤 깊게 몰입할 가능성이 높아요.',
  },
  {
    id: 'data',
    label: '데이터 도구형',
    shortLabel: '데이터',
    colorClass: 'text-cyan-600 dark:text-cyan-400',
    description: '숫자, 그래프, AI 같은 도구를 배우고 활용하는 데 흥미를 느끼는 성향',
    weight: 0.22,
    funAtLab: ['AI와 데이터를 활용해 해석하는 연습', '그래프와 숫자로 패턴을 읽는 작업', 'Python이나 새 툴을 익히는 경험'],
    careerCopy:
      '이런 성향은 AI 활용, 데이터 해석, 도구 학습 역량으로 이어질 수 있어 진학뿐 아니라 취업 준비에도 분명한 기반이 될 수 있어요.',
    starterCopy:
      '처음엔 서툴러도 도구를 배우려는 흥미가 있다면, 연구 경험이 생각보다 빠르게 쌓일 수 있어요.',
  },
  {
    id: 'execution',
    label: '실행 몰입형',
    shortLabel: '실행',
    colorClass: 'text-amber-600 dark:text-amber-400',
    description: '직접 해보면서 감을 잡고 반복 속에서 배우는 성향',
    weight: 0.16,
    funAtLab: ['직접 해보며 배우는 실전형 업무', '빠르게 시작해서 확인해보는 실험 흐름', '반복 속에서 감을 잡는 프로젝트'],
    careerCopy:
      '이런 성향은 직접 해보며 빠르게 배우는 실행력으로 이어져 프로젝트 수행 경험과 현장 적응력 측면에서 강점이 될 수 있어요.',
    starterCopy:
      '설명만 듣는 것보다 몸을 움직이며 배우는 편이라면, 랩의 실제 흐름과 잘 맞을 가능성이 있어요.',
  },
  {
    id: 'collaboration',
    label: '협업 성장형',
    shortLabel: '협업',
    colorClass: 'text-violet-600 dark:text-violet-400',
    description: '피드백과 대화 속에서 생각이 정리되고 성장하는 성향',
    weight: 0.14,
    funAtLab: ['선배와 함께 배우며 감을 잡는 과정', '팀 미팅에서 아이디어를 정리하는 역할', '협업 결과를 만들어가는 프로젝트'],
    careerCopy:
      '이런 성향은 피드백을 반영하고 함께 성과를 만드는 힘으로 이어져 이후 팀 프로젝트나 조직 경험에서도 큰 자산이 될 수 있어요.',
    starterCopy:
      '혼자 오래 끙끙대기보다 함께 얘기하면서 더 빨리 정리되는 편이라면, 랩의 팀 분위기에 장점이 살아날 수 있어요.',
  },
]

const AXIS_MAP = Object.fromEntries(AXES.map((axis) => [axis.id, axis])) as Record<AxisId, AxisMeta>

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    title: '문항 1',
    prompt: '처음 보는 개념이 나오면 왜 그런지 스스로 더 찾아보는 편이다.',
    axis: 'curiosity',
  },
  {
    id: 'q2',
    title: '문항 2',
    prompt: '바로 답이 보이지 않아도 궁금한 주제는 여러 번 다시 들여다보게 된다.',
    axis: 'curiosity',
  },
  {
    id: 'q3',
    title: '문항 3',
    prompt: '이미 있는 방식보다 더 나은 방법이 없는지 자주 떠올려본다.',
    axis: 'design',
  },
  {
    id: 'q4',
    title: '문항 4',
    prompt: '무언가를 시작할 때 전체 흐름이나 구조를 먼저 잡아보는 편이다.',
    axis: 'design',
  },
  {
    id: 'q5',
    title: '문항 5',
    prompt: '숫자나 그래프를 보면 그냥 넘기기보다 의미를 읽어보려는 편이다.',
    axis: 'data',
  },
  {
    id: 'q6',
    title: '문항 6',
    prompt: 'AI나 새로운 도구를 배우고 직접 써보는 일에 흥미가 있다.',
    axis: 'data',
  },
  {
    id: 'q7',
    title: '문항 7',
    prompt: '설명만 듣는 것보다 직접 해보면서 배우는 쪽이 더 잘 맞는다.',
    axis: 'execution',
  },
  {
    id: 'q8',
    title: '문항 8',
    prompt: '한 번에 잘 안 돼도 몇 번 더 시도하면서 감을 잡는 편이다.',
    axis: 'execution',
  },
  {
    id: 'q9',
    title: '문항 9',
    prompt: '혼자 고민할 때보다 다른 사람과 이야기하면 생각이 더 잘 정리된다.',
    axis: 'collaboration',
  },
  {
    id: 'q10',
    title: '문항 10',
    prompt: '피드백을 받으면 어떻게 더 좋아질지부터 먼저 생각하는 편이다.',
    axis: 'collaboration',
  },
]

const SCALE_OPTIONS = [
  { value: 1, label: '전혀 아니다' },
  { value: 2, label: '아니다' },
  { value: 3, label: '보통이다' },
  { value: 4, label: '그렇다' },
  { value: 5, label: '매우 그렇다' },
]

const QUESTION_INDEX_MAP = Object.fromEntries(
  QUESTIONS.map((question, index) => [question.id, index])
) as Record<string, number>

const AXIS_QUESTION_IDS: Record<AxisId, string[]> = {
  curiosity: ['q1', 'q2'],
  design: ['q3', 'q4'],
  data: ['q5', 'q6'],
  execution: ['q7', 'q8'],
  collaboration: ['q9', 'q10'],
}

const SYNERGY_RULES: SynergyRule[] = [
  {
    id: 'curiosity-design',
    title: '원인 분석 + 구조 설계',
    description: '왜 그런지 파고드는 힘과 전체 흐름을 먼저 그리는 감각이 함께 보입니다.',
    questionIds: ['q1', 'q4'],
    fitBonus: 5,
    axisBoosts: { curiosity: 5, design: 6 },
  },
  {
    id: 'improvement-tools',
    title: '개선 감각 + 도구 적응력',
    description: '더 좋은 방법을 찾으면서도 새로운 도구를 빠르게 받아들이는 흐름이 드러납니다.',
    questionIds: ['q3', 'q6'],
    fitBonus: 6,
    axisBoosts: { design: 5, data: 7 },
  },
  {
    id: 'data-ai',
    title: '데이터 해석 + AI 흥미',
    description: '숫자와 그래프, 그리고 AI 같은 도구를 함께 즐기는 성향이 비교적 선명합니다.',
    questionIds: ['q5', 'q6'],
    fitBonus: 7,
    axisBoosts: { data: 10 },
  },
  {
    id: 'hands-on-persistence',
    title: '실전 학습 + 반복 내성',
    description: '직접 해보며 배우고, 잘 안 돼도 다시 시도하는 실행 감각이 같이 드러납니다.',
    questionIds: ['q7', 'q8'],
    fitBonus: 5,
    axisBoosts: { execution: 10 },
  },
  {
    id: 'feedback-collaboration',
    title: '대화 정리 + 피드백 수용',
    description: '함께 이야기하며 정리하고 피드백을 반영해 더 좋아지게 만드는 흐름이 보입니다.',
    questionIds: ['q9', 'q10'],
    fitBonus: 5,
    axisBoosts: { collaboration: 10 },
  },
  {
    id: 'curious-ai',
    title: '새 개념 탐색 + 도구 흡수',
    description: '낯선 개념을 궁금해하고 새로운 프로그램도 거리낌 없이 만져보는 타입에 가깝습니다.',
    questionIds: ['q1', 'q6'],
    fitBonus: 5,
    axisBoosts: { curiosity: 4, data: 6 },
  },
  {
    id: 'structured-collaboration',
    title: '계획 정리 + 협업 운영 감각',
    description: '방향을 먼저 잡고 다른 사람 의견까지 엮어 프로젝트를 안정적으로 끌고 갈 가능성이 큽니다.',
    questionIds: ['q4', 'q10'],
    fitBonus: 4,
    axisBoosts: { design: 4, collaboration: 5 },
  },
  {
    id: 'curious-resilience',
    title: '탐구 지속력 + 실행 끈기',
    description: '답이 바로 안 보여도 계속 파고들고 시도하는 힘이 함께 나타납니다.',
    questionIds: ['q2', 'q8'],
    fitBonus: 5,
    axisBoosts: { curiosity: 5, execution: 5 },
  },
]

const PROFILE_COMBINATIONS: Record<string, ProfileCopy> = {
  'collaboration-curiosity': {
    title: '질문을 이어가는 협업형',
    summary:
      '아이디어를 함께 나누며 깊게 질문하는 흐름에 잘 맞는 타입이에요. 혼자 오래 붙드는 것보다 대화 속에서 탐구를 키워가는 모습이 잘 보입니다.',
  },
  'collaboration-data': {
    title: '함께 만드는 AI 메이커',
    summary:
      '새로운 도구를 배우고 함께 활용하는 데 강점이 있어요. 팀 안에서 데이터를 읽고 아이디어를 연결하는 역할에 자연스럽게 어울릴 수 있습니다.',
  },
  'collaboration-design': {
    title: '팀 흐름을 잡는 코디형',
    summary:
      '더 나은 방향을 같이 설계하고 사람들 사이의 흐름을 맞추는 데 강점이 있는 타입이에요. 프로젝트를 안정적으로 굴리는 감각이 살아날 가능성이 큽니다.',
  },
  'collaboration-execution': {
    title: '현장형 팀 플레이어',
    summary:
      '같이 움직이며 빠르게 배우는 흐름에서 강점을 보이는 타입이에요. 실행 감각과 협업 감각이 함께 살아나는 편입니다.',
  },
  'curiosity-data': {
    title: 'AI 탐험형 분석가',
    summary:
      '왜 그런지 파고들면서도 데이터를 통해 해석하는 흐름에 강점이 있는 타입이에요. 새로운 도구를 배우는 과정도 꽤 즐겁게 받아들일 가능성이 높습니다.',
  },
  'curiosity-design': {
    title: '문제 구조화형 탐구러',
    summary:
      '질문을 던지고 더 좋은 방향을 설계하는 데 강점이 있는 타입이에요. 막연한 호기심을 실제 문제 해결로 연결하기 좋은 흐름을 가졌습니다.',
  },
  'curiosity-execution': {
    title: '끝까지 해보는 탐험가',
    summary:
      '궁금한 것이 생기면 직접 해보며 확인하는 타입이에요. 아이디어를 실행으로 옮기며 빠르게 배우는 흐름과 잘 맞습니다.',
  },
  'data-design': {
    title: '개선 설계형 메이커',
    summary:
      'AI와 데이터 도구를 써서 더 좋은 방법을 찾는 흐름에 강점이 있는 타입이에요. 실용적이면서도 매력적인 성장 곡선을 보여줄 수 있습니다.',
  },
  'data-execution': {
    title: '도구 실행형 플레이어',
    summary:
      '직접 해보면서 데이터를 읽고 해석하는 데 강점이 있는 타입이에요. 배우는 속도와 실전 감각이 함께 살아나는 편입니다.',
  },
  'design-execution': {
    title: '프로젝트 빌더형',
    summary:
      '생각한 것을 빠르게 실행하고, 실행한 것을 다시 개선하는 순환에 강점이 있는 타입이에요. 실제 프로젝트에서 성과를 만들기 좋은 성향입니다.',
  },
}

const BALANCED_PROFILE_COPY: ProfileCopy = {
  title: '가능성 탐색형 올라운더',
  summary:
    '한 축으로 강하게 치우치기보다 여러 축이 고르게 열려 있는 타입이에요. 아직 특정 스타일로 굳기 전 단계라 다양한 경험을 해보며 내 방식이 무엇인지 빠르게 찾아갈 가능성이 높습니다.',
  lens: '균형형',
  keywords: ['가능성 열림', '고른 반응', '탐색형 시작'],
}

const FOCUSED_PROFILE_OVERRIDES: Record<AxisId, ProfileCopy> = {
  curiosity: {
    title: '깊게 파드는 탐구 집중형',
    summary:
      '왜 그런지 끝까지 묻고 들어가는 성향이 다른 축보다 또렷하게 드러납니다. 관심이 생기면 깊게 몰입하는 편이라, 원인 분석이나 개념 이해가 중요한 과제에서 존재감이 크게 살아날 타입이에요.',
    lens: '집중형',
    keywords: ['깊게 질문함', '원인 분석', '몰입형'],
  },
  design: {
    title: '구조 설계 집중형',
    summary:
      '전체 흐름을 읽고 더 좋은 방법을 설계하려는 힘이 가장 선명하게 보입니다. 막연하게 따라가기보다 구조를 세우고 개선 포인트를 찾는 프로젝트에서 강점이 분명하게 드러날 타입이에요.',
    lens: '집중형',
    keywords: ['흐름 설계', '개선 감각', '구조형'],
  },
  data: {
    title: 'AI 도구 집중형',
    summary:
      '숫자, 그래프, AI 같은 도구에 대한 흥미가 가장 강하게 나타납니다. 데이터를 읽고 새로운 툴을 연결하는 과정에서 빠르게 감을 잡을 수 있는 타입이에요.',
    lens: '집중형',
    keywords: ['AI 흥미', '데이터 해석', '도구 적응'],
  },
  execution: {
    title: '실전 몰입 집중형',
    summary:
      '설명보다 직접 움직이며 배우는 감각이 가장 또렷합니다. 빠르게 해보며 감을 잡는 프로젝트 환경에서 성장 속도가 붙기 쉬운 타입이에요.',
    lens: '집중형',
    keywords: ['직접 해봄', '실전 감각', '빠른 적응'],
  },
  collaboration: {
    title: '피드백 성장 집중형',
    summary:
      '다른 사람과 이야기하고 피드백을 반영해 더 좋아지는 흐름이 가장 뚜렷합니다. 함께 역할을 나누고 결과를 만들어가는 과정에서 강점이 잘 살아날 타입이에요.',
    lens: '집중형',
    keywords: ['대화 정리', '피드백 수용', '협업 성장'],
  },
}

const SYNERGY_PROFILE_OVERRIDES: Record<string, ProfileCopy> = {
  'curiosity-design': {
    title: '논리 설계형 리서처',
    summary:
      '왜 그런지 묻는 힘과 전체 구조를 잡는 감각이 함께 활성화되어 있어요. 질문을 던지고 그걸 실행 가능한 방향으로 정리하는 연구형 흐름에 잘 맞는 타입입니다.',
    lens: '시너지형',
    keywords: ['원인 분석', '구조 설계', '연구형 사고'],
  },
  'improvement-tools': {
    title: '최적화 메이커',
    summary:
      '더 좋은 방법을 찾으면서 새로운 도구도 빠르게 받아들이는 조합이에요. 공정 개선이나 효율화가 중요한 과제에서 강점이 크게 살아날 수 있는 타입입니다.',
    lens: '시너지형',
    keywords: ['개선 감각', '도구 활용', '최적화'],
  },
  'data-ai': {
    title: 'AI 데이터 드라이버',
    summary:
      '숫자와 그래프를 읽는 감각, 그리고 AI 같은 프로그램에 대한 흥미가 함께 살아 있습니다. 데이터 기반 해석이나 모델링 쪽으로 확장하기 좋은 타입이에요.',
    lens: '시너지형',
    keywords: ['AI 활용', '데이터 해석', '모델링 잠재력'],
  },
  'hands-on-persistence': {
    title: '실전 성장형 러너',
    summary:
      '직접 해보며 배우는 감각과 여러 번 시도하는 끈기가 함께 강하게 드러나요. 바로 손을 움직이며 배우는 프로젝트 환경에서 성장 속도가 붙는 타입입니다.',
    lens: '시너지형',
    keywords: ['반복 내성', '실전 학습', '행동력'],
  },
  'feedback-collaboration': {
    title: '피드백 팀 플레이어',
    summary:
      '대화를 통해 생각을 정리하고, 피드백을 받아 더 좋아지게 만드는 흐름이 뚜렷해요. 팀 프로젝트나 공동 연구에서 강점이 선명하게 드러날 타입입니다.',
    lens: '시너지형',
    keywords: ['협업 감각', '피드백 수용', '팀 프로젝트'],
  },
  'curious-ai': {
    title: '테크 탐험형 러너',
    summary:
      '새 개념을 찾아보고 새로운 도구도 거리낌 없이 시도하는 반응 패턴이 보여요. 배우는 속도가 빠르고 기술 쪽으로 손을 넓혀갈 가능성이 높습니다.',
    lens: '시너지형',
    keywords: ['새 개념 흡수', '테크 흥미', '확장형'],
  },
  'structured-collaboration': {
    title: '프로젝트 코디네이터',
    summary:
      '방향을 먼저 잡고 사람들 의견까지 묶어 프로젝트를 안정적으로 운영할 가능성이 큽니다. 팀 안에서 구조를 정리하고 진척을 조율하는 역할과 잘 맞는 타입이에요.',
    lens: '시너지형',
    keywords: ['계획형', '협업 운영', '프로젝트 감각'],
  },
  'curious-resilience': {
    title: '끈기형 탐험가',
    summary:
      '답이 바로 안 보여도 계속 파고들고 시도하는 흐름이 함께 보입니다. 낯선 주제를 만나도 쉽게 손을 놓지 않는 타입에 가깝습니다.',
    lens: '시너지형',
    keywords: ['끈기', '탐구형', '지속력'],
  },
}

const SECONDARY_CAREER_BRIDGE: Record<AxisId, string> = {
  curiosity:
    '보조축으로 호기심이 살아 있으면 스스로 질문을 만들고 이유를 설명하는 힘이 붙어서, 이후 인터뷰나 포트폴리오에서도 설득력이 커질 수 있어요.',
  design:
    '보조축으로 설계 감각이 더해지면 단순 참여를 넘어 문제를 정리하고 방향을 잡는 경험으로 확장되기 좋아요.',
  data:
    '보조축으로 데이터 해석과 도구 사용력이 더해지면 요즘 산업 현장에서도 꽤 매력적인 조합으로 보일 수 있어요.',
  execution:
    '보조축으로 실행력이 붙으면 배우는 속도와 프로젝트 적응력이 함께 커지는 경험으로 이어지기 쉬워요.',
  collaboration:
    '보조축으로 협업 감각이 더해지면 혼자 잘하는 것을 넘어서 함께 성과를 만드는 경험으로 연결될 수 있어요.',
}

const AXIS_FUN_POINT_DETAILS: Record<AxisId, LabFunPoint[]> = {
  curiosity: [
    {
      title: '결과의 이유를 같이 추적하기',
      description: '실험이나 자료를 보고 "왜 이렇게 나왔지?"를 함께 묻고 파고드는 시간이 특히 잘 맞을 수 있어요.',
    },
    {
      title: '새 주제 미니 리서치 맡아보기',
      description: '처음 보는 개념을 빠르게 정리하고 다음 질문을 찾아보는 역할에서 재미를 느끼기 쉽습니다.',
    },
    {
      title: '낯선 개념의 흐름을 연결해보기',
      description: '답을 바로 외우기보다 개념과 맥락을 연결해서 이해하는 과정이 잘 맞는 편이에요.',
    },
  ],
  design: [
    {
      title: '조건 비교 아이디어 짜기',
      description: '더 나은 방식이 있는지 보는 데 익숙해서 실험 방향을 바꾸거나 다듬는 역할과 잘 맞아요.',
    },
    {
      title: '실험이나 분석 흐름 먼저 잡아보기',
      description: '바로 시작하기보다 전체 구조를 잡아두는 편이라 프로젝트 초반 기획 단계에서 강점이 보일 수 있어요.',
    },
    {
      title: '프로젝트를 보기 좋게 구조화하기',
      description: '흩어진 과정들을 한 번 정리해서 보기에 좋게 만드는 감각이 살아날 가능성이 커요.',
    },
  ],
  data: [
    {
      title: 'AI나 Python 도구 만져보기',
      description: '새로운 툴을 바로 써보면서 작은 자동화나 데이터 정리부터 시작하는 흐름과 잘 맞습니다.',
    },
    {
      title: '그래프에서 패턴 읽어보기',
      description: '숫자와 시각화 자료를 보고 의미를 붙이는 작업에서 흥미를 느끼기 쉬운 타입이에요.',
    },
    {
      title: '데이터를 설명 가능한 이야기로 바꾸기',
      description: '결과를 숫자로만 보는 게 아니라 왜 중요한지 연결해서 해석하는 역할과도 어울립니다.',
    },
  ],
  execution: [
    {
      title: '직접 해보며 배우는 작은 과제',
      description: '설명보다 실전 과제를 먼저 해보는 방식에서 성장 속도가 붙을 수 있어요.',
    },
    {
      title: '빠르게 돌려보고 바로 수정하기',
      description: '한 번에 완벽하게 하기보다 빠르게 시도하고 다시 다듬는 흐름에 특히 잘 맞습니다.',
    },
    {
      title: '반복 시도로 감 익히기',
      description: '여러 번 해보며 감을 붙이는 성향이라 초반 실험 적응 단계에서도 강점이 드러날 수 있어요.',
    },
  ],
  collaboration: [
    {
      title: '선배와 같이 정리하는 미팅',
      description: '혼자보다 대화 속에서 생각이 정리되는 타입이라 미팅과 피드백 시간이 특히 잘 맞을 수 있어요.',
    },
    {
      title: '피드백 반영해서 다시 다듬기',
      description: '수정 포인트를 받아 더 좋아지게 만드는 흐름에서 성장감을 느끼기 쉬운 편입니다.',
    },
    {
      title: '팀 프로젝트에서 연결 역할 맡기',
      description: '사람과 아이디어를 이어주는 역할에서 존재감이 비교적 선명하게 드러날 수 있어요.',
    },
  ],
}

const LENS_FUN_POINT_DETAILS: Record<string, LabFunPoint[]> = {
  균형형: [
    {
      title: '여러 역할을 가볍게 맛보기',
      description: '한 축으로 고정되기보다 여러 경험을 해보면서 내 스타일을 찾는 과정이 특히 중요해요.',
    },
    {
      title: '첫 학기 안에 잘 맞는 축 찾기',
      description: '지금은 가능성이 넓게 열려 있으니 실제 경험을 통해 어느 쪽에 더 몰입이 붙는지 보는 게 좋습니다.',
    },
  ],
  시너지형: [
    {
      title: '두 강점이 같이 필요한 프로젝트',
      description: '하나의 축만 쓰는 것보다 두 성향이 함께 필요한 과제에서 훨씬 더 빠르게 몰입할 가능성이 높아요.',
    },
  ],
  집중형: [
    {
      title: '강한 축을 바로 살릴 수 있는 역할 맡기',
      description: '가장 또렷한 강점을 초반부터 작게라도 써보면 연구실 흐름에 더 빠르게 적응할 수 있어요.',
    },
  ],
  복합형: [
    {
      title: '주성향과 보조성향을 함께 써보기',
      description: '한 가지 역할만 하기보다 두 강점을 번갈아 쓰는 활동에서 만족감이 더 높아질 가능성이 있습니다.',
    },
  ],
}

const SYNERGY_FUN_POINT_DETAILS: Record<string, LabFunPoint[]> = {
  'curiosity-design': [
    {
      title: '원인을 찾고 방향까지 짚어보기',
      description: '왜 그런지 추적한 뒤 다음 실험 방향까지 함께 설계하는 과제가 특히 잘 맞을 수 있어요.',
    },
    {
      title: '질문을 실험 아이디어로 바꾸기',
      description: '궁금한 포인트를 구조화해서 실제 프로젝트 흐름으로 바꾸는 과정에서 재미가 커질 수 있습니다.',
    },
  ],
  'improvement-tools': [
    {
      title: '도구를 써서 더 좋은 방법 찾기',
      description: '새 프로그램이나 AI를 써보면서 기존 과정을 더 효율적으로 바꾸는 일이 특히 잘 맞아요.',
    },
    {
      title: '최적화 아이디어 실험해보기',
      description: '여러 조건과 방식을 비교해보는 활동에서 몰입감이 붙기 쉬운 타입입니다.',
    },
  ],
  'data-ai': [
    {
      title: 'AI로 데이터를 다시 읽어보기',
      description: '결과를 숫자로만 보는 게 아니라 AI 같은 도구를 써서 다른 시각으로 해석하는 흐름과 잘 맞습니다.',
    },
    {
      title: '그래프와 수치를 연결해 인사이트 찾기',
      description: '데이터를 정리하고 의미 있는 패턴을 찾아내는 활동에서 성향이 특히 잘 살아날 수 있어요.',
    },
  ],
  'hands-on-persistence': [
    {
      title: '바로 해보고 감을 잡는 실전 과제',
      description: '설명보다 실행이 먼저인 성향이 드러나서, 직접 실험하고 반복하는 과제가 특히 잘 맞을 수 있어요.',
    },
    {
      title: '반복 속에서 개선 포인트 찾기',
      description: '처음부터 완벽하지 않아도 계속 시도하며 감을 잡는 과정 자체가 성장 포인트가 됩니다.',
    },
  ],
  'feedback-collaboration': [
    {
      title: '미팅 후 바로 반영하는 작업',
      description: '대화와 피드백이 들어갈수록 더 좋아지는 타입이라 회의 후 수정하는 과정이 특히 잘 맞을 수 있어요.',
    },
    {
      title: '같이 정리하고 같이 발전시키기',
      description: '혼자만의 결과물보다 팀 안에서 발전하는 과정을 경험할 때 만족감이 높을 가능성이 큽니다.',
    },
  ],
  'curious-ai': [
    {
      title: '새 개념을 도구로 바로 연결해보기',
      description: '처음 보는 개념을 이해한 뒤 AI나 프로그램으로 직접 만져보는 과정이 특히 잘 맞을 수 있어요.',
    },
    {
      title: '기술 탐색형 미니 프로젝트',
      description: '짧고 가볍게 여러 도구를 써보는 경험이 성향과 잘 맞는 편입니다.',
    },
  ],
  'structured-collaboration': [
    {
      title: '진행 흐름을 정리하는 팀 역할',
      description: '다른 사람과 같이 움직이면서도 방향을 정리해주는 역할을 맡을 때 강점이 분명하게 드러날 수 있어요.',
    },
    {
      title: '피드백을 반영하며 일정 다듬기',
      description: '프로젝트 운영 감각이 살아 있어서 작업 과제를 안정적으로 굴리는 데 강점을 보일 수 있습니다.',
    },
  ],
  'curious-resilience': [
    {
      title: '쉽게 답이 안 나오는 주제 붙잡기',
      description: '바로 답이 보이지 않아도 계속 파고드는 타입이라 탐색형 주제에서도 지치지 않을 가능성이 높아요.',
    },
    {
      title: '반복 시도 속에서 답 실마리 찾기',
      description: '여러 번 해보며 감을 만드는 흐름과 잘 맞아서 초반 시행착오도 비교적 잘 버티는 편입니다.',
    },
  ],
}

const APTITUDE_RESULT_STORAGE_KEY = 'cpeLabAptitudeResult'

function getEmptyAnswers() {
  return Array(QUESTIONS.length).fill(0)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getMappedAxisScore(meanValue: number) {
  const normalized = clamp((meanValue - 1) / 4, 0, 1)
  return Math.round(20 + normalized ** 1.1 * 72)
}

function getAxisCoherenceBonus(values: number[]) {
  if (values.length < 2 || values.some((value) => !value)) {
    return 0
  }

  const [left, right] = values
  const gap = Math.abs(left - right)

  if (left === 5 && right === 5) {
    return 8
  }

  if (left >= 4 && right >= 4) {
    return gap === 0 ? 6 : 4
  }

  if (left >= 3 && right >= 3) {
    return gap === 0 ? 3 : gap === 1 ? 1 : 0
  }

  if (gap >= 3) {
    return -6
  }

  if (gap === 2) {
    return -3
  }

  return 0
}

function calculateProfileClarity(axisScores: AxisScore[]) {
  const values = axisScores.map((axis) => axis.score)
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  const stdDev = Math.sqrt(variance)

  if (stdDev >= 14) {
    return { clarityBonus: 6, flatPenalty: 0 }
  }

  if (stdDev >= 10) {
    return { clarityBonus: 4, flatPenalty: 0 }
  }

  if (stdDev >= 7) {
    return { clarityBonus: 2, flatPenalty: 0 }
  }

  if (stdDev >= 4) {
    return { clarityBonus: 0, flatPenalty: 3 }
  }

  return { clarityBonus: 0, flatPenalty: 6 }
}

function calculateResponseStylePenalty(answers: number[]) {
  const answered = answers.filter((value) => value > 0)

  if (answered.length === 0) {
    return 0
  }

  const mean = answered.reduce((sum, value) => sum + value, 0) / answered.length
  const variance = answered.reduce((sum, value) => sum + (value - mean) ** 2, 0) / answered.length
  const stdDev = Math.sqrt(variance)
  const uniqueCount = new Set(answered).size

  if (stdDev < 0.15 && mean >= 4.5) {
    return 6
  }

  if (stdDev < 0.15 && mean >= 3.8) {
    return 5
  }

  if (stdDev < 0.45 && mean >= 3.8 && uniqueCount <= 2) {
    return 3
  }

  return 0
}

function calculateAxisScores(answers: number[]) {
  return AXES.map((axis) => {
    const questionIds = AXIS_QUESTION_IDS[axis.id]
    const values = questionIds
      .map((questionId) => answers[QUESTION_INDEX_MAP[questionId]] ?? 0)
      .filter((value) => value > 0)
    const meanValue =
      values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
    const rawScore =
      values.length > 0 ? getMappedAxisScore(meanValue) : 0
    const coherenceBonus = getAxisCoherenceBonus(
      questionIds.map((questionId) => answers[QUESTION_INDEX_MAP[questionId]] ?? 0)
    )
    const score = Math.round(clamp(rawScore + coherenceBonus, 0, 100))

    return {
      ...axis,
      rawScore,
      coherenceBonus,
      profileWeight: score,
      score,
    }
  })
}

function evaluateSynergies(answers: number[]) {
  return SYNERGY_RULES.flatMap<SynergyInsight>((rule) => {
    const values = rule.questionIds.map((questionId) => answers[QUESTION_INDEX_MAP[questionId]] ?? 0)

    const minValue = Math.min(...values)
    const answerAverage = values.reduce((sum, value) => sum + value, 0) / values.length

    if (minValue < 4 || answerAverage < 4.5) {
      return []
    }

    const strength = clamp((answerAverage - 4.25) / 0.75, 0.45, 1)
    const axisBoosts = Object.fromEntries(
      Object.entries(rule.axisBoosts).map(([axisId, boost]) => [
        axisId,
        Math.round((boost ?? 0) * strength),
      ])
    ) as Partial<Record<AxisId, number>>

    return [
      {
        id: rule.id,
        title: rule.title,
        description: rule.description,
        fitBonus: Math.round(rule.fitBonus * strength),
        axisBoosts,
        answerAverage,
      },
    ]
  }).sort((left, right) => right.fitBonus - left.fitBonus || right.answerAverage - left.answerAverage)
}

function applySynergyProfileWeights(axisScores: AxisScore[], synergies: SynergyInsight[]) {
  const boosts = Object.fromEntries(AXES.map((axis) => [axis.id, 0])) as Record<AxisId, number>

  synergies.forEach((synergy) => {
    Object.entries(synergy.axisBoosts).forEach(([axisId, boost]) => {
      boosts[axisId as AxisId] += boost ?? 0
    })
  })

  return axisScores.map((axis) => ({
    ...axis,
    profileWeight: axis.score + boosts[axis.id],
  }))
}

function getPairKey(primaryAxis: AxisScore, secondaryAxis: AxisScore) {
  return [primaryAxis.id, secondaryAxis.id].sort().join('-')
}

function buildProfileKeywords(
  primaryAxis: AxisScore,
  secondaryAxis: AxisScore,
  synergies: SynergyInsight[],
  extraKeywords: string[] = []
) {
  return [
    ...new Set(
      [primaryAxis.label, secondaryAxis.label, ...extraKeywords, ...synergies.slice(0, 2).map((synergy) => synergy.title)].filter(
        Boolean
      )
    ),
  ].slice(0, 4)
}

function getProfileCopy(
  primaryAxis: AxisScore,
  secondaryAxis: AxisScore,
  axisScores: AxisScore[],
  synergies: SynergyInsight[]
) {
  const rankedAxisScores = [...axisScores].sort(
    (left, right) => right.profileWeight - left.profileWeight || right.score - left.score
  )
  const topSynergy = synergies[0]
  const topGap = (rankedAxisScores[0]?.profileWeight ?? 0) - (rankedAxisScores[1]?.profileWeight ?? 0)
  const scoreSpread =
    (rankedAxisScores[0]?.score ?? 0) - (rankedAxisScores[rankedAxisScores.length - 1]?.score ?? 0)
  const { flatPenalty } = calculateProfileClarity(axisScores)

  if (flatPenalty >= 5 && scoreSpread <= 12) {
    return {
      ...BALANCED_PROFILE_COPY,
      keywords: buildProfileKeywords(primaryAxis, secondaryAxis, synergies, BALANCED_PROFILE_COPY.keywords),
    }
  }

  if (topSynergy && topSynergy.fitBonus >= 5) {
    const synergyCopy = SYNERGY_PROFILE_OVERRIDES[topSynergy.id]
    if (synergyCopy) {
      return {
        ...synergyCopy,
        summary: `${synergyCopy.summary} ${topSynergy.description}`,
        keywords: buildProfileKeywords(primaryAxis, secondaryAxis, synergies, synergyCopy.keywords),
      }
    }
  }

  if (topGap >= 12 || primaryAxis.score - secondaryAxis.score >= 10) {
    const focusedCopy = FOCUSED_PROFILE_OVERRIDES[primaryAxis.id]
    return {
      ...focusedCopy,
      summary: `${focusedCopy.summary} 보조 축으로는 ${secondaryAxis.label} 성향도 함께 살아 있어 확장 가능성이 함께 보입니다.`,
      keywords: buildProfileKeywords(primaryAxis, secondaryAxis, synergies, focusedCopy.keywords),
    }
  }

  const pairKey = getPairKey(primaryAxis, secondaryAxis)
  const comboCopy = PROFILE_COMBINATIONS[pairKey]

  if (comboCopy) {
    return {
      ...comboCopy,
      lens: comboCopy.lens ?? '복합형',
      keywords: buildProfileKeywords(primaryAxis, secondaryAxis, synergies, comboCopy.keywords),
    }
  }

  return {
    title: `${primaryAxis.label} 중심 성장형`,
    summary: `${primaryAxis.label} 성향이 가장 강하고 ${secondaryAxis.label} 성향이 그다음으로 따라오는 타입이에요. 배우는 방향만 잘 잡히면 연구실 안에서 빠르게 감을 만들 가능성이 있습니다.`,
    lens: '복합형',
    keywords: buildProfileKeywords(primaryAxis, secondaryAxis, synergies, ['성장 가능성', '방향 설정']),
  }
}

function getLabFitScore(axisScores: AxisScore[], synergies: SynergyInsight[], answers: number[]) {
  const weightedScore = axisScores.reduce((sum, axis) => sum + axis.score * axis.weight, 0)
  const { clarityBonus, flatPenalty } = calculateProfileClarity(axisScores)
  const responseStylePenalty = calculateResponseStylePenalty(answers)
  const synergyBonus = synergies
    .slice(0, 2)
    .reduce((sum, synergy) => sum + synergy.fitBonus, 0)
  const rankedByProfile = [...axisScores].sort(
    (left, right) => right.profileWeight - left.profileWeight || right.score - left.score
  )
  const topPairBonus =
    rankedByProfile.length >= 2 && rankedByProfile[0].score >= 82 && rankedByProfile[1].score >= 76
      ? 4
      : rankedByProfile.length >= 2 &&
          rankedByProfile[0].score >= 74 &&
          rankedByProfile[1].score >= 68
        ? 2
        : 0

  return Math.round(
    clamp(
      50 +
        weightedScore * 0.38 +
        clarityBonus +
        synergyBonus +
        topPairBonus -
        flatPenalty -
        responseStylePenalty,
      54,
      94
    )
  )
}

function getFitBand(score: number): FitBand {
  if (score >= 86) {
    return {
      label: '싱크로율 높음',
      message:
        '관심 분야와 배우는 속도가 우리 랩의 연구 흐름과 자연스럽게 연결될 가능성이 높아요. 들어오면 꽤 빠르게 적응하는 타입에 가깝습니다.',
    }
  }

  if (score >= 78) {
    return {
      label: '배우며 몰입하기 좋음',
      message:
        '아직 경험이 많지 않아도 배우는 과정에서 금방 몰입이 붙을 가능성이 있어요. 작은 프로젝트를 통해 성향이 더 선명해질 수 있습니다.',
    }
  }

  if (score >= 70) {
    return {
      label: '성장 여지 충분',
      message:
        '처음부터 완벽하게 맞아떨어지지 않아도, 서너 가지 축이 살아나기 시작하면 빠르게 흐름을 만들 수 있는 타입이에요.',
    }
  }

  return {
    label: '가볍게 시작해도 좋음',
    message:
      '지금은 연구 경험보다 탐색 단계에 더 가까울 수 있어요. 그래도 어떤 방식으로 배우는지 가볍게 알아보는 것만으로도 좋은 출발입니다.',
  }
}

function getCareerMessage(primaryAxis: AxisScore, secondaryAxis: AxisScore) {
  return `${primaryAxis.careerCopy} ${SECONDARY_CAREER_BRIDGE[secondaryAxis.id]}`
}

function getStarterMessage(primaryAxis: AxisScore, secondaryAxis: AxisScore) {
  return `${primaryAxis.starterCopy} ${AXIS_MAP[secondaryAxis.id].starterCopy}`
}

function mergeLabFunPoints(...groups: LabFunPoint[][]) {
  const seen = new Set<string>()

  return groups
    .flat()
    .filter((point) => {
      if (seen.has(point.title)) {
        return false
      }

      seen.add(point.title)
      return true
    })
}

function getLabFunPoints(
  primaryAxis: AxisScore,
  secondaryAxis: AxisScore,
  synergies: SynergyInsight[],
  profileCopy: ProfileCopy
) {
  const topSynergy = synergies[0]
  const nextSynergy = synergies[1]
  const lensPoints = profileCopy.lens ? LENS_FUN_POINT_DETAILS[profileCopy.lens] ?? [] : []
  const topSynergyPoints = topSynergy ? SYNERGY_FUN_POINT_DETAILS[topSynergy.id] ?? [] : []
  const nextSynergyPoints = nextSynergy ? SYNERGY_FUN_POINT_DETAILS[nextSynergy.id] ?? [] : []
  const primaryAxisPoints = AXIS_FUN_POINT_DETAILS[primaryAxis.id]
  const secondaryAxisPoints = AXIS_FUN_POINT_DETAILS[secondaryAxis.id]

  return mergeLabFunPoints(
    lensPoints,
    topSynergyPoints,
    primaryAxisPoints,
    nextSynergyPoints,
    secondaryAxisPoints
  ).slice(0, 3)
}

function buildRadarGeometry(values: number[]) {
  const size = 320
  const center = size / 2
  const radius = 108

  const points = values.map((value, index) => {
    const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / values.length
    const normalized = clamp(value, 0, 100) / 100

    return {
      x: center + Math.cos(angle) * radius * normalized,
      y: center + Math.sin(angle) * radius * normalized,
    }
  })

  const outline = AXES.map((_, index) => {
    const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / AXES.length
    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    }
  })

  const rings = [0.2, 0.4, 0.6, 0.8, 1].map((ratio) =>
    AXES.map((_, index) => {
      const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / AXES.length
      return {
        x: center + Math.cos(angle) * radius * ratio,
        y: center + Math.sin(angle) * radius * ratio,
      }
    })
  )

  const labels = AXES.map((axis, index) => {
    const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / AXES.length
    return {
      axis,
      x: center + Math.cos(angle) * (radius + 36),
      y: center + Math.sin(angle) * (radius + 36),
    }
  })

  return { size, center, points, outline, rings, labels }
}

function pointsToString(points: RadarPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(' ')
}

function RadarChart({ values }: { values: number[] }) {
  const geometry = buildRadarGeometry(values)
  const areaPoints = pointsToString(geometry.points)

  return (
    <svg
      viewBox={`0 0 ${geometry.size} ${geometry.size}`}
      className="mx-auto w-full max-w-[340px]"
      role="img"
      aria-label="연구 선호도 레이더 차트"
    >
      {geometry.rings.map((ring, index) => (
        <polygon
          key={index}
          points={pointsToString(ring)}
          fill={index % 2 === 0 ? 'rgba(59,130,246,0.05)' : 'rgba(14,165,233,0.02)'}
          stroke="rgba(148,163,184,0.28)"
          strokeWidth="1"
        />
      ))}

      {geometry.outline.map((point, index) => (
        <line
          key={AXES[index].id}
          x1={geometry.center}
          y1={geometry.center}
          x2={point.x}
          y2={point.y}
          stroke="rgba(148,163,184,0.35)"
          strokeWidth="1"
        />
      ))}

      <polygon
        points={areaPoints}
        fill="rgba(14,165,233,0.24)"
        stroke="rgba(14,165,233,0.95)"
        strokeWidth="2.5"
      />

      {geometry.points.map((point, index) => (
        <circle
          key={AXES[index].id}
          cx={point.x}
          cy={point.y}
          r="4.5"
          fill="rgba(14,165,233,1)"
          stroke="white"
          strokeWidth="2"
        />
      ))}

      {geometry.labels.map(({ axis, x, y }) => (
        <text
          key={axis.id}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-700 text-[12px] font-semibold dark:fill-slate-200"
        >
          {axis.shortLabel}
        </text>
      ))}
    </svg>
  )
}

export function AptitudeTestClient({ publicNotes }: { publicNotes: PublicLabNote[] }) {
  const [answers, setAnswers] = useState<number[]>(getEmptyAnswers())
  const [currentStep, setCurrentStep] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isNoteBoardOpen, setIsNoteBoardOpen] = useState(false)
  const advanceTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        window.clearTimeout(advanceTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isNoteBoardOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNoteBoardOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isNoteBoardOpen])

  const answeredCount = answers.filter((value) => value > 0).length
  const allAnswered = answeredCount === QUESTIONS.length
  const currentQuestionIndex = Math.min(currentStep, QUESTIONS.length - 1)
  const currentQuestion = QUESTIONS[currentQuestionIndex]
  const currentAnswer = answers[currentQuestionIndex]
  const remainingCount = QUESTIONS.length - answeredCount

  const baseAxisScores = allAnswered ? calculateAxisScores(answers) : []
  const synergyInsights = allAnswered ? evaluateSynergies(answers) : []
  const axisScores = allAnswered ? applySynergyProfileWeights(baseAxisScores, synergyInsights) : []
  const rankedAxisScores = [...axisScores].sort(
    (left, right) => right.profileWeight - left.profileWeight || right.score - left.score
  )
  const primaryAxis = rankedAxisScores[0]
  const secondaryAxis = rankedAxisScores[1]
  const highlightedSynergies = synergyInsights.slice(0, 3)
  const chartValues = AXES.map(
    (axis) => axisScores.find((item) => item.id === axis.id)?.score ?? 0
  )

  const profileCopy =
    primaryAxis && secondaryAxis ? getProfileCopy(primaryAxis, secondaryAxis, axisScores, synergyInsights) : null
  const labFitScore =
    primaryAxis && secondaryAxis ? getLabFitScore(axisScores, synergyInsights, answers) : 0
  const fitBand = primaryAxis && secondaryAxis ? getFitBand(labFitScore) : null
  const labFunPoints =
    primaryAxis && secondaryAxis && profileCopy
      ? getLabFunPoints(primaryAxis, secondaryAxis, synergyInsights, profileCopy)
      : []
  const careerMessage =
    primaryAxis && secondaryAxis ? getCareerMessage(primaryAxis, secondaryAxis) : ''
  const starterMessage =
    primaryAxis && secondaryAxis ? getStarterMessage(primaryAxis, secondaryAxis) : ''

  useEffect(() => {
    if (!allAnswered || !primaryAxis || !secondaryAxis || !profileCopy) {
      return
    }

    window.localStorage.setItem(
      APTITUDE_RESULT_STORAGE_KEY,
        JSON.stringify({
          title: profileCopy.title,
          summary: profileCopy.summary,
          lens: profileCopy.lens ?? null,
          keywords: profileCopy.keywords ?? [],
          fitScore: labFitScore,
          topAxes: [primaryAxis.label, secondaryAxis.label],
          synergies: highlightedSynergies.map((synergy) => synergy.title),
          savedAt: new Date().toISOString(),
        })
      )
  }, [allAnswered, highlightedSynergies, labFitScore, primaryAxis, profileCopy, secondaryAxis])

  function clearAdvanceTimer() {
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
  }

  function handleAnswer(value: number) {
    clearAdvanceTimer()

    setAnswers((current) => {
      const next = [...current]
      next[currentQuestionIndex] = value
      return next
    })

    setIsTransitioning(true)

    advanceTimerRef.current = window.setTimeout(() => {
      setCurrentStep((step) => {
        if (currentQuestionIndex >= QUESTIONS.length - 1) {
          return QUESTIONS.length
        }

        return Math.max(step, currentQuestionIndex + 1)
      })
      setIsTransitioning(false)
      advanceTimerRef.current = null
    }, 260)
  }

  function handlePrevious() {
    clearAdvanceTimer()
    setIsTransitioning(false)

    if (currentStep === QUESTIONS.length) {
      setCurrentStep(QUESTIONS.length - 1)
      return
    }

    setCurrentStep((step) => Math.max(0, step - 1))
  }

  function resetTest() {
    clearAdvanceTimer()
    setAnswers(getEmptyAnswers())
    setCurrentStep(0)
    setIsTransitioning(false)
    setIsNoteBoardOpen(false)
    window.localStorage.removeItem(APTITUDE_RESULT_STORAGE_KEY)
  }

  return (
    <div className="space-y-10">
      <section className="glass-card p-8 md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl lg:flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700 dark:border-cyan-900/40 dark:bg-cyan-950/40 dark:text-cyan-300">
              <Sparkles className="h-4 w-4" />
              학부생도 부담 없이 참여 가능
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl">
              연구 성향 테스트
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              연구 경험이 없어도 괜찮아요. 10개 문항에 답하면 당신의 학습 성향과 연구 선호가
              5개 축으로 정리되고, 마지막에 우리 랩과 얼마나 잘 맞아갈 수 있을지 감각적인
              그래프로 확인할 수 있습니다.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-[520px] xl:w-[560px]">
            {[
              { label: '대상', value: '학부생 중심' },
              { label: '방식', value: '1문항씩 진행' },
              { label: '결과', value: '궁합도 + 그래프' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 whitespace-nowrap text-base font-bold text-slate-900 dark:text-white lg:text-lg">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-none md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="w-full max-w-2xl">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              진행 상황 {answeredCount}/{QUESTIONS.length}
            </p>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                style={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
              {QUESTIONS.map((question, index) => {
                const isDone = answers[index] > 0
                const isCurrent = currentStep < QUESTIONS.length && index === currentQuestionIndex

                return (
                  <div
                    key={question.id}
                    className={`rounded-full px-2 py-2 text-center text-xs font-semibold transition-all ${
                      isDone
                        ? 'bg-cyan-500 text-white'
                        : isCurrent
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={resetTest}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <RefreshCcw className="h-4 w-4" />
            처음부터 다시
          </button>
        </div>

        {currentStep < QUESTIONS.length ? (
          <article
            className={`mt-8 rounded-[2rem] border border-slate-200 bg-slate-50/70 p-6 transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/50 md:p-8 ${
              isTransitioning ? 'scale-[0.98] opacity-75' : 'scale-100 opacity-100'
            }`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {currentQuestion.title}
                </p>
                <h2 className="mt-2 break-keep text-2xl font-bold leading-relaxed text-slate-900 dark:text-white md:text-3xl">
                  {currentQuestion.prompt}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  정답보다는 평소의 학습 태도와 성향을 떠올리며 답하면 더 자연스럽습니다.
                </p>
              </div>

              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm dark:bg-slate-950 dark:text-slate-400">
                {AXIS_MAP[currentQuestion.axis].label}
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-5">
              {SCALE_OPTIONS.map((option) => {
                const isSelected = currentAnswer === option.value

                return (
                  <button
                    key={`${currentQuestion.id}-${option.value}`}
                    type="button"
                    onClick={() => handleAnswer(option.value)}
                    className={`rounded-3xl border px-4 py-5 text-center transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100/60 dark:border-blue-400 dark:bg-blue-950/40 dark:shadow-none'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700 dark:hover:bg-slate-900'
                    }`}
                  >
                    <p
                      className={`text-lg font-bold ${
                        isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {option.value}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {option.label}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {currentAnswer
                  ? '선택이 저장됐어요. 잠시 뒤 다음 문항으로 넘어갑니다.'
                  : `총 ${remainingCount}개의 문항이 남아 있어요. 편하게 골라보세요.`}
              </div>

              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                  currentStep === 0
                    ? 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-900'
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
                이전 문항
              </button>
            </div>
          </article>
        ) : (
          <div className="mt-8 rounded-[2rem] border border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 p-6 dark:border-cyan-900/40 dark:from-slate-900 dark:to-cyan-950/20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">응답 완료</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  결과가 준비됐어요. 아래에서 우리 랩과의 성장 궁합을 확인해보세요.
                </h2>
              </div>
              <button
                type="button"
                onClick={handlePrevious}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                마지막 문항 다시 보기
              </button>
            </div>
          </div>
        )}
      </section>

      {allAnswered && primaryAxis && secondaryAxis && profileCopy && fitBand && (
        <>
          <section className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50/80 via-white to-blue-50/80 p-6 shadow-xl shadow-cyan-100/60 dark:border-cyan-900/40 dark:from-slate-900 dark:via-slate-950 dark:to-cyan-950/30 dark:shadow-none md:p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm dark:bg-slate-950/70 dark:text-slate-200">
                  <CheckCircle2 className="h-4 w-4" />
                  결과 리포트
                </div>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-700 dark:text-cyan-300">
                  Growth Match
                </p>
                {profileCopy.lens && (
                  <div className="mt-4">
                    <span className="inline-flex items-center rounded-full border border-cyan-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 shadow-sm dark:border-cyan-900/40 dark:bg-slate-950/70 dark:text-cyan-300">
                      {profileCopy.lens}
                    </span>
                  </div>
                )}
                <h2 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
                  {profileCopy.title}
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                  {profileCopy.summary}
                </p>
                {profileCopy.keywords && profileCopy.keywords.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {profileCopy.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/70 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-950/60">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                      <p className="font-semibold text-slate-900 dark:text-white">우리 랩과의 성장 궁합도</p>
                    </div>
                    <p className="mt-3 text-3xl font-bold text-cyan-700 dark:text-cyan-300">{labFitScore}%</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{fitBand.label}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {fitBand.message}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/70 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-950/60">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                      <p className="font-semibold text-slate-900 dark:text-white">지금 잘 맞는 강점</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[primaryAxis, secondaryAxis].map((axis) => (
                        <span
                          key={axis.id}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          {axis.label}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {starterMessage}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-white/70 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
                    <p className="font-semibold text-slate-900 dark:text-white">응답에서 보인 시너지</p>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    단순 점수만 본 것이 아니라, 함께 높게 나온 문항 조합도 같이 반영했어요.
                  </p>
                  <div className="mt-5 space-y-3">
                    {highlightedSynergies.length > 0 ? (
                      highlightedSynergies.map((synergy) => (
                        <div
                          key={synergy.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/70"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-base font-semibold text-slate-900 dark:text-white">
                              {synergy.title}
                            </p>
                            <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
                              +{synergy.fitBonus}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                            {synergy.description}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                        아직 선명한 시너지 조합보다는 기본 축을 먼저 다져가는 흐름이 더 크게 보이는 결과예요.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-white/70 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                    <p className="font-semibold text-slate-900 dark:text-white">우리 랩에서 특히 재미있을 포인트</p>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    막연한 소개보다 실제로 어떤 활동이 더 재미있을지 바로 느껴지도록 정리했어요.
                  </p>
                  <div className="mt-5 space-y-3">
                    {labFunPoints.map((point, index) => (
                      <div
                        key={point.title}
                        className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/70"
                      >
                        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white shadow-sm">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="pt-1">
                          <p className="text-base font-semibold leading-relaxed text-slate-900 dark:text-white">
                            {point.title}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                            {point.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-white/70 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="flex items-center gap-2">
                    <BriefcaseBusiness className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                    <p className="font-semibold text-slate-900 dark:text-white">이 경험이 나중에 도움이 될 수 있는 이유</p>
                  </div>
                  <p className="mt-3 text-slate-600 dark:text-slate-300">{careerMessage}</p>
                </div>

                <div className="mt-8 grid gap-3 lg:grid-cols-3">
                  <Link
                    href="/about"
                    className="group inline-flex min-h-[56px] items-center justify-between rounded-2xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-900"
                  >
                    <span className="whitespace-nowrap">연구실 소개 보기</span>
                    <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/contact/anonymous"
                    className="group inline-flex min-h-[56px] items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50/60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-cyan-700 dark:hover:bg-slate-900"
                  >
                    <span className="whitespace-nowrap">익명으로 질문하기</span>
                    <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={resetTest}
                    className="group inline-flex min-h-[56px] items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <span className="whitespace-nowrap">테스트 다시 하기</span>
                    <RefreshCcw className="h-4 w-4 shrink-0 transition group-hover:rotate-[-18deg]" />
                  </button>
                </div>
              </div>

              <div className="w-full max-w-xl space-y-4">
                <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg dark:border-slate-800 dark:bg-slate-950/80">
                  <div className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <p className="font-semibold text-slate-900 dark:text-white">연구 선호도 감각 그래프</p>
                  </div>

                  <div className="mt-5">
                    <RadarChart values={chartValues} />
                  </div>

                  <div className="mt-6 grid gap-3">
                    {AXES.map((axis) => {
                      const score = axisScores.find((item) => item.id === axis.id)?.score ?? 0
                      return (
                        <div key={axis.id}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className={`font-semibold ${axis.colorClass}`}>{axis.label}</span>
                            <span className="text-slate-500 dark:text-slate-400">{score} / 100</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNoteBoardOpen((current) => !current)}
                  className="group flex w-full items-center justify-between rounded-3xl border border-dashed border-cyan-200 bg-white/85 px-5 py-5 text-left shadow-lg transition hover:border-cyan-300 hover:bg-cyan-50/70 dark:border-cyan-900/40 dark:bg-slate-950/80 dark:hover:border-cyan-800 dark:hover:bg-cyan-950/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-3 text-white shadow-sm">
                      <StickyNote className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900 dark:text-white">선배들의 메모</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        {publicNotes.length > 0
                          ? `${publicNotes.length}개의 메모가 작은 창으로 열려서 연구실 분위기를 볼 수 있어요.`
                          : '작은 메모 창을 열어 연구실 분위기를 가볍게 볼 수 있어요.'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-500 transition group-hover:bg-white dark:bg-slate-900 dark:text-slate-300 dark:group-hover:bg-slate-900">
                    {isNoteBoardOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>
              </div>
            </div>
          </section>

          {isNoteBoardOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.20),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.30),rgba(15,23,42,0.62))] px-4 py-5 backdrop-blur-md md:px-8 md:py-8"
              onClick={() => setIsNoteBoardOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label="선배들의 메모"
                className="flex h-[82vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.30)] dark:border-slate-800 dark:bg-slate-950/95"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 dark:border-slate-800 md:px-6">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">
                      Lab Note Popup
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                      선배들의 한마디
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      현재 화면 위에 크게 펼쳐지는 메모 보드예요. 궁금했던 연구실 분위기를 가볍게 읽어볼 수 있어요.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsNoteBoardOpen(false)}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label="선배들의 메모 닫기"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
                  <LabNoteBoard notes={publicNotes} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
