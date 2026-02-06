import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPost } from '@/actions/board'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { ArrowLeft, Clock, User, Pin, Megaphone, MessageSquare, FileText, BookOpen, Download, Music, Video } from 'lucide-react'
import { MedalBadge } from '@/components/ui/MedalBadge'
import { formatDate } from '@/lib/utils'
import { PostActions } from './PostActions'
import { CommentSection } from './CommentSection'
import { LikeButton } from './LikeButton'
import { PollSection } from './PollSection'
import { getPostLikeInfo, getPollInfo } from '@/actions/post-interaction'

interface PostPageProps {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
    const { id } = await params
    const post = await getPost(id)

    return {
        title: post ? `${post.title} | CPE Lab` : '게시글 | CPE Lab',
    }
}

function getTypeInfo(type: string) {
    switch (type) {
        case 'NOTICE':
            return { label: '공지사항', icon: Megaphone, color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' }
        case 'SEMINAR':
            return { label: '세미나', icon: BookOpen, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' }
        default:
            return { label: '자유게시판', icon: MessageSquare, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' }
    }
}

function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function isAudioFile(mimeType: string) {
    return mimeType.startsWith('audio/')
}

function isVideoFile(mimeType: string) {
    return mimeType.startsWith('video/')
}

function getFileIcon(mimeType: string) {
    if (isAudioFile(mimeType)) return Music
    if (isVideoFile(mimeType)) return Video
    return FileText
}

export default async function PostPage({ params }: PostPageProps) {
    const { id } = await params
    const session = await auth()
    const post = await getPost(id)

    if (!post) {
        notFound()
    }

    const isAuthor = session?.user?.id === post.authorId
    const isAdmin = session?.user?.isAdmin
    const canEdit = isAuthor || isAdmin
    const canComment = session?.user && (session.user.isAdmin || session.user.isApproved)
    const canLike = !!session?.user && (session.user.isAdmin || session.user.isApproved)

    // 추천 및 투표 정보 가져오기
    const [likeInfo, pollInfo] = await Promise.all([
        getPostLikeInfo(id),
        getPollInfo(id)
    ])

    const typeInfo = getTypeInfo(post.type)
    const TypeIcon = typeInfo.icon

    // Serialize comments for client component
    const serializedComments = post.comments.map((comment: { id: string; content: string; createdAt: Date; authorId: string; author: { id: string; name: string | null; image: string | null } }) => ({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
    }))


    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Back button */}
                    <Link
                        href="/board"
                        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        목록으로
                    </Link>

                    {/* Post */}
                    <article className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-lg">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                {post.isPinned && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
                                        <Pin className="w-3 h-3" />
                                        고정
                                    </span>
                                )}
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${typeInfo.color}`}>
                                    <TypeIcon className="w-3.5 h-3.5" />
                                    {typeInfo.label}
                                </span>
                            </div>

                            {canEdit && (
                                <PostActions postId={post.id} isAdmin={isAdmin || false} isPinned={post.isPinned} />
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
                            {post.title}
                        </h1>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 pb-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                {post.author.image ? (
                                    <img src={post.author.image} alt="" className="w-6 h-6 rounded-full" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <User className="w-3 h-3 text-slate-400" />
                                    </div>
                                )}
                                <span className="font-medium">
                                    {post.author.name || '익명'}
                                    {' '}<MedalBadge medalPoints={(post.author as any).medalPoints || 0} size="sm" />
                                </span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDate(post.createdAt)}
                            </span>
                        </div>

                        {/* Content */}
                        <div className="pt-6 prose prose-slate dark:prose-invert max-w-none prose-img:rounded-xl prose-img:max-w-full">
                            <div
                                className="text-slate-700 dark:text-slate-300 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                        </div>

                        {/* Poll */}
                        {pollInfo && (
                            <PollSection
                                poll={{
                                    ...pollInfo,
                                    endsAt: pollInfo.endsAt ? new Date(pollInfo.endsAt) : null
                                }}
                                canVote={canLike}
                            />
                        )}

                        {/* Like Button */}
                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                            <LikeButton
                                postId={post.id}
                                initialCount={likeInfo.count}
                                initialLiked={likeInfo.isLiked}
                                canLike={canLike}
                            />
                        </div>

                        {/* Attachments */}
                        {post.attachments.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    첨부파일 ({post.attachments.length})
                                </h3>
                                <div className="space-y-4">
                                    {post.attachments.map((file: { id: string; filename: string; url: string; size: number; mimeType: string }) => {
                                        const FileIcon = getFileIcon(file.mimeType)

                                        // 오디오 파일인 경우
                                        if (isAudioFile(file.mimeType)) {
                                            return (
                                                <div key={file.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                            <Music className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-slate-900 dark:text-white truncate text-sm">
                                                                {file.filename}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {formatFileSize(file.size)}
                                                            </p>
                                                        </div>
                                                        <a
                                                            href={file.url}
                                                            download
                                                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </a>
                                                    </div>
                                                    <audio controls className="w-full" preload="metadata">
                                                        <source src={file.url} type={file.mimeType} />
                                                        브라우저가 오디오를 지원하지 않습니다.
                                                    </audio>
                                                </div>
                                            )
                                        }

                                        // 비디오 파일인 경우
                                        if (isVideoFile(file.mimeType)) {
                                            return (
                                                <div key={file.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                                            <Video className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-slate-900 dark:text-white truncate text-sm">
                                                                {file.filename}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {formatFileSize(file.size)}
                                                            </p>
                                                        </div>
                                                        <a
                                                            href={file.url}
                                                            download
                                                            className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </a>
                                                    </div>
                                                    <video controls className="w-full rounded-lg" preload="metadata">
                                                        <source src={file.url} type={file.mimeType} />
                                                        브라우저가 비디오를 지원하지 않습니다.
                                                    </video>
                                                </div>
                                            )
                                        }

                                        // 일반 파일인 경우
                                        return (
                                            <a
                                                key={file.id}
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                    <FileIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-slate-900 dark:text-white truncate text-sm">
                                                        {file.filename}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {formatFileSize(file.size)}
                                                    </p>
                                                </div>
                                                <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                            </a>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Comments */}
                        <CommentSection
                            postId={post.id}
                            comments={serializedComments}
                            currentUserId={session?.user?.id}
                            isAdmin={session?.user?.isAdmin}
                            canComment={canComment}
                        />
                    </article>
                </div>
            </main>
        </>
    )
}
