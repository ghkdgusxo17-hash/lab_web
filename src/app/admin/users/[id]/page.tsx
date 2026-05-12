import { redirect, notFound } from 'next/navigation'
import { auth } from '@/auth'
import { getUserById } from '@/actions/user'
import { Navbar } from '@/components/layout'
import { UserEditForm } from './UserEditForm'

interface EditUserPageProps {
    params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: EditUserPageProps) {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.isAdmin) {
        redirect('/')
    }

    const user = await getUserById(id)

    if (!user) {
        notFound()
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
                        구성원 정보 수정
                    </h1>
                    <UserEditForm user={user} />
                </div>
            </main>
        </>
    )
}
