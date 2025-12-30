import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { UserCreateForm } from './UserCreateForm'

export default async function NewUserPage() {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        redirect('/')
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
                        새 구성원 추가
                    </h1>
                    <UserCreateForm />
                </div>
            </main>
        </>
    )
}
