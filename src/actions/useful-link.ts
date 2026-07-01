'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export interface UsefulLinkItem {
    id: string
    title: string
    url: string
    description: string | null
    category: string
    authorName: string | null
    authorId: string | null
    createdAt: string
}

function hasDatabaseUrl() {
    return Boolean(process.env.REAL_DATABASE_URL)
}

function normalizeUrl(value: string) {
    const trimmed = value.trim()
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    return new URL(withProtocol).toString()
}

function titleFromUrl(url: string) {
    const { hostname } = new URL(url)
    return hostname.replace(/^www\./, '')
}

function normalizeCategory(value: string) {
    const normalized = value.trim().replace(/\s+/g, ' ').toUpperCase()
    const aliases: Record<string, string> = {
        GENERAL: 'General',
        REFERENCE: 'Research',
        REFERANCE: 'Research',
        RESEARCH: 'Research',
        LITERATURE: 'Research',
        PREPRINT: 'Research',
        WRITING: 'Research',
        JOURNAL: 'Research',
        TOOL: 'Tool',
        TOOLS: 'Tool',
        CODE: 'Tool',
    }

    return aliases[normalized] || normalized || 'General'
}

function formatUsefulLink(link: {
    id: string
    title: string
    url: string
    description: string | null
    category: string
    authorId: string | null
    authorName: string | null
    createdAt: Date | string
    author?: { name: string | null } | null
}): UsefulLinkItem {
    return {
        id: link.id,
        title: link.title,
        url: link.url,
        description: link.description,
        category: link.category,
        authorId: link.authorId,
        authorName: link.author?.name || link.authorName,
        createdAt: link.createdAt instanceof Date ? link.createdAt.toISOString() : link.createdAt,
    }
}

function getLocalPreviewLinks(): UsefulLinkItem[] {
    const baseDate = new Date()
    const samples = [
        {
            title: 'Google Scholar',
            url: 'https://scholar.google.com/',
            description: '논문 검색과 인용 확인할 때 쓰기 좋습니다.',
            category: 'Research',
        },
        {
            title: 'PubMed',
            url: 'https://pubmed.ncbi.nlm.nih.gov/',
            description: '바이오/의학 분야 논문을 빠르게 찾을 수 있습니다.',
            category: 'Research',
        },
        {
            title: 'arXiv',
            url: 'https://arxiv.org/',
            description: '프리프린트와 최신 연구 동향 확인용입니다.',
            category: 'Research',
        },
        {
            title: 'Semantic Scholar',
            url: 'https://www.semanticscholar.org/',
            description: '관련 논문을 이어서 찾을 때 편합니다.',
            category: 'Research',
        },
        {
            title: 'Overleaf',
            url: 'https://www.overleaf.com/',
            description: '공동 LaTeX 작성과 논문 템플릿 관리에 좋습니다.',
            category: 'Tool',
        },
        {
            title: 'Zotero',
            url: 'https://www.zotero.org/',
            description: '논문 레퍼런스 정리와 citation 관리용입니다.',
            category: 'Research',
        },
        {
            title: 'GitHub',
            url: 'https://github.com/',
            description: '코드 공유와 프로젝트 이슈 관리에 사용합니다.',
            category: 'Tool',
        },
        {
            title: 'NCBI',
            url: 'https://www.ncbi.nlm.nih.gov/',
            description: '데이터베이스와 생물정보 자료 확인용입니다.',
            category: 'Research',
        },
        {
            title: 'DeepL',
            url: 'https://www.deepl.com/translator',
            description: '영문 초안 점검과 빠른 번역 테스트용입니다.',
            category: 'Tool',
        },
        {
            title: 'Nature',
            url: 'https://www.nature.com/',
            description: '저널 기사와 최신 연구 뉴스 확인용입니다.',
            category: 'General',
        },
        {
            title: 'Scopus',
            url: 'https://www.scopus.com/',
            description: 'Abstract and citation database for literature checks.',
            category: 'Research',
        },
        {
            title: 'Web of Science',
            url: 'https://www.webofscience.com/',
            description: 'Citation search and journal trend checks.',
            category: 'Research',
        },
        {
            title: 'ORCID',
            url: 'https://orcid.org/',
            description: 'Researcher profile and author identifier management.',
            category: 'General',
        },
        {
            title: 'ChatGPT',
            url: 'https://chatgpt.com/',
            description: 'Drafting, summarizing, and idea organization tests.',
            category: 'AI',
        },
        {
            title: 'Papers With Code',
            url: 'https://paperswithcode.com/',
            description: 'Find papers with related implementations and benchmarks.',
            category: 'CODE',
        },
        {
            title: 'Kaggle',
            url: 'https://www.kaggle.com/',
            description: 'Dataset discovery and quick analysis practice.',
            category: 'DATA',
        },
        {
            title: 'BioRender',
            url: 'https://www.biorender.com/',
            description: 'Create clean scientific figures and diagrams.',
            category: 'WRITING',
        },
        {
            title: 'LabArchives',
            url: 'https://www.labarchives.com/',
            description: 'Electronic lab notebook reference page.',
            category: 'LAB',
        },
        {
            title: 'Notion',
            url: 'https://www.notion.so/',
            description: 'Shared notes, project pages, and lab wiki testing.',
            category: 'Tool',
        },
        {
            title: 'Google Drive',
            url: 'https://drive.google.com/',
            description: 'Shared file and folder organization reference.',
            category: 'Tool',
        },
        {
            title: 'Google Patents',
            url: 'https://patents.google.com/',
            description: 'Patent search and prior-art review tests.',
            category: 'PATENT',
        },
        {
            title: 'Streamlit',
            url: 'https://streamlit.io/',
            description: 'Quick dashboard and prototype sharing.',
            category: 'APP',
        },
        {
            title: 'Hugging Face',
            url: 'https://huggingface.co/',
            description: 'AI model and dataset exploration.',
            category: 'ML',
        },
        {
            title: 'Figma',
            url: 'https://www.figma.com/',
            description: 'Figure layout and interface mockup testing.',
            category: 'DESIGN',
        },
        {
            title: 'GraphPad',
            url: 'https://www.graphpad.com/',
            description: 'Statistics and scientific graphing reference.',
            category: 'STATS',
        },
    ]

    return samples.map((sample, index) => ({
        id: `local-test-${index + 1}`,
        ...sample,
        authorId: 'local-preview-user',
        authorName: 'Test User',
        createdAt: new Date(baseDate.getTime() - index * 60 * 1000).toISOString(),
    }))
}

