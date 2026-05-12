'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// ============ 추천 (좋아요) ============

// 게시글 추천 토글
export async function togglePostLike(postId: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    // 승인된 멤버만 추천 가능
    if (!session.user.isApproved && !session.user.isAdmin) {
        return { error: "승인된 멤버만 추천할 수 있습니다." }
    }

    const existingLike = await prisma.postLike.findUnique({
        where: {
            postId_userId: {
                postId,
                userId: session.user.id
            }
        }
    })

    if (existingLike) {
        // 이미 추천했으면 취소
        await prisma.postLike.delete({
            where: { id: existingLike.id }
        })
    } else {
        // 추천하지 않았으면 추가
        await prisma.postLike.create({
            data: {
                postId,
                userId: session.user.id
            }
        })
    }

    revalidatePath(`/board/${postId}`)
    return { success: true, liked: !existingLike }
}

// 게시글 추천 정보 가져오기
export async function getPostLikeInfo(postId: string) {
    const session = await auth()

    const [likeCount, userLike] = await Promise.all([
        prisma.postLike.count({ where: { postId } }),
        session?.user?.id
            ? prisma.postLike.findUnique({
                where: {
                    postId_userId: {
                        postId,
                        userId: session.user.id
                    }
                }
            })
            : null
    ])

    return {
        count: likeCount,
        isLiked: !!userLike
    }
}

// ============ 투표 ============

// 투표 생성 (게시글 작성 시)
export async function createPoll(
    postId: string,
    question: string,
    options: string[],
    isMultiple: boolean = false,
    isAnonymous: boolean = false,
    endsAt?: Date
) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        return { error: "승인된 멤버만 투표를 생성할 수 있습니다." }
    }

    if (options.length < 2) {
        return { error: "투표 옵션은 최소 2개 이상이어야 합니다." }
    }

    const poll = await prisma.poll.create({
        data: {
            postId,
            question,
            isMultiple,
            isAnonymous,
            endsAt,
            options: {
                create: options.map((text, index) => ({
                    text,
                    order: index
                }))
            }
        },
        include: {
            options: true
        }
    })

    revalidatePath(`/board/${postId}`)
    return { success: true, poll }
}

// 투표하기
export async function votePoll(optionIds: string[]) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    if (!session.user.isApproved && !session.user.isAdmin) {
        return { error: "승인된 멤버만 투표할 수 있습니다." }
    }

    if (optionIds.length === 0) {
        return { error: "옵션을 선택해주세요." }
    }

    // 첫 번째 옵션으로 poll 정보 가져오기
    const firstOption = await prisma.pollOption.findUnique({
        where: { id: optionIds[0] },
        include: { poll: true }
    })

    if (!firstOption) {
        return { error: "투표를 찾을 수 없습니다." }
    }

    const poll = firstOption.poll

    // 마감 확인
    if (poll.endsAt && new Date() > poll.endsAt) {
        return { error: "투표가 마감되었습니다." }
    }

    // 복수 선택 확인
    if (!poll.isMultiple && optionIds.length > 1) {
        return { error: "이 투표는 하나만 선택할 수 있습니다." }
    }

    // 기존 투표 삭제 (해당 poll의 모든 옵션에서)
    const pollOptions = await prisma.pollOption.findMany({
        where: { pollId: poll.id },
        select: { id: true }
    })

    await prisma.pollVote.deleteMany({
        where: {
            optionId: { in: pollOptions.map(o => o.id) },
            userId: session.user.id
        }
    })

    // 새로운 투표 추가
    await prisma.pollVote.createMany({
        data: optionIds.map(optionId => ({
            optionId,
            userId: session.user.id
        }))
    })

    revalidatePath(`/board/${poll.postId}`)
    return { success: true }
}

// 투표 정보 가져오기
export async function getPollInfo(postId: string) {
    const session = await auth()

    const poll = await prisma.poll.findUnique({
        where: { postId },
        include: {
            options: {
                orderBy: { order: 'asc' },
                include: {
                    votes: {
                        select: {
                            userId: true,
                            user: {
                                select: { name: true, image: true }
                            }
                        }
                    },
                    _count: {
                        select: { votes: true }
                    }
                }
            }
        }
    })

    if (!poll) {
        return null
    }

    // 사용자의 투표 확인
    const userVotes = session?.user?.id
        ? poll.options.filter(option =>
            option.votes.some(vote => vote.userId === session.user.id)
        ).map(option => option.id)
        : []

    // 총 투표 수
    const totalVotes = poll.options.reduce((sum, option) => sum + option._count.votes, 0)

    // 익명 투표면 투표자 정보 숨김
    const options = poll.options.map(option => ({
        id: option.id,
        text: option.text,
        voteCount: option._count.votes,
        percentage: totalVotes > 0 ? Math.round((option._count.votes / totalVotes) * 100) : 0,
        voters: poll.isAnonymous ? [] : option.votes.map(v => ({
            name: v.user.name,
            image: v.user.image
        }))
    }))

    return {
        id: poll.id,
        question: poll.question,
        isMultiple: poll.isMultiple,
        isAnonymous: poll.isAnonymous,
        endsAt: poll.endsAt,
        isEnded: poll.endsAt ? new Date() > poll.endsAt : false,
        totalVotes,
        options,
        userVotes,
        hasVoted: userVotes.length > 0
    }
}

// 투표 삭제 (작성자 또는 관리자만)
export async function deletePoll(postId: string) {
    const session = await auth()

    if (!session?.user) {
        return { error: "로그인이 필요합니다." }
    }

    const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true }
    })

    if (!post) {
        return { error: "게시글을 찾을 수 없습니다." }
    }

    if (post.authorId !== session.user.id && !session.user.isAdmin) {
        return { error: "삭제 권한이 없습니다." }
    }

    await prisma.poll.delete({
        where: { postId }
    })

    revalidatePath(`/board/${postId}`)
    return { success: true }
}
