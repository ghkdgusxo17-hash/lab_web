import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/layout'
import { AnonymousInquiryHub } from '../AnonymousInquiryHub'

export const metadata: Metadata = {
  title: '익명으로 문의하기 | CPE Lab',
  description: '익명 전용 문의방을 만들거나 기존 방에 다시 입장할 수 있습니다.',
}

export default function AnonymousInquiryPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen px-6 pb-20 pt-32">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Contact Us로 돌아가기
          </Link>

          <div className="mt-6">
            <AnonymousInquiryHub />
          </div>
        </div>
      </main>
    </>
  )
}