export async function getUsefulLinks(): Promise<UsefulLinkItem[]> {
    if (!hasDatabaseUrl()) {
        return getLocalPreviewLinks()
    }

    const links = await prisma.usefulLink.findMany({
        include: {
            author: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    })

    return links.map(formatUsefulLink)
}

export async function createUsefulLink(formData: FormData) {
    const session = await auth()

    if (!session?.user?.id || (!session.user.isApproved && !session.user.isAdmin)) {
        return { error: '승인된 연구실 구성원만 Useful Links를 추가할 수 있습니다.' }
    }

    const title = String(formData.get('title') ?? '').trim()
    const rawUrl = String(formData.get('url') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const category = normalizeCategory(String(formData.get('category') ?? 'General'))
    const authorName = String(formData.get('authorName') ?? '').trim() || session.user.name || null

    if (!rawUrl) {
        return { error: '사이트 주소를 입력해주세요.' }
    }

    let url: string
    try {
        url = normalizeUrl(rawUrl)
    } catch {
        return { error: '올바른 사이트 주소를 입력해주세요.' }
    }

    if (!hasDatabaseUrl()) {
        return {
            localOnly: true,
            link: {
                id: `local-${Date.now()}`,
                title: title || titleFromUrl(url),
                url,
                description: description || null,
                category,
                authorId: session.user.id,
                authorName: authorName || 'Local Preview',
                createdAt: new Date().toISOString(),
            } satisfies UsefulLinkItem,
        }
    }

    const link = await prisma.usefulLink.create({
        data: {
            title: title || titleFromUrl(url),
            url,
            description: description || null,
            category,
            authorId: session.user.id,
            authorName,
        },
        include: {
            author: {
                select: {
                    name: true,
                },
            },
        },
    })

    revalidatePath('/board/folder')
    return { success: true, link: formatUsefulLink(link) }
}

export async function deleteUsefulLink(id: string) {
    const session = await auth()

    if (!session?.user?.id) {
        return { error: '로그인이 필요합니다.' }
    }

    if (!hasDatabaseUrl()) {
        return { localOnly: true, id }
    }

    const link = await prisma.usefulLink.findUnique({
        where: { id },
        select: { authorId: true },
    })

    if (!link) {
        return { error: '링크를 찾을 수 없습니다.' }
    }

    if (link.authorId !== session.user.id && !session.user.isAdmin) {
        return { error: '삭제 권한이 없습니다.' }
    }

    await prisma.usefulLink.delete({ where: { id } })
    revalidatePath('/board/folder')
    return { success: true }
}
