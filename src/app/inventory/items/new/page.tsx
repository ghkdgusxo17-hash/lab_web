import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { ArrowLeft, Package, Beaker, Box, Wrench } from 'lucide-react'
import { createInventoryItem } from '@/actions/inventory'
import { InventoryItemForm } from '../InventoryItemForm'

export const metadata: Metadata = {
    title: '품목 등록 | CPE Lab',
    description: '새 품목 등록',
}

export default async function NewInventoryItemPage() {
    const session = await auth()

    if (!session?.user?.isAdmin && !session?.user?.isApproved) {
        redirect('/inventory/items')
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-32 pb-20 px-6">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <Link
                            href="/inventory/items"
                            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            목록으로
                        </Link>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                            품목 등록
                        </h1>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <InventoryItemForm />
                    </div>
                </div>
            </main>
        </>
    )
}
