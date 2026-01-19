import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { auth } from '@/auth'
import { getPost } from '@/actions/board'
import { Navbar } from '@/components/layout'
import { EditPostForm } from './EditPostForm'

export const metadata: Metadata = {
    title: '글 수정 | CPE Lab',
}

interface EditPageProps {
    params: Promise<{ id: string }>
}

export default async function EditPage({ params }: EditPageProps) {
    const { id } = await params
    const session = await auth()
    const post = await getPost(id)

    if (!post) {
        notFound()
    }

    if (!session?.user) {
        redirect('/login')
    }

    // Only author or admin can edit
    const isAuthor = session.user.id === post.authorId
    const isAdmin = session.user.isAdmin

    if (!isAuthor && !isAdmin) {
        redirect(`/board/${id}`)
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
                        글 수정
                    </h1>
                    <EditPostForm
                        postId={id}
                        initialData={{
                            title: post.title,
                            content: post.content,
                            type: post.type,
                            attachments: post.attachments,
                            poll: post.poll
                        }}
                    />
                </div>
            </main>
        </>
    )
}
